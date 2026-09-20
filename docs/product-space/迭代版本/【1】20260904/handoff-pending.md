# 客户支持通道 — 工程状态

> 更新日期：2026-09-17
>
> 代码链路已完整。本文档仅记录部署依赖和验证方式。

---

## 一、完整链路

```
① 客户提交反馈 ──→ SDK Submit ──→ CreateFeedback
                                    ↓
② 客户追问/补充 ──→ SDK Conversation ──→ CreateFeedbackMessage
                                    ↓
③ 智能检索 ──────→ RetrieveHandler
                   ├─ 本地代码搜索 (CodeChunk)
                   ├─ OpenHands Agent (可选)
                   └─ 置信度合并
                                    ↓
④ 自动生成草稿 ──→ CreateDraftHandler (pending_review)
                                    ↓
⑤ 内部确认 ──────→ ConfirmDraftHandler (sent) → 客户收到
                                    ↓
⑥ 分诊 ──────────→ accepted → 转待办 / ignored → 回复说明
                                    ↓
⑦ 转待办 ────────→ ConvertFeedbackToTask + FeedbackTaskLink
                                    ↓
⑧ Codex 开发 ────→ runtime/arcorbit Task 状态机
                                    ↓
⑨ 验收 ──────────→ Task state → accepted
                                    ↓
⑩ 交付 ──────────→ ArtifactDeliveryHandler → artifact_url 回写
                   └─ 自动通知客户 (autoNotifyDelivery)
```

---

## 二、部署依赖（非代码缺口）

| 依赖 | 用途 | 不部署的降级 |
|------|------|------------|
| OpenHands Agent Server | 智能检索 | 本地代码搜索兜底 |
| Embedding 服务 (BGE-M3) | 向量检索 | SQL LIKE 文本匹配 |
| 阿里云 OSS | 产物上传 | 本地临时路径 |

全部有降级策略，链路不会断裂。

---

## 三、验证

```bash
# 单元测试
cd services/workshop-api && go test ./... -count=1 -short

# 启动服务
cd deploy/dev && ./start.sh

# 全链路验证
./verify.sh all
```
