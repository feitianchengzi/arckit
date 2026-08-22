# 五类操作详细步骤

各操作入口见 SKILL.md「操作入口」；此处为每类操作的详细执行步骤。

---

## 1. 新建功能模块

1. 创建目录 `arckit/spec/{module-name}/`（脚本：new-module.sh）
2. 更新 INDEX.md 添加模块条目（含一句描述）；依赖关系在 _map/RELATIONS.md

---

## 2. 新建功能规格（基于分析结果）

1. 确定所属模块（若不存在 → 创建目录）
2. 创建 feature.md（路径即标识；模板：元信息+功能描述+用户场景+需求+成功标准）
3. 更新 INDEX.md（添加条目+标注初始行数 如 `(50行)`）
4. 更新 _map/feature-matrix.md、RELATIONS.md

---

## 3. 更新功能（基于分析结果）

1. 若分析结果显示需先拆分 → 执行「动态拆解」（见第 4 节）
2. 否则直接修改 feature.md
3. 重新统计行数 → 更新 INDEX.md 行数标注
4. 若状态变更 → 同步更新 INDEX、_map/feature-matrix.md

---

## 4. 动态拆解（按分析结果执行）

**拆分方式**（按分析结果选择）：

- **按子功能/场景**：分析 feature.md 内容，拆为 2-4 个独立功能；创建子模块目录（如 user-management/account/）；迁移内容到子功能文件（路径即标识）
- **按模块分组（单模块 >8 个 feature）**：按业务相关性分为 2-3 个子模块；创建子模块目录；移动相关 feature.md
- **平级化（层级 >4）**：将深层子模块提升为平级模块；重新组织 INDEX.md 树形

**执行**：

1. 按分析结果指定的拆分方式执行
2. 更新 INDEX.md（调整树形结构+更新行数）
3. 更新 _map/feature-matrix.md、RELATIONS.md（原路径废弃/迁移到新路径）
4. 删除或归档原过大文件

---

## 5. 归档功能

1. 移动到 _archive/YYYY-MM-DD-{feature-name}.md
2. 在文件顶部添加归档说明
3. 更新 INDEX.md（移除或标记 🔴，移除行数）
4. 更新 _map/feature-matrix.md（标记 🔴）、RELATIONS.md（移除）
