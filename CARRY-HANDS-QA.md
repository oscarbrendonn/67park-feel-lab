# Carry hands — carry-hands-1

Scoped to the Party repositories; older best/island releases are unchanged.

## Change

- Two-bone arm poses support the passenger instead of leaving arms in idle.
- Pose is applied after all character mixers, in the scene pre-render hook.
- Preserve the original skeleton proportions and duplicate costume skeletons.
- 200 ms pickup and arm blend; release restores normal animated arms.
- Reduced-motion setting uses the functional hold pose without the lift tween.
- Same passenger height for local physics, observer avatars, and park bots.
- Existing Interact/keyboard controls and network carry packet are retained.
- Existing bot is released before selecting an online avatar nearby.
- No timers, animation queues, or new drawing objects. Pose errors cannot stop
  the scene render; a faulty avatar's pose overlay is disabled separately.

## Verification

Chrome browser tests against production assets with modified modules routed
locally: desktop 1280x900 and mobile emulation 390x844.

- Pickup reaches the hand targets; checked the actual world-space hand bones
  after rendering, not just the overlay's diagnostic state.
- Release blend reaches zero and restores the mixer pose.
- 1,000 direct carry-controller toggle calls: rendering continues (24/25
  frames during the following 400 ms), no page exceptions or Party shutdown.
- Gorilla, friendsie_1 and friendsie_100 rigs: 2, 8 and 12 arm chains found.
  Target gaps approximately 0, 0 and 0.093 world units respectively. The
  shortest rig retains its authored limb lengths rather than stretching.
- JavaScript syntax and git whitespace checks pass.

These are browser-emulation and local-state tests, not a physical iPhone or
two-human multiplayer acceptance pass. Subjective pickup feel should still
be checked on the user's device.
