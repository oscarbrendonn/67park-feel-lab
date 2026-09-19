# Roof support regression

The previous world query uses conservative full-height building colliders.
Those remain unchanged for cars, ground-level wall contacts and housing.
Characters at roof height instead use the existing model's upward faces.
The previous and proposed foot heights are considered so a falling frame can
land, while an ascending character must clear the eave instead of climbing
through a wall. Walking, skate support and landing effects use this query.

`app/house-roof-support.js` shares seven local asset indices across 50
instanced houses. The other 19 courtyard buildings use only their baked
roof band. No models, textures, render meshes, lights or draw calls are added.
The retained collision arrays total 15,475,032 bytes, not zero memory cost.
Spatial bins bound lookups; normal streets do not perform a second terrain
query. Disposal releases the indices. An initialization failure retains the
original safe collision and records a diagnostic; release QA rejects that
fallback rather than publishing it as a successful roof implementation.

Required checks in `npm test` and `npm run test:browser`:

- Transformed/sloped surfaces, solid walls below, leaving eaves, current home
  ground hooks, resource disposal, and optional-feature failure isolation.
- 138 raycast comparisons against all 69 rendered buildings.
- Actual desktop Space and mobile Jump controls: double-jump from the ground
  onto NE04, walk uphill, switch to skating, descend, and retry without jumping
  to prove the wall is still closed. Jump strength is unchanged.
- The existing path/curb and house-corner regressions, coastal divider,
  grass seams, chat spam, reconnect, 100 home transitions, repeated actions
  and outfit changes remain mandatory.

Local mobile coverage is Chrome touch emulation at 390 × 844, including a
120-second soak. It does not certify physical iOS/Android devices or a full
100-player lobby. CI additionally runs the existing 900-second mobile soak
with its software-rendering profile before Pages deployment.

Do not rebuild `island/runtime.bundle.js` wholesale from `runtime.js`:
the bundle contains other integrated features. Keep both small installation
hooks and cache keys in sync, and leave unrelated cat-preview work untouched.
