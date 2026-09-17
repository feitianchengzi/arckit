# 视觉设计系统索引

✅ 规范/预览已完成 | 🟡 消费者待同步 | ⚪ 未采纳方向

- CONVENTIONS.md 视觉事实边界、状态、密度与生成消费约定。✅ (14行)
- _library/ 视觉策略、组件与生成式样张。✅
  - brief.md 浅色事情台、内容层级、色彩、字体、密度和无标题栏原生窗口。✅ (65行)
  - reference-research.md Codex、Cursor、Claude 官方依据与适配边界。✅ (22行)
  - design-tokens.yaml 基础颜色、语义角色、字体、尺度与主题映射。✅ (126行)
  - component-catalog.yaml 21 个组件的四组聚合入口。✅ (11行)
  - state-contract.md 通用组件状态、七业务状态与验证约束。✅ (52行)
  - components/ 按职责拆分的组件视觉规格。✅
    - foundation.yaml 无标题栏应用壳、导航、图标、按钮与状态。✅ (79行)
    - workbench.yaml 事情行、输入、运行概况、成果和上下文。✅ (69行)
    - conversation.yaml 对话阅读面、登录与账号。✅ (49行)
    - execution.yaml 队列、运行事实、人工事项、恢复与记录。✅ (78行)
  - style-preview.html 可直接打开的组件与主题预览入口。✅ (26行)
  - preview.css 消费生成 CSS 变量的组件样张样式。✅ (8行)
  - preview.js 目录投影、主题切换与本地状态演示。✅ (15行)
  - build-preview.py Token 引用解析、对比度验证与确定性生成。✅ (89行)
  - generated-tokens.css 由 YAML 生成的 CSS，不手工编辑。✅ (127行)
  - preview-data.js 由组件目录和 Token 生成的预览数据。✅ (1340行)
  - preview-server.py 本地静态预览服务。✅ (17行)
- themes/ 事情台亮色与旧控制台混合兼容。✅
  - light.yaml 当前事情台主题。✅ (7行)
  - legacy-mixed.yaml 仅用于旧控制台的兼容主题。✅ (12行)
- _map/ 关系、覆盖和验证证据。✅
  - RELATIONS.md 生成映射与交互、Renderer 消费者交接。🟡 (45行)
  - feature-matrix.md 规范完成情况与待同步消费者。🟡 (25行)
  - validation.md 实际检查、未验证项与结构化变更结果。✅ (106行)
  - accent-change.yaml 橙色强调维护的两域变更范围与事实结果。✅ (369行)

候选探索入口：[_explorations/INDEX.md](_explorations/INDEX.md)。
