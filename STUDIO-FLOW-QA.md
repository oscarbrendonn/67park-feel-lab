# Character selection → Style Studio → park

Release: `studio-flow-1`, 2026-09-18. Scope: Feel Lab only.

## Implementation

- A first-time player selects a character, dresses it in the shared in-game
  studio, and enters with those equipment IDs. Returning entry uses the saved
  character and outfit. Profile opens this same studio without page navigation.
- The approved empty pink studio, shared neutral lighting and distant framing
  are retained. Mobile keeps the character visible while the controls scroll.
- Gorilla and Friends retain their selected identity. The head/body selection
  UI is not offered as a substitute for clothes. Gorilla eyewear/cap slices are
  separate accessories; the validated sweater removes the donor hand triangles
  and preserves the gorilla's own hands.
- The same fitted equipment builder is used by local/remote park avatars and
  the active Balloon, race, rockets, sports, Lane Rush and Skybound bundles.
- Equipment uses the existing bounded combo protocol; no backend restart,
  wallet connection, purchase, NFT contract or ownership claim is introduced.
- Item meshes own their cloned geometry/materials and use the existing avatar
  disposer. No new animation loop, new library, texture or character GLB.
- The older standalone `/style-studio/` remains a preview/reference. It is no
  longer used by first entry or the game's Profile button.

## Checks performed

- `node --test qa/studio-catalog.test.mjs`: 5 tests passed.
- `node qa/studio-flow.browser.cjs`: Chrome desktop 1440×960 and mobile emulation
  390×844 passed first entry, five equipped items, reload persistence, same-page
  profile/return, bounded horizontal layout and no uncaught page errors.
- `node qa/settings-entry.cjs`: desktop/mobile entry and studio hide Settings;
  gameplay shows Settings, which opens/closes successfully.
- `node qa/studio-online.browser.cjs`: two isolated Chrome contexts. Five item
  meshes appear in both local and remote scenes. The shoe change propagates.
  Opening the studio for 23 seconds retains social presence and identity.
  A Friends character uses this same studio and returns successfully.
- `node qa/studio-minigames.browser.cjs`: seven routes (Balloon, race, rockets,
  basketball, penalty, Lane Rush, Skybound). All five equipped meshes are built
  and submitted to the renderer, original gorilla hands stay visible, the
  sweater excludes 1120 donor-hand triangles, draw calls continue, no page errors.
  This is outfit/render smoke coverage, not complete gameplay certification.
- `node qa/studio-stress.browser.cjs`: 40 paced shoe clicks, 1000 burst clicks,
  five profile/equip/return cycles. Movement remains functional (4.34 m in the
  tested input), one game canvas remains, no page errors. Burst clicks may be
  coalesced by React and are not 1000 distinct completed model loads.
- Real Chrome/Kimi UI inspection confirms the integrated studio opens from
  Profile without changing the page URL.

## Limits

Saved profile/outfit is still browser-local, not a cross-device account or NFT
inventory. Tests use Chrome on one Mac, not physical iPhone/Android devices.
They do not certify 100-player rendering, long thermal sessions or fix the
separate foundation-audit reconnect/room-isolation gaps. Original Kimi desktop
and mobile repositories are unchanged.
