# Release 40 — 2026-09-15

The protected Kimi/Codex originals and the earlier Kimi preview were not changed.
This release updates only the separate kimi-best and kimi-mobile repositories.

## Included
- One white Play & friends stylesheet, loaded through the shared component on the island and standalone Play page; six cards including Obstacle Dash.
- Obstacle Dash opens a local four-bot race, with Start race, mobile joystick/Sprint/Jump, repeat-start guard and back/forward cache preservation. It is not advertised as online matchmaking.
- Same Balloon/Rockets movement tuning in both copies. Existing mobile-only effect pool limits remain; texture resolution, model detail, shadows and render resolution were not reduced.
- Mobile copy receives the newer texture warm-up, remote-player spawn guard, speech-bubble housekeeping, exact-byte patch transport and lossless main-island/lighthouse models.
- Branded fleet and driving code preserved; car utility imports made repo-relative.

## Verified
- Chrome desktop panel and 390 x 844 panel: white surfaces, six games, no horizontal overflow.
- Local mobile-size island: successful entry with compressed models, branded eight-car fleet and two lobby courts present, no captured JavaScript errors at entry.
- Obstacle Dash: panel navigation, four bots, running timer/rank 5 of 5; mobile Jump visibly lifts the character.
- Automated: 1,000 repeated Start presses launch once; wardrobe guard, replay and BFCache retention.
- Automated: 1,000 owned jump cycles, 1,000 wheel+gas cycles, 1,000 jump+move cycles, blur cleanup, right mouse, Rockets Space jump / F attack.
- Automated vehicle tests: eight colours, seven floor meshes unchanged, 1,000 seat claim/release cycles each for car and bus.
- Independent byte comparison: all 346 main-island and 194 lighthouse buffer views equal originals after meshopt decoding; accessors, images, materials, meshes and scene metadata equal.
- All six rebuilt patch buffers equal originals and pass SHA-256 validation: 32,976,832 bytes become 10,173,596 transport bytes (22,803,236 fewer).

## Limits
- Release 40b: standalone Play connection banner uses the community connection rather than requiring an unused island socket; restored pages resume the status timer. Public Pages panel reached Connected (29 ms observed).
- Additional mobile-size Chrome check: eight local chat messages, visible head-anchored bubble, then 1,000 F key inputs; bot/render update counter advanced from 15,099 to 17,568, with no captured JS errors or horizontal overflow. This is not a physical-phone result.

Viewport emulation is not a physical iPhone/Safari performance test. No claim of universal crash freedom, full map visual audit, complete human race finish or every minigame end-to-end certification is made. Multiplayer requires the existing Mac mini and temporary tunnel; local QA origin was not authorized by its CORS policy, so online confirmation must use the public Pages origin.
