import SwiftUI

struct ActivityHistoryView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        ZStack {
            ConvertixBackdrop()

            switch appState.sessionState {
            case .restoring:
                ProgressView("Loading your history…")
            case .signedOut:
                ContentUnavailableView(
                    "Sign In to View History",
                    systemImage: "clock.arrow.trianglehead.counterclockwise.rotate.90",
                    description: Text("Your completed conversions appear here when you use a Convertix account.")
                )
            case .signedIn:
                ConversionHistoryList(
                    entries: appState.history,
                    isLoading: appState.isLoadingHistory,
                    errorMessage: appState.historyError
                )
                .refreshable {
                    await appState.loadHistory()
                }
            }
        }
        .navigationTitle("Activity")
        .task {
            if case .signedIn = appState.sessionState, appState.history.isEmpty {
                await appState.loadHistory()
            }
        }
    }
}

struct ConversionHistoryList: View {
    let entries: [ConversionHistoryEntry]
    let isLoading: Bool
    let errorMessage: String?

    var body: some View {
        if entries.isEmpty, isLoading {
            ProgressView("Loading conversions…")
        } else if entries.isEmpty {
            ContentUnavailableView(
                "No Conversions Yet",
                systemImage: "doc.badge.clock",
                description: Text(errorMessage ?? "Completed conversions will appear here.")
            )
        } else {
            List {
                if let errorMessage {
                    Section {
                        Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                            .foregroundStyle(.orange)
                    }
                }

                Section("Recent") {
                    ForEach(entries) { conversion in
                        ConversionHistoryRow(
                            fileName: conversion.originalFilename,
                            sourceFormat: conversion.sourceFormat,
                            targetFormat: conversion.targetFormat,
                            status: conversion.status,
                            inputSize: conversion.inputSize,
                            outputSize: conversion.outputSize,
                            createdAt: conversion.createdAt
                        )
                    }
                }
            }
            .scrollContentBackground(.hidden)
        }
    }
}

struct ConversionHistoryRow: View {
    let fileName: String
    let sourceFormat: String
    let targetFormat: String
    let status: String
    let inputSize: Int64?
    let outputSize: Int64?
    let createdAt: Date

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: statusSymbol)
                .font(.title2)
                .foregroundStyle(statusColor)
                .frame(width: 28)
                .accessibilityLabel(status.capitalized)

            VStack(alignment: .leading, spacing: 4) {
                Text(fileName)
                    .font(.headline)
                    .lineLimit(1)

                Text("\(sourceFormat.uppercased()) → \(targetFormat.uppercased())")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                if let sizeDescription {
                    Text(sizeDescription)
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }

            Spacer(minLength: 12)

            Text(createdAt, style: .relative)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 5)
    }

    private var statusSymbol: String {
        switch status {
        case "completed": "checkmark.circle.fill"
        case "failed": "exclamationmark.circle.fill"
        case "processing": "gearshape.2.fill"
        default: "clock.fill"
        }
    }

    private var statusColor: Color {
        switch status {
        case "completed": .green
        case "failed": .red
        default: .orange
        }
    }

    private var sizeDescription: String? {
        guard let inputSize else { return nil }

        let input = ByteCountFormatter.string(
            fromByteCount: inputSize,
            countStyle: .file
        )
        guard let outputSize else { return input }

        let output = ByteCountFormatter.string(
            fromByteCount: outputSize,
            countStyle: .file
        )
        return "\(input) → \(output)"
    }
}

#Preview {
    NavigationStack {
        ActivityHistoryView()
    }
    .environment(AppState())
}
