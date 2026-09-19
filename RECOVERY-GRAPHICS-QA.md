# Connection recovery, real graphics levels and camera comfort

Release: `recovery-graphics-1` · 20 September 2026

## Scope and limits

The active `67park-feel-lab` line only. The original Kimi repositories, map
geometry/materials, character assets, game rules and capacities are unchanged.
No dive, server purchase, accounts, economy or NFT ownership feature was added.

This is not a claim of perfect reliability or support for 100 rendered avatars.
The lobby capacity remains 16. The existing nearest-avatar render budget remains
8 remote avatars on narrow screens and 12 on desktop. Network admission, loaded
models, visible models and physical-device performance are different measures.

## Behavior

- HTTP session negotiation and authenticated renewals include protocol range
  and build metadata. Incompatible clients get HTTP 426 / WS 4009 and an explicit
  update message. Protocol-v1 legacy clients remain supported by this server.
- Authentication has a 10-second body-inclusive deadline. A shared session
  request prevents duplicate authentication work. Handshake/silent-socket
  deadlines and ping/pong release unresponsive transports; native clients retry.
- Obsolete socket callbacks cannot clear a replacement world connection.
  Remote animation/carry listeners attach after asynchronous authentication and
  reattach on every reconnect, with one listener and explicit cleanup.
- A small loader-independent panel offers retry and return if a minigame module
  fails. Both the existing return link and new button leave the old room once;
  a stale return intent cannot leave a different room. Saved character data is
  not cleared. The wardrobe's inert background excludes the recovery controls.
- Server-confirmed expired/missing matches offer a park return, not an endless
  loading screen. Existing authority limits still apply: disconnected match
  membership has a 20-second grace period and match loading a 60-second deadline.
  A long outage, completed match, or authority restart cannot promise the same
  active round. No automatic page-reload loop is introduced.

## Graphics and camera

| Setting | Pixel ratio cap | Real-time shadows |
| --- | --- | --- |
| Automatic | Existing adaptive/requested ratio | Authored settings |
| Low | 0.8, capped by device ratio | Off |
| Medium | 1.25, capped by device ratio | On, map size capped at 1024 |
| High | 2, capped by device ratio | Authored settings |

Settings change the renderer, not just labels. Controls, HTML text, physics,
network updates and animation clocks are not throttled. Shadow targets are
released/reallocated on changes; authored sizes can be restored. A failure in
optional quality management falls back once rather than stopping the renderer.

Only the camera's vertical target is damped (existing rate 8, at most 0.65 world
units of lag). Horizontal following and yaw/pitch input remain direct. Existing
immediate wall retraction and smooth release are retained. FOV stays 55; no
shake, speed zoom or auto-yaw. The animate skill guided this narrow separation
between comfort damping and direct control; it did not add cosmetic UI motion.

## Automated evidence

- Local result on 20 September: 111 unit/integration tests, 110 passed, zero
  failed, one skipped because its optional external geometry fixture is absent.
  The hardware-backed Chrome foundation gate completed both viewports, including
  the full 900-second mobile-emulation soak: zero page errors, no context loss,
  and the companion remained connected. The final remote-motion patch also
  passed its focused unit tests and a fresh complete browser recovery run.
- `npm test`: current unit/integration suite, including incompatible protocol,
  16 real network peers, two simultaneous matches plus a home and lobby, each
  context reconnecting, and one intentionally failed room not stopping another.
- Remote connection tests: 100 asynchronous reconnects, one motion/carry
  listener each time, no listener after disposal during authentication.
- Browser recovery: real HTTP incompatibility, delayed wardrobe/inert mounting,
  actual graphics dropdown/framebuffer, remote motion after world reconnect,
  failed minigame download then a real playing match, offline/online retention,
  and park return without an automatic redirect loop.
