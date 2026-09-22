import SwiftUI

#if os(macOS)
import AppKit
#endif

struct NativeConversionQueuePanel: View {
    let conversions: [ClientConversion]
    let retry: (UUID) -> Void
    let cancel: (UUID) -> Void
    let remove: (UUID) -> Void
    let clearFinished: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            header

            ForEach(batchIDs, id: \.self) { batchID in
                let jobs = conversions.filter { $0.batchID == batchID }
                ConversionBatchSection(
                    batch: ConversionBatch(id: batchID, jobs: jobs),
                    retry: retry,
                    cancel: cancel,
                    remove: remove
                )
            }

            ForEach(conversions.filter { $0.batchID == nil }) { conversion in
                NativeConversionQueueRow(
                    conversion: conversion,
                    retry: { retry(conversion.id) },
                    cancel: { cancel(conversion.id) },
                    remove: { remove(conversion.id) }
                )
            }
        }
        .padding(20)
        .convertixGlassPanel(cornerRadius: 20)
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text("Conversion Queue")
                    .font(.title2.bold())
                    .accessibilityAddTraits(.isHeader)
                Text("\(conversions.count) file(s)")
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Button("Clear Finished", action: clearFinished)
                .disabled(!conversions.contains { $0.phase.isFinished })
        }
    }

    private var batchIDs: [UUID] {
        var seen: Set<UUID> = []
        return conversions.compactMap(\.batchID).filter { seen.insert($0).inserted }
    }
}

private struct ConversionBatchSection: View {
    let batch: ConversionBatch
    let retry: (UUID) -> Void
    let cancel: (UUID) -> Void
    let remove: (UUID) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(batchTitle)
                        .font(.headline)
                        .accessibilityAddTraits(.isHeader)
                    Text("\(batch.completedCount) of \(batch.jobs.count) files")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text(batch.progress, format: .percent.precision(.fractionLength(0)))
                    .monospacedDigit()
                    .foregroundStyle(.secondary)
            }

            ProgressView(value: batch.progress)
                .accessibilityLabel("Batch conversion progress")
                .accessibilityValue(
                    Text("\(batch.completedCount) of \(batch.jobs.count) files completed")
                )

            ForEach(batch.jobs) { conversion in
                NativeConversionQueueRow(
                    conversion: conversion,
                    retry: { retry(conversion.id) },
                    cancel: { cancel(conversion.id) },
                    remove: { remove(conversion.id) }
                )
            }
        }
        .padding(12)
        .background(.background.opacity(0.45), in: RoundedRectangle(cornerRadius: 14))
    }

    private var batchTitle: String {
        let formats = Set(batch.jobs.map { "\($0.inputFormat.uppercased()) → \($0.outputFormat.uppercased())" })
        return formats.count == 1 ? formats.first ?? "Batch Conversion" : "Batch Conversion"
    }
}

struct NativeConversionQueueRow: View {
    let conversion: ClientConversion
    let retry: () -> Void
    let cancel: () -> Void
    let remove: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.title3)
                .foregroundStyle(tint)
                .frame(width: 28)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 4) {
                Text(conversion.inputFilename)
                    .font(.headline)
                    .truncationMode(.middle)

                Text("\(conversion.inputFormat.uppercased()) → \(conversion.outputFormat.uppercased()) · \(phaseTitle)")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if let progress = conversion.progress, conversion.phase.isActive {
                    ProgressView(value: progress)
                        .accessibilityLabel("Conversion progress")
                        .accessibilityValue(
                            Text(progress, format: .percent.precision(.fractionLength(0)))
                        )
                }

                if let errorDescription = conversion.errorDescription {
                    Text(errorDescription)
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            }

            Spacer(minLength: 8)
            actions
        }
        .padding(12)
        .background(.background.opacity(0.55), in: RoundedRectangle(cornerRadius: 12))
        .accessibilityElement(children: .contain)
        .contextMenu {
            contextActions
        }
    }

    @ViewBuilder
    private var actions: some View {
        if conversion.phase.isActive || conversion.phase == .queued {
            Button("Cancel", systemImage: "stop.circle", action: cancel)
                .labelStyle(.iconOnly)
                .accessibilityLabel("Cancel conversion")
        } else if conversion.phase == .failed || conversion.phase == .cancelled {
            Button("Retry", systemImage: "arrow.clockwise", action: retry)
                .labelStyle(.iconOnly)
        }

        if let outputURL = conversion.outputURL {
#if os(macOS)
            Button("Open", systemImage: "arrow.up.forward.app") {
                NSWorkspace.shared.open(outputURL)
            }
            .labelStyle(.iconOnly)
            .accessibilityLabel("Open converted file")
#else
            ShareLink(item: outputURL) {
                Label("Share", systemImage: "square.and.arrow.up")
                    .labelStyle(.iconOnly)
            }
#endif
        }

        if conversion.phase.isFinished {
            Button("Remove", systemImage: "xmark", action: remove)
                .labelStyle(.iconOnly)
                .buttonStyle(.plain)
        }
    }

    @ViewBuilder
    private var contextActions: some View {
        if let outputURL = conversion.outputURL {
#if os(macOS)
            Button("Open") {
                NSWorkspace.shared.open(outputURL)
            }
            Button("Reveal in Finder") {
                NSWorkspace.shared.activateFileViewerSelecting([outputURL])
            }
#else
            ShareLink("Share", item: outputURL)
#endif
        }

        if conversion.phase == .failed || conversion.phase == .cancelled {
            Button("Retry", action: retry)
        }
        if conversion.phase.isActive || conversion.phase == .queued {
            Button("Cancel", role: .destructive, action: cancel)
        }
        if conversion.phase.isFinished {
            Button("Remove", role: .destructive, action: remove)
        }
    }

    private var phaseTitle: String {
        switch conversion.phase {
        case .queued: "Waiting"
        case .preparing: "Preparing"
        case .uploading: "Uploading securely"
        case .converting:
            conversion.execution == .local ? "Processing on this device" : "Converting"
        case .downloading: "Downloading"
        case .saving: "Saving"
        case .completed:
            conversion.execution == .local ? "Completed on this device" : "Completed"
        case .failed: "Failed"
        case .cancelled: "Cancelled"
        }
    }

    private var symbol: String {
        switch conversion.phase {
        case .completed: "checkmark.circle.fill"
        case .failed: "exclamationmark.circle.fill"
        case .cancelled: "xmark.circle.fill"
        case .queued: "clock"
        default: "arrow.trianglehead.2.clockwise.rotate.90"
        }
    }

    private var tint: Color {
        switch conversion.phase {
        case .completed: .green
        case .failed: .red
        case .cancelled: .secondary
        default: ConvertixTheme.cobalt
        }
    }
}
