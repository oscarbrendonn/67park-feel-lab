# Mobile chat viewport and interrupted controls — mobile-29

Scope: Kimi preview. No original-map or Codex-preview edits. No backend restart.

## Reproduced control failure

The old Claude touch controller retained its pointer/input reference across chat
focus. Although the keyboard hook cleared movement, the next touch-controller
update reapplied the old direction. A focused test against HEAD reproduced x=1
after focusing an input. The patched controller returns x=0 and releases capture.

Changes:
- Touch ownership is cancelled by editable focus, viewport/orientation changes,
  pointer cancellation/lost capture, last-touch end, page hide and explicit reset.
- The fallback joystick/car controls have matching lifecycle resets.
- Gamepad input is suppressed during text entry. In-progress camera drag ends.
- Opening/closing chat clears held movement and sprint state without changing
  the camera mode or camera distance.

## Mobile focus magnification mitigation

- 18px chat input styling is applied in the initial document stylesheet, in the
  input markup, and before focus, not only in a late-loaded stylesheet.
- On iOS only, automatic focus magnification is capped at the pre-focus scale.
  Original viewport content is restored 300ms after blur; user-scalable=no is
  never added. Existing user zoom is preserved. This timer does not delay chat.
- Composer placement follows the visual viewport during keyboard resize/panning;
  closing restores its normal layout and, when unzoomed, pre-keyboard page scroll.
- Chat controls use touch-action:manipulation to avoid accidental double-tap zoom.

Reference: [VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)
distinguishes keyboard-induced visible-area changes from layout viewport size.
[WebKit focus-scale behavior](https://bugs.webkit.org/show_bug.cgi?id=157771)
documents automatic text-field focus magnification and viewport scale constraints.

## Verification

- Old joystick-focus failure reproduced, then corrected with identical inputs.
- 1000 interruption cycles, second-finger isolation and listener disposal passed.
- 50 mocked iOS keyboard open/resize/close cycles passed; viewport metadata
  restored and no lingering listeners. Existing scale=2 preserved.
- Actual Chrome at 390x844 and 390x360: input 18px, composer remains visible,
  M/V/E/F/W/A/S/D/N/Space stay in text, send succeeds and local bubble appears.
- Before/after camera position remained
  [165.70512224004,12.04095297184214,115.69089867302199], FOV 55.
- After send and returning to tall viewport, no keyboard-layout attribute remains.
- Existing local/remote chat fault and bounded-allocation tests passed.
- Browser console: no JavaScript errors observed.

**Not verified:** real iPhone/iPad Safari or Android keyboard auto-zoom. Viewport
emulation and mocked lifecycle tests do not certify real-device behavior.
