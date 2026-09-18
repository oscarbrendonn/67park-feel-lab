# Park water and dry skate bowl

- Removed the startup call that recolored, raised and re-enabled 9_GOLET_MINI.
  The legacy cap stays hidden; the authored skate bowl and its ground remain.
- Pond retains the coastal palette, clock, swimmer position and wake uniforms.
- Adapted coastal vertex displacement to the pond's world-space Y axis.
- Strengthened soft pond ripple shading without changing ocean materials.
  Pond displacement is bounded by 0.025 m; ocean remains at 0.012 m.
- Lowered only the local swimming visual in the park pond so the capsule's
  0.58 m flotation height no longer leaves the entire avatar above the surface.
  Physics, movement, collision, coastline and other game maps remain unchanged.
- No new meshes, textures, draw calls or render loops.

Browser tests: desktop 1200x850 and mobile emulation 390x844. Entered the actual
park, placed the physics body in the pond, swam using W, checked wet/wake
uniforms and rendered player-level, shoreline and skate-bowl screenshots.
Confirmed cap hidden, bowl dry, pond wet, shared palette, advancing water clock,
50 rendered frames in 800 ms and no page/shader errors. A red material probe
confirmed the pond mesh really draws; the previous flat appearance was not
just a missing mesh. Final immersion calibration requires the live run.

This is not a physical-iPhone test. Sound, carry mechanics and mini games are
not changed by this release.
