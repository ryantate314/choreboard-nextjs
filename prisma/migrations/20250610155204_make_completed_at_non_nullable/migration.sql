/*
  Warnings:

  - Made the column `completedAt` on table `Task` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "completedAt" SET NOT NULL;
