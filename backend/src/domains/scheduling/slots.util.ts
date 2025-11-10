import { TimeWindow } from './overlap.util';

export interface Slot {
  start: Date;
  end: Date;
}

/**
 * Round time up to the next grid boundary
 */
function roundUpToGrid(time: Date, gridMinutes: number): Date {
  const ms = time.getTime();
  const gridMs = gridMinutes * 60 * 1000;
  const remainder = ms % gridMs;
  
  if (remainder === 0) {
    return time;
  }
  
  return new Date(ms + (gridMs - remainder));
}

/**
 * Round time down to the previous grid boundary
 */
function roundDownToGrid(time: Date, gridMinutes: number): Date {
  const ms = time.getTime();
  const gridMs = gridMinutes * 60 * 1000;
  const remainder = ms % gridMs;
  
  return new Date(ms - remainder);
}

/**
 * Generate slot starts on a grid within free windows
 */
export function generateStartsOnGrid(
  freeWindows: TimeWindow[],
  totalDurationMinutes: number,
  gridMinutes: number,
): Slot[] {
  const slots: Slot[] = [];
  const durationMs = totalDurationMinutes * 60 * 1000;

  for (const window of freeWindows) {
    // Round start up to grid
    let currentStart = roundUpToGrid(window.start, gridMinutes);
    
    // Calculate last possible start (rounded down)
    const lastPossibleStart = new Date(window.end.getTime() - durationMs);
    const lastStart = roundDownToGrid(lastPossibleStart, gridMinutes);

    // Generate slots
    while (currentStart <= lastStart) {
      const end = new Date(currentStart.getTime() + durationMs);
      
      // Verify the slot fits entirely within the window
      if (end <= window.end) {
        slots.push({
          start: new Date(currentStart),
          end,
        });
      }
      
      // Move to next grid position
      currentStart = new Date(currentStart.getTime() + gridMinutes * 60 * 1000);
    }
  }

  return slots;
}

/**
 * Merge adjacent or overlapping slots
 */
export function mergeSlots(slots: Slot[]): Slot[] {
  if (slots.length === 0) return [];

  const sorted = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Slot[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      // Merge
      last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
    } else {
      merged.push(current);
    }
  }

  return merged;
}

