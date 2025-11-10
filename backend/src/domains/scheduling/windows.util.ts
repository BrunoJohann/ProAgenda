import { TimeWindow, subtractWindows } from './overlap.util';
import { localTimeToUTC } from './timezone.util';

export interface WorkingPeriod {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
}

export interface BlockOrAppointment {
  startsAt: Date;
  endsAt: Date;
}

/**
 * Convert working periods to UTC windows for a specific date
 */
export function workingPeriodsToWindows(
  date: Date,
  periods: WorkingPeriod[],
  timezone: string,
): TimeWindow[] {
  const weekday = date.getDay();
  const relevantPeriods = periods.filter((p) => p.weekday === weekday);

  return relevantPeriods.map((period) => ({
    start: localTimeToUTC(date, period.weekday, period.startMinutes, timezone),
    end: localTimeToUTC(date, period.weekday, period.endMinutes, timezone),
  }));
}

/**
 * Calculate free windows by subtracting blocks and appointments from working periods
 */
export function calculateFreeWindows(
  workingWindows: TimeWindow[],
  blocksAndAppointments: BlockOrAppointment[],
): TimeWindow[] {
  let freeWindows: TimeWindow[] = [];

  for (const workingWindow of workingWindows) {
    const occupied: TimeWindow[] = blocksAndAppointments.map((item) => ({
      start: item.startsAt,
      end: item.endsAt,
    }));

    const free = subtractWindows(workingWindow, occupied);
    freeWindows = freeWindows.concat(free);
  }

  // Sort by start time
  freeWindows.sort((a, b) => a.start.getTime() - b.start.getTime());

  return freeWindows;
}

