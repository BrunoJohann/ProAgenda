import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { FiliaisService } from '../filiais/filiais.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
    private filiaisService: FiliaisService,
    private schedulingService: SchedulingService,
  ) {}

  /**
   * Create appointment with anti-overbooking transaction
   */
  async create(tenantSlug: string, dto: CreateAppointmentDto) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    await this.filiaisService.findOne(tenantSlug, dto.filialId);

    // Get services and calculate duration
    const services = await this.prisma.service.findMany({
      where: {
        id: { in: dto.serviceIds },
        tenantId: tenant.id,
        filialId: dto.filialId,
        isActive: true,
      },
    });

    if (services.length !== dto.serviceIds.length) {
      throw new BadRequestException('One or more services not found or inactive');
    }

    const totalDuration = services.reduce(
      (sum, s) => sum + s.durationMinutes + s.bufferMinutes,
      0,
    );

    const startsAt = new Date(dto.start);
    const endsAt = new Date(startsAt.getTime() + totalDuration * 60 * 1000);

    // Validate start time is in the future
    if (startsAt < new Date()) {
      throw new BadRequestException('Cannot create appointment in the past');
    }

    // Transaction for anti-overbooking
    return this.prisma.$transaction(async (tx) => {
      let professionalId = dto.professionalId;

      // If no professional specified, select recommended one
      if (!professionalId) {
        const date = new Date(dto.date);
        const slots = await this.schedulingService.getAvailableSlots(
          tenant.id,
          dto.filialId,
          date,
          dto.serviceIds,
        );

        const matchingSlot = slots.find(
          (slot) => slot.start.getTime() === startsAt.getTime(),
        );

        if (!matchingSlot) {
          throw new ConflictException('Selected time slot is no longer available');
        }

        professionalId = matchingSlot.recommendedProfessionalId;
      }

      // Verify professional can perform services
      const professionalServices = await tx.professionalService.findMany({
        where: {
          tenantId: tenant.id,
          professionalId,
          serviceId: { in: dto.serviceIds },
        },
      });

      if (professionalServices.length !== dto.serviceIds.length) {
        throw new BadRequestException('Professional cannot perform all requested services');
      }

      // Check for conflicts (blocks and appointments)
      const [blockConflict, appointmentConflict] = await Promise.all([
        tx.blockedTime.findFirst({
          where: {
            tenantId: tenant.id,
            professionalId,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        }),
        tx.appointment.findFirst({
          where: {
            tenantId: tenant.id,
            professionalId,
            status: 'CONFIRMED',
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        }),
      ]);

      if (blockConflict || appointmentConflict) {
        throw new ConflictException('Time slot is no longer available');
      }

      // Create appointment
      const appointment = await tx.appointment.create({
        data: {
          tenantId: tenant.id,
          filialId: dto.filialId,
          professionalId,
          startsAt,
          endsAt,
          customerName: dto.customer.name,
          customerPhone: dto.customer.phone,
          customerEmail: dto.customer.email,
          notes: dto.notes,
          status: 'CONFIRMED',
        },
      });

      // Create appointment services
      await Promise.all(
        dto.serviceIds.map((serviceId, index) =>
          tx.appointmentService.create({
            data: {
              tenantId: tenant.id,
              appointmentId: appointment.id,
              serviceId,
              order: index,
            },
          }),
        ),
      );

      // Create status history
      await tx.appointmentStatusHistory.create({
        data: {
          tenantId: tenant.id,
          appointmentId: appointment.id,
          toStatus: 'CONFIRMED',
          reason: 'Appointment created',
        },
      });

      return appointment;
    });
  }

  async findAll(
    tenantSlug: string,
    filialId?: string,
    professionalId?: string,
    from?: string,
    to?: string,
    status?: string,
  ) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const where: any = {
      tenantId: tenant.id,
    };

    if (filialId) where.filialId = filialId;
    if (professionalId) where.professionalId = professionalId;
    if (status) where.status = status;

    if (from || to) {
      where.AND = [];
      if (from) where.AND.push({ startsAt: { gte: new Date(from) } });
      if (to) where.AND.push({ startsAt: { lte: new Date(to) } });
    }

    return this.prisma.appointment.findMany({
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

  async findOne(tenantSlug: string, id: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        professional: {
          select: { id: true, name: true },
        },
        filial: {
          select: { id: true, name: true, timezone: true },
        },
        services: {
          include: {
            service: true,
          },
          orderBy: { order: 'asc' },
        },
        statusHistory: {
          orderBy: { at: 'desc' },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async cancel(tenantSlug: string, id: string, dto: CancelAppointmentDto, userId?: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === 'CANCELED') {
      throw new BadRequestException('Appointment is already canceled');
    }

    // Update appointment and create history
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: { status: 'CANCELED' },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          tenantId: tenant.id,
          appointmentId: id,
          fromStatus: 'CONFIRMED',
          toStatus: 'CANCELED',
          reason: dto.reason || 'Canceled',
          userId,
        },
      });

      return updated;
    });
  }

  /**
   * Cancel appointment by professional (with minimum notice validation)
   */
  async cancelByProfessional(
    tenantSlug: string,
    professionalId: string,
    appointmentId: string,
    dto: CancelAppointmentDto,
    userId: string,
  ) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        tenantId: tenant.id,
        professionalId,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Validate minimum notice (e.g., 60 minutes)
    const now = new Date();
    const minNoticeMs = 60 * 60 * 1000; // 60 minutes
    const timeDiff = appointment.startsAt.getTime() - now.getTime();

    if (timeDiff < minNoticeMs) {
      throw new BadRequestException('Cannot cancel appointment less than 60 minutes before start');
    }

    return this.cancel(tenantSlug, appointmentId, dto, userId);
  }
}

