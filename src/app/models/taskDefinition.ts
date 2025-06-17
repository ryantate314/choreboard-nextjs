import { Status } from "@prisma/client";

export interface TaskDefinition {
  id: number;
  name: string;
  description?: string | null;
  recurrence?: string | null;
  createdAt: Date;
  status: Status | null;
  lastCompletedTask?: Task | null;
  nextInstanceDate?: Date | null; // Optional, calculated from recurrence
}

export interface Task {
  id: number;
  taskDefinitionId: number;
  taskDefinition?: TaskDefinition;
  createdAt?: Date;
  completedAt?: Date;
}

export interface Sprint {
  taskDefinitions: TaskDefinition[];
  doneTasks: Task[];
}