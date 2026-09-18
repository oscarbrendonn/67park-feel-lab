# Gameplay page-zoom guard — viewport-30

Scope: Kimi preview only. Original maps, camera tuning, models and backend unchanged.

The supplied iPhone screenshot shows cropped HUD/buttons as well as an enlarged
character, consistent with whole-page magnification rather than camera zoom.
The precise native trigger was not reproduced on physical iPhone hardware.

## Change

- Load a small standalone gesture guard and critical CSS from the HTML entry.
- Game surfaces/buttons use `touch-action:none`, not `manipulation` (which allows
  native pinch zoom). Chat text entry and dialogs retain their own handling.
- Cancel native multi-touch defaults when a touch belongs to gameplay, including
  mixed joystick/action-button touches and Safari gesture events.
- Do not stop propagation or change camera distance, page scale or viewport meta.
  Custom map pointer handlers keep receiving their events.
- No frame loop, timers, polling, or persistent global accessibility zoom lock.

## Verification

- PASS: 1,000 mocked gesture sequences covering mixed targets, cancellation,
  Safari fallback, text entry/wardrobe/menu exclusion and listener cleanup.
- PASS: previous 1,000 joystick interruption and 50 keyboard-cycle tests.
- PASS: Chrome 390x844 park entry; computed touch-action none on canvas, joystick,
  action buttons, toolbar, Chat button and Punch.
- PASS: chat send produced a speech bubble; camera position, yaw, pitch, distance
  and FOV unchanged before/after send. No console errors.
- PASS: overhead-map zoom button changed 100% to 130%.
- NOT VERIFIED: physical iPhone Safari pinch/double-tap, simultaneous real fingers,
  or recovery of a tab that was already zoomed before loading this version.

Reference: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action
