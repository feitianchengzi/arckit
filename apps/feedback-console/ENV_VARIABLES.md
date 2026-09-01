# 环境变量配置

## Vite 环境变量说明

在 Vite 中，环境变量必须以 `VITE_` 开头才能在客户端代码中访问。

### 可用变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_URL` | Workshop API 基础 URL | `https://api.feitianchengzi.com/workshop/v1` |
| `VITE_GATEWAY_URL` | 网关 API 基础 URL | `https://api.feitianchengzi.com` |

### 配置方式

#### 方式 1: `.env.local` 文件（推荐）

在项目根目录创建 `.env.local`:

```env
VITE_API_URL=https://api.feitianchengzi.com/workshop/v1
VITE_GATEWAY_URL=https://api.feitianchengzi.com
```

#### 方式 2: 命令行

```bash
VITE_API_URL=https://api.example.com npm run dev
```

#### 方式 3: 系统环境变量

```bash
export VITE_API_URL=https://api.example.com
npm run dev
```

### 使用方式

在代码中使用 `import.meta.env`:

```typescript
// ✅ 正确
const apiUrl = import.meta.env.VITE_API_URL

// ❌ 错误（Vite 中不支持）
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

### 注意事项

1. **变量命名**: 必须以 `VITE_` 开头
2. **类型安全**: 已配置 `src/vite-env.d.ts` 提供类型提示
3. **构建时替换**: 环境变量在构建时会被替换为实际值
4. **敏感信息**: 不要在前端代码中存储敏感信息（如密钥）

### 迁移说明

从 Next.js 迁移时，需要将：
- `NEXT_PUBLIC_*` → `VITE_*`
- `process.env.*` → `import.meta.env.*`

