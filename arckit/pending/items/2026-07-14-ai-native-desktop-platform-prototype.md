# AI 原生软件产品研发平台桌面端交互原型

## Status

- State: candidate
- Type: process_handoff
- Source: 用户要求、AI 原生软件产品研发平台整体规划、桌面优先产品形态讨论
- Created: 2026-07-14
- Updated: 2026-07-14
- Decision: 作为团队体验讨论与产品感觉验证原型，暂不提升为正式 interaction 或 visual 事实

## Background

团队正在讨论一套覆盖产品构思、研发、交付和反馈学习的软件产品研发平台。当前需要通过一个从登录开始、可以实际点击的桌面端原型，验证完整产品是否具有统一入口、连续上下文和清晰的人机协作体验。

本原型采用“桌面优先、云端协同”的候选产品形态：

- 桌面客户端是团队成员日常使用的统一入口。
- Product Studio、Work Hub、Automation Runtime、Delivery、Feedback 和 Capability 以同一产品中的能力区域呈现。
- Developer Workbench 连接本地仓库、Codex 类工具、Xcode、skills 和执行证据。
- 服务器负责团队共享状态、运行控制、反馈、交付和外部集成。
- 被研发的 iOS App 通过 Build、TestFlight 和 Feedback SDK 进入完整闭环。

## Prototype

- 入口：[`prototypes/desktop-platform/index.html`](../prototypes/desktop-platform/index.html)
- 体验说明：[`prototypes/desktop-platform/README.md`](../prototypes/desktop-platform/README.md)
- 实现方式：独立 HTML、CSS 和 JavaScript，无网络和构建依赖
- 推荐画布：1440 × 900，最低支持 1100 × 720

## Design Direction

### 产品形态

使用一个统一桌面壳承载七个逻辑产品单元，而不是为每个单元建立割裂的后台产品。桌面端同时承担团队协作入口和本地开发桥接，使“查看状态”和“继续工作”保持在同一环境中。

### 信息架构

主导航包含：

1. 今日：产品状态、需要人工判断的事项、运行中自动化和接下来工作。
2. 产品：ProductIdea、正式 Product 和产品生命线。
3. 工作：个人队列、WorkItem、Handoff 和产品决策。
4. 自动化：Case、Loop、Run、边界、证据和人工 Gate。
5. 开发工作台：本地 Workspace、Codex、项目事实、skills 和运行证据。
6. 交付：Build、Release Candidate、TestFlight 和发布检查。
7. 反馈：用户反馈、AI 归并、澄清、转 Work 和修复关联。
8. 能力：Capability、SkillSet、版本和产品选择。

### 视觉方向

- 使用深色固定导航表达稳定的产品控制面。
- 使用冷灰高密度工作区支持研发工具的长期使用。
- 靛蓝只用于产品当前状态、AI 运行和主要操作。
- 绿色、琥珀和红色分别表达完成、等待判断和风险。
- 减少大面积营销式 Hero 和均质卡片堆叠，优先使用列表、分栏、时间线和状态面板。
- 以“产品生命线”作为 Signature 元素，连接构思、建设、交付和反馈学习。

## Core Paths

### 登录与上下文恢复

```text
登录
  → 恢复团队工作区
  → 今日
  → 查看 Product 当前生命线
  → 处理需要人工判断的事项
```

### 产品决策与自动执行

```text
Work Hub
  → 阅读 AI 决策摘要
  → 人确认产品范围
  → 创建 Automation Loop
  → Runtime 执行
  → 查看 Evidence
```

### 本地开发协作

```text
Developer Workbench
  → 恢复 Product / Work / Case / Facts / Skills
  → Codex 执行
  → 查看变更和验证
  → 人审阅
  → Case 状态写回
```

### 用户反馈闭环

```text
Feedback
  → AI 归并和问题判断
  → 人确认
  → 转 WorkItem
  → Case / Run
  → Build / TestFlight
  → 用户验证
```

## Key States

- 未登录、登录恢复中和已登录。
- 产品定义、建设、交付和学习阶段。
- WorkItem 待处理、需要决策、等待接力和 AI 可执行。
- Run 运行中、等待人工、完成和恢复。
- 本地 Runtime 在线与 Workspace 已连接。
- Release 准备中、检查完成和等待授权。
- Feedback 高影响、待评估、待澄清和已转 Work。
- Capability 已启用、推荐和正在检查配置。

## Interaction Risks

