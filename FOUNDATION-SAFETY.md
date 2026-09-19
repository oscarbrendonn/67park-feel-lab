# Foundation safety release

Scope: Feel Lab only. The Kimi desktop/mobile repositories and their shared
backend are unchanged. Pets and terrain/model appearance are unchanged.
Feel Lab uses its own browser guest-token namespace; the shared Pages origin must
not overwrite identities used by the protected Kimi previews.

## Implemented

- Server-side text-only chat policy: 140 characters, explicit-content/link
  rejection, message pacing, duplicate nonce suppression, 20-entry lobby history.
- Per-guest mute and block. Muting hides chat/history/speech bubbles. Blocking
  also prevents direct invitations, friend requests, new home visits and grabs
  between that pair; avatars remain visible. Settings → Social → Players.
- Guest identities, friendships and safety preferences can survive backend
  restart when PARK_DATA_DIR points to persistent private storage. Chat text is
  not saved there. Browser data deletion/new devices are still new guest identities.
- Room step/input/snapshot exceptions isolate the failed match. Its party returns
  to a waiting room without disconnecting other rooms. Vehicle worlds and rides
  have independent exception boundaries. A paused vehicle world still permits
  dismounts; it is not silently declared recovered.
- Independent client feature boundaries; bounded diagnostics and hit deduplication;
  removed stale socket listeners; bounded home request receipts and rate limits.
- Rejected/replayed chat and home commands also have a small response budget.
  Rejecting a spam burst cannot create an equally large reply queue. Ordinary
  accepted actions and the immediate stand/exit escape route remain available.
- Home failure offers Retry homes after restoring the exterior and releasing
  controls. Render health attempts bounded resume and offers an explicit reload;
  WebGL loss permits browser restoration. No automatic reload loop.
- Same runtime import URLs for dynamic party hooks and the main client, checked
  by tests to avoid duplicate input/animation stores after cache-key changes.
- Corner contact uses the existing swept curb/stair/water rules but preserves
  motion along a free wall tangent instead of zeroing both horizontal axes.
  Walking, skating and swimming share the bounded resolver (at most three sweeps).
- The 16 central buildings use static outlines from their visible lower walls,
  including rounded corners, instead of oversized square bounding boxes. No new
  model, texture or draw call is added. Other building models remain unchanged.
- Persistently walking into a closed facade shows one small, non-interactive
  blocked-path cue. It has one bounded timer, no frame loop, and cannot stop
  movement if the optional cue itself fails.

## Release gate

`npm ci --ignore-scripts`, `npm test`, `npm run test:browser`.

The browser runner starts **its own loopback authority**. Never point fault/spam
tests at the public service. It exercises desktop and 390×844 mobile Chromium,
failed map load/retry, chat repetition, player safety, reconnect with a second
peer, 100 home transitions per view, repeated actions, rapid outfit changes and
an intentionally failed optional feature. It also checks all 16 central building
centres stay blocked, 64 previously square corner samples are open, and actual
walking/skating input slides along a wall, stops at its closed facade, and can
retreat. CI adds a 15-minute mobile session.
The GPU-less hosted runner uses explicit SwiftShader with quarter-resolution
canvas rendering and 256px shadows **inside the test only**, retaining the full
scene, materials, UI and gameplay. Exceptions, lost contexts and stopped drawing
still fail the gate. Software rasterization has a 15-second functional response
deadline; the hardware run keeps its 2.5-second stall limit. The hosted runner's
CPU shader work must not be advertised as real-device performance. Local hardware
tests run the normal graphics profile; no released graphics setting is reduced.

Pages uses the workflow build mode. Deployment needs the regression job to pass;
a failure leaves the last published artifact in place. Server code, private data,
test reports and npm dependencies are excluded from the public Pages artifact.

## Run the separate authority

Use Node 22 or newer, `npm ci --ignore-scripts`, then set `PARK_DATA_DIR` to a
persistent directory **outside the web checkout** and `PREVIEW_PORT=8498` before
`npm start`. Keep the existing Kimi service on 8292 unchanged. Preserve/backup both
social.json and safety.json together; never overwrite a corrupt store with empty
data. `/health` reports current tick/storage health and bounded fault counts.

The compressed terrain fixture is the existing finished-map driving capture,
filtered to driving/water surfaces. It is server-only, not another browser download.

## Limits: not a production-readiness certificate

- A keyword/link filter does not guarantee child safety or cover every language,
  evasion or grooming conversation. Production needs a moderation/report workflow
  with actual operators and age-appropriate communication policies.
- Guest blocking is not a permanent account ban; creating a new identity evades it.
- Exception boundaries do not preempt an infinite synchronous loop or an OS/GPU
  crash. Worker/process isolation and real-device loss recovery remain further work.
- Physical iPhone/Android, 100 rendered avatars, global latency, long disconnects
  beyond the current reservation grace, and sustained production load are not
  proven by the tests here. Lobby capacity stays 16.
- This is still a Mac-hosted test backend behind an accountless tunnel, not a
  globally available production service with an uptime guarantee.
