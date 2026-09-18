# Homes v1 — 2026-09-18

## Scope

Eight existing v62 cottages on the small island; their exterior assets, roads,
terrain, vehicle rules and the lobby's 16-player capacity are unchanged.
Use **Homes → Claim home → Go to door → Interact / E**.
One home per authenticated guest session per lobby. Open homes accept visitors;
owners can lock new entry or release the home. Existing guests can always leave.
Ownership is temporary, not NFT ownership or persistent account property.
Leaving the lobby / expiration of its existing reconnect grace releases ownership.

Interiors share one lightweight procedural furniture set. Only the visited room
is visible; different houses are separated beyond the 115 m avatar render range.
No added textures, GLBs, shadow maps or separate physics worlds. Client additions
are about 25 KB raw / 10 KB gzip (server code excluded). There are 41 furniture
instances, four cutaway walls, a ceiling and one non-shadow-casting fill light.
Map geometry was not edited.

## Verification

- `node --test qa/housing.test.mjs`: 11 tests covering simultaneous claims,
  one home per user, cross-lobby independence, access/lock authority, proximity,
  crafted movement rejection, stale pre-teleport packets, release/eviction,
  reconnect reservation, mini-game transition, 1000-action bounded handler,
  collision volumes, room separation and chat focus ownership.
- Existing lobby stability (6), returning-entry (5), controls, skate-surface and
  terrain-seam tests pass. The terrain test includes 1291 ray probes. This is a
  targeted regression set, not a claim that every historical test is green.
- `qa/housing-browser.cjs` on the actual mobile repo, with two separate browser
  contexts: 1280×900 desktop and 390×844 touch/DPR2. Real isolated Kimi backend,
  authenticated WebSockets and the production vehicle/room server factory.
- Claim, travel, E / touch entry, same-home visitors, lock refusal, unlock,
  walking, jumping, six unique messages acknowledged and received by the other
  client, touch joystick after chat, viewport scale 1, reconnect with same ID,
  offline local exit followed by server resync, release, all eight cottage
  arrival floors and enter/exit paths passed. Zero captured page errors.
- Home dialog fits at 320×568 and 844×390; desktop and mobile screenshots checked.
- Real Chrome / Kimi session `park-housing` also used for panel, door and indoor
  inspection. Screenshots from isolated QA were saved under `/tmp/67park-home-*`.

Two additional mobile issues were caught during this work: utility controls could
overlap Send while the keyboard moved chat; and losing input focus on pointerdown
could reposition Send before click. Utility controls now yield during text entry,
and the existing submit handler blurs only after sending. No viewport zoom cap or
camera sensitivity was changed.

## Limits

No physical iPhone/Android or 100-visible-avatar acceptance test is implied.
These are starter interiors: furniture editing, beds/seating animations, permanent
housing, per-house private chat, address-book invitations and purchases are not
part of v1. Chat still says **Message everyone** and remains lobby-wide.

## Repeating isolated QA

Start the project's static preview on 127.0.0.1:8493, then supply the existing
non-listening `createVehicleServer` factory via `PARK_SERVER_FACTORY` when running
`node qa/housing-dev-server.mjs`. The QA gateway listens on 8495 and rewrites only
its own preview backend configuration, so automated test players never join live.
Set `PARK_PLAYWRIGHT` if Playwright is installed elsewhere. `HOUSE_QA_URL` selects
the desktop or mobile repo on that gateway. The server extension is additive:
`installHousing(app)` after `installLobbyLoadGuard`, before `server.listen`.

The live entrypoint has a `social-toys-server.before-homes-1.mjs` backup. Removing
the housing installation and restarting disables homes without altering existing
world simulation. Frontend rollback is the single homes release commit per repo;
do not reset unrelated user work.
