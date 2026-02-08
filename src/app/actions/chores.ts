"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { Chore, Sprint } from "../models/chore";
import { mapToChore, mapToCompletion } from "../models/mappers";
import { Prisma, Status, User } from "@prisma/client";
import { cache } from "react";

// Define the query shape for Chore with completions
type ChoreWithCompletions = Prisma.ChoreGetPayload<{
  include: {
    ChoreCompletion: true;
    responsibleUser: true;
  };
}>;

export async function saveChore(formData: FormData) {
  const id = formData.get("id") as string | undefined;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | undefined;
  const recurrence = formData.get("recurrence") as string | undefined;
  const responsibleUserId = formData.get("responsibleUserId") as string | undefined;
  if (!name) return;
  let result: ChoreWithCompletions;
  if (id) {
    result = await prisma.chore.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description: description || undefined,
        recurrence: recurrence || undefined,
        responsibleUserId: responsibleUserId ? parseInt(responsibleUserId) : undefined,
      },
      include: {
        ChoreCompletion: true,
        responsibleUser: true,
      },
    });
  } else {
    result = await prisma.chore.create({
      data: {
        name,
        description: description || undefined,
        recurrence: recurrence || undefined,
        responsibleUserId: responsibleUserId ? parseInt(responsibleUserId) : undefined,
        status: recurrence ? Status.BACKLOG : null,
      },
      include: {
        ChoreCompletion: true,
        responsibleUser: true,
      },
    });
  }
  revalidatePath("/chores");
  return mapToChore(result);
}

export async function getAllChores(): Promise<Chore[]> {
  const chores = await prisma.chore.findMany({
    include: {
      ChoreCompletion: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1, // Get the most recent completion for each chore
      },
      responsibleUser: true,
    },
    where: {
      deletedAt: null,
    },
  });
  return chores.map((c) => mapToChore(c));
}

export async function deleteCompletion(id: number, newStatus?: Status | null) {
  const completion = await prisma.choreCompletion.findFirstOrThrow({
    where: {
      id: id,
    },
  });

  await prisma.choreCompletion.delete({
    where: { id },
  });

  if (newStatus)
    await prisma.chore.update({
      where: {
        id: completion.choreId,
      },
      data: {
        status: newStatus,
      },
    });
  revalidatePath("/chores");
}

async function getChore(id: number): Promise<Chore | null> {
  const chore = await prisma.chore.findUnique({
    where: { id },
    include: {
      ChoreCompletion: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      responsibleUser: true,
    },
  });
  return chore ? mapToChore(chore) : null;
}

export async function updateChoreStatus(id: number, status: Status | null, completedDate?: Date) {
  const chore = await getChore(id);
  if (!chore) return;

  if (status === Status.DONE) {
    await completeChore(id, completedDate);
  } else {
    await prisma.chore.update({
      where: { id },
      data: { status },
    });
  }
  revalidatePath("/chores");
}

export async function completeChore(id: number, completedDate?: Date) {
  // Create a new ChoreCompletion for this chore
  const chore = await getChore(id);
  if (!chore) return;
  await prisma.choreCompletion.create({
    data: {
      choreId: id,
      completedAt: completedDate ?? new Date(),
    },
  });
  // Set status back to BACKLOG for recurring, null for one-off
  await prisma.chore.update({
    where: { id },
    data: {
      status: chore.recurrence ? Status.BACKLOG : null,
    },
  });
  revalidatePath("/chores");
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

  // Get all chores (with their most recent completion)
  const choreRecords = await prisma.chore.findMany({
    include: {
      ChoreCompletion: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      responsibleUser: true,
    },
    where: {
      OR: [
        { status: { not: null } }, // One-off chores which have been assigned to a sprint
        { recurrence: { not: null } }, // Recurring chores
      ],
    },
  });
  const chores = choreRecords.map((c) => mapToChore(c));

  // Get all completions for the week
  const completionRecords = await prisma.choreCompletion.findMany({
    where: {
      completedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    include: { chore: true },
    orderBy: { completedAt: "desc" },
  });
  const completions = completionRecords.map((c) => mapToCompletion(c));

  return {
    start: weekStart,
    chores,
    completions,
  };
}

export async function deleteChore(id: number) {
  await prisma.chore.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
  revalidatePath("/chores");
}

export const getUsers = cache(async (): Promise<User[]> => {
  return await prisma.user.findMany();
});
