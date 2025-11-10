import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { FiliaisService } from '../filiais/filiais.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
    private filiaisService: FiliaisService,
  ) {}

  async create(tenantSlug: string, filialId: string, dto: CreateServiceDto) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    await this.filiaisService.findOne(tenantSlug, filialId);

    return this.prisma.service.create({
      data: {
        tenantId: tenant.id,
        filialId,
        name: dto.name,
        durationMinutes: dto.durationMinutes,
        bufferMinutes: dto.bufferMinutes || 0,
        priceCents: dto.priceCents,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantSlug: string, filialId: string, activeOnly = false) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    await this.filiaisService.findOne(tenantSlug, filialId);

    return this.prisma.service.findMany({
      where: {
        tenantId: tenant.id,
        filialId,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        _count: {
          select: {
            professionalServices: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantSlug: string, filialId: string, serviceId: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        tenantId: tenant.id,
        filialId,
      },
      include: {
        professionalServices: {
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(tenantSlug: string, filialId: string, serviceId: string, dto: UpdateServiceDto) {
    await this.findOne(tenantSlug, filialId, serviceId);

    return this.prisma.service.update({
      where: { id: serviceId },
      data: dto,
    });
  }

  async remove(tenantSlug: string, filialId: string, serviceId: string) {
    await this.findOne(tenantSlug, filialId, serviceId);

    // Check for appointments
    const apptCount = await this.prisma.appointmentService.count({
      where: { serviceId },
    });

    if (apptCount > 0) {
      throw new ConflictException('Cannot delete service with existing appointments');
    }

    await this.prisma.service.delete({ where: { id: serviceId } });

    return { message: 'Service deleted successfully' };
  }

  // Professional-Service associations
  async linkProfessional(tenantSlug: string, filialId: string, serviceId: string, professionalId: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    await this.findOne(tenantSlug, filialId, serviceId);

    // Verify professional belongs to same filial
    const professional = await this.prisma.professional.findFirst({
      where: {
        id: professionalId,
        tenantId: tenant.id,
        filialId,
      },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found in this filial');
    }

    // Check if already linked
    const existing = await this.prisma.professionalService.findUnique({
      where: {
        tenantId_professionalId_serviceId: {
          tenantId: tenant.id,
          professionalId,
          serviceId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Professional already linked to this service');
    }

    return this.prisma.professionalService.create({
      data: {
        tenantId: tenant.id,
        professionalId,
        serviceId,
      },
    });
  }

  async unlinkProfessional(tenantSlug: string, filialId: string, serviceId: string, professionalId: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const link = await this.prisma.professionalService.findUnique({
      where: {
        tenantId_professionalId_serviceId: {
          tenantId: tenant.id,
          professionalId,
          serviceId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Professional-Service link not found');
    }

    await this.prisma.professionalService.delete({ where: { id: link.id } });

    return { message: 'Professional unlinked successfully' };
  }
}

