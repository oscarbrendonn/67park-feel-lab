# Coast 24 — match the existing narrow strip

Scope: Kimi preview only. Replaces the coast20 patch rather than layering over it. The original Kimi/Codex repositories and paused Codex preview are unchanged.

## Reference and change

- User photo 2 is the reference. Existing grass-to-outer-pavement cross-section at world x=40 measures 3.006 m; edge bevel is approximately 0.06 m.
- Previous southwest patch used a 4.0095 m footprint and a 1 m sloping shoulder. Replacement uses a 3 m footprint and the existing-sized 0.06 m bevel.
- Continue the same narrow strip through the missing/grass-covered southern stretch shown in photo 3. Grass, houses, roads, sand and existing flat pavement vertices are not modified.
- Reuse the original pavement mesh/material and final ground sampler. Remove 104 fully buried old bevel/end-cap triangles. Add 1,833 triangles / 3,350 vertices, with no extra draw calls (previous patch: 9,776 triangles).
- Cache keys on the changed module import chain use `coast-24`.

## Verification

- PASS: original geometry/normal prefix retained; only listed buried faces removed; repeated application is idempotent; mismatched source safely skipped.
- PASS: no projected overlap with visible grass, road or retained flat pavement (numerical area tolerance 1e-7).
- PASS: 1,497 nondegenerate top/bevel triangle centroids raycast to the rendered pavement within 1 mm. Sub-0.1 mm sliver triangles are excluded from this collision precision test.
- PASS: latest local build entered the park, southwest corner and long southern stretch inspected from bird's-eye view. Narrow width continues into the existing reference strip, without the old wide shoulder or missing section.
- PASS: low-angle inspection at (17,158) and (135,165); visible height and ground sampler both 9.380085945, terrain `7_KALDIRIM_TABANI`, not water.
- Existing Three.js deprecation warnings remain; no new runtime error observed during this focused inspection.
- Real-phone performance is not claimed by these desktop checks. Gameplay and unrelated map areas were not re-audited in this geometry-only change.

Temporary geometry export hooks were removed before release.
