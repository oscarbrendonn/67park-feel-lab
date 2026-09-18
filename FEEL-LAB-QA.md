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
- Rockets: countdown completion, camera-relative movement, a quick keyboard
  jump reaching 1.18 units, and actual touch camera drag, without page errors.
- Balloon: local bot match and results flow loaded without page errors. This is
  a smoke check, not exhaustive competitive gameplay or network certification.

## Limits

No physical iPhone/Android run, sustained battery/thermal test, network-loss soak
or full-lobby render certification was performed. Automated button spam is a
bounded regression, not proof that freezing is impossible. Car handling and
basketball/penalty aiming were intentionally not rewritten. Carry IK was
retained from the original and validated, not newly authored in this fork.

## House-entry stability follow-up — home-stability-1

- Removed the interior-only HemisphereLight. Showing/hiding the room had changed
  the scene light count and compiled additional shader variants. The room now
  reuses world lighting with a small emissive fill; no new texture/model downloads.
- In one cold-entry Chrome baseline, the maximum animation-frame gap was 583 ms
  and shader programs increased from 206 to 213. After the change, the comparable
  Gorilla run measured 16.8 ms with 206 programs unchanged; mobile emulation also
  measured 16.8 ms at entry. These are individual local measurements, not phone
  performance guarantees or proof of the reported permanent freeze's cause.
- Gorilla desktop and mobile emulation passed 20 home transitions per run,
  100 keyboard Punch taps, bursts of 1,000 Punch clicks and 1,000 Interact events,
  chat followed by Homes, and movement afterward. Cooldowns intentionally reject
  excess commands; this does not mean 1,000 simultaneous attack animations.
- Friends `friendsie_1` repeated the same suite at both viewport sizes and passed.
  Mobile additionally completed 100 browser touch taps on Punch (waiting through
  the normal cooldown): 5,784 rendered frames, maximum frame gap 66.6 ms in that
  action. Settings remained hidden during selection/studio and available in play
  at both sizes after updating the release entry points.
- The separate two-client housing suite passed all eight houses, guest/locked
  entry, real chat exchange, reconnect and offline exit. Actual renderer frames
  advanced; no uncaught page errors were reported.
- Resource regression: 1,000 show/hide cycles reuse a single interior, add no
  scene lights/textures, and restore world hooks on disposal. The local stalled-
  render report now includes house ID, pending action and shader-program count;
  it sends no diagnostics or chat content to a server.
- Interiors still share the main scene. Exterior assets are not unloaded on
  entry. Permanent freezing on the user's physical phone remains un-reproduced;
  physical iPhone/Android and full-lobby thermal/memory soak remain required.

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
node --loader ./qa/three-test-loader.mjs --test qa/housing-render.test.mjs
node --test qa/render-health.test.mjs
HOUSE_QA_URL=http://127.0.0.1:8497/67park-feel-lab/ node qa/housing-browser.cjs
node qa/action-stability.cjs
CHARACTER=friendsie_1 node qa/action-stability.cjs
```

## On-demand house scene pilot — home-scene-1

Scope: **Rose Cottage (H01)** in Feel Lab only. The original desktop/mobile
repositories are unchanged. The server protocol, player ID, island membership,
chat connection and authoritative house admission remain unchanged.

- Door markers load with the park. The interior module, geometry and materials
  are prepared only when a home is requested, with shader warmup before the
  normal UI sends `house.enter`. One in-flight preparation and one reusable room.
- Inside H01, exterior roots move to a dormant scene. The local park update,
  outdoor effects, ambient bots and park toys are suspended. Shared avatars,
  character animation/effects, camera, physics, lights and sockets stay active.
  Another player's browser and server world are not paused.
- Leaving restores the same exterior objects and their original visibility.
  Opening the overhead map temporarily restores them too. Map travel from a
  house first requests a server-side exit, then applies the existing validated
  map destination, avoiding an outside player still marked as an indoor guest.
- Download/compile failure leaves the normal UI entrant outside with a retry.
  Timeout, stale completion and disposal are guarded. Collision hooks attach
  only when the prepared room is used, so a discarded late preparation cannot
  retain or replace the retry's ground/collision hooks.
- Thirty-five focused unit/regression tests pass, including 1,000 scene
  suspend/restore cycles, 1,000 deduplicated preparations, late shader completion,
  resource cleanup, authoritative housing and returning-player entry.
- Three real Chrome clients on the isolated multiplayer backend passed: two
  people seeing/moving together inside H01 while a third drove the outside car;
  chat both ways; a deliberately aborted interior download followed by retry;
  reconnect preserving identity and house; map overview and map travel out of
  the house; owner release; and movement after returning. One client used
  390×844 touch emulation. No uncaught page/game errors were reported.
- A sampled Gorilla entry suspended 33 exterior roots: scene traversal nodes
  changed from 1,204 to 150 and that view's render calls from 151 to 33, with
  shader programs unchanged at 210. These are scene/view-specific measurements,
  not a general FPS multiplier or a phone memory claim.
- After the second client warmed the indoor scene, 20 repeated transitions
  retained exactly 796 renderer geometries and 57 textures at the indoor
  checkpoints; no per-entry room/resource growth appeared in that bounded run.
- H01 passed the existing action-stability suite on desktop and 390×844 touch
  emulation: 20 transitions per viewport, 100 keyboard Punch presses, bursts of
  1,000 Punch clicks/Interact events, chat/Homes and subsequent movement. Mobile
  also passed 100 browser touch taps: 5,691 rendered frames during that action,
  maximum observed frame gap 66.7 ms, zero context losses and page/game errors.
  Cooldowns reject excess commands; this is not 1,000 simultaneous animations.

Important limits: this is **scene/CPU partitioning, not full exterior memory
unloading**. Exterior CPU/GPU assets are intentionally retained for a safe,
immediate return; no texture quality was reduced. No network interest filtering,
new server, server purchase or 100-player certification is included. H02–H08
keep the previous shared-exterior behavior. `?homeScene=legacy` disables the
H01 partition for comparison. Physical iPhone/Android and sustained thermal/
memory tests remain necessary.

Additional commands (isolated test backend only; do not spam the public lobby):

```
node --loader ./qa/three-test-loader.mjs --test qa/housing-loader.test.mjs qa/housing-scene.test.mjs qa/housing-render.test.mjs
FEEL_URL=http://127.0.0.1:8497/67park-feel-lab/ node qa/housing-scene-browser.cjs
HOUSE=H01 node qa/action-stability.cjs
```
