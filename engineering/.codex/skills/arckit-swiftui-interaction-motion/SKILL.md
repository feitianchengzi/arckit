---
name: arckit-swiftui-interaction-motion
description: SwiftUI 交互、手势和动画 skill。用于 DragGesture、Magnification/MagnifyGesture、tap、long press、scroll 冲突、翻页、拖拽、缩放、平移、动画卡顿、transaction、局部交互状态、手势结束提交、复杂交互状态机。用户提到手势冲突、滑动翻页、缩放、动画不流畅、拖拽、滚动抢手势、点击隐藏、交互状态时使用。
---

# ArcKit SwiftUI Interaction Motion

## 目标

把复杂手势和动画实现成可预期、可取消、不卡顿的交互状态机。Agent 执行时不要只调参数，而要先定义手势优先级、互斥关系、临时状态和业务提交时机。

## 执行流程

1. 列出当前页面所有交互：tap、long press、drag、pinch、pan、scroll、翻页、关闭、选择等。
2. 明确每个手势的目标、触发区域、优先级、互斥条件和边界。
3. 区分临时交互状态和业务提交状态：拖拽 offset、缩放比例、方向锁等保持局部；页码、选择、排序等在结束后提交。
4. 拖拽/缩放过程中禁用不必要隐式动画，避免每帧刷新全局 observable 或触发网络/解析。
5. 手势结束时按阈值、预测位移、方向锁、边界回弹决定提交或复位。
6. 动画收尾使用明确 `withAnimation` 或 `Transaction`，不要让多个隐式动画互相叠加。
7. 涉及图片缩放时，以触点或双指中心为锚点，并在缩放态禁用页面翻页。
8. 对快速滑动、取消、边界、连续操作做手测；卡顿明显时配合 performance skill。

## 读取资源

- 拖拽、翻页、缩放、滚动冲突、动画收尾、状态机：`references/interaction-motion-playbook.md`
- 掉帧、body 重算、动画卡顿：`arckit-swiftui-performance-quality`
- 图片查看器、缩放、平移：`arckit-swiftui-media-pipeline`

## 核心规则

| 问题 | 执行要求 |
| --- | --- |
| 手势互抢 | 先定义优先级和互斥条件 |
| 拖拽卡顿 | 过程状态局部化，结束后提交 |
| 动画不可控 | 明确动画边界和 transaction |
| 缩放翻页冲突 | 缩放态禁用或降级翻页 |
| 边界误触 | 阈值、方向锁、回弹路径完整 |

## 最低交付标准

- 手势优先级和互斥关系能从代码结构中看出来。
- 临时状态不进入大范围共享状态。
- 手势取消、边界、完成、复位路径都可预期。
- 动画收尾和业务状态提交时机明确。
- 快速连续操作不会造成状态错乱。

## 降级/停止条件

- 普通 button tap、简单显示/隐藏动画不使用完整流程。
- 纯性能问题但无交互设计变化，切到 `arckit-swiftui-performance-quality`。
- SwiftUI 手势无法表达且必须桥接 UIKit 时，隔离在 `arckit-swiftui-system-integration` 的边界内。
