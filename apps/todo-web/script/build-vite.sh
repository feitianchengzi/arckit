#!/bin/bash

# Vite 静态打包脚本（OSS 静态部署）
# 用途：执行 Vite 构建，生成可直接上传到 OSS 的静态文件

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}   Vite 静态打包脚本${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# 获取脚本所在的目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# 进入 frontend 目录（脚本在 frontend/script/ 下）
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${YELLOW}📂 进入目录: ${FRONTEND_DIR}${NC}"
cd "$FRONTEND_DIR"

# Vite 默认输出目录
DIST_DIR="dist"

# 清理旧的构建产物
echo -e "\n${YELLOW}📦 清理旧的构建产物...${NC}"
rm -rf "$DIST_DIR"
rm -rf node_modules/.cache
rm -rf node_modules/.vite

# 检查环境变量配置
echo -e "\n${YELLOW}🔍 检查环境变量...${NC}"
if [ -f ".env.production" ]; then
    echo -e "${GREEN}   ✓ 找到 .env.production${NC}"
    echo -e "${YELLOW}   环境变量预览：${NC}"
    cat .env.production | grep -v "^#" | grep -v "^$" | sed 's/^/     /'
elif [ -f ".env.local" ]; then
    echo -e "${YELLOW}   ⚠️  未找到 .env.production，将使用 .env.local${NC}"
else
    echo -e "${YELLOW}   ⚠️  未找到环境变量文件，将使用默认配置${NC}"
fi

# 执行 Vite 构建
echo -e "\n${YELLOW}🔨 执行 Vite 构建...${NC}"
echo -e "${YELLOW}   配置: vite.config.ts${NC}"
echo -e "${YELLOW}   输出目录: ${DIST_DIR}/${NC}"
echo -e "${YELLOW}   Base Path: /workshop/${NC}"

# 执行构建
if ! npm run build; then
    echo -e "\n${RED}❌ Vite 构建失败${NC}"
    echo -e "${RED}   请查看上方错误信息${NC}"
    exit 1
fi

# 验证构建结果
echo -e "\n${YELLOW}✅ 验证构建文件...${NC}"

if [ ! -d "$DIST_DIR" ]; then
    echo -e "${RED}❌ 构建失败：未生成 ${DIST_DIR} 目录${NC}"
    exit 1
fi

if [ ! -f "$DIST_DIR/index.html" ]; then
    echo -e "${RED}❌ 构建失败：未找到 index.html${NC}"
    exit 1
fi

echo -e "${GREEN}   ✓ index.html 存在${NC}"

# 检查关键资源
if [ -d "$DIST_DIR/assets" ]; then
    echo -e "${GREEN}   ✓ assets 目录存在${NC}"
    JS_COUNT=$(find "$DIST_DIR/assets" -name "*.js" | wc -l | tr -d ' ')
    CSS_COUNT=$(find "$DIST_DIR/assets" -name "*.css" | wc -l | tr -d ' ')
    echo -e "${GREEN}   ✓ 找到 ${JS_COUNT} 个 JS 文件，${CSS_COUNT} 个 CSS 文件${NC}"
fi

# 统计文件数量和大小
FILE_COUNT=$(find "$DIST_DIR" -type f | wc -l | tr -d ' ')
DIR_SIZE=$(du -sh "$DIST_DIR" | awk '{print $1}')

echo -e "${GREEN}   ✓ 共生成 ${FILE_COUNT} 个文件${NC}"
echo -e "${GREEN}   ✓ 总大小: ${DIR_SIZE}${NC}"

# 创建部署说明文件
cat > "$DIST_DIR/DEPLOY.md" << 'EOF'
# OSS 部署说明

## 📦 打包信息
- 构建工具：Vite
- 构建模式：Production Build
- 部署方式：阿里云 OSS / 其他静态存储服务
- 文件格式：纯静态文件（HTML + JS + CSS）

## 🚀 部署到阿里云 OSS

### 步骤 1：上传文件

1. **登录阿里云 OSS 控制台**
   - 访问：https://oss.console.aliyun.com/

2. **选择或创建 Bucket**
   - 建议使用与域名相同的 bucket 名称
   - 选择合适的地域
   - 读写权限：公共读

3. **上传文件**
   - 进入 bucket 的文件管理页面
   - 点击"上传文件"
   - 选择 `dist/` 目录下的**所有文件**（不是 dist 目录本身）
   - 确保上传时保持目录结构

   **重要**：上传到根目录或子目录（如 `/workshop/`），确保 `index.html` 在正确的位置。

### 步骤 2：配置静态网站托管

1. **启用静态网站托管**
   - 在 bucket 设置中找到"基础设置" > "静态页面"
   - 点击"设置"
   - 选择"启用"

2. **配置首页和错误页**
   - **默认首页**：`index.html`
   - **默认 404 页**：`index.html`（**重要**：用于支持 SPA 客户端路由）

3. **保存配置**

### 步骤 3：配置访问权限

确保 bucket 的读写权限设置为"公共读"，或配置具体的读权限策略。

### 步骤 4：配置域名（可选）

1. **绑定自定义域名**
   - 在 bucket 设置中找到"传输管理" > "域名管理"
   - 添加自定义域名
   - 配置 DNS CNAME 解析

2. **配置 HTTPS**
   - 在域名管理中启用 HTTPS
   - 上传 SSL 证书或使用阿里云免费证书

### 步骤 5：配置 CORS（必需，用于 API 调用）

1. 在 bucket 设置中找到"权限管理" > "跨域设置"
2. 添加规则：
   - **来源**：`*`（或指定你的 API 域名）
   - **允许 Methods**：GET, HEAD, POST, PUT, DELETE, OPTIONS
   - **允许 Headers**：`*`
   - **暴露 Headers**：`*`
   - **缓存时间**：3600

## ⚙️ 环境变量配置

在打包前确保配置了正确的环境变量：

**方法 1：创建 `.env.production` 文件**

```bash
# API 地址
VITE_API_URL=https://api.feitianchengzi.com/workshop/v1
VITE_GATEWAY_URL=https://api.feitianchengzi.com
```

**方法 2：在命令行中设置**

```bash
export VITE_API_URL=https://api.feitianchengzi.com/workshop/v1
export VITE_GATEWAY_URL=https://api.feitianchengzi.com
npm run build
```

## 📋 验证清单

部署完成后，请验证：

- [ ] 首页可以正常访问（如 `https://your-domain.com/workshop/`）
- [ ] 静态资源（CSS、JS）正常加载（检查浏览器 Network 标签）
- [ ] 路由跳转正常（SPA 路由）
- [ ] 刷新页面不会出现 404（依赖 OSS 的 404 页面配置）
- [ ] API 请求正常（检查浏览器 Console）
- [ ] 登录认证功能正常
- [ ] 项目列表、任务列表等功能正常

## 📁 文件结构

```
dist/
├── index.html          # 入口 HTML 文件
├── assets/             # 静态资源目录
│   ├── index-xxx.js    # 打包后的 JS 文件（带哈希）
│   ├── index-xxx.css   # 打包后的 CSS 文件（带哈希）
│   └── ...             # 其他资源文件
├── vite.svg            # 图标文件
└── DEPLOY.md           # 本文档
```

## ⚠️ 注意事项

1. **Base Path 配置**
   - 本项目配置了 `base: '/workshop/'`（在 `vite.config.ts` 中）
   - 如果部署到 OSS 根目录，需要将文件上传到 `/workshop/` 子目录
   - 或者修改 `vite.config.ts` 中的 `base` 配置为 `/`

2. **404 页面配置**
   - **必须**将 OSS 的"默认 404 页"设置为 `index.html`
   - 否则刷新页面或直接访问动态路由会返回 404

3. **API 地址配置**
   - 确保 `.env.production` 或构建时的环境变量中配置了正确的 API 地址
   - Vite 使用 `VITE_` 前缀的环境变量

4. **HTTPS**
   - 生产环境强烈建议使用 HTTPS
   - 浏览器的某些 API（如 Geolocation）要求 HTTPS

5. **缓存策略**
   - **HTML 文件**：不缓存或短期缓存（如 5 分钟）
   - **assets/ 下的文件**：长期缓存（如 1 年），因为文件名包含哈希

6. **CDN 加速**
   - 建议配合阿里云 CDN 使用，提升全国访问速度
   - 配置 CDN 时注意缓存规则和回源设置

## 🔧 常见问题

### Q: 页面显示空白？
A: 
1. 打开浏览器开发者工具（F12）
2. 查看 Console 是否有错误
3. 查看 Network 标签，检查资源加载情况
4. 确认 Base Path 配置是否正确

### Q: 路由跳转后刷新页面显示 404？
A: 
- 检查 OSS 的"默认 404 页"是否设置为 `index.html`
- 如果部署到子目录（如 `/workshop/`），404 页面路径应该是 `/workshop/index.html`

### Q: API 请求失败，出现 CORS 错误？
A: 
- 检查 OSS 的 CORS 配置
- 检查后端 API 的 CORS 配置
- 确认 API 地址是否正确（查看 Network 标签的请求 URL）

### Q: 静态资源加载失败（404）？
A: 
- 检查 Base Path 配置是否与实际部署路径一致
- 确认文件上传路径正确，保持目录结构
- 检查 `assets/` 目录是否完整上传

### Q: 如何修改 Base Path？
A: 
编辑 `vite.config.ts`：
```typescript
export default defineConfig({
  base: '/',  // 改为根路径
  // 或
  base: '/your-path/',  // 改为其他路径
})
```
然后重新构建。

## 🛠️ 本地测试

在上传到 OSS 之前，可以在本地测试构建结果：

```bash
# 安装 serve（如果还没安装）
npm install -g serve

# 预览构建结果
npm run preview

# 或使用 serve
serve -s dist -l 3000
```

访问 `http://localhost:3000/workshop/` 测试。

## 📞 技术支持

如遇到问题：
1. 检查浏览器控制台的错误信息
2. 检查 OSS 的配置（静态网站托管、CORS、404 页面）
3. 检查环境变量配置
4. 查看构建日志
EOF

# 显示构建信息
echo -e "\n${GREEN}✅ Vite 构建完成！${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}📁 产物目录：${NC}$(pwd)/$DIST_DIR"
echo -e "${GREEN}📊 目录大小：${NC}${DIR_SIZE}"
echo -e "${GREEN}📄 文件数量：${NC}${FILE_COUNT} 个文件"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}💡 部署步骤：${NC}"
echo -e "   1. 将 ${BLUE}$DIST_DIR/${NC} 目录下的所有文件上传到 OSS"
echo -e "   2. 在 OSS 中启用静态网站托管"
echo -e "   3. 设置默认首页和 404 页为 ${BLUE}index.html${NC}"
echo -e "   4. 配置 CORS（允许跨域 API 请求）"
echo -e "   5. 查看 ${BLUE}$DIST_DIR/DEPLOY.md${NC} 了解详细步骤"
echo -e ""
echo -e "${YELLOW}🧪 本地预览：${NC}"
echo -e "   运行 ${BLUE}npm run preview${NC} 预览构建结果"
echo -e ""
echo -e "${YELLOW}📝 注意事项：${NC}"
echo -e "   • Base Path 配置为 ${BLUE}/workshop/${NC}，请确保部署路径一致"
echo -e "   • 必须设置 OSS 的 404 页面为 ${BLUE}index.html${NC} 以支持客户端路由"
echo -e "   • 确认环境变量（API 地址）配置正确"

