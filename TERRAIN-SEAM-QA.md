# Terrain seam repair — 2026-09-18

## Scope
Both current Kimi Party repositories. No changes to the old Codex map, UI layout,
vehicle controls, audio, character models, bowl footprint or skate behavior.

## Repairs
- 7 measured small-bowl/grass cracks, including the user's concave edge and a
  micrometre-sized export crack caught by the 2.5 cm sampling grid.
- 17 enclosed map seams in parcels, short road ends and park path joins.
- 6 generated short curb/entry sheets now have matching-material closed sides.
  These were top-only meshes: a low-angle ray went through to buried sand.
- 24 top patches cover 0.253756 square metres. Original position/index prefixes
  and existing materials are preserved. 5,336 patch triangles + 778 side triangles.
  No extra meshes or draw calls, no coplanar cover sheet over the old surfaces.
- Existing coastline sand and water are intentionally untouched.

## Verification
- Original before/after world geometry exported from the running browser.
- Small bowl: 811,801 height samples at 2.5 cm spacing. Underlying-road leakage
  decreased from 174 samples to 0; no exposed sand/missing samples afterward.
- 27 non-sand terrain surface unions scanned for enclosed narrow gaps:
  area 0.0001–3 m², characteristic width <= 0.1 m, precision 0.00001 m.
  17 candidates before; zero after. This is not a proof about every possible
  camera angle, external boundary or sub-threshold crack.
- Real mesh regression: 1,291 patch triangle-centroid height checks passed,
  original vertex/index values unchanged, bowl geometry unchanged, idempotent.
- Close screenshots: bowl top, N/E/S/W, concave corner from both sides, parcel
  triangle from both sides, short rounded curb, plaza, east park path.
  East path ground is partly hidden by the bridge; ground geometry tested separately.
- Local desktop 1280x900 and mobile Chromium 390x844 (touch, DPR 2):
  saved-character entry + reload, 24-patch report, 778 side triangles, ground
  probes, four angled curb rays (all hit curb rather than sand), advancing renderer,
  zero uncaught page errors.
- Existing skate-surface and returning-entry unit tests still pass.
- Mobile emulation is not a physical iPhone Safari pass. Local multiplayer
  is disconnected; this repair does not claim to validate online gameplay.

## Repeatable unit checks
```sh
node qa/terrain-seams.test.mjs
node qa/skate-surface.test.mjs
node qa/returning-entry.test.mjs
```
The first test uses vendor/three.module.js. For a sparse checkout, set
THREE_MODULE to an existing Three.js ES module path.

## Cache chain
index.html -> main.js?v=seams-1 -> runtime.bundle.js?v=seams-1 ->
map-continuity.js?v=seams-1 -> terrain-seam-repair.js?v=seams-1.
