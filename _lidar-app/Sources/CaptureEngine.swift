import ARKit
import UIKit
import AVFoundation
import ImageIO
import UniformTypeIdentifiers

/// Records LiDAR photos in the Stray Scanner layout, so the Janet's Void Garage viewer can import them:
///   rgb.mp4               color video, time 0 = first frame
///   depth/000000.png      16-bit grayscale, millimeters (256x192 on current iPhones)
///   confidence/000000.png 8-bit grayscale, 0 low, 1 medium, 2 high
///   odometry.csv          timestamp, frame, x, y, z, qx, qy, qz, qw (ARKit camera pose, meters)
///   camera_matrix.csv     3x3 intrinsics for the color image
///   rvm.json              who made it
final class CaptureEngine: NSObject, ObservableObject, ARSessionDelegate {
    let session = ARSession()

    @Published private(set) var isRecording = false
    @Published private(set) var frameCount = 0
    @Published private(set) var elapsed: Double = 0
    @Published private(set) var trackingText = "Starting the camera"
    @Published private(set) var trackingGood = false
    let supported = ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth)

    /// Called on the main queue when a capture has finished writing.
    var onFinished: (() -> Void)?

    private let io = DispatchQueue(label: "rvm.scans.io")
    private var folder: URL?
    private var odometry: FileHandle?
    private var writer: AVAssetWriter?
    private var videoInput: AVAssetWriterInput?
    private var adaptor: AVAssetWriterInputPixelBufferAdaptor?
    private var t0: TimeInterval?
    private var lastKept: TimeInterval = 0
    private var index = 0
    private var pending = 0

    /// Keep about 30 LiDAR photos per second; ARKit delivers 60.
    private let keepInterval: TimeInterval = 1.0 / 30.0 - 0.003

    static var capturesRoot: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let dir = docs.appendingPathComponent("captures", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    override init() {
        super.init()
        session.delegate = self
    }

    func run() {
        guard supported else {
            trackingText = "This iPhone has no LiDAR"
            return
        }
        let config = ARWorldTrackingConfiguration()
        config.frameSemantics = [.sceneDepth]
        // Prefer the 1920x1440 color format the viewer expects.
        if let f = ARWorldTrackingConfiguration.supportedVideoFormats.first(where: {
            Int($0.imageResolution.width) == 1920 && Int($0.imageResolution.height) == 1440
        }) {
            config.videoFormat = f
        }
        session.run(config)
    }

    func pause() { session.pause() }

    // MARK: Recording

    func startRecording() {
        guard !isRecording else { return }
        let fmt = DateFormatter()
        fmt.locale = Locale(identifier: "en_US_POSIX")
        fmt.dateFormat = "yyyy-MM-dd_HHmmss"
        let dir = Self.capturesRoot.appendingPathComponent("scan_" + fmt.string(from: Date()), isDirectory: true)
        let fm = FileManager.default
        do {
            try fm.createDirectory(at: dir.appendingPathComponent("depth"), withIntermediateDirectories: true)
            try fm.createDirectory(at: dir.appendingPathComponent("confidence"), withIntermediateDirectories: true)
            let odo = dir.appendingPathComponent("odometry.csv")
            fm.createFile(atPath: odo.path, contents: Data("timestamp, frame, x, y, z, qx, qy, qz, qw\n".utf8))
            odometry = try FileHandle(forWritingTo: odo)
            odometry?.seekToEndOfFile()
        } catch {
            trackingText = "Couldn't make a folder for the scan"
            return
        }
        folder = dir
        t0 = nil
        lastKept = 0
        index = 0
        frameCount = 0
        elapsed = 0
        writer = nil
        videoInput = nil
        adaptor = nil
        isRecording = true
    }

    func stopRecording() {
        guard isRecording else { return }
        isRecording = false
        let w = writer, input = videoInput, odo = odometry
        writer = nil; videoInput = nil; adaptor = nil; odometry = nil
        io.async { [weak self] in
            try? odo?.close()
            let group = DispatchGroup()
            if let w, w.status == .writing {
                input?.markAsFinished()
                group.enter()
                w.finishWriting { group.leave() }
            }
            group.wait()
            DispatchQueue.main.async { self?.onFinished?() }
        }
    }

    // MARK: ARSessionDelegate

    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        guard isRecording, let folder, let depth = frame.sceneDepth else { return }
        guard frame.timestamp - lastKept >= keepInterval else { return }
        guard pending < 12 else { return } // storage is behind; skip a frame rather than stall the camera
        lastKept = frame.timestamp

        if t0 == nil {
            t0 = frame.timestamp
            setUpVideo(for: frame, in: folder)
            writeCameraMatrix(frame, in: folder)
        }
        let t = frame.timestamp - (t0 ?? frame.timestamp)

        if let input = videoInput, let adaptor, input.isReadyForMoreMediaData {
            adaptor.append(frame.capturedImage, withPresentationTime: CMTime(seconds: t, preferredTimescale: 6000))
        }

        let i = index
        index += 1
        let depthPNG = Self.depthMillimeters(depth.depthMap)
        let confPNG = depth.confidenceMap.flatMap { Self.confidenceBytes($0) }
        let m = frame.camera.transform
        let q = simd_quatf(m)
        let line = String(format: "%.6f, %ld, %.6f, %.6f, %.6f, %.6f, %.6f, %.6f, %.6f\n",
                          t, i, m.columns.3.x, m.columns.3.y, m.columns.3.z,
                          q.imag.x, q.imag.y, q.imag.z, q.real)
        let name = String(format: "%06ld.png", i)
        let odo = odometry

        pending += 1
        io.async { [weak self] in
            if let d = depthPNG {
                Self.writeGrayPNG(d.bytes, width: d.width, height: d.height, bits: 16,
                                  to: folder.appendingPathComponent("depth/" + name))
            }
            if let c = confPNG {
                Self.writeGrayPNG(c.bytes, width: c.width, height: c.height, bits: 8,
                                  to: folder.appendingPathComponent("confidence/" + name))
            }
            odo?.write(Data(line.utf8))
            DispatchQueue.main.async { self?.pending -= 1 }
        }

        frameCount = i + 1
        elapsed = t
    }

    func session(_ session: ARSession, cameraDidChangeTrackingState camera: ARCamera) {
        switch camera.trackingState {
        case .normal:
            trackingText = "Tracking"; trackingGood = true
        case .notAvailable:
            trackingText = "Tracking not available"; trackingGood = false
        case .limited(let reason):
            trackingGood = false
            switch reason {
            case .initializing: trackingText = "Move the phone slowly to start"
            case .excessiveMotion: trackingText = "Slow down"
            case .insufficientFeatures: trackingText = "Point at something with more detail"
            case .relocalizing: trackingText = "Finding its place again"
            @unknown default: trackingText = "Tracking is limited"
            }
        }
    }

    func session(_ session: ARSession, didFailWithError error: Error) {
        trackingText = "Camera stopped: \(error.localizedDescription)"
        trackingGood = false
        if isRecording { stopRecording() }
    }

    // MARK: Writers

    private func setUpVideo(for frame: ARFrame, in folder: URL) {
        let w = CVPixelBufferGetWidth(frame.capturedImage)
        let h = CVPixelBufferGetHeight(frame.capturedImage)
        guard let writer = try? AVAssetWriter(outputURL: folder.appendingPathComponent("rgb.mp4"), fileType: .mp4) else { return }
        let settings: [String: Any] = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: w,
            AVVideoHeightKey: h,
            AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 10_000_000],
        ]
        let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
        input.expectsMediaDataInRealTime = true
        let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: nil)
        guard writer.canAdd(input) else { return }
        writer.add(input)
        guard writer.startWriting() else { return }
        writer.startSession(atSourceTime: .zero)
        self.writer = writer
        self.videoInput = input
        self.adaptor = adaptor
    }

    private func writeCameraMatrix(_ frame: ARFrame, in folder: URL) {
        let k = frame.camera.intrinsics // column-major
        let rows = (0..<3).map { r in
            (0..<3).map { c in String(format: "%.6f", k[c][r]) }.joined(separator: ", ")
        }
        let text = rows.joined(separator: "\n") + "\n"
        try? text.write(to: folder.appendingPathComponent("camera_matrix.csv"), atomically: true, encoding: .utf8)

        let res = frame.camera.imageResolution
        let info: [String: Any] = [
            "app": "RVM Scans",
            "system": "Royal Vista Mirai",
            "format": "stray-scanner",
            "created": ISO8601DateFormatter().string(from: Date()),
            "device": UIDevice.current.model,
            "ios": UIDevice.current.systemVersion,
            "color_width": Int(res.width),
            "color_height": Int(res.height),
        ]
        if let data = try? JSONSerialization.data(withJSONObject: info, options: [.prettyPrinted, .sortedKeys]) {
            try? data.write(to: folder.appendingPathComponent("rvm.json"))
        }
    }

    struct Gray { let bytes: Data; let width: Int; let height: Int }

    /// Float32 meters -> UInt16 millimeters, little-endian, tightly packed.
    static func depthMillimeters(_ buf: CVPixelBuffer) -> Gray? {
        CVPixelBufferLockBaseAddress(buf, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(buf, .readOnly) }
        guard let base = CVPixelBufferGetBaseAddress(buf) else { return nil }
        let w = CVPixelBufferGetWidth(buf), h = CVPixelBufferGetHeight(buf)
        let stride = CVPixelBufferGetBytesPerRow(buf)
        var out = [UInt16](repeating: 0, count: w * h)
        for y in 0..<h {
            let row = base.advanced(by: y * stride).assumingMemoryBound(to: Float32.self)
            for x in 0..<w {
                let m = row[x]
                out[y * w + x] = (m.isFinite && m > 0) ? UInt16(min(65535, (m * 1000).rounded())).littleEndian : 0
            }
        }
        return Gray(bytes: out.withUnsafeBytes { Data($0) }, width: w, height: h)
    }

    static func confidenceBytes(_ buf: CVPixelBuffer) -> Gray? {
        CVPixelBufferLockBaseAddress(buf, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(buf, .readOnly) }
        guard let base = CVPixelBufferGetBaseAddress(buf) else { return nil }
        let w = CVPixelBufferGetWidth(buf), h = CVPixelBufferGetHeight(buf)
        let stride = CVPixelBufferGetBytesPerRow(buf)
        var out = Data(count: w * h)
        out.withUnsafeMutableBytes { dst in
            for y in 0..<h {
                memcpy(dst.baseAddress!.advanced(by: y * w), base.advanced(by: y * stride), w)
            }
        }
        return Gray(bytes: out, width: w, height: h)
    }

    static func writeGrayPNG(_ bytes: Data, width: Int, height: Int, bits: Int, to url: URL) {
        let info: CGBitmapInfo = bits == 16
            ? CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue | CGBitmapInfo.byteOrder16Little.rawValue)
            : CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue)
        guard let provider = CGDataProvider(data: bytes as CFData),
              let space = CGColorSpace(name: CGColorSpace.linearGray),
              let image = CGImage(width: width, height: height, bitsPerComponent: bits, bitsPerPixel: bits,
                                  bytesPerRow: width * bits / 8, space: space, bitmapInfo: info,
                                  provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent),
              let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)
        else { return }
        CGImageDestinationAddImage(dest, image, nil)
        CGImageDestinationFinalize(dest)
    }
}
