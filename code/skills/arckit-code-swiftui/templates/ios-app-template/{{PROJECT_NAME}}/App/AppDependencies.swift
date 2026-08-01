import Foundation

@MainActor
struct AppDependencies {
    var homeService: any HomeService

    static let live = AppDependencies(
        homeService: DefaultHomeService()
    )
}
