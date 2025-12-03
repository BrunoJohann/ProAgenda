import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FiliaisService } from './filiais.service';
import { SettingsService } from './settings.service';
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ScopeGuard } from '../../common/guards/scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Filiais')
@Controller()
export class FiliaisController {
  constructor(
    private filiaisService: FiliaisService,
    private settingsService: SettingsService,
  ) {}

  // Public routes
  @Public()
  @Get('v1/public/filiais')
  @ApiOperation({ summary: 'List all filiais for a tenant (public)' })
  async findPublic(@Query('tenant') tenant: string) {
    if (!tenant) {
      throw new Error('Tenant parameter is required');
    }
    return this.filiaisService.findAllPublic(tenant);
  }

  // Admin routes
  @Post('v1/admin/filiais')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new filial' })
  create(@CurrentUser('tenant') tenant: string, @Body() dto: CreateFilialDto) {
    return this.filiaisService.create(tenant, dto);
  }

  @Get('v1/admin/filiais')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR, Role.ANALYST)
  @ApiOperation({ summary: 'List all filiais (filtered by user scope)' })
  findAll(@CurrentUser('tenant') tenant: string, @CurrentUser() user: JwtPayload) {
    return this.filiaisService.findAll(tenant, user);
  }

  @Get('v1/admin/filiais/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR, Role.ANALYST)
  @ApiOperation({ summary: 'Get filial by ID' })
  findOne(@CurrentUser('tenant') tenant: string, @Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.filiaisService.findOne(tenant, id, user);
  }

  @Patch('v1/admin/filiais/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Update filial' })
  update(@CurrentUser('tenant') tenant: string, @Param('id') id: string, @Body() dto: UpdateFilialDto) {
    return this.filiaisService.update(tenant, id, dto);
  }

  @Delete('v1/admin/filiais/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Delete filial (only if no professionals or appointments)' })
  remove(@CurrentUser('tenant') tenant: string, @Param('id') id: string) {
    return this.filiaisService.remove(tenant, id);
  }

  @Patch('v1/admin/filiais/:id/settings')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update filial settings (slot granularity)' })
  async updateSettings(
    @CurrentUser('tenant') tenant: string,
    @Param('id') id: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    // Verify filial exists and get tenantId
    const filial = await this.filiaisService.findOne(tenant, id);
    return this.settingsService.updateSettings(filial.tenantId, id, dto);
  }
}
