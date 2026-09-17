import SwiftUI

enum ConvertixTheme {
    static let cobalt = Color(red: 49 / 255, green: 92 / 255, blue: 245 / 255)
    static let cobaltDark = Color(red: 33 / 255, green: 71 / 255, blue: 212 / 255)
    static let canvas = Color(red: 247 / 255, green: 249 / 255, blue: 252 / 255)
    static let ink = Color(red: 13 / 255, green: 27 / 255, blue: 52 / 255)
    static let line = Color(red: 219 / 255, green: 226 / 255, blue: 239 / 255)
}

struct ConvertixBackdrop: View {
    var body: some View {
        ZStack {
            ConvertixTheme.canvas
            RadialGradient(
                colors: [ConvertixTheme.cobalt.opacity(0.15), .clear],
                center: .topTrailing,
                startRadius: 20,
                endRadius: 520
            )
            RadialGradient(
                colors: [Color.mint.opacity(0.13), .clear],
                center: .bottomLeading,
                startRadius: 20,
                endRadius: 460
            )
        }
        .ignoresSafeArea()
    }
}

struct GlassPanelModifier: ViewModifier {
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        if #available(iOS 26.0, macOS 26.0, *) {
            content.glassEffect(.regular, in: .rect(cornerRadius: cornerRadius))
        } else {
            content
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: cornerRadius))
                .overlay {
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(ConvertixTheme.line.opacity(0.8), lineWidth: 1)
                }
        }
    }
}

extension View {
    func convertixGlassPanel(cornerRadius: CGFloat = 24) -> some View {
        modifier(GlassPanelModifier(cornerRadius: cornerRadius))
    }
}

