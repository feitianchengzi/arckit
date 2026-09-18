BEGIN;

-- Task 新增 source_feedback_id 字段（桥1：Task→Feedback 追溯）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_feedback_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_tasks_source_feedback_id ON tasks(source_feedback_id);

-- Task 新增 artifact_url 字段（产物交付回写）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS artifact_url VARCHAR(500);

COMMIT;
