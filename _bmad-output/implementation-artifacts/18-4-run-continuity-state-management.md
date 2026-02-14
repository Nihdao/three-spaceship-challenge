# Story 18.4: Run Continuity & State Management

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want clear state management for run-persistent vs system-specific state,
So that transitions are reliable and bugs are minimized.

## Acceptance Criteria

1. **Given** usePlayer, useWeapons, useBoons stores **When** transitioning between systems **Then** these stores do NOT call `reset()` during system transitions **And** only specific fields are reset if needed (e.g., invulnerability timers, dash cooldown)

2. **Given** useLevel store **When** transitioning to a new system **Then** `useLevel.currentSystem` increments (1 -> 2 -> 3) **And** `useLevel.systemTimer` resets to 0 **And** `useLevel.wormholeState` resets to `'hidden'` (new wormhole must be discovered)

3. **Given** useEnemies, projectiles, and XP orb systems **When** transitioning to a new system **Then** these stores call their reset() or clear() methods to remove previous system entities **And** entity pools are cleared and ready for new system spawning

4. **Given** useGame store **When** managing system transitions **Then** useGame tracks run metadata that persists across systems (kills, score, totalElapsedTime) **And** this metadata is displayed on game over and victory screens

5. **Given** debugging needs **When** testing system transitions **Then** console logs clearly show current system number, player stats carried over, and which stores were reset **And** this aids in identifying state pollution or reset bugs

6. **Given** the complete state classification **When** a full run is played (System 1 -> tunnel -> System 2 -> tunnel -> System 3) **Then** ALL run-persistent fields survive both transitions without corruption **And** ALL system-specific fields reset correctly at each transition **And** a full game reset (game over -> retry OR victory -> new run) resets EVERYTHING

## Tasks / Subtasks

- [ ] Task 1: Audit and verify AC #1 — run-persistent stores do NOT reset on system transition (AC: #1)
  - [ ] 1.1: Read `src/GameLoop.jsx` tunnel->gameplay transition block (lines 75-91) and confirm `usePlayer.reset()`, `useWeapons.reset()`, `useBoons.reset()` are NOT called
  - [ ] 1.2: Confirm `usePlayer.resetForNewSystem()` is called (preserves level, XP, weapons, boons, HP, fragments, upgrades, dilemmas) and only resets movement/combat state
  - [ ] 1.3: Confirm `useWeapons.clearProjectiles()` is called (NOT `initializeWeapons()` or `reset()`) — preserves activeWeapons
  - [ ] 1.4: Confirm `useBoons.reset()` is NOT called during system transitions — boons persist

- [ ] Task 2: Audit and verify AC #2 — useLevel system-specific reset (AC: #2)
  - [ ] 2.1: Read `useLevel.advanceSystem()` and confirm it increments `currentSystem`, resets `systemTimer: 0`, `difficulty: 1`, `planets: []`, `wormholeState: 'hidden'`, `wormhole: null`, `wormholeActivationTimer: 0`, `activeScanPlanetId: null`
  - [ ] 2.2: Confirm `advanceSystem()` is called from `TunnelHub.executeSystemTransition()` BEFORE the phase change
  - [ ] 2.3: Confirm `currentSystem` does not exceed `MAX_SYSTEMS` (capped via `Math.min`)

- [ ] Task 3: Audit and verify AC #3 — entity pool resets (AC: #3)
  - [ ] 3.1: Confirm `useEnemies.getState().reset()` is called (clears `enemies: []`, `nextId: 0`)
  - [ ] 3.2: Confirm `resetOrbs()` is called (zeros all orb slots, `activeCount: 0`)
  - [ ] 3.3: Confirm `projectileSystemRef.current.reset()` is called (clears projectiles)
  - [ ] 3.4: Confirm `resetParticles()` is called (clears particle effects)
  - [ ] 3.5: Confirm `spawnSystemRef.current.reset()` is called (resets `spawnTimer`, `elapsedTime`)
  - [ ] 3.6: Confirm `useBoss.getState().reset()` is called (clears boss state)

