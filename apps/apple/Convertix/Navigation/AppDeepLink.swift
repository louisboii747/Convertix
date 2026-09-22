import Foundation

enum AppDeepLink: Equatable, Sendable {
    case convert(routeID: String?)
    case tool(ConvertixTool)
    case history
    case queue
    case conversion(UUID)
    case preset(UUID)
    case settings

    init?(url: URL) {
        guard url.scheme?.lowercased() == "convertix",
              let host = url.host?.lowercased() else {
            return nil
        }

        let component = url.pathComponents.dropFirst().first
        switch host {
        case "convert":
            self = .convert(routeID: component)
        case "compress-pdf":
            self = .tool(.compressPDF)
        case "optimise-svg", "optimize-svg":
            self = .tool(.optimizeSVG)
        case "convert-image":
            self = .tool(.compressImages)
        case "history":
            self = .history
        case "queue":
            self = .queue
        case "activity", "conversion":
            guard let component, let id = UUID(uuidString: component) else { return nil }
            self = .conversion(id)
        case "preset":
            guard let component, let id = UUID(uuidString: component) else { return nil }
            self = .preset(id)
        case "settings":
            self = .settings
        default:
            return nil
        }
    }

    var url: URL {
        var components = URLComponents()
        components.scheme = "convertix"

        switch self {
        case let .convert(routeID):
            components.host = "convert"
            if let routeID {
                components.path = "/\(routeID)"
            }
        case let .tool(tool):
            switch tool {
            case .compressImages:
                components.host = "convert-image"
            case .compressPDF:
                components.host = "compress-pdf"
            case .mergePDFs:
                components.host = "tools"
                components.path = "/merge-pdfs"
            case .optimizeSVG:
                components.host = "optimise-svg"
            }
        case .history:
            components.host = "history"
        case .queue:
            components.host = "queue"
        case let .conversion(id):
            components.host = "conversion"
            components.path = "/\(id.uuidString)"
        case let .preset(id):
            components.host = "preset"
            components.path = "/\(id.uuidString)"
        case .settings:
            components.host = "settings"
        }

        return components.url ?? URL(string: "convertix://convert")!
    }

    var section: AppSection {
        switch self {
        case .convert, .queue, .conversion, .preset:
            .convert
        case .tool:
            .tools
        case .history:
            .activity
        case .settings:
            .settings
        }
    }
}
