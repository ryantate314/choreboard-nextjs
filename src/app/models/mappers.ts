import { Chore, ChoreCompletion, Sprint } from "./chore";
import {
  Chore as PrismaChore,
  ChoreCompletion as PrismaCompletion,
  User,
} from "@prisma/client";
import { RRule } from "rrule";

// Prisma query result types
type ChoreWithCompletions = PrismaChore & {
  ChoreCompletion: PrismaCompletion[];
  responsibleUser: User | null;
};

type CompletionWithChore = PrismaCompletion & {
  chore: PrismaChore;
};

/**
 * Maps a Prisma Chore (with completions) to the application Chore type.
 */
export function mapToChore(chore: ChoreWithCompletions): Chore {
  const lastCompletion = chore.ChoreCompletion[0]
    ? mapToCompletion(chore.ChoreCompletion[0])
    : null;

  return {
    id: chore.id,
    type: "chore",
    name: chore.name,
    description: chore.description,
    recurrence: chore.recurrence,
    createdAt: chore.createdAt,
    status: chore.status,
    responsibleUserId: chore.responsibleUserId,
    responsibleUser: chore.responsibleUser,
    lastCompletion,
    nextDueDate: getNextDueDate(chore),
  };
}

/**
 * Maps a Prisma ChoreCompletion to the application ChoreCompletion type.
 */
export function mapToCompletion(
  completion: PrismaCompletion | CompletionWithChore
): ChoreCompletion {
  const result: ChoreCompletion = {
    id: completion.id,
    type: "completion",
    choreId: completion.choreId,
    createdAt: completion.createdAt,
    completedAt: completion.completedAt,
    completedById: completion.completedById,
  };

  // Include chore if present
  if ("chore" in completion && completion.chore) {
    result.chore = {
      id: completion.chore.id,
      type: "chore",
      name: completion.chore.name,
      description: completion.chore.description,
      recurrence: completion.chore.recurrence,
      createdAt: completion.chore.createdAt,
      status: completion.chore.status,
      responsibleUserId: completion.chore.responsibleUserId,
      responsibleUser: null,
      lastCompletion: null,
      nextDueDate: null,
    };
  }

  return result;
}

/**
 * Calculate the next due date for a chore based on its recurrence rule.
 */
function getNextDueDate(chore: ChoreWithCompletions): Date | null {
  if (!chore.recurrence) return null;
  if (chore.ChoreCompletion.length === 0) return chore.createdAt;

  let nextDate;
  const options = RRule.parseString(chore.recurrence);
  const rule = new RRule({
    ...options,
    dtstart: chore.ChoreCompletion[0]?.completedAt,
  });
  rule.all((d, len) => {
    nextDate = d;
    return len < 1; // Stop after finding the first future date
  });
  if (!nextDate) throw new Error("No next instance found for recurrence rule");
  return nextDate;
}

/**
 * Create a Sprint from mapped chores and completions.
 */
export function createSprint(
  start: Date,
  chores: Chore[],
  completions: ChoreCompletion[]
): Sprint {
  return {
    start,
    chores,
    completions,
  };
}
