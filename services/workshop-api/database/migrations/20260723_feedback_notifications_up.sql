BEGIN;

CREATE TABLE IF NOT EXISTS feedback_notifications (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  feedback_id BIGINT NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  message_id BIGINT NOT NULL REFERENCES feedback_messages(id) ON DELETE CASCADE,
  recipient_type VARCHAR(32) NOT NULL,
  recipient_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  recipient_custom_user_id VARCHAR(128),
  type VARCHAR(32) NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delete_at TIMESTAMPTZ,
  CONSTRAINT chk_feedback_notifications_recipient CHECK (
    (recipient_type = 'developer' AND recipient_user_id IS NOT NULL AND recipient_custom_user_id IS NULL)
    OR
    (recipient_type = 'customer' AND recipient_user_id IS NULL AND recipient_custom_user_id IS NOT NULL)
  ),
  CONSTRAINT chk_feedback_notifications_type CHECK (
    type IN ('customer_message', 'developer_message', 'status_change')
  )
);

CREATE INDEX IF NOT EXISTS idx_feedback_notifications_recipient_created
  ON feedback_notifications (
    project_id,
    recipient_type,
    recipient_user_id,
    recipient_custom_user_id,
    delete_at,
    created_at DESC,
    id DESC
  );

CREATE INDEX IF NOT EXISTS idx_feedback_notifications_feedback_recipient_created
  ON feedback_notifications (
    feedback_id,
    recipient_type,
    recipient_user_id,
    recipient_custom_user_id,
    delete_at,
    created_at DESC,
    id DESC
  );

CREATE INDEX IF NOT EXISTS idx_feedback_notifications_recipient_unread
  ON feedback_notifications (
    project_id,
    recipient_type,
    recipient_user_id,
    recipient_custom_user_id,
    created_at DESC,
    id DESC
  )
  WHERE read_at IS NULL AND delete_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_feedback_notifications_developer_message_active
  ON feedback_notifications (message_id, recipient_user_id)
  WHERE recipient_type = 'developer'
    AND recipient_user_id IS NOT NULL
    AND delete_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_feedback_notifications_customer_message_active
  ON feedback_notifications (message_id, recipient_custom_user_id)
  WHERE recipient_type = 'customer'
    AND recipient_custom_user_id IS NOT NULL
    AND delete_at IS NULL;

COMMIT;
