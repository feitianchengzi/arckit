---
name: arckit-appstore-submission
description: 用户要求 iOS/macOS 提交苹果审核、准备正式送审版本、首次送审、更新或拒审重提时使用。基于最新 TestFlight 构建核验素材与审核资料并提交，强制依赖 arckit-appstore-connect，需要制作或更新素材时依赖 arckit-appstore-assets；不负责独立素材制作、构建上传、审核后上线或持续等待审核结果。
---

# App Store 正式送审

将指定 Apple 应用最新 TestFlight 构建及已确认资料提交 Apple 审核，以提交成功为结束点。

## 必需依赖

先按 [连接依赖](references/connection-dependency.md) 定位并读取 `arckit-appstore-connect`，记录实际 `<connect-root>`。依赖缺失时停止并报告，不能假定本 skill 自带工具。

## 执行约定

- 明确本轮是完整送审、仅检查还是拒审说明；咨询/只读不产生远端写入。仅制作商店素材的请求由 arckit-appstore-assets 承担。
- 完整送审直接选择目标平台最新 TestFlight 构建；不要求测试通过证明或测试确认。无构建或最新构建不可送审时停止送审，给出 TestFlight 前置动作。
- 固定 appId、平台、buildId、版本和构建号；不能静默降级旧构建、切换平台或使用未经关联的工作区最新代码制作素材。
- 默认全球发行、动态应用语言；免费或付费必须有用户显式决定。首次默认提出审核后手动发布，已有明确发布策略沿用。
- 准备完成后展示具体送审摘要并取得最终确认；确认绑定构建、资料、声明、内购项目、价格、地区和发布方式，重大变化需重新确认变化部分。
- 项目/远端现有配置与资料先查询后修改，写后回读；不在本入口默认创建分支、打 tag、提交或推送。Git 方法由 Agent 自主选择，不硬绑定其他 skill。
- 以 Apple 接收提交的关联证据完成；不持续等待审核、不代替审核通过、不执行审核后上线。

## 1. 恢复身份与当前任务

输入：用户要求、适用 AGENTS.md、项目记录和 App Store Connect 状态。
读取 [发现与恢复](references/discovery-state.md)，识别首次送审、更新、拒审重提或已有提交。
读取 [连接依赖](references/connection-dependency.md)，复用 profile；缺连接时使用连接依赖的鉴权窗口，保存后自动续接。
按应用和平台恢复现有版本、提交及资料，已有同构建提交先核验，不重复创建。
退出：身份与目标平台唯一、任务范围清楚；身份不明只做独立准备并问最少问题。

## 2. 固定最新 TestFlight 构建

输入：目标 appId、IOS 或 MAC_OS、完整分页构建查询。
读取 [构建选择与送审 API](references/submission-api.md)。运行 `<connect-root>/scripts/asc-submission.mjs latest`，记录排序依据与输出。
检查处理状态、正式送审资格及版本可编辑性。最新构建不合格时列出具体阻塞，不能先筛选可用构建再取最新。
已有审核中的其他构建不自动撤回；构建变化导致需要改代码时返回 TestFlight 阶段。
退出：唯一固定的送审构建及当前提交状态，或 `blocked_no_testflight` / `blocked_latest_build`。

## 3. 补齐资料与必要决定

输入：选定构建对应的实现证据、已批准资料和当前后台字段。
读取 [资料与确认边界](references/metadata-and-approval.md)。动态识别实际应用语言并映射商店 locale，明确全球发行目标、下载收费与发布方式。
首次检查完整必填项；更新核对变化；拒审先读取原因再判断补资料或更换构建。
隐私、加密、分级和内容权利以证据提出建议，仅询问无法确定的事实；复用无变化的已确认声明。
免费/付费未明确时尽早询问并继续独立准备；付费还需基准地区、价格和生效安排。
退出：资料缺口明确，必要人工事项具体可执行；未决事实禁止猜填。

## 4. 核验或补齐素材

输入：固定构建、语言/设备要求、现有素材清单与后台资源。
读取 [素材交接](references/assets-handoff.md)，先核验已有产物；素材齐备且匹配构建时直接复用。
需要创建或更新素材时，必须定位并读取 arckit-appstore-assets，将固定构建、来源证据、语言/设备和输出目录交给该 skill。依赖缺失时报告具体阻塞，不在本 skill 内复制制作流程。
消费实际文件和 manifest，复核身份/构建关联、覆盖、摘要和检查结果；素材完成不能代替送审条件核验。
涉及审核访问、拒审回复或演示资料时读取 [审核说明](references/app-review-information.md)，继续由本 skill 准备。
退出：本次所需素材齐备可核验，或依赖/素材/人工确认阻塞明确；不得带缺项提交。

## 5. 准备远端草稿和最终确认

输入：固定构建、素材清单、已确认事实、后台当前状态。
按 [资料与确认边界](references/metadata-and-approval.md) 区分版本草稿写入与立即影响线上的修改；后者先确认影响。
按 [构建选择与送审 API](references/submission-api.md) 创建/复用版本，绑定构建，保存本地化与审核资料，上传素材并回读处理结果，准备提交项目。
执行前按当前官方 schema 校验请求；API 未覆盖的字段使用已授权浏览器或准确人工交接，不能绕过必填条件。
所有准备完成后输出送审摘要：应用/平台/版本(build)、素材预览、语言、全球地区例外、收费、声明变化、内购、审核访问与发布方式。明确无阻塞后请求一次最终确认。
退出：明确批准该摘要；未批准时保留 `awaiting_confirmation`，不发起正式提交。

## 6. 提交、核验与结束

输入：已确认摘要、绑定的版本/构建/提交 ID。
提交前回读关键状态，确认与摘要一致；发生重要变化返回相应准备或确认节点。
发起正式提交后有限回读，验证 submission → item → version → build 关联。超时先对账，不直接重放。
按 [发现与恢复](references/discovery-state.md) 保存 `submitted`、`not_submitted` 或 `outcome_unknown` 及恢复信息。
退出：已取得提交成功证据即结束；状态不明最多有限核验后交接，不等待审核通过、不创建后台轮询。

## 最终输出

应用/团队、平台、版本(build)/buildId、语言和素材路径、地区/价格/发布策略、已确认声明变化、submission ID/提交时间/回读状态、阻塞及最小恢复动作。
区分本地素材完成、远端草稿完成、已提交；不把 Ready for Review 当作已送审。
工具来源和离线维护入口见 [连接依赖](references/connection-dependency.md)；维护后验证读取 [验证与交接](references/validation.md)。
