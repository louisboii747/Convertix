#if os(macOS)
import AppKit
import SwiftUI
import UniformTypeIdentifiers

struct MacConverterPanel: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Binding var selectedRoute: ConversionRoute
    let availableRoutes: [ConversionRoute]
    let selectedFileURL: URL?
    let selectedFileSize: Int64?
    let fileSelectionError: String?
    let conversionStatus: ConversionStatus
    let downloadedFileURL: URL?
    let isDownloading: Bool
    let downloadError: String?
    let chooseFile: () -> Void
    let acceptDroppedFile: (URL) -> Void
    let clearFile: () -> Void
    let startConversion: () -> Void
    let downloadResult: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            MacFileSelectionRow(
                fileURL: selectedFileURL,
                fileSize: selectedFileSize,
                chooseFile: chooseFile,
                acceptDroppedFile: acceptDroppedFile,
                clearFile: clearFile
            )

            if selectedFileURL != nil {
                Divider()
                    .padding(.vertical, 18)

                MacFormatStrip(
                    selectedRoute: $selectedRoute,
                    availableRoutes: availableRoutes
                )

                MacConversionActionArea(
                    targetFormat: selectedRoute.target,
                    status: conversionStatus,
                    downloadedFileURL: downloadedFileURL,
                    isDownloading: isDownloading,
                    downloadError: downloadError,
                    isEnabled: !availableRoutes.isEmpty,
                    startConversion: startConversion,
                    downloadResult: downloadResult,
                    startAnother: clearFile
                )
                .padding(.top, 20)
                .transition(reduceMotion ? .identity : .opacity.combined(with: .move(edge: .top)))
            }

            if let fileSelectionError {
                Label(fileSelectionError, systemImage: "exclamationmark.triangle.fill")
                    .font(.callout)
                    .foregroundStyle(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 12)
                    .transition(reduceMotion ? .identity : .opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding(20)
        .background(.background.secondary, in: RoundedRectangle(cornerRadius: 12))
        .overlay {
            RoundedRectangle(cornerRadius: 12)
                .stroke(.separator.opacity(0.55), lineWidth: 0.5)
        }
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.22), value: conversionStatus)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.22), value: selectedFileURL != nil)
    }
}

private struct MacFileSelectionRow: View {
    let fileURL: URL?
    let fileSize: Int64?
    let chooseFile: () -> Void
    let acceptDroppedFile: (URL) -> Void
    let clearFile: () -> Void
    @State private var isDropTargeted = false

    var body: some View {
        HStack(spacing: 14) {
            fileIcon

            VStack(alignment: .leading, spacing: 3) {
                Text(fileURL?.lastPathComponent ?? "Choose a file to convert")
                    .font(.headline)
                    .lineLimit(1)
                    .truncationMode(.middle)

                Text(metadata)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 16)

            Button(fileURL == nil ? "Choose File…" : "Change…", action: chooseFile)
                .controlSize(.small)

            if fileURL != nil {
                Button("Remove File", systemImage: "xmark", role: .destructive, action: clearFile)
                    .labelStyle(.iconOnly)
                    .buttonStyle(.borderless)
                    .controlSize(.small)
                    .help("Remove selected file")
            }
        }
        .padding(10)
        .background(
            isDropTargeted ? Color.accentColor.opacity(0.08) : Color.clear,
            in: RoundedRectangle(cornerRadius: 8)
        )
        .contentShape(.rect)
        .dropDestination(for: URL.self) { urls, _ in
            guard let url = urls.first else { return false }
            acceptDroppedFile(url)
            return true
        } isTargeted: {
            isDropTargeted = $0
        }
        .accessibilityElement(children: .contain)
    }

    private var fileIcon: some View {
        Image(systemName: fileURL == nil ? "doc.badge.plus" : iconName)
            .font(.system(size: 24, weight: .regular))
            .foregroundStyle(fileURL == nil ? Color.secondary : Color.accentColor)
            .frame(width: 38, height: 38)
            .background(.quaternary, in: RoundedRectangle(cornerRadius: 8))
            .accessibilityHidden(true)
    }

    private var iconName: String {
        switch fileURL?.pathExtension.lowercased() {
        case "jpg", "jpeg", "png", "webp", "heic", "heif", "svg":
            "photo"
        case "mp3", "wav":
            "waveform"
        case "mp4", "webm":
            "film"
        case "pdf":
            "doc.richtext"
        default:
            "doc"
        }
    }

