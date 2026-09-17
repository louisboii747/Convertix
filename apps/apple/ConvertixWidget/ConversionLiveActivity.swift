import ActivityKit
import SwiftUI
import WidgetKit

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

struct ConversionLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ConversionActivityAttributes.self) { context in
            ConversionActivityLockScreenView(context: context)
                .activityBackgroundTint(Color.blue.opacity(0.12))
                .activitySystemActionForegroundColor(.blue)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "arrow.left.arrow.right")
                        .foregroundStyle(.blue)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.progress, format: .percent.precision(.fractionLength(0)))
                        .font(.headline)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(context.state.stage)
                            .font(.headline)
                        ProgressView(value: context.state.progress)
                            .tint(.blue)
                    }
                }
            } compactLeading: {
                Image(systemName: "arrow.left.arrow.right")
                    .foregroundStyle(.blue)
            } compactTrailing: {
                Text(context.state.progress, format: .percent.precision(.fractionLength(0)))
                    .monospacedDigit()
            } minimal: {
                Image(systemName: "arrow.left.arrow.right")
                    .foregroundStyle(.blue)
            }
            .widgetURL(URL(string: "convertix://activity/\(context.attributes.conversionID)"))
            .keylineTint(.blue)
        }
    }
}

struct ConversionActivityLockScreenView: View {
    let context: ActivityViewContext<ConversionActivityAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Label("Convertix", systemImage: "arrow.left.arrow.right")
                    .font(.headline)
                Spacer()
                Text(context.state.progress, format: .percent.precision(.fractionLength(0)))
                    .font(.headline)
                    .monospacedDigit()
            }

            Text(context.attributes.fileName)
                .lineLimit(1)

            HStack {
                Text("\(context.attributes.sourceFormat) → \(context.attributes.targetFormat)")
                    .font(.subheadline.weight(.semibold))
                Spacer()
                Text(context.state.stage)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            ProgressView(value: context.state.progress)
                .tint(.blue)
        }
        .padding()
    }
}
