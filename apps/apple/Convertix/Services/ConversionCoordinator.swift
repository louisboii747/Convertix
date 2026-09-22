import Foundation
import Observation

@MainActor
@Observable
final class ConversionCoordinator {
    private(set) var conversions: [ClientConversion] = []
    private(set) var presets: [ConversionPreset] = []
    private(set) var favouriteRouteIDs: Set<String> = []
    private(set) var statistics = ConversionStatistics()
    private(set) var isRestoring = false

    @ObservationIgnored private let remoteService: ConversionAPI?
    @ObservationIgnored private let localEngine: LocalConversionEngine
    @ObservationIgnored private let persistence: ConversionPersistence
    @ObservationIgnored private let outputManager: OutputDestinationManager
    @ObservationIgnored private var tasks: [UUID: Task<Void, Never>] = [:]
    @ObservationIgnored private var hasRestored = false
    @ObservationIgnored private var authorizationCheck: @MainActor @Sendable () -> Bool = { true }
    @ObservationIgnored private var completionHandler:
        (@MainActor @Sendable (ClientConversion) async -> Void)?

    init(
        remoteService: ConversionAPI?,
        localEngine: LocalConversionEngine = LocalConversionEngine(),
        persistence: ConversionPersistence = ConversionPersistence(),
        outputManager: OutputDestinationManager = OutputDestinationManager()
    ) {
        self.remoteService = remoteService
        self.localEngine = localEngine
        self.persistence = persistence
        self.outputManager = outputManager
    }

    func configureAccountAccess(
        authorizationCheck: @escaping @MainActor @Sendable () -> Bool,
        completionHandler: @escaping @MainActor @Sendable (ClientConversion) async -> Void
    ) {
        self.authorizationCheck = authorizationCheck
        self.completionHandler = completionHandler
    }

    var pendingConversions: [ClientConversion] {
        conversions.filter { $0.phase == .queued }
    }

    var activeConversions: [ClientConversion] {
        conversions.filter(\.phase.isActive)
    }

    var recentConversions: [ClientConversion] {
        Array(
            conversions
                .filter(\.phase.isFinished)
                .sorted { $0.creationDate > $1.creationDate }
                .prefix(10)
        )
    }

    func restore() async {
        guard !hasRestored else { return }
        hasRestored = true
        isRestoring = true
        defer { isRestoring = false }

        let snapshot = await persistence.load()
        conversions = snapshot.conversions.map { conversion in
            guard conversion.phase.isActive || conversion.phase == .queued else {
                return conversion
            }

            var interrupted = conversion
            interrupted.phase = .failed
            interrupted.errorDescription = conversion.backendConversionID == nil
                ? "This conversion was interrupted. Select the source file to retry."
                : "This conversion was interrupted. Retry to check or run it again."
            return interrupted
        }
        presets = snapshot.presets
        favouriteRouteIDs = snapshot.favouriteRouteIDs
        statistics = snapshot.statistics
    }

    func clearAccountData() async {
        for task in tasks.values {
            task.cancel()
        }
        tasks.removeAll()
        conversions = []
        presets = []
        favouriteRouteIDs = []
        statistics = ConversionStatistics()
        try? await persistence.clear()
    }

    @discardableResult
    func enqueue(_ request: ConversionRequest) -> UUID? {
        guard authorizationCheck(), !request.inputURLs.isEmpty else { return nil }
        let batchID = request.inputURLs.count > 1 ? UUID() : nil
        let preset = request.preset

        let newConversions = request.inputURLs.map { url in
            ClientConversion(
                batchID: batchID,
                inputURL: url,
                outputFormat: preset?.outputFormat ?? request.outputFormat,
                source: request.source,
                destination: preset?.destination ?? request.destination,
                executionPreference: preset?.executionPreference ?? request.executionPreference,
                presetID: preset?.id,
                quality: preset?.quality ?? request.quality,
                removeMetadata: preset?.removeMetadata ?? false
            )
        }
        conversions.insert(contentsOf: newConversions, at: 0)
        persist()

        for conversion in newConversions {
            start(conversionID: conversion.id)
        }
        return batchID ?? newConversions.first?.id
    }

    @discardableResult
    func enqueueDetected(
        _ inputURLs: [URL],
        source: ConversionSource = .app,
        destination: ConversionDestination = .askEveryTime,
        executionPreference: ConversionExecution = .automatic
    ) -> UUID? {
        guard authorizationCheck() else { return nil }
        let supportedInputs = inputURLs.compactMap { url -> (URL, ConversionRoute)? in
            guard let route = ConversionRoute.routes(
                forSourceExtension: url.pathExtension
            ).first else {
                return nil
            }
            return (url, route)
        }
        guard !supportedInputs.isEmpty else { return nil }

        let batchID = supportedInputs.count > 1 ? UUID() : nil
        let newConversions = supportedInputs.map { url, route in
            ClientConversion(
                batchID: batchID,
                inputURL: url,
                outputFormat: route.target,
                source: source,
                destination: destination,
                executionPreference: executionPreference
            )
        }
        conversions.insert(contentsOf: newConversions, at: 0)
        persist()
        for conversion in newConversions {
            start(conversionID: conversion.id)
        }
        return batchID ?? newConversions.first?.id
    }

