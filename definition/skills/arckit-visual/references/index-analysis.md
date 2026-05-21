# INDEX 全局分析（详细步骤）

变更类操作执行前必须完成 INDEX 全局分析。完整步骤与输出示例见下文。

## 第一步：读取并解析 INDEX.md

1. 读取 `arckit/visual/INDEX.md` 完整内容
2. 解析树形结构：
   - 各层级的路径与类别
   - 每个条目的行数标注
   - 嵌套深度（从根到叶的最大层数）

## 第二步：综合分析

依据 SKILL.md 中「综合分析指标与拆分策略」表格判断是否触发拆分（任一满足即需拆分）。

## 第三步：输出分析结果

**若需拆分**，输出：

```yaml
分析结果:
  需要拆分: 是
  涉及范围: _library/design-tokens.yaml (350行)
  拆分方式: 按 Token 类别拆为 4 个独立文件
  预期结构:
    - _library/tokens/
      - color-tokens.yaml 色彩体系：品牌色、背景、文字、语义色。(120行)
      - typography-tokens.yaml 字体系统：尺寸、字重、行高。(60行)
      - spacing-tokens.yaml 间距与圆角：间距阶梯、圆角规格。(40行)
      - effect-tokens.yaml 阴影与动效：阴影层级、动效曲线。(50行)
  连带更新:
    - INDEX.md: 原 tokens 条目改为子文件列表
    - design-tokens.yaml: 保留为汇总入口，引用拆分后的 Token 文件
```

**若无需拆分**，输出：

```yaml
分析结果:
  需要拆分: 否
  本次操作: {用户意图}
  涉及文档: _library/design-tokens.yaml (当前 102行)
  预计行数: 约 130行（无风险）
```

## 第四步：执行方案

- 若需拆分：先执行拆分，再继续用户请求的变更；全部完成后输出 `document_scope`（scope_kind: change）。
- 若无需拆分：直接执行用户操作；完成后输出 `document_scope`。
