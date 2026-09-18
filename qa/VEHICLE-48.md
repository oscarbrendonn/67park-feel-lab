# Vehicle 48 — road and exterior sidewalks

Scope: Kimi car and school bus. Roadside sidewalks and their actual rounded corners are driveable; lawn/parcel interiors, sand and water are excluded. No visible obstacles, map edits, vehicle speed changes or mini-game changes.

The old generic dry-ground rule admitted parcel interiors. The replacement uses upward road/curb/sidewalk geometry minus parcel/lawn/park surfaces, plus the existing full vehicle footprint and height/obstacle checks. The school bus uses its actual longer footprint and the same domain.

Validation on 2026-09-16:

- Raw island geometry: 11,650 upward lawn/parcel triangle samples, zero allowed leaks. All three parked vehicle spawn positions allowed.
- Synthetic curb transition for car and bus; 360 headings and 1,000 repeated checks each; invalid coordinate rejection.
- Chrome game entry and domain installation without console errors; mobile copy at 390x844 also loaded the new domain. This is viewport testing, not a physical-phone driving test.
- Post-repair rendered terrain captured locally for authoritative server parity: best and mobile captures have identical SHA256 a5147a5c3eb663826c09278c3ac378aa39b16341f563884429029620fa40ac51. Server uses this geometry, not the old raw island mesh.
- 64,872 real vehicle pose checks across map extents, 8 headings and all 3 vehicle specs. 8,253 allowed poses. This grid does not prove every continuous point/corner.
- 21 simulated boundary stops and successful reverse departures; no non-finite state or domain tunnelling in these runs.
- Isolated 5-client network test: 4 unique car seats, extra claim denied, passenger driving denied, driving distance >10m, exit/reconnect and origin/token isolation passed.

Remaining limitations: not a complete manually driven tour of every corner, no physical iPhone/Safari test, no universal no-bug guarantee. Pending mini-game 47 remains outside this release.
