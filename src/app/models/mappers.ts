import { Chore, ScheduledStatus, SprintItem } from "./chore";
import {
  Chore as PrismaChore,
  ScheduledChore as PrismaScheduledChore,
  User,
} from "@prisma/client";
import { RRule } from "rrule";

type ChoreWithUser = PrismaChore & {
  responsibleUser: User | null;
};

type ScheduledChoreWithChore = PrismaScheduledChore & {
  chore: ChoreWithUser;
};

/**
 * Maps a Prisma Chore to the application Chore type.
 */
export function mapToChore(chore: ChoreWithUser): Chore {
  return {
    id: chore.id,
    name: chore.name,
    description: chore.description,
    recurrence: chore.recurrence,
    nextDueDate: chore.nextDueDate,
    autoSchedule: chore.autoSchedule,
    createdAt: chore.createdAt,
    responsibleUserId: chore.responsibleUserId,
    responsibleUser: chore.responsibleUser,
  };
}

/**
 * Maps a Prisma ScheduledChore to a SprintItem.
 */
export function mapToSprintItem(scheduled: ScheduledChoreWithChore): SprintItem {
  return {
    id: scheduled.id,
    chore: mapToChore(scheduled.chore),
    dueDate: scheduled.dueDate,
    status: scheduled.status as ScheduledStatus,
    completedAt: scheduled.completedAt,
    completedById: scheduled.completedById,
    isVirtual: false,
  };
}

/**
 * Calculate the next due date for a chore based on its recurrence rule.
 * Returns the first occurrence AFTER the completion date (next calendar day or later).
 * 
 * For patterns without explicit day anchoring (e.g., FREQ=WEEKLY without BYDAY),
 * the dtstart determines which day of week the pattern runs on. We find a historical
 * date with the same alignment to enable back-dated completions while preserving
 * the expected schedule.
 */
export function getNextDueDate(
  chore: ChoreWithUser,
  lastCompletedAt: Date | null
): Date | null {
  if (!chore.recurrence) return null;
  if (!lastCompletedAt) return chore.createdAt;

  try {
    const options = RRule.parseString(chore.recurrence);
    
    // Find a historical dtstart that preserves the schedule alignment
    // We go back ~50 years to ensure we can handle any back-dated completion
    const anchorDate = chore.nextDueDate ?? chore.createdAt;
    const historicalStart = findHistoricalAlignment(anchorDate, options);
    
    const rule = new RRule({
      ...options,
      dtstart: historicalStart,
    });
    
    // Search from start of the day AFTER completion to ensure we get a future occurrence
    const dayAfterCompletion = new Date(lastCompletedAt);
    dayAfterCompletion.setUTCDate(dayAfterCompletion.getUTCDate() + 1);
    dayAfterCompletion.setUTCHours(0, 0, 0, 0);
    
    return rule.after(dayAfterCompletion, true);
  } catch {
    return null;
  }
}

/**
 * Find a historical date that aligns with the anchor date for the given recurrence options.
 * This allows back-dated completions to work correctly while preserving schedule alignment.
 */
function findHistoricalAlignment(
  anchorDate: Date,
  options: Partial<ReturnType<typeof RRule.parseString>>
): Date {
  // If there's explicit day anchoring (BYDAY, BYMONTHDAY), epoch works fine
  if (options.byweekday || options.bymonthday || options.byyearday) {
    return new Date(0);
  }
  
  // For FREQ=WEEKLY without BYDAY, preserve day-of-week
  // For FREQ=MONTHLY without BYMONTHDAY, preserve day-of-month
  // Go back to 1970 with the same alignment
  const result = new Date(anchorDate);
  result.setUTCFullYear(1970);
  result.setUTCHours(0, 0, 0, 0);
  
  return result;
}

/**
 * Build sprint items from chores and scheduled instances.
 * Combines materialized instances with virtual instances for recurring chores.
 */
export function buildSprintItems(
  chores: ChoreWithUser[],
  scheduledItems: ScheduledChoreWithChore[],
  weekStart: Date,
  weekEnd: Date
): SprintItem[] {
  const items: SprintItem[] = [];
  
  const scheduledByChoreId = new Map<number, ScheduledChoreWithChore[]>();
  for (const scheduled of scheduledItems) {
    const existing = scheduledByChoreId.get(scheduled.choreId) ?? [];
    existing.push(scheduled);
    scheduledByChoreId.set(scheduled.choreId, existing);
  }
  
  for (const scheduled of scheduledItems) {
    items.push(mapToSprintItem(scheduled));
  }
  
  for (const chore of chores) {
    if (!chore.recurrence) continue;
    if (!chore.autoSchedule) continue;
    
    const existingForChore = scheduledByChoreId.get(chore.id) ?? [];
    const hasIncompleteInstance = existingForChore.some(
      s => s.status === ScheduledStatus.TODO || s.status === ScheduledStatus.IN_PROGRESS
    );
    
    if (hasIncompleteInstance) continue;
    
    // Use the stored nextDueDate from the chore, which is updated on completion
    const nextDueDate = chore.nextDueDate;
    
    if (nextDueDate && nextDueDate < weekEnd) {
      items.push({
        id: null,
        chore: mapToChore(chore),
        dueDate: nextDueDate,
        status: ScheduledStatus.TODO,
        completedAt: null,
        completedById: null,
        isVirtual: true,
      });
    }
  }
  
  return items;
}
