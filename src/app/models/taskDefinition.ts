import { Status } from "@prisma/client";

interface TaskBase {
  id: number;
}

export interface TaskDefinition extends TaskBase {
  type: 'definition';
  name: string;
  description?: string | null;
  recurrence?: string | null;
  createdAt: Date;
  status: Status | null;
  lastCompletedTask?: Task | null;
  nextInstanceDate?: Date | null; // Optional, calculated from recurrence
}

export interface Task extends TaskBase {
  type: 'task';
  taskDefinitionId: number;
  taskDefinition?: TaskDefinition;
  createdAt?: Date;
  completedAt?: Date;
}

export type AllTasks = TaskDefinition | Task;

export interface Sprint {
  start: Date;
  taskDefinitions: TaskDefinition[];
  doneTasks: Task[];
}