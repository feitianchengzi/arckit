# 标签系统设计文档

## 📋 概述

本文档定义了标签系统的完整设计规范，包括数据结构、操作流程和实现细节。

## 🏗️ 数据结构

### 1. tags字段格式

**格式定义**：
```
[标签名](#8位颜色)
```

**多个标签**：用逗号（`,`）分隔
```
[标签1](#ffff0000),[标签2](#ff00ff00),[标签3](#ff0000ff)
```

**颜色格式**：
- 8位ARGB格式：`#ffff0000`
- 前两位：Alpha通道（通常为`ff`表示不透明）
- 后六位：RGB颜色值

### 2. 数据存储位置

#### 项目级别（Project）
- **字段**：`project.tags`（字符串）
- **内容**：项目所有可用的标签列表
- **格式**：`[name](#color),[name](#color),...`
- **管理**：创建、删除、编辑标签都修改此字段

#### 待办级别（Task）
- **字段**：`task.tags`（字符串）
- **内容**：该待办使用的标签列表
- **格式**：`[name](#color),[name](#color),...`
- **管理**：只能从项目tags中选择使用，不能创建新标签

### 3. 服务端行为

- **存储**：服务端只存储字符串，不解析格式
- **更新**：每次更新都是**完全覆盖**整个tags字符串
- **关联**：tags字段通过项目ID关联到项目

## 🔄 操作流程

### 1. 待办详情页初始化

#### 场景A：待办已有tags字段
```
输入：task.tags = "[Bug](#ffff0000),[Feature](#ff00ff00)"
处理：
  1. 解析task.tags获取已选标签列表
  2. 从project.tags获取项目所有标签列表
  3. 对比显示：已选中 vs 未选中
```

#### 场景B：待办没有tags字段
```
输入：task.tags = null 或 ""
处理：
  1. 从project.tags获取项目所有标签列表
  2. 显示所有标签为未选中状态
```

### 2. 下拉菜单显示逻辑

**显示内容**：
- 显示项目tags中的所有标签（name + color）
- 已选中：待办tags中包含的标签
- 未选中：项目tags中有但待办tags中没有的标签

**显示规则**：
- 已选中标签：显示颜色（从待办tags中读取）
- 未选中标签：显示颜色（从项目tags中读取，用于预览）

### 3. Check/Uncheck操作

#### Check（添加标签到待办）
```
1. 从项目tags中解析目标标签（name + color）
2. 添加到待办tags末尾：task.tags + ",[" + name + "](#" + color + ")"
3. 确保颜色是8位格式
4. 覆盖更新task.tags字段
```

#### Uncheck（从待办移除标签）
```
1. 从待办tags中移除目标标签
2. 重新组装tags字符串（用逗号分隔）
3. 覆盖更新task.tags字段
```

**重要**：
- name和color必须与项目tags中的完全一致
- 不能修改标签的颜色或名称
- 只能使用项目已有的标签

### 4. 新建标签（项目级别）

```
1. 用户输入：name + color（8位格式）
2. 验证：name在项目tags中不存在
3. 添加到项目tags末尾：project.tags + ",[" + name + "](#" + color + ")"
4. 覆盖更新project.tags字段
```

### 5. 删除标签（项目级别）

```
1. 从项目tags中移除目标标签
2. 重新组装tags字符串（用逗号分隔）
3. 覆盖更新project.tags字段
```

**注意**：
- 删除项目标签不影响已使用该标签的待办
- 待办的tags字段保持不变

### 6. 编辑标签（项目级别）

```
1. 更新项目tags中对应标签的name
2. 自动更新所有使用该标签的待办tags字段
3. 覆盖更新project.tags和所有相关task.tags字段
```

**注意**：
- 只能编辑标签名称，不能编辑颜色
- 颜色一旦设定就不可更改

## 🎨 颜色处理规范

### 1. 颜色格式要求

- **必须**：8位ARGB格式 `#ffff0000`
- **Alpha通道**：通常为`ff`（不透明）
- **RGB值**：6位十六进制

### 2. 颜色规范化函数

