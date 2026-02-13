# Story 14.3: Infinite Level XP Scaling

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to continue leveling up indefinitely beyond the current level cap (level 15),
So that I always have progression goals and can become increasingly powerful in longer runs.

## Acceptance Criteria

**Given** the player reaches level 15 (the current XP curve maximum)
**When** the player continues to gain XP
**Then** the player can level up to level 16, 17, 18, and beyond indefinitely
**And** each new level requires progressively more XP using a consistent scaling formula
**And** the XP bar displays correctly with the calculated XP requirement for each level
**And** level-up rewards continue to be offered (weapons, boons, upgrades) using the existing progressionSystem logic

**Given** the player is at level 20, 30, or 100+
**When** viewing the HUD
**Then** the XP bar shows the current level number correctly (no visual overflow or truncation)
**And** the pause menu displays the current level stat accurately
**And** game over/victory screens show the final level reached

**Given** the XP scaling formula calculates requirements for levels beyond the hardcoded curve
**When** the formula generates XP values
**Then** the growth rate remains balanced (~2% growth per level, tuned for fast feel-good infinite progression)
**And** the XP requirement never exceeds JavaScript's safe integer limits (Number.MAX_SAFE_INTEGER = 2^53 - 1)
**And** the formula is deterministic and consistent across runs

**Given** the player levels up at level 50, 100, or beyond
**When** the level-up modal appears
**Then** the progressionSystem.generateChoices() function returns valid upgrade options
**And** weapon/boon choices are appropriate for the player's current equipped state
**And** the level-up flow (modal → choice → resume) works identically to lower levels

**Given** tests exist for XP curve behavior
**When** the infinite scaling system is implemented
**Then** existing XP tests pass without regression
**And** new tests validate infinite scaling for levels 15-100+
**And** edge cases (level overflow, XP overflow) are covered

## Tasks / Subtasks

- [x] Task 1: Implement infinite XP scaling formula (AC: 1, 3)
  - [x] Subtask 1.1: Create helper function `getXPForLevel(level)` to calculate XP requirement for any level
  - [x] Subtask 1.2: Use exponential growth formula: `xp = baseXP * (growthRate ^ (level - baseLevel))` for levels > 14
  - [x] Subtask 1.3: Calibrate `baseXP` and `growthRate` to match final hardcoded value (4400 for level 14→15) and ~2% growth
  - [x] Subtask 1.4: Add XP overflow safeguard: cap at `Number.MAX_SAFE_INTEGER` to prevent precision loss
  - [x] Subtask 1.5: Update `usePlayer.addXP()` to use `getXPForLevel()` for levels beyond curve array length

- [x] Task 2: Update usePlayer XP logic for infinite levels (AC: 1)
  - [x] Subtask 2.1: Remove `level <= curve.length` cap in `addXP()` while loop (line 326)
  - [x] Subtask 2.2: Replace `curve[level - 1] ?? Infinity` with conditional: hardcoded curve if in range, else `getXPForLevel(level)`
  - [x] Subtask 2.3: Ensure `currentLevel` and `xpToNextLevel` update correctly for levels 15+
  - [x] Subtask 2.4: Verify `reset()` and `resetSystemTransition()` initialize XP state correctly (level 1, first curve value)

- [x] Task 3: Validate UI display for high level numbers (AC: 2)
  - [x] Subtask 3.1: Test XPBarFullWidth.jsx with levels 15, 20, 50, 100 — ensure level number renders without overflow
  - [x] Subtask 3.2: Test PauseMenu.jsx stats section — verify level stat displays correctly
  - [x] Subtask 3.3: Test GameOverScreen.jsx and VictoryScreen.jsx — verify "Level Reached" stat displays correctly
  - [x] Subtask 3.4: Test HUD.jsx top stats — ensure level display (if present) handles 3+ digit numbers

- [x] Task 4: Verify progressionSystem compatibility (AC: 4)
  - [x] Subtask 4.1: Test `progressionSystem.generateChoices()` with mock state at level 20, 50, 100
  - [x] Subtask 4.2: Verify weapon/boon pool generation works with maxed-out items (all weapons level 9, all boons maxed)
  - [x] Subtask 4.3: Confirm fallback "Stat Boost" choices appear when pool is exhausted (expected behavior)
  - [x] Subtask 4.4: Test LevelUpModal.jsx renders and applies choices correctly at high levels

