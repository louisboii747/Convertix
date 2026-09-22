import SwiftUI

@main
struct ConvertixApp: App {
    @State private var appState = AppState()
#if os(macOS)
    @AppStorage("showMenuBarItem") private var showMenuBarItem = true
#endif

    var body: some Scene {
        WindowGroup("Convertix", id: "main") {
            ContentView()
                .environment(appState)
                .task {
                    await ConversionNotificationManager.shared.registerCategories()
                    await appState.start()
                }
                .onOpenURL { url in
                    Task {
                        await appState.handleOpenURL(url)
                    }
                }
        }
        .commands {
            ConvertixCommands(appState: appState)
        }

#if os(macOS)
        MenuBarExtra(
            "Convertix",
            systemImage: "arrow.trianglehead.2.clockwise.rotate.90",
            isInserted: $showMenuBarItem
        ) {
            ConvertixMenuBarView()
                .environment(appState)
        }
        .menuBarExtraStyle(.window)

        Settings {
            NavigationStack {
                SettingsView()
            }
            .environment(appState)
            .frame(minWidth: 560, minHeight: 480)
        }
#endif
    }
}

