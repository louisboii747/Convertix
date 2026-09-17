// xcode: set sdk=iOS

import SwiftUI
import Foundation
import UniformTypeIdentifiers
#if os(iOS) && canImport(ActivityKit)
import ActivityKit
#endif

@main
struct ConvertixApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

enum ConvertixTheme {
    static let cobalt = Color(red: 49 / 255, green: 92 / 255, blue: 245 / 255)
    static let cobaltDark = Color(red: 33 / 255, green: 71 / 255, blue: 212 / 255)
    static let canvas = Color(red: 247 / 255, green: 249 / 255, blue: 252 / 255)
    static let ink = Color(red: 13 / 255, green: 27 / 255, blue: 52 / 255)
    static let line = Color(red: 219 / 255, green: 226 / 255, blue: 239 / 255)
}

struct ConvertixBackdrop: View {
    var body: some View {
        ZStack {
            ConvertixTheme.canvas
            RadialGradient(
                colors: [ConvertixTheme.cobalt.opacity(0.15), .clear],
                center: .topTrailing,
                startRadius: 20,
                endRadius: 520
            )
            RadialGradient(
                colors: [Color.mint.opacity(0.13), .clear],
                center: .bottomLeading,
                startRadius: 20,
                endRadius: 460
            )
        }
        .ignoresSafeArea()
    }
}

struct GlassPanelModifier: ViewModifier {
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        if #available(iOS 26.0, macOS 26.0, *) {
            content.glassEffect(.regular, in: .rect(cornerRadius: cornerRadius))
        } else {
            content
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: cornerRadius))
                .overlay {
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(ConvertixTheme.line.opacity(0.8), lineWidth: 1)
                }
        }
    }
}

extension View {
    func convertixGlassPanel(cornerRadius: CGFloat = 24) -> some View {
        modifier(GlassPanelModifier(cornerRadius: cornerRadius))
    }
}

enum AppSection: String, CaseIterable, Identifiable {
    case convert
    case tools
    case activity
    case settings

    var id: Self { self }

    var title: String {
        switch self {
        case .convert: "Convert"
        case .tools: "Tools"
        case .activity: "Activity"
        case .settings: "Settings"
        }
    }

    var systemImage: String {
        switch self {
        case .convert: "arrow.trianglehead.2.clockwise.rotate.90"
        case .tools: "square.grid.2x2"
        case .activity: "clock.arrow.trianglehead.counterclockwise.rotate.90"
        case .settings: "gearshape"
        }
    }
}

enum FileFamily: String, CaseIterable, Identifiable {
    case image
    case document
    case audio
    case video

    var id: Self { self }

    var title: String { rawValue.capitalized }

    var systemImage: String {
        switch self {
        case .image: "photo.on.rectangle.angled"
        case .document: "doc.richtext"
        case .audio: "waveform"
        case .video: "film.stack"
        }
    }
}

struct ConversionRoute: Identifiable, Hashable {
    let id: String
    let source: String
    let target: String
    let family: FileFamily
    let isPopular: Bool

    var title: String { "\(source) to \(target)" }
}

extension ConversionRoute {
    static let catalog: [ConversionRoute] = [
        .init(id: "heic-jpg", source: "HEIC", target: "JPG", family: .image, isPopular: true),
        .init(id: "png-jpg", source: "PNG", target: "JPG", family: .image, isPopular: true),
        .init(id: "jpg-png", source: "JPG", target: "PNG", family: .image, isPopular: true),
        .init(id: "jpg-pdf", source: "JPG", target: "PDF", family: .image, isPopular: true),
        .init(id: "svg-png", source: "SVG", target: "PNG", family: .image, isPopular: false),
        .init(id: "docx-pdf", source: "DOCX", target: "PDF", family: .document, isPopular: true),
        .init(id: "xlsx-pdf", source: "XLSX", target: "PDF", family: .document, isPopular: false),
        .init(id: "txt-docx", source: "TXT", target: "DOCX", family: .document, isPopular: false),
        .init(id: "mp3-wav", source: "MP3", target: "WAV", family: .audio, isPopular: true),
        .init(id: "wav-mp3", source: "WAV", target: "MP3", family: .audio, isPopular: false),
        .init(id: "webm-mp4", source: "WebM", target: "MP4", family: .video, isPopular: true)
    ]
}

enum ConversionStatus: Equatable {
    case idle
    case uploading
    case queued
    case processing
    case completed(URL)
    case failed(String)

    var message: String? {
        switch self {
        case .idle:
            nil
        case .uploading:
            "Uploading securely…"
        case .queued:
            "Conversion queued…"
        case .processing:
            "Converting your file…"
        case .completed:
            "Your converted file is ready."
        case let .failed(message):
            message
        }
    }

