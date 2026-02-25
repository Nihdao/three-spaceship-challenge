# Story 31.1: Weapon Stat Schema & Roster Cleanup

Status: review

## Story

As a developer,
I want the weapon definitions to reflect the new roster and stat schema,
so that the data layer is ready before implementing new weapon mechanics and the procedural upgrade system.

## Acceptance Criteria

1. **[Weapons removed]** The following 7 weapons are REMOVED from `WEAPONS` in `weaponDefs.js`: `MISSILE_HOMING`, `PLASMA_BOLT`, `RAILGUN`, `TRI_SHOT`, `SHOTGUN`, `SATELLITE`, `DRONE`. No key for any of these exists in the exported object.

2. **[rarityDamageMultipliers removed]** The `rarityDamageMultipliers` field and the `DEFAULT_RARITY_DMG` constant are removed from the file entirely.

3. **[upgrades[] removed]** The `upgrades[]` array is removed from all weapon defs. Replaced by the procedural system in Story 31.2.

4. **[New stat schema]** Every weapon def (retained and stub) includes: `baseArea` (number, 1.0 = neutral), `critChance` (float 0–1, minimum 0.015), `poolLimit` (integer), `rarityWeight` (integer — higher = more common).

5. **[critChance floor]** No weapon has `critChance < 0.015`. Values are never below the 1.5% floor.

6. **[Color family compliance]**
   - COLD: `LASER_FRONT=#00e5ff`, `BEAM=#0096c7`, `DIAGONALS=#48cae4`
   - ARCANE: `LASER_CROSS=#9b5de5`, `MAGNETIC_FIELD=#c084fc`
   - VOLATILE: `SPREAD_SHOT=#ffd60a`, `SHOCKWAVE=#f9e547`, `EXPLOSIVE_ROUND=#f4c430`
   - BIO: `MINE_AROUND=#06d6a0`, `TACTICAL_SHOT=#2dc653`
   - No weapon color overlaps the enemy spectrum (`#ef233c` / `#ff4f1f`)

7. **[BEAM adjustments]** `BEAM.projectileMeshScale = [0.12, 0.12, 8.0]` and `BEAM.projectileColor = '#0096c7'`.

8. **[EXPLOSIVE_ROUND adjustments]** `EXPLOSIVE_ROUND.projectileMeshScale = [1.4, 1.4, 1.4]`, `projectileColor = '#f4c430'`, and `pulseAnimation = true`.

9. **[6 new weapon stubs]** `LASER_CROSS`, `MAGNETIC_FIELD`, `DIAGONALS`, `SHOCKWAVE`, `MINE_AROUND`, `TACTICAL_SHOT` exist in `WEAPONS` with all required fields populated and `implemented: false`.

10. **[Tests pass]** `src/entities/__tests__/weaponDefs.test.js` is updated to match the new schema. All tests in that file pass.

## Tasks / Subtasks

