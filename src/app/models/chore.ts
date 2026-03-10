import { Status, User } from "@prisma/client";

/**
 * Represents a chore template/definition.
 */
export interface Chore {
  id: number;
  name: string;
  description: string | null;
  recurrence: string | null;
  createdAt: Date;
  responsibleUserId: number | null;
  responsibleUser: User | null;
}

/**
 * Represents a sprint item - a scheduled instance of a chore.
 * This is the unified type used in ALL Kanban columns.
 */
export interface SprintItem {
  id: number | null;
  chore: Chore;
  dueDate: Date | null;
  status: Status;
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
