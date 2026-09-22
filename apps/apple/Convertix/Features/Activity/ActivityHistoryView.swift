import SwiftUI

struct ActivityHistoryView: View {
    @Environment(AppState.self) private var appState
    @State private var filter = HistoryFilter.all
    @State private var dateRange = HistoryDateRange.allTime
    @State private var searchText = ""

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
        .searchable(text: $searchText, prompt: "Search conversions")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                HStack {
                    Picker("Time", selection: $dateRange) {
                        ForEach(HistoryDateRange.allCases) { range in
                            Text(range.title).tag(range)
                        }
                    }
                    .pickerStyle(.menu)

                    Picker("File type and status", selection: $filter) {
                        ForEach(HistoryFilter.allCases) { filter in
                            Label(filter.title, systemImage: filter.symbol).tag(filter)
                        }
                    }
                    .pickerStyle(.menu)
                }
            }
        }
        .task {
            if case .signedIn = appState.sessionState, appState.history.isEmpty {
                await appState.loadHistory()
            }
        }
    }

    private var filteredEntries: [ConversionHistoryEntry] {
        let formatFiltered: [ConversionHistoryEntry]
        switch filter {
        case .all:
            formatFiltered = appState.history
        case .completed:
            formatFiltered = appState.history.filter { $0.status == "completed" }
        case .failed:
            formatFiltered = appState.history.filter { $0.status == "failed" }
        case .images:
            formatFiltered = appState.history.filter {
                ["jpg", "jpeg", "png", "webp", "heic", "heif", "svg"].contains($0.sourceFormat)
            }
        case .documents:
            formatFiltered = appState.history.filter {
                ["pdf", "docx", "txt", "xlsx"].contains($0.sourceFormat)
            }
        case .pdf:
            formatFiltered = appState.history.filter {
                $0.sourceFormat == "pdf" || $0.targetFormat == "pdf"
            }
        case .video:
            formatFiltered = appState.history.filter {
                ["mp4", "webm"].contains($0.sourceFormat)
            }
        }

        let dated = formatFiltered.filter { dateRange.includes($0.createdAt) }
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return dated }
        return dated.filter {
            $0.originalFilename.localizedCaseInsensitiveContains(query)
                || $0.sourceFormat.localizedCaseInsensitiveContains(query)
                || $0.targetFormat.localizedCaseInsensitiveContains(query)
        }
    }
}

enum HistoryDateRange: String, CaseIterable, Identifiable {
    case allTime
    case today
    case last7Days
    case last30Days

    var id: Self { self }

    var title: LocalizedStringResource {
        switch self {
        case .allTime: "All Time"
        case .today: "Today"
        case .last7Days: "Last 7 Days"
        case .last30Days: "Last 30 Days"
        }
    }

    func includes(_ date: Date, now: Date = .now, calendar: Calendar = .current) -> Bool {
        switch self {
        case .allTime:
            true
        case .today:
            calendar.isDate(date, inSameDayAs: now)
        case .last7Days:
            date >= calendar.date(byAdding: .day, value: -7, to: now) ?? .distantPast
        case .last30Days:
            date >= calendar.date(byAdding: .day, value: -30, to: now) ?? .distantPast
        }
    }
}

enum HistoryFilter: String, CaseIterable, Identifiable {
    case all
    case completed
    case failed
    case images
    case documents
    case pdf
    case video

    var id: Self { self }

    var title: LocalizedStringResource {
        switch self {
        case .all: "All"
        case .completed: "Completed"
        case .failed: "Failed"
        case .images: "Images"
        case .documents: "Documents"
        case .pdf: "PDF"
        case .video: "Video"
        }
    }

    var symbol: String {
        switch self {
        case .all: "line.3.horizontal.decrease.circle"
        case .completed: "checkmark.circle"
        case .failed: "exclamationmark.circle"
        case .images: "photo"
        case .documents: "doc"
        case .pdf: "doc.richtext"
        case .video: "film"
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
