import Foundation

enum HTTPMethod: String, Sendable {
    case get = "GET"
    case post = "POST"
}

struct APIEndpoint<Response: Decodable & Sendable>: Sendable {
    var method: HTTPMethod
    var path: String
}

enum APIError: Error, Sendable, Equatable {
    case cancelled
    case timeout
    case offline
    case unauthorized
    case forbidden
    case rateLimited
    case server(statusCode: Int)
    case decoding
    case business(code: String)
}

protocol APIClient: Sendable {
    func send<Response: Decodable & Sendable>(
        _ endpoint: APIEndpoint<Response>
    ) async throws -> Response
}
