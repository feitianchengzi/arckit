import Foundation

protocol HomeService: Sendable {
    func fetchHomeItems() async throws -> [HomeItem]
}

struct DefaultHomeService: HomeService {
    func fetchHomeItems() async throws -> [HomeItem] {
        [
            HomeItem(id: "welcome", title: "Welcome to {{PROJECT_NAME}}")
        ]
    }
}

struct PreviewHomeService: HomeService {
    func fetchHomeItems() async throws -> [HomeItem] {
        [
            HomeItem(id: "preview-1", title: "Preview item"),
            HomeItem(id: "preview-2", title: "Second preview item")
        ]
    }
}
