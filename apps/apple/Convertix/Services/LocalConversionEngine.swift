import Foundation
import ImageIO
import UniformTypeIdentifiers

enum LocalConversionError: LocalizedError {
    case unsupported
    case unreadableInput
    case cannotCreateOutput

    var errorDescription: String? {
        switch self {
        case .unsupported:
            "This conversion isn’t available on this device."
        case .unreadableInput:
            "Convertix couldn’t read the selected file."
        case .cannotCreateOutput:
            "Convertix couldn’t create the converted file."
        }
    }
}

struct LocalConversionEngine: Sendable {
    private static let supportedImageFormats: Set<String> = [
        "jpg", "jpeg", "png", "heic", "heif", "webp"
    ]

    func canConvert(inputFormat: String, outputFormat: String) -> Bool {
        let input = inputFormat.lowercased()
        let output = outputFormat.lowercased()
        guard Self.supportedImageFormats.contains(input),
              Self.supportedImageFormats.contains(output),
              input != output,
              let destinationType = contentType(for: output) else {
            return false
        }

        let supportedDestinations = CGImageDestinationCopyTypeIdentifiers() as? [String] ?? []
        return supportedDestinations.contains(destinationType.identifier)
    }

    func convert(
        inputURL: URL,
        outputFormat: String,
        quality: Double?,
        removeMetadata: Bool
    ) async throws -> URL {
        let inputFormat = inputURL.pathExtension.lowercased()
        guard canConvert(inputFormat: inputFormat, outputFormat: outputFormat),
              let destinationType = contentType(for: outputFormat) else {
            throw LocalConversionError.unsupported
        }

        return try await Task.detached(priority: .userInitiated) {
            guard let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil) else {
                throw LocalConversionError.unreadableInput
            }

            let destinationURL = try Self.makeTemporaryOutputURL(
                inputURL: inputURL,
                outputFormat: outputFormat
            )
            guard let destination = CGImageDestinationCreateWithURL(
                destinationURL as CFURL,
                destinationType.identifier as CFString,
                CGImageSourceGetCount(source),
                nil
            ) else {
                throw LocalConversionError.cannotCreateOutput
            }

            var properties: [CFString: Any] = [:]
            if let quality {
                properties[kCGImageDestinationLossyCompressionQuality] = min(max(quality, 0), 1)
            }

            for index in 0..<CGImageSourceGetCount(source) {
                if removeMetadata,
                   let image = CGImageSourceCreateImageAtIndex(source, index, nil) {
                    CGImageDestinationAddImage(destination, image, properties as CFDictionary)
                } else {
                    CGImageDestinationAddImageFromSource(
                        destination,
                        source,
                        index,
                        properties as CFDictionary
                    )
                }
            }

            guard CGImageDestinationFinalize(destination) else {
                try? FileManager.default.removeItem(at: destinationURL)
                throw LocalConversionError.cannotCreateOutput
            }
            return destinationURL
        }.value
    }

    private func contentType(for format: String) -> UTType? {
        switch format.lowercased() {
        case "jpg", "jpeg":
            .jpeg
        case "png":
            .png
        case "heic", "heif":
            .heic
        case "webp":
            UTType(filenameExtension: "webp")
        default:
            nil
        }
    }

    private static func makeTemporaryOutputURL(
        inputURL: URL,
        outputFormat: String
    ) throws -> URL {
        let directory = FileManager.default.temporaryDirectory
            .appending(component: "Convertix", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(
            at: directory,
            withIntermediateDirectories: true
        )

        let stem = inputURL.deletingPathExtension().lastPathComponent
        let fileExtension = outputFormat.lowercased() == "jpeg"
            ? "jpg"
            : outputFormat.lowercased()
        return directory.appending(
            component: "\(stem)-converted-\(UUID().uuidString.prefix(6)).\(fileExtension)"
        )
    }
}
