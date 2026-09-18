# 67Park Feel Lab

Isolated, experimental camera and movement fork for desktop and mobile browsers.

Play: https://oscarbrendonn.github.io/67park-feel-lab/?v=feel-1

Based on `oscarbrendonn/67park-kimi-party` commit
`991aac2b7f5b09fa5a0b1fde479c820aa17495f1`. Neither original desktop nor mobile
repository is changed by this experiment. Existing models, textures and map
geometry are preserved. Character/profile selection and player settings use
separate browser-storage keys in this fork.

## Feel profile

- Third-person starting pitch 20.6 degrees, 6.8-unit boom, 55-degree vertical FOV;
  portrait displays get up to one extra unit of distance. These are our trial
  values, not measured or claimed Eggy Party settings.
- Main camera follows translation directly. Five obstruction probes retract
  safely and ease back out with a brief hold against corner oscillation. No
  automatic sprint zoom or camera shake in this profile.
- Main horizontal acceleration and direction changes are bounded; playback
  cadence follows actual world travel instead of requested input speed.
- Skybound shares the character profile and pointer sensitivity. Lane Rush,
  Balloon and Rockets use the same camera framing; aiming sports remain separate.
- Rockets has camera-relative movement and touch/right-mouse orbit. Quick
  keyboard jumps are latched until the next simulation step.
- Existing two-arm carry IK is retained and tested. Lane Rush adds bounded
  contact sounds on successful grab, throw, hit, jump and landing events.

## Verification

See [FEEL-LAB-QA.md](FEEL-LAB-QA.md). Other QA documents were inherited from the
source repository and are not claims of new verification for this fork.

This is a playtest build, not a guarantee for all phones or 100-player lobbies.
The live preview network configuration still uses the existing test backend;
this fork does not redeploy or change that backend or its physics.
