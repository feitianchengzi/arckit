# @提及显示空白问题分析和解决方案

## 问题描述

### 核心问题
在评论输入框中，当用户输入 `@` 并选择成员后：
- **textarea 中存储的格式**：`[name](username)`，例如 `[name](戴鹏飞3)`
- **需要显示的格式**：`@username`，例如 `@戴鹏飞3`
- **问题**：`[name](戴鹏飞3)` 的宽度明显大于 `@戴鹏飞3`，导致显示时出现大量空白

### 具体表现
1. 用户输入 `@` 并选择成员后，textarea 中保存的是 `[name](戴鹏飞3)`
2. 覆盖层尝试显示 `@戴鹏飞3`
3. 但由于 textarea 的宽度是基于 `[name](戴鹏飞3)` 计算的（约 15-20 个字符宽度）
4. 而覆盖层只显示 `@戴鹏飞3`（约 5-6 个字符宽度）
5. 导致 `@戴鹏飞3` 后面出现大量空白（约 10-15 个字符的空白）

### 技术难点
1. **宽度不匹配**：原始格式 `[name](username)` 和显示格式 `@username` 宽度差异很大
2. **换行位置不一致**：由于宽度不同，两者的换行位置也不同
3. **对齐问题**：覆盖层需要与 textarea 完全对齐，但内容宽度不同导致无法对齐

## 之前的尝试

### 尝试 1：使用透明占位符
```tsx
<span className="inline-block relative">
  <span style={{ color: 'transparent' }}>{originalText}</span> {/* [name](xxx) */}
  <span className="absolute left-0">@{username}</span> {/* @xxx */}
</span>
```
**问题**：绝对定位在 `whitespace-pre-wrap` 环境下无法正确工作，因为换行会导致定位错误。

### 尝试 2：使用隐藏测量层
```tsx
{/* 隐藏层：使用原始内容保持宽度 */}
<div style={{ opacity: 0 }}>{content}</div>
{/* 覆盖层：显示转换后的内容 */}
<div>{formatContentForDisplay(content)}</div>
```
**问题**：两个层的换行位置仍然不一致，因为内容不同。

### 尝试 3：直接显示转换后的文本
```tsx
<div>{formatContentForDisplay(content)}</div> {/* 直接显示 @xxx */}
```
**问题**：宽度完全不匹配，空白问题更严重。

## 正确的解决方案

### 方案 A：使用 CSS 精确控制（推荐）

**思路**：覆盖层也使用原始内容 `[name](username)`，但通过 CSS 来隐藏 `[name](` 和 `)`，只显示用户名，然后添加 `@` 前缀。

**实现步骤**：
1. 覆盖层使用原始内容 `[name](username)`
2. 使用 CSS `::before` 伪元素添加 `@` 前缀
3. 使用 CSS 隐藏 `[name](` 和 `)` 部分
4. 只显示用户名部分

**优点**：
- 宽度完全匹配（使用相同的原始内容）
- 换行位置一致
- 对齐完美

**缺点**：
- CSS 实现较复杂，需要精确计算字符位置

### 方案 B：使用 contentEditable div 替代 textarea

**思路**：不使用 textarea，改用 `contentEditable` div，可以直接渲染富文本。

**优点**：
- 可以直接渲染格式化内容，不需要覆盖层
- 宽度自然匹配

**缺点**：
- 需要重写大量代码
- 需要处理光标位置、选择等复杂逻辑
- 兼容性问题

### 方案 C：使用精确的字符位置映射

**思路**：在覆盖层中，对于每个 `[name](username)`，精确计算其在原始文本中的位置，然后使用绝对定位来显示 `@username`。

**实现**：
1. 解析原始内容，找到所有 `[name](username)` 的位置
2. 使用隐藏的测量元素计算每个 `[name](username)` 的精确位置和宽度
3. 在覆盖层中使用绝对定位，在对应位置显示 `@username`

**优点**：
- 可以精确控制位置
- 宽度可以匹配

**缺点**：
- 实现复杂
- 性能可能有问题（需要频繁计算位置）
- 换行时定位会变得复杂

## 推荐实现：方案 A（CSS 精确控制）

### 实现思路

1. **覆盖层使用原始内容**：
   ```tsx
   <div>{content}</div> {/* 使用 [name](username) */}
   ```

2. **使用正则替换和 CSS**：
   - 将 `[name](username)` 替换为特殊标记
   - 使用 CSS 来隐藏标记，显示 `@username`

3. **具体实现**：
   ```tsx
   {content.replace(/\[name\]\(([^)]+)\)/g, (match, username) => {
     return `<span class="mention-wrapper">${match}</span>`
   })}
   ```
   然后使用 CSS：
   ```css
   .mention-wrapper {
     position: relative;
   }
   .mention-wrapper::before {
     content: '@';
     color: #2563eb;
   }
   .mention-wrapper {
     /* 隐藏 [name]( 和 ) */
   }
   ```

### 更简单的实现：使用 React 组件精确渲染

```tsx
{(() => {
  const parts = []
  let lastIndex = 0
  const regex = /\[name\]\(([^)]+)\)/g
  let match
  
  while ((match = regex.exec(content)) !== null) {
    // 添加匹配前的文本
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index))
    }
    
    // 添加提及：显示为 @username，但保持 [name](username) 的宽度
    const username = match[1].trim()
    parts.push(
      <span key={match.index} className="mention-display">
        <span className="mention-placeholder">{match[0]}</span>
        <span className="mention-text">@{username}</span>
      </span>
    )
    
    lastIndex = match.index + match[0].length
  }
  
  return parts
})()}
```

CSS:
```css
.mention-display {
  position: relative;
  display: inline-block;
}
.mention-placeholder {
  color: transparent;
  visibility: hidden;
}
.mention-text {
  position: absolute;
  left: 0;
  color: #2563eb;
  font-weight: 500;
}
```

## 当前代码的问题

当前实现中：
1. 覆盖层显示转换后的文本 `@username`
2. textarea 使用原始文本 `[name](username)`
3. 两者宽度不匹配，导致空白

需要改为：
1. 覆盖层也使用原始文本 `[name](username)`
2. 通过 CSS 或 React 组件来隐藏 `[name](` 和 `)`，只显示 `@username`
3. 这样宽度就能完全匹配
