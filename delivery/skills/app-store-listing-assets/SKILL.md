---
name: app-store-listing-assets
description: 当用户要为 iOS App 提交 App Store 审核或准备 App Store Connect 素材时使用。适用于直接制作或更新可上传的 Previews and Screenshots 图片文件、二次加工 App Store 产品宣传图、Promotional Text、Description、Keywords、本地化文案、字段限制检查和素材 manifest；不用于证书签名、隐私问卷、内购配置、TestFlight 构建上传或 App Store Connect 后台提交。
---

# App Store Listing Assets

为 iOS App Store 上架准备高质量、可上传、可审核的本地化素材。

## 硬约束

- 先确认 App 的真实功能、名称、目标设备、当前版本和已实现页面，再写上架文案。
- 需要中文和英文时，分别输出完整本地化版本，不混写。
- 文案不得承诺代码或产品中没有证据支持的能力。
- 使用当前 Apple 字段限制作为验收线；如果限制信息可能变化，先查官方来源或标注需复核。
- 当用户提供 App Review 拒审信息、Guideline 2.1 Information Needed、审核回复或 App Review Information Notes 需求时，必须基于项目事实生成可直接提交的审核说明；不要只生成上架营销文案。
- 用户要求“提交 App Store 审核素材”时，Previews and Screenshots 默认必须产出可上传的 `.png`/`.jpg` 图片文件；只给截图拍摄清单、脚本或画面文案是未完成状态。
- 截图生产支持两种模式：`automatic` 自动化模式和 `manual` 手动模式；用户没有明确选择时，必须先让用户选择，不能擅自默认。
- 截图必须先来自真实 App UI、模拟器、真机、SwiftUI 渲染或项目内截图夹；二次加工只能包装、排版、标注真实 UI，不能用 AI 或设计稿伪造不存在的界面。
- App Store 截图不得使用纯营销图、抽象概念图、AI 概念插画或不反映实际 App UI 的画面作为主要截图；Guideline 2.3.3 要求截图准确展示 App in use。
- 如果真实 App UI 截图包含第三方海报、作品主视觉、平台 logo、用户隐私或其它授权不确定内容，必须先把素材策略分成 `real-screenshot` 和 `real-screenshot-safe-mask` 两类并让用户确认推荐上传路径；不要生成或推荐 `concept-promotional`、抽象重绘 UI 或纯概念宣传图。
- `real-screenshot-safe-mask` 只能基于真实 App 截图做最小化遮挡、模糊、色块化或通用占位替换；必须保留真实页面结构、Tab、按钮、列表、导航和功能状态，让审核能明确看到 App 的实际使用。
- 截图二次加工必须产出 App Store 产品宣传图：真实 UI 截图 + 设备/屏幕容器 + 本地化卖点标题 + 干净背景，并导出 Apple 接受的目标尺寸。
- 截图导航和质量检查要控制上下文成本：优先用缩略图做状态识别和点击校准，原图只用于最终成品抽检或必要细节确认。
- 已验证模拟器截图和系统模拟点击可用时，优先走“截图校准 -> 固定坐标点击 -> 截图保存 -> 缩略图确认”的闭环；不要每一步都重新识别整张原图。
- 视觉方向被用户确认后，后续只替换明确被要求替换的图层或参数；不要因为换截图、补齐 2-5 张、调整尺寸或改文案而重绘已确认的背景、设备框、整体版式。
- 复杂宣传图必须拆成可控图层：背景/设备框、标题区文字、分割线、真实截图、必要遮挡/脱敏层、补充效果分别制作和记录；用户指出局部问题时只改对应层。
- Keywords 必须控制在 App Store Connect 关键词字段限制内，并给出长度检查结果。
- 不修改业务代码，除非用户明确要求为了素材展示新增 demo、mock、深链或截图入口；需要临时脚本、HTML、模板、manifest 时默认写入素材输出目录。

## 主流程

### 1. 上下文读取

输入：用户请求、项目路径、已有规格、源码、截图、审核材料。

动作：
- 读取 App 名称、版本、目标设备、主要页面和核心功能。
- 读取规格、设计文档、审核说明或源码中能证明功能存在的材料。
- 检查是否已有截图、预览、fastlane metadata、App Store Connect 素材目录、UI tests、SwiftUI snapshot tests、模拟器脚本或截图导出脚本。

退出条件：能列出 App 的核心价值、已实现功能、可用截图生产路径、素材缺口和不能承诺的功能。

### 2. 字段和合规门禁

输入：Apple 当前要求、用户目标语言、App 功能证据。

动作：
- 确认 Promotional Text、Description、Keywords、截图数量、截图文件格式、目标设备截图尺寸和本轮必须产出的本地化截图套数。
- 如果本轮是审核信息补充或被 App Review 要求提供说明，读取 [references/app-review-information.md](references/app-review-information.md)，先整理实机录屏位置、测试设备、App 目的、访问方式、外部服务、地区差异、第三方内容权利、权限、账号/付费/UGC 状态，再生成 App Review Information Notes 或 Resolution Center 回复。
- 检查是否有夸大、未成年人风险、版权风险、AI 能力夸大、医疗金融等高风险承诺。
- 明确截图中是否需要避免展示第三方版权内容、用户隐私或未授权品牌。

退出条件：字段限制和合规边界明确。

### 3. 截图模式选择

输入：用户请求、可用截图生产路径、写入边界。

