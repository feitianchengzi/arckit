BEGIN;

-- 删除 customer_code_repos 表
DROP TABLE IF EXISTS customer_code_repos;

-- 删除 openhands_agents 表的新增字段
ALTER TABLE openhands_agents DROP COLUMN IF EXISTS llm_model;
ALTER TABLE openhands_agents DROP COLUMN IF EXISTS llm_temperature;
ALTER TABLE openhands_agents DROP COLUMN IF EXISTS max_iterations;
ALTER TABLE openhands_agents DROP COLUMN IF EXISTS confidence_threshold;
ALTER TABLE openhands_agents DROP COLUMN IF EXISTS timeout_ms;
ALTER TABLE openhands_agents DROP COLUMN IF EXISTS persona_file;
ALTER TABLE openhands_agents DROP COLUMN IF EXISTS sandbox_runtime;
ALTER TABLE openhands_agents DROP COLUMN IF EXISTS sandbox_base_image;

-- 删除 openhands_agents 表
DROP TABLE IF EXISTS openhands_agents;

COMMIT;
