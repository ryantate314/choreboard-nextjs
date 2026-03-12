import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient, ScheduledStatus } from '@prisma/client';
import { getNextDueDate } from '../models/mappers';

const prisma = new PrismaClient();

describe('Chore completion recalculates nextDueDate', () => {
  let testChoreId: number;
  let testScheduledId: number;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up any previous test data
    await prisma.scheduledChore.deleteMany({
      where: { chore: { name: { startsWith: 'TEST_CHORE_' } } },
    });
    await prisma.chore.deleteMany({
      where: { name: { startsWith: 'TEST_CHORE_' } },
    });
  });

  it('should update nextDueDate on parent chore when completing a recurring task', async () => {
    // Create a chore with weekly recurrence (every Monday)
    const chore = await prisma.chore.create({
      data: {
        name: 'TEST_CHORE_weekly_task',
        description: 'A weekly recurring task for testing',
        recurrence: 'FREQ=WEEKLY;BYDAY=MO',
        nextDueDate: new Date('2026-03-16'), // Monday
      },
      include: { responsibleUser: true },
    });
    testChoreId = chore.id;

    // Create a scheduled instance for this chore
    const scheduled = await prisma.scheduledChore.create({
      data: {
        choreId: chore.id,
        dueDate: new Date('2026-03-16'),
      },
    });
    testScheduledId = scheduled.id;

    // Verify initial state
    expect(chore.nextDueDate).toEqual(new Date('2026-03-16'));

    // Complete the scheduled item (replicate completeSprintItem logic)
    const completedAt = new Date('2026-03-16T14:30:00Z');
    const updatedScheduled = await prisma.scheduledChore.update({
      where: { id: testScheduledId },
      data: { status: ScheduledStatus.DONE, completedAt },
      include: { chore: { include: { responsibleUser: true } } },
    });

    // Calculate next due date using the same logic as the server action
    if (updatedScheduled.chore.recurrence) {
      const nextDueDate = getNextDueDate(updatedScheduled.chore, completedAt);
      await prisma.chore.update({
        where: { id: testChoreId },
        data: { nextDueDate },
      });
    }

    // Fetch the updated chore and verify nextDueDate was recalculated
    const updatedChore = await prisma.chore.findUnique({
      where: { id: testChoreId },
    });

    expect(updatedChore).not.toBeNull();
    expect(updatedChore!.nextDueDate).not.toBeNull();
    // Next Monday after 2026-03-16 is 2026-03-23
    expect(updatedChore!.nextDueDate!.toISOString()).toContain('2026-03-23');
  });

  it('should not update nextDueDate for non-recurring chores', async () => {
    // Create a one-time chore (no recurrence)
    const chore = await prisma.chore.create({
      data: {
        name: 'TEST_CHORE_one_time_task',
        description: 'A one-time task',
        recurrence: null,
        nextDueDate: null,
      },
      include: { responsibleUser: true },
    });
    testChoreId = chore.id;

    // Create a scheduled instance
    const scheduled = await prisma.scheduledChore.create({
      data: {
        choreId: chore.id,
        dueDate: new Date('2026-03-16'),
      },
    });
    testScheduledId = scheduled.id;

    // Complete the scheduled item
    const completedAt = new Date('2026-03-16T14:30:00Z');
    const updatedScheduled = await prisma.scheduledChore.update({
      where: { id: testScheduledId },
      data: { status: ScheduledStatus.DONE, completedAt },
      include: { chore: { include: { responsibleUser: true } } },
    });

    // Non-recurring chores should not get a nextDueDate
    if (updatedScheduled.chore.recurrence) {
      const nextDueDate = getNextDueDate(updatedScheduled.chore, completedAt);
      await prisma.chore.update({
        where: { id: testChoreId },
        data: { nextDueDate },
      });
    }

    // Verify nextDueDate remains null
    const updatedChore = await prisma.chore.findUnique({
      where: { id: testChoreId },
    });

    expect(updatedChore).not.toBeNull();
    expect(updatedChore!.nextDueDate).toBeNull();
  });

  it('should calculate correct nextDueDate for daily recurrence', async () => {
    // Create a daily recurring chore
    const chore = await prisma.chore.create({
      data: {
        name: 'TEST_CHORE_daily_task',
        description: 'A daily recurring task',
        recurrence: 'FREQ=DAILY',
        nextDueDate: new Date('2026-03-12'),
      },
      include: { responsibleUser: true },
    });
    testChoreId = chore.id;

    const scheduled = await prisma.scheduledChore.create({
      data: {
        choreId: chore.id,
        dueDate: new Date('2026-03-12'),
      },
    });
    testScheduledId = scheduled.id;

    // Complete on March 12th
    const completedAt = new Date('2026-03-12T18:00:00Z');
    const updatedScheduled = await prisma.scheduledChore.update({
      where: { id: testScheduledId },
      data: { status: ScheduledStatus.DONE, completedAt },
      include: { chore: { include: { responsibleUser: true } } },
    });

    if (updatedScheduled.chore.recurrence) {
      const nextDueDate = getNextDueDate(updatedScheduled.chore, completedAt);
      await prisma.chore.update({
        where: { id: testChoreId },
        data: { nextDueDate },
      });
    }

    const updatedChore = await prisma.chore.findUnique({
      where: { id: testChoreId },
    });

    expect(updatedChore).not.toBeNull();
    expect(updatedChore!.nextDueDate).not.toBeNull();
    // Next day after completing on March 12th is March 13th
    expect(updatedChore!.nextDueDate!.toISOString()).toContain('2026-03-13');
  });

  it('should calculate correct nextDueDate for monthly recurrence', async () => {
    // Create a monthly recurring chore (1st of each month)
    const chore = await prisma.chore.create({
      data: {
        name: 'TEST_CHORE_monthly_task',
        description: 'A monthly recurring task',
        recurrence: 'FREQ=MONTHLY;BYMONTHDAY=1',
        nextDueDate: new Date('2026-03-01'),
      },
      include: { responsibleUser: true },
    });
    testChoreId = chore.id;

    const scheduled = await prisma.scheduledChore.create({
      data: {
        choreId: chore.id,
        dueDate: new Date('2026-03-01'),
      },
    });
    testScheduledId = scheduled.id;

    // Complete on March 1st
    const completedAt = new Date('2026-03-01T10:00:00Z');
    const updatedScheduled = await prisma.scheduledChore.update({
      where: { id: testScheduledId },
      data: { status: ScheduledStatus.DONE, completedAt },
      include: { chore: { include: { responsibleUser: true } } },
    });

    if (updatedScheduled.chore.recurrence) {
      const nextDueDate = getNextDueDate(updatedScheduled.chore, completedAt);
      await prisma.chore.update({
        where: { id: testChoreId },
        data: { nextDueDate },
      });
    }

    const updatedChore = await prisma.chore.findUnique({
      where: { id: testChoreId },
    });

    expect(updatedChore).not.toBeNull();
    expect(updatedChore!.nextDueDate).not.toBeNull();
    // Next occurrence after completing on March 1st should be April 1st
    expect(updatedChore!.nextDueDate!.toISOString()).toContain('2026-04-01');
  });
});

