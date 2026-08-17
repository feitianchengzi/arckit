# Tech Relations

## Runtime

`arcorbit/solution.md` 定义 Runtime Kernel 与 Automation Supervisor 的运行期职责。

`arcorbit/installer-supply-chain.md` 定义安装包构建、受信资源打包、ArcForge embedded provider、Desktop Setup Readiness 和 Agent skills 消费目标；它在 task start 前向 `arcorbit/solution.md` 提供已满足的本机运行前提。

`arcorbit/state-condition-ledger-solution.md` 定义安装包中 trusted ledger resources 的语义契约。安装供应链只校验、定位和打包这些资源，不复制其写回逻辑。

`arcorbit/desktop-execution-solution.md` 定义安装完成后的 Desktop session 与执行模型。Setup Readiness 是其前置 gate，不进入 task session、Case Loop 或 execution lease。

## Product Mapping

`arckit/spec/arcorbit-distribution.md` 对应 `arcorbit/installer-supply-chain.md`，定义人工出包、安装、修复、升级和失败恢复的产品行为。

`arckit/spec/agentic-software-development/runtime-automation-workspace.md` 对应 `arcorbit/solution.md` 与 `arcorbit/desktop-execution-solution.md`，定义 task-driven Runtime 工作区行为。
