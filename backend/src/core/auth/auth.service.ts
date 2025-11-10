import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './tokens/token.service';
import { SessionsService } from './tokens/sessions.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private sessionsService: SessionsService,
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
}

