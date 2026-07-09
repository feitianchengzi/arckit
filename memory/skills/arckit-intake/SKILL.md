---
name: arckit-intake
description: 把原始项目输入材料记录到 arckit/intake，为每个 artifact 建立 Markdown record，并按需做忠实文本提取。适用于只需保存原始材料、暂不分析且不提升为需求、任务或决策的场景。
---

# Arckit Intake

只用本 skill 保存、登记原始项目输入，并在需要时把内容忠实提取为同内容 Markdown。不要分析、分流、总结成需求，也不要把输入提升到后续阶段文档。下游解释和转化由其他 skill 负责。

## 核心原则

- 保留原始输入。不要修改、替换或合并掉 source material。
- 只记录来源和存储事实，不添加解释。
- 为每个输入 artifact 创建一个 Markdown record。
- 仅当 artifact 包含文本，或需要同内容转写时，才创建 extracted Markdown。
- 提取可以转写、转换或轻度结构化 source content，但不能加入结论。
- 每个 intake item 都要有稳定 ID，方便后续文档引用。
- 文件跟随所属 intake item 存放，不放入共享附件堆。
- 优先创建小而主题一致的 intake item。互不相关的批次要拆分。
- 默认 sensitivity 是 `internal`；遇到 secret、credential、合同、客户数据、个人数据或未公开商业信息时使用 `private`。

## 目录结构

首次使用时创建：

```text
arckit/intake/
  INDEX.md
  _inbox/
  YYYY/
    YYYY-MM-DD-NNN-short-title/
      metadata.yml
      files/
        source/
        records/
        extracted/
```

`_inbox/` 只用于用户一次提供很多文件且分组暂不明确时的临时暂存。除非被阻塞，结束任务前要把材料移动到带日期的 intake item 中。

## Intake Item 命名

使用：

```text
YYYY/YYYY-MM-DD-NNN-short-title/
```

规则：

- `YYYY-MM-DD` 是用户当前上下文中的接收日期。
- `NNN` 是当天三位序号，从 `001` 开始。
- `short-title` 尽可能使用小写 ASCII kebab-case。
- 如果原始标题是中文或其他非 ASCII 文本，folder slug 要简洁翻译，原始标题保留在 `metadata.yml`。

ID 格式：

```text
IN-YYYYMMDD-NNN
```

示例：

```text
arckit/intake/2026/2026-05-28-001-project-brief/
```

## 必需文件

### metadata.yml

```yaml
id: IN-20260528-001
title: 项目初始说明
received_at: 2026-05-28
source: user
input_types:
  - text
status: recorded
sensitivity: internal
description: 用户提供的项目原始背景和目标描述。
artifacts:
  - source: files/source/001-user-message.md
    record: files/records/001-user-message.md
    extracted: files/extracted/001-user-message.md
    type: text
    role: text_source
```

字段说明：

- `source`：通常是 `user`；如果用户点明来源，就使用具体来源。
- `input_types`：使用 `text`、`image`、`pdf`、`doc`、`spreadsheet`、`audio`、`video`、`archive`、`link`、`code`、`other` 等值。
- `status`：取值为 `recorded` 或 `archived`。
- `description`：中性描述收到的材料，不做解释或需求总结。
- `artifacts`：列出每个已存储的输入 artifact。每个 artifact 必须把一个 `source` 路径映射到一个同 stem 的 `record` Markdown 路径。`extracted` 可选；不需要文本提取时为 `null`。
- `role`：可读/需提取材料用 `text_source`；可直接使用的素材用 `reusable_asset`；视觉、音频、视频参考材料用 `reference_asset`；不明确时用 `unknown`。

### files/source/

在这里保存每个原始输入 artifact。尽可能保留原始措辞、字节和结构。

规则：

- 用户粘贴的文本保存为 Markdown source file，通常命名为 `001-user-message.md`。
- 上传文件或本地文件在合理时保留原始扩展名。
- 链接保存为 source record，例如 `001-link.md`，其中包含 URL 和用户提供的上下文文本。
- 同一 intake item 中的多个 artifact 必须有稳定且不冲突的文件名。

原始 Markdown source record 使用这个头部：

```markdown
# Original Input

Source: user
Received: 2026-05-28
Intake ID: IN-20260528-001

---

```

### files/records/

为每个 source artifact 保存一个 Markdown record。即使不需要提取，也必须创建 record。

文件名规则：

- 每个 source artifact 必须有一个同 stem 的 record Markdown 文件。
- 只把扩展名改成 `.md`。
- 示例：
  - `files/source/product-brief.pdf` -> `files/records/product-brief.md`
  - `files/source/homepage-design.png` -> `files/records/homepage-design.md`
  - `files/source/001-user-message.md` -> `files/records/001-user-message.md`

