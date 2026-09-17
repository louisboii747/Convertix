import SwiftUI

struct AuthenticationView: View {
    @Environment(AppState.self) private var appState
    @State private var mode = AuthenticationMode.signIn
    @State private var displayName = ""
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        VStack(spacing: 24) {
            Image("ConvertixLogo")
                .resizable()
                .scaledToFit()
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                .frame(width: 76, height: 76)
                .accessibilityHidden(true)

            VStack(spacing: 6) {
                Text(mode.title)
                    .font(.title.bold())
                Text(
                    mode == .signIn
                        ? "Access your profile and conversion history."
                        : "Create an account to keep your conversion history in sync."
                )
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            }

            Button {
                Task {
                    await appState.signInWithGoogle()
                }
            } label: {
                Label("Continue with Google", systemImage: "g.circle.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .controlSize(.large)
            .disabled(appState.isAuthenticating)

            HStack(spacing: 12) {
                Divider()
                Text("or use email")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Divider()
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Or use email")

            Picker("Authentication", selection: $mode) {
                ForEach(AuthenticationMode.allCases) { item in
                    Text(item.title).tag(item)
                }
            }
            .pickerStyle(.segmented)

            VStack(spacing: 14) {
                if mode == .signUp {
                    TextField("Display name", text: $displayName)
                        .textContentType(.name)
                }

                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
#if os(iOS)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
#endif

                SecureField("Password", text: $password)
                    .textContentType(mode == .signIn ? .password : .newPassword)
            }
            .textFieldStyle(.roundedBorder)

            if let error = appState.authenticationError {
                Label(error, systemImage: "exclamationmark.triangle.fill")
                    .font(.callout)
                    .foregroundStyle(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            if let notice = appState.authenticationNotice {
                Label(notice, systemImage: "envelope.badge")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            Button {
                Task {
                    if mode == .signIn {
                        await appState.signIn(email: email, password: password)
                    } else {
                        await appState.signUp(
                            email: email,
                            password: password,
                            displayName: displayName
                        )
                    }
                }
            } label: {
                if appState.isAuthenticating {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                } else {
                    Text(mode.title)
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(
                appState.isAuthenticating
                    || email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    || password.isEmpty
                    || (mode == .signUp
                        && displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            )
        }
        .frame(maxWidth: 420)
        .padding(28)
        .convertixGlassPanel(cornerRadius: 24)
        .onChange(of: mode) {
            appState.authenticationError = nil
            appState.authenticationNotice = nil
        }
    }
}

#Preview {
    AuthenticationView()
        .environment(AppState())
        .padding()
}
