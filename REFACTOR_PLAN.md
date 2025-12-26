# Task/TaskDefinition Refactoring Plan

This document outlines a comprehensive plan to refactor the Task and TaskDefinition object structure for improved understandability, maintainability, and adherence to design best practices.

## Problem Statement

The current model has naming and structural issues:

1. **Naming is inverted from user mental model**: Users think "I complete a task" but the code creates a `Task` record when completing a `TaskDefinition`
2. **TaskDefinition serves dual roles**: Acts as both a reusable template (recurring) AND an active work item (one-time)
3. **Sprint data model forces special-casing**: `taskDefinitions[]` vs `doneTasks[]` requires different rendering logic for Done column
4. **Null-heavy types**: Excessive optional/nullable fields create defensive coding patterns
5. **Implicit state machine**: Status transitions are spread across multiple functions without documentation

## Goals

- Rename types to match user mental model
- Rename database tables and columns to match the new type names
- Create a unified `BoardItem` type for consistent UI rendering
- Reduce null/undefined proliferation
- Document and centralize state transitions

## New Type Definitions

### Core Types

```typescript
// Renamed from TaskDefinition - represents the template/definition of a chore
export interface Chore {
  id: number;
  type: 'chore';
  name: string;
  description: string | null;
  recurrence: string | null;
  createdAt: Date;
  status: Status | null;
  responsibleUserId: number | null;
  responsibleUser: User | null;

  // Computed/included fields
  lastCompletion: ChoreCompletion | null;
  nextDueDate: Date | null;
}

// Renamed from Task - represents a completion record
export interface ChoreCompletion {
  id: number;
  type: 'completion';
  choreId: number;
  chore?: Chore;
  completedAt: Date;
  completedById: number | null;
  completedBy: User | null;
}

// Unified type for items displayed on the Kanban board
export interface BoardItem {
  id: string;                    // Composite key: "chore-{id}" or "completion-{id}"
  choreId: number;               // Always links back to the chore
  name: string;
  description: string | null;
  status: Status;
  recurrence: string | null;
  responsibleUser: User | null;
  nextDueDate: Date | null;
  completedAt: Date | null;      // Only populated for DONE items

  // Reference to source objects for actions
  source: Chore | ChoreCompletion;
}

export interface Sprint {
  start: Date;
  end: Date;
  items: BoardItem[];            // Unified list for all columns
}
```

### Type Aliases for Backward Compatibility (Temporary)

```typescript
/** @deprecated Use Chore instead */
export type TaskDefinition = Chore;

/** @deprecated Use ChoreCompletion instead */
export type Task = ChoreCompletion;

/** @deprecated Use BoardItem instead */
export type AllTasks = Chore | ChoreCompletion;
```

## Implementation Steps

> **Execution Order**: Phase 5 (Database Schema Update) should be executed FIRST because it changes the Prisma-generated types. All other phases depend on the new `prisma.chore` and `prisma.choreCompletion` types being available.
>
> Recommended order: **Phase 5 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 6**

### Phase 1: Add New Types Alongside Old (Non-Breaking)

#### Step 1.1: Create new model file

Create `src/app/models/chore.ts` with the new type definitions:

- `Chore` interface
- `ChoreCompletion` interface
- `BoardItem` interface
- `Sprint` interface (updated)
- Status transition constants and documentation

#### Step 1.2: Add mapping utilities

Create `src/app/models/mappers.ts`:

```typescript
export function choreToBoard(chore: Chore): BoardItem
export function completionToBoard(completion: ChoreCompletion): BoardItem
export function toBoardItems(chores: Chore[], completions: ChoreCompletion[]): BoardItem[]
```

#### Step 1.3: Update actions.ts with new mapper functions

Add new versions of data access functions that return new types:

- `mapToChore()` - replaces `mapTaskDefinition()`
- `mapToCompletion()` - replaces `mapTask()`
- Keep old functions temporarily for compatibility

### Phase 2: Update Server Actions

#### Step 2.1: Rename and refactor getSprint()

Update `src/app/actions.ts`:

```typescript
export async function getSprint(searchParams?: { weekStart?: Date }): Promise<Sprint> {
  // ... existing query logic ...

  // NEW: Return unified BoardItem array
  const items = toBoardItems(chores, completions);

  return {
    start: weekStart,
    end: weekEnd,
    items
  };
}
```