    private var metadata: String {
        guard let fileURL else {
            return "Drop a file here or choose one from Finder"
        }
        let fileType = UTType(filenameExtension: fileURL.pathExtension)?
            .localizedDescription
            ?? "\(fileURL.pathExtension.uppercased()) file"
        guard let fileSize else {
            return "\(fileType) · Maximum 100 MB"
        }
        let size = ByteCountFormatter.string(fromByteCount: fileSize, countStyle: .file)
        return "\(fileType) · \(size)"
    }
}

private struct MacFormatStrip: View {
    @Binding var selectedRoute: ConversionRoute
    let availableRoutes: [ConversionRoute]

    var body: some View {
        HStack(spacing: 14) {
            MacFormatValue(caption: "From", format: selectedRoute.source)

            Image(systemName: "arrow.right")
                .foregroundStyle(.tertiary)
                .accessibilityHidden(true)

            MacDestinationFormatSelector(
                selectedRoute: $selectedRoute,
                availableRoutes: availableRoutes
            )

            Spacer()
        }
    }
}

private struct MacDestinationFormatSelector: View {
    @Binding var selectedRoute: ConversionRoute
    let availableRoutes: [ConversionRoute]

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text("To")
                .font(.caption)
                .foregroundStyle(.secondary)

            Menu {
                ForEach(availableRoutes) { route in
                    Button(route.target) {
                        selectedRoute = route
                    }
                }
            } label: {
                Text(selectedRoute.target)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.primary)
            }
            .menuStyle(.borderlessButton)
            .fixedSize()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(.quaternary, in: RoundedRectangle(cornerRadius: 7))
        .disabled(availableRoutes.isEmpty)
        .accessibilityLabel("Output format, \(selectedRoute.target)")
    }
}

private struct MacFormatValue: View {
    let caption: LocalizedStringResource
    let format: String
    var showsChevron = false

    var body: some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(caption)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(format)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.primary)
            }

            if showsChevron {
                Image(systemName: "chevron.up.chevron.down")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(.quaternary, in: RoundedRectangle(cornerRadius: 7))
    }
}

private struct MacConversionActionArea: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let targetFormat: String
    let status: ConversionStatus
    let downloadedFileURL: URL?
    let isDownloading: Bool
    let downloadError: String?
    let isEnabled: Bool
    let startConversion: () -> Void
    let downloadResult: () -> Void
    let startAnother: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if status.isRunning {
                MacConversionProgress(status: status)
                    .transition(transition)
            } else if case .completed = status {
                MacCompletedActions(
                    targetFormat: targetFormat,
                    downloadedFileURL: downloadedFileURL,
                    isDownloading: isDownloading,
                    downloadError: downloadError,
                    downloadResult: downloadResult,
                    startAnother: startAnother
                )
                .transition(transition)
            } else {
                Button("Convert to \(targetFormat)", action: startConversion)
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .disabled(!isEnabled)
                    .keyboardShortcut(.defaultAction)
                    .transition(transition)

                if case let .failed(message) = status {
                    Label(message, systemImage: "exclamationmark.triangle.fill")
                        .font(.callout)
                        .foregroundStyle(.red)
                        .transition(transition)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.22), value: status)
    }

    private var transition: AnyTransition {
        reduceMotion ? .identity : .opacity.combined(with: .move(edge: .bottom))
    }
}

private struct MacConversionProgress: View {
    let status: ConversionStatus

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ProgressView()
                .progressViewStyle(.linear)
                .accessibilityLabel(status.message ?? "Converting")

            HStack(spacing: 8) {
                ConversionStage(
                    title: "Uploading",
                    symbol: stageIndex >= 1 ? "checkmark.circle.fill" : "circle",
                    isCurrent: stageIndex == 0
                )
                stageSeparator
                ConversionStage(
                    title: "Converting",
                    symbol: stageIndex >= 2 ? "checkmark.circle.fill" : "circle",
                    isCurrent: stageIndex == 1
                )
                stageSeparator
                ConversionStage(
                    title: "Complete",
                    symbol: "circle",
                    isCurrent: false
                )
            }
            .font(.caption)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(status.message ?? "Converting")
    }

    private var stageIndex: Int {
        switch status {
        case .uploading: 0
        case .queued, .processing: 1
        case .completed: 2
        default: 0
        }
    }

    private var stageSeparator: some View {
        Rectangle()
            .fill(.separator)
            .frame(width: 22, height: 1)
            .accessibilityHidden(true)
    }
}

