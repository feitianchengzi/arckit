import Testing
@testable import {{PROJECT_NAME}}

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

@MainActor
@Test func homeStoreLoadsItems() async throws {
    let store = HomeStore(
        service: FakeHomeService(
            items: [HomeItem(id: "1", title: "One")]
        )
    )

    await store.load()

    if case .loaded(let items) = store.state {
        #expect(items == [HomeItem(id: "1", title: "One")])
    } else {
        #expect(Bool(false), "Expected loaded state")
    }
}

@MainActor
@Test func homeStoreMapsEmptyState() async throws {
    let store = HomeStore(service: FakeHomeService(items: []))

    await store.load()

    if case .empty = store.state {
        #expect(Bool(true))
    } else {
        #expect(Bool(false), "Expected empty state")
    }
}
