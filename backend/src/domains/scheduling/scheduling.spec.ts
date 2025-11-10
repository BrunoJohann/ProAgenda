import { generateStartsOnGrid } from './slots.util';
import { subtractWindows, hasOverlap } from './overlap.util';

describe('Scheduling Engine', () => {
  describe('generateStartsOnGrid', () => {
    it('should generate slots with 15-minute grid and 45-minute duration', () => {
      const freeWindows = [
        {
          start: new Date('2025-11-10T09:30:00Z'),
          end: new Date('2025-11-10T12:00:00Z'),
        },
      ];

      const slots = generateStartsOnGrid(freeWindows, 45, 15);

      // Expected starts: 09:30, 09:45, 10:00, 10:15, 10:30, 10:45, 11:00, 11:15
      // Last possible start: 12:00 - 45min = 11:15
      expect(slots.length).toBe(8);
      expect(slots[0].start.toISOString()).toBe('2025-11-10T09:30:00.000Z');
      expect(slots[slots.length - 1].start.toISOString()).toBe('2025-11-10T11:15:00.000Z');
    });

    it('should generate slots with 30-minute grid and 45-minute duration', () => {
      const freeWindows = [
        {
          start: new Date('2025-11-10T10:00:00Z'),
          end: new Date('2025-11-10T12:00:00Z'),
        },
      ];

      const slots = generateStartsOnGrid(freeWindows, 45, 30);

      // Expected starts: 10:00, 10:30, 11:00
      // Last possible start: 12:00 - 45min = 11:15, rounded down to 11:00
      expect(slots.length).toBe(3);
      expect(slots[0].start.toISOString()).toBe('2025-11-10T10:00:00.000Z');
      expect(slots[2].start.toISOString()).toBe('2025-11-10T11:00:00.000Z');
    });

    it('should handle multiple free windows', () => {
      const freeWindows = [
        {
          start: new Date('2025-11-10T09:00:00Z'),
          end: new Date('2025-11-10T10:00:00Z'),
        },
        {
          start: new Date('2025-11-10T14:00:00Z'),
          end: new Date('2025-11-10T15:00:00Z'),
        },
      ];

      const slots = generateStartsOnGrid(freeWindows, 30, 15);

      // First window: 09:00, 09:15, 09:30 (09:45 would end at 10:15, outside window)
      // Second window: 14:00, 14:15, 14:30
      expect(slots.length).toBe(6);
    });

    it('should return empty array if no slots fit', () => {
      const freeWindows = [
        {
          start: new Date('2025-11-10T09:00:00Z'),
          end: new Date('2025-11-10T09:20:00Z'),
        },
      ];

      const slots = generateStartsOnGrid(freeWindows, 30, 15);

      expect(slots.length).toBe(0);
    });
  });

  describe('subtractWindows', () => {
    it('should subtract overlapping windows', () => {
      const base = {
        start: new Date('2025-11-10T09:00:00Z'),
        end: new Date('2025-11-10T17:00:00Z'),
      };

      const toSubtract = [
        {
          start: new Date('2025-11-10T12:00:00Z'),
          end: new Date('2025-11-10T13:00:00Z'),
        },
      ];

      const result = subtractWindows(base, toSubtract);

      expect(result.length).toBe(2);
      expect(result[0].start.toISOString()).toBe('2025-11-10T09:00:00.000Z');
      expect(result[0].end.toISOString()).toBe('2025-11-10T12:00:00.000Z');
      expect(result[1].start.toISOString()).toBe('2025-11-10T13:00:00.000Z');
      expect(result[1].end.toISOString()).toBe('2025-11-10T17:00:00.000Z');
    });

    it('should handle multiple subtractions', () => {
      const base = {
        start: new Date('2025-11-10T09:00:00Z'),
        end: new Date('2025-11-10T18:00:00Z'),
      };

      const toSubtract = [
        {
          start: new Date('2025-11-10T10:00:00Z'),
          end: new Date('2025-11-10T11:00:00Z'),
        },
        {
          start: new Date('2025-11-10T14:00:00Z'),
          end: new Date('2025-11-10T15:00:00Z'),
        },
      ];

      const result = subtractWindows(base, toSubtract);

      expect(result.length).toBe(3);
    });

    it('should return empty if fully covered', () => {
      const base = {
        start: new Date('2025-11-10T09:00:00Z'),
        end: new Date('2025-11-10T17:00:00Z'),
      };

      const toSubtract = [
        {
          start: new Date('2025-11-10T08:00:00Z'),
          end: new Date('2025-11-10T18:00:00Z'),
        },
      ];

      const result = subtractWindows(base, toSubtract);

      expect(result.length).toBe(0);
    });
  });

  describe('hasOverlap', () => {
    it('should detect overlap', () => {
      const a = {
        start: new Date('2025-11-10T09:00:00Z'),
        end: new Date('2025-11-10T10:00:00Z'),
      };

      const b = {
        start: new Date('2025-11-10T09:30:00Z'),
        end: new Date('2025-11-10T10:30:00Z'),
      };

      expect(hasOverlap(a, b)).toBe(true);
    });

    it('should not detect overlap for adjacent windows', () => {
      const a = {
        start: new Date('2025-11-10T09:00:00Z'),
        end: new Date('2025-11-10T10:00:00Z'),
      };

      const b = {
        start: new Date('2025-11-10T10:00:00Z'),
        end: new Date('2025-11-10T11:00:00Z'),
      };

      // End is exclusive, so no overlap
      expect(hasOverlap(a, b)).toBe(false);
    });
  });
});

