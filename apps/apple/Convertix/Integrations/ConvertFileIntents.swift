import AppIntents
import Foundation
import UniformTypeIdentifiers

enum IntentConversionOutput: String, AppEnum {
    case pdf = "pdf"
    case docx = "docx"
    case jpeg = "jpg"
    case png = "png"
    case webp = "webp"
    case mp3 = "mp3"
    case wav = "wav"
    case mp4 = "mp4"
    case webm = "webm"

    static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Conversion Format")
    static let caseDisplayRepresentations: [IntentConversionOutput: DisplayRepresentation] = [
        .pdf: "PDF",
        .docx: "DOCX",
        .jpeg: "JPEG",
        .png: "PNG",
        .webp: "WebP",
        .mp3: "MP3",
        .wav: "WAV",
        .mp4: "MP4",
        .webm: "WebM"
    ]
}

struct ConvertFileIntent: AppIntent {
    static let title: LocalizedStringResource = "Convert File"
    static let description = IntentDescription(
        "Converts a supported file locally when possible, or with Convertix cloud conversion."
    )

    @Parameter(
        title: "File",
        supportedTypeIdentifiers: ["public.data"],
        requestValueDialog: "Which file would you like to convert?"
    )
    var file: IntentFile

    @Parameter(
        title: "Output Format",
        requestDisambiguationDialog: "Which output format?"
    )
    var outputFormat: IntentConversionOutput

    static var parameterSummary: some ParameterSummary {
        Summary("Convert \(\.$file) to \(\.$outputFormat)")
    }

    func perform() async throws -> some ReturnsValue<IntentFile> & ProvidesDialog {
        try await ConversionIntentAccount.requireSignedIn()
        let inputURL = try materializedInput()
        let shouldRemoveInput = file.fileURL == nil
        defer {
            if shouldRemoveInput {
                try? FileManager.default.removeItem(at: inputURL)
            }
        }

        let inputFormat = inputURL.pathExtension.lowercased()
        guard let route = ConversionRoute.routes(forSourceExtension: inputFormat).first(
            where: { $0.target.caseInsensitiveCompare(outputFormat.rawValue) == .orderedSame }
        ) else {
            throw ConvertFileIntentError.unsupportedConversion
        }

        let localEngine = LocalConversionEngine()
        let outputURL: URL
        let historyID: UUID
        let executionDescription: LocalizedStringResource

        if localEngine.canConvert(
            inputFormat: inputFormat,
            outputFormat: outputFormat.rawValue
        ) {
            outputURL = try await localEngine.convert(
                inputURL: inputURL,
                outputFormat: outputFormat.rawValue,
                quality: 0.82,
                removeMetadata: false
            )
            historyID = UUID()
            executionDescription = "Converted on this device."
        } else {
            let configuration: AppConfiguration
            do {
                configuration = try AppConfiguration()
            } catch {
                throw ConvertFileIntentError.cloudUnavailable
            }

            let api = ConversionAPI(configuration: configuration)
            let result = try await api.convert(
                fileURL: inputURL,
                route: route
            ) { _ in }
            outputURL = try await api.download(result)
            historyID = result.conversionID
            executionDescription = "Converted securely using Convertix cloud conversion."
        }

        try await ConversionIntentAccount.record(
            conversionID: historyID,
            inputURL: inputURL,
            outputURL: outputURL,
            sourceFormat: inputFormat,
            targetFormat: outputFormat.rawValue
        )

        let type = UTType(filenameExtension: outputURL.pathExtension) ?? .data
        let output = IntentFile(
            fileURL: outputURL,
            filename: outputURL.lastPathComponent,
            type: type
        )
        return .result(value: output, dialog: IntentDialog(executionDescription))
    }

    private func materializedInput() throws -> URL {
        if let fileURL = file.fileURL {
            return fileURL
        }

        let safeName = file.filename.isEmpty ? "Convertix-Input" : file.filename
        let url = FileManager.default.temporaryDirectory.appending(component: safeName)
        try file.data.write(to: url, options: [.atomic])
        return url
    }
}

