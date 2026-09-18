# Chat / viewport render stall — frame-31

Scope: Kimi preview only. No original-map, geometry, backend or input changes.

## Confirmed defect

The parent Canvas permanently declared `frameloop="never"` for the city, while
the loaded island imperatively changed it to `always`. React Three Fiber
reconfigures the Canvas after its measured rectangle changes (including offset).
This reapplies `never`. The island's resume effect only depends on width/height,
so offset-only reconfiguration leaves the game frozen while DOM controls work.

## Fix

Canvas now subscribes to existing entry readiness, wardrobe state and document
visibility. It declares the same mode as the island lifecycle: stopped during
loading/wardrobe/hidden state, running for a ready visible park. Reconfiguration
therefore no longer replaces the running mode with a constant stop command.
No watchdog, reload, extra animation loop or exception masking was introduced.

## Verification

- PASS, real browser / bundled engine: two small Canvas instances use the same
  render engine and old island width/height resume effect. On an offset-only
  change, old policy stopped at frame 1062; fixed policy continued to frame 2736.
- PASS: 24 lifecycle combinations, 1000 wardrobe/visibility cycles, listener cleanup.
- PASS: prior 1000 joystick interruptions, 50 keyboard cycles and 1000 native
  gesture ownership tests.
- PASS: actual local Kimi park, 390x844 -> chat at 390x380 -> send -> 390x844.
  Speech bubble appeared; frames advanced 1100 -> 1702; Jump animated.
- PASS: wardrobe reopened and returned to running park, no console errors.
- Physical iPhone keyboard behavior is not directly verified. The engine-level
  offset-only freeze is reproduced and fixed, but other device-specific causes
  are not ruled out by this test.
