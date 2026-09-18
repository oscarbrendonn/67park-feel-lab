# Kimi preview: camera and park driving 35

Scope: Kimi preview only, public-road cars. Original projects, Codex preview,
race rules/cars, bus, map geometry and camera distance remain unchanged.

Changes:
- Shared yaw gain .0052 rad/px mouse, .007 touch across both park avatar paths.
- During active drag, touch follows the orbit target directly, like mouse.
- Upper-left canvas can rotate; lower-left movement zone and UI stay excluded.
- Wheel begins from the grab point, reaches full lock at 44 CSS px, has a gentler
  centre curve, retains pointer capture and existing lifecycle release handlers.
- Park car forward top speed 7 -> 10.5 m/s (25.2 -> 37.8 km/h), acceleration
  3.8 -> 6.2 m/s², reverse 3 -> 3.5 m/s. Stronger brake and faster self-centering.
- More low-speed steering authority, speed-dependent angle reduction retained.
- Original 120Hz collision checks and boarding/exit/auth rules retained.

Verified:
- qa35-test: 30/60/120Hz forward/reverse/brake; symmetric steering; return to
  centre; coast/vehicle collision blocking; finite guards; bus untouched.
- 1,000 wheel gestures and event-rate-independent camera delta tests.
- qa35-camera-test runs actual avatar input handlers: left/right mouse, touch
  ownership, second-pointer rejection, cancel/blur cleanup, 1,000 repeated drags.
- qa30 viewport gesture regression passes.
- Chrome desktop and 390x844: visible camera rotation, no captured JS errors.
  These are viewport/mouse checks, not a real iPhone touch test.
- Isolated five-client network test and public tunnel five-client test both pass:
  four distinct seats, fifth rejected, passengers cannot drive, 7.57m movement,
  all four exits, chat to all five, session resume and auth/origin isolation.
- Earlier public ten-client test timed out waiting for an exit; not a pass.
  Five-client repeats passed, larger-load exit behaviour remains inconclusive.

Backend:
- User explicitly approved a brief Kimi server restart.
- Dedicated wrapper: qa35-kimi-server.mjs in the 2026-09-14 QA directory.
- Same port 8292 and existing tunnel; no original source modifications.
- Applies the same pure driving helper to the two Kimi world cars, not the bus.
- Rollback: revert this release commit, stop the QA35 wrapper, run the retained
  qa26-kimi-server.mjs on 8292. Coordinate restart with connected testers.

Not certified: real-device feel/performance, prolonged driving over every map
join, racing mini-game handling, prior intermittent phone chat freeze.
