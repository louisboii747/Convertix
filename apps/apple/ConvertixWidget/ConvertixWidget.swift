import SwiftUI
import WidgetKit

struct ConvertixWidgetEntry: TimelineEntry {
    let date: Date
}

struct ConvertixWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> ConvertixWidgetEntry {
        ConvertixWidgetEntry(date: .now)
    }

    func getSnapshot(
        in context: Context,
        completion: @escaping (ConvertixWidgetEntry) -> Void
    ) {
        completion(ConvertixWidgetEntry(date: .now))
    }

    func getTimeline(
        in context: Context,
        completion: @escaping (Timeline<ConvertixWidgetEntry>) -> Void
    ) {
        completion(Timeline(entries: [ConvertixWidgetEntry(date: .now)], policy: .never))
    }
}

struct ConvertixWidgetView: View {
    let entry: ConvertixWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Convertix", systemImage: "arrow.left.arrow.right")
                .font(.headline)
                .foregroundStyle(.blue)

            Text("Quick conversions")
                .font(.caption)
                .foregroundStyle(.secondary)

            Link(destination: URL(string: "convertix://convert/heic-jpg")!) {
                Label("HEIC → JPG", systemImage: "photo")
                    .font(.title3.bold())
            }

            Link(destination: URL(string: "convertix://convert/png-jpg")!) {
                Label("PNG → JPG", systemImage: "photo")
                    .font(.subheadline.weight(.semibold))
            }

            Spacer(minLength: 0)

            Text("Tap a shortcut to choose a file")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct ConvertixWidget: Widget {
    let kind = "uk.convertix.widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ConvertixWidgetProvider()) { entry in
            ConvertixWidgetView(entry: entry)
        }
        .configurationDisplayName("Quick conversions")
        .description("Open Convertix and get started with common file conversions.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

#Preview(as: .systemSmall) {
    ConvertixWidget()
} timeline: {
    ConvertixWidgetEntry(date: .now)
}
