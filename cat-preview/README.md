# Lightweight Cat head — review prototype

Based on Cat / v15 in the existing 67verse character catalogue. Reuses the
earlier local modeled head; this pass reduces geometry, fixes pole topology,
removes coplanar cheek decals, preserves curved ears/eyes/whiskers and bakes
surface colour and roughness into an atlas. Not an exact copy of the concept.

## Measured asset budget

- 5,008 triangles, one mesh/material and one render primitive.
- Draco GLB: 89,804 bytes (87.7 KiB). This is the head asset, NOT total page load.
- Decoder and Three.js are separate shared dependencies.
- Uncompressed fallback GLB: 316,876 bytes.
- Base colour: 512 x 512; roughness: 256 x 256.
- All head vertices follow the existing Head bone; the original 20-bone rig
  and attachment names are retained. No body or animation clips included.

Compared locally with existing Friends asset heads: friendsie_2000 has 3,058
triangles; friendsie_3333 has 4,106 per primitive and two head primitives.
This prototype is in a similar geometry range, not a claim of equal total
file size, equal visual detail or certified equivalent mobile performance.

Source and editable Blender scene remain in /tmp/67park-cat-light-20260918.
No live character, wardrobe selection or original asset was replaced.
Headwear fitting, complete character animation, game integration and physical
phone performance are separate acceptance checks, not completed by this preview.
