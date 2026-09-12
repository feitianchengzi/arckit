BEGIN;

CREATE TABLE IF NOT EXISTS task_notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notify_assigned_to_me BOOLEAN NOT NULL DEFAULT TRUE,
  notify_assignee_changed BOOLEAN NOT NULL DEFAULT TRUE,
  notify_task_created BOOLEAN NOT NULL DEFAULT FALSE,
  notify_status_changed BOOLEAN NOT NULL DEFAULT FALSE,
  notify_priority_changed BOOLEAN NOT NULL DEFAULT FALSE,
  notify_content_changed BOOLEAN NOT NULL DEFAULT FALSE,
  notify_tags_changed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uniq_task_notification_project_user UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_notification_preferences_enabled
  ON task_notification_preferences (project_id, email_enabled, user_id);

COMMIT;
