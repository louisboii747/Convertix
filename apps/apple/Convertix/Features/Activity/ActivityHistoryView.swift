import SwiftUI

struct ActivityHistoryView: View {
    var body: some View {
        List {
            Section {
                ForEach(RecentConversion.samples) { conversion in
                    RecentConversionRow(
                        fileName: conversion.fileName,
                        routeTitle: conversion.route.title,
                        date: conversion.date,
                        isComplete: conversion.status == .complete
                    )
                }
            } header: {
                Text("Recent")
            } footer: {
                Text("Conversion progress is ready to be surfaced through a Live Activity when the processing service is connected.")
            }
        }
        .navigationTitle("Activity")
    }
}

struct RecentConversionRow: View {
    let fileName: String
    let routeTitle: String
    let date: Date
    let isComplete: Bool

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: isComplete ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                .font(.title2)
                .foregroundStyle(isComplete ? .green : .red)

            VStack(alignment: .leading, spacing: 3) {
                Text(fileName)
                    .font(.headline)
                    .lineLimit(1)
                Text(routeTitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(date, style: .relative)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 5)
    }
}

