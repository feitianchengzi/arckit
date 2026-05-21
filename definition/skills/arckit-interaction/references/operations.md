# 操作详细步骤

各操作入口见 SKILL.md「操作入口」；此处为每类操作的详细执行步骤。

---

## 1. 新建页面/流程设计（基于分析结果）

**脚本**：`bash scripts/new-page-design.sh <page-name> <view-name> <platform> [interaction-dir]`，platform: iOS | iPad | macOS。示例：`bash scripts/new-page-design.sh favorites-list FavoritesView iOS`。

脚本完成后根据用户 Prompt 自动操作：

1. 在 `interaction.md` 填写「交互策略」：核心任务、主路径、决策点、信息揭示、状态流、反馈与恢复、输入输出边界。策略只写当前有效约束，不写方案讨论过程。
2. 编辑 `default.html` 填充各状态的 UI 内容，确保线框是交互策略的投影
   - **DOM 层级（必守）**：每个状态的 `.wireframe-canvas` 内**有且仅有**一个 `.device-frame`；所有业务 UI（导航、内容区、弹窗占位等）必须放在 `.device-frame` **内部**，不得与 device-frame 平级；详见 [wireframe-style.md](wireframe-style.md)「线框图 HTML 结构层级」。
   - 参考 [data-kit-mappings.md](data-kit-mappings.md) 标注 data-kit 属性
   - 至少 4 个状态：加载中 / 成功 / 空状态 / 错误
   - 弹窗直接渲染在页面中（.modal-overlay + data-kit="Sheet|Alert|..."），弹窗占位也放在 device-frame 内
3. 若线框图使用新类名或新组件样式，在 `arckit/interaction/wireframe-style.css` 中补充对应样式：须**抽象为通用组件**（不与具体业务耦合）、**扩写前搜索**避免重复定义；详见 [wireframe-style.md](wireframe-style.md)「业务开发中的维护」与「扩写规则」。
4. 补充 `interaction.md` 的状态、导航、交互行为、弹窗、错误处理、加载策略，确保规范章节是交互策略的投影
5. 执行投影一致性自查：线框和规范是否共同体现同一主路径、状态流、反馈机制和异常恢复
6. 更新 `arckit/interaction/INDEX.md` 添加条目（含行数如 `(120行)`）
7. 更新 `arckit/_map/RELATIONS.md` 和 `feature-matrix.md`

**或手动创建**（不用脚本）：

1. 确定所属流程（若不存在 → 创建目录）
2. 创建 interaction.md，并先填写「交互策略」
3. 创建 default.html（模板：至少 4 状态 loading/content/empty/error），确保线框投影交互策略
4. 参考 references/data-kit-mappings.md 标注 data-kit 属性
5. 若使用新类名或新组件样式，在 interaction 根目录 wireframe-style.css 中补充对应样式（须为通用组件、无重复定义，见 wireframe-style.md 扩写规则）
6. 补齐交互规范章节并执行投影一致性自查
7. 更新 INDEX.md（添加条目+初始行数 如 `(120行)`）
8. 更新 _map/RELATIONS.md、feature-matrix.md

---

## 2. 更新线框/交互规范（基于分析结果）

1. 读取目标 `interaction.md` 的「交互策略」
2. 判断本次变更类型：
   - 投影变更：核心任务、主路径、状态流、反馈机制不变，只更新 `default.html` 或规范章节
   - 源变更：核心任务、主路径、状态流、反馈机制、异常恢复或输入输出边界变化，先更新「交互策略」
   - 源缺失：先补最小必要「交互策略」
3. 若分析结果显示需先拆分 → 执行「动态拆解」（见第 3 节）
4. 否则修改 HTML 和/或 `interaction.md` 的规范章节
5. 若本次修改涉及新样式、新类名或新组件，同步在 `arckit/interaction/wireframe-style.css` 中补充对应样式（须遵循通用组件、无重复定义，见 [wireframe-style.md](wireframe-style.md)「扩写规则」）。
6. 执行投影一致性自查：`default.html` 与 `interaction.md` 是否共同表达同一交互策略
7. 重新统计行数 → 更新 INDEX.md 行数标注
8. 若状态变更 → 同步 INDEX、_map/feature-matrix.md

---

## 3. 动态拆解（按分析结果执行）

**拆分方式**（按分析结果选择）：

- **按区域/状态（HTML >500行）**：分析 HTML 结构，拆为 3-5 个子视图；原 HTML 改为骨架（placeholder-box 占位+注释子视图文件名）；创建独立子视图 HTML（sidebar.html、editor-area.html...）
- **按交互场景（interaction.md >500行）**：拆为多个子流程 interaction.md
- **按子流程（单流程 >6 个页面）**：创建子流程目录，移动相关页面
- **平级化（层级 >3）**：将深层子流程提升为平级流程

**执行**：

1. 按分析结果指定的拆分方式执行
2. 更新 INDEX.md（调整树形+更新行数）
3. 更新 interaction.md 索引子视图

---

## 4. 归档

1. 移动整个目录到 `_archive/YYYY-MM-DD-{name}/`
2. 更新 INDEX.md（移除或标记 🔴）
3. 更新 _map/RELATIONS.md、feature-matrix.md
