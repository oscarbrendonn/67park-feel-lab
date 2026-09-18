# Controls 37 — Kimi preview only

## Changes

- Pocket Rally: park-style white analogue steering pad, relative to initial thumb contact; independent gas/brake ownership; direct left/right mouse or touch camera orbit around the car. Steering returns to neutral on release/cancel/lost capture. Added page-hide/orientation cleanup. Existing race physics and server protocol are unchanged.
- Candy Rockets: Space jumps, F attacks (mouse/right aim stick still attacks); J remains a jump alias. A visible pink Jump button uses pointer capture and a 100 ms quick-tap buffer. Keyboard movement remains available after clicking loadout buttons. White joystick surfaces match the Kimi controls.
- Balloon Battle (current practice and online entries): shared input, white movement pad, visible Jump/Sprint/Dash buttons on desktop and mobile, no irrelevant skateboard button. Space jumps, F/E dashes, Shift sprints. Pointer capture prevents a thumb sliding off Jump from losing the press. Drag-camera sensitivity is shared with the park. The input buffer survives the online 40 ms send interval.
- Shared styles load only in these three mini-game entries. Penalty/basketball and main-map assets are unchanged. The original repositories and dedicated online server were not changed/restarted.
- This release does not add jumping to cars or alter race handling physics.

## Checks

- `node qa/controls-37.test.mjs`: PASS. 1,000 action ownership/cancel cycles, 1,000 wheel + gas cycles, 1,000 jump + movement cycles, quick-tap buffer, blur cleanup, right-mouse look, Rockets Space vs F mapping. Actual Balloon movement physics consumes a mobile tap, reaches 0.596 m and lands.
- Existing qa30 viewport guard: PASS, 1,000 gesture ownership cycles.
- Existing qa34 sports input: PASS, 1,000 mixed pointer/key/cancel cycles; all standalone entries still load viewport guard.
- Syntax checks and `git diff --check`: PASS.
- Local Chrome, 390 x 844: Pocket Rally start/countdown, gas raises speed, wheel returns to zero, orbit visibly rotates and keeps car framed. Candy Rockets pink Jump visibly lifts character, match continues, no captured game errors. Balloon controls visible, camera visibly rotates, Jump/input and actual physics tested separately above.
- 1280 x 800: Rockets help shows Space jump / F attack and Jump remains visible. Balloon 844 x 390: action controls remain visible in desktop-mode landscape.

## Limits

These are desktop Chrome viewport and automated input/physics checks, not a physical iPhone/Safari test. No new multi-client match or full race-lap certification was performed in this release. Car jumping is not implemented. Do not interpret this as certification that every game has no bugs.
