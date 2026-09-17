import SwiftUI

struct AccountView: View {
    @Environment(AppState.self) private var appState
    @State private var isEditingProfile = false
    @State private var isShowingSignOutConfirmation = false

    var body: some View {
        ZStack {
            ConvertixBackdrop()

            ScrollView {
                switch appState.sessionState {
                case .restoring:
                    ProgressView("Restoring your account…")
                        .frame(maxWidth: .infinity, minHeight: 320)
                case .signedOut:
                    AuthenticationView()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)
                case let .signedIn(user):
                    AccountAuthenticatedView(
                        email: user.email,
                        displayName: appState.profile?.displayName ?? user.email,
                        history: appState.history,
                        editProfile: { isEditingProfile = true },
                        signOut: { isShowingSignOutConfirmation = true }
                    )
                }
            }
            .frame(maxWidth: .infinity)
        }
        .navigationTitle("Account")
        .sheet(isPresented: $isEditingProfile) {
            EditProfileView(
                initialName: appState.profile?.displayName ?? ""
            )
        }
        .confirmationDialog(
            "Sign out of Convertix?",
            isPresented: $isShowingSignOutConfirmation,
            titleVisibility: .visible
        ) {
            Button("Sign Out", role: .destructive) {
                Task {
                    await appState.signOut()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Your local downloaded files will remain on this device.")
        }
    }
}

struct AccountAuthenticatedView: View {
    let email: String
    let displayName: String
    let history: [ConversionHistoryEntry]
    let editProfile: () -> Void
    let signOut: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            AccountProfileCard(
                displayName: displayName,
                email: email,
                editProfile: editProfile
            )

            LazyVGrid(
                columns: [GridItem(.adaptive(minimum: 280), spacing: 16)],
                alignment: .leading,
                spacing: 16
            ) {
                AccountPlanCard()
                AccountUsageCard(
                    totalConversions: history.count,
                    conversionsThisMonth: history.filter {
                        Calendar.current.isDate($0.createdAt, equalTo: .now, toGranularity: .month)
                    }.count
                )
                AccountSecurityCard()
                AccountSupportCard()
            }

            Button("Sign Out", role: .destructive, action: signOut)
                .buttonStyle(.bordered)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: 860, alignment: .leading)
        .padding(28)
        .frame(maxWidth: .infinity)
    }
}

struct AccountProfileCard: View {
    let displayName: String
    let email: String
    let editProfile: () -> Void

    var body: some View {
        ViewThatFits {
            HStack(spacing: 18) {
                AccountIdentity(displayName: displayName, email: email)
                Spacer(minLength: 12)
                Button("Edit", systemImage: "pencil", action: editProfile)
                    .buttonStyle(.bordered)
            }
            VStack(alignment: .leading, spacing: 16) {
                AccountIdentity(displayName: displayName, email: email)
                Button("Edit Profile", systemImage: "pencil", action: editProfile)
                    .buttonStyle(.bordered)
            }
        }
        .padding(22)
        .convertixGlassPanel(cornerRadius: 20)
    }
}

struct AccountIdentity: View {
    let displayName: String
    let email: String

    var body: some View {
        HStack(spacing: 18) {
            Image(systemName: "person.crop.circle.fill")
                .resizable()
                .scaledToFit()
                .foregroundStyle(ConvertixTheme.cobalt.gradient)
                .frame(width: 72, height: 72)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 4) {
                Text(displayName)
                    .font(.title2.bold())
                    .foregroundStyle(.primary)
                Text(email)
                    .foregroundStyle(.secondary)
                Label("Convertix account", systemImage: "checkmark.seal.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(ConvertixTheme.cobalt)
            }
        }
    }
}

struct AccountPlanCard: View {
    var body: some View {
        AccountCard(title: "Account", symbol: "person.text.rectangle", tint: ConvertixTheme.cobalt) {
            Text("Signed in")
                .font(.headline)
            Text("Completed conversions are saved securely to your account history.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }
}

struct AccountUsageCard: View {
    let totalConversions: Int
    let conversionsThisMonth: Int

    var body: some View {
        AccountCard(title: "Usage", symbol: "chart.bar", tint: .green) {
            LabeledContent("This month", value: "\(conversionsThisMonth)")
            LabeledContent("All time", value: "\(totalConversions)")
            Text("Only completed conversions are counted.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

struct AccountSecurityCard: View {
    var body: some View {
        AccountCard(title: "Security", symbol: "lock.shield", tint: .purple) {
            Label("Session stored in Keychain", systemImage: "key")
            Label("Data protected by account access", systemImage: "checkmark.shield")
            Text("Password and recovery settings are managed by Convertix authentication.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

struct AccountSupportCard: View {
    var body: some View {
        AccountCard(title: "Support", symbol: "questionmark.circle", tint: .orange) {
            Link("Help Centre", destination: URL(string: "https://convertix.uk/guides")!)
            Link("Contact Support", destination: URL(string: "https://convertix.uk/contact")!)
            Link("Privacy Policy", destination: URL(string: "https://convertix.uk/privacy")!)
        }
    }
}

struct AccountCard<Content: View>: View {
    let title: LocalizedStringKey
    let symbol: String
    let tint: Color
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label(title, systemImage: symbol)
                .font(.headline)
                .foregroundStyle(tint)
            content
        }
        .frame(maxWidth: .infinity, minHeight: 170, alignment: .topLeading)
        .padding(20)
        .convertixGlassPanel(cornerRadius: 18)
    }
}

struct EditProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState
    @State private var name: String
    @State private var errorMessage: String?
    @State private var isSaving = false

    init(initialName: String) {
        _name = State(initialValue: initialName)
    }

    var body: some View {
        NavigationStack {
            Form {
                TextField("Name", text: $name)
                    .textContentType(.name)

                if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }
            .navigationTitle("Edit Profile")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            await save()
                        }
                    }
                    .disabled(
                        isSaving
                            || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    )
                }
            }
        }
        .frame(minWidth: 360, minHeight: 260)
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        do {
            try await appState.updateDisplayName(name)
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview("Account") {
    NavigationStack {
        AccountView()
    }
    .environment(AppState())
}
