import Foundation
import UniformTypeIdentifiers

struct ConversionAPI: Sendable {
    private struct UploadRequest: Encodable {
        let filename: String
        let contentType: String

        enum CodingKeys: String, CodingKey {
            case filename
            case contentType = "content_type"
        }
    }

    private struct UploadResponse: Decodable {
        let uploadID: UUID
        let objectKey: String
        let uploadURL: URL
        let contentType: String
        let expiresIn: Int

        enum CodingKeys: String, CodingKey {
            case uploadID = "upload_id"
            case objectKey = "object_key"
            case uploadURL = "upload_url"
            case contentType = "content_type"
            case expiresIn = "expires_in"
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
        let conversionID: UUID
        let status: String

        enum CodingKeys: String, CodingKey {
            case conversionID = "conversion_id"
            case status
        }
    }

    private struct StatusResponse: Decodable {
        let conversionID: UUID
        let status: String
        let message: String?
        let outputKey: String?
        let contentType: String?
        let size: Int64?
        let downloadURL: URL?
        let downloadExpiresIn: Int?

        enum CodingKeys: String, CodingKey {
            case conversionID = "conversion_id"
            case status
            case message
            case outputKey = "output_key"
            case contentType = "content_type"
            case size
            case downloadURL = "download_url"
            case downloadExpiresIn = "download_expires_in"
        }
    }

    private struct ErrorResponse: Decodable {
        let error: String?
    }

    private let session: URLSession
    private let baseURL: URL
    private let pollInterval: Duration
    private let timeout: TimeInterval
    private let maximumConsecutivePollingFailures: Int

    init(
        session: URLSession = .shared,
        configuration: AppConfiguration,
        pollInterval: Duration = .seconds(3),
        timeout: TimeInterval = 15 * 60,
        maximumConsecutivePollingFailures: Int = 5
    ) {
        self.session = session
        baseURL = configuration.apiBaseURL
        self.pollInterval = pollInterval
        self.timeout = timeout
        self.maximumConsecutivePollingFailures = maximumConsecutivePollingFailures
    }

    init(session: URLSession = .shared, bundle: Bundle = .main) throws {
        self.init(session: session, configuration: try AppConfiguration(bundle: bundle))
    }

    func convert(
        fileURL: URL,
        route: ConversionRoute,
        onStatus: @escaping @MainActor (ConversionStatus) -> Void
    ) async throws -> ConversionResult {
        let sourceFormat = route.source.lowercased()
        let targetFormat = route.target.lowercased()
        try validate(fileURL: fileURL, sourceFormat: sourceFormat)

        await onStatus(.uploading)
        let contentType = UTType(filenameExtension: fileURL.pathExtension)?.preferredMIMEType
            ?? "application/octet-stream"
        let canonicalFilename = canonicalFilename(
            originalName: fileURL.lastPathComponent,
            sourceFormat: sourceFormat
        )
        let upload: UploadResponse = try await sendJSON(
            UploadRequest(filename: canonicalFilename, contentType: contentType),
            to: endpoint("uploads")
        )

        var uploadRequest = URLRequest(url: upload.uploadURL)
        uploadRequest.httpMethod = "PUT"
        uploadRequest.setValue(upload.contentType, forHTTPHeaderField: "Content-Type")

        do {
            let (_, response) = try await session.upload(for: uploadRequest, fromFile: fileURL)
            try validate(response)
        } catch is CancellationError {
            throw CancellationError()
        } catch let error as ConversionAPIError {
            throw error
        } catch {
            throw ConversionAPIError.network(
                "We couldn’t upload your file. Check your connection and try again."
            )
        }

        await onStatus(.queued)
        let queued: QueueResponse = try await sendJSON(
            QueueRequest(
                sourceFormat: sourceFormat,
                targetFormat: targetFormat,
                inputKey: upload.objectKey
            ),
            to: endpoint("conversions")
        )

        guard queued.status == "queued" else {
            throw ConversionAPIError.invalidResponse
        }

        let deadline = Date().addingTimeInterval(timeout)
        var consecutivePollingFailures = 0
        while Date() < deadline {
            try await Task.sleep(for: pollInterval)
            let status: StatusResponse

            do {
                status = try await get(endpoint("conversions/\(queued.conversionID.uuidString)"))
            } catch let error as ConversionAPIError where error.isRetryable {
                consecutivePollingFailures += 1
                guard consecutivePollingFailures < maximumConsecutivePollingFailures else {
                    throw error
                }
                continue
            }

            consecutivePollingFailures = 0

            switch status.status.lowercased() {
            case "processing":
                await onStatus(.processing)
            case "completed":
                guard let downloadURL = status.downloadURL else {
                    throw ConversionAPIError.missingDownloadURL
                }
                let result = ConversionResult(
                    conversionID: status.conversionID,
                    downloadURL: downloadURL,
                    outputKey: status.outputKey,
                    contentType: status.contentType,
                    outputSize: status.size,
                    suggestedFilename: outputFilename(
                        originalName: fileURL.lastPathComponent,
                        targetFormat: targetFormat
                    )
                )
                await onStatus(.completed(downloadURL))
                return result
            case "failed":
                throw ConversionAPIError.conversionFailed(
                    status.message
                        ?? "Convertix couldn’t convert this file. Check that it is valid and try again."
                )
            default:
                throw ConversionAPIError.invalidResponse
            }
        }

        throw ConversionAPIError.timedOut
    }

