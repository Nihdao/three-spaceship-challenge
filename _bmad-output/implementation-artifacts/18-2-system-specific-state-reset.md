# Story 18.2: System-Specific State Reset

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the system timer, enemy waves, and collectibles to reset when entering a new system,
So that each system feels like a fresh challenge while my build persists.

## Acceptance Criteria

1. **Given** the player enters System 2 **When** the system loads **Then** the system timer resets to `GAME_CONFIG.SYSTEM_TIMER` (600 seconds / 10 minutes) **And** the timer counts down from 10:00 as in System 1

2. **Given** enemy state from System 1 **When** transitioning to System 2 **Then** all enemies from System 1 are cleared **And** `useEnemies.getState().reset()` is called (resets `enemies: []` and `nextId: 0`) **And** enemy spawning begins fresh based on System 2 configuration

3. **Given** XP orbs and other collectibles on the field in System 1 **When** transitioning to System 2 **Then** all remaining XP orbs are cleared via `resetOrbs()` **And** the orb pool active count is reset to 0

4. **Given** wormhole state in System 1 **When** entering System 2 **Then** `useLevel.advanceSystem()` resets `wormholeState: 'hidden'`, `wormhole: null`, `wormholeActivationTimer: 0` **And** a new wormhole must be discovered and activated in System 2

5. **Given** planet scanning state **When** entering System 2 **Then** `useLevel.advanceSystem()` resets `planets: []` and `activeScanPlanetId: null` **And** `useLevel.initializePlanets()` generates new planets for System 2

6. **Given** spawn system state **When** entering System 2 **Then** `spawnSystem.reset()` resets `spawnTimer` to `SPAWN_INTERVAL_BASE` and `elapsedTime` to 0 **And** difficulty ramp starts fresh in System 2

7. **Given** projectiles and particles from System 1 **When** transitioning to System 2 **Then** all projectiles are cleared via `useWeapons.getState().clearProjectiles()` **And** all particles are cleared via `resetParticles()`

8. **Given** boss state from System 1 **When** transitioning to System 2 **Then** `useBoss.getState().reset()` clears all boss state

## Tasks / Subtasks

