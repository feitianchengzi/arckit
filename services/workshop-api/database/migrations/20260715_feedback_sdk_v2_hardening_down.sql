BEGIN;

DROP INDEX IF EXISTS uniq_feedback_messages_customer_client_active;
ALTER TABLE feedback_messages DROP COLUMN IF EXISTS client_message_id;

-- The initial-message backfill is intentionally forward-only. Removing those
-- rows in a rollback could delete conversation history that users have already
-- seen or replied to; restore from the pre-migration database backup instead.

COMMIT;
