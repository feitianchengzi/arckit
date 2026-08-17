# 标签系统设计文档

## 📋 概述

本文档定义了标签系统的完整设计规范，包括数据结构、API接口、操作流程和实现细节。标签系统基于独立的标签表（Tag表），通过标签ID关联到项目和任务。

## 🏗️ 数据结构

### 1. 标签表（Tag表）结构

**服务端Tag表字段**：
- `id`: 标签ID（数字类型，主键）
- `project_id`: 项目ID（关联到项目）
- `name`: 标签名称（字符串类型）
- `created_at`: 创建时间
- `updated_at`: 更新时间

**重要说明**：
- Tag表是全局的，每个标签都有唯一的ID
- 标签通过`project_id`关联到项目
- 同一项目内标签名称必须唯一

### 2. 标签名称格式规范

**前端约定格式**：
```
[name](#color)
```

**格式说明**：
- `name`: 标签显示名称（纯文本）
- `color`: 8位ARGB颜色值（十六进制）
- 示例：`[Bug](#ffff0000)`、`[Feature](#ff00ff00)`

**颜色格式要求**：
- **必须**：8位ARGB格式 `#ffff0000`
- **Alpha通道**：前两位，通常为`ff`（不透明）
- **RGB值**：后六位，标准十六进制颜色值

**存储与解析**：
- **存储**：服务端Tag表的`name`字段存储完整格式字符串，如`"[Bug](#ffff0000)"`
- **解析**：前端使用时需要解析出真实的`name`和`color`用于显示
- **创建**：前端创建新标签时，必须按照此格式组装`name`字段

### 3. 任务（Task）的tags字段

**字段类型**：字符串（string）

**存储格式**：
```
tagId1,tagId2,tagId3
```

**格式说明**：
- 存储的是**标签ID**的字符串，用逗号分隔
- 示例：`"1,2,3"` 表示任务关联了ID为1、2、3的标签
- 空值：`null` 或 `""` 表示任务没有关联任何标签

**重要约束**：
- 任务只能使用项目内已存在的标签
- 标签ID必须是有效的数字
- 更新任务tags字段时，采用**完全覆盖**策略

## 🔄 数据流与操作流程

### 1. 项目初始化流程

**场景**：用户进入项目详情页

```
1. 调用 GET /workshop/v1/user/projects/:id/tags
2. 获取项目所有标签列表
3. 解析每个标签的name字段，提取真实name和color
4. 维护项目标签数组（包含id、name、color等信息）
5. 后续所有操作基于此标签数组
```

**数据结构示例**：
```typescript
interface ProjectTag {
  id: number;              // 标签ID
  project_id: number;       // 项目ID
  name: string;            // 完整格式："[Bug](#ffff0000)"
  displayName: string;      // 解析后的名称："Bug"
  color: string;           // 解析后的颜色："#ffff0000"
  created_at: string;
  updated_at: string;
}
```

### 2. 待办详情页初始化

**场景A**：待办已有tags字段
```
输入：task.tags = "1,2,3"
处理：
  1. 解析task.tags获取标签ID数组：[1, 2, 3]
  2. 从项目标签数组中查找对应的标签信息
  3. 解析标签name字段，提取displayName和color
  4. 标记这些标签为"已选中"状态
  5. 显示下拉菜单：已选中标签 + 未选中标签
```

**场景B**：待办没有tags字段
```
输入：task.tags = null 或 ""
处理：
  1. 从项目标签数组获取所有标签
  2. 显示所有标签为未选中状态
  3. 下拉菜单显示所有可用标签
```

### 3. 标签选择操作（待办级别）

#### 选择标签（Check）
```
1. 用户在下拉菜单中选择标签
2. 更新本地状态：将标签ID添加到选中列表
3. 不立即调用API，等待用户点击"保存"按钮
4. 点击保存后：
   - 将选中标签ID数组转换为字符串："1,2,3"
   - 调用 PUT /workshop/v1/user/tasks/:id
   - 请求体：{ "tags": "1,2,3" }
   - 完全覆盖更新task.tags字段
```