- [x] Task 1: Remove 7 obsolete weapons from `weaponDefs.js` (AC: #1, #2, #3)
  - [x] Delete `MISSILE_HOMING`, `PLASMA_BOLT`, `RAILGUN`, `TRI_SHOT`, `SHOTGUN`, `SATELLITE`, `DRONE` entries
  - [x] Remove the `DEFAULT_RARITY_DMG` constant
  - [x] Remove `rarityDamageMultipliers` fields from `LASER_FRONT`, `SPREAD_SHOT`, `BEAM`, `EXPLOSIVE_ROUND`
  - [x] Remove `upgrades[]` arrays from all 4 retained weapons

- [x] Task 2: Add new stat fields to 4 retained weapons (AC: #4, #5, #6, #7, #8)
  - [x] `LASER_FRONT`: add `baseArea=1.0, critChance=0.05, poolLimit=15, rarityWeight=10`; update `projectileColor='#00e5ff'`
  - [x] `SPREAD_SHOT`: add `baseArea=0.8, critChance=0.05, poolLimit=30, rarityWeight=8`; update `projectileColor='#ffd60a'`
  - [x] `BEAM`: add `baseArea=0.12, critChance=0.02, poolLimit=50, rarityWeight=4`; update `projectileColor='#0096c7'`, `projectileMeshScale=[0.12, 0.12, 8.0]`
  - [x] `EXPLOSIVE_ROUND`: add `baseArea=15, critChance=0.05, poolLimit=8, rarityWeight=7`; update `projectileColor='#f4c430'`, `projectileMeshScale=[1.4, 1.4, 1.4]`, add `pulseAnimation=true`

- [x] Task 3: Add 6 new weapon stubs (AC: #9, #4, #5, #6)
  - [x] `LASER_CROSS`: `baseDamage=8, baseCooldown=4.0, baseArea=1.0, critChance=0.03, poolLimit=4, rarityWeight=6`, `projectileColor='#9b5de5'`, `projectileType='laser_cross'`, stub fields: `rotationSpeed`, `activeTime`, `inactiveTime`, `armLength`, `implemented=false`
  - [x] `MAGNETIC_FIELD`: `baseDamage=3, baseCooldown=0.25, baseArea=18, critChance=0.015, poolLimit=1, rarityWeight=5`, `projectileColor='#c084fc'`, `projectileType='aura'`, stub fields: `auraRadius`, `damagePerSecond`, `tickRate`, `implemented=false`
  - [x] `DIAGONALS`: `baseDamage=12, baseCooldown=0.80, baseArea=0.6, critChance=0.08, poolLimit=20, rarityWeight=7`, `projectileColor='#48cae4'`, `projectileType='bullet'`, stub fields: `diagonalCount=4`, `spreadRotation=true`, `implemented=false`
  - [x] `SHOCKWAVE`: `baseDamage=12, baseCooldown=1.20, baseArea=25, critChance=0.05, poolLimit=9, rarityWeight=6`, `projectileColor='#f9e547'`, `projectileType='shockwave'`, `knockbackStrength=5.0`, stub fields: `waveCount=3`, `waveSectorAngle=2.0`, `waveExpandSpeed=80`, `waveMaxRadius=25`, `waveDelay=0.06`, `implemented=false`
  - [x] `MINE_AROUND`: `baseDamage=40, baseCooldown=3.0, baseArea=12, critChance=0.10, poolLimit=3, rarityWeight=5`, `projectileColor='#06d6a0'`, `projectileType='mine'`, `knockbackStrength=4.0`, stub fields: `mineCount=3`, `orbitalRadius=15`, `mineDetectionRadius=4`, `explosionRadius=12`, `mineRespawnTime=3.0`, `implemented=false`
  - [x] `TACTICAL_SHOT`: `baseDamage=18, baseCooldown=1.20, baseArea=6, critChance=0.15, poolLimit=5, rarityWeight=6`, `projectileColor='#2dc653'`, `projectileType='tactical_strike'`, `knockbackStrength=2.0`, stub fields: `detectionRadius=60`, `strikeAoeRadius=6`, `strikeVfxDuration=0.3`, `implemented=false`

- [x] Task 4: Update `weaponDefs.test.js` (AC: #10)
  - [x] Remove `MISSILE_HOMING`, `PLASMA_BOLT`, `RAILGUN`, `TRI_SHOT`, `SHOTGUN`, `SATELLITE`, `DRONE` from `ALL_EXPECTED_IDS`
  - [x] Remove `upgrades` from `REQUIRED_FIELDS`; add `baseArea`, `critChance`, `poolLimit`, `rarityWeight`
  - [x] Remove archetype describe blocks for RAILGUN, TRI_SHOT, SHOTGUN, SATELLITE, DRONE
  - [x] Remove the "8 upgrade tiers" test (upgrades[] no longer exists)
  - [x] Remove the "monotonically increasing damage" and "decreasing cooldown" tests (no upgrade curves)
  - [x] Add test: all weapons have `critChance >= 0.015`
  - [x] Add test: all 6 new stubs exist with `implemented === false`
  - [x] Add test: all 10 weapon `projectileColor` values match their expected hex (family compliance)
  - [x] Update color uniqueness test to cover all 10 weapons
  - [x] Run `npx vitest run src/entities/__tests__/weaponDefs.test.js` — all pass

## Dev Notes

### Scope Boundary (CRITICAL)

This story modifies ONLY:
- `src/entities/weaponDefs.js`
- `src/entities/__tests__/weaponDefs.test.js`

Do NOT touch `useWeapons.jsx`, `progressionSystem.js`, any other store, system, or UI file. Stories 31.2 and 31.3 will handle those.

### Why Other Files Will Not Crash

`useWeapons.jsx` already uses optional chaining for all weapon-def access:

```js
// line 147 — addWeapon
const rarityMultiplier = def?.rarityDamageMultipliers?.[rarity] ?? 1.0
// → safely returns 1.0 when field is absent (no crash, no override applied)

// line 162 — upgradeWeapon
const upgrade = def?.upgrades?.[weapon.level - 1]
// → undefined when upgrades[] absent — the `if (upgrade)` guard below prevents any further access
```

`progressionSystem.js` also uses `def.upgrades?.[upgradeIndex]` with optional chaining — returns `undefined` safely. Removing these fields from the data layer will not cause runtime errors.

### Other Test Files Will Have Stale References

14 files reference the 7 removed weapon IDs. They are NOT in scope for 31.1. After this story, some tests in those files may fail because they try to access `WEAPONS['RAILGUN']` etc. which will be `undefined`.

Files most likely to fail:
- `src/systems/__tests__/progressionSystem.newWeapons.test.js` — tests for new weapons from Story 11.3
- `src/systems/__tests__/progressionSystem.test.js` — choice generation tests using old weapon IDs
- `src/stores/__tests__/useWeapons.newPatterns.test.js` — patterns for TRI_SHOT, RAILGUN etc.

**Accepted technical debt.** After 31.1, run the full test suite and note which external tests fail — but do not fix them here. They will be resolved in Stories 31.2/31.3.

### Retained Weapon Final Stats

```
LASER_FRONT    : baseDamage=10, baseCooldown=0.5,  baseArea=1.0,  critChance=0.05, poolLimit=15, rarityWeight=10
SPREAD_SHOT    : baseDamage=6,  baseCooldown=0.7,  baseArea=0.8,  critChance=0.05, poolLimit=30, rarityWeight=8
BEAM           : baseDamage=8,  baseCooldown=0.1,  baseArea=0.12, critChance=0.02, poolLimit=50, rarityWeight=4
EXPLOSIVE_ROUND: baseDamage=15, baseCooldown=1.5,  baseArea=15,   critChance=0.05, poolLimit=8,  rarityWeight=7
```

All other fields on retained weapons (`baseSpeed`, `projectileType`, `projectileRadius`, `projectileLifetime`, `sfxKey`, `knockbackStrength`, `slot`, and any archetype-specific fields like `projectilePattern`, `explosionRadius`, etc.) remain unchanged.

### BEAM Visual Changes

Old: `projectileColor='#ff0088'` (hot pink), `projectileMeshScale=[0.5, 0.5, 8.0]`
New: `projectileColor='#0096c7'` (COLD blue), `projectileMeshScale=[0.12, 0.12, 8.0]` (very thin beam)

The mesh scale change drastically thins the beam visually — this is the intended design. The X and Y components go from 0.5 to 0.12 (60% thinner).

### EXPLOSIVE_ROUND Color Change

Old: `#ff2244` (crimson — dangerously close to enemy `#ef233c`)
New: `#f4c430` (golden yellow — VOLATILE family)

`pulseAnimation: true` is a data-only flag. Rendering is NOT implemented in this story — it will be handled by Story 32.7. The flag just needs to exist in the data for Epic 32 to detect it.

### Weapon Stub Complete Field List

Each stub must have these minimum fields (no placeholder strings — all values are final design targets):

```js
{
  id: 'WEAPON_ID',
  name: '...',
  description: '...',
  baseDamage: N,
  baseCooldown: N,
  baseSpeed: N,
  projectileType: '...',
  projectileRadius: N,
  projectileLifetime: N,
  projectileColor: '#xxxxxx',
  projectileMeshScale: [N, N, N],
  sfxKey: 'laser-fire',          // use 'laser-fire' as placeholder
  knockbackStrength: N,
  baseArea: N,
  critChance: N,
  poolLimit: N,
  rarityWeight: N,
  slot: 'any',
  implemented: false,
  // + weapon-specific fields (see Task 3 above)
}
```

### `implemented: false` — Pool Exclusion

The flag `implemented: false` means the weapon will be excluded from `generateChoices()` pool in `progressionSystem.js`. As of 31.1, that filtering logic does not yet exist in progressionSystem — it will be added in Story 31.3. For now, the stubs exist in WEAPONS but the pool logic will still include them unless guarded. This is acceptable for 31.1 since the weapons don't have rendering handlers anyway (Epic 32 implements those). The guard will be added in 31.3.

### Architecture Compliance

- `weaponDefs.js` is **Layer 1 (Config/Data)** — pure JS export, no React, no imports from stores or systems. Must remain so.
- No logic or helper functions belong in this file. It exports one object: `WEAPONS`.
- Pattern: `src/entities/companionDefs.js` (Story 30.4) — same layer, same approach.

### Project Structure Notes

- `src/entities/weaponDefs.js` — only file to modify in production code
- `src/entities/__tests__/weaponDefs.test.js` — test file to rewrite (not patch — too many changes)
- Do NOT create any new files in this story

### References

- [Source: _bmad-output/planning-artifacts/epic-31-weapon-roster-upgrade-system-overhaul.md#Story 31.1] — Full AC, color families, stub stat values, Technical Notes
- [Source: src/entities/weaponDefs.js] — Current file: 11 weapons, DEFAULT_RARITY_DMG, upgrades[], rarityDamageMultipliers
- [Source: src/stores/useWeapons.jsx] — Optional chaining confirms no runtime crash from schema changes
- [Source: src/systems/progressionSystem.js] — `def.upgrades?.[upgradeIndex]` confirms safe removal of upgrades[]
- [Source: src/entities/__tests__/weaponDefs.test.js] — Current test: REQUIRED_FIELDS list, ALL_EXPECTED_IDS, archetype tests to remove
- [Story 22.3] — Established rarityDamageMultipliers (now superseded)
- [Story 11.3] — Added the 7 weapons now being removed
- [Story 31.2] — Will replace useWeapons upgrade logic with procedural system
- [Story 31.3] — Will add `implemented: false` filtering to progressionSystem pool
- [Story 32.7] — Will implement `pulseAnimation` rendering for EXPLOSIVE_ROUND

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Rewrote `weaponDefs.js` entirely: removed 7 obsolete weapons (MISSILE_HOMING, PLASMA_BOLT, RAILGUN, TRI_SHOT, SHOTGUN, SATELLITE, DRONE), removed DEFAULT_RARITY_DMG constant, removed rarityDamageMultipliers and upgrades[] from all retained weapons.
- Added new stat schema (baseArea, critChance, poolLimit, rarityWeight) to 4 retained weapons with updated color family assignments (COLD/VOLATILE families).
- BEAM: color updated #ff0088→#0096c7, meshScale updated [0.5,0.5,8.0]→[0.12,0.12,8.0] (very thin beam).
- EXPLOSIVE_ROUND: color updated #ff2244→#f4c430 (VOLATILE gold), meshScale [1.2,1.2,1.2]→[1.4,1.4,1.4], pulseAnimation:true added (data-only flag).
- Added 6 new weapon stubs: LASER_CROSS, MAGNETIC_FIELD, DIAGONALS, SHOCKWAVE, MINE_AROUND, TACTICAL_SHOT — all with implemented:false and all required fields populated.
- Rewrote `weaponDefs.test.js` (66 tests, all pass): new schema fields validated, color family compliance, critChance floor, stub existence, enemy spectrum distance checks.
- Accepted technical debt: 60 new test failures in 9 external files (useEnemies.knockback, progressionSystem, useWeapons.newPatterns, Armory tests) that reference removed weapon IDs. Per Dev Notes, NOT fixed in 31.1 — will be resolved in 31.2/31.3.
- Pre-existing failures (13 tests in 4 files — audioManager, MainMenu, StatsScreen, waveSystem) were present before this story and are unchanged.
- **Code review pass (2026-02-22):** Added `knockbackStrength` to `REQUIRED_FIELDS` in test (was in story spec stub template but missing from CI guard). 66/66 tests still pass.
- **Weapon design refinements (2026-02-22):** Updated descriptions and stub fields for all 6 new weapons to match finalized design intent: LASER_CROSS (X cross centered on ship, armLength=25, activeTime=3s); MAGNETIC_FIELD (2-3 concentric rings, ringCount=3); DIAGONALS (angles=[45,135,225,315] relative to facing, removed ambiguous spreadRotation); SHOCKWAVE (waveMaxRadius=70, waveSectorAngle=π, waveCount=1 — large semi-circular arc); MINE_AROUND (orbitalSpeed=0.8 rad/s, mineCount=4, continuous orbit); TACTICAL_SHOT (instant lightning strike, no projectile travel, aoeLinger=4.0s, aoeLingerDamage=3, targets=nearest).

### File List

- src/entities/weaponDefs.js (modified — full rewrite)
- src/entities/__tests__/weaponDefs.test.js (modified — full rewrite)

### Change Log

- 2026-02-22: Story 31.1 implemented — weapon stat schema & roster cleanup. Removed 7 weapons, added new stat fields (baseArea/critChance/poolLimit/rarityWeight) to 4 retained weapons, added 6 new weapon stubs, rewrote test file (66 tests all pass).
- 2026-02-22: Code review pass — added `knockbackStrength` to REQUIRED_FIELDS (test coverage gap fix). Refined descriptions and stub fields for 6 new weapon stubs to match finalized design intent (see Completion Notes). 66/66 tests pass.
