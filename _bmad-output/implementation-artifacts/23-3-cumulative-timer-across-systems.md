# Story 23.3: Cumulative Timer Across Systems

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want remaining time from the current system to carry over to the next system,
So that fast, aggressive play is rewarded with more time in later systems.

## Acceptance Criteria

**Given** the player completes system 1 with remaining time
**When** the system timer had 2 minutes remaining at boss defeat/wormhole entry
**Then** the next system's timer is base duration + 2 minutes (e.g., 10 + 2 = 12 minutes)

**Given** the timer display
**When** in system 2+
**Then** the displayed timer shows the full cumulative time (12:00, not 10:00)
**And** the player understands they have bonus time from efficient previous system play

**Given** the wave system interaction
**When** the timer is longer due to carryover
**Then** the wave phases scale proportionally to the actual system duration
**And** the same percentage-based phase structure applies to the extended time
**And** bonus time effectively extends the "pre-boss" phase or gives more breathing room

**Given** the transition flow
**When** the player enters the tunnel between systems
**Then** the remaining time is stored in the run state (useLevel or similar)
**And** tunnel time does NOT count against the timer (tunnel is a safe zone)
**And** the cumulative timer resumes when the next system starts

## Tasks / Subtasks

- [x] Task 1: Track remaining time when entering tunnel (AC: #4)
  - [x] Add `carriedTime` field to useLevel store (default: 0)
  - [x] When boss defeated and wormhole reactivated, calculate remaining time: `carriedTime = actualSystemDuration - currentTimer`
  - [x] Store carriedTime in useLevel state (persists through tunnel transition)
  - [x] Reset carriedTime to 0 on new game start (not on system advance)

- [x] Task 2: Initialize next system timer with carried time (AC: #1, #2, #4)
  - [x] Modify GameLoop.jsx system entry reset logic (line 90-123)
  - [x] Timer always starts at 0; actual duration extended: `actualSystemDuration = BASE + carriedTime`
  - [x] Calculate actual system duration via `initializeSystemDuration()` action in useLevel
  - [x] Pass actualDuration to spawn system and wave system
  - [x] Clear carriedTime after initializing timer (consumed on system start via initializeSystemDuration)

- [x] Task 3: Update HUD timer display to show cumulative time (AC: #2)
  - [x] Modify src/ui/HUD.jsx timer display
  - [x] Calculate remaining time: `remainingTime = Math.max(0, actualSystemDuration - systemTimer)`
  - [x] Display format: "MM:SS" (existing formatTimer used, already pads correctly)
  - [x] Visual feedback: existing lowTime logic works with cumulative remaining

- [x] Task 4: Integrate cumulative timer with wave system (AC: #3)
  - [x] Wave system already uses percentage-based phases — no changes needed to spawnSystem.js/waveDefs.js
  - [x] timeProgress = elapsedTime / systemTimer (systemTimer param = actualSystemDuration now)
  - [x] Wave phases scale automatically to actual duration (12-min system has same phase %, just longer)
  - [x] Updated GameLoop call to spawnSystem with `useLevel.getState().actualSystemDuration`

- [x] Task 5: Test cumulative timer behavior (AC: #1, #2, #3, #4)
  - [x] Test useLevel: carriedTime defaults to 0 on new game
  - [x] Test useLevel: setCarriedTime stores remaining time
  - [x] Test useLevel: initializeSystemDuration calculates actualDuration = BASE + carried
  - [x] Test useLevel: initializeSystemDuration clears carriedTime after consuming
  - [x] Test useLevel: actualSystemDuration defaults to 600 on new game
  - [x] Test useLevel: reset() clears carriedTime and resets actualSystemDuration
  - [x] Test useLevel: advanceSystem() preserves carriedTime (tunnel safe zone)
  - [x] Test edge cases: 0 carryover, full carryover, multiple systems

## Dev Notes

### Architecture Alignment

This story implements **cumulative timer carryover** where remaining time from system N adds to the base duration of system N+1. Fast play is rewarded with extra time in later systems, creating a strategic tension between survival and efficiency.

**6-Layer Architecture:**
- **Config Layer**: `src/config/gameConfig.js` — SYSTEM_TIMER remains base duration (600 seconds)
- **Stores Layer**: `src/stores/useLevel.jsx` — Add `carriedTime` field to track time carryover
- **Stores Layer**: `src/stores/useGame.jsx` — `systemTimer` remains elapsed time tracker
- **Systems Layer**: `src/systems/spawnSystem.js` — Accept `actualDuration` for wave phase calculation (Story 23.1)
- **GameLoop**: `src/GameLoop.jsx` — Calculate actualDuration, pass to systems, initialize timer with carriedTime
- **UI Layer**: `src/ui/HUD.jsx` — Display cumulative time (actualDuration - currentTimer)

**NOT in this story:**
- Dynamic wave system (Story 23.1 — already implemented)
- Enemy collision physics (Story 23.2 — already implemented)
- Wave profile definitions (Story 23.1 — waveDefs.js already exists)

### Key Source Files

| File | Change | Layer |
|------|--------|-------|
| `src/stores/useLevel.jsx` | Add `carriedTime` field, actions to store/retrieve | Stores |
| `src/GameLoop.jsx` | Calculate actualDuration, initialize timer with carriedTime | GameLoop |
| `src/systems/spawnSystem.js` | Accept `actualDuration` parameter (Story 23.1 integration) | Systems |
| `src/ui/HUD.jsx` | Display cumulative timer (actualDuration - currentTimer) | UI |

**Files to read for context:**
- `src/stores/useGame.jsx` — Timer state (systemTimer, totalElapsedTime)
- `src/config/gameConfig.js` — SYSTEM_TIMER constant (600 seconds)
- `src/systems/waveSystem.js` — Wave phase calculation (if exists from Story 23.1)
- `src/entities/waveDefs.js` — Wave profiles per system (Story 23.1)

### Current Timer System Analysis

**File: `src/stores/useGame.jsx`** (78 lines)

The **authoritative game timer** is `useGame.systemTimer`, NOT `useLevel.systemTimer`. The useLevel.systemTimer field is deprecated/unused.

**Current timer behavior:**
- `systemTimer` starts at 0 when gameplay begins
- Increments each frame: `systemTimer += delta` (line 429 in GameLoop.jsx)
- Checked against SYSTEM_TIMER (600 seconds) for game over (line 431)
- Reset to 0 when advancing systems (line 120 in GameLoop.jsx)

**Wormhole spawn timing:**
- Wormhole spawns at `SYSTEM_TIMER * WORMHOLE_SPAWN_TIMER_THRESHOLD` (0.01 = 6 seconds)
- Wormhole activation → boss fight (in-place, Story 17.4)
- Boss defeat → wormhole reactivated → player enters → tunnel transition

**System transition flow (Story 17.4, 17.6, 18.4):**
1. Boss defeated → wormhole reactivated
2. Player touches wormhole → flash effect → phase change to 'tunnel'
3. Tunnel phase: player chooses upgrades/dilemmas
4. Exit tunnel → advanceSystem() → reset entities → phase = 'systemEntry'
5. SystemEntry cinematic → phase = 'gameplay'
6. GameLoop detects 'tunnel' → 'gameplay' transition → reset timer to 0

**CRITICAL:** The timer reset happens BEFORE the new system starts. We need to inject carriedTime into the reset logic.

### Timer Carryover Implementation

**Step 1: Calculate and store remaining time on boss defeat**

When boss is defeated and wormhole reactivated, calculate remaining time:

```javascript
// In GameLoop.jsx, around line 403 (boss defeat handling)
if (bossState.hp <= 0 && !bossState.defeated) {
  // ... existing boss defeat logic ...

  // NEW: Calculate and store carried time
  const currentTimer = useGame.getState().systemTimer
  const remainingTime = Math.max(0, GAME_CONFIG.SYSTEM_TIMER - currentTimer)
  useLevel.getState().setCarriedTime(remainingTime)

  // ... rest of boss defeat logic ...
}
```

**IMPORTANT:** Store carried time on boss defeat, NOT on wormhole entry. This ensures tunnel time is excluded.

**Step 2: Add carriedTime to useLevel store**

```javascript
// In src/stores/useLevel.jsx
const useLevel = create((set, get) => ({
  // ... existing state ...
  carriedTime: 0, // NEW: Time to carry to next system (seconds)

  // ... existing actions ...

  // NEW: Actions for cumulative timer
  setCarriedTime: (time) => set({ carriedTime: time }),
  consumeCarriedTime: () => {
    const carried = get().carriedTime
    set({ carriedTime: 0 })
    return carried
  },

  reset: () => set({
    currentSystem: 1,
    systemTimer: 0, // Deprecated field, kept for compatibility
    difficulty: 1,
    planets: [],
    wormholeState: 'hidden',
    wormhole: null,
    wormholeActivationTimer: 0,
    activeScanPlanetId: null,
    carriedTime: 0, // NEW: Reset carried time on new game
  }),
}))
```

**IMPORTANT:** `carriedTime` resets to 0 on new game start (`reset()`), NOT on `advanceSystem()`. Carried time persists through tunnel transition.

**Step 3: Initialize next system timer with carried time**

Modify GameLoop.jsx system entry reset logic (around line 90-123):

```javascript
// Clear residual entities when entering from tunnel (new system)
if ((phase === 'gameplay' || phase === 'systemEntry') && prevPhaseRef.current === 'tunnel') {
  // ... existing entity reset logic ...

  // Accumulate elapsed time before resetting (for total run time display)
  const prevSystemTime = useGame.getState().systemTimer
  if (prevSystemTime > 0) useGame.getState().accumulateTime(prevSystemTime)

  // NEW: Initialize timer with carried time (not 0)
  const carriedTime = useLevel.getState().consumeCarriedTime()
  useGame.getState().setSystemTimer(carriedTime)

  // ... rest of reset logic ...
}
```

**CRITICAL:** Use `consumeCarriedTime()` which returns carried time AND resets it to 0 (consumed on use).

**Step 4: Calculate actual system duration**

The actual duration of the current system is `BASE_SYSTEM_TIMER + carriedTime`. This value is used for:
- Wave phase percentage calculation (timeProgress = elapsedTime / actualDuration)
- Timer display (remaining = actualDuration - currentTimer)
- Game over check (currentTimer >= actualDuration)

```javascript
// In GameLoop.jsx, calculate actualDuration early in gameplay tick
const baseSystemDuration = GAME_CONFIG.SYSTEM_TIMER
const currentTimer = useGame.getState().systemTimer
const currentSystem = useLevel.getState().currentSystem

// Calculate actual duration for this system (base + carried time from previous system)
// For system 1: actualDuration = 600 + 0 = 600 seconds
// For system 2+: actualDuration = 600 + carriedTime = e.g., 600 + 120 = 720 seconds
const carriedTimeAtStart = currentSystem === 1 ? 0 : (currentTimer === 0 ? 0 : 0) // Carried time already consumed and added to timer
// SIMPLIFIED: actualDuration is SYSTEM_TIMER if first system, otherwise we need to track it
// BETTER APPROACH: Store actualDuration in useLevel when system starts

// Actually, we need a cleaner approach: store actualDuration in useLevel on system entry
```

**REVISED APPROACH: Store actualDuration in useLevel**

Instead of recalculating actualDuration every frame, store it when the system starts:

```javascript
// In src/stores/useLevel.jsx
const useLevel = create((set, get) => ({
  // ... existing state ...
  carriedTime: 0,
  actualSystemDuration: 600, // NEW: Actual duration for current system (base + carried)

  initializeSystemDuration: () => {
    const carried = get().carriedTime
    const actualDuration = GAME_CONFIG.SYSTEM_TIMER + carried
    set({ actualSystemDuration: actualDuration })
  },

  consumeCarriedTime: () => {
    const carried = get().carriedTime
    set({ carriedTime: 0 })
    return carried
  },

  advanceSystem: () => set(state => ({
    currentSystem: Math.min(state.currentSystem + 1, GAME_CONFIG.MAX_SYSTEMS),
    systemTimer: 0, // Deprecated
    difficulty: 1,
    planets: [],
    wormholeState: 'hidden',
    wormhole: null,
    wormholeActivationTimer: 0,
    activeScanPlanetId: null,
    // carriedTime persists through advanceSystem (consumed on next system entry)
    // actualSystemDuration will be recalculated on next system entry
  })),

  reset: () => set({
    currentSystem: 1,
    systemTimer: 0,
    difficulty: 1,
    planets: [],
    wormholeState: 'hidden',
    wormhole: null,
    wormholeActivationTimer: 0,
    activeScanPlanetId: null,
    carriedTime: 0,
    actualSystemDuration: 600, // Reset to base duration
  }),
}))
```

**In GameLoop.jsx system entry:**

```javascript
if ((phase === 'gameplay' || phase === 'systemEntry') && prevPhaseRef.current === 'tunnel') {
  // ... existing reset logic ...

  // NEW: Initialize system duration with carried time
  const carriedTime = useLevel.getState().consumeCarriedTime()
  useLevel.getState().initializeSystemDuration() // Sets actualSystemDuration = BASE + carried
  useGame.getState().setSystemTimer(carriedTime) // Timer starts at carried time

  // ... rest of reset logic ...
}
```

**WAIT:** This is confusing. Let me simplify.

**SIMPLIFIED APPROACH:**

1. **Store carried time on boss defeat**: `remainingTime = SYSTEM_TIMER - currentTimer`
2. **Initialize timer with carried time on system entry**: `setSystemTimer(carriedTime)`
3. **Calculate actual duration**: `actualDuration = SYSTEM_TIMER + carriedTime`
4. **Use actualDuration for checks**: Game over when `currentTimer >= actualDuration`

But the issue is: once we start the timer at carriedTime, we lose track of the actual duration. We need to store it.

**FINAL APPROACH:**

```javascript
// useLevel.jsx
carriedTime: 0, // Time carried from previous system
actualSystemDuration: 600, // Actual duration for current system (base + carried)

initializeSystemDuration: () => {
  const carried = get().carriedTime
  const actualDuration = GAME_CONFIG.SYSTEM_TIMER + carried
  set({ actualSystemDuration: actualDuration, carriedTime: 0 }) // Consume carried time
},
```

```javascript
// GameLoop.jsx system entry
const carriedTime = useLevel.getState().carriedTime
useLevel.getState().initializeSystemDuration() // Sets actualSystemDuration, clears carriedTime
useGame.getState().setSystemTimer(0) // Timer always starts at 0
```

**WAIT NO.** The timer should start at 0 and count UP to actualDuration. The carried time is ADDED to the duration, not to the starting time.

Let me re-read the requirements:

> **Given** the player completes system 1 with remaining time
> **When** the system timer had 2 minutes remaining at boss defeat/wormhole entry
> **Then** the next system's timer is base duration + 2 minutes (e.g., 10 + 2 = 12 minutes)

So the DURATION is extended, not the starting time. The timer always counts from 0:00 upward.

**CORRECT APPROACH:**

1. Timer always starts at 0
2. Actual duration = BASE_SYSTEM_TIMER + carriedTime
3. Game over when currentTimer >= actualDuration
4. Wormhole spawns at actualDuration * WORMHOLE_SPAWN_TIMER_THRESHOLD
5. Display: shows (actualDuration - currentTimer) as countdown

This makes more sense!

### Corrected Implementation Plan

**Step 1: Calculate remaining time on boss defeat**

```javascript
// GameLoop.jsx, boss defeat handling (~line 403)
if (bossState.hp <= 0 && !bossState.defeated) {
  // ... existing boss defeat logic ...

  // NEW: Calculate and store carried time
  const currentTimer = useGame.getState().systemTimer
  const actualDuration = useLevel.getState().actualSystemDuration
  const remainingTime = Math.max(0, actualDuration - currentTimer)
  useLevel.getState().setCarriedTime(remainingTime)

  // ... rest of boss defeat logic ...
}
```

**Step 2: Initialize system duration on system entry**

```javascript
// GameLoop.jsx, system entry from tunnel (~line 90)
if ((phase === 'gameplay' || phase === 'systemEntry') && prevPhaseRef.current === 'tunnel') {
  // ... existing reset logic ...

  // NEW: Initialize actual system duration with carried time
  useLevel.getState().initializeSystemDuration()

  // Timer always starts at 0 (not changed)
  useGame.getState().setSystemTimer(0)

  // ... rest of reset logic ...
}
```

**Step 3: Update game over check**

```javascript
// GameLoop.jsx, timer check (~line 431)
const actualDuration = useLevel.getState().actualSystemDuration
if (newTimer >= actualDuration) { // Changed from GAME_CONFIG.SYSTEM_TIMER
  if (wormholeStatePre !== 'activating' && wormholeStatePre !== 'active') {
    // ... game over logic ...
  }
}
```

**Step 4: Update wormhole spawn check**

```javascript
// GameLoop.jsx, wormhole spawn (~line 449)
const actualDuration = useLevel.getState().actualSystemDuration
if (newTimer >= actualDuration * GAME_CONFIG.WORMHOLE_SPAWN_TIMER_THRESHOLD) {
  useLevel.getState().spawnWormhole(playerPos[0], playerPos[2])
  playSFX('wormhole-spawn')
}
```

### Wave System Integration (Story 23.1)

The wave system (Story 23.1) uses percentage-based phases. With cumulative timer, the phase percentages scale to the actual duration.

**Example:**
- System 1: 10 minutes base = 600 seconds
  - Phase 1 (0-20%): 0-120 seconds
  - Phase 2 (20-35%): 120-210 seconds
  - ...
- System 2 with 2 minutes carried: 12 minutes total = 720 seconds
  - Phase 1 (0-20%): 0-144 seconds (24 seconds longer)
  - Phase 2 (20-35%): 144-252 seconds (30 seconds longer)
  - ...

**Current wave system implementation (Story 23.1):**

```javascript
// spawnSystem.js (Story 23.1)
const timeProgress = elapsedTime / systemTimer // Percentage 0.0-1.0
const phase = getPhaseForProgress(systemNum, timeProgress)
```

**What needs to change:**

The `systemTimer` parameter passed to `spawnSystem.tick()` should be the **actualDuration**, not the constant SYSTEM_TIMER.

**In GameLoop.jsx (Section 5: Enemy spawning):**

```javascript
// Current (Story 23.1):
const systemNum = useLevel.getState().currentSystem
const systemTimer = GAME_CONFIG.SYSTEM_TIMER
const spawnInstructions = spawnSystem.tick(delta, playerX, playerZ, {
  systemNum,
  systemTimer,
  systemScaling,
  curse,
})

// UPDATED (Story 23.3):
const systemNum = useLevel.getState().currentSystem
const actualDuration = useLevel.getState().actualSystemDuration // NEW: Use actual duration
const spawnInstructions = spawnSystem.tick(delta, playerX, playerZ, {
  systemNum,
  systemTimer: actualDuration, // Pass actual duration instead of constant
  systemScaling,
  curse,
})
```

**IMPORTANT:** No changes needed to spawnSystem.js or waveDefs.js. The wave system already uses percentage-based phases, so it automatically scales to the actual duration.

### HUD Timer Display

**Current HUD timer display** (`src/ui/HUD.jsx`):

Needs to show remaining time as countdown: `(actualDuration - currentTimer)`

**Example:**
- Actual duration: 720 seconds (12 minutes)
- Current timer: 60 seconds (1 minute elapsed)
- Display: "11:00" (11 minutes remaining)

**Timer color coding:**
- Green: > 50% time remaining
- Yellow: 20-50% time remaining
- Red: < 20% time remaining (urgent)

```javascript
// HUD.jsx
const currentTimer = useGame(state => state.systemTimer)
const actualDuration = useLevel(state => state.actualSystemDuration)
const remainingTime = Math.max(0, actualDuration - currentTimer)

const minutes = Math.floor(remainingTime / 60)
const seconds = Math.floor(remainingTime % 60)
const timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`

// Color based on percentage remaining
const percentRemaining = remainingTime / actualDuration
const timerColor = percentRemaining > 0.5 ? '#00ff00' : percentRemaining > 0.2 ? '#ffdd00' : '#ff3366'
```

### Testing Standards

Follow the project's Vitest testing standards. All tests must reset system state between test cases.

**useLevel store tests:**
- Test useLevel: carriedTime defaults to 0 on new game
- Test useLevel: setCarriedTime stores remaining time
- Test useLevel: initializeSystemDuration calculates actualDuration = BASE + carried
- Test useLevel: initializeSystemDuration clears carriedTime after consuming
- Test useLevel: actualSystemDuration defaults to 600 on new game
- Test useLevel: reset() clears carriedTime and actualSystemDuration

**GameLoop integration tests:**
- Test GameLoop: boss defeat calculates and stores carriedTime
- Test GameLoop: system entry initializes actualSystemDuration with carriedTime
- Test GameLoop: timer starts at 0 on system entry (not carriedTime)
- Test GameLoop: game over check uses actualDuration (not SYSTEM_TIMER)
- Test GameLoop: wormhole spawns at actualDuration * threshold
- Test GameLoop: tunnel time does NOT increment timer (phase check)

**Wave system integration tests:**
- Test spawnSystem: receives actualDuration (not constant SYSTEM_TIMER)
- Test spawnSystem: phase percentages scale to actualDuration
- Test wave phases: 12-minute system has same phase structure, just longer durations

**End-to-end tests:**
- Test E2E: finish system 1 with 2 min remaining → system 2 has 12 min total duration
- Test E2E: timer display shows cumulative time (12:00 at start of system 2)
- Test E2E: wave phases extend proportionally with extra time

**Edge cases:**
- Test edge case: finish system with 0 seconds remaining → no carryover
- Test edge case: carriedTime never goes negative (Math.max(0, ...))
- Test edge case: new game start clears carriedTime from previous run

### Performance Considerations

**Minimal overhead:**
- Single field addition to useLevel (carriedTime, actualSystemDuration)
- One-time calculation on system entry (initializeSystemDuration)
- No per-frame calculation overhead (actualDuration is stored)

**Memory impact:**
- +2 numbers in useLevel store (8 bytes)
- Negligible impact

### Previous Story Learnings

**From Story 23.1 (Dynamic Wave System):**
- Wave system uses percentage-based phases (0.0-1.0 timeProgress)
- `getPhaseForProgress(systemNum, timeProgress)` returns active phase config
- spawnSystem.tick() accepts systemTimer parameter for phase calculation
- Wave profiles are defined per system in waveDefs.js
- Phase percentages work with any duration (scales automatically)

**From Story 23.2 (Enemy Collision Physics):**
- Separation system is independent of timer logic
- No interaction with cumulative timer feature
- Both stories integrate in GameLoop but don't conflict

**From Story 17.4 (Boss Arrival in Gameplay Scene):**
- Boss fight happens in gameplay phase (not separate arena)
- Timer pauses during boss fight (`if (!bossActive)` check on line 428)
- Wormhole reactivated after boss defeat
- Player enters wormhole → tunnel transition → next system

**From Story 18.4 (Run Continuity State Management):**
- advanceSystem() called by TunnelHub BEFORE phase change to 'systemEntry'
- GameLoop detects 'tunnel' → 'gameplay' transition to reset entities
- Progression state (level, HP, XP, weapons, boons) persists through tunnel
- Only enemies, projectiles, orbs, particles reset on new system

**From Epic 20 (Permanent Upgrades):**
- Curse stat (Story 20.5) multiplies spawn rates
- Permanent bonuses persist through runs (stored in useUpgrades)
- Cumulative timer is a **run-level** mechanic, not permanent

### Project Structure Notes

**Modified files:**
- `src/stores/useLevel.jsx` — Add carriedTime, actualSystemDuration fields + actions
- `src/GameLoop.jsx` — Calculate/store carried time, initialize actualDuration, update checks
- `src/ui/HUD.jsx` — Display cumulative timer (actualDuration - currentTimer)

**Files to check:**
- `src/config/gameConfig.js` — SYSTEM_TIMER constant (600 seconds, unchanged)
- `src/stores/useGame.jsx` — systemTimer field (elapsed time, unchanged)
- `src/systems/spawnSystem.js` — Accept actualDuration parameter (Story 23.1)
- `src/entities/waveDefs.js` — Wave profiles (Story 23.1, unchanged)

**NOT in this story:**
- Timer pause during tunnel (tunnel is a safe zone by design)
- Timer display in tunnel scene (tunnel has its own UI)
- Cumulative timer persistence across runs (resets on new game)
- Multiple boss fights per system (outside scope)

### References

- [Source: _bmad-output/planning-artifacts/epic-23-wave-enemy-systems.md] — Epic context, Story 23.3 requirements
- [Source: src/stores/useLevel.jsx] — Level state (system, wormhole, planets)
- [Source: src/stores/useGame.jsx] — Game state (systemTimer, phase, totalElapsedTime)
- [Source: src/GameLoop.jsx] — Timer increment, game over check, wormhole spawn, boss defeat
- [Source: src/config/gameConfig.js] — SYSTEM_TIMER constant (600 seconds)
- [Source: src/ui/HUD.jsx] — Timer display component
- [Source: _bmad-output/implementation-artifacts/23-1-dynamic-wave-system.md] — Wave system integration (Story 23.1)
- [Source: _bmad-output/implementation-artifacts/17-4-boss-arrival-in-gameplay-scene.md] — Boss fight flow (Story 17.4)
- [Source: _bmad-output/implementation-artifacts/18-4-run-continuity-state-management.md] — System transition flow (Story 18.4)
- [Source: _bmad-output/planning-artifacts/architecture.md] — 6-layer architecture, stores layer patterns

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No blocking issues. Story notes contained a confusing "WAIT NO" section about timer starting at carriedTime vs duration extension — resolved cleanly by using actualSystemDuration stored in useLevel and timer always starting at 0.

### Completion Notes List

- **Task 1**: Added `carriedTime` and `actualSystemDuration` fields to useLevel. Added `setCarriedTime()` and `initializeSystemDuration()` actions. Updated `reset()`. CarriedTime is stored at boss defeat (not wormhole entry) to exclude tunnel time.
- **Task 2**: GameLoop system entry from tunnel now calls `initializeSystemDuration()` after `setSystemTimer(0)`. Boss defeat block calculates `Math.max(0, actualDuration - currentTimer)` and stores via `setCarriedTime()`. Timer check and wormhole spawn check use `useLevel.getState().actualSystemDuration` instead of `GAME_CONFIG.SYSTEM_TIMER`.
- **Task 3**: HUD reads `actualSystemDuration` from useLevel and computes `remaining = Math.max(0, actualSystemDuration - systemTimer)`. Existing `formatTimer` and `isLowTime` helpers work unchanged.
- **Task 4**: No changes to spawnSystem.js or waveDefs.js needed. Wave system already uses percentage-based phases (timeProgress = elapsed / systemTimer). GameLoop now passes `useLevel.getState().actualSystemDuration` as the systemTimer parameter.
- **Task 5**: 15 unit tests for useLevel cumulative timer, all pass. Full test suite: 1984/1985 pass (1 pre-existing failure in progressionSystem unrelated to this story).

### File List

- `src/stores/useLevel.jsx` (modified)
- `src/GameLoop.jsx` (modified)
- `src/ui/HUD.jsx` (modified)
- `src/stores/__tests__/useLevel.cumulativeTimer.test.js` (new)

### Code Review Record

**Reviewer:** claude-sonnet-4-6 (adversarial review via bmad code-review workflow)
**Date:** 2026-02-18
**Issues Found:** 1 High, 3 Medium, 3 Low — all High/Medium fixed

**Fixes Applied:**
- **H1 (High)** — Added boss defeat carryover integration tests (4 tests) to `useLevel.cumulativeTimer.test.js` covering the computation path that GameLoop executes at boss defeat. Tests verify chained s1→s2→s3 scenarios, edge cases (overtime, exact duration), and the Math.max(0,...) guard.
- **M1 (Medium)** — Added `initializeSystemDuration()` call in GameLoop.jsx new game start block (after `reset()`), making system 1 duration initialization explicit and consistent with the tunnel→gameplay path.
- **M2 (Medium)** — Added `Math.max(0, time)` guard to `setCarriedTime()` in useLevel.jsx. Store now self-defends against negative input. Updated misleading test "clamps to 0 if called with 0" to actually test `setCarriedTime(-50)`.
- **M3 (Medium)** — Added HUD timer computation tests (3 tests) verifying `Math.max(0, actualSystemDuration - systemTimer)` pattern for cumulative display, including overtime clamping.

**Low Issues (deferred as action items):**
- L1: Trivial test name for "does NOT reset actualSystemDuration when advancing systems" — low value negative test
- L2: No wormhole spawn threshold scaling test (`actualDuration * WORMHOLE_SPAWN_TIMER_THRESHOLD`)
- L3: Test name phrasing for edge case coverage

**Final test count:** 22 tests (up from 15), all passing. Full suite: 1999/2004 pass (5 pre-existing failures in useDamageNumbers from Story 27 in-progress, unrelated to this story).

### Change Log

- feat: cumulative timer carryover — remaining time from system N adds to duration of system N+1 (Story 23.3)
- fix(review): setCarriedTime guards against negative input with Math.max(0, time)
- fix(review): GameLoop new game start explicitly calls initializeSystemDuration() for system 1
- test(review): boss defeat carryover integration tests + HUD computation tests (22 total)
