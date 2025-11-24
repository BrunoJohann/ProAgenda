import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { IcsService } from './ics.service';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Calendar (ICS)')
@Controller('v1/public/ics')
export class CalendarController {
  constructor(
    private icsService: IcsService,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Get professional calendar feed (ICS) - next 60 days' })
  async getProfessionalFeed(@Param('professionalId') professionalId: string, @Res() res: Response) {
    // Get professional
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      select: { id: true, name: true, tenantId: true },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    // Get appointments for next 60 days
    const now = new Date();
    const sixtyDaysLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId: professional.tenantId,
        professionalId,
        status: 'CONFIRMED',
        startsAt: {
          gte: now,
          lte: sixtyDaysLater,
        },
      },
      include: {
        services: {
          include: {
            service: {
              select: { name: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { startsAt: 'asc' },
    });

    const formattedAppointments = appointments.map(appt => ({
      ...appt,
      customerPhone: appt.customerPhone || '',
      notes: appt.notes ?? undefined,
    }));

    const ics = this.icsService.generateProfessionalFeed(formattedAppointments, professional.name);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${professional.name}-calendar.ics"`);
    res.send(ics);
  }

  @Public()
  @Get('appointment/:id')
  @ApiOperation({ summary: 'Get single appointment as ICS event' })
  async getAppointmentEvent(@Param('id') id: string, @Res() res: Response) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: {
              select: { name: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        filial: {
          select: { name: true, address: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const formattedAppointment = {
      ...appointment,
      customerPhone: appointment.customerPhone || '',
      notes: appointment.notes ?? undefined,
      filial: {
        name: appointment.filial.name,
        address: appointment.filial.address ?? undefined,
      },
    };

    const ics = this.icsService.generateAppointmentEvent(formattedAppointment);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="appointment-${id}.ics"`);
    res.send(ics);
  }
}

