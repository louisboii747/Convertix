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
    var conversionJobs: [ConversionJob] = []
    var conversionResult: ConversionResult?
    var downloadedFileURL: URL?
    var isDownloading = false
    var downloadError: String?
    var configurationError: String?
    var pendingConversionRouteID: String?
    var pendingDeepLink: AppDeepLink?
    var fileImportRequest = 0

    let conversionCoordinator: ConversionCoordinator
    let networkMonitor = NetworkMonitor()

    @ObservationIgnored private let supabaseService: SupabaseService?
    @ObservationIgnored private let conversionAPI: ConversionAPI?
    @ObservationIgnored private var hasStarted = false

    init(bundle: Bundle = .main) {
        let configuredSupabaseService: SupabaseService?
        let configuredConversionAPI: ConversionAPI?

        do {
            let configuration = try AppConfiguration(bundle: bundle)
            configuredSupabaseService = SupabaseService(configuration: configuration)
            configuredConversionAPI = ConversionAPI(configuration: configuration)
        } catch {
            configuredSupabaseService = nil
            configuredConversionAPI = nil
            configurationError = error.localizedDescription
            sessionState = .signedOut
        }

        supabaseService = configuredSupabaseService
        conversionAPI = configuredConversionAPI
        conversionCoordinator = ConversionCoordinator(remoteService: configuredConversionAPI)
        conversionCoordinator.configureAccountAccess(
            authorizationCheck: { [weak self] in
                guard let self else { return false }
                if case .signedIn = self.sessionState {
                    return true
                }
                return false
            },
            completionHandler: { [weak self] conversion in
                await self?.saveClientConversionHistory(conversion)
            }
        )
    }

    func start() async {
        guard !hasStarted else { return }
        hasStarted = true
        networkMonitor.start()
        await conversionCoordinator.restore()
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
                await conversionCoordinator.clearAccountData()
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
            guard !SupabaseService.isUserCancelledOAuth(error) else { return }
            authenticationError = authenticationMessage(for: error)
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
        guard url.scheme == "convertix" else { return }

        if let deepLink = AppDeepLink(url: url) {
            pendingDeepLink = deepLink
            if case let .convert(routeID?) = deepLink,
               ConversionRoute.catalog.contains(where: { $0.id == routeID }) {
                pendingConversionRouteID = routeID
            }
            return
        }

        guard let supabaseService else { return }
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

    func recordLocalConversion(
        inputURL: URL,
        outputURL: URL,
        sourceFormat: String? = nil,
        targetFormat: String? = nil
    ) async {
        guard case let .signedIn(user) = sessionState,
              let supabaseService else { return }

        let inputSize = try? inputURL.resourceValues(forKeys: [.fileSizeKey]).fileSize.map(Int64.init)
        let outputSize = try? outputURL.resourceValues(forKeys: [.fileSizeKey]).fileSize.map(Int64.init)
        let record = ConversionHistoryWrite(
            userID: user.id,
            conversionID: UUID(),
            originalFilename: inputURL.lastPathComponent,
            sourceFormat: sourceFormat ?? inputURL.pathExtension.lowercased(),
            targetFormat: targetFormat ?? outputURL.pathExtension.lowercased(),
            status: "completed",
            inputSize: inputSize ?? nil,
            outputSize: outputSize ?? nil,
            outputKey: nil,
            completedAt: .now
        )
        do {
            try await supabaseService.saveHistory(record)
            await loadHistory()
        } catch {
            historyError = "The conversion completed, but its account history entry couldn’t be saved."
        }
    }

    func enqueueConversions(_ fileURLs: [URL]) async {
        let defaults = UserDefaults.standard
        let destination = ConversionDestination(
            rawValue: defaults.string(forKey: "defaultOutputDestination") ?? ""
        ) ?? .askEveryTime
        let execution: ConversionExecution = defaults.object(
            forKey: "preferLocalConversions"
        ) as? Bool == false ? .cloud : .automatic
        conversionCoordinator.enqueueDetected(
            fileURLs,
            destination: destination,
            executionPreference: execution
        )
    }

    func removeConversionJob(id: UUID) {
        conversionJobs.removeAll { $0.id == id }
    }

    func clearFinishedConversionJobs() {
        conversionJobs.removeAll { !$0.status.isRunning }
    }

    func downloadConversionJob(id: UUID) async {
        guard let conversionAPI,
              let index = conversionJobs.firstIndex(where: { $0.id == id }),
              let result = conversionJobs[index].result else { return }

        do {
            conversionJobs[index].downloadedFileURL = try await conversionAPI.download(result)
        } catch {
            conversionJobs[index].status = .failed(
                (error as? LocalizedError)?.errorDescription
                    ?? "The converted file couldn’t be downloaded."
            )
        }
    }

    private func runConversionJob(id: UUID) async {
        guard let conversionAPI,
              let index = conversionJobs.firstIndex(where: { $0.id == id }) else { return }

        let job = conversionJobs[index]
        let canAccess = job.sourceURL.startAccessingSecurityScopedResource()
        defer {
            if canAccess {
                job.sourceURL.stopAccessingSecurityScopedResource()
            }
        }

        do {
            let inputSize = try job.sourceURL
                .resourceValues(forKeys: [.fileSizeKey])
                .fileSize
                .map(Int64.init)
            let result = try await conversionAPI.convert(
                fileURL: job.sourceURL,
                route: job.route
            ) { [weak self] status in
                guard let self,
                      let currentIndex = self.conversionJobs.firstIndex(
                        where: { $0.id == id }
                      ) else { return }
                self.conversionJobs[currentIndex].status = status
            }

            guard let currentIndex = conversionJobs.firstIndex(where: { $0.id == id }) else {
                return
            }
            conversionJobs[currentIndex].result = result
            await saveHistory(
                result: result,
                originalFilename: job.fileName,
                sourceFormat: job.route.source.lowercased(),
                targetFormat: job.route.target.lowercased(),
                inputSize: inputSize
            )
        } catch is CancellationError {
            if let currentIndex = conversionJobs.firstIndex(where: { $0.id == id }) {
                conversionJobs[currentIndex].status = .idle
            }
        } catch {
            if let currentIndex = conversionJobs.firstIndex(where: { $0.id == id }) {
                conversionJobs[currentIndex].status = .failed(
                    (error as? LocalizedError)?.errorDescription
                        ?? "The conversion couldn’t be completed."
                )
            }
        }
    }

    func deleteHistoryEntry(_ entry: ConversionHistoryEntry) async {
        guard case let .signedIn(user) = sessionState,
              let supabaseService else { return }

        do {
            try await supabaseService.deleteHistoryEntry(id: entry.id, userID: user.id)
            history.removeAll { $0.id == entry.id }
        } catch {
            historyError = "We couldn’t delete that history entry. Try again."
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

    private func saveClientConversionHistory(_ conversion: ClientConversion) async {
        guard case let .signedIn(user) = sessionState,
              let supabaseService,
              conversion.phase == .completed else { return }

        let record = ConversionHistoryWrite(
            userID: user.id,
            conversionID: conversion.backendConversionID ?? conversion.id,
            originalFilename: conversion.inputFilename,
            sourceFormat: conversion.inputFormat,
            targetFormat: conversion.outputFormat,
            status: "completed",
            inputSize: conversion.originalSize,
            outputSize: conversion.outputSize,
            outputKey: nil,
            completedAt: conversion.completionDate ?? .now
        )

        do {
            try await supabaseService.saveHistory(record)
            await loadHistory()
        } catch {
            historyError = "The conversion completed, but its account history entry couldn’t be saved."
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
