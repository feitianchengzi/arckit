BEGIN;

-- 添加 state 字段到 feedback_messages 表
-- state 用于区分草稿和已发送状态
-- pending_review: 待确认（草稿）
-- sent: 已发送
ALTER TABLE feedback_messages
  ADD COLUMN IF NOT EXISTS state VARCHAR(32) NOT NULL DEFAULT 'sent';

-- 添加索引以支持按状态查询
CREATE INDEX IF NOT EXISTS idx_feedback_messages_state ON feedback_messages(state);

-- 为现有的 system 类型消息设置默认状态为 sent（已发送）
-- 这些是历史消息，应该标记为已发送
UPDATE feedback_messages 
SET state = 'sent' 
WHERE sender_type = 'system' AND state = 'sent';

COMMIT;