#### 取消选择标签（Uncheck）
```
1. 用户取消选择标签
2. 更新本地状态：从选中列表移除标签ID
3. 不立即调用API，等待用户点击"保存"按钮
4. 点击保存后：
   - 将剩余选中标签ID数组转换为字符串
   - 调用 PUT /workshop/v1/user/tasks/:id
   - 请求体：{ "tags": "1,2" } 或 { "tags": "" }（如果全部取消）
```

**交互设计**：
- ✅ **延迟保存**：选择/取消选择操作不立即调用API
- ✅ **保存按钮**：提供"保存"按钮，用户确认后再更新
- ✅ **避免频繁请求**：减少不必要的API调用

### 4. 标签管理操作（项目级别）

#### 创建新标签
```
1. 用户输入：displayName + color（8位格式）
2. 组装name字段：name = "[" + displayName + "](#" + color + ")"
3. 调用 POST /workshop/v1/user/projects/:id/tags
4. 请求体：{
     "project_id": 1,
     "name": "[Bug](#ffff0000)"
   }
5. 成功后更新项目标签数组
6. 新标签立即可用于待办选择
```

#### 更新标签
```
1. 用户修改标签的displayName（颜色不可修改）
2. 组装新的name字段（保持原color）
3. 调用 PUT /workshop/v1/user/tags/:id
4. 请求体：{
     "name": "[新名称](#原颜色)"
   }
5. 成功后更新项目标签数组
6. 已使用该标签的待办会自动反映新名称
```

#### 删除标签
```
1. 用户确认删除标签
2. 调用 DELETE /workshop/v1/user/tags/:id
3. 成功后从项目标签数组移除
4. 注意：删除标签不影响已使用该标签的待办
   - 待办的tags字段保持不变（仍包含已删除的标签ID）
   - 显示时，如果标签ID不存在，可以显示为"已删除标签"或隐藏
```

## 📝 API接口规范

### 1. 查询项目所有标签

**接口**：`GET /workshop/v1/user/projects/:id/tags`

**认证**：需要 JWT Token

**权限**：用户必须是项目成员

**响应示例**：
```json
{
  "code": "OK",
  "data": [
    {
      "id": 3,
      "project_id": 1,
      "name": "[紧急](#ffff0000)",
      "created_at": "2024-01-01 15:00:00",
      "updated_at": "2024-01-01 15:00:00"
    },
    {
      "id": 2,
      "project_id": 1,
      "name": "[重要](#ff00ff00)",
      "created_at": "2024-01-01 14:00:00",
      "updated_at": "2024-01-01 14:00:00"
    }
  ]
}
```

### 2. 创建标签

**接口**：`POST /workshop/v1/user/projects/:id/tags`

**请求体**：
```json
{
  "project_id": 1,
  "name": "[Bug](#ffff0000)"
}
```

**响应示例**：
```json
{
  "code": "OK",
  "data": {
    "id": 1,
    "project_id": 1,
    "name": "[Bug](#ffff0000)",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:00:00"
  }
}
```

### 3. 更新标签

**接口**：`PUT /workshop/v1/user/tags/:id`

**请求体**：
```json
{
  "name": "[新名称](#ffff0000)"
}
```

**注意**：只能更新标签名称，颜色不可修改

### 4. 删除标签

**接口**：`DELETE /workshop/v1/user/tags/:id`

**响应示例**：
```json
{
  "code": "OK",
  "data": null
}
```

### 5. 更新任务tags字段

**接口**：`PUT /workshop/v1/user/tasks/:id`

**请求体**：
```json
{
  "tags": "1,2,3"
}
```

**说明**：
- `tags`字段存储标签ID字符串，逗号分隔
- 空字符串`""`表示清除所有标签
- 完全覆盖更新

