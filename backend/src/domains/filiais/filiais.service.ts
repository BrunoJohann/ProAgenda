import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class FiliaisService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async create(tenantSlug: string, dto: CreateFilialDto) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    // Generate slug if not provided
    const slug = dto.slug || this.generateSlug(dto.name);

    // Check if slug already exists for this tenant
    const existing = await this.prisma.filial.findUnique({
      where: {
        tenantId_slug: {
          tenantId: tenant.id,
          slug,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Filial with this slug already exists');
    }

    return this.prisma.filial.create({
      data: {
        tenantId: tenant.id,
        name: dto.name,
        slug,
        description: dto.description,
        timezone: dto.timezone,
        address: dto.address,
        phone: dto.phone,
      },
    });
  }

  async findAll(tenantSlug: string, user: JwtPayload) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    // OWNER and ADMIN see all filiais
    const userRoles = user.roles?.map((r) => r.role) || [];
    if (userRoles.includes(Role.OWNER) || userRoles.includes(Role.ADMIN)) {
      return this.prisma.filial.findMany({
        where: { tenantId: tenant.id },
        include: { settings: true },
        orderBy: { createdAt: 'asc' },
      });
    }

    // Other roles see only their assigned filiais
    const filialIds = user.roles?.filter((r) => r.filialId).map((r) => r.filialId).filter((id): id is string => id !== undefined) || [];

    return this.prisma.filial.findMany({
      where: {
        tenantId: tenant.id,
        id: { in: filialIds },
      },
      include: { settings: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(tenantSlug: string, id: string, user?: JwtPayload) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const filial = await this.prisma.filial.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: { settings: true },
    });

    if (!filial) {
      throw new NotFoundException('Filial not found');
    }

    // Check scope if user provided
    if (user) {
      const userRoles = user.roles?.map((r) => r.role) || [];
      const hasGlobalAccess = userRoles.includes(Role.OWNER) || userRoles.includes(Role.ADMIN);
      const hasFilialAccess = user.roles?.some((r) => r.filialId === id) || false;

      if (!hasGlobalAccess && !hasFilialAccess) {
        throw new ForbiddenException('You do not have access to this filial');
      }
    }

    return filial;
  }

  async update(tenantSlug: string, id: string, dto: UpdateFilialDto) {
    await this.findOne(tenantSlug, id);

    return this.prisma.filial.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantSlug: string, id: string) {
    await this.findOne(tenantSlug, id);

    // Check if filial has professionals or appointments
    const [profCount, apptCount] = await Promise.all([
      this.prisma.professional.count({ where: { filialId: id } }),
      this.prisma.appointment.count({ where: { filialId: id } }),
    ]);

    if (profCount > 0 || apptCount > 0) {
      throw new ConflictException(
        'Cannot delete filial with existing professionals or appointments',
      );
    }

    await this.prisma.filial.delete({ where: { id } });

    return { message: 'Filial deleted successfully' };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

