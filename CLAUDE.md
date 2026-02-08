# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TaterBase is a multi-module Next.js home management dashboard. Current modules: **Chores** (Kanban-style task board with recurring tasks and sprint planning) and **Inventory** (home item tracking with locations and categories).

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

### Multi-Module Structure

The app is organized into modules under `src/app/`. The root `/` redirects to `/chores`. Each module has its own route directory with a `page.tsx` (server component) and `components/` directory (client components).

```
src/app/
  page.tsx                          # Root redirect → /chores
  layout.tsx                        # Shared root layout
  components/navBar.tsx             # Shared app-level nav bar
  actions/chores.ts                 # Chore server actions
  actions/inventory.ts              # Inventory server actions
  models/                           # Shared domain interfaces & mappers
  chores/                           # Chores module (/chores route)
    page.tsx                        # Server component
    components/                     # Client components
  inventory/                        # Inventory module (/inventory route)
    page.tsx                        # Server component
    components/                     # Client components
```

### Server vs Client Split
- `src/app/chores/page.tsx` - Server component that fetches Sprint and chore data
- `src/app/inventory/page.tsx` - Server component that fetches inventory data
- `src/app/*/components/` - Client components (`"use client"`) for interactivity
- `src/app/actions/chores.ts` - Chore server actions, uses `revalidatePath("/chores")`
- `src/app/actions/inventory.ts` - Inventory server actions, uses `revalidatePath("/inventory")`

### Chores Module
- **Sprint**: Weekly planning window (Monday-Sunday)
- **Chore**: Reusable chore template with optional recurrence (RRule/iCalendar format)
- **ChoreCompletion**: Individual completion record with timestamp
- **Status**: BACKLOG → THIS_WEEK → TODAY → DONE (soft delete via `deletedAt`)

### Inventory Module
- **Location**: A room or area (e.g., "Kitchen", "Garage")
- **Sublocation**: A specific spot within a location (e.g., "Top Shelf", "Under Sink")
- **InventoryItem**: A tracked item with name, description, category tag, quantity, stored in a sublocation
- Hard deletes with cascade (no soft delete)

### Database Schema (`prisma/schema.prisma`)
- User → Chore (1:many), User → ChoreCompletion (1:many)
- Chore → ChoreCompletion (1:many)
- Location → Sublocation (1:many, cascade delete)
- Sublocation → InventoryItem (1:many, cascade delete)

### Recurrence System
Uses the `rrule` library for recurring chores. Next due date calculated from last completion. RRule format follows iCalendar spec.

## How to Add a New Module

1. Create `src/app/<module>/page.tsx` (server component) and `src/app/<module>/components/` (client components)
2. Add domain interfaces in `src/app/models/<module>.ts` and mappers in `src/app/models/<module>Mappers.ts`
3. Add server actions in `src/app/actions/<module>.ts` with `revalidatePath("/<module>")`
4. Add Prisma models to `prisma/schema.prisma` and run migration
5. Add nav link in `src/app/components/navBar.tsx`

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `NEXT_PUBLIC_BASE_PATH` - Optional base path for subpath deployments
- `NEXT_PUBLIC_ASSET_PREFIX` - Optional asset prefix

## Styling

Dark theme using custom Tailwind colors defined in `src/app/globals.css`. Surface colors use a "smokey mountain" palette (surface-700 through surface-950).