## 🎨 颜色处理规范

### 1. 颜色格式要求

- **必须**：8位ARGB格式 `#ffff0000`
- **Alpha通道**：前两位，通常为`ff`（不透明）
- **RGB值**：后六位，标准十六进制颜色值

### 2. 颜色规范化函数

```typescript
function normalizeColorTo8Digit(color: string): string {
  // 移除#号
  let hex = color.replace('#', '');
  
  // 如果是8位，直接返回
  if (hex.length === 8) return `#${hex}`;
  
  // 如果是6位，添加ff前缀
  if (hex.length === 6) return `#ff${hex}`;
  
  // 其他情况处理或返回默认值
  // ...
}
```

### 3. 颜色使用规则

- **创建标签**：必须选择8位颜色，组装到name字段
- **更新标签**：颜色不可修改，只能修改名称
- **显示标签**：从标签name字段解析出color用于UI显示

## 🔍 关键实现要点

### 1. 解析标签name字段

```typescript
interface ParsedTag {
  displayName: string;  // 解析后的显示名称
  color: string;        // 解析后的颜色（8位格式）
}

function parseTagName(name: string): ParsedTag {
  // 正则：\[([^\]]+)\]\(#([a-fA-F0-9]{8})\)
  // 匹配：[name](#8位颜色)
  // 返回：{ displayName: string, color: string }
}
```

### 2. 组装标签name字段

```typescript
function buildTagName(displayName: string, color: string): string {
  // 确保color是8位格式
  const normalizedColor = normalizeColorTo8Digit(color);
  // 移除#号（因为name中不需要）
  const colorHex = normalizedColor.replace('#', '');
  // 组装格式：[name](#color)
  return `[${displayName}](#${colorHex})`;
}
```

### 3. 解析任务tags字段

```typescript
function parseTaskTags(tagsString: string | null | undefined): number[] {
  if (!tagsString || tagsString.trim() === '') {
    return [];
  }
  // 按逗号分割，转换为数字数组
  return tagsString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
}
```

### 4. 组装任务tags字段

```typescript
function buildTaskTags(tagIds: number[]): string {
  // 将标签ID数组转换为逗号分隔的字符串
  return tagIds.join(',');
}
```

### 5. 根据标签ID查找标签信息

```typescript
function findTagById(projectTags: ProjectTag[], tagId: number): ProjectTag | undefined {
  return projectTags.find(tag => tag.id === tagId);
}
```

## ⚠️ 重要约束与注意事项

### 1. 操作分离原则

**标签管理（项目级别）**：
- 创建、更新、删除标签 → 操作Tag表
- 使用标签相关API：`POST /projects/:id/tags`、`PUT /tags/:id`、`DELETE /tags/:id`
- 影响：更新项目标签数组，影响所有待办的选择范围

**标签选择（待办级别）**：
- 选择、取消选择标签 → 更新任务的tags字段
- 使用任务更新API：`PUT /tasks/:id`
- 影响：只影响当前待办的标签关联

**⚠️ 不要混淆**：
- 创建/更新/删除标签 ≠ 选择/取消选择标签
- 前者是项目级别的标签管理
- 后者是待办级别的标签关联

### 2. 数据一致性

- **项目标签数组**：进入项目后加载一次，后续操作基于此数组
- **待办标签状态**：从task.tags字段解析，与项目标签数组对比得出
- **标签删除后**：已使用该标签的待办tags字段不变，显示时需要处理"已删除标签"的情况

### 3. 交互设计

- ✅ **延迟保存**：选择/取消选择标签不立即调用API
- ✅ **保存按钮**：提供明确的"保存"按钮，用户确认后再更新
- ✅ **避免频繁请求**：减少不必要的API调用，提升用户体验
- ✅ **即时反馈**：UI层面立即更新选中状态，但数据更新延迟到保存时

### 4. 格式约束

- **标签名称格式**：必须遵循`[name](#color)`格式
- **颜色格式**：必须是8位ARGB格式
- **任务tags格式**：必须是标签ID的逗号分隔字符串

### 5. 代码统一处理原则

**核心原则**：代码能统一处理的地方必须统一处理，避免重复逻辑。

**统一处理的场景**：

1. **标签name字段解析**：
   - 创建统一的`parseTagName()`工具函数
   - 所有需要解析标签name的地方都调用此函数
   - 避免在多个组件中重复编写解析逻辑

2. **标签name字段组装**：
   - 创建统一的`buildTagName()`工具函数
   - 创建标签时统一调用此函数
   - 确保格式一致性

3. **任务tags字段解析**：
   - 创建统一的`parseTaskTags()`工具函数
   - 将字符串"1,2,3"转换为ID数组
   - 所有需要解析任务tags的地方都调用此函数

4. **任务tags字段组装**：
   - 创建统一的`buildTaskTags()`工具函数
   - 将ID数组转换为字符串"1,2,3"
   - 更新任务时统一调用此函数

5. **颜色规范化**：
   - 创建统一的`normalizeColorTo8Digit()`工具函数
   - 所有颜色输入都通过此函数规范化
   - 确保颜色格式一致性

6. **标签数据转换**：
   - 创建统一的`transformTagFromAPI()`函数
   - 将API返回的标签数据转换为前端使用的格式（包含解析后的displayName和color）
   - 统一处理标签数据的转换逻辑

7. **项目标签数组管理**：
   - 使用统一的状态管理（如Zustand store或Context）
   - 项目标签数组统一存储在一个地方
   - 所有组件通过统一接口访问和更新

**实现建议**：

```typescript
// 统一工具函数库：src/lib/utils/tagUtils.ts
export function parseTagName(name: string): ParsedTag { ... }
export function buildTagName(displayName: string, color: string): string { ... }
export function parseTaskTags(tagsString: string | null | undefined): number[] { ... }
export function buildTaskTags(tagIds: number[]): string { ... }
export function normalizeColorTo8Digit(color: string): string { ... }
export function transformTagFromAPI(tag: ApiTag): ProjectTag { ... }

// 统一状态管理：src/store/tagStore.ts
export const useTagStore = create((set) => ({
  projectTags: [],
  loadProjectTags: async (projectId) => { ... },
  addTag: async (tag) => { ... },
  updateTag: async (tagId, name) => { ... },
  deleteTag: async (tagId) => { ... },
}))
```

**禁止的做法**：
- ❌ 在多个组件中重复编写解析逻辑
- ❌ 在多个地方重复实现相同的格式化函数
- ❌ 每个组件独立管理项目标签数组
- ❌ 重复的颜色处理逻辑

**好处**：
- ✅ 代码复用，减少重复
- ✅ 易于维护，修改一处即可
- ✅ 保证一致性，避免格式错误
- ✅ 降低bug风险，统一测试

## 📊 数据流图

```
┌─────────────────┐
│  项目详情页      │
└────────┬────────┘
         │
         │ GET /projects/:id/tags
         ▼
┌─────────────────┐
│  项目标签数组    │
│  [Tag1, Tag2...]│
└────────┬────────┘
         │
         │ 解析name字段
         │ 提取displayName和color
         ▼
┌─────────────────┐
│  待办详情页      │
└────────┬────────┘
         │
         │ 读取task.tags
         │ 解析标签ID数组
         ▼
┌─────────────────┐
│  对比项目标签    │
│  标记选中状态    │
└────────┬────────┘
         │
         │ 用户选择/取消选择
         │ (本地状态更新)
         ▼
┌─────────────────┐
│  点击保存按钮    │
└────────┬────────┘
         │
         │ PUT /tasks/:id
         │ { "tags": "1,2,3" }
         ▼
┌─────────────────┐
│  更新任务tags    │
└─────────────────┘
```

## 🎯 组件职责划分

### TagManager（标签管理组件）
- **职责**：管理项目标签（创建、更新、删除）
- **数据源**：项目标签数组
- **操作**：调用标签相关API，更新项目标签数组
- **位置**：项目设置页面或标签管理页面

### TagSelector（标签选择器组件）
- **职责**：在待办中选择/取消选择标签
- **数据源**：项目标签数组 + 待办tags字段
- **操作**：更新本地选中状态，点击保存后调用任务更新API
- **位置**：待办详情页、待办列表项

### TagCreator（标签创建组件）
- **职责**：创建新标签（项目级别）
- **输入**：displayName + color（8位格式）
- **输出**：组装name字段，调用创建标签API
- **位置**：标签管理页面或待办详情页（快速创建）

### TagDisplay（标签显示组件）
- **职责**：显示标签（带颜色）
- **输入**：标签name字段或标签对象
- **处理**：解析name字段，提取displayName和color用于显示
- **位置**：待办列表、待办详情页、标签选择器

## ✅ 测试要点

1. **解析测试**：验证标签name字段解析正确（`[name](#color)`格式）
2. **组装测试**：验证创建标签时name字段组装正确
3. **任务tags解析**：验证任务tags字段（ID字符串）解析正确
4. **任务tags组装**：验证更新任务时tags字段组装正确
5. **颜色格式测试**：验证8位颜色格式处理正确
6. **边界测试**：
   - 空tags字段（null、""）
   - 单个标签ID
   - 多个标签ID
   - 已删除标签的处理
7. **交互测试**：
   - 选择/取消选择不立即调用API
   - 保存按钮正确触发API调用
   - 标签管理操作立即生效

## 🔄 完整操作示例

### 示例1：创建标签并在待办中使用

```
1. 进入项目详情页
   → GET /projects/1/tags
   → 获取项目标签数组：[]

2. 创建新标签
   → POST /projects/1/tags
   → { "project_id": 1, "name": "[Bug](#ffff0000)" }
   → 返回：{ "id": 1, "name": "[Bug](#ffff0000)", ... }
   → 更新项目标签数组：[{ id: 1, name: "[Bug](#ffff0000)", ... }]

3. 进入待办详情页
   → 读取task.tags = null
   → 解析：标签ID数组 = []
   → 显示：所有标签未选中

4. 用户选择标签
   → 本地状态：选中标签ID = [1]
   → UI更新：显示"Bug"标签为选中状态
   → 不调用API

5. 用户点击保存
   → PUT /tasks/1
   → { "tags": "1" }
   → 更新成功
```

### 示例2：更新标签名称

```
1. 项目标签数组中有：{ id: 1, name: "[Bug](#ffff0000)" }

2. 用户修改标签名称
   → 输入新名称："Critical Bug"
   → 组装：name = "[Critical Bug](#ffff0000)"（保持原颜色）

3. 调用更新API
   → PUT /tags/1
   → { "name": "[Critical Bug](#ffff0000)" }
   → 返回：{ "id": 1, "name": "[Critical Bug](#ffff0000)", ... }

4. 更新项目标签数组
   → 已使用该标签的待办会自动显示新名称
```

### 示例3：删除标签

```
1. 项目标签数组中有：{ id: 1, name: "[Bug](#ffff0000)" }
2. 待办A的tags = "1,2"
3. 待办B的tags = "2"

4. 删除标签ID=1
   → DELETE /tags/1
   → 成功

5. 更新项目标签数组
   → 移除ID=1的标签

6. 待办A的tags仍为"1,2"
   → 显示时，ID=1的标签不存在
   → 可以显示为"已删除标签"或隐藏
   → ID=2的标签正常显示
```

---

**文档版本**：v2.0  
**最后更新**：2024-01-XX  
**基于API版本**：workshop/v1
