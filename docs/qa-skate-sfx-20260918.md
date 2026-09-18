# Skate jump/flip audio — skate-sfx-1

Feel Lab only; based on `123dc6c`. No terrain, camera, physics, avatar or other
repository changes. No audio assets or new audio context added.

Cause: the skateboard controller produced `ollie` and `kickflip` events, but
main discarded them. Landing only reached a visual ring. Existing party jump
sounds read the walking controller, which is disabled during skating.

Fix: publish accepted rider events through the shared feedback bus. Reuse the
party audio graph for a wooden tail pop, shoe-flick/rotation swish and a two-hit
wheel/truck landing. Existing landing FX coordinates and timing are preserved.
Mute/SFX volume, background suspension, gesture unlock, cooldowns and the
24-voice cap remain shared with all other sounds.

Verification:

- 16 Node tests passed: skate audio, skate surface, studio catalog and returning
  entry. Included one flip per airtime, held-key repeat, rejected/water input,
  mute/zero SFX/background, 1,000 duplicate events, 100 full sound cycles, and
  audio-node failure isolation. Sources release after ending.
- Chrome desktop 1280×900, keyboard: four actual ollie → flip → landing cycles
  produced exactly 4/4/4 sounds; measured audio-output peak 0.291, muted peak 0.
- Chrome mobile emulation 390×844, DPR2, touchscreen taps: same four cycles,
  exactly 4/4/4 sounds; output peak 0.339, muted peak 0.
- Both: zero remaining voices, no page errors, rendering continued. Visual
  bounce was disabled during testing to ensure it does not gate the audio.
- Signal measured with a Web Audio analyser on the actual party output, not
  merely inferred from event counters. No physical iPhone/Android test.

Reproduce with `node --test qa/skate-audio.test.mjs`,
`node qa/skate-audio.browser.cjs` and
`MOBILE=1 node qa/skate-audio.browser.cjs`.
Browser tests default to the isolated preview on port 8497; `FEEL_URL` overrides
the base URL. Browser-test instrumentation is not loaded by the game.
