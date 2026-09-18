import Foundation
import Testing
@testable import Convertix_iOS

@Suite("Convertix backend integration")
struct ConvertixTests {
    @Test("Conversion history decodes the Supabase row contract")
    func historyDecoding() throws {
        let id = UUID()
        let conversionID = UUID()
        let json = """
        {
          "id": "\(id.uuidString)",
          "conversion_id": "\(conversionID.uuidString)",
          "original_filename": "photo.heic",
          "source_format": "heic",
          "target_format": "jpg",
          "status": "completed",
          "input_size": 1200,
          "output_size": 900,
          "output_key": "outputs/result.jpg",
          "created_at": "2026-09-17T12:00:00Z",
          "completed_at": "2026-09-17T12:00:03Z"
        }
        """

        let entry = try JSONDecoder.convertix.decode(
            ConversionHistoryEntry.self,
            from: Data(json.utf8)
        )

        #expect(entry.id == id)
        #expect(entry.conversionID == conversionID)
        #expect(entry.originalFilename == "photo.heic")
        #expect(entry.sourceFormat == "heic")
        #expect(entry.targetFormat == "jpg")
        #expect(entry.outputSize == 900)
    }

    @Test("History writes include the authenticated owner")
    func historyWriteContract() throws {
        let userID = UUID()
        let conversionID = UUID()
        let write = ConversionHistoryWrite(
            userID: userID,
            conversionID: conversionID,
            originalFilename: "report.docx",
            sourceFormat: "docx",
            targetFormat: "pdf",
            status: "completed",
            inputSize: 100,
            outputSize: 80,
            outputKey: "outputs/report.pdf",
            completedAt: Date(timeIntervalSince1970: 0)
        )

        let object = try #require(
            JSONSerialization.jsonObject(with: JSONEncoder.convertix.encode(write))
                as? [String: Any]
        )

        #expect(object["user_id"] as? String == userID.uuidString)
        #expect(object["conversion_id"] as? String == conversionID.uuidString)
        #expect(object["source_format"] as? String == "docx")
        #expect(object["target_format"] as? String == "pdf")
    }

    @Test("Supported formats exactly expose valid routes")
    func supportedRoutes() {
        #expect(ConversionRoute.routes(forSourceExtension: "docx").map(\.target) == ["PDF"])
        #expect(Set(ConversionRoute.routes(forSourceExtension: "heic").map(\.target)) == Set(["JPG", "PNG", "WEBP"]))
        #expect(Set(ConversionRoute.routes(forSourceExtension: "jpeg").map(\.target)) == Set(["PNG", "WEBP", "PDF"]))
        #expect(ConversionRoute.routes(forSourceExtension: "exe").isEmpty)
    }

    @Test("Server errors preserve backend error codes")
    func errorDecoding() {
        let error = ConversionAPIError.server(
            status: 400,
            code: "unsupported_conversion"
        )

        #expect(error.errorDescription == "Convertix can’t run that conversion yet. Choose another output format.")
        #expect(!error.isRetryable)
        #expect(ConversionAPIError.server(status: 503, code: nil).isRetryable)
    }

    @Test("Upload, queue, and completed status follow the API contract")
    @MainActor
    func conversionWorkflow() async throws {
        let conversionID = UUID()
        let recorder = RequestRecorder(conversionID: conversionID)
        let urlSessionConfiguration = URLSessionConfiguration.ephemeral
        urlSessionConfiguration.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: urlSessionConfiguration)
        MockURLProtocol.handler = { request in
            try recorder.response(for: request)
        }

        let configuration = AppConfiguration(
            apiBaseURL: URL(string: "https://api.convertix.test")!,
            supabaseURL: URL(string: "https://project.supabase.co")!,
            supabasePublishableKey: "public-key"
        )
        let api = ConversionAPI(
            session: session,
            configuration: configuration,
            pollInterval: .zero,
            timeout: 5
        )
        let fileURL = FileManager.default.temporaryDirectory
            .appending(path: "convertix-test.txt")
        try Data("hello".utf8).write(to: fileURL)
        defer {
            try? FileManager.default.removeItem(at: fileURL)
            MockURLProtocol.handler = nil
        }

        var statuses: [ConversionStatus] = []
        let result = try await api.convert(
            fileURL: fileURL,
            route: try #require(
                ConversionRoute.catalog.first {
                    $0.source == "TXT" && $0.target == "PDF"
                }
            )
        ) { status in
            statuses.append(status)
        }

        #expect(result.conversionID == conversionID)
        #expect(result.outputKey == "outputs/result.pdf")
        #expect(result.suggestedFilename == "convertix-test-converted.pdf")
        #expect(recorder.methods == ["POST", "PUT", "POST", "GET"])
        #expect(statuses.contains(.uploading))
        #expect(statuses.contains(.queued))
        #expect(statuses.contains(.completed(URL(string: "https://downloads.convertix.test/result.pdf")!)))
    }
}

private final class RequestRecorder: @unchecked Sendable {
    private let lock = NSLock()
    private(set) var methods: [String] = []
    private let conversionID: UUID

    init(conversionID: UUID) {
        self.conversionID = conversionID
    }

    func response(for request: URLRequest) throws -> (HTTPURLResponse, Data) {
        lock.lock()
        methods.append(request.httpMethod ?? "GET")
        lock.unlock()

        let path = request.url?.path ?? ""
        let statusCode: Int
        let body: String

        switch (request.httpMethod, path) {
        case ("POST", "/uploads"):
            statusCode = 200
            body = """
            {
              "upload_id": "\(UUID().uuidString)",
              "object_key": "uploads/input.txt",
              "upload_url": "https://storage.convertix.test/input",
              "content_type": "text/plain",
              "expires_in": 900
            }
            """
        case ("PUT", "/input"):
            statusCode = 200
            body = "{}"
        case ("POST", "/conversions"):
            statusCode = 202
            body = """
            {
              "conversion_id": "\(conversionID.uuidString)",
              "source_format": "txt",
              "target_format": "pdf",
              "input_key": "uploads/input.txt",
              "status": "queued"
            }
            """
        case ("GET", let value) where value.contains(conversionID.uuidString):
            statusCode = 200
            body = """
            {
              "conversion_id": "\(conversionID.uuidString)",
              "status": "completed",
              "output_key": "outputs/result.pdf",
              "content_type": "application/pdf",
              "size": 321,
              "download_url": "https://downloads.convertix.test/result.pdf",
              "download_expires_in": 900
            }
            """
        default:
            statusCode = 404
            body = #"{"error":"not_found"}"#
        }

        let response = try #require(
            HTTPURLResponse(
                url: request.url!,
                statusCode: statusCode,
                httpVersion: nil,
                headerFields: ["Content-Type": "application/json"]
            )
        )
        return (response, Data(body.utf8))
    }
}

private final class MockURLProtocol: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var handler:
        (@Sendable (URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool { true }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

    override func startLoading() {
        guard let handler = Self.handler else {
            client?.urlProtocol(self, didFailWithError: URLError(.badServerResponse))
            return
        }

        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}
