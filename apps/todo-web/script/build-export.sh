#!/bin/bash

# 打包并导出脚本（OSS 静态部署）
# 用途：执行 Next.js 静态导出，生成可直接上传到 OSS 的静态文件

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}   Next.js OSS 静态导出脚本${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# 获取脚本所在的目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# 进入 frontend 目录（脚本在 frontend/script/ 下）
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${YELLOW}📂 进入目录: ${FRONTEND_DIR}${NC}"
cd "$FRONTEND_DIR"

# Next.js 静态导出默认输出目录
OUT_DIR="out"

# 清理旧的构建产物和导出目录
echo -e "\n${YELLOW}📦 清理旧的构建产物...${NC}"
rm -rf .next
rm -rf "$OUT_DIR"
rm -rf node_modules/.cache

# 执行静态导出构建
echo -e "\n${YELLOW}🔨 执行 Next.js 静态导出构建...${NC}"
echo -e "${YELLOW}   配置: output: 'export' 已在 next.config.js 中启用${NC}"

# 设置默认 basePath（用于子路径部署）
# 如果环境变量中已设置，则使用环境变量的值；否则默认使用 /workshop
if [ -z "$NEXT_PUBLIC_BASE_PATH" ]; then
    export NEXT_PUBLIC_BASE_PATH="/workshop"
    echo -e "${YELLOW}   使用默认 basePath: ${NEXT_PUBLIC_BASE_PATH}${NC}"
else
    echo -e "${YELLOW}   使用自定义 basePath: ${NEXT_PUBLIC_BASE_PATH}${NC}"
fi

# 执行构建（不需要 NEXT_EXPORT 环境变量，next.config.js 已配置 output: 'export'）
if ! npm run build; then
    echo -e "\n${RED}❌ 静态导出构建失败${NC}"
    echo -e "${RED}   请查看上方错误信息${NC}"
    exit 1
fi

# Next.js 14+ 静态导出：将 .next 目录内容复制到 out 目录
echo -e "\n${YELLOW}📦 整理静态导出文件...${NC}"
mkdir -p "$OUT_DIR"

# 复制 HTML 文件和静态资源
if [ -d ".next/server/app" ]; then
    echo -e "${YELLOW}   复制 HTML 文件...${NC}"
    cp -r .next/server/app/* "$OUT_DIR/" 2>/dev/null || true
fi

if [ -d ".next/static" ]; then
    echo -e "${YELLOW}   复制静态资源...${NC}"
    mkdir -p "$OUT_DIR/_next/static"
    cp -r .next/static/* "$OUT_DIR/_next/static/" 2>/dev/null || true
fi

# 检查静态导出是否成功
if [ ! -d "$OUT_DIR" ] || [ ! -f "$OUT_DIR/index.html" ]; then
    echo -e "${RED}❌ 静态导出失败：未能生成有效的导出文件${NC}"
    echo -e "${RED}   请检查构建日志中的错误信息${NC}"
    exit 1
fi

# 检查是否有 index.html
if [ ! -f "$OUT_DIR/index.html" ]; then
    echo -e "${RED}❌ 静态导出失败：未找到 index.html${NC}"
    exit 1
fi

# 验证关键文件
echo -e "\n${YELLOW}✅ 验证导出文件...${NC}"
if [ -f "$OUT_DIR/index.html" ]; then
    echo -e "${GREEN}   ✓ index.html 存在${NC}"
else
    echo -e "${RED}   ✗ index.html 不存在${NC}"
    exit 1
fi

# 统计文件数量
FILE_COUNT=$(find "$OUT_DIR" -type f | wc -l | tr -d ' ')
echo -e "${GREEN}   ✓ 共导出 $FILE_COUNT 个文件${NC}"

# 创建部署说明文件
cat > "$OUT_DIR/DEPLOY.md" << 'EOF'
# OSS 部署说明

## 📦 打包信息
- 构建模式：Next.js 静态导出（Static Export）
- 部署方式：阿里云 OSS / 其他静态存储服务
- 文件格式：纯静态文件（HTML + JS + CSS）

## 🚀 部署到阿里云 OSS

### 步骤 1：上传文件

1. **登录阿里云 OSS 控制台**
   - 访问：https://oss.console.aliyun.com/

2. **选择或创建 Bucket**
   - 建议使用与域名相同的 bucket 名称
   - 选择合适的地域

3. **上传文件**
   - 进入 bucket 的文件管理页面
   - 点击"上传文件"
   - 选择 `out/` 目录下的**所有文件**（不是 out 目录本身）
   - 确保上传时保持目录结构

   **重要**：上传时选择"上传到当前目录"，不要创建新的子目录。

### 步骤 2：配置静态网站托管

1. **启用静态网站托管**
   - 在 bucket 设置中找到"静态网站托管"
   - 点击"设置"
   - 选择"启用"

2. **配置首页和错误页**
   - **默认首页**：`index.html`
   - **默认 404 页**：`index.html`（重要：用于支持 SPA 路由）
   - **默认首页规则**：`index.html`

3. **保存配置**

### 步骤 3：配置域名（可选）

1. **绑定自定义域名**
   - 在 bucket 设置中找到"传输管理" > "域名管理"
   - 添加自定义域名
   - 配置 CNAME 解析

2. **配置 HTTPS**
   - 在域名管理中启用 HTTPS
   - 上传 SSL 证书或使用阿里云免费证书

### 步骤 4：配置 CORS（如果需要）

如果前端需要调用其他域的 API，需要配置 CORS：

1. 在 bucket 设置中找到"权限管理" > "跨域设置"
2. 添加规则：
   - **来源**：你的前端域名（如 `https://your-domain.com`）
   - **允许 Methods**：GET, HEAD, POST, PUT, DELETE
   - **允许 Headers**：`*`
   - **暴露 Headers**：`*`
   - **缓存时间**：3600

## ⚙️ 环境变量配置

在打包前确保设置了正确的环境变量：

```bash
export NEXT_PUBLIC_API_URL=https://your-api-domain.com
npm run build:export
```

或者在 `.env.production` 文件中配置：

```
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## 📋 验证清单

部署完成后，请验证：

- [ ] 首页可以正常访问
- [ ] 静态资源（CSS、JS、图片）正常加载
- [ ] 路由跳转正常（SPA 路由）
- [ ] API 请求正常（检查浏览器控制台）
- [ ] 认证功能正常
- [ ] 404 页面重定向到 index.html（支持客户端路由）

## ⚠️ 注意事项

1. **404 页面配置**：必须设置为 `index.html`，否则动态路由会返回 404
2. **API 地址**：确保 `NEXT_PUBLIC_API_URL` 配置正确
3. **HTTPS**：生产环境建议使用 HTTPS
4. **CDN 加速**：建议配合 CDN 使用，提升访问速度
5. **缓存策略**：静态资源建议设置长期缓存，HTML 文件建议不缓存或短期缓存

## 🔧 常见问题

### Q: 页面显示 404？
A: 检查 OSS 的"默认 404 页"是否设置为 `index.html`

### Q: 路由跳转后刷新页面显示 404？
A: 同样需要将"默认 404 页"设置为 `index.html`

### Q: API 请求失败？
A: 检查 `NEXT_PUBLIC_API_URL` 环境变量，以及 CORS 配置

### Q: 静态资源加载失败？
A: 检查文件上传路径是否正确，确保 `_next/static/` 目录结构完整
EOF

# 显示构建信息
echo -e "\n${GREEN}✅ 静态导出完成！${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}📁 产物目录：${NC}$(pwd)/$OUT_DIR"
echo -e "${GREEN}📊 目录大小：${NC}$(du -sh "$OUT_DIR" | cut -f1)"
echo -e "${GREEN}📄 文件数量：${NC}$FILE_COUNT 个文件"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}💡 部署步骤：${NC}"
echo -e "   1. 将 ${BLUE}$OUT_DIR/${NC} 目录下的所有文件上传到 OSS"
echo -e "   2. 在 OSS 中启用静态网站托管"
echo -e "   3. 设置默认首页和 404 页为 ${BLUE}index.html${NC}"
echo -e "   4. 查看 ${BLUE}$OUT_DIR/DEPLOY.md${NC} 了解详细步骤"
echo -e ""
echo -e "${YELLOW}🧪 本地测试：${NC}"
echo -e "   运行 ${BLUE}./scripts/serve-static.sh${NC} 启动支持 SPA 路由的本地服务器"