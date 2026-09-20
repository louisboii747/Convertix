import SwiftUI

#if os(macOS)
import AppKit
#endif

struct ConverterPanel: View {
    @Binding var selectedRoute: ConversionRoute
    let availableRoutes: [ConversionRoute]
    let selectedFileName: String?
    let fileSelectionError: String?
    let conversionStatus: ConversionStatus
    let downloadedFileURL: URL?
    let isDownloading: Bool
    let downloadError: String?
    let chooseFile: () -> Void
    let clearFile: () -> Void
    let startConversion: () -> Void
    let downloadResult: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            FileDropArea(fileName: selectedFileName, chooseFile: chooseFile, clearFile: clearFile)

            ViewThatFits {
                HStack(spacing: 12) {
                    ConversionFormatControls(
                        selectedRoute: $selectedRoute,
                        availableRoutes: availableRoutes
                    )
                }
                VStack(spacing: 12) {
                    ConversionFormatControls(
                        selectedRoute: $selectedRoute,
                        availableRoutes: availableRoutes,
                        isVertical: true
                    )
                }
            }

            Button(buttonTitle, action: startConversion)
            .buttonStyle(ConvertixFlowButtonStyle())
            .controlSize(.large)
            .disabled(
                selectedFileName == nil
                    || availableRoutes.isEmpty
                    || conversionStatus.isRunning
            )

            if let fileSelectionError {
                Label(fileSelectionError, systemImage: "exclamationmark.triangle.fill")
                    .font(.callout)
                    .foregroundStyle(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else if conversionStatus.isRunning {
                VStack(spacing: 12) {
                    ProgressView()
                        .controlSize(.large)

                    Text(conversionStatus.message ?? "Converting…")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .center)
                .accessibilityElement(children: .combine)
                .accessibilityLabel(conversionStatus.message ?? "Converting…")
            } else if case .completed = conversionStatus {
                ConversionResultActions(
                    downloadedFileURL: downloadedFileURL,
                    isDownloading: isDownloading,
                    errorMessage: downloadError,
                    downloadResult: downloadResult
                )
            } else if case let .failed(message) = conversionStatus {
                Label(message, systemImage: "exclamationmark.triangle.fill")
                    .font(.callout)
                    .foregroundStyle(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(22)
        .convertixGlassPanel(cornerRadius: 24)
    }

    private var buttonTitle: String {
        if selectedFileName == nil {
            return "Choose a file first"
        }
        if conversionStatus.isRunning {
            return conversionStatus.message ?? "Converting…"
        }
        return "Start conversion"
    }
}

private struct ConvertixFlowButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        FlowButtonBody(configuration: configuration)
    }

    private struct FlowButtonBody: View {
        @Environment(\.isEnabled) private var isEnabled
        @Environment(\.accessibilityReduceMotion) private var reduceMotion
        @State private var isHovering = false

        let configuration: Configuration

        private var isActive: Bool {
            isEnabled && (isHovering || configuration.isPressed)
        }

        var body: some View {
            ZStack {
                Circle()
                    .fill(Color(red: 0.05, green: 0.11, blue: 0.20))
                    .frame(width: 20, height: 20)
                    .scaleEffect(isActive ? 60 : 1)
                    .opacity(isActive ? 1 : 0)

                HStack(spacing: 8) {
                    Image(systemName: "arrow.right")
                        .offset(x: isActive ? 0 : -70)
                        .opacity(isActive ? 1 : 0)

                    configuration.label
                        .fontWeight(.semibold)
                        .offset(x: isActive ? 12 : -12)

                    Image(systemName: "arrow.right")
                        .offset(x: isActive ? 70 : 0)
                        .opacity(isActive ? 0 : 1)
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 22)
                .padding(.vertical, 13)
            }
            .frame(maxWidth: .infinity)
            .background(isEnabled ? ConvertixTheme.cobalt : Color.secondary.opacity(0.18))
            .foregroundStyle(isEnabled ? Color.white : Color.secondary)
            .clipShape(.rect(cornerRadius: isActive ? 12 : 22))
            .contentShape(.rect)
            .scaleEffect(configuration.isPressed && isEnabled ? 0.97 : 1)
            .animation(
                reduceMotion ? nil : .spring(response: 0.8, dampingFraction: 0.78),
                value: isActive
            )
            .animation(
                reduceMotion ? nil : .easeOut(duration: 0.16),
                value: configuration.isPressed
            )
            .onHover { isHovering = $0 }
        }
    }
}

struct ConversionResultActions: View {
    let downloadedFileURL: URL?
    let isDownloading: Bool
    let errorMessage: String?
    let downloadResult: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let downloadedFileURL {
                ShareLink(item: downloadedFileURL) {
                    Label("Save or Share File", systemImage: "square.and.arrow.up")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)

#if os(macOS)
                Button("Reveal in Finder", systemImage: "folder") {
                    NSWorkspace.shared.activateFileViewerSelecting([downloadedFileURL])
                }
                .buttonStyle(.bordered)
#endif
            } else {
                Button(action: downloadResult) {
                    if isDownloading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Label("Download Converted File", systemImage: "arrow.down.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isDownloading)
            }

            if let errorMessage {
                Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                    .font(.callout)
                    .foregroundStyle(.red)
            }
        }
    }
}

struct ConversionFormatControls: View {
    @Binding var selectedRoute: ConversionRoute
    let availableRoutes: [ConversionRoute]
    var isVertical = false

