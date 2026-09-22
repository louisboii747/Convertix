import AuthenticationServices
import Foundation
import Supabase

struct SupabaseService: Sendable {
    private let client: SupabaseClient

    init(configuration: AppConfiguration) {
        client = SupabaseClient(
            supabaseURL: configuration.supabaseURL,
            supabaseKey: configuration.supabasePublishableKey,
            options: SupabaseClientOptions(
                auth: .init(
                    storage: KeychainLocalStorage(service: "uk.convertix.app.auth"),
                    redirectToURL: URL(string: "convertix://auth/callback"),
                    flowType: .pkce,
                    autoRefreshToken: true,
                    emitLocalSessionAsInitialSession: true
                )
            )
        )
    }

    var authStateChanges: AsyncStream<(event: AuthChangeEvent, session: Session?)> {
        client.auth.authStateChanges
    }

    func signIn(email: String, password: String) async throws {
        _ = try await client.auth.signIn(email: email, password: password)
    }

    @MainActor
    func signInWithGoogle() async throws -> AccountUser {
        let session = try await client.auth.signInWithOAuth(
            provider: .google,
            redirectTo: URL(string: "convertix://auth/callback")
        )
        return AccountUser(
            id: session.user.id,
            email: session.user.email ?? ""
        )
    }

    static func isUserCancelledOAuth(_ error: Error) -> Bool {
        guard let error = error as? ASWebAuthenticationSessionError else {
            return false
        }
        return error.code == .canceledLogin
    }

    func signUp(email: String, password: String, displayName: String) async throws -> Bool {
        let response = try await client.auth.signUp(
            email: email,
            password: password,
            data: ["display_name": .string(displayName)],
            redirectTo: URL(string: "convertix://auth/callback")
        )
        return response.session != nil
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    func handleOpenURL(_ url: URL) async throws -> AccountUser {
        let session = try await client.auth.session(from: url)
        return AccountUser(
            id: session.user.id,
            email: session.user.email ?? ""
        )
    }

    func currentUser() async throws -> AccountUser {
        let user = try await client.auth.user()
        guard !user.isAnonymous else {
            throw SupabaseServiceError.authenticationRequired
        }
        return AccountUser(id: user.id, email: user.email ?? "")
    }

    func loadProfile(userID: UUID) async throws -> AccountProfile {
        let profile: AccountProfile = try await client
            .from("profiles")
            .select("id,display_name,created_at,updated_at")
            .eq("id", value: userID)
            .single()
            .execute()
            .value
        return profile
    }

    func updateProfile(userID: UUID, displayName: String) async throws -> AccountProfile {
        let write = ProfileWrite(
            id: userID,
            displayName: displayName,
            updatedAt: Date()
        )
        let profile: AccountProfile = try await client
            .from("profiles")
            .upsert(write, onConflict: "id")
            .select("id,display_name,created_at,updated_at")
            .single()
            .execute()
            .value
        return profile
    }

    func loadHistory(userID: UUID) async throws -> [ConversionHistoryEntry] {
        try await client
            .from("conversion_history")
            .select(
                "id,conversion_id,original_filename,source_format,target_format,status,input_size,output_size,output_key,created_at,completed_at"
            )
            .eq("user_id", value: userID)
            .order("created_at", ascending: false)
            .limit(100)
            .execute()
            .value
    }

    func saveHistory(_ record: ConversionHistoryWrite) async throws {
        try await client
            .from("conversion_history")
            .upsert(record, onConflict: "conversion_id")
            .execute()
    }

    func deleteHistoryEntry(id: UUID, userID: UUID) async throws {
        try await client
            .from("conversion_history")
            .delete()
            .eq("id", value: id)
            .eq("user_id", value: userID)
            .execute()
    }
}

private struct ProfileWrite: Encodable, Sendable {
    let id: UUID
    let displayName: String
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case updatedAt = "updated_at"
    }
}

enum SupabaseServiceError: LocalizedError {
    case authenticationRequired

    var errorDescription: String? {
        "Please sign in again to continue."
    }
}
