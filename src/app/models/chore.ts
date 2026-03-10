import { OverdueAction as PrismaOverdueAction, User } from "@prisma/client";

export type OverdueAction = PrismaOverdueAction;

/**
 * Represents a chore template/definition.
 */
export interface Chore {
  id: number;
  name: string;
  description: string | null;
  recurrence: string | null;
  nextDueDate: Date | null;
  overdueAction: OverdueAction;
  autoSchedule: boolean;
  createdAt: Date;
  responsibleUserId: number | null;
  responsibleUser: User | null;
}

/**
 * Represents a sprint item - a scheduled instance of a chore.
 * State derivation:
 * - startedAt = null, completedAt = null → TODO (grouped by day)
 * - startedAt set, completedAt = null → In Progress
 * - completedAt set → Done
 */
export interface SprintItem {
  id: number | null;
  chore: Chore;
  dueDate: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  completedById: number | null;
  isVirtual: boolean;
}

/**
 * Represents a weekly sprint/planning window.
 */
export interface Sprint {
  start: Date;
  items: SprintItem[];
}
