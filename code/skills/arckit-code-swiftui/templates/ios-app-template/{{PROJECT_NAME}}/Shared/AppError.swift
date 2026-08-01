import Foundation

struct AppError: Error, Sendable, Equatable {
    var message: String

    init(_ message: String) {
        self.message = message
    }

    init(_ error: Error) {
        if let appError = error as? AppError {
            self = appError
        } else if error is CancellationError {
            self.message = "Cancelled"
        } else {
            self.message = error.localizedDescription
        }
    }
}
