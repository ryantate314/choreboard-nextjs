-- CreateEnum
CREATE TYPE "ScheduledStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED');

-- Add status column with default
ALTER TABLE "ScheduledChore" ADD COLUMN "status" "ScheduledStatus" NOT NULL DEFAULT 'TODO';

-- Migrate existing data
UPDATE "ScheduledChore" SET "status" = 'DONE' WHERE "completedAt" IS NOT NULL;
UPDATE "ScheduledChore" SET "status" = 'IN_PROGRESS' WHERE "completedAt" IS NULL AND "startedAt" IS NOT NULL;

-- Drop startedAt column
ALTER TABLE "ScheduledChore" DROP COLUMN "startedAt";

-- Drop overdueAction from Chore
ALTER TABLE "Chore" DROP COLUMN "overdueAction";

-- Drop OverdueAction enum
DROP TYPE "OverdueAction";

-- Add index on status
CREATE INDEX "ScheduledChore_status_idx" ON "ScheduledChore"("status");
