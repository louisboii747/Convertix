# Convertix Apple apps

Native SwiftUI workspace for Convertix on iPhone, iPad, and Mac.

Open `Convertix.xcodeproj` in Xcode. The project contains two app targets:

- `Convertix iOS` — iPhone and iPad
- `Convertix macOS` — Mac

Both targets share the same feature-oriented source tree under `Convertix/`:

- `App/` — application entry point
- `DesignSystem/` — shared theme and presentation modifiers
- `Features/` — screens and feature-specific components
- `Integrations/` — conditional Apple framework integrations
- `Models/` — conversion domain types
- `Navigation/` — shared adaptive navigation
- `Services/` — API and infrastructure code

The physical folder hierarchy matches the Xcode project navigator, so the same files can be opened and managed from Xcode or VS Code. Platform differences should remain narrowly scoped with conditional compilation unless a substantial platform-specific implementation is introduced.
