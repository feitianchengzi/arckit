import Foundation

struct HomeItem: Identifiable, Sendable, Equatable {
    var id: String
    var title: String
}

struct HomeItemDisplayModel: Identifiable, Sendable, Equatable {
    var id: String
    var title: String
    var accessibilityLabel: String

    init(item: HomeItem) {
        id = item.id
        title = item.title
        accessibilityLabel = item.title
    }
}
