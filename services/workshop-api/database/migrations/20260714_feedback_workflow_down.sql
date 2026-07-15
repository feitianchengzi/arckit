BEGIN;

DROP INDEX IF EXISTS uniq_feedback_primary_task_active;
DROP INDEX IF EXISTS uniq_feedback_task_relation_active;
DROP INDEX IF EXISTS idx_feedback_task_links_feedback;
DROP INDEX IF EXISTS idx_feedback_task_links_task;
DROP INDEX IF EXISTS idx_feedback_message_attachments_feedback;
DROP INDEX IF EXISTS idx_feedback_message_attachments_message;
DROP INDEX IF EXISTS idx_feedback_messages_sender_custom_user;
DROP INDEX IF EXISTS idx_feedback_messages_project_created;
DROP INDEX IF EXISTS idx_feedback_messages_feedback_created;
DROP INDEX IF EXISTS idx_feedbacks_last_message_at;
DROP INDEX IF EXISTS idx_feedbacks_status;

DROP TABLE IF EXISTS feedback_task_links;
DROP TABLE IF EXISTS feedback_message_attachments;
DROP TABLE IF EXISTS feedback_messages;

ALTER TABLE feedbacks
  DROP COLUMN IF EXISTS last_developer_message_at,
  DROP COLUMN IF EXISTS last_customer_message_at,
  DROP COLUMN IF EXISTS last_message_at,
  DROP COLUMN IF EXISTS status;

COMMIT;
