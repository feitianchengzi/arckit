---
name: arckit-team-responsibility
description: 维护项目团队成员、职责范围、决策权、协作边界和 owner 推断规则的结果型 skill。当 Codex 需要读取、建立、补齐或更新谁负责什么、谁能决定什么、任务 owner 如何确认或推断、职责缺口如何处理时使用；不用于处理具体候选事项清单、拆任务或执行 bug/需求。
---

# Arckit Team Responsibility

本 skill 维护团队职责上下文。它是结果型 source of truth，不替代任务规划、反馈处理或具体执行。

默认产物独立保存到：

```text
arckit/planning/team-responsibility.md
```

## 边界

- 适合：记录团队成员、职责范围、决策权、协作边界、fallback owner、不可负责范围。
- 适合：在任务分配前判断 owner 是已确认、可推断还是被阻塞。
- 适合：补齐缺失职责上下文，并标记哪些内容需要用户确认。
- 不适合：决定某个候选事项是否进入当前迭代。交给 `arckit-iteration-planning`，或在需要沉淀目标、排序、任务和 roadmap 时交给 `arckit-project-governance-workflow`。
- 不适合：维护 Goal、Iteration、Task、Review、Decision 或 Roadmap。
- 不适合：执行 bug、需求、设计或技术任务。

## 工作流

1. 查找现有团队职责文档、项目说明、任务记录或用户当前输入。
2. 提取成员、角色、责任范围、决策范围、协作关系和已知限制。
3. 区分 `confirmed`、`proposed` 和 `missing`：没有来源支持的职责只能作为 proposed。
4. 为常见 owner 判断提供规则：按职责范围、决策权、当前可用性、风险归属和 fallback 关系判断。
5. 输出或更新最窄相关职责上下文；不要把具体候选事项清单写进职责文档。

## Owner 状态

- `confirmed`：用户明确说明、已有职责文档支持，或历史 accepted decision 支持。
- `proposed`：根据角色、技能、模块归属或历史任务推断，但还需要确认。
- `blocked`：职责缺失、多人冲突、决策权不明或当前无人可负责。

不要把 `proposed` owner 写成已确认分配。需要确认时输出 `required_user_decision`。

## 输出格式

```yaml
team_responsibility_context:
  source_refs: []
  members:
    - name: ""
      role: ""
      responsibility_scope: []
      decision_scope: []
      collaboration_scope: []
      fallback_owner: ""
      unavailable_for: []
      status: confirmed | proposed
  owner_rules:
    - condition: ""
      owner: ""
      owner_status: confirmed | proposed | blocked
      basis: []
  gaps:
    - item: ""
      impact: ""
      required_user_decision: ""
  updated_at: ""
```

供其他 skill 使用时，优先输出轻量引用和 owner 判断依据：

```yaml
owner_assignment:
  owner: ""
  owner_status: confirmed | proposed | blocked
  owner_basis: []
  supporting_owners: []
  required_user_decision: ""
```
