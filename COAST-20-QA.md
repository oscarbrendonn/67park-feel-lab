# Kimi southwest coastal sidewalk — coast-20a

Scope: lower-left coast of the right island, below the two cottages in the supplied screenshots. Codex and original repositories are unchanged.

The existing pavement mesh receives a continuous shoreline-following connection (world X -15.088…30, Z 141.1…162.146). Its outer edge eases down to the measured sand surface. A tapered apron blends into the existing straight section. Twenty-six now-buried terminal cap/bevel faces are removed, avoiding the old dark seam. Grass, roads, houses, materials and networking are unchanged.

Validation:

- Reproduced the missing section in the actual local map before editing.
- Overhead and normal low-angle visual confirmation: connected curve, no isolated terminal slab or dark seam at the former join.
- 390×780 responsive Chrome viewport: same continuous coastal geometry. This is not a physical iPhone/Safari test.
- Offline geometry test: 326 downward collision samples match the new surface; original position/normal arrays retained, original indices retained except the 26 audited buried faces, unrelated grass mesh unchanged, repeated installation safe.
- Actual game floor sampler checked at (-12,144), (-7,149), (0,157), (5,160), (12,158), (17.1,158), (20,159.5): all return pavement and non-water, including the sand-facing ramp.
- No grass, road or flat pavement crown overlap beyond numeric rounding; the old recessed terminal bevel is filled at crown height.
- No new material, texture, light or visual draw call. 5,580 vertices and 9,776 triangles added to the existing pavement; 26 buried faces removed.
- Local entry and online connection succeeded, no captured console errors.

This focused check is not an all-map, all-browser, multiplayer endurance or universal no-crash claim.

Rollback: revert the coast-20a commit. Previous preview baseline: f11b756. The original Mac mini services and isolated online test service are not changed by this release.
