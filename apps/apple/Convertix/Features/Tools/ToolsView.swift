import SwiftUI
import UniformTypeIdentifiers
import PDFKit
import ImageIO

struct ToolsView: View {
    @State private var selectedTool: ConvertixTool?

    var body: some View {
        ZStack {
            ConvertixBackdrop()
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Text("Tools")
                        .font(.largeTitle.bold())
                    Text("Private, on-device utilities for the jobs around conversion.")
                        .font(.title3)
                        .foregroundStyle(.secondary)

                    LazyVGrid(
                        columns: [GridItem(.adaptive(minimum: 260), spacing: 16)],
                        spacing: 16
                    ) {
                        ForEach(ConvertixTool.allCases) { tool in
                            ToolCard(tool: tool) {
                                selectedTool = tool
                            }
                        }
                    }
                }
                .frame(maxWidth: 860, alignment: .leading)
                .padding(28)
                .frame(maxWidth: .infinity)
            }
        }
        .navigationTitle("Tools")
        .sheet(item: $selectedTool) { tool in
            ToolWorkspace(tool: tool)
        }
    }
}

enum ConvertixTool: String, CaseIterable, Identifiable {
    case compressImages
    case compressPDF
    case mergePDFs
    case optimizeSVG

    var id: Self { self }

    var title: LocalizedStringResource {
        switch self {
        case .compressImages: "Compress images"
        case .compressPDF: "Compress PDF"
        case .mergePDFs: "Merge PDFs"
        case .optimizeSVG: "Optimize SVG"
        }
    }

    var detail: LocalizedStringResource {
        switch self {
        case .compressImages: "Reduce JPEG and PNG file sizes locally."
        case .compressPDF: "Rewrite a PDF with optimized document data."
        case .mergePDFs: "Combine PDFs in the order you select them."
        case .optimizeSVG: "Remove comments and unnecessary whitespace."
        }
    }

    var symbol: String {
        switch self {
        case .compressImages: "photo.stack"
        case .compressPDF: "doc.zipper"
        case .mergePDFs: "square.stack.3d.up"
        case .optimizeSVG: "scribble.variable"
        }
    }

    var tint: Color {
        switch self {
        case .compressImages: .green
        case .compressPDF: .red
        case .mergePDFs: .purple
        case .optimizeSVG: .orange
        }
    }

    var allowedTypes: [UTType] {
        switch self {
        case .compressImages: [.jpeg, .png]
        case .compressPDF, .mergePDFs: [.pdf]
        case .optimizeSVG: [UTType(filenameExtension: "svg") ?? .xml]
        }
    }

    var allowsMultipleSelection: Bool {
        self == .compressImages || self == .mergePDFs
    }
}

struct ToolCard: View {
    let tool: ConvertixTool
    let open: () -> Void

    var body: some View {
        Button(action: open) {
            VStack(alignment: .leading, spacing: 14) {
                Image(systemName: tool.symbol)
                    .font(.title2)
                    .foregroundStyle(tool.tint)
                    .frame(width: 48, height: 48)
                    .background(
                        tool.tint.opacity(0.12),
                        in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                    )

                Text(tool.title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                Text(tool.detail)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.leading)
                Label("Open tool", systemImage: "arrow.right")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(ConvertixTheme.cobalt)
            }
            .frame(maxWidth: .infinity, minHeight: 164, alignment: .topLeading)
            .padding(20)
            .convertixGlassPanel(cornerRadius: 18)
        }
        .buttonStyle(.plain)
    }
}

struct ToolWorkspace: View {
    @Environment(\.dismiss) private var dismiss
    let tool: ConvertixTool

