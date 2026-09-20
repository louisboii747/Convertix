import SwiftUI

struct ActivityHistoryView: View {
    @Environment(AppState.self) private var appState
    @State private var filter = HistoryFilter.all

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
                    entries: filteredEntries,
                    isLoading: appState.isLoadingHistory,
                    errorMessage: appState.historyError,
                    deleteEntry: { entry in
                        Task { await appState.deleteHistoryEntry(entry) }
                    }
                )
                .refreshable {
                    await appState.loadHistory()
                }
            }
        }
        .navigationTitle("Activity")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Picker("Filter", selection: $filter) {
                    ForEach(HistoryFilter.allCases) { filter in
                        Label(filter.title, systemImage: filter.symbol).tag(filter)
                    }
                }
                .pickerStyle(.menu)
            }
        }
        .task {
            if case .signedIn = appState.sessionState, appState.history.isEmpty {
                await appState.loadHistory()
            }
        }
    }

    private var filteredEntries: [ConversionHistoryEntry] {
        switch filter {
        case .all:
            appState.history
        case .completed:
            appState.history.filter { $0.status == "completed" }
        case .failed:
            appState.history.filter { $0.status == "failed" }
        case .images:
            appState.history.filter {
                ["jpg", "jpeg", "png", "webp", "heic", "heif", "svg"].contains($0.sourceFormat)
            }
        case .documents:
            appState.history.filter {
                ["pdf", "docx", "txt", "xlsx"].contains($0.sourceFormat)
            }
        }
    }
}

enum HistoryFilter: String, CaseIterable, Identifiable {
    case all
    case completed
    case failed
    case images
    case documents

    var id: Self { self }

    var title: LocalizedStringResource {
        switch self {
        case .all: "All"
        case .completed: "Completed"
        case .failed: "Failed"
        case .images: "Images"
        case .documents: "Documents"
        }
    }

    var symbol: String {
        switch self {
        case .all: "line.3.horizontal.decrease.circle"
        case .completed: "checkmark.circle"
        case .failed: "exclamationmark.circle"
        case .images: "photo"
        case .documents: "doc"
        }
    }
}

struct ConversionHistoryList: View {
    let entries: [ConversionHistoryEntry]
    let isLoading: Bool
    let errorMessage: String?
    let deleteEntry: (ConversionHistoryEntry) -> Void

    var body: some View {
        if entries.isEmpty, isLoading {
            ProgressView("Loading conversions…")
        } else if entries.isEmpty {
            ContentUnavailableView(
                "No Matching Conversions",
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
                        NavigationLink(value: conversion.id) {
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
                        .swipeActions {
                            Button("Delete", systemImage: "trash", role: .destructive) {
                                deleteEntry(conversion)
                            }
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .navigationDestination(for: UUID.self) { id in
                if let entry = entries.first(where: { $0.id == id }) {
                    ConversionHistoryDetailView(entry: entry, deleteEntry: deleteEntry)
                }
            }
        }
    }
}

struct ConversionHistoryDetailView: View {
    @Environment(\.dismiss) private var dismiss
    let entry: ConversionHistoryEntry
    let deleteEntry: (ConversionHistoryEntry) -> Void
    @State private var confirmsDeletion = false

    var body: some View {
        Form {
            Section {
                LabeledContent("File", value: entry.originalFilename)
                LabeledContent(
                    "Conversion",
                    value: "\(entry.sourceFormat.uppercased()) → \(entry.targetFormat.uppercased())"
                )
                LabeledContent("Status", value: entry.status.capitalized)
                LabeledContent("Started") {
                    Text(entry.createdAt, format: .dateTime)
                }
                if let completedAt = entry.completedAt {
                    LabeledContent("Completed") {
                        Text(completedAt, format: .dateTime)
                    }
                }
            }

            Section("File sizes") {
                LabeledContent("Original", value: formattedSize(entry.inputSize))
                LabeledContent("Result", value: formattedSize(entry.outputSize))
                if let savings {
                    LabeledContent("Change", value: savings)
                }
            }

            Section {
                Button("Delete from History", systemImage: "trash", role: .destructive) {
                    confirmsDeletion = true
                }
            } footer: {
                Text("Original files are not retained by the app, so retry requires selecting the file again.")
            }
        }
        .navigationTitle("Conversion Details")
        .confirmationDialog(
            "Delete this history entry?",
            isPresented: $confirmsDeletion,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                deleteEntry(entry)
                dismiss()
            }
        }
    }

    private var savings: String? {
        guard let input = entry.inputSize, input > 0, let output = entry.outputSize else {
            return nil
        }
        let change = Double(output - input) / Double(input)
        return change.formatted(.percent.precision(.fractionLength(0)).sign(strategy: .always()))
    }

    private func formattedSize(_ size: Int64?) -> String {
        guard let size else { return "Unavailable" }
        return ByteCountFormatter.string(fromByteCount: size, countStyle: .file)
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
        let input = ByteCountFormatter.string(fromByteCount: inputSize, countStyle: .file)
        guard let outputSize else { return input }
        let output = ByteCountFormatter.string(fromByteCount: outputSize, countStyle: .file)
        return "\(input) → \(output)"
    }
}

#Preview {
    NavigationStack {
        ActivityHistoryView()
    }
    .environment(AppState())
}
