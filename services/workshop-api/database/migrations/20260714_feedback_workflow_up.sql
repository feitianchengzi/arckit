BEGIN;

ALTER TABLE feedbacks
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_customer_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_developer_message_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS feedback_messages (
  id BIGSERIAL PRIMARY KEY,
  feedback_id BIGINT NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_type VARCHAR(32) NOT NULL,
  sender_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  sender_custom_user_id VARCHAR(128),
  message_type VARCHAR(32) NOT NULL DEFAULT 'text',
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delete_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS feedback_message_attachments (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES feedback_messages(id) ON DELETE CASCADE,
  feedback_id BIGINT NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL,
  object_key VARCHAR(500),
  url TEXT,
  file_name VARCHAR(255),
  mime_type VARCHAR(128),
  size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delete_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS feedback_task_links (
  id BIGSERIAL PRIMARY KEY,
  feedback_id BIGINT NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  relation_type VARCHAR(32) NOT NULL DEFAULT 'converted_to',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delete_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_last_message_at ON feedbacks(last_message_at);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_feedback_created ON feedback_messages(feedback_id, delete_at, created_at, id);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_project_created ON feedback_messages(project_id, delete_at, created_at, id);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_sender_custom_user ON feedback_messages(sender_custom_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_message_attachments_message ON feedback_message_attachments(message_id, delete_at);
CREATE INDEX IF NOT EXISTS idx_feedback_message_attachments_feedback ON feedback_message_attachments(feedback_id, delete_at);
CREATE INDEX IF NOT EXISTS idx_feedback_task_links_task ON feedback_task_links(task_id, delete_at);
CREATE INDEX IF NOT EXISTS idx_feedback_task_links_feedback ON feedback_task_links(feedback_id, delete_at);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_feedback_task_relation_active
  ON feedback_task_links(feedback_id, task_id, relation_type)
  WHERE delete_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_feedback_primary_task_active
  ON feedback_task_links(feedback_id)
  WHERE is_primary = TRUE AND delete_at IS NULL;

COMMIT;
