#if os(macOS)
import AppKit
import SwiftUI
import UniformTypeIdentifiers

struct ConvertixMenuBarView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.openWindow) private var openWindow
    @State private var isImporting = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Convertix", systemImage: "arrow.trianglehead.2.clockwise.rotate.90")
                .font(.headline)

            if isSignedIn {
                Button("Convert File…", systemImage: "doc.badge.plus") {
                    isImporting = true
                }
                .keyboardShortcut("o")
            } else {
                Label("Sign in to convert files", systemImage: "person.crop.circle.badge.exclamationmark")
                    .foregroundStyle(.secondary)
            }

            if let active = appState.conversionCoordinator.activeConversions.first {
                Divider()
                VStack(alignment: .leading, spacing: 6) {
                    Text("Active")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(active.inputFilename)
                        .lineLimit(2)
                    ProgressView(value: active.progress ?? 0)
                        .accessibilityLabel("Active conversion progress")
                        .accessibilityValue(
                            Text(active.progress ?? 0, format: .percent.precision(.fractionLength(0)))
                        )
                }
            }

            if !appState.conversionCoordinator.recentConversions.isEmpty {
                Divider()
                Text("Recent")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                ForEach(appState.conversionCoordinator.recentConversions.prefix(3)) { conversion in
                    Button {
                        if let outputURL = conversion.outputURL {
                            NSWorkspace.shared.open(outputURL)
                        } else {
                            openMainWindow()
                        }
                    } label: {
                        HStack {
                            Image(systemName: conversion.phase == .completed
                                ? "checkmark.circle.fill"
                                : "exclamationmark.circle.fill")
                                .foregroundStyle(conversion.phase == .completed ? .green : .red)
                            VStack(alignment: .leading) {
                                Text(conversion.inputFilename)
                                    .lineLimit(1)
                                Text("\(conversion.inputFormat.uppercased()) → \(conversion.outputFormat.uppercased())")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }

            Divider()

            Button("Open Convertix", systemImage: "macwindow") {
                openMainWindow()
            }
            Button("Settings…", systemImage: "gear") {
                NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil)
            }
            .keyboardShortcut(",")
        }
        .padding(14)
        .frame(width: 280)
        .fileImporter(
            isPresented: $isImporting,
            allowedContentTypes: [.data],
            allowsMultipleSelection: true
        ) { result in
            guard case let .success(urls) = result else { return }
            appState.conversionCoordinator.enqueueDetected(
                urls,
                source: .menuBar
            )
        }
    }

    private var isSignedIn: Bool {
        if case .signedIn = appState.sessionState { return true }
        return false
    }

    private func openMainWindow() {
        openWindow(id: "main")
        NSApp.activate(ignoringOtherApps: true)
    }
}
#endif
