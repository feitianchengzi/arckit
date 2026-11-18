---
name: arckit-appstore-testflight
description: 用户显式调用即可将当前 Apple 应用项目推进到内部 TestFlight 可测试，无需附加 prompt；涵盖首次配置、断点续接、签名、Xcode Cloud、版本 tag 和内测成员。默认含必要提交推送及内部测试邀请，不含正式提交审核、上架、证书吊销或组织权限扩张。 强制依赖 arckit-appstore-connect。
---

# App Store TestFlight 交付

仅调用 `$arckit-appstore-testflight` 即执行默认任务：让当前项目对应提交的构建进入内部 TestFlight 测试组，并邀请有应用权限的合格组织成员。默认内测目标来自调用契约，无需另写 prompt 或另建 tag→渠道映射；tag 按项目既有版本规范选择。Cloud 负责构建上传，Agent 通过 API 完成组、构建和成员交付，不依赖 Cloud TestFlight post-action。

## 必需依赖

先按 [连接依赖](references/connection-dependency.md) 定位并读取 `arckit-appstore-connect`，记录实际 `<connect-root>`。依赖缺失时停止并报告，不能假定本 skill 自带工具。

## 默认契约

- 这是显式调用入口，不因提到 iOS、证书或 Git 就自动执行。附加要求可缩小范围；仅咨询时不写入。
- 默认范围包含必要的项目配置、Apple 资源创建/复用、Cloud 配置、交付所需改动的提交、向当前已确认远端分支推送及版本 tag 推送、构建追踪、内测入组和邀请。
- 开始时简短声明范围并继续，不要求用户再写任务描述。具体团队、应用、远端或交付目标不唯一时先做独立准备，再问最少的问题。
- 保留用户明确授权；宿主命令批准与 Apple API 权限分别处理。本文件不能绕过宿主审批，也不能补充超出默认契约的授权。
- 正式审核/上架、外部测试、法律协议接受、证书吊销、权限扩张、强推、移动既有 tag、切换/创建/合并分支均需额外明确授权。
- 复用已有资源；任何创建前查询，写入后回读。写请求超时先对账，不直接重放。
- 不自动升级应用主次版本、不提交无关改动、不把工作区“最新”或后台“最新”当作本次交付证据。
- 密钥不进入仓库、聊天或日志；只记录凭据引用。加密合规结论结合实现证据判断，不能由脚本猜测。

## 1. 发现项目与恢复任务

输入：当前目录、会话指令、项目已有记录。
动作：读取适用 AGENTS.md、Git 状态、工程/工作区、主应用与扩展 targets、scheme、版本和签名设置；读取 [发现与状态](references/discovery-state.md)。
- 查找已有交付配置、CI 和版本规范，优先复用。多应用/多仓库歧义必须解析，不拿第一个结果代替选择。
- 识别首次配置、续接或新增交付；再次调用先查询已记录资源和云端状态。
- 当前提交已达到终点时输出现状，不再消耗证书、tag 或构建。
退出：发布单元、代码来源、默认目标和待补输入确定；记录允许的操作范围。

## 2. 验证 Apple 连接

输入：团队信息、现有凭据引用。
动作：读取 [连接依赖](references/connection-dependency.md)，验证凭据和可访问资源，不靠 Key ID 猜团队。
- 优先使用项目已配置工具；无合适工具时使用连接依赖的 Node API 客户端。
- 先恢复本机 credentialProfile 并验证；需要首次配置或更换时启动 skill 内置交互 UI。用户选择申请或已有配置后，在同一窗口输入参数、选择 .p8 并验证保存；Agent 只消费 profile 引用与结果，不索取或读取原始凭据。具体入口见授权 reference。
- 缺少密钥、团队选择、登录/2FA、协议或仓库授权时，提供具体页面、字段和完成后的验证动作。
- 内置 UI 启动后持续等待其进程回执；工具提前返回进程 ID 时继续等待同一进程。收到 saved 后保存引用、核对目标应用并自动续接原发布任务，无需用户再发“完成”。只有无法取得机器回执的外部人工操作才等待用户告知后回读。
- 失败区分宿主拒绝、请求未发起、网络、401、403 和业务错误。
退出：目标团队明确，必要 API 可访问；否则保存事实和最小人工动作。

## 3. 补齐应用身份和签名

