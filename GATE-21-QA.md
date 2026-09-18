# Kimi road-end game gateway — gate-21

Scope: only the isolated Kimi preview; originals and Codex are untouched.

- Moved existing Balloon Battle gateway from (174,110) to (248.8,121.63), matching the supplied east road-end photograph.
- Arch, front sign and rift face west along the approach road (yaw -PI/2).
- Interaction distance and existing game flow unchanged. Return/QA approach point is (245.8,121.63), three metres west on the road.
- Versioned all import ancestors of the shared anchor to prevent mixed cached state.
- No terrain, model asset, network transport or mini-game rules changed.

## Focused verification — 2026-09-15

- PASS: overhead road/park/triangular house parcel visually matches target photograph.
- PASS: actual runtime ground samples at entrance and return point both hit `5_YOL`, y=9.227547645568848, water=false.
- PASS: actual `return=balloon` entry places character on the road in front of the new arch.
- PASS: road-facing arch, legible front sign and rift visually aligned.
- PASS: pressing E opens connected online panel with Balloon Battle selected. Closing it returns to island view.
- PASS: captured browser console errors empty during focused verification.
- PASS: JavaScript syntax checks; diff restricted to anchor, arch/rift heading, return/approach and cache revisions.
- NOT TESTED: real iPhone/Safari, full match, full-map regression. No universal no-crash claim.
