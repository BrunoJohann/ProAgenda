import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TokenService } from '../../core/auth/tokens/token.service';
import { InviteDto } from './dto/invite.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
  ) {}

  async inviteProfessional(
    tenantId: string,
    professionalId: string,
    filialId: string,
    dto: InviteDto,
  ) {
    // Verify professional exists
    const professional = await this.prisma.professional.findFirst({
      where: {
        id: professionalId,
        tenantId,
        filialId,
      },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    // Check if professional already has a user
    if (professional.userId) {
      throw new BadRequestException('Professional already has a user account');
    }

    // Check for pending invitations
    const existingInvite = await this.prisma.invitation.findFirst({
      where: {
        tenantId,
        professionalId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new BadRequestException('A pending invitation already exists');
    }

    // Calculate expiry
    const expiresInHours = dto.expiresInHours || 72;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // Create invitation
    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        professionalId,
        filialId,
        email: dto.email,
        tokenHash: '', // Will be updated below
        status: 'PENDING',
        expiresAt,
      },
    });

    // Generate token
    const token = await this.tokenService.generateInviteToken(invitation.id, expiresInHours);
    const tokenHash = await argon2.hash(token);

    // Update invitation with token hash
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { tokenHash },
    });

    // TODO: Send email with invitation link
    // const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

    return {
      id: invitation.id,
      email: dto.email,
      token, // In production, don't return this - send via email
      expiresAt,
      message: 'Invitation created successfully',
    };
  }

  async revokeInvitation(tenantId: string, professionalId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        tenantId,
        professionalId,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });

    return { message: 'Invitation revoked successfully' };
  }

  async listInvitations(tenantId: string, professionalId: string) {
    return this.prisma.invitation.findMany({
      where: {
        tenantId,
        professionalId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

