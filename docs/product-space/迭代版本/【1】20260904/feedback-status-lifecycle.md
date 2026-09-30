# 反馈状态流转生命周期设计

## 1. 状态定义

### 1.1 Feedback 状态（status）

| 状态 | 说明 | 是否显示在内部工作台 |
|------|------|---------------------|
| `pending` | 待处理（刚创建） | ✅ 显示 |
| `triaged` | 已分诊（智能客服处理中） | ❌ 不显示 |
| `accepted` | 已接受（决定做） | ✅ 显示 |
| `converted` | 已转为开发任务 | ✅ 显示 |
| `in_progress` | 开发中 | ✅ 显示 |
| `completed` | 开发完成 | ✅ 显示 |
| `released` | 已交付给客户 | ❌ 不显示（可筛选查看） |
| `ignored` | 已忽略 | ❌ 不显示（可筛选查看） |
| `auto_resolved` | 智能客服自动解决 | ❌ 不显示 |

### 1.2 Triage 状态（triage_status）

| 状态 | 说明 |
|------|------|
| `pending` | 待分诊 |
| `accepted` | 已接受（转任务） |
| `ignored` | 已忽略 |
| `auto_resolved` | 智能客服自动解决 |

### 1.3 Agent 处理状态（agent_status）

| 状态 | 说明 |
|------|------|
| `pending` | 待处理 |
| `processing` | 处理中 |
| `high_confidence` | 高置信（自动回复） |
| `medium_confidence` | 中置信（草稿待确认） |
| `low_confidence` | 低置信（转人工） |
| `escalated` | 已升级（转人工处理） |

---

## 2. 状态流转图

```
                    ┌─────────────────────────────────────┐
                    │           客户提交反馈                │
                    └─────────────────────────────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │   pending    │
                              └──────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │     智能客服检索知识库               │
                    └─────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │ high_conf    │ │ medium_conf  │ │ low_conf     │
            │ (≥0.9)       │ │ (0.75-0.9)   │ │ (<0.75)      │
            └──────────────┘ └──────────────┘ └──────────────┘
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │ auto_resolved│ │ 草稿待确认    │ │  escalated   │
            │              │ │              │ │ (转人工)      │
            └──────────────┘ └──────────────┘ └──────────────┘
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │ 客户收到回复  │ │ 人工确认      │ │ 内部工作台    │
            │ 问题解决      │ │              │ │ 显示待处理    │
            └──────────────┘ └──────────────┘ └──────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │   accepted   │
                              └──────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │  converted   │
                              └──────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │ in_progress  │
                              └──────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │  completed   │
                              └──────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │  released    │
                              └──────────────┘
```

---

## 3. 内部工作台显示逻辑

### 3.1 过滤规则

```javascript
// 内部工作台只显示需要人工处理的反馈
function shouldShowInInternalWorkspace(feedback) {
  // 不显示的状态
  const hiddenStatuses = ['auto_resolved', 'released', 'ignored'];
  
  // 不显示的 agent 状态（智能客服已解决）
  const autoResolvedAgentStatuses = ['high_confidence'];
  
  // 如果是智能客服自动解决，不显示
  if (feedback.status === 'auto_resolved') return false;
  if (feedback.agent_status === 'high_confidence') return false;
  
  // 如果已忽略或已交付，不显示（除非用户选择查看）
  if (hiddenStatuses.includes(feedback.status)) return false;
  
  // 显示需要人工处理的
  return true;
}
```

### 3.2 需要人工处理的情况

1. **低置信反馈**：智能客服无法回答，需要人工介入
2. **中置信草稿被驳回**：人工确认不通过，需要重新处理
3. **客户追问**：需要人工回复的后续问题
4. **分诊决策**：需要内部人员决定是否做

---

## 4. Agent 处理流程

### 4.1 高置信（≥0.9）

```
客户提问 → 检索知识库 → 置信度 ≥ 0.9
  ↓
直接回复客户（标注来源）
  ↓
更新 feedback.status = 'auto_resolved'
更新 feedback.agent_status = 'high_confidence'
  ↓
不显示在内部工作台
```

### 4.2 中置信（0.75-0.9）

