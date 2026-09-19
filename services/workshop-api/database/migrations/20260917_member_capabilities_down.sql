BEGIN;

-- 删除 capabilities 字段的索引
DROP INDEX IF EXISTS idx_project_members_capabilities;

-- 删除 capabilities 字段
ALTER TABLE project_members
  DROP COLUMN IF EXISTS capabilities;

COMMIT;
