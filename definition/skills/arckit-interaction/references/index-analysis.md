# INDEX 全局分析（详细步骤）

变更类操作执行前必须完成 INDEX 全局分析。完整步骤与输出示例见下文。

## 第一步：读取并解析 INDEX.md

1. 读取 `arckit/interaction/INDEX.md` 完整内容
2. 解析树形结构：
   - 各层级流程/页面的路径
   - 每个条目的行数标注
   - 嵌套深度（从根到叶的最大层数）

## 第二步：综合分析

依据 SKILL.md 中「综合分析指标与拆分策略」表格判断是否触发拆分（任一满足即需拆分）。

## 第三步：输出分析结果

**若需拆分**，输出：

```yaml
分析结果:
  需要拆分: 是
  涉及范围: auth-flow/register/default.html (520行)
  拆分方式: 按区域拆为 4 个子视图（表单区/社交登录区/协议区/弹窗集）
  预期结构:
    - auth-flow/register/default.html 骨架：主流程和子视图占位。(160行)
    - auth-flow/register/main-form.html 主表单区：输入框、实时校验、提交按钮。(220行)
    - auth-flow/register/social-login.html 社交登录区：第三方按钮、OAuth 回调。(80行)
    - auth-flow/register/terms-section.html 服务条款区：协议链接、勾选确认、隐私说明。(120行)
    - auth-flow/register/modals.html 弹窗集合：错误提示、成功反馈、加载状态。(100行)
  连带更新:
    - INDEX.md: 原条目改为子视图列表
    - interaction.md: 添加子视图索引
```

**若无需拆分**，输出：

```yaml
分析结果:
  需要拆分: 否
  本次操作: {用户意图}
  涉及文档: auth-flow/login/default.html (当前 285行)
  预计行数: 约 320行（无风险）
```

## 第四步：执行方案

- 若需拆分：先执行拆分，再继续用户请求的变更；全部完成后输出 `document_scope`（scope_kind: change）。
- 若无需拆分：直接执行用户操作；完成后输出 `document_scope`。
