# Kimi camera 36

Confirmed defects in 35:
- Mounted camera ignored mouse/touch yaw/pitch refs and forced a trailing pose
  every frame. Changing input sensitivity could not repair that code path.
- Fallback avatar camera used .12 position lerp per rendered frame, introducing
  frame-rate-dependent drag latency. This path covers fallback/emote states.

Changes:
- Mounted camera now consumes the actual input yaw/pitch, preserving relative
  orbit through subsequent frames and car turns. New mount resets its offset.
- Camera translation follows the mounted actor directly rather than lagging
  behind its already-interpolated network position.
- Fallback orbit is direct; emote presentation retains time-based smoothing.
- Touch yaw uses short viewport dimension: 100 CSS px is about 61.5 degrees at
  390x844, vs 40.1 before. Mouse sensitivity remains .0052 rad/px.
- No changes to driving physics, car models, server, geometry or originals.

Verification:
- qa36-test: 1000-frame retained vehicle orbit, translation, new-mount reset,
  finite inputs, portrait/landscape gain, actual runtime mouse/touch ownership,
  cancellation, 1000 drag cycles, fallback and mounted call-site wiring.
- qa30 native browser zoom guard regression passes.
- Chrome desktop: enter car with E; horizontal/vertical drag changes camera.
- Chrome 390x844: orbit remains after resize/release; reverse-direction drag
  works; steering-pad drag does not change camera; Exit returns to walking.
- These browser actions use mouse at a narrow viewport, not real iPhone touch.

Not certified: real-phone feel, collision-free camera at every building,
all vehicle handling bugs, previous intermittent phone chat freeze.

Rollback: revert camera-36 commit; backend driving-35 is unchanged.
