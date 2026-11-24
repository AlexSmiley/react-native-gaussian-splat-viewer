# Native GPU renderer integration

This repository provides an actual cross-platform WebGL renderer in a React Native WebView. **Vulkan and Metal renderers are not implemented**. The app currently uses native OS document picking and React Native UI, with WebGL GPU rendering.

For a native backend, implement a Fabric native surface and JSI/TurboModule interface:
- Android: Kotlin owns lifecycle; C++/Vulkan renderer uploads positions, SH colors, covariance and opacity; GPU sorting and alpha compositing.
- iOS: Swift owns MTKView; Metal shader pipeline and GPU ordering.
- Shared C++: parse PLY property descriptors (do not assume fixed order); parse the common 32-byte binary SPLAT layout; expose normalized buffers.
- Bridge: openScene(path), closeScene(), updateCamera(view, projection), memoryPressure().
- Only enable native rendering when a renderer is registered and device-tested.

A production system must avoid the base64 WebView transfer used in this starter and stream local files or use native file descriptors, especially for large captures.
