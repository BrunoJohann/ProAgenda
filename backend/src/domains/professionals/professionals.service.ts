import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { FiliaisService } from '../filiais/filiais.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { CreatePeriodDto } from './dto/create-period.dto';

@Injectable()
export class ProfessionalsService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
    private filiaisService: FiliaisService,
  ) {}

  async create(tenantSlug: string, filialId: string, dto: CreateProfessionalDto) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    await this.filiaisService.findOne(tenantSlug, filialId);

    return this.prisma.professional.create({
      data: {
        tenantId: tenant.id,
        filialId,
        name: dto.name,
        bio: dto.bio,
        specialties: dto.specialties,
        timezone: dto.timezone,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantSlug: string, filialId: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    await this.filiaisService.findOne(tenantSlug, filialId);

    return this.prisma.professional.findMany({
      where: {
        tenantId: tenant.id,
        filialId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        periods: true,
        _count: {
          select: {
            appointments: true,
            blocks: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(tenantSlug: string, filialId: string, professionalId: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const professional = await this.prisma.professional.findFirst({
      where: {
        id: professionalId,
        tenantId: tenant.id,
        filialId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        periods: {
          orderBy: [{ weekday: 'asc' }, { startMinutes: 'asc' }],
        },
        professionalServices: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    return professional;
  }

  async update(tenantSlug: string, filialId: string, professionalId: string, dto: UpdateProfessionalDto) {
    await this.findOne(tenantSlug, filialId, professionalId);

    return this.prisma.professional.update({
      where: { id: professionalId },
      data: dto,
    });
  }

  async remove(tenantSlug: string, filialId: string, professionalId: string) {
    await this.findOne(tenantSlug, filialId, professionalId);

    // Check for appointments
    const apptCount = await this.prisma.appointment.count({
      where: { professionalId },
    });

    if (apptCount > 0) {
      throw new BadRequestException('Cannot delete professional with existing appointments');
    }

    await this.prisma.professional.delete({ where: { id: professionalId } });

    return { message: 'Professional deleted successfully' };
  }

  // Working periods
  async getPeriods(tenantSlug: string, professionalId: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    return this.prisma.workingPeriod.findMany({
      where: {
        tenantId: tenant.id,
        professionalId,
      },
      orderBy: [{ weekday: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  async createPeriod(tenantSlug: string, professionalId: string, dto: CreatePeriodDto) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    // Validate times
    if (dto.startMinutes >= dto.endMinutes) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for overlaps
    const overlapping = await this.prisma.workingPeriod.findFirst({
      where: {
        tenantId: tenant.id,
        professionalId,
        weekday: dto.weekday,
        OR: [
          {
            AND: [
              { startMinutes: { lte: dto.startMinutes } },
              { endMinutes: { gt: dto.startMinutes } },
            ],
          },
          {
            AND: [
              { startMinutes: { lt: dto.endMinutes } },
              { endMinutes: { gte: dto.endMinutes } },
            ],
          },
          {
            AND: [
              { startMinutes: { gte: dto.startMinutes } },
              { endMinutes: { lte: dto.endMinutes } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('Working period overlaps with existing period');
    }

    return this.prisma.workingPeriod.create({
      data: {
        tenantId: tenant.id,
        professionalId,
        weekday: dto.weekday,
        startMinutes: dto.startMinutes,
        endMinutes: dto.endMinutes,
      },
    });
  }

  async deletePeriod(tenantSlug: string, professionalId: string, periodId: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const period = await this.prisma.workingPeriod.findFirst({
      where: {
        id: periodId,
        tenantId: tenant.id,
        professionalId,
      },
    });

    if (!period) {
      throw new NotFoundException('Working period not found');
    }

    await this.prisma.workingPeriod.delete({ where: { id: periodId } });

    return { message: 'Working period deleted successfully' };
  }
}

