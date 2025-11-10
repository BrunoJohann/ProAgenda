import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AppointmentsService } from './appointments.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
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
  @ApiOperation({ summary: 'Create appointment (public)' })
  create(@Query('tenant') tenant: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(tenant, dto);
  }

  @Public()
  @Patch('v1/public/appointments/:id/cancel')
  @ApiOperation({ summary: 'Cancel appointment (public)' })
  cancelPublic(
    @Query('tenant') tenant: string,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(tenant, id, dto);
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

