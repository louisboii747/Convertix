import Foundation

enum ConversionSource: String, Codable, CaseIterable, Sendable {
    case app
    case shareExtension
    case shortcut
    case widget
    case finder
    case menuBar
    case dragAndDrop
    case photos
    case camera
    case clipboard
    case quickAction
    case spotlight
    case handoff
}

enum ConversionExecution: String, Codable, CaseIterable, Sendable {
    case automatic
    case local
    case cloud
}

enum ConversionDestination: String, Codable, CaseIterable, Sendable {
    case askEveryTime
    case sameFolder
    case downloads
    case convertixFolder
    case shareAfterConversion
}

enum ConversionPhase: String, Codable, CaseIterable, Sendable {
    case queued
    case preparing
    case uploading
    case converting
    case downloading
    case saving
    case completed
    case failed
    case cancelled

    var isActive: Bool {
        switch self {
        case .preparing, .uploading, .converting, .downloading, .saving:
            true
        default:
            false
        }
    }

    var isFinished: Bool {
        switch self {
        case .completed, .failed, .cancelled:
            true
        default:
            false
        }
    }
}

struct ConversionPreset: Codable, Equatable, Identifiable, Sendable {
    let id: UUID
    var name: String
    var inputFormat: String?
    var outputFormat: String
    var quality: Double?
    var destination: ConversionDestination
    var executionPreference: ConversionExecution
    var removeMetadata: Bool

    init(
        id: UUID = UUID(),
        name: String,
        inputFormat: String? = nil,
        outputFormat: String,
        quality: Double? = nil,
        destination: ConversionDestination = .askEveryTime,
        executionPreference: ConversionExecution = .automatic,
        removeMetadata: Bool = false
    ) {
        self.id = id
        self.name = name
        self.inputFormat = inputFormat
        self.outputFormat = outputFormat
        self.quality = quality
        self.destination = destination
        self.executionPreference = executionPreference
        self.removeMetadata = removeMetadata
    }
}

struct ConversionRequest: Sendable {
    let inputURLs: [URL]
    let outputFormat: String
    let preset: ConversionPreset?
    let quality: Double?
    let destination: ConversionDestination
    let executionPreference: ConversionExecution
    let source: ConversionSource

    init(
        inputURLs: [URL],
        outputFormat: String,
        preset: ConversionPreset? = nil,
        quality: Double? = nil,
        destination: ConversionDestination = .askEveryTime,
        executionPreference: ConversionExecution = .automatic,
        source: ConversionSource = .app
    ) {
        self.inputURLs = inputURLs
        self.outputFormat = outputFormat.lowercased()
        self.preset = preset
        self.quality = quality
        self.destination = destination
        self.executionPreference = executionPreference
        self.source = source
    }
}

struct ClientConversion: Codable, Equatable, Identifiable, Sendable {
    let id: UUID
    let batchID: UUID?
    let inputFilename: String
    let inputURL: URL
    let inputFormat: String
    let outputFormat: String
    let source: ConversionSource
    let destination: ConversionDestination
    let executionPreference: ConversionExecution
    var execution: ConversionExecution?
    var phase: ConversionPhase
    var originalSize: Int64?
    var outputSize: Int64?
    var progress: Double?
    let creationDate: Date
    var completionDate: Date?
    var outputURL: URL?
    var backendConversionID: UUID?
    var errorDescription: String?
    var presetID: UUID?
    var quality: Double?
    var removeMetadata: Bool

    init(
        id: UUID = UUID(),
        batchID: UUID? = nil,
        inputURL: URL,
        outputFormat: String,
        source: ConversionSource,
        destination: ConversionDestination,
        executionPreference: ConversionExecution,
        presetID: UUID? = nil,
        quality: Double? = nil,
        removeMetadata: Bool = false
    ) {
        self.id = id
        self.batchID = batchID
        inputFilename = inputURL.lastPathComponent
        self.inputURL = inputURL
        inputFormat = inputURL.pathExtension.lowercased()
        self.outputFormat = outputFormat.lowercased()
        self.source = source
        self.destination = destination
        self.executionPreference = executionPreference
        phase = .queued
        creationDate = .now
        self.presetID = presetID
        self.quality = quality
        self.removeMetadata = removeMetadata
    }

    var route: ConversionRoute? {
        ConversionRoute.catalog.first {
            $0.source.caseInsensitiveCompare(inputFormat) == .orderedSame
                && $0.target.caseInsensitiveCompare(outputFormat) == .orderedSame
        } ?? ConversionRoute.catalog.first {
            inputFormat == "jpeg"
                && $0.source == "JPG"
                && $0.target.caseInsensitiveCompare(outputFormat) == .orderedSame
        }
    }
}

struct ConversionBatch: Identifiable, Equatable, Sendable {
    let id: UUID
    let jobs: [ClientConversion]

    var completedCount: Int {
        jobs.count { $0.phase == .completed }
    }

    var progress: Double {
        guard !jobs.isEmpty else { return 0 }
        let total = jobs.reduce(0.0) { partial, job in
            partial + (job.phase == .completed ? 1 : job.progress ?? 0)
        }
        return total / Double(jobs.count)
    }
}

struct ConversionStatistics: Codable, Equatable, Sendable {
    var convertedFiles = 0
    var bytesSaved: Int64 = 0
    var compressedPDFs = 0
}
