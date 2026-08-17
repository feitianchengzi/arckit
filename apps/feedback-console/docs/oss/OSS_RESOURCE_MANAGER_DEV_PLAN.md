# OssResourceManager 开发方案（基于现有代码结构）

本文档基于当前仓库已有上传/加载结构，制定**分阶段、可回滚**的开发方案。**优先上传路径的微重构**：核心上传逻辑原封保留，仅收口「路径」来源（Purpose → directory）。

---

## 一、原则与约束

### 1.1 不动部分（严禁修改）

以下文件的**实现逻辑**保持不变，避免影响现有头像、附件上传与 OSS 行为：

| 文件 | 说明 |
|------|------|
| `src/lib/oss/upload/uploadToOSS.ts` | 核心上传：SDK 加载、client 创建、put、callback、错误处理等**全部保留**，不删不改。 |
| `src/lib/oss/upload/generateObjectKey.ts` | `joinPath(rootPath, \`${directory}/${fileName}\`)` 逻辑不变；已支持多级目录（如 `attachments/comment/image`）。 |
| `src/lib/oss/sdk.ts` | `joinPath`、`loadOSSSDK`、`getFileExtension` 等不变。 |
| `src/lib/oss/load/*` | 整条加载链不动。 |

### 1.2 路径约定（评论必须带 attachments 前缀）

评论相关对象一律落在 `attachments` 下，便于与现有「通用附件」区分且便于策略/统计：

| Purpose | directory 字符串 | 示例 objectKey |
|---------|------------------|----------------|
| 评论图片 | `attachments/comment/image` | `{rootPath}/attachments/comment/image/1738xxx_abc.jpg` |
| 评论附件 | `attachments/comment/file`  | `{rootPath}/attachments/comment/file/1738xxx_xyz.pdf` |

其余：`avatars`、`documents`、`attachments`（OTHERS）与现有保持一致。

---

## 二、阶段概览

| 阶段 | 内容 | 涉及文件 |
|------|------|----------|
| **阶段 A** | 路径枚举与映射（Purpose → directory） | 新增/扩展 `upload` 类型与常量 |
| **阶段 B** | OssResourceManager 本体（resolve + upload 薄封装） | 新增 `OssResourceManager.ts`，引用 upload 与 load |
| **阶段 C** | 评论侧接入（按需，可后续） | CommentEditor / 评论上传调用处 |

阶段 A 为**纯增量**（只加类型和常量，不改现有调用），风险最低，建议最先完成。

---

## 三、阶段 A：路径枚举与映射（微重构核心）

**目标**：引入 `OssUploadPurpose` 与 `PURPOSE_TO_DIR`，把「传哪个目录」收口到一处；**不修改** `uploadToOSS`、`generateObjectKey` 的实现，仅让「谁传 directory」变为由映射表驱动。

### 3.1 新增常量与类型

**文件**：`src/lib/oss/upload/purpose.ts`（新建）

**内容**：

```ts
/**
 * OSS 上传业务意图（与物理路径解耦）
 */
export enum OssUploadPurpose {
  AVATAR = 'AVATAR',
  COMMENT_IMAGE = 'COMMENT_IMAGE',
  COMMENT_FILE = 'COMMENT_FILE',
  DOCUMENTS = 'DOCUMENTS',
  OTHERS = 'OTHERS',
}

/** Purpose → 传给 uploadToOSS 的 directory 字符串（评论挂在 attachments 下） */
export const PURPOSE_TO_DIR: Record<OssUploadPurpose, string> = {
  [OssUploadPurpose.AVATAR]: 'avatars',
  [OssUploadPurpose.COMMENT_IMAGE]: 'attachments/comment/image',
  [OssUploadPurpose.COMMENT_FILE]: 'attachments/comment/file',
  [OssUploadPurpose.DOCUMENTS]: 'documents',
  [OssUploadPurpose.OTHERS]: 'attachments',
}
```

**说明**：不修改 `upload/types.ts` 中 `OSSDirectory` 的定义；`uploadToOSS` 仍接受 `directory: OSSDirectory`（即 `string`），由调用方传入 `PURPOSE_TO_DIR[purpose]` 即可。

