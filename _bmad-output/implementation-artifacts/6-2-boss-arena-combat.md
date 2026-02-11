# Story 6.2: Boss Arena & Combat

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to fight a boss in an isolated 1v1 arena with telegraphed attack patterns,
So that I face a climactic challenge that tests my skills.

## Acceptance Criteria

1. **Given** the boss phase activates (from wormhole transition in Story 6.1) **When** the boss arena loads **Then** BossScene.jsx renders an isolated arena (different from gameplay environment) **And** a single boss enemy spawns with its name and HP bar displayed (BossHPBar component, top center) **And** the boss HP bar slides down with fade-in animation **And** dramatic boss music plays (crossfade from gameplay music)

2. **Given** the boss is active **When** it attacks **Then** attack patterns are telegraphed visually before executing (warning indicators, charge-up animations) **And** attacks use distinct orange-colored projectiles/beams (per UX color spec `#ff6600` for boss attacks) **And** the player can dodge attacks using movement and dash

3. **Given** the player attacks the boss **When** projectiles hit the boss **Then** the boss takes damage and the HP bar updates **And** hit feedback is visible on the boss (flash, particles)

4. **Given** the boss has multiple attack phases **When** boss HP crosses thresholds (75%, 50%, 25%) **Then** the boss may change attack patterns or intensify (faster attacks, additional projectiles)

5. **Given** the player dies during the boss fight **When** HP reaches 0 **Then** the game over sequence triggers (Story 4.3) as normal

## Tasks / Subtasks

