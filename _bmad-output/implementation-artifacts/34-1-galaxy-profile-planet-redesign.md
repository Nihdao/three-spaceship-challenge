# Story 34.1: Galaxy Profile Enrichment & Planet Type Redesign

Status: done

## Story

As a developer,
I want `galaxyDefs.js` to carry the full gameplay profile of Andromeda Reach and `planetDefs.js` to use the CINDER/PULSE/VOID nomenclature,
so that all downstream systems can derive their parameters from a single authoritative data source.

## Acceptance Criteria

1. **Given** `galaxyDefs.js` **When** `getGalaxyById('andromeda_reach')` is called **Then** the returned object includes: `planetCount: 15`, `wormholeThreshold: 0.75`, `planetRarity: { standard: 8, rare: 5, legendary: 2 }`, `luckRarityBias: { standard: -0.15, rare: 0.10, legendary: 0.05 }`, `galaxyRarityBias: 0`, `enemySpeedMult: 1.5`, `difficultyScalingPerSystem: { hp: 1.25, damage: 1.20, speed: 1.10, xpReward: 1.15 }`, `systemNamePool: [array of ≥12 names]`

2. **Given** `planetDefs.js` **When** the planet types are enumerated **Then** `PLANET_CINDER` (Standard), `PLANET_PULSE` (Rare), `PLANET_VOID` (Legendary) exist with the Redshift color palette **And** `PLANET_SILVER`, `PLANET_GOLD`, `PLANET_PLATINUM` are removed

3. **Given** planet tier field **When** any planet def is read **Then** `tier` is one of: `'standard'`, `'rare'`, `'legendary'`

4. **Given** all files that referenced old planet types **When** the rename is complete **Then** `useLevel.jsx`, `PlanetRewardModal.jsx`, `PlanetAuraRenderer.jsx`, `progressionSystem.js`, and all test files compile and pass with no references to `PLANET_SILVER`, `PLANET_GOLD`, `PLANET_PLATINUM`

## Tasks / Subtasks

