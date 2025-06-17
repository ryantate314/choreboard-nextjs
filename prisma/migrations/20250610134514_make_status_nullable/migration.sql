-- AlterTable
ALTER TABLE "TaskDefinition" ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;
