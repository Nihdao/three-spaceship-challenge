# Story 40.3: Fix Planet Capture Aura Color to Match Planet Color

Status: done

## Story

As a player,
I want the glowing aura around a planet to match the planet's visual color,
so that the capture zone feels cohesive with the planet I'm approaching.

## Acceptance Criteria

1. **Given** a `PLANET_CINDER` planet (standard tier, brown `#a07855`) — **When** the player enters its scan radius — **Then** the aura glow is brown/amber matching the planet's color — **And** NOT grey (silver `#cccccc` from the old tier mapping).

2. **Given** a `PLANET_PULSE` planet (rare tier, blue `#00b4d8`) — **When** the player enters its scan radius — **Then** the aura glow is blue matching the planet's color — **And** NOT yellow (gold `#ffdd00` from the old tier mapping).

3. **Given** a `PLANET_VOID` planet (legendary tier, purple `#9b5de5`) — **When** the player enters its scan radius — **Then** the aura glow is purple matching the planet's color — **And** NOT cyan (platinum `#00ddff` from the old tier mapping).

4. **Given** a planet that has already been scanned (`planet.scanned === true`) with `cfg.SHOW_COMPLETED_AURA === true` — **When** rendered — **Then** it still uses `cfg.COMPLETED_COLOR` (`#888888`) as before (no regression on completed aura logic).

5. **Given** the fix is applied — **When** a new planet type is added to `planetDefs.js` in the future — **Then** the aura will automatically use its `.color` field with no changes to `PlanetAuraRenderer.jsx` (data-driven improvement).

## Tasks / Subtasks

