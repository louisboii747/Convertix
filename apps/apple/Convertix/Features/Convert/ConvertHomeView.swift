import SwiftUI
import UniformTypeIdentifiers

struct ConvertHomeView: View {
    @Environment(AppState.self) private var appState
    let showAccount: () -> Void
    @State private var selectedRoute = ConversionRoute.catalog[0]
    @State private var isImporting = false
    @State private var selectedFileName: String?
    @State private var selectedFileURL: URL?
    @State private var selectedFileSize: Int64?
    @State private var fileSelectionError: String?
    @State private var searchText = ""
    @AppStorage("defaultOutputDestination") private var defaultOutputDestination =
        ConversionDestination.askEveryTime.rawValue
    @AppStorage("preferLocalConversions") private var preferLocalConversions = true
    @AppStorage("allowLargeCellularUploads") private var allowLargeCellularUploads = false
    @State private var isConfirmingCellularUpload = false

    init(showAccount: @escaping () -> Void = {}) {
        self.showAccount = showAccount
    }

    var body: some View {
        Group {
#if os(macOS)
            macOSContent
#else
            mobileContent
#endif
        }
        .alert(
            "Use Mobile Data?",
            isPresented: $isConfirmingCellularUpload
        ) {
            Button("Cancel", role: .cancel) {}
            Button("Continue Upload") {
                enqueueSelectedConversion()
            }
        } message: {
            Text("This is a large cloud conversion and the current connection may use mobile data.")
        }
    }

#if os(macOS)
    private var macOSContent: some View {
        ZStack {
            ConvertixTheme.canvas
                .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    Text("Convert")
                        .font(.largeTitle.bold())

                    MacConverterPanel(
                        selectedRoute: $selectedRoute,
                        availableRoutes: availableRoutes,
                        selectedFileURL: selectedFileURL,
                        selectedFileSize: selectedFileSize,
                        fileSelectionError: fileSelectionError,
                        conversionStatus: selectedConversionStatus,
                        downloadedFileURL: selectedConversion?.outputURL,
                        isDownloading: false,
                        downloadError: nil,
                        chooseFile: requestFileImport,
                        acceptDroppedFile: selectFile,
                        clearFile: clearFile,
                        startConversion: startConversion,
                        downloadResult: {}
                    )

                    if isSignedIn, !appState.conversionCoordinator.conversions.isEmpty {
                        NativeConversionQueuePanel(
                            conversions: appState.conversionCoordinator.conversions,
                            retry: appState.conversionCoordinator.retry,
                            cancel: appState.conversionCoordinator.cancel,
                            remove: appState.conversionCoordinator.remove,
                            clearFinished: appState.conversionCoordinator.removeFinished
                        )
                    }

                    if isSignedIn {
                        ConversionDashboardSummary(
                            recentConversions: appState.conversionCoordinator.recentConversions,
                            statistics: appState.conversionCoordinator.statistics
                        )
                    }

                    if selectedFileURL != nil {
                        MacConversionShortcuts(
                            routes: availableRoutes,
                            selectedRoute: $selectedRoute
                        )
                        .transition(.opacity)
                    }
                }
                .frame(maxWidth: 760, alignment: .leading)
                .padding(.horizontal, 28)
                .padding(.vertical, 26)
                .frame(maxWidth: .infinity)
            }
        }
        .navigationTitle("Convert")
        .searchable(text: $searchText, prompt: "Find a conversion")
        .fileImporter(
            isPresented: $isImporting,
            allowedContentTypes: [.data],
            allowsMultipleSelection: true,
            onCompletion: handleFileImport
        )
        .toolbar {
            ToolbarItem {
                Button("Convert Clipboard", systemImage: "doc.on.clipboard") {
                    importFromClipboard()
                }
                .help("Convert an image or file from the clipboard")
            }
            ToolbarItem(placement: .primaryAction) {
                Button("Account", systemImage: "person.crop.circle", action: showAccount)
                    .help("Open Account")
            }
        }
        .onChange(of: appState.pendingConversionRouteID, initial: true) {
            applyPendingRoute()
        }
        .onChange(of: appState.fileImportRequest) {
            requestFileImport()
        }
    }
