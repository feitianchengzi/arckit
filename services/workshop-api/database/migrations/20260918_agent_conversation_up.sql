BEGIN;

-- Agent 对话表
CREATE TABLE IF NOT EXISTS agent_conversations (
  id VARCHAR(128) PRIMARY KEY,
  feedback_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  delete_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_feedback_id ON agent_conversations(feedback_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_project_id ON agent_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_delete_at ON agent_conversations(delete_at);

-- Agent 消息记录表
CREATE TABLE IF NOT EXISTS agent_message_records (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(128) NOT NULL,
  feedback_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  sender_type VARCHAR(32) NOT NULL, -- customer, agent, system
  content TEXT NOT NULL,
  tool_calls JSONB,
  tool_results JSONB,
  confidence DECIMAL(3,2),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  delete_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_message_records_conversation_id ON agent_message_records(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_message_records_feedback_id ON agent_message_records(feedback_id);
CREATE INDEX IF NOT EXISTS idx_agent_message_records_project_id ON agent_message_records(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_message_records_delete_at ON agent_message_records(delete_at);

COMMIT;
