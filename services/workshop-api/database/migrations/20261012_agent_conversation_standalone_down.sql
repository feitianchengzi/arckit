BEGIN;

DROP INDEX IF EXISTS idx_agent_conversations_project_user_standalone;
DROP INDEX IF EXISTS idx_agent_conversations_custom_user_id;
ALTER TABLE agent_conversations DROP COLUMN IF EXISTS custom_user_id;

COMMIT;
