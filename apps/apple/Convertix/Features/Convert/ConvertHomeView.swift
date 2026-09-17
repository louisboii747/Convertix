import SwiftUI
import UniformTypeIdentifiers

struct ConvertHomeView: View {
    @State private var selectedRoute = ConversionRoute.catalog[0]
    @State private var isImporting = false
    @State private var selectedFileName: String?
    @State private var selectedFileURL: URL?
    @State private var conversionStatus: ConversionStatus = .idle
    @State private var searchText = ""

    var body: some View {
        ZStack {
            ConvertixBackdrop()

            ScrollView {
                VStack(spacing: 28) {
                    HeroHeader()
                    ConverterPanel(
                        selectedRoute: $selectedRoute,
                        selectedFileName: selectedFileName,
                        conversionStatus: conversionStatus,
                        chooseFile: { isImporting = true },
                        clearFile: clearFile,
                        startConversion: startConversion
                    )
                    ConversionNotes()
                    PopularConversions(
                        routes: ConversionRoute.catalog.filter(\.isPopular),
                        selectedRoute: $selectedRoute
                    )
                }
                .frame(maxWidth: 900)
                .padding(.horizontal, 20)
                .padding(.vertical, 28)
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
            conversionStatus = .idle

            let fileExtension = url.pathExtension.lowercased()
            if let matchingRoute = ConversionRoute.catalog.first(where: {
                $0.source.lowercased() == fileExtension
                    || ($0.source.lowercased() == "jpg" && fileExtension == "jpeg")
            }) {
                selectedRoute = matchingRoute
            }
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button("Account", systemImage: "person.crop.circle") {}
                    .accessibilityHint("Account features are coming in a later iteration")
            }
        }
    }

    private func clearFile() {
        selectedFileName = nil
        selectedFileURL = nil
        conversionStatus = .idle
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

            do {
                let api = try ConversionAPI()
                _ = try await api.convert(fileURL: selectedFileURL, route: selectedRoute) { status in
                    conversionStatus = status
                }
            } catch is CancellationError {
                conversionStatus = .idle
            } catch {
                conversionStatus = .failed(
                    (error as? LocalizedError)?.errorDescription ?? "The conversion couldn’t be completed."
                )
            }
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
        VStack(spacing: 12) {
            VStack(spacing: 0) {
                Text("Convert files")
                    .foregroundStyle(ConvertixTheme.ink)
                Text(displayedPhrase)
                    .foregroundStyle(ConvertixTheme.cobalt)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
            }
            .font(.largeTitle.bold())
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Convert files \(completedPhrase)")

            Text("Choose a file and Convertix will show the formats it can convert to.")
                .font(.title3)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 620)
        }
        .padding(.top, 12)
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

