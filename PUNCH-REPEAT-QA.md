# Punch repeat hardening

The reported device freeze is not reproduced: the previous local Codex build accepted 30 clicks without errors. Do not treat this as a verified root-cause fix.

Changes: consume rejected pointer events before cooldown checks; ignore compatibility clicks after pointerdown; guard invalid delta time; start/stop the optional punch action only on state transitions, never restart a finished action within the same hit; missing punch clips no longer throw.

Both variants pass the input tests and an isolated 1000-cycle action-lifecycle test. Local Codex Gorilla accepted 40 repeated clicks followed by running at 6.8 m/s, with no captured console errors. Physical phone and multiplayer verification remain pending. Original releases are unchanged.