```typescript
function normalizeColorTo8Digit(color: string): string {
  // 移除#号
  let hex = color.replace('#', '')
  
  // 如果是8位，直接返回
  if (hex.length === 8) return hex
  
  // 如果是6位，添加ff前缀
  if (hex.length === 6) return `ff${hex}`
  
  // 其他情况补全或返回默认值
  // ...
}
```

### 3. 颜色使用规则

- **新建标签**：必须选择8位颜色
- **添加已有标签**：使用项目tags中的颜色（不可更改）
- **显示标签**：从对应的tags字段中解析颜色

## 📝 API调用规范

### 1. 获取项目标签

```typescript
// 获取项目信息（包含tags字段）
GET /workshop/v1/user/projects/:id

// 响应示例
{
  "code": "OK",
  "data": {
    "id": 1,
    "name": "项目名称",
    "tags": "[Bug](#ffff0000),[Feature](#ff00ff00)"
  }
}
```

### 2. 更新项目tags

```typescript
// 更新项目tags字段
PUT /workshop/v1/user/projects/:id
{
  "tags": "[Bug](#ffff0000),[Feature](#ff00ff00),[New](#ff0000ff)"
}
```

### 3. 更新待办tags

```typescript
// 更新待办tags字段
PUT /workshop/v1/user/tasks/:id
{
  "tags": "[Bug](#ffff0000)"
}
```

## 🔍 关键实现要点

### 1. 解析tags字符串

```typescript
function parseTags(tagsString: string | null | undefined): ParsedTag[] {
  // 正则：\[([^\]]+)\]\(#([a-fA-F0-9]{8})\)
  // 匹配：[name](#8位颜色)
  // 返回：[{ name: string, color: string }]
}
```

### 2. 组装tags字符串

```typescript
function stringifyTags(tags: ParsedTag[]): string {
  // 确保颜色是8位格式
  // 格式：[name](#color),[name](#color)
  // 返回：字符串
}
```

### 3. 添加标签到tags

```typescript
function addTagToTags(tagsString: string, tag: ParsedTag): string {
  // 1. 解析现有tags
  // 2. 检查是否已存在（避免重复）
  // 3. 添加到末尾
  // 4. 重新组装字符串
}
```

### 4. 从tags移除标签

```typescript
function removeTagFromTags(tagsString: string, tagName: string): string {
  // 1. 解析现有tags
  // 2. 过滤掉目标标签
  // 3. 重新组装字符串
}
```

## ⚠️ 重要约束

1. **标签唯一性**：项目tags中，标签名称必须唯一
2. **颜色不可变**：标签颜色一旦创建就不可更改
3. **待办限制**：待办只能使用项目已有的标签，不能创建新标签
4. **完全覆盖**：每次更新tags都是完全覆盖，不是增量更新
5. **格式一致性**：所有tags字符串必须遵循统一格式

## 📊 数据流图

```
项目tags (project.tags)
    ↓
解析 → [标签列表]
    ↓
待办详情页
    ↓
显示下拉菜单（项目所有标签）
    ↓
用户选择/取消
    ↓
更新待办tags (task.tags)
    ↓
保存到服务端
```

## 🎯 组件职责划分

### TagSelector / TagSelectorDropdown
- **职责**：显示标签选择器，处理check/uncheck
- **数据源**：项目tags（所有标签）+ 待办tags（已选标签）
- **操作**：只更新待办tags字段

### TagManager
- **职责**：管理项目标签（创建、删除、编辑）
- **数据源**：项目tags字段
- **操作**：只更新项目tags字段

### TagCreator
- **职责**：创建新标签（项目级别）
- **输入**：name + color
- **输出**：添加到项目tags字段

## ✅ 测试要点

1. **解析测试**：验证各种格式的tags字符串解析正确
2. **组装测试**：验证标签列表正确组装为字符串
3. **添加测试**：验证添加标签后格式正确
4. **移除测试**：验证移除标签后格式正确
5. **颜色测试**：验证8位颜色格式处理正确
6. **边界测试**：空tags、单个标签、多个标签等场景

