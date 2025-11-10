import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Tenants')
@Controller('v1/admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Get current tenant information' })
  async getTenantInfo(@CurrentUser('tenant') tenantSlug: string) {
    return this.tenantsService.getTenantInfo(tenantSlug);
  }

  @Patch('me')
  @Roles(Role.OWNER)
  @ApiOperation({ 
    summary: 'Update current tenant information (name and/or slug)',
    description: 'Only OWNER can update tenant information. Slug must be unique across all tenants.'
  })
  async updateTenant(@CurrentUser('tenant') tenantSlug: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.updateTenant(tenantSlug, dto);
  }
}

