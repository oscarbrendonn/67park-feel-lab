# Feel Lab runtime boundary

Initial source: the existing 67park-kimi-island runtime (2026-09-10), copied on
2026-09-19. Only its 32 transitive JavaScript dependencies are included. World
assets are read from this repository's existing island directory, not duplicated.

The protected original Kimi checkouts and their backend are not modified.
Changes here are versioned and run by the same release regression gate as clients.
Guest identity and safety stores belong outside the public Pages artifact.
