# Story 44.4: Drop Scatter Anti-Overlap

Status: done

## Story

As a player,
I want collectibles dropped by a dying enemy to be slightly offset from each other,
So that I can clearly see each individual item and distinguish what dropped.

## Acceptance Criteria

1. **Given** `src/systems/lootSystem.js` — `rollDrops(enemyTypeId, x, z, enemyInstance)`
   **When** an enemy dies and triggers multiple drops (XP + heal + fragment for example)
   **Then** each drop is spawned at a position slightly offset from (x, z)
   **And** the offset is radial and unique per drop: `angle = dropIndex * 2.094` (120° = golden-ish separation) + `jitter = (Math.random() - 0.5) * 0.4`
   **And** the scatter radius is `0.6 + Math.random() * 0.4` (between 0.6 and 1.0 units from center)
   **And** the formulas are: `sx = x + Math.cos(angle + jitter) * radius; sz = z + Math.sin(angle + jitter) * radius`

2. **Given** the XP drop (standard or rare)
   **When** it is spawned in `rollDrops()`
   **Then** it is also scattered (no exception for the XP drop that was at exact (x, z))
   **And** the XP drop index is `0` (first in the scatter sequence)

3. **Given** the XP drop (standard or rare)
   **When** it is spawned in `rollDrops()`
   **Then** it is spawned at the scattered position: `spawnOrb(sx, sz, ...)` and not `spawnOrb(x, z, ...)`

4. **Given** the registry loop in `rollDrops()`
   **When** registry items (HEAL_GEM, FRAGMENT_GEM, etc.) are spawned
   **Then** each registry item increments a shared `dropIndex` counter (XP = 0, first registry item = 1, second = 2, etc.)
   **And** `config.spawnFn(sx, sz)` uses the scattered coordinates

5. **Given** an enemy that only drops XP (no heal or fragment)
   **When** the single drop is the XP orb
   **Then** scatter still applies (dropIndex=0 gives a slight random variation)
   **And** the offset is minimal for a single drop (`radius * cos/sin` with `dropIndex=0` gives a random offset of 0.6–1.0 units)

6. **Given** `vitest run`
   **When** the story is implemented
   **Then** all tests pass — existing lootSystem tests must be updated to accept scattered positions

## Tasks / Subtasks

