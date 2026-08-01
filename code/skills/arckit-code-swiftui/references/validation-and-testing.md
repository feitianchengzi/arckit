# Validation And Testing

## 质量门

| 改动类型 | 最低验证 |
| --- | --- |
| 小文案/样式 | 静态检查、Preview 或截图 |
| 局部逻辑 | 相关单元测试或定向运行 |
| SwiftUI 页面 | loading、empty、error、success、长文本和权限态 |
| 共享状态/service | 单元测试 + 调用方检查 |
| 网络/API | 成功、业务错误、网络错误、取消或超时 |
| 本地数据/缓存/迁移 | 旧数据样本、空数据、损坏数据路径 |
| UI 交互 | 正常、边界、快速重复操作 |
| 系统能力 | 授权、拒绝、系统失败、配置文件 |
| 分享/二维码 | 最终导出文件和目标 App 验证 |
| 性能 | 复现路径、指标、Instruments 或手测场景 |
| 发布配置 | 配置文件、权限文案、端到端清单 |

## 测试层级

- 纯逻辑、mapper、validator、router parser：单元测试。
- ViewModel/store/service 状态流：单元测试 + fake dependency。
- async/await、取消、重试、token refresh：异步测试。
- SwiftData/缓存/迁移：样本数据或临时 store 测试。
- 关键系统能力：可测试逻辑抽 protocol，系统弹窗和权限态给手测路径。
- 视觉和交互：Preview、截图或 UI 测试按风险选择。

Service、clock、UUID、date、network client、cache、keychain、analytics、logger 优先通过项目既有依赖注入替换。不要为了单个测试引入全局可变 singleton。

## Xcodebuild 验证入口

优先使用 `scripts/xcodebuild-verify.sh` 做本地验证。脚本会在发现 `Package.swift`、`Package.resolved` 或 Xcode 工程中的 Swift Package 引用时，先执行 package 解析，再执行 `build` 和 `build-for-testing`。

```sh
scripts/xcodebuild-verify.sh --project <App>.xcodeproj --scheme <Scheme>
scripts/xcodebuild-verify.sh --workspace <App>.xcworkspace --scheme <Scheme> -- CODE_SIGNING_ALLOWED=NO
```

如果只需要解析 package，或脚本不可用，使用：

```sh
xcodebuild -project <App>.xcodeproj -scheme <Scheme> -resolvePackageDependencies -scmProvider system
xcodebuild -workspace <App>.xcworkspace -scheme <Scheme> -resolvePackageDependencies -scmProvider system
```

依赖解析成功后再运行 `build`、`test` 或 `build-for-testing`。若网络、Git 或认证失败，报告具体 package、仓库 URL、认证方式和失败阶段；不要把 package 未安装误判为 Swift 编译错误。

## 禁止通过的状态

- 代码无法构建且未说明原因。
- View body 新增重型计算、副作用或同步 IO。
- 页面切换后异步任务仍写过期状态。
- 错误被吞掉，用户或日志无法区分关键失败类型。
- 新数据结构没有旧版本兼容策略。
- 线上日志包含 token、密钥、用户敏感内容或大对象。
- 代码用到系统能力但缺 Info.plist、entitlements 或 Privacy 检查。

## 性能验证

先建立复现路径，再比较修复前后指标或手测现象。关注 SwiftUI body 重算、Main Thread、Time Profiler、Allocations、图片解码和列表刷新范围。
