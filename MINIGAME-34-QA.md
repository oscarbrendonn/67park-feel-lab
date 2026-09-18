# Shared mini-game input / page zoom

Scope: Kimi preview only. Codex/original checkouts and live services unchanged.

## Findings and repairs

- The main park's native-pinch guard was absent from the separate sports, race, rockets, balloon and team-lobby entry pages. Its activation also required `.park-hud`, which those games do not have. All entries now load the same guard and it recognizes each actual gameplay surface. Browser pinch is prevented during multi-touch gameplay without swallowing Pointer Events, changing the game camera or globally disabling accessibility zoom. Menus/text entry remain excluded; sports range sliders remain usable alongside the shot button.
- Both published Codex and Kimi sports bundles had the same old charge handlers. A second pointer could release the first pointer's charge; lost capture did not cancel it. Both Kimi sports modes now use one owned pointer/key, ignore foreign release and key repeat, and cancel on capture loss, blur, page hide, orientation or hidden document. Gameplay timing/scoring and aim rules are unchanged.

## Verification

- 1000 mixed-pointer / keyboard / cancel cycles passed, including lost capture and listener cleanup.
- Five game contexts, 1000 viewport ownership cycles each, passed. Every standalone entry's shared guard reference is checked. Previous main-park viewport regression passed.
- Chrome 390x844: basket loads its original court, charge/release enters flight, bot score/turn progresses. Penalty loads its original stadium; player shots enter flight; score and attempts progress to five shots. No captured JS errors in those sampled runs.
- Codex/Kimi server sports simulation and rules files have identical SHA256 values. Their shared-source sports test passes 17 checks, including basket rim crossing, penalty goal/save/wide/above-bar, keeper rebound, turn authorization, full rounds and two WebSocket clients on an isolated ephemeral local server. This is not a new live multiplayer/device endurance certification.

The user's exact additional "penalty/basket broken" symptom is not specified yet. This release addresses the demonstrated zoom integration and shot ownership defects; it does not certify all unspecified mini-game bugs fixed. Native iPhone multi-touch still needs a physical-device verification.
