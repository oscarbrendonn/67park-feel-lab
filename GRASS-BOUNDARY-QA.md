# Shared grass boundary — grass-boundary-1

Scope: current `67park-feel-lab` only. Protected Kimi desktop/mobile repositories,
the unpublished cat preview, colors, lighting, textures, controls and buildings
are not part of this release.

## Finding and repair

The reported tooth is a real contour change near the east launch hatch, not
texture aliasing: (235.23784, 129.17966). The contour has a second 3 cm step at
(221.69999, 130.60560). A live-scene survey covered 23 grass/turf meshes with 105
polygon components across the map. Both candidate steps belong to `3_CIMEN`.

Remove the two short zigzag connectors and share the resulting edge with
`7_KALDIRIM_TABANI`. New grass area is 0.294456 m²; 0.720929 m² becomes adjoining
pavement, not exposed sand. The repair uses the original materials and heights.
Apply it after earlier terrain repairs, before final collision/shadow sampling.
Validate source vertex/index counts and position CRCs before atomic mutation.

A strict 2 cm sampling grid found a sub-20 µm Float32 T-junction in the first
candidate's re-triangulated paving. The final patch retains 33 original upward
triangles as matching-material support 2 mm below the visible surface, sealing
that numerical slit without a coplanar cover or new rendering object.

Cost: 35,497 bytes JSON (7,335 bytes gzip), +275 triangles, no new mesh, material,
texture, draw call or per-frame task. The measured patch domain has zero
uncovered area and zero grass/pavement footprint overlap.

## Checks

- Six repair tests pass with the real pre-repair scene fixture, including
  source mismatch, non-finite input, atomicity, idempotence and material identity.
- 78,947 exact walking-height probes: no new opening; largest local height
  change 25.58 mm where new grass replaces the old pavement bevel.
- Repeat whole-map grass contour survey: 23 meshes / 105 components, zero
  candidates matching the reported short-staircase shape.
- Compare 64 exported terrain meshes: only the two intended meshes differ.
- Actual Chrome desktop and 390 × 844 mobile emulation: 19,236 ground probes,
  close / reverse / ground-level renders, keyboard or touch movement, return
  reload, advancing renderer and zero page errors.
- Final local foundation regression passed on desktop and mobile emulation,
  including 100 house transitions, command spam, asset retry and reconnect;
  the peer stayed connected. The separate 2-minute mobile soak reported zero
  page errors. Unit suite: 73 passed, one fixture-dependent check skipped;
  that fixture check also passed in the six-test real-geometry run above.
- Release gate now includes the grass-height probes and the exact Float32
  seam location in both desktop and mobile foundation browser runs.
- The existing mandatory gate still tests failed download/retry, corners,
  repeated chat/punch/interact commands, 100 house transitions, reconnect,
  wardrobe return and a 15-minute mobile-emulation soak before Pages deploy.

Local evidence: `.qa-results/grass-before`, `grass-before-views`, `grass-after`,
`grass-mobile`, `grass-survey` and `grass-after-survey`.

The automated contour scan detects the reported small staircase pattern. It
does not certify every possible design imperfection, every camera angle, every
phone, or large multiplayer performance. Mobile evidence is Chrome emulation,
not a physical iPhone/Safari or Android test.

## Reproduce

```sh
# Export a baseline scene. The route disables only this repair in the test tab.
BASELINE=1 QA_OUTPUT=.qa-results/grass-baseline node qa/grass-boundary.browser.cjs
python3 qa/survey-grass-boundaries.py .qa-results/grass-baseline/geometry.json .qa-results/grass-survey
python3 qa/bake-grass-boundary.py .qa-results/grass-baseline/geometry.json .qa-results/grass-survey /tmp/grass-boundary-candidate.json
GRASS_FIXTURE=.qa-results/grass-baseline/geometry.json node --test qa/grass-boundary.test.mjs
EXPORT_GEOMETRY=0 node qa/grass-boundary.browser.cjs
MOBILE=1 EXPORT_GEOMETRY=0 node qa/grass-boundary.browser.cjs
```

The baker needs NumPy and Shapely 2.1+. Browser tests use the isolated local
preview by default; set `FEEL_URL` for another preview. The refresh script is a
dry run unless explicitly passed `--write`; it changes only the terrain runtime
and its import keys, leaving shared movement singleton URLs unchanged.
