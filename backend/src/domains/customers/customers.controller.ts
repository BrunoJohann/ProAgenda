import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { TenantsService } from '../tenants/tenants.service';

@ApiTags('Customers')
@Controller('v1/admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(
    private customersService: CustomersService,
    private tenantsService: TenantsService,
  ) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new customer' })
  async create(
    @CurrentUser('tenant') tenantSlug: string,
    @Body() dto: CreateCustomerDto,
  ) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    return this.customersService.create(tenant.id, dto);
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'List all customers' })
  async findAll(
    @CurrentUser('tenant') tenantSlug: string,
    @Query('filialId') filialId?: string,
  ) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    return this.customersService.findAll(tenant.id, filialId);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Get customer by ID' })
  async findOne(
    @CurrentUser('tenant') tenantSlug: string,
    @Param('id') id: string,
  ) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    return this.customersService.findOne(tenant.id, id);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update customer' })
  async update(
    @CurrentUser('tenant') tenantSlug: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    return this.customersService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Delete customer (only if no appointments)' })
  async delete(
    @CurrentUser('tenant') tenantSlug: string,
    @Param('id') id: string,
  ) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    return this.customersService.delete(tenant.id, id);
  }
}