动作：
- 读取 [references/screenshot-production.md](references/screenshot-production.md)。
- 如果用户已明确选择自动化或手动模式，记录 `screenshot_mode` 并继续。
- 如果用户没有选择，必须暂停并让用户在两种模式中选择：
  - `automatic`：agent 使用模拟器、系统模拟点击、截图脚本、缩略图状态识别和二次加工脚本生成截图。
  - `manual`：agent 输出要截哪些页面、保存到哪个文件夹、文件命名和验收要求，等待用户手动截图放入目录后再继续加工。
- 说明两种模式的取舍：自动化更省人工但可能受模拟器/权限/页面状态影响；手动更稳定但需要用户按清单截图。

退出条件：`screenshot_mode` 已明确；未明确时只输出选择请求，不继续截图生产。

### 4. 截图生产和宣传图制作

输入：目标设备、页面清单、可用截图生产路径、输出目录。

动作：
- 按 `screenshot_mode` 使用 [references/screenshot-production.md](references/screenshot-production.md) 中的自动化或手动模式流程。
- 自动化模式：优先使用已有截图、fastlane snapshot、UI tests、模拟器截图或 SwiftUI snapshot harness 生成真实 UI 原始截图；模拟器截图时使用缩略图状态识别和固定坐标点击闭环。
- 手动模式：先输出 `manual-capture-guide.md`，明确页面清单、保存目录、文件命名、目标尺寸、截图注意事项和完成后让用户回复的检查口径；在用户未放入文件前，状态是 `awaiting_manual_screenshots`。
- 先确定素材策略：
  - `real-screenshot`：真实截图直接包装，适合已确认版权、隐私和品牌展示权的 App。
  - `real-screenshot-safe-mask`：真实截图包装，但对授权不确定的海报、作品主视觉、用户隐私或品牌标识做最小化遮挡、模糊、色块化或通用占位替换；仍必须展示实际 App in use。
- 如果走视觉探索，先单独生成背景/设备框框架让用户确认，再合成第一张样图；第一张确认后再批量补齐剩余页面，避免一次性生成 5 张后整体返工。
- 合成阶段允许用脚本做确定性排版，但不要用脚本重新发明视觉风格；脚本只负责把已确认的背景、设备框、文字、分割线、真实截图和必要遮挡/脱敏层按固定坐标组合。
- 对每个本地化版本制作 App Store 产品宣传图，至少包含 1 到 10 张符合目标设备尺寸的 PNG/JPG；iPhone App 优先制作 6.9 英寸竖图。
- 生成 `assets-manifest.json` 或 Markdown 清单，列出每张图的路径、尺寸、语言、设备类型、页面、卖点文案和来源截图。
- 记录截图导航方式、点击坐标来源、缩略图检查路径、最终原图抽检结果、视觉策略、图层来源、用户确认节点和推荐上传目录。
- 如果无法生成图片文件，必须输出 `blocked_missing_screenshots`，列出缺少的最小条件、已尝试路径和下一步，不得把任务标为完成。

退出条件：图片文件存在、尺寸符合 Apple 接受值、manifest 完整；或 `awaiting_manual_screenshots`；或明确阻塞。

### 5. 生成双语文案

输入：功能证据、字段限制、目标用户。

动作：
- 输出中文和英文 Promotional Text。
- 输出中文和英文 Description，结构包含开头定位、核心功能、适合人群和简洁收尾。
- 输出中文和英文 Keywords，并做限制检查。
- 输出截图/预览清单：必须引用已生成图片路径；如果只有计划没有图片，标记为未完成或阻塞。

退出条件：文案可直接复制到 App Store Connect，截图部分可直接上传或阻塞明确。

### 6. 本地落盘和检查

输入：生成素材和用户指定写入边界。

动作：
- 审核素材、截图、manifest、审核说明和过程记录写入项目内 `arckit/app-store-submission/`；始终以用户指定写入边界为准。
- 对 Keywords 做字符或 byte 预算检查。
- 对图片文件做存在性、数量、格式和尺寸检查。
- 标注仍需人工确认的信息，例如隐私政策链接、版权授权、后台字段、App Review 联系信息或 App Preview 视频。

退出条件：文件和图片已写入，限制检查结果明确；如果缺截图文件，最终状态必须是阻塞而不是完成。

## Reference 路由

- 截图采集、二次加工、尺寸检查和 manifest：读 [references/screenshot-production.md](references/screenshot-production.md)。
- App Review Information Notes、Guideline 2.1 Information Needed 回复、实机录屏/测试设备/外部服务/第三方内容权利说明：读 [references/app-review-information.md](references/app-review-information.md)。
- 如果后续需要 App Store Connect API 写入，再新增 scripts；后台提交不属于本 skill 默认范围。

## 最终汇报字段

- 读取的项目证据。
- 输出文件路径。
- 中文和英文素材范围。
- 已生成截图/产品宣传图路径、数量、尺寸、语言和 manifest。
- 截图模式：`automatic` 或 `manual`；如果等待用户手动截图，说明 `manual-capture-guide.md` 路径和状态。
- 素材策略：`real-screenshot` 或 `real-screenshot-safe-mask`；说明推荐上传目录和不建议上传的参考目录。
- 截图采集方式、是否使用缩略图检查、模拟点击是否闭环通过，或手动截图验收结果。
- 视觉确认路径：背景/设备框、第一张样图、批量补齐、contact sheet、原图抽检分别是否完成。
- 字段限制检查结果。
- App Review Information Notes 或审核回复的提交版本、字符预算、录屏附件位置、测试设备和仍需人工确认项。
- 未生成或需人工补齐的图片文件、App Preview 视频和后台信息；截图缺失时必须标记阻塞。
- 不承诺或暂不纳入的功能。
