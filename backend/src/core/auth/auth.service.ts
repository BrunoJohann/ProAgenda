import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './tokens/token.service';
import { SessionsService } from './tokens/sessions.service';
import { MagicLinkService } from './tokens/magic-link.service';
import { EmailService } from '../email/email.service';
import { TenantsService } from '../../domains/tenants/tenants.service';
import { CustomersService } from '../../domains/customers/customers.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { SendMagicLinkDto } from './dto/send-magic-link.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private sessionsService: SessionsService,
    private magicLinkService: MagicLinkService,
    private emailService: EmailService,
    private tenantsService: TenantsService,
    private customersService: CustomersService,
  ) {}

  async signup(dto: SignupDto, userAgent?: string, ip?: string) {
    // Check if tenant slug already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant slug already exists');
    }

    // Check if user email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await argon2.hash(dto.password);

    // Create tenant, user, and role assignment in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName,
          slug: dto.tenantSlug,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          isEmailVerified: false,
        },
      });

      await tx.roleAssignment.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: Role.OWNER,
        },
      });

      return { tenant, user };
    });

    // Generate tokens
    const tokens = await this.tokenService.generateTokenPair(
      result.user,
      result.tenant.slug,
      [{ role: Role.OWNER, filialId: undefined }],
      userAgent,
      ip,
    );

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        tenant: result.tenant.slug,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto, userAgent?: string, ip?: string) {
    // Find user with tenant and roles
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        tenant: true,
        roleAssignments: {
          where: { tenantId: { not: undefined } },
          include: { filial: true },
        },
        professional: true,
      },
    });

    if (!user || !user.tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Prepare roles
    const roles = user.roleAssignments.map((ra) => ({
      role: ra.role,
      filialId: ra.filialId ?? undefined,
    }));

    // Generate tokens
    const tokens = await this.tokenService.generateTokenPair(
      user,
      user.tenant.slug,
      roles,
      userAgent,
      ip,
      user.professional?.id,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenant: user.tenant.slug,
        roles,
        professionalId: user.professional?.id,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string, userAgent?: string, ip?: string) {
    return this.tokenService.refreshTokens(refreshToken, userAgent, ip);
  }

  async logout(userId: string, refreshToken: string) {
    await this.sessionsService.revokeSession(userId, refreshToken);
    return { message: 'Logged out successfully' };
  }

  async me(userId: string, tenantSlug: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          where: { tenant: { slug: tenantSlug } },
          include: { filial: true },
        },
        professional: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      professionalId: user.professional?.id,
      roleAssignments: user.roleAssignments.map((ra) => ({
        id: ra.id,
        role: ra.role,
        filialId: ra.filialId,
        filialName: ra.filial?.name,
      })),
    };
  }

  async acceptInvite(dto: AcceptInviteDto, userAgent?: string, ip?: string) {
    // Verify and decode invite token
    const decoded = await this.tokenService.verifyInviteToken(dto.inviteToken);

    // Find invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: decoded.invitationId },
      include: {
        tenant: true,
        professional: true,
        filial: true,
      },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new BadRequestException('Invalid or expired invitation');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation has expired');
    }

    // Hash password
    const passwordHash = await argon2.hash(dto.password);

    // Create or update user and link to professional
    const result = await this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: invitation.email },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            tenantId: invitation.tenantId,
            name: invitation.professional.name,
            email: invitation.email,
            passwordHash,
            isEmailVerified: true,
          },
        });
      } else {
        user = await tx.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
      }

      // Link professional to user
      await tx.professional.update({
        where: { id: invitation.professionalId },
        data: { userId: user.id },
      });

      // Create role assignment
      await tx.roleAssignment.create({
        data: {
          tenantId: invitation.tenantId,
          userId: user.id,
          role: Role.PROFESSIONAL,
          filialId: invitation.filialId,
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      return { user, professional: invitation.professional };
    });

    // Generate tokens
    const tokens = await this.tokenService.generateTokenPair(
      result.user,
      invitation.tenant.slug,
      [{ role: Role.PROFESSIONAL, filialId: invitation.filialId }],
      userAgent,
      ip,
      result.professional.id,
    );

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        tenant: invitation.tenant.slug,
        professionalId: result.professional.id,
      },
      ...tokens,
    };
  }

  /**
   * Send magic link for customer login
   */
  async sendMagicLink(tenantSlug: string, dto: SendMagicLinkDto) {
    // Find tenant
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    // Generate magic link token
    const token = await this.magicLinkService.generateToken(dto.email, tenant.id);

    // Build magic link URL
    const frontendUrl = process.env.FRONTEND_CUSTOMER_URL || 'http://localhost:3004';
    const magicLink = `/${tenantSlug}/auth/verify?token=${token}`;
    const fullMagicLink = `${frontendUrl}${magicLink}`;

    // Send email
    await this.emailService.sendMagicLink(dto.email, fullMagicLink, tenant.name);

    return {
      sent: true,
      message: 'Magic link sent to email',
      // In development, always return the link for testing
      devLink: fullMagicLink,
    };
  }

  /**
   * Verify magic link and create/login customer
   */
  async verifyMagicLink(token: string, tenantSlug: string, userAgent?: string, ip?: string) {
    // Verify token
    const { email, tenantId } = await this.magicLinkService.verifyToken(token);

    // Verify tenant matches
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    if (tenant.id !== tenantId) {
      throw new BadRequestException('Invalid tenant for this magic link');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        roleAssignments: {
          where: { tenantId },
          include: { filial: true },
        },
        customer: {
          where: { tenantId },
        },
      },
    });

    // If user doesn't exist, create one
    if (!user) {
      // Check if customer exists
      const existingCustomer = await this.customersService.findByEmail(tenantId, email);

      user = await this.prisma.user.create({
        data: {
          tenantId,
          name: existingCustomer?.name || email.split('@')[0],
          email,
          passwordHash: await argon2.hash(crypto.randomBytes(32).toString('hex')), // Random password, user won't use it
          isEmailVerified: true,
        },
        include: {
          tenant: true,
          roleAssignments: {
            where: { tenantId },
            include: { filial: true },
          },
          customer: {
            where: { tenantId },
          },
        },
      });

      // Link customer to user if exists
      if (existingCustomer && !existingCustomer.userId) {
        await this.prisma.customer.update({
          where: { id: existingCustomer.id },
          data: { userId: user!.id },
        });
      } else if (!existingCustomer) {
        // Create customer if doesn't exist
        await this.prisma.customer.create({
          data: {
            tenantId,
            name: user!.name,
            email: user!.email,
            userId: user!.id,
          },
        });
      }

      // Create CUSTOMER role assignment
      await this.prisma.roleAssignment.create({
        data: {
          tenantId,
          userId: user!.id,
          role: Role.CUSTOMER,
        },
      });
    } else {
      // User exists, ensure they have CUSTOMER role for this tenant
      const hasCustomerRole = user.roleAssignments.some(
        (ra) => ra.tenantId === tenantId && ra.role === Role.CUSTOMER,
      );

      if (!hasCustomerRole) {
        await this.prisma.roleAssignment.create({
          data: {
            tenantId,
            userId: user.id,
            role: Role.CUSTOMER,
          },
        });
      }

      // Link customer if exists but not linked
      const customer = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          email,
          userId: null,
        },
      });

      if (customer) {
        await this.prisma.customer.update({
          where: { id: customer.id },
          data: { userId: user.id },
        });
      } else {
        // Create customer if doesn't exist
        const existingCustomer = await this.prisma.customer.findFirst({
          where: {
            tenantId,
            userId: user.id,
          },
        });

        if (!existingCustomer) {
          await this.prisma.customer.create({
            data: {
              tenantId,
              name: user.name,
              email: user.email,
              userId: user.id,
            },
          });
        }
      }

      // Mark email as verified
      if (!user.isEmailVerified) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { isEmailVerified: true },
        });
      }
    }

    // Refresh user data with roles
    const refreshedUser = await this.prisma.user.findUnique({
      where: { id: user!.id },
      include: {
        tenant: true,
        roleAssignments: {
          where: { tenantId },
          include: { filial: true },
        },
        customer: {
          where: { tenantId },
        },
      },
    });

    if (!refreshedUser) {
      throw new NotFoundException('User not found');
    }

    user = refreshedUser;

    // Prepare roles
    const roles = user.roleAssignments.map((ra) => ({
      role: ra.role,
      filialId: ra.filialId ?? undefined,
    }));

    // Generate tokens
    const tokens = await this.tokenService.generateTokenPair(
      user,
      tenant.slug,
      roles,
      userAgent,
      ip,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenant: tenant.slug,
        roles,
      },
      ...tokens,
    };
  }
}

