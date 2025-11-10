import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { FiliaisService } from '../filiais/filiais.service';
import { SchedulingService } from '../scheduling/scheduling.service';

@Injectable()
export class MetricsService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
    private filiaisService: FiliaisService,
    private schedulingService: SchedulingService,
  ) {}

  async getFilialMetrics(tenantSlug: string, filialId: string, from: string, to: string) {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    await this.filiaisService.findOne(tenantSlug, filialId);

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Get all appointments in range
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        filialId,
        startsAt: { gte: fromDate, lte: toDate },
      },
      include: {
        services: {
          include: { service: true },
        },
        statusHistory: true,
      },
    });

    // Calculate summary metrics
    const confirmed = appointments.filter((a) => a.status === 'CONFIRMED');
    const canceled = appointments.filter((a) => a.status === 'CANCELED');
    
    const totalAppointments = confirmed.length;
    const totalCancellations = canceled.length;
    const cancelRate = totalAppointments + totalCancellations > 0
      ? totalCancellations / (totalAppointments + totalCancellations)
      : 0;

    const totalDurationMin = confirmed.reduce((sum, appt) => {
      const duration = (appt.endsAt.getTime() - appt.startsAt.getTime()) / (1000 * 60);
      return sum + duration;
    }, 0);

    const avgDurationMin = totalAppointments > 0 ? totalDurationMin / totalAppointments : 0;

    // Get professionals for detailed metrics
    const professionals = await this.prisma.professional.findMany({
      where: {
        tenantId: tenant.id,
        filialId,
      },
      include: {
        periods: true,
      },
    });

    // Calculate per-professional metrics
    const barberPerformance = await Promise.all(
      professionals.map(async (prof) => {
        const profAppointments = appointments.filter(
          (a) => a.professionalId === prof.id && a.status === 'CONFIRMED',
        );
        const profCanceled = appointments.filter(
          (a) => a.professionalId === prof.id && a.status === 'CANCELED',
        );

        // Worked minutes
        const workedMin = profAppointments.reduce((sum, appt) => {
          const duration = (appt.endsAt.getTime() - appt.startsAt.getTime()) / (1000 * 60);
          return sum + duration;
        }, 0);

        // Capacity minutes (simplified - count working period minutes in range)
        const capacityMin = this.calculateCapacityMinutes(prof.periods, fromDate, toDate);

        // Occupancy
        const occupancyPct = capacityMin > 0 ? Math.min(workedMin / capacityMin, 1) : 0;

        // Cancel rate
        const profTotal = profAppointments.length + profCanceled.length;
        const profCancelRate = profTotal > 0 ? profCanceled.length / profTotal : 0;

        // Next available slot (simplified - just check if they have slots today)
        const nextAvailableInMin = await this.getNextAvailableMinutes(
          tenant.id,
          filialId,
          prof.id,
        );

        return {
          professionalId: prof.id,
          professionalName: prof.name,
          appointments: profAppointments.length,
          workedMin: Math.round(workedMin),
          capacityMin: Math.round(capacityMin),
          occupancyPct: Math.round(occupancyPct * 100) / 100,
          cancelRate: Math.round(profCancelRate * 100) / 100,
          nextAvailableInMin,
        };
      }),
    );

    // Occupancy for summary (average of all professionals)
    const avgOccupancy = barberPerformance.length > 0
      ? barberPerformance.reduce((sum, p) => sum + p.occupancyPct, 0) / barberPerformance.length
      : 0;

    // Timeseries by day
    const byDay = this.groupByDay(appointments, fromDate, toDate);

    // Service mix
    const serviceMix = this.calculateServiceMix(appointments);

    // Heatmap (weekday x hour)
    const heatmap = this.calculateHeatmap(confirmed);

    return {
      summary: {
        appointments: totalAppointments,
        cancellations: totalCancellations,
        cancelRate: Math.round(cancelRate * 100) / 100,
        avgDurationMin: Math.round(avgDurationMin),
        occupancyPct: Math.round(avgOccupancy * 100) / 100,
      },
      timeseries: {
        byDay,
      },
      barberPerformance,
      serviceMix,
      heatmap: {
        weekdayHour: heatmap,
      },
    };
  }

  private calculateCapacityMinutes(
    periods: Array<{ weekday: number; startMinutes: number; endMinutes: number }>,
    from: Date,
    to: Date,
  ): number {
    let totalMinutes = 0;
    const current = new Date(from);

    while (current <= to) {
      const weekday = current.getDay();
      const dayPeriods = periods.filter((p) => p.weekday === weekday);

      for (const period of dayPeriods) {
        totalMinutes += period.endMinutes - period.startMinutes;
      }

      current.setDate(current.getDate() + 1);
    }

    return totalMinutes;
  }

  private async getNextAvailableMinutes(
    tenantId: string,
    filialId: string,
    professionalId: string,
  ): Promise<number> {
    try {
      // Simplified: try to get slots for today
      const today = new Date();
      
      // Get a sample service to calculate slots
      const service = await this.prisma.service.findFirst({
        where: { tenantId, filialId, isActive: true },
      });

      if (!service) return -1;

      const slots = await this.schedulingService.getAvailableSlots(
        tenantId,
        filialId,
        today,
        [service.id],
        professionalId,
      );

      if (slots.length === 0) return -1;

      const now = new Date();
      const nextSlot = slots.find((s) => s.start > now);

      if (!nextSlot) return -1;

      return Math.round((nextSlot.start.getTime() - now.getTime()) / (1000 * 60));
    } catch {
      return -1;
    }
  }

  private groupByDay(
    appointments: Array<{ startsAt: Date; status: string }>,
    from: Date,
    to: Date,
  ) {
    const dayMap = new Map<string, { appointments: number; cancellations: number }>();

    // Initialize all days
    const current = new Date(from);
    while (current <= to) {
      const key = current.toISOString().split('T')[0];
      dayMap.set(key, { appointments: 0, cancellations: 0 });
      current.setDate(current.getDate() + 1);
    }

    // Count appointments
    for (const appt of appointments) {
      const key = appt.startsAt.toISOString().split('T')[0];
      const day = dayMap.get(key);
      if (day) {
        if (appt.status === 'CONFIRMED') {
          day.appointments++;
        } else if (appt.status === 'CANCELED') {
          day.cancellations++;
        }
      }
    }

    return Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  private calculateServiceMix(
    appointments: Array<{
      status: string;
      services: Array<{ service: { id: string; name: string } }>;
    }>,
  ) {
    const serviceMap = new Map<string, { name: string; count: number }>();

    for (const appt of appointments) {
      if (appt.status !== 'CONFIRMED') continue;

      for (const svc of appt.services) {
        const existing = serviceMap.get(svc.service.id);
        if (existing) {
          existing.count++;
        } else {
          serviceMap.set(svc.service.id, {
            name: svc.service.name,
            count: 1,
          });
        }
      }
    }

    return Array.from(serviceMap.entries())
      .map(([serviceId, data]) => ({
        serviceId,
        name: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateHeatmap(appointments: Array<{ startsAt: Date }>) {
    const heatmap = new Map<string, number>();

    for (const appt of appointments) {
      const weekday = appt.startsAt.getDay();
      const hour = appt.startsAt.getHours();
      const key = `${weekday}-${hour}`;

      heatmap.set(key, (heatmap.get(key) || 0) + 1);
    }

    return Array.from(heatmap.entries()).map(([key, appointments]) => {
      const [weekday, hour] = key.split('-').map(Number);
      return { weekday, hour, appointments };
    });
  }
}

