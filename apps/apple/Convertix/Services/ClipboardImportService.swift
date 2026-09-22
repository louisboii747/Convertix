import Foundation

#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

@MainActor
enum ClipboardImportService {
    static func materializeCompatibleFile() throws -> URL {
#if os(iOS)
        if let url = UIPasteboard.general.urls?.first {
            return url
        }
        guard let image = UIPasteboard.general.image,
              let data = image.pngData() else {
            throw ClipboardImportError.noCompatibleContent
        }
        return try write(data, filename: "Clipboard-Image.png")
#elseif os(macOS)
        if let url = NSPasteboard.general.readObjects(
            forClasses: [NSURL.self]
        )?.first as? URL {
            return url
        }
        guard let image = NSImage(pasteboard: NSPasteboard.general),
              let tiff = image.tiffRepresentation,
              let representation = NSBitmapImageRep(data: tiff),
              let data = representation.representation(using: .png, properties: [:]) else {
            throw ClipboardImportError.noCompatibleContent
        }
        return try write(data, filename: "Clipboard-Image.png")
#endif
    }

    private static func write(_ data: Data, filename: String) throws -> URL {
        let directory = FileManager.default.temporaryDirectory.appending(
            component: "ConvertixClipboard",
            directoryHint: .isDirectory
        )
        try FileManager.default.createDirectory(
            at: directory,
            withIntermediateDirectories: true
        )
        let url = directory.appending(component: filename)
        try data.write(to: url, options: [.atomic])
        return url
    }
}

enum ClipboardImportError: LocalizedError {
    case noCompatibleContent

    var errorDescription: String? {
        "The clipboard doesn’t contain a compatible image or file."
    }
}
