# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Choreboard is a Next.js household chore tracking app with Kanban-style task boards, recurring task support, and sprint/weekly planning.

**Stack**: Next.js 15 (App Router), React 19, TypeScript, Prisma ORM, PostgreSQL, Tailwind CSS 4

## Common Commands

```bash
npm run dev          # Start dev server (port 3001, Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npx prisma migrate dev    # Run migrations in development
npx prisma migrate deploy # Run migrations in production
npx prisma db seed   # Seed database with default users
```

## Architecture

### Server vs Client Split
- `src/app/page.tsx` - Server component that fetches Sprint and chore data
- `src/app/components/` - Client components (`"use client"`) for interactivity
- `src/app/actions.ts` - Server actions for all database mutations, uses `revalidatePath("/")` to refresh

### Key Domain Concepts
- **Sprint**: Weekly planning window (Monday-Sunday)
- **Chore**: Reusable chore template with optional recurrence (RRule/iCalendar format)
- **ChoreCompletion**: Individual completion record with timestamp
- **Status**: BACKLOG → THIS_WEEK → TODAY → DONE (soft delete via `deletedAt`)

### Data Models (`src/app/models/chore.ts`)
Core TypeScript interfaces for Sprint, Chore, ChoreCompletion, and User entities. Includes `STATUS_TRANSITIONS` defining valid state changes.

### Database Schema (`prisma/schema.prisma`)
- User → Chore (1:many as responsible person)
- User → ChoreCompletion (1:many as completedBy)
- Chore → ChoreCompletion (1:many completion history)

### Recurrence System
Uses the `rrule` library for recurring chores. Next due date calculated from last completion. RRule format follows iCalendar spec.

## Key Files

- `src/app/actions.ts` - All server actions (saveChore, updateChoreStatus, completeChore, etc.)
- `src/app/components/choreBoardContainer.tsx` - Main container with drag/drop and modal state
- `src/app/components/choreBoard.tsx` - Kanban columns rendering
- `src/app/components/choreForm.tsx` - Create/edit modal with RRule support
- `src/app/models/mappers.ts` - Prisma to domain model mapping

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `NEXT_PUBLIC_BASE_PATH` - Optional base path for subpath deployments
- `NEXT_PUBLIC_ASSET_PREFIX` - Optional asset prefix

## Styling

Dark theme using custom Tailwind colors defined in `src/app/globals.css`. Surface colors use a "smokey mountain" palette (surface-700 through surface-950).