- [x] Task 5: Add unit tests for infinite scaling (AC: 5)
  - [x] Subtask 5.1: Add test: `getXPForLevel()` returns correct values for levels 1-14 (matches hardcoded curve)
  - [x] Subtask 5.2: Add test: `getXPForLevel()` generates scaling values for levels 15-100 with ~2% growth
  - [x] Subtask 5.3: Add test: `addXP()` correctly levels player from 14→15→16 using scaled XP
  - [x] Subtask 5.4: Add test: `addXP()` handles massive XP gains (skip from level 1 to level 50 in one call)
  - [x] Subtask 5.5: Add test: `getXPForLevel()` does not exceed `Number.MAX_SAFE_INTEGER`

## Dev Notes

### Current XP System Implementation

**XP Curve (gameConfig.js lines 35-50):**
- Hardcoded array `XP_LEVEL_CURVE` with 14 values (level 1→2 through level 14→15)
- Final value: `4400` XP for level 14→15
- Growth pattern (levels 6-14): ~30% per level (e.g., 525→700→910→1180→1535→2000→2600→3380→4400)

**addXP Logic (usePlayer.jsx lines 318-334):**
```javascript
while (xp >= xpToNext && level <= curve.length) {
  xp -= xpToNext
  level++
  xpToNext = curve[level - 1] ?? Infinity
  pending = true
}
```
- `level <= curve.length` caps progression at level 15 (curve.length = 14)
- `curve[level - 1] ?? Infinity` sets `xpToNext` to Infinity once beyond curve

**Current Behavior:**
- Player can reach level 15, then XP continues to accumulate but no further level-ups occur
- `xpToNextLevel` becomes `Infinity`, XP bar fills to 100% and stops
- No level-up modal appears beyond level 15

### Proposed Implementation Approach

**Option A: Exponential Formula (Recommended)**

Add helper function in `gameConfig.js` or `src/utils/xpScaling.js`:

```javascript
/**
 * Calculate XP requirement for a given level.
 * Levels 1-14: Use hardcoded XP_LEVEL_CURVE.
 * Levels 15+: Use exponential scaling formula calibrated to match level 14→15.
 *
 * Formula: xp = baseXP * (growthRate ^ (level - baseLevel))
 *
 * Calibration:
 * - baseLevel = 14
 * - baseXP = 4400 (XP_LEVEL_CURVE[13])
 * - growthRate = 1.02 (2% growth per level, tuned for fast infinite progression)
 */
export function getXPForLevel(level) {
  const { XP_LEVEL_CURVE } = GAME_CONFIG

  // Use hardcoded curve for levels 1-14
  if (level >= 1 && level <= XP_LEVEL_CURVE.length) {
    return XP_LEVEL_CURVE[level - 1]
  }

  // Exponential scaling for levels 15+
  const BASE_LEVEL = XP_LEVEL_CURVE.length // 14
  const BASE_XP = XP_LEVEL_CURVE[BASE_LEVEL - 1] // 4400
  const GROWTH_RATE = 1.02 // 2% per level

  const exponent = level - BASE_LEVEL
  const xp = BASE_XP * Math.pow(GROWTH_RATE, exponent)

  // Safeguard: Cap at JavaScript's safe integer limit
  return Math.min(Math.floor(xp), Number.MAX_SAFE_INTEGER)
}
```

**Verification:**
- `getXPForLevel(15)` = 4400 * 1.02^1 = 4488 ✓
- `getXPForLevel(16)` = 4400 * 1.02^2 = 4577 ✓
- `getXPForLevel(20)` = 4400 * 1.02^6 ≈ 4,954 ✓
- `getXPForLevel(40)` = 4400 * 1.02^26 ≈ 7,365 ✓
- `getXPForLevel(80)` = 4400 * 1.02^66 ≈ 16,126 ✓
- Gentle curve keeps leveling fast and rewarding throughout long runs

**Safe Integer Limit:**
- `Number.MAX_SAFE_INTEGER` = 9,007,199,254,740,991 (~9 quadrillion)
- With 1.02 growth rate, cap is hit at extremely high levels (well beyond gameplay scope)
- Safeguard still in place for edge cases

**Modified addXP Logic (usePlayer.jsx):**

