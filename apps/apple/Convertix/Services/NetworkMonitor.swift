import Foundation
import Network
import Observation

@MainActor
@Observable
final class NetworkMonitor {
    private(set) var isConnected = true
    private(set) var isExpensive = false
    private(set) var isConstrained = false
    private(set) var usesCellular = false
    private(set) var usesWiFi = false

    @ObservationIgnored private let monitor = NWPathMonitor()
    @ObservationIgnored private let queue = DispatchQueue(
        label: "uk.convertix.network-monitor",
        qos: .utility
    )
    @ObservationIgnored private var isStarted = false

    func start() {
        guard !isStarted else { return }
        isStarted = true
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isConnected = path.status == .satisfied
                self?.isExpensive = path.isExpensive
                self?.isConstrained = path.isConstrained
                self?.usesCellular = path.usesInterfaceType(.cellular)
                self?.usesWiFi = path.usesInterfaceType(.wifi)
            }
        }
        monitor.start(queue: queue)
    }

    deinit {
        monitor.cancel()
    }
}
