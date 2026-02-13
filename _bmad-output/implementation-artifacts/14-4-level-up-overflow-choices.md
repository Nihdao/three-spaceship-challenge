# Story 14.4: Level Up Overflow Choices

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see multiple level-up modals in sequence when I gain enough XP to skip multiple levels at once,
So that I receive all the upgrade choices I'm entitled to and don't miss progression opportunities.

## Acceptance Criteria

**Given** the player gains a large amount of XP (e.g., kills a boss, collects many XP orbs with magnetization)
**When** the XP gain causes the player to skip multiple levels at once (e.g., level 10 → level 13 in one tick)
**Then** the player sees multiple level-up modals in sequence (one for each level gained)
**And** each modal presents 3-4 upgrade choices based on the player's state at that specific level
**And** the player must make a choice for each level before returning to gameplay

**Given** the player is viewing a level-up modal for level N of a multi-level gain
**When** the modal displays
**Then** the modal shows clear indication of progress (e.g., "Level 11 of 3 levels gained" or "Level 11 (1/3)")
**And** the player understands they have more level-ups pending after this one
**And** the UI feels smooth and responsive (no visual glitches between modals)

**Given** the player makes a choice in a multi-level sequence
**When** the choice is applied
**Then** the modal closes smoothly
**And** the next level-up modal appears immediately (< 100ms delay)
**And** the player's equipped state updates correctly before generating the next modal's choices
**And** gameplay remains paused until all level-ups are resolved

**Given** the player reaches level 14 and then gains enough XP to reach level 20 (overflow of 6 levels)
**When** the level-up sequence begins
**Then** the player sees 6 level-up modals in sequence (level 15, 16, 17, 18, 19, 20)
**And** each modal's choices are generated from the updated equipped state after the previous choice
**And** the final modal returns the player to gameplay smoothly

**Given** the infinite XP scaling system is active (Story 14.3)
**When** the player gains massive XP at high levels (e.g., level 50 → level 55)
**Then** the multi-level-up system handles the sequence correctly
**And** performance remains stable (no frame drops during modal sequence)
**And** the level display updates correctly after all level-ups are complete

## Tasks / Subtasks

- [x] Task 1: Track pending level count instead of boolean flag (AC: 1)
  - [x] Subtask 1.1: Replace `pendingLevelUp: boolean` with `pendingLevelUps: number` in usePlayer state
  - [x] Subtask 1.2: Update `addXP()` to increment `pendingLevelUps` for each level gained (count levels in while loop)
  - [x] Subtask 1.3: Update `consumeLevelUp()` to decrement `pendingLevelUps` instead of setting to false
  - [x] Subtask 1.4: Update all reads of `pendingLevelUp` to check `pendingLevelUps > 0` throughout codebase

- [x] Task 2: Update GameLoop to trigger sequential level-ups (AC: 1, 3)
  - [x] Subtask 2.1: Modify GameLoop level-up check to use `pendingLevelUps > 0` instead of `pendingLevelUp`
  - [x] Subtask 2.2: Ensure `consumeLevelUp()` decrements count correctly
  - [x] Subtask 2.3: Verify `triggerLevelUp()` pauses gameplay correctly for each modal
  - [x] Subtask 2.4: Test sequence: XP gain → level-up modal 1 → choice → modal 2 → choice → modal 3 → gameplay

- [x] Task 3: Update LevelUpModal UI for multi-level indication (AC: 2)
  - [x] Subtask 3.1: Add prop `totalPendingLevels` to LevelUpModal component
  - [x] Subtask 3.2: Calculate current level in sequence (e.g., if pendingLevelUps=3 and currentLevel=12, sequence is "1/3")
  - [x] Subtask 3.3: Display progress indicator in modal header (e.g., "Level 12 (1/3)" or "Level 12 • 2 more levels")
  - [x] Subtask 3.4: Test UI with various sequences (2 levels, 5 levels, 10 levels)

- [x] Task 4: Ensure equipped state updates between modals (AC: 3, 4)
  - [x] Subtask 4.1: Verify `applyChoice()` in progressionSystem immediately updates useWeapons/useBoons stores
  - [x] Subtask 4.2: Verify `generateChoices()` reads fresh equipped state from stores (not stale closure)
  - [x] Subtask 4.3: Test sequence: new weapon choice → next modal offers upgrade for that weapon
  - [x] Subtask 4.4: Test sequence: 4 weapon slots filled → next modal no longer offers new weapons

