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
- After the physical-device label correction: 112 unit/integration tests,
  111 passed, zero failed, the same one optional external-fixture skip. The
  full software-rendered recovery browser suite passed again, including the
  real name badge, failed download, playing match, reconnect and both park exits.
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

## Physical Android evidence — broader acceptance still required

USB authorization was received. Tested device: Redmi Note 14, Android 16,
Chrome 153.0.8010.37, MT6789, approximately 8 GB RAM. Physical display
1080 × 2400; actual game viewport approximately 384 × 710 CSS pixels at native
DPR 2.8125. This is a physical phone attached by USB, not browser emulation.
The saved physical iPhone remains offline and untested.

The isolated local origin is `http://127.0.0.1:8521/67park-feel-lab/` through
`adb reverse tcp:8521 tcp:8521`. The test uses one phone and 15 authenticated
WebSocket peers, five existing character assets, and the unchanged eight-remote
mobile render budget. No fake peers were added to the public park. Real
model/animation counters and actual framebuffer sizes are recorded separately.

Before the nameplate rendering correction:

| Scene / actual quality | Window | Draw FPS | p95 frame | Result |
| --- | --- | --- | --- | --- |
| Empty lobby / Automatic | 30 s | 54.4 | 33 ms | Short baseline only |
| 16 seats, 8 real animated remote models / Automatic | 60 s | 12.9 | 100 ms | Performance failed |
| Same lobby / Low | 60 s | 19.0 | 67 ms | Performance failed |

Low really rendered at 307 × 568, DPR 0.8 with shadows off; Automatic at
384 × 710, DPR 1 with shadows on. There were no runtime errors, context losses
or disconnects in those short observations, but that did not make 13–19 FPS
acceptable. JS heap reporting was approximately 588 MB; this is Chrome's
approximate JS-heap value, not whole-browser or device memory use.

Diagnostic isolation kept all eight real models and all 16 connections:
hiding only name badges temporarily raised Low to 55.6 FPS over 30 seconds.
Keeping names visible while removing their blurred backgrounds/shadows gave
48.3 FPS; adding bounded compositor layers gave 55.2 FPS. These are diagnostic
comparisons, not the shipped-build acceptance result. Temporary style overrides
were removed by reloading the page before testing the actual code change.

The correction keeps every label, name, color and rounded badge. Only the
moving badges' backdrop blur and soft shadow were replaced by a light, unblurred
edge, with compositor hints on the existing bounded label layers. No avatar,
physics update, input update or network peer is hidden/throttled. Existing
Show names preferences still work. The physical screenshot was inspected.

A post-reload 60-second sample included loading/compiling the eight real models:
45.8 draw FPS overall, with one 1.20-second maximum gap during that cold entry.
This is not evidence of hitch-free cold loading. A separate warm 15-minute
Low-quality run was started only after all eight animated models were ready;
its completed result is recorded below.
Phone audio was muted through the game's own button at the user's request,
and remained muted after reload. No system-volume setting was changed.

The first warm run was interrupted at 240.7 seconds, not passed: 48.0 draw FPS,
p95 33 ms, max gap 150 ms, all 16 seats/eight models, no JS error or WebGL loss
through the last sample; battery 37.9 C while USB charging. Chrome's main native
process then exited with SIGTRAP. The timestamp matches an additional debugger
HTTP `/json/protocol` query issued by the test operator. Chromium's
[protocol handler](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/content/browser/devtools/devtools_http_handler.cc)
contains a fatal check / NOTREACHED path for that request. A tooling-triggered
crash is therefore a strong inference, not a symbolicated proof about this
exact binary. The query is no longer used. The incomplete run is retained;
do not relabel it as a game pass or as proof of an in-game crash. Chrome was
reopened to the same local game, restoring the guest and mute preference.

The clean replacement run completed 900.027 seconds: **47.0 draw FPS**, p95
33 ms, p99 33 ms, maximum frame gap 117 ms. Every 30-second sample retained
16 network seats, 15 motion streams, eight visible/animated real remote models,
and both connections. Zero JS errors, WebGL losses, party faults or hidden-tab
time were recorded. Battery temperature rose from 38.6 C to a peak of 41.0 C
while USB charging. This is a stationary camera with moving peers on this one
phone; it is not a roaming 16-rendered-avatar benchmark or an all-phone claim.

