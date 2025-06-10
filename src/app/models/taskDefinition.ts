export interface TaskDefinition {
  id: number;
  name: string;
  description?: string | null;
  recurrence?: string | null;
  createdAt: Date;
  status: string; // Add status property
  lastCompletedTask?: unknown;
  nextInstanceDate?: Date | null; // Optional, calculated from recurrence
}

export interface Task {
  id: number;
  taskDefinitionId: number;
  createdAt: Date;
  completedAt?: Date | null;
}