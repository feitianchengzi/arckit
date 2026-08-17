# OssResourceManager 理解与开发方案

## 最终决定（已确认）

以下四项为已确认方案，直接按此落地实现。

### 1. 命名与路径

- **最终决定**：使用 **OssResourceManager**，文件路径为 `src/lib/oss/OssResourceManager.ts`。
- **理由**：该类需同时处理图片（Image）与非图片（File）资源，且未来可能承载更多 OSS 资源操作，使用更具通用性的 OssResourceManager 优于特定的 ImageManager。

### 2. 加载：Facade 薄封装

- **最终决定**：首版仅提供 `resolve(key)` 和 `resolveSync(key)` 两个方法。
- **实现逻辑**：
  - 不对现有加载逻辑做任何修改或重写，仅通过 OssResourceManager **转发**调用 `getOssResourceLoader().getUrl(key)` 及其同步版本。
  - **严禁**在 OssResourceManager 中编写缓存、合并请求等逻辑；所有缓存与请求合并仍由既有 load 链负责。

### 3. 目录：基于业务意图（Purpose）的映射

- **最终决定**：引入 **OssUploadPurpose** 枚举，将业务语义与物理路径解耦。
- **枚举与映射**：

| OssUploadPurpose | 物理目录 (directory) | 用途说明 |
|------------------|----------------------|----------|
| `AVATAR`         | `avatars`            | 用户头像 |
| `COMMENT_IMAGE`  | `attachments/comment/image` | 评论中的图片（挂在 attachments 下） |
| `COMMENT_FILE`   | `attachments/comment/file`  | 评论中的附件（挂在 attachments 下） |
| `DOCUMENTS`      | `documents`          | 文档 |
| `OTHERS`         | `attachments`        | 其它 / 后端原始默认路径（保留） |

- **逻辑**：`upload` 方法将 `purpose` 作为**必填参数**，内部根据该参数查表得到物理目录，再调用现有 `uploadToOSS`。

### 4. 评论上传：直接接入，不设业务便捷方法

- **最终决定**：
  - **调用点**：本阶段直接在评论功能中接入 **OssResourceManager.upload**。
  - **接口设计**：OssResourceManager **不**提供 `uploadCommentImage`、`uploadCommentFile` 等业务便捷方法，仅保留通用 **`upload(file, { purpose, ... })`**。
  - **业务逻辑**：采用「全 text」方案（无独立附件列表，仅在正文中插入链接）。评论组件调用 `upload` 拿到返回的 `key` 后，由**组件自行**决定如何拼接并插入输入框（或后续 Tiptap 等编辑器内容）。

---

## 一、理解

### 1.1 业务背景

- 资源（图片、文件）存 OSS，接口只给 **objectKey**，没有可直接用的 URL（需签名、动态过期）。
- 需要两条业务链：
  1. **加载（Resolve）**：objectKey → 可访问的 URL（由既有 load 链负责 key 缓存、二级缓存、浏览器缓存策略）。
  2. **上传（Upload）**：本地文件 → OSS → 得到 objectKey；上传时前端通过 **purpose** 决定物理目录，objectKey = root_path + directory + 文件名。

### 1.2 现有实现（不改动，仅做封装/映射）

**加载链（已成型、逻辑不改）：**

- 入口：`getOssResourceLoader()` → `OssResourceLoadManager`（单例）。
- 对外能力：`getUrl(objectKey)`、`getUrlSync(objectKey)`、`prefetch`、`refresh`、`clearCache`、`subscribe`。
- 内部：RequestCoordinator → StorageManager（L1 内存 + L2 持久化）+ SignatureProvider + StatusMonitor；同一 objectKey 在有效期内返回相同 URL，以利用浏览器 Disk Cache。
- OssResourceManager 仅做 **Facade**：对外暴露 `resolve` / `resolveSync`，内部直接转发到上述 loader，**不实现**任何缓存或请求合并。

**上传链（在本方案中做 purpose 映射与收口）：**

