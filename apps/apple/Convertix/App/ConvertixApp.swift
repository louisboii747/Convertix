import SwiftUI

@main
struct ConvertixApp: App {
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
                .task {
                    await appState.start()
                }
                .onOpenURL { url in
                    Task {
                        await appState.handleOpenURL(url)
                    }
                }
        }
    }
}