- [ ] Task 4: Audit and verify AC #4 — run metadata persistence (AC: #4)
  - [ ] 4.1: Confirm `useGame.kills` persists across system transitions (NOT reset in tunnel->gameplay block, only in `startGameplay()`)
  - [ ] 4.2: Confirm `useGame.score` persists across system transitions (NOT reset in tunnel->gameplay block, only in `startGameplay()`)
  - [ ] 4.3: Confirm `useGame.totalElapsedTime` accumulates correctly — `accumulateTime(prevSystemTime)` is called before `setSystemTimer(0)` in the transition block
  - [ ] 4.4: Confirm GameOverScreen captures `kills`, `score`, `totalElapsedTime + systemTimer`, `currentSystem`, `currentLevel`, `activeWeapons` on mount
  - [ ] 4.5: Confirm VictoryScreen captures the same plus `fragments` and `activeBoons`

- [ ] Task 5: Add debug logging for system transitions (AC: #5)
  - [ ] 5.1: In `src/GameLoop.jsx` tunnel->gameplay transition block, add a `console.log` group showing: current system number, player stats (level, HP, XP, weapons count, boons count, fragments), which stores are being reset
  - [ ] 5.2: Guard the debug logging behind `GAME_CONFIG.DEBUG_TRANSITIONS` flag (default `false`) so it doesn't clutter the console in production
  - [ ] 5.3: Add `DEBUG_TRANSITIONS: false` to `src/config/gameConfig.js`
  - [ ] 5.4: In the debug `system` command (if it exists in commandSystem.js) or add one, support `system info` to dump the current state classification

- [ ] Task 6: Write comprehensive tests for run continuity (AC: #1-#6)
  - [ ] 6.1: Create `src/stores/__tests__/runContinuity.test.js`
  - [ ] 6.2: Test: after `resetForNewSystem()`, run-persistent fields are preserved (level, XP, HP, fragments, permanentUpgrades, acceptedDilemmas)
  - [ ] 6.3: Test: after `resetForNewSystem()`, combat/movement fields are reset (position, velocity, dash, invulnerability)
  - [ ] 6.4: Test: `useGame.kills` and `useGame.score` are NOT reset when `setSystemTimer(0)` is called (only by `startGameplay()`)
  - [ ] 6.5: Test: `accumulateTime()` correctly adds to `totalElapsedTime`
  - [ ] 6.6: Test: `advanceSystem()` increments `currentSystem` and resets wormhole/planets/timer
  - [ ] 6.7: Test: `advanceSystem()` does not exceed `MAX_SYSTEMS`
  - [ ] 6.8: Test: `useEnemies.reset()` clears enemies and nextId
  - [ ] 6.9: Test: full run simulation — set level 8, 3 weapons, 2 boons, fragments=50, kills=100, score=5000 -> call resetForNewSystem + advanceSystem -> verify persistent state preserved, system-specific state reset
  - [ ] 6.10: Test: full game reset — after above, call `usePlayer.reset()` + `useGame.startGameplay()` + `useLevel.reset()` -> verify EVERYTHING returns to initial values
  - [ ] 6.11: All existing tests pass with no regressions

- [ ] Task 7: Verify full game reset path (AC: #6)
  - [ ] 7.1: In `src/GameLoop.jsx` fresh game start block (lines 94-106), confirm ALL stores are fully reset
  - [ ] 7.2: Confirm `usePlayer.reset()` resets level to 1, XP to 0, HP to ship base, fragments to 0, upgrades to {}, dilemmas to []
  - [ ] 7.3: Confirm `useLevel.reset()` resets currentSystem to 1
  - [ ] 7.4: Confirm `useGame.startGameplay()` resets kills to 0, score to 0, systemTimer to 0, totalElapsedTime to 0

## Dev Notes

### Architecture Analysis — Current State (Post Story 18.1)

This story is primarily a **verification, testing, and debug tooling** story. Stories 18.1, 18.2, and the original Story 7.3 have already implemented the core state management for system transitions. The main deliverables are:

1. **Systematic audit** confirming all state transitions are correct
2. **Debug logging** to aid future development and bug identification
3. **Comprehensive test suite** proving run continuity invariants
4. **Documentation** of the complete state classification

### Complete State Classification (Definitive)

**RUN-PERSISTENT state (survives system transitions, only reset on full game restart):**

| Store | Field(s) | Notes |
|-------|----------|-------|
| usePlayer | `currentLevel`, `currentXP`, `xpForNextLevel`, `pendingLevelUps`, `levelsGainedThisBatch` | Story 18.1 removed these from `resetForNewSystem()` |
| usePlayer | `currentHP`, `maxHP`, `_appliedMaxHPBonus` | HP persists; no heal between systems |
| usePlayer | `fragments` | Accumulated across run, spent in tunnel |
| usePlayer | `permanentUpgrades`, `upgradeStats` | Tunnel purchases persist |
| usePlayer | `acceptedDilemmas`, `dilemmaStats` | Dilemma effects persist |
| usePlayer | `currentShipId`, `shipBaseSpeed`, `shipBaseDamageMultiplier` | Ship selection is per-run |
| useWeapons | `activeWeapons` | Weapons persist via `clearProjectiles()` (not `reset()`) |
| useBoons | `activeBoons` | Boons persist (store not reset on transition) |
| useGame | `kills` | Cumulative run kills |
| useGame | `score` | Cumulative run score |
| useGame | `totalElapsedTime` | Accumulated system timers |
| useGame | `highScore` | Persists across runs (localStorage) |

**SYSTEM-SPECIFIC state (reset on each system transition):**

| Store/System | Field(s) | Reset By |
|-------------|----------|----------|
| usePlayer | `position`, `velocity`, `rotation`, `bankAngle`, `speed` | `resetForNewSystem()` |
| usePlayer | `isDashing`, `dashTimer`, `dashCooldownTimer` | `resetForNewSystem()` |
| usePlayer | `isInvulnerable`, `invulnerabilityTimer`, `contactDamageCooldown` | `resetForNewSystem()` |
| usePlayer | `damageFlashTimer`, `cameraShakeTimer` | `resetForNewSystem()` |
| useLevel | `currentSystem` | `advanceSystem()` (increments) |
| useLevel | `systemTimer`, `difficulty` | `advanceSystem()` (reset to 0/1) |
| useLevel | `wormholeState`, `wormhole`, `wormholeActivationTimer` | `advanceSystem()` (hidden/null/0) |
| useLevel | `planets`, `activeScanPlanetId` | `advanceSystem()` + `initializePlanets()` |
| useEnemies | `enemies`, `nextId` | `reset()` in GameLoop transition block |
| useWeapons | `projectiles`, `nextProjectileId`, cooldown timers | `clearProjectiles()` in GameLoop transition block |
| useBoss | all fields | `reset()` in GameLoop transition block |
| useGame | `systemTimer` | `setSystemTimer(0)` in GameLoop transition block |
| XP orbs | all orb slots, activeCount | `resetOrbs()` in GameLoop transition block |
| Spawn system | `spawnTimer`, `elapsedTime` | `spawnSystem.reset()` in GameLoop transition block |
| Projectile system | internal pools | `projectileSystem.reset()` in GameLoop transition block |
| Particles | all particles | `resetParticles()` in GameLoop transition block |

### System Transition Execution Order

The system transition happens across two call sites:

**Step 1 — TunnelHub.executeSystemTransition() (UI layer, triggered by user action):**
```
1. useLevel.advanceSystem()        — increment system, reset level-specific state
2. usePlayer.resetForNewSystem()   — reset movement/combat, preserve progression
3. useGame.startSystemEntry()      — set phase to 'systemEntry'
```

**Step 2 — GameLoop useFrame (next frame, detects phase change):**
```
Condition: (phase === 'gameplay' || phase === 'systemEntry') && prevPhaseRef === 'tunnel'
4. useEnemies.reset()              — clear all enemies
5. useWeapons.clearProjectiles()   — clear projectiles, keep weapons
6. useBoss.reset()                 — clear boss state
7. spawnSystem.reset()             — reset spawn timers
8. projectileSystem.reset()        — clear projectile pools
9. resetParticles()                — clear particle effects
10. resetOrbs()                    — clear XP orb pools
11. accumulateTime(prevSystemTime) — save previous system time to totalElapsedTime
12. setSystemTimer(0)              — restart system timer
13. initializePlanets()            — generate new planets for new system
```

### Full Game Reset Execution Order

**When player starts a new run (menu -> gameplay OR retry after game over/victory):**

`useGame.startGameplay()` resets: phase, systemTimer=0, totalElapsedTime=0, score=0, kills=0

GameLoop fresh start block (lines 94-106) then calls:
```
usePlayer.reset()         — full wipe (level 1, XP 0, HP base, fragments 0, etc.)
useWeapons.initializeWeapons()  — clear weapons, add starting weapon
useBoons.reset()          — clear all boons
useEnemies.reset()        — clear enemies
useLevel.reset()          — reset to system 1
useBoss.reset()           — clear boss
spawnSystem.reset()       — reset spawn state
projectileSystem.reset()  — clear projectiles
resetParticles()          — clear particles
resetOrbs()               — clear orbs
initializePlanets()       — generate planets for system 1
```

### Run Metadata Already Available on End Screens

**GameOverScreen captures on mount (statsRef):**
- `totalElapsedTime + systemTimer` → total time survived across all systems
- `kills` → total enemies killed across all systems
- `score` → total score
- `currentLevel` → player level at death
- `currentSystem` → system where player died (displayed as "SYSTEM REACHED")
- `activeWeapons` → weapons at death
- `isNewHighScore` → high score flag

**VictoryScreen captures on mount (statsRef):**
- Same as above, plus `fragments` and `activeBoons`
- `currentSystem` displayed as "SYSTEMS CLEARED"

These end screens already display comprehensive run metadata. No additional `useGame` fields are needed — `currentSystem` from `useLevel` provides the system information, and `kills`/`score`/`totalElapsedTime` provide the cumulative run stats.

### Debug Logging Implementation

Add a `DEBUG_TRANSITIONS` flag in gameConfig. When enabled, the GameLoop transition block logs:

```javascript
if (GAME_CONFIG.DEBUG_TRANSITIONS) {
  const p = usePlayer.getState()
  const g = useGame.getState()
  const l = useLevel.getState()
  console.group(`[System Transition] Entering System ${l.currentSystem}`)
  console.log('Player: level=%d, HP=%d/%d, XP=%d/%d, fragments=%d', p.currentLevel, p.currentHP, p.maxHP, p.currentXP, p.xpForNextLevel, p.fragments)
  console.log('Weapons:', useWeapons.getState().activeWeapons.length, 'equipped')
  console.log('Boons:', useBoons.getState().activeBoons.length, 'active')
  console.log('Run stats: kills=%d, score=%d, totalTime=%.1fs', g.kills, g.score, g.totalElapsedTime)
  console.log('Reset: enemies, projectiles, orbs, particles, boss, spawn system, system timer')
  console.groupEnd()
}
```

### Files to MODIFY

1. **`src/config/gameConfig.js`** — Add `DEBUG_TRANSITIONS: false` constant
2. **`src/GameLoop.jsx`** — Add debug logging in tunnel->gameplay transition block (lines 75-91)

### Files to CREATE

1. **`src/stores/__tests__/runContinuity.test.js`** — Comprehensive run continuity test suite

### Files NOT to MODIFY

- `src/stores/usePlayer.jsx` — Already correct from Story 18.1
- `src/stores/useWeapons.jsx` — Already correct from Story 18.1 (clearProjectiles)
- `src/stores/useBoons.jsx` — Already correct (never reset on transition)
- `src/stores/useLevel.jsx` — Already correct (advanceSystem)
- `src/stores/useEnemies.jsx` — Already correct (reset)
- `src/stores/useGame.jsx` — Run metadata (kills, score, totalElapsedTime) already persists correctly. No new fields needed.
- `src/ui/GameOverScreen.jsx` — Already displays all necessary run stats
- `src/ui/VictoryScreen.jsx` — Already displays all necessary run stats
- `src/ui/TunnelHub.jsx` — Transition logic is correct

### Existing Run Metadata Fields (NO new fields needed)

The epic AC mentions `runStartTime`, `systemsCompleted`, `totalKills`, `totalFragments`. Analysis shows:
- **runStartTime**: Not needed — `totalElapsedTime + systemTimer` already gives total run duration
- **systemsCompleted**: Derivable from `useLevel.currentSystem` (displayed on end screens already)
- **totalKills**: Already `useGame.kills` (persists across systems, displayed on end screens)
- **totalFragments**: Already `usePlayer.fragments` (persists across systems, displayed on victory screen)

Adding redundant fields would violate the "avoid over-engineering" principle. The data is already available and displayed correctly.

### Testing Approach

**Run continuity invariant tests:**
- Set up complex player state (level 8, 3 weapons, 2 boons, HP=45/100, fragments=50)
- Set up game state (kills=100, score=5000, totalElapsedTime=300)
- Call `resetForNewSystem()` + `advanceSystem()` + entity resets
- Assert ALL run-persistent fields unchanged
- Assert ALL system-specific fields reset
- Repeat for second transition (System 2 -> System 3)
- Then call full reset and assert EVERYTHING returns to initial values

**Time accumulation tests:**
- System 1 timer = 250s, transition -> verify totalElapsedTime = 250
- System 2 timer = 300s, transition -> verify totalElapsedTime = 550
- Game over -> verify total display = 550 + current system timer

**Edge case tests:**
- Player at max system (System 3) — advanceSystem should not exceed MAX_SYSTEMS
- Player with pendingLevelUps > 0 during transition — should persist
- Player with 0 HP (should not happen but defensive) — no special handling needed

### Anti-Patterns to Avoid

- Do NOT add new state fields to useGame for data already available elsewhere (kills, score, totalElapsedTime already exist)
- Do NOT create a centralized "transition manager" — the current split (TunnelHub + GameLoop) is architecturally sound
- Do NOT modify the existing reset logic — it's already correct from Stories 18.1 and 18.2
- Do NOT add production console.log — guard all debug logging behind `DEBUG_TRANSITIONS` flag
- Do NOT test implementation details (internal store structure) — test observable behavior (state before/after transitions)

### Project Structure Notes

- **Config Layer** (`gameConfig.js`): Add `DEBUG_TRANSITIONS` flag only
- **GameLoop** (`GameLoop.jsx`): Add debug logging only — no logic changes
- **Tests** (`runContinuity.test.js`): New comprehensive test file
- Alignment with architecture: stores follow Zustand patterns, GameLoop orchestrates, no cross-store imports

### References

- [Source: src/GameLoop.jsx:75-91] — Tunnel->gameplay transition block (all entity resets)
- [Source: src/GameLoop.jsx:94-106] — Fresh game start block (full reset)
- [Source: src/ui/TunnelHub.jsx:98-114] — executeSystemTransition() calling advanceSystem + resetForNewSystem
- [Source: src/stores/usePlayer.jsx — resetForNewSystem()] — Preserves progression, resets combat state (Story 18.1)
- [Source: src/stores/useWeapons.jsx — clearProjectiles()] — Clears projectiles only, preserves activeWeapons (Story 18.1)
- [Source: src/stores/useLevel.jsx — advanceSystem()] — Increments system, resets level-specific state
- [Source: src/stores/useGame.jsx] — kills, score, totalElapsedTime persist across systems; startGameplay() resets all
- [Source: src/ui/GameOverScreen.jsx:31-42] — Captures run stats on mount (score, kills, time, system, level, weapons)
- [Source: src/ui/VictoryScreen.jsx:47-59] — Captures run stats on mount (+ fragments, boons)
- [Source: _bmad-output/planning-artifacts/epic-18-cross-system-progression.md#Story 18.4] — Epic AC source
- [Source: _bmad-output/implementation-artifacts/18-1-progression-state-persistence-across-systems.md] — Story 18.1 (XP/level/weapon persistence)
- [Source: _bmad-output/implementation-artifacts/18-2-system-specific-state-reset.md] — Story 18.2 (system-specific reset verification)
- [Source: _bmad-output/implementation-artifacts/18-3-enemy-difficulty-scaling-systems-2-3.md] — Story 18.3 (enemy scaling)
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — Store patterns and GameLoop orchestration

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