#### Step 2.2: Rename mutation functions

| Old Name | New Name |
|----------|----------|
| `saveTaskDefinition` | `saveChore` |
| `deleteTaskDefinition` | `deleteChore` |
| `updateTaskDefinitionStatus` | `updateChoreStatus` |
| `completeTaskDefinition` | `completeChore` |
| `deleteTask` | `deleteCompletion` |
| `getTaskDefinition` | `getChore` |
| `getAllTaskDefinitions` | `getAllChores` |

#### Step 2.3: Document state transitions

Add to `src/app/models/chore.ts`:

```typescript
/**
 * Valid status transitions:
 *
 * For recurring chores:
 *   BACKLOG <-> THIS_WEEK <-> TODAY -> DONE (creates completion, resets to BACKLOG)
 *
 * For one-time chores:
 *   null -> BACKLOG <-> THIS_WEEK <-> TODAY -> DONE (sets status to null)
 *   DONE items can be moved back: deletes completion, restores status
 *
 * Deletion:
 *   Any status -> null (soft delete via deletedAt for chores, hard delete for completions)
 */
export const STATUS_TRANSITIONS = {
  BACKLOG: [Status.THIS_WEEK, Status.TODAY, Status.DONE, null],
  THIS_WEEK: [Status.BACKLOG, Status.TODAY, Status.DONE],
  TODAY: [Status.BACKLOG, Status.THIS_WEEK, Status.DONE],
  DONE: [Status.BACKLOG, Status.THIS_WEEK, Status.TODAY],
} as const;
```

### Phase 3: Update Components

#### Step 3.1: Update taskDefinitionBoard.tsx → choreboard.tsx

Rename file and refactor to use `BoardItem`:

```typescript
// BEFORE: Special-casing Done column
{col === "Done"
  ? doneTasks.map((task) => ...)
  : taskDefinitions.filter(...).map((def) => ...)}

// AFTER: Unified rendering
{items
  .filter(item => item.status === colStatus)
  .sort(sortByDueDate)
  .map((item) => <BoardCard key={item.id} item={item} />)}
```

#### Step 3.2: Create BoardCard component

Extract card rendering to `src/app/components/boardCard.tsx`:

```typescript
interface BoardCardProps {
  item: BoardItem;
  onDragStart: (item: BoardItem) => void;
  onClick: (item: BoardItem) => void;
}

export function BoardCard({ item, onDragStart, onClick }: BoardCardProps) {
  // Unified card rendering logic
}
```

#### Step 3.3: Update taskBoardContainer.tsx → choreboardContainer.tsx

- Update imports to use new types
- Simplify drag/drop handlers to work with `BoardItem`
- Update modal state to use `BoardItem`

#### Step 3.4: Update taskModal.tsx → choreModal.tsx

- Accept `BoardItem` instead of `AllTasks`
- Remove type discrimination logic (no more `task.type === 'definition'`)
- Access chore details via `item.source` when needed for edit modal

#### Step 3.5: Update taskDefinitionForm.tsx → choreForm.tsx

- Rename props interface
- Update action calls to use new function names

#### Step 3.6: Update taskSearch.tsx → choreSearch.tsx

- Update to work with `Chore[]` instead of `TaskDefinition[]`

### Phase 4: Update Page and Entry Points

#### Step 4.1: Update src/app/page.tsx

```typescript
// BEFORE
const sprint = await getSprint();
const allTaskDefinitions = await getAllTaskDefinitions();

// AFTER
const sprint = await getSprint();
const allChores = await getAllChores();
```

#### Step 4.2: Update component imports

Update all imports throughout the app to use new component and type names.

### Phase 5: Database Schema Update

Update the Prisma schema to use the new naming. Since this is pre-release, we will reset the database with the new schema.

#### Step 5.1: Update prisma/schema.prisma

Replace the existing schema with:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int    @id @default(autoincrement())
  firstName String
  lastName  String

  Chore           Chore[]
  ChoreCompletion ChoreCompletion[]
}

model Chore {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  recurrence  String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  status      Status?
  deletedAt   DateTime?

  responsibleUserId Int?
  responsibleUser   User? @relation(fields: [responsibleUserId], references: [id])

  ChoreCompletion ChoreCompletion[]
}

enum Status {
  BACKLOG
  THIS_WEEK
  TODAY
  DONE
}

