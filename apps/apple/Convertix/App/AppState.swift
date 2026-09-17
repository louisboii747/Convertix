import Foundation
import Observation
import Supabase

enum SessionState: Equatable {
    case restoring
    case signedOut
    case signedIn(AccountUser)
}

@MainActor
@Observable
final class AppState {
    var sessionState: SessionState = .restoring
    var profile: AccountProfile?
    var history: [ConversionHistoryEntry] = []
    var isAuthenticating = false
    var authenticationError: String?
    var authenticationNotice: String?
    var isLoadingHistory = false
    var historyError: String?
    var conversionStatus: ConversionStatus = .idle
    var conversionResult: ConversionResult?
    var downloadedFileURL: URL?
    var isDownloading = false
    var downloadError: String?
    var configurationError: String?

    @ObservationIgnored private let supabaseService: SupabaseService?
    @ObservationIgnored private let conversionAPI: ConversionAPI?
    @ObservationIgnored private var hasStarted = false

    init(bundle: Bundle = .main) {
        do {
            let configuration = try AppConfiguration(bundle: bundle)
            supabaseService = SupabaseService(configuration: configuration)
            conversionAPI = ConversionAPI(configuration: configuration)
        } catch {
            supabaseService = nil
            conversionAPI = nil
            configurationError = error.localizedDescription
            sessionState = .signedOut
        }
    }

    func start() async {
        guard !hasStarted else { return }
        hasStarted = true
        guard let supabaseService else { return }

        for await (_, session) in supabaseService.authStateChanges {
            if let session, !session.isExpired, !session.user.isAnonymous {
                let user = AccountUser(
                    id: session.user.id,
                    email: session.user.email ?? ""
                )
                let isNewUser = sessionState != .signedIn(user)
                sessionState = .signedIn(user)
                if isNewUser {
                    await loadAccountData(for: user)
                }
            } else {
                sessionState = .signedOut
                profile = nil
                history = []
            }
        }
    }

    func signIn(email: String, password: String) async {
        guard let supabaseService else {
            authenticationError = configurationError
            return
        }

        isAuthenticating = true
        authenticationError = nil
        authenticationNotice = nil
        defer { isAuthenticating = false }

        do {
            try await supabaseService.signIn(
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password
            )
        } catch {
            authenticationError = authenticationMessage(for: error)
        }
    }

    func signInWithGoogle() async {
        guard let supabaseService else {
            authenticationError = configurationError
            return
        }

        isAuthenticating = true
        authenticationError = nil
        authenticationNotice = nil
        defer { isAuthenticating = false }

        do {
            let user = try await supabaseService.signInWithGoogle()
            await completeAuthentication(with: user)
        } catch {
            if (error as NSError).code != 1 {
                authenticationError = authenticationMessage(for: error)
            }
        }
    }

    func signUp(email: String, password: String, displayName: String) async {
        guard let supabaseService else {
            authenticationError = configurationError
            return
        }

        let cleanedName = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard cleanedName.count >= 2, cleanedName.count <= 80 else {
            authenticationError = "Enter a display name between 2 and 80 characters."
            return
        }
        guard password.count >= 8 else {
            authenticationError = "Use at least 8 characters for your password."
            return
        }

        isAuthenticating = true
        authenticationError = nil
        authenticationNotice = nil
        defer { isAuthenticating = false }

        do {
            let hasSession = try await supabaseService.signUp(
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password,
                displayName: cleanedName
            )
            if !hasSession {
                authenticationNotice = "Check your email to confirm your Convertix account."
            }
        } catch {
            authenticationError = authenticationMessage(for: error)
        }
    }

    func signOut() async {
        guard let supabaseService else { return }
        authenticationError = nil

        do {
            try await supabaseService.signOut()
        } catch {
            authenticationError = authenticationMessage(for: error)
        }
    }

    func handleOpenURL(_ url: URL) async {
        guard url.scheme == "convertix", let supabaseService else { return }

        isAuthenticating = true
        authenticationError = nil
        defer { isAuthenticating = false }

        do {
            let user = try await supabaseService.handleOpenURL(url)
            authenticationNotice = nil
            await completeAuthentication(with: user)
        } catch {
            authenticationError = "We couldn’t finish confirming your account. Open the link on the same device where Convertix is running, then try again."
        }
    }

    func updateDisplayName(_ displayName: String) async throws {
        guard case let .signedIn(user) = sessionState,
              let supabaseService else {
            throw SupabaseServiceError.authenticationRequired
        }

        let cleanedName = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard cleanedName.count >= 2, cleanedName.count <= 80 else {
            throw AccountValidationError.invalidDisplayName
        }

        profile = try await supabaseService.updateProfile(
            userID: user.id,
            displayName: cleanedName
        )
    }

