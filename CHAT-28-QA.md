# Chat input / camera isolation — chat-28

Scope: Kimi preview only. Original checkouts and the Codex preview are unchanged.

## Reproduction

On the published chat-27 build, opening chat and pressing `m` changed the game
to bird's-eye view while the letter appeared in the input. Main-map M/V/E
shortcut handlers did not check editable targets. The movement key-up handler
also skipped releases inside an input, allowing a previously held key to stick.

## Changes

- Chat key-down/up events stop at the composer, including submit/cancel.
- M/V/E shortcuts reject editable targets; movement input does likewise.
- Focus clears held movement/jump/sit keys; blur clears them too.
- Camera canvas gestures and wheel zoom reject focused text entry.
- Focus uses preventScroll; existing 16px input text is retained.
- IME composition does not submit and repeated Enter does not resend.
- Shared module cache URLs updated consistently to avoid duplicate input state.

No map geometry, camera distance/sensitivity, physics, or online protocol changes.

## Verified

- Actual old-build reproduction: `m` opened bird's-eye mode from chat.
- Patched desktop: M/V/E/F/W/A/S/D/N/Space stayed in text entry.
- Camera before/after typing, canvas scroll, submit: position exactly unchanged
  [165.70512224003994,12.040952971842136,115.69089867302202], FOV 55.
- Message sent and local speech bubble appeared; composer closed.
- 390x844 layout: typing/cancel preserved camera; input computed font 16px.
- 320x440 constrained layout: input visible (x27..253, y264.6..300.6), 16px font.
- After closing chat, 100px camera drag changed yaw 2.67035 to 2.35035.
- Automated: 7000 text-key events, 1000 focused camera events; no leaked movement,
  correct held-key release/resume, event listener cleanup.
- Existing local speech fault tests and 16-player remote bubble tests passed.

Real iOS/Android virtual-keyboard behavior and device performance were not
measured here. Browser viewport tests are not a real-phone certification.
