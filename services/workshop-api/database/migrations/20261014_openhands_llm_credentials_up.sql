BEGIN;

-- Per-project LLM credentials are encrypted by Workshop before persistence.
-- Empty values mean that the project inherits the server-side LLM settings.
ALTER TABLE openhands_agents
  ADD COLUMN IF NOT EXISTS llm_api_key_encrypted TEXT NOT NULL DEFAULT '';

ALTER TABLE openhands_agents
  ADD COLUMN IF NOT EXISTS llm_base_url VARCHAR(500) NOT NULL DEFAULT '';

COMMIT;
