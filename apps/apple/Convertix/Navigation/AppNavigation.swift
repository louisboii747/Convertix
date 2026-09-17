import SwiftUI

enum AppSection: String, CaseIterable, Identifiable {
    case convert
    case tools
    case activity
    case account
    case settings

    var id: Self { self }

    var title: String {
        switch self {
        case .convert: "Convert"
        case .tools: "Tools"
        case .activity: "Activity"
        case .account: "Account"
        case .settings: "Settings"
        }
    }

    var systemImage: String {
        switch self {
        case .convert: "arrow.trianglehead.2.clockwise.rotate.90"
        case .tools: "square.grid.2x2"
        case .activity: "clock.arrow.trianglehead.counterclockwise.rotate.90"
        case .account: "person.crop.circle"
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
                    DestinationView(section: selection ?? .convert) {
                        selection = .account
                    }
                }
            }
            .navigationSplitViewStyle(.balanced)
            .tint(ConvertixTheme.cobalt)
        }
    }
}

struct CompactRootView: View {
    @State private var selection = AppSection.convert

    var body: some View {
        TabView(selection: $selection) {
            NavigationStack {
                ConvertHomeView {
                    selection = .account
                }
            }
            .tabItem {
                Label("Convert", systemImage: "arrow.trianglehead.2.clockwise.rotate.90")
            }
            .tag(AppSection.convert)

            NavigationStack {
                ToolsView()
            }
            .tabItem {
                Label("Tools", systemImage: "square.grid.2x2")
            }
            .tag(AppSection.tools)

            NavigationStack {
                ActivityHistoryView()
            }
            .tabItem {
                Label("Activity", systemImage: "clock")
            }
            .tag(AppSection.activity)

            NavigationStack {
                AccountView()
            }
            .tabItem {
                Label("Account", systemImage: "person.crop.circle")
            }
            .tag(AppSection.account)

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
            .tag(AppSection.settings)
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
        .listStyle(.sidebar)
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
    let showAccount: () -> Void

    var body: some View {
        switch section {
        case .convert:
            ConvertHomeView(showAccount: showAccount)
        case .tools:
            ToolsView()
        case .activity:
            ActivityHistoryView()
        case .account:
            AccountView()
        case .settings:
            SettingsView()
        }
    }
}

struct BrandLockup: View {
    var body: some View {
        HStack(spacing: 10) {
            Image("ConvertixLogo")
                .resizable()
                .scaledToFit()
                .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
                .frame(width: 36, height: 36)

            Text("Convertix")
                .font(.title3.weight(.bold))
                .foregroundStyle(.primary)
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
