# Open-terrain driving — 2026-09-18

Scope: Kimi Party desktop and mobile, both passenger cars and the school bus.
The old Codex island is untouched. No vehicle model, texture, speed, steering,
button, camera, or authored terrain geometry was changed.

## Change

- Replace the road/outer-sidewalk allowlist with 58 authored dry-floor meshes:
  road, curbs, lawns, parcels, paths and dry shore terrain.
- Preserve the complete car/bus footprint, 120 Hz swept motion, 0.55 m maximum
  footprint height difference, vehicle-to-vehicle checks and solid obstacles.
- Use the same finished-map clearance on the browser and authority. The old
  authority loaded raw terrain and did not know the current building layout.
- Clearance is a conservative 25 cm grid, stored as 135,957 bytes of generated
  JS (461,081 bytes of runtime bits). It adds no rendered geometry or textures.
  It includes the finished map's ground, water, building/prop and trunk queries.
- Preserve `ignoreCar` through the social-toys ground wrapper; otherwise it
  can treat the querying car itself as an obstacle.
- Bust the complete changed module graph, not only the entry URL.

## Verified before publication

- Chrome 1280×850 desktop and 390×844 touch/mobile emulation: identical results.
- 36 actual-geometry driving trajectories per viewport across the two cars
  and bus; 28 climb curbs, 21 reach lawn, 32 stop at a boundary/obstacle and
  successfully reverse away. No non-finite pose or collision tunnelling.
- Scan: 7,227 safe poses including 1,308 lawn poses; 1,047 water cases and
  1,962 building cases rejected. No JavaScript errors; rendering kept advancing.
- Server/browser parity: 867 full-footprint poses, zero permission differences.
- Unit fixtures: car and bus, all 360 headings at a curb; solid building and
  water checks; 2,000 repeat checks; invalid-number rejection.
- Isolated online server: five independent guest sessions, four distinct seats,
  fifth claim rejected, passengers cannot drive, driver climbs curb with riders
  (~10.4 m drive), all four exit, chat reaches five, guest session resumes,
  unauthorized token/origin rejected. No existing players used for these tests.
- Real UI inputs against the isolated authority: desktop E then held W drove
  11.18 m; mobile Interact then a trusted touch hold on Accelerate drove 8.80 m.
  Both climbed from y=9.22755 to y=9.39803. Screenshots inspected; render frames
  continued; no page errors. Controls and vehicle appearance remain unchanged.

Mobile emulation is not a physical iPhone/Safari test.

## Maintenance

The clearance is tied to this finished map. If building placement, ponds,
collision props or authored floors change, regenerate it from the completed
world and update desktop/mobile/authority together. Do not regenerate it from
the old raw GLB. The capture excludes cars (`world.ground(x,z,true)`) so parked
vehicles never become permanent blocked cells. Four neighboring samples cover
each query conservatively; expected edge padding is at most a grid diagonal.

Working verification tools: `/tmp/67park-party-audio-llRIah/`
(`capture-drive-mask.cjs`, `check-open-driving.cjs`, `check-open-unit.mjs`,
`check-open-server.mjs`, `check-drive-input.mjs`). Production authority snapshot:
`/Users/oscarbrendon/Documents/Codex/2026-09-15-kimi-release/vehicle-open/`.

Release entry query: `?v=drive-anywhere-1`.
