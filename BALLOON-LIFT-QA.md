# Balloon lift tuning — 2026-09-18

- Ascent changed from 4.2 m / 3.5 s to 8 m / 5.5 s.
- Height escape guard now follows rideHeight + 1.8 m instead of the old fixed 6 m.
- Existing Interact / Jump release, horizontal hold, cooldown, 6-second glide and
  2.2 m/s descent cap retained. Remote balloon validation uses the same rideHeight.
- No new models, textures, meshes, particles or per-frame work added.

Tests:
- qa/balloon-lift.test.mjs: 20/30/60/120 FPS ascent, bounded peak, automatic
  release and landing, Jump / Interact manual release, 1,000 repeat interactions,
  remote visibility envelope at 8 m, rejected out-of-bounds height.
- Local running desktop (1280x900) and mobile Chromium touch emulation (390x844):
  real E / Interact, automatic full ride, Jump release, landing, no uncaught errors.
  Measured peaks: desktop 8.0106 m; mobile 8.0112 m above start.
- Existing terrain seam regression still passes; the previous sand fix is untouched.
- These are not physical iPhone Safari or two-player live multiplayer tests.
