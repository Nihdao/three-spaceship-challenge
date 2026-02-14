# Story 18.1: Progression State Persistence Across Systems

Status: done

## Story

As a player,
I want to keep my level, weapons, boons, and stats when entering a new system,
So that my build and power progression feel continuous throughout the run.

## Acceptance Criteria

1. **Given** the player completes System 1 (defeats the boss) **When** the player enters the tunnel and then exits to System 2 **Then** usePlayer.currentLevel is preserved (does not reset to 1) **And** usePlayer.currentXP and xpForNextLevel are preserved **And** all equipped weapons (useWeapons.equippedWeapons) remain equipped with their current levels

2. **Given** the player has equipped boons in System 1 **When** transitioning to System 2 **Then** all equipped boons (useBoons.equippedBoons) remain active with their current levels/stacks **And** boon effects continue to apply to weapons and stats

3. **Given** the player has purchased permanent upgrades in the tunnel **When** entering System 2 **Then** permanent stat upgrades (e.g., +max HP, +damage %, +speed %) remain applied **And** the upgraded stats are reflected in usePlayer state

4. **Given** the player's current HP at the end of System 1 **When** transitioning to System 2 **Then** currentHP is preserved (does NOT reset to maxHP) **And** the player starts System 2 with whatever HP they had when defeating the boss **And** if the player used HP sacrifice in the tunnel, the reduced HP is reflected

5. **Given** the player's Fragment and score totals **When** transitioning to System 2 **Then** total Fragments and score accumulate across systems (not reset) **And** Fragments earned in System 1 can be spent in the tunnel before System 2 **And** score continues to increase in System 2

## Tasks / Subtasks

