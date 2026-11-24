# RVM Scans (iPhone LiDAR capture)

Part of Royal Vista Mirai. Records LiDAR photos (color, LiDAR depth and camera position for each frame) on an iPhone with LiDAR, and sends them as a .zip that the Janet's Void Garage viewer imports with **Add scan**.

The folder name starts with `_` so the asaaab.com site build skips it.

## What a scan holds

Same layout as a Stray Scanner export:

| File | What it is |
| --- | --- |
| `rgb.mp4` | color video, 1920x1440, time 0 = first frame |
| `depth/000000.png` | 16-bit grayscale depth in millimeters, 256x192 |
| `confidence/000000.png` | 8-bit LiDAR confidence: 0 low, 1 medium, 2 high |
| `odometry.csv` | `timestamp, frame, x, y, z, qx, qy, qz, qw` (ARKit camera pose, meters) |
| `camera_matrix.csv` | 3x3 color camera intrinsics |
| `rvm.json` | app, device and time |

About 30 LiDAR photos are saved per second.

## Getting the app

1. GitHub builds it on every change to `_lidar-app/` (Actions tab, "RVM Scans iPhone app"). No Mac needed.
2. Open the latest green run and download **RVMScans-ipa** (a zip with `RVMScans.ipa` inside).

## Installing from Windows with Sideloadly (free Apple ID)

1. Install iTunes and iCloud from apple.com, not the Microsoft Store versions (uninstall those first).
2. Install Sideloadly from sideloadly.io.
3. Plug the iPhone in by cable and tap **Trust** on the phone.
4. Drag `RVMScans.ipa` into Sideloadly, enter your Apple ID **in Sideloadly only**, and press Start.
5. On the iPhone: Settings > Privacy & Security > Developer Mode > On (it restarts). Then Settings > General > VPN & Device Management, tap your Apple ID, and Trust.

A free Apple ID signs the app for 7 days. Re-run step 4 to refresh it. Scans already on the phone are kept.

## Getting scans off the phone

- In the app: the stack button > **Send** on a scan > save to Files or Google Drive ("Janet's Void / garage scans").
- Or the Files app: On My iPhone > RVM Scans > captures.

Then in Janet's Void Garage: **Add scan** and pick the .zip.