每个 record 文件使用这个头部：

```markdown
# Input Record

Source: user
Received: 2026-05-28
Intake ID: IN-20260528-001
Artifact: files/source/product-brief.pdf
Role: text_source
Extracted: files/extracted/product-brief.md

---

```

规则：

- 记录存储和 provenance 事实：文件名、类型、role、source path，以及存在时的 extracted path。
- 对可直接使用的素材，设置 `Extracted: none`，只说明 source artifact 已按原样保留。
- 不要添加需求、假设、开放问题、建议、标签或下游分类。

### files/extracted/

仅在有用或可行时，保存同内容 Markdown 提取结果。

文件名规则：

- extracted 文件使用与 source artifact 相同的 stem。
- 示例：
  - `files/source/product-brief.pdf` -> `files/extracted/product-brief.md`
  - `files/source/login-screenshot.png` -> `files/extracted/login-screenshot.md`

规则：

- 内容必须忠实于 source。
- 使用 Markdown 标题、列表、表格和 fenced code blocks 保留结构。
- 文本内容尽可能保留原始措辞。
- 按适用情况包含 extracted text、OCR text、table content 或 transcript。
- 如果内容无法读取或提取，不要伪造 extraction。在该 artifact 的 `files/records/*.md` 中记录这个事实。
- 不要添加需求、假设、开放问题、建议、标签或下游分类。

## INDEX.md

维护 `arckit/intake/INDEX.md` 作为顶层登记表。

使用：

```markdown
# Intake Index

| ID | Date | Title | Types | Status | Sensitivity | Description |
| --- | --- | --- | --- | --- | --- | --- |
| IN-20260528-001 | 2026-05-28 | 项目初始说明 | text | recorded | internal | 用户提供的项目原始背景和目标描述。 |
```

新条目按倒序时间追加。只更新存储事实、status、sensitivity、title、types 和 description。

## 处理输入

### 文本

- 除非文本明显包含互不相关的主题，否则创建一个 intake item。
- 把原始文本放入 `files/source/001-user-message.md`。
- 创建 `files/records/001-user-message.md`。
- 把同样文本放入 `files/extracted/001-user-message.md`；仅在能更清晰保留 source 时使用 Markdown 结构。
- 在 `metadata.yml` 和 `INDEX.md` 中中性描述收到的材料。

### 文件

- 当本地路径或上传文件可用时，把文件复制到 `files/source/`。
- 合理时保留原始文件名。
- 如果文件名不安全或不清楚，改为简洁 ASCII 文件名，并在 `metadata.yml` 记录原始名称。
- 不要修改原始文件。
- 为 `files/source/` 中的每个文件创建对应的 `files/records/<same-stem>.md`。
- 仅当同内容提取有用或可行时，创建 `files/extracted/<same-stem>.md`：
  - document：提取标题、段落、列表和表格
  - spreadsheet：把可见 sheet 或用户提供的范围转换为 Markdown table
  - image/screenshot：有 OCR text 时记录；否则只记录中性文件条目
  - audio/video：仅当用户提供 transcript，或可通过已批准工具获取 transcript 时记录
  - archive：列出包含的文件；只有在技术上可行且不改变原始文件时，才提取可读文本
- 不要提取可直接使用的 asset，例如 logo、icon、design mockup、作为素材的照片、source design file、audio asset 或 video asset，除非用户明确要求 transcription/OCR。它们只需要 record 文件。
- 如果 extraction 不可行或不需要，在 `metadata.yml` 设置 `extracted: null`，并在 record 文件中设置 `Extracted: none`。

### 链接

- 把 URL 保存到 `files/source/001-link.md`。
- 创建 `files/records/001-link.md`。
- 如果用户需要 durable capture，在技术可行时把 fetched 或 exported content 保存到 `files/source/`。
- 技术可行时，把 fetched page text 或 link record 放入 `files/extracted/001-link.md`。
- 如果链接需要认证或无法获取，记录访问限制。

### 混合批次

- 如果所有材料描述同一个连贯主题，创建一个 intake item。
- 如果材料覆盖不同主题，创建多个 intake item，并说明拆分情况。
- 如果分组不明确，暂存到 `_inbox/`，写清楚存储说明，不要询问需求澄清问题。

## 边界

不要：

- 推断需求
- 产出产品规格
- 产出技术方案
- 产出交互文档
- 产出视觉文档
- 超出中性 input type 做下游归属分类
- 为澄清需求而追问
- 标记假设或开放问题

如果用户同时要求下游处理，先完成输入记录，然后停止。后续工作由用户再调用其他 skill。

## 输出给用户

创建或更新 intake records 后，报告：

- 创建或更新的路径
- 分配的 intake IDs
- status
- 任何 sensitive/private 处理说明

回复保持简短，重点放在路径和 ID 上。
