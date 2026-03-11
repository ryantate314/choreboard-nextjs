import { PrismaClient } from '@prisma/client';
import { parse } from 'yaml';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RRule } from 'rrule';

const prisma = new PrismaClient();

interface ChoreDefinition {
  name: string;
  recurrence?: string;
  description?: string;
  category?: string;
  autoSchedule?: boolean;
}

function calculateNextDueDate(recurrence: string, fromDate: Date): Date | null {
  try {
    const options = RRule.parseString(recurrence);
    const rule = new RRule({
      ...options,
      dtstart: fromDate,
    });
    
    let nextDate: Date | undefined;
    rule.all((d, len) => {
      nextDate = d;
      return len < 1;
    });
    
    return nextDate ?? null;
  } catch {
    return null;
  }
}

async function main() {
  // Create users
  const user1 = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      firstName: 'Ryan',
      lastName: 'T',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { id: 2 },
    update: {},
    create: {
      firstName: 'Callie',
      lastName: 'E',
    },
  });

  console.log('Users created:', { user1, user2 });

  // Load chore definitions from YAML
  const yamlPath = join(__dirname, '..', 'doc', 'chore_definitions.yaml');
  const yamlContent = readFileSync(yamlPath, 'utf-8');
  const choreDefinitions: ChoreDefinition[] = parse(yamlContent);

  console.log(`Found ${choreDefinitions.length} chore definitions`);

  // Fix existing chores with recurrence but no nextDueDate
  const choresNeedingFix = await prisma.chore.findMany({
    where: {
      recurrence: { not: null },
      nextDueDate: null,
    },
  });

  for (const chore of choresNeedingFix) {
    const nextDueDate = calculateNextDueDate(chore.recurrence!, new Date());
    if (nextDueDate) {
      await prisma.chore.update({
        where: { id: chore.id },
        data: { nextDueDate },
      });
      console.log(`Fixed chore "${chore.name}" - set nextDueDate to ${nextDueDate.toLocaleDateString()}`);
    } else {
      console.warn(`Warning: Could not calculate nextDueDate for "${chore.name}" with recurrence "${chore.recurrence}"`);
    }
  }

  if (choresNeedingFix.length > 0) {
    console.log(`Fixed ${choresNeedingFix.length} chores with missing nextDueDate`);
  }

  // Create or update chores
  for (const def of choreDefinitions) {
    const existing = await prisma.chore.findFirst({
      where: { name: def.name },
    });

    if (existing) {
      // Update existing chore with YAML values (preserves nextDueDate)
      await prisma.chore.update({
        where: { id: existing.id },
        data: {
          description: def.description || null,
          recurrence: def.recurrence || null,
          autoSchedule: def.autoSchedule ?? false,
        },
      });
      console.log(`Updated chore: ${existing.name} (autoSchedule: ${def.autoSchedule ?? false})`);
      continue;
    }

    let nextDueDate: Date | null = null;
    if (def.recurrence) {
      nextDueDate = calculateNextDueDate(def.recurrence, new Date());
    }

    const chore = await prisma.chore.create({
      data: {
        name: def.name,
        description: def.description || null,
        recurrence: def.recurrence || null,
        nextDueDate,
        autoSchedule: def.autoSchedule ?? false,
      },
    });

    console.log(`Created chore: ${chore.name}${nextDueDate ? ` (next due: ${nextDueDate.toLocaleDateString()})` : ''}`);
  }

  console.log('Seed completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });