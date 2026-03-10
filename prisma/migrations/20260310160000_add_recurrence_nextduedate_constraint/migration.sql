-- Ensure that if a chore has a recurrence rule, it must also have a nextDueDate
ALTER TABLE "Chore" ADD CONSTRAINT "chore_recurrence_requires_nextduedate"
CHECK ("recurrence" IS NULL OR "nextDueDate" IS NOT NULL);