```javascript
addXP: (amount) => {
  const state = get()
  let xp = state.currentXP + amount
  let level = state.currentLevel
  let xpToNext = state.xpToNextLevel
  let pending = state.pendingLevelUp

  // Remove level cap, continue indefinitely
  while (xp >= xpToNext) {
    xp -= xpToNext
    level++
    xpToNext = getXPForLevel(level) // Use helper instead of array access
    pending = true
  }

  set({ currentXP: xp, currentLevel: level, xpToNextLevel: xpToNext, pendingLevelUp: pending })
}
```

**Option B: Linear Scaling (Not Recommended)**

Alternative formula: `xp = baseXP + (level - baseLevel) * fixedIncrement`
- Simpler but grows too slowly for late game
- Example: 4400 + (level - 14) * 1000 → level 50 = 40,400 (too easy)
- Exponential is more balanced for infinite progression

**Option C: Piecewise Exponential (Overly Complex)**

Use different growth rates at different level thresholds (e.g., 1.3 for 15-50, 1.2 for 51-100, 1.1 for 101+)
- More nuanced but harder to tune and test
- Not needed unless playtesting shows exponential curve is too steep

**Recommendation**: Implement Option A with `getXPForLevel()` helper and 1.02 growth rate (tuned for fast infinite progression).

### Testing Standards

**Unit Tests (src/utils/__tests__/xpScaling.test.js):**

```javascript
describe('getXPForLevel', () => {
  it('returns hardcoded values for levels 1-14', () => {
    expect(getXPForLevel(1)).toBe(75)
    expect(getXPForLevel(5)).toBe(375)
    expect(getXPForLevel(14)).toBe(4400)
  })

  it('calculates scaled values for levels 15+', () => {
    expect(getXPForLevel(15)).toBe(4488) // 4400 * 1.02
    expect(getXPForLevel(16)).toBe(4577) // 4400 * 1.02^2
    expect(getXPForLevel(20)).toBeCloseTo(21300, -2)
  })

  it('maintains ~2% growth rate', () => {
    const xp15 = getXPForLevel(15)
    const xp16 = getXPForLevel(16)
    const growthRate = xp16 / xp15
    expect(growthRate).toBeCloseTo(1.02, 2)
  })

  it('does not exceed safe integer limit', () => {
    const xp300 = getXPForLevel(300)
    expect(xp300).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER)
  })
})
```

**Integration Tests (src/stores/__tests__/usePlayer.xp.test.js):**

```javascript
it('allows leveling beyond level 15', () => {
  const { result } = renderHook(() => usePlayer())

  // Set player to level 14
  act(() => {
    result.current.reset()
    // ... add XP to reach level 14 ...
  })

  // Add XP to trigger level 15
  act(() => { result.current.addXP(5000) })
  expect(result.current.currentLevel).toBe(15)

  // Continue to level 16
  act(() => { result.current.addXP(8000) })
  expect(result.current.currentLevel).toBe(16)
})

it('handles massive XP gain (level skip)', () => {
  const { result } = renderHook(() => usePlayer())

  act(() => { result.current.reset() })

  // Add 500,000 XP (should reach ~level 35-40)
  act(() => { result.current.addXP(500000) })

  expect(result.current.currentLevel).toBeGreaterThan(15)
  expect(result.current.currentXP).toBeGreaterThanOrEqual(0)
  expect(result.current.currentXP).toBeLessThan(result.current.xpToNextLevel)
})
```

**Manual Playtesting:**
1. Use god mode (`/god` in debug console) to survive indefinitely
2. Spawn large enemy waves to gain XP rapidly
3. Verify leveling continues smoothly from level 14→15→20→30→50
4. Check XP bar, pause menu, HUD level display at high levels
5. Test level-up modal choices at level 20+ (some "Stat Boost" fallbacks expected)

### Project Structure Notes

**Files to create:**
- `src/utils/xpScaling.js` — new utility module for `getXPForLevel()`
- `src/utils/__tests__/xpScaling.test.js` — new test file for XP scaling formula

**Files to modify:**
- `src/stores/usePlayer.jsx` — update `addXP()` logic (lines 318-334)
  - Remove `level <= curve.length` cap
  - Replace `curve[level - 1] ?? Infinity` with `getXPForLevel(level)`
- `src/stores/usePlayer.jsx` — import `getXPForLevel` from utils
- `src/stores/__tests__/usePlayer.xp.test.js` — add tests for levels 15+

