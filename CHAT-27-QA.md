# Online speech bubbles — chat27

Scope: isolated Kimi preview, main park. No original/Codex modifications or server restart.

## Reproduced

Two independent browser sessions used the same public online service: GitHub Pages (Gorilla) and localhost serving the identical release (Buddy #1000). Messages reached both chat feeds, but only the sender had a head bubble. The receiver displayed the sender's name without a message bubble.

## Fix

Remote avatars now project the latest received message above the sender's head/name tag using the existing avatar frame callback. Text is rendered literally, capped at 140 characters, retained for up to 10 seconds and replaced by later messages. No additional animation loop or message timers. Cached head lookup is bounded and never measures skinned vertices or recursively updates model matrices. Optional overlay faults cannot throw into gameplay. Unmount/disconnect removes the associated bubble. Maximum 16 bubble nodes and one style node.

## Verification

- Independent browser-session message delivered from public Gorilla to local Buddy; receiver visibly showed the Gorilla's message above the character.
- Unit stress: 16 players, 16,000 messages, 48,000 updates; 16-node ceiling; message/player identity isolation; expiry; literal HTML text; malformed/cyclic model tree bounded; projection failure recovery; cleanup; placement above the name tag.
- Post-deployment reverse direction and mobile-width verification are checked separately before handoff.

This is not a claim of real-phone endurance or universal no-freeze behavior. Main-park chat is in scope; mini-game chat UI is unchanged. The online service still requires the Mac mini and its tunnel to remain available.
