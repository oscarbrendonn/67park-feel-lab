# Kimi fleet 38

Scope: Kimi preview only; original projects and multiplayer server unchanged.

- Eight decorative sports-parking cars now share the drivable reference body, with eight pastel paint colours. Parking bays and floor geometry remain unchanged.
- Drivable cars have the authentic colourful 67park logo on both number plates.
- Bus uses the rounded factory minibus shell instead of the stretched compact-car shell, mint/cream paint, transparent windows and colourful logo plates/header badges. Original seat layout, capacity and collision specification are preserved.
- `node --experimental-loader ./qa/three-loader.mjs qa/fleet-38.test.mjs`: PASS. Eight colours, 13 fleet batches, 154368 fleet triangles, seven floor meshes unchanged, 1000 seat claim/release cycles per car/bus, finite geometry.
- Syntax and whitespace checks: PASS.
- Chrome desktop visual checks: car front plate, bus front/side/rear, all eight parked cars. Actual main game loaded and connected to Mac mini; live northwestSports97 DOM diagnostic confirms fleet installed. Actual map view shows parked fleet beside bus.
- Actual boarding from the attempted bus-roof teleport was inconclusive (not at door height); no online driving or physical-phone regression pass is claimed for this visual-only release. Constructor seat tests are not an end-to-end driving test.
- Static parked cars remain decorative; this change does not introduce eight additional networked vehicles.

Review fixture: `qa/fleet-38.html`. No new large model downloads; the existing logo texture is shared.