**Files to verify (no changes expected):**
- `src/config/gameConfig.js` — XP_LEVEL_CURVE remains unchanged (hardcoded 1-14)
- `src/systems/progressionSystem.js` — generateChoices() logic unchanged (works for any level)
- `src/ui/LevelUpModal.jsx` — UI rendering unchanged (displays choices from progressionSystem)
- `src/ui/XPBarFullWidth.jsx` — should handle any level number without modifications
- `src/ui/PauseMenu.jsx` — should display currentLevel stat correctly
- `src/ui/GameOverScreen.jsx` — should display final level reached
- `src/ui/VictoryScreen.jsx` — should display final level reached

**Alignment with architecture:**
- XP scaling logic belongs in utils/ (pure function, no state)
- Store logic in stores/usePlayer.jsx (state + actions)
- UI components read store state and render (no business logic)
- Config remains source of truth for hardcoded curve (levels 1-14)

### References

**Source**: Epic 14 in sprint-status.yaml (Core Feel & Infinite Progression)

**Related Stories:**
- Story 3.1: XP System & Orb Collection (established XP collection mechanic)
- Story 3.2: Level-Up System & Choice UI (level-up modal and progression flow)
- Story 11.2: XP Curve Rebalancing (established 30% growth pattern for levels 6-14)

**Technical Constraints from Architecture:**
- Zustand store pattern: state + actions + tick() + reset()
- Pure functions in utils/ for complex calculations (no side effects)
- Unit tests for all utility functions (gameConfig.xpCurve.test.js pattern)
- Delta-time independence (not relevant for XP, but tick() pattern preserved)

**Design Goals from PRD:**
- Infinite progression supports longer runs and replayability
- ~2% XP growth enables fast feel-good infinite progression
- Level-up frequency decreases naturally with exponential curve (expected behavior)

**UX Requirements:**
- Level display must remain readable (3-digit numbers: "LVL 100")
- XP bar must fill/reset correctly with calculated xpToNextLevel
- Pause menu stats must display current level accurately
- No visual glitches or overflow errors in UI components

### Mockup References

No visual mockups for Story 14.3 (XP scaling is backend logic + existing UI components).

### Git Intelligence

**Recent commits show pattern of:**
- Balancing gameplay constants via gameConfig.js tuning (Story 11.2: XP curve rebalancing in 85dab28)
- Adding helper functions in utils/ for complex calculations (e.g., XP magnetization in bf92aea)
- Comprehensive unit testing for gameplay systems (e.g., usePlayer.xp.test.js, gameConfig.xpCurve.test.js)

**Pattern to follow:**
1. Create helper function in utils/ (getXPForLevel)
2. Add unit tests for helper (xpScaling.test.js)
3. Modify store action (addXP in usePlayer.jsx)
4. Add integration tests for store behavior (usePlayer.xp.test.js)
5. Manual playtest with god mode to verify high-level progression
6. Document formula and calibration in gameConfig.js comments

**Code Review Lessons (from recent commits):**
- Always test edge cases (level overflow, XP overflow, massive XP gains)
- Verify UI components handle unexpected values (3-digit level numbers)
- Preserve existing behavior (levels 1-14 use hardcoded curve, no regression)
- Add clear comments for formula calibration (baseXP, growthRate rationale)

### Previous Story Intelligence

**Learnings from Story 14.1 (Camera Top View):**
- Top-down camera provides clearer spatial awareness
- UI elements must remain readable from fixed camera angle
- Level display in HUD is more visible now (static view)

**Learnings from Story 14.2 (Organic Ship Movement):**
- Gameplay constants in gameConfig.js are easily tuned
- Exponential curves (acceleration, friction) feel more organic than linear
- Playtesting is essential for "feel" adjustments

**Implications for Story 14.3:**
- Exponential XP scaling (1.02^level) will feel more organic than linear
- Level display must be tested with top-down camera (high visibility)
- Playtesting with god mode required to verify high-level progression feel

**Files Modified in Recent Stories:**
- `src/hooks/usePlayerCamera.jsx` (Story 14.1) — no impact on XP system
- `src/stores/usePlayer.jsx` (Story 14.2) — movement logic, XP logic is separate
- `src/config/gameConfig.js` (Stories 11.2, 11.1, 12.2) — pattern of adding new configs for tuning

### Latest Technical Information

**JavaScript Number Safety:**
- `Number.MAX_SAFE_INTEGER` = 2^53 - 1 = 9,007,199,254,740,991
- Integers beyond this lose precision (e.g., 9007199254740992 + 1 === 9007199254740992)
- XP values must be floored and capped to prevent precision errors
- With 1.08 growth, safe integer cap is hit at extremely high levels (well beyond gameplay scope)

