import SwiftUI

enum AppSection: String, CaseIterable, Identifiable {
    case convert
    case tools
    case activity
    case settings

    var id: Self { self }

    var title: String {
        switch self {
        case .convert: "Convert"
        case .tools: "Tools"
        case .activity: "Activity"
        case .settings: "Settings"
        }
    }

    var systemImage: String {
        switch self {
        case .convert: "arrow.trianglehead.2.clockwise.rotate.90"
        case .tools: "square.grid.2x2"
        case .activity: "clock.arrow.trianglehead.counterclockwise.rotate.90"
        case .settings: "gearshape"
        }
    }
}

struct ContentView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var selection: AppSection? = .convert

    var body: some View {
        if horizontalSizeClass == .compact {
            CompactRootView()
        } else {
            NavigationSplitView {
                SidebarView(selection: $selection)
            } detail: {
                NavigationStack {
                    DestinationView(section: selection ?? .convert)
                }
            }
            .navigationSplitViewStyle(.balanced)
            .tint(ConvertixTheme.cobalt)
        }
    }
}

struct CompactRootView: View {
    var body: some View {
        TabView {
            NavigationStack {
                ConvertHomeView()
            }
            .tabItem {
                Label("Convert", systemImage: "arrow.trianglehead.2.clockwise.rotate.90")
            }

            NavigationStack {
                ToolsView()
            }
            .tabItem {
                Label("Tools", systemImage: "square.grid.2x2")
            }

            NavigationStack {
                ActivityHistoryView()
            }
            .tabItem {
                Label("Activity", systemImage: "clock")
            }

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
        .tint(ConvertixTheme.cobalt)
    }
}

struct SidebarView: View {
    @Binding var selection: AppSection?

    var body: some View {
        List(AppSection.allCases, selection: $selection) { section in
            Label(section.title, systemImage: section.systemImage)
                .tag(section)
        }
        .navigationTitle("Convertix")
        .safeAreaInset(edge: .top) {
            BrandLockup()
                .padding(.horizontal)
                .padding(.vertical, 8)
        }
    }
}

struct DestinationView: View {
    let section: AppSection

    var body: some View {
        switch section {
        case .convert:
            ConvertHomeView()
        case .tools:
            ToolsView()
        case .activity:
            ActivityHistoryView()
        case .settings:
            SettingsView()
        }
    }
}

struct BrandLockup: View {
    var body: some View {
        HStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(ConvertixTheme.cobalt.gradient)
                Image(systemName: "arrow.left.arrow.right")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(.white)
            }
            .frame(width: 34, height: 34)

            Text("Convertix")
                .font(.title3.weight(.bold))
                .foregroundStyle(ConvertixTheme.ink)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Convertix")
    }
}

#Preview("iPhone") {
    ContentView()
}

#Preview("iPad", traits: .fixedLayout(width: 1180, height: 820)) {
    ContentView()
}