### 3.2 导出与索引

**文件**：`src/lib/oss/upload/index.ts`

在现有 `export` 基础上增加（若已存在可从类型文件 re-export）：

```ts
// 在现有 export 后追加
export { OssUploadPurpose, PURPOSE_TO_DIR } from './purpose'
```

若项目内上传统一从 `upload/index` 引用，则业务与 OssResourceManager 一律从该处拿 `OssUploadPurpose`、`PURPOSE_TO_DIR`，保证路径只在这一处维护。

### 3.3 本阶段不改动的调用

- `uploadApi.uploadAvatarToOSS` 仍写死 `'avatars'`，不改为从 PURPOSE_TO_DIR 取。
- `uploadApi.uploadAttachmentToOSS` 仍写死 `'attachments'`。
- `uploadApi.uploadDocumentToOSS` 仍写死 `'documents'`。

这样阶段 A 为**零行为变化**，仅增加可复用的路径映射，便于后续 OssResourceManager 与评论使用。

### 3.4 验收

- 新增 `purpose.ts`，类型与映射表与上表一致（评论为 `attachments/comment/image`、`attachments/comment/file`）。
- `upload/index.ts` 能导出 `OssUploadPurpose`、`PURPOSE_TO_DIR`。
- 现有上传（头像、附件、文档）行为与回归不变；未使用 purpose 的调用保持原样。

---

## 四、阶段 B：OssResourceManager 本体

**目标**：新增 `OssResourceManager`，对「加载」做 Facade 转发，对「上传」做 purpose → directory 转发；**仍不修改** `uploadToOSS`、`generateObjectKey`、load 链的实现。

### 4.1 新建入口文件

**文件**：`src/lib/oss/OssResourceManager.ts`

**职责**：

1. **加载**（仅转发）  
   - `resolve(key)` → `getOssResourceLoader().getUrl(key)`，空 key 返回 `''`。  
   - `resolveSync(key)` → `getOssResourceLoader().getUrlSync(key)`。  
   - 不实现缓存、合并请求等逻辑。

2. **上传**（只做路径映射 + 调用既有上传）  
   - `upload(file, options)`，其中 `options` 必含 `purpose: OssUploadPurpose`、`credentials: STSCredentials`，可选 `onProgress?`、`callbackUrl?`、`callbackBody?`。  
   - 内部：`directory = PURPOSE_TO_DIR[options.purpose]`，然后调用现有 `uploadToOSS(file, options.credentials, directory, options.onProgress, options.callbackUrl, options.callbackBody)`。  
   - 返回 `Promise<{ key: string; url?: string }>`，其中 `key` 来自 `UploadResult.objectKey`，`url` 来自 `UploadResult.url`（若存在）。

**依赖**：

- `getOssResourceLoader`、 loader 的 `getUrl` / `getUrlSync` 来自 `./load`。
- `uploadToOSS`、`OssUploadPurpose`、`PURPOSE_TO_DIR` 来自 `./upload`（或 `./upload/purpose`）。
- `STSCredentials` 来自 `@/lib/api/endpoints/upload`（或当前 upload 使用的类型来源）。

**禁止**：在 OssResourceManager 内写 STS、签名、重试、缓存、请求合并等；只做转发与 purpose→directory 查表。

### 4.2 导出

在 `src/lib/oss/` 下若有 `index.ts`，可增加对 OssResourceManager 的 re-export，便于业务 `import { OssResourceManager } from '@/lib/oss'`。若无统一入口，则业务直接从 `@/lib/oss/OssResourceManager` 引用即可。

### 4.3 验收

- 使用 `OssResourceManager.upload(file, { purpose: OssUploadPurpose.COMMENT_IMAGE, credentials })` 上传的 objectKey 形态为 `{rootPath}/attachments/comment/image/...`。
- 使用 `OssResourceManager.upload(file, { purpose: OssUploadPurpose.COMMENT_FILE, credentials })` 的 objectKey 形态为 `{rootPath}/attachments/comment/file/...`。
- `resolve` / `resolveSync` 行为与直接调 `getOssResourceLoader()` 一致。
- 未改动 `uploadToOSS.ts`、`generateObjectKey.ts`、`load/*` 任一实现。

