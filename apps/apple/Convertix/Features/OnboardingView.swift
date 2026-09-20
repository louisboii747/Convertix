import SwiftUI

struct OnboardingView: View {
    let complete: () -> Void

    var body: some View {
        VStack(spacing: 28) {
            Image("ConvertixLogo")
                .resizable()
                .scaledToFit()
                .frame(width: 88, height: 88)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .accessibilityHidden(true)

            VStack(spacing: 8) {
                Text("Welcome to Convertix")
                    .font(.largeTitle.bold())
                    .multilineTextAlignment(.center)
                Text("Convert files simply, with clear control over what leaves your device.")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            VStack(alignment: .leading, spacing: 20) {
                OnboardingFeature(
                    symbol: "arrow.trianglehead.2.clockwise.rotate.90",
                    title: "Convert common formats",
                    detail: "Choose a file and Convertix shows compatible outputs."
                )
                OnboardingFeature(
                    symbol: "lock.shield",
                    title: "Uploads start only when you say",
                    detail: "Selecting a file does not upload it."
                )
                OnboardingFeature(
                    symbol: "iphone.and.arrow.forward",
                    title: "Private on-device tools",
                    detail: "Compression, PDF merging, and SVG cleanup run locally."
                )
            }
            .frame(maxWidth: 520)

            Button("Get Started", action: complete)
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .frame(maxWidth: 360)
        }
        .padding(36)
        .frame(minWidth: 360, minHeight: 560)
        .background(ConvertixBackdrop())
    }
}

private struct OnboardingFeature: View {
    let symbol: String
    let title: LocalizedStringResource
    let detail: LocalizedStringResource

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: symbol)
                .font(.title2)
                .foregroundStyle(ConvertixTheme.cobalt)
                .frame(width: 38)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(detail)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
