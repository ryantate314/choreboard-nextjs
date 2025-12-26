import { Status, User } from "@prisma/client";

interface ChoreBase {
  id: number;
}

/**
 * Represents a chore template/definition.
 * Renamed from TaskDefinition.
 */
export interface Chore extends ChoreBase {
  type: 'chore';
  name: string;
  description: string | null;
  recurrence: string | null;
  createdAt: Date;
  status: Status | null;
  responsibleUserId: number | null;
  responsibleUser: User | null;

  // Computed/included fields
  lastCompletion: ChoreCompletion | null;
  nextDueDate: Date | null;
}

/**
 * Represents a completion record for a chore.
 * Renamed from Task.
 */
export interface ChoreCompletion extends ChoreBase {
  type: 'completion';
  choreId: number;
  chore?: Chore;
  createdAt?: Date;
  completedAt: Date;
  completedById?: number | null;
  completedBy?: User | null;
}

/**
 * Union type for items that can be displayed/interacted with.
 */
export type AllChores = Chore | ChoreCompletion;

/**
 * Represents a weekly sprint/planning window.
 */
export interface Sprint {
  start: Date;
  chores: Chore[];
  completions: ChoreCompletion[];
}

/**
 * Valid status transitions:
 *
 * For recurring chores:
 *   BACKLOG <-> THIS_WEEK <-> TODAY -> DONE (creates completion, resets to BACKLOG)
 *
 * For one-time chores:
 *   null -> BACKLOG <-> THIS_WEEK <-> TODAY -> DONE (sets status to null)
 *   DONE items can be moved back: deletes completion, restores status
 *
 * Deletion:
 *   Any status -> null (soft delete via deletedAt for chores, hard delete for completions)
 */
export const STATUS_TRANSITIONS = {
  BACKLOG: [Status.THIS_WEEK, Status.TODAY, Status.DONE, null],
  THIS_WEEK: [Status.BACKLOG, Status.TODAY, Status.DONE],
  TODAY: [Status.BACKLOG, Status.THIS_WEEK, Status.DONE],
  DONE: [Status.BACKLOG, Status.THIS_WEEK, Status.TODAY],
} as const;