    func loadHistory() async {
        guard case let .signedIn(user) = sessionState,
              let supabaseService else {
            history = []
            return
        }

        isLoadingHistory = true
        historyError = nil
        defer { isLoadingHistory = false }

        do {
            history = try await supabaseService.loadHistory(userID: user.id)
        } catch {
            historyError = "We couldn’t load your conversion history. Pull to refresh and try again."
        }
    }

    func convert(fileURL: URL, route: ConversionRoute) async {
        guard let conversionAPI else {
            conversionStatus = .failed(
                configurationError ?? "The conversion service isn’t configured."
            )
            return
        }

        conversionResult = nil
        downloadedFileURL = nil
        downloadError = nil

        do {
            let inputSize = try fileURL
                .resourceValues(forKeys: [.fileSizeKey])
                .fileSize
                .map(Int64.init)

            let result = try await conversionAPI.convert(
                fileURL: fileURL,
                route: route
            ) { [weak self] status in
                self?.conversionStatus = status
            }

            conversionResult = result
            await saveHistory(
                result: result,
                originalFilename: fileURL.lastPathComponent,
                sourceFormat: route.source.lowercased(),
                targetFormat: route.target.lowercased(),
                inputSize: inputSize
            )
        } catch is CancellationError {
            conversionStatus = .idle
        } catch {
            conversionStatus = .failed(
                (error as? LocalizedError)?.errorDescription
                    ?? "The conversion couldn’t be completed."
            )
        }
    }

    func downloadResult() async {
        guard let conversionAPI, let conversionResult else { return }

        isDownloading = true
        downloadError = nil
        defer { isDownloading = false }

        do {
            if let downloadedFileURL {
                try? FileManager.default.removeItem(at: downloadedFileURL)
            }
            downloadedFileURL = try await conversionAPI.download(conversionResult)
        } catch {
            downloadError = (error as? LocalizedError)?.errorDescription
                ?? "The converted file couldn’t be downloaded."
        }
    }

    func resetConversion() {
        conversionStatus = .idle
        conversionResult = nil
        if let downloadedFileURL {
            try? FileManager.default.removeItem(at: downloadedFileURL)
        }
        downloadedFileURL = nil
        downloadError = nil
    }

    private func completeAuthentication(with user: AccountUser) async {
        let isNewUser = sessionState != .signedIn(user)
        sessionState = .signedIn(user)
        if isNewUser {
            await loadAccountData(for: user)
        }
    }

    private func loadAccountData(for user: AccountUser) async {
        guard let supabaseService else { return }

        async let loadedProfile = supabaseService.loadProfile(userID: user.id)
        async let loadedHistory = supabaseService.loadHistory(userID: user.id)

        do {
            profile = try await loadedProfile
        } catch {
            profile = nil
        }

        do {
            history = try await loadedHistory
            historyError = nil
        } catch {
            history = []
            historyError = "We couldn’t load your conversion history."
        }
    }

    private func saveHistory(
        result: ConversionResult,
        originalFilename: String,
        sourceFormat: String,
        targetFormat: String,
        inputSize: Int64?
    ) async {
        guard case let .signedIn(user) = sessionState,
              let supabaseService else { return }

        let record = ConversionHistoryWrite(
            userID: user.id,
            conversionID: result.conversionID,
            originalFilename: originalFilename,
            sourceFormat: sourceFormat,
            targetFormat: targetFormat,
            status: "completed",
            inputSize: inputSize,
            outputSize: result.outputSize,
            outputKey: result.outputKey,
            completedAt: Date()
        )

        do {
            try await supabaseService.saveHistory(record)
            await loadHistory()
        } catch {
            historyError = "The conversion completed, but its history entry couldn’t be saved."
        }
    }

    private func authenticationMessage(for error: Error) -> String {
        let message = error.localizedDescription
        if message.localizedCaseInsensitiveContains("invalid login credentials") {
            return "The email or password is incorrect."
        }
        if message.localizedCaseInsensitiveContains("email not confirmed") {
            return "Confirm your email address before signing in."
        }
        if message.localizedCaseInsensitiveContains("rate") {
            return "Too many attempts. Wait a moment and try again."
        }
        return message
    }
}

enum AccountValidationError: LocalizedError {
    case invalidDisplayName

    var errorDescription: String? {
        "Enter a display name between 2 and 80 characters."
    }
}
