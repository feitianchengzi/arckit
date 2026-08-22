# 打包部署脚本说明

本目录包含用于项目打包和部署到阿里云 OSS 的脚本。

## 📋 脚本列表

### 1. `build-vite.sh` - Vite 打包脚本
**用途**：执行 Vite 构建，生成静态文件到 `dist/` 目录

**功能**：
- 清理旧的构建产物
- 检查环境变量配置（`.env`）
- 执行 `npm run build`
- 验证构建结果
- 生成部署说明文档（`dist/DEPLOY.md`）

**输出目录**：`frontend/dist/`

---

### 2. `deploy-oss.py` - OSS 部署脚本（Python）
**用途**：将 `dist/` 目录下的文件上传到阿里云 OSS

**功能**：
- 从 `.env` 文件读取 OSS 配置
- 连接并验证 OSS 服务
- 先上传带哈希的不可变资源和其他静态文件
- 最后替换 `index.html`，失败时保留旧入口
- 保留旧 hashed assets，兼容浏览器或 CDN 缓存中的旧入口
- 为 assets、入口和其他文件设置不同缓存策略
- 显示访问地址和部署信息

**前置要求**：
- Python 3.x
- 安装依赖：`pip3 install --break-system-packages oss2 python-dotenv`

---

### 3. `deploy-oss.sh` - OSS 部署脚本（Bash 包装器）
**用途**：`deploy-oss.py` 的 Bash 包装器，自动检查环境并调用 Python 脚本

**功能**：
- 检查 Python 环境
- 检查并提示安装缺失的依赖
- 调用 `deploy-oss.py` 执行部署

---

## 🚀 使用流程

### 标准部署流程（推荐）

```bash
# 1. 进入 frontend 目录
cd frontend

# 2. 执行打包（生成 dist/ 目录）
bash script/build-vite.sh

# 3. 部署到 OSS（两种方式任选其一）

# 方式 A：直接使用 Python 脚本（推荐）
python3 script/deploy-oss.py

# 方式 B：使用 Bash 包装器（自动检查环境）
bash script/deploy-oss.sh
```

### 一键部署流程

可以组合成一条命令：

```bash
cd frontend && \
bash script/build-vite.sh && \
python3 script/deploy-oss.py
```

---

## ⚙️ 环境配置

### 1. 创建 `.env` 文件

在 `frontend/` 目录下创建 `.env` 文件，配置以下内容：

```env
# OSS 部署配置
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_ENDPOINT=http://oss-cn-beijing.aliyuncs.com
OSS_BUCKET_NAME=your-bucket-name

# Vite 环境变量（用于构建）
VITE_API_URL=https://api.feitianchengzi.com/workshop/v1
VITE_GATEWAY_URL=https://api.feitianchengzi.com
```

**注意**：
- `.env` 文件已添加到 `.gitignore`，不会被提交到 Git
- `OSS_PREFIX` 字段已移除，默认部署到 OSS 根目录

### 2. 安装 Python 依赖

```bash
pip3 install --break-system-packages oss2 python-dotenv
```

**macOS 注意事项**：
- 如果遇到 `externally-managed-environment` 错误，使用 `--break-system-packages` 标志
- 或者使用虚拟环境：`python3 -m venv venv && source venv/bin/activate`

---

## 📦 构建产物说明

### 输出目录结构

```
dist/
├── index.html          # 入口 HTML 文件
├── assets/             # 静态资源目录
│   ├── index-xxx.js    # 打包后的 JS 文件（带哈希）
│   ├── index-xxx.css   # 打包后的 CSS 文件（带哈希）
│   └── ...             # 其他资源文件
├── DEPLOY.md           # 部署说明文档
└── README.md           # 说明文件
```

### Base Path 配置

- **当前配置**：`base: '/'`（根路径）
- **部署位置**：OSS 根目录
- **访问方式**：`https://your-bucket.oss-region.aliyuncs.com/`

---

## 🔧 脚本详细说明

### `build-vite.sh` 执行步骤

1. **清理阶段**
   - 删除 `dist/` 目录
   - 清理 Vite 缓存

