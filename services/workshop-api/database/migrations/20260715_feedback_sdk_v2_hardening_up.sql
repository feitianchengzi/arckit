BEGIN;

ALTER TABLE feedback_messages
  ADD COLUMN IF NOT EXISTS client_message_id VARCHAR(128);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_feedback_messages_customer_client_active
  ON feedback_messages(feedback_id, sender_custom_user_id, client_message_id)
  WHERE sender_type = 'customer'
    AND sender_custom_user_id IS NOT NULL
    AND client_message_id IS NOT NULL
    AND delete_at IS NULL;

-- V1 feedbacks predate the conversation table. Materialize their original
-- content as a first message so V2 always has a coherent conversation history.
WITH inserted_messages AS (
  INSERT INTO feedback_messages (
    feedback_id,
    project_id,
    sender_type,
    sender_custom_user_id,
    message_type,
    content,
    metadata,
    created_at,
    updated_at
  )
  SELECT
    f.id,
    f.project_id,
    'customer',
    f.custom_user_id,
    'text',
    f.content,
    jsonb_build_object('source', 'feedback_initial', 'legacy', true),
    f.created_at,
    f.created_at
  FROM feedbacks f
  WHERE f.delete_at IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM feedback_messages m
      WHERE m.feedback_id = f.id
        AND m.delete_at IS NULL
        AND m.metadata ->> 'source' = 'feedback_initial'
    )
  RETURNING id, feedback_id
)
INSERT INTO feedback_message_attachments (
  message_id,
  feedback_id,
  type,
  object_key,
  url,
  created_at,
  updated_at
)
SELECT
  m.id,
  f.id,
  CASE
    WHEN lower(f.file) ~ '\.(jpg|jpeg|png|gif|webp)(\?.*)?$' THEN 'image'
    ELSE 'file'
  END,
  CASE WHEN f.file ~ '^https?://' THEN NULL ELSE f.file END,
  CASE WHEN f.file ~ '^https?://' THEN f.file ELSE NULL END,
  f.created_at,
  f.created_at
FROM inserted_messages m
JOIN feedbacks f ON f.id = m.feedback_id
WHERE f.file IS NOT NULL
  AND btrim(f.file) <> '';

UPDATE feedbacks f
SET
  last_message_at = CASE
    WHEN f.last_message_at IS NULL OR f.last_message_at < f.created_at THEN f.created_at
    ELSE f.last_message_at
  END,
  last_customer_message_at = CASE
    WHEN f.last_customer_message_at IS NULL OR f.last_customer_message_at < f.created_at THEN f.created_at
    ELSE f.last_customer_message_at
  END
WHERE f.delete_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM feedback_messages m
    WHERE m.feedback_id = f.id
      AND m.delete_at IS NULL
      AND m.metadata ->> 'source' = 'feedback_initial'
  );

COMMIT;
