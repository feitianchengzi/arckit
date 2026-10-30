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

## 帮助与反馈接入

Todo 通过全屏透明 iframe 嵌入新版 Feedback SDK；“反馈建议”打开智能客服，“我的反馈”打开反馈列表。面板布局、宽度和关闭按钮由 SDK 管理，宿主以 `postMessage` 完成 ready/configure/open 通信，不读取 iframe 内部 DOM。

部署需先在同源 `/sdk` 发布新版 SDK，或通过构建变量 `VITE_FEEDBACK_SDK_URL` 指向已发布入口。跨域部署时，SDK 的受信任父页面配置需包含 Todo 的 origin。语音还需 HTTPS、iframe 麦克风授权及服务器 Permissions-Policy 允许 SDK origin。

当前沿用已有 `VITE_FEEDBACK_API_KEY`，显式启用新版 API Key 模式，反馈项目仍为 45，用户 ID 沿用原 Profile/Token 标识以保留历史归属。此模式的 API Key 在客户端可见；短期 Session 的服务端交换与续期尚未接入，不能把当前接入描述为 Session 模式。缺失凭据或服务不可用时显示失败提示，不生成预览身份或伪造成功。

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
