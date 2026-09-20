BEGIN;

-- 知识库工作空间绑定表
CREATE TABLE IF NOT EXISTS knowledge_workspaces (
  id SERIAL PRIMARY KEY,
  project_id INTEGER UNIQUE,
  weknora_workspace_id VARCHAR(128) NOT NULL,
  scoped_api_key VARCHAR(500) NOT NULL,
  scope VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_workspaces_project_id ON knowledge_workspaces(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_workspaces_scope ON knowledge_workspaces(scope);

-- 知识源管理表
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  name VARCHAR(200) NOT NULL,
  source_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'not_synced',
  scope VARCHAR(32) NOT NULL,
  repo_url VARCHAR(500),
  branch VARCHAR(100),
  last_indexed_at TIMESTAMP,
  last_index_error TEXT,
  weknora_connector_id VARCHAR(128),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_project_id ON knowledge_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_source_type ON knowledge_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status ON knowledge_sources(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_scope ON knowledge_sources(scope);

-- 代码语义分块表（pgvector 独立 schema）
CREATE SCHEMA IF NOT EXISTS code_index;

CREATE TABLE IF NOT EXISTS code_index.code_chunks (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL,
  source_id BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  symbol_type VARCHAR(32),
  symbol_name VARCHAR(200),
  start_line INT NOT NULL,
  end_line INT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding TEXT NOT NULL,
  commit_sha VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_chunks_project_file ON code_index.code_chunks(project_id, file_path);
CREATE INDEX IF NOT EXISTS idx_code_chunks_symbol_type ON code_index.code_chunks(symbol_type);
CREATE INDEX IF NOT EXISTS idx_code_chunks_symbol_name ON code_index.code_chunks(symbol_name);
CREATE INDEX IF NOT EXISTS idx_code_chunks_source_id ON code_index.code_chunks(source_id);

COMMIT;