#else
    private var mobileContent: some View {
        ZStack {
            ConvertixBackdrop()

            ScrollView {
                VStack(spacing: 32) {
                    HeroHeader()
                    ConverterPanel(
                        selectedRoute: $selectedRoute,
                        availableRoutes: availableRoutes,
                        selectedFileName: selectedFileName,
                        fileSelectionError: fileSelectionError,
                        conversionStatus: selectedConversionStatus,
                        downloadedFileURL: selectedConversion?.outputURL,
                        isDownloading: false,
                        downloadError: nil,
                        chooseFile: requestFileImport,
                        clearFile: clearFile,
                        startConversion: startConversion,
                        downloadResult: {}
                    )
                    if isSignedIn, !appState.conversionCoordinator.conversions.isEmpty {
                        NativeConversionQueuePanel(
                            conversions: appState.conversionCoordinator.conversions,
                            retry: appState.conversionCoordinator.retry,
                            cancel: appState.conversionCoordinator.cancel,
                            remove: appState.conversionCoordinator.remove,
                            clearFinished: appState.conversionCoordinator.removeFinished
                        )
                    }
                    if isSignedIn {
                        ConversionDashboardSummary(
                            recentConversions: appState.conversionCoordinator.recentConversions,
                            statistics: appState.conversionCoordinator.statistics
                        )
                    }
                    ConversionNotes()
                    if selectedFileURL == nil {
                        PopularConversions(
                            routes: displayedRoutes,
                            selectedRoute: $selectedRoute
                        )
                    }
                }
                .frame(maxWidth: 860)
                .padding(.horizontal, 24)
                .padding(.vertical, 36)
                .frame(maxWidth: .infinity)
            }
        }
        .navigationTitle("Convert")
        .searchable(text: $searchText, prompt: "Find a conversion")
        .fileImporter(
            isPresented: $isImporting,
            allowedContentTypes: [.data],
            allowsMultipleSelection: true,
            onCompletion: handleFileImport
        )
        .toolbar {
            ToolbarItem {
                Button("Convert Clipboard", systemImage: "doc.on.clipboard") {
                    importFromClipboard()
                }
                .help("Convert an image or file from the clipboard")
            }
            ToolbarItem(placement: .primaryAction) {
                Button("Account", systemImage: "person.crop.circle", action: showAccount)
                    .help("Open Account")
            }
        }
        .onChange(of: appState.pendingConversionRouteID, initial: true) {
            applyPendingRoute()
        }
    }
