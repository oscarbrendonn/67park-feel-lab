# Kimi mini-game presentation 25

## Scope and provenance

Only the isolated Kimi preview is changed. No Codex checkout, original map,
backend, mini-game physics, collision, scoring, input mapping, or vehicle pose
was changed.

- Basket/penalty are regenerated from this checkout's actual court/stadium
  constructors and geometry adapters. The binary geometry buffers are identical
  to the previous published GLBs: the old manifest, not the meshes, was stale.
  The new manifest records the current constructors and normalization.
- The same park surface-finish shader now also covers the sports models.
  Sports use the island's direct renderer instead of an additional desktop GTAO
  darkening pass; basketball's sun direction follows its 90-degree model rotation.
- All five real games attach the park's power/glow cosmetics: same shapes,
  colours, orbit radii and timing. Up to two extra draws per equipped character;
  no particle accumulation, extra frame loop, light, texture, or model download.
- Balloon and Rockets use the existing shared Claude motion clips with a
  bounded adapter, preserving each game's physics and special actions.
  Sports already used those clips. Seated race drivers retain the driving pose.
- Local bot practice no longer displays a misleading disconnected-online notice.
- Sports headers now reserve the preview notice height on mobile and desktop.
  The 390px view had clipped the heading behind that strip before this fix.

## Verified

| Check | Result |
| --- | --- |
| Cosmetics: all 20 none/power/glow combinations, 200,000 updates | Pass: constant object counts, finite matrices, <=2 draws/avatar |
| Reduced-motion and double-disposal | Pass: static transforms, each owned resource released once |
| Native/retargeted shared motion, 20,000 updates with repeated jump/land | Pass: ready, finite rig transforms, idempotent disposal |
| Four-car numerical race, three laps, restart/recover | Pass: all finish, maximum centre-line offset 2.835 m |
| Chrome desktop entry: basket, penalty, race, balloon, rockets | Pass: reached playable state, no captured JS errors |
| Buddy #1000 + Heart Power + Pink Glow in each actual game | Pass: visually present (race observed through front windshield) |
| Basket/penalty shot button | Pass: shot enters flight phase |
| Balloon dash | Pass: cooldown begins and match timer continues |
| Rockets jump | Pass: visible airborne character, match timer continues |
| 390x844 race intro/start/recover | Pass: controls visible; recover shows Back on track |
| Kimi right-island southwest coast, long south edge, southeast road end, park | Inspected overhead: no missing-pavement sand gap observed in these sampled areas |
| Southwest coast sample x17,z158 | Ground 9.380086, 7_KALDIRIM_TABANI, not water |

## Limits / not a perfect-game certification

- Browser viewport tests are not real-iPhone performance or multi-touch tests.
- No multi-device multiplayer endurance test was performed in this pass.
- The full emote chooser/hand-heart/6-7 emote presentation and running/landing
  particle suite are not newly integrated into the standalone mini-games here.
  This release covers equipment power/glow and locomotion compatibility.
- Map inspection is sampled, not exhaustive; no geometry was changed in this
  pass and a still screenshot cannot establish absence of all flickering.
- Short input checks do not certify continuous steering, every character, or
  unlimited simultaneous input. The numerical race test is not real-device QA.
