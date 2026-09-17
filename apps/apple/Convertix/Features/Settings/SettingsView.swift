import SwiftUI

struct SettingsView: View {
    @AppStorage("deleteOriginalAfterConversion") private var deleteOriginalAfterConversion = false
    @AppStorage("notifyWhenComplete") private var notifyWhenComplete = true

    var body: some View {
        ZStack {
            ConvertixBackdrop()

            Form {
                Section("Conversions") {
                    Toggle("Notify when complete", isOn: $notifyWhenComplete)
                    Toggle("Offer to delete the original", isOn: $deleteOriginalAfterConversion)
                }

                Section("Privacy") {
                    Label("Files upload only when conversion starts", systemImage: "lock.shield")
                    Label("On-device tools never upload files", systemImage: "iphone.gen3")
                }

                Section("About") {
                    LabeledContent("App", value: "Convertix")
                    LabeledContent("Version", value: "1.0")
                }
            }
            .formStyle(.grouped)
            .scrollContentBackground(.hidden)
        }
        .navigationTitle("Settings")
    }
}
