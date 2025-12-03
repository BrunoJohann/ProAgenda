import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async create(tenantSlug: string, dto: CreateUserDto) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });
  }

  async findAll(tenantSlug: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    return this.prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
        roleAssignments: {
          include: {
            filial: {
              select: { id: true, name: true },
            },
          },
        },
        professional: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantSlug: string, id: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const user = await this.prisma.user.findUnique({
      where: { id, tenantId: tenant.id },
      include: {
        roleAssignments: {
          include: {
            filial: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOne(tenantSlug: string, id: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
        roleAssignments: {
          include: {
            filial: {
              select: { id: true, name: true },
            },
          },
        },
        professional: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getRoles(tenantSlug: string, userId: string) {
    const user = await this.findOne(tenantSlug, userId);

    return user.roleAssignments;
  }

  async assignRole(tenantSlug: string, userId: string, dto: AssignRoleDto) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    await this.findOne(tenantSlug, userId);

    // Validate filial if provided
    if (dto.filialId) {
      const filial = await this.prisma.filial.findFirst({
        where: {
          id: dto.filialId,
          tenantId: tenant.id,
        },
      });

      if (!filial) {
        throw new BadRequestException('Filial not found');
      }
    }

    // Check if role assignment already exists
    const existing = await this.prisma.roleAssignment.findFirst({
      where: {
        tenantId: tenant.id,
        userId,
        role: dto.role,
        filialId: dto.filialId || null,
      },
    });

    if (existing) {
      throw new ConflictException('Role assignment already exists');
    }

    return this.prisma.roleAssignment.create({
      data: {
        tenantId: tenant.id,
        userId,
        role: dto.role,
        filialId: dto.filialId,
      },
      include: {
        filial: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async removeRole(tenantSlug: string, userId: string, roleId: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const roleAssignment = await this.prisma.roleAssignment.findFirst({
      where: {
        id: roleId,
        userId,
        tenantId: tenant.id,
      },
    });

    if (!roleAssignment) {
      throw new NotFoundException('Role assignment not found');
    }

    // Prevent removing the last OWNER role
    if (roleAssignment.role === Role.OWNER) {
      const ownerCount = await this.prisma.roleAssignment.count({
        where: {
          tenantId: tenant.id,
          role: Role.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last OWNER role');
      }
    }

    await this.prisma.roleAssignment.delete({
      where: { id: roleId },
    });

    return { message: 'Role removed successfully' };
  }

  async update(tenantSlug: string, id: string, dto: UpdateUserDto) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    await this.findOne(tenantSlug, id);

    // Check if email is being changed and if it's already taken
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          tenantId: tenant.id,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Email already registered');
      }
    }

    const updateData: any = {
      ...(dto.name && { name: dto.name }),
      ...(dto.email && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
    };

    // Hash password if provided
    if (dto.password) {
      updateData.passwordHash = await argon2.hash(dto.password);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
        roleAssignments: {
          include: {
            filial: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async remove(tenantSlug: string, id: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    const user = await this.findOne(tenantSlug, id);

    // Check if user has OWNER role
    const hasOwnerRole = user.roleAssignments?.some((r) => r.role === Role.OWNER);
    
    if (hasOwnerRole) {
      const ownerCount = await this.prisma.roleAssignment.count({
        where: {
          tenantId: tenant.id,
          role: Role.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot delete the last user with OWNER role');
      }
    }

    // Check if user has appointments or other critical data
    const appointmentCount = await this.prisma.appointment.count({
      where: {
        customerId: id,
      },
    });

    if (appointmentCount > 0) {
      throw new ConflictException('Cannot delete user with existing appointments. Consider deactivating instead.');
    }

    // Delete user (cascade will handle role assignments)
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }
}

