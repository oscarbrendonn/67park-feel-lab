# Camera and speech polish — isolated preview

- Mouse drag sensitivity: yaw 0.0032 rad/px; pitch 0.0026 rad/px. Touch sensitivity is unchanged.
- Mouse capture keeps dragging continuous; pointer-up, cancellation and lost capture clear the gesture.
- While mouse-dragging, apply the orbit position directly instead of adding trailing interpolation. No momentum or decorative camera animation added. Normal follow-camera and pitch limits remain.
- Speech bubble keeps its character-head anchor. Warm ivory, fine border, layered light shadow, softer typography and smaller rounded tail; no blur, new texture or animation library.
- Control tests at 30/60/120 FPS, Punch input tests and head/canvas speech projection tests pass.
- Local Codex desktop drag changed yaw 2.67 to 3.31 and pitch 0.28 to 0.38 for a 200px-left/40px-down drag; no console error. Speech bubble visually verified over Gorilla's head.
- Physical mobile, all-character and multiplayer verification are not covered by this pass. Original releases and map geometry are untouched.
