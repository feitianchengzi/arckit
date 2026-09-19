BEGIN;

-- 删除 state 字段
ALTER TABLE feedback_messages
  DROP COLUMN IF EXISTS state;

-- 删除索引
DROP INDEX IF EXISTS idx_feedback_messages_state;

COMMIT;
