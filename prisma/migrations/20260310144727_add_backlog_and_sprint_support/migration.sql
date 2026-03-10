/*
  Warnings:

  - You are about to drop the column `status` on the `ScheduledChore` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OverdueAction" AS ENUM ('SKIP_TO_NEXT_INSTANCE', 'KEEP');

-- AlterTable
ALTER TABLE "Chore" ADD COLUMN     "nextDueDate" TIMESTAMP(3),
ADD COLUMN     "overdueAction" "OverdueAction" NOT NULL DEFAULT 'KEEP';

-- AlterTable
ALTER TABLE "ScheduledChore" DROP COLUMN "status",
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- DropEnum
DROP TYPE "Status";

-- CreateIndex
CREATE INDEX "ScheduledChore_startedAt_idx" ON "ScheduledChore"("startedAt");
