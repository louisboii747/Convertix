import SwiftUI
import UniformTypeIdentifiers

struct ConvertHomeView: View {
    @Environment(AppState.self) private var appState
    let showAccount: () -> Void
    @State private var selectedRoute = ConversionRoute.catalog[0]
    @State private var isImporting = false
    @State private var selectedFileName: String?
    @State private var selectedFileURL: URL?
    @State private var searchText = ""

    init(showAccount: @escaping () -> Void = {}) {
        self.showAccount = showAccount
    }

    var body: some View {
        ZStack {
            ConvertixBackdrop()

            ScrollView {
                VStack(spacing: 32) {
                    HeroHeader()
                    ConverterPanel(
                        selectedRoute: $selectedRoute,
                        selectedFileName: selectedFileName,
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
                    ConversionNotes()
                    PopularConversions(
                        routes: ConversionRoute.catalog.filter(\.isPopular),
                        selectedRoute: $selectedRoute
                    )
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
            allowsMultipleSelection: false
        ) { result in
            guard case let .success(urls) = result, let url = urls.first else { return }
            selectedFileName = url.lastPathComponent
            selectedFileURL = url
            appState.resetConversion()

            let fileExtension = url.pathExtension.lowercased()
            if let matchingRoute = ConversionRoute.routes(forSourceExtension: fileExtension).first {
                selectedRoute = matchingRoute
            }
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button("Account", systemImage: "person.crop.circle", action: showAccount)
                    .help("Open Account")
            }
        }
    }

    private func clearFile() {
        selectedFileName = nil
        selectedFileURL = nil
        appState.resetConversion()
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
