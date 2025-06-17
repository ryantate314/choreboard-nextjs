-- CreateEnum
CREATE TYPE "Status" AS ENUM ('BACKLOG', 'THIS_WEEK', 'TODAY');

-- AlterTable
ALTER TABLE "TaskDefinition" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'BACKLOG';
