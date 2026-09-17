import Foundation

struct AppConfiguration: Sendable {
    let apiBaseURL: URL
    let supabaseURL: URL
    let supabasePublishableKey: String

    init(apiBaseURL: URL, supabaseURL: URL, supabasePublishableKey: String) {
        self.apiBaseURL = apiBaseURL
        self.supabaseURL = supabaseURL
        self.supabasePublishableKey = supabasePublishableKey
    }

    init(bundle: Bundle = .main) throws {
        apiBaseURL = try Self.url(for: "ConvertixAPIBaseURL", in: bundle)
        supabaseURL = try Self.url(for: "SupabaseURL", in: bundle)
        supabasePublishableKey = try Self.string(for: "SupabasePublishableKey", in: bundle)
    }

    private static func url(for key: String, in bundle: Bundle) throws -> URL {
        let value = try string(for: key, in: bundle)
        guard let url = URL(string: value),
              let scheme = url.scheme,
              ["https", "http"].contains(scheme.lowercased()) else {
            throw ConfigurationError.invalidValue(key)
        }
        return url
    }

    private static func string(for key: String, in bundle: Bundle) throws -> String {
        guard let rawValue = bundle.object(forInfoDictionaryKey: key) as? String else {
            throw ConfigurationError.missingValue(key)
        }
        let value = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty, !value.hasPrefix("$(") else {
            throw ConfigurationError.missingValue(key)
        }
        return value
    }
}

enum ConfigurationError: LocalizedError {
    case missingValue(String)
    case invalidValue(String)

    var errorDescription: String? {
        switch self {
        case let .missingValue(key):
            "Missing native app configuration for \(key)."
        case let .invalidValue(key):
            "The native app configuration value for \(key) is invalid."
        }
    }
}
