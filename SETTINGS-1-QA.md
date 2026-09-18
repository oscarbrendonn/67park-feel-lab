# Browser settings — settings-1

Scope: Kimi Party desktop and companion mobile builds only. No map, avatar,
outfit, skeleton, vehicle physics, server, or original Codex repository changes.

## Implemented

- Separate mouse/touch free-look sensitivity: 25–200%; 100% retains existing
  rates. Shared cameraLookDelta consumers use the preference; aiming controls
  are unchanged. This is not a claim of identical Eggy Party camera tuning.
- Action-button size: 80–120%, stored separately for coarse/fine pointers.
- Party + legacy sound-effect volume and a separate park ambience/music bus.
  Original default levels retained. Existing speaker mute still controls both.
- Local chat-history/speech-bubble and overhead player-name visibility.
  Bot-label groups respect the preference at creation and when toggled.
- Keyboard/touch help, local text bug-report copy/download, confirmed reset.
  GitHub Issues is disabled in the repository; no fake submission endpoint.
- Validated browser-local persistence and migration from 67park-party.
- Focus containment, Escape/backdrop close, release of held controls, and
  gameplay input suppression while the dialog is open.
- Import-map aliases invalidate changed shared modules without loading duplicate
  React/audio/runtime copies. Main and party entry modules use settings-1.

No new graphics, screen-shake or speed-effect switches; no new rendering loop.
Existing party toggles remain available. No voice-chat setting without a service.

## Verification before release

Chrome desktop 1280x800 and mobile emulation 390x844, then 320x568 and 844x390:

- Entered the park through its normal entry button.
- Zero page errors; party runtime not disabled.
- Keyboard range input: 100% -> 105%.
- Mouse 200%: 100 px yields 1.04 rad yaw / .7 rad pitch.
- Touch 50% at 390 px: 100 px yields .537024 rad yaw / .24 rad pitch.
- Effects at 0% and ambience at 25%: independent gain buses settle near 0 and
  .2125, respectively; party jump sound does not allocate a muted voice.
- Settings survive reload; reset restores defaults and chat visibility.
- Escape closes settings; a subsequent movement key moves the actual player.
- Bug report downloads and includes the entered QA description.
- Dialog remains inside all tested viewport bounds and scrolls internally.
- Node assertions pass for invalid/array storage, nonfinite values, clamping,
  unknown keys, sensitivity and reset. Syntax and git diff checks pass.

Test script (local release workspace): ../verify-settings.cjs.
Screenshots: /tmp/67park-settings-desktop.png and /tmp/67park-settings-mobile.png.

Limits: no physical iPhone/Safari certification, no full mini-game replay, and
no claim of universally crash-free gameplay. Reports require the player to send
the saved/copied file to the team; they are not uploaded automatically.

Rollback: revert the settings release commit in each repository.
