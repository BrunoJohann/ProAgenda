import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../filiais/settings.service';
import { workingPeriodsToWindows, calculateFreeWindows } from './windows.util';
import { generateStartsOnGrid } from './slots.util';

export interface SlotOption {
  start: Date;
  end: Date;
  professionalOptions: Array<{
    professionalId: string;
    professionalName: string;
  }>;
  recommendedProfessionalId: string;
}

@Injectable()
export class SchedulingService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  /**
   * Get available slots for services at a filial
   * If professionalId is provided, return slots only for that professional
   * Otherwise, return union of all eligible professionals with fairness recommendation
   */
  async getAvailableSlots(
    tenantId: string,
    filialId: string,
    date: Date,
    serviceIds: string[],
    professionalId?: string,
  ): Promise<SlotOption[]> {
    // Get services and calculate total duration
    const services = await this.prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        tenantId,
        filialId,
        isActive: true,
      },
    });

    if (services.length !== serviceIds.length) {
      throw new Error('One or more services not found or inactive');
    }

    const totalDuration = services.reduce(
      (sum, s) => sum + s.durationMinutes + s.bufferMinutes,
      0,
    );

    // Get slot granularity
    const gridMinutes = await this.settingsService.getSlotGranularity(filialId);

    // Get filial timezone
    const filial = await this.prisma.filial.findUnique({
      where: { id: filialId },
      select: { timezone: true },
    });

    if (!filial) {
      throw new Error('Filial not found');
    }

    if (professionalId) {
      // Single professional mode
      const slots = await this.getSlotsForProfessional(
        tenantId,
        professionalId,
        date,
        totalDuration,
        gridMinutes,
        filial.timezone,
      );

      const professional = await this.prisma.professional.findUnique({
        where: { id: professionalId },
        select: { id: true, name: true },
      });

      if (!professional) {
        throw new NotFoundException('Professional not found');
      }

      return slots.map((slot) => ({
        ...slot,
        professionalOptions: [
          {
            professionalId: professional.id,
            professionalName: professional.name,
          },
        ],
        recommendedProfessionalId: professional.id,
      }));
    }

    // Multi-professional mode: find all eligible professionals
    const eligibleProfessionals = await this.getEligibleProfessionals(
      tenantId,
      filialId,
      serviceIds,
    );

    if (eligibleProfessionals.length === 0) {
      return [];
    }

    // Get slots for each professional
    const professionalSlots = await Promise.all(
      eligibleProfessionals.map(async (prof) => {
        const slots = await this.getSlotsForProfessional(
          tenantId,
          prof.id,
          date,
          totalDuration,
          gridMinutes,
          filial.timezone,
        );
        return { professionalId: prof.id, professionalName: prof.name, slots };
      }),
    );

    // Union slots and add professional options
    return this.unionSlotsWithFairness(
      professionalSlots,
      tenantId,
      filialId,
      date,
    );
  }

  /**
   * Get slots for a single professional
   */
  private async getSlotsForProfessional(
    tenantId: string,
    professionalId: string,
    date: Date,
    totalDuration: number,
    gridMinutes: number,
    timezone: string,
  ) {
    // Get working periods
    const periods = await this.prisma.workingPeriod.findMany({
      where: {
        tenantId,
        professionalId,
      },
    });

    // Convert to UTC windows for the date
    const workingWindows = workingPeriodsToWindows(date, periods, timezone);

    // Get blocks and appointments for the day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [blocks, appointments] = await Promise.all([
      this.prisma.blockedTime.findMany({
        where: {
          tenantId,
          professionalId,
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
      }),
      this.prisma.appointment.findMany({
        where: {
          tenantId,
          professionalId,
          status: 'CONFIRMED',
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
      }),
    ]);

    // Calculate free windows
    const freeWindows = calculateFreeWindows(workingWindows, [...blocks, ...appointments]);

    // Generate slots on grid
    return generateStartsOnGrid(freeWindows, totalDuration, gridMinutes);
  }

  /**
   * Get professionals who can perform all requested services
   */
  private async getEligibleProfessionals(
    tenantId: string,
    filialId: string,
    serviceIds: string[],
  ) {
    // Find professionals who have all the services
    const professionals = await this.prisma.professional.findMany({
      where: {
        tenantId,
        filialId,
        isActive: true,
      },
      include: {
        professionalServices: {
          where: {
            serviceId: { in: serviceIds },
          },
        },
      },
    });

    // Filter to those who have ALL services
    return professionals.filter(
      (prof) => prof.professionalServices.length === serviceIds.length,
    );
  }

  /**
   * Union slots from multiple professionals with fairness recommendation
   */
  private async unionSlotsWithFairness(
    professionalSlots: Array<{
      professionalId: string;
      professionalName: string;
      slots: Array<{ start: Date; end: Date }>;
    }>,
    tenantId: string,
    filialId: string,
    date: Date,
  ): Promise<SlotOption[]> {
    // Get appointment counts for the day for fairness
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const appointmentCounts = await Promise.all(
      professionalSlots.map(async (ps) => {
        const count = await this.prisma.appointment.count({
          where: {
            tenantId,
            filialId,
            professionalId: ps.professionalId,
            status: 'CONFIRMED',
            startsAt: { gte: dayStart, lt: dayEnd },
          },
        });
        return { professionalId: ps.professionalId, count };
      }),
    );

    const countMap = new Map(appointmentCounts.map((ac) => [ac.professionalId, ac.count]));

    // Get professional creation dates for tiebreaker
    const professionals = await this.prisma.professional.findMany({
      where: {
        id: { in: professionalSlots.map((ps) => ps.professionalId) },
      },
      select: { id: true, createdAt: true },
    });
    const createdAtMap = new Map(professionals.map((p) => [p.id, p.createdAt]));

    // Group slots by time
    const slotMap = new Map<string, SlotOption>();

    for (const ps of professionalSlots) {
      for (const slot of ps.slots) {
        const key = `${slot.start.toISOString()}-${slot.end.toISOString()}`;
        
        if (!slotMap.has(key)) {
          slotMap.set(key, {
            start: slot.start,
            end: slot.end,
            professionalOptions: [],
            recommendedProfessionalId: '',
          });
        }

        const slotOption = slotMap.get(key)!;
        slotOption.professionalOptions.push({
          professionalId: ps.professionalId,
          professionalName: ps.professionalName,
        });
      }
    }

    // Determine recommended professional for each slot (fairness algorithm)
    const result: SlotOption[] = [];

    for (const slotOption of slotMap.values()) {
      // Sort by: 1) fewest appointments, 2) earliest createdAt
      const sorted = slotOption.professionalOptions.sort((a, b) => {
        const countA = countMap.get(a.professionalId) || 0;
        const countB = countMap.get(b.professionalId) || 0;

        if (countA !== countB) {
          return countA - countB;
        }

        const createdA = createdAtMap.get(a.professionalId)!.getTime();
        const createdB = createdAtMap.get(b.professionalId)!.getTime();
        return createdA - createdB;
      });

      slotOption.recommendedProfessionalId = sorted[0].professionalId;
      result.push(slotOption);
    }

    // Sort by start time
    result.sort((a, b) => a.start.getTime() - b.start.getTime());

    return result;
  }
}

