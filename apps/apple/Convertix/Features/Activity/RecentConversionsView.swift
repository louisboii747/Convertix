import SwiftUI

#if os(macOS)
import AppKit
#endif

struct ConversionDashboardSummary: View {
    let recentConversions: [ClientConversion]
    let statistics: ConversionStatistics

    var body: some View {
        if !recentConversions.isEmpty || statistics.convertedFiles > 0 {
            VStack(alignment: .leading, spacing: 16) {
                ViewThatFits {
                    HStack(spacing: 12) {
                        statisticCards
                    }
                    VStack(spacing: 12) {
                        statisticCards
                    }
                }

                if !recentConversions.isEmpty {
                    RecentConversionsView(conversions: recentConversions)
                }
            }
        }
    }

    @ViewBuilder
    private var statisticCards: some View {
        StatisticCard(
            title: "Files converted",
            value: statistics.convertedFiles.formatted(),
            symbol: "doc.on.doc"
        )
        StatisticCard(
            title: "Storage saved",
            value: ByteCountFormatter.string(
                fromByteCount: statistics.bytesSaved,
                countStyle: .file
            ),
            symbol: "internaldrive"
        )
    }
}

private struct StatisticCard: View {
    let title: LocalizedStringResource
    let value: String
    let symbol: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.title2)
                .foregroundStyle(ConvertixTheme.cobalt)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.title3.bold())
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .convertixGlassPanel(cornerRadius: 16)
        .accessibilityElement(children: .combine)
    }
}

struct RecentConversionsView: View {
    let conversions: [ClientConversion]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Recent")
                .font(.title2.bold())
                .accessibilityAddTraits(.isHeader)

            ForEach(conversions.prefix(5)) { conversion in
                RecentConversionRow(conversion: conversion)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct RecentConversionRow: View {
    let conversion: ClientConversion

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: conversion.phase == .completed
                ? "checkmark.circle.fill"
                : "exclamationmark.circle.fill")
                .foregroundStyle(conversion.phase == .completed ? .green : .red)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                Text(conversion.inputFilename)
                    .truncationMode(.middle)
                Text("\(conversion.inputFormat.uppercased()) → \(conversion.outputFormat.uppercased())")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

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
        }
        .padding(12)
        .background(.background.opacity(0.55), in: RoundedRectangle(cornerRadius: 12))
        .accessibilityElement(children: .contain)
    }
}
