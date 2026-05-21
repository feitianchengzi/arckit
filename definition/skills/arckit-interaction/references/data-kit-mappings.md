# data-kit 标注参考

在线框图 HTML 关键节点上添加 `data-kit="ControlName"` 属性，标注该区域在目标平台应使用的原生控件。

## 标注原则

1. **只标注有歧义的节点** — `<button>` 显然是按钮不需标注；`<div>` 做容器时需标注是 `List` 还是 `ScrollView`
2. **使用目标平台控件名** — 以 SwiftUI 为主，AppKit/UIKit 可用 `data-kit-appkit` 补充
3. **可带参数** — `data-kit="List(sidebar)"` 表示侧边栏列表
4. **不标注也能工作** — 标注只是提升 AI 生成精度，缺失不影响线框图审查

## SwiftUI 控件映射

### 导航容器

| data-kit | 场景 | SwiftUI |
|----------|------|---------|
| `NavigationStack` | 单列导航（push/pop） | `NavigationStack` |
| `NavigationSplitView` | 侧边栏+内容+详情（2或3列） | `NavigationSplitView` |
| `TabView` | 底部/顶部标签切换 | `TabView` |
| `TabView(page)` | 分页横滑 | `TabView` + `.tabViewStyle(.page)` |

### 布局容器

| data-kit | 场景 | SwiftUI |
|----------|------|---------|
| `List` | 滚动行列表（标准样式） | `List` |
| `List(sidebar)` | 侧边栏列表 | `List` + `.listStyle(.sidebar)` |
| `List(inset)` | 内嵌分组列表 | `List` + `.listStyle(.insetGrouped)` |
| `Form` | 设置/表单页面 | `Form` |
| `ScrollView` | 自由滚动（非标准行布局） | `ScrollView` |
| `ScrollView(horizontal)` | 横向滚动 | `ScrollView(.horizontal)` |
| `LazyVGrid` | 垂直网格 | `LazyVGrid` |
| `LazyHGrid` | 水平网格 | `LazyHGrid` |
| `Table` | 多列数据表格（macOS） | `Table` |

### 分栏布局（macOS）

| data-kit | 场景 | SwiftUI |
|----------|------|---------|
| `HSplitView` | 水平可拖拽分栏 | `HSplitView` |
| `VSplitView` | 垂直可拖拽分栏 | `VSplitView` |

### 弹出层

| data-kit | 场景 | SwiftUI |
|----------|------|---------|
| `Sheet` | 半屏/全屏弹出面板 | `.sheet` |
| `FullScreenCover` | 全屏覆盖 | `.fullScreenCover` |
| `Alert` | 系统警告弹窗 | `.alert` |
| `ConfirmationDialog` | 确认操作菜单 | `.confirmationDialog` |
| `Popover` | 气泡弹出（iPad/Mac） | `.popover` |
| `Inspector` | 检查器面板（macOS） | `.inspector` |

### 内容展示

| data-kit | 场景 | SwiftUI |
|----------|------|---------|
| `ContentUnavailableView` | 空状态/搜索无结果 | `ContentUnavailableView` |
| `ProgressView` | 加载指示器 | `ProgressView` |
| `ProgressView(linear)` | 进度条 | `ProgressView(value:total:)` |
| `AsyncImage` | 异步加载图片 | `AsyncImage` |
| `Label` | 图标+文字组合 | `Label` |
| `GroupBox` | 分组容器（带标题边框） | `GroupBox` |
| `DisclosureGroup` | 可展开/折叠区域 | `DisclosureGroup` |
| `Section` | 列表/表单分区 | `Section` |

### 表单控件

| data-kit | 场景 | SwiftUI |
|----------|------|---------|
| `TextField` | 单行文本输入 | `TextField` |
| `TextEditor` | 多行文本输入 | `TextEditor` |
| `SecureField` | 密码输入 | `SecureField` |
| `Toggle` | 开关 | `Toggle` |
| `Picker` | 选择器 | `Picker` |
| `Picker(segmented)` | 分段选择器 | `Picker` + `.pickerStyle(.segmented)` |
| `Picker(menu)` | 下拉菜单选择 | `Picker` + `.pickerStyle(.menu)` |
| `DatePicker` | 日期选择 | `DatePicker` |
| `Slider` | 滑块 | `Slider` |
| `Stepper` | 步进器 | `Stepper` |
| `ColorPicker` | 颜色选择 | `ColorPicker` |

### 按钮变体

| data-kit | 场景 | SwiftUI |
|----------|------|---------|
| `Button` | 默认按钮 | `Button` |
| `Button(role:destructive)` | 危险操作按钮 | `Button(role: .destructive)` |
| `Button(role:cancel)` | 取消按钮 | `Button(role: .cancel)` |
| `EditButton` | 编辑/完成切换 | `EditButton()` |
| `Menu` | 菜单按钮 | `Menu` |
| `Link` | 外部链接 | `Link` |

### 工具栏

| data-kit | 场景 | SwiftUI |
|----------|------|---------|
| `toolbar` | 导航栏工具栏区域 | `.toolbar { }` |
| `toolbar(bottomBar)` | 底部工具栏 | `.toolbar { ToolbarItem(placement: .bottomBar) }` |
| `toolbar(principal)` | 标题位置自定义 | `ToolbarItem(placement: .principal)` |
| `searchable` | 搜索栏 | `.searchable` |

## 组合标注示例

### 移动端列表页

```html
<div class="device-frame" data-kit="NavigationStack">
  <div class="nav-bar" data-kit="toolbar">...</div>
  <div class="search-bar" data-kit="searchable"></div>
  <div class="content-area" data-kit="List">
    <div class="section-header" data-kit="Section">分区标题</div>
    <div class="list-item">行内容</div>
  </div>
  <div class="tab-bar" data-kit="TabView">...</div>
</div>
```

### 移动端表单页

```html
<div class="device-frame" data-kit="NavigationStack">
  <div class="nav-bar" data-kit="toolbar">...</div>
  <div class="content-area" data-kit="Form">
    <div class="group-box" data-kit="Section">
      <div class="input-field" data-kit="TextField">用户名</div>
      <div class="input-field" data-kit="SecureField">密码</div>
    </div>
    <div class="group-box" data-kit="Section">
      <div class="toggle-row" data-kit="Toggle">记住密码</div>
      <div class="picker" data-kit="Picker">语言选择</div>
    </div>
  </div>
</div>
```

### 桌面端三栏布局

```html
<div class="device-frame desktop" data-kit="NavigationSplitView">
  <div class="toolbar" data-kit="toolbar">...</div>
  <div class="split-h">
    <div class="sidebar" data-kit="List(sidebar)">
      <div class="sidebar-section" data-kit="Section">分类</div>
      <div class="list-item">项目 A</div>
    </div>
    <div class="split-divider-h"></div>
    <div class="panel" data-kit="List">内容列表</div>
    <div class="split-divider-h"></div>
    <div class="panel" data-kit="DetailView">详情</div>
  </div>
</div>
```

### 桌面端可分栏布局

```html
<div class="device-frame desktop" data-kit="HSplitView">
  <div class="split-h">
    <div class="panel" data-kit="List(sidebar)" style="width:260px;">侧边栏</div>
    <div class="split-divider-h"></div>
    <div class="split-v" data-kit="VSplitView">
      <div class="panel">主编辑区</div>
      <div class="split-divider-v"></div>
      <div class="panel" style="height:200px;">底部面板</div>
    </div>
  </div>
</div>
```