- [x] Task 1: Add boss constants to gameConfig.js (AC: #1, #2, #4)
  - [x] 1.1: Add `BOSS_HP: 500` — total boss health points
  - [x] 1.2: Add `BOSS_ARENA_SIZE: 400` — half-width of the boss arena play area (smaller than gameplay arena)
  - [x] 1.3: Add `BOSS_MOVE_SPEED: 30` — boss movement speed (units/sec)
  - [x] 1.4: Add `BOSS_COLLISION_RADIUS: 5` — boss collision radius (larger than regular enemies)
  - [x] 1.5: Add `BOSS_CONTACT_DAMAGE: 15` — damage on player-boss contact
  - [x] 1.6: Add `BOSS_PROJECTILE_SPEED: 120` — speed of boss projectiles
  - [x] 1.7: Add `BOSS_PROJECTILE_DAMAGE: 10` — damage per boss projectile
  - [x] 1.8: Add `BOSS_PROJECTILE_RADIUS: 0.8` — collision radius of boss projectiles
  - [x] 1.9: Add `BOSS_ATTACK_COOLDOWN: 2.5` — seconds between boss attacks (base, gets faster at thresholds)
  - [x] 1.10: Add `BOSS_TELEGRAPH_DURATION: 0.8` — seconds of visual warning before attack executes
  - [x] 1.11: Add `BOSS_BURST_COUNT: 3` — number of projectiles in a burst attack
  - [x] 1.12: Add `BOSS_BURST_SPREAD: 0.4` — radian spread between burst projectiles
  - [x] 1.13: Add `BOSS_PHASE_THRESHOLDS: [0.75, 0.50, 0.25]` — HP fraction thresholds for phase changes
  - [x] 1.14: Add `BOSS_NAME: 'VOID SENTINEL'` — boss display name (per UX spec)

- [x] Task 2: Add boss definition to enemyDefs.js (AC: #1, #3)
  - [x] 2.1: Add `BOSS_SENTINEL` entry with: `id: 'BOSS_SENTINEL'`, `name: 'Void Sentinel'`, `hp: GAME_CONFIG.BOSS_HP`, `speed: GAME_CONFIG.BOSS_MOVE_SPEED`, `damage: GAME_CONFIG.BOSS_CONTACT_DAMAGE`, `radius: GAME_CONFIG.BOSS_COLLISION_RADIUS`, `behavior: 'boss'`, `color: '#cc66ff'`, `meshScale: [8, 8, 8]`
  - [x] 2.2: Note: boss uses behavior `'boss'` (new behavior type, distinct from `'chase'`), with custom AI handled in the boss store/tick, not via useEnemies.tick()

- [x] Task 3: Create useBoss store (AC: #1, #2, #3, #4)
  - [x] 3.1: Create `src/stores/useBoss.jsx` — dedicated store for boss fight state (boss is a one-off entity with complex behavior, unlike pooled enemies)
  - [x] 3.2: State fields: `boss: null` (object: `{ x, z, hp, maxHp, phase, attackCooldown, telegraphTimer, attackType, projectiles: [] }`), `isActive: false`, `bossDefeated: false`
  - [x] 3.3: `spawnBoss()` action — initializes boss at arena center `(0, 0)` with full HP, phase 0, attack cooldown reset
  - [x] 3.4: `tick(delta, playerPos)` method — boss AI update:
    - Move boss toward player at BOSS_MOVE_SPEED (chase behavior but slower, maintaining some distance)
    - Decrement attackCooldown; when it reaches 0, start telegraph (set telegraphTimer)
    - When telegraphTimer reaches 0, execute attack (spawn boss projectiles)
    - Update boss projectiles (move, lifetime, remove off-arena)
    - Check phase thresholds: when HP crosses 75%/50%/25%, advance to next phase (faster cooldowns, additional burst projectiles)
  - [x] 3.5: `damageBoss(amount)` action — reduce boss HP, apply hit flash timer, return `{ killed: boolean }`
  - [x] 3.6: `getBossProjectiles()` — returns current boss projectiles for collision checks
  - [x] 3.7: `reset()` — clear all boss state: `boss: null, isActive: false, bossDefeated: false`

- [x] Task 4: Create BossGameLoop logic in GameLoop.jsx (AC: #2, #3, #4, #5)
  - [x] 4.1: Add a boss tick section that runs when `phase === 'boss'` (separate from the gameplay tick which returns early on non-gameplay phases)
  - [x] 4.2: Boss tick order:
    1. Input (read controls)
    2. Player movement (tick player with boss arena boundaries: BOSS_ARENA_SIZE instead of PLAY_AREA_SIZE)
    3. Dash input (same edge detection as gameplay)
    4. Player weapons fire + projectile movement
    5. Boss AI tick (useBoss.tick — movement, attack, projectile update)
    6. Collision detection:
       a. Player projectiles vs boss (damage boss)
       b. Boss projectiles vs player (damage player)
       c. Boss body vs player (contact damage)
    7. Death checks (player HP = 0 → game over, boss HP = 0 → Story 6.3 handles defeat transition)
    8. Level-up handling (player can still level up during boss fight from XP earned in gameplay)
  - [x] 4.3: Reuse existing collision system for boss phase — register player, boss, player projectiles, boss projectiles in spatial hash
  - [x] 4.4: Play SFX for boss hits, boss attacks, boss phase transitions
  - [x] 4.5: When boss HP reaches 0: set `bossDefeated: true` in useBoss, trigger victory via `useGame.getState().triggerVictory()`

- [x] Task 5: Implement BossScene.jsx (AC: #1, #2)
  - [x] 5.1: Replace placeholder content with full boss arena scene
  - [x] 5.2: Include Controls (useHybridControls) and CameraRig (usePlayerCamera) — player needs to move in the arena
  - [x] 5.3: Mount PlayerShip, ProjectileRenderer — player and their projectiles render in boss arena
  - [x] 5.4: Mount a BossRenderer component — reads boss position/state from useBoss, renders boss mesh
  - [x] 5.5: Mount a BossProjectileRenderer — renders boss projectiles (orange-colored, distinct from player projectiles)
  - [x] 5.6: Mount ParticleRenderer for death explosions / hit effects
  - [x] 5.7: Arena environment: dark ambient lighting, subtle arena boundary visualization (simpler than gameplay), no planets/wormhole
  - [x] 5.8: Arena boundary: soft energy walls at BOSS_ARENA_SIZE extent — reuse boundary wall pattern from EnvironmentRenderer but smaller scale

- [x] Task 6: Create BossRenderer.jsx (AC: #1, #3)
  - [x] 6.1: Create `src/renderers/BossRenderer.jsx` — reads boss state from useBoss store
  - [x] 6.2: Render boss mesh at boss position — use a large mesh (scaled up enemy model or a procedural boss shape: large sphere/torus with emissive purple material)
  - [x] 6.3: Boss idle animation: slow rotation, subtle pulse
  - [x] 6.4: Telegraph visual: when `telegraphTimer > 0`, show warning indicator (growing orange ring/glow around boss, per UX color spec)
  - [x] 6.5: Hit feedback: brief white flash on boss mesh when damaged (reuse HIT_FLASH_DURATION_MS pattern)
  - [x] 6.6: Phase transition visual: brief flash/color change when boss enters new phase
  - [x] 6.7: Dispose materials on unmount (useEffect cleanup)

- [x] Task 7: Create BossProjectileRenderer.jsx (AC: #2)
  - [x] 7.1: Create `src/renderers/BossProjectileRenderer.jsx` — reads boss projectiles from useBoss
  - [x] 7.2: Render boss projectiles as orange spheres/dots (color: `#ff6600` per UX spec)
  - [x] 7.3: Use InstancedMesh pattern for efficient rendering of multiple boss projectiles
  - [x] 7.4: Dispose materials on unmount

- [x] Task 8: Create BossHPBar UI component (AC: #1)
  - [x] 8.1: Create `src/ui/BossHPBar.jsx` — HTML overlay positioned top-center
  - [x] 8.2: Display boss name (`VOID SENTINEL`) above the HP bar
  - [x] 8.3: HP bar uses ProgressBar primitive with variant `'boss'` (large, centered, red/orange style)
  - [x] 8.4: Slide-down + fade-in animation on mount (per UX spec: "Slide down + fade in quand boss spawn")
  - [x] 8.5: Phase indicators: subtle visual change when boss enters new phase (color shift or segment markers at 75%/50%/25%)
  - [x] 8.6: Mount BossHPBar in the main UI overlay (Interface.jsx or Experience.jsx HTML layer) when phase === 'boss'

- [x] Task 9: Audio integration (AC: #1)
  - [x] 9.1: In useAudio.jsx phase subscription, add boss phase transition: crossfade from gameplay music to boss music (`ASSET_MANIFEST.tier2.audio.bossMusic`)
  - [x] 9.2: Add boss SFX to SFX_CATEGORY_MAP in audioManager.js: `'boss-attack': 'sfxAction'`, `'boss-hit': 'sfxFeedbackPositive'`, `'boss-phase': 'events'`
  - [x] 9.3: Add boss SFX paths to assetManifest.js tier2.audio: `bossAttack: 'audio/sfx/boss-attack.mp3'`, `bossHit: 'audio/sfx/boss-hit.mp3'`, `bossPhase: 'audio/sfx/boss-phase.mp3'`
  - [x] 9.4: Add boss SFX to SFX_MAP in useAudio.jsx for preloading
  - [x] 9.5: Boss music crossfade on boss phase → gameplay music stops, boss theme starts

- [x] Task 10: Player boundary override during boss phase (AC: #2)
  - [x] 10.1: During boss phase, player movement must use BOSS_ARENA_SIZE for boundary clamping instead of PLAY_AREA_SIZE
  - [x] 10.2: Approach: pass arena size as parameter to usePlayer.tick() or read from a config override — simplest approach is to pass arenaSize parameter to tick()

- [x] Task 11: Wire boss phase reset into GameLoop (AC: #5)
  - [x] 11.1: When GameLoop detects phase entering 'boss' (prevPhaseRef transition), call `useBoss.getState().spawnBoss()` to initialize boss
  - [x] 11.2: Ensure useBoss.reset() is called when returning to menu or starting new game
  - [x] 11.3: When phase goes to 'gameOver' from 'boss', the existing game-over flow handles it (GameOverScreen shows, retry returns to menu)

- [x] Task 12: Verification (AC: #1, #2, #3, #4, #5)
  - [x] 12.1: Wormhole activation → boss phase transition → BossScene loads with arena, player, and boss
  - [x] 12.2: Boss HP bar appears with slide-in animation, shows "VOID SENTINEL" name
  - [x] 12.3: Boss music plays (crossfade from gameplay)
  - [x] 12.4: Boss moves toward player with chase behavior
  - [x] 12.5: Boss telegraphs attacks with orange visual warning before firing
  - [x] 12.6: Boss fires orange projectiles at player
  - [x] 12.7: Player projectiles damage boss, HP bar updates, hit flash visible on boss
  - [x] 12.8: Boss phases at 75%/50%/25% HP — attacks get faster/more projectiles
  - [x] 12.9: Player can dodge boss attacks with movement + dash
  - [x] 12.10: Player-boss contact deals damage to player
  - [x] 12.11: Player death triggers game over sequence normally
  - [x] 12.12: Boss defeat triggers victory (Story 6.3 will refine this)
  - [x] 12.13: Arena boundaries smaller than gameplay area, player clamped correctly
  - [x] 12.14: 60 FPS maintained during boss fight
  - [x] 12.15: Game reset properly clears boss state

## Dev Notes

### Architecture Decisions

- **New `useBoss` store** — The boss is a fundamentally different entity from pooled enemies. It has unique AI (telegraphed attacks, phase transitions, projectile spawning), complex state (attack cooldowns, telegraph timers, projectile pool), and a single instance. Using `useEnemies` for the boss would over-complicate the pooled enemy pattern and create behavioral branching in `useEnemies.tick()`. A dedicated store follows the "stores own domain state" principle and keeps both stores clean. This is NOT a "one-off feature" anti-pattern from architecture — the boss is a distinct domain with its own lifecycle, AI, and combat mechanics.

- **Boss tick in GameLoop (boss section)** — GameLoop already returns early when `phase !== 'gameplay'`. The boss phase needs its own tick section that runs when `phase === 'boss'`. This keeps the deterministic tick order but with a different set of systems active. The boss tick reuses some gameplay infrastructure (player movement, weapons, collision system) but with boss-specific entities registered.

- **Boss projectiles as part of useBoss** — Boss projectiles are owned by the boss store, not by useWeapons. This makes the separation clean: useWeapons = player weapons/projectiles, useBoss = boss entity + boss projectiles. The collision system treats them as different categories.

- **Player arena boundary via tick parameter** — Rather than a global config switch, pass `arenaSize` as a parameter to `usePlayer.tick()`. During gameplay, pass `PLAY_AREA_SIZE`. During boss, pass `BOSS_ARENA_SIZE`. This avoids modifying the player store's internal logic.

- **BossScene mounts its own PlayerShip + CameraRig + Controls** — Since GameplayScene unmounts when boss phase starts (per architecture: mount/unmount for clean memory lifecycle), BossScene must mount its own instances. Player state persists in usePlayer store (position, HP, weapons, boons) across the scene transition.

- **BossHPBar as HTML overlay** — Follows the established HUD pattern. Boss HP bar is an HTML div overlay, not a 3D element. Positioned top-center per UX spec. Uses the existing ProgressBar primitive.

- **Boss AI pattern: telegraph → attack → cooldown** — Simple state machine: idle (cooldown counting) → telegraph (visual warning, duration BOSS_TELEGRAPH_DURATION) → attack (fire projectiles) → idle. Each phase threshold reduces cooldown and may add burst projectiles.

### Existing Infrastructure Status

| Component | Status | Relevance |
|-----------|--------|-----------|
| `stores/useGame.jsx` | **Has `setPhase('boss')`, `triggerGameOver()`, `triggerVictory()`** | No changes needed — boss phase transitions already supported |
| `stores/usePlayer.jsx` | **Has full player state, tick(), takeDamage()** | Need to pass arenaSize to tick() for boss boundary clamping |
| `stores/useWeapons.jsx` | **Has projectile system** | Reuse for player weapons during boss fight |
| `stores/useEnemies.jsx` | **Has enemy pool** | NOT used for boss — boss has its own store |
| `GameLoop.jsx` | **Returns early on non-gameplay phases** | Need to add boss tick section |
| `scenes/BossScene.jsx` | **Placeholder (box + ambient light)** | Replace with full arena implementation |
| `Experience.jsx` | **Mounts BossScene on boss phase** | No changes needed |
| `ui/HUD.jsx` | **Has full gameplay HUD** | HUD should NOT render during boss phase — BossHPBar + minimal info instead |
| `ui/primitives/ProgressBar.jsx` | **Has hp, xp variants** | May need `boss` variant or reuse `hp` variant |
| `renderers/PlayerShip.jsx` | **Player ship rendering** | Mount in BossScene |
| `renderers/ProjectileRenderer.jsx` | **Player projectile rendering** | Mount in BossScene |
| `renderers/ParticleRenderer.jsx` | **Explosion particles** | Mount in BossScene |
| `renderers/EnvironmentRenderer.jsx` | **Stars, boundary walls** | Reference for boss arena boundary walls |
| `hooks/usePlayerCamera.jsx` | **Camera follow** | Mount in BossScene |
| `hooks/useHybridControls.jsx` | **Input handling** | Mount in BossScene |
| `config/gameConfig.js` | **All gameplay constants** | Add boss constants |
| `config/assetManifest.js` | **Has tier2.audio.bossMusic** | Add boss SFX paths |
| `audio/audioManager.js` | **Has SFX_CATEGORY_MAP** | Add boss SFX categories |
| `hooks/useAudio.jsx` | **Has SFX_MAP + phase music transitions** | Add boss phase music + boss SFX entries |
| `systems/collisionSystem.js` | **Has category-based collision** | Reuse for boss collision detection — may need new categories (CATEGORY_BOSS, CATEGORY_BOSS_PROJECTILE) |
| `entities/enemyDefs.js` | **Has enemy type definitions** | Add BOSS_SENTINEL definition |

### Key Implementation Details

**useBoss store structure:**
```javascript
const useBoss = create((set, get) => ({
  boss: null,           // { x, z, hp, maxHp, phase, attackCooldown, telegraphTimer, attackType, lastHitTime }
  bossProjectiles: [],  // [{ id, x, z, vx, vz, speed, damage, radius, lifetime }]
  isActive: false,
  bossDefeated: false,
  nextProjectileId: 0,

  spawnBoss: () => set({
    boss: {
      x: 0, z: 0,
      hp: GAME_CONFIG.BOSS_HP,
      maxHp: GAME_CONFIG.BOSS_HP,
      phase: 0,
      attackCooldown: GAME_CONFIG.BOSS_ATTACK_COOLDOWN,
      telegraphTimer: 0,
      attackType: null,
      lastHitTime: -Infinity,
    },
    isActive: true,
    bossDefeated: false,
    bossProjectiles: [],
    nextProjectileId: 0,
  }),

  tick: (delta, playerPos) => { /* boss AI logic */ },
  damageBoss: (amount) => { /* reduce HP, check kill */ },
  reset: () => set({ boss: null, bossProjectiles: [], isActive: false, bossDefeated: false, nextProjectileId: 0 }),
}))
```

**Boss AI tick logic:**
```javascript
tick: (delta, playerPos) => {
  const { boss, bossProjectiles } = get()
  if (!boss || boss.hp <= 0) return

  // 1. Move boss toward player (slower chase)
  const dx = playerPos[0] - boss.x
  const dz = playerPos[2] - boss.z
  const dist = Math.sqrt(dx * dx + dz * dz)
  if (dist > 15) { // Keep some distance
    boss.x += (dx / dist) * GAME_CONFIG.BOSS_MOVE_SPEED * delta
    boss.z += (dz / dist) * GAME_CONFIG.BOSS_MOVE_SPEED * delta
  }
  // Clamp to arena
  boss.x = Math.max(-GAME_CONFIG.BOSS_ARENA_SIZE, Math.min(GAME_CONFIG.BOSS_ARENA_SIZE, boss.x))
  boss.z = Math.max(-GAME_CONFIG.BOSS_ARENA_SIZE, Math.min(GAME_CONFIG.BOSS_ARENA_SIZE, boss.z))

  // 2. Attack state machine
  const phaseMultiplier = 1 + boss.phase * 0.3 // Each phase 30% faster
  if (boss.telegraphTimer > 0) {
    boss.telegraphTimer = Math.max(0, boss.telegraphTimer - delta)
    if (boss.telegraphTimer <= 0) {
      // Execute attack — fire projectiles toward player
      fireBossProjectiles(boss, playerPos, get, set)
    }
  } else {
    boss.attackCooldown = Math.max(0, boss.attackCooldown - delta * phaseMultiplier)
    if (boss.attackCooldown <= 0) {
      boss.telegraphTimer = GAME_CONFIG.BOSS_TELEGRAPH_DURATION
      boss.attackCooldown = GAME_CONFIG.BOSS_ATTACK_COOLDOWN
    }
  }

  // 3. Update boss projectiles (movement + lifetime)
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const p = bossProjectiles[i]
    p.x += p.vx * delta
    p.z += p.vz * delta
    p.lifetime -= delta
    if (p.lifetime <= 0 || Math.abs(p.x) > GAME_CONFIG.BOSS_ARENA_SIZE + 50 || Math.abs(p.z) > GAME_CONFIG.BOSS_ARENA_SIZE + 50) {
      bossProjectiles.splice(i, 1)
    }
  }

  // 4. Check phase transitions
  const hpFraction = boss.hp / boss.maxHp
  const thresholds = GAME_CONFIG.BOSS_PHASE_THRESHOLDS
  let newPhase = 0
  for (let i = 0; i < thresholds.length; i++) {
    if (hpFraction <= thresholds[i]) newPhase = i + 1
  }
  if (newPhase > boss.phase) {
    boss.phase = newPhase
    // Phase transition effect handled by renderer
  }

  set({ boss: { ...boss }, bossProjectiles: [...bossProjectiles] })
},
```

**GameLoop boss phase section:**
```javascript
// After existing gameplay early-return check, add:
if (phase === 'boss') {
  const clampedDelta = Math.min(delta, 0.1)

  // 1. Input
  const input = useControlsStore.getState()

  // 2. Player movement (with boss arena size)
  const boonModifiers = useBoons.getState().modifiers
  usePlayer.getState().tick(clampedDelta, input, boonModifiers.speedMultiplier ?? 1, GAME_CONFIG.BOSS_ARENA_SIZE)

  // 2b. Dash
  if (input.dash && !prevDashRef.current) {
    usePlayer.getState().startDash()
    if (usePlayer.getState().isDashing) playSFX('dash-whoosh')
  }
  prevDashRef.current = input.dash
  const currentCooldown = usePlayer.getState().dashCooldownTimer
  if (prevDashCooldownRef.current > 0 && currentCooldown <= 0) playSFX('dash-ready')
  prevDashCooldownRef.current = currentCooldown

  // 3. Player weapons fire
  const playerState = usePlayer.getState()
  const playerPos = playerState.position
  const projCountBefore = useWeapons.getState().projectiles.length
  useWeapons.getState().tick(clampedDelta, playerPos, playerState.rotation, boonModifiers)
  if (useWeapons.getState().projectiles.length > projCountBefore) playSFX('laser-fire')

  // 4. Projectile movement
  projectileSystemRef.current.tick(useWeapons.getState().projectiles, clampedDelta, [])
  useWeapons.getState().cleanupInactive()

  // 5. Boss AI tick
  useBoss.getState().tick(clampedDelta, playerPos)

  // 6. Collision detection (boss phase)
  // ... register player, boss, player projectiles, boss projectiles in spatial hash
  // ... resolve collisions: player proj vs boss, boss proj vs player, boss body vs player

  // 7. Death checks
  if (usePlayer.getState().currentHP <= 0) {
    playSFX('game-over-impact')
    useGame.getState().triggerGameOver()
    return
  }
  if (useBoss.getState().bossDefeated) {
    useGame.getState().triggerVictory() // Story 6.3 will refine this
    return
  }

  // 8. Level-up (player may still have pending level-ups from gameplay XP)
  if (usePlayer.getState().pendingLevelUp) {
    playSFX('level-up')
    usePlayer.getState().consumeLevelUp()
    useGame.getState().triggerLevelUp()
  }
}
```

### Collision Categories

The existing collision system supports string-based categories. Add two new categories for boss phase:

```javascript
export const CATEGORY_BOSS = 'boss'
export const CATEGORY_BOSS_PROJECTILE = 'boss_projectile'
```

In boss phase collision detection:
- Player (`CATEGORY_PLAYER`) registered
- Boss (`CATEGORY_BOSS`) registered with boss position and radius
- Player projectiles (`CATEGORY_PROJECTILE`) registered
- Boss projectiles (`CATEGORY_BOSS_PROJECTILE`) registered

Queries:
- `queryCollisions(playerProjectile, CATEGORY_BOSS)` → player projectile hits boss
- `queryCollisions(player, CATEGORY_BOSS_PROJECTILE)` → boss projectile hits player
- `queryCollisions(player, CATEGORY_BOSS)` → player-boss contact damage

### Previous Story Intelligence (6.1)

**Learnings from Story 6.1 to apply:**
- **Reset() MUST include ALL new state fields** — useBoss.reset() must clear boss, bossProjectiles, isActive, bossDefeated, nextProjectileId
- **SFX played from GameLoop** — Boss attack SFX, boss hit SFX, boss phase SFX all played from the boss tick section in GameLoop, not from useBoss actions
- **useAudio.jsx SFX_MAP must have entries for preloading** — Add boss SFX to SFX_MAP, not just audioManager's SFX_CATEGORY_MAP
- **Audio files are placeholders** — audioManager handles missing files gracefully with console.warn
- **No game logic in renderers** — BossRenderer and BossProjectileRenderer are visual-only. Boss AI, damage, and state transitions happen in useBoss.tick() called by GameLoop
- **Material disposal on unmount** — BossRenderer and BossProjectileRenderer must dispose materials in useEffect cleanup (lesson from WormholeRenderer review fix H2)
- **GameLoop phase transition detection** — Use prevPhaseRef to detect entering boss phase and call spawnBoss()
- **Game-over timer NOT active during boss** — Boss phase has no system timer (boss fight has no time limit)
- **Boss is separate from useEnemies** — useEnemies handles pooled gameplay enemies. Boss is a unique entity in useBoss. Don't mix them.

### Git Intelligence

Recent commits show:
- `9fdea03` — Stories 4.7, 5.3: planet scanning rewards, reset bugfix
- Story 6.1 implementation in progress (wormhole discovery) — directly preceding this story
- Pattern: large feature commits, all existing tests passing (420/420)
- GameLoop follows deterministic tick order with section numbering

**Relevant established patterns:**
- `GameLoop.jsx` returns early on `phase !== 'gameplay'` — boss section must be added BEFORE this return
- `BossScene.jsx` exists as placeholder — replace content entirely
- `Experience.jsx` already mounts BossScene on `phase === 'boss'`
- `useAudio.jsx` phase subscription handles music transitions — add boss phase music logic
- Collision system supports multiple categories — add CATEGORY_BOSS and CATEGORY_BOSS_PROJECTILE
- Player state persists across scene transitions (HP, weapons, boons carry into boss fight)

### Project Structure Notes

**Files to CREATE:**
- `src/stores/useBoss.jsx` — Boss entity state, AI tick, projectile management
- `src/renderers/BossRenderer.jsx` — 3D boss visual (mesh, animations, telegraph, hit flash)
- `src/renderers/BossProjectileRenderer.jsx` — InstancedMesh for boss projectiles (orange)
- `src/ui/BossHPBar.jsx` — HTML overlay boss HP bar (top-center, name + bar, slide-in animation)

**Files to MODIFY:**
- `src/config/gameConfig.js` — Add boss constants (14 entries)
- `src/entities/enemyDefs.js` — Add BOSS_SENTINEL definition
- `src/GameLoop.jsx` — Add boss phase tick section (before gameplay early-return)
- `src/scenes/BossScene.jsx` — Replace placeholder with full arena (player, boss, projectiles, camera, controls, lighting, boundaries)
- `src/systems/collisionSystem.js` — Add CATEGORY_BOSS and CATEGORY_BOSS_PROJECTILE exports
- `src/audio/audioManager.js` — Add boss SFX categories to SFX_CATEGORY_MAP
- `src/config/assetManifest.js` — Add boss SFX paths to tier2.audio
- `src/hooks/useAudio.jsx` — Add boss SFX to SFX_MAP + boss phase music transition
- `src/stores/usePlayer.jsx` — Add optional arenaSize parameter to tick() for boss arena clamping

**Files NOT to modify:**
- `src/stores/useEnemies.jsx` — Boss is NOT an enemy pool entity, no changes
- `src/stores/useGame.jsx` — Already has all needed phase transitions
- `src/Experience.jsx` — Already mounts BossScene on boss phase
- `src/stores/useWeapons.jsx` — Player weapons work the same during boss fight
- `src/stores/useBoons.jsx` — Boon modifiers work the same during boss fight
- `src/stores/useLevel.jsx` — Level state not relevant during boss fight
- `src/renderers/WormholeRenderer.jsx` — Separate entity, not in boss arena
- `src/renderers/EnemyRenderer.jsx` — Boss has its own renderer
- `src/renderers/PlanetRenderer.jsx` — Not in boss arena

### Anti-Patterns to Avoid

- Do NOT use useEnemies store for the boss — boss is a unique entity with complex AI, not a pooled enemy
- Do NOT put boss AI logic in BossRenderer — renderers are visual-only
- Do NOT play SFX from useBoss store actions — play from GameLoop boss tick section
- Do NOT forget to add new state fields to `useBoss.reset()` — every field must be reset
- Do NOT create boss projectiles inside useWeapons — boss projectiles are owned by useBoss (separate domain)
- Do NOT let GameLoop timer expire during boss fight — boss phase has no time limit, skip system timer check
- Do NOT modify usePlayer.tick() internals to know about boss phase — pass arenaSize as a parameter instead
- Do NOT make the boss too small — boss meshScale should be significantly larger than regular enemies for visual impact
- Do NOT forget material disposal in BossRenderer/BossProjectileRenderer — useEffect cleanup required
- Do NOT import useBoss inside other stores — GameLoop is the sole bridge (architecture rule)
- Do NOT use useEffect for boss tick logic — all boss ticking runs in GameLoop's useFrame
- Do NOT forget to handle levelUp resuming during boss phase — when player selects level-up choice, `resumeGameplay()` is called which sets phase to 'gameplay', but during boss fight it should return to 'boss'

### Critical Edge Case: Level-Up During Boss Fight

When the player levels up during the boss fight:
- `useGame.triggerLevelUp()` sets phase to `'levelUp'`
- LevelUpModal appears, gameplay pauses
- On selection, `useGame.resumeGameplay()` sets phase to `'gameplay'`
- **Problem:** This returns to gameplay, not boss!
- **Solution:** Either: (a) skip level-ups during boss (discard pending), OR (b) add a `prevCombatPhase` field to useGame so `resumeGameplay()` returns to the correct phase, OR (c) modify `resumeGameplay()` to accept a target phase parameter
- **Recommended approach (c):** Modify `resumeGameplay(targetPhase = 'gameplay')` to accept the return phase. During boss, call `triggerLevelUp()` normally, and when resuming, pass `'boss'` as target. This is minimal change.

### Testing Approach

- **Unit tests (useBoss):**
  - `spawnBoss()` initializes boss with correct HP, position, phase 0
  - `damageBoss()` reduces HP, returns `{ killed: true }` when HP reaches 0
  - `tick()` moves boss toward player position
  - `tick()` decrements attack cooldown, starts telegraph when cooldown reaches 0
  - `tick()` fires projectiles when telegraph timer reaches 0
  - `tick()` updates boss phase at HP thresholds (75%, 50%, 25%)
  - `tick()` moves boss projectiles and removes expired ones
  - `reset()` clears all state fields

- **Visual tests (browser verification):**
  - Wormhole → boss transition works, arena loads
  - Boss visible with idle animation
  - Boss HP bar appears with slide-in animation
  - Boss music plays
  - Boss attacks telegraphed with orange visual warning
  - Boss fires orange projectiles
  - Player projectiles damage boss, HP bar updates
  - Boss phases change at thresholds (visually noticeable)
  - Player can dodge boss attacks with movement + dash
  - Contact damage works
  - Player death triggers game over
  - Boss defeat triggers victory
  - Arena boundaries work correctly
  - 60 FPS maintained
  - Game reset properly clears boss state

### Scope Summary

This story implements the full boss arena combat system. When the player transitions from wormhole activation to the boss phase, BossScene renders an isolated arena with the player, their weapons, and a boss entity (VOID SENTINEL). The boss has a telegraph-attack-cooldown AI loop, fires orange projectiles, chases the player, and has phase transitions at 75%/50%/25% HP. The player fights using their existing weapons and boons. A BossHPBar UI component shows the boss name and health. Boss defeat triggers victory (refined in Story 6.3). The system reuses the existing collision system, player movement, and weapon systems with boss-phase-specific configuration.

**Key deliverables:**
1. `gameConfig.js` — 14 boss constants
2. `enemyDefs.js` — BOSS_SENTINEL definition
3. `useBoss.jsx` — Boss state, AI tick, projectile management
4. `GameLoop.jsx` — Boss phase tick section with collision detection
5. `BossScene.jsx` — Full arena scene (player, boss, projectiles, camera, controls, boundaries)
6. `BossRenderer.jsx` — Boss 3D visual with idle, telegraph, hit flash, phase effects
7. `BossProjectileRenderer.jsx` — Orange InstancedMesh boss projectiles
8. `BossHPBar.jsx` — HTML overlay boss HP bar (name + bar, slide-in)
9. `audioManager.js` + `useAudio.jsx` + `assetManifest.js` — Boss SFX + music
10. `usePlayer.jsx` — arenaSize parameter for boss boundary clamping
11. `collisionSystem.js` — CATEGORY_BOSS + CATEGORY_BOSS_PROJECTILE

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2] — Acceptance criteria: boss arena, combat, telegraphed attacks, HP bar, phase transitions
- [Source: _bmad-output/planning-artifacts/epics.md#FR30-FR31] — Boss fight in isolated 1v1 arena, telegraphed attack patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — Stores never import other stores; GameLoop is sole bridge
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules] — Only GameLoop has game logic useFrame; renderers read-only
- [Source: _bmad-output/planning-artifacts/architecture.md#Scene Management] — Mount/unmount for clean memory lifecycle; BossScene is separate scene
- [Source: _bmad-output/planning-artifacts/architecture.md#Anti-Patterns] — No game logic in renderers
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — BossScene.jsx, BossHPBar.jsx in target structure
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Boss HP Bar] — "Slide down + fade in quand boss spawn", "nom du boss au-dessus, barre rouge/orange"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Colors] — Boss attacks: `#ff6600` orange for telegraphed danger
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Boss spawn] — "Screen attention, HP bar slide in, son dramatique, 500ms sequence"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ProgressBar] — Variant `boss`: large, centered
- [Source: src/stores/useGame.jsx] — Phase management: setPhase(), triggerGameOver(), triggerVictory()
- [Source: src/GameLoop.jsx:58-77] — Phase check and early return pattern — boss tick must go BEFORE this
- [Source: src/GameLoop.jsx:130-262] — Collision detection pattern — reuse for boss with new categories
- [Source: src/stores/usePlayer.jsx:35-175] — Player tick() with boundary clamping — needs arenaSize parameter
- [Source: src/stores/usePlayer.jsx:217-231] — takeDamage() with invulnerability — works for boss projectiles too
- [Source: src/systems/collisionSystem.js] — Category-based collision — add CATEGORY_BOSS, CATEGORY_BOSS_PROJECTILE
- [Source: src/scenes/BossScene.jsx] — Current placeholder, to be replaced
- [Source: src/scenes/GameplayScene.jsx] — Pattern reference for scene composition (Controls, CameraRig, renderers)
- [Source: src/renderers/EnemyRenderer.jsx] — Pattern for entity rendering via InstancedMesh
- [Source: src/renderers/WormholeRenderer.jsx] — Pattern for material disposal in useEffect cleanup
- [Source: src/ui/HUD.jsx] — Pattern for HTML overlay UI reading from stores
- [Source: src/ui/primitives/ProgressBar.jsx] — Reusable progress bar, needs boss variant
- [Source: src/hooks/useAudio.jsx:7-21] — SFX_MAP for preloading
- [Source: src/hooks/useAudio.jsx:28-57] — Phase-based music transitions
- [Source: src/audio/audioManager.js:15-29] — SFX_CATEGORY_MAP
- [Source: src/config/assetManifest.js:37-52] — tier2 section for boss assets
- [Source: src/config/gameConfig.js:94-101] — Wormhole constants pattern, add boss constants similarly
- [Source: src/entities/enemyDefs.js] — Enemy definition pattern, add BOSS_SENTINEL
- [Source: _bmad-output/implementation-artifacts/6-1-wormhole-discovery-activation.md] — Previous story: wormhole activation, material disposal lesson, SFX integration pattern, GameLoop phase detection

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed regression in spawnSystem.test.js: BOSS_SENTINEL had no `spawnWeight`, causing weighted random to include boss in regular spawns. Fixed by filtering `Object.values(ENEMIES)` to only include entries with `spawnWeight > 0`.

### Completion Notes List

- **Task 1**: Added 14 boss constants to gameConfig.js (BOSS_HP, BOSS_ARENA_SIZE, BOSS_MOVE_SPEED, BOSS_COLLISION_RADIUS, BOSS_CONTACT_DAMAGE, BOSS_PROJECTILE_SPEED/DAMAGE/RADIUS, BOSS_ATTACK_COOLDOWN, BOSS_TELEGRAPH_DURATION, BOSS_BURST_COUNT/SPREAD, BOSS_PHASE_THRESHOLDS, BOSS_NAME)
- **Task 2**: Added BOSS_SENTINEL to enemyDefs.js with `behavior: 'boss'` and no `spawnWeight` (prevents regular spawning)
- **Task 3**: Created useBoss.jsx store with spawnBoss(), tick() (chase AI, telegraph→attack→cooldown state machine, projectile spawning, phase transitions), damageBoss(), reset(). 17 unit tests all passing.
- **Task 4**: Added complete boss tick section in GameLoop.jsx — runs when phase==='boss', handles input, player movement (with BOSS_ARENA_SIZE), dash, weapons, boss AI tick, collision detection (player proj vs boss, boss proj vs player, boss body vs player), death checks, level-up handling. Uses existing collision system with new CATEGORY_BOSS and CATEGORY_BOSS_PROJECTILE categories.
- **Task 5**: Replaced BossScene.jsx placeholder with full arena scene — Controls, CameraRig, PlayerShip, ProjectileRenderer, BossRenderer, BossProjectileRenderer, ParticleRenderer, dark purple-tinted starfield, arena boundary walls, arena floor grid.
- **Task 6**: Created BossRenderer.jsx — torus+sphere boss body with emissive purple material, idle rotation+pulse animation, orange telegraph ring that grows during warning, white hit flash, phase-based emissive intensity. Materials disposed on unmount.
- **Task 7**: Created BossProjectileRenderer.jsx — InstancedMesh with orange (#ff6600) spheres, max 50 instances, material disposed on unmount.
- **Task 8**: Created BossHPBar.jsx — HTML overlay top-center, displays "VOID SENTINEL" name, ProgressBar with boss variant, phase markers at 75%/50%/25%, CSS slide-in animation. Mounted in Interface.jsx during boss phase.
- **Task 9**: Added boss audio — bossAttack/bossHit/bossPhase SFX in assetManifest, audioManager SFX_CATEGORY_MAP, useAudio SFX_MAP for preloading. Boss music crossfade in useAudio phase subscription.
- **Task 10**: Added optional `arenaSize` parameter to usePlayer.tick() — defaults to PLAY_AREA_SIZE, GameLoop passes BOSS_ARENA_SIZE during boss phase.
- **Task 11**: GameLoop spawns boss on phase transition to 'boss' (prevPhaseRef check), resets useBoss on new game. Added `prevCombatPhase` to useGame for level-up return to correct phase. Experience.jsx keeps BossScene mounted during boss+levelUp.
- **Additional**: Modified useGame.jsx to store `prevCombatPhase` so level-up during boss returns to 'boss' not 'gameplay'. Modified Experience.jsx to keep BossScene mounted during levelUp from boss. Fixed spawnSystem.js to filter enemies without spawnWeight.

### File List

- `src/config/gameConfig.js` — Modified: added 14 boss constants
- `src/entities/enemyDefs.js` — Modified: added BOSS_SENTINEL definition + GAME_CONFIG import
- `src/stores/useBoss.jsx` — Created: boss entity store (AI, projectiles, damage, reset)
- `src/stores/__tests__/useBoss.test.js` — Created: 17 unit tests for useBoss
- `src/GameLoop.jsx` — Modified: added boss tick section, useBoss import, spawnBoss on phase transition, useBoss.reset() on new game
- `src/scenes/BossScene.jsx` — Modified: replaced placeholder with full boss arena scene
- `src/renderers/BossRenderer.jsx` — Created: boss 3D visual (torus+sphere, animations, telegraph, hit flash)
- `src/renderers/BossProjectileRenderer.jsx` — Created: InstancedMesh orange boss projectiles
- `src/ui/BossHPBar.jsx` — Created: HTML overlay boss HP bar with name + animation
- `src/ui/Interface.jsx` — Modified: mount BossHPBar + HUD during boss phase
- `src/Experience.jsx` — Modified: keep BossScene mounted during boss+levelUp via prevCombatPhase
- `src/stores/useGame.jsx` — Modified: added prevCombatPhase field, triggerLevelUp stores prev phase, resumeGameplay uses prevCombatPhase
- `src/stores/usePlayer.jsx` — Modified: tick() accepts optional arenaSize parameter
- `src/systems/collisionSystem.js` — Modified: added CATEGORY_BOSS, CATEGORY_BOSS_PROJECTILE + collision pairs
- `src/systems/spawnSystem.js` — Modified: filter enemies without spawnWeight to prevent boss from regular spawning
- `src/audio/audioManager.js` — Modified: added boss SFX categories
- `src/config/assetManifest.js` — Modified: added boss SFX paths
- `src/hooks/useAudio.jsx` — Modified: added boss SFX to SFX_MAP + boss music crossfade
- `src/ui/primitives/ProgressBar.jsx` — Already had boss variant (no change needed)
- `src/style.css` — Modified: added bossHPSlideIn keyframe animation

### Change Log

- 2026-02-11: Implemented Story 6.2 — Boss Arena & Combat. Created useBoss store with full AI system (chase, telegraph, attack, phase transitions), GameLoop boss tick section with collision detection, BossScene arena, BossRenderer, BossProjectileRenderer, BossHPBar UI, audio integration, and level-up-during-boss edge case handling.
- 2026-02-11: **Code Review (AI)** — 2 HIGH, 4 MEDIUM, 2 LOW issues found. All HIGH/MEDIUM fixed:
  - H2: useBoss.tick() refactored for Zustand immutability (shallow copy boss, build new projectile arrays instead of mutating store references)
  - H3: BossHPBar CSS animation separated from Tailwind positioning (wrapper div for animation, translateY-only keyframes)
  - H2-related: GameLoop boss projectile removal refactored to use immutable filter instead of splice
  - M1: HUD hides timer and minimap during boss phase (timer irrelevant, minimap scale wrong for boss arena)
  - LOW issues noted but not fixed: BossProjectileRenderer unnecessary reset loop (perf minor), Date.now() for boss hit flash (inconsistent with timer-based patterns elsewhere)
