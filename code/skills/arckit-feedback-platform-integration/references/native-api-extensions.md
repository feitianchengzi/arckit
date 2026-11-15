# 原生 API 可选能力与实现限制

使用条件：原生接入需要实时更新、智能客服或评估与 SDK 的能力差异。以下按 2026-10-10 维护源声明；HTTP 前缀均为 `/workshop/v2`，认证与 envelope 见 [核心契约](native-api-mode.md)。路由存在不保证鉴权、部署和能力完整。

## 实时通道

- Session：`GET /feedback/projects/0/ws`，将网关 HTTPS 换为 WSS，WebSocket subprotocol 为 `nebula-auth.<fbs_token>`；不把凭证放进 URL。project path ID 只是占位，实际范围来自 token。服务端自行验证 token；过期需取新 token 后重连。
- API Key：当前 `realtime.ts` 明确返回 null，router 未注册 `/apikey/projects/:id/ws`；使用 HTTP 轮询，不能按旧文档构造该端点。
- 事件作为重新拉取列表/消息/通知的触发信号，关注 `feedback.updated`、`feedback.message.created`；不要把广播内容作为最终状态或当作普通 Message envelope。客户端断线退避（当前 SDK 为 5 秒），回前台重新拉取，退出/账号切换关闭连接。
- 启用前验证实际部署的用户范围过滤、断线和 token 刷新。普通原生反馈流程不依赖 WS。

## 智能客服（与普通反馈消息分开）

| 能力 | 方法 | Session 路径 | API Key 路径 |
| --- | --- | --- | --- |
| 给 Agent 发消息 | POST | `/feedback/feedbacks/:id/agent-message` | `/apikey/feedbacks/:id/agent-message` |
| 反馈的 Agent 对话 | GET | `/feedback/feedbacks/:id/agent-conversations` | `/apikey/feedbacks/:id/agent-conversations` |
| Agent 对话消息 | GET | `/feedback/agent-conversations/:conversationId/messages` | `/apikey/agent-conversations/:conversationId/messages` |
| 反馈的全部 Agent 历史 | GET | 未注册 | `/apikey/feedbacks/:id/agent-messages` |

请求 `content` 必填，`conversation_id` 可选。Session 另接受图片引用 `attachments:[{type,object_key?,url?,file_name?,mime_type?}]`；它不是普通消息的附件 schema，API Key 的 `AgentMessageRequest` 当前只声明 content/conversation_id，不能承诺 API Key 支持图片。Session 多模态受 `AGENT_VISION_ENABLED` 等部署配置控制，上传 object_key 不等于 Agent 已实际看图。

发送返回 `data:{message_id:number,conversation_id:string,content:string,sender_type:string,tool_calls?:ToolCall[],confidence:number,need_collect?:boolean}`。ToolCall 当前为 `{tool:string,params:object,results_count?:number}`。失败可能返回兜底内容及 `need_collect=true`，HTTP 成功不证明 AI 能力正常。此接口没有 `client_message_id` 幂等契约，结果未知时不能自动重发。

对话列表 `data` 为数组，每项 `{id:string,feedback_id:number,project_id:number,created_at,updated_at,deleted_at?}`。历史 `data` 为数组，按创建时间升序；每项含 `id,conversation_id,feedback_id,project_id,sender_type,content,created_at`，可选 `confidence,tool_calls,tool_results,metadata,deleted_at`。服务端 AgentMessageRecord 的 tool_calls/tool_results/metadata 是 JSON **字符串**，不要照搬 SDK TypeScript 声明成已解码数组。详情见 `handler/agent_conversation.go`、`agent_message.go`、`agent_message_session.go`。

### 已知限制（接入前置，不在本 skill 中修复服务端）

- API Key Agent handler 校验项目成员，没有普通 customer 消息接口的 custom_user_id 归属隔离。不能把它作为不可信终端的单用户接口；须由可信宿主代理完成归属校验，或先由平台完善权限。
- API Key `/agent-conversations/:conversationId/messages` 已注册，但 handler 还要求路由参数 `:id` 作为 feedback ID，实际路径不提供，存在路由与 handler 不一致。不要编造嵌套 URL 规避；标记该能力待平台修复/验证。
- Session Agent 历史 handler 当前仅检查 conversation.project_id，未像普通消息一样校验 feedback.custom_user_id；指定 conversation_id 的创建/复用也需额外核验归属。存在单用户隔离缺口时，不默认向终端开放该扩展；服务端修复或可信代理验证后再启用。
- `/apikey/feedbacks/:id/escalate` 是成员工作流接口；Session 未注册对应路由。`need_collect` 可用于提示人工帮助，不据此推断 Session 可转待办、分诊或升级人工。

## 维护时的完整性核对

在维护源执行契约更新时，对照 router → handler 请求/响应 → SDK client → 配置 UI；文档与代码冲突时记录差异，不把全部相似路由自动纳入终端权限。核心提交/消息、附件、通知分别核对两种认证路径。常规异项目接入直接使用本 skill 内置契约，仅在真实响应冲突或用户要求时确认部署版本；不下载 SDK bundle 反向猜接口。
