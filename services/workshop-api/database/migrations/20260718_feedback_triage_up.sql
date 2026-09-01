BEGIN;

ALTER TABLE feedbacks
  ADD COLUMN IF NOT EXISTS triage_status VARCHAR(32) NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_feedbacks_triage_status ON feedbacks(triage_status);

UPDATE feedbacks AS f
SET triage_status = CASE
  WHEN EXISTS (
    SELECT 1
    FROM feedback_task_links AS link
    WHERE link.feedback_id = f.id
      AND link.is_primary = TRUE
      AND link.delete_at IS NULL
  ) THEN 'accepted'
  WHEN f.status = 'ignored' THEN 'ignored'
  WHEN f.status IN ('accepted', 'converted', 'in_progress', 'completed', 'released') THEN 'accepted'
  ELSE 'pending'
END
WHERE COALESCE(NULLIF(BTRIM(f.triage_status), ''), 'pending') = 'pending'
  AND (
    f.status IN ('accepted', 'converted', 'in_progress', 'completed', 'released', 'ignored')
    OR EXISTS (
      SELECT 1
      FROM feedback_task_links AS link
      WHERE link.feedback_id = f.id
        AND link.is_primary = TRUE
        AND link.delete_at IS NULL
    )
  );

COMMIT;
