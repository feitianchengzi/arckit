---
name: arckit-role-orchestration
description: 当用户明确要求角色分工、角色协作、多人/多 agent 流程编排、端到端角色链路、或显式点名 role orchestration 时使用。该 skill 必须被显式触发才生效，不因普通软件项目请求自动启用。
---

# Arckit Role Orchestration

本 skill 只负责把复杂工作拆成角色协作计划。它不是 ArcKit 默认入口，也不替代 `using-arckit` 的最小路由判断。

## 触发边界

仅在用户明确要求以下任一事项时使用：

- 设计角色分工或角色协作方式
- 编排 PM、Design、Architect、Engineer、Reviewer、SRE 等角色顺序
- 让多个 agent 或多阶段角色配合完成任务
- 显式提到 `arckit-role-orchestration`、role orchestration、角色协作 workflow

不要在普通需求定义、代码实现、debug、文档维护或单一 skill 可以完成的任务中自动启用。

## 核心原则

- 角色只是协作视角，不是 skill 边界。
- 一个角色可以使用多个原子能力；一个原子能力也可以被多个角色复用。
- 本 skill 输出编排计划，不直接维护产品、交互、视觉、技术、治理或交付结果。
- 下游结果必须由对应结果型 skill 维护，例如 `arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech`、`arckit-project-governance-workflow`。
- 若用户只需要执行当前任务，直接交给对应 skill，不强行生成角色链路。
- 即使用户要求端到端或完整研发链路，也要按当前项目阶段裁剪角色阶段；不要默认输出从市场研究到运行期观察的全生命周期计划。

## 工作流

1. 确认用户确实要求角色协作或多阶段编排。
2. 识别目标、约束、已有上游材料、必须产出的结果。
3. 把工作拆成角色阶段，每个阶段写清楚：
   - `role`
   - `goal`
   - `candidate_skills`
   - `inputs`
   - `outputs`
   - `handoff_to`
   - `stop_condition`
4. 标注哪些阶段是过程型分析，哪些阶段是结果型沉淀。
5. 输出计划后等待用户确认。只有用户要求继续执行时，才按计划进入具体 skill。

## 输出格式

```yaml
role_orchestration_plan:
  objective: ""
  explicit_trigger: true
  stages:
    - role: ""
      goal: ""
      candidate_skills: []
      inputs: []
      outputs: []
      handoff_to: []
      stop_condition: ""
  result_skills: []
  open_questions: []
```

## 脚本

`scripts/generate_plan.py` 是可选计划生成辅助，已按 Arckit 当前 skill 名称和 `arckit-code` 外部编码边界适配。使用前仍需先阅读脚本输入输出，不把脚本输出视为自动批准的迁移或执行计划。
