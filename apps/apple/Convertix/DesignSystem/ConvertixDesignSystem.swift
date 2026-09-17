import SwiftUI

#if os(macOS)
import AppKit
#else
import UIKit
#endif

enum ConvertixTheme {
    static let cobalt = Color.accentColor
    static let cobaltDark = Color(red: 35 / 255, green: 78 / 255, blue: 225 / 255)
    static let ink = Color.primary

#if os(macOS)
    static let canvas = Color(nsColor: .windowBackgroundColor)
    static let line = Color(nsColor: .separatorColor)
#else
    static let canvas = Color(uiColor: .systemGroupedBackground)
    static let line = Color(uiColor: .separator)
#endif
}

struct ConvertixBackdrop: View {
    var body: some View {
        ZStack {
            ConvertixTheme.canvas
            LinearGradient(
                colors: [ConvertixTheme.cobalt.opacity(0.08), .clear],
                startPoint: .topTrailing,
                endPoint: .center
            )
            RadialGradient(
                colors: [Color.cyan.opacity(0.07), .clear],
                center: .topTrailing,
                startRadius: 40,
                endRadius: 680
            )
        }
        .ignoresSafeArea()
    }
}

struct GlassPanelModifier: ViewModifier {
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        content
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(ConvertixTheme.line.opacity(0.45), lineWidth: 0.5)
            }
            .shadow(color: .black.opacity(0.05), radius: 18, y: 8)
    }
}

extension View {
    func convertixGlassPanel(cornerRadius: CGFloat = 24) -> some View {
        modifier(GlassPanelModifier(cornerRadius: cornerRadius))
    }
}
