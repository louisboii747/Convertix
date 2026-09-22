import Foundation

struct ConversionClientSnapshot: Codable, Sendable {
    var conversions: [ClientConversion]
    var presets: [ConversionPreset]
    var favouriteRouteIDs: Set<String>
    var statistics: ConversionStatistics

    static let empty = ConversionClientSnapshot(
        conversions: [],
        presets: [],
        favouriteRouteIDs: [],
        statistics: ConversionStatistics()
    )
}

actor ConversionPersistence {
    private let fileURL: URL
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(fileManager: FileManager = .default) {
        let root = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask)
            .first ?? fileManager.temporaryDirectory
        let directory = root.appending(component: "Convertix", directoryHint: .isDirectory)
        try? fileManager.createDirectory(
            at: directory,
            withIntermediateDirectories: true
        )
        fileURL = directory.appending(component: "client-state.json")

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.sortedKeys]
        self.encoder = encoder

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.decoder = decoder
    }

    func load() -> ConversionClientSnapshot {
        do {
            let data = try Data(contentsOf: fileURL, options: [.mappedIfSafe])
            return try decoder.decode(ConversionClientSnapshot.self, from: data)
        } catch {
            return .empty
        }
    }

    func save(_ snapshot: ConversionClientSnapshot) throws {
        let data = try encoder.encode(snapshot)
        try data.write(to: fileURL, options: [.atomic])
    }

    func clear() throws {
        guard FileManager.default.fileExists(atPath: fileURL.path(percentEncoded: false)) else {
            return
        }
        try FileManager.default.removeItem(at: fileURL)
    }
}
