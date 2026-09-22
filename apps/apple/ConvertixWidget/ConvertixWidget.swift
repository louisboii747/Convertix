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
    @Environment(\.widgetFamily) private var family
    let entry: ConvertixWidgetEntry

    var body: some View {
        switch family {
        case .accessoryCircular:
            Link(destination: deepLink("convert")) {
                VStack(spacing: 2) {
                    Image(systemName: "arrow.trianglehead.2.clockwise.rotate.90")
                    Text("Convert")
                        .font(.caption2)
                }
            }
            .accessibilityLabel("Open Convertix")
        case .accessoryRectangular:
            Link(destination: deepLink("convert")) {
                HStack {
                    Image(systemName: "arrow.trianglehead.2.clockwise.rotate.90")
                    VStack(alignment: .leading) {
                        Text("Convertix")
                            .font(.headline)
                        Text("Convert a file")
                            .font(.caption)
                    }
                }
            }
            .accessibilityLabel("Convert a file with Convertix")
        case .accessoryInline:
            Link("Convert a file with Convertix", destination: deepLink("convert"))
        case .systemSmall:
            smallWidget
        default:
            mediumWidget
        }
    }

    private var smallWidget: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Convertix", systemImage: "arrow.trianglehead.2.clockwise.rotate.90")
                .font(.headline)
                .foregroundStyle(.blue)

            Spacer(minLength: 0)

            Link(destination: deepLink("convert/heic-jpg")) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("HEIC")
                    Image(systemName: "arrow.down")
                        .accessibilityHidden(true)
                    Text("JPEG")
                        .font(.title2.bold())
                }
            }
            .accessibilityLabel("Convert HEIC to JPEG")

            Spacer(minLength: 0)

            Text("Choose a photo")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .containerBackground(.fill.tertiary, for: .widget)
    }

    private var mediumWidget: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Quick Convert", systemImage: "arrow.trianglehead.2.clockwise.rotate.90")
                .font(.headline)
                .foregroundStyle(.blue)

            HStack(spacing: 10) {
                shortcut(
                    "HEIC → JPEG",
                    symbol: "photo",
                    path: "convert/heic-jpg"
                )
                shortcut(
                    "Compress PDF",
                    symbol: "doc.zipper",
                    path: "compress-pdf"
                )
                shortcut(
                    "Optimise SVG",
                    symbol: "scribble.variable",
                    path: "optimise-svg"
                )
            }

            Spacer(minLength: 0)

            Text("Actions open the matching lightweight workflow.")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .containerBackground(.fill.tertiary, for: .widget)
    }

    private func shortcut(
        _ title: LocalizedStringKey,
        symbol: String,
        path: String
    ) -> some View {
        Link(destination: deepLink(path)) {
            VStack(spacing: 6) {
                Image(systemName: symbol)
                    .font(.title3)
                Text(title)
                    .font(.caption.weight(.semibold))
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity, minHeight: 64)
            .background(.quaternary, in: RoundedRectangle(cornerRadius: 10))
        }
    }

    private func deepLink(_ path: String) -> URL {
        var components = URLComponents()
        components.scheme = "convertix"
        let pieces = path.split(separator: "/", maxSplits: 1).map(String.init)
        components.host = pieces.first ?? "convert"
        if pieces.count > 1 {
            components.path = "/\(pieces[1])"
        }
        return components.url ?? URL(fileURLWithPath: "/")
    }
}

struct ConvertixWidget: Widget {
    let kind = "uk.convertix.widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ConvertixWidgetProvider()) { entry in
            ConvertixWidgetView(entry: entry)
        }
        .configurationDisplayName("Convertix")
        .description("Start common conversions from your Home Screen or Lock Screen.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline
        ])
    }
}

#Preview(as: .systemSmall) {
    ConvertixWidget()
} timeline: {
    ConvertixWidgetEntry(date: .now)
}

#Preview(as: .systemMedium) {
    ConvertixWidget()
} timeline: {
    ConvertixWidgetEntry(date: .now)
}
