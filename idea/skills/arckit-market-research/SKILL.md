---
name: arckit-market-research
description: 当用户明确要求市场调研、竞品分析、趋势信号、渠道观察、行业机会扫描、或把外部市场证据整理成项目判断输入时使用。输出过程型 market_research_handoff，不直接维护长期产品创意或项目定义结果。
---

# Arckit Market Research

本 skill 用于收集和组织外部市场证据。它是过程 skill，产出可交接的判断材料，不直接写入长期事实源。

## 边界

- 适合：竞品格局、趋势信号、用户替代方案、市场变化、渠道证据、机会窗口。
- 不适合：长期登记商机或产品创意，使用 `arckit-idea`。
- 不适合：深度探索一个具体产品创意并维护 `idea.md` / `idea.html`，使用 `arckit-idea-explore`。
- 不适合：直接维护产品规格、交互、视觉或技术方案，交给定义类 skill。

## 时效性要求

市场、竞品、价格、产品功能、政策和渠道信息容易变化。若用户要求当前、最新、竞品、趋势或外部事实，必须查证当前来源，并在回答中给出来源链接。无法联网或来源不足时，明确说明证据缺口。

## 工作流

1. 明确研究问题：研究对象、用户/市场范围、决策用途、时间范围。
2. 收集证据：优先使用官方资料、产品页面、文档、公告、可信行业材料；必要时补充新闻和公开讨论。
3. 区分事实、推断和建议，不把推断写成事实。
4. 按以下维度组织：
   - 用户问题和现有替代方案
   - 竞品和相邻方案
   - 趋势信号和反信号
   - 进入机会和主要风险
   - 需要继续验证的假设
5. 输出 `market_research_handoff`，由下游 skill 决定是否进入 idea、decision、spec 或 governance。

## 输出格式

```yaml
market_research_handoff:
  question: ""
  sources:
    - title: ""
      url: ""
      used_for: ""
  findings:
    - fact: ""
      source: ""
  inferences:
    - inference: ""
      basis: []
      confidence: low|medium|high
  opportunity_signals: []
  risk_signals: []
  validation_next: []
  downstream_candidates:
    - arckit-idea
    - arckit-idea-explore
    - arckit-decision-framework
    - arckit-project-governance-workflow
```

同时按通用 `process_handoff` 语义映射：`sources` -> `source_refs/evidence`，`findings` -> `accepted_facts`，`inferences` -> `assumptions`，`risk_signals` -> `risks`，`validation_next` -> `gaps` 或后续验证动作。需要跨回合继续时，将摘要交给 `arckit-pending`。

## 参考和脚本

- `references/competitive-framework.md`：竞品分析框架。
- `references/trend-signals.md`：趋势信号观察口径。
- `scripts/check_channels.sh`：原始 `all` 迁移来的渠道检查辅助脚本。使用前先确认脚本仍适合当前项目和运行环境。
