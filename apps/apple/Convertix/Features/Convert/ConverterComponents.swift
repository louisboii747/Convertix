import SwiftUI

struct ConverterPanel: View {
    @Binding var selectedRoute: ConversionRoute
    let selectedFileName: String?
    let conversionStatus: ConversionStatus
    let chooseFile: () -> Void
    let clearFile: () -> Void
    let startConversion: () -> Void

    var body: some View {
        VStack(spacing: 18) {
            FileDropArea(fileName: selectedFileName, chooseFile: chooseFile, clearFile: clearFile)

            HStack(spacing: 12) {
                FormatStep(number: 1, label: "From", format: selectedRoute.source, color: .orange)

                Image(systemName: "arrow.right")
                    .font(.headline)
                    .foregroundStyle(.tertiary)
                    .accessibilityHidden(true)

                Menu {
                    ForEach(ConversionRoute.catalog) { route in
                        Button(route.title) { selectedRoute = route }
                    }
                } label: {
                    FormatStep(number: 2, label: "Convert to", format: selectedRoute.target, color: ConvertixTheme.cobalt)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Output format, \(selectedRoute.target)")
            }

            Button(action: startConversion) {
                Label(buttonTitle, systemImage: conversionStatus.isRunning ? "hourglass" : "sparkles")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .tint(ConvertixTheme.cobalt)
            .disabled(selectedFileName == nil || conversionStatus.isRunning)

            if conversionStatus.isRunning {
                ProgressView(conversionStatus.message ?? "Converting…")
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else if case let .completed(downloadURL) = conversionStatus {
                Link(destination: downloadURL) {
                    Label("Download converted file", systemImage: "arrow.down.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            } else if case let .failed(message) = conversionStatus {
                Label(message, systemImage: "exclamationmark.triangle.fill")
                    .font(.callout)
                    .foregroundStyle(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(20)
        .convertixGlassPanel(cornerRadius: 26)
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

struct FileDropArea: View {
    let fileName: String?
    let chooseFile: () -> Void
    let clearFile: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: fileName == nil ? "doc.badge.plus" : "doc.fill")
                .font(.system(size: 34, weight: .semibold))
                .foregroundStyle(ConvertixTheme.cobalt)
                .frame(width: 68, height: 68)
                .background(ConvertixTheme.cobalt.opacity(0.1), in: RoundedRectangle(cornerRadius: 18))

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
        .padding(.vertical, 28)
        .padding(.horizontal)
        .background(Color.white.opacity(0.52), in: RoundedRectangle(cornerRadius: 20))
        .overlay {
            RoundedRectangle(cornerRadius: 20)
                .stroke(ConvertixTheme.cobalt.opacity(0.35), style: StrokeStyle(lineWidth: 1.5, dash: [7]))
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
                    .foregroundStyle(ConvertixTheme.ink)
            }

            Spacer(minLength: 0)
        }
        .padding(14)
        .frame(maxWidth: .infinity)
        .background(.white.opacity(0.62), in: RoundedRectangle(cornerRadius: 16))
    }
}

struct ConversionNotes: View {
    var body: some View {
        ViewThatFits {
            HStack(spacing: 24) { notes }
            VStack(alignment: .leading, spacing: 10) { notes }
        }
        .font(.footnote.weight(.medium))
        .foregroundStyle(.secondary)
    }

    @ViewBuilder
    private var notes: some View {
        Label("No account needed", systemImage: "person.crop.circle.badge.checkmark")
        Label("100 MB file limit", systemImage: "externaldrive")
        Label("Uploads only when you start", systemImage: "lock.shield")
    }
}

struct PopularConversions: View {
    let routes: [ConversionRoute]
    @Binding var selectedRoute: ConversionRoute

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Common conversions")
                .font(.title2.bold())
            Text("Start with one of the most-used format pairs.")
                .foregroundStyle(.secondary)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 210), spacing: 12)], spacing: 12) {
                ForEach(routes) { route in
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
                        .padding()
                        .background(.white.opacity(0.68), in: RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

