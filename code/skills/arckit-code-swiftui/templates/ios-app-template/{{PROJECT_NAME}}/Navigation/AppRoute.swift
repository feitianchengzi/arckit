import Foundation

enum AppRoute: Hashable, Sendable {
    case home
    case item(id: String)
}

protocol RouteParsing: Sendable {
    func parse(_ url: URL) -> AppRoute?
    func url(for route: AppRoute) -> URL?
}