model ChoreCompletion {
  id          Int      @id @default(autoincrement())
  chore       Chore    @relation(fields: [choreId], references: [id])
  choreId     Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  completedAt DateTime

  completedById Int?
  completedBy   User? @relation(fields: [completedById], references: [id])
}
```

#### Step 5.2: Reset Database and Apply Schema

```bash
# Reset database and apply new schema (destroys existing data)
npx prisma migrate dev --name initial

# Seed database with default users
npx prisma db seed
```

#### Step 5.3: Update Prisma Client Usage in actions.ts

Update all Prisma queries to use new model names:

| Old | New |
|-----|-----|
| `prisma.taskDefinition.findMany()` | `prisma.chore.findMany()` |
| `prisma.taskDefinition.create()` | `prisma.chore.create()` |
| `prisma.taskDefinition.update()` | `prisma.chore.update()` |
| `prisma.taskDefinition.findUnique()` | `prisma.chore.findUnique()` |
| `prisma.task.findMany()` | `prisma.choreCompletion.findMany()` |
| `prisma.task.create()` | `prisma.choreCompletion.create()` |
| `prisma.task.delete()` | `prisma.choreCompletion.delete()` |
| `include: { Task: ... }` | `include: { ChoreCompletion: ... }` |
| `include: { taskDefinition: ... }` | `include: { chore: ... }` |
| `task.taskDefinitionId` | `completion.choreId` |

#### Step 5.4: Regenerate Prisma Client

```bash
npx prisma generate
```

This updates the generated TypeScript types to match the new schema.

### Phase 6: Cleanup

#### Step 6.1: Remove old model file

Delete `src/app/models/taskDefinition.ts` after all references are updated.

#### Step 6.2: Remove deprecated type aliases

Remove the temporary `TaskDefinition`, `Task`, `AllTasks` aliases.

#### Step 6.3: Verify no remaining references

```bash
grep -r "TaskDefinition" src/
grep -r "AllTasks" src/
grep -r "taskDefinition" src/  # Check for old naming patterns
```

## File Changes Summary

| Action | Old Path | New Path |
|--------|----------|----------|
| Modify | `prisma/schema.prisma` | (rename models) |
| Create | - | `src/app/models/chore.ts` |
| Create | - | `src/app/models/mappers.ts` |
| Delete | `src/app/models/taskDefinition.ts` | - |
| Modify | `src/app/actions.ts` | (rename functions, update Prisma calls, update types) |
| Rename | `src/app/components/taskDefinitionBoard.tsx` | `src/app/components/choreBoard.tsx` |
| Rename | `src/app/components/taskBoardContainer.tsx` | `src/app/components/choreBoardContainer.tsx` |
| Rename | `src/app/components/taskModal.tsx` | `src/app/components/choreModal.tsx` |
| Rename | `src/app/components/taskDefinitionForm.tsx` | `src/app/components/choreForm.tsx` |
| Rename | `src/app/components/taskSearch.tsx` | `src/app/components/choreSearch.tsx` |
| Create | - | `src/app/components/boardCard.tsx` |
| Modify | `src/app/page.tsx` | (update imports and variable names) |

## Testing Checklist

After implementation, verify:

- [ ] Create one-time chore and move through all statuses to Done
- [ ] Create recurring chore and complete it (should reset to Backlog)
- [ ] Drag and drop works in all directions
- [ ] Done items can be moved back to other columns
- [ ] Edit modal works for both chore types
- [ ] Delete works for both chores and completions
- [ ] Sprint history navigation still works
- [ ] Search functionality works
- [ ] Responsible user display works
- [ ] Overdue task highlighting works
- [ ] Build passes with no TypeScript errors
- [ ] ESLint passes

## Rollback Plan

If issues arise during implementation:

1. Git revert to previous commit
2. Restore `prisma/schema.prisma` to original state
3. Run `npx prisma migrate dev --name rollback` to recreate old schema
4. Re-seed database with `npx prisma db seed`

Since this is pre-release with no production data, rollback is straightforward.

## Estimated Scope

- **Files to modify**: ~12 (including schema and seed)
- **New files**: 3
- **Deleted files**: 1
- **Lines of code**: ~300-400 lines changed/added
- **Database**: Full schema reset required
- **Risk level**: Low (pre-release, no production data to preserve)
