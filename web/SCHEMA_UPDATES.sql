-- Schema Updates for Daily Priority Refactoring
-- Run these after creating a migration

-- Add soft delete support to Task model
-- This allows "deleting" tasks without losing data
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Add goal relationship to Task model
-- This links tasks to goals for better tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "goalId" TEXT;

-- Create index for deleted tasks (for faster queries)
CREATE INDEX IF NOT EXISTS "tasks_userId_deletedAt_idx" ON tasks("userId", "deletedAt");

-- Create index for goal relationship
CREATE INDEX IF NOT EXISTS "tasks_goalId_idx" ON tasks("goalId");

-- Add foreign key constraint for goal relationship
ALTER TABLE tasks ADD CONSTRAINT "tasks_goalId_fkey"
  FOREIGN KEY ("goalId") REFERENCES goals("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update Goal model to track completion date
ALTER TABLE goals ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

-- Add index for completed goals
CREATE INDEX IF NOT EXISTS "goals_userId_completed_idx" ON goals("userId", "completed");

-- Comments for clarity
COMMENT ON COLUMN tasks."deletedAt" IS 'Soft delete timestamp - task is hidden but not removed';
COMMENT ON COLUMN tasks."goalId" IS 'Links task to a goal for progress tracking';
