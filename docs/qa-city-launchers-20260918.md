# City launchers — 2026-09-18

Scope: replace the four party-pack jump pads only. Terrain, character rigs, controls, cars, UI and original source models are unchanged.

## Placement and behavior

- City hatch: x157, z126, ground9.22755 (5_YOL).
- Park-path hatch: x170, z115, ground9.47879 (8_PARK_PATIKA_UST).
- Mint trampoline: x133, z103, ground9.39803 (3_CIMEN).
- Rose trampoline: x169, z61, ground9.39803 (3_CIMEN).
- Nine footprint probes reject water, trees, steep ground and elevated props. Bounded nearby fallbacks; unsafe placements are omitted.
- Existing launch velocity12.5 and input/runtime state contract retained. Lid opens in160ms, holds, closes in200ms. The lid does not cut a terrain hole or add colliders.
- Trampoline uses a damped spring; reduced-motion uses gentler movement. No idle motion, new animation loop, downloaded model/texture, or per-launch mesh allocation.
- Shared10 geometries,7 materials,2 procedural256x256 textures. Instanced legs/springs. World replacement disposes resources.
- Remote positions can animate the lid without changing remote physics or adding network messages.

## Verification

Chrome desktop1280x850 and mobile emulation390x844, both repository entrypoints with candidate files routed locally:
- Four actual physics launch points each moved the player upwards; pack stayed enabled and renderer frame count advanced.
-1,005 synthetic launch-controller activations: shared geometry/material/texture counts unchanged.
- Disabled-pad setting, reduced motion, stationary remote-contact deduplication and resource disposal passed.
- No captured JavaScript page errors. Same factory rendered for closed/open visual inspection; in-game desktop/mobile captures inspected.
- Syntax and git whitespace checks passed.

Limits: mobile is Chrome touch emulation, not a physical iPhone/Safari test. Remote-contact logic was simulated; live multiplayer connection was unavailable during this QA, so this is not a two-device online pass. Resource-count assertions do not establish a whole-game frame-rate or memory guarantee.

