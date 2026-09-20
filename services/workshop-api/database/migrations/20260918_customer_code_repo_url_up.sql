-- 客户代码仓库表添加repo_url和auto_sync字段
-- 支持git仓库地址和自动同步功能

-- 添加repo_url字段
ALTER TABLE customer_code_repos ADD COLUMN IF NOT EXISTS repo_url VARCHAR(500);

-- 添加auto_sync字段
ALTER TABLE customer_code_repos ADD COLUMN IF NOT EXISTS auto_sync BOOLEAN NOT NULL DEFAULT FALSE;

-- 使repo_path可选（允许只使用repo_url）
ALTER TABLE customer_code_repos ALTER COLUMN repo_path DROP NOT NULL;

-- 更新现有记录：如果repo_path存在，将其复制到repo_url
UPDATE customer_code_repos SET repo_url = repo_path WHERE repo_url IS NULL AND repo_path IS NOT NULL;