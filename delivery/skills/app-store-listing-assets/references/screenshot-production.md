# 截图生产和 App Store 产品宣传图

本 reference 在 `SKILL.md` 的“截图生产和宣传图制作”节点读取。目标是让 agent 直接产出可上传图片文件，而不是只给截图计划。

## 完成定义

当用户要求“能提交 App Store 审核的素材”时，截图部分只有满足以下条件才算完成：

- 至少 1 张、建议 5-6 张 iPhone 截图或宣传图文件真实存在。
- 图片格式是 `.png`、`.jpg` 或 `.jpeg`。
- 图片尺寸符合当前 Apple 接受的目标设备尺寸。iPhone App 优先 6.9 英寸竖图：`1260x2736`、`1290x2796` 或 `1320x2868`；如果同时制作 6.5 英寸，接受 `1284x2778` 或 `1242x2688`。
- 每个本地化版本各有独立图片，或者 manifest 明确说明本轮只交付哪一种语言。
- 每张产品宣传图都包含真实 App UI 截图，不得凭空画一个不存在的界面。
- 输出目录包含 `assets-manifest.json` 或 `assets-manifest.md`，列出每张图片的语言、设备、尺寸、页面、来源截图、导出路径和审核备注。

如果缺少图片文件，不得说“素材已准备好”；只能说文案已准备、截图阻塞。

## 推荐输出结构

```text
arckit/app-store-submission/
├── app-store-assets.md
├── assets-manifest.json
├── raw-screenshots/
│   ├── zh-Hans/
│   └── en-US/
├── processed-screenshots/
│   ├── zh-Hans/
│   │   ├── 01-home.png
│   │   └── ...
│   └── en-US/
│       ├── 01-home.png
│       └── ...
└── working/
    ├── screenshot-script.*
    ├── promo-template.*
    └── capture-notes.md
```

可按需补充：

```text
arckit/app-store-submission/
├── missing-assets-audit.md
├── validation-run/
│   └── app-store-listing-assets.md
└── working/
    ├── framework-options/
    ├── style-composite/
    ├── masking-overlays/
    ├── thumbs/
    ├── compose-selected-framework.py
    └── compose-safe-masked-screenshots.py
```

目录含义：

- `raw-screenshots/`：真实模拟器、真机或用户手动提供的原始截图。可能包含第三方内容时只作参考，不默认上传。
- `processed-screenshots/`：真实截图包装版。只有授权和隐私风险确认后才推荐上传。
- `working/framework-options/`：背景和手机设备框候选图，只包含框架，不放标题和截图。
- `working/style-composite/`：真实截图风格合成、缩略图和 contact sheet。
- `working/masking-overlays/`：真实截图上的遮挡、模糊、色块化或通用占位替换层。

## 截图模式选择

截图生产有两种模式，必须由用户明确选择：

- `automatic` 自动化模式：agent 使用模拟器、系统模拟点击、`simctl screenshot`、缩略图状态识别、固定坐标点击和二次加工脚本完成截图生产。
- `manual` 手动模式：agent 生成手动截图指南，用户按清单在模拟器或真机手动截图并放到指定目录，agent 再检查尺寸、命名和质量并继续二次加工。

如果用户没有明确选择，先输出选择请求并停止截图生产。不要默认自动化，也不要默认让用户手动截图。

选择请求建议：

```text
截图部分需要选择模式：
1. 自动化模式：我用模拟器点击、截图、缩略图确认和脚本加工来生成图片。
2. 手动模式：我给你页面清单、保存目录和命名规则，你手动截图后放到目录里，我再检查和二次加工。

请选择 1 或 2。
```

## 生产路径优先级

自动化模式按顺序尝试，不能跳过到“只写方案”：

