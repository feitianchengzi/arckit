# ArcOrbit Desktop 视觉规范约定

- `_library/brief.md` 是风格源，Tokens、组件、主题和预览是投影；具体流程以 interaction 为准。
- Desktop 使用完整 light / dark 主题；legacy-mixed 仅保留旧控制台兼容样张，不是用户外观选项。
- 橙色表达主操作、选择、焦点与执行中；成功、验收、人工注意和危险使用独立语义色。
- 组件状态遵循 `_library/state-contract.md`，颜色始终配合文字或符号。
- 系统字体承载中文与英文；正文 14px，对话 15px，操作/状态 13px，辅助 12px，11px 仅短计数。
- 标准控件至少 36px，数据行 40px，标准行 44px，图标按钮 32px；事情台搜索 31px 是有明确交互依据的局部例外。
- 普通表面使用分隔线和空间；阴影只用于浮层，卡片只用于独立可操作或有语义边界的对象。
- 所有交互控件有可见焦点；文字对比度至少 4.5:1，必要边界和焦点至少 3:1。
- 操作图标使用统一矢量体系；原生窗口控制不使用网页仿制。
- `_library/build-preview.py` 从 YAML 生成 CSS 与预览数据。`generated-tokens.css` 和 `preview-data.js` 不手工编辑。
- 预览只维护组件与主题样张；完整页面使用 interaction 原型。映射与消费者交接见 `_map/RELATIONS.md`。
- dark 依据用户暗黑模式要求适配既有视觉体系；主题不反转图片，不改变布局、品牌和状态语义。实际呈现仍需独立验证，不以 Agent 自评代替用户审美认可。
