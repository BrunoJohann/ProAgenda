import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async createSession(
    userId: string,
    tenantId: string | null | undefined,
    refreshToken: string,
    userAgent?: string,
    ip?: string,
  ) {
    // Hash refresh token
    const refreshHash = await argon2.hash(refreshToken);

    // Calculate expiration
    const expiresIn = this.configService.get<string>('REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = this.calculateExpiry(expiresIn);

    // Create session
    return this.prisma.userSession.create({
      data: {
        userId,
        tenantId,
        refreshHash,
        userAgent,
        ip,
        expiresAt,
      },
    });
  }

  async validateSession(userId: string, refreshToken: string) {
    // Get all active sessions for user
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    // Find matching session by comparing hashes
    for (const session of sessions) {
      const isValid = await argon2.verify(session.refreshHash, refreshToken);
      if (isValid) {
        return session;
      }
    }

    return null;
  }

  async revokeSession(userId: string, refreshToken: string) {
    const session = await this.validateSession(userId, refreshToken);

    if (session) {
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private calculateExpiry(expiry: string): Date {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 7 days
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}