- Existing foundation gate remains mandatory: chat spam, mute/block, 100 home
  transitions per viewport, action spam, wardrobe changes, optional-feature
  failure, curb/corner/roof/grass checks, and 15-minute mobile-emulation soak.

Commands:

```sh
npm test
PARK_QA_PORT=8513 PARK_SOAK_MS=900000 npm run test:browser
```

Observed mobile emulation at 390 × 844, device ratio 2: High 780 × 1688;
Medium 487 × 1055; Low 312 × 675 with shadows disabled. These are measured
framebuffer sizes, not estimated phone FPS.

In the interactive desktop browser, a 16-seat lobby contained 15 remote
network peers and 12 selected real models across five existing character
assets. Before the listener fix, the remote motion protocol was absent; after
the fix all 15 peers supplied motion and the 12 selected models advanced their
animation counters. A real jump sample measured 1.63 units of travel, bounded
0.65 vertical camera lag and zero horizontal target lag. Drag release caused no
continued yaw interpolation. These are local Chrome observations, not Android.
The same fixture in a 390-pixel-wide foreground viewport selected eight real
remote models while retaining all 16 network seats. This was still emulation.

## Physical device acceptance — still required

The connected USB Android is detected but ADB reports **unauthorized**. The user
must unlock it and approve USB debugging. No Android model, FPS, heat or memory
result has been fabricated. The saved physical iPhone is offline, not tested.

After authorization:

1. Use an isolated local QA server, then `adb reverse tcp:8507 tcp:8507` and open
   the local QA URL on the phone. Do not run fake peers against the public park.
2. Sample 15 ground positions near the real player and supply them as JSON to
   `PARK_FIXTURE_POSITIONS='[[x,y,z],...]' node qa/device-lobby-fixture.mjs`.
   The fixture sends real protocol packets and existing character combinations;
   it does not bypass the production render budget or substitute cheap shapes.
3. Record phone/OS/browser, foreground state, actual selected/visible avatar
   count, real framebuffer, shadows, draw calls, frame-time distribution,
   context losses, memory and 15-minute warm behavior for each quality level.
4. Keep other peers in a match and home. Disconnect only the phone, reconnect,
   verify identity and expected room/expiry behavior while the others continue.
5. Repeat on a physical iPhone and a lower-spec Android before raising capacity.

The CPU-only CI browser uses a test-only quarter-resolution automatic profile
and 256 shadow maps. Its cap now survives adaptive resets and manual quality
round trips. It still runs the actual scene, collision, animation and transport
code, keeps all geometry assertions and the bounded draw-progress deadline.
It is a functional/resource gate, never a physical-device performance result.

## Publishing

Upgrade the existing backend before serving the new client: the client requires
protocol metadata. `/health` reports this release's build and protocol. Keep the
same allowed origins, data directory and tunnel; do not reset guest/safety data.
GitHub Pages remains downstream of the full regression job. A push is not proof
that Pages is live, and a green CI run is not proof of Android/iPhone acceptance.

Continuation note: run `35466637662` passed unit tests and dependency audit but
failed the new graphics screenshot's 30-second compositor timeout on Linux.
That image-capture deadline is now 90 seconds, matching the existing geometry
screenshots; framebuffer, shadow and rendered-frame checks are unchanged.
The full recovery browser suite then passed locally with SwiftShader, including
actual High/Low/Medium framebuffers, motion reconnect, failed download retry,
continued peer simulation and both return-to-park controls.
The interrupted local CPU foundation run reached and passed the previously
failing coastal-divider check, but did not produce a complete-run verdict.

After the turn interruption both local test processes and the old quick tunnel
were absent, and its public URL returned HTTP 530. The existing Mac mini backend
was restarted on the same port/data directory. Its replacement free test tunnel
is `https://things-silk-insured-athletics.trycloudflare.com`; `/health` returned
this build, protocol 1 and zero faults. The new client configuration uses that
address. No paid server or subscription was created. This temporary service
still depends on the Mac and its tunnel process remaining available.
