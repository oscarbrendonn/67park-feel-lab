# Terrain boundaries: ground-2

Scope: Feel Lab only, based on `53b8c9e`. Original Kimi desktop/mobile
repositories, controls, studio flow, textures and online protocol are unchanged.

## Cause and repair

- The road did not break dynamically. Its cutouts and the four central plaza
  slabs had different boundaries. Four long slots and four curved slots exposed
  the sand layer. The old tiny-enclosed-gap scan missed these larger/open gaps.
- Fill 85.027 m² of measured central slots with the adjoining slab material.
  Extend the original slab bases down into the road: their original bottoms
  floated 7.45 mm above it. Preserve the existing walking-surface heights.
- Close the 109.996 m² road opening under the central fountain; enlarge its
  three existing meshes 6% horizontally and lower the plinth to meet the road.
- Smooth the park path's notched outline, using one shared boundary for grass
  and paving. Preserve pond, skate bowl, coast and the path outside the bounded
  park region. Net path-area change: +6.089 m² (about 0.33%).
- A wider map survey found 56 more genuine sand openings. Confirm each against
  the running scene's downward ray, then close it with the adjacent road,
  parcel, curb, grass or east-apron material. Recorded in
  `qa/terrain-gap-survey-2.json`; total additional area 6.964 m².

The patch is applied before the final walking-height sampler. Source geometry
counts and position CRCs are checked before atomic application; an unexpected
source must fail rather than partly apply the repair. The additional download
uses the existing stalled-download timeout/progress handling.

## Verification, 2026-09-18

`node --test` passed all 14 tests in these files:

```
qa/terrain-boundaries.test.mjs
qa/terrain-seams.test.mjs
qa/map-continuity-59.test.mjs
qa/skate-surface.test.mjs
qa/returning-entry.test.mjs
qa/studio-catalog.test.mjs
```

Boundary test with the original live-geometry fixture:

- 9,237 new upward-triangle centroid probes passed.
- 1,440 radial probes around the fountain: 568 original sand hits, zero after.
- All 56 additional surveyed gap probes passed.
- Corrupt-source rejection made no partial changes; reapplication is idempotent.
- Existing materials and out-of-scope geometries preserved; no new pond/bowl
  overlap. Original plaza walking-surface maximum heights preserved.

Actual Chrome renders, not just geometry assertions:

- Desktop 1280 × 900: all 56 ray probes, advancing frames, keyboard movement
  (5.72 m) and returning-profile reload passed, no page errors.
- Mobile emulation 390 × 844, DPR 2: same checks, actual touch-event joystick
  movement (5.53 m) and reload passed, no page errors.
- Captured 15 views on each layout, including near-ground oblique fountain,
  central curve/straight edges, park notches, curb corner, parcel edge, east
  grass, bridge bank, and overhead views. Inspected the relevant close views.
- Desktop artifacts: `/tmp/67park-boundaries-xcIsKh/`.
- Final mobile artifacts, including the last slab-base adjustment:
  `/tmp/67park-boundaries-vNUDBn/`.
- Original fixture: `/tmp/67park-boundaries-egd4Cs/geometry.json`.

Geometry cost: +7,613 triangles (1.46% of the 523,171-triangle terrain fixture);
zero added meshes/materials/textures/draw calls and no new per-frame work.
Committed patch is approximately 3.28 MB JSON / 0.63 MB gzip.

## Reproduce

Use Python 3 with NumPy and Shapely >= 2.1 to bake from a **pre-patch** scene:

```
python3 qa/bake-terrain-boundaries.py /path/to/pre-patch-geometry.json /tmp/terrain-boundaries-2.json
TERRAIN_FIXTURE=/path/to/pre-patch-geometry.json node qa/terrain-boundaries.test.mjs
EXPORT_GEOMETRY=0 node qa/terrain-boundaries.browser.cjs
EXPORT_GEOMETRY=0 MOBILE=1 node qa/terrain-boundaries.browser.cjs
```

`FEEL_URL` changes the browser-test base URL. The default is the isolated local
preview at `http://127.0.0.1:8497/67park-feel-lab/`.

Limits: mobile checks are Chrome emulation, not a physical iPhone/Safari or
Android result. This terrain repair does not certify every angle on every
device, 100-player performance, or the separate network-foundation audit.