1. 已有最终截图：检查仓库、`fastlane/metadata`、`review/`、`screenshots/`、设计交付目录和用户提供素材。
2. 自动化截图：使用已有 fastlane snapshot、UI tests、截图脚本或项目内 screenshot harness。
3. 模拟器截图：构建并运行 App，使用 `xcrun simctl io ... screenshot` 采集真实界面；必要时用深链、启动参数、mock 数据或现有本地 JSON 固定页面状态。
4. SwiftUI 渲染：如果项目已有 `ImageRenderer` snapshot tests 或可构造 View，用真实 View + mock service 渲染原始截图，再进入产品宣传图加工。
5. 临时素材脚本：在允许写入目录内创建临时 HTML/Swift/Node/Python 脚本，把真实原始截图排版成 App Store 产品宣传图。
6. 阻塞报告：只有前面路径都不可行，才输出 `blocked_missing_screenshots`。

手动模式不执行模拟器点击；它只生成手动截图指南并等待用户放入文件。等待期间状态必须是 `awaiting_manual_screenshots`。

## 手动模式指南

手动模式必须写入 `manual-capture-guide.md`，至少包含：

- 截图保存目录：
  - 原始简中截图：`arckit/app-store-submission/raw-screenshots/zh-Hans/`
  - 原始英文截图：`arckit/app-store-submission/raw-screenshots/en-US/`
- 推荐目标设备和尺寸：iPhone 6.9 英寸竖图，优先 `1320x2868`，也可接受 `1290x2796` 或 `1260x2736`。
- 文件命名规则：
  - `01-home.png`
  - `02-tracking.png`
  - `03-detail.png`
  - `04-platforms.png`
  - `05-my-anime.png`
  - `06-widget.png`
- 页面清单和拍摄要求：
  - 首页：每日更新、当季推荐或标签推荐可见。
  - 追番表：日期切换和多条番剧列表可见。
  - 详情页：封面、简介、追番/分享入口可见。
  - 播放平台：平台信息区域可见；不要承诺全网覆盖。
  - 我的追番：在看/看过和管理入口可见。
  - Widget 引导：小组件示例和添加说明可见。
- 截图注意事项：
  - 使用当前提审构建。
  - 避免系统弹窗、键盘、调试面板、加载骨架屏和隐私信息。
  - 尽量使用稳定网络或本地 mock 数据，避免半加载内容。
  - 中英文分别截图；如果 App 没有英文 UI，本轮英文可只生成英文宣传标题，但 manifest 必须注明 UI 语言限制。
- 完成后用户应回复：
  - “截图已放入目录”，并说明是否包含 `zh-Hans`、`en-US`。

手动文件放入后，agent 执行：

1. `find` 检查文件是否存在。
2. `sips -g pixelWidth -g pixelHeight` 检查尺寸。
3. 为每张图生成 480-720px 缩略图做页面类别确认。
4. 对最终二次加工图做原图抽检。
5. 更新 `assets-manifest.json`。

## 模拟点击闭环

当模拟器截图和系统模拟点击已经可用时，使用低 token 的固定流程：

1. 启动或激活 Simulator，并读取窗口位置和尺寸。
2. 保存当前原始截图，不立即用原图做视觉分析。
3. 生成缩略图供状态识别，例如：

```bash
mkdir -p arckit/app-store-submission/working/thumbs
sips -Z 480 arckit/app-store-submission/raw-screenshots/zh-Hans/current.png \
  --out arckit/app-store-submission/working/thumbs/current.png
```

4. 只对缩略图使用视觉检查，判断当前页面、弹窗和下一步点击目标。
5. 把 App 截图坐标按 Simulator 窗口比例换算为屏幕坐标，或在首次校准后复用固定坐标。
6. 用系统点击执行导航，例如 `osascript` 激活 Simulator 后全局 `click at {x, y}`。
7. 点击后保存原始截图，并用缩略图确认页面是否变化。
8. 只有最终产品宣传图或疑似失败状态才查看高分辨率原图。

避免把视觉模型当实时自动驾驶。一次页面导航最多做一次缩略图确认；连续失败时改为记录阻塞或补截图 harness，不要无限识图重试。

## 视觉检查预算

