# Returning-player entry recovery — entry-return-1

## Cause observed
The returning-profile CSS hid the entire wardrobe main area, including its entry progress and retry controls. A saved-player cold entry spent about 18 seconds behind only a static header in the desktop-repo mobile emulation. That run eventually entered successfully; a permanent iPhone Safari stall was not reproduced.

## Change
- A separate returning-player loading card stays visible while the main wardrobe is hidden.
- Real preparation progress, downloaded MB, current stage, and avatar-pending state.
- Retry on error or after a slow load, plus a wardrobe return button.
- No automatic retry loop, storage reset, character replacement or game-physics change.
- Explicit UI timer cleanup and bounded display values.

## Verification
- Desktop 1280x850: saved gorilla entry and reload; renderer frame counter advances; zero unexpected page errors.
- Mobile Chrome touch emulation 390x844: saved Friends character entry and reload, same identity, renderer continues.
- Both: paused map-module request keeps progress/recovery visible.
- Both: simulated map-module exception exposes retry; remove fault and click retry successfully enters.
- Portrait, desktop, 844x390 landscape: no horizontal document overflow.
- Node entry-state regressions and existing skate-surface regressions pass.

Physical iPhone Safari and live multiplayer synchronization are not covered by these tests. This release fixes the observed hidden-loading/recovery UI; it is not evidence that every possible device loading stall is resolved.
