import Foundation
import Testing
@testable import Convertix_iOS

@Suite("Native conversion domain")
struct NativeConversionDomainTests {
    @Test("Conversion requests preserve client-only routing metadata")
    func requestMetadata() {
        let input = URL(fileURLWithPath: "/tmp/photo.heic")
        let request = ConversionRequest(
            inputURLs: [input],
            outputFormat: "JPEG",
            quality: 0.8,
            destination: .downloads,
            executionPreference: .automatic,
            source: .shortcut
        )

        #expect(request.inputURLs == [input])
        #expect(request.outputFormat == "jpeg")
        #expect(request.quality == 0.8)
        #expect(request.destination == .downloads)
        #expect(request.source == .shortcut)
    }

    @Test("Client conversion resolves JPEG aliases against the existing route catalog")
    func jpegAliasRoute() throws {
        let conversion = ClientConversion(
            inputURL: URL(fileURLWithPath: "/tmp/photo.jpeg"),
            outputFormat: "png",
            source: .dragAndDrop,
            destination: .askEveryTime,
            executionPreference: .automatic
        )

        let route = try #require(conversion.route)
        #expect(route.source == "JPG")
        #expect(route.target == "PNG")
    }

    @Test("Batch progress combines completed and partial child progress")
    func batchProgress() {
        let batchID = UUID()
        var completed = ClientConversion(
            batchID: batchID,
            inputURL: URL(fileURLWithPath: "/tmp/one.png"),
            outputFormat: "jpg",
            source: .photos,
            destination: .shareAfterConversion,
            executionPreference: .local
        )
        completed.phase = .completed
        completed.progress = 1

        var active = ClientConversion(
            batchID: batchID,
            inputURL: URL(fileURLWithPath: "/tmp/two.png"),
            outputFormat: "jpg",
            source: .photos,
            destination: .shareAfterConversion,
            executionPreference: .local
        )
        active.phase = .converting
        active.progress = 0.5

        let batch = ConversionBatch(id: batchID, jobs: [completed, active])
        #expect(batch.completedCount == 1)
        #expect(batch.progress == 0.75)
    }

    @Test("Deep links map platform entry points to typed destinations")
    func deepLinks() throws {
        let route = try #require(URL(string: "convertix://convert/heic-jpg"))
        let tool = try #require(URL(string: "convertix://optimise-svg"))
        let history = try #require(URL(string: "convertix://history"))

        #expect(AppDeepLink(url: route) == .convert(routeID: "heic-jpg"))
        #expect(AppDeepLink(url: tool) == .tool(.optimizeSVG))
        #expect(AppDeepLink(url: history) == .history)
    }

    @Test("Finished phases are distinguished from active phases")
    func phaseSemantics() {
        #expect(ConversionPhase.uploading.isActive)
        #expect(ConversionPhase.saving.isActive)
        #expect(!ConversionPhase.queued.isActive)
        #expect(ConversionPhase.completed.isFinished)
        #expect(ConversionPhase.cancelled.isFinished)
        #expect(!ConversionPhase.converting.isFinished)
    }
}
