"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { Chore, Sprint } from "../models/chore";
import { mapToChore, buildSprintItems } from "../models/mappers";
import { Status, User } from "@prisma/client";
import { cache } from "react";

export async function saveChore(formData: FormData) {
  const id = formData.get("id") as string | undefined;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | undefined;
  const recurrence = formData.get("recurrence") as string | undefined;
  const responsibleUserId = formData.get("responsibleUserId") as string | undefined;
  if (!name) return;
  
  const data = {
    name,
    description: description || undefined,
    recurrence: recurrence || undefined,
    responsibleUserId: responsibleUserId ? parseInt(responsibleUserId) : undefined,
  };
  
  let result;
  if (id) {
    result = await prisma.chore.update({
      where: { id: parseInt(id) },
      data,
      include: { responsibleUser: true },
    });
  } else {
    result = await prisma.chore.create({
      data,
      include: { responsibleUser: true },
    });
  }
  revalidatePath("/chores");
  return mapToChore(result);
}

export async function getAllChores(): Promise<Chore[]> {
  const chores = await prisma.chore.findMany({
    include: { responsibleUser: true },
    where: { deletedAt: null },
  });
  return chores.map((c) => mapToChore(c));
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getSprint(searchParams?: { weekStart?: Date }): Promise<Sprint> {
  const weekStart = searchParams?.weekStart ? getMonday(searchParams.weekStart) : getMonday(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const chores = await prisma.chore.findMany({
    where: { deletedAt: null },
    include: { responsibleUser: true },
  });

  const scheduled = await prisma.scheduledChore.findMany({
    where: {
      OR: [
        { dueDate: { gte: weekStart, lt: weekEnd } },
        { completedAt: { gte: weekStart, lt: weekEnd } },
        { dueDate: null, completedAt: null },
      ],
    },
    include: {
      chore: { include: { responsibleUser: true } },
    },
  });

  const items = buildSprintItems(chores, scheduled, weekStart, weekEnd);

  return {
    start: weekStart,
    items,
  };
}

export async function createSprintItem(
  choreId: number,
  dueDate: Date | null,
  status: Status
): Promise<number> {
  const record = await prisma.scheduledChore.create({
    data: { choreId, dueDate, status },
  });
  revalidatePath("/chores");
  return record.id;
}

export async function updateSprintItemStatus(id: number, status: Status) {
  await prisma.scheduledChore.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/chores");
}

export async function completeSprintItem(id: number, completedAt: Date = new Date()) {
  await prisma.scheduledChore.update({
    where: { id },
    data: { completedAt },
  });
  revalidatePath("/chores");
}

export async function quickComplete(choreId: number, completedAt: Date = new Date()) {
  await prisma.scheduledChore.create({
    data: { choreId, dueDate: null, status: Status.TODAY, completedAt },
  });
  revalidatePath("/chores");
}

export async function uncompleteSprintItem(id: number, newStatus: Status) {
  await prisma.scheduledChore.update({
    where: { id },
    data: { completedAt: null, status: newStatus },
  });
  revalidatePath("/chores");
}

export async function deleteSprintItem(id: number) {
  await prisma.scheduledChore.delete({ where: { id } });
  revalidatePath("/chores");
}

export async function deleteChore(id: number) {
  await prisma.chore.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/chores");
}

export const getUsers = cache(async (): Promise<User[]> => {
  return await prisma.user.findMany();
});