    var body: some View {
        FormatStep(number: 1, label: "From", format: selectedRoute.source, color: .orange)

        Image(systemName: isVertical ? "arrow.down" : "arrow.right")
            .font(.headline)
            .foregroundStyle(.tertiary)
            .accessibilityHidden(true)

        Menu {
            ForEach(availableRoutes) { route in
                Button(route.target) { selectedRoute = route }
            }
        } label: {
            FormatStep(number: 2, label: "Convert to", format: selectedRoute.target, color: ConvertixTheme.cobalt)
        }
        .buttonStyle(.plain)
        .disabled(availableRoutes.isEmpty)
        .accessibilityLabel("Output format, \(selectedRoute.target)")
    }
}

struct FileDropArea: View {
    let fileName: String?
    let chooseFile: () -> Void
    let clearFile: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: fileName == nil ? "doc.badge.plus" : "doc.fill")
                .font(.system(size: 34, weight: .semibold))
                .foregroundStyle(ConvertixTheme.cobalt)
                .frame(width: 64, height: 64)
                .background(ConvertixTheme.cobalt.opacity(0.12), in: RoundedRectangle(cornerRadius: 16, style: .continuous))

            Text(fileName ?? "Choose a file to convert")
                .font(.title3.weight(.semibold))
                .lineLimit(1)

            Text(fileName == nil ? "Browse Files or select a recent document" : "Ready to convert · Up to 100 MB")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            HStack {
                Button(fileName == nil ? "Browse Files" : "Choose another", systemImage: "folder") {
                    chooseFile()
                }
                .buttonStyle(.bordered)

                if fileName != nil {
                    Button("Remove", systemImage: "xmark", role: .destructive) {
                        clearFile()
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
        .padding(.horizontal)
        .background(.background.opacity(0.55), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(ConvertixTheme.line.opacity(0.7), lineWidth: 1)
        }
    }
}

struct FormatStep: View {
    let number: Int
    let label: String
    let format: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Text("\(number)")
                .font(.caption.bold())
                .foregroundStyle(.white)
                .frame(width: 28, height: 28)
                .background(color, in: Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(format)
                    .font(.headline)
                    .foregroundStyle(.primary)
            }

            Spacer(minLength: 0)
        }
        .padding(14)
        .frame(maxWidth: .infinity)
        .background(.background.opacity(0.6), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

struct ConversionNotes: View {
    var body: some View {
        ViewThatFits {
            HStack(spacing: 24) { ConversionNoteLabels() }
            VStack(alignment: .leading, spacing: 10) { ConversionNoteLabels() }
        }
        .font(.footnote.weight(.medium))
        .foregroundStyle(.secondary)
    }

}

struct ConversionNoteLabels: View {
    var body: some View {
        Label("No account needed", systemImage: "person.crop.circle.badge.checkmark")
        Label("100 MB file limit", systemImage: "externaldrive")
        Label("Uploads only when you start", systemImage: "lock.shield")
    }
}

struct ConversionQueuePanel: View {
    let jobs: [ConversionJob]
    let download: (UUID) -> Void
    let remove: (UUID) -> Void
    let clearFinished: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text("Conversion Queue")
                        .font(.title2.bold())
                    Text(jobs.count == 1 ? "1 file" : "\(jobs.count) files")
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button("Clear Finished", action: clearFinished)
                    .disabled(!jobs.contains { !$0.status.isRunning })
            }

            ForEach(jobs) { job in
                ConversionQueueRow(
                    job: job,
                    download: { download(job.id) },
                    remove: { remove(job.id) }
                )
            }
        }
        .padding(20)
        .convertixGlassPanel(cornerRadius: 20)
    }
}

