/**
 * Overlap detection utilities
 */

export interface TimeWindow {
  start: Date;
  end: Date;
}

/**
 * Check if two time windows overlap
 * Intervals are [start, end) - start inclusive, end exclusive
 */
export function hasOverlap(a: TimeWindow, b: TimeWindow): boolean {
  return a.start < b.end && a.end > b.start;
}

/**
 * Check if window A is fully contained within window B
 */
export function isContained(a: TimeWindow, b: TimeWindow): boolean {
  return a.start >= b.start && a.end <= b.end;
}

/**
 * Get the intersection of two windows, or null if they don't overlap
 */
export function getIntersection(a: TimeWindow, b: TimeWindow): TimeWindow | null {
  if (!hasOverlap(a, b)) {
    return null;
  }

  return {
    start: new Date(Math.max(a.start.getTime(), b.start.getTime())),
    end: new Date(Math.min(a.end.getTime(), b.end.getTime())),
  };
}

/**
 * Subtract multiple windows from a base window, returning remaining free windows
 */
export function subtractWindows(base: TimeWindow, toSubtract: TimeWindow[]): TimeWindow[] {
  let remaining: TimeWindow[] = [base];

  for (const subtract of toSubtract) {
    const newRemaining: TimeWindow[] = [];

    for (const window of remaining) {
      if (!hasOverlap(window, subtract)) {
        // No overlap, keep the window
        newRemaining.push(window);
      } else {
        // There's overlap, split the window
        if (window.start < subtract.start) {
          // Add part before the subtraction
          newRemaining.push({
            start: window.start,
            end: new Date(Math.min(window.end.getTime(), subtract.start.getTime())),
          });
        }
        if (window.end > subtract.end) {
          // Add part after the subtraction
          newRemaining.push({
            start: new Date(Math.max(window.start.getTime(), subtract.end.getTime())),
            end: window.end,
          });
        }
      }
    }

    remaining = newRemaining;
  }

  return remaining;
}