2. **环境检查**
   - 检查 `.env` 文件是否存在
   - 只显示已配置的变量名，不输出变量值

3. **构建阶段**
   - 执行 `npm run build`
   - 使用 `vite.config.ts` 配置

4. **验证阶段**
   - 检查 `dist/index.html` 是否存在
   - 统计文件数量和大小
   - 生成部署说明文档

### `deploy-oss.py` 执行步骤

1. **配置加载**
   - 从 `.env` 文件加载 OSS 配置
   - 验证必需参数

2. **连接验证**
   - 连接阿里云 OSS
   - 验证 Bucket 访问权限

3. **上传新文件**
   - 先上传 `assets/` 下带哈希的不可变资源
   - 再上传其他非入口文件
   - 所有资源成功后才替换 `index.html`
   - 不删除旧 hashed assets，避免旧入口或客户端缓存失效
   - 任一前置上传失败时立即停止，线上旧入口保持可用

4. **完成提示**
   - 显示访问地址
   - 提示后续配置步骤

---

## 📝 部署后配置

部署完成后，需要在 OSS 控制台进行以下配置：

### 1. 启用静态网站托管

1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 选择对应的 Bucket
3. 进入"基础设置" > "静态页面"
4. 点击"设置" > "启用"

### 2. 配置首页和 404 页

- **默认首页**：`index.html`
- **默认 404 页**：`index.html`（**重要**：用于支持 SPA 客户端路由）

### 3. 配置 CORS（必需）

1. 进入"权限管理" > "跨域设置"
2. 添加规则：
   - **来源**：`*`（或指定你的 API 域名）
   - **允许 Methods**：GET, HEAD, POST, PUT, DELETE, OPTIONS
   - **允许 Headers**：`*`
   - **暴露 Headers**：`*`
   - **缓存时间**：3600

### 4. 配置自定义域名（可选）

1. 进入"传输管理" > "域名管理"
2. 添加自定义域名
3. 配置 DNS CNAME 解析
4. 启用 HTTPS

---

## 🐛 常见问题

### Q1: 打包失败，提示找不到 `.env` 文件？

**A**: 确保在 `frontend/` 目录下创建了 `.env` 文件，并配置了必需的环境变量。

### Q2: 部署失败，提示 `ModuleNotFoundError: No module named 'oss2'`？

**A**: 需要安装 Python 依赖：
```bash
pip3 install --break-system-packages oss2 python-dotenv
```

### Q3: OSS 连接失败，提示 `AccessDenied`？

**A**: 检查：
1. AccessKey ID 和 Secret 是否正确
2. AccessKey 是否有该 Bucket 的读写权限
3. Bucket 名称是否正确

### Q4: 上传后页面显示空白？

**A**: 检查：
1. OSS 是否启用了静态网站托管
2. 默认首页是否设置为 `index.html`
3. Base Path 配置是否正确（当前为 `/`）

### Q5: 路由跳转后刷新页面显示 404？

**A**: 确保 OSS 的"默认 404 页"设置为 `index.html`，这样所有 404 请求都会返回 `index.html`，由前端路由处理。

### Q6: API 请求失败，出现 CORS 错误？

**A**: 检查：
1. OSS 的 CORS 配置是否正确
2. 后端 API 的 CORS 配置
3. API 地址是否正确（检查 `.env` 中的 `VITE_API_URL`）

---

## 📊 脚本关系图

```
build-vite.sh (打包)
    ↓
生成 dist/ 目录
    ↓
deploy-oss.py / deploy-oss.sh (部署)
    ↓
上传到 OSS 根目录
    ↓
配置 OSS 静态网站托管
    ↓
完成部署
```

---

## 🔗 相关文档

- [Vite 官方文档](https://vitejs.dev/)
- [阿里云 OSS 文档](https://help.aliyun.com/product/31815.html)
- [OSS Python SDK](https://help.aliyun.com/document_detail/32026.html)

---

## 📞 技术支持

如遇到问题：
1. 检查脚本输出的错误信息
2. 查看浏览器控制台的错误
3. 检查 OSS 控制台的配置
4. 查看 `dist/DEPLOY.md` 了解详细部署步骤