Selective reconnect also passed on the physical phone in both the lobby and
H02. During each intentional tab-only outage, all other 15 fixture clients
stayed connected, two independent Balloon matches kept advancing and an H01
resident stayed inside. The phone kept rendering, recovered the same identity
and home context, returned outside normally, and retained mute. The phone's
network was cut for approximately two seconds, within the existing grace
period. Home travel used the real server protocol and phone renderer, not a
physical walk to the door. Other participants were authenticated scripted
clients, not 15 additional physical phones.

A separate cold coastal-camera sample on the phone rendered 120 new frames,
with a maximum 851 ms gap, no page errors, and both transports connected.
The matching screenshot was inspected; this was a diagnostic camera pose,
not a player walking that route. All fixture peers and phone measurement
listeners were cleaned up afterward. The reloaded phone page returned to one
connected player, a ready character and `Unmute (N)`; game audio stayed off.

Real Android trusted-touch check passed: joystick travel 2.06 world units,
jump rise 1.58, return to grounded position, released input at zero, 16 peers
still connected. No direct controller/physics writes or teleports were used.

After reopening Chrome, the same 16-seat/eight-model fixture completed fresh
60-second quality comparisons: Automatic 36.2 FPS (p95 33 ms, adaptive DPR 1),
Medium 38.6 FPS (p95 33 ms, 480 × 888 at DPR 1.25), High 25.9 FPS (p95 67 ms,
768 × 1421 at DPR 2). All three retained connections and had no JS error or
WebGL loss. High does not meet a 30 FPS target on this device. The renderer's
actual getter/dimensions were used; its Automatic debug dataset can retain an
older DPR until a settings refresh, so the dataset alone is not evidence.

An Android `dumpsys meminfo --package com.android.chrome` sample after quality
cycling reported approximately 2.10 GiB total Chrome PSS: renderer 1.10 GiB,
GPU/privileged process 0.79 GiB, browser 0.21 GiB. This is the entire browser's
measured footprint, not a differential game-only allocation or a memory-leak
diagnosis. It is too large to assume low-memory Android support from FPS alone.
Do not advertise all-phone stability until a lower-memory device is measured.

Reproduction helpers (local QA only):

```sh
adb forward tcp:9223 localabstract:chrome_devtools_remote
adb reverse tcp:8521 tcp:8521
PARK_QA_PORT=8521 node qa/regression-server.mjs
node qa/android-lobby.mjs
node qa/android-quality.mjs low
PARK_PHONE_EXPECT_SEATS=16 PARK_PHONE_EXPECT_MODELS=8 node qa/android-measure.mjs low-warm-15min 900000
node qa/android-input.mjs
node qa/android-recovery.mjs
```

Remaining acceptance: longer roaming sessions, a physical iPhone and a
lower-spec Android. The 60-second other-quality samples are not 15-minute
thermal tests. Do not raise the capacity or extrapolate to 100 rendered avatars.

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

The next release candidate fixes the later `35467107502` failure: a deliberately
failed minigame download was incorrectly waiting for the page-wide load event.
Navigation now waits for commit, then independently verifies the recovery UI,
retry and real match. The complete local software recovery suite passed.
The final-approach roof fixture now uses the shipped analog control to avoid
overshooting its sample on slow frames; geometry thresholds are unchanged and
both hardware-backed keyboard/touch roof routes passed again.

Full Mac SwiftShader foundation reruns still failed the 15-second frame budget
at the cold coastal view (18-37 seconds); precompiling shader variants did not
fix it and that experiment was removed. No stall threshold or required scenario
was relaxed. Hardware-backed Chrome measured a 67-150 ms gap at that view and
the physical Android 851 ms. These results do not establish the exact driver
cause or a full CPU-only pass. The hosted Linux gate must still complete before
this candidate can publish; local hardware-emulation soak results are separate.

After the turn interruption both local test processes and the old quick tunnel
were absent, and its public URL returned HTTP 530. The existing Mac mini backend
was restarted on the same port/data directory. Its replacement free test tunnel
is `https://things-silk-insured-athletics.trycloudflare.com`; `/health` returned
this build, protocol 1 and zero faults. The new client configuration uses that
address. No paid server or subscription was created. This temporary service
still depends on the Mac and its tunnel process remaining available.