    func retry(_ conversionID: UUID) {
        guard let index = index(of: conversionID),
              conversions[index].phase.isFinished else { return }
        conversions[index].phase = .queued
        conversions[index].progress = nil
        conversions[index].completionDate = nil
        conversions[index].outputURL = nil
        conversions[index].errorDescription = nil
        persist()
        start(conversionID: conversionID)
    }

    func cancel(_ conversionID: UUID) {
        tasks[conversionID]?.cancel()
        tasks[conversionID] = nil
        update(conversionID) {
            $0.phase = .cancelled
            $0.completionDate = .now
            $0.errorDescription = nil
        }
    }

    func remove(_ conversionID: UUID) {
        guard let conversion = conversions.first(where: { $0.id == conversionID }),
              conversion.phase.isFinished else { return }
        tasks[conversionID]?.cancel()
        tasks[conversionID] = nil
        conversions.removeAll { $0.id == conversionID }
        persist()
    }

    func removeFinished() {
        let finishedIDs = Set(conversions.filter(\.phase.isFinished).map(\.id))
        for id in finishedIDs {
            tasks[id]?.cancel()
            tasks[id] = nil
        }
        conversions.removeAll { finishedIDs.contains($0.id) }
        persist()
    }

    func setFavourite(routeID: String, isFavourite: Bool) {
        if isFavourite {
            favouriteRouteIDs.insert(routeID)
        } else {
            favouriteRouteIDs.remove(routeID)
        }
        persist()
    }

    func savePreset(_ preset: ConversionPreset) {
        if let index = presets.firstIndex(where: { $0.id == preset.id }) {
            presets[index] = preset
        } else {
            presets.append(preset)
        }
        persist()
    }

    func deletePreset(id: UUID) {
        presets.removeAll { $0.id == id }
        persist()
    }

    private func start(conversionID: UUID) {
        tasks[conversionID]?.cancel()
        tasks[conversionID] = Task { [weak self] in
            await self?.perform(conversionID)
        }
    }

    private func perform(_ conversionID: UUID) async {
        guard let index = index(of: conversionID) else { return }
        let conversion = conversions[index]
        let inputURL = conversion.inputURL
        let canAccess = inputURL.startAccessingSecurityScopedResource()
        defer {
            if canAccess {
                inputURL.stopAccessingSecurityScopedResource()
            }
            tasks[conversionID] = nil
        }

        do {
            try Task.checkCancellation()
            let originalSize = try inputURL.resourceValues(forKeys: [.fileSizeKey])
                .fileSize
                .map(Int64.init)
            update(conversionID) {
                $0.phase = .preparing
                $0.originalSize = originalSize
                $0.progress = 0
            }

            let useLocal = try execution(for: conversion)
            update(conversionID) {
                $0.execution = useLocal ? .local : .cloud
            }

            let temporaryOutput: URL
            var backendID: UUID?
            var reportedOutputSize: Int64?

            if useLocal {
                update(conversionID) {
                    $0.phase = .converting
                    $0.progress = 0.2
                }
                temporaryOutput = try await localEngine.convert(
                    inputURL: inputURL,
                    outputFormat: conversion.outputFormat,
                    quality: conversion.quality,
                    removeMetadata: conversion.removeMetadata
                )
            } else {
                guard let remoteService, let route = conversion.route else {
                    throw CoordinatorError.unsupportedConversion
                }

                let result = try await remoteService.convert(
                    fileURL: inputURL,
                    route: route
                ) { [weak self] status in
                    self?.applyRemoteStatus(status, to: conversionID)
                }
                backendID = result.conversionID
                reportedOutputSize = result.outputSize
                update(conversionID) {
                    $0.backendConversionID = result.conversionID
                    $0.phase = .downloading
                    $0.progress = 0.85
                }
                temporaryOutput = try await remoteService.download(result)
            }

            try Task.checkCancellation()
            update(conversionID) {
                $0.phase = .saving
                $0.progress = 0.95
            }
            let outputURL = try outputManager.placeOutput(
                temporaryURL: temporaryOutput,
                originalURL: inputURL,
                destination: conversion.destination
            )
            let measuredOutputSize = try outputURL
                .resourceValues(forKeys: [.fileSizeKey])
                .fileSize
                .map(Int64.init)
            let outputSize = reportedOutputSize ?? measuredOutputSize

            update(conversionID) {
                $0.backendConversionID = backendID
                $0.outputURL = outputURL
                $0.outputSize = outputSize
                $0.phase = .completed
                $0.progress = 1
                $0.completionDate = .now
            }
            statistics.convertedFiles += 1
            if let originalSize, let outputSize {
                statistics.bytesSaved += max(0, originalSize - outputSize)
            }
            if conversion.inputFormat == "pdf", conversion.outputFormat == "pdf" {
                statistics.compressedPDFs += 1
            }
            persist()
            if let completed = conversions.first(where: { $0.id == conversionID }) {
                await completionHandler?(completed)
                Task {
                    await ConversionNotificationManager.shared.notifyCompletion(for: completed)
                }
            }
        } catch is CancellationError {
            update(conversionID) {
                $0.phase = .cancelled
                $0.completionDate = .now
                $0.errorDescription = nil
            }
        } catch {
            update(conversionID) {
                $0.phase = .failed
                $0.completionDate = .now
                $0.errorDescription = (error as? LocalizedError)?.errorDescription
                    ?? "The conversion couldn’t be completed."
            }
            if let failed = conversions.first(where: { $0.id == conversionID }) {
                Task {
                    await ConversionNotificationManager.shared.notifyFailure(for: failed)
                }
            }
        }
    }

