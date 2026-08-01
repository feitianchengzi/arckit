import Foundation

struct AppRouteParser: RouteParsing {
    private let baseURL = URL(string: "https://example.com")!

    func parse(_ url: URL) -> AppRoute? {
        let components = url.pathComponents.filter { $0 != "/" }
        guard let first = components.first else {
            return .home
        }

        switch first {
        case "items" where components.count >= 2:
            return .item(id: components[1])
        default:
            return nil
        }
    }

    func url(for route: AppRoute) -> URL? {
        switch route {
        case .home:
            return baseURL
        case .item(let id):
            return baseURL.appending(path: "items").appending(path: id)
        }
    }
}