    @State private var isImporting = false
    @State private var selectedURLs: [URL] = []
    @State private var quality = 0.72
    @State private var outputURLs: [URL] = []
    @State private var isWorking = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Label(tool.detail, systemImage: tool.symbol)
                        .foregroundStyle(.secondary)
                }

                if tool == .compressImages {
                    Section("Quality") {
                        Slider(value: $quality, in: 0.2...0.95, step: 0.05)
                        Text(quality, format: .percent.precision(.fractionLength(0)))
                            .foregroundStyle(.secondary)
                    }
                }

                Section("Files") {
                    Button(
                        selectedURLs.isEmpty ? "Choose files" : "Choose different files",
                        systemImage: "folder"
                    ) {
                        isImporting = true
                    }

                    ForEach(selectedURLs, id: \.self) { url in
                        Label(url.lastPathComponent, systemImage: "doc")
                            .lineLimit(1)
                    }
                }

                if let errorMessage {
                    Section {
                        Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                            .foregroundStyle(.red)
                    }
                }

                if !outputURLs.isEmpty {
                    Section("Results") {
                        ForEach(outputURLs, id: \.self) { url in
                            ShareLink(item: url) {
                                Label(url.lastPathComponent, systemImage: "square.and.arrow.up")
                            }
                        }
                    }
                }

                Section {
                    Button {
                        Task { await runTool() }
                    } label: {
                        if isWorking {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                        } else {
                            Label("Run \(tool.title)", systemImage: "wand.and.stars")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(selectedURLs.isEmpty || isWorking)
                } footer: {
                    Text("Processing happens on this device. Your files are not uploaded.")
                }
            }
            .navigationTitle(tool.title)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .fileImporter(
                isPresented: $isImporting,
                allowedContentTypes: tool.allowedTypes,
                allowsMultipleSelection: tool.allowsMultipleSelection
            ) { result in
                do {
                    selectedURLs = try result.get()
                    outputURLs = []
                    errorMessage = nil
                } catch {
                    errorMessage = "Convertix couldn’t open the selected files."
                }
            }
        }
        .frame(minWidth: 380, minHeight: 520)
    }

    private func runTool() async {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }

        var accessedURLs: [URL] = []
        for url in selectedURLs where url.startAccessingSecurityScopedResource() {
            accessedURLs.append(url)
        }
        defer {
            for url in accessedURLs {
                url.stopAccessingSecurityScopedResource()
            }
        }

        let inputURLs = selectedURLs
        let compressionQuality = quality
        let selectedTool = tool

        do {
            outputURLs = try await Task.detached {
                switch selectedTool {
                case .compressImages:
                    try OnDeviceToolProcessor.compressImages(inputURLs, quality: compressionQuality)
                case .compressPDF:
                    [try OnDeviceToolProcessor.rewritePDF(inputURLs[0])]
                case .mergePDFs:
                    [try OnDeviceToolProcessor.mergePDFs(inputURLs)]
                case .optimizeSVG:
                    [try OnDeviceToolProcessor.optimizeSVG(inputURLs[0])]
                }
            }.value
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

enum OnDeviceToolProcessor {
    static func compressImages(_ urls: [URL], quality: Double) throws -> [URL] {
        try urls.map { url in
            guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
                  let type = CGImageSourceGetType(source) else {
                throw ToolProcessingError.invalidFile
            }

            let outputExtension = url.pathExtension.lowercased() == "png" ? "png" : "jpg"
            let output = destinationURL(for: url, suffix: "compressed", extension: outputExtension)
            guard let destination = CGImageDestinationCreateWithURL(
                output as CFURL,
                type,
                CGImageSourceGetCount(source),
                nil
            ) else {
                throw ToolProcessingError.cannotCreateOutput
            }

            let options = [kCGImageDestinationLossyCompressionQuality: quality] as CFDictionary
            for index in 0..<CGImageSourceGetCount(source) {
                CGImageDestinationAddImageFromSource(destination, source, index, options)
            }
            guard CGImageDestinationFinalize(destination) else {
                throw ToolProcessingError.cannotCreateOutput
            }
            return output
        }
    }

    static func rewritePDF(_ url: URL) throws -> URL {
        guard let document = PDFDocument(url: url) else {
            throw ToolProcessingError.invalidFile
        }
        let output = destinationURL(for: url, suffix: "optimized", extension: "pdf")
        guard document.write(to: output) else {
            throw ToolProcessingError.cannotCreateOutput
        }
        return output
    }

    static func mergePDFs(_ urls: [URL]) throws -> URL {
        let merged = PDFDocument()
        var insertionIndex = 0
        for url in urls {
            guard let document = PDFDocument(url: url) else {
                throw ToolProcessingError.invalidFile
            }
            for pageIndex in 0..<document.pageCount {
                if let page = document.page(at: pageIndex) {
                    merged.insert(page, at: insertionIndex)
                    insertionIndex += 1
                }
            }
        }
        guard insertionIndex > 0 else {
            throw ToolProcessingError.invalidFile
        }
        let output = temporaryDirectory.appending(path: "Merged-\(UUID().uuidString.prefix(8)).pdf")
        guard merged.write(to: output) else {
            throw ToolProcessingError.cannotCreateOutput
        }
        return output
    }

    static func optimizeSVG(_ url: URL) throws -> URL {
        var svg = try String(contentsOf: url, encoding: .utf8)
        svg = svg.replacingOccurrences(
            of: "<!--(?:.|\\n|\\r)*?-->",
            with: "",
            options: .regularExpression
        )
        svg = svg.replacingOccurrences(
            of: ">\\s+<",
            with: "><",
            options: .regularExpression
        )
        let output = destinationURL(for: url, suffix: "optimized", extension: "svg")
        try svg.trimmingCharacters(in: .whitespacesAndNewlines)
            .write(to: output, atomically: true, encoding: .utf8)
        return output
    }

    private static var temporaryDirectory: URL {
        let directory = FileManager.default.temporaryDirectory
            .appending(path: "ConvertixTools", directoryHint: .isDirectory)
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }

    private static func destinationURL(
        for source: URL,
        suffix: String,
        extension fileExtension: String
    ) -> URL {
        let stem = source.deletingPathExtension().lastPathComponent
        return temporaryDirectory
            .appending(path: "\(stem)-\(suffix)-\(UUID().uuidString.prefix(6)).\(fileExtension)")
    }
}

enum ToolProcessingError: LocalizedError {
    case invalidFile
    case cannotCreateOutput

    var errorDescription: String? {
        switch self {
        case .invalidFile:
            "The selected file could not be read."
        case .cannotCreateOutput:
            "Convertix could not create the output file."
        }
    }
}

#Preview {
    NavigationStack {
        ToolsView()
    }
}
