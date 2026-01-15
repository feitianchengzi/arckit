# Todo 管理系统 - 前端

基于 **Vite + React + TypeScript + React Router v6** 构建的现代化前端应用。

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发
```bash
npm run dev
# 访问: http://localhost:3000/workshop/
```

### 构建
```bash
npm run build
# 输出: dist/
```

### 预览
```bash
npm run preview
```

## 技术栈

- ⚡️ **Vite** - 极速构建工具
- ⚛️ **React 18** - UI 框架
- 🎨 **Tailwind CSS** - 样式框架
- 🧭 **React Router v6** - 路由管理
- 🔄 **React Query** - 数据管理
- 🐻 **Zustand** - 状态管理
- 📘 **TypeScript** - 类型安全

## 项目结构

```
src/
├── main.tsx           # 应用入口
├── App.tsx            # 路由配置
├── pages/             # 页面组件
├── layouts/           # 布局组件
├── components/        # UI 组件
├── hooks/             # 自定义 Hooks
├── lib/               # 工具库
├── store/             # 状态管理
└── types/             # 类型定义
```

## 环境变量

创建 `.env.local`:

```env
VITE_API_URL=https://api.example.com
```

## 部署

```bash
# 构建
npm run build

# 部署 dist/ 目录到 OSS 的 /workshop 路径
```

## 文档

- [迁移完成报告](./MIGRATION_COMPLETE.md)
- [迁移状态](./MIGRATION_STATUS.md)
