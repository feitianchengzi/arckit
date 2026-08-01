import SwiftUI

struct RootView: View {
    let dependencies: AppDependencies

    var body: some View {
        NavigationStack {
            HomeView(
                store: HomeStore(service: dependencies.homeService)
            )
        }
    }
}

#Preview {
    RootView(
        dependencies: AppDependencies(
            homeService: PreviewHomeService()
        )
    )
}
