# Skate bowl surface following — skate-bowl-1

Scope: rider + existing board follow the authored bowl/ramp slope; carry uphill
motion into one lip launch; retain current controls, model assets and trick poses.
No geometry/material/model or server changes.

Integration:
- One guarded surface controller, using the existing spatial terrain sampler.
- Explicit skate-surface allowlist excludes roads, curbs, stairs, rails and water.
- Existing collision sweep remains enabled. Legacy ramp impulse is bypassed when
  the new controller owns contact, so impulses are not stacked.
- Existing root (rider + deck) uses damped pitch/roll, anchored at wheel contact.
- Manual jump overrides ground adhesion. Dismount, water, teleport and tab-resume
  reset contact history. Probe failure disables only this optional controller.
- Reduced-motion keeps necessary ground alignment, omits decorative air tipping.
- No new listeners, render loops, models, particle emitters or scene-wide raycasts.

Validation:
- `node qa/skate-surface.test.mjs`: 30/60/120 FPS, one crest launch, floor descent,
  manual hop, dismount, teleport, water, curb/stair exclusion, suspended-frame reset,
  probe failure isolation and 2000 repeated calls.
- Real authored NW bowl geometry: four directions at 30/60/120 FPS, each produced
  one launch and finite slope state (12 routes per viewport).
- Chrome desktop 1280x850: real keyboard drive, lip launch/landing, Space hop and V exit.
- Chrome mobile emulation 390x844: touch joystick, Walk/Skate and Jump, lip launch/landing.
- Render frame continued advancing; no page JavaScript errors in these runs.
- Pure controller module is byte-identical in desktop/mobile.

Limits: mobile emulation is not a physical iPhone/Safari test. Local preview was
disconnected from multiplayer; this pass does not certify online synchronization
or whole-game absence of bugs.
