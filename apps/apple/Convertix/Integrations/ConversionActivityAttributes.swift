#if os(iOS) && canImport(ActivityKit)
import ActivityKit
import Foundation

@available(iOS 16.1, *)
struct ConversionActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var progress: Double
        var stage: String
        var estimatedCompletion: Date?
    }

    var conversionID: String
    var fileName: String
    var sourceFormat: String
    var targetFormat: String
}
#endif
