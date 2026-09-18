# Friends panel — friends-22

Presentation-only Kimi preview update. New scoped stylesheet plus one index stylesheet link; no JavaScript, game/network behavior, original repository or Codex changes.

Cream rounded panels, sculpted pastel controls, game-specific selected colors, clear focus outlines, larger touch targets and fixed accessible header/footer around a scrolling body. No new dependency, font request, animation loop or backdrop blur. Reduced-motion disables press transforms.

Verified in Chrome:

- Desktop 1613×973: rendered panel, game cards, friends and island sections.
- 390×780 and 320×640: no horizontal scroll overflow; friend input, enabled/disabled Add friend, header/close and footer accessible. Input test text cleared without submitting a friend request.
- 844×390: compact header/footer, scrollable content, room seats visible.
- Selecting Pocket Rally updates the selected card, heading, format controls and practice link.
- Created a private test room on isolated preview backend; seat/host state rendered. Left the room, verified create-room controls returned, then closed panel successfully.
- Captured console errors: none.

Not tested: physical iPhone/Safari, actual friend invitation delivery, full multiplayer match. Viewport tests are not real-device performance measurements.

Rollback: remove the friends-panel.css link from index.html (stylesheet has no global selectors outside .online-dialog).