- 默认不查看每张原始截图的高分辨率版本。
- 首张截图可用缩略图校准一次坐标体系。
- 每个页面采集后用缩略图确认页面类别即可。
- 最终成品宣传图需要抽检高分辨率图，确认文字不溢出、UI 不被裁切、尺寸正确。
- 如果需要比较多个截图状态，优先生成 contact sheet 缩略图，再一次性查看。
- `sips -g pixelWidth -g pixelHeight`、文件存在性和 manifest 校验优先于视觉检查。
- 缩略图推荐高度为 `480` 到 `720` px。`480` px 通常足够识别页面、Tab、弹窗和大按钮；如果需要读取小字或判断按钮标题，升到 `720` px，而不是直接查看原图。
- 缩略图只用于导航和状态确认，不用于最终 App Store 宣传图质量判断。
- 如果缩略图无法识别页面状态，最多重试一次更大缩略图；仍不清楚时再查看原图或记录阻塞，不要无限放大和反复识图。

推荐输出缩略图目录：

```text
arckit/app-store-submission/working/thumbs/
├── zh-Hans-01-home.png
├── zh-Hans-02-tracking.png
└── contact-sheet.png
```

最终汇报要说明是否用了缩略图检查，以及哪些图经过了原图抽检。

## 产品宣传图质量规则

- 每张图只表达一个卖点：每日更新、追番表、详情、播放平台、我的追番、桌面小组件等。
- 使用真实 UI 截图作为主体，放在设备轮廓、屏幕容器或干净的无框布局中。
- 大多数截图必须清楚展示 App 的实际使用状态；纯营销图、抽象概念图、AI 概念插画、只表达产品意象但不展示真实 UI 的图，不适合作为 App Store screenshot。
- 标题短而具体：中文 8-14 字，英文 4-8 个词。
- 避免大面积未授权番剧海报、视频画面或第三方品牌作为营销主视觉；平台图标只能作为 App UI 的一部分出现。
- 视觉应清爽、信息密度适中、文字不遮挡 UI，背景不要用无意义渐变球、装饰光斑或 stock 风格图。
- 中英文分别导出，不要把双语挤在同一张截图上。
- 导出前检查文字不溢出、图片非空、尺寸正确、文件可打开。

## 素材策略门禁

截图生产不只是“有没有图片”，还要先判断哪类图片可以上传：

1. `real-screenshot`：直接使用真实 UI 截图做宣传图。适合截图中没有第三方版权风险、隐私风险或未授权品牌风险的 App。
2. `real-screenshot-safe-mask`：使用真实 UI 截图，但对授权不确定的局部内容做最小化遮挡、模糊、色块化或通用占位替换。适合内容型 App 的审核素材，尤其是番剧、影视、音乐、图书等可能出现第三方内容的产品。

不要使用以下素材策略作为 App Store 截图：

- `concept-promotional`：不嵌入真实截图、只表达产品概念的原创插画或营销图。
- `review-safe-redraw`：完全重绘屏内 UI，导致截图不再是实际 App in use。
- 任何 AI 生成的、不来自真实 App 页面结构的抽象界面。

如果用户问“会不会侵权”，先做 content rights scan：

- 是否出现真实海报、作品主视觉、剧照、视频画面。
- 是否出现平台 logo、出品方 logo、版权方标识。
- 是否出现真实作品标题、角色、IP 特征或用户数据。
- 是否文案暗示拥有内容授权、播放权、全网覆盖或官方合作。

推荐做法：

- 高风险内容型 App：优先推荐 `real-screenshot-safe-mask`，保留真实页面结构，只处理高风险局部内容。
- 用户确认已有授权：可以使用 `real-screenshot`，但 manifest 要记录授权假设。
- 如果真实截图无法通过最小化遮挡/脱敏同时满足版权风险和 App in use 要求，标记为阻塞并要求产品侧提供可审核数据、授权素材或截图专用安全内容；不要退回纯概念图。

## 分层视觉制作流程

当用户开始纠正“丑、风格不对、布局不对、顶部文字不对、设备框位置不对、底部装饰不对”时，说明当前流程失控。改用分层流程：

