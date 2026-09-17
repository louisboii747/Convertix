import Foundation
import UniformTypeIdentifiers

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