---

## 五、阶段 C：评论侧接入（可选、可后续）

**目标**：评论中的图片/文件上传改为走 OssResourceManager，并使用 `COMMENT_IMAGE` / `COMMENT_FILE`，从而落盘到 `attachments/comment/image`、`attachments/comment/file`。

### 5.1 当前评论上传入口

- 当前在 `CommentEditor.tsx` 中，若存在「文件评论」或图片上传，一般会调 `uploadAttachmentToOSS`（对应 directory `'attachments'`）。
- 接 OssResourceManager 后：改为先取 `credentials`，再调 `OssResourceManager.upload(file, { purpose: OssUploadPurpose.COMMENT_IMAGE | COMMENT_FILE, credentials, onProgress })`，用返回的 `key` 写入评论内容或附件字段（按现有「全 text」或接口约定）。

### 5.2 涉及文件与改动点

| 文件 | 改动 |
|------|------|
| `CommentEditor.tsx`（或实际发起评论上传的组件） | 将评论图片/文件的上传调用从 `uploadAttachmentToOSS` 改为 `OssResourceManager.upload(..., { purpose: COMMENT_IMAGE | COMMENT_FILE, ... })`，传入的 credentials 来源保持不变（如 `uploadApi.getSTSToken()`）。 |
| 其它评论相关上传 | 若有其它入口上传「评论用」的图/文件，同样收口到 `OssResourceManager.upload` + 对应 purpose。 |

不要求本阶段顺带改评论的展示与存储结构，只要求**上传路径**从通用 `attachments` 收口到 `attachments/comment/image`、`attachments/comment/file`。

### 5.3 验收

- 评论内上传的图片/文件，objectKey 符合 `.../attachments/comment/image/...` 或 `.../attachments/comment/file/...`。
- 现有评论的展示、提交、加载逻辑可保持不变，仅上传落地路径变更。

---

## 六、文件清单与依赖关系

```
src/lib/oss/
├── upload/
│   ├── types.ts          # 不变（OSSDirectory、UploadResult）
│   ├── generateObjectKey.ts  # 不变
│   ├── uploadToOSS.ts    # 不变
│   ├── purpose.ts        # 新增：OssUploadPurpose、PURPOSE_TO_DIR
│   └── index.ts          # 增加对 purpose 的导出
├── load/                 # 全部不变
├── uploadApi.ts          # 阶段 A/B 可不改；阶段 C 仅改「评论上传」的调用处
└── OssResourceManager.ts # 新增：resolve、resolveSync、upload（转发 + purpose 查表）
```

调用关系（上传路径仅在此收口）：

- `OssResourceManager.upload` → `PURPOSE_TO_DIR[purpose]` → `uploadToOSS(..., directory, ...)` → `generateObjectKey(rootPath, directory, fileName)`（均保持原样）。

---

## 七、实施顺序与回滚

1. **先做阶段 A**：只加 `purpose.ts` 与导出，跑一遍现有上传相关用例，确认无回归。
2. **再做阶段 B**：加 OssResourceManager，用单测或手工验证 COMMENT_IMAGE / COMMENT_FILE 的 objectKey 形态，以及 resolve/resolveSync 与 loader 一致。
3. **最后按需做阶段 C**：在评论上传处替换为 OssResourceManager + COMMENT_IMAGE / COMMENT_FILE。

任一步可独立回滚：阶段 A 回滚即删 `purpose.ts` 及对应导出；阶段 B 回滚即删 `OssResourceManager.ts`；阶段 C 回滚即把评论上传调用改回 `uploadAttachmentToOSS`。

---

## 八、与设计文档的对应

- 路径定义与「评论必须在 attachments 下」的约定已同步到 **`OSS_RESOURCE_MANAGER_DESIGN.md`**（PURPOSE_TO_DIR 表、objectKey 示例）。
- 本开发方案严格遵循该设计中「核心上传逻辑不动、仅路径收口」的要求，且评论路径以 `attachments/comment/image`、`attachments/comment/file` 为准。