- [x] Task 1 — Enrich `galaxyDefs.js` with full Andromeda Reach gameplay profile (AC: #1)
  - [x] 1.1 Add `planetCount`, `wormholeThreshold`, `planetRarity`, `luckRarityBias`, `galaxyRarityBias`
  - [x] 1.2 Add `enemySpeedMult`, `difficultyScalingPerSystem`
  - [x] 1.3 Add `systemNamePool` with the 16 names from Andromeda Reach pool (see Dev Notes)
- [x] Task 2 — Rename planet types in `planetDefs.js` (AC: #2, #3)
  - [x] 2.1 Replace `PLANET_SILVER` → `PLANET_CINDER` with Redshift palette
  - [x] 2.2 Replace `PLANET_GOLD` → `PLANET_PULSE` with Redshift palette
  - [x] 2.3 Replace `PLANET_PLATINUM` → `PLANET_VOID` with Redshift palette
  - [x] 2.4 Update `tier` values to `'standard'`, `'rare'`, `'legendary'`
- [x] Task 3 — Update `useLevel.jsx` (AC: #4)
  - [x] 3.1 Update `initializePlanets()` tiers array: `PLANET_CINDER` / `PLANET_PULSE` / `PLANET_VOID`
  - [x] 3.2 Keep `GAME_CONFIG.PLANET_COUNT_SILVER/GOLD/PLATINUM` references as-is (rework in Story 34.2)
- [x] Task 4 — Update `PlanetRewardModal.jsx` (AC: #4)
  - [x] 4.1 Replace `TIER_COLORS` keys: `silver/gold/platinum` → `standard/rare/legendary` with Redshift colors
  - [x] 4.2 Replace `TIER_LABELS` keys: `'Standard'`, `'Rare'`, `'Legendary'`
- [x] Task 5 — Update `PlanetAuraRenderer.jsx` (AC: #4)
  - [x] 5.1 Update tier string lookup keys from `silver/gold/platinum` to `standard/rare/legendary`
- [x] Task 6 — Update `progressionSystem.js` (AC: #4)
  - [x] 6.1 In `generatePlanetReward()`: `'silver'` → `'standard'`, `'gold'` → `'rare'`, `'platinum'` → `'legendary'`
- [x] Task 7 — Update all test files (AC: #4)
  - [x] 7.1 `src/entities/__tests__/planetDefs.test.js`: keys CINDER/PULSE/VOID, tiers standard/rare/legendary
  - [x] 7.2 `src/stores/__tests__/useLevel.planets.test.js`: update typeId and tier strings, count assertions still correct
  - [x] 7.3 `src/stores/__tests__/useLevel.scanning.test.js`: update typeId/tier in all fixture objects
  - [x] 7.4 `src/stores/__tests__/useLevel.systemTransition.test.js`: update activeScanPlanetId fixtures
  - [x] 7.5 `src/stores/__tests__/resetFlow.test.js`: update activeScanPlanetId fixture
- [x] Task 8 — Run tests and verify all pass (AC: all)
  - [x] 8.1 `npx vitest run` — all existing tests must pass

## Dev Notes

### galaxyDefs.js — Full Andromeda Reach Profile

The `andromeda_reach` object currently has only display/meta fields. Replace the entire entry with:

```js
{
  id: 'andromeda_reach',
  name: 'Andromeda Reach',
  description: 'A spiral arm teeming with hostile fleets and rich asteroid fields.',
  systemCount: 3,
  locked: false,
  colorTheme: '#cc44ff',
  challengeSlots: [],
  fragmentMultiplier: 1.0,
  // --- Gameplay Profile (Story 34.1) ---
  planetCount: 15,
  wormholeThreshold: 0.75,          // 75% scanned → wormhole spawns (= 12 planets for Andromeda)
  planetRarity: {
    standard: 8,
    rare: 5,
    legendary: 2,
  },
  luckRarityBias: {
    standard: -0.15,   // per +1 luck: fewer standard
    rare: 0.10,        // per +1 luck: more rare
    legendary: 0.05,   // per +1 luck: more legendary
  },
  galaxyRarityBias: 0.0,             // 0 = neutral reference galaxy
  enemySpeedMult: 1.5,               // All enemy base speeds ×1.5
  difficultyScalingPerSystem: {
    hp: 1.25,
    damage: 1.20,
    speed: 1.10,
    xpReward: 1.15,
  },
  systemNamePool: [
    'IRON REACH', 'SHATTERED VEIL', 'DEAD ORBIT', 'BURNING FRONT',
    'ASHEN BELT', 'VOID CORONA', 'FRACTURE ZONE', 'BLEEDING ARM',
    'DUST CORRIDOR', 'SILENT WRECK', 'PALE MARGIN', 'SULFUR TIDE',
    'CINDER GATE', 'RUST MERIDIAN', 'TORN NEBULA', 'COLLAPSED RIM',
  ],
}
```

### planetDefs.js — New CINDER/PULSE/VOID Definitions

```js
export const PLANETS = {
  PLANET_CINDER: {
    id: 'PLANET_CINDER',
    name: 'Cinder Planet',
    tier: 'standard',
    scanTime: 5,
    color: '#a07855',
    emissiveColor: '#6b4c2a',
    emissiveIntensity: 0.2,
    scale: [8, 8, 8],
    modelKey: 'planetA',
    scanRadius: 40,
  },
  PLANET_PULSE: {
    id: 'PLANET_PULSE',
    name: 'Pulse Planet',
    tier: 'rare',
    scanTime: 10,
    color: '#00b4d8',
    emissiveColor: '#0096c7',
    emissiveIntensity: 0.6,
    scale: [12, 12, 12],
    modelKey: 'planetB',
    scanRadius: 50,
  },
  PLANET_VOID: {
    id: 'PLANET_VOID',
    name: 'Void Planet',
    tier: 'legendary',
    scanTime: 18,
    color: '#9b5de5',
    emissiveColor: '#7b45c5',
    emissiveIntensity: 1.0,
    scale: [16, 16, 16],
    modelKey: 'planetC',
    scanRadius: 60,
  },
}
```

Note: `modelKey` values (`'planetA'`, `'planetB'`, `'planetC'`) remain unchanged — 3D mesh assets are reused.

### useLevel.jsx — initializePlanets() Minimal Change

Only rename the typeId strings. Keep GAME_CONFIG references as-is (Story 34.2 will replace this entire function):

```js
const tiers = [
  { typeId: 'PLANET_CINDER', count: GAME_CONFIG.PLANET_COUNT_SILVER },   // 4
  { typeId: 'PLANET_PULSE',  count: GAME_CONFIG.PLANET_COUNT_GOLD },     // 2
  { typeId: 'PLANET_VOID',   count: GAME_CONFIG.PLANET_COUNT_PLATINUM }, // 1
]
```

**Do NOT** rename `GAME_CONFIG.PLANET_COUNT_SILVER/GOLD/PLATINUM` in this story. Those constants will be fully removed in Story 34.2 when `initializePlanets(galaxyConfig)` is rewritten.

### PlanetRewardModal.jsx — Tier Colors & Labels

Lines 13-23 currently:
```js
const TIER_COLORS = {
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#b0e0e6',
}
const TIER_LABELS = {
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
}
```

Replace with:
```js
const TIER_COLORS = {
  standard:  '#a07855',   // CINDER
  rare:      '#00b4d8',   // PULSE
  legendary: '#9b5de5',   // VOID
}
const TIER_LABELS = {
  standard:  'Standard',
  rare:      'Rare',
  legendary: 'Legendary',
}
```

### PlanetAuraRenderer.jsx — Tier Lookup

Current code at lines 12-14 uses tier strings `silver/gold/platinum` as object keys to look up color constants. Change those keys to `standard/rare/legendary`. The internal color constant names (`SILVER_COLOR`, etc.) can remain if you prefer — only the dictionary key matters.

### progressionSystem.js — generatePlanetReward()

Function `generatePlanetReward(tier, ...)` at line 261. Current branching:
```js
if (tier === 'silver') { ... }
else if (tier === 'gold') { ... }
if (tier === 'platinum') { ... }
```
Change to:
```js
if (tier === 'standard') { ... }
else if (tier === 'rare') { ... }
if (tier === 'legendary') { ... }
```

### Test File Update Guide

**`planetDefs.test.js`** — Full updates needed:
- `expect(PLANETS).toHaveProperty('PLANET_CINDER')` etc.
- Tier test: `expect(PLANETS.PLANET_CINDER.tier).toBe('standard')` etc.
- Hierarchy test: rename to "CINDER scanTime < PULSE scanTime < VOID scanTime"

**`useLevel.planets.test.js`** — Updates:
- Test description still valid: total count 7 (4+2+1) unchanged
- `planets.filter(p => p.tier === 'standard')` (was `'silver'`), etc.
- Fixture `activeScanPlanetId: 'PLANET_SILVER_0'` → `'PLANET_CINDER_0'`

**`useLevel.scanning.test.js`** — All fixture planet objects:
```js
{ id: 'PLANET_CINDER_0', typeId: 'PLANET_CINDER', tier: 'standard', x: 0, z: 0, ... }
{ id: 'PLANET_PULSE_0',  typeId: 'PLANET_PULSE',  tier: 'rare', x: 200, z: 200, ... }
{ id: 'PLANET_VOID_0',   typeId: 'PLANET_VOID',   tier: 'legendary', x: -300, z: -300, ... }
```
Comments referring to "Silver planet at (0,0), scanRadius=40, scanTime=5" should say "CINDER planet" for clarity.

**`useLevel.systemTransition.test.js`** — Line 137: `activeScanPlanetId: 'PLANET_GOLD_0'` → `'PLANET_PULSE_0'`. Line 247: similar.

**`resetFlow.test.js`** — Line 56: `activeScanPlanetId: 'PLANET_SILVER_0'` → `'PLANET_CINDER_0'`.

### HUD.jsx — No Changes Needed

The grep confirmed HUD.jsx has no direct references to PLANET_SILVER/GOLD/PLATINUM. The minimap reads `PLANETS[p.typeId]?.color` dynamically, so renaming the keys in `planetDefs.js` is sufficient.

### Scope Boundary — What NOT to Do in This Story

- **Do NOT** implement luck-weighted planet generation (Story 34.2)
- **Do NOT** implement random player spawn (Story 34.2)
- **Do NOT** change `initializePlanets` signature to accept `galaxyConfig` (Story 34.2)
- **Do NOT** implement wormhole scan-based trigger (Story 34.4)
- **Do NOT** connect `enemySpeedMult` or `difficultyScalingPerSystem` to GameLoop (Story 34.5)
- This story is purely a **data layer rename + data enrichment**

### Project Structure Notes

- Architecture: 6-layer (Config/Data → Systems → Stores → GameLoop → Rendering → UI). This story touches Config/Data layer only (+ cosmetic updates to UI/Store referencing the old names).
- All planet data flows from `planetDefs.js` → `useLevel.jsx` (state) → Renderers + UI (display)
- `galaxyDefs.js` is currently disconnected from GameLoop — the connection happens in Stories 34.4 and 34.5

### References

- [Source: _bmad-output/planning-artifacts/epic-34-galaxy-system-foundation.md#Story 34.1]
- [Source: _bmad-output/planning-artifacts/epic-34-galaxy-system-foundation.md#Typage planètes Redshift]
- [Source: _bmad-output/planning-artifacts/epic-34-galaxy-system-foundation.md#Profil Andromeda Reach]
- [Source: src/entities/planetDefs.js] — current SILVER/GOLD/PLATINUM definitions (3 types, scanTime/scanRadius unchanged)
- [Source: src/entities/galaxyDefs.js] — current minimal andromeda_reach entry (no gameplay fields)
- [Source: src/stores/useLevel.jsx#initializePlanets] — consumes PLANETS[typeId] + GAME_CONFIG.PLANET_COUNT_*
- [Source: src/ui/PlanetRewardModal.jsx#TIER_COLORS/TIER_LABELS] — lines 13-23, hardcoded tier → display maps
- [Source: src/renderers/PlanetAuraRenderer.jsx] — lines 12-14, tier → color lookup
- [Source: src/systems/progressionSystem.js#generatePlanetReward] — line 261+, branches on tier string
- [Source: src/config/gameConfig.js#168-170] — PLANET_COUNT_SILVER=4, PLANET_COUNT_GOLD=2, PLANET_COUNT_PLATINUM=1
- [Source: src/entities/__tests__/planetDefs.test.js] — 7 tests to update
- [Source: src/stores/__tests__/useLevel.scanning.test.js] — fixture typeId/tier updates throughout
- [Source: src/stores/__tests__/useLevel.planets.test.js] — tier filter strings + activeScanPlanetId fixture

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No issues encountered. Pure data-layer rename with exact spec from Dev Notes.

### Completion Notes List

- ✅ Task 1: `galaxyDefs.js` enriched with full Andromeda Reach gameplay profile (16 system names, planetCount/wormholeThreshold/planetRarity/luckRarityBias/galaxyRarityBias/enemySpeedMult/difficultyScalingPerSystem)
- ✅ Task 2: `planetDefs.js` fully renamed SILVER→CINDER/GOLD→PULSE/PLATINUM→VOID with Redshift palette; tiers updated to standard/rare/legendary
- ✅ Task 3: `useLevel.jsx` initializePlanets() tiers array updated to PLANET_CINDER/PULSE/VOID; GAME_CONFIG.PLANET_COUNT_* constants left intact for Story 34.2
- ✅ Task 4: `PlanetRewardModal.jsx` TIER_COLORS and TIER_LABELS keys updated to standard/rare/legendary with Redshift palette colors
- ✅ Task 5: `PlanetAuraRenderer.jsx` TIER_COLOR_KEY dictionary keys updated to standard/rare/legendary
- ✅ Task 6: `progressionSystem.js` generatePlanetReward() tier branching updated silver→standard, gold→rare, platinum→legendary
- ✅ Task 7: All 5 story test files updated + 5 additional files fixed by code review (progressionSystem.test.js, galaxyDefs.test.js extended, useGame.test.js, useLevel.transition.test.js, runContinuity.test.js)
- ✅ Task 8: All story tests pass; code review fixes confirmed passing

### Code Review Findings Fixed

- ✅ [HIGH] `progressionSystem.test.js` — 8 generatePlanetReward tests updated to use standard/rare/legendary tier strings (were using silver/gold/platinum, exercising wrong code paths)
- ✅ [MEDIUM] `galaxyDefs.test.js` — Added Story 34.1 gameplay profile describe block (10 tests verifying AC #1: planetCount, wormholeThreshold, planetRarity, luckRarityBias, galaxyRarityBias, enemySpeedMult, difficultyScalingPerSystem, systemNamePool)
- ✅ [LOW] `useGame.test.js` — triggerPlanetReward calls updated to standard/rare/legendary
- ✅ [LOW] `useLevel.transition.test.js:45` — activeScanPlanetId fixture updated to PLANET_PULSE_0
- ✅ [LOW] `runContinuity.test.js:192,196` — planet fixture updated to PLANET_PULSE_0 / tier 'rare'

### File List

- `src/entities/galaxyDefs.js` — enriched with full Andromeda Reach gameplay profile
- `src/entities/planetDefs.js` — renamed SILVER/GOLD/PLATINUM → CINDER/PULSE/VOID with Redshift palette
- `src/stores/useLevel.jsx` — initializePlanets() typeIds updated
- `src/ui/PlanetRewardModal.jsx` — TIER_COLORS/TIER_LABELS keys updated
- `src/renderers/PlanetAuraRenderer.jsx` — TIER_COLOR_KEY keys updated
- `src/systems/progressionSystem.js` — generatePlanetReward() tier strings updated
- `src/entities/__tests__/planetDefs.test.js` — keys/tier assertions updated
- `src/stores/__tests__/useLevel.planets.test.js` — tier filter strings + fixture updated
- `src/stores/__tests__/useLevel.scanning.test.js` — all fixture planet objects updated
- `src/stores/__tests__/useLevel.systemTransition.test.js` — activeScanPlanetId fixtures updated
- `src/stores/__tests__/resetFlow.test.js` — activeScanPlanetId fixture updated
- `src/systems/__tests__/progressionSystem.test.js` — generatePlanetReward tests updated to standard/rare/legendary [code review fix]
- `src/entities/__tests__/galaxyDefs.test.js` — Story 34.1 gameplay profile describe block added (10 tests for AC #1) [code review fix]
- `src/stores/__tests__/useGame.test.js` — triggerPlanetReward fixture strings updated [code review fix]
- `src/stores/__tests__/useLevel.transition.test.js` — activeScanPlanetId fixture updated [code review fix]
- `src/stores/__tests__/runContinuity.test.js` — planet fixture updated [code review fix]

## Change Log

- 2026-02-22: Story 34.1 implemented — data layer rename (SILVER/GOLD/PLATINUM → CINDER/PULSE/VOID, tiers standard/rare/legendary) + galaxyDefs.js enrichment with full Andromeda Reach gameplay profile
- 2026-02-22: Code review fixes — progressionSystem.test.js tier strings corrected, galaxyDefs.test.js AC #1 tests added, stale tier strings in 3 additional test files updated
