import SwiftUI

struct SettingsView: View {
    @AppStorage("deleteOriginalAfterConversion") private var deleteOriginalAfterConversion = false
    @AppStorage("notifyWhenComplete") private var notifyWhenComplete = true
    @AppStorage("favoriteConversionRouteIDs") private var favoriteRouteIDs = ""

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
                    Toggle("Notify when complete", isOn: $notifyWhenComplete)
                    Toggle("Offer to delete the original", isOn: $deleteOriginalAfterConversion)

                    if !favoriteRouteIDs.isEmpty {
                        Button("Clear Favourite Conversions", role: .destructive) {
                            favoriteRouteIDs = ""
                        }
                    }
                }

                Section("Conversion options") {
                    LabeledContent("Images", value: "Set by output format")
                    LabeledContent("Documents", value: "Automatic")
                    Text("Quality, page range, audio bitrate, and video resolution will appear when the conversion service supports them.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

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