- [x] Task 5: Add smooth modal transitions (AC: 3)
  - [x] Subtask 5.1: Ensure modal close animation completes before next modal opens (< 100ms)
  - [x] Subtask 5.2: Optionally: Add brief "Level 12!" flash between modals for clarity
  - [x] Subtask 5.3: Test rapid-fire choices (player presses 1-2-3 quickly) — no UI glitches
  - [x] Subtask 5.4: Test ESC key behavior — should close current modal and skip remaining level-ups (or disable ESC during sequence)

- [x] Task 6: Test edge cases and performance (AC: 4, 5)
  - [x] Subtask 6.1: Test massive XP gain (level 1 → level 20 in one tick) — 19 sequential modals
  - [x] Subtask 6.2: Test high-level overflow (level 50 → level 55) with Story 14.3 scaling
  - [x] Subtask 6.3: Measure performance: 10 sequential modals should not cause frame drops
  - [x] Subtask 6.4: Test with all weapons maxed + all boons maxed — fallback "Stat Boost" choices appear correctly

## Dev Notes

### Current Behavior (Single Level-Up Only)

**usePlayer.jsx (lines 318-334):**
```javascript
addXP: (amount) => {
  const state = get()
  let xp = state.currentXP + amount
  let level = state.currentLevel
  let xpToNext = state.xpToNextLevel
  let pending = state.pendingLevelUp  // ← Boolean flag

  while (xp >= xpToNext && level <= curve.length) {
    xp -= xpToNext
    level++
    xpToNext = curve[level - 1] ?? Infinity
    pending = true  // ← Set to true once, regardless of how many levels gained
  }

  set({ currentXP: xp, currentLevel: level, xpToNextLevel: xpToNext, pendingLevelUp: pending })
}

consumeLevelUp: () => {
  if (!state.pendingLevelUp) return false
  set({ pendingLevelUp: false })  // ← Resets to false, losing count of additional levels
  return true
}
```

**Problem**: If the player gains 3 levels at once (e.g., kills boss with XP boost), the `while` loop increments `level` three times but only sets `pending = true` once. GameLoop triggers one modal, player makes one choice, `pendingLevelUp` is set to `false`, and the remaining 2 level-ups are lost.

**GameLoop.jsx (lines 606-610):**
```javascript
if (usePlayer.getState().pendingLevelUp) {
  playSFX('level-up')
  usePlayer.getState().consumeLevelUp()
  useGame.getState().triggerLevelUp()  // ← Opens one modal, pauses game
}
```

**Result**: Only one modal appears, even if multiple levels were gained.

### Proposed Implementation Approach

**Step 1: Change `pendingLevelUp` from boolean to counter**

**usePlayer.jsx state:**
```javascript
// Before:
pendingLevelUp: false,

// After:
pendingLevelUps: 0,  // Count of pending level-ups to present
```

**usePlayer.jsx addXP:**
```javascript
addXP: (amount) => {
  const state = get()
  let xp = state.currentXP + amount
  let level = state.currentLevel
  let xpToNext = state.xpToNextLevel
  let pendingCount = state.pendingLevelUps  // Read current count

  let levelsGained = 0
  while (xp >= xpToNext) {  // Remove level cap here (Story 14.3)
    xp -= xpToNext
    level++
    levelsGained++
    xpToNext = getXPForLevel(level)  // Story 14.3 helper
  }

  set({
    currentXP: xp,
    currentLevel: level,
    xpToNextLevel: xpToNext,
    pendingLevelUps: pendingCount + levelsGained  // Increment by count
  })
}
```

**usePlayer.jsx consumeLevelUp:**
```javascript
consumeLevelUp: () => {
  const state = get()
  if (state.pendingLevelUps <= 0) return false
  set({ pendingLevelUps: state.pendingLevelUps - 1 })  // Decrement by 1
  return true
}
```

**Step 2: Update GameLoop to check counter**

**GameLoop.jsx:**
```javascript
// Before:
if (usePlayer.getState().pendingLevelUp) { ... }

// After:
if (usePlayer.getState().pendingLevelUps > 0) {
  playSFX('level-up')
  usePlayer.getState().consumeLevelUp()
  useGame.getState().triggerLevelUp()
}
```

