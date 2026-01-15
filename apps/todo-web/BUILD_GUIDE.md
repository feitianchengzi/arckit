# Vite 项目打包与部署指南

## 📦 Vite vs Next.js 打包对比

### Next.js 打包（旧方案，已弃用）
```bash
npm run build                    # 生成 .next/ 目录
手动复制文件到 out/ 目录          # 需要脚本处理
上传 out/ 到 OSS
```

### Vite 打包（当前方案）✅
```bash
npm run build                    # 直接生成 dist/ 目录
上传 dist/ 到 OSS               # 不需要额外处理
```

**关键区别：**
- ✅ Vite 更简单：`build` 命令直接生成可部署的文件
- ✅ 输出目录清晰：`dist/` 目录即最终产物
- ✅ 不需要手动复制文件：Vite 自动处理所有资源
- ✅ 更快的构建速度：Vite 使用 Rollup 打包

---

## 🚀 快速开始

### 1. 配置环境变量

**创建生产环境配置文件：**

```bash
cd frontend
cp .env.local .env.production
```

或手动创建 `.env.production`：

```bash
# .env.production
VITE_API_URL=https://api.feitianchengzi.com/workshop/v1
VITE_GATEWAY_URL=https://api.feitianchengzi.com
```

⚠️ **注意：** Vite 使用 `VITE_` 前缀，不是 Next.js 的 `NEXT_PUBLIC_`

### 2. 执行打包

**方法 A：使用打包脚本（推荐）**

```bash
npm run build:export
```

脚本会自动：
- 清理旧的构建产物
- 检查环境变量配置
- 执行 Vite 构建
- 验证构建结果
- 生成部署说明文档
- 显示构建统计信息

**方法 B：直接使用 Vite 构建**

```bash
npm run build
```

简单直接，输出到 `dist/` 目录。

### 3. 本地预览

```bash
npm run preview
```

访问 `http://localhost:4173/workshop/` 预览构建结果。

### 4. 部署到 OSS

上传 `dist/` 目录下的**所有文件**到 OSS。

详细步骤见 `dist/DEPLOY.md`。

---

## 📁 构建产物结构

```
dist/
├── index.html              # 入口文件
├── assets/                 # 静态资源（带哈希的文件名）
│   ├── index-a1b2c3.js    # 主 JS bundle
│   ├── index-d4e5f6.css   # 主 CSS bundle
│   ├── vendor-g7h8i9.js   # 第三方库 chunk
│   └── ...
├── vite.svg                # 图标
└── DEPLOY.md               # 部署说明

✅ 可以直接上传到 OSS，无需额外处理
```

---

## 🛠️ 打包脚本详解

### `build-vite.sh` vs `build-export.sh`

| 特性 | `build-vite.sh` (新) | `build-export.sh` (旧) |
|------|---------------------|----------------------|
| **构建工具** | Vite | Next.js |
| **输出目录** | `dist/` | `out/` |
| **文件处理** | 自动 | 手动复制 |
| **复杂度** | 低 | 高 |
| **构建速度** | 快 | 较慢 |
| **状态** | ✅ 使用中 | ❌ 已弃用 |

### 脚本功能

`build-vite.sh` 提供以下功能：

1. **清理旧构建**
   - 删除 `dist/` 目录
   - 清理 Vite 缓存

2. **环境变量检查**
   - 检测 `.env.production` 文件
   - 显示配置预览

3. **执行构建**
   - 运行 `npm run build`
   - 捕获构建错误

4. **验证构建结果**
   - 检查 `index.html` 是否存在
   - 统计 JS/CSS 文件数量
   - 计算总文件数和大小

5. **生成部署文档**
   - 自动创建 `dist/DEPLOY.md`
   - 包含完整的 OSS 部署步骤

6. **友好的输出**
   - 彩色日志
   - 构建进度提示
   - 错误提示

---

## ⚙️ 配置文件

### `vite.config.ts`

关键配置：

