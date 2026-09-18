# Preview recovery checkpoints

These checkpoints belong only to this isolated preview repository.
Do not change the original island repositories.

| Tag | Saved state |
| --- | --- |
| checkpoint-before-pink-20260914 | Park repairs, before the pink wardrobe backdrop |
| checkpoint-before-controls-20260914 | Pink wardrobe, before movement tuning |
| checkpoint-controls-v1-20260914 | Current movement tuning and pink wardrobe |

Keep checkpoint tags unchanged. Before a major change, create and push a new
annotated checkpoint tag for the current revision.

Rollback requires an explicit choice of target. Restore via a new commit,
preserving history; never force-push or reset the original repositories.
For movement-only rollback, revert the movement-tuning commit rather than
rolling back unrelated park geometry or the wardrobe backdrop.

A saved checkpoint does not mean every game mode or multiplayer is tested.
After restoration, verify entry, the affected behavior and the Pages deployment
before reporting the rollback complete.