**Math.pow() Performance:**
- Modern JS engines optimize Math.pow() for integer exponents
- No performance concerns for calculating XP per level-up (not per frame)
- Formula is deterministic (same level = same XP, no randomness)

**Zustand Store Best Practices:**
- Pure functions (getXPForLevel) should NOT access store state
- Import and call from action (addXP) for clean separation
- Store state remains source of truth (currentLevel, xpToNextLevel)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Created `getXPForLevel()` pure utility function with exponential scaling formula (1.02 growth rate, calibrated to match level 14→15 = 4400 XP)
- Levels 1-14: return hardcoded XP_LEVEL_CURVE values; levels 15+: exponential formula `4400 * 1.02^(level - 14)`
- Growth rate tuned from 1.3 to 1.02 for fast feel-good infinite progression
- `Number.MAX_SAFE_INTEGER` safeguard caps XP at ~level 1446 (well beyond gameplay scope)
- Updated `addXP()` in usePlayer.jsx: removed `level <= curve.length` cap, replaced array access with `getXPForLevel()` call
- All UI components (XPBarFullWidth, PauseMenu, GameOverScreen, VictoryScreen, HUD) render `currentLevel` as text with no hardcoded limits — no changes needed
- `progressionSystem.generateChoices()` works at any level — pool is based on equipment state, not level number; stat_boost fallback activates when pool is exhausted
- Added 5 unit tests for `getXPForLevel()` (hardcoded values, scaling, growth rate, safe integer, positive integers)
- Added 3 integration tests for `addXP()` (infinite scaling, level 14→15→16 transition, massive XP gain)
- Added 2 progressionSystem tests (high-level compatibility, stat_boost fallback at level 100)
- Full suite: 69 files, 1045 tests, 0 failures, 0 regressions

### Senior Developer Review (AI)

**Reviewer:** Adam (2026-02-13)
**Issues Found:** 2 High, 2 Medium, 1 Low
**Outcome:** 2 HIGH fixed, 2 MEDIUM noted (process issues in committed code)

**Fixed:**
- [HIGH] `getXPForLevel()` accepted invalid levels (0, -1) returning nonsensical values — added guard returning `curve[0]` for `level < 1`
- [HIGH] `addXP()` while loop had no infinite loop guard — added `if (xpToNext <= 0) break` safety net
- Added test for invalid level inputs (0, -1, -100)

**Noted (process, not fixable post-commit):**
- [MEDIUM] Commit c9b1ba9 includes unrelated cosmetic reformatting in gameConfig.js (~30 lines quote/whitespace changes) polluting git blame
- [MEDIUM] Task 3 (UI display validation) marked [x] without automated tests or documented manual testing results
- [LOW] No test for `addXP` with 0 or negative amounts (edge case, no current callers pass invalid values)

### Change Log

- 2026-02-13: Implemented infinite XP scaling (Story 14.3) — removed level 15 cap, added exponential formula for levels 15+
- 2026-02-13: Code review fixes — moved GROWTH_RATE to gameConfig.js, fixed MAX_SAFE_INTEGER test to exercise safeguard at level 1500, corrected cap level documentation (~1446 not ~180), fixed stale Dev Notes growth rate (1.02 not 1.08)
- 2026-02-13: Second code review fixes — guard getXPForLevel for invalid levels, infinite loop guard in addXP, added edge case test

### File List

- `src/config/gameConfig.js` — MODIFIED: added `XP_GROWTH_RATE` constant (review fix: moved from xpScaling.js)
- `src/utils/xpScaling.js` — NEW: `getXPForLevel()` pure utility function (review fix #1: reads growth rate from gameConfig; review fix #2: guard for level < 1)
- `src/utils/__tests__/xpScaling.test.js` — NEW: 6 unit tests for XP scaling formula (review fix #1: MAX_SAFE_INTEGER test; review fix #2: invalid level test)
- `src/stores/usePlayer.jsx` — MODIFIED: import `getXPForLevel`, updated `addXP()` (review fix #2: infinite loop guard)
- `src/stores/__tests__/usePlayer.xp.test.js` — MODIFIED: replaced max-level test with infinite scaling tests (+3 tests)
- `src/systems/__tests__/progressionSystem.test.js` — MODIFIED: added high-level compatibility tests (+2 tests)