struct OptimizeSVGIntent: AppIntent {
    static let title: LocalizedStringResource = "Optimise SVG"
    static let description = IntentDescription(
        "Removes comments and unnecessary inter-tag whitespace entirely on this device."
    )

    @Parameter(
        title: "SVG File",
        supportedTypeIdentifiers: ["public.svg-image", "public.xml"],
        requestValueDialog: "Which SVG would you like to optimise?"
    )
    var file: IntentFile

    static var parameterSummary: some ParameterSummary {
        Summary("Optimise \(\.$file)")
    }

    func perform() async throws -> some ReturnsValue<IntentFile> & ProvidesDialog {
        try await ConversionIntentAccount.requireSignedIn()
        let inputURL = try materializedInput()
        let shouldRemoveInput = file.fileURL == nil
        defer {
            if shouldRemoveInput {
                try? FileManager.default.removeItem(at: inputURL)
            }
        }

        let outputURL = try OnDeviceToolProcessor.optimizeSVG(inputURL)
        try await ConversionIntentAccount.record(
            conversionID: UUID(),
            inputURL: inputURL,
            outputURL: outputURL,
            sourceFormat: "svg",
            targetFormat: "svg"
        )
        return .result(
            value: IntentFile(
                fileURL: outputURL,
                filename: outputURL.lastPathComponent,
                type: UTType(filenameExtension: "svg") ?? .xml
            ),
            dialog: "The SVG was optimised on this device."
        )
    }

    private func materializedInput() throws -> URL {
        if let fileURL = file.fileURL {
            return fileURL
        }
        let filename = file.filename.isEmpty ? "Convertix-Input.svg" : file.filename
        let url = FileManager.default.temporaryDirectory.appending(component: filename)
        try file.data.write(to: url, options: [.atomic])
        return url
    }
}

enum ConvertFileIntentError: Error, CustomLocalizedStringResourceConvertible {
    case unsupportedConversion
    case cloudUnavailable

    var localizedStringResource: LocalizedStringResource {
        switch self {
        case .unsupportedConversion:
            "Convertix doesn’t support that input and output format combination."
        case .cloudUnavailable:
            "Convertix cloud conversion isn’t configured in this copy of the app."
        }
    }
}

enum ConversionIntentAccount {
    static func requireSignedIn() async throws {
        let configuration: AppConfiguration
        do {
            configuration = try AppConfiguration()
        } catch {
            throw ConversionIntentAccountError.signInRequired
        }

        do {
            _ = try await SupabaseService(configuration: configuration).currentUser()
        } catch {
            throw ConversionIntentAccountError.signInRequired
        }
    }

    static func record(
        conversionID: UUID,
        inputURL: URL,
        outputURL: URL,
        sourceFormat: String,
        targetFormat: String
    ) async throws {
        let configuration = try AppConfiguration()
        let service = SupabaseService(configuration: configuration)
        let user = try await service.currentUser()
        let inputSize = try? inputURL.resourceValues(forKeys: [.fileSizeKey]).fileSize.map(Int64.init)
        let outputSize = try? outputURL.resourceValues(forKeys: [.fileSizeKey]).fileSize.map(Int64.init)
        try await service.saveHistory(
            ConversionHistoryWrite(
                userID: user.id,
                conversionID: conversionID,
                originalFilename: inputURL.lastPathComponent,
                sourceFormat: sourceFormat,
                targetFormat: targetFormat,
                status: "completed",
                inputSize: inputSize ?? nil,
                outputSize: outputSize ?? nil,
                outputKey: nil,
                completedAt: .now
            )
        )
    }
}

enum ConversionIntentAccountError: Error, CustomLocalizedStringResourceConvertible {
    case signInRequired

    var localizedStringResource: LocalizedStringResource {
        "Sign in to your Convertix account in the app before converting files."
    }
}
