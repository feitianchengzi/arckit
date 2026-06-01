---
name: arckit-swiftui-networking-api
description: SwiftUI 客户端普通网络 API skill。用于 REST/GraphQL、URLSession、鉴权 token、refresh token、分页、错误码映射、重试、取消、弱网、DTO 到领域模型转换、上传下载、API service、网络日志。用户提到接口、后端、网络请求、登录态 token、分页、上传、下载、错误处理、重试、弱网、DTO、API service 时使用。AI 生成流式输出请同时使用 arckit-swiftui-ai-generation。
---

# ArcKit SwiftUI Networking API

## 目标

把客户端网络能力落成可测试、可取消、可恢复的 SwiftUI API 层。Agent 执行时不要只把 `URLSession` 调通，而要同步建立 DTO 边界、错误分类、鉴权、分页、上传下载和 View 状态衔接。

## 执行流程

1. 先读现有 API service、后端契约、错误码约定和调用页面，判断是新增能力还是接入已有网络框架。
2. 定义最小分层：`View -> Service Protocol -> Service Impl -> API Client -> URLSession`，不要让 View 拼 URL 或直接解码后端结构。
3. 为请求和响应建立 DTO；在 service 或 mapper 中转换为领域模型/display model。
4. 建立错误模型，至少区分网络、超时、取消、认证、权限、服务端、业务错误码、解码失败、文件格式/大小错误。
5. 实现 service protocol、mock/fake、Environment 注入；已有项目有统一注入方式时优先复用。
6. 涉及 token 时处理 refresh 并发互斥；涉及分页时明确首次加载、刷新、加载更多、hasMore、cursor/page、错误重试。
7. 涉及上传下载时使用 `Data`、`URL`、`fileName`、`mimeType`、size limit，不让网络层接收 `UIImage` 或 SwiftUI `Image`。
8. 在 View 层把错误转成 loading/error/retry/empty 等 UI 状态；不要直接展示后端原始错误字符串。
9. 补成功、错误码、解码失败、取消、分页边界、上传限制等测试；无法跑测试时给出手测路径。

## 读取资源

- API client、DTO、错误分类、分页、鉴权、上传下载：`references/networking-contract.md`
- View/Service/Environment 边界：`arckit-swiftui-state-dataflow`
- AI stream、prompt、结构化输出：同时使用 `arckit-swiftui-ai-generation`

## 核心规则

| 问题 | 执行要求 |
| --- | --- |
| 请求散落 | 收敛到 API client/service |
| DTO 直进 UI | 建立 DTO -> Domain/Display 映射 |
| 错误混乱 | 定义稳定错误枚举和 UI 映射 |
| refresh token 竞态 | 做单飞刷新或串行保护 |
| 分页状态混杂 | 区分 refresh/loadMore/initial |
| 上传依赖 UI 类型 | 网络层只收稳定数据载体 |

## 最低交付标准

- View 中没有新增裸 `URLSession`、硬编码 baseURL、重复 request 拼装。
- Service 可 mock，且通过项目约定方式注入。
- DTO 和领域/display 数据边界清楚。
- 请求支持取消和超时语义。
- 用户可见失败态可恢复或可解释。
- 关键路径有测试或明确验证步骤。

## 降级/停止条件

- 只改一个已有接口字段映射时，不重建全套 API client，但仍保持 DTO 边界。
- 后端契约缺失时，先基于现有调用推断并标注待确认字段，不编造业务错误码。
- 若功能实际是 AI 生成质量、prompt 或 stream 解析问题，切到 `arckit-swiftui-ai-generation`。