1. 先定五个场景和文案，不做图：
   - 首页/每天更新
   - 追番表/按周追番
   - 搜索/快速搜索
   - 详情/详情与追番
   - Widget/桌面小组件
2. 单独生成 `framework-options/`：只包含背景、底部装饰、手机设备框、阴影和空间关系，不包含标题、分割线或截图。
3. 用户选定框架后，不再重绘框架；如果只要求改手机尺寸、顶部留白或底部弧形，只改框架提示词中的对应约束。
4. 合成第一张样图：固定标题、字幕、分割线、设备框和主体位置；先让用户确认第一张。
5. 第一张确认后再补齐 2-5 张。补齐时保持背景、设备框、标题字号、分割线尺寸和位置不变，只替换场景文案、真实截图和必要遮挡/脱敏层。
6. 生成 contact sheet 一次性检查整体一致性，再抽检至少 1 张原图。

已确认视觉不应被后续步骤重写。典型错误和处理方式：

- 只要求把缩略图换成清晰截图，却重做了整张图：错误。应只替换手机屏幕/主体图层。
- 只要求补齐 2-5 张，却改变标题字号、分割线数量或顶部背景：错误。应锁定第一张已确认样式。
- 顶部文字区用白底遮住背景：错误。标题和分割线应作为透明 overlay 叠在背景上。
- 截图被二次处理、拉伸或超出设备框：错误。真实截图只允许等比缩放和裁剪，不允许变形或额外滤镜。
- 抽象 UI 或概念图“审核安全”但不展示真实 App：错误。必须回到真实截图策略；必要时只对真实截图做局部安全处理。

## 禁止纯概念宣传图

纯概念宣传图不能作为 App Store screenshot 生产机制。Apple Guideline 2.3.3 要求截图准确反映 App in use；营销或促销材料如果不反映 App UI，不适合作为截图。

如果历史目录中存在 `processed-concept-screenshots/`、`concept-sources/` 或 `concept-composite/`，只能作为 rejected/reference 历史产物，不得推荐上传。Manifest 应改为记录真实截图或安全遮挡截图，例如：

```json
{
  "safeMaskedScreenshots": {
    "outputDirectory": "processed-screenshots/zh-Hans",
    "contactSheet": "working/style-composite/selected-contact-sheet.png",
    "items": [
      {
        "order": 1,
        "page": "Home",
        "language": "zh-Hans",
        "title": "每天更新",
        "subtitle": "新番动态、预约与推荐集中查看",
        "sourceScreenshot": "raw-screenshots/zh-Hans/01-home.png",
        "output": "processed-screenshots/zh-Hans/01-home.png",
        "assetType": "real app screenshot with localized promotional wrapper",
        "generationMode": "real screenshot plus deterministic local typography and optional localized masking overlay",
        "contentRightsReview": {
          "usesRealThirdPartyCoverArt": "reviewed",
          "usesRealThirdPartyLogos": "reviewed",
          "maskingApplied": true
        }
      }
    ]
  }
}
```

## Manifest 字段

`assets-manifest.json` 建议结构：

```json
{
  "generatedAt": "YYYY-MM-DD",
  "appName": "",
  "version": "",
  "targetDevice": "iPhone 6.9",
  "localizations": {
    "zh-Hans": [
      {
        "order": 1,
        "title": "",
        "page": "",
        "sourceScreenshot": "raw-screenshots/zh-Hans/01-home.png",
        "output": "processed-screenshots/zh-Hans/01-home.png",
        "width": 1320,
        "height": 2868,
        "format": "png",
        "reviewNotes": ""
      }
    ]
  },
  "blocked": []
}
```

## 阻塞报告格式

如果不能生成截图文件，最终输出必须包含：

```yaml
blocked_missing_screenshots:
  status: blocked
  attempted_paths:
    - ""
  missing_minimum_input:
    - "可运行模拟器或真机截图"
    - "可构造的 SwiftUI snapshot harness"
    - "用户提供的原始截图"
  next_action: ""
```

不要把“截图拍摄建议”包装成完成结果。