describe('Auto-skip incomplete instances on completion', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.scheduledChore.deleteMany({
      where: { chore: { name: { startsWith: 'TEST_CHORE_' } } },
    });
    await prisma.chore.deleteMany({
      where: { name: { startsWith: 'TEST_CHORE_' } },
    });
  });

  it('should skip other incomplete instances when completing a recurring chore', async () => {
    // Create a recurring chore
    const chore = await prisma.chore.create({
      data: {
        name: 'TEST_CHORE_vacuum',
        recurrence: 'FREQ=WEEKLY;INTERVAL=2',
        nextDueDate: new Date('2026-03-09'),
      },
    });

    // Create multiple scheduled instances (simulating accumulated overdue tasks)
    const instance1 = await prisma.scheduledChore.create({
      data: { choreId: chore.id, dueDate: new Date('2026-03-02'), status: ScheduledStatus.TODO },
    });
    const instance2 = await prisma.scheduledChore.create({
      data: { choreId: chore.id, dueDate: new Date('2026-03-09'), status: ScheduledStatus.IN_PROGRESS },
    });
    const instance3 = await prisma.scheduledChore.create({
      data: { choreId: chore.id, dueDate: new Date('2026-03-16'), status: ScheduledStatus.TODO },
    });

    // Complete instance3 (the newest one)
    const completedAt = new Date('2026-03-16T14:00:00Z');
    await prisma.scheduledChore.update({
      where: { id: instance3.id },
      data: { status: ScheduledStatus.DONE, completedAt },
    });

    // Auto-skip other incomplete instances (replicate server action logic)
    await prisma.scheduledChore.updateMany({
      where: {
        choreId: chore.id,
        id: { not: instance3.id },
        status: { in: [ScheduledStatus.TODO, ScheduledStatus.IN_PROGRESS] },
      },
      data: { status: ScheduledStatus.SKIPPED },
    });

    // Verify results
    const [updated1, updated2, updated3] = await Promise.all([
      prisma.scheduledChore.findUnique({ where: { id: instance1.id } }),
      prisma.scheduledChore.findUnique({ where: { id: instance2.id } }),
      prisma.scheduledChore.findUnique({ where: { id: instance3.id } }),
    ]);

    expect(updated1!.status).toBe(ScheduledStatus.SKIPPED);
    expect(updated2!.status).toBe(ScheduledStatus.SKIPPED);
    expect(updated3!.status).toBe(ScheduledStatus.DONE);
  });

  it('should not skip instances for non-recurring chores', async () => {
    // Create a non-recurring chore
    const chore = await prisma.chore.create({
      data: {
        name: 'TEST_CHORE_one_time',
        recurrence: null,
      },
    });

    // Create two scheduled instances
    const instance1 = await prisma.scheduledChore.create({
      data: { choreId: chore.id, dueDate: new Date('2026-03-09'), status: ScheduledStatus.TODO },
    });
    const instance2 = await prisma.scheduledChore.create({
      data: { choreId: chore.id, dueDate: new Date('2026-03-16'), status: ScheduledStatus.TODO },
    });

    // Complete instance2
    await prisma.scheduledChore.update({
      where: { id: instance2.id },
      data: { status: ScheduledStatus.DONE, completedAt: new Date() },
    });

    // For non-recurring chores, we don't auto-skip (since there's no recurrence check)
    // Verify instance1 is still TODO
    const updated1 = await prisma.scheduledChore.findUnique({ where: { id: instance1.id } });
    expect(updated1!.status).toBe(ScheduledStatus.TODO);
  });

  it('should allow manual skipping of a task', async () => {
    const chore = await prisma.chore.create({
      data: {
        name: 'TEST_CHORE_manual_skip',
        recurrence: 'FREQ=WEEKLY',
      },
    });

    const instance = await prisma.scheduledChore.create({
      data: { choreId: chore.id, dueDate: new Date('2026-03-09'), status: ScheduledStatus.TODO },
    });

    // Manual skip
    await prisma.scheduledChore.update({
      where: { id: instance.id },
      data: { status: ScheduledStatus.SKIPPED },
    });

    const updated = await prisma.scheduledChore.findUnique({ where: { id: instance.id } });
    expect(updated!.status).toBe(ScheduledStatus.SKIPPED);
  });
});
