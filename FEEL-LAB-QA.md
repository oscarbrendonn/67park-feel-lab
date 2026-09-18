# Feel Lab verification — 2026-09-18

## Local checks

- 27 unit/regression tests passed: camera/velocity at 30/60/120 Hz, obstruction
  release, travel-based cadence, housing, returning entry, lobby input handling.
- Additional real-triangle camera test passed: double-sided wall detection,
  hidden-parent exclusion, moved geometry; original material left unchanged.
- Existing controls regression passed: 1,000 owned jump cycles, wheel+gas and
  jump+move cycles; blur reset, right mouse and Rockets attack separation.
- Main park: Chrome 1280×900 desktop and 390×844 touch emulation, actual walking,
  jump, pointer/touch orbit and fixed FOV; no uncaught page errors.
- Lane Rush: both sizes, successful carry with two solved arm chains and contact
  error below 0.16 world units, throw release and neutral arm return. After 1,000
  repeated grab button clicks, rendering advanced 28/30 frames in 450 ms.
- Skybound: mobile-sized entry, movement and airborne jump, shared pitch/FOV.

## Limits

No physical iPhone/Android run, sustained battery/thermal test, network-loss soak
or full-lobby render certification was performed. Automated button spam is a
bounded regression, not proof that freezing is impossible. Car handling and
basketball/penalty aiming were intentionally not rewritten. Carry IK was
retained from the original and validated, not newly authored in this fork.

## Reproduce

Browser checks require Playwright and Chrome; the scripts currently point to
the local QA installation. Set `FEEL_URL` to the deployed repository URL.

```
node --test qa/feel-camera.test.mjs qa/housing.test.mjs qa/lobby-stability.test.mjs qa/returning-entry.test.mjs
node --loader ./qa/three-test-loader.mjs --test qa/feel-camera-meshes.test.mjs
node qa/controls-37.test.mjs
node qa/feel-browser.cjs
node qa/feel-minigames.cjs
node qa/feel-carry.cjs
```
