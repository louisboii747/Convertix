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
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @State private var selection: AppSection? = .convert

    var body: some View {
        Group {
            if horizontalSizeClass == .compact {
                CompactRootView()
            } else {
                NavigationSplitView {
                    SidebarView(selection: $selection)
                } detail: {
                    NavigationStack {
                        DestinationView(section: selection ?? .convert) {
                            selection = .settings
                        }
                    }
                }
                .navigationSplitViewStyle(.balanced)
                .tint(ConvertixTheme.cobalt)
            }
        }
        .sheet(
            isPresented: Binding(
                get: { !hasCompletedOnboarding },
                set: { if !$0 { hasCompletedOnboarding = true } }
            )
        ) {
            OnboardingView {
                hasCompletedOnboarding = true
            }
            .interactiveDismissDisabled()
        }
    }
}

struct CompactRootView: View {
    @State private var selection = AppSection.convert

    var body: some View {
        TabView(selection: $selection) {
            NavigationStack {
                ConvertHomeView {
                    selection = .settings
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
#if os(macOS)
        List(AppSection.allCases, selection: $selection) { section in
            Label(section.title, systemImage: section.systemImage)
                .tag(section)
                .padding(.vertical, 2)
        }
        .listStyle(.sidebar)
        .navigationSplitViewColumnWidth(min: 180, ideal: 200, max: 230)
        .navigationTitle("Convertix")
        .safeAreaInset(edge: .top) {
            BrandLockup(compact: true)
                .padding(.leading, -4)
                .padding(.trailing, 12)
                .padding(.vertical, 6)
        }
#else
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
#endif
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
        case .settings:
            SettingsView()
        }
    }
}

struct BrandLockup: View {
    var compact = false

    var body: some View {
        HStack(spacing: 10) {
            Image("ConvertixLogo")
                .resizable()
                .scaledToFit()
                .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
                .frame(width: compact ? 28 : 36, height: compact ? 28 : 36)

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
        .environment(AppState())
}

#Preview("iPad", traits: .fixedLayout(width: 1180, height: 820)) {
    ContentView()
        .environment(AppState())
}
