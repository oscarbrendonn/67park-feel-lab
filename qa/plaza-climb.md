# Plaza shrub → awning → roof

Release key: `plaza-climb-1`. Repository: `67park-feel-lab` only.

The pictured district is `LOWER_PLAZA_V83`, not the reference-city or west
courtyard buildings. Its 11 shops previously had whole-building collision
boxes and no support on striped awnings. Planter boxes also floated above the
actual rounded foliage.

Characters now use indexed, upward-facing triangles for the leaves, awnings,
window trims and roofs. Layered queries preserve the paving underneath high
awnings; solid shop cores cannot be entered through the facade. The original
vehicle/world ground query is unchanged. A low projecting sill is a side
obstacle until the feet clear it, preventing torso clipping.

The awning-to-roof rise exceeds an easy stock double jump. Small rounded
extensions to the existing upper-window sills and heads provide intermediate
landings, using the existing cream material. No global jump, model scale,
palette, light, texture, road, vehicle, UI, or backend changes. No hidden
staircase or teleport is used along the test route.

The new index retains **5,413,372 bytes** (about 5.16 MiB). The 48 shared trim
extensions add **one instanced draw**, not 48 separate draws, and no new model
or texture downloads. Indices and owned trim geometry are released on dispose.
This is additional CPU memory, not a claim of zero load.

## Verification

`node qa/plaza-climb-run.cjs` passed in desktop 1280×900 and touch/mobile
390×844 Chrome emulation. The real Space / Jump button is pressed; ordinary
analog movement input drives the route. Only its starting position is placed.

- 33 visible-model comparisons per viewport cover all 11 shop fronts/roofs.
- Actual route: paving → shrub → striped awning → lower sill → window head →
  roof → back down → blocked ground-level facade.
- Latest touch landings (body centre Y): shrub 12.338, awning 15.353, sill
  16.255, head 19.115, roof 20.875. Ground-level wall stops at X 16.900.
- A reproducible mobile descent snag at a 28 cm roof lip was fixed in the
  shared swept-contact predicate. A rear probe may disregard the previously
  safe floor only while moving away; forward walls and lateral corner tests
  remain mandatory. Four orientation fixtures cover this regression.
- Unit suite: 95 passed / 1 optional external-geometry fixture skipped.
- The full local foundation run passed on desktop and mobile: curbs, grass, shortened divider,
  69 house roofs, chat spam, reconnect with a peer, 100 home transitions,
  1000 punch/interact commands, wardrobe cycling and a 120-second mobile soak.
  Both viewports reported zero errors and the peer remained connected. The final
  local low-sill torso guard was additionally rerun through the focused route
  and unit tests after that full run started.

Screenshots are generated under `.qa-results/plaza-{awning,roof}-*.png`.
These are local browser tests, not physical iPhone/Android or 100-player
performance certification. GitHub's mandatory 900-second mobile soak and
Pages deployment still have to succeed before calling this release live.

CPU-only CI gets a longer bounded movement/capture deadline because its render
frames arrive more slowly while game timesteps remain clamped. Hardware
action deadlines, frame-gap/loss assertions, all test cases and the complete
900-second release soak are unchanged. Previous run 35460538328 failed while
capturing the divider screenshot, not a successful live publication.