private struct ConversionStage: View {
    let title: LocalizedStringResource
    let symbol: String
    let isCurrent: Bool

    var body: some View {
        Label {
            Text(title)
                .foregroundStyle(isCurrent ? .primary : .secondary)
        } icon: {
            Image(systemName: symbol)
                .foregroundStyle(symbol == "checkmark.circle.fill" ? .green : .secondary)
        }
    }
}

private struct MacCompletedActions: View {
    let targetFormat: String
    let downloadedFileURL: URL?
    let isDownloading: Bool
    let downloadError: String?
    let downloadResult: () -> Void
    let startAnother: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Conversion complete", systemImage: "checkmark.circle.fill")
                .font(.headline)
                .foregroundStyle(.green)

            HStack(spacing: 8) {
                if let downloadedFileURL {
                    Button("Save \(targetFormat)", systemImage: "square.and.arrow.down") {
                        save(downloadedFileURL)
                    }
                    .buttonStyle(.borderedProminent)
                    .keyboardShortcut(.defaultAction)

                    ShareLink(item: downloadedFileURL) {
                        Label("Share", systemImage: "square.and.arrow.up")
                    }
                    .buttonStyle(.bordered)

                    Button("Reveal in Finder", systemImage: "folder") {
                        NSWorkspace.shared.activateFileViewerSelecting([downloadedFileURL])
                    }
                    .buttonStyle(.bordered)
                } else {
                    Button(action: downloadResult) {
                        if isDownloading {
                            ProgressView()
                                .controlSize(.small)
                        } else {
                            Label("Save \(targetFormat)", systemImage: "square.and.arrow.down")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(isDownloading)
                    .keyboardShortcut(.defaultAction)
                }
            }

            Button("New Conversion", systemImage: "plus", action: startAnother)
                .buttonStyle(.link)

            if let downloadError {
                Label(downloadError, systemImage: "exclamationmark.triangle.fill")
                    .font(.callout)
                    .foregroundStyle(.red)
            }
        }
    }

    private func save(_ sourceURL: URL) {
        let panel = NSSavePanel()
        panel.nameFieldStringValue = sourceURL.lastPathComponent
        panel.canCreateDirectories = true
        guard panel.runModal() == .OK, let destinationURL = panel.url else { return }

        do {
            if FileManager.default.fileExists(atPath: destinationURL.path) {
                try FileManager.default.removeItem(at: destinationURL)
            }
            try FileManager.default.copyItem(at: sourceURL, to: destinationURL)
        } catch {
            NSAlert(error: error).runModal()
        }
    }
}

struct MacConversionShortcuts: View {
    let routes: [ConversionRoute]
    @Binding var selectedRoute: ConversionRoute

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Quick Conversions")
                .font(.headline)

            FlowLayout(spacing: 8) {
                ForEach(routes.prefix(8)) { route in
                    Button(route.title) {
                        selectedRoute = route
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct FlowLayout: Layout {
    let spacing: CGFloat

    func sizeThatFits(
        proposal: ProposedViewSize,
        subviews: Subviews,
        cache: inout ()
    ) -> CGSize {
        let result = layout(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(
        in bounds: CGRect,
        proposal: ProposedViewSize,
        subviews: Subviews,
        cache: inout ()
    ) {
        let result = layout(
            proposal: ProposedViewSize(width: bounds.width, height: proposal.height),
            subviews: subviews
        )
        for (index, point) in result.points.enumerated() {
            subviews[index].place(
                at: CGPoint(x: bounds.minX + point.x, y: bounds.minY + point.y),
                proposal: .unspecified
            )
        }
    }

    private func layout(proposal: ProposedViewSize, subviews: Subviews)
        -> (size: CGSize, points: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var points: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var lineHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > 0, x + size.width > maxWidth {
                x = 0
                y += lineHeight + spacing
                lineHeight = 0
            }
            points.append(CGPoint(x: x, y: y))
            x += size.width + spacing
            lineHeight = max(lineHeight, size.height)
        }

        return (
            CGSize(width: maxWidth.isFinite ? maxWidth : x, height: y + lineHeight),
            points
        )
    }
}
#endif
