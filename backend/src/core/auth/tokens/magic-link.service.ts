import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface MagicLinkToken {
  token: string;
  email: string;
  tenantId: string;
  expiresAt: Date;
  usedAt?: Date;
}

@Injectable()
export class MagicLinkService {
  // In-memory storage for magic link tokens
  // In production, use Redis or database
  private tokens = new Map<string, MagicLinkToken>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Clean up expired tokens every 5 minutes
    setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000);
  }

  /**
   * Generate a magic link token
   */
  async generateToken(email: string, tenantId: string): Promise<string> {
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Store token
    this.tokens.set(token, {
      token,
      email,
      tenantId,
      expiresAt,
    });

    return token;
  }

  /**
   * Verify and consume a magic link token
   */
  async verifyToken(token: string): Promise<{ email: string; tenantId: string }> {
    const stored = this.tokens.get(token);

    if (!stored) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    if (stored.usedAt) {
      throw new BadRequestException('Magic link has already been used');
    }

    if (new Date() > stored.expiresAt) {
      this.tokens.delete(token);
      throw new UnauthorizedException('Magic link has expired');
    }

    // Mark as used
    stored.usedAt = new Date();
    this.tokens.set(token, stored);

    return {
      email: stored.email,
      tenantId: stored.tenantId,
    };
  }

  /**
   * Clean up expired tokens
   */
  private cleanupExpiredTokens() {
    const now = new Date();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(token);
      }
    }
  }
}






