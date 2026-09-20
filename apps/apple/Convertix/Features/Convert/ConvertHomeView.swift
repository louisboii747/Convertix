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

    init(showAccount: @escaping () -> Void = {}) {
        self.showAccount = showAccount
    }

    var body: some View {
#if os(macOS)
        macOSContent
#else
        mobileContent
#endif
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
                        conversionStatus: appState.conversionStatus,
                        downloadedFileURL: appState.downloadedFileURL,
                        isDownloading: appState.isDownloading,
                        downloadError: appState.downloadError,
                        chooseFile: { isImporting = true },
                        acceptDroppedFile: selectFile,
                        clearFile: clearFile,
                        startConversion: startConversion,
                        downloadResult: {
                            Task { await appState.downloadResult() }
                        }
                    )

                    if !appState.conversionJobs.isEmpty {
                        ConversionQueuePanel(
                            jobs: appState.conversionJobs,
                            download: { id in
                                Task { await appState.downloadConversionJob(id: id) }
                            },
                            remove: appState.removeConversionJob,
                            clearFinished: appState.clearFinishedConversionJobs
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
            ToolbarItem(placement: .primaryAction) {
                Button("Account", systemImage: "person.crop.circle", action: showAccount)
                    .help("Open Account")
            }
        }
        .onChange(of: appState.pendingConversionRouteID, initial: true) {
            applyPendingRoute()
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
                        conversionStatus: appState.conversionStatus,
                        downloadedFileURL: appState.downloadedFileURL,
                        isDownloading: appState.isDownloading,
                        downloadError: appState.downloadError,
                        chooseFile: { isImporting = true },
                        clearFile: clearFile,
                        startConversion: startConversion,
                        downloadResult: {
                            Task { await appState.downloadResult() }
                        }
                    )
                    if !appState.conversionJobs.isEmpty {
                        ConversionQueuePanel(
                            jobs: appState.conversionJobs,
                            download: { id in
                                Task { await appState.downloadConversionJob(id: id) }
                            },
                            remove: appState.removeConversionJob,
                            clearFinished: appState.clearFinishedConversionJobs
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

    private func startConversion() {
        guard let selectedFileURL else { return }

        Task {
            let canAccess = selectedFileURL.startAccessingSecurityScopedResource()
            defer {
                if canAccess {
                    selectedFileURL.stopAccessingSecurityScopedResource()
                }
            }

            await appState.convert(fileURL: selectedFileURL, route: selectedRoute)
        }
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
