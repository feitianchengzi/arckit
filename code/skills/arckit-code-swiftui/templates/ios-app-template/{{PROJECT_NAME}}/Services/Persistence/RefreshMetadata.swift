import Foundation

struct RefreshKey: Hashable, Sendable {
    var namespace: String
    var identity: String
    var scope: String
}

struct RefreshMetadata: Sendable {
    var key: RefreshKey
    var lastSuccessfulFetchAt: Date
}
