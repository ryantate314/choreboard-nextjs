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
 */
export function getNextDueDate(
  chore: ChoreWithUser,
  lastCompletedAt: Date | null
): Date | null {
  if (!chore.recurrence) return null;
  if (!lastCompletedAt) return chore.createdAt;

  try {
    const options = RRule.parseString(chore.recurrence);
    // Use epoch as dtstart so rule generates all possible occurrences
    const rule = new RRule({
      ...options,
      dtstart: new Date(0),
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
