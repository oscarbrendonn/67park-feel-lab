# CAR-32: visible vehicle must match its server position

Scope: Kimi preview only. Original projects and Codex preview untouched; existing online backend retained without restart.

## Reproduction

On frame-31, main-mint remained rendered near its spawn road (player beside it at x185.44, z124.76; Enter car displayed), while the live server held the unoccupied, stopped car at x180.9282, z104.1901. E did not mount. Local collision validation in Qe rejected that server position and returned the old client pose indefinitely. This produced a ghost boarding target outside the server's entry radius.

## Change

`vehicle-authority.js` reconciles finite authoritative snapshots even when client collision geometry disagrees. Collision checks still constrain local prediction/interpolation; blocked visual sweeps fall back to the authoritative pose. Invalid snapshots cannot introduce NaN/Infinity. Server boarding distance, height, speed, seat and room checks remain unchanged.

## Verification

- Pure regression: geometry disagreement, invalid values, blocked sweep, smooth interpolation and 1,000 authoritative updates passed.
- Chrome desktop, local release against the existing online backend: car visibly moved to the actual park-path position; map travel to its side, E entry, occupied seat/sitting pose and E exit passed.
- Chrome 390 x 844 responsive viewport: Interact mounted; driving controls, 1/4 seats and Exit displayed; Exit dismounted and walking controls returned. This is not a physical iPhone/Safari touch test.
- Browser error logs empty in that session. Syntax and whitespace checks passed.
- No complete driving course or broad map QA claim is made by this focused boarding repair.

Regression helper: `/Users/oscarbrendon/Documents/Codex/2026-09-14/qa32-test.mjs`.
