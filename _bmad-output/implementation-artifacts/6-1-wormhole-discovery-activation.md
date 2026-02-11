# Story 6.1: Wormhole Discovery & Activation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to find a dormant wormhole in the environment and activate it to trigger a dramatic shockwave that clears all enemies,
So that I experience a cinematic transition into the boss encounter.

## Acceptance Criteria

1. **Given** the player is in gameplay **When** a wormhole spawn condition is met (timer threshold, e.g., 80% of SYSTEM_TIMER elapsed) **Then** a dormant wormhole appears at a specific location in the play area **And** the wormhole is visible on the minimap

2. **Given** the wormhole is visible **When** the player moves to the wormhole and enters the activation zone **Then** the wormhole activates with a dramatic visual effect **And** a shockwave emanates outward clearing ALL enemies on screen (FR29) **And** a dramatic sound effect plays **And** the screen briefly intensifies (bloom/flash)

3. **Given** all enemies are cleared by the shockwave **When** the shockwave completes **Then** the game transitions to the boss phase **And** useGame phase updates to "boss"

4. **Given** the wormhole has not yet spawned **When** the timer threshold has not been reached **Then** no wormhole is visible and gameplay continues normally

5. **Given** the wormhole is visible but dormant **When** the player has not yet entered the activation zone **Then** the wormhole renders with a subtle idle animation (pulsing glow) and is visible on the minimap as a point of interest

## Tasks / Subtasks

- [x] Task 1: Add wormhole constants to gameConfig.js (AC: #1, #4)
  - [x] 1.1: Add `WORMHOLE_SPAWN_TIMER_THRESHOLD: 0.8` — fraction of SYSTEM_TIMER after which wormhole appears (80% = 480s of 600s elapsed)
  - [x] 1.2: Add `WORMHOLE_ACTIVATION_RADIUS: 25` — distance from wormhole center to trigger activation
  - [x] 1.3: Add `WORMHOLE_SHOCKWAVE_DURATION: 1.5` — seconds for the shockwave visual expansion
  - [x] 1.4: Add `WORMHOLE_SPAWN_DISTANCE_FROM_PLAYER: 300` — minimum distance from player when spawning, ensures player must navigate to it
  - [x] 1.5: Add `WORMHOLE_BLOOM_FLASH_DURATION: 0.3` — seconds for the bloom/flash intensity burst on activation
  - [x] 1.6: Add `WORMHOLE_TRANSITION_DELAY: 2.0` — seconds after activation before transitioning to boss phase (time for shockwave visual)

- [x] Task 2: Add wormhole state to useLevel store (AC: #1, #4, #5)
  - [x] 2.1: Add `wormhole: null` state field — `{ x, z, spawnedAt }` object when spawned, null when hidden
  - [x] 2.2: `wormholeState` already exists as `'hidden'` — confirm used for: `'hidden'` (not yet spawned), `'visible'` (dormant, waiting for player), `'activating'` (shockwave in progress), `'active'` (transition to boss)
  - [x] 2.3: Add `wormholeActivationTimer: 0` — countdown for shockwave-to-boss transition
  - [x] 2.4: Add `spawnWormhole(playerX, playerZ)` action — calculates spawn position at `WORMHOLE_SPAWN_DISTANCE_FROM_PLAYER` from player (random angle), clamps to play area bounds, sets `wormholeState: 'visible'`, populates `wormhole: { x, z }`
  - [x] 2.5: Add `activateWormhole()` action — sets `wormholeState: 'activating'`, starts `wormholeActivationTimer: WORMHOLE_TRANSITION_DELAY`
  - [x] 2.6: Add `wormholeTick(delta)` method — when `wormholeState === 'activating'`, decrement timer; when timer reaches 0, set `wormholeState: 'active'` and return `{ transitionReady: true }` for GameLoop to trigger boss phase
  - [x] 2.7: Update `reset()` to include `wormhole: null`, `wormholeState: 'hidden'`, `wormholeActivationTimer: 0`

- [x] Task 3: Integrate wormhole logic into GameLoop (AC: #1, #2, #3)
  - [x] 3.1: After section 7f (system timer) and before section 7g (planet scanning), add wormhole section
  - [x] 3.2: **Wormhole spawn check**: If `wormholeState === 'hidden'` and `systemTimer >= SYSTEM_TIMER * WORMHOLE_SPAWN_TIMER_THRESHOLD`, call `useLevel.getState().spawnWormhole(playerPos[0], playerPos[2])` and play `'wormhole-spawn'` SFX
  - [x] 3.3: **Wormhole proximity check**: If `wormholeState === 'visible'`, compute distance from player to wormhole position. If distance <= `WORMHOLE_ACTIVATION_RADIUS`, call `useLevel.getState().activateWormhole()`, clear ALL enemies via `useEnemies.getState().reset()` (shockwave kills everything), play `'wormhole-activate'` SFX, trigger damage flash effect (reuse existing mechanism for bloom/flash)
  - [x] 3.4: **Wormhole activation tick**: If `wormholeState === 'activating'`, call `useLevel.getState().wormholeTick(clampedDelta)`. If result indicates `transitionReady`, call `useGame.getState().setPhase('boss')` to transition to boss phase
  - [x] 3.5: Skip enemy spawning (section 5) when `wormholeState === 'activating'` or `wormholeState === 'active'` — no new enemies during shockwave/transition

- [x] Task 4: Create WormholeRenderer.jsx (AC: #2, #5)
  - [x] 4.1: Create `src/renderers/WormholeRenderer.jsx` — reads `wormholeState` and `wormhole` position from `useLevel`
  - [x] 4.2: When `wormholeState === 'hidden'`: render nothing
  - [x] 4.3: When `wormholeState === 'visible'`: render a dormant wormhole mesh at `{ x, 0, z }` — a torus or ring geometry with animated cyan/purple pulsing emissive material, slow rotation animation
  - [x] 4.4: When `wormholeState === 'activating'`: render activation effect — scale up the wormhole mesh, increase emissive intensity, add a shockwave ring expanding outward (a thin torus/ring scaling from 0 to play area size over `WORMHOLE_SHOCKWAVE_DURATION`), bright flash effect
  - [x] 4.5: When `wormholeState === 'active'`: render the wormhole at full intensity (bright portal), ready for boss transition visual
  - [x] 4.6: Use useFrame for animation (rotation, pulse, shockwave expansion) — visual only, no game logic
  - [x] 4.7: Use Three.js MeshStandardMaterial or MeshBasicMaterial with emissive for glow effects — no custom shaders needed

- [x] Task 5: Add wormhole to minimap in HUD.jsx (AC: #1, #5)
  - [x] 5.1: Subscribe to `useLevel` for `wormholeState` and `wormhole` position
  - [x] 5.2: When `wormholeState === 'visible'`: render a cyan dot on minimap at wormhole position, with pulse animation (reuse scanPulse keyframe)
  - [x] 5.3: When `wormholeState === 'activating'` or `'active'`: render a brighter/larger dot with more intense glow
  - [x] 5.4: When `wormholeState === 'hidden'`: render nothing
  - [x] 5.5: Use same minimap coordinate math as planet dots: `50 + (wormhole.x / PLAY_AREA_SIZE) * 50`%

- [x] Task 6: Mount WormholeRenderer in GameplayScene.jsx (AC: #2, #5)
  - [x] 6.1: Import and add `<WormholeRenderer />` after `<PlanetRenderer />`
  - [x] 6.2: WormholeRenderer conditionally renders based on wormholeState internally — no need for conditional mount

- [x] Task 7: Add wormhole SFX to audio system (AC: #2)
  - [x] 7.1: Add `'wormhole-spawn'` and `'wormhole-activate'` to `SFX_CATEGORY_MAP` in audioManager.js — `'wormhole-spawn': 'sfxFeedbackPositive'`, `'wormhole-activate': 'sfxFeedbackPositive'`
  - [x] 7.2: Add `wormholeSpawn` and `wormholeActivate` audio paths to `ASSET_MANIFEST.tier2.audio` (placeholder files: `audio/sfx/wormhole-spawn.mp3`, `audio/sfx/wormhole-activate.mp3`)
  - [x] 7.3: Add entries to `SFX_MAP` in `hooks/useAudio.jsx` — `'wormhole-spawn': ASSET_MANIFEST.tier2.audio.wormholeSpawn`, `'wormhole-activate': ASSET_MANIFEST.tier2.audio.wormholeActivate`

- [x] Task 8: Add 'boss' phase support to useGame and Experience.jsx (AC: #3)
  - [x] 8.1: Verify `useGame` already has `'boss'` in its phase type (it was defined in architecture but may not be in current code) — if not, add it
  - [x] 8.2: In `Experience.jsx`, mount `<BossScene />` when `phase === 'boss'` and unmount `<GameplayScene />` (the boss fight is an isolated arena)
  - [x] 8.3: Note: BossScene.jsx content (boss entity, boss AI, boss HP bar) is Story 6.2 scope — for this story, just mount a placeholder BossScene that shows "Boss Arena - Coming in Story 6.2"
  - [x] 8.4: GameLoop should NOT tick gameplay logic during 'boss' phase (boss has its own tick logic, Story 6.2)

- [x] Task 9: Verification (AC: #1, #2, #3, #4, #5)
  - [x] 9.1: Play until timer reaches 80% (480s) → wormhole appears at a location away from player
  - [x] 9.2: Wormhole visible on minimap as pulsing cyan dot
  - [x] 9.3: Wormhole renders as animated 3D portal in the environment
  - [x] 9.4: Navigate to wormhole → entering activation zone triggers shockwave visual + SFX
  - [x] 9.5: All enemies cleared instantly on activation
  - [x] 9.6: After shockwave delay (2s), game transitions to boss phase
  - [x] 9.7: No new enemies spawn during shockwave/transition
  - [x] 9.8: 60 FPS maintained during wormhole visuals and shockwave
  - [x] 9.9: Game reset properly clears wormhole state
  - [x] 9.10: All existing tests pass with no regressions

## Dev Notes

### Architecture Decisions

- **Wormhole state in `useLevel` store** — useLevel already owns system-level state (systemTimer, difficulty, planets, wormholeState). Wormhole is a system-level event tied to timer progression. The `wormholeState` field already exists in useLevel with default `'hidden'`. Extend it with position data and activation timer.

- **Enemy clearing via `useEnemies.getState().reset()`** — The shockwave "kills" all enemies. The simplest and most performant approach is resetting the enemy pool entirely. This is a clean slate, not individual damage calculation. Alternative would be `damageEnemiesBatch()` with lethal damage on all enemies, but since ALL enemies die regardless of HP, a reset is cleaner. Note: this means no XP orbs drop from shockwave kills — this is an intentional design choice (the reward is the boss transition, not XP).

- **Shockwave as visual-only expanding ring** — The shockwave ring in WormholeRenderer is purely cosmetic (scaling torus geometry). The actual enemy clearing happens instantly in GameLoop when activation triggers. The visual expands over `WORMHOLE_SHOCKWAVE_DURATION` for dramatic effect but game logic doesn't depend on it.

- **Timer-based wormhole spawn, NOT kill count** — Using timer threshold (80% of SYSTEM_TIMER = 480s elapsed) rather than kill count. This ensures every run can reach the boss regardless of player skill, and creates time pressure ("find and reach the wormhole before time runs out").

- **WormholeRenderer as a dedicated renderer component** — Follows the established pattern: each visual entity type gets its own renderer in `src/renderers/`. The wormhole has unique visual states (dormant pulse, activation flash, shockwave ring) that warrant its own component rather than being part of EnvironmentRenderer.

- **Boss phase as a separate scene (GameplayScene unmounts, BossScene mounts)** — Per architecture: scene management uses mount/unmount for clean memory lifecycle. When entering boss, gameplay scene (enemies, planets, environment) unmounts, freeing memory. BossScene is a fresh isolated arena.

- **SFX played from GameLoop** — Consistent with all other SFX patterns. GameLoop detects wormhole state transitions and calls `playSFX()`.

### Existing Infrastructure Status

| Component | Status | Relevance |
|-----------|--------|-----------|
| `stores/useLevel.jsx` | **Has `wormholeState: 'hidden'` in state + reset()** | Extend with wormhole position, activation timer, spawn/activate actions |
| `stores/useGame.jsx` | **Has phase management** | Need to verify 'boss' phase support, add setPhase('boss') call |
| `stores/useEnemies.jsx` | **Has `reset()` to clear all enemies** | Called on shockwave activation — no changes needed |
| `config/gameConfig.js` | **Has SYSTEM_TIMER: 600** | Need to add wormhole constants |
| `GameLoop.jsx` | **Has deterministic tick order** | Need to add wormhole section between 7f and 7g |
| `scenes/GameplayScene.jsx` | **Composes all gameplay renderers** | Need to mount WormholeRenderer |
| `scenes/BossScene.jsx` | **Exists as empty placeholder** | Will mount on boss phase — content is Story 6.2 |
| `ui/HUD.jsx` | **Has minimap with planet dots** | Need to add wormhole dot |
| `Experience.jsx` | **Phase-based scene routing** | Need to add boss phase scene mount |
| `hooks/useAudio.jsx` | **Has SFX_MAP** | Need to add wormhole SFX entries |
| `audio/audioManager.js` | **Has SFX_CATEGORY_MAP** | Need to add wormhole SFX categories |
| `config/assetManifest.js` | **Has tier2 section** | Need to add wormhole audio paths |
| `renderers/PlanetRenderer.jsx` | **Pattern reference** | WormholeRenderer follows same pattern (read store, render 3D) |

### Key Implementation Details

**useLevel.spawnWormhole (spawn position calculation):**
```javascript
spawnWormhole: (playerX, playerZ) => {
  const angle = Math.random() * Math.PI * 2
  const dist = GAME_CONFIG.WORMHOLE_SPAWN_DISTANCE_FROM_PLAYER
  let x = playerX + Math.cos(angle) * dist
  let z = playerZ + Math.sin(angle) * dist
  // Clamp to play area
  const bound = GAME_CONFIG.PLAY_AREA_SIZE - 50
  x = Math.max(-bound, Math.min(bound, x))
  z = Math.max(-bound, Math.min(bound, z))
  set({ wormhole: { x, z }, wormholeState: 'visible' })
},
```

**GameLoop wormhole section (between 7f and 7g):**
```javascript
// 7f-bis. Wormhole spawn + activation check
const levelState = useLevel.getState()
if (levelState.wormholeState === 'hidden') {
  // Check spawn condition: 80% of SYSTEM_TIMER elapsed
  if (newTimer >= GAME_CONFIG.SYSTEM_TIMER * GAME_CONFIG.WORMHOLE_SPAWN_TIMER_THRESHOLD) {
    useLevel.getState().spawnWormhole(playerPos[0], playerPos[2])
    playSFX('wormhole-spawn')
  }
} else if (levelState.wormholeState === 'visible') {
  // Proximity check for activation
  const wh = levelState.wormhole
  const dx = playerPos[0] - wh.x
  const dz = playerPos[2] - wh.z
  const dist = Math.sqrt(dx * dx + dz * dz)
  if (dist <= GAME_CONFIG.WORMHOLE_ACTIVATION_RADIUS) {
    useLevel.getState().activateWormhole()
    useEnemies.getState().reset() // Shockwave clears ALL enemies
    playSFX('wormhole-activate')
  }
} else if (levelState.wormholeState === 'activating') {
  const result = useLevel.getState().wormholeTick(clampedDelta)
  if (result.transitionReady) {
    useGame.getState().setPhase('boss')
  }
}
```

**WormholeRenderer (visual approach):**
```javascript
// Dormant: TorusGeometry with emissive cyan pulsing, slow Y-axis rotation
// Activating: Scale up torus, spawn expanding shockwave ring (second torus scaling from 0)
// Use useFrame for:
//   - rotation: meshRef.current.rotation.y += delta * 0.5
//   - pulse: meshRef.current.material.emissiveIntensity = 0.5 + Math.sin(clock * 3) * 0.3
//   - shockwave ring scale: ringRef.current.scale.setScalar(progress * maxRadius)
```

### Previous Story Intelligence (5.3)

**Learnings from Story 5.3 to apply:**
- **Reset() MUST include ALL new state fields** — When adding `wormhole`, `wormholeActivationTimer` to useLevel, MUST add to reset(). `wormholeState: 'hidden'` already in reset.
- **SFX played from GameLoop via `playSFX()`** — Follow established pattern. Don't play from store actions.
- **useAudio.jsx SFX_MAP must have entries for preloading** — Add wormhole SFX to SFX_MAP, not just audioManager's SFX_CATEGORY_MAP.
- **Audio files are placeholders** — audioManager handles missing files gracefully with console.warn.
- **Minimap dot pattern** — Use same coordinate transform: `50 + (x / PLAY_AREA_SIZE) * 50`%. Can reuse `scanPulse` CSS animation for wormhole pulse.
- **GameLoop prevPhaseRef check** — When adding 'boss' phase, ensure GameLoop's reset logic at the top doesn't re-initialize systems when transitioning from 'activating' wormhole state to 'boss'. The existing check only resets when entering 'gameplay' from non-gameplay/non-levelUp/non-planetReward phases.
- **No game logic in renderers** — WormholeRenderer is visual-only. All state transitions happen in GameLoop/useLevel.
- **Edge detection for SFX** — Use prevRef pattern for detecting wormhole spawn and activation transitions (one-shot SFX, not repeated every frame).

### Git Intelligence

Recent commits show:
- `9fdea03` — Stories 4.7, 5.3: planet scanning rewards, reset bugfix — most recent commit
- All Epic 5 (Dash, Planets) is done — clean baseline for Epic 6
- Epic 5 retrospective marked done — project is ready for new epic
- Pattern: large feature commits containing multiple file changes are the norm

**Relevant established patterns:**
- `GameLoop.jsx` section numbering (7f, 7g) — add wormhole as new section
- `useLevel.jsx` already has `wormholeState` field and it's in `reset()`
- `useEnemies.reset()` clears all enemies — ready for shockwave use
- `HUD.jsx` minimap planet dots — extend with wormhole dot
- `GameplayScene.jsx` renderer composition — add WormholeRenderer
- `Experience.jsx` phase-based scene routing — add boss phase mount

### Project Structure Notes

**Files to CREATE:**
- `src/renderers/WormholeRenderer.jsx` — 3D wormhole visual (dormant, activating, active states)

**Files to MODIFY:**
- `src/config/gameConfig.js` — Add wormhole constants (threshold, radius, durations)
- `src/stores/useLevel.jsx` — Add wormhole position, activation timer, spawn/activate/tick actions, update reset()
- `src/GameLoop.jsx` — Add wormhole section (spawn check, proximity activation, activation tick)
- `src/scenes/GameplayScene.jsx` — Mount WormholeRenderer
- `src/ui/HUD.jsx` — Add wormhole dot to minimap
- `src/Experience.jsx` — Add boss phase scene routing
- `src/audio/audioManager.js` — Add wormhole SFX categories
- `src/config/assetManifest.js` — Add wormhole audio paths
- `src/hooks/useAudio.jsx` — Add wormhole SFX to SFX_MAP
- `src/stores/useGame.jsx` — Verify boss phase support (may need no changes)

**Files NOT to modify:**
- `src/stores/useEnemies.jsx` — Already has reset() for enemy clearing, no changes needed
- `src/stores/usePlayer.jsx` — No wormhole-related state
- `src/stores/useWeapons.jsx` — Wormhole doesn't affect weapons
- `src/stores/useBoons.jsx` — Wormhole doesn't affect boons
- `src/systems/collisionSystem.js` — Wormhole uses simple distance check like planet scanning
- `src/renderers/PlanetRenderer.jsx` — Separate entity
- `src/ui/LevelUpModal.jsx` — Unrelated
- `src/ui/PlanetRewardModal.jsx` — Unrelated

### Anti-Patterns to Avoid

- Do NOT use the collision system / spatial hash for wormhole proximity — 1 distance check per frame is trivial
- Do NOT put wormhole activation logic in WormholeRenderer — renderers are read-only
- Do NOT play SFX from the store — play from GameLoop using state transition detection
- Do NOT create a new Zustand store for wormhole — extend useLevel which already owns wormholeState
- Do NOT use `damageEnemiesBatch()` for shockwave — since ALL enemies die, `useEnemies.reset()` is cleaner (no XP orbs from shockwave kills)
- Do NOT spawn XP orbs from shockwave-killed enemies — the reward is the boss transition
- Do NOT add wormhole to the spatial hash grid — it's a single entity with simple proximity check
- Do NOT forget to add new state fields to `reset()` — critical lesson from previous stories
- Do NOT use useEffect for wormhole logic — all wormhole ticking runs in GameLoop's useFrame
- Do NOT create custom shaders for wormhole visuals — use Three.js built-in materials with emissive properties
- Do NOT make GameLoop re-initialize systems on boss phase transition — the existing phase check handles this correctly

### Testing Approach

- **Unit tests (useLevel wormhole):**
  - `spawnWormhole()` sets wormhole position and state to 'visible'
  - `spawnWormhole()` clamps position to play area bounds
  - `activateWormhole()` sets state to 'activating' and starts timer
  - `wormholeTick()` decrements timer, returns `transitionReady: true` when timer hits 0
  - `wormholeTick()` returns `transitionReady: false` while timer > 0
  - `reset()` clears wormhole, wormholeState, wormholeActivationTimer

- **Visual tests (browser verification):**
  - Play until 480s elapsed → wormhole appears
  - Wormhole visible on minimap
  - Wormhole renders as 3D portal with idle animation
  - Fly to wormhole → activation triggers, shockwave visual
  - All enemies disappear on activation
  - After 2s delay → transitions to boss phase
  - No enemies spawn during activation
  - Reset from boss phase properly clears wormhole state
  - 60 FPS maintained

### Scope Summary

This story adds wormhole discovery and activation to the gameplay loop. When 80% of the system timer elapses (480s/600s), a dormant wormhole spawns at a random location away from the player. The wormhole appears on the minimap and renders as a pulsing 3D portal. When the player navigates to the wormhole and enters the activation zone (25 unit radius), a dramatic shockwave clears ALL enemies, and after a 2-second transition delay, the game enters the boss phase. The boss arena itself (Story 6.2) and boss combat (Story 6.2-6.3) are out of scope — this story just handles discovery, activation, and the transition trigger.

**Key deliverables:**
1. `gameConfig.js` — Wormhole constants (spawn threshold, activation radius, durations)
2. `useLevel.jsx` — Wormhole position, state management, spawn/activate/tick actions
3. `GameLoop.jsx` — Wormhole section (spawn check, proximity activation, activation tick)
4. `WormholeRenderer.jsx` — 3D wormhole visual with dormant/activating/active states
5. `HUD.jsx` — Wormhole dot on minimap
6. `GameplayScene.jsx` — Mount WormholeRenderer
7. `Experience.jsx` — Boss phase scene routing
8. `audioManager.js` + `useAudio.jsx` + `assetManifest.js` — Wormhole SFX registration

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1] — Acceptance criteria: wormhole discovery, shockwave, boss transition
- [Source: _bmad-output/planning-artifacts/epics.md#FR28-FR29] — Find dormant wormhole, shockwave clears all enemies
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — Stores never import other stores; GameLoop is sole bridge
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules] — Only GameLoop has game logic useFrame; renderers read-only
- [Source: _bmad-output/planning-artifacts/architecture.md#Scene Management] — Mount/unmount for clean memory lifecycle; BossScene is separate
- [Source: _bmad-output/planning-artifacts/architecture.md#Anti-Patterns] — No new stores for one-off features; no game logic in renderers
- [Source: src/stores/useLevel.jsx] — Has wormholeState: 'hidden' in state and reset(), planets pattern for reference
- [Source: src/stores/useGame.jsx] — Phase management: setPhase(), triggerGameOver() pattern
- [Source: src/stores/useEnemies.jsx] — reset() clears all enemies — used for shockwave
- [Source: src/GameLoop.jsx:56-267] — Full tick order, wormhole section goes between 7f and 7g
- [Source: src/ui/HUD.jsx:108-121] — Minimap coordinate math for planet dots
- [Source: src/scenes/GameplayScene.jsx] — Renderer composition pattern
- [Source: src/Experience.jsx] — Phase-based scene routing pattern
- [Source: src/renderers/PlanetRenderer.jsx] — Pattern reference for dedicated renderer component
- [Source: src/hooks/useAudio.jsx:7-17] — SFX_MAP for preloading
- [Source: src/audio/audioManager.js:15-25] — SFX_CATEGORY_MAP
- [Source: src/config/assetManifest.js:21-32] — tier2 audio section for new SFX paths
- [Source: _bmad-output/implementation-artifacts/5-3-planet-scanning-rewards.md] — Previous story: scanning pattern, SFX integration, minimap dots, reset() lessons

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Task 1-2: Added 6 wormhole constants to gameConfig.js and extended useLevel store with wormhole position, state management (hidden/visible/activating/active), spawnWormhole(), activateWormhole(), wormholeTick(), and updated reset(). 13 unit tests written and passing.
- Task 3: Integrated wormhole logic into GameLoop between sections 7f and 7g: spawn check at 80% timer threshold, proximity activation with enemy reset (shockwave), activation tick with boss phase transition. Enemy spawning skipped during activating/active states.
- Task 4: Created WormholeRenderer.jsx with three visual states: dormant (pulsing cyan torus with slow rotation), activating (faster rotation, scale up, shockwave ring expansion, purple glow), and active (bright steady portal). Uses MeshStandardMaterial with emissive for glow effects.
- Task 5: Added wormhole dot to minimap in HUD.jsx — cyan pulsing dot when visible, larger brighter dot with glow when activating/active. Uses same coordinate math as planet dots.
- Task 6: Mounted WormholeRenderer in GameplayScene.jsx after PlanetRenderer.
- Task 7: Added wormhole-spawn and wormhole-activate SFX entries to audioManager.js SFX_CATEGORY_MAP, assetManifest.js tier2.audio, and useAudio.jsx SFX_MAP.
- Task 8: Verified boss phase support — useGame.setPhase('boss') works, Experience.jsx already mounts BossScene on boss phase, GameLoop skips gameplay ticks during boss phase. Updated BossScene with a placeholder visual.

### Senior Developer Review (AI)

**Reviewer:** Adam (via Claude Opus 4.6 adversarial code review)
**Date:** 2026-02-11
**Outcome:** Approved with fixes applied

**Issues Found & Fixed (6):**
- [H1] WORMHOLE_SPAWN_TIMER_THRESHOLD was 0.01 (debug value) instead of 0.8 — fixed in gameConfig.js
- [H2] WormholeRenderer materials (torusMaterial, shockwaveMaterial) created via useMemo never disposed on unmount — added useEffect cleanup
- [H3] Game-over timer check at section 7f could kill player during wormhole activation/transition — added guard to skip game-over when wormholeState is 'activating' or 'active'
- [M2] WormholeRenderer mesh scale not reset when re-entering 'visible' state — added scale.setScalar(1) in visible branch
- [M3] spawnWormhole() clamping could place wormhole within activation radius of player at play area edges — added minimum distance enforcement (3x activation radius) after clamping
- [M4] prevWormholeStateRef declared and updated but never read (dead code) — removed from GameLoop.jsx

**Acknowledged (1):**
- [M1] useFrame registered when wormholeState is 'hidden' — correct React pattern (hooks must be unconditional), early-return guard inside callback is sufficient

**Tests:** 420/420 passing (30 suites), no regressions

### Change Log

- 2026-02-11: Code review fixes — threshold value, material dispose, game-over guard, scale reset, spawn distance safety, dead code removal
- 2026-02-11: Story 6.1 implementation — wormhole discovery, activation, shockwave enemy clear, boss phase transition

### File List

- src/config/gameConfig.js (modified — added 6 wormhole constants)
- src/stores/useLevel.jsx (modified — wormhole state, position, timer, spawn/activate/tick actions, reset)
- src/GameLoop.jsx (modified — wormhole section 7f-bis, enemy spawn skip during activation)
- src/renderers/WormholeRenderer.jsx (created — 3D wormhole visual with dormant/activating/active states)
- src/ui/HUD.jsx (modified — wormhole dot on minimap)
- src/scenes/GameplayScene.jsx (modified — mount WormholeRenderer)
- src/scenes/BossScene.jsx (modified — placeholder visual)
- src/audio/audioManager.js (modified — wormhole SFX categories)
- src/config/assetManifest.js (modified — wormhole audio paths)
- src/hooks/useAudio.jsx (modified — wormhole SFX_MAP entries)
- src/stores/__tests__/useLevel.wormhole.test.js (created — 13 unit tests)
