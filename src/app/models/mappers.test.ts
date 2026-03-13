import { describe, it, expect } from 'vitest';
import { getNextDueDate } from './mappers';
import { Chore as PrismaChore, User } from '@prisma/client';

type ChoreWithUser = PrismaChore & { responsibleUser: User | null };

// Helper to create a mock chore for testing
function createMockChore(overrides: Partial<ChoreWithUser> = {}): ChoreWithUser {
  return {
    id: 1,
    name: 'Test Chore',
    description: null,
    recurrence: null,
    nextDueDate: null,
    autoSchedule: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    responsibleUserId: null,
    responsibleUser: null,
    ...overrides,
  };
}

describe('getNextDueDate', () => {
  describe('basic functionality', () => {
    it('returns null for non-recurring chores', () => {
      const chore = createMockChore({ recurrence: null });
      const result = getNextDueDate(chore, new Date('2026-03-15'));
      expect(result).toBeNull();
    });

    it('returns createdAt when no lastCompletedAt provided', () => {
      const createdAt = new Date('2026-01-15');
      const chore = createMockChore({ 
        recurrence: 'FREQ=WEEKLY;BYDAY=MO', 
        createdAt 
      });
      const result = getNextDueDate(chore, null);
      expect(result).toEqual(createdAt);
    });
  });

  describe('daily recurrence', () => {
    it('returns the next day after completion', () => {
      const chore = createMockChore({ recurrence: 'FREQ=DAILY' });
      const completedAt = new Date('2026-03-12T14:30:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toContain('2026-03-13');
    });

    it('works correctly with back-dated completion', () => {
      const chore = createMockChore({ 
        recurrence: 'FREQ=DAILY',
        nextDueDate: new Date('2026-03-15')
      });
      // Complete with a back-date of March 10
      const completedAt = new Date('2026-03-10T10:00:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      // Should return March 11, not March 10 (the back-date)
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toContain('2026-03-11');
    });
  });

  describe('weekly recurrence with BYDAY', () => {
    it('returns next Monday after completing on Monday', () => {
      const chore = createMockChore({ recurrence: 'FREQ=WEEKLY;BYDAY=MO' });
      // March 16, 2026 is a Monday
      const completedAt = new Date('2026-03-16T14:30:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      expect(result).not.toBeNull();
      // Next Monday is March 23
      expect(result!.toISOString()).toContain('2026-03-23');
    });

    it('returns next Monday after completing mid-week', () => {
      const chore = createMockChore({ recurrence: 'FREQ=WEEKLY;BYDAY=MO' });
      // March 18, 2026 is a Wednesday
      const completedAt = new Date('2026-03-18T14:30:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      expect(result).not.toBeNull();
      // Next Monday is March 23
      expect(result!.toISOString()).toContain('2026-03-23');
    });

    it('handles back-dated completion correctly for weekly BYDAY', () => {
      const chore = createMockChore({ 
        recurrence: 'FREQ=WEEKLY;BYDAY=MO',
        nextDueDate: new Date('2026-03-16') // Monday
      });
      // Back-date to previous Monday (March 9)
      const completedAt = new Date('2026-03-09T10:00:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      // Should return March 16 (next Monday after March 9), not March 9
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toContain('2026-03-16');
    });
  });

  describe('weekly recurrence without BYDAY (the bug scenario)', () => {
    it('should calculate one week from completion date', () => {
      const chore = createMockChore({ 
        recurrence: 'FREQ=WEEKLY',
        nextDueDate: new Date('2026-03-16') // Monday
      });
      // Complete on the due date
      const completedAt = new Date('2026-03-16T10:00:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      // Should return one week later: March 23
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toContain('2026-03-23');
    });

    it('should calculate one week from back-dated completion', () => {
      const chore = createMockChore({ 
        recurrence: 'FREQ=WEEKLY',
        nextDueDate: new Date('2026-03-16') // Monday
      });
      // Back-date completion to March 9
      const completedAt = new Date('2026-03-09T10:00:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      // BUG TEST: Should return March 16 (one week from March 9)
      // Not March 9 (the back-date itself)
      expect(result).not.toBeNull();
      const resultDate = result!.toISOString().split('T')[0];
      expect(resultDate).toBe('2026-03-16');
    });

    it('should not return the back-date itself', () => {
      const chore = createMockChore({ 
        recurrence: 'FREQ=WEEKLY',
        nextDueDate: new Date('2026-03-23')
      });
      // Back-date completion to March 10
      const completedAt = new Date('2026-03-10T10:00:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      // The result should be AFTER the completion date
      expect(result).not.toBeNull();
      expect(result!.getTime()).toBeGreaterThan(completedAt.getTime());
    });
  });

  describe('bi-weekly recurrence', () => {
    it('should calculate two weeks from completion', () => {
      const chore = createMockChore({ 
        recurrence: 'FREQ=WEEKLY;INTERVAL=2',
        nextDueDate: new Date('2026-03-16')
      });
      const completedAt = new Date('2026-03-16T10:00:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      // Should be two weeks later: March 30
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toContain('2026-03-30');
    });

    it('handles back-dated completion for bi-weekly', () => {
      const chore = createMockChore({ 
        recurrence: 'FREQ=WEEKLY;INTERVAL=2',
        nextDueDate: new Date('2026-03-30')
      });
      // Back-date to March 9
      const completedAt = new Date('2026-03-09T10:00:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      // Should return two weeks from March 9: March 23
      expect(result).not.toBeNull();
      expect(result!.getTime()).toBeGreaterThan(completedAt.getTime());
    });
  });

  describe('monthly recurrence', () => {
    it('returns next month on same day', () => {
      const chore = createMockChore({ recurrence: 'FREQ=MONTHLY;BYMONTHDAY=15' });
      const completedAt = new Date('2026-03-15T14:00:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toContain('2026-04-15');
    });

    it('handles back-dated monthly completion', () => {
      const chore = createMockChore({ 
        recurrence: 'FREQ=MONTHLY;BYMONTHDAY=1',
        nextDueDate: new Date('2026-04-01')
      });
      // Back-date to Feb 1
      const completedAt = new Date('2026-02-01T10:00:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      // Should return March 1 (next monthly occurrence after Feb 1)
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toContain('2026-03-01');
    });
  });

  describe('edge cases', () => {
    it('handles completion at midnight UTC', () => {
      const chore = createMockChore({ recurrence: 'FREQ=DAILY' });
      const completedAt = new Date('2026-03-15T00:00:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toContain('2026-03-16');
    });

    it('handles completion at end of day UTC', () => {
      const chore = createMockChore({ recurrence: 'FREQ=DAILY' });
      const completedAt = new Date('2026-03-15T23:59:59Z');
      const result = getNextDueDate(chore, completedAt);
      
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toContain('2026-03-16');
    });

    it('handles year boundary', () => {
      const chore = createMockChore({ recurrence: 'FREQ=WEEKLY;BYDAY=MO' });
      // Dec 28, 2026 is a Monday
      const completedAt = new Date('2026-12-28T14:00:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      expect(result).not.toBeNull();
      // Next Monday is Jan 4, 2027
      expect(result!.toISOString()).toContain('2027-01-04');
    });

    it('handles leap year February', () => {
      const chore = createMockChore({ recurrence: 'FREQ=DAILY' });
      // 2028 is a leap year
      const completedAt = new Date('2028-02-28T14:00:00Z');
      const result = getNextDueDate(chore, completedAt);
      
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toContain('2028-02-29');
    });

    it('returns null for invalid recurrence rule', () => {
      const chore = createMockChore({ recurrence: 'INVALID_RULE' });
      const completedAt = new Date('2026-03-15');
      const result = getNextDueDate(chore, completedAt);
      
      expect(result).toBeNull();
    });
  });
});
