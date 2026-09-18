# Kimi skate wind — wind-23

Wind-only port of `TRAVEL_WIND` from the user-supplied reference https://oscarbrendonn.github.io/67park-island/app/main.js (inspected 2026-09-15).

Preserved: crossed 0.026-wide white ribbons, 0.85 ring, 34/s emission rate, >=5 speed threshold with grounded skate sprint, backward speed `speed*1.15+3`, 0.17–0.27 second lifetime, taper/fade. No reference footprints or dust imported.

Only isolated Kimi preview changed. Local character's actual velocity, board/sprint, ground, swimming, mount and pause states drive the effect. No physics, controls, character selection, camera, networking or terrain changes. Existing effects remain intact.

Bounded pool: mobile 90 / desktop 180. One InstancedMesh/one visible draw, no new textures, lights, shadows, timers or animation loops. Hidden/pause/invalid long frame clears; reduced motion suppresses the streaks. Disposal removes and releases resources.

## Verified

- Node: each pool passed 10,000 simulation frames plus 1,000 pause/resume cycles, finite transforms, upper capacity bound, stationary/walking/slow/swimming/mounted/airborne gates, reduced motion, invalid dt/coordinates and repeat disposal.
- Chrome actual Kimi world: local-only temporary UI drove existing skateboard/sprint inputs for three seconds. Actual speed 10.46–15.11; wind active with 1 draw and 3–5 live streaks in captured frames. White ribbons visibly trailed the character.
- Stop: speed 0, active false, live 0, draws 0. Captured console errors empty.
- Temporary driving UI and hooks removed before release; release has no QA input automation.
- Syntax checks passed. New effect uses the existing world frame/update/dispose lifecycle.

Not verified: physical iPhone/Safari, full multiplayer visual synchronization or full-map regression. Mobile pool simulation is not a physical phone test. The reference's runtime appearance was matched from its actual wind implementation, not a recorded side-by-side run.
