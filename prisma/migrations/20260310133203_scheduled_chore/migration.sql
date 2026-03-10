/*
  Warnings:

  - The values [DONE] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `status` on the `Chore` table. All the data in the column will be lost.
  - You are about to drop the `ChoreCompletion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChoreCompletion" DROP CONSTRAINT "ChoreCompletion_choreId_fkey";

-- DropForeignKey
ALTER TABLE "ChoreCompletion" DROP CONSTRAINT "ChoreCompletion_completedById_fkey";

-- AlterTable
ALTER TABLE "Chore" DROP COLUMN "status";

-- DropTable
DROP TABLE "ChoreCompletion";

-- AlterEnum (remove DONE)
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('BACKLOG', 'THIS_WEEK', 'TODAY');
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
COMMIT;

-- CreateTable
CREATE TABLE "ScheduledChore" (
    "id" SERIAL NOT NULL,
    "choreId" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "Status" NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledChore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledChore_choreId_idx" ON "ScheduledChore"("choreId");

-- CreateIndex
CREATE INDEX "ScheduledChore_dueDate_idx" ON "ScheduledChore"("dueDate");

-- CreateIndex
CREATE INDEX "ScheduledChore_completedAt_idx" ON "ScheduledChore"("completedAt");

-- AddForeignKey
ALTER TABLE "ScheduledChore" ADD CONSTRAINT "ScheduledChore_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledChore" ADD CONSTRAINT "ScheduledChore_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