- 核心实现仍为：`upload/uploadToOSS(file, credentials, directory, onProgress?, callbackUrl?, callbackBody?)`，objectKey 由 `generateObjectKey(rootPath, directory, fileName)` 生成。
- 本方案在 `upload/` 或 OssResourceManager 内引入 **OssUploadPurpose → directory** 的映射表，所有通过 OssResourceManager 的上传均经 `purpose` 得到 `directory` 再调 `uploadToOSS`。

### 1.3 目标（与最终决定对齐）

1. **统一 TS 封装**：**OssResourceManager**（`src/lib/oss/OssResourceManager.ts`），同时覆盖图片与文件，便于后续扩展更多 OSS 资源操作。
2. **加载**：仅提供 `resolve(key)`、`resolveSync(key)`，严格转发，不写缓存/合并逻辑。
3. **上传**：通过 **OssUploadPurpose** 枚举与物理目录映射，只提供通用 **`upload(file, { purpose, credentials, ... })`**，不提供 `uploadCommentImage` 等业务方法；评论侧直接使用 `OssResourceManager.upload`，拿到 `key` 后由组件自行拼接到正文。
4. 对上层透明：只看到「传 key 拿 URL」「传 file + purpose 拿 key（及可选 url）」即可。

---

## 二、OssResourceManager 的形态

### 2.1 路径与职责

- **路径**：`src/lib/oss/OssResourceManager.ts`
- **职责**：对「加载」「上传」做薄封装与统一入口，不承载缓存、合并请求、业务分支等逻辑。

### 2.2 加载 API（首版仅此二方法）

| 方法 | 含义 | 内部实现 |
|------|------|----------|
| `resolve(key: string): Promise<string>` | 将 objectKey 解析为可访问 URL；空 key 返回 `''` | `getOssResourceLoader().getUrl(key)` |
| `resolveSync(key: string): string \| null` | 仅当既有 loader 缓存命中时同步返回 URL，否则 `null` | `getOssResourceLoader().getUrlSync(key)` |

**禁止**在 OssResourceManager 内实现：缓存、请求合并、重试、TTL 等；均由既有 load 链负责。

### 2.3 上传 API

- **唯一入口**：`upload(file, options): Promise<{ key: string; url?: string }>`
- **options 必含**：
  - `purpose: OssUploadPurpose` — 业务意图，用于查表得到物理目录；
  - `credentials: STSCredentials` — STS 临时凭证；
- **options 可选**：`onProgress?`、`callbackUrl?`、`callbackBody?` 等，与现有 `uploadToOSS` 对齐。
- **内部逻辑**：`directory = PURPOSE_TO_DIR[purpose]` → 调用现有 `uploadToOSS(file, credentials, directory, ...)`，返回格式与现有一致，对外统一用 `key` 表示 objectKey（可源自 `UploadResult.objectKey`）。

**不提供**：`uploadCommentImage`、`uploadCommentFile`、`uploadAvatar` 等业务便捷方法；评论、头像等调用方统一使用 `upload(file, { purpose: OssUploadPurpose.COMMENT_IMAGE | ... })`。

### 2.4 OssUploadPurpose 与目录映射（定稿）

```ts
// 建议存放位置：upload/types.ts 或 upload/constants.ts

export enum OssUploadPurpose {
  AVATAR = 'AVATAR',
  COMMENT_IMAGE = 'COMMENT_IMAGE',
  COMMENT_FILE = 'COMMENT_FILE',
  DOCUMENTS = 'DOCUMENTS',
  OTHERS = 'OTHERS',
}

export const PURPOSE_TO_DIR: Record<OssUploadPurpose, string> = {
  [OssUploadPurpose.AVATAR]: 'avatars',
  [OssUploadPurpose.COMMENT_IMAGE]: 'attachments/comment/image',
  [OssUploadPurpose.COMMENT_FILE]: 'attachments/comment/file',
  [OssUploadPurpose.DOCUMENTS]: 'documents',
  [OssUploadPurpose.OTHERS]: 'attachments',
}
```

