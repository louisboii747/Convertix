import SwiftUI

struct SettingsView: View {
    @AppStorage("deleteOriginalAfterConversion") private var deleteOriginalAfterConversion = false
    @AppStorage("notifyWhenComplete") private var notifyWhenComplete = true
    @AppStorage("favoriteConversionRouteIDs") private var favoriteRouteIDs = ""
    @AppStorage("defaultOutputDestination") private var defaultOutputDestination =
        ConversionDestination.askEveryTime.rawValue
    @AppStorage("preferLocalConversions") private var preferLocalConversions = true
    @AppStorage("allowLargeCellularUploads") private var allowLargeCellularUploads = false
#if os(macOS)
    @AppStorage("showMenuBarItem") private var showMenuBarItem = true
#endif

    var body: some View {
        ZStack {
            ConvertixBackdrop()

            Form {
                Section("Account") {
                    NavigationLink {
                        AccountView()
                    } label: {
                        Label("Account and Profile", systemImage: "person.crop.circle")
                    }
                }

                Section("Conversions") {
                    Toggle("Prefer on-device conversion when available", isOn: $preferLocalConversions)
                    Toggle("Notify when complete", isOn: $notifyWhenComplete)
                    Toggle("Offer to delete the original", isOn: $deleteOriginalAfterConversion)

                    Picker("Default output location", selection: $defaultOutputDestination) {
                        ForEach(ConversionDestination.allCases, id: \.self) { destination in
                            Text(destination.settingsTitle).tag(destination.rawValue)
                        }
                    }

                    if !favoriteRouteIDs.isEmpty {
                        Button("Clear Favourite Conversions", role: .destructive) {
                            favoriteRouteIDs = ""
                        }
                    }
                }

                Section("Network") {
                    Toggle(
                        "Allow large cloud conversions over cellular",
                        isOn: $allowLargeCellularUploads
                    )
                }

                Section("Conversion options") {
                    LabeledContent("Images", value: "Set by output format")
                    LabeledContent("Documents", value: "Automatic")
                    Text("Quality, page range, audio bitrate, and video resolution will appear when the conversion service supports them.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

#if os(macOS)
                Section("Integrations") {
                    Toggle("Show Convertix in the menu bar", isOn: $showMenuBarItem)
                }
#endif

                Section("Privacy") {
                    Label("Files upload only when conversion starts", systemImage: "lock.shield")
                    Label("On-device tools never upload files", systemImage: "iphone.gen3")
                }

                Section("About") {
                    LabeledContent("App", value: "Convertix")
                    LabeledContent("Version", value: appVersion)
                }
            }
            .formStyle(.grouped)
            .scrollContentBackground(.hidden)
        }
        .navigationTitle("Settings")
        .onChange(of: notifyWhenComplete) {
            guard notifyWhenComplete else { return }
            Task {
                let granted = await ConversionNotificationManager.shared.requestAuthorization()
                if !granted {
                    notifyWhenComplete = false
                }
            }
        }
    }

    private var appVersion: String {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString")
            as? String
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String

        return switch (version, build) {
        case let (version?, build?):
            "\(version) (\(build))"
        case let (version?, nil):
            version
        default:
            "Unknown"
        }
    }
}

private extension ConversionDestination {
    var settingsTitle: LocalizedStringResource {
        switch self {
        case .askEveryTime: "Ask Every Time"
        case .sameFolder: "Same Folder"
        case .downloads: "Downloads"
        case .convertixFolder: "Convertix Folder"
        case .shareAfterConversion: "Share After Conversion"
        }
    }
}
