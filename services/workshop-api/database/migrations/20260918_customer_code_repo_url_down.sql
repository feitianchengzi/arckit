-- 回滚：移除repo_url和auto_sync字段

-- 删除repo_url字段
ALTER TABLE customer_code_repos DROP COLUMN IF EXISTS repo_url;

-- 删除auto_sync字段
ALTER TABLE customer_code_repos DROP COLUMN IF EXISTS auto_sync;

-- 恢复repo_path为必填
ALTER TABLE customer_code_repos ALTER COLUMN repo_path SET NOT NULL;