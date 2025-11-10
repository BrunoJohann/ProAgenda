import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../../prisma/prisma.service';

interface TokenPayload {
  sub: string;
  email: string;
  tenant: string;
  roles: Array<{ role: string; filialId?: string }>;
  professionalId?: string;
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private sessionsService: SessionsService,
    private prisma: PrismaService,
  ) {}

  async generateTokenPair(
    user: { id: string; email: string; tenantId?: string | null },
    tenantSlug: string,
    roles: Array<{ role: string; filialId?: string }>,
    userAgent?: string,
    ip?: string,
    professionalId?: string,
  ) {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      tenant: tenantSlug,
      roles,
      professionalId,
    };

    // Generate access token
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });

    // Generate refresh token
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get<string>('REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('REFRESH_EXPIRES_IN'),
      },
    );

    // Save session
    await this.sessionsService.createSession(
      user.id,
      user.tenantId,
      refreshToken,
      userAgent,
      ip,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(this.configService.get<string>('JWT_EXPIRES_IN') || '15m'),
    };
  }

  async refreshTokens(refreshToken: string, userAgent?: string, ip?: string) {
    try {
      // Verify refresh token
      const decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('REFRESH_SECRET'),
      });

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Verify session exists and is valid
      const session = await this.sessionsService.validateSession(decoded.sub, refreshToken);

      if (!session) {
        throw new UnauthorizedException('Invalid session');
      }

      // Get user with roles
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          tenant: true,
          roleAssignments: true,
          professional: true,
        },
      });

      if (!user || !user.tenant) {
        throw new UnauthorizedException('User not found');
      }

      // Revoke old session
      await this.sessionsService.revokeSession(decoded.sub, refreshToken);

      // Generate new token pair
      const roles = user.roleAssignments.map((ra) => ({
        role: ra.role,
        filialId: ra.filialId ?? undefined,
      }));

      return this.generateTokenPair(
        user,
        user.tenant.slug,
        roles,
        userAgent,
        ip,
        user.professional?.id,
      );
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async verifyInviteToken(token: string): Promise<{ invitationId: string }> {
    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (decoded.type !== 'invitation') {
        throw new UnauthorizedException('Invalid token type');
      }

      return { invitationId: decoded.invitationId };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired invitation token');
    }
  }

  async generateInviteToken(invitationId: string, expiresInHours: number = 72): Promise<string> {
    return this.jwtService.signAsync(
      {
        invitationId,
        type: 'invitation',
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: `${expiresInHours}h`,
      },
    );
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * multipliers[unit];
  }
}

