# Lobby stability QA — 18 September 2026

## Release decision
Client stability fixes can ship to both existing Party repositories.
**Live lobby capacity remains 16.** Capacity 100 was exercised only on an isolated localhost backend.
A bounded test without a crash is not a guarantee for all phones or all future sessions.

## Changes
- Preserve remote animation/interpolation object identity on roster refresh; send hello only on the first welcome per connection.
- Coalesce packet-driven UI notifications into 16 ms batches; state/chat packets are still applied immediately.
- Keep near-equal remote selections stable, within the server's nearest-16 priority set.
- Existing visible character budget remains 8 mobile / 12 desktop. No texture, model or map fidelity reduction.
- Panel displays the server's actual capacity instead of hardcoded /16.
- Server guard coalesces full-roster bursts, bounds replaceable-motion buffering, prioritizes the nearest 16 motion streams and sends distant motion at most once a second.
- Valid authenticated reconnects use a per-session quota (12/minute), retaining original origin/token/admission validation for other requests.
- Guard defaults to capacity 16; 100 is an explicit test-only option pending device/network acceptance.

## Evidence
### Network (same lobby, 100 players, two authenticated sockets each)
A matched 20-second baseline emitted 329.79 MB and had 110 ms local ping p95; five of 25 immediate same-IP reconnects received 429.
The guarded 20-second run emitted 107.69 MB (67% less), ping p95 63 ms, and all 25 reconnects succeeded.

Five-minute guarded soak:
- 100 members in exactly one lobby; 100 online throughout sampled end states.
- 8,605,248 outgoing messages; 7,182,048 accepted/relayed movement messages; 990,000 outgoing chat messages.
- Zero recorded server faults, unexpected socket closures or protocol errors.
- Ping p50 / p95 / p99: 9 / 17 / 22 ms on localhost (not internet latency).
- Server CPU mean 21.2% of one logical core; final RSS 167.9 MiB.
- Aggregate outbound 1.666 GB / 300 s, about 44.4 Mbit/s before TLS/tunnel overhead: upstream bandwidth is still an acceptance requirement.
- 25 reconnects succeeded; all 100 remained online.
- Five server-side mini-game rooms (balloon, basket, penalty, race, rockets) started and produced advancing snapshots, then returned to lobby.
- This is not a browser rendering/control pass for every mini-game.
- A separate repeat with monotonic input sequences also asserted actual movement in balloon/race/rockets and shot initiation in basket/penalty (load100-game-inputs.json).

### Actual Chrome tab, mobile emulation
99 simulated peers + one real 3D browser in the same lobby; four avatar types transmitted, nearest rendered subset predominantly gorillas in this arrangement.
Chrome on a 16 GB macOS host, 390x844, DPR 2, CPU throttling 4x (not an Android GPU):
- Before UI batching/selection stabilization: 15.2 FPS mean; frame p95 360.9 ms, p99 466.8 ms.
- After: 41.2 FPS mean; p95 33.9 ms, p99 42.1 ms; cold selection/model work still had a 958.8 ms maximum interval.
- Warm sample: 44.3 FPS mean, p95 29.4 ms, p99 41.8 ms, maximum 146.4 ms. One 112 ms long task remains.
- No page errors observed. Touch Jump raised the actor 2.32 m; joystick moved the actor after chat.
- Own chat was acknowledged by the test server, viewport stayed at scale 1.
- Closing both browser network channels recovered the same player ID with 99 remotes; renderer advanced another 937 frames.
- Initial page arrival required bringing the tab to the foreground; background/prewarm behavior is not a physical-device pass.

## Automated coverage and known limits
Six new regression tests cover roster identity, selection stability/budget, 1000-packet notification batching, motion throttling/backpressure, refresh coalescing and reconnect validation.
Existing returning-entry, balloon lift, skate slope, terrain seam, car/fleet, panel, Skybound source/respawn and control stress tests were also exercised.
The existing park-carry-50 test fails its immediate-pose expectation (expected y=1.05,z=.72; actual starts a blended pose near y=0,z=1). Both its test and park-carry.js are byte-identical to the previously published HEAD; it was not silently changed to force a pass.
Sparse-checkout missing dependency failures were resolved before re-running the related tests.

## Required before enabling 100 live
- Physical lower/mid-range Android Chrome and iPhone Safari: cold entry, 10+ minute crowd play, keyboard/chat, thermal/memory behavior.
- Representative GPU/memory limits, mobile network loss and actual WAN uplink/tunnel capacity.
- Longer concurrent browser soak, mixed expensive avatars/cosmetics and broader mini-game rendering checks.
- Explicit acceptance of nearby-only full-detail rendering; 100 connected is not 100 rendered detailed avatars.

## Reproduce
```sh
node --test qa/lobby-stability.test.mjs
PARK_SERVER_PACKAGE=/absolute/path/to/server/package.json \
PARK_SERVER_FACTORY=/absolute/path/to/vehicle-open-server.mjs \
GUARDED=1 SOAK_MS=300000 MINIGAMES=1 REPORT=load100-local.json \
node qa/lobby-load.mjs
```
The factory must export createVehicleServer without listening. The test binds an ephemeral loopback port and never contacts the live backend.
Omit GUARDED for baseline. The factory and ws dependency are existing local server prerequisites, not bundled production secrets.
