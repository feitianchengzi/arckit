BEGIN;

-- 添加 capabilities 字段到 project_members 表
-- capabilities 用于存储细粒度的能力列表，支持 JSON 数组格式
-- 例如: ["triage", "manage_code_repos", "manage_knowledge_base"]
-- 默认值为空数组，后续可以通过角色映射或手动设置
ALTER TABLE project_members
  ADD COLUMN IF NOT EXISTS capabilities JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 为现有 owner/admin 角色设置默认 triage 能力
-- 这样可以保持向后兼容，现有的权限检查逻辑不需要立即修改
UPDATE project_members
SET capabilities = '["triage"]'::jsonb
WHERE role IN ('owner', 'admin')
  AND delete_at IS NULL
  AND (capabilities = '[]'::jsonb OR capabilities IS NULL);

-- 添加索引以支持按 capabilities 查询
-- 使用 GIN 索引支持 JSONB 数组查询
CREATE INDEX IF NOT EXISTS idx_project_members_capabilities
  ON project_members USING GIN (capabilities);

COMMIT;
