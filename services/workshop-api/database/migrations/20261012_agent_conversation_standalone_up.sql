BEGIN;

-- 独立智能客服会话：不绑定反馈（feedback_id = 0），按客户维度隔离
ALTER TABLE agent_conversations ADD COLUMN IF NOT EXISTS custom_user_id VARCHAR(128);
ALTER TABLE agent_conversations ALTER COLUMN custom_user_id SET DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_agent_conversations_custom_user_id ON agent_conversations(custom_user_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_project_user_standalone
  ON agent_conversations(project_id, custom_user_id, feedback_id);

COMMIT;
