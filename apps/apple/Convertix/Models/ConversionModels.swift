import Foundation

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

struct ConversionRoute: Identifiable, Hashable, Sendable {
    let id: String
    let source: String
    let target: String
    let family: FileFamily
    let isPopular: Bool

    var title: String { "\(source) to \(target)" }
}

extension ConversionRoute {
    static let catalog: [ConversionRoute] = [
        .init(id: "docx-pdf", source: "DOCX", target: "PDF", family: .document, isPopular: true),
        .init(id: "txt-pdf", source: "TXT", target: "PDF", family: .document, isPopular: true),
        .init(id: "txt-docx", source: "TXT", target: "DOCX", family: .document, isPopular: true),
        .init(id: "xlsx-pdf", source: "XLSX", target: "PDF", family: .document, isPopular: true),
        .init(id: "png-jpg", source: "PNG", target: "JPG", family: .image, isPopular: true),
        .init(id: "png-webp", source: "PNG", target: "WEBP", family: .image, isPopular: true),
        .init(id: "png-pdf", source: "PNG", target: "PDF", family: .image, isPopular: true),
        .init(id: "jpg-png", source: "JPG", target: "PNG", family: .image, isPopular: true),
        .init(id: "jpg-webp", source: "JPG", target: "WEBP", family: .image, isPopular: false),
        .init(id: "jpg-pdf", source: "JPG", target: "PDF", family: .image, isPopular: true),
        .init(id: "webp-png", source: "WEBP", target: "PNG", family: .image, isPopular: true),
        .init(id: "webp-jpg", source: "WEBP", target: "JPG", family: .image, isPopular: false),
        .init(id: "heic-jpg", source: "HEIC", target: "JPG", family: .image, isPopular: true),
        .init(id: "heic-png", source: "HEIC", target: "PNG", family: .image, isPopular: true),
        .init(id: "heic-webp", source: "HEIC", target: "WEBP", family: .image, isPopular: false),
        .init(id: "heif-jpg", source: "HEIF", target: "JPG", family: .image, isPopular: false),
        .init(id: "heif-png", source: "HEIF", target: "PNG", family: .image, isPopular: false),
        .init(id: "heif-webp", source: "HEIF", target: "WEBP", family: .image, isPopular: false),
        .init(id: "svg-png", source: "SVG", target: "PNG", family: .image, isPopular: true),
        .init(id: "svg-jpg", source: "SVG", target: "JPG", family: .image, isPopular: true),
        .init(id: "svg-webp", source: "SVG", target: "WEBP", family: .image, isPopular: true),
        .init(id: "mp3-wav", source: "MP3", target: "WAV", family: .audio, isPopular: true),
        .init(id: "wav-mp3", source: "WAV", target: "MP3", family: .audio, isPopular: true),
        .init(id: "mp4-webm", source: "MP4", target: "WEBM", family: .video, isPopular: true),
        .init(id: "webm-mp4", source: "WEBM", target: "MP4", family: .video, isPopular: true)
    ]

    static func routes(forSourceExtension fileExtension: String) -> [ConversionRoute] {
        let normalized = fileExtension.lowercased()
        return catalog.filter { route in
            let source = route.source.lowercased()
            return source == normalized
                || (source == "jpg" && normalized == "jpeg")
        }
    }
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
