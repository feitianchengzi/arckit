enum LoadableState<Value> {
    case idle
    case loading
    case loaded(Value)
    case empty
    case failed(AppError)
}

enum MutationState: Equatable {
    case idle
    case submitting
    case succeeded
    case failed(AppError)
}