- [x] Task 1: Modify `resetForNewSystem()` to preserve XP and level (AC: #1)
  - [x] 1.1: In `src/stores/usePlayer.jsx`, update `resetForNewSystem()` to NO LONGER reset `currentLevel`, `currentXP`, `xpForNextLevel`, and `pendingLevelUps` — these must carry over to the next system
  - [x] 1.2: Remove the lines that set `currentLevel: 1`, `currentXP: 0`, `xpForNextLevel: XP_REQUIREMENTS[1]` (or equivalent) from `resetForNewSystem()`
  - [x] 1.3: Preserve `pendingLevelUps` count so if the player had pending level-ups when defeating the boss, they can still choose them in the next system

- [x] Task 2: Verify weapons persist across system transitions (AC: #1)
  - [x] 2.1: In `src/GameLoop.jsx`, examine the tunnel→gameplay transition block — currently calls `useWeapons.getState().initializeWeapons()`
  - [x] 2.2: Determine if `initializeWeapons()` clears existing weapons or only adds the starting weapon if none exist
  - [x] 2.3: If `initializeWeapons()` clears weapons, modify the tunnel→gameplay block to NOT call it (only call it for new game from menu)
  - [x] 2.4: Ensure projectile pool is still cleared (projectiles should NOT carry over) while weapons DO carry over
  - [x] 2.5: If `useWeapons.reset()` is being called in the tunnel→gameplay path, replace it with a `clearProjectiles()` call that only clears projectiles, not activeWeapons

- [x] Task 3: Verify boons persist across system transitions (AC: #2)
  - [x] 3.1: Confirm that `useBoons.reset()` is NOT called in the tunnel→gameplay transition block in GameLoop
  - [x] 3.2: Verify boon modifiers (damage multipliers, speed bonuses, etc.) remain computed and active after system transition
  - [x] 3.3: Test that boon effects correctly apply to weapons and stats in System 2

- [x] Task 4: Verify permanent upgrades and HP persist (AC: #3, #4)
  - [x] 4.1: Confirm `resetForNewSystem()` preserves `permanentUpgrades`, `damageMult`, `speedMult`, `hpMaxBonus`, `cooldownMult`, `fragmentMult`
  - [x] 4.2: Confirm `resetForNewSystem()` preserves `currentHP` and `maxHP` (does NOT reset HP to full)
  - [x] 4.3: Confirm HP sacrifice in tunnel (Story 7.4) reduces currentHP and this reduced value carries into System 2
  - [x] 4.4: Confirm `_appliedMaxHPBonus` persists so permanent HP upgrades are not double-applied

- [x] Task 5: Verify fragments and score persist (AC: #5)
  - [x] 5.1: Confirm `resetForNewSystem()` preserves `fragments` field
  - [x] 5.2: Confirm `useGame` score/kills fields are NOT reset during tunnel→gameplay transition
  - [x] 5.3: Confirm `totalElapsedTime` accumulation works correctly (already implemented in Story 7.3)

- [x] Task 6: Update tests for XP/level persistence (AC: #1)
  - [x] 6.1: Update existing `usePlayer.systemTransition.test.js` — change assertions that expect level=1 and XP=0 after `resetForNewSystem()` to expect preserved values
  - [x] 6.2: Add new test: player at level 8 with 450 XP calls `resetForNewSystem()` → level is still 8, XP is still 450
  - [x] 6.3: Add new test: player with pendingLevelUps=2 calls `resetForNewSystem()` → pendingLevelUps is still 2
  - [x] 6.4: Add new test: full transition flow — player earns XP in System 1, transitions, XP/level preserved in System 2

- [x] Task 7: Integration verification (AC: #1-#5)
  - [x] 7.1: Full flow test: gain weapons/boons/levels in System 1 → defeat boss → tunnel → exit → verify all carry to System 2
  - [x] 7.2: Verify XP orb collection in System 2 continues from current XP (not from 0)
  - [x] 7.3: Verify level-up modal in System 2 shows correct level number (not "Level 2" again)
  - [x] 7.4: Verify HUD displays correct persistent state (level, XP bar, weapons, boons, HP)
  - [x] 7.5: Verify full game reset (game over → retry) still resets EVERYTHING including XP/level to 1
  - [x] 7.6: All existing tests pass with no regressions

## Dev Notes

### Architecture Analysis — What Already Works vs What Needs Changing

**Already implemented correctly (Story 7.3):**
- HP persistence: `resetForNewSystem()` preserves `currentHP` and `maxHP`
- Fragment persistence: `resetForNewSystem()` preserves `fragments`
- Permanent upgrades: `resetForNewSystem()` preserves `permanentUpgrades`, all stat multipliers
- Dilemma effects: `resetForNewSystem()` preserves `acceptedDilemmas` and dilemma stat modifiers
- Ship selection: `resetForNewSystem()` preserves `currentShipId` and ship base stats
- Score/kills: `useGame` score and kills are NOT reset on system transition (only on full reset)
- Total elapsed time: `accumulateTime()` action handles cross-system time tracking (Story 7.3)
- Boons: `useBoons.reset()` is NOT called in the tunnel→gameplay transition block — boons persist

**Needs changing (the core of this story):**
- **XP/Level reset**: `resetForNewSystem()` currently resets `currentLevel: 1`, `currentXP: 0`, `xpForNextLevel: XP_REQUIREMENTS[1]` — these lines must be REMOVED
- **pendingLevelUps**: Currently reset to 0 in `resetForNewSystem()` — should be preserved
- **Weapons**: GameLoop tunnel→gameplay block calls `useWeapons.getState().initializeWeapons()` — need to verify this doesn't clear earned weapons. If it does, change to only clear projectiles

### Key Implementation Details

**usePlayer.resetForNewSystem() changes:**
The core change is minimal — remove XP/level/pendingLevelUps from the fields reset by `resetForNewSystem()`. The following fields should be KEPT (not reset):
- `currentLevel` — player's current level
- `currentXP` — XP accumulated toward next level
- `xpForNextLevel` — XP threshold for next level
- `pendingLevelUps` — any unresolved level-ups

The following fields should STILL be reset (combat state):
- `position` — back to origin (0, 0)
- `velocity` — zero out
- `rotation` — reset
- `isDashing`, `dashCooldown`, `dashTimer` — reset
- `isInvulnerable`, `invulnerabilityTimer` — reset
- `damageFlashTimer`, `cameraShakeTimer` — reset

**GameLoop tunnel→gameplay transition verification:**
```javascript
// Current code in GameLoop (from Story 7.3 analysis):
if (phase === 'gameplay' && prevPhaseRef.current === 'tunnel') {
  useEnemies.getState().reset()           // ✅ Clear enemies
  useWeapons.getState().initializeWeapons() // ⚠️ Check if this clears weapons
  useBoss.getState().reset()              // ✅ Clear boss
  spawnSystemRef.current.reset()          // ✅ Reset spawn state
  projectileSystemRef.current.reset()     // ✅ Reset projectile system
  resetParticles()                        // ✅ Clear particles
  resetOrbs()                             // ✅ Clear XP orbs
  // ... time accumulation and timer reset
}
```

The `initializeWeapons()` call is the one to investigate. If it does `set({ activeWeapons: [STARTING_WEAPON] })`, it would overwrite all earned weapons. If it only adds the starting weapon when `activeWeapons` is empty, it's fine.

**Possible fix if initializeWeapons clears weapons:**
```javascript
// Replace in GameLoop tunnel→gameplay block:
// BEFORE: useWeapons.getState().initializeWeapons()
// AFTER:  useWeapons.getState().clearProjectiles() // Only clear projectiles, keep weapons
```

Or add a `clearProjectilesOnly()` method to useWeapons if one doesn't exist.

### What NOT to Change

- Do NOT modify `usePlayer.reset()` — full reset must still clear everything for new runs
- Do NOT modify `useBoons` — boons already persist correctly
- Do NOT modify `useLevel.advanceSystem()` — system state reset is correct
- Do NOT modify `useGame.startGameplay()` — full game start reset is correct
- Do NOT change difficulty scaling — that's Story 18.3's concern
- Do NOT change system timer reset — that's Story 18.2's concern (and already works)

### Project Structure Notes

**Files to MODIFY:**
- `src/stores/usePlayer.jsx` — Remove XP/level/pendingLevelUps reset from `resetForNewSystem()`
- `src/GameLoop.jsx` — Potentially modify tunnel→gameplay block if `initializeWeapons()` clears weapons
- `src/stores/useWeapons.jsx` — Potentially add `clearProjectiles()` method if needed
- `src/stores/__tests__/usePlayer.systemTransition.test.js` — Update tests for XP/level persistence

**Files NOT to modify:**
- `src/stores/useBoons.jsx` — Already persists correctly
- `src/stores/useLevel.jsx` — System state management is correct
- `src/stores/useGame.jsx` — Score/kills persistence is correct
- `src/ui/TunnelHub.jsx` — Transition flow is correct
- `src/config/gameConfig.js` — No config changes needed

### XP Scaling Consideration

With XP and level now persisting across systems, the player will enter System 2 at level ~8-12 (depending on play). The XP curve (from Story 14.3 — infinite level XP scaling) already handles levels beyond 15 with a scaling formula. No changes needed to XP requirements — the existing curve naturally handles higher levels.

However, the level-up choice pool must still work correctly at higher levels. The progressionSystem generates weapon/boon choices — verify it doesn't break when the player is already level 10+ at the start of a system.

### Anti-Patterns to Avoid

- Do NOT add a new `resetForSystemTransition()` method — modify the EXISTING `resetForNewSystem()` instead
- Do NOT store "should persist" flags on individual fields — just remove the reset lines
- Do NOT create a new store for cross-system state — extend existing patterns
- Do NOT change the `reset()` method — it must remain a complete wipe for new runs
- Do NOT touch difficulty scaling — that's Epic 16/Story 18.3 territory

### Testing Approach

**Unit tests (usePlayer system transition):**
- `resetForNewSystem()` preserves currentLevel (e.g., level 8 stays 8)
- `resetForNewSystem()` preserves currentXP (e.g., 450 XP stays 450)
- `resetForNewSystem()` preserves xpForNextLevel
- `resetForNewSystem()` preserves pendingLevelUps
- `resetForNewSystem()` still resets position, velocity, dash, invulnerability
- `reset()` still resets level to 1, XP to 0 (full game reset)

**Unit tests (useWeapons persistence):**
- After system transition, activeWeapons are preserved
- After system transition, projectiles are cleared
- After full reset, activeWeapons are cleared

**Integration tests:**
- Full transition: earn level 8 with 3 weapons → tunnel → System 2 → still level 8 with 3 weapons
- XP continues accumulating from current XP in System 2
- Level-up in System 2 shows correct level number
- Game over → retry → everything resets to level 1

### References

- [Source: src/stores/usePlayer.jsx — resetForNewSystem()] — Current implementation resets XP/level, needs modification
- [Source: src/GameLoop.jsx — tunnel→gameplay transition block] — Entity cleanup on system transition
- [Source: _bmad-output/implementation-artifacts/7-3-tunnel-exit-system-transition.md] — Story 7.3 established system transition architecture
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — Store reset() patterns, GameLoop orchestration
- [Source: _bmad-output/planning-artifacts/epic-18-cross-system-progression.md#Story 18.1] — Epic AC source
- [Source: src/stores/__tests__/usePlayer.systemTransition.test.js] — Existing tests to update
- [Source: src/config/gameConfig.js] — XP_REQUIREMENTS, MAX_SYSTEMS, SYSTEM_TIMER constants

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blockers.

### Completion Notes List

- ✅ Removed XP/level/pendingLevelUps/levelsGainedThisBatch reset from `resetForNewSystem()` — these now persist across system transitions
- ✅ Added `clearProjectiles()` method to useWeapons store — clears projectiles and resets cooldown timers without touching activeWeapons
- ✅ Changed GameLoop tunnel→gameplay block from `initializeWeapons()` to `clearProjectiles()` — weapons now persist, only projectiles are cleared
- ✅ Verified boons, HP, fragments, score, permanent upgrades, dilemma stats all already persist correctly (no changes needed)
- ✅ Updated 2 stale test assertions in other test files that expected old XP-reset behavior
- ✅ Added 6 new tests: XP/level preservation, pendingLevelUps preservation, _appliedMaxHPBonus preservation, full reset still works, full transition flow
- ✅ Added 3 new tests for clearProjectiles(): preserves weapons, resets projectile IDs, resets cooldown timers
- ✅ Full regression suite: 73 files, 1132 tests — all pass

### Change Log

- Story 18.1 implementation complete (Date: 2026-02-14)
- Code review fixes: added 2 tests for weapon override persistence through clearProjectiles(), updated multi-tunnel integration test to verify XP persistence with non-zero values (Date: 2026-02-14)

### File List

- `src/stores/usePlayer.jsx` — Modified: removed XP/level reset from `resetForNewSystem()`
- `src/stores/useWeapons.jsx` — Modified: added `clearProjectiles()` method
- `src/GameLoop.jsx` — Modified: tunnel→gameplay transition uses `clearProjectiles()` instead of `initializeWeapons()`
- `src/stores/__tests__/usePlayer.systemTransition.test.js` — Modified: updated XP/level assertions, added 5 new tests
- `src/stores/__tests__/useWeapons.test.js` — Modified: added 3 new tests for `clearProjectiles()`
- `src/stores/__tests__/usePlayer.fragments.test.js` — Modified: updated XP/level assertion to expect preservation
- `src/stores/__tests__/tunnelHub.integration.test.js` — Modified: updated XP/level assertion to expect preservation