    func download(_ result: ConversionResult) async throws -> URL {
        let (temporaryURL, response) = try await session.download(from: result.downloadURL)
        try validate(response)

        let directory = FileManager.default.temporaryDirectory
            .appending(path: "Convertix", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(
            at: directory,
            withIntermediateDirectories: true
        )
        let destination = directory.appending(path: result.suggestedFilename)
        if FileManager.default.fileExists(atPath: destination.path) {
            try FileManager.default.removeItem(at: destination)
        }
        try FileManager.default.moveItem(at: temporaryURL, to: destination)
        return destination
    }

    private func canonicalFilename(originalName: String, sourceFormat: String) -> String {
        let stem = URL(fileURLWithPath: originalName)
            .deletingPathExtension()
            .lastPathComponent
        let canonicalExtension = sourceFormat == "jpg" ? "jpg" : sourceFormat
        return "\(stem.isEmpty ? "upload" : stem).\(canonicalExtension)"
    }

    private func outputFilename(originalName: String, targetFormat: String) -> String {
        let stem = URL(fileURLWithPath: originalName)
            .deletingPathExtension()
            .lastPathComponent
        return "\(stem.isEmpty ? "convertix" : stem)-converted.\(targetFormat)"
    }

    private func validate(fileURL: URL, sourceFormat: String) throws {
        let extensionFormat = fileURL.pathExtension.lowercased()
        let acceptedExtensions: Set<String>
        switch sourceFormat {
        case "jpg":
            acceptedExtensions = ["jpg", "jpeg"]
        case "heic":
            acceptedExtensions = ["heic"]
        case "heif":
            acceptedExtensions = ["heif"]
        default:
            acceptedExtensions = [sourceFormat]
        }

        guard acceptedExtensions.contains(extensionFormat) else {
            throw ConversionAPIError.formatMismatch(expected: sourceFormat.uppercased())
        }

        if let size = try fileURL.resourceValues(forKeys: [.fileSizeKey]).fileSize {
            guard size > 0 else {
                throw ConversionAPIError.emptyFile
            }
            guard size <= 100 * 1024 * 1024 else {
                throw ConversionAPIError.fileTooLarge
            }
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
        request.timeoutInterval = 30
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder.convertix.encode(body)
        return try await perform(request)
    }

    private func get<Response: Decodable>(_ url: URL) async throws -> Response {
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.timeoutInterval = 30
        return try await perform(request)
    }

    private func perform<Response: Decodable>(_ request: URLRequest) async throws -> Response {
        let data: Data
        let response: URLResponse

        do {
            (data, response) = try await session.data(for: request)
        } catch is CancellationError {
            throw CancellationError()
        } catch {
            throw ConversionAPIError.network(
                "Convertix couldn’t reach the conversion service. Check your connection and try again."
            )
        }

        try validate(response, body: data)

        do {
            return try JSONDecoder.convertix.decode(Response.self, from: data)
        } catch {
            throw ConversionAPIError.invalidResponse
        }
    }

    private func validate(_ response: URLResponse, body: Data = Data()) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ConversionAPIError.invalidResponse
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            let code = try? JSONDecoder.convertix.decode(ErrorResponse.self, from: body).error
            throw ConversionAPIError.server(status: httpResponse.statusCode, code: code)
        }
    }
}

extension JSONDecoder {
    static var convertix: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}

extension JSONEncoder {
    static var convertix: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}

enum ConversionAPIError: LocalizedError, Equatable {
    case conversionFailed(String)
    case emptyFile
    case fileTooLarge
    case formatMismatch(expected: String)
    case invalidResponse
    case missingDownloadURL
    case network(String)
    case server(status: Int, code: String?)
    case timedOut

    var isRetryable: Bool {
        switch self {
        case .network, .missingDownloadURL:
            true
        case let .server(status, _):
            status == 429 || status >= 500
        default:
            false
        }
    }

    var errorDescription: String? {
        switch self {
        case let .conversionFailed(message), let .network(message):
            message
        case .emptyFile:
            "That file is empty. Choose a file that contains something to convert."
        case .fileTooLarge:
            "Choose a file smaller than 100 MB."
        case let .formatMismatch(expected):
            "Choose a \(expected) file or select the matching source format."
        case .invalidResponse:
            "The conversion service returned an unexpected response. Try again."
        case .missingDownloadURL:
            "Your file was converted, but the download link is missing. Try again."
        case let .server(status, code):
            Self.message(for: code) ?? "The conversion service returned HTTP \(status)."
        case .timedOut:
            "This conversion has taken longer than 15 minutes. Try again."
        }
    }

    private static func message(for code: String?) -> String? {
        switch code {
        case "unsupported_upload_format":
            "Convertix doesn’t support uploading this file format."
        case "unsupported_conversion":
            "Convertix can’t run that conversion yet. Choose another output format."
        case "input_format_mismatch":
            "The selected file doesn’t match the chosen source format."
        case "storage_not_configured", "queue_not_configured":
            "The conversion service is temporarily unavailable."
        case "failed_to_create_upload_url", "failed_to_queue_conversion",
             "failed_to_check_conversion", "failed_to_create_download_url":
            "Convertix couldn’t complete that request. Try again."
        default:
            nil
        }
    }
}
