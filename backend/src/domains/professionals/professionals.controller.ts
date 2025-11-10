import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { InvitationsService } from './invitations.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { InviteDto } from './dto/invite.dto';
import { CreatePeriodDto } from './dto/create-period.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ScopeGuard } from '../../common/guards/scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantsService } from '../tenants/tenants.service';
import { Role } from '@prisma/client';

@ApiTags('Professionals')
@Controller('v1/admin/filiais/:filialId/professionals')
@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
@ApiBearerAuth()
export class ProfessionalsController {
  constructor(
    private professionalsService: ProfessionalsService,
    private invitationsService: InvitationsService,
    private tenantsService: TenantsService,
  ) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new professional' })
  create(
    @CurrentUser('tenant') tenant: string,
    @Param('filialId') filialId: string,
    @Body() dto: CreateProfessionalDto,
  ) {
    return this.professionalsService.create(tenant, filialId, dto);
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'List all professionals in filial' })
  findAll(@CurrentUser('tenant') tenant: string, @Param('filialId') filialId: string) {
    return this.professionalsService.findAll(tenant, filialId);
  }

  @Get(':pid')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Get professional by ID' })
  findOne(
    @CurrentUser('tenant') tenant: string,
    @Param('filialId') filialId: string,
    @Param('pid') pid: string,
  ) {
    return this.professionalsService.findOne(tenant, filialId, pid);
  }

  @Patch(':pid')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update professional' })
  update(
    @CurrentUser('tenant') tenant: string,
    @Param('filialId') filialId: string,
    @Param('pid') pid: string,
    @Body() dto: UpdateProfessionalDto,
  ) {
    return this.professionalsService.update(tenant, filialId, pid, dto);
  }

  @Delete(':pid')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Delete professional (only if no appointments)' })
  remove(@CurrentUser('tenant') tenant: string, @Param('filialId') filialId: string, @Param('pid') pid: string) {
    return this.professionalsService.remove(tenant, filialId, pid);
  }

  // Invitations
  @Post(':pid/invite')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Invite professional to create account' })
  async invite(
    @CurrentUser('tenant') tenantSlug: string,
    @Param('filialId') filialId: string,
    @Param('pid') pid: string,
    @Body() dto: InviteDto,
  ) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    return this.invitationsService.inviteProfessional(tenant.id, pid, filialId, dto);
  }

  @Post(':pid/invite/revoke')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Revoke pending invitation' })
  async revokeInvite(
    @CurrentUser('tenant') tenantSlug: string,
    @Param('pid') pid: string,
    @Body('invitationId') invitationId: string,
  ) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    return this.invitationsService.revokeInvitation(tenant.id, pid, invitationId);
  }

  // Working periods
  @Get(':pid/periods')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Get professional working periods' })
  getPeriods(@CurrentUser('tenant') tenant: string, @Param('pid') pid: string) {
    return this.professionalsService.getPeriods(tenant, pid);
  }

  @Post(':pid/periods')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Add working period' })
  createPeriod(@CurrentUser('tenant') tenant: string, @Param('pid') pid: string, @Body() dto: CreatePeriodDto) {
    return this.professionalsService.createPeriod(tenant, pid, dto);
  }

  @Delete(':pid/periods/:periodId')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Delete working period' })
  deletePeriod(
    @CurrentUser('tenant') tenant: string,
    @Param('pid') pid: string,
    @Param('periodId') periodId: string,
  ) {
    return this.professionalsService.deletePeriod(tenant, pid, periodId);
  }
}

