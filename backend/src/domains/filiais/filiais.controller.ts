import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
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
import { Role } from '@prisma/client';

@ApiTags('Filiais')
@Controller('v1/admin/filiais')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FiliaisController {
  constructor(
    private filiaisService: FiliaisService,
    private settingsService: SettingsService,
  ) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new filial' })
  create(@CurrentUser('tenant') tenant: string, @Body() dto: CreateFilialDto) {
    return this.filiaisService.create(tenant, dto);
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR, Role.ANALYST)
  @ApiOperation({ summary: 'List all filiais (filtered by user scope)' })
  findAll(@CurrentUser('tenant') tenant: string, @CurrentUser() user: JwtPayload) {
    return this.filiaisService.findAll(tenant, user);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR, Role.ANALYST)
  @UseGuards(ScopeGuard)
  @ApiOperation({ summary: 'Get filial by ID' })
  findOne(@CurrentUser('tenant') tenant: string, @Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.filiaisService.findOne(tenant, id, user);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @UseGuards(ScopeGuard)
  @ApiOperation({ summary: 'Update filial' })
  update(@CurrentUser('tenant') tenant: string, @Param('id') id: string, @Body() dto: UpdateFilialDto) {
    return this.filiaisService.update(tenant, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Delete filial (only if no professionals or appointments)' })
  remove(@CurrentUser('tenant') tenant: string, @Param('id') id: string) {
    return this.filiaisService.remove(tenant, id);
  }

  @Patch(':id/settings')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @UseGuards(ScopeGuard)
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