private struct ConversionQueueRow: View {
    let job: ConversionJob
    let download: () -> Void
    let remove: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.title3)
                .foregroundStyle(tint)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 3) {
                Text(job.fileName)
                    .font(.headline)
                    .lineLimit(1)
                Text("\(job.route.source) → \(job.route.target) · \(statusText)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if job.status.isRunning {
                ProgressView()
                    .controlSize(.small)
            } else if job.result != nil, job.downloadedFileURL == nil {
                Button("Download", systemImage: "arrow.down.circle", action: download)
                    .labelStyle(.iconOnly)
            } else if let url = job.downloadedFileURL {
                ShareLink(item: url) {
                    Image(systemName: "square.and.arrow.up")
                }
            }

            Button("Remove", systemImage: "xmark", action: remove)
                .labelStyle(.iconOnly)
                .buttonStyle(.plain)
        }
        .padding(12)
        .background(.background.opacity(0.55), in: RoundedRectangle(cornerRadius: 12))
    }

    private var statusText: String {
        job.status.message ?? "Waiting"
    }

    private var symbol: String {
        switch job.status {
        case .completed: "checkmark.circle.fill"
        case .failed: "exclamationmark.circle.fill"
        case .idle: "pause.circle"
        default: "arrow.trianglehead.2.clockwise.rotate.90"
        }
    }

    private var tint: Color {
        switch job.status {
        case .completed: .green
        case .failed: .red
        default: ConvertixTheme.cobalt
        }
    }
}

struct PopularConversions: View {
    let routes: [ConversionRoute]
    @Binding var selectedRoute: ConversionRoute
    @AppStorage("favoriteConversionRouteIDs") private var storedFavoriteIDs = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Conversion shortcuts")
                .font(.title2.bold())
            Text("Choose a format pair or keep favourites at the front.")
                .foregroundStyle(.secondary)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 210), spacing: 12)], spacing: 12) {
                ForEach(sortedRoutes) { route in
                    HStack(spacing: 0) {
                        Button {
                            selectedRoute = route
                        } label: {
                            HStack {
                                Image(systemName: route.family.systemImage)
                                    .foregroundStyle(ConvertixTheme.cobalt)
                                Text(route.title)
                                    .fontWeight(.semibold)
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .foregroundStyle(.tertiary)
                            }
                            .contentShape(.rect)
                        }
                        .buttonStyle(.plain)

                        Button {
                            toggleFavorite(route.id)
                        } label: {
                            Image(systemName: favoriteIDs.contains(route.id) ? "star.fill" : "star")
                                .foregroundStyle(
                                    favoriteIDs.contains(route.id) ? Color.yellow : Color.secondary
                                )
                                .padding(8)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(
                            favoriteIDs.contains(route.id)
                                ? "Remove (route.title) from favourites"
                                : "Add (route.title) to favourites"
                        )
                    }
                    .padding()
                    .background(
                        .regularMaterial,
                        in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                    )
                    .overlay {
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(ConvertixTheme.line.opacity(0.4), lineWidth: 0.5)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var favoriteIDs: Set<String> {
        Set(storedFavoriteIDs.split(separator: ",").map(String.init))
    }

    private var sortedRoutes: [ConversionRoute] {
        routes.sorted { left, right in
            let leftIsFavorite = favoriteIDs.contains(left.id)
            let rightIsFavorite = favoriteIDs.contains(right.id)
            if leftIsFavorite != rightIsFavorite {
                return leftIsFavorite
            }
            return left.title < right.title
        }
    }

    private func toggleFavorite(_ id: String) {
        var ids = favoriteIDs
        if !ids.insert(id).inserted {
            ids.remove(id)
        }
        storedFavoriteIDs = ids.sorted().joined(separator: ",")
    }
}