```typescript
export default defineConfig({
  base: '/workshop/',        // 部署路径（重要！）
  build: {
    outDir: 'dist',          // 输出目录
    assetsDir: 'assets',     // 静态资源目录
    rollupOptions: {
      output: {
        manualChunks: {      // 代码分割
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // 路径别名
    },
  },
})
```

### 环境变量文件优先级

```
.env.production       # 生产环境（npm run build 时使用）
.env.local            # 本地开发（所有环境）
.env                  # 默认配置
```

---

## 🔧 常见问题

### Q1: 为什么不用 `build-export.sh`？

A: 因为我们从 Next.js 迁移到了 Vite。Next.js 的打包流程需要手动处理文件，而 Vite 自动处理所有事情，更简单高效。

### Q2: `base: '/workshop/'` 是什么？

A: 这是部署的**子路径**。如果你的应用部署在：
- `https://example.com/workshop/` → 使用 `base: '/workshop/'`
- `https://example.com/` → 改为 `base: '/'`

### Q3: 如何修改部署路径？

A: 编辑 `vite.config.ts`：

```typescript
export default defineConfig({
  base: '/',  // 部署到根路径
})
```

然后重新构建。

### Q4: 环境变量为什么不生效？

A: 检查：
1. 文件名是否为 `.env.production`
2. 变量名是否以 `VITE_` 开头（不是 `NEXT_PUBLIC_`）
3. 是否重新构建（环境变量在构建时注入）

### Q5: 如何查看构建后的文件大小？

A: 
```bash
# 方法 1: 使用打包脚本（自动显示）
npm run build:export

# 方法 2: 手动查看
npm run build
du -sh dist/
```

### Q6: 构建失败怎么办？

A: 常见原因：
1. **TypeScript 错误**: 运行 `npm run build:check`
2. **依赖问题**: 运行 `npm install`
3. **环境变量**: 检查 `.env.production`
4. **磁盘空间**: 清理 `node_modules/.cache`

---

## 📊 构建优化

### 代码分割

Vite 自动进行代码分割，你可以在 `vite.config.ts` 中配置：

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'router': ['react-router-dom'],
        'query': ['@tanstack/react-query'],
      },
    },
  },
}
```

### 分析构建产物

```bash
# 安装分析工具
npm install --save-dev rollup-plugin-visualizer

# 构建并生成分析报告
npm run build
open stats.html
```

### 压缩优化

Vite 默认已启用：
- ✅ JavaScript 压缩（esbuild）
- ✅ CSS 压缩
- ✅ 图片优化
- ✅ Tree shaking

---

## 🎯 最佳实践

### 1. 构建前检查

```bash
# 运行 linter
npm run lint

# 类型检查
npm run build:check
```

### 2. 环境变量管理

- ✅ 使用 `.env.production` 存储生产配置
- ✅ 不要提交 `.env.production` 到 Git
- ✅ 提供 `.env.production.example` 作为模板

### 3. 部署流程

```bash
# 1. 确保代码最新
git pull origin main

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.production.example .env.production
# 编辑 .env.production

# 4. 执行构建
npm run build:export

# 5. 上传到 OSS
# 使用 OSS 控制台或 CLI 工具
```

### 4. 持续集成

在 CI/CD 中使用：

```yaml
# .github/workflows/deploy.yml
- name: Build
  run: |
    cd frontend
    npm install
    npm run build
    
- name: Deploy to OSS
  run: |
    # 使用 ossutil 上传
    ossutil cp -r frontend/dist/ oss://your-bucket/workshop/
```

---

## 📚 相关文档

- [Vite 官方文档](https://vitejs.dev/)
- [Vite 构建优化](https://vitejs.dev/guide/build.html)
- [阿里云 OSS 文档](https://help.aliyun.com/product/31815.html)
- 项目部署说明：`dist/DEPLOY.md`（构建后生成）

---

## 🆘 获取帮助

遇到问题？

1. 查看构建日志：`npm run build:export 2>&1 | tee build.log`
2. 查看 Vite 文档：https://vitejs.dev/
3. 检查浏览器控制台错误
4. 联系开发团队

