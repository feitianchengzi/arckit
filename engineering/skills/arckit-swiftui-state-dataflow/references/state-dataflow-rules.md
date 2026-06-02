# 状态、数据流与分层规则

## 类型职责

| 类型 | 应承担 | 不应承担 |
| --- | --- | --- |
| `struct` | 值对象、DTO、展示数据、配置 | 共享可变状态 |
| `@Model` class | SwiftData 持久化实体 | UI 状态、Service 调用 |
| `@Observable` class | 关联业务状态、复杂 UI 状态容器 | 直接访问 `@Environment`、持有 View |
| `Service` | 网络、存储、系统能力、算法通道 | 产品决策、导航、弹窗 |
| `View` | 协调状态、调用 service、组合 UI | 重型计算、底层系统实现 |

## 状态归属决策

1. 是否需要持久化？是则优先 SwiftData / 文件 / UserDefaults / Keychain。
2. 是否只影响当前 View？是则 `@State`。
3. 是否是父子编辑态？是则 `@Binding`。
4. 是否多个字段强关联？是则 `@Observable` 状态对象。
5. 是否来自外部能力？是则 `Service` + `@Environment`。
6. 是否只是展示转换？是则 display model，不要污染领域模型。

## Service 规则

Service 必须：

- 有协议或清晰接口。
- 可被测试替换。
- 使用稳定输入输出类型。
- 使用 Swift Concurrency。
- 把平台桥接封装在实现内部。

Service 禁止：

- 直接返回 SwiftUI `View`。
- 为了上传图片暴露 `UIImage`，应暴露 `Data` / `URL` / `mimeType`。
- 使用 `@Environment`。
- 执行导航或弹窗。
- 决定 UI 是否显示某个具体控件。

## View 协调规则

View 可以：

- 决定何时调用 service。
- 根据多个状态组合 UI。
- 处理用户意图。
- 把结果写入本地状态或 SwiftData。

View 不应：

- 解析复杂 JSON。
- 写底层网络或 Keychain 细节。
- 在 body 中触发副作用。
- 在子 View 中重复持有父级业务状态。

## 状态模型规则

`@Observable` 状态模型适合：

- 搜索条件。
- 表单草稿。
- 生成任务状态。
- 多字段编辑器。
- 播放/录制状态。

状态模型不应变成万能 ViewModel。它可以包含基于自身状态的计算属性，但不应直接调用 service 或持有导航器。

## 检查清单

- 每个状态是否有唯一事实来源？
- UI 状态和业务状态是否分开？
- Service 是否没有 UI 类型泄漏？
- 子 View 是否只接收必要数据？
- 状态对象是否没有直接依赖 service？
- Model 是否可独立测试？
- 异步副作用是否由用户事件或生命周期触发？