    var isRunning: Bool {
        switch self {
        case .uploading, .queued, .processing:
            true
        default:
            false
        }
    }
}

struct ConversionAPI {
    private struct UploadRequest: Encodable {
        let filename: String
        let contentType: String

        enum CodingKeys: String, CodingKey {
            case filename
            case contentType = "content_type"
        }
    }

    private struct UploadResponse: Decodable {
        let objectKey: String
        let uploadURL: URL
        let contentType: String

        enum CodingKeys: String, CodingKey {
            case objectKey = "object_key"
            case uploadURL = "upload_url"
            case contentType = "content_type"
        }
    }

    private struct QueueRequest: Encodable {
        let sourceFormat: String
        let targetFormat: String
        let inputKey: String

        enum CodingKeys: String, CodingKey {
            case sourceFormat = "source_format"
            case targetFormat = "target_format"
            case inputKey = "input_key"
        }
    }

    private struct QueueResponse: Decodable {
        let conversionID: String

        enum CodingKeys: String, CodingKey {
            case conversionID = "conversion_id"
        }
    }

    private struct StatusResponse: Decodable {
        let status: String
        let message: String?
        let downloadURL: URL?

        enum CodingKeys: String, CodingKey {
            case status
            case message
            case downloadURL = "download_url"
        }
    }

    private struct ErrorResponse: Decodable {
        let error: String?
    }

    private let session: URLSession
    private let baseURL: URL

    init(session: URLSession = .shared, bundle: Bundle = .main) throws {
        let configuredURL = bundle.object(forInfoDictionaryKey: "ConvertixAPIBaseURL") as? String
        let value = configuredURL?.trimmingCharacters(in: .whitespacesAndNewlines)

        guard let value, !value.isEmpty, let url = URL(string: value) else {
            throw ConversionAPIError.configurationMissing
        }

        self.session = session
        baseURL = url
    }

    func convert(
        fileURL: URL,
        route: ConversionRoute,
        onStatus: @escaping @MainActor (ConversionStatus) -> Void
    ) async throws -> URL {
        let sourceFormat = route.source.lowercased()
        let targetFormat = route.target.lowercased()
        try validate(fileURL: fileURL, sourceFormat: sourceFormat)

        await onStatus(.uploading)
        let contentType = UTType(filenameExtension: fileURL.pathExtension)?.preferredMIMEType
            ?? "application/octet-stream"
        let upload: UploadResponse = try await sendJSON(
            UploadRequest(filename: fileURL.lastPathComponent, contentType: contentType),
            to: endpoint("uploads")
        )

        var uploadRequest = URLRequest(url: upload.uploadURL)
        uploadRequest.httpMethod = "PUT"
        uploadRequest.setValue(upload.contentType, forHTTPHeaderField: "Content-Type")
        let (_, uploadHTTPResponse) = try await session.upload(for: uploadRequest, fromFile: fileURL)
        try validate(uploadHTTPResponse)

        await onStatus(.queued)
        let queued: QueueResponse = try await sendJSON(
            QueueRequest(
                sourceFormat: sourceFormat,
                targetFormat: targetFormat,
                inputKey: upload.objectKey
            ),
            to: endpoint("conversions")
        )

        let deadline = Date().addingTimeInterval(15 * 60)
        while Date() < deadline {
            try await Task.sleep(for: .seconds(3))
            let status: StatusResponse

            do {
                status = try await get(endpoint("conversions/\(queued.conversionID)"))
            } catch let error as ConversionAPIError where error.isRetryable {
                continue
            }

            switch status.status {
            case "processing":
                await onStatus(.processing)
            case "completed":
                guard let downloadURL = status.downloadURL else {
                    throw ConversionAPIError.invalidResponse
                }
                await onStatus(.completed(downloadURL))
                return downloadURL
            case "failed":
                throw ConversionAPIError.conversionFailed(
                    status.message ?? "Convertix couldn’t convert this file."
                )
            default:
                throw ConversionAPIError.invalidResponse
            }
        }

        throw ConversionAPIError.timedOut
    }

    private func validate(fileURL: URL, sourceFormat: String) throws {
        let extensionFormat = fileURL.pathExtension.lowercased()
        let acceptedExtensions = sourceFormat == "jpg" ? ["jpg", "jpeg"] : [sourceFormat]
        guard acceptedExtensions.contains(extensionFormat) else {
            throw ConversionAPIError.formatMismatch(expected: sourceFormat.uppercased())
        }

        if let size = try fileURL.resourceValues(forKeys: [.fileSizeKey]).fileSize,
           size > 100 * 1024 * 1024 {
            throw ConversionAPIError.fileTooLarge
        }
    }