- [x] Task 1: Remove `TIER_COLOR_KEY` constant from `PlanetAuraRenderer.jsx` (AC: #1, #2, #3)
  - [x] 1.1: Delete lines 11–15 (`const TIER_COLOR_KEY = { standard: 'SILVER_COLOR', rare: 'GOLD_COLOR', legendary: 'PLATINUM_COLOR' }`)

- [x] Task 2: Update color selection logic in `useFrame` (AC: #1, #2, #3, #4)
  - [x] 2.1: In `useFrame`, locate the color block at lines 125–128
  - [x] 2.2: Replace the `colorKey` string-indirection pattern with direct color value lookup
  - [x] 2.3: For the completed-aura branch, use `cfg.COMPLETED_COLOR` directly (no key indirection)
  - [x] 2.4: For the active-aura branch, use `PLANETS[planet.typeId].color` directly

- [x] Task 3: Verify no regressions (AC: #4, #5)
  - [x] 3.1: Run `npm test src/config/__tests__/gameConfig.planetAura.test.js` — all tests must pass (SILVER/GOLD/PLATINUM_COLOR keys remain in config, test must not be touched)
  - [x] 3.2: Run `npm test src/stores/__tests__/useLevel.planets.test.js` — no regression on planet store
  - [ ] 3.3: Manual QA: enter scan radius of each planet type — verify aura color matches planet sphere color visually

### Review Follow-ups (AI)

- [ ] [AI-Review][LOW] Add `count < MAX_AURAS` bounds guard in render loop to prevent InstancedMesh buffer overflow if >10 auras are fading simultaneously [PlanetAuraRenderer.jsx:104]
- [ ] [AI-Review][LOW] Add null-check for `PLANETS[planet.typeId]` at render-loop access points (lines 64, 108, 122) to prevent crash on unknown typeId [PlanetAuraRenderer.jsx:64]
- [ ] [AI-Review][LOW] The `|| '#ffffff'` fallback (line 123) no longer protects against undefined `planet.typeId` (crashes before `||`); only protects against missing `.color` field — consider guard at `PLANETS[planet.typeId]` access or document the changed semantics [PlanetAuraRenderer.jsx:123]
- [ ] [AI-Review][LOW] `SILVER_COLOR` / `GOLD_COLOR` / `PLATINUM_COLOR` are now dead config in `GAME_CONFIG.PLANET_AURA`; update `gameConfig.planetAura.test.js` to remove pin on deprecated keys, then remove from `gameConfig.js` [gameConfig.js, gameConfig.planetAura.test.js:35-38]
- [ ] [AI-Review][LOW] `auraStates` Map accumulates stale entries for planets removed on system transition — add cleanup when planets list changes [PlanetAuraRenderer.jsx:16]

## Dev Notes

### Root Cause

`PlanetAuraRenderer.jsx` was written in Story 12.3 (before Epic 34's planet redesign). It used a `tier → config key` indirection: `TIER_COLOR_KEY = { standard: 'SILVER_COLOR', rare: 'GOLD_COLOR', legendary: 'PLATINUM_COLOR' }`. After Epic 34 introduced CINDER/PULSE/VOID planet types with their own colors in `planetDefs.js`, the tier-based color mapping became misaligned — CINDER is brown, not grey; PULSE is blue, not gold; VOID is purple, not cyan.

### Exact Code Change

**File:** `src/renderers/PlanetAuraRenderer.jsx`

**Remove lines 11–15 entirely:**
```js
// DELETE THIS BLOCK:
const TIER_COLOR_KEY = {
  standard:  'SILVER_COLOR',
  rare:      'GOLD_COLOR',
  legendary: 'PLATINUM_COLOR',
}
```

**Replace lines 125–128 (current):**
```js
const colorKey = planet.scanned && cfg.SHOW_COMPLETED_AURA
  ? 'COMPLETED_COLOR'
  : TIER_COLOR_KEY[planet.tier]
tempColor.set(cfg[colorKey] || '#ffffff')
```

**With (new):**
```js
const color = planet.scanned && cfg.SHOW_COMPLETED_AURA
  ? cfg.COMPLETED_COLOR
  : PLANETS[planet.typeId].color
tempColor.set(color || '#ffffff')
```

### Why `PLANETS` import is already available

`PLANETS` is imported at line 7 of `PlanetAuraRenderer.jsx`:
```js
import { PLANETS } from '../entities/planetDefs.js'
```
It is already used at line 69 for `PLANETS[planet.typeId].scanRadius`. No new imports needed.

### Why NOT to remove SILVER/GOLD/PLATINUM_COLOR from `GAME_CONFIG.PLANET_AURA`

`src/config/__tests__/gameConfig.planetAura.test.js` has a test at line 35–38:
```js
it('has tier color strings as hex values', () => {
  expect(cfg.SILVER_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
  expect(cfg.GOLD_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
  expect(cfg.PLATINUM_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
})
```
Removing these keys would cause this test to fail. Leave `SILVER_COLOR`, `GOLD_COLOR`, `PLATINUM_COLOR` in `gameConfig.js` — they are now dead config but removing them is a separate cleanup task and would break an existing test. **Do NOT touch `gameConfig.js` or its test.**

### Planet type → color mapping (for QA reference)

| typeId          | tier       | `.color`    | Expected aura visual |
|-----------------|------------|-------------|----------------------|
| `PLANET_CINDER` | standard   | `#a07855`   | Brown/amber          |
| `PLANET_PULSE`  | rare       | `#00b4d8`   | Cyan-blue            |
| `PLANET_VOID`   | legendary  | `#9b5de5`   | Purple               |

Source: `src/entities/planetDefs.js` lines 8, 21, 33.

### Impact on AdditiveBlending brightness simulation

The existing `tempColor.multiplyScalar(s.opacity / maxOpacity)` logic at lines 132–134 remains unchanged. It works on the `THREE.Color` object after `tempColor.set(color)`, regardless of where `color` comes from. No change needed.

### No new files, no store changes

- Only file to touch: `src/renderers/PlanetAuraRenderer.jsx`
- Net change: ~6 lines deleted / modified — a pure cosmetic fix
- No store, no config, no GameLoop changes

### Previous story patterns from Epic 40

Stories 40.1 and 40.2 are both surgical single-file fixes with minimal scope. Same pattern here:
- 40.1: guard check added at top of `useFrame` (DamageNumberRenderer + usePlayerCamera)
- 40.2: one condition extended in `useAudio.jsx`
- 40.3: one constant removed + one expression changed in `PlanetAuraRenderer.jsx`

### Testing approach

`PlanetAuraRenderer` is a pure visual R3F component using `useFrame`. Per project convention (`project-context.md` line 108: "Pas de tests pour les composants visuels purs"), no unit test is added for the renderer itself. The existing `gameConfig.planetAura.test.js` tests config structure only — it must continue to pass without modification.

### Project Structure Notes

- Architecture layer: **Rendering** (`src/renderers/`) — no cross-layer changes
- Data flow: `useLevel.getState().planets` → `planet.typeId` → `PLANETS[planet.typeId].color` → `tempColor.set()`
- Consistent with how `scanRadius` is already read: `PLANETS[planet.typeId].scanRadius` at line 69 and 113

### References

- Epic 40 context: `_bmad-output/planning-artifacts/epic-40-bugfixes-pause-music-aura.md#Story-40.3`
- PlanetAuraRenderer source: `src/renderers/PlanetAuraRenderer.jsx` (Story 12.3)
- Planet definitions: `src/entities/planetDefs.js` (Epic 34.1 redesign introduced current colors)
- Config (keep untouched): `src/config/gameConfig.js` lines 279–291
- Config test (must pass): `src/config/__tests__/gameConfig.planetAura.test.js`
- Planet store: `src/stores/useLevel.jsx` (provides `planets` array with `typeId` field)
- Previous story 40.1: `_bmad-output/implementation-artifacts/40-1-fix-damage-numbers-camera-shake-during-pause.md`
- Previous story 40.2: `_bmad-output/implementation-artifacts/40-2-fix-gameplay-music-not-restarting-after-retry.md`
- Project context: `_bmad-output/planning-artifacts/project-context.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Removed `TIER_COLOR_KEY` constant (5 lines) from `PlanetAuraRenderer.jsx` — this was the only cause of the mismatch between aura and planet colors post-Epic 34.
- Replaced `cfg[colorKey]` string-indirection with direct `cfg.COMPLETED_COLOR` (completed branch) and `PLANETS[planet.typeId].color` (active branch).
- `PLANETS` import was already present and used for `scanRadius` — zero new imports needed.
- `SILVER_COLOR`/`GOLD_COLOR`/`PLATINUM_COLOR` left in `gameConfig.js` (dead config) to avoid breaking `gameConfig.planetAura.test.js`.
- All 10 tests pass in `gameConfig.planetAura.test.js` and `useLevel.planets.test.js` — no regressions.

### File List

- `src/renderers/PlanetAuraRenderer.jsx`

## Change Log

- 2026-02-23: Removed `TIER_COLOR_KEY` tier→config-key indirection; replaced with direct `PLANETS[planet.typeId].color` lookup in `PlanetAuraRenderer.jsx`. Aura now matches planet visual color (CINDER=brown, PULSE=cyan-blue, VOID=purple). No config or store changes required.
