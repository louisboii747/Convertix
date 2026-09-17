import SwiftUI

struct ToolsView: View {
    var body: some View {
        ZStack {
            ConvertixBackdrop()
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Text("Tools")
                        .font(.largeTitle.bold())
                        .foregroundStyle(.primary)
                    Text("Focused utilities for the jobs around conversion.")
                        .font(.title3)
                        .foregroundStyle(.secondary)

                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 260), spacing: 16)], spacing: 16) {
                        ToolCard(title: "Compress images", detail: "Batch-compress up to 30 images on your device.", symbol: "photo.stack", tint: .green)
                        ToolCard(title: "Compress PDF", detail: "Reduce a PDF’s size while keeping it readable.", symbol: "doc.zipper", tint: .red)
                        ToolCard(title: "Merge PDFs", detail: "Reorder documents and combine them into one PDF.", symbol: "square.stack.3d.up", tint: .purple)
                        ToolCard(title: "Optimize SVG", detail: "Clean and reduce vector artwork for the web.", symbol: "scribble.variable", tint: .orange)
                    }
                }
                .frame(maxWidth: 860, alignment: .leading)
                .padding(28)
                .frame(maxWidth: .infinity)
            }
        }
        .navigationTitle("Tools")
    }
}

struct ToolCard: View {
    let title: String
    let detail: String
    let symbol: String
    let tint: Color

    var body: some View {
        Button {} label: {
            VStack(alignment: .leading, spacing: 14) {
                Image(systemName: symbol)
                    .font(.title2)
                    .foregroundStyle(tint)
                    .frame(width: 48, height: 48)
                    .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                Text(title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                Text(detail)
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