objectKey 形式保持不变：`{rootPath}/{directory}/{timestamp}_{random}.{ext}`。  
评论类示例：`workshop/attachments/comment/image/1738012345678_abc123.jpg`、`workshop/attachments/comment/file/1738012345678_xyz.pdf`。

---

## 三、与现有模块的关系

### 3.1 与 urlHelper 的关系

- `urlHelper.getAvatarUrl` / `getAvatarUrlSync` 保留，用于「可能为 objectKey 也可能为完整 URL」的头像场景。
- OssResourceManager 的 `resolve` / `resolveSync` 面向「确定是 objectKey」的调用方（如评论中的图片/附件 key、列表预览等）。不要求把 urlHelper 迁入 OssResourceManager。

### 3.2 与 uploadApi 的关系

- 现有 `uploadAvatarToOSS`、`uploadAttachmentToOSS`、`uploadDocumentToOSS` 等可保留，供尚未迁到 OssResourceManager 的调用使用；其内部仍可继续用 `uploadToOSS(..., 'avatars' | 'attachments' | 'documents', ...)`。
- **评论相关**：本阶段起直接使用 `OssResourceManager.upload(file, { purpose: COMMENT_IMAGE | COMMENT_FILE, credentials, ... })`，不再通过 uploadApi 的「评论专用」方法；若 uploadApi 中原有评论用到的 `uploadAttachmentToOSS`，可在评论流程中改为上述调用。

### 3.3 评论侧的「全 text」用法

- 评论无独立附件列表，仅在正文（或后续富文本）中插入链接。
- 流程：用户选择图片/文件 → 调用 `OssResourceManager.upload(..., { purpose: COMMENT_IMAGE | COMMENT_FILE, ... })` → 拿到 `{ key }` → 组件自行将 key（或某种可解析的链接格式）拼接进输入内容并提交；加载展示时再对内容中的 key 调 `OssResourceManager.resolve(key)` 得到 URL。

---

## 四、实施顺序（建议）

1. **OssUploadPurpose 与 PURPOSE_TO_DIR**  
   在 `upload/types.ts` 或 `upload/constants.ts` 中定义枚举与映射；保证 `uploadToOSS` 可接受映射得到的 `directory` 字符串（若目前已是 `string`，则无需改签名，仅在调用链上收口到 purpose）。
2. **OssResourceManager 本体**  
   新建 `src/lib/oss/OssResourceManager.ts`：实现 `resolve`、`resolveSync`（纯转发），以及 `upload(file, { purpose, credentials, ... })`（purpose → directory → uploadToOSS），返回 `{ key, url? }`。
3. **评论侧接入**  
   在评论功能中改为调用 `OssResourceManager.upload`，按需传 `purpose: COMMENT_IMAGE` 或 `COMMENT_FILE`；在组件内实现「拿到 key 后如何写入正文/输入框」的逻辑。
4. **其它调用方（按需）**  
   头像、文档等若希望统一走 OssResourceManager，可后续逐步改为 `upload(..., { purpose: AVATAR | DOCUMENTS | OTHERS })`；本阶段不强制迁移。

---

## 五、不动的部分

