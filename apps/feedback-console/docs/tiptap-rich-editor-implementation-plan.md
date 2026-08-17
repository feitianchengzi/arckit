# 基于 Tiptap 的富文本编辑器实现方案与难度总结

## 一、背景与目标

### 1.1 现状

- **评论编辑器**（`CommentEditor.tsx`）使用 **原生 contenteditable + 手写 DOM/Selection** 实现：
  - 支持 @ 提及：`[name](xxx)` 与 DOM `mention-tag` 双向解析（`extractContentFromEditor` / `renderContentToEditor`）
  - 手写 `insertMention`、光标与 Range 操作、@ 检测与下拉选择
- **待办编辑**：当前为普通文本框或简单 contenteditable，尚未支持 @、链接、图片等

### 1.2 新需求（超出原生 contenteditable 的范畴）

| 能力 | 说明 |
|------|------|
| @成员 | 输入 @ 触发成员列表，选中后整体展示为蓝色标签，**退格键整体删除** |
| 整体删除 | @ 标签作为一个原子单元，不能删成半截 |
| 蓝色展示 | @ 标签统一蓝色样式 |
| 链接气泡 UI | 选中文字或点击「插入链接」时，在光标处出现**固定 UI 气泡**（输入 URL、确认） |
| 图片置顶 | 图片**不进入正文流**，在编辑器上方单独区域展示，提交时与正文一起送给后端 |

### 1.3 适用范围

- **首期**：评论输入框（`CommentEditor`）
- **后续**：待办编辑输入框（复用同一套编辑器能力）

---

## 二、技术选型结论：Tiptap 无头编辑器

不再继续手写 `contenteditable` + `Selection/Range`，改用 **Tiptap（基于 ProseMirror）** 作为“无头”引擎：

- 由框架负责：光标、选区、撤销/重做、跨浏览器兼容、文档 Schema
- 我们负责：用 React + HTML/CSS 做 UI（外观、气泡菜单、@ 下拉、图片置顶区域等）

**与需求的对应关系：**

| 需求 | Tiptap 对应方案 |
|------|------------------|
| @成员、整体删除、蓝色 | `@tiptap/extension-mention`，配成 Atom 节点 + CSS 类 |
| 链接气泡 UI | `@tiptap/extension-bubble-menu` 或 Floating/Bubble Menu，在光标处挂自定义 React 组件 |
| 图片置顶 | **不入编辑器**：在编辑器 DOM 上方做 `ImageContainer`，仅把图片 URL 与正文一起提交 |
| 数据格式 [name](xxx) | 在 Mention 的 `renderHTML` / 自定义 serializer 或 `getJSON` 转出约定格式 |

---