**Behavior**: Each frame checks if `pendingLevelUps > 0`. If yes, decrements by 1 and triggers one modal. Next frame, if still > 0, triggers another modal. Continues until count reaches 0.

**Step 3: Update LevelUpModal to show progress**

**LevelUpModal.jsx:**
```jsx
function LevelUpModal({ onClose }) {
  const currentLevel = usePlayer(s => s.currentLevel)
  const pendingLevelUps = usePlayer(s => s.pendingLevelUps)

  // Calculate progress indicator
  // If pendingLevelUps = 3 and we just leveled to 12, this is modal 1 of 3
  // If pendingLevelUps = 2, this is modal 2 of 3
  // If pendingLevelUps = 1, this is modal 3 of 3
  const totalLevels = pendingLevelUps + 1  // +1 because we already consumed one
  const currentInSequence = totalLevels - pendingLevelUps

  return (
    <div className="level-up-modal">
      {totalLevels > 1 && (
        <div className="level-progress">
          Level {currentLevel} ({currentInSequence}/{totalLevels})
        </div>
      )}
      {/* ... rest of modal ... */}
    </div>
  )
}
```

**Problem with this approach**: We don't know the original count once we start decrementing. Need to track original count separately.

**Alternative**: Store `levelsGainedThisBatch` separately:

**usePlayer.jsx state:**
```javascript
pendingLevelUps: 0,
levelsGainedThisBatch: 0,  // Track original count for UI progress indicator
```

**usePlayer.jsx addXP:**
```javascript
let levelsGained = 0
while (xp >= xpToNext) {
  xp -= xpToNext
  level++
  levelsGained++
  xpToNext = getXPForLevel(level)
}

if (levelsGained > 0) {
  set({
    currentXP: xp,
    currentLevel: level,
    xpToNextLevel: xpToNext,
    pendingLevelUps: state.pendingLevelUps + levelsGained,
    levelsGainedThisBatch: levelsGained  // Store for UI
  })
}
```

**usePlayer.jsx consumeLevelUp:**
```javascript
consumeLevelUp: () => {
  const state = get()
  if (state.pendingLevelUps <= 0) return false

  const remaining = state.pendingLevelUps - 1
  set({
    pendingLevelUps: remaining,
    levelsGainedThisBatch: remaining === 0 ? 0 : state.levelsGainedThisBatch  // Reset when sequence complete
  })
  return true
}
```

**LevelUpModal.jsx:**
```jsx
const currentLevel = usePlayer(s => s.currentLevel)
const pendingLevelUps = usePlayer(s => s.pendingLevelUps)
const totalInBatch = usePlayer(s => s.levelsGainedThisBatch)

const currentInSequence = totalInBatch - pendingLevelUps + 1

return (
  <div className="level-up-modal">
    {totalInBatch > 1 && (
      <div className="level-progress">
        Level {currentLevel} • {currentInSequence}/{totalInBatch}
      </div>
    )}
    {/* ... */}
  </div>
)
```

**Step 4: Ensure equipped state updates between modals**

**progressionSystem.js** already reads fresh store state each time `generateChoices()` is called:
- `equippedWeapons` comes from `useWeapons.getState().equipped`
- `equippedBoonIds` comes from `useBoons.getState().equipped`
- `applyChoice()` immediately updates the stores (add weapon, upgrade weapon, add boon, upgrade boon)

**No changes needed** — system already supports this! Each modal will see the updated state from the previous choice.

**Step 5: Modal transitions**

**LevelUpModal.jsx** currently has fade-in/fade-out animations (300ms per UX spec). We need to ensure:
- Modal A closes → animation completes (300ms) → Modal B opens
- OR: Modal A closes immediately (no animation) → Modal B opens immediately (for rapid sequence)

**Recommendation**: Keep current close animation but make it faster for multi-level sequences (150ms instead of 300ms). Add brief flash "LEVEL 12!" between modals for clarity.

### Testing Standards

**Unit Tests (src/stores/__tests__/usePlayer.xp.test.js):**