    private func endpoint(_ path: String) -> URL {
        baseURL.appending(path: path)
    }

    private func sendJSON<Request: Encodable, Response: Decodable>(
        _ body: Request,
        to url: URL
    ) async throws -> Response {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        return try await perform(request)
    }

    private func get<Response: Decodable>(_ url: URL) async throws -> Response {
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        return try await perform(request)
    }

    private func perform<Response: Decodable>(_ request: URLRequest) async throws -> Response {
        let (data, response) = try await session.data(for: request)
        try validate(response, body: data)

        do {
            return try JSONDecoder().decode(Response.self, from: data)
        } catch {
            throw ConversionAPIError.invalidResponse
        }
    }

    private func validate(_ response: URLResponse, body: Data = Data()) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ConversionAPIError.invalidResponse
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            let code = try? JSONDecoder().decode(ErrorResponse.self, from: body).error
            throw ConversionAPIError.server(status: httpResponse.statusCode, code: code)
        }
    }
}

enum ConversionAPIError: LocalizedError {
    case configurationMissing
    case conversionFailed(String)
    case fileTooLarge
    case formatMismatch(expected: String)
    case invalidResponse
    case server(status: Int, code: String?)
    case timedOut

    var isRetryable: Bool {
        if case let .server(status, _) = self {
            return status == 429 || status >= 500
        }
        return false
    }

    var errorDescription: String? {
        switch self {
        case .configurationMissing:
            "The conversion service isn’t configured. Set ConvertixAPIBaseURL in the app’s Info.plist."
        case let .conversionFailed(message):
            message
        case .fileTooLarge:
            "Choose a file smaller than 100 MB."
        case let .formatMismatch(expected):
            "Choose a \(expected) file or select the matching source format."
        case .invalidResponse:
            "The conversion service returned an unexpected response. Try again."
        case let .server(status, code):
            "The conversion service couldn’t complete the request (\(code ?? "HTTP \(status)"))."
        case .timedOut:
            "This conversion has taken longer than 15 minutes. Try again."
        }
    }
}

struct RecentConversion: Identifiable {
    let id: String
    let fileName: String
    let route: ConversionRoute
    let date: Date
    let status: Status

    enum Status: Equatable {
        case complete
        case failed
    }

    static let samples: [RecentConversion] = [
        .init(id: "holiday-photo", fileName: "holiday-photo.heic", route: ConversionRoute.catalog[0], date: .now.addingTimeInterval(-840), status: .complete),
        .init(id: "project-notes", fileName: "project-notes.txt", route: ConversionRoute.catalog[7], date: .now.addingTimeInterval(-86400), status: .complete)
    ]
}

#if os(iOS) && canImport(ActivityKit)
@available(iOS 16.1, *)
struct ConversionActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var progress: Double
        var stage: String
        var estimatedCompletion: Date?
    }

    var conversionID: String
    var fileName: String
    var sourceFormat: String
    var targetFormat: String
}
#endif

struct ContentView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var selection: AppSection? = .convert

    var body: some View {
        if horizontalSizeClass == .compact {
            CompactRootView()
        } else {
            NavigationSplitView {
                SidebarView(selection: $selection)
            } detail: {
                NavigationStack {
                    DestinationView(section: selection ?? .convert)
                }
            }
            .navigationSplitViewStyle(.balanced)
            .tint(ConvertixTheme.cobalt)
        }
    }
}

struct CompactRootView: View {
    var body: some View {
        TabView {
            NavigationStack {
                ConvertHomeView()
            }
            .tabItem {
                Label("Convert", systemImage: "arrow.trianglehead.2.clockwise.rotate.90")
            }

            NavigationStack {
                ToolsView()
            }
            .tabItem {
                Label("Tools", systemImage: "square.grid.2x2")
            }

            NavigationStack {
                ActivityHistoryView()
            }
            .tabItem {
                Label("Activity", systemImage: "clock")
            }

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
        .tint(ConvertixTheme.cobalt)
    }
}

struct SidebarView: View {
    @Binding var selection: AppSection?

    var body: some View {
        List(AppSection.allCases, selection: $selection) { section in
            Label(section.title, systemImage: section.systemImage)
                .tag(section)
        }
        .navigationTitle("Convertix")
        .safeAreaInset(edge: .top) {
            BrandLockup()
                .padding(.horizontal)
                .padding(.vertical, 8)
        }
    }
}

struct DestinationView: View {
    let section: AppSection

