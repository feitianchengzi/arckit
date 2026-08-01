# Feature Shaping

## 从需求到代码形状

实现 SwiftUI 功能前，先把需求压成可编码结构：

- 用户入口：页面进入、外部链接、Widget、Push、分享回流或系统 picker。
- 用户动作：点击、输入、刷新、提交、取消、重试、切换权限或离开页面。
- 数据来源：本地、远端、缓存、系统能力、App Group、生成服务或用户输入。
- 页面状态：idle、loading、success、empty、error、submitting、cancelled、permission denied。
- 成功结果：展示、落库、刷新、跳转、分享、通知其他页面或更新 Widget。
- 失败结果：用户可理解文案、重试入口、降级内容、日志分类和恢复路径。

## 状态矩阵

新页面或复杂功能至少判断这些状态是否存在：

| 状态 | 判断 |
| --- | --- |
| loading | 首次加载和手动刷新是否区分 |
| empty | 空数据是正常状态还是错误 fallback |
| error | 网络、权限、业务错误、解析失败是否需要不同处理 |
| success | 数据是否可能部分完整、过期或来自缓存 |
| submitting | 是否需要禁止重复提交或允许取消 |
| stale | 参数变化或页面消失后旧任务是否可能写回 |

不要用多个松散 Bool 表达互斥状态；用 enum 或稳定状态模型表达页面核心状态。

## 导航与外部入口

Route 使用稳定 enum/struct，只携带 id 和必要上下文，不传大对象、DTO 或 View。deeplink、Universal Link、Widget、Push 和分享入口进入统一 parser，再转换为 Route。解析失败要有 fallback 和日志分类。

外部入口和 App 内入口进入同一业务目标时，必须得到等价的资源身份、display model、权限状态和主操作能力。不能只验证“能打开页面”；外部入口只有 id 时，目标页面需要等价补全路径或明确降级状态。

## 完成口径

功能完成不是 happy path 能跑，而是主路径、失败路径、取消/重复操作、空数据和权限态都有明确代码位置和验证方式。
