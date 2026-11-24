# React Native Gaussian Splat Viewer

Android/iOS 3D file viewer using **React Native, Expo, Three.js and GaussianSplats3D**.

## Live web demo

**Vercel:** [Open Gaussian Splat Viewer](https://react-native-gaussian-splat-viewer.vercel.app)

Use the Model library dropdown to select a bundled PLY model, or Browse to open a local PLY/SPLAT file. Switching bundled models refreshes the viewer and loads the selected model automatically. Rendering takes place in the browser; local files are not uploaded.

## Supported imports

| Format | Renderer |
|---|---|
| Gaussian-splat PLY (3DGS) | GaussianSplats3D |
| Standard point-cloud PLY (ASCII or binary as supported by Three.js PLYLoader) | Three.js Points |
| Common binary SPLAT | GaussianSplats3D |

The app imports files through the native document picker, copies them to local application storage, and passes them to a bundled offline WebGL viewer. Pinch to zoom, drag to orbit; two-finger drag to pan. No upload server.

## Setup

Node.js 20+ and Android Studio or macOS/Xcode are required for platform builds.

```bash
git clone https://github.com/AlexSmiley/react-native-gaussian-splat-viewer.git
cd react-native-gaussian-splat-viewer
npm install
npm run android
# or on macOS:
npm run ios
```

`npm install` installs the nested viewer dependencies and runs the Vite build via postinstall. When changing web renderer files, run `npm run build:viewer` again. Expo Go is not the supported target; create a development build with `expo run:android` / `expo run:ios`.

## Quality checks

```bash
npm run typecheck
npm test -- --watch=false
npm run build:viewer
```

GitHub Actions runs these checks on every push and PR. Actual device rendering must still be verified on Android and iOS hardware.

## Architecture

- `App.tsx`: mobile file library and viewer screen
- `src/files.ts`: native document picker, local sandbox copy
- `src/format.ts`: extension detection and basic Gaussian header recognition
- `src/Viewer.tsx`: WebView transport, loading state and errors
- `viewer-web/src.js`: Three.js point cloud and GaussianSplats3D rendering
- `native/README.md`: future native Vulkan/Metal implementation contract

## Known limitations

- The **shipped GPU renderer is WebGL**, not native Vulkan/Metal. The hybrid architecture is prepared for native renderer integration; native GPU renderer modules do not exist yet.
- WebView transfer currently uses base64 with a conservative **48 MiB file limit**. Large PLY/SPLAT scenes require streaming transport or native file access.
- File classification is heuristic (common 3DGS PLY headers); unusual exporters may need extra format recognition.
- Binary SPLAT assumes the common record convention; other SPLAT dialects may differ.
- Files should be treated as untrusted input; add strict binary parsing limits before publishing to app stores.
- Bundled WebView assets may need platform-specific adjustments depending on React Native WebView and Metro versions; run device tests.

## Deployment

Web: Vercel (Vite), root directory `viewer-web`, build command `npm run build`, output directory `dist`. The build regenerates the resource manifest from `viewer-web/public/resources/`.


Android: build APK/AAB using Gradle after `expo prebuild` or EAS Build.
iOS: build with Xcode or EAS Build on supported macOS runner.
