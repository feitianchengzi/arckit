# Testing

## Store Async Test

```swift
@MainActor
@Test func storeLoadsItems() async throws {
    let store = HomeStore(service: FakeHomeService(items: [HomeItem(id: "1", title: "One")]))
    await store.load()

    if case .loaded(let items) = store.state {
        #expect(items.count == 1)
    } else {
        #expect(Bool(false), "Expected loaded state")
    }
}
```

## Fake Service

Fake 实现 feature service protocol，不走真实网络、Keychain、文件系统或系统弹窗。

```swift
private struct FakeHomeService: HomeService {
    var items: [HomeItem] = []
    var error: AppError?

    func fetchHomeItems() async throws -> [HomeItem] {
        if let error {
            throw error
        }
        return items
    }
}
```

## 可控输入

时间、UUID、clock、network client、cache、keychain、analytics、logger 通过依赖注入替换。不要为了单个测试引入全局可变 singleton。

Store 测试直接构造 Store 并传入 fake service；View 预览使用 preview service 或固定 display model。Preview 不访问真实网络、Keychain、文件系统或系统权限。

## 构建前置

涉及 Swift Package 依赖的构建/测试，先按 `references/validation-and-testing.md` 使用 `scripts/xcodebuild-verify.sh` 解析 package，再执行 build/test。

## 覆盖目标

- Store：success、empty、error、cancel、stale result。
- Service：DTO mapper、错误分类、token refresh、cache refresh metadata。
- Navigation：URL parse/build round-trip，无效链接 fallback。
- Platform：权限拒绝、不可用、系统失败、App Group 路径。
- Persistence：旧数据、损坏数据、迁移样本。
