export enum ScheduledStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  SKIPPED = "SKIPPED",
}

export interface ChoreUser {
  id: number;
  firstName: string;
  lastName: string;
}

/**
 * Represents a chore template/definition.
 */
export interface Chore {
  id: number;
  name: string;
  description: string | null;
  recurrence: string | null;
  nextDueDate: Date | null;
  autoSchedule: boolean;
  createdAt: Date;
  responsibleUserId: number | null;
  responsibleUser: ChoreUser | null;
}

/**
 * Represents a sprint item - a scheduled instance of a chore.
 * Status:
 * - TODO → Grouped by day in sprint view
 * - IN_PROGRESS → In Progress column
 * - DONE → Done column
 * - SKIPPED → Hidden from view
 */
export interface SprintItem {
  id: number | null;
  chore: Chore;
  dueDate: Date | null;
  status: ScheduledStatus;
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
