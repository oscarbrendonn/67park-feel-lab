# Chat phone-stall investigation and desktop actions

Scope: Kimi preview only. Original projects, Codex preview, geometry and live backend unchanged.

## Phone chat issue remains unresolved

The user reports a phone graphics stall after the fifth message. On the current car-32 release, Chrome at 390x844 sent twelve local messages with live head bubbles and advancing character FX counters. For messages 7–12, the viewport was also reduced to 390x380 during entry and restored after send. No JS errors were captured. These tests do not reproduce a physical iPhone keyboard/GPU failure, nor prove every rapid message was accepted remotely (server rate limiting remains active).

Added bounded, local-only graphics diagnostics. While a ready, visible park should be running, a renderer frame stall beyond five seconds produces a small G33 code; WebGL context loss is recorded directly. Intentional wardrobe/background pauses are excluded. The most recent record is kept on the device in `67park:render-report`; no chat text is collected or transmitted. No automatic reload, extra animation loop, exception suppression, or claim of a completed phone freeze repair.

Unit checks: 1000 healthy samples, render stall, never-mode pause, script error evidence, context loss/restoration, intentional pause and full listener/timer cleanup passed.

## Desktop Bag / Emote

Added two white, round buttons using existing game icons and handlers. Wardrobe/map visibility is subscribed rather than relying on unrelated HUD updates. Keyboard focus styling and existing press feedback retained; no new animation library.

Verified in Chrome desktop: both buttons visible, Emote opens, Wave selection closes panel, Bag opens inventory, close returns to gameplay. At 390x844 there is exactly one Emote and one Bag button (existing mobile controls). Browser errors empty during this test.

Previous car-authority regression and frame-policy lifecycle tests still pass. Real-phone re-test with the new diagnostic code is required before calling chat freezing fixed.
