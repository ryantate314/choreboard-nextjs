import { Chore, SprintItem } from "./chore";
import {
  Chore as PrismaChore,
  ScheduledChore as PrismaScheduledChore,
  Status,
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
    status: scheduled.status,
    completedAt: scheduled.completedAt,
    completedById: scheduled.completedById,
    isVirtual: false,
  };
}

/**
 * Calculate the next due date for a chore based on its recurrence rule.
 * Uses the most recent completion from scheduled items if available.
 */
export function getNextDueDate(
  chore: ChoreWithUser,
  lastCompletedAt: Date | null
): Date | null {
  if (!chore.recurrence) return null;
  if (!lastCompletedAt) return chore.createdAt;

  try {
    const options = RRule.parseString(chore.recurrence);
    const rule = new RRule({
      ...options,
      dtstart: lastCompletedAt,
    });
    
    let nextDate: Date | undefined;
    rule.all((d, len) => {
      nextDate = d;
      return len < 1;
    });
    
    return nextDate ?? null;
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
    
    const existingForChore = scheduledByChoreId.get(chore.id) ?? [];
    const hasIncompleteInstance = existingForChore.some(s => !s.completedAt);
    
    if (hasIncompleteInstance) continue;
    
    const lastCompletedAt = findLastCompletedAt(existingForChore);
    const nextDueDate = getNextDueDate(chore, lastCompletedAt);
    
    if (nextDueDate && nextDueDate < weekEnd) {
      items.push({
        id: null,
        chore: mapToChore(chore),
        dueDate: nextDueDate,
        status: Status.BACKLOG,
        completedAt: null,
        completedById: null,
        isVirtual: true,
      });
    }
  }
  
  return items;
}

function findLastCompletedAt(scheduled: ScheduledChoreWithChore[]): Date | null {
  let latest: Date | null = null;
  for (const s of scheduled) {
    if (s.completedAt && (!latest || s.completedAt > latest)) {
      latest = s.completedAt;
    }
  }
  return latest;
}