- [x] Task 1: Audit existing tunnel→gameplay transition block (AC: #1-#8)
  - [x] 1.1: Read `src/GameLoop.jsx` lines 75-91 — confirm ALL resets listed in AC are already called
  - [x] 1.2: Compare actual resets vs AC requirements — identify any GAPS
  - [x] 1.3: Verify `useLevel.advanceSystem()` is called by TunnelHub BEFORE the phase change (not in GameLoop)
  - [x] 1.4: Verify `useGame.setSystemTimer(0)` is called and timer restarts correctly

- [x] Task 2: Verify system timer reset behavior (AC: #1)
  - [x] 2.1: Trace how `systemTimer` works — `useGame.setSystemTimer(0)` sets it to 0, then GameLoop's tick section increments it
  - [x] 2.2: Confirm the timer counts UP from 0 (elapsed) and the HUD converts `SYSTEM_TIMER - elapsed` for display
  - [x] 2.3: Verify `accumulateTime()` is called BEFORE resetting `systemTimer` so total run time is preserved
  - [x] 2.4: Write test: after system transition, systemTimer starts at 0 and counts up

- [x] Task 3: Verify enemy state reset (AC: #2)
  - [x] 3.1: Confirm `useEnemies.getState().reset()` clears `enemies: []` and `nextId: 0`
  - [x] 3.2: Confirm no enemy references leak (no stale enemies rendering in System 2)
  - [x] 3.3: Write test: after system transition, `useEnemies.getState().enemies` is empty

- [x] Task 4: Verify XP orb reset (AC: #3)
  - [x] 4.1: Confirm `resetOrbs()` zeros out all orb slots and sets `activeCount = 0`
  - [x] 4.2: Verify no stale orbs render after transition
  - [x] 4.3: Write test: after system transition, no active XP orbs exist

- [x] Task 5: Verify wormhole and planet reset (AC: #4, #5)
  - [x] 5.1: Confirm `advanceSystem()` resets all wormhole fields (`wormholeState: 'hidden'`, `wormhole: null`, `wormholeActivationTimer: 0`)
  - [x] 5.2: Confirm `advanceSystem()` clears planets (`planets: []`, `activeScanPlanetId: null`)
  - [x] 5.3: Confirm `initializePlanets()` is called in GameLoop after transition to populate new planets
  - [x] 5.4: Write test: after `advanceSystem()`, wormhole is hidden and planets are empty
  - [x] 5.5: Write test: after `initializePlanets()`, new planets exist for the new system

- [x] Task 6: Verify spawn system, projectile, particle, boss resets (AC: #6, #7, #8)
  - [x] 6.1: Confirm `spawnSystem.reset()` resets `spawnTimer` and `elapsedTime`
  - [x] 6.2: Confirm `projectileSystem.reset()` clears all projectiles
  - [x] 6.3: Confirm `resetParticles()` clears all particles
  - [x] 6.4: Confirm `useBoss.getState().reset()` clears boss state

- [x] Task 7: Identify and fix any gaps (AC: #1-#8)
  - [x] 7.1: If any reset is MISSING from the tunnel→gameplay transition block, add it
  - [x] 7.2: If `useLevel.difficulty` is NOT reset by `advanceSystem()` — verify it IS (currently resets to 1)
  - [x] 7.3: If system timer behavior has edge cases (e.g., timer shows wrong value for 1 frame), fix

- [x] Task 8: Write comprehensive tests (AC: #1-#8)
  - [x] 8.1: Create/update `src/stores/__tests__/useLevel.systemTransition.test.js` for `advanceSystem()` behavior
  - [x] 8.2: Test: `advanceSystem()` increments `currentSystem` and resets all per-system fields
  - [x] 8.3: Test: `advanceSystem()` does NOT exceed `MAX_SYSTEMS`
  - [x] 8.4: Test: full transition flow — enemies, orbs, wormhole, planets all cleared, timer reset
  - [x] 8.5: All existing tests pass with no regressions

## Dev Notes

### Architecture Analysis — Current State of System Transitions

The system transition logic is **split across two locations**:

1. **TunnelHub component** calls `useLevel.getState().advanceSystem()` BEFORE the phase change to gameplay
2. **GameLoop.jsx** (lines 75-91) detects `phase === 'gameplay' && prevPhaseRef.current === 'tunnel'` and resets all combat systems

**Current GameLoop tunnel→gameplay transition block:**
```javascript
if ((phase === 'gameplay' || phase === 'systemEntry') && prevPhaseRef.current === 'tunnel') {
  useEnemies.getState().reset()              // Clear enemies array + nextId
  useWeapons.getState().initializeWeapons()  // ⚠️ Story 18.1 concern — may clear weapons
  useBoss.getState().reset()                 // Clear boss state
  spawnSystemRef.current.reset()             // Reset spawn timer + elapsed time
  projectileSystemRef.current.reset()        // Clear projectiles
  resetParticles()                           // Clear particles
  resetOrbs()                                // Clear XP orbs (pool reset)

  // Time management
  const prevSystemTime = useGame.getState().systemTimer
  if (prevSystemTime > 0) useGame.getState().accumulateTime(prevSystemTime)
  useGame.getState().setSystemTimer(0)       // Reset system timer

  // New system planets
  useLevel.getState().initializePlanets()    // Generate planets for new system
}
```

**useLevel.advanceSystem() resets:**
- `currentSystem` → increments (1→2→3, capped at MAX_SYSTEMS)
- `systemTimer` → 0
- `difficulty` → 1
- `planets` → []
- `wormholeState` → 'hidden'
- `wormhole` → null
- `wormholeActivationTimer` → 0
- `activeScanPlanetId` → null

**useEnemies.reset():**
- `enemies` → []
- `nextId` → 0

**resetOrbs() (xpOrbSystem.js):**
- All orb slots zeroed (x, z, xpValue, elapsedTime, isMagnetized)
- `activeCount` → 0

**spawnSystem.reset():**
- `spawnTimer` → SPAWN_INTERVAL_BASE
- `elapsedTime` → 0

### What This Story Primarily Validates

This story is largely a **verification and testing story**. Most of the system-specific resets are ALREADY implemented from Story 7.3 (tunnel exit system transition). The main work is:

1. **Audit** that every per-system state is properly reset (no leaks)
2. **Write comprehensive tests** proving all resets work
3. **Fix any gaps** discovered during the audit
4. **Document** the clear separation between run-persistent and system-specific state

### State Classification (Definitive)

**Run-persistent state (MUST NOT reset on system transition):**
- `usePlayer`: level, XP, HP, weapons, boons, stats, fragments, permanent upgrades, dilemmas
- `useWeapons`: activeWeapons (equipped weapons with levels)
- `useBoons`: equippedBoons (active boons with stacks)
- `useGame`: score, kills, totalElapsedTime

**System-specific state (MUST reset on system transition):**
- `useLevel`: systemTimer→0, difficulty→1, planets→[], wormhole→hidden/null
- `useEnemies`: enemies→[], nextId→0
- `useGame`: systemTimer→0 (via setSystemTimer)
- XP orbs: all slots zeroed, activeCount→0
- Spawn system: spawnTimer reset, elapsedTime→0
- Projectiles: cleared
- Particles: cleared
- Boss: cleared

### Potential Gaps to Investigate

1. **Difficulty field**: `advanceSystem()` resets `difficulty: 1` — is this the right value for System 2? Story 18.3 (enemy scaling) uses `currentSystem` not `difficulty`. Confirm `difficulty` field is used independently.
2. **Timer display**: The systemTimer in `useGame` starts at 0 and counts UP. The HUD should display `SYSTEM_TIMER - elapsed`. Verify the HUD correctly shows 10:00 after transition.
3. **Phase === 'systemEntry'**: The transition check includes `phase === 'systemEntry'` — this may be for the cinematic transition (Epic 17). Ensure Story 18.2's resets work with BOTH phase paths.
4. **initializeWeapons()**: Story 18.1 flags this as potentially clearing earned weapons. This story should NOT fix that (Story 18.1's scope), but should be aware of it during testing.

### What NOT to Change

- Do NOT modify `usePlayer.resetForNewSystem()` — that's Story 18.1's concern
- Do NOT add enemy scaling — that's Story 18.3
- Do NOT modify run start/game over reset — those are correct
- Do NOT centralize resets into a single method unless a gap requires it — current split (TunnelHub + GameLoop) works
- Do NOT modify the tunnel scene or transition flow

### Testing Approach

**Unit tests (useLevel):**
- `advanceSystem()` increments currentSystem
- `advanceSystem()` resets timer, difficulty, planets, wormhole
- `advanceSystem()` does not exceed MAX_SYSTEMS
- `reset()` returns everything to initial state (system 1)

**Unit tests (useEnemies):**
- `reset()` clears enemies array
- `reset()` resets nextId to 0

**Integration tests (transition flow):**
- Simulate phase change tunnel→gameplay, verify all systems reset
- Verify timer starts counting from 0 after transition
- Verify planets are re-initialized for new system
- Verify no stale enemies, orbs, or projectiles exist after transition

### Project Structure Notes

- All stores follow the Zustand `create((set, get) => ({...}))` pattern
- System transitions use phase detection in GameLoop's useFrame
- `advanceSystem()` is called by TunnelHub before phase change (UI layer → Store)
- Combat resets are called by GameLoop after phase change (GameLoop → Systems/Stores)
- This split is architecturally sound and should be preserved

### References

- [Source: src/GameLoop.jsx:75-91] — Tunnel→gameplay transition block with all reset calls
- [Source: src/stores/useLevel.jsx:169-178] — advanceSystem() method
- [Source: src/stores/useLevel.jsx:180-189] — reset() method
- [Source: src/stores/useEnemies.jsx:172] — reset() method (enemies:[], nextId:0)
- [Source: src/systems/xpOrbSystem.js:94-103] — resetOrbs() function
- [Source: src/systems/spawnSystem.js:58-61] — reset() function
- [Source: _bmad-output/planning-artifacts/epic-18-cross-system-progression.md#Story 18.2] — Epic AC source
- [Source: _bmad-output/implementation-artifacts/18-1-progression-state-persistence-across-systems.md] — Previous story context
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — Store architecture

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Audited the full tunnel→gameplay transition block in GameLoop.jsx (lines 75-91). All 8 ACs are already satisfied by existing code from Story 7.3. No gaps found.
- The transition is correctly split: TunnelHub calls advanceSystem() (store-level state) before phase change, GameLoop clears entity pools (enemies, orbs, projectiles, particles, boss, spawn system) after phase change.
- Note: GameLoop uses `clearProjectiles()` (not `initializeWeapons()`) on system transition, which preserves the player's weapon loadout — correct for run persistence (Story 18.1).
- Note: `projectileSystem.reset()` is a no-op (system is stateless); actual projectile clearing is via `useWeapons.clearProjectiles()`.
- Created 17 comprehensive tests covering all 8 ACs plus MAX_SYSTEMS boundary and full integration flow.
- All 1151 tests pass across 74 test files with zero regressions.

### Change Log

- 2026-02-14: Story 18.2 — Created comprehensive system transition tests (17 tests). No code changes needed; all resets already implemented. (Verification + testing story)

### File List

- src/stores/__tests__/useLevel.systemTransition.test.js (new)
