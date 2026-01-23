# OSS 文件管理文档

本目录包含与阿里云 OSS 文件上传和展示相关的所有文档。

## 📚 文档列表

### 上传相关
- **[OSS_AVATAR_UPLOAD_REVIEW.md](./OSS_AVATAR_UPLOAD_REVIEW.md)** - 头像上传实现指南（STS + OSS Browser SDK）
- **[OSS_CORS_CONFIG.md](./OSS_CORS_CONFIG.md)** - OSS Bucket CORS 配置指南

### 展示相关
- **[OSS_FILE_DISPLAY.md](./OSS_FILE_DISPLAY.md)** - 文件展示/获取实现指南

### 架构设计
- **[OSS_FILE_LOADER_DESIGN.md](./OSS_FILE_LOADER_DESIGN.md)** - 文件加载管理器架构设计（统一加载方案）

## 🔗 相关代码文件

### API 和工具
- `frontend/src/lib/api/endpoints/upload.ts` - STS 凭证获取 API
- `frontend/src/lib/utils/ossUpload.ts` - OSS 上传和文件获取工具函数

### UI 组件
- `frontend/src/components/ui/Avatar.tsx` - 头像展示组件
- `frontend/src/components/ui/AvatarCropUpload.tsx` - 头像裁剪上传组件
- `frontend/src/components/ui/AvatarUpload.tsx` - 头像上传组件

## 📖 快速开始

1. **上传文件**：参考 [OSS_AVATAR_UPLOAD_REVIEW.md](./OSS_AVATAR_UPLOAD_REVIEW.md)
2. **展示文件**：参考 [OSS_FILE_DISPLAY.md](./OSS_FILE_DISPLAY.md)
3. **配置 CORS**：参考 [OSS_CORS_CONFIG.md](./OSS_CORS_CONFIG.md)
4. **架构设计**：参考 [OSS_FILE_LOADER_DESIGN.md](./OSS_FILE_LOADER_DESIGN.md) - **推荐阅读**，了解统一加载管理器的设计思路

