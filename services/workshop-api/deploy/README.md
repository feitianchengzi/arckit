# 部署配置说明

## 目录结构

```
deploy/
├── dev/                              # 开发环境
│   ├── docker-compose.dev.yml       # Docker Compose 配置
│   ├── deploy.sh                    # 开发环境部署脚本
│   ├── clean.sh                     # 清理脚本
│   ├── .env.development             # 开发环境配置（不提交 Git）
│   └── env.development.example      # 配置示例
├── prod/                             # 生产环境
│   ├── docker-compose.prod.yml      # Docker Compose 配置
│   ├── deploy.sh                    # 生产环境部署脚本
│   ├── deploy.config.example        # 部署配置示例（服务器 SSH 信息）
│   ├── .env.workshop.production     # 生产环境配置（不提交 Git）
│   └── env.workshop.production.example # 配置示例
└── Dockerfile                        # Docker 镜像构建文件
```

## 快速部署

从项目根目录执行：

```bash
# 开发环境（默认）
./deploy.sh

# 开发环境（明确指定）
./deploy.sh dev

# 生产环境
./deploy.sh prod
```

### 生产环境部署详细步骤

生产环境部署采用**本地构建 + 上传服务器**的方式：

1. **配置部署信息**：
   ```bash
   cd deploy/prod
   cp deploy.config.example deploy.config
   # 编辑 deploy.config，配置服务器 SSH 信息
   ```

2. **配置环境变量**：
   ```bash
   cp env.workshop.production.example .env.workshop.production
   # 编辑 .env.workshop.production，配置生产环境变量（RDS 连接信息等）
   ```

3. **执行部署**：
   ```bash
   # 从项目根目录执行
   ./deploy.sh prod
   
   # 或直接执行生产部署脚本
   cd deploy/prod
   ./deploy.sh
   ```

**部署流程**：
- 本地编译 Go 二进制（通过 Docker build）
- 本地构建 Docker 镜像
- 保存镜像为 tar 文件
- 上传镜像和配置文件到服务器
- 在服务器上加载镜像并运行

**部署脚本选项**：
- `--skip-build`：跳过本地构建，使用现有镜像
- `--skip-upload`：仅本地构建，不上传到服务器

## 环境变量传递

### 1. 配置文件方式

环境变量通过 `.env` 文件传递，由 Docker Compose 的 `env_file` 注入到容器：

- **开发环境**：`deploy/dev/.env.development`
- **生产环境**：`deploy/prod/.env.workshop.production`

### 2. 配置示例

首次使用需要从示例文件复制创建配置文件：

```bash
# 开发环境
cp deploy/dev/env.development.example deploy/dev/.env.development
# 编辑 deploy/dev/.env.development 配置你的环境变量

# 生产环境
cp deploy/prod/env.workshop.production.example deploy/prod/.env.workshop.production
# 编辑 deploy/prod/.env.workshop.production 配置你的环境变量
```

### 3. Docker Compose 注入

Docker Compose 读取 `.env` 文件并注入到容器环境变量：

```yaml
# docker-compose.dev.yml / docker-compose.prod.yml
services:
  todo-service:
    env_file:
      - .env.development  # 或 .env.workshop.production
```

### 4. 环境变量覆盖

开发环境中，`docker-compose.dev.yml` 使用 `environment` 覆盖数据库连接：

```yaml
environment:
  - DB_HOST=postgres  # Docker 网络中的服务名，覆盖 .env 文件中的 localhost
  - DB_PORT=5432      # Docker 网络内部端口
```

**优先级**：`environment` > `env_file`

## 环境差异

### 开发环境（dev/）

**特点**：
- 包含本地 PostgreSQL 数据库容器
- 数据库端口映射到宿主机 `5433`（避免冲突）
- 应用服务连接 Docker 网络内的 `postgres` 服务

**容器**：
- `todo-service` - 应用服务
- `todo-postgres-dev` - 本地数据库

**网络**：
- `dev_workshop` - Docker 网络

### 生产环境（prod/）

**特点**：
- 仅应用服务容器
- 连接远程 RDS 数据库
- 通过 `.env.workshop.production` 配置 RDS 连接信息

**容器**：
- `todo-service` - 应用服务

**网络**：
- `prod_workshop` - Docker 网络

## 关键差异对比

| 项目 | 开发环境 | 生产环境 |
|------|---------|---------|
| 数据库 | 本地 PostgreSQL 容器 | 远程 RDS |
| DB_HOST | `postgres` (Docker 服务名) | RDS 内网地址 |
| 容器数量 | 2 (应用 + 数据库) | 1 (仅应用) |
| 配置文件 | `.env.development` | `.env.workshop.production` |
| 网络名称 | `dev_workshop` | `prod_workshop` |

## 注意事项

1. **`.env` 文件不提交 Git**：包含敏感信息，需手动创建
2. **生产环境使用内网地址**：`.env.workshop.production` 中应配置 RDS 内网地址以提高性能
3. **Docker 网络隔离**：开发和生产环境使用不同的网络，互不干扰
