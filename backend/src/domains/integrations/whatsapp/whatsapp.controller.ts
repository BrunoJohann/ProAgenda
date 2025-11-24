import { Controller, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WhatsappAuthGuard } from './whatsapp-auth.guard';
import { AppointmentsService } from '../../appointments/appointments.service';
import { CreateWhatsappAppointmentDto } from '../../appointments/dto/create-whatsapp-appointment.dto';

@ApiTags('WhatsApp Integration')
@Controller('v1/integrations/whatsapp')
@UseGuards(WhatsappAuthGuard)
@ApiBearerAuth()
export class WhatsappController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post('appointments')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  @ApiOperation({ summary: 'Create appointment from WhatsApp integration' })
  createAppointment(
    @Query('tenant') tenant: string,
    @Body() dto: CreateWhatsappAppointmentDto,
  ) {
    return this.appointmentsService.createFromWhatsapp(tenant, dto);
  }
}
