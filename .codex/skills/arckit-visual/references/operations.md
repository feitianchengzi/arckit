# 操作详细步骤

各操作入口见 SKILL.md「操作入口」；此处为每类操作的详细执行步骤。

---

## 1. 初始化 Design System（项目首次）

**脚本**：`bash scripts/init-design-system.sh "<项目名>" [visual-dir]`，默认 visual-dir = arckit/visual。

脚本完成后根据用户 Prompt 自动完成：

1. 编辑 `_library/brief.md` 填写品牌方向与「视觉策略」（品牌气质、信息层级、色彩角色、字体节奏、空间密度、组件性格、状态表达、主题策略）
2. 根据视觉策略调整 `_library/design-tokens.yaml` 色值、字体、间距、圆角、阴影和动效配置
3. 根据视觉策略调整 `_library/component-catalog.yaml`，确保组件角色、变体、尺寸、状态和 token 引用共同投影同一风格源
4. 运行预览服务器审查视觉效果：
   ```bash
   cd arckit/visual/_library
   python3 preview-server.py
   ```
   服务器自动选择可用端口并打开浏览器（style-preview.html 自动解析 YAML）
5. 执行投影一致性自查：brief、tokens、component catalog、preview 是否共同表达同一视觉策略
6. 更新 `arckit/visual/INDEX.md` 标记已完成的条目

---

## 2. 新建/更新 Design Tokens

**Token 变更**：

1. 读取 `_library/brief.md` 的「视觉策略」
2. 判断本次变更类型：
   - 投影变更：只调整 token 值或补充 token，品牌气质、信息层级、色彩角色、字体节奏、空间密度不变
   - 源变更：改变品牌气质、信息层级、色彩角色、字体节奏、空间密度、状态表达或主题策略，先更新 `_library/brief.md`
   - 源缺失：先补足以支撑本次 tokens 投影的「视觉策略」
3. 修改 `arckit/visual/_library/design-tokens.yaml`
   - 按层级组织：colors（品牌色/背景色/文字色/语义色/边框）、typography、spacing、corner_radius、shadows、animation
   - 颜色须同时提供 light 和 dark 值
4. 浏览器刷新 style-preview.html 确认视觉效果（自动从 YAML 读取，无需手动同步）
5. 执行投影一致性自查：tokens 是否体现视觉策略中的色彩角色、字体节奏、空间密度和状态表达
6. 在 design-tokens.yaml 的 metadata.last_updated 更新日期
7. 更新 INDEX.md 行数标注

---

## 3. 新建/更新组件视觉规格

1. 读取 `_library/brief.md` 的「视觉策略」
2. 判断本次变更类型：
   - 投影变更：只调整组件角色、变体、尺寸、状态或 token 引用
   - 源变更：改变组件性格、层级表达、状态表达或空间密度，先更新 `_library/brief.md`
   - 源缺失：先补足以支撑本次组件投影的「视觉策略」
3. 在 `arckit/visual/_library/component-catalog.yaml` 添加或更新组件视觉规格
   - 每个组件须包含：role（视觉角色）、variants（视觉变体）、sizes（尺寸变体）、states（状态集合）、token_refs（Token 引用）
   - 可选：accessibility（无障碍要求）、notes（使用注意事项）
4. 若组件变体涉及新 Token，同步检查 design-tokens.yaml 是否已定义
5. 执行投影一致性自查：组件规格是否用 tokens 表达风格源，且没有引入与 brief 冲突的视觉规则
6. 更新 metadata.last_updated
7. 更新 INDEX.md 行数标注

---

## 4. 新建/更新主题

1. 读取 `_library/brief.md` 的「视觉策略」中的主题策略
2. 在 `arckit/visual/themes/` 下创建或编辑主题 YAML（如 light.yaml、dark.yaml）
   - 主题文件覆盖 base tokens 的值，结构与 design-tokens.yaml 对应
3. 确认主题只改变 token 值和必要对比关系，不改变视觉策略中的层级、密度和组件性格
4. 确认无障碍对比度满足 WCAG AA 标准（文字与背景对比度 ≥ 4.5:1）
5. 更新 INDEX.md 添加/更新主题条目

---

## 5. 更新品牌方向与视觉策略

1. 修改 `arckit/visual/_library/brief.md` 的品牌方向与「视觉策略」
2. 判定影响范围：色彩角色、字体节奏、空间密度、组件性格、状态表达、主题策略分别影响哪些投影产物
3. 同步更新受影响的 `design-tokens.yaml`、`component-catalog.yaml`、`themes/` 或 `style-preview.html`
4. 若 Token 或组件规格变更，运行 preview-server.py 审查视觉效果
5. 执行投影一致性自查：所有规范产物是否共同投影更新后的视觉策略

---

## 6. 动态拆解（按分析结果执行）

**拆分方式**（按分析结果选择）：

- **按 Token 类别（design-tokens.yaml >300行）**：拆到 tokens/ 目录（color-tokens.yaml / typography-tokens.yaml / spacing-tokens.yaml 等）
- **按组件类别（component-catalog.yaml >200行或组件数 >15）**：拆为独立文件（form-components.yaml / layout-components.yaml / feedback-components.yaml 等）
- **按层级（INDEX.md >150行）**：按类别分二级 INDEX
- **平级化（层级 >3）**：将深层子类别提升

**执行**：

1. 按分析结果指定的拆分方式执行
2. 更新 INDEX.md（调整树形+更新行数）

---

## 7. 归档

1. 移动整个目录到 `_archive/YYYY-MM-DD-{name}/`
2. 更新 INDEX.md（移除或标记 🔴）
3. 更新 _map/RELATIONS.md、feature-matrix.md
