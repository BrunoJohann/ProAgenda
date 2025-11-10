import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async getTenantInfo(slug: string) {
    const tenant = await this.findBySlug(slug);

    const stats = await this.prisma.$transaction([
      this.prisma.filial.count({ where: { tenantId: tenant.id } }),
      this.prisma.user.count({ where: { tenantId: tenant.id } }),
      this.prisma.professional.count({ where: { tenantId: tenant.id } }),
      this.prisma.appointment.count({ where: { tenantId: tenant.id } }),
    ]);

    return {
      ...tenant,
      stats: {
        filiais: stats[0],
        users: stats[1],
        professionals: stats[2],
        appointments: stats[3],
      },
    };
  }

  async updateTenant(currentSlug: string, dto: UpdateTenantDto) {
    const tenant = await this.findBySlug(currentSlug);

    // If slug is being changed, check for uniqueness
    if (dto.tenantSlug && dto.tenantSlug !== currentSlug) {
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { slug: dto.tenantSlug },
      });

      if (existingTenant) {
        throw new ConflictException('Slug already in use by another tenant');
      }
    }

    // Update tenant
    const updated = await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        ...(dto.tenantName && { name: dto.tenantName }),
        ...(dto.tenantSlug && { slug: dto.tenantSlug }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      createdAt: updated.createdAt,
      message: 'Tenant updated successfully',
    };
  }
}