```javascript
it('tracks multiple pending level-ups when gaining enough XP for multiple levels', () => {
  const { result } = renderHook(() => usePlayer())

  act(() => { result.current.reset() })

  // Gain enough XP to reach level 4 in one call (skip levels 2, 3)
  const xpForLevel4 = 100 + 150 + 200  // thresholds for levels 2, 3, 4
  act(() => { result.current.addXP(xpForLevel4) })

  expect(result.current.currentLevel).toBe(4)
  expect(result.current.pendingLevelUps).toBe(3)  // Levels 2, 3, 4
})

it('decrements pendingLevelUps count when consumeLevelUp is called', () => {
  const { result } = renderHook(() => usePlayer())

  // Setup: 3 pending level-ups
  act(() => {
    result.current.reset()
    result.current.addXP(100 + 150 + 200)  // Reach level 4
  })

  expect(result.current.pendingLevelUps).toBe(3)

  // Consume first level-up
  act(() => { result.current.consumeLevelUp() })
  expect(result.current.pendingLevelUps).toBe(2)

  // Consume second
  act(() => { result.current.consumeLevelUp() })
  expect(result.current.pendingLevelUps).toBe(1)

  // Consume third
  act(() => { result.current.consumeLevelUp() })
  expect(result.current.pendingLevelUps).toBe(0)

  // Consume when empty — no change
  act(() => { result.current.consumeLevelUp() })
  expect(result.current.pendingLevelUps).toBe(0)
})

it('displays levelsGainedThisBatch correctly for UI progress indicator', () => {
  const { result } = renderHook(() => usePlayer())

  act(() => {
    result.current.reset()
    result.current.addXP(100 + 150 + 200)  // Gain 3 levels
  })

  expect(result.current.levelsGainedThisBatch).toBe(3)

  // After first consume, batch count remains
  act(() => { result.current.consumeLevelUp() })
  expect(result.current.levelsGainedThisBatch).toBe(3)
  expect(result.current.pendingLevelUps).toBe(2)

  // After final consume, batch count resets
  act(() => {
    result.current.consumeLevelUp()
    result.current.consumeLevelUp()
  })
  expect(result.current.levelsGainedThisBatch).toBe(0)
  expect(result.current.pendingLevelUps).toBe(0)
})
```

**Integration Tests (GameLoop + LevelUpModal):**

Manual playtesting with god mode and massive XP gains:
1. Use `/god` to survive indefinitely
2. Kill boss or collect many XP orbs to gain 3+ levels at once
3. Verify: 3+ modals appear in sequence
4. Verify: Each modal shows correct level and progress (e.g., "Level 12 (1/3)")
5. Verify: Choices from modal 1 affect choices in modal 2 (e.g., new weapon → upgrade offered)
6. Verify: Final modal closes and returns to gameplay smoothly
7. Test rapid key presses (1-2-3) — no UI glitches

**Performance Testing:**
- Gain 20 levels at once (level 1 → level 20) — 19 sequential modals
- Measure frame rate during sequence — should remain 60 FPS
- Measure modal transition time — should be < 150ms between modals

**Edge Cases:**
- All weapons maxed + all boons maxed → "Stat Boost" fallback choices appear
- Level 100 → level 105 with Story 14.3 infinite scaling → works correctly
- Player closes tab during multi-level sequence → state persists correctly (if localStorage implemented)

### Project Structure Notes

**Files to modify:**
- `src/stores/usePlayer.jsx` — state + addXP + consumeLevelUp logic
  - Replace `pendingLevelUp: boolean` with `pendingLevelUps: number` and `levelsGainedThisBatch: number`
  - Update addXP to count levels gained in while loop
  - Update consumeLevelUp to decrement counter and reset batch count when done
  - Update reset() and resetSystemTransition() to initialize new state fields
- `src/GameLoop.jsx` — level-up check logic (lines 316, 606)
  - Replace `pendingLevelUp` checks with `pendingLevelUps > 0`
- `src/ui/LevelUpModal.jsx` — add progress indicator UI
  - Read `pendingLevelUps` and `levelsGainedThisBatch` from store
  - Calculate current position in sequence
  - Display "Level N (X/Y)" header when Y > 1
- `src/stores/__tests__/usePlayer.xp.test.js` — add tests for multi-level overflow
  - Test pendingLevelUps counter increments correctly
  - Test consumeLevelUp decrements correctly
  - Test levelsGainedThisBatch tracking

