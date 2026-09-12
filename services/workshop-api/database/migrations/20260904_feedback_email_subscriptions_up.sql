BEGIN;

CREATE TABLE IF NOT EXISTS feedback_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    notify_new_feedback BOOLEAN NOT NULL DEFAULT TRUE,
    notify_customer_replies BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_feedback_subscription_project_user UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_subscriptions_user_id
    ON feedback_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS feedback_email_deliveries (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    feedback_id BIGINT NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    message_id BIGINT NOT NULL REFERENCES feedback_messages(id) ON DELETE CASCADE,
    recipient_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_at TIMESTAMPTZ,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_feedback_email_delivery_message_user UNIQUE (message_id, recipient_user_id),
    CONSTRAINT chk_feedback_email_delivery_event
        CHECK (event_type IN ('new_feedback', 'customer_reply')),
    CONSTRAINT chk_feedback_email_delivery_status
        CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    CONSTRAINT chk_feedback_email_delivery_attempt_count
        CHECK (attempt_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_feedback_email_deliveries_due
    ON feedback_email_deliveries(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_feedback_email_deliveries_project_id
    ON feedback_email_deliveries(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_email_deliveries_feedback_id
    ON feedback_email_deliveries(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_email_deliveries_recipient_user_id
    ON feedback_email_deliveries(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_email_deliveries_locked_at
    ON feedback_email_deliveries(locked_at);

COMMIT;