- [x] Add `_scatterPos()` helper function to `lootSystem.js` (AC: #1)
  - [x] Function signature: `function _scatterPos(x, z, index) { ... }`
  - [x] Angle: `index * 2.094 + (Math.random() - 0.5) * 0.4`
  - [x] Radius: `0.6 + Math.random() * 0.4`
  - [x] Returns `[x + Math.cos(angle) * r, z + Math.sin(angle) * r]`
- [x] Modify `rollDrops()` to use scatter for XP drop (AC: #2, #3)
  - [x] Initialize `let dropIdx = 0` before XP drop block
  - [x] Replace `spawnOrb(x, z, ...)` with `const [sx, sz] = _scatterPos(x, z, dropIdx++); spawnOrb(sx, sz, ...)`
  - [x] Applies to both rare and standard XP orb paths
- [x] Modify `rollDrops()` registry loop to use scatter (AC: #4)
  - [x] Replace `config.spawnFn(x, z)` with `const [sx, sz] = _scatterPos(x, z, dropIdx++); config.spawnFn(sx, sz)`
- [x] Update `lootSystem.test.js` to handle scattered positions (AC: #6)
  - [x] Replace exact position checks `(10, 20, ...)` with `(expect.any(Number), expect.any(Number), ...)` for all spawnOrb/spawnHealGem/spawnGem spy assertions
  - [x] Add extra `mockReturnValueOnce` values to Math.random mock sequences to account for 2 additional calls per `_scatterPos` invocation

## Dev Notes

### Implementation: `_scatterPos` helper

Add this pure local function (not exported) at the top of `lootSystem.js`, before `rollDrops`:

```js
function _scatterPos(x, z, index) {
  const angle = index * 2.094 + (Math.random() - 0.5) * 0.4
  const r = 0.6 + Math.random() * 0.4
  return [x + Math.cos(angle) * r, z + Math.sin(angle) * r]
}
```

`2.094` radians ≈ 120° — for 3 drops (XP + heal + fragment), this creates a regular equilateral triangle distribution.

### Modified `rollDrops()` structure

Current pattern (lines 39–69 in `src/systems/lootSystem.js`):
```js
export function rollDrops(enemyTypeId, x, z, enemyInstance = null) {
  // ...
  if (xpReward > 0) {
    const isRare = Math.random() < ...
    if (isRare) {
      spawnOrb(x, z, ...)     // ← change to sx, sz
    } else {
      spawnOrb(x, z, ...)     // ← change to sx, sz
    }
  }

  for (const [lootId, config] of _registry) {
    // ...
    if (Math.random() < dropChance) {
      config.spawnFn(x, z)    // ← change to sx, sz
    }
  }
}
```

Target pattern:
```js
export function rollDrops(enemyTypeId, x, z, enemyInstance = null) {
  const enemyDef = ENEMIES[enemyTypeId]
  const xpReward = enemyDef?.xpReward ?? 0
  const luckBonus = usePlayer.getState().permanentUpgradeBonuses.luck

  let dropIdx = 0  // ← NEW: shared scatter index

  if (xpReward > 0) {
    const isRare = Math.random() < Math.min(1.0, GAME_CONFIG.RARE_XP_GEM_DROP_CHANCE + luckBonus)
    const [sx, sz] = _scatterPos(x, z, dropIdx++)  // ← NEW
    if (isRare) {
      spawnOrb(sx, sz, xpReward * GAME_CONFIG.RARE_XP_GEM_MULTIPLIER, true)
    } else {
      spawnOrb(sx, sz, xpReward, false)
    }
  }

  for (const [lootId, config] of _registry) {
    const baseDropChance = enemyInstance?.dropOverrides?.[lootId] ?? GAME_CONFIG[config.dropChanceKey]
    const dropChance = Math.min(1.0, baseDropChance + luckBonus)
    if (Math.random() < dropChance) {
      const [sx, sz] = _scatterPos(x, z, dropIdx++)  // ← NEW
      config.spawnFn(sx, sz)
    }
  }
}
```

### Critical: Test updates required in `lootSystem.test.js`

**Problem 1 — Position checks will fail:**
All spy assertions that check exact positions must be updated:

```js
// BEFORE (will fail):
expect(spawnOrbSpy).toHaveBeenCalledWith(10, 20, expectedXP, false)
expect(spawnHealGemSpy).toHaveBeenCalledWith(10, 20, GAME_CONFIG.HEAL_GEM_RESTORE_AMOUNT)
expect(spawnGemSpy).toHaveBeenCalledWith(10, 20, GAME_CONFIG.FRAGMENT_DROP_AMOUNT)

// AFTER (correct):
expect(spawnOrbSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expectedXP, false)
expect(spawnHealGemSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), GAME_CONFIG.HEAL_GEM_RESTORE_AMOUNT)
expect(spawnGemSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), GAME_CONFIG.FRAGMENT_DROP_AMOUNT)
```

**Problem 2 — Math.random mock sequence disruption:**
`_scatterPos` consumes 2 additional `Math.random()` calls per invocation. The current mock sequences will produce wrong drop rolls if not updated.

Order of `Math.random()` calls per `rollDrops` when XP + HEAL_GEM + FRAGMENT_GEM all triggered:
1. Rare XP roll (`Math.random() < RARE_XP_GEM_DROP_CHANCE`)
2. `_scatterPos` jitter (XP drop, index=0)
3. `_scatterPos` radius (XP drop, index=0)
4. HEAL_GEM drop roll
5. `_scatterPos` jitter (HEAL_GEM, index=1) — **only if roll succeeds**
6. `_scatterPos` radius (HEAL_GEM, index=1) — **only if roll succeeds**
7. FRAGMENT_GEM drop roll
8. `_scatterPos` jitter (FRAGMENT_GEM, index=2) — **only if roll succeeds**
9. `_scatterPos` radius (FRAGMENT_GEM, index=2) — **only if roll succeeds**

**Note:** `_scatterPos` is only called when the drop actually happens (it's inside the `if` block for registry, and always for XP since XP always drops). So scatter is called after each successful drop decision, not before.

For tests that mock all rolls to succeed (`mockReturnValue(0.01)`), the scatter calls will also return `0.01` which is fine (it's a fixed offset). For tests with `mockReturnValueOnce` sequences, add enough dummy values:

```js
// Example: test where rare XP succeeds, heal and fragment also succeed
vi.spyOn(Math, 'random')
  .mockReturnValueOnce(0.01)  // Rare XP roll → succeeds
  .mockReturnValueOnce(0.5)   // _scatterPos jitter (XP)
  .mockReturnValueOnce(0.5)   // _scatterPos radius (XP)
  .mockReturnValueOnce(0.01)  // Heal gem roll → succeeds
  .mockReturnValueOnce(0.5)   // _scatterPos jitter (heal)
  .mockReturnValueOnce(0.5)   // _scatterPos radius (heal)
  .mockReturnValueOnce(0.01)  // Fragment roll → succeeds
  .mockReturnValueOnce(0.5)   // _scatterPos jitter (fragment)
  .mockReturnValueOnce(0.5)   // _scatterPos radius (fragment)
```

For tests where only some drops succeed, only add scatter mock values for the drops that actually succeed (scatter is inside the `if`).

**Affected test cases in `lootSystem.test.js`** (file `src/systems/__tests__/lootSystem.test.js`):
- `'always spawns standard XP orb when xpReward > 0 and rare roll fails'` — needs scatter mocks + position fix
- `'spawns rare XP gem (3x value, isRare=true) when rare roll succeeds...'` — needs scatter mocks + position fix
- `'spawns heal gem when heal roll succeeds...'` — needs scatter mocks + position fix
- `'spawns fragment gem when fragment roll succeeds...'` — needs scatter mocks + position fix
- `'can spawn multiple loot types from one enemy death...'` — needs scatter mocks + position fix (all 3)
- `'can spawn both heal and fragment without rare XP'` — needs scatter mocks + position fix
- `'handles unknown enemyTypeId gracefully...'` — needs scatter mocks + position fix
- `'does not spawn XP orb when enemy has 0 xpReward'` — may need heal/fragment scatter mocks
- Per-enemy `dropOverrides` tests — need scatter mocks + position fix

**Tests using `mockReturnValue(0.99)` (all rolls fail, no drops):** These tests check that spawn functions are NOT called. Since drops don't happen, `_scatterPos` is also not called (it's inside the success branch). These tests may not need mock sequence changes, but position assertions still need updating if they check call args.

### No changes outside `lootSystem.js` and `lootSystem.test.js`

Story 44.4 modifies only `lootSystem.js` (production) and `lootSystem.test.js` (tests). No renderer, store, config, or GameLoop changes required.

### Project Structure Notes

- `src/systems/lootSystem.js` — sole production file changed
- `src/systems/__tests__/lootSystem.test.js` — tests to update
- Pattern follows existing architecture: pure system function, no store interaction for the scatter logic itself
- `_scatterPos` is a module-private function (not exported), consistent with `_registry` being module-private

### References

- Story definition: [Source: _bmad-output/planning-artifacts/epic-44-collectibles-overhaul.md#Story 44.4]
- Current `rollDrops` implementation: [Source: src/systems/lootSystem.js#rollDrops]
- Existing tests: [Source: src/systems/__tests__/lootSystem.test.js]
- Architecture pattern (6-layer): [Source: _bmad-output/planning-artifacts/project-context.md#Architecture]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No debug issues encountered. Implementation was straightforward following the dev notes spec.

### Completion Notes List

- Added `_scatterPos(x, z, index)` module-private helper function to `lootSystem.js` before `rollDrops`. Uses `2.094` rad (≈120°) base angle + jitter for equilateral distribution, radius 0.6–1.0 units.
- Modified `rollDrops()`: added `let dropIdx = 0` shared counter; XP scatter called unconditionally (always drops), registry scatter called only inside success branch.
- Updated 9 test cases in `lootSystem.test.js`: replaced exact position checks with `expect.any(Number)` matchers; inserted scatter mock values into `mockReturnValueOnce` sequences for tests that use them. Tests using `mockReturnValue` (fallback) required no sequence changes.
- Pre-existing flaky test in `xpOrbSystem.test.js` (FP precision: `1.6666666666666667 > 1.666666666666667`) was confirmed unrelated to this story — passes in isolation both with and without story changes.
- All 20 lootSystem tests pass ✅.

### File List

- `src/systems/lootSystem.js` — added `_scatterPos()` helper, modified `rollDrops()` scatter logic, pre-allocated `_scatterResult` array
- `src/systems/__tests__/lootSystem.test.js` — updated 9 test cases for scattered positions and mock sequences, added scatter offset verification test, fixed resetAll coverage

## Change Log

- 2026-02-25: Story 44.4 implemented — drop scatter anti-overlap via `_scatterPos` helper in `lootSystem.js`, test suite updated (claude-sonnet-4-6)
- 2026-02-25: Code review fixes (claude-opus-4-6) — [H1] added scatter offset verification test, [M1] added mockReturnValue(0.99) fallback to 3 fragile tests, [M2] added resetRareItems assertion in resetAll test, [L1] pre-allocated _scatterResult array in _scatterPos
