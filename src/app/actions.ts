"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import { RRule } from "rrule";
import { Sprint, Task, TaskDefinition } from "./models/taskDefinition";
import { Prisma, Status, Task as DataTask } from "@prisma/client";

export async function saveTaskDefinition(formData: FormData) {
  const id = formData.get("id") as string | undefined;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | undefined;
  const recurrence = formData.get("recurrence") as string | undefined;
  if (!name) return;
  let result: TaskDefinitionWithTasks;
  if (id) {
    result = await prisma.taskDefinition.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description: description || undefined,
        recurrence: recurrence || undefined,
      },
      include: {
        Task: true
      }
    });
  } else {
    result = await prisma.taskDefinition.create({
      data: {
        name,
        description: description || undefined,
        recurrence: recurrence || undefined,
        status: recurrence ? Status.BACKLOG : null,
      },
      include: {
        Task: true
      }
    });
  }
  revalidatePath("/");
  return mapTaskDefinition(result);
}

// Define the query shape
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const taskDefinitionWithTasks = Prisma.validator<Prisma.TaskDefinitionInclude>()({
  Task: true,
});

// Infer the type
type TaskDefinitionWithTasks = Prisma.TaskDefinitionGetPayload<{
  include: typeof taskDefinitionWithTasks;
}>;

export async function getAllTaskDefinitions(): Promise<TaskDefinition[]> {
  return await prisma.taskDefinition.findMany({
    include: {
      Task: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1, // Get the most recent task for each definition
      }
    },
    where: {
      deletedAt: null,
    }
  }).then(definitions => definitions.map(d => mapTaskDefinition(d)));
}

function mapTaskDefinition(definition: TaskDefinitionWithTasks): TaskDefinition {
  return {
    ...definition,
    type: 'definition',
    lastCompletedTask: mapTask(definition.Task[0]),
    nextInstanceDate: getNextInstanceDate(definition),
  };
}

function mapTask(task: DataTask | null): Task | null {
  if (task)
    return {
      ...task,
      type: 'task'
    }
  return null;
}

export async function deleteTask(id: number, newStatus?: Status | null) {
  "use server";
  const task = await prisma.task.findFirstOrThrow({
    where: {
      id: id
    }
  });

  await prisma.task.delete({
    where: { id },
  });

  if (newStatus)
    await prisma.taskDefinition.update({
      where: {
        id: task.taskDefinitionId
      },
      data: {
        status: newStatus
      }
    });
  revalidatePath("/");
}

function getNextInstanceDate(taskDefinition: TaskDefinitionWithTasks): Date | null {
  if (!taskDefinition.recurrence) return null;
  if (taskDefinition.Task.length === 0)
    return taskDefinition.createdAt;

  let nextDate;
  const options = RRule.parseString(taskDefinition.recurrence);
  const rule = new RRule({
    ...options,
    dtstart: taskDefinition.Task[0]?.completedAt,
  });
  rule.all((d, len) => {
    nextDate = d;
    return len < 1; // Stop after finding the first future date
  });
  if (!nextDate)
    throw new Error("No next instance found for recurrence rule");
  return nextDate;
}

export async function updateTaskDefinitionStatus(id: number, status: Status | null, completedDate?: Date) {
  "use server";
  const definition = await getTaskDefinition(id);
  if (!definition) return;

  if (status === Status.DONE) {
    await completeTaskDefinition(id, completedDate);
  }
  else {
    await prisma.taskDefinition.update({
      where: { id },
      data: { status },
    });
  }
  revalidatePath("/");
}

async function getTaskDefinition(id: number): Promise<TaskDefinition | null> {
  return await prisma.taskDefinition.findUnique({
    where: { id },
    include: {
      Task: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  }).then(definition => definition ? mapTaskDefinition(definition) : null)
}

export async function completeTaskDefinition(id: number, completedDate?: Date) {
  "use server";
  // Create a new Task for this definition
  const taskDef = await getTaskDefinition(id);
  if (!taskDef) return;
  await prisma.task.create({
    data: {
      taskDefinitionId: id,
      completedAt: completedDate ?? new Date(),
    },
  });
  // Set status back to BACKLOG
  await prisma.taskDefinition.update({
    where: { id },
    data: {
      // Set status to null for one-off tasks
      status: taskDef.recurrence ? Status.BACKLOG : null
    },
  });
  revalidatePath("/");
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getSprint(searchParams?: { weekStart?: Date }): Promise<Sprint> {
  // Determine week start
  const weekStart = searchParams?.weekStart ? getMonday(searchParams.weekStart) : getMonday(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Get all task definitions (with their most recent task)
  const definitions = await prisma.taskDefinition.findMany({
    include: {
      Task: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    where: {
      OR: [
        { status: { not: null } }, // One-off tasks which have been assigned to a sprint
        { recurrence: { not: null } }, // Recurring task
      ]
    }
  }).then(taskDefinitions => taskDefinitions.map(t => mapTaskDefinition(t)));

  // Get all completed tasks (with their definition) for the week
  const doneTasks = await prisma.task.findMany({
    where: {
      completedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    include: { taskDefinition: true },
    orderBy: { completedAt: "desc" },
  }).then(tasks => tasks.map(task => mapTask(task)!));

  return {
    start: weekStart,
    taskDefinitions: definitions,
    doneTasks
  };
}

export async function deleteTaskDefinition(id: number) {
  "use server";
  await prisma.taskDefinition.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
  revalidatePath("/");
}