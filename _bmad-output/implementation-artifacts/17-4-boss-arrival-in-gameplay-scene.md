# Story 17.4: Boss Arrival in Gameplay Scene

Status: ready-for-dev

## Story

As a player,
I want the boss to arrive dramatically in the gameplay scene rather than teleporting me to a separate arena,
So that the boss fight feels like an invasion of my space and the transition is seamless.

## Acceptance Criteria

1. **Wormhole Activation Triggers Boss Spawn (Not Scene Change):** Given the player activates the wormhole, when the activation sequence begins, then the existing shockwave effect clears all enemies from the screen (as per Story 6.1) and the wormhole visual intensifies (swirling faster, brighter glow). A dramatic sound effect plays (deep rumble, energy surge). The game does NOT transition to BossScene.

2. **Boss Materializes in GameplayScene:** Given the shockwave completes, when the boss spawn begins, then the boss materializes near the wormhole position in the current GameplayScene. The boss entry uses a particle burst or energy explosion effect. The boss model (SpaceshipBoss.glb) scales up from small (0.1) to full size over 1-1.5 seconds.

3. **Wormhole Enters Inactive State During Boss Fight:** Given the boss has arrived, when it is fully spawned, then the wormhole remains visible but enters an "inactive" state (dimmed glow, slow swirl). The wormhole does not respond to player proximity while the boss is alive. The boss HP bar appears at the top-center of the screen (existing BossHPBar component).

4. **Same Environment Persists:** Given the boss is active, when the gameplay scene continues, then the same EnvironmentRenderer, GroundPlane, and starfield remain visible (no scene transition). The player retains full control and can move freely in the play area. The boss uses the same collision and combat systems as the current boss fight (same AI tick, same projectile system).

5. **Boss Defeat Reactivates Wormhole:** Given the boss is defeated, when its HP reaches 0, then the boss death animation plays (large explosion, particles — existing defeatTick system). The wormhole reactivates (glow intensifies, swirling accelerates). A visual indicator shows the wormhole is now interactive (pulsing glow, particle effects).

6. **Post-Defeat Wormhole Transition:** Given the player approaches the reactivated wormhole, when they enter its activation zone, then a white flash transition (200ms) occurs and the game transitions to the TunnelScene (or victory if system 3).

7. **Performance:** Given the boss fight occurs in GameplayScene, when rendering alongside existing environment, starfield, and wormhole, then frame rate remains at 60 FPS. No additional scenes are loaded.

## Tasks / Subtasks

- [ ] Task 1: Add boss-in-gameplay config constants (AC: #2, #3, #5)
  - [ ] 1.1 Add `BOSS_SPAWN` config block to `gameConfig.js`:
    - `SPAWN_SCALE_DURATION: 1.2` (seconds for scale-up animation)
    - `SPAWN_OFFSET_FROM_WORMHOLE: 0` (spawn at wormhole position)
    - `BOSS_PLAY_AREA_SIZE: 400` (constrain boss movement within smaller zone centered on origin, like current arena)
  - [ ] 1.2 Add `WORMHOLE_INACTIVE` config:
    - `EMISSIVE_INTENSITY: 0.1`
    - `SWIRL_SPEED: 0.1`
    - `PARTICLE_SPEED: 0.2`

- [ ] Task 2: Add new wormhole states to useLevel store (AC: #3, #5)
  - [ ] 2.1 Extend `wormholeState` to support two new values: `'inactive'` (during boss fight) and `'reactivated'` (after boss defeat)
  - [ ] 2.2 Add `setWormholeInactive()` action — sets wormholeState to `'inactive'`
  - [ ] 2.3 Add `reactivateWormhole()` action — sets wormholeState to `'reactivated'`
  - [ ] 2.4 Update `reset()` to handle new states (reset to `'hidden'` as before)

- [ ] Task 3: Move boss combat from BossScene into GameplayScene (AC: #2, #4)
  - [ ] 3.1 Add `<BossRenderer />` and `<BossProjectileRenderer />` to GameplayScene.jsx, conditionally rendered when `useBoss.isActive || useBoss.bossDefeated`
  - [ ] 3.2 Import BossRenderer and BossProjectileRenderer from existing renderers
  - [ ] 3.3 Keep PlayerShip, ProjectileRenderer, ParticleRenderer already present

- [ ] Task 4: Merge boss tick logic into GameLoop gameplay section (AC: #1, #4)
  - [ ] 4.1 In GameLoop gameplay tick (after section 7f-bis wormhole activation completes), detect when wormhole reaches `'active'` state (currently triggers `setPhase('boss')`)
  - [ ] 4.2 Instead of `setPhase('boss')`, call `useBoss.getState().spawnBoss(currentSystem)` to spawn boss in-place and call `useLevel.getState().setWormholeInactive()`
  - [ ] 4.3 Add a new `isBossActive` check in gameplay tick: when `useBoss.getState().isActive` is true, run boss AI tick (section 5 equivalent from boss phase) and boss collision detection (section 6 equivalent from boss phase) WITHIN the gameplay tick
  - [ ] 4.4 Disable enemy spawning when boss is active (enemies already cleared by shockwave, prevent respawn)
  - [ ] 4.5 Disable system timer countdown during boss fight (timer should pause or not trigger game over)
  - [ ] 4.6 Handle boss defeat: when `bossDefeated` becomes true, run `defeatTick()` logic, then on animation complete call `useLevel.getState().reactivateWormhole()` instead of `setPhase('tunnel')` or `triggerVictory()`

- [ ] Task 5: Handle post-boss wormhole transition (AC: #5, #6)
  - [ ] 5.1 After boss defeat animation completes and wormhole is `'reactivated'`, add proximity check in gameplay tick: when player enters wormhole zone, trigger white flash + transition to tunnel (or victory for system 3)
  - [ ] 5.2 Reuse existing `WhiteFlashTransition` component for the flash
  - [ ] 5.3 On transition: `setPhase('tunnel')` or `triggerVictory()` depending on `currentSystem`

- [ ] Task 6: Update WormholeRenderer for new states (AC: #3, #5)
  - [ ] 6.1 Add `'inactive'` state handling in WormholeRenderer: dim glow, very slow swirl, muted color
  - [ ] 6.2 Add `'reactivated'` state handling: bright pulsing glow, fast particles, inviting visual (similar to `'active'` but with pulsing)
  - [ ] 6.3 Use config values from `WORMHOLE_INACTIVE` for the inactive visual state

- [ ] Task 7: Update Experience.jsx — remove BossScene dependency (AC: #4)
  - [ ] 7.1 Remove or disable `showBoss` condition and BossScene rendering since boss now renders inside GameplayScene
  - [ ] 7.2 Update `showGameplay` condition: boss fight now happens during `phase === 'gameplay'` (no separate boss phase needed)
  - [ ] 7.3 Handle `prevCombatPhase` updates: level-up during boss fight should keep GameplayScene mounted (set `prevCombatPhase` to `'gameplay'` not `'boss'`)

- [ ] Task 8: Add boss spawn visual effect (AC: #2)
  - [ ] 8.1 In BossRenderer, add a scale-up animation when boss first spawns: scale from 0.1 to 1.0 over `BOSS_SPAWN.SPAWN_SCALE_DURATION` seconds (ease-out)
  - [ ] 8.2 Add particle burst on spawn (reuse existing explosion particle system from ParticleRenderer)
  - [ ] 8.3 Spawn boss at wormhole position (read from `useLevel.getState().wormhole`)

- [ ] Task 9: Update BossHPBar rendering in Interface.jsx (AC: #3)
  - [ ] 9.1 Currently BossHPBar renders when `phase === 'boss'`. Change condition to render when `useBoss.isActive` regardless of phase
  - [ ] 9.2 Ensure BossHPBar shows during gameplay phase when boss is present

- [ ] Task 10: Clean up BossScene (AC: #4, #7)
  - [ ] 10.1 BossScene.jsx can be kept as dead code for reference or removed entirely
  - [ ] 10.2 Remove boss phase handling from GameLoop (the separate boss tick section at lines 115-323) since boss logic is now merged into gameplay tick
  - [ ] 10.3 Remove `showBoss` rendering path from Experience.jsx

- [ ] Task 11: Testing & validation (AC: #1-#7)
  - [ ] 11.1 Verify existing boss-related tests still pass (useBoss tests, boss collision tests)
  - [ ] 11.2 Manual playtest: full flow — wormhole activation → shockwave → boss spawn in gameplay → boss fight → defeat → wormhole reactivation → tunnel transition
  - [ ] 11.3 Verify 60 FPS during boss fight in GameplayScene with r3f-perf
  - [ ] 11.4 Verify boss movement is properly constrained (does not fly off screen)
  - [ ] 11.5 Verify level-up during boss fight works correctly (GameplayScene stays mounted, boss stays active)
  - [ ] 11.6 Verify game over during boss fight works correctly
  - [ ] 11.7 Verify system 3 boss defeat triggers victory (not tunnel transition)

## Dev Notes

### Architecture & Pattern Compliance

**6-Layer Architecture Adherence:**
- **Config (Layer 1):** `BOSS_SPAWN` and `WORMHOLE_INACTIVE` config blocks in `gameConfig.js`. No magic numbers.
- **Stores (Layer 3):** `useLevel.jsx` gets two new wormhole states (`'inactive'`, `'reactivated'`) and corresponding actions. `useBoss.jsx` unchanged — same spawn/tick/damage/defeat API.
- **GameLoop (Layer 4):** Boss tick logic merges INTO the gameplay tick section. The separate boss tick section (lines 115-323) becomes dead code and can be removed. Critical: maintain deterministic tick order — boss AI ticks AFTER player movement, BEFORE collision resolution.
- **Rendering (Layer 5):** `BossRenderer` and `BossProjectileRenderer` move from BossScene to GameplayScene. They read state from `useBoss` via `getState()` — same pattern, different parent scene.
- **UI (Layer 6):** `BossHPBar` condition changes from `phase === 'boss'` to `useBoss.isActive`. No new UI components needed.

**Store Pattern — No New Stores:**
- `useBoss.jsx` is unchanged — same API (`spawnBoss`, `tick`, `damageBoss`, `defeatTick`, `reset`)
- `useLevel.jsx` gets two new wormhole states and two actions
- `useGame.jsx` may no longer need `'boss'` phase at all (boss fight happens during `'gameplay'` phase)

**Critical: Phase Simplification**
- Currently: `gameplay` → wormhole activates → `boss` → boss defeated → `tunnel`/`victory`
- New: `gameplay` → wormhole activates → boss spawns (still in `gameplay`) → boss defeated → wormhole reactivated → player enters wormhole → `tunnel`/`victory`
- The `'boss'` phase in useGame may become unused. Do NOT remove it yet — mark as deprecated. Other code may reference it (level-up `prevCombatPhase`, GameLoop checks, Interface conditionals).

### Critical Implementation Details

**Boss Movement Constraints:**
- Current BossScene constrains boss to `BOSS_ARENA_SIZE` (400 units half-width).
- In GameplayScene, the play area is `PLAY_AREA_SIZE` (2000 units half-width) — much larger.
- The boss AI `tick()` in `useBoss.jsx` clamps position to `BOSS_ARENA_SIZE`. This should work unchanged — boss stays in a 400-unit zone while player can roam the full 2000-unit area.
- However, boss should be centered around origin (where wormhole is), not around player. Verify `useBoss.tick()` clamps to `[-BOSS_ARENA_SIZE, BOSS_ARENA_SIZE]` centered on origin, not on player position.

**Collision System Integration:**
- Current boss phase uses a SEPARATE collision detection section in GameLoop (lines 150-220).
- Boss projectiles vs player: same pattern as enemy projectiles vs player (spatial hash or direct distance check).
- Player projectiles vs boss: direct distance check against boss position + collision radius.
- Boss contact damage: distance check player vs boss position.
- These collision checks must run WITHIN the gameplay tick, AFTER projectile movement and BEFORE damage resolution.
- **Do NOT run enemy collision AND boss collision simultaneously** — enemies are cleared before boss spawns, so the enemy collision section can run but will find zero enemies.

**Enemy Spawn Suppression:**
- When boss is active, enemy spawning must be disabled.
- Check: in section 5 of gameplay tick, skip `spawnSystem.tick()` when `useBoss.getState().isActive` is true.
- Enemies were already cleared by the shockwave on wormhole activation. No new enemies should spawn during boss fight.

**System Timer During Boss Fight:**
- The system timer counts down to force game-over if time expires.
- During boss fight, timer should PAUSE (do not count down).
- Check: in section 7f, skip `systemTimer -= delta` when boss is active.
- Alternative: timer can continue but game-over check is skipped. Simpler implementation.

**Level-Up During Boss Fight:**
- XP orbs are not spawned during boss fight (no enemies to kill → no XP drops).
- However, the boss itself may drop XP on defeat (check: `BOSS_FRAGMENT_REWARD` gives fragments, not XP).
- If player somehow gains XP during boss fight (e.g., from boss damage XP), level-up should trigger normally.
- `prevCombatPhase` should remain `'gameplay'` (not `'boss'`) since GameplayScene stays mounted.
- Verify: `useGame.setPhase('levelUp')` sets `prevCombatPhase = phase` which will be `'gameplay'`. This is correct.

**Boss Defeat Flow — Key Changes:**
1. Current: `defeatTick()` animation → `setPhase('tunnel')` or `triggerVictory()`
2. New: `defeatTick()` animation → `reactivateWormhole()` → player flies to wormhole → white flash → `setPhase('tunnel')` or `triggerVictory()`
3. This adds an extra step (player must fly to wormhole) which gives more agency.
4. The trigger for tunnel/victory is now in the gameplay tick's wormhole proximity check, not in the boss defeat handler.

**BossRenderer Position:**
- Currently BossRenderer reads `boss.x` and `boss.z` from `useBoss` state.
- In GameplayScene, these coordinates are in world space (origin = center).
- Boss spawns at wormhole position: set initial `boss.x = wormhole.x`, `boss.z = wormhole.z` in `spawnBoss()`.
- Current `spawnBoss()` sets `x: 0, z: -100`. Need to update this to spawn at wormhole position.
- Pass wormhole position to `spawnBoss()`: `spawnBoss(currentSystem, wormholePos)`.

**Lighting Considerations:**
- BossScene had custom purple lighting and purple-tinted starfield.
- GameplayScene has standard white lighting (ambient 0.35, directional white).
- The boss model will look different under gameplay lighting vs boss arena lighting.
- Decision: Keep gameplay lighting. The boss invasion should feel like the boss is entering the PLAYER's space, not the other way around. The wormhole glow and boss model emission provide sufficient visual distinction.
- Do NOT change gameplay lighting when boss spawns — this avoids complexity and keeps the "invasion" feel.

### Files to Modify

| File | Change |
|------|--------|
| `src/config/gameConfig.js` | Add `BOSS_SPAWN` and `WORMHOLE_INACTIVE` config blocks |
| `src/stores/useLevel.jsx` | Add `'inactive'` and `'reactivated'` wormhole states, actions |
| `src/scenes/GameplayScene.jsx` | Add BossRenderer + BossProjectileRenderer (conditional) |
| `src/GameLoop.jsx` | Merge boss tick into gameplay section, change wormhole→boss flow, add post-defeat wormhole logic |
| `src/Experience.jsx` | Remove/disable BossScene rendering, update showGameplay conditions |
| `src/ui/Interface.jsx` | Update BossHPBar condition from phase to useBoss.isActive |
| `src/renderers/WormholeRenderer.jsx` | Add `'inactive'` and `'reactivated'` state visuals |
| `src/stores/useBoss.jsx` | Update `spawnBoss()` to accept wormhole position for initial placement |

### Files NOT Modified (Keep As-Is)

| File | Reason |
|------|--------|
| `src/stores/useGame.jsx` | Phase `'boss'` left as-is (deprecated but not removed). Boss fight happens during `'gameplay'` phase. |
| `src/stores/useWeapons.jsx` | Weapon system unchanged — same firing pattern works for boss fight |
| `src/stores/usePlayer.jsx` | Player movement unchanged — full play area during boss fight |
| `src/renderers/BossRenderer.jsx` | Logic unchanged — just moved to different parent scene. Add spawn scale-up animation. |
| `src/renderers/BossProjectileRenderer.jsx` | Logic unchanged — just moved to different parent scene |
| `src/ui/WhiteFlashTransition.jsx` | Reused as-is for boss defeat → tunnel transition |

### Files to Potentially Remove

| File | Reason |
|------|--------|
| `src/scenes/BossScene.jsx` | No longer used — boss renders in GameplayScene. Keep as reference or remove. |

### Project Structure Notes

- No new files created — all changes are modifications to existing files
- BossRenderer moves from BossScene to GameplayScene (same component, different parent)
- Architecture alignment: boss fight is now a "mode" within gameplay, not a separate scene
- Store layer changes are minimal (2 new wormhole states in useLevel)
- GameLoop changes are the most significant — merging ~200 lines of boss tick into gameplay tick

### Performance Budget

- Net zero scene changes: BossScene unmounted, BossRenderer + BossProjectileRenderer mounted in GameplayScene instead
- During boss fight: no enemies rendered (cleared by shockwave, spawning disabled) — reduces draw calls
- Wormhole in inactive state: reduced particle/shader intensity — slight performance gain
- Boss spawn animation: 1 scale tween + 1 particle burst (reuse existing explosion particles) — negligible cost
- Total: Performance should be equal or slightly better than current BossScene approach (one less scene mount/unmount)

### Testing Approach

- **Existing tests:** `useBoss` tests should pass unchanged (store API unchanged). GameLoop tests may need updates if they test boss phase branching.
- **Reset test:** Ensure `useLevel.reset()` handles new wormhole states. Ensure `useBoss.reset()` unchanged.
- **Manual playtest priority list:**
  1. Full flow: wormhole activation → boss spawn → fight → defeat → wormhole reactivation → tunnel entry
  2. Boss AI behavior in gameplay environment (movement constraints, attack patterns)
  3. Level-up during boss fight (if possible)
  4. Game over during boss fight (player death)
  5. System 3 boss defeat → victory trigger
  6. Performance validation with r3f-perf

### Previous Story Intelligence

**From Story 17.1 (review):**
- Introduced `'systemEntry'` phase with `SystemEntryPortal` renderer in GameplayScene
- `WhiteFlashTransition` component created and wired in Interface.jsx — reuse for boss defeat transition
- `showGameplay` condition in Experience.jsx already includes multiple phases — extend pattern
- GameLoop skips gameplay ticks during `'systemEntry'` — similar pattern for boss spawn animation if needed
- Completion notes confirm: SystemEntryPortal uses direct `usePlayer.setState()` for ship positioning during animation

**From Story 17.3 (ready-for-dev):**
- Wormhole visual overhaul replaces torus with shader sphere + orbital particles
- Already planned for `hidden/visible/activating/active` states — Story 17.4 adds `inactive` and `reactivated`
- WormholeRenderer reads state from `useLevel.getState()` — add new state handling in useFrame
- Story 17.3 explicitly notes: "Story 17.4 will add states as needed" — confirms coordination

**From Story 6.1 (done):**
- Shockwave effect clears all enemies on wormhole activation — this logic stays in GameLoop
- Enemy clearing is handled by `useEnemies.getState().clearAllEnemies()` — reuse as-is

**From Story 6.2 (done):**
- BossHPBar component exists and works — just change rendering condition
- Boss combat system (tick, damage, projectiles) fully functional — reuse entire API

### Git Intelligence

Recent commits focus on visual polish (Stories 14.x, 15.x) and cinematic transitions (Story 17.1). The codebase consistently uses:
- Config constants grouped by feature in `gameConfig.js`
- Zustand stores with `getState()` in useFrame for non-reactive reads
- GameLoop deterministic tick sections with phase-based branching
- Conditional component rendering based on store state

### References

- [Source: _bmad-output/planning-artifacts/epic-17-cinematic-transitions.md#Story 17.4]
- [Source: _bmad-output/implementation-artifacts/17-1-system-entry-portal-animation.md — systemEntry phase, WhiteFlashTransition, Experience.jsx changes]
- [Source: _bmad-output/implementation-artifacts/17-3-wormhole-visual-overhaul.md — wormhole states, WormholeRenderer patterns]
- [Source: src/scenes/BossScene.jsx — current boss arena implementation to replace]
- [Source: src/scenes/GameplayScene.jsx — target scene for boss integration]
- [Source: src/GameLoop.jsx — boss tick (lines 115-323), gameplay tick (lines 325-611), wormhole logic (section 7f-bis)]
- [Source: src/stores/useBoss.jsx — spawnBoss, tick, damageBoss, defeatTick API]
- [Source: src/stores/useLevel.jsx — wormholeState, wormhole position]
- [Source: src/stores/useGame.jsx — phase management, prevCombatPhase]
- [Source: src/Experience.jsx — showGameplay/showBoss conditions]
- [Source: src/config/gameConfig.js — BOSS_* constants, PLAY_AREA_SIZE, BOSS_ARENA_SIZE]
- [Source: src/ui/Interface.jsx — BossHPBar conditional rendering]
- [Source: src/renderers/WormholeRenderer.jsx — state-based visual animation]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