输入：平台、targets、团队、现有资源。
动作：读取 [身份与签名](references/signing.md)，按真实需求复用/创建 Bundle IDs、capabilities、profiles；只创建缺失且必要的证书。
- 检查本地证书与私钥配对、有效期、平台用途；Cloud 管理签名与本地签名分开判断。
- 新建 App Store Connect 应用采用官方网页流程；可用浏览器先准备/填写，仅无法自动完成的环节交给用户。
- 从已确认命名规则或用户前缀生成 Bundle ID；缺少依据时问一次，不虚构企业域名。
退出：应用、Bundle IDs、团队匹配；签名满足本地开发和目标分发需要。

## 4. 配置项目和 Cloud

输入：已匹配身份、项目、仓库。
动作：读取 [Cloud 与版本](references/cloud-version.md) 和 [TestFlight 与合规](references/testflight.md)。
- 修改生成源或原生工程；保留已有配置，验证 shared scheme、entitlements、版本和构建号。
- 检查应用及依赖加密用途，有依据时配置 Info.plist；不为消除提示盲设豁免。
- 查询 Cloud 产品、仓库、workflow；配置版本触发归档与上传。只保留项目明确需要的验证动作，不默认新增 release 分支验证 workflow。
- API 未覆盖的首次 onboarding 用浏览器或精确人工交接补齐；TestFlight post-action 无论缺失、不可读或未选择组，都不阻塞 API 内测交付。
- 运行必要的配置、编译/归档检查；复用有效证据，不为验证重复签发证书或上传产物。
退出：本地配置可用，远端触发与 scheme 对齐，分发路径明确。

## 5. 创建唯一交付触发

输入：已验证配置、项目 Git/tag 规范。
动作：按 cloud-version 的基线和幂等规则，显示目标 branch、SHA、remote、tag，执行默认契约内的最小提交/推送。
- 既有 Git 规范优先，无需隐藏加载另一个 skill。无规范时采用 reference 中的默认值。
- 原有脏改动必须说明归属；仅提交本次必要且范围明确的文件，不默认 git add all。
- 当前分支无法满足既有稳定线策略时准备方案并询问分支操作，不自动切换。
- tag 已存在且同 SHA 时查询构建；异 SHA 时处理冲突，绝不覆盖。
退出：远端 tag/commit 已核实，记录触发时间，开始定位对应 Cloud run。

## 6. 追踪构建、入组并邀请成员

输入：workflow、tag、SHA 和构建关联。
动作：按照 cloud-version 追踪本次 run，按照 testflight 完成声明、入组和成员去重。
- 用 run → builds 关联选择产物，核对应用、平台、版本及处理状态，不能仅按上传时间取第一条。
- 按 testflight 的 API 顺序查询/创建内部组、确认构建合规和可测试、添加 build、筛选及添加组织成员，最后验证组和邀请状态；不扩大组织权限。
- 已由 Cloud 或其他操作入组时跳过重复写入。API 403 是权限阻塞，不能转而要求用户配置 post-action 作为默认解决办法。
- 按 cloud-version 分阶段观测，不将整体 RUNNING 当作仍在编译；同阶段 5 分钟无进展升级诊断。本轮默认累计 30 分钟上限，阶段变化或重试不重置；到时保存恢复点并结束自动执行，交由人工决定是否续接，不自动重建或后台等待。
退出：本次构建在组内且可内测；成员已加入且邀请状态已回读，或阻塞可恢复。

## 7. 交付与恢复记录

输入：各阶段本地/远端证据。
动作：更新 discovery-state 规定的配置和本地状态；后续调用重新读取远端事实。
退出：输出应用/团队、版本(build)、SHA/tag、workflow/run、测试组、成员数量及跳过原因、合规状态、验证证据和剩余人工动作。
- 区分 configured、triggered、processing、ready、invited、accepted；已邀请不等于已安装。
- 完成表示内部测试可用，不表示正式审核通过或上架。

## 工具与引用

API 脚本、写入范围及错误处理见 [API 操作](references/api-operations.md)。
维护本 skill 或验证默认调用行为时读取 [验证场景](references/validation.md)。
Apple 接口易变；实施前核对对应官方文档/schema。reference 核对日期不替代运行时检查。

本 skill 强制依赖 arckit-appstore-connect，工具只在该依赖中维护与执行，见 [连接依赖](references/connection-dependency.md)。
