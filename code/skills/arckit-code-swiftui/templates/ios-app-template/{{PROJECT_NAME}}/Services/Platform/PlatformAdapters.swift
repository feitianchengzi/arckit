import Foundation

protocol KeychainStoring: Sendable {
    func data(for key: String) throws -> Data?
    func set(_ data: Data, for key: String) throws
    func remove(_ key: String) throws
}

protocol AppGroupPathProviding: Sendable {
    func containerURL() throws -> URL
}

enum PlatformPermissionState: Sendable, Equatable {
    case notDetermined
    case authorized
    case denied
    case restricted
    case unavailable
    case failed(String)
}