    var body: some View {
        switch section {
        case .convert:
            ConvertHomeView()
        case .tools:
            ToolsView()
        case .activity:
            ActivityHistoryView()
        case .settings:
            SettingsView()
        }
    }
}

struct BrandLockup: View {
    var body: some View {
        HStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(ConvertixTheme.cobalt.gradient)
                Image(systemName: "arrow.left.arrow.right")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(.white)
            }
            .frame(width: 34, height: 34)

            Text("Convertix")
                .font(.title3.weight(.bold))
                .foregroundStyle(ConvertixTheme.ink)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Convertix")
    }
}

#Preview("iPhone") {
    ContentView()
}

#Preview("iPad", traits: .fixedLayout(width: 1180, height: 820)) {
    ContentView()
}

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

struct ConverterPanel: View {
    @Binding var selectedRoute: ConversionRoute
    let selectedFileName: String?
    let conversionStatus: ConversionStatus
    let chooseFile: () -> Void
    let clearFile: () -> Void
    let startConversion: () -> Void

    var body: some View {
        VStack(spacing: 18) {
            FileDropArea(fileName: selectedFileName, chooseFile: chooseFile, clearFile: clearFile)

            HStack(spacing: 12) {
                FormatStep(number: 1, label: "From", format: selectedRoute.source, color: .orange)

                Image(systemName: "arrow.right")
                    .font(.headline)
                    .foregroundStyle(.tertiary)
                    .accessibilityHidden(true)

                Menu {
                    ForEach(ConversionRoute.catalog) { route in
                        Button(route.title) { selectedRoute = route }
                    }
                } label: {
                    FormatStep(number: 2, label: "Convert to", format: selectedRoute.target, color: ConvertixTheme.cobalt)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Output format, \(selectedRoute.target)")
            }

            Button(action: startConversion) {
                Label(buttonTitle, systemImage: conversionStatus.isRunning ? "hourglass" : "sparkles")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .tint(ConvertixTheme.cobalt)
            .disabled(selectedFileName == nil || conversionStatus.isRunning)

            if conversionStatus.isRunning {
                ProgressView(conversionStatus.message ?? "Converting…")
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else if case let .completed(downloadURL) = conversionStatus {
                Link(destination: downloadURL) {
                    Label("Download converted file", systemImage: "arrow.down.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            } else if case let .failed(message) = conversionStatus {
                Label(message, systemImage: "exclamationmark.triangle.fill")
                    .font(.callout)
                    .foregroundStyle(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(20)
        .convertixGlassPanel(cornerRadius: 26)
    }

    private var buttonTitle: String {
        if selectedFileName == nil {
            return "Choose a file first"
        }
        if conversionStatus.isRunning {
            return conversionStatus.message ?? "Converting…"
        }
        return "Start conversion"
    }
}

struct FileDropArea: View {
    let fileName: String?
    let chooseFile: () -> Void
    let clearFile: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: fileName == nil ? "doc.badge.plus" : "doc.fill")
                .font(.system(size: 34, weight: .semibold))
                .foregroundStyle(ConvertixTheme.cobalt)
                .frame(width: 68, height: 68)
                .background(ConvertixTheme.cobalt.opacity(0.1), in: RoundedRectangle(cornerRadius: 18))

            Text(fileName ?? "Choose a file to convert")
                .font(.title3.weight(.semibold))
                .lineLimit(1)

            Text(fileName == nil ? "Browse Files or select a recent document" : "Ready to convert · Up to 100 MB")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            HStack {
                Button(fileName == nil ? "Browse Files" : "Choose another", systemImage: "folder") {
                    chooseFile()
                }
                .buttonStyle(.bordered)

                if fileName != nil {
                    Button("Remove", systemImage: "xmark", role: .destructive) {
                        clearFile()
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 28)
        .padding(.horizontal)
        .background(Color.white.opacity(0.52), in: RoundedRectangle(cornerRadius: 20))
        .overlay {
            RoundedRectangle(cornerRadius: 20)
                .stroke(ConvertixTheme.cobalt.opacity(0.35), style: StrokeStyle(lineWidth: 1.5, dash: [7]))
        }
    }
}

struct FormatStep: View {
    let number: Int
    let label: String
    let format: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Text("\(number)")
                .font(.caption.bold())
                .foregroundStyle(.white)
                .frame(width: 28, height: 28)
                .background(color, in: Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(format)
                    .font(.headline)
                    .foregroundStyle(ConvertixTheme.ink)
            }

            Spacer(minLength: 0)
        }
        .padding(14)
        .frame(maxWidth: .infinity)
        .background(.white.opacity(0.62), in: RoundedRectangle(cornerRadius: 16))
    }
}

struct ConversionNotes: View {
    var body: some View {
        ViewThatFits {
            HStack(spacing: 24) { notes }
            VStack(alignment: .leading, spacing: 10) { notes }
        }
        .font(.footnote.weight(.medium))
        .foregroundStyle(.secondary)
    }

    @ViewBuilder
    private var notes: some View {
        Label("No account needed", systemImage: "person.crop.circle.badge.checkmark")
        Label("100 MB file limit", systemImage: "externaldrive")
        Label("Uploads only when you start", systemImage: "lock.shield")
    }
}

struct PopularConversions: View {
    let routes: [ConversionRoute]
    @Binding var selectedRoute: ConversionRoute

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Common conversions")
                .font(.title2.bold())
            Text("Start with one of the most-used format pairs.")
                .foregroundStyle(.secondary)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 210), spacing: 12)], spacing: 12) {
                ForEach(routes) { route in
                    Button {
                        selectedRoute = route
                    } label: {
                        HStack {
                            Image(systemName: route.family.systemImage)
                                .foregroundStyle(ConvertixTheme.cobalt)
                            Text(route.title)
                                .fontWeight(.semibold)
                            Spacer()
                            Image(systemName: "arrow.up.right")
                                .foregroundStyle(.tertiary)
                        }
                        .padding()
                        .background(.white.opacity(0.68), in: RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct ToolsView: View {
    var body: some View {
        ZStack {
            ConvertixBackdrop()
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Tools")
                        .font(.largeTitle.bold())
                    Text("Focused utilities for the jobs around conversion.")
                        .font(.title3)
                        .foregroundStyle(.secondary)

                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 260), spacing: 16)], spacing: 16) {
                        ToolCard(title: "Compress images", detail: "Batch-compress up to 30 images on your device.", symbol: "photo.stack", tint: .green)
                        ToolCard(title: "Compress PDF", detail: "Reduce a PDF’s size while keeping it readable.", symbol: "doc.zipper", tint: .red)
                        ToolCard(title: "Merge PDFs", detail: "Reorder documents and combine them into one PDF.", symbol: "square.stack.3d.up", tint: .purple)
                        ToolCard(title: "Optimize SVG", detail: "Clean and reduce vector artwork for the web.", symbol: "scribble.variable", tint: .orange)
                    }
                }
                .frame(maxWidth: 900, alignment: .leading)
                .padding(24)
                .frame(maxWidth: .infinity)
            }
        }
        .navigationTitle("Tools")
    }
}

struct ToolCard: View {
    let title: String
    let detail: String
    let symbol: String
    let tint: Color