    private func execution(for conversion: ClientConversion) throws -> Bool {
        let canRunLocally = localEngine.canConvert(
            inputFormat: conversion.inputFormat,
            outputFormat: conversion.outputFormat
        )

        switch conversion.executionPreference {
        case .automatic:
            return canRunLocally
        case .local:
            guard canRunLocally else { throw CoordinatorError.localConversionUnavailable }
            return true
        case .cloud:
            guard remoteService != nil else { throw CoordinatorError.cloudConversionUnavailable }
            return false
        }
    }

    private func applyRemoteStatus(_ status: ConversionStatus, to id: UUID) {
        update(id) {
            switch status {
            case .idle:
                $0.phase = .preparing
                $0.progress = nil
            case .uploading:
                $0.phase = .uploading
                $0.progress = 0.1
            case .queued:
                $0.phase = .converting
                $0.progress = 0.45
            case .processing:
                $0.phase = .converting
                $0.progress = 0.6
            case .completed:
                $0.phase = .downloading
                $0.progress = 0.85
            case let .failed(message):
                $0.phase = .failed
                $0.errorDescription = message
            }
        }
    }

    private func index(of id: UUID) -> Int? {
        conversions.firstIndex { $0.id == id }
    }

    private func update(_ id: UUID, mutation: (inout ClientConversion) -> Void) {
        guard let index = index(of: id) else { return }
        mutation(&conversions[index])
        persist()
    }

    private func persist() {
        let snapshot = ConversionClientSnapshot(
            conversions: conversions,
            presets: presets,
            favouriteRouteIDs: favouriteRouteIDs,
            statistics: statistics
        )
        Task {
            try? await persistence.save(snapshot)
        }
    }
}

enum CoordinatorError: LocalizedError {
    case unsupportedConversion
    case localConversionUnavailable
    case cloudConversionUnavailable

    var errorDescription: String? {
        switch self {
        case .unsupportedConversion:
            "This file and output format combination isn’t supported."
        case .localConversionUnavailable:
            "This conversion can’t be completed on this device."
        case .cloudConversionUnavailable:
            "Cloud conversion is currently unavailable."
        }
    }
}

struct OutputDestinationManager: Sendable {
    func placeOutput(
        temporaryURL: URL,
        originalURL: URL,
        destination: ConversionDestination
    ) throws -> URL {
        switch destination {
        case .askEveryTime, .shareAfterConversion:
            return temporaryURL
        case .sameFolder:
            return try copy(
                temporaryURL,
                to: originalURL.deletingLastPathComponent()
            )
        case .downloads:
            let directory: URL
            if let downloads = FileManager.default.urls(
                for: .downloadsDirectory,
                in: .userDomainMask
            ).first {
                directory = downloads
            } else {
                directory = try convertixDirectory
            }
            return try copy(temporaryURL, to: directory)
        case .convertixFolder:
            return try copy(temporaryURL, to: convertixDirectory)
        }
    }

    private var convertixDirectory: URL {
        get throws {
            let root = FileManager.default.urls(
                for: .documentDirectory,
                in: .userDomainMask
            ).first ?? FileManager.default.temporaryDirectory
            let directory = root.appending(component: "Convertix", directoryHint: .isDirectory)
            try FileManager.default.createDirectory(
                at: directory,
                withIntermediateDirectories: true
            )
            return directory
        }
    }

    private func copy(_ source: URL, to directory: URL) throws -> URL {
        try FileManager.default.createDirectory(
            at: directory,
            withIntermediateDirectories: true
        )
        let destination = uniqueDestination(
            directory.appending(component: source.lastPathComponent)
        )
        try FileManager.default.copyItem(at: source, to: destination)
        return destination
    }

    private func uniqueDestination(_ proposed: URL) -> URL {
        guard FileManager.default.fileExists(atPath: proposed.path(percentEncoded: false)) else {
            return proposed
        }

        let stem = proposed.deletingPathExtension().lastPathComponent
        let fileExtension = proposed.pathExtension
        for number in 2...999 {
            let name = fileExtension.isEmpty
                ? "\(stem) \(number)"
                : "\(stem) \(number).\(fileExtension)"
            let candidate = proposed.deletingLastPathComponent().appending(component: name)
            if !FileManager.default.fileExists(atPath: candidate.path(percentEncoded: false)) {
                return candidate
            }
        }
        return proposed.deletingLastPathComponent().appending(
            component: "\(stem)-\(UUID().uuidString).\(fileExtension)"
        )
    }
}
