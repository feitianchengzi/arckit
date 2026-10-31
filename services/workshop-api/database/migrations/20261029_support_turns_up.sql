CREATE TABLE IF NOT EXISTS support_turns (
 id VARCHAR(64) PRIMARY KEY,
 request_hash VARCHAR(64) NOT NULL,
 response JSONB NOT NULL DEFAULT 'null',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_turns_created_at ON support_turns(created_at);
