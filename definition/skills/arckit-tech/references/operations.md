# 九类操作详细步骤

各操作入口见 SKILL.md「操作入口」；此处为每类操作的详细执行步骤。

---

## 1. 新建技术领域

1. 创建目录 `arckit/tech/{tech-domain}/`（脚本：new-domain.sh）
2. 更新 INDEX.md 添加领域条目（含一句描述）；依赖关系在 _map/RELATIONS.md

---

## 2. 技术调研（基于分析结果）

1. 若现有 research.md >700行 需先拆分 → 执行「动态拆解」（见第 8 节）
2. 创建 arckit/tech/{domain}/research.md（模板：背景、候选方案、评估、结论）
3. 更新 INDEX.md（添加条目+初始行数 如 `(150行)`）
4. 在 arckit/_map/decision-log.md 记录调研背景

---

## 3. 方案设计（基于分析结果）

1. 若现有 solution.md >450行 需先拆分 → 执行「动态拆解」（见第 8 节）
2. 创建 arckit/tech/{domain}/solution.md（路径即标识；模板：元信息+方案概述+架构+实现+已知局限）
3. 更新 INDEX.md（添加条目+初始行数 如 `(280行)`）
4. 更新 arckit/_map/RELATIONS.md（功能→技术映射）
5. 更新 arckit/_map/feature-matrix.md（技术状态列）

---

## 4. 决策记录

1. 在 arckit/tech/{domain}/decision.md 添加决策（模板：背景、候选方案、决策内容、理由）
2. 在 arckit/_map/decision-log.md 添加跨维度决策条目
3. 更新相关 solution.md 的状态（✅ 已采用 / ❌ 已废弃）
4. 更新 INDEX.md 中的方案状态

---

## 5. 定义数据模型（统一在 _shared/models/，基于分析结果）

1. 若 _shared/models/ >15 个文件 → 提示「考虑按领域整理」
2. 创建 arckit/tech/_shared/models/{Entity}.yaml（路径即标识；JSON Schema 格式）
3. 更新 INDEX.md「数据模型」部分（添加条目+行数 如 `(65行)`）
4. 更新 arckit/_map/RELATIONS.md（功能→模型、API→模型映射）
5. 更新 arckit/_map/feature-matrix.md（模型状态列）
6. 如关联 spec 功能 → 更新对应 feature.md 元信息中的「关联模型」

---

## 6. 定义 API 契约（统一在 _shared/contracts/，基于分析结果）

1. 创建 arckit/tech/_shared/contracts/{endpoint}.yaml（路径即标识；类 OpenAPI 格式）
2. 更新 INDEX.md「API 契约」部分（添加条目+行数 如 `(95行)`）
3. 更新 arckit/_map/RELATIONS.md（功能→API、设计→API、API→模型映射）
4. 更新 arckit/_map/feature-matrix.md（API 状态列）
5. 如关联 spec 功能 → 更新对应 feature.md 元信息中的「关联API」

---

## 7. 通用模型管理（_shared/）

**何时创建通用模型**：被 2+ 个技术领域引用的模型；标准化的响应格式（Error、PageInfo 等）。

**步骤**：

1. 创建 arckit/tech/_shared/models/{Model}.yaml
2. 更新 arckit/tech/INDEX.md 共享定义部分
3. 在引用方的 YAML 中使用 $ref 引用

---

## 8. 动态拆解（按分析结果执行）

**拆分方式**（按分析结果选择）：

- **按模块拆方案（solution.md >500行）**：拆为多个独立 solution（如 auth-solution.md、session-solution.md）；分配新 TECH-ID
- **按候选方案拆调研（research.md >800行）**：每个候选方案独立 research.md
- **按决策主题拆记录（decision.md >500行）**：创建子领域 decision.md
- **按子领域分组（单领域 >6 个方案）**：创建子领域目录；移动相关方案
- **平级化（层级 >3）**：将深层子领域提升为平级领域

**执行**：

1. 按分析结果指定的拆分方式执行
2. 更新 INDEX.md（调整树形+更新行数）
3. 更新 _map/feature-matrix.md、RELATIONS.md（原路径废弃，迁移到新路径）

---

## 9. 归档方案

1. 移动到 _archive/YYYY-MM-DD-{name}.md
2. 更新 INDEX.md（标记 ❌，移除行数）
3. 更新 _map/feature-matrix.md、RELATIONS.md、decision-log.md
