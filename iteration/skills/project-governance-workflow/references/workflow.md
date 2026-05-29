# 可复用项目治理工作流

版本：2026-05-26  
用途：用于任何项目从想法、规划、迭代到真实使用验证的轻量工作流。适合少量团队成员和 AI 协作推进多个项目。

---

## 目录

- [1. 核心原则](#1-核心原则)
- [2. 对象关系](#2-对象关系)
- [3. 工作流总览](#3-工作流总览)
- [4. Step 1：收集 Backlog](#4-step-1收集-backlog)
- [5. Step 2：收敛 Goal](#5-step-2收敛-goal)
- [6. Step 3：确定功能边界](#6-step-3确定功能边界)
- [7. Step 4：规划 Iteration](#7-step-4规划-iteration)
- [8. Step 5：拆 Task](#8-step-5拆-task)
- [9. Step 6：Review](#9-step-6review)
- [10. Step 7：Decision](#10-step-7decision)
- [11. Roadmap：排序层，不是更大 Goal](#11-roadmap排序层不是更大-goal)
- [12. 通用检查清单](#12-通用检查清单)
- [13. AI 协作提示词](#13-ai-协作提示词)
- [14. 新项目启动模板](#14-新项目启动模板)
- [15. 推荐落地方式](#15-推荐落地方式)

---

## 1. 核心原则

这个工作流的目标不是把项目管理做复杂，而是控制复杂度，让每个任务都能追溯到目标，每个目标都能追溯到真实需求或风险。

基本原则：

- Backlog 只收集材料，不直接进入执行。
- 用户提出的目标不是直接进入执行的命令，必须先和历史 Backlog、Review、Decision、Goal Progress、约束和 Roadmap 校准。
- Goal 表达要验证或达成的结果，不等于任务列表。
- Goal 不等于 Iteration。一个 Goal 可以跨多个 Iteration，一个 Iteration 也可以包含多个 Goal 的任务。
- Iteration 是时间窗口和执行路径，负责选择本轮推进哪些切片。
- Task 是 Goal 和 Iteration 的连接点，必须同时关联 Goal 和 Iteration。
- Roadmap 是排序层，不是更大粒度的 Goal。它回答现在、下一步、以后、不做什么，以及为什么这样排序。
- Review 用证据校准下一步，不只是写总结。
- Iteration Review 评估本轮执行证据；Goal Progress Review 评估目标跨多轮的累计进展。
- Decision 记录关键取舍，尤其是为什么先做、暂时不做、暂停或调整。
- AI 可以生成草案、拆任务、总结风险，但关键判断由人确认。

---

## 2. 对象关系

推荐最小模型：

```text
Project
  -> Project Plan
  -> Roadmap
    -> now / next / later / not_now
    -> Goal / Goal Candidate / deferred Backlog / Decision outcome
  -> Backlog
    -> Goal
  -> Iteration
    -> Task
      -> goal_id
      -> iteration_id
  -> Review
    -> Iteration Review
    -> Goal Progress Review
  -> Decision
```

关键关系：

```text
Backlog + Review + Decision + Roadmap -> Goal Intake
Goal -> Goal Scope
Iteration -> Task allocation across one or more Goals
Task -> goal_id + iteration_id
Iteration Review -> Goal Progress Review
Review 产生下一轮候选和 Decision
Decision 反过来影响 Roadmap 和 Project Plan
Roadmap 对 Goal、Goal Candidate、Deferred Backlog 和 Decision outcome 做排序，但不直接拆 Task
```

三层确定性：

```text
Backlog：可能要做
Goal：决定要长期追求或验证的结果
Iteration：这段时间选择的执行路径
Task：现在要执行的可验证动作
Roadmap：跨目标和候选项的排序承诺或排序草案
```

---

## 3. 工作流总览

```text
1. Capture：收集 Backlog
2. Shape：把 Backlog 收敛成一个或多个 Active Goal
3. Intake：用户设定或修改 Goal 时，先用历史证据校准
4. Scope：确定 Goal 边界
5. Plan：规划 Iteration 的执行切片和 Goal mix
6. Execute：执行 Task
7. Review：用证据复盘 Iteration，并更新 Goal Progress
8. Decide：沉淀 Decision
9. Adjust：更新 Roadmap / 推荐下一轮 Goal 或 Iteration
```

---

## 4. Step 1：收集 Backlog

Backlog 可以包含：

- Idea：想法
- Risk：风险
- Question：问题
- Feature：功能
- Bug：缺陷
- Research：调研
- Validation：验证项
- Task Seed：任务种子
- Decision Candidate：待决策事项

Backlog 模板：

```yaml
backlog_item:
  type:
  title:
  description:
  source:
  priority:
  status: Open
```

规则：

- 不要从 Backlog 直接开工。
- 相似 Backlog 应先合并。
- 大 Backlog 应先转成 Goal 或 Goal 候选，再从 Active Goal 选择本轮 Task。
- 暂时不做的 Backlog 要保留原因，而不是直接删除。

---

## 5. Step 2：收敛 Goal

Goal 是从规划到执行的目标锚点。它描述要验证或达成的整体结果，不应该因为每一轮 Iteration 开始就重新创建。

### Goal Intake：用户设定目标时的校准

用户说“下一个目标是 X”或“我们这轮要做 X”时，不要直接把 X 写成 accepted Goal。先做 Goal Intake：

```yaml
goal_intake:
  user_proposed_goal:
  historical_sources_checked:
    - backlog
    - recent_reviews
    - goal_progress
    - open_decisions
    - accepted_decisions
    - current_roadmap
    - constraints
  evidence_supporting:
  evidence_conflicting:
  relation_to_active_goals:
  recommendation: accept | revise | keep_as_candidate | reject_or_defer
  required_user_decision:
```

校准规则：

- 如果用户目标和现有 Active Goal 是同一方向，只更新 Goal 的范围、成功标准或 remaining_uncertainty，不新增重复 Goal。
- 如果用户目标只是一个执行切片、页面改动、重构项或任务包，把它降级为 Iteration theme、Task cluster 或 Backlog。
- 如果用户目标和历史 Review、Decision 或 Roadmap 冲突，先标记为 `goal_candidate`，说明冲突点和需要用户确认的决策。
- 如果用户目标有历史 Backlog 和 Review 证据支撑，可以接受为 Goal，但仍要写清 `why_now`、`success_criteria`、`non_goals` 和 `remaining_uncertainty`。
- 如果证据不足，但方向可能重要，保留为 proposed Goal，不要直接生成执行任务。

Goal 模板：

```yaml
goal:
  id:
  title:
  source_backlog:
  why_now:
  expected_outcome:
  success_criteria:
  non_goals:
  remaining_uncertainty:
  covered_iterations:
  linked_milestone:
  status:
```

好的 Goal 应该回答：

- 为什么现在做？
- 做成什么样算有价值？
- 哪些事情不属于这个目标？
- 哪些证据可以跨多个 Iteration 证明它接近成立？
- 还有哪些不确定性需要后续 Iteration 消化？
- 如何判断继续、调整、达成或暂停？

示例：

```text
让项目以最短时间进入真实试运行
```

比下面这种更好：

```text
补齐所有功能
```

Goal 粒度过小的信号：

- 标题像一次页面改版、一次实现切片、一次重构或一组任务。
- 成功标准只能在一个 Iteration 内完全关闭。
- 没有跨轮证据，也不需要 Goal Progress Review。

遇到这种情况，应把它降级为 Iteration theme、Task cluster 或 Decision，而不是新增 Goal。

### 推荐下一个 Goal

推荐下一个 Goal 不是“自动生成路线图”。它是基于当前工作流证据给出排序建议。

推荐时至少检查：

- 当前 Active Goal 的 `goal_progress`
- 最近 Iteration Review 的未解决问题和下一轮候选
- open Backlog 中重复出现或影响核心验证的事项
- accepted Decision 和 open Decision Candidate
- 当前 Roadmap 的 `now`、`next`、`later`、`not_now`
- 当前约束：时间、人力、数据风险、真实使用窗口

输出应使用：

```yaml
next_goal_recommendation:
  recommended_goal:
  source_evidence:
  why_now:
  alternatives:
  tradeoffs:
  remaining_uncertainty:
  required_user_decision:
```

规则：

- 推荐结果默认是 proposed，不是 accepted。
- 不要因为推荐了 Goal 就自动创建 Iteration；Iteration 是执行路径，需要再根据容量和 Review 节点规划。
- 如果现有 Active Goal 还没达到可 Review 状态，优先建议继续当前 Goal 或调整当前 Goal，而不是制造新目标。
- 如果 Roadmap 已有 accepted next item，推荐应解释是否沿用、调整或提出冲突。

---

## 6. Step 3：确定功能边界

在进入执行前，先写清楚本阶段边界。

边界模板：

```yaml
scope_boundary:
  goal_id:
  must_have:
  nice_to_have:
  non_goals:
  risk_controls:
  validation_data:
```

建议分成三类：

```text
必须做：没有它无法验证核心价值
暂缓做：重要，但不阻塞本轮验证
明确不做：本阶段做了会拖慢反馈
```

这一步非常重要。很多项目变慢，不是因为任务难，而是因为“什么都想顺手补一下”。

---

## 7. Step 4：规划 Iteration

Iteration 是短周期执行容器。建议 3 天、1 周或 2 周一轮。

Iteration 模板：

```yaml
iteration:
  id:
  name:
  theme:
  primary_goal_id:
  supporting_goal_ids:
  reason_for_mix:
  selected_scope:
  excluded_scope:
  review_date:
  success_criteria:
```

规则：

- 一个 Iteration 通常应该有一个 `primary_goal_id`，避免本轮失焦。
- 一个 Goal 可以跨多个 Iteration，不要为了每轮执行切片重复创建小 Goal。
- 一个 Iteration 可以包含多个 Goal 的任务，但必须写清 `supporting_goal_ids` 和 `reason_for_mix`。
- 每轮必须有 Review 日期。
- 本轮 Task 应该来自一个或多个 Active Goal，而不是从 Backlog 直接开工。

推荐节奏：

```text
Iteration 01：最短可验证版本
Iteration 02：真实使用/真实数据验证
Iteration 03：根据 Review 做必要补强
```

---

## 8. Step 5：选择并拆 Task

Task 是执行单位。

Task 模板：

```yaml
task:
  title:
  goal_id:
  iteration_id:
  context:
  owner:
  status:
  done_when:
  evidence:
```

任务状态建议保持极简：

```text
Ready
In Progress
Review
Done
Blocked
```

Task 必须有完成证据。没有证据的任务，很容易变成“感觉做完了”。

任务选择规则：

- 从 Active Goal 里选择本轮最值得做的 3-5 个 Task。
- 如果一个 Iteration 包含多个 Goal 的 Task，确保每个 Task 的 `goal_id` 清楚，且 Iteration 里说明为什么混合目标。
- 不要把一个 Goal 自动拆完；只选择本轮能产生证据的切片。
- 如果任务说不清 `goal_id`，它应该回到 Backlog 或先变成 Goal 候选。
- 如果任务说不清 `iteration_id`，它不是本轮执行项。

常见证据：

- 验证命令输出
- 可打开的原型或应用
- 数据录入结果
- 评审记录
- 截图
- 文档
- 决策记录

---

## 9. Step 6：Review

Review 是系统校准动作，不是会议纪要。

Review 模板：

```yaml
review:
  iteration_id:
  primary_goal_id:
  supporting_goal_ids:
  result:
  evidence:
  what_worked:
  what_failed:
  risks:
  next_iteration_candidates:
```

Review 必须回答：

- 这轮 Iteration 的执行证据是否达成？
- 这些证据推动了哪些 Goal？
- 证据是什么？
- 哪些判断变了？
- Roadmap 要不要调整？
- 下一轮最值得做的 1-3 件事是什么？
- 哪些能力仍然不该提前做？

Review 结果建议只用三类：

```text
继续：证据支持继续推进
调整：方向对，但范围、口径或体验需要修正
暂停：证据不足，或当前模型不成立
```

Goal Progress Review 模板：

```yaml
goal_progress:
  goal_id:
  covered_iterations:
  completed_tasks:
  evidence:
  remaining_uncertainty:
  status: continuing | adjusted | achieved | paused
```

使用规则：

- Iteration Review 关注本轮执行是否有效。
- Goal Progress Review 关注一个 Goal 跨多个 Iteration 的累计证据。
- 如果一个 Iteration 推动多个 Goal，应分别更新受影响 Goal 的 `goal_progress`。
- 不要因为一个 Iteration 完成，就自动把 Goal 标记为 achieved。

---

## 10. Step 7：Decision

Decision 保存“为什么”。

Decision 模板：

```yaml
decision:
  title:
  context:
  options:
  chosen:
  reason:
  impact:
  date:
```

什么时候必须写 Decision：

- 缩小或扩大功能边界
- 推迟重要能力
- 暂停某个方向
- 改变 Roadmap
- 使用临时方案
- 接受某个风险

示例：

```yaml
decision:
  title: 先进入单用户试运行
  context: 核心闭环已实现，但长期能力尚未补齐。
  options: 全部补齐后试用 / 先试运行 / 重构后再试用
  chosen: 先试运行
  reason: 真实反馈比继续扩功能更重要。
  impact: 高级能力进入 Later，当前只做验证、备份和操作清单。
  date: 2026-05-17
```

---

## 11. Roadmap：排序层，不是更大 Goal

Roadmap 不是比 Goal 更大的 Goal。Roadmap 是排序层，用来承载跨目标、目标候选、延期 Backlog 和 Decision outcome 的先后顺序。

区别：

| 对象 | 回答的问题 | 典型内容 | 不应该做什么 |
| --- | --- | --- | --- |
| Goal | 要验证或达成什么结果？ | expected_outcome、success_criteria、non_goals、remaining_uncertainty | 不应该只是一轮任务包 |
| Iteration | 这段时间如何执行？ | selected_scope、excluded_scope、review_date、Task | 不应该代表整个 Goal |
| Roadmap | 什么现在做、下一步做、以后做、不做？为什么这样排序？ | now、next、later、not_now、source、status | 不应该直接拆 Task，也不应该伪装成 accepted Goal |

Roadmap 模板：

```yaml
roadmap:
  now:
    - item:
      item_type: goal | goal_candidate | backlog | decision
      source:
      status: accepted | proposed | deferred | rejected_or_out_of_scope
      rationale:
  next:
    - item:
      item_type:
      source:
      status:
      rationale:
  later:
    - item:
      item_type:
      source:
      status:
      rationale:
  not_now:
    - item:
      item_type:
      source:
      status:
      rationale:
```

状态规则：

- `accepted`：用户已确认，或已有 accepted Decision 支撑。
- `proposed`：AI 或团队根据证据提出，但尚未被用户确认。
- `deferred`：暂缓，保留原因和可能触发条件。
- `rejected_or_out_of_scope`：明确不做，或本阶段不属于范围。

生成 Roadmap 的规则：

- 自动生成的 Roadmap 默认是 `proposed`，除非用户明确要求采用，或已有 Decision 说明该排序已被接受。
- Roadmap 可以包含 Goal Candidate，但必须标明 candidate 状态；不要把候选项写成 Active Goal。
- Roadmap 更新需要说明来源：Backlog、Review、Goal Progress、Decision、用户确认或外部约束。
- Roadmap 改变已接受方向时，应新增或更新 Decision。
- `now` 不应包含超过当前执行能力的事项；容量不足的内容进入 `next`、`later` 或 `not_now`。
- `not_now` 是治理资产，不是垃圾箱；它保存“为什么当前不做”。

---

## 12. 通用检查清单

进入真实验证前：

- [ ] Project Plan 已说明目的、用户、范围和不做事项。
- [ ] Roadmap 已区分 `now`、`next`、`later`、`not_now`，且每项都有 `source` 和 `status`。
- [ ] 自动生成或推荐的 Roadmap 项没有被误标为 accepted。
- [ ] Active Goal 有来源 Backlog、成功标准、non-goals 和 remaining_uncertainty。
- [ ] 用户新设定的 Goal 已经过 Backlog、Review、Goal Progress、Decision 和 Roadmap 校准。
- [ ] 当前 Iteration 有明确范围、Review 日期、`primary_goal_id`，必要时有 `supporting_goal_ids` 和 `reason_for_mix`。
- [ ] 每个 Task 都有关联 Goal 和 Iteration。
- [ ] 每个 Task 都有完成证据。
- [ ] 高风险临时方案已写入 Decision。
- [ ] 已明确哪些能力不阻塞本轮验证。

每轮结束时：

- [ ] 已完成 Iteration Review。
- [ ] 已更新相关 Goal 的 Goal Progress。
- [ ] 已沉淀关键 Decision。
- [ ] 已更新下一轮候选任务。
- [ ] 如果推荐下一个 Goal，已说明证据、替代方案、不确定性和 required_user_decision。
- [ ] 已关闭、延后或重开相关 Backlog。
- [ ] 已判断继续、调整或暂停。

---

## 13. AI 协作提示词

### 收集 Backlog

```text
请把下面这段输入整理成 Backlog 项，判断它是 Idea、Risk、Feature、Question 还是 Validation，并给出优先级和建议下一步。
```

### 生成 Goal

```text
基于这些 Backlog，帮我收敛成一个或多个 Active Goal。Goal 要偏整体结果，不要等同于单轮 Iteration。请写清 why_now、expected_outcome、success_criteria、non_goals 和 remaining_uncertainty。
```

### 校准用户提出的 Goal

```text
用户提出了一个新目标。请先做 Goal Intake：读取当前 Active Goal、Backlog、最近 Review、Goal Progress、Decision、Roadmap 和约束，判断该目标应 accept、revise、keep_as_candidate 还是 reject_or_defer。不要直接生成任务。
```

### 推荐下一个 Goal

```text
请基于现有 Backlog、Goal Progress、Review、Decision、Roadmap 和约束，推荐下一个 Goal。输出推荐理由、替代方案、取舍、不确定性和 required_user_decision。推荐结果默认是 proposed，不要自动改成 accepted。
```

### 规划 Iteration

```text
基于当前 Active Goal，帮我规划一个 3 天/1 周 Iteration。请明确 primary_goal_id、supporting_goal_ids、reason_for_mix、selected_scope、excluded_scope、review_date 和任务候选。
```

### 选择并拆 Task

```text
请从一个或多个 Active Goal 中选择本轮最值得做的 3-5 个 Task。每个 Task 必须包含 goal_id、iteration_id、context、done_when 和 evidence。
```

### 生成 Review

```text
基于这些任务状态和证据，帮我生成本轮 Iteration Review，并更新受影响 Goal 的 goal_progress。请判断继续、调整、达成还是暂停，并给出下一轮候选。
```

### 沉淀 Decision

```text
请把这次范围取舍整理成 Decision，包含 context、options、chosen、reason 和 impact。
```

### 更新 Roadmap

```text
请把当前证据更新为 Roadmap 草案。Roadmap 是排序层，不是更大的 Goal。每个项目必须包含 item_type、source、status 和 rationale，并区分 now、next、later、not_now。除非已有用户确认或 accepted Decision，否则状态保持 proposed。
```

---

## 14. 新项目启动模板

当一个新项目进入这套工作流时，可以直接复制下面的结构作为起点：

```yaml
project_governance_workflow:
  project:
    name:
    current_stage:
    target_user:
    core_value:

  project_plan:
    objective:
    current_focus:
    constraints:
    non_goals:

  roadmap:
    now:
      - item:
        item_type:
        source:
        status:
        rationale:
    next:
      - item:
        item_type:
        source:
        status:
        rationale:
    later:
      - item:
        item_type:
        source:
        status:
        rationale:
    not_now:
      - item:
        item_type:
        source:
        status:
        rationale:

  backlog:
    - type:
      title:
      source:
      reason:
      status:

  active_goals:
    - id:
      title:
      source_backlog:
      why_now:
      expected_outcome:
      success_criteria:
      non_goals:
      remaining_uncertainty:
      linked_milestone:
      status:

  goal_intake:
    user_proposed_goal:
    historical_sources_checked:
    evidence_supporting:
    evidence_conflicting:
    relation_to_active_goals:
    recommendation:
    required_user_decision:

  scope_boundary:
    goal_id:
    must_have:
    nice_to_have:
    non_goals:
    risk_controls:

  current_iteration:
    id:
    name:
    theme:
    primary_goal_id:
    supporting_goal_ids:
    reason_for_mix:
    start_date:
    review_date:
    selected_scope:
    excluded_scope:

  tasks:
    - title:
      goal_id:
      iteration_id:
      owner:
      status:
      done_when:
      evidence:

  review:
    iteration_id:
    result:
    evidence:
    next_iteration_candidates:

  goal_progress:
    - goal_id:
      covered_iterations:
      completed_tasks:
      evidence:
      remaining_uncertainty:
      status:

  decisions:
    - title:
      chosen:
      reason:
      impact:
      date:
```

使用规则：

- 每个项目先只填当前阶段，不要一次性补全所有未来阶段。
- `now / next / later / not_now` 比完整甘特图更适合早期验证；每项必须有 `source` 和 `status`。
- AI 生成的 Roadmap 或下一目标推荐默认是 `proposed`，不能直接当作用户已接受的承诺。
- 如果某个任务说不清 `goal_id` 和 `iteration_id`，它应该先回到 Backlog。
- 如果某个 Goal 需要跨多个 Iteration，保留同一个 Goal，只把 Task 分配到不同 Iteration。
- 如果某个 Iteration 包含多个 Goal 的任务，写清 `primary_goal_id`、`supporting_goal_ids` 和 `reason_for_mix`。
- 不要把一次执行切片包装成新 Goal；优先用 Iteration theme 或 Task cluster 表达。

---

## 15. 推荐落地方式

小项目可以先维护一个短入口和少量核心文档：

```text
docs/project-plan.md
docs/project/current.md
docs/project/backlog.md
docs/project/tasks.md
docs/project/decisions.md
docs/project/roadmap.md
```

`roadmap.md` 应作为排序源，保存 `now`、`next`、`later`、`not_now` 以及每个项目的 `source`、`status` 和 `rationale`。不要把 Roadmap 写成另一个 Goal 列表。

当项目进入长期增长，默认使用可分片目录，而不是让单个任务、评审或决策文件无限增长：

```text
docs/project-plan.md
docs/project/current.md
docs/project/workflow/backlog/
docs/project/workflow/goals/
docs/project/workflow/scopes/
docs/project/workflow/iterations/I-*/
docs/project/workflow/decisions/YYYY/
docs/project/workflow/roadmap/
docs/project/reference/
docs/project/indexes/
docs/project/archive/
```

关键规则：

- `project-plan.md` 和 `current.md` 保持短小，只回答从哪里开始、现在做什么。
- Iteration 的计划、任务、评审和证据按 `I-*` 分片。
- Decision 按年份和 `D-*` 分片，开放候选单独放在 `open.md`。
- Backlog 离开活跃状态后按状态和季度分片。
- 长期参考资料按 `reference/<area>/<topic>.md` 分层。
- `indexes/` 只做检索，不承载原始决策、任务证据或需求正文。
- `workflow/roadmap/current.md` 只保存当前排序和状态；历史排序进入 `workflow/roadmap/history/`。

不要一开始就为所有概念建复杂页面。先让工作流跑起来；一旦文档开始影响检索和维护，再迁移到可分片结构。
