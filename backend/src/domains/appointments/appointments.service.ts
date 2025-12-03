import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { FiliaisService } from '../filiais/filiais.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { CustomersService } from '../customers/customers.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateInternalAppointmentDto } from './dto/create-internal-appointment.dto';
import { CreateCustomerAppointmentDto } from './dto/create-customer-appointment.dto';
import { CreateWhatsappAppointmentDto } from './dto/create-whatsapp-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CustomerType, AppointmentSource } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
    private filiaisService: FiliaisService,
    private schedulingService: SchedulingService,
    private customersService: CustomersService,
  ) {}

  /**
   * Create appointment with anti-overbooking transaction (DEPRECATED - use specific methods)
   * @deprecated Use createInternal, createFromCustomerPortal, or createFromWhatsapp instead
   */
  async create(tenantSlug: string, dto: CreateAppointmentDto) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    
    // Legacy support: treat as WALKIN_NAME_ONLY with INTERNAL source
    return this._createAppointmentCore(
      tenant.id,
      tenantSlug,
      {
        filialId: dto.filialId,
        professionalId: dto.professionalId,
        serviceIds: dto.serviceIds,
        date: dto.date,
        start: dto.start,
        notes: dto.notes,
      },
      null, // customerId
      dto.customer.name,
      dto.customer.phone || null,
      dto.customer.email || null,
      CustomerType.WALKIN_NAME_ONLY,
      AppointmentSource.INTERNAL,
    );
  }

  /**
   * Create appointment from internal request (admin/professional)
   */
  async createInternal(tenantSlug: string, dto: CreateInternalAppointmentDto, userId?: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    let customerId: string | null = null;
    let customerName: string;
    let customerPhone: string | null = null;
    let customerEmail: string | null = null;
    let customerType: CustomerType;

    // If customerId provided, use it
    if (dto.customerId) {
      const customer = await this.customersService.findOne(tenant.id, dto.customerId);
      customerId = customer.id;
      customerName = customer.name;
      customerPhone = customer.phones?.[0]?.phone || null;
      customerEmail = customer.email || null;
      customerType = customer.userId ? CustomerType.REGISTERED : CustomerType.IDENTIFIED_NO_LOGIN;
    } 
    // If newCustomer provided
    else if (dto.newCustomer) {
      const { customer, customerType: type } = await this.customersService.findOrCreateFromInternal(
        tenant.id,
        {
          name: dto.newCustomer.name,
          phone: dto.newCustomer.phone,
          email: dto.newCustomer.email,
          document: dto.newCustomer.document,
          documentType: dto.newCustomer.documentType,
          filialId: dto.filialId,
        },
      );

      customerType = type;
      if (customer) {
        customerId = customer.id;
        customerName = customer.name;
        customerPhone = dto.newCustomer.phone || customer.phones?.[0]?.phone || null;
        customerEmail = customer.email || null;
      } else {
        // WALKIN_NAME_ONLY
        customerName = dto.newCustomer.name;
        customerPhone = null;
        customerEmail = null;
      }
    } else {
      throw new BadRequestException('Either customerId or newCustomer must be provided');
    }

    return this._createAppointmentCore(
      tenant.id,
      tenantSlug,
      dto,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerType,
      AppointmentSource.INTERNAL,
    );
  }

  /**
   * Create appointment from customer portal (logged in customer)
   */
  async createFromCustomerPortal(tenantSlug: string, userId: string, dto: CreateCustomerAppointmentDto) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    // Find customer by userId
    const customer = await this.prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        userId,
      },
      include: {
        phones: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return this._createAppointmentCore(
      tenant.id,
      tenantSlug,
      dto,
      customer.id,
      customer.name,
      customer.phones?.[0]?.phone || null,
      customer.email || null,
      CustomerType.REGISTERED,
      AppointmentSource.CUSTOMER_PORTAL,
    );
  }

  /**
   * Create appointment from WhatsApp integration
   */
  async createFromWhatsapp(tenantSlug: string, dto: CreateWhatsappAppointmentDto) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const { customer, customerType } = await this.customersService.findOrCreateFromWhatsapp(
      tenant.id,
      dto.whatsappNumber,
      dto.name,
    );

    return this._createAppointmentCore(
      tenant.id,
      tenantSlug,
      dto,
      customer.id,
      customer.name,
      dto.whatsappNumber,
      customer.email || null,
      customerType,
      AppointmentSource.WHATSAPP,
    );
  }

  /**
   * Core appointment creation logic with anti-overbooking transaction
   * PRIVATE - use public methods instead
   */
  private async _createAppointmentCore(
    tenantId: string,
    tenantSlug: string,
    dto: {
      filialId: string;
      professionalId?: string;
      serviceIds: string[];
      date: string;
      start: string;
      notes?: string;
    },
    customerId: string | null,
    customerName: string,
    customerPhone: string | null,
    customerEmail: string | null,
    customerType: CustomerType,
    source: AppointmentSource,
  ) {
    await this.filiaisService.findOne(tenantSlug, dto.filialId);

    // Get services and calculate duration
    const services = await this.prisma.service.findMany({
      where: {
        id: { in: dto.serviceIds },
        tenantId,
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

    // Validate start time is in the future (allow 5 minutes buffer for clock differences)
    const now = new Date();
    const minAllowedTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes buffer
    if (startsAt < minAllowedTime) {
      throw new BadRequestException(
        'Não é possível criar agendamento no passado. Por favor, selecione uma data e horário futuros.',
      );
    }

    // Transaction for anti-overbooking
    return this.prisma.$transaction(async (tx) => {
      let professionalId = dto.professionalId;

      // If no professional specified, select recommended one
      if (!professionalId) {
        const date = new Date(dto.date);
        const slots = await this.schedulingService.getAvailableSlots(
          tenantId,
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
          tenantId,
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
            tenantId,
            professionalId,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        }),
        tx.appointment.findFirst({
          where: {
            tenantId,
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
          tenantId,
          filialId: dto.filialId,
          professionalId,
          startsAt,
          endsAt,
          customerId,
          customerName,
          customerPhone,
          customerEmail,
          customerType,
          source,
          notes: dto.notes,
          status: 'CONFIRMED',
        },
      });

      // Create appointment services
      await Promise.all(
        dto.serviceIds.map((serviceId, index) =>
          tx.appointmentService.create({
            data: {
              tenantId,
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
          tenantId,
          appointmentId: appointment.id,
          toStatus: 'CONFIRMED',
          reason: `Appointment created via ${source}`,
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
    customerId?: string,
  ) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const where: any = {
      tenantId: tenant.id,
    };

    if (filialId) where.filialId = filialId;
    if (professionalId) where.professionalId = professionalId;
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

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

  async update(tenantSlug: string, id: string, dto: UpdateAppointmentDto, userId?: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        professional: true,
        customer: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === 'CANCELED') {
      throw new BadRequestException('Cannot update a canceled appointment');
    }

    // Handle customer update
    let customerId = appointment.customerId;
    let customerName = appointment.customerName;
    let customerPhone = appointment.customerPhone;
    let customerEmail = appointment.customerEmail;

    if (dto.customerId) {
      const customer = await this.customersService.findOne(tenant.id, dto.customerId);
      customerId = customer.id;
      customerName = customer.name;
      customerPhone = customer.phones?.[0]?.phone || null;
      customerEmail = customer.email || null;
    } else if (dto.newCustomer) {
      const { customer } = await this.customersService.findOrCreateFromInternal(
        tenant.id,
        {
          name: dto.newCustomer.name,
          phone: dto.newCustomer.phone,
          email: dto.newCustomer.email,
          document: dto.newCustomer.document,
          documentType: dto.newCustomer.documentType,
          filialId: appointment.filialId,
        },
      );
      if (customer) {
        customerId = customer.id;
        customerName = customer.name;
        customerPhone = dto.newCustomer.phone || customer.phones?.[0]?.phone || null;
        customerEmail = customer.email || null;
      } else {
        customerName = dto.newCustomer.name;
        customerPhone = dto.newCustomer.phone || null;
        customerEmail = dto.newCustomer.email || null;
      }
    }

    // Calculate new start time
    let newStartsAt = appointment.startsAt;
    if (dto.start) {
      newStartsAt = new Date(dto.start);
    } else if (dto.date) {
      const existingDate = new Date(appointment.startsAt);
      const newDate = new Date(dto.date);
      newStartsAt = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        existingDate.getHours(),
        existingDate.getMinutes(),
      );
    }

    // Calculate duration from services
    let durationMinutes = 0;
    if (dto.serviceIds && dto.serviceIds.length > 0) {
      const services = await this.prisma.service.findMany({
        where: {
          id: { in: dto.serviceIds },
          tenantId: tenant.id,
        },
      });
      durationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
    } else {
      // Calculate from existing services if not changed
      const existingServices = await this.prisma.service.findMany({
        where: {
          id: { in: appointment.services.map((s: any) => s.serviceId) },
          tenantId: tenant.id,
        },
      });
      durationMinutes = existingServices.reduce((sum, s) => sum + s.durationMinutes, 0);
    }

    const endsAt = new Date(newStartsAt.getTime() + durationMinutes * 60000);

    return this.prisma.$transaction(async (tx) => {
      // Update services if changed
      if (dto.serviceIds && dto.serviceIds.length > 0) {
        // Delete existing services
        await tx.appointmentService.deleteMany({
          where: { appointmentId: id },
        });

        // Add new services
        await tx.appointmentService.createMany({
          data: dto.serviceIds.map((serviceId, index) => ({
            tenantId: tenant.id,
            appointmentId: id,
            serviceId,
            order: index,
          })),
        });
      }

      // Update appointment
      const updateData: any = {};
      
      if (dto.professionalId) {
        updateData.professionalId = dto.professionalId;
      }
      
      if (dto.start || dto.date) {
        updateData.startsAt = newStartsAt;
        updateData.endsAt = endsAt;
      }
      
      if (dto.customerId || dto.newCustomer) {
        updateData.customerId = customerId;
        updateData.customerName = customerName;
        updateData.customerPhone = customerPhone;
        updateData.customerEmail = customerEmail;
      }
      
      if (dto.notes !== undefined) {
        updateData.notes = dto.notes;
      }

      const updated = await tx.appointment.update({
        where: { id },
        data: updateData,
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
        },
      });

      return updated;
    });
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

