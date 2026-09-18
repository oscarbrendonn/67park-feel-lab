# Isolated action animation preview

CURRENT STATUS — f-input-7 restores Punch with capture-phase F ownership. The legacy movement listener also binds F to sitQueued; the new handler consumes F (including repeats) before that listener, while preserving text entry and modified shortcuts. The button uses aria-disabled during cooldown rather than changing native disabled between pointerdown and pointerup. No physics or multiplayer impact was added.

Current verification: keyboard capture/repeat/text-entry and pointer/cooldown unit tests pass in both variants. Local desktop browser: Codex Buddy #1 and Kimi Gorilla accepted repeated F and the Punch button; frame counters continued, subsequent run reached 6.8 m/s, and no console errors were captured. Codex also jumped after punching. This resolves a verified input conflict, but the originally reported full freeze was not reproduced and real phone verification remains pending.

Original releases and map geometry are unchanged. Familiar controls from the previous preview remain unchanged.

- F / Punch: locally authored upper-body additive punch on the existing rig. Running continues underneath; jumping cancels it. No movement lock.
- Fluid-motion-2: visual facing follows the shortest turn arc independently of immediate physics heading. Transition time warping removed. Moving landings retain the locomotion clip.
- Latest rollback checkpoint: `checkpoint-before-fluid-motion-20260914`.
- Landing uses a short knee/torso recovery; existing compact airborne pose remains.
- Reduced-motion disables additional squash/stretch. No new camera flash, knockback, physics or model download.
- This is animation feedback, not multiplayer combat. No player damage or networked pushing is implemented. The multiplayer server is still not connected.
- Rollback checkpoint: `checkpoint-before-hit-fall-20260914`. Revert the action-animation commit to remove this experiment without rewriting history.

Verification: both variants pass 30/60/120 FPS control regression tests and authored-clip finite-value, cooldown, recovery and interruption checks. Local browser: Codex Gorilla and Kimi Buddy #1 entered successfully and selected `previewPunch` with ready animation rigs. Codex jump returned to grounded idle. Not all 45 characters, real phones or multiplayer sessions were tested.