## 三、实现方案拆解

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│  ImageContainer（可选，仅评论/待办需要图片时展示）              │
│  - 置顶图片列表、上传进度、删除                               │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Tiptap 编辑器容器（useEditorRoot + extensions）              │
│  - 正文：段落、加粗等（按需）                                 │
│  - Mention：@成员 → 原子节点，蓝色，退格整删                   │
│  - Link：链接 mark，Bubble Menu 编辑 URL                     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Bubble Menu（链接等）                                       │
│  - 仅在选区为链接或点击「插入链接」时显示                      │
│  - 输入 URL、确认/取消                                       │
└─────────────────────────────────────────────────────────────┘
```

- **评论**：`CommentEditor` = ImageContainer（可选）+ Tiptap 编辑器 + Bubble Menu；图片/文件上传与展示统一走 **OssResourceManager**（见 §3.5）。
- **待办编辑**：同一套 Tiptap 封装（可抽成 `RichTextEditor`），待办可复用或关闭图片置顶。

### 3.2 阶段一：Tiptap 基础 + @ 成员（Mention）

**目标**：在评论里用 Tiptap 替代现有 contenteditable，且 @ 行为与现有一致（含 [name](xxx) 持久化）。

**步骤概览：**

1. **依赖**
   - `@tiptap/react`、`@tiptap/pm`、`@tiptap/starter-kit`（或仅 Document + Paragraph + Text）
   - `@tiptap/extension-mention`、`@tiptap/suggestion`（用于 @ 触发与下拉）

2. **Mention 扩展配置**
   - 使用 `suggestion` 的 `items` 从当前项目 `members` 里按关键字过滤。
   - 将 Mention 配成 **Atom**（`atom: true`），实现**整体删除**。
   - `HTMLAttributes: { class: 'mention-tag' }`，用 CSS 做**蓝色**等样式。
   - 自定义 `renderHTML` 或添加顶层 serializer：
     - 存盘/提交时输出 `[name](username)`（或 `[name](user_id)`，与后端约定好）。

3. **与现有逻辑对接**
   - 初始内容：从 `initialContent` 里解析 `[name](xxx)`，转成 Tiptap 的 JSON 或 HTML 再 `editor.commands.setContent(...)`。
   - 提交：从 `editor.getJSON()` 或自写 serializer 得到字符串，仍为 `[name](xxx)` 拼接正文，保证与现有 API、展示一致。

4. **@ 下拉 UI**
   - 用 `suggestion` 的 `render: () => { ... }` 挂载 React 组件（或已有 Vue 层用 createRoot 挂 React），样式可沿用当前评论的成员列表样式。

**产出**：  
- 一个可复用的 `RichTextEditor`（或 `TiptapCommentEditor`）子组件，仅包含“正文 + Mention”。  
- `CommentEditor` 在“文本评论”模式下渲染该组件，并继续走现有 `onSubmit(content: string, type)`。

**难度**：中。主要工作量在“已有 [name](xxx) 与 Tiptap 文档结构的双向转换”以及把现有 @ 下拉 UI 接到 `suggestion`。

---

### 3.3 阶段二：链接 + Bubble Menu

**目标**：支持在评论中插入/编辑链接，并通过**固定在光标/选区旁的气泡**输入 URL。

**步骤概览：**

1. **扩展**
   - `@tiptap/extension-link`，建议 `openOnClick: false`，避免在编辑态误跳转。

2. **Bubble Menu**
   - 使用 `@tiptap/extension-bubble-menu`，`editor.get().state.selection` 或 Tiptap 的 BubbleMenu 的 `shouldShow`：
     - 当选区在链接上，或当前“链接模式”打开时展示。
   - 气泡内放自定义 React 组件：输入框（URL）、确认、取消。
   - 交互：选文字后点“插入链接”或工具栏“链接”按钮 → 弹出气泡 → 填 URL 确认 → `editor.chain().focus().setLink({ href })`。

3. **数据格式**
   - 若后端需要 Markdown：可在 serializer 里把 Link 转成 `[text](url)`；若仍用自定义格式，在此做等价转换即可。

**产出**：  
- 链接能力集成进同一套 Tiptap 编辑器；评论与后续待办编辑都能用。

**难度**：中低。Bubble Menu 与 Link 的对接有现成示例，主要是 UI 和产品细节。

---

### 3.4 阶段三：图片“置顶”方案（不入正文流）

**目标**：图片不进入 Tiptap 文档，始终在编辑器**上方**的独立区域展示。

**步骤概览：**

1. **不在 Tiptap 里加 Image 节点**
   - 正文区只负责：段落、Mention、Link 等；不插入图片节点。

2. **ImageContainer 组件**
   - 在编辑器 DOM 上方增加一块区域：
     - 展示“本条评论/本待办”已选中的图片列表（缩略图、删除）。
     - 上传进度、错误态。
   - 数据：`images: { url?: string; objectKey?: string }[]` 由父组件 state 或表单 state 管理。

3. **提交**
   - 正文：`editor.getHTML()` 或自定义序列化 → `content` 字符串（仍可包含 `[name](xxx)` 等）。
   - 图片：`images` 数组单独作为附件/资源字段提交，或按现有评论/附件的接口传参。
   - 若产品要求“在正文中显示占位符”：可在展示层用占位符（如 `[图片1]`）映射到置顶图，而不在编辑态把图片写进文档，避免光标/选区复杂化。

**产出**：  
- `CommentEditor` = ImageContainer + Tiptap 正文区；  
- 待办编辑若需要“附件/封面图”也可复用 ImageContainer，而不必动 Tiptap Schema。

**难度**：中低。业务与接口设计明确即可，实现以布局和 state 为主。

---

### 3.5 媒体资源与 OssResourceManager 的对接

**无论图片/文件是「置顶」还是「入正文」，上传与解析都统一走 OssResourceManager**，与 Tiptap 的对接方式如下。

- **上传**：在 Extension 或事件中拦截拖拽/粘贴/选择文件后，调用 `OssResourceManager.upload(file, { purpose: COMMENT_IMAGE | COMMENT_FILE, credentials, onProgress? })`，用返回的 `{ key, url? }` 插入节点或写入置顶区 state。
- **存储**：持久化只存 **objectKey（key）**；若图片/文件入正文，节点上除 `src` 外必须带 `data-oss-key`（或等价字段）存 key，以便再次加载时用 key 换签名 URL。
- **加载**：从后端拿到 key（或带 key 的内容）后，用 `OssResourceManager.resolve(key)` / `resolveSync(key)` 得到可访问 URL 再赋给 `src` 或链接；签名过期后重新进页会由既有 load 链自动换新 URL，Tiptap 层无需处理过期逻辑。
- **角色划分**：Tiptap 只管富文本渲染与交互；OssResourceManager 只管「File → Key」与「Key → URL」；业务层只在调用处决定 `purpose`（如 COMMENT_IMAGE、COMMENT_FILE）。

详细约定（含 data-oss-key、FileLink、占位与进度）见：**`frontend/docs/oss/OSS_RESOURCE_MANAGER_DESIGN.md` 第六节「与 Tiptap 的对接」**。

---

### 3.6 组件复用与后续“待办编辑”迁移

- 将“Tiptap + Mention + Link + Bubble Menu”抽象成一个 **RichTextEditor**：
  - props：`initialContent`、`placeholder`、`members`、`projectId`、`onChange`、`minHeight` 等。
  - 不包含“评论专属”的 type 切换、提交按钮等。
- **CommentEditor**：内部使用 `RichTextEditor` + ImageContainer（若需要）+ 评论 type、提交/取消。
- **待办编辑**：同用 `RichTextEditor`，可根据需要关闭图片置顶或接不同的附件逻辑。

---

## 四、难度与工作量评估

| 维度 | 评估 | 说明 |
|------|------|------|
| **技术难度** | 中 | Tiptap/ProseMirror 有学习成本，但文档和社区成熟；最费事的是与现有 [name](xxx) 的互转和 @ 下拉与 suggestion 的对接。 |
| **需求匹配度** | 高 | @、链接、整体删除、气泡 UI、图片置顶都能在“Tiptap + 外围组件”下实现，无需再碰 Selection/Range。 |
| **替代现有实现的成本** | 中 | 要重写 CommentEditor 的“正文 + @”部分，并保证提交格式、展示与现有兼容；链接和图片是新增，不影响旧逻辑。 |
| **后期扩展** | 低 | 加粗、代码块、表情等都可加 Tiptap 扩展，不必再写 contenteditable 边界 case。 |

**粗略工作量（仅作排序用）：**

- 阶段一（Tiptap + Mention + [name](xxx) 双向 + 评论接入）：约 3–5 人天。
- 阶段二（Link + Bubble Menu）：约 1–2 人天。
- 阶段三（ImageContainer + 评论/待办图片上传与提交）：约 1–2 人天（若已有上传与附件接口则更少）。
- 抽成 RichTextEditor 并在待办编辑中复用：约 1 人天。

整体约 **6–10 人天** 可完成“评论全能力 + 可在待办复用的编辑器底座”。

---

## 五、依赖与版本建议

在现有 React 18 + Vite 技术栈下，建议新增（示例版本，可按实际锁定）：

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/pm": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-mention": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "@tiptap/suggestion": "^2.x"
}
```