- **load/** 下所有实现：OssResourceLoadManager、RequestCoordinator、StorageManager、SignatureProvider、StatusMonitor、ErrorInterceptor、UrlUpdateNotifier、以及 getSignedUrl 的调用链与逻辑，均不修改。
- OssResourceManager 内**不**实现任何缓存、请求合并、重试或 TTL 逻辑，仅做 Facade 与 purpose→directory 映射。

---

## 六、与 Tiptap 的对接

本套逻辑与 Tiptap 的对接非常契合，符合 Tiptap/ProseMirror 处理媒体资源时的常见做法：**「拦截上传 → 获取 URL/Key → 插入 Node」**。以下为实施约定与建议，便于评论/待办等富文本场景直接复用 OssResourceManager。

### 6.1 角色划分

| 层级 | 职责 |
|------|------|
| **Tiptap** | 富文本的渲染与交互（光标、选区、撤销、Node/Mark 管理） |
| **OssResourceManager** | 把 File 变成 Key（及可选 URL）、把 Key 变回 URL；不关心编辑器实现 |
| **业务/扩展** | 在调用处决定 `purpose`（如 COMMENT_IMAGE、COMMENT_FILE），并在插入节点时决定存什么、如何展示 |

### 6.2 图片：上传拦截与插入

- 在 Tiptap 的 **Extension** 或 **事件** 中拦截「拖拽 / 粘贴 / 选择文件」。
- 上传时调用通用接口，**明确传入 purpose**：

```ts
// 伪代码：在 Tiptap 的图片上传处理中
async function handleImageUpload(file: File, editor: Editor) {
  const { key, url } = await OssResourceManager.upload(file, {
    purpose: OssUploadPurpose.COMMENT_IMAGE,
    credentials: await uploadApi.getSTSToken(),
  });
  // 插入节点时：展示用 url，持久化用 key
  editor.chain().focus().setImage({ src: url, 'data-oss-key': key }).run();
}
```

- **数据纯粹性**：
  - **存储**：后端只存 **objectKey**（或从内容中提取的 `data-oss-key`）；不存会过期的临时 URL。
  - **HTML/JSON 中**：`<img>` 的 `src` 可存**当时**的签名 URL 用于即时渲染，但**必须**同时带有 `data-oss-key`（或等价字段）存 objectKey，以便再次加载时用 key 换新 URL。
- **加载时**：从后端拿到的是 key（或带 key 的内容）。在渲染前对内容中的图片节点做一次「key → URL」替换：`src = OssResourceManager.resolveSync(key) ?? ''`，若缓存未命中可退化为 `resolve(key)` 异步再更新 DOM，或由既有 load 链的 `subscribe` 等能力配合。

### 6.3 文件（非图片）：FileLink 与 purpose

- 文件也走「全 text」：在编辑器中插入**可点击的链接**（类似 GitHub 评论区），不单独维护附件列表。
- 流程建议：
  1. 通过自定义 Extension（如 `FileLink`）或拖拽/粘贴逻辑拦截文件。
  2. 调用 `OssResourceManager.upload(file, { purpose: OssUploadPurpose.COMMENT_FILE, credentials, ... })`。
  3. 插入节点或 Mark：例如 `[文件名](url)` 或自定义 Node，其中展示用 `url`，存储用 `key`；加载时同样用 `resolve` / `resolveSync(key)` 得到可访问 URL 再渲染。

### 6.4 为何与 Tiptap 契合

- **异步时序清晰**：Tiptap 插入节点需要「确定的 URL」；`upload` 异步返回后再执行 `setImage` / 插入链接，逻辑简单、易测试。
- **占位与进度**：上传过程中可用 Tiptap 的 **Decoration** 做占位图或进度条，`upload` 完成后再用真实资源替换，不影响现有 OssResourceManager 接口。
- **签名与过期**：展示层只用 URL，持久化只用 Key。重新进页或刷新时，通过 `resolve` / `resolveSync` 由既有 load 链生成新签名，保证图片/文件链接长期可用，无需在 Tiptap 层处理过期逻辑。

### 6.5 与《Tiptap 实现方案》的对应关系

- 评论/待办若采用 Tiptap，则「图片 / 文件上传与展示」统一走 OssResourceManager：上传用 `upload(..., { purpose: COMMENT_IMAGE | COMMENT_FILE })`，展示用 `resolve` / `resolveSync(key)`。
- 若产品上采用「图片置顶、不入正文流」的形态，置顶区的上传与预览同样可复用 `upload` + `resolve`，仅插入到正文里的可以是「占位符 + key」或链接形式，由产品与存储约定决定；技术上一律通过 OssResourceManager 做 Key ↔ URL 的转换。
- 详细阶段划分与实现顺序见：`frontend/docs/tiptap-rich-editor-implementation-plan.md`。
