import SwiftUI

struct HomeView: View {
    @State private var store: HomeStore

    init(store: HomeStore) {
        _store = State(initialValue: store)
    }

    var body: some View {
        content
            .navigationTitle("{{PROJECT_NAME}}")
            .task {
                await store.loadIfNeeded()
            }
    }

    @ViewBuilder
    private var content: some View {
        switch store.state {
        case .idle, .loading:
            ProgressView()
        case .empty:
            ContentUnavailableView("No Items", systemImage: "tray")
        case .failed(let error):
            VStack(spacing: DesignTokens.Spacing.md) {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundStyle(DesignTokens.Colors.error)
                Text(error.message)
                    .foregroundStyle(DesignTokens.Colors.textSecondary)
                Button("Retry") {
                    Task {
                        await store.load()
                    }
                }
            }
            .padding(DesignTokens.Spacing.lg)
        case .loaded(let items):
            List(items) { item in
                HomeItemRow(
                    item: HomeItemDisplayModel(item: item),
                    onSelect: {}
                )
            }
        }
    }
}

private struct HomeItemRow: View {
    let item: HomeItemDisplayModel
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack {
                Text(item.title)
                    .foregroundStyle(DesignTokens.Colors.textPrimary)
                Spacer()
            }
        }
        .accessibilityLabel(item.accessibilityLabel)
    }
}

#Preview {
    NavigationStack {
        HomeView(store: HomeStore(service: PreviewHomeService()))
    }
}
