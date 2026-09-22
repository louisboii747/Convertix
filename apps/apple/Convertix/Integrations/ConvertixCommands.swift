import SwiftUI

struct ConvertixCommands: Commands {
    let appState: AppState

    var body: some Commands {
        CommandGroup(after: .newItem) {
            Button("Choose File…") {
                appState.pendingDeepLink = .convert(routeID: nil)
                appState.fileImportRequest += 1
            }
            .keyboardShortcut("o")

            Button("New Conversion") {
                appState.pendingDeepLink = .convert(routeID: nil)
            }
            .keyboardShortcut("n")
        }

        CommandMenu("Conversion") {
            Button("Compress PDF") {
                appState.pendingDeepLink = .tool(.compressPDF)
            }
            .keyboardShortcut("p", modifiers: [.command, .shift])

            Button("Optimise SVG") {
                appState.pendingDeepLink = .tool(.optimizeSVG)
            }

            Divider()

            Button("Converter") {
                appState.pendingDeepLink = .convert(routeID: nil)
            }
            .keyboardShortcut("1")

            Button("Queue") {
                appState.pendingDeepLink = .queue
            }
            .keyboardShortcut("2")

            Button("History") {
                appState.pendingDeepLink = .history
            }
            .keyboardShortcut("3")
        }
    }
}
