import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AppointmentsService } from './appointments.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateInternalAppointmentDto } from './dto/create-internal-appointment.dto';
import { CreateCustomerAppointmentDto } from './dto/create-customer-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { TenantsService } from '../tenants/tenants.service';
import { Role } from '@prisma/client';

@ApiTags('Appointments')
@Controller()
export class AppointmentsController {
  constructor(
    private appointmentsService: AppointmentsService,
    private schedulingService: SchedulingService,
    private tenantsService: TenantsService,
  ) {}

  // Public routes
  @Public()
  @Get('v1/public/slots')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  @ApiOperation({ summary: 'Get available time slots (public)' })
  async getSlots(
    @Query('tenant') tenantSlug: string,
    @Query('filialId') filialId: string,
    @Query('date') date: string,
    @Query('serviceIds') serviceIds: string,
    @Query('professionalId') professionalId?: string,
  ) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    const serviceIdArray = serviceIds.split(',');
    const dateObj = new Date(date);

    return this.schedulingService.getAvailableSlots(
      tenant.id,
      filialId,
      dateObj,
      serviceIdArray,
      professionalId,
    );
  }

  @Public()
  @Post('v1/public/appointments')
  @Throttle({ short: { limit: 3, ttl: 1000 } })
  @ApiOperation({ summary: 'Create appointment (public) - DEPRECATED', deprecated: true })
  create(@Query('tenant') tenant: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(tenant, dto);
  }

  @Public()
  @Patch('v1/public/appointments/:id/cancel')
  @ApiOperation({ summary: 'Cancel appointment (public) - DEPRECATED', deprecated: true })
  cancelPublic(
    @Query('tenant') tenant: string,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(tenant, id, dto);
  }

  // Admin/Internal endpoints
  @Post('v1/admin/filiais/:filialId/appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR, Role.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create appointment (internal/admin)' })
  createInternal(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser() user: JwtPayload,
    @Param('filialId') filialId: string,
    @Body() dto: CreateInternalAppointmentDto,
  ) {
    // Ensure filialId matches
    if (dto.filialId !== filialId) {
      dto.filialId = filialId;
    }
    return this.appointmentsService.createInternal(tenant, dto, user.sub);
  }

  @Get('v1/admin/appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all appointments (admin)' })
  async findAllAdmin(
    @CurrentUser('tenant') tenant: string,
    @Query('filialId') filialId?: string,
    @Query('professionalId') professionalId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.appointmentsService.findAll(
      tenant,
      filialId,
      professionalId,
      from,
      to,
      status,
      customerId,
    );
  }

  @Get('v1/admin/appointments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointment by ID (admin)' })
  async findOneAdmin(
    @CurrentUser('tenant') tenant: string,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.findOne(tenant, id);
  }

  @Patch('v1/admin/appointments/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel appointment (admin)' })
  async cancelAdmin(
    @CurrentUser('tenant') tenant: string,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(tenant, id, dto);
  }

  @Patch('v1/admin/appointments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update appointment (admin)' })
  async updateAdmin(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(tenant, id, dto, user.sub);
  }

  // Customer Portal endpoints
  @Post('v1/customer/appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create appointment (customer portal)' })
  createFromCustomerPortal(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCustomerAppointmentDto,
  ) {
    return this.appointmentsService.createFromCustomerPortal(tenant, user.sub, dto);
  }

  @Get('v1/customer/appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my appointments (customer)' })
  async getMyCustomerAppointments(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    // Find customer by userId
    const tenantData = await this.tenantsService.findBySlug(tenant);
    const customer = await this.appointmentsService['prisma'].customer.findFirst({
      where: {
        tenantId: tenantData.id,
        userId: user.sub,
      },
    });

    if (!customer) {
      return [];
    }

    // Get all appointments where customerId matches
    const where: any = {
      tenantId: tenantData.id,
      customerId: customer.id,
    };

    if (status) where.status = status;

    if (from || to) {
      where.AND = [];
      if (from) where.AND.push({ startsAt: { gte: new Date(from) } });
      if (to) where.AND.push({ startsAt: { lte: new Date(to) } });
    }

    return this.appointmentsService['prisma'].appointment.findMany({
      where,
      include: {
        professional: {
          select: { id: true, name: true },
        },
        filial: {
          select: { id: true, name: true },
        },
        services: {
          include: {
            service: {
              select: { id: true, name: true, durationMinutes: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  @Patch('v1/customer/appointments/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel my appointment (customer)' })
  async cancelMyCustomerAppointment(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    // Verify appointment belongs to customer
    const tenantData = await this.tenantsService.findBySlug(tenant);
    const customer = await this.appointmentsService['prisma'].customer.findFirst({
      where: {
        tenantId: tenantData.id,
        userId: user.sub,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const appointment = await this.appointmentsService['prisma'].appointment.findFirst({
      where: {
        id,
        tenantId: tenantData.id,
        customerId: customer.id,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found or does not belong to you');
    }

    return this.appointmentsService.cancel(tenant, id, dto, user.sub);
  }

  @Get('v1/customer/appointments/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get past appointments history (customer)' })
  async getPastAppointments(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.appointmentsService.getPastAppointments(tenant, user.sub);
  }

  @Get('v1/customer/appointments/service-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get service combinations history for repeating appointments (customer)' })
  async getServiceHistory(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.appointmentsService.getServiceHistory(tenant, user.sub);
  }

  // Professional self-service routes
  @Get('v1/me/professional')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my professional profile' })
  async getMyProfessional(@CurrentUser('tenant') tenantSlug: string, @CurrentUser() user: JwtPayload) {
    if (!user.professionalId) {
      throw new Error('Professional ID not found');
    }

    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    return this.appointmentsService.findAll(tenantSlug, undefined, user.professionalId);
  }

  @Get('v1/me/appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my appointments' })
  getMyAppointments(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    if (!user.professionalId) {
      throw new Error('Professional ID not found');
    }
    return this.appointmentsService.findAll(tenant, undefined, user.professionalId, from, to, status);
  }

  @Patch('v1/me/appointments/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel my appointment (with minimum notice validation)' })
  cancelMyAppointment(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    if (!user.professionalId) {
      throw new Error('Professional ID not found');
    }
    return this.appointmentsService.cancelByProfessional(
      tenant,
      user.professionalId,
      id,
      dto,
      user.sub,
    );
  }
}

