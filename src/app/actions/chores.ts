"use server";

import { prisma } from "../prisma";
import { revalidatePath, unstable_noStore } from "next/cache";
import { Chore, Sprint } from "../models/chore";
import { mapToChore, buildSprintItems, getNextDueDate } from "../models/mappers";
import { User, ScheduledStatus } from "@prisma/client";
import { cache } from "react";
import { RRule } from "rrule";

export async function saveChore(formData: FormData) {
  const id = formData.get("id") as string | undefined;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | undefined;
  const recurrence = formData.get("recurrence") as string | undefined;
  const responsibleUserId = formData.get("responsibleUserId") as string | undefined;
  const autoSchedule = formData.get("autoSchedule") === "true";
  if (!name) return;
  
  // Calculate nextDueDate upfront if recurrence is set (required by DB constraint)
  let nextDueDate: Date | null = null;
  if (recurrence) {
    const tempChore = {
      recurrence,
      createdAt: new Date(),
    } as Parameters<typeof getNextDueDate>[0];
    nextDueDate = getNextDueDate(tempChore, null);
  }
  
  const data: {
    name: string;
    description?: string;
    recurrence?: string;
    responsibleUserId?: number;
    autoSchedule?: boolean;
    nextDueDate?: Date | null;
  } = {
    name,
    description: description || undefined,
    recurrence: recurrence || undefined,
    responsibleUserId: responsibleUserId ? parseInt(responsibleUserId) : undefined,
    autoSchedule,
    nextDueDate,
  };
  
  let result;
  if (id) {
    // For updates, recalculate nextDueDate if recurrence changed
    const existing = await prisma.chore.findUnique({ where: { id: parseInt(id) } });
    if (existing && recurrence !== existing.recurrence) {
      data.nextDueDate = nextDueDate;
    }
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
  revalidatePath("/chores/backlog");
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
  unstable_noStore();
  
  const weekStart = searchParams?.weekStart ? getMonday(searchParams.weekStart) : getMonday(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const chores = await prisma.chore.findMany({
    where: { deletedAt: null },
    include: { responsibleUser: true },
  });

  const scheduled = await prisma.scheduledChore.findMany({
    where: {
      status: { in: [ScheduledStatus.TODO, ScheduledStatus.IN_PROGRESS, ScheduledStatus.DONE] },
      OR: [
        { dueDate: { gte: weekStart, lt: weekEnd } },
        { completedAt: { gte: weekStart, lt: weekEnd } },
        { dueDate: null, status: { in: [ScheduledStatus.TODO, ScheduledStatus.IN_PROGRESS] } },
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
  dueDate: Date | null
): Promise<number> {
  const record = await prisma.scheduledChore.create({
    data: { choreId, dueDate },
  });
  revalidatePath("/chores");
  revalidatePath("/chores/backlog");
  return record.id;
}

export async function updateSprintItemDueDate(id: number, dueDate: Date | null) {
  await prisma.scheduledChore.update({
    where: { id },
    data: { dueDate },
  });
  revalidatePath("/chores");
  revalidatePath("/chores/backlog");
}

export async function startSprintItem(id: number) {
  await prisma.scheduledChore.update({
    where: { id },
    data: { status: ScheduledStatus.IN_PROGRESS },
  });
  revalidatePath("/chores");
}

export async function unstartSprintItem(id: number) {
  await prisma.scheduledChore.update({
    where: { id },
    data: { status: ScheduledStatus.TODO },
  });
  revalidatePath("/chores");
}

export async function completeSprintItem(id: number, completedAt: Date = new Date()) {
  const scheduled = await prisma.scheduledChore.update({
    where: { id },
    data: { status: ScheduledStatus.DONE, completedAt },
    include: { chore: { include: { responsibleUser: true } } },
  });
  
  // Auto-skip older incomplete instances for recurring chores
  if (scheduled.chore.recurrence) {
    await prisma.scheduledChore.updateMany({
      where: {
        choreId: scheduled.choreId,
        id: { not: id },
        status: { in: [ScheduledStatus.TODO, ScheduledStatus.IN_PROGRESS] },
      },
      data: { status: ScheduledStatus.SKIPPED },
    });
    
    const nextDueDate = getNextDueDate(scheduled.chore, completedAt);
    await prisma.chore.update({
      where: { id: scheduled.choreId },
      data: { nextDueDate },
    });
  }
  
  revalidatePath("/chores");
  revalidatePath("/chores/backlog");
}

export async function quickComplete(choreId: number, completedAt: Date = new Date()) {
  const scheduled = await prisma.scheduledChore.create({
    data: { choreId, dueDate: completedAt, status: ScheduledStatus.DONE, completedAt },
    include: { chore: { include: { responsibleUser: true } } },
  });
  
  // Auto-skip older incomplete instances for recurring chores
  if (scheduled.chore.recurrence) {
    await prisma.scheduledChore.updateMany({
      where: {
        choreId,
        id: { not: scheduled.id },
        status: { in: [ScheduledStatus.TODO, ScheduledStatus.IN_PROGRESS] },
      },
      data: { status: ScheduledStatus.SKIPPED },
    });
    
    const nextDueDate = getNextDueDate(scheduled.chore, completedAt);
    await prisma.chore.update({
      where: { id: choreId },
      data: { nextDueDate },
    });
  }
  
  revalidatePath("/chores");
  revalidatePath("/chores/backlog");
}

export async function uncompleteSprintItem(id: number) {
  const scheduled = await prisma.scheduledChore.update({
    where: { id },
    data: { status: ScheduledStatus.TODO, completedAt: null },
    include: { chore: { include: { responsibleUser: true } } },
  });
  
  if (scheduled.chore.recurrence) {
    const lastCompleted = await prisma.scheduledChore.findFirst({
      where: { choreId: scheduled.choreId, status: ScheduledStatus.DONE },
      orderBy: { completedAt: "desc" },
    });
    const nextDueDate = getNextDueDate(scheduled.chore, lastCompleted?.completedAt ?? null);
    await prisma.chore.update({
      where: { id: scheduled.choreId },
      data: { nextDueDate },
    });
  }
  
  revalidatePath("/chores");
  revalidatePath("/chores/backlog");
}

export async function skipSprintItem(id: number) {
  await prisma.scheduledChore.update({
    where: { id },
    data: { status: ScheduledStatus.SKIPPED },
  });
  revalidatePath("/chores");
  revalidatePath("/chores/backlog");
}

export async function deleteSprintItem(id: number) {
  await prisma.scheduledChore.delete({ where: { id } });
  revalidatePath("/chores");
  revalidatePath("/chores/backlog");
}

export async function deleteChore(id: number) {
  await prisma.chore.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/chores");
  revalidatePath("/chores/backlog");
}

export interface BacklogChore extends Chore {
  daysUntilDue: number | null;
  hasIncompleteInstance: boolean;
}

export async function getBacklogData(): Promise<BacklogChore[]> {
  const chores = await prisma.chore.findMany({
    where: { deletedAt: null },
    include: { responsibleUser: true },
  });
  
  const incompleteScheduled = await prisma.scheduledChore.findMany({
    where: { status: { in: [ScheduledStatus.TODO, ScheduledStatus.IN_PROGRESS] } },
    select: { choreId: true },
  });
  const choreIdsWithIncomplete = new Set(incompleteScheduled.map(s => s.choreId));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const backlogChores: BacklogChore[] = chores.map(chore => {
    const mapped = mapToChore(chore);
    let daysUntilDue: number | null = null;
    
    if (mapped.nextDueDate) {
      const dueDate = new Date(mapped.nextDueDate);
      dueDate.setHours(0, 0, 0, 0);
      daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return {
      ...mapped,
      daysUntilDue,
      hasIncompleteInstance: choreIdsWithIncomplete.has(chore.id),
    };
  });
  
  backlogChores.sort((a, b) => {
    if (a.daysUntilDue === null && b.daysUntilDue === null) return 0;
    if (a.daysUntilDue === null) return 1;
    if (b.daysUntilDue === null) return 1;
    return a.daysUntilDue - b.daysUntilDue;
  });
  
  return backlogChores;
}

export interface SprintWeek {
  weekStart: Date;
  weekEnd: Date;
  itemCount: number;
}

export async function getSprintWeeks(): Promise<SprintWeek[]> {
  const currentWeekStart = getMonday(new Date());
  
  const scheduled = await prisma.scheduledChore.findMany({
    where: {
      dueDate: { not: null },
      status: { in: [ScheduledStatus.TODO, ScheduledStatus.IN_PROGRESS] },
    },
    select: { dueDate: true },
  });
  
  const weekMap = new Map<string, number>();
  
  const currentKey = currentWeekStart.toISOString();
  weekMap.set(currentKey, 0);
  
  for (const item of scheduled) {
    if (!item.dueDate) continue;
    const weekStart = getMonday(item.dueDate);
    const key = weekStart.toISOString();
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
  }
  
  const weeks: SprintWeek[] = [];
  for (const [key, count] of weekMap) {
    const weekStart = new Date(key);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weeks.push({ weekStart, weekEnd, itemCount: count });
  }
  
  weeks.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  
  return weeks;
}

function getDayOfWeekFromRRule(recurrence: string): number | null {
  try {
    const options = RRule.parseString(recurrence);
    if (options.byweekday) {
      const byweekday = Array.isArray(options.byweekday) 
        ? options.byweekday 
        : [options.byweekday];
      if (byweekday.length > 0) {
        const firstDay = byweekday[0];
        if (typeof firstDay === "number") {
          return (firstDay + 1) % 7;
        }
        return ((firstDay as { weekday: number }).weekday + 1) % 7;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function scheduleChoreToSprint(choreId: number, weekStart: Date): Promise<number> {
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: { responsibleUser: true },
  });
  
  if (!chore) throw new Error("Chore not found");
  
  const weekStartDate = getMonday(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 7);
  
  let dueDate: Date;
  
  if (chore.nextDueDate && chore.nextDueDate >= weekStartDate && chore.nextDueDate < weekEndDate) {
    dueDate = chore.nextDueDate;
  } else if (chore.recurrence) {
    const dayOfWeek = getDayOfWeekFromRRule(chore.recurrence);
    if (dayOfWeek !== null) {
      dueDate = new Date(weekStartDate);
      const currentDay = dueDate.getDay();
      const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
      dueDate.setDate(dueDate.getDate() + daysToAdd);
    } else {
      dueDate = weekStartDate;
    }
  } else {
    dueDate = weekStartDate;
  }
  
  const record = await prisma.scheduledChore.create({
    data: { choreId, dueDate },
  });
  
  revalidatePath("/chores");
  revalidatePath("/chores/backlog");
  return record.id;
}

export const getUsers = cache(async (): Promise<User[]> => {
  return await prisma.user.findMany();
});

export interface UserExport {
  firstName: string;
  lastName: string;
}

export interface ChoreExport {
  name: string;
  description: string | null;
  recurrence: string | null;
  nextDueDate: string | null;
  autoSchedule: boolean;
  responsibleUser: UserExport | null;
}

export async function exportChoreDefinitions(): Promise<ChoreExport[]> {
  const chores = await prisma.chore.findMany({
    where: { deletedAt: null },
    include: { responsibleUser: true },
  });

  return chores.map((chore) => ({
    name: chore.name,
    description: chore.description,
    recurrence: chore.recurrence,
    nextDueDate: chore.nextDueDate?.toISOString() ?? null,
    autoSchedule: chore.autoSchedule,
    responsibleUser: chore.responsibleUser
      ? { firstName: chore.responsibleUser.firstName, lastName: chore.responsibleUser.lastName }
      : null,
  }));
}

export interface ImportResult {
  choresCreated: number;
  choresUpdated: number;
  usersCreated: number;
}

export async function importChoreDefinitions(data: ChoreExport[]): Promise<ImportResult> {
  const result: ImportResult = {
    choresCreated: 0,
    choresUpdated: 0,
    usersCreated: 0,
  };

  const userCache = new Map<string, number>();

  const existingUsers = await prisma.user.findMany();
  for (const user of existingUsers) {
    const key = `${user.firstName}|${user.lastName}`;
    userCache.set(key, user.id);
  }

  for (const chore of data) {
    let responsibleUserId: number | null = null;

    if (chore.responsibleUser) {
      const userKey = `${chore.responsibleUser.firstName}|${chore.responsibleUser.lastName}`;
      
      if (userCache.has(userKey)) {
        responsibleUserId = userCache.get(userKey)!;
      } else {
        const newUser = await prisma.user.create({
          data: {
            firstName: chore.responsibleUser.firstName,
            lastName: chore.responsibleUser.lastName,
          },
        });
        userCache.set(userKey, newUser.id);
        responsibleUserId = newUser.id;
        result.usersCreated++;
      }
    }

    const existingChore = await prisma.chore.findFirst({
      where: { name: chore.name, deletedAt: null },
    });

    const choreData = {
      name: chore.name,
      description: chore.description,
      recurrence: chore.recurrence,
      nextDueDate: chore.nextDueDate ? new Date(chore.nextDueDate) : null,
      autoSchedule: chore.autoSchedule,
      responsibleUserId,
    };

    if (existingChore) {
      await prisma.chore.update({
        where: { id: existingChore.id },
        data: choreData,
      });
      result.choresUpdated++;
    } else {
      await prisma.chore.create({ data: choreData });
      result.choresCreated++;
    }
  }

  revalidatePath("/chores");
  revalidatePath("/chores/backlog");

  return result;
}
