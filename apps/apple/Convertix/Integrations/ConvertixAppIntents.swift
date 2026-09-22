import AppIntents
import Foundation
import UniformTypeIdentifiers

enum IntentOutputFormat: String, AppEnum {
    case jpeg = "jpeg"
    case png = "png"
    case heic = "heic"
    case webp = "webp"

    static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Output Format")
    static let caseDisplayRepresentations: [IntentOutputFormat: DisplayRepresentation] = [
        .jpeg: "JPEG",
        .png: "PNG",
        .heic: "HEIC",
        .webp: "WebP"
    ]

    var fileExtension: String {
        rawValue == "jpeg" ? "jpg" : rawValue
    }

    var contentType: UTType {
        switch self {
        case .jpeg: .jpeg
        case .png: .png
        case .heic: .heic
        case .webp: UTType(filenameExtension: "webp") ?? .image
        }
    }
}

struct ConvertImageIntent: AppIntent {
    static let title: LocalizedStringResource = "Convert Image"
    static let description = IntentDescription(
        "Converts an image on this device and returns the converted file."
    )

    @Parameter(
        title: "Image",
        supportedTypeIdentifiers: ["public.image"],
        requestValueDialog: "Which image would you like to convert?"
    )
    var image: IntentFile

    @Parameter(
        title: "Output Format",
        default: .jpeg,
        requestDisambiguationDialog: "Which output format?"
    )
    var outputFormat: IntentOutputFormat

    @Parameter(
        title: "Quality",
        description: "A value from 0.1 to 1.0.",
        default: 0.82,
        inclusiveRange: (0.1, 1.0)
    )
    var quality: Double

    @Parameter(
        title: "Remove Metadata",
        default: false
    )
    var removeMetadata: Bool

    static var parameterSummary: some ParameterSummary {
        Summary("Convert \(\.$image) to \(\.$outputFormat)") {
            \.$quality
            \.$removeMetadata
        }
    }

    func perform() async throws -> some ReturnsValue<IntentFile> & ProvidesDialog {
        let output = try await convertedFile()
        return .result(
            value: output,
            dialog: "Your converted image is ready."
        )
    }
}

struct ConvertToJPEGIntent: AppIntent {
    static let title: LocalizedStringResource = "Convert to JPEG"
    static let description = IntentDescription(
        "Converts an image to JPEG entirely on this device."
    )

    @Parameter(
        title: "Image",
        supportedTypeIdentifiers: ["public.image"],
        requestValueDialog: "Which image would you like to convert?"
    )
    var image: IntentFile

    static var parameterSummary: some ParameterSummary {
        Summary("Convert \(\.$image) to JPEG")
    }

    func perform() async throws -> some ReturnsValue<IntentFile> {
        let intent = ConvertImageIntent()
        intent.image = image
        intent.outputFormat = .jpeg
        intent.quality = 0.82
        intent.removeMetadata = false
        return .result(value: try await intent.convertedFile())
    }
}

struct ConvertToPNGIntent: AppIntent {
    static let title: LocalizedStringResource = "Convert to PNG"
    static let description = IntentDescription(
        "Converts an image to PNG entirely on this device."
    )

    @Parameter(
        title: "Image",
        supportedTypeIdentifiers: ["public.image"],
        requestValueDialog: "Which image would you like to convert?"
    )
    var image: IntentFile

    static var parameterSummary: some ParameterSummary {
        Summary("Convert \(\.$image) to PNG")
    }

    func perform() async throws -> some ReturnsValue<IntentFile> {
        let intent = ConvertImageIntent()
        intent.image = image
        intent.outputFormat = .png
        intent.quality = 1
        intent.removeMetadata = false
        return .result(value: try await intent.convertedFile())
    }
}

struct ConvertToWebPIntent: AppIntent {
    static let title: LocalizedStringResource = "Convert to WebP"
    static let description = IntentDescription(
        "Converts an image to WebP when this device provides a WebP encoder."
    )

    @Parameter(
        title: "Image",
        supportedTypeIdentifiers: ["public.image"],
        requestValueDialog: "Which image would you like to convert?"
    )
    var image: IntentFile

    static var parameterSummary: some ParameterSummary {
        Summary("Convert \(\.$image) to WebP")
    }

    func perform() async throws -> some ReturnsValue<IntentFile> {
        let intent = ConvertImageIntent()
        intent.image = image
        intent.outputFormat = .webp
        intent.quality = 0.82
        intent.removeMetadata = false
        return .result(value: try await intent.convertedFile())
    }
}

private extension ConvertImageIntent {
    func convertedFile() async throws -> IntentFile {
        try await ConversionIntentAccount.requireSignedIn()
        if let inputURL = image.fileURL {
            return try await convert(inputURL)
        }

        let inputURL = FileManager.default.temporaryDirectory.appending(
            component: image.filename
        )
        try image.data.write(to: inputURL, options: [.atomic])
        defer { try? FileManager.default.removeItem(at: inputURL) }
        return try await convert(inputURL)
    }

    func convert(_ inputURL: URL) async throws -> IntentFile {
        let outputURL = try await LocalConversionEngine().convert(
            inputURL: inputURL,
            outputFormat: outputFormat.fileExtension,
            quality: quality,
            removeMetadata: removeMetadata
        )
        try await ConversionIntentAccount.record(
            conversionID: UUID(),
            inputURL: inputURL,
            outputURL: outputURL,
            sourceFormat: inputURL.pathExtension.lowercased(),
            targetFormat: outputFormat.fileExtension
        )
        return IntentFile(
            fileURL: outputURL,
            filename: outputURL.lastPathComponent,
            type: outputFormat.contentType
        )
    }
}

enum ConversionIntentError: Error, CustomLocalizedStringResourceConvertible {
    case unsupportedInput
    case encoderUnavailable

    var localizedStringResource: LocalizedStringResource {
        switch self {
        case .unsupportedInput:
            "Convertix couldn’t read that image format."
        case .encoderUnavailable:
            "That output format isn’t available on this device."
        }
    }
}

struct ConvertixShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: ConvertFileIntent(),
            phrases: [
                "Convert a file with \(.applicationName)"
            ],
            shortTitle: "Convert File",
            systemImageName: "doc.badge.arrow.up"
        )
        AppShortcut(
            intent: OptimizeSVGIntent(),
            phrases: [
                "Optimise an SVG with \(.applicationName)"
            ],
            shortTitle: "Optimise SVG",
            systemImageName: "scribble.variable"
        )
        AppShortcut(
            intent: ConvertImageIntent(),
            phrases: [
                "Convert an image with \(.applicationName)",
                "Convert a photo with \(.applicationName)"
            ],
            shortTitle: "Convert Image",
            systemImageName: "photo.badge.arrow.down"
        )
        AppShortcut(
            intent: ConvertToJPEGIntent(),
            phrases: [
                "Convert an image to JPEG with \(.applicationName)"
            ],
            shortTitle: "Convert to JPEG",
            systemImageName: "photo"
        )
        AppShortcut(
            intent: ConvertToPNGIntent(),
            phrases: [
                "Convert an image to PNG with \(.applicationName)"
            ],
            shortTitle: "Convert to PNG",
            systemImageName: "photo"
        )
        AppShortcut(
            intent: ConvertToWebPIntent(),
            phrases: [
                "Convert an image to WebP with \(.applicationName)"
            ],
            shortTitle: "Convert to WebP",
            systemImageName: "photo"
        )
    }
}
