BEGIN;

DROP INDEX IF EXISTS idx_feedbacks_triage_status;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS triage_status;

COMMIT;
