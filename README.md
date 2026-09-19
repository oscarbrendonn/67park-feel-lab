# 67Park Feel Lab

Isolated, experimental camera and movement fork for desktop and mobile browsers.

Play: https://oscarbrendonn.github.io/67park-feel-lab/

Based on `oscarbrendonn/67park-kimi-party` commit
`991aac2b7f5b09fa5a0b1fde479c820aa17495f1`. Neither original desktop nor mobile
repository is changed by this experiment. Existing models, textures and map
geometry are preserved. Character/profile selection and player settings use
separate browser-storage keys in this fork.

## Feel profile

- Third-person starting pitch 20.6 degrees, 6.8-unit boom, 55-degree vertical FOV;
  portrait displays get up to one extra unit of distance. These are our trial
  values, not measured or claimed Eggy Party settings.
- Horizontal following and manual look remain direct; vertical jump/fall
  following is gently damped with bounded lag. Five obstruction probes retract
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

See [RECOVERY-GRAPHICS-QA.md](RECOVERY-GRAPHICS-QA.md) for connection recovery,
working graphics levels, camera changes, acceptance results and remaining real
device checks. [FEEL-LAB-QA.md](FEEL-LAB-QA.md) describes the earlier feel profile;
older QA documents are historical evidence, not certification of this release.

This is a playtest build, not a guarantee for all phones or 100-player lobbies.
Lobby capacity remains 16. Low/Medium/High graphics change actual resolution and
shadow rendering; Automatic retains the existing adaptive profile.

The dedicated test backend must be upgraded before publishing a client that
requires protocol negotiation. Its data directory and tunnel stay unchanged.
It remains a test service, not a permanent production hosting arrangement.