```
客户提问 → 检索知识库 → 0.75 ≤ 置信度 < 0.9
  ↓
生成草稿回复
  ↓
显示给内部人员确认
  ↓
确认通过 → 发送客户 → status = 'auto_resolved'
驳回 → status = 'escalated' → 显示在内部工作台
```

### 4.3 低置信（<0.75）

```
客户提问 → 检索知识库 → 置信度 < 0.75
  ↓
转追问收集（引导客户补充信息）
  ↓
更新 feedback.agent_status = 'low_confidence'
  ↓
显示在内部工作台（需要人工介入）
```

---

## 5. 数据库变更

### 5.1 新增字段

```sql
-- feedbacks 表新增字段
ALTER TABLE feedbacks ADD COLUMN agent_status VARCHAR(32) DEFAULT 'pending';
ALTER TABLE feedbacks ADD COLUMN agent_confidence DECIMAL(3,2);
ALTER TABLE feedbacks ADD COLUMN auto_resolved_at TIMESTAMP;
ALTER TABLE feedbacks ADD COLUMN escalated_at TIMESTAMP;

-- 索引
CREATE INDEX idx_feedbacks_agent_status ON feedbacks(agent_status);
CREATE INDEX idx_feedbacks_agent_confidence ON feedbacks(agent_confidence);
```

### 5.2 更新现有数据

```sql
-- 将已有的高置信反馈标记为自动解决
UPDATE feedbacks 
SET status = 'auto_resolved', 
    agent_status = 'high_confidence',
    auto_resolved_at = updated_at
WHERE id IN (
  SELECT f.id FROM feedbacks f
  JOIN feedback_messages fm ON f.id = fm.feedback_id
  WHERE fm.sender_type = 'agent' 
    AND fm.confidence >= 0.9
    AND f.status = 'pending'
);
```

---

## 6. API 变更

### 6.1 获取反馈列表（内部工作台）

```
GET /workshop/v2/user/feedbacks?project_id=13&show_resolved=false
```

**参数说明**:
- `show_resolved`: 是否显示已解决的反馈（默认 false）

### 6.2 更新反馈状态

```
PUT /workshop/v2/user/feedbacks/:id/status
```

**请求体**:
```json
{
  "status": "accepted",
  "reason": "需要开发新功能"
}
```

---

## 7. 前端变更

### 7.1 过滤逻辑

```javascript
// renderer.js 中的过滤逻辑
const scoped = (state.platform.feedback_v1 || [])
  .filter(platformItemMatchesSelectedProject)
  .filter(item => {
    // 只显示需要人工处理的反馈
    if (item.status === 'auto_resolved') return false;
    if (item.agent_status === 'high_confidence') return false;
    if (['released', 'ignored'].includes(item.status)) return false;
    return true;
  });
```

### 7.2 状态标签

```javascript
const FEEDBACK_STATE_LABELS = {
  pending: '待处理',
  triaged: '已分诊',
  accepted: '已接受',
  converted: '已转任务',
  in_progress: '开发中',
  completed: '已完成',
  released: '已交付',
  ignored: '已忽略',
  auto_resolved: '自动解决'
};

const AGENT_STATUS_LABELS = {
  pending: '待处理',
  processing: '处理中',
  high_confidence: '高置信',
  medium_confidence: '中置信',
  low_confidence: '低置信',
  escalated: '已升级'
};
```

---

## 8. 测试用例

### 8.1 高置信自动解决

```javascript
it('高置信反馈不应显示在内部工作台', async () => {
  const feedback = {
    id: 1,
    status: 'auto_resolved',
    agent_status: 'high_confidence',
    agent_confidence: 0.95
  };
  
  expect(shouldShowInInternalWorkspace(feedback)).toBe(false);
});
```

### 8.2 低置信需要人工处理

```javascript
it('低置信反馈应显示在内部工作台', async () => {
  const feedback = {
    id: 2,
    status: 'pending',
    agent_status: 'low_confidence',
    agent_confidence: 0.6
  };
  
  expect(shouldShowInInternalWorkspace(feedback)).toBe(true);
});
```

### 8.3 中置信草稿被驳回

```javascript
it('中置信草稿被驳回应显示在内部工作台', async () => {
  const feedback = {
    id: 3,
    status: 'escalated',
    agent_status: 'medium_confidence',
    agent_confidence: 0.8
  };
  
  expect(shouldShowInInternalWorkspace(feedback)).toBe(true);
});
```
