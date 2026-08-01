import Observation

@MainActor
@Observable
final class HomeStore {
    private let service: any HomeService
    private(set) var state: LoadableState<[HomeItem]> = .idle

    init(service: any HomeService) {
        self.service = service
    }

    func loadIfNeeded() async {
        guard case .idle = state else {
            return
        }
        await load()
    }

    func load() async {
        state = .loading
        do {
            let items = try await service.fetchHomeItems()
            state = items.isEmpty ? .empty : .loaded(items)
        } catch is CancellationError {
        } catch {
            state = .failed(AppError(error))
        }
    }
}
