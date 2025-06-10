"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import { RRule } from "rrule";
import { TaskDefinition } from "./models/taskDefinition";
import { Prisma, Status } from "@prisma/client";

export async function createTaskDefinition(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | undefined;
  const recurrence = formData.get("recurrence") as string | undefined;
  if (!name) return;
  await prisma.taskDefinition.create({
    data: {
      name,
      description: description || undefined,
      recurrence: recurrence || undefined,
    },
  });
  revalidatePath("/");
}

// Define the query shape
const taskDefinitionWithTasks = Prisma.validator<Prisma.TaskDefinitionInclude>()({
  Task: true,
});

// Infer the type
type TaskDefinitionWithTasks = Prisma.TaskDefinitionGetPayload<{
  include: typeof taskDefinitionWithTasks;
}>;

export async function getTaskDefinitions(): Promise<TaskDefinition[]> {
  return await prisma.taskDefinition.findMany({
    include: {
      Task: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1, // Get the most recent task for each definition
      }
    }
  }).then(definitions => definitions.map(d => ({
    id: d.id,
    name: d.name,
    description: d.description,
    recurrence: d.recurrence,
    createdAt: d.createdAt,
    lastCompletedTask: d.Task[0] ?? null,
    status: d.status,
    nextInstanceDate: getNextInstanceDate(d as TaskDefinitionWithTasks),
  } satisfies TaskDefinition)));
}

function getNextInstanceDate(taskDefinition: TaskDefinitionWithTasks): Date | null {
  if (!taskDefinition.recurrence) return null;
  if (taskDefinition.Task.length === 0)
    return taskDefinition.createdAt;

  const rule = RRule.fromString(taskDefinition.recurrence);
  let nextDate;
  rule.options.dtstart = taskDefinition.Task[0]?.createdAt;
  rule.all((d, len) => {
    nextDate = d;
    return len < 1; // Stop after finding the first future date
  });
  if (!nextDate)
    throw new Error("No next instance found for recurrence rule");
  return nextDate;
}

export async function updateTaskDefinitionStatus(id: number, status: Status) {
  "use server";
  await prisma.taskDefinition.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/");
}

export async function completeTaskDefinition(id: number) {
  "use server";
  // Create a new Task for this definition
  const taskDef = await prisma.taskDefinition.findUnique({ where: { id } });
  if (!taskDef) return;
  await prisma.task.create({
    data: {
      taskDefinitionId: id,
      completedAt: new Date(),
    },
  });
  // Set status back to BACKLOG
  await prisma.taskDefinition.update({
    where: { id },
    data: { status: Status.BACKLOG },
  });
  revalidatePath("/");
}