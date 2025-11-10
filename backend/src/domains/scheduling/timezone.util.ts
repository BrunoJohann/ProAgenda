/**
 * Timezone utilities for converting between local and UTC times
 */

/**
 * Convert local time (weekday + minutes) to UTC Date for a specific date
 */
export function localTimeToUTC(
  date: Date,
  weekday: number,
  minutes: number,
  timezone: string,
): Date {
  // Create a date string in the target timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  const dateString = `${year}-${month}-${day}T${timeString}`;

  // Parse as local time in the given timezone
  // Note: In production, use a library like date-fns-tz or luxon for proper timezone handling
  // For now, we'll use a simplified approach
  const localDate = new Date(dateString);
  
  return localDate;
}

/**
 * Get the weekday (0-6) for a date in a specific timezone
 */
export function getLocalWeekday(date: Date, timezone: string): number {
  // In production, use proper timezone library
  // For now, use UTC weekday as approximation
  return date.getUTCDay();
}

/**
 * Get start and end of day in UTC for a local date
 */
export function getLocalDayBounds(date: Date, timezone: string): { start: Date; end: Date } {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const startString = `${year}-${month}-${day}T00:00:00`;
  const endString = `${year}-${month}-${day}T23:59:59`;

  return {
    start: new Date(startString),
    end: new Date(endString),
  };
}

