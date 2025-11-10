import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ScopeGuard } from '../../common/guards/scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Services')
@Controller()
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  // Admin routes
  @Post('v1/admin/filiais/:filialId/services')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service' })
  create(
    @CurrentUser('tenant') tenant: string,
    @Param('filialId') filialId: string,
    @Body() dto: CreateServiceDto,
  ) {
    return this.servicesService.create(tenant, filialId, dto);
  }

  @Get('v1/admin/filiais/:filialId/services')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all services' })
  findAll(@CurrentUser('tenant') tenant: string, @Param('filialId') filialId: string) {
    return this.servicesService.findAll(tenant, filialId);
  }

  @Patch('v1/admin/filiais/:filialId/services/:sid')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service' })
  update(
    @CurrentUser('tenant') tenant: string,
    @Param('filialId') filialId: string,
    @Param('sid') sid: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(tenant, filialId, sid, dto);
  }

  @Delete('v1/admin/filiais/:filialId/services/:sid')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service' })
  remove(@CurrentUser('tenant') tenant: string, @Param('filialId') filialId: string, @Param('sid') sid: string) {
    return this.servicesService.remove(tenant, filialId, sid);
  }

  @Post('v1/admin/filiais/:filialId/services/:sid/professionals/:pid')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link professional to service' })
  linkProfessional(
    @CurrentUser('tenant') tenant: string,
    @Param('filialId') filialId: string,
    @Param('sid') sid: string,
    @Param('pid') pid: string,
  ) {
    return this.servicesService.linkProfessional(tenant, filialId, sid, pid);
  }

  @Delete('v1/admin/filiais/:filialId/services/:sid/professionals/:pid')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink professional from service' })
  unlinkProfessional(
    @CurrentUser('tenant') tenant: string,
    @Param('filialId') filialId: string,
    @Param('sid') sid: string,
    @Param('pid') pid: string,
  ) {
    return this.servicesService.unlinkProfessional(tenant, filialId, sid, pid);
  }

  // Public routes
  @Public()
  @Get('v1/public/services')
  @ApiOperation({ summary: 'List active services (public)' })
  findPublic(
    @Query('tenant') tenant: string,
    @Query('filialId') filialId: string,
    @Query('professionalId') professionalId?: string,
  ) {
    // TODO: Filter by professional if provided
    return this.servicesService.findAll(tenant, filialId, true);
  }
}

