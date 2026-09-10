# ArcOrbit Desktop 现状梳理

本目录基于 `runtime/arcorbit` 与 `services/workshop-api` 的真实代码核实(2026-09-10),沉淀 ArcOrbit Desktop 当前的产品架构、技术架构、运行时时序与页面串联现状。

> 本组文档是**现状基线**,不是目标设计。描述的是"代码里现在是什么",用于后续迭代的参照底座。若实现走向与文档冲突,以代码为准并回写本目录。

## 文件清单

| 文档 | 内容 |
|---|---|
| [01-product-architecture.md](./01-product-architecture.md) | 产品分层、Project State / Case / Loop 轴、各页面产品角色 |
| [02-technical-architecture.md](./02-technical-architecture.md) | 进程模型、Manager/Coordinator 依赖拓扑、持久化、IPC 通道、外部边界 |
| [03-sequence-diagrams.md](./03-sequence-diagrams.md) | 启动就绪、自动化 Loop、Chat、人工介入、Recovery、Workshop 同步六条时序 |
| [04-page-linking.md](./04-page-linking.md) | 页面切换机制、跨页面共享状态、端到端工作流串联 |

## 覆盖范围

- **实操层**:Work / Chat / Feedback / Organization
- **运行控制层**:Today / Command / Task Browser / Intervention Workbench / Recovery Center
- **规划预览层(只读)**:Idea / Release / Operations / Engineering
- **前置**:Setup Readiness(Codex CLI + Skill bundle 就绪检查)

## 不在本次梳理范围

- `apps/todo-web`、`apps/feedback-console` 浏览器客户端的渲染实现(后续单独梳理)
- `packages/feedback-sdk-web`、`examples/feedback-ios` 的对外集成面
- 规划预览层四页的具体产品规划意图(它们当前为静态示意数据,无后端绑定)