- 桌面端承载能力过多，可能让一级导航显得像多个后台系统的集合。
- Work Hub、Automation Runtime 和 Developer Workbench 的对象关系需要通过真实使用验证。
- Product Studio 的深度产品编辑能力在本原型中表达较轻。
- Feedback 与 Work 的往返应避免让反馈处理者进入过多工程细节。
- 自动化时间线与 Codex 对话同时存在，需要继续判断两种视图的主次关系。
- 桌面优先形态仍需后续确认哪些团队协作能力必须提供 Web 访问。

## Visual Risks

- 当前临时品牌和靛蓝色不应直接提升为正式视觉规范。
- 原型为高信息密度桌面工具，需要继续检查小字号的长期可读性。
- 产品生命线需要在更多页面中保持一致，避免只成为首页装饰。
- 示例产品和演示数据可能让团队把注意力放在具体内容而非平台结构。

## Current Judgment

当前推荐继续使用“统一桌面壳 + 本地开发工作台 + 云端共享服务”的方向进行体验验证。

这个方向的关键价值不是把所有 Web 页面搬进桌面端，而是：

- 让 Product、Work、Automation 和本地开发环境保持连续。
- 让团队成员从需要自己处理的事项直接进入完整上下文。
- 让 AI 执行、人工接力和结果写回发生在同一个产品体验中。
- 让被研发 App 的交付和反馈自然回到产品生命线。

## Process Handoff

- Kind: controller_design_analysis_handoff
- Source: Controller product worker packet
- Target Candidate Skills: arckit-interaction, arckit-visual, arckit-spec
- Source Refs:
  - `arckit/pending/items/2026-07-14-ai-native-software-product-development-platform-blueprint.md`
  - 用户要求“尝试制作一个完整的桌面端产品交互原型，注意从登录开始”
  - 桌面优先、云端协同的产品形态讨论

### Accepted Facts

- 原型需要从登录开始，覆盖完整桌面产品体验。
- 桌面端需要呈现 Product、Work、Automation、Workbench、Delivery、Feedback 和 Capability 的串联关系。
- 被研发的 iOS App、Codex 类工具、本地工程、平台服务器和真实反馈属于完整系统。
- AI 应表现为各产品中的能力，不表现为独立团队角色。
- 现有项目只提供能力来源，不决定原型导航和产品边界。

### Assumptions

- 团队成员愿意把桌面客户端作为日常工作主入口。
- 多个逻辑产品单元可以在同一桌面壳中保持一致体验。
- MVP 的中央协作数据可以由云端服务提供，桌面端保留本地开发连接。
- Product Studio 的复杂编辑可以在后续原型中继续展开。

### Gaps

- 正式品牌、视觉语气和产品命名尚未确定。
- 登录、组织、成员和权限的完整流程尚未展开。
- ProductIdea 创建后的完整 AI 分析和团队讨论流程尚未展开。
- 多人实时协作、评论和通知规则尚未验证。
- Web 端、桌面端和移动通知的最终职责尚未确认。
- 无网、账号过期、本地 Runtime 断开和同步冲突等恢复流程尚未展开。

### Risks

- 统一入口可能因为能力过多而增加首次理解成本。
- 高信息密度可能影响非开发角色使用。
- 如果桌面端和 Web 端未来同时提供完整功能，可能形成体验和维护重复。
- 如果 Product State 的表达不够清晰，界面可能退化为普通项目管理工具。

### Rejected Items

- 为七个逻辑产品单元分别制作互不关联的后台页面。
- 用营销首页代替真实桌面工作流。
- 把 AI 设计成单独的聊天产品或虚拟团队成员。
- 只制作静态截图而不提供可点击状态。
- 在候选体验确认前写入正式 interaction 或 visual 事实。

### Suggested Next

- 团队实际点击原型并记录第一印象、理解困难和缺失流程。
- 优先判断“统一桌面入口”是否成立。
- 确认一级导航、今日首页、Work/Automation/Workbench 分工。
- 选择一条真实 iOS 工作链路，用更高保真数据进行第二轮原型。
- 体验方向确认后，使用 `arckit-interaction` 维护正式页面与流程。
- 视觉方向确认后，使用 `arckit-visual` 定义 tokens 和组件规格。

## Revisit When

- 团队完成第一轮原型体验并返回意见。
- 准备决定桌面端与 Web 端的正式职责。
- 准备把候选页面提升为正式 interaction/visual 规格。

## Related Areas

- `arckit/pending/prototypes/desktop-platform/`
- `arckit/pending/items/2026-07-14-ai-native-software-product-development-platform-blueprint.md`
- `runtime/arcorbit/desktop/`

## Notes

- 原型中的 `Workshop` 是临时产品名。
- 原型数据均为虚构演示数据。
- 原型未连接真实 AI、GitHub、TestFlight 或反馈服务。

## Outcome

待团队体验后填写。