Bubble Menu 可用 Tiptap 官方 `@tiptap/extension-bubble-menu`，或根据文档用 FloatingMenu 自行包一层。

---

## 六、风险与注意点

1. **数据格式**  
   若后端或别处强依赖 `[name](xxx)` 的精确格式，需要在 Tiptap 的存储/序列化层明确约定并在单测里覆盖。

2. **无障碍与键盘**  
   Tiptap 自带一部分键盘与焦点行为，若产品有明确 a11y 要求，需在 Bubble Menu、@ 下拉、图片区域单独补足。

3. **移动端**  
   气泡菜单位置、@ 下拉在小屏上的表现需要单独调一版（例如全屏浮层代替真正“气泡”）。

4. **撤销/重做**  
   由 Tiptap/ProseMirror 统一管理，若之后 ImageContainer 有“删除/重排图片”等操作，若也要进 Undo 栈，需要再设计（例如用 Command 把图片变更也写进同一 history）。

---

## 七、总结

- **结论**：用 **Tiptap 做无头富文本底座**，**图片用编辑器上方的 ImageContainer 单独处理**，能在不手写 contenteditable 的前提下，满足 @成员、整体删除、蓝色、链接气泡、图片置顶等需求，并便于复用到待办编辑。
- **实现路径**：先做 Tiptap + Mention 并兼容现有 [name](xxx)；再做 Link + Bubble Menu；最后做 ImageContainer 与提交逻辑；最后抽通用 RichTextEditor 供评论与待办共用。
- **难度**：整体中等，一次投入后可长期减少光标、撤销、兼容性等方面的维护成本。

如需，可以把“阶段一”拆成更细的接口设计（例如 `RichTextEditor` 的 props、与 comments API 的字段对应关系）或直接在仓库里从“依赖安装 + 最小 Tiptap 评论框”起手实现一版。
