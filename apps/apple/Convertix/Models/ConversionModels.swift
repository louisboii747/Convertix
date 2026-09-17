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
        .init(
            id: "holiday-photo",
            fileName: "holiday-photo.heic",
            route: ConversionRoute.catalog[0],
            date: .now.addingTimeInterval(-840),
            status: .complete
        ),
        .init(
            id: "project-notes",
            fileName: "project-notes.txt",
            route: ConversionRoute.catalog[7],
            date: .now.addingTimeInterval(-86400),
            status: .complete
        )
    ]
}