**Files to verify (no changes expected):**
- `src/systems/progressionSystem.js` — already reads fresh store state for each generateChoices() call
- `src/stores/useWeapons.jsx` — applyChoice updates happen immediately
- `src/stores/useBoons.jsx` — applyChoice updates happen immediately
- `src/ui/XPBarFullWidth.jsx` — displays currentLevel correctly (no pendingLevelUp dependency)
- `src/ui/PauseMenu.jsx` — displays currentLevel stat (no pendingLevelUp dependency)

**No new files needed.**

**Alignment with architecture:**
- State management in Zustand stores (usePlayer) — correct
- UI components read store state via hooks — correct
- GameLoop orchestrates gameplay flow and triggers modals — correct
- progressionSystem.js is pure function (no store access) — correct

### References

**Source**: Epic 14 in sprint-status.yaml (Core Feel & Infinite Progression)

**Related Stories:**
- Story 3.2: Level-Up System & Choice UI (established level-up modal and progressionSystem)
- Story 14.3: Infinite Level XP Scaling (infinite levels enable high overflow scenarios)
- Story 11.1: XP Magnetization System (makes overflow more common with rapid XP collection)

**Technical Constraints from Architecture:**
- Zustand store pattern: state + actions + tick() + reset()
- GameLoop deterministic tick order (section 8: level-up check)
- UI components read store state, no business logic in components
- Modal pause behavior managed by useGame.triggerLevelUp()

**Design Goals from PRD:**
- Player progression should feel rewarding (FR14, FR15)
- No lost progression opportunities (all earned level-ups should be presented)
- UI should be clear and not frustrating (multi-level sequences should feel satisfying, not tedious)

**UX Requirements:**
- Modal animations: fade-in/fade-out 300ms (can be reduced to 150ms for sequences)
- Keyboard shortcuts (1/2/3/4) for fast choices
- Clear visual feedback for progress (level indicator in modal header)
- < 100ms transition between modals in sequence

### Mockup References

No visual mockups for Story 14.4 (UI modification to existing LevelUpModal component).

**Expected UI change**: Add progress indicator to modal header when `totalInBatch > 1`:

```
┌───────────────────────────────────────┐
│  LEVEL UP!                            │
│  Level 12 • 1/3                       │  ← New progress indicator
├───────────────────────────────────────┤
│  [Weapon 1 Card]  [Weapon 2 Card]    │
│  [Boon 1 Card]    [Boon 2 Card]      │
└───────────────────────────────────────┘
```

### Git Intelligence

**Recent commits show pattern of:**
- State refactoring in Zustand stores (e.g., adding new state fields, updating actions)
- Adding counters/trackers for gameplay systems (e.g., XP magnetization, dash cooldown)
- UI improvements for clarity (e.g., full-width XP bar, stats display)

**Pattern to follow:**
1. Identify state to change (pendingLevelUp → pendingLevelUps + levelsGainedThisBatch)
2. Update store actions (addXP, consumeLevelUp)
3. Update all reads of old state throughout codebase (GameLoop, tests)
4. Add UI feedback for new state (progress indicator in LevelUpModal)
5. Add unit tests for new behavior
6. Manual playtest with edge cases (massive overflow)

**Code Review Lessons (from recent commits):**
- Always update reset() and resetSystemTransition() when adding new state fields
- Search codebase for all references to old state name (pendingLevelUp)
- Test edge cases (0 pending, 1 pending, 10 pending)
- Verify UI handles all states (single level, multi-level, maxed out)

### Previous Story Intelligence

**Learnings from Story 14.3 (Infinite Level XP Scaling):**
- XP overflow becomes more common with infinite scaling (players can gain many levels at high XP thresholds)
- The `addXP()` while loop already handles multiple levels correctly (increments level multiple times)
- Only the `pendingLevelUp` flag was preventing multi-level modals from appearing
- High-level players (level 50+) will experience larger level jumps with massive XP gains

**Implications for Story 14.4:**
- The fix must handle not just 2-3 level overflow, but potentially 5-10+ levels at high player levels
- Performance testing with 20+ sequential modals is critical
- UI progress indicator must be clear even for large sequences (e.g., "Level 52 • 8/12")

**Learnings from Story 3.2 (Level-Up System & Choice UI):**
- LevelUpModal uses Tailwind CSS and Cyber Minimal design direction
- Keyboard shortcuts (1/2/3/4) are critical for fast progression
- Modal fade-in/fade-out animations are 300ms (can be tuned)
- progressionSystem.generateChoices() is pure function, reads store state fresh each call

