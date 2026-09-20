import Foundation

struct AccountUser: Equatable, Sendable {
    let id: UUID
    let email: String
}

struct AccountProfile: Codable, Equatable, Sendable {
    let id: UUID
    var displayName: String?
    let createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct ConversionHistoryEntry: Codable, Equatable, Identifiable, Sendable {
    let id: UUID
    let conversionID: UUID
    let originalFilename: String
    let sourceFormat: String
    let targetFormat: String
    let status: String
    let inputSize: Int64?
    let outputSize: Int64?
    let outputKey: String?
    let createdAt: Date
    let completedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case conversionID = "conversion_id"
        case originalFilename = "original_filename"
        case sourceFormat = "source_format"
        case targetFormat = "target_format"
        case status
        case inputSize = "input_size"
        case outputSize = "output_size"
        case outputKey = "output_key"
        case createdAt = "created_at"
        case completedAt = "completed_at"
    }
}

struct ConversionHistoryWrite: Encodable, Sendable {
    let userID: UUID
    let conversionID: UUID
    let originalFilename: String
    let sourceFormat: String
    let targetFormat: String
    let status: String
    let inputSize: Int64?
    let outputSize: Int64?
    let outputKey: String?
    let completedAt: Date

    enum CodingKeys: String, CodingKey {
        case userID = "user_id"
        case conversionID = "conversion_id"
        case originalFilename = "original_filename"
        case sourceFormat = "source_format"
        case targetFormat = "target_format"
        case status
        case inputSize = "input_size"
        case outputSize = "output_size"
        case outputKey = "output_key"
        case completedAt = "completed_at"
    }
}

struct ConversionJob: Identifiable, Equatable, Sendable {
    let id: UUID
    let sourceURL: URL
    let route: ConversionRoute
    var status: ConversionStatus
    var result: ConversionResult?
    var downloadedFileURL: URL?

    var fileName: String { sourceURL.lastPathComponent }

    init(sourceURL: URL, route: ConversionRoute) {
        id = UUID()
        self.sourceURL = sourceURL
        self.route = route
        status = .queued
    }
}

struct ConversionResult: Equatable, Sendable {
    let conversionID: UUID
    let downloadURL: URL
    let outputKey: String?
    let contentType: String?
    let outputSize: Int64?
    let suggestedFilename: String
}

enum AuthenticationMode: String, CaseIterable, Identifiable {
    case signIn
    case signUp

    var id: Self { self }

    var title: String {
        switch self {
        case .signIn: "Sign In"
        case .signUp: "Create Account"
        }
    }
}