    var body: some View {
        Button {} label: {
            VStack(alignment: .leading, spacing: 14) {
                Image(systemName: symbol)
                    .font(.title2)
                    .foregroundStyle(tint)
                    .frame(width: 48, height: 48)
                    .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))

                Text(title)
                    .font(.headline)
                    .foregroundStyle(ConvertixTheme.ink)
                Text(detail)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.leading)
                Label("Open tool", systemImage: "arrow.right")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(ConvertixTheme.cobalt)
            }
            .frame(maxWidth: .infinity, minHeight: 170, alignment: .topLeading)
            .padding(20)
            .convertixGlassPanel(cornerRadius: 22)
        }
        .buttonStyle(.plain)
    }
}

struct ActivityHistoryView: View {
    var body: some View {
        List {
            Section {
                ForEach(RecentConversion.samples) { conversion in
                    RecentConversionRow(
                        fileName: conversion.fileName,
                        routeTitle: conversion.route.title,
                        date: conversion.date,
                        isComplete: conversion.status == .complete
                    )
                }
            } header: {
                Text("Recent")
            } footer: {
                Text("Conversion progress is ready to be surfaced through a Live Activity when the processing service is connected.")
            }
        }
        .navigationTitle("Activity")
    }
}

struct RecentConversionRow: View {
    let fileName: String
    let routeTitle: String
    let date: Date
    let isComplete: Bool

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: isComplete ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                .font(.title2)
                .foregroundStyle(isComplete ? .green : .red)

            VStack(alignment: .leading, spacing: 3) {
                Text(fileName)
                    .font(.headline)
                    .lineLimit(1)
                Text(routeTitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(date, style: .relative)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 5)
    }
}

struct SettingsView: View {
    @AppStorage("deleteOriginalAfterConversion") private var deleteOriginalAfterConversion = false
    @AppStorage("notifyWhenComplete") private var notifyWhenComplete = true

    var body: some View {
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
                LabeledContent("Iteration", value: "Native foundation")
            }
        }
        .navigationTitle("Settings")
    }
}