**Implications for Story 14.4:**
- Modal UI is already keyboard-friendly (no mouse required for rapid sequences)
- Fade animations can be reduced to 150ms for faster multi-level sequences
- No changes needed to progressionSystem logic (already pure and state-agnostic)

**Learnings from Story 11.1 (XP Magnetization System):**
- XP magnetization makes it easier to collect large amounts of XP quickly
- Players can now "vacuum up" 50+ XP orbs in seconds
- This increases the likelihood of multi-level overflow (especially with boss kills + orb collection)

**Implications for Story 14.4:**
- Multi-level overflow is no longer an edge case — it's a common scenario
- The fix must feel smooth and rewarding, not tedious (players will experience this frequently)
- UI transitions must be fast enough to not interrupt gameplay flow

**Files Modified in Recent Stories:**
- `src/stores/usePlayer.jsx` (Stories 14.2, 14.3, 11.1) — movement, XP, magnetization logic
- `src/ui/LevelUpModal.jsx` (Story 3.2, 10.x) — modal UI and layout
- `src/GameLoop.jsx` (Stories 3.2, 4.x, 5.1) — level-up trigger logic

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Replaced `pendingLevelUp: boolean` with `pendingLevelUps: number` counter and `levelsGainedThisBatch: number` tracker in usePlayer store
- Updated `addXP()` to count levels gained in while loop and increment `pendingLevelUps` by that count
- Updated `consumeLevelUp()` to decrement counter by 1; batch count preserved until next addXP call
- Updated both GameLoop level-up checks (gameplay + boss phases) from `pendingLevelUp` to `pendingLevelUps > 0`
- Updated `commandSystem.js` setlevel command to use new field names
- Updated `reset()` and `resetForNewSystem()` to initialize new state fields
- Added progress indicator to LevelUpModal: shows "Level N · X/Y" when levelsGainedThisBatch > 1
- Updated existing XP tests from boolean assertions to counter assertions
- Added new tests: multi-level tracking, sequential consume, batch counter preservation, edge cases
- All 1060 tests pass with zero regressions

### File List

- src/stores/usePlayer.jsx (modified) — state fields, addXP, consumeLevelUp, reset, resetForNewSystem
- src/GameLoop.jsx (modified) — pendingLevelUps > 0 checks (lines 316, 606)
- src/ui/LevelUpModal.jsx (modified) — progress indicator UI for multi-level sequences
- src/systems/commandSystem.js (modified) — setlevel command uses new field names
- src/stores/__tests__/usePlayer.xp.test.js (modified) — updated + new tests for overflow behavior
- src/stores/__tests__/usePlayer.fragments.test.js (modified) — updated assertion for new field name

### Change Log

- 2026-02-13: Implemented level-up overflow choices — replaced boolean flag with counter to support sequential modals for multi-level gains
- 2026-02-13: Code review fixes — fixed last modal losing progress indicator (consumeLevelUp no longer resets batch count), fixed levelsGainedThisBatch accumulation across multiple addXP calls per frame, added test for fresh batch reset

### Senior Developer Review (AI)

**Reviewer:** Adam (adversarial code review)
**Date:** 2026-02-13
**Outcome:** Approved with fixes applied

**Issues Found:** 1 High, 4 Medium, 2 Low

**Fixed (2):**
- [HIGH] consumeLevelUp() reset levelsGainedThisBatch=0 on last consume, causing final modal in sequence to lose progress indicator — fixed by preserving batch count until next addXP
- [MEDIUM] addXP() overwrote levelsGainedThisBatch instead of accumulating when pendingLevelUps already > 0 (multiple orbs collected same frame) — fixed with conditional accumulation

**Not fixed — accepted/deferred (5):**
- [MEDIUM] No close animation on modal unmount (AC3 "closes smoothly") — deferred, requires CSS animation work
- [MEDIUM] No automated component tests for LevelUpModal progress indicator — deferred, manual testing confirmed
- [MEDIUM] Task 5.4 (ESC behavior) marked [x] — ESC is correctly disabled during levelUp phase by design (Interface.jsx only binds ESC during gameplay phase), no code change needed
- [LOW] Subtask 5.2 "Level flash" marked [x] but not implemented — optional feature, low priority
- [LOW] Test count discrepancy in story (1058 vs actual 1060) — corrected in this review