#endif

    private func handleFileImport(_ result: Result<[URL], Error>) {
        guard isSignedIn else {
            showAccount()
            return
        }
        guard case let .success(urls) = result, let firstURL = urls.first else { return }
        if urls.count > 1 {
            clearFile()
            Task { await appState.enqueueConversions(urls) }
        } else {
            selectFile(firstURL)
        }
    }

    private func selectFile(_ url: URL) {
        selectedFileName = url.lastPathComponent
        selectedFileURL = url
        selectedFileSize = try? url
            .resourceValues(forKeys: [.fileSizeKey])
            .fileSize
            .map(Int64.init)
        appState.resetConversion()

        let routes = ConversionRoute.routes(forSourceExtension: url.pathExtension)
        if let matchingRoute = routes.first {
            selectedRoute = matchingRoute
            fileSelectionError = nil
        } else {
            let fileExtension = url.pathExtension.uppercased()
            fileSelectionError = fileExtension.isEmpty
                ? "Convertix couldn’t identify this file type."
                : "Convertix doesn’t currently support \(fileExtension) files."
        }
    }

    private var isSignedIn: Bool {
        if case .signedIn = appState.sessionState {
            return true
        }
        return false
    }

    private func requestFileImport() {
        guard isSignedIn else {
            showAccount()
            return
        }
        isImporting = true
    }

    @MainActor
    private func importFromClipboard() {
        guard isSignedIn else {
            showAccount()
            return
        }
        do {
            selectFile(try ClipboardImportService.materializeCompatibleFile())
        } catch {
            fileSelectionError = error.localizedDescription
        }
    }

    private func clearFile() {
        selectedFileName = nil
        selectedFileURL = nil
        selectedFileSize = nil
        fileSelectionError = nil
        appState.resetConversion()
    }

    private var availableRoutes: [ConversionRoute] {
        guard let selectedFileURL else { return ConversionRoute.catalog }
        return ConversionRoute.routes(forSourceExtension: selectedFileURL.pathExtension)
    }

    private var displayedRoutes: [ConversionRoute] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else {
            return ConversionRoute.catalog.filter(\.isPopular)
        }

        return ConversionRoute.catalog.filter { route in
            route.title.localizedCaseInsensitiveContains(query)
                || route.source.localizedCaseInsensitiveContains(query)
                || route.target.localizedCaseInsensitiveContains(query)
        }
    }

    private func applyPendingRoute() {
        guard let routeID = appState.pendingConversionRouteID,
              let route = ConversionRoute.catalog.first(where: { $0.id == routeID }) else {
            return
        }
        selectedRoute = route
        appState.pendingConversionRouteID = nil
    }

    private var selectedConversion: ClientConversion? {
        guard let selectedFileURL else { return nil }
        return appState.conversionCoordinator.conversions.first {
            $0.inputURL == selectedFileURL
                && $0.outputFormat.caseInsensitiveCompare(selectedRoute.target) == .orderedSame
        }
    }

    private var selectedConversionStatus: ConversionStatus {
        guard let selectedConversion else { return .idle }
        switch selectedConversion.phase {
        case .queued:
            return .queued
        case .preparing, .uploading:
            return .uploading
        case .converting, .downloading, .saving:
            return .processing
        case .completed:
            return .completed(selectedConversion.outputURL ?? selectedFileURL ?? URL(filePath: "/"))
        case .failed:
            return .failed(selectedConversion.errorDescription ?? "The conversion couldn’t be completed.")
        case .cancelled:
            return .idle
        }
    }

    private func startConversion() {
        guard isSignedIn else {
            showAccount()
            return
        }
        guard let selectedFileURL else { return }

        let canRunLocally = preferLocalConversions && LocalConversionEngine().canConvert(
            inputFormat: selectedFileURL.pathExtension,
            outputFormat: selectedRoute.target
        )
        let isLargeRemoteUpload = !canRunLocally
            && (selectedFileSize ?? 0) >= 50 * 1_024 * 1_024
            && appState.networkMonitor.isExpensive
            && !allowLargeCellularUploads

        if isLargeRemoteUpload {
            isConfirmingCellularUpload = true
        } else {
            enqueueSelectedConversion()
        }
    }

    private func enqueueSelectedConversion() {
        guard let selectedFileURL else { return }
        appState.conversionCoordinator.enqueue(
            ConversionRequest(
                inputURLs: [selectedFileURL],
                outputFormat: selectedRoute.target,
                destination: ConversionDestination(rawValue: defaultOutputDestination)
                    ?? .askEveryTime,
                executionPreference: preferLocalConversions ? .automatic : .cloud,
                source: .app
            )
        )
    }
}

#if os(macOS)
#Preview("Mac Compact", traits: .fixedLayout(width: 760, height: 620)) {
    NavigationStack {
        ConvertHomeView()
    }
    .environment(AppState())
}

#Preview("Mac Wide", traits: .fixedLayout(width: 1180, height: 760)) {
    NavigationStack {
        ConvertHomeView()
    }
    .environment(AppState())
}
#endif

struct HeroHeader: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var displayedPhrase = "without the fuss."
    @State private var completedPhrase = "without the fuss."

    private static let phrases = [
        "without the fuss.",
        "without the wait.",
        "in just a few taps.",
        "quick, safe, simple.",
        "without the fuss."
    ]

    var body: some View {
        VStack(spacing: 10) {
            Text("Convert files \(displayedPhrase)")
                .font(.largeTitle.bold())
                .foregroundStyle(.primary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .contentTransition(.numericText())
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("Convert files \(completedPhrase)")

            Text("Choose a file and Convertix will show the formats it can convert to.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 620)
        }
        .task(id: reduceMotion) {
            guard !reduceMotion else {
                displayedPhrase = Self.phrases[0]
                completedPhrase = Self.phrases[0]
                return
            }

            await animatePhrases()
        }
    }

    @MainActor
    private func animatePhrases() async {
        displayedPhrase = Self.phrases[0]
        completedPhrase = Self.phrases[0]

        for phrase in Self.phrases.dropFirst() {
            guard await pause(for: 1_400_000_000) else { return }

            while !displayedPhrase.isEmpty {
                displayedPhrase.removeLast()
                guard await pause(for: 35_000_000) else { return }
            }

            for character in phrase {
                displayedPhrase.append(character)
                guard await pause(for: 55_000_000) else { return }
            }

            completedPhrase = phrase
        }
    }

    private func pause(for nanoseconds: UInt64) async -> Bool {
        do {
            try await Task.sleep(nanoseconds: nanoseconds)
            return true
        } catch {
            return false
        }
    }
}
