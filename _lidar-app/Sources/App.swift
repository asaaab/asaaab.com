import SwiftUI
import ARKit

@main
struct RVMScansApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
                .tint(Theme.accent)
        }
    }
}

/// Janet's Void Garage colors, so the app and the viewer look like one system.
enum Theme {
    static let bay = Color(red: 0.059, green: 0.078, blue: 0.094)      // #0f1418
    static let panel = Color(red: 0.094, green: 0.125, blue: 0.153)    // #182027
    static let line = Color(red: 0.165, green: 0.208, blue: 0.243)     // #2a353e
    static let ink = Color(red: 0.89, green: 0.91, blue: 0.925)        // #e3e8ec
    static let muted = Color(red: 0.576, green: 0.631, blue: 0.675)    // #93a1ac
    static let accent = Color(red: 0.416, green: 0.627, blue: 1.0)     // #6aa0ff
    static let hole = Color(red: 1.0, green: 0.361, blue: 0.38)        // #ff5c61
    static let ok = Color(red: 0.345, green: 0.761, blue: 0.49)        // #58c27d

    static func display(_ size: CGFloat) -> Font {
        .system(size: size, weight: .bold).width(.condensed)
    }
    static func mono(_ size: CGFloat) -> Font {
        .system(size: size, design: .monospaced)
    }
}

struct Capture: Identifiable, Hashable {
    let url: URL
    let name: String
    let date: Date
    let frames: Int
    let bytes: Int64
    var id: URL { url }
}

final class CaptureStore: ObservableObject {
    @Published private(set) var captures: [Capture] = []

    func reload() {
        let fm = FileManager.default
        let root = CaptureEngine.capturesRoot
        let dirs = (try? fm.contentsOfDirectory(at: root, includingPropertiesForKeys: [.creationDateKey, .isDirectoryKey])) ?? []
        captures = dirs.compactMap { url -> Capture? in
            guard (try? url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true else { return nil }
            let frames = (try? fm.contentsOfDirectory(atPath: url.appendingPathComponent("depth").path).count) ?? 0
            let date = (try? url.resourceValues(forKeys: [.creationDateKey]).creationDate) ?? .distantPast
            return Capture(url: url, name: url.lastPathComponent, date: date, frames: frames, bytes: Self.size(of: url))
        }
        .sorted { $0.date > $1.date }
    }

    func delete(_ c: Capture) {
        try? FileManager.default.removeItem(at: c.url)
        reload()
    }

    static func size(of dir: URL) -> Int64 {
        var total: Int64 = 0
        if let e = FileManager.default.enumerator(at: dir, includingPropertiesForKeys: [.fileSizeKey]) {
            for case let f as URL in e {
                total += Int64((try? f.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0)
            }
        }
        return total
    }

    /// Zips a capture folder (the Stray Scanner layout the garage viewer imports).
    static func zip(_ dir: URL) throws -> URL {
        var out: URL?
        var copyError: Error?
        var coordError: NSError?
        NSFileCoordinator().coordinate(readingItemAt: dir, options: [.forUploading], error: &coordError) { tmp in
            let dest = FileManager.default.temporaryDirectory.appendingPathComponent(dir.lastPathComponent + ".zip")
            try? FileManager.default.removeItem(at: dest)
            do {
                try FileManager.default.copyItem(at: tmp, to: dest)
                out = dest
            } catch {
                copyError = error
            }
        }
        if let coordError { throw coordError }
        if let copyError { throw copyError }
        guard let out else { throw CocoaError(.fileWriteUnknown) }
        return out
    }
}
