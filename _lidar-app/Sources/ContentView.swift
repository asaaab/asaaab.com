import SwiftUI
import ARKit
import SceneKit

struct ContentView: View {
    @StateObject private var engine = CaptureEngine()
    @StateObject private var store = CaptureStore()
    @State private var showList = false

    var body: some View {
        ZStack {
            Theme.bay.ignoresSafeArea()
            CameraView(session: engine.session).ignoresSafeArea()

            VStack(spacing: 0) {
                header
                Spacer()
                footer
            }
        }
        .onAppear {
            engine.onFinished = { store.reload() }
            store.reload()
            engine.run()
        }
        .onDisappear { engine.pause() }
        .onChange(of: engine.isRecording) { _, rec in
            UIApplication.shared.isIdleTimerDisabled = rec
        }
        .sheet(isPresented: $showList) {
            CaptureList(store: store)
        }
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            Text("JANET'S VOID")
                .font(Theme.display(13)).tracking(1.2).foregroundStyle(Theme.muted)
            Text("Scans")
                .font(Theme.display(22)).foregroundStyle(Theme.ink)
            Spacer()
            HStack(spacing: 6) {
                Circle().fill(engine.trackingGood ? Theme.ok : Theme.hole).frame(width: 8, height: 8)
                Text(engine.trackingText).font(.footnote).foregroundStyle(Theme.ink).lineLimit(1)
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 10)
        .background(Theme.panel.opacity(0.88))
    }

    private var footer: some View {
        VStack(spacing: 14) {
            if !engine.supported {
                Text("This iPhone has no LiDAR. Scans needs an iPhone Pro.")
                    .font(.callout).foregroundStyle(Theme.hole).multilineTextAlignment(.center)
            } else if engine.isRecording {
                HStack(spacing: 18) {
                    stat(String(format: "%.1f s", engine.elapsed), "recording")
                    stat("\(engine.frameCount)", "LiDAR photos")
                }
            } else {
                Text("Walk slowly, about 1 m from what you're scanning. Each second saves about 30 LiDAR photos.")
                    .font(.footnote).foregroundStyle(Theme.muted).multilineTextAlignment(.center)
            }

            HStack {
                Button { showList = true } label: {
                    VStack(spacing: 2) {
                        Image(systemName: "square.stack.3d.up").font(.title2)
                        Text("\(store.captures.count) saved").font(Theme.display(13))
                    }
                    .frame(width: 80)
                }
                .disabled(engine.isRecording)
                .foregroundStyle(Theme.ink)

                Spacer()

                Button {
                    engine.isRecording ? engine.stopRecording() : engine.startRecording()
                } label: {
                    ZStack {
                        Circle().stroke(Theme.ink, lineWidth: 4).frame(width: 78, height: 78)
                        if engine.isRecording {
                            RoundedRectangle(cornerRadius: 6).fill(Theme.hole).frame(width: 30, height: 30)
                        } else {
                            Circle().fill(Theme.hole).frame(width: 64, height: 64)
                        }
                    }
                }
                .disabled(!engine.supported)
                .accessibilityLabel(engine.isRecording ? "Stop scan" : "Start scan")

                Spacer()
                Color.clear.frame(width: 80, height: 1)
            }
        }
        .padding(.horizontal, 16).padding(.top, 14).padding(.bottom, 24)
        .background(Theme.panel.opacity(0.88))
    }

    private func stat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 0) {
            Text(value).font(Theme.mono(22)).foregroundStyle(Theme.ink)
            Text(label).font(.caption).foregroundStyle(Theme.muted)
        }
    }
}

/// Live camera behind the controls.
struct CameraView: UIViewRepresentable {
    let session: ARSession
    func makeUIView(context: Context) -> ARSCNView {
        let v = ARSCNView(frame: .zero)
        v.session = session
        v.automaticallyUpdatesLighting = false
        v.rendersCameraGrain = false
        return v
    }
    func updateUIView(_ uiView: ARSCNView, context: Context) {}
}

struct CaptureList: View {
    @ObservedObject var store: CaptureStore
    @Environment(\.dismiss) private var dismiss
    @State private var sharing: URL?
    @State private var zipping: URL?
    @State private var errorText: String?
    @State private var confirmDelete: Capture?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text("Send a scan as a .zip, then in Janet's Void Garage tap Add scan and pick it. Saving to Google Drive in \"Janet's Void / garage scans\" works from any screen.")
                        .font(.footnote).foregroundStyle(Theme.muted)
                }
                if let errorText {
                    Text(errorText).font(.footnote).foregroundStyle(Theme.hole)
                }
                ForEach(store.captures) { c in
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(c.date, format: .dateTime.month(.abbreviated).day().hour().minute())
                                .font(Theme.display(18))
                            Text("\(c.frames) LiDAR photos · \(ByteCountFormatter.string(fromByteCount: c.bytes, countStyle: .file))")
                                .font(Theme.mono(12)).foregroundStyle(Theme.muted)
                        }
                        Spacer()
                        if zipping == c.url {
                            ProgressView()
                        } else {
                            Button("Send") { send(c) }
                                .buttonStyle(.borderedProminent)
                                .disabled(zipping != nil)
                        }
                    }
                    .swipeActions {
                        Button("Delete", role: .destructive) { confirmDelete = c }
                    }
                }
                if store.captures.isEmpty {
                    Text("No scans yet. Tap the red button to start one.")
                        .foregroundStyle(Theme.muted)
                }
            }
            .navigationTitle("Saved scans")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
            .confirmationDialog("Delete this scan from the iPhone?", isPresented: Binding(
                get: { confirmDelete != nil }, set: { if !$0 { confirmDelete = nil } }
            ), titleVisibility: .visible) {
                Button("Delete", role: .destructive) {
                    if let c = confirmDelete { store.delete(c) }
                    confirmDelete = nil
                }
            }
            .sheet(item: Binding(get: { sharing.map(ShareItem.init) }, set: { sharing = $0?.url })) { item in
                ShareSheet(items: [item.url])
            }
        }
        .onAppear { store.reload() }
    }

    private func send(_ c: Capture) {
        zipping = c.url
        errorText = nil
        Task.detached {
            let result = Result { try CaptureStore.zip(c.url) }
            await MainActor.run {
                zipping = nil
                switch result {
                case .success(let url): sharing = url
                case .failure(let e): errorText = "Couldn't pack that scan: \(e.localizedDescription)"
                }
            }
        }
    }
}

struct ShareItem: Identifiable {
    let url: URL
    var id: URL { url }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ vc: UIActivityViewController, context: Context) {}
}
