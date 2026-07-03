---
name: arckit-explore-product-design
description: 在写入正式交互或视觉结果前探索产品设计方向、页面方案、状态表达、交互风险、AI 默认设计问题或候选方案对比。默认由 using-arckit 在判断本轮需要设计探索 handoff 时路由触发；用户明确点名本 skill、维护本 skill 本身或隔离测试时可直接使用。输出设计探索 handoff，不直接维护 arckit/interaction 或 arckit/visual。
---

# Arckit Explore Product Design

本 skill 是产品设计探索过程。它帮助形成更清晰的交互或视觉输入，但不替代结果型设计文档维护。

## 边界

- 适合：页面候选、用户路径、状态设计、异常恢复、信息优先级、交互风险、AI 默认设计纠偏。
- 适合：把模糊体验要求整理成可交给 `arckit-interaction` 或 `arckit-visual` 的 handoff。
- 不适合：维护 `arckit/interaction/` 的页面级线框和交互事实。
- 不适合：维护 `arckit/visual/` 的视觉策略、tokens 和组件视觉规格。

## 工作流

1. 明确用户目标、核心任务、页面或流程范围。
2. 梳理主路径、关键状态、异常恢复、输入输出边界。
3. 识别常见 AI 默认问题：过度卡片化、营销化 hero、缺少真实状态、弱信息密度、缺少错误恢复等。
4. 给出 1-3 个候选方向，说明取舍和风险。
5. 输出可交给结果 skill 的 `design_exploration_handoff`。

## 输出格式

```yaml
design_exploration_handoff:
  scope: ""
  user_goal: ""
  core_path: []
  key_states: []
  interaction_risks: []
  visual_risks: []
  candidates:
    - name: ""
      rationale: ""
      tradeoffs: []
  recommended_direction: ""
  downstream_candidates:
    - arckit-interaction
    - arckit-visual
  open_questions: []
```

同时按通用 `process_handoff` 语义映射：已确认的 `core_path`、`key_states` 和推荐方向进入 `accepted_facts`；候选方案的未选项进入 `rejected_items` 或 `assumptions`；`interaction_risks`、`visual_risks` 进入 `risks`；`open_questions` 进入 `gaps`。需要跨回合继续时，将摘要交给 `arckit-pending`。

## 参考和脚本

- `references/anti-ai-defaults.md`：AI 默认设计问题检查。
- `references/reasoning-rules.md`：设计推理规则。
- `scripts/check_ai_defaults.py`、`scripts/validate_signature.py` 是可选辅助脚本，使用前先确认输入格式。
