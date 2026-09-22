import Foundation
import UserNotifications

actor ConversionNotificationManager {
    static let shared = ConversionNotificationManager()

    private let center = UNUserNotificationCenter.current()

    func requestAuthorization() async -> Bool {
        do {
            return try await center.requestAuthorization(options: [.alert, .sound])
        } catch {
            return false
        }
    }

    func notifyCompletion(for conversion: ClientConversion) async {
        guard UserDefaults.standard.object(forKey: "notifyWhenComplete") as? Bool != false else {
            return
        }
        let settings = await center.notificationSettings()
        guard settings.authorizationStatus == .authorized
                || settings.authorizationStatus == .provisional else {
            return
        }

        let content = UNMutableNotificationContent()
        content.title = "Conversion Complete"
        content.body = "\(conversion.inputFilename) is ready as \(conversion.outputFormat.uppercased())."
        content.sound = .default
        content.userInfo = ["conversionID": conversion.id.uuidString]
        content.categoryIdentifier = "CONVERSION_COMPLETE"

        let request = UNNotificationRequest(
            identifier: "conversion-\(conversion.id.uuidString)",
            content: content,
            trigger: nil
        )
        try? await center.add(request)
    }

    func notifyFailure(for conversion: ClientConversion) async {
        guard UserDefaults.standard.object(forKey: "notifyWhenComplete") as? Bool != false else {
            return
        }
        let settings = await center.notificationSettings()
        guard settings.authorizationStatus == .authorized
                || settings.authorizationStatus == .provisional else {
            return
        }

        let content = UNMutableNotificationContent()
        content.title = "Conversion Failed"
        content.body = "Convertix couldn’t convert \(conversion.inputFilename)."
        content.sound = .default
        content.userInfo = ["conversionID": conversion.id.uuidString]
        content.categoryIdentifier = "CONVERSION_FAILED"

        let request = UNNotificationRequest(
            identifier: "conversion-\(conversion.id.uuidString)-failed",
            content: content,
            trigger: nil
        )
        try? await center.add(request)
    }

    func registerCategories() {
        let open = UNNotificationAction(
            identifier: "OPEN_CONVERSION",
            title: "Open",
            options: [.foreground]
        )
        let retry = UNNotificationAction(
            identifier: "RETRY_CONVERSION",
            title: "Retry",
            options: [.foreground]
        )
        center.setNotificationCategories([
            UNNotificationCategory(
                identifier: "CONVERSION_COMPLETE",
                actions: [open],
                intentIdentifiers: []
            ),
            UNNotificationCategory(
                identifier: "CONVERSION_FAILED",
                actions: [retry, open],
                intentIdentifiers: []
            )
        ])
    }
}
