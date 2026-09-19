BEGIN;

-- 创建 openhands_agents 表（如果不存在）
CREATE TABLE IF NOT EXISTS openhands_agents (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  url VARCHAR(500) NOT NULL,
  api_key VARCHAR(500) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_openhands_agents_project_id ON openhands_agents(project_id);
CREATE INDEX IF NOT EXISTS idx_openhands_agents_status ON openhands_agents(status);

-- 添加 LLM 配置字段
ALTER TABLE openhands_agents
  ADD COLUMN IF NOT EXISTS llm_model VARCHAR(200) DEFAULT 'anthropic/claude-sonnet-4-5-20250929';

ALTER TABLE openhands_agents
  ADD COLUMN IF NOT EXISTS llm_temperature DOUBLE PRECISION DEFAULT 0.0;

ALTER TABLE openhands_agents
  ADD COLUMN IF NOT EXISTS max_iterations INTEGER DEFAULT 50;

-- 添加检索配置字段
ALTER TABLE openhands_agents
  ADD COLUMN IF NOT EXISTS confidence_threshold DOUBLE PRECISION DEFAULT 0.75;

ALTER TABLE openhands_agents
  ADD COLUMN IF NOT EXISTS timeout_ms INTEGER DEFAULT 10000;

-- 添加人设配置字段
ALTER TABLE openhands_agents
  ADD COLUMN IF NOT EXISTS persona_file VARCHAR(500);

-- 添加沙箱配置字段
ALTER TABLE openhands_agents
  ADD COLUMN IF NOT EXISTS sandbox_runtime VARCHAR(32) DEFAULT 'docker';

ALTER TABLE openhands_agents
  ADD COLUMN IF NOT EXISTS sandbox_base_image VARCHAR(500) DEFAULT 'ghcr.io/openhands/agent-server:latest-python';

-- 创建 customer_code_repos 表（如果不存在）
CREATE TABLE IF NOT EXISTS customer_code_repos (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  customer_id VARCHAR(128) NOT NULL,
  repo_path VARCHAR(500) NOT NULL,
  branch VARCHAR(100) NOT NULL DEFAULT 'main',
  last_synced_at TIMESTAMP,
  status VARCHAR(32) NOT NULL DEFAULT 'ready',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_customer_code_repos_project_id ON customer_code_repos(project_id);
CREATE INDEX IF NOT EXISTS idx_customer_code_repos_customer_id ON customer_code_repos(customer_id);

COMMIT;
