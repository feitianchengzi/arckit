# 交互、手势与动画 Playbook

## 建模顺序

复杂交互先建模，再写代码：

1. 用户意图。
2. 可同时发生的手势。
3. 手势优先级。
4. 临时状态。
5. 提交状态。
6. 动画收尾。
7. 取消和边界。

## 状态分层

临时状态：

- drag offset。
- pinch scale。
- pan translation。
- gesture direction。
- animation in progress。

提交状态：

- current index。
- selected item。
- saved order。
- expanded/collapsed final state。

临时状态应尽量局部，提交状态才进入共享状态。

## 手势冲突处理

常见冲突：

- 横向翻页 vs 纵向滚动。
- 图片缩放 pan vs 页面翻页。
- 点击隐藏 UI vs 双击缩放。
- sheet 下拉关闭 vs 不可中断任务。
- 拖拽排序 vs 点击选择。

每个冲突都要定义优先级和禁用条件。

## 动画性能

- 手势进行中禁用不必要隐式动画。
- 收尾动画明确包裹。
- 不在动画帧中触发网络或重解析。
- 动画完成后再切业务 index。
- 避免全局状态每帧变化。

## 翻页交互

需要定义：

- 起始阈值。
- 横纵判断。
- 方向锁。
- 完成阈值。
- predicted translation 使用规则。
- 边界回弹。
- 完成动画时长。
- index 提交时机。

## 缩放交互

需要定义：

- 锚点。
- 缩放上下限。
- pan 范围。
- 缩放态退出条件。
- 与翻页互斥。
- 与双击、点击、关闭手势关系。

## 检查清单

- 是否明确手势优先级？
- 是否区分临时状态和提交状态？
- 拖拽过程是否局部更新？
- 收尾动画是否明确？
- 缩放态是否禁止翻页？
- 边界条件是否有回弹或取消？
- 手势失败是否不会提交业务状态？

## 推荐代码骨架

### 临时状态与提交状态

临时状态放在局部 `@State` 或 `@GestureState`，提交状态才进入父级或业务层。

```swift
struct PagerInteractionState: Equatable {
    var dragOffset: CGFloat = 0
    var lockedAxis: Axis?
    var isAnimating = false
}

struct PagerCommittedState: Equatable {
    var currentIndex: Int = 0
}
```

### 翻页 Reducer

把阈值、边界、预测位移收敛到纯函数，避免 scattered if。

```swift
struct PageDecision: Equatable {
    enum Action {
        case stay
        case next
        case previous
    }

    var action: Action
    var targetIndex: Int
}

struct PagerReducer {
    var pageCount: Int
    var threshold: CGFloat

    func decide(currentIndex: Int, translation: CGFloat, predicted: CGFloat) -> PageDecision {
        let intent = abs(predicted) > abs(translation) ? predicted : translation

        if intent < -threshold, currentIndex < pageCount - 1 {
            return PageDecision(action: .next, targetIndex: currentIndex + 1)
        }

        if intent > threshold, currentIndex > 0 {
            return PageDecision(action: .previous, targetIndex: currentIndex - 1)
        }

        return PageDecision(action: .stay, targetIndex: currentIndex)
    }
}
```

### SwiftUI DragGesture

拖拽过程禁用隐式动画，结束时统一提交。

```swift
struct PagerView<Page: View>: View {
    @State private var interaction = PagerInteractionState()
    @State private var committed = PagerCommittedState()

    let pageCount: Int
    let page: (Int) -> Page

    var body: some View {
        page(committed.currentIndex)
            .offset(x: interaction.dragOffset)
            .transaction { transaction in
                if interaction.dragOffset != 0 {
                    transaction.animation = nil
                }
            }
            .gesture(dragGesture)
    }

    private var dragGesture: some Gesture {
        DragGesture()
            .onChanged { value in
                interaction.dragOffset = value.translation.width
            }
            .onEnded { value in
                let reducer = PagerReducer(pageCount: pageCount, threshold: 80)
                let decision = reducer.decide(
                    currentIndex: committed.currentIndex,
                    translation: value.translation.width,
                    predicted: value.predictedEndTranslation.width
                )

                withAnimation(.snappy) {
                    committed.currentIndex = decision.targetIndex
                    interaction.dragOffset = 0
                }
            }
    }
}
```

### 缩放锚点

缩放以触点或双指中心为锚点，SwiftUI 无法稳定拿到需要的数据时，允许把 UIKit 手势封装在 integration 边界内。

```swift
struct ZoomState: Equatable {
    var scale: CGFloat = 1
    var offset: CGSize = .zero
    var anchor: UnitPoint = .center

    var isZoomed: Bool {
        scale > 1.01
    }
}

func normalizedAnchor(location: CGPoint, in size: CGSize) -> UnitPoint {
    guard size.width > 0, size.height > 0 else { return .center }
    return UnitPoint(
        x: min(max(location.x / size.width, 0), 1),
        y: min(max(location.y / size.height, 0), 1)
    )
}
```

### 手势互斥

互斥条件要显式出现，不靠 SwiftUI 默认仲裁。

```swift
let canPage = !zoomState.isZoomed && !interaction.isAnimating
```

## 验证要求

- 快速连续滑动不会跳错 index。
- 边界页拖拽只回弹，不提交越界状态。
- 缩放态横向拖动不会触发翻页。
- 手势取消后不会留下半提交状态。
- 动画过程中不触发网络、解析或大范围状态刷新。
