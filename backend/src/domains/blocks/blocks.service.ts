import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class BlocksService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async create(tenantSlug: string, professionalId: string, dto: CreateBlockDto, user?: JwtPayload) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    // Verify professional exists
    const professional = await this.prisma.professional.findFirst({
      where: {
        id: professionalId,
        tenantId: tenant.id,
      },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    // Validate times
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (startsAt >= endsAt) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (startsAt < new Date()) {
      throw new BadRequestException('Cannot create block in the past');
    }

    // Check for conflicting CONFIRMED appointments
    const conflictingAppointments = await this.prisma.appointment.count({
      where: {
        tenantId: tenant.id,
        professionalId,
        status: 'CONFIRMED',
        OR: [
          {
            AND: [
              { startsAt: { lt: endsAt } },
              { endsAt: { gt: startsAt } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointments > 0) {
      throw new BadRequestException('Cannot create block that conflicts with confirmed appointments');
    }

    return this.prisma.blockedTime.create({
      data: {
        tenantId: tenant.id,
        professionalId,
        startsAt,
        endsAt,
        reason: dto.reason,
      },
    });
  }

  async findAll(tenantSlug: string, professionalId: string, from?: string, to?: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const where: any = {
      tenantId: tenant.id,
      professionalId,
    };

    if (from || to) {
      where.AND = [];
      if (from) {
        where.AND.push({ endsAt: { gte: new Date(from) } });
      }
      if (to) {
        where.AND.push({ startsAt: { lte: new Date(to) } });
      }
    }

    return this.prisma.blockedTime.findMany({
      where,
      orderBy: { startsAt: 'asc' },
    });
  }

  async remove(tenantSlug: string, professionalId: string, blockId: string, user?: JwtPayload) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const block = await this.prisma.blockedTime.findFirst({
      where: {
        id: blockId,
        tenantId: tenant.id,
        professionalId,
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    // If user is a professional, verify they own this block
    if (user?.professionalId && user.professionalId !== professionalId) {
      throw new ForbiddenException('You can only delete your own blocks');
    }

    await this.prisma.blockedTime.delete({ where: { id: blockId } });

    return { message: 'Block deleted successfully' };
  }
}

