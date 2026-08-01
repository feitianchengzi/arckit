# State And View Boundaries

## 状态归属

- `@State`：简单局部 UI 状态，例如展开、选中、临时输入、拖拽 offset。
- `@Binding`：父子编辑，不把整个父级状态对象传入子 View。
- Observation / ViewModel / store：关联业务状态、跨组件状态、异步流程、可测试状态机。
- Environment：项目已有的依赖注入、主题、logger、service；不要用它隐藏任意业务状态。
- `@Query`：View 查询入口；复杂合并、修复、离线同步和冲突处理下沉到 store/service/actor。

## View 边界

页面级 View 协调查询、service、navigation 和 task。子 View 接收 display model、简单值、binding 和动作闭包。DTO 到领域模型、提交校验、重试策略、缓存策略不写在 View 中。

一个 SwiftUI 文件默认只放一个主 View 和紧邻的 preview/辅助小类型。App 入口、Root、Navigation、Service、Model 不混放。

## View Body 纪律

View body 不做排序、过滤、JSON decode、DateFormatter 创建、文件 IO、Keychain、同步图片处理、系统 bridge 或网络请求。需要计算时放到 model/service/actor，或在输入变化处提前计算。

## Preview 和视觉入口

Preview 覆盖 loading、empty、error、success、长文本、Dynamic Type、权限态和深浅色。Preview 数据不要调用真实网络或系统权限。

稳定颜色、字体、间距、圆角接入项目 DesignTokens。已有 DesignTokens、Theme、SwiftGen、R.swift、Asset Catalog 或品牌 SDK 时沿用；新项目建立最小语义化入口。

## 交互状态

手势过程态局部化；页码、选择、排序等业务状态在手势结束后提交。每帧更新禁用不必要隐式动画，收尾使用明确动画。系统级滚动、缩放、输入体验优先成熟平台控件 bridge。

复杂手势先建模再写代码：列出可同时发生的手势、优先级、互斥条件、临时状态、提交状态、取消和边界。缩放态通常要禁用翻页或降级翻页；拖拽、缩放、pan 等过程状态不要每帧写入共享业务状态。
