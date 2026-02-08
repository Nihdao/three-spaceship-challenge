---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/research/market-roguelite-survivor-browser-games-research-2026-02-05.md'
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-06'
project_name: 'three-spaceship-challenge'
user_name: 'Adam'
date: '2026-02-06'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
46 FRs organized across 9 domains:
- Player Control (FR1-FR5): Ship movement, rotation, banking, dash/barrel roll
- Combat System (FR6-FR11): Auto-fire, projectiles, damage, weapon slots (max 4), weapon upgrades (lvl 1-9)
- Progression System (FR12-FR17): XP, level-up choices, boons (max 3), HP, death
- Enemy System (FR18-FR22): Spawn waves, enemy types, contact/projectile damage, scaling difficulty
- Environment & Exploration (FR23-FR27): Space boundaries, planet tiers, scanning mechanic (Tier 2)
- Boss Encounters (FR28-FR32): Wormhole activation, shockwave clear, 1v1 boss fight (Tier 2)
- Tunnel Hub (FR33-FR37): Inter-system hub, Fragment upgrades, dilemmas (Tier 2-3)
- Game Flow & UI (FR38-FR43): Menu, HUD, game over, victory, restart, 10-min timer
- Audio & Feedback (FR44-FR46): Music, SFX, visual damage feedback

**Non-Functional Requirements:**
15 NFRs across 4 domains:
- Performance (NFR1-5): 60 FPS target, 30+ FPS under load, <10s load, <2s transitions
- Compatibility (NFR6-9): Chrome primary, Firefox/Safari secondary, mobile bonus
- Reliability (NFR10-12): No crashes in 30min, localStorage save, tab unfocus handling
- Usability (NFR13-15): 30s control learning, first-run comprehension, 1080p minimum

**Scale & Complexity:**
- Primary domain: Browser WebGL Game (React Three Fiber)
- Complexity level: Medium-High
- Estimated architectural components: ~15-20 major systems
- Scope: 3-tier approach (MVP → Contest → Vision)
- Timeline: Solo dev, ~70-90 hours, end February 2026

### Technical Constraints & Dependencies

**Defined Stack:**
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Three Fiber | v9.1.0 |
| React | React | v19.0 |
| 3D Engine | Three.js | v0.174.0 |
| Helpers | Drei | v10.0.4 |
| Physics | Rapier | v2.0 |
| State | Zustand | v5.0 |
| Build | Vite | v6.2.2 |
| Effects | Postprocessing | v3.0.4 |
| UI Styling | Tailwind CSS | latest |
| Debug | Leva + r3f-perf | latest |

**Key Constraints:**
- Browser-only deployment (no native, no server-side game logic)
- WebGL 2.0 as rendering target (no WebGPU dependency)
- Single-player only (no networking)
- No user accounts (localStorage for persistence)
- Asset budget must fit fast initial load (<10s)

**Open Architectural Decisions:**
- Physics engine (Rapier) vs custom spatial hashing for collision detection
- Audio library choice (Howler.js vs Web Audio API direct)
- Entity management pattern (ECS-like vs component-based with stores)

### Cross-Cutting Concerns Identified

1. **Performance Budget** — Every system must be designed with frame budget in mind. InstancedMesh for enemies, object pooling for projectiles, GPU particles, efficient state updates.

2. **Memory Lifecycle** — Three.js resources (geometries, materials, textures) must be properly disposed on scene transitions (gameplay → tunnel → new system). R3F handles component unmount disposal but custom resources need manual cleanup.

3. **Game State Coordination** — 8 Zustand stores must communicate efficiently. Weapon damage calculation depends on boons, enemy spawning depends on level timer, level-up pauses all systems. Need clear data flow patterns.

4. **Input Context Switching** — WASD/Space during gameplay vs Arrow/Enter/1-2-3-4 during menus/level-up. Must prevent input bleeding between contexts.

5. **Game Loop Management** — Delta-time based updates, pause/resume capability (level-up modal, tab unfocus), 10-minute system timer, cooldown tracking.

6. **Asset Loading Strategy** — GLB models, textures, audio must load within budget. Progressive loading vs upfront loading decision needed.

7. **Scene Management** — Transitions between distinct game states (Menu, Gameplay, Boss, Tunnel, GameOver) with different 3D scenes, UI overlays, and active systems.

## Starter Template Evaluation

### Primary Technology Domain

Browser WebGL Game using React Three Fiber — existing project built on the Three.js Journey course template by Bruno Simon.

### Starter Options Considered

**Option A: Keep Three.js Journey Template (Selected)**
- Existing Vite + R3F setup, fully functional
- All core dependencies already installed and configured
- Existing reusable code (hooks, stores, components)
- Add Tailwind CSS + audio library as needed

**Option B: TypeScript Migration**
- Would add type safety but costs migration time on ~26 existing .jsx files
- Risk of type compatibility issues with R3F v9 / React 19 ecosystem
- Not justified given solo dev + contest deadline

**Option C: Clean Slate with r3f-template or custom**
- Would provide cleaner structure but loses existing reusable code
- Overhead not justified for contest timeline

### Selected Starter: Three.js Journey Template (Existing)

**Rationale for Selection:**
The project already has a working Vite + R3F v9 + React 19 setup from the Three.js Journey course. All core dependencies are installed and version-locked. Six custom hooks and three Zustand stores provide reusable game infrastructure. Given the solo dev timeline (~70-90 hours, end of February 2026), preserving this foundation and iterating on it is the most efficient path.

**Existing Setup (No Initialization Needed):**

```bash
# Already configured — no init command required
# Dependencies installed via existing package.json
npm install
npm run dev
```

**Architectural Decisions Already Made by Starter:**

**Language & Runtime:**
- JavaScript (JSX) — no TypeScript
- ES modules (`"type": "module"`)
- Vite plugin transforms .js files as JSX automatically

**Styling Solution:**
- Basic CSS (`style.css`) — Tailwind CSS to be added
- No CSS modules or styled-components

**Build Tooling:**
- Vite v6.2.2 with React plugin
- Source maps enabled
- Output to `dist/`
- `src/` as Vite root, `public/` for static assets

**Code Organization:**
```
src/
├── index.html          # Entry point
├── index.jsx           # React root
├── style.css           # Global styles
├── Experience.jsx      # Main R3F scene
├── Player.jsx          # Player component
├── Interface.jsx       # UI overlay
├── Lights.jsx          # Scene lighting
├── stores/             # Zustand stores (useGame, useCameraStore, useControlsStore)
├── hooks/              # Custom hooks (movement, camera, controls, animations, attack)
├── components/         # Reusable components
├── effects/            # Post-processing effects
└── shaders/            # GLSL shaders
```

**Development Experience:**
- Hot module replacement via Vite
- Leva for runtime parameter tweaking
- r3f-perf for performance monitoring
- vite-plugin-restart for public file watching

**Required Additions (During Implementation):**
- Tailwind CSS + PostCSS + Autoprefixer
- Audio library (Howler.js or Web Audio API wrapper)
- Game-specific folder restructuring (enemies/, weapons/, ui/, etc.)

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Collision Detection: Custom Spatial Hashing
2. Entity Management: Hybride InstancedMesh + Zustand stores
3. State Architecture: Game Loop centralisé (useFrame maître)
4. Scene Management: Mount/Unmount + Asset Preload (Drei)

**Important Decisions (Shape Architecture):**
5. Audio: Howler.js
6. Asset Loading: Hybrid Critical Upfront + Lazy par phase
7. Deployment: Vercel (concours) → itch.io (post-concours) → Steam (si traction)

**Already Decided (Starter/PRD):**
- Language: JavaScript (JSX)
- Framework: R3F v9 + React 19 + Three.js r174
- State: Zustand v5
- Build: Vite v6.2.2
- Helpers: Drei v10, Postprocessing v3
- UI: Tailwind CSS
- Debug: Leva + r3f-perf

**Deferred Decisions (Post-MVP):**
- Rapier: Installed but unused for core gameplay. May use for visual physics (debris, explosions) in Tier 2/3, or remove to reduce bundle
- Steam porting considerations: Out of scope for contest

### Collision Detection

| Aspect | Decision |
|--------|----------|
| **Choice** | Custom Spatial Hashing |
| **Rationale** | All collisions are circle-vs-circle distance checks. Rapier's full 3D physics engine is overkill for a 2D top-down survivors-like. Spatial hashing reduces checks to nearby cells only, critical for 100+ entities. |
| **Affects** | Enemy system, projectile system, XP orb pickup, planet scanning zone, boss attacks |
| **Implementation** | Grid-based spatial hash with cell size matching largest entity radius. Update grid each frame in game loop. |

### Entity Management

| Aspect | Decision |
|--------|----------|
| **Choice** | Hybride InstancedMesh (rendering) + Zustand stores (state) |
| **Rationale** | One draw call per enemy type via InstancedMesh. Entity data (positions, HP, states) stored in typed arrays within Zustand stores. useFrame syncs store data → instance matrices each frame. |
| **Affects** | Enemies, projectiles, XP orbs, particle effects |
| **Implementation** | Float32Array pools in stores, InstancedMesh refs updated in game loop, object pooling for reuse (no GC pressure). |

### State Architecture

| Aspect | Decision |
|--------|----------|
| **Choice** | Centralized Game Loop (`<GameLoop>` component with master useFrame) |
| **Rationale** | Deterministic execution order prevents subtle timing bugs. Stores expose pure actions, game loop calls them in sequence: input → movement → weapons → projectiles → collisions → damage → spawning → cleanup. |
| **Affects** | All game systems, pause/resume, delta-time management |
| **Implementation** | Single `<GameLoop>` component with useFrame priority. Stores expose `tick(delta)` or action methods called by the loop. |

### Scene Management

| Aspect | Decision |
|--------|----------|
| **Choice** | Hybride Mount/Unmount + Asset Preload |
| **Rationale** | React mount/unmount for clean memory lifecycle. Drei preload (`useGLTF.preload()`, `useTexture.preload()`) at startup for instant scene transitions. Memory freed when scenes unmount — important for 30-min sessions. |
| **Affects** | Menu, Gameplay, Boss, Tunnel, GameOver transitions |
| **Implementation** | Phase-based rendering in Experience.jsx. Preload manifest called once at app init. |

### Audio

| Aspect | Decision |
|--------|----------|
| **Choice** | Howler.js |
| **Rationale** | Handles cross-browser quirks (autoplay policies, iOS unlock, format fallbacks). Simple API for music loops + SFX sprites. ~10kb gzipped. Spatial audio not needed for top-down. |
| **Affects** | Background music, weapon SFX, hit feedback, level-up sounds, UI sounds |
| **Implementation** | Audio manager singleton/store wrapping Howler. Preload critical sounds with game assets. |

### Asset Loading

| Aspect | Decision |
|--------|----------|
| **Choice** | Hybrid Critical Upfront + Lazy per Phase |
| **Rationale** | Load critical assets (ship, first enemies, HUD, menu music) upfront for <5s initial load. Preload Tier 2 assets (boss, tunnel, advanced enemies) silently during gameplay. |
| **Affects** | Initial load time (NFR3), scene transitions (NFR4), memory usage |
| **Implementation** | Asset manifest categorized by priority. Drei preload for 3D assets, Howler preload for audio. Loading screen for critical assets only. |

### Deployment

| Aspect | Decision |
|--------|----------|
| **Choice** | Vercel (primary) → itch.io (post-contest) → Steam (if traction) |
| **Rationale** | Vercel: instant Git deploy, global CDN, free tier sufficient for contest. itch.io: gaming community visibility post-contest. Steam: only if significant traction warrants porting effort. |
| **Affects** | Build pipeline, URL strategy, post-contest roadmap |
| **Implementation** | `vite build` → Vercel auto-deploy from main branch. itch.io manual upload of dist/. |

### Decision Impact Analysis

**Implementation Sequence:**
1. Tailwind CSS + Howler.js setup (additions to existing starter)
2. Game Loop architecture (`<GameLoop>` + store tick methods)
3. Spatial Hashing system (collision foundation)
4. Entity pool system (InstancedMesh + typed arrays in stores)
5. Scene management (phase-based mount/unmount + preload)
6. Asset loading manifest (priority categorization)
7. Vercel deployment config

**Cross-Component Dependencies:**
- Game Loop depends on all stores exposing tick/action methods
- Entity Management depends on Spatial Hashing for collision queries
- Scene Management depends on Asset Loading for preload strategy
- Audio depends on Asset Loading for sound preloading

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

12 areas where AI agents could make different choices, organized in 6 categories.

### Naming Patterns

**File Naming:**
- Components: `PascalCase.jsx` → `Player.jsx`, `GameLoop.jsx`, `LevelUpModal.jsx`
- Hooks: `camelCase.jsx` prefixed with `use` → `usePlayerMovement.jsx`, `useEnemyPool.jsx`
- Stores: `camelCase.jsx` prefixed with `use` → `usePlayer.jsx`, `useEnemies.jsx`
- Utilities: `camelCase.js` → `spatialHash.js`, `mathUtils.js`
- Constants/Config: `camelCase.js` → `weaponDefs.js`, `enemyDefs.js`, `gameConfig.js`
- Shaders: `camelCase.glsl` in named folders → `shaders/explosion/vertex.glsl`

**Component Naming:**
- React components: `PascalCase` → `<EnemyRenderer />`, `<HUD />`, `<MainMenu />`
- Props: `camelCase` → `maxHealth`, `spawnRate`, `onLevelUp`

**Zustand Store Naming:**
- Store hooks: `use{Domain}` → `usePlayer`, `useEnemies`, `useWeapons`, `useBoons`, `useLevel`
- Actions: `verb + noun` → `spawnEnemy()`, `dealDamage()`, `addWeapon()`, `applyBoon()`
- Getters: `get + noun` → `getActiveWeapons()`, `getNearbyEnemies()`
- State fields: `camelCase` nouns → `position`, `activeWeapons`, `currentHP`, `maxHP`

**Game Entity Naming:**
- Enemy types: `SCREAMING_CAPS` for IDs → `FODDER_BASIC`, `FODDER_FAST`, `RANGED_SNIPER`
- Weapon types: `SCREAMING_CAPS` → `LASER_FRONT`, `MISSILE_HOMING`, `TRAIL_CORROSIVE`
- Boon types: `SCREAMING_CAPS` → `SPEED_BOOST`, `DAMAGE_AMP`, `CRIT_CHANCE`

### Structure Patterns

**Project Organization (by domain):**
```
src/
├── index.html
├── index.jsx
├── style.css
├── Experience.jsx              # Main R3F canvas + scene routing
├── GameLoop.jsx                # Master useFrame orchestrator
│
├── stores/                     # Zustand stores (state + actions)
│   ├── useGame.jsx             # Game phase, timer, score (existing, extended)
│   ├── usePlayer.jsx           # HP, position, weapons, boons
│   ├── useEnemies.jsx          # Enemy pool, spawn logic, positions
│   ├── useWeapons.jsx          # Weapon definitions, cooldowns
│   ├── useBoons.jsx            # Boon definitions, active effects
│   ├── useLevel.jsx            # System state, timer, planets, wormhole
│   ├── useCameraStore.jsx      # Camera state (existing)
│   └── useControlsStore.jsx    # Input state (existing)
│
├── hooks/                      # Custom React hooks
│   ├── useHybridControls.jsx   # Input handling (existing, adapt)
│   ├── usePlayerMovement.jsx   # Ship movement logic (existing, adapt)
│   ├── usePlayerCamera.jsx     # Camera follow (existing, adapt)
│   └── useDebugMode.jsx        # Debug utilities (existing)
│
├── systems/                    # Game systems (pure logic, no rendering)
│   ├── spatialHash.js          # Spatial hashing collision grid
│   ├── collisionSystem.js      # Collision detection queries
│   ├── spawnSystem.js          # Enemy wave spawning logic
│   ├── projectileSystem.js     # Projectile movement + lifecycle
│   └── progressionSystem.js    # XP, level-up, difficulty scaling
│
├── entities/                   # Entity definitions (data, not components)
│   ├── weaponDefs.js           # Weapon stats, behaviors, upgrade curves
│   ├── enemyDefs.js            # Enemy stats, behaviors, spawn weights
│   ├── boonDefs.js             # Boon effects, stacking rules
│   └── planetDefs.js           # Planet tiers, scan rewards
│
├── scenes/                     # R3F scene components (3D rendering)
│   ├── GameplayScene.jsx       # Main gameplay 3D scene
│   ├── MenuScene.jsx           # Menu background 3D scene
│   ├── BossScene.jsx           # Boss arena 3D scene
│   └── TunnelScene.jsx         # Wormhole tunnel 3D scene
│
├── renderers/                  # InstancedMesh rendering components
│   ├── EnemyRenderer.jsx       # InstancedMesh for all enemies
│   ├── ProjectileRenderer.jsx  # InstancedMesh for projectiles
│   ├── XPOrbRenderer.jsx       # InstancedMesh for XP orbs
│   └── ParticleRenderer.jsx    # GPU particle effects
│
├── ui/                         # HTML overlay UI (Tailwind)
│   ├── primitives/             # Reusable UI building blocks
│   │   ├── Button.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   └── StatLine.jsx
│   ├── HUD.jsx
│   ├── LevelUpModal.jsx
│   ├── GameOverScreen.jsx
│   ├── MainMenu.jsx
│   ├── TunnelHub.jsx
│   └── BossHPBar.jsx
│
├── effects/                    # Post-processing effects
│   └── ...
│
├── shaders/                    # GLSL shaders
│   └── {effect-name}/
│       ├── vertex.glsl
│       └── fragment.glsl
│
├── audio/                      # Audio manager
│   └── audioManager.js         # Howler.js wrapper + sound registry
│
└── config/                     # Game configuration
    ├── gameConfig.js           # Global constants (speeds, limits, timers)
    └── assetManifest.js        # Asset paths + loading priorities
```

**Key Organizational Rules:**
- `stores/` = state + actions (Zustand). No rendering logic.
- `systems/` = pure game logic functions. No React, no rendering. Testable in isolation.
- `entities/` = data definitions only. Object literals, no logic.
- `renderers/` = InstancedMesh components. Read from stores, write to GPU. No game logic.
- `scenes/` = R3F scene composition. Mount renderers + lights + environment.
- `ui/` = HTML overlay. Read from stores for display. Dispatch actions on user input.

### Zustand Store Patterns

**Store Structure Template:**
```javascript
// Every store follows this pattern
const useExample = create((set, get) => ({
  // --- State ---
  items: [],
  count: 0,

  // --- Actions (called by GameLoop or UI) ---
  tick: (delta) => { /* frame update logic */ },
  reset: () => set({ items: [], count: 0 }),

  // --- Specific actions ---
  addItem: (item) => set(state => ({ items: [...state.items, item] })),
}))
```

**Inter-Store Communication Rules:**
- Stores NEVER import other stores at module level
- GameLoop reads from stores via `useStore.getState()` and passes data to tick functions
- If store A needs data from store B, the GameLoop reads B and passes it to A's tick
- UI components can subscribe to multiple stores directly (React re-renders)

**State Update Rules:**
- Use Zustand's `set()` for state updates (immutable by default)
- For performance-critical paths (enemy positions each frame), use mutable typed arrays and call `set()` only when React needs to re-render
- Never mutate state directly outside of `set()` callback

### Game Entity Definition Patterns

**Adding a new weapon:**
```javascript
// entities/weaponDefs.js
export const WEAPONS = {
  LASER_FRONT: {
    id: 'LASER_FRONT',
    name: 'Front Laser',
    description: 'Fires a laser beam forward',
    baseDamage: 10,
    baseCooldown: 0.5,    // seconds
    baseSpeed: 300,        // units/sec
    projectileType: 'beam',
    upgrades: [
      { level: 2, damage: 15, cooldown: 0.45 },
      { level: 3, damage: 20, cooldown: 0.4 },
      // ...up to level 9
    ],
  },
  // ... more weapons
}
```

**Adding a new enemy:**
```javascript
// entities/enemyDefs.js
export const ENEMIES = {
  FODDER_BASIC: {
    id: 'FODDER_BASIC',
    name: 'Drone',
    hp: 20,
    speed: 17,
    damage: 5,
    radius: 0.5,          // collision radius
    xpReward: 10,
    behavior: 'chase',    // chase | orbit | ranged | boss
    spawnWeight: 100,      // relative spawn probability
    modelPath: '/models/enemies/robot-enemy-flying.glb',
    color: '#ff5555',
    meshScale: [3, 3, 3],
  },
  // ... more enemies
}
```

**Pattern: All entity definitions are plain objects. No classes. No methods. Systems read these defs and apply logic.**

### useFrame Rules

**Master Rule: Only `<GameLoop>` has a high-priority useFrame for game logic.**

```javascript
// GameLoop.jsx — THE orchestrator
useFrame((state, delta) => {
  if (isPaused) return

  // 1. Input
  const input = useControlsStore.getState()

  // 2. Player movement
  usePlayer.getState().tick(delta, input)

  // 3. Weapons fire
  useWeapons.getState().tick(delta)

  // 4. Projectile movement
  useProjectiles.getState().tick(delta)

  // 5. Enemy movement + spawning
  useEnemies.getState().tick(delta)

  // 6. Collision detection
  collisionSystem.resolve()

  // 7. Damage + death
  // 8. XP + progression
  // 9. Cleanup dead entities
})
```

**Allowed useFrame outside GameLoop:**
- Renderers: useFrame for syncing InstancedMesh matrices from store data (visual only)
- Camera: useFrame for smooth camera interpolation
- Effects: useFrame for shader uniforms animation

**Forbidden:**
- No game logic in renderer useFrames
- No state mutations in renderer useFrames
- No useFrame in UI components

### Constants & Configuration

**All gameplay values in `config/gameConfig.js`:**
```javascript
export const GAME_CONFIG = {
  SYSTEM_TIMER: 600,        // 10 minutes in seconds
  PLAYER_BASE_HP: 100,
  PLAYER_BASE_SPEED: 150,
  DASH_COOLDOWN: 3,          // seconds
  DASH_DURATION: 0.3,
  MAX_ENEMIES_ON_SCREEN: 100,
  MAX_PROJECTILES: 200,
  XP_LEVEL_CURVE: [100, 150, 225, 340, ...], // XP per level
  SPATIAL_HASH_CELL_SIZE: 2, // world units
}
```

**Rule: No magic numbers in game logic. All tunable values in gameConfig.js or entity defs.**

### Error Handling Patterns

- Game errors (enemy spawn fails, asset missing): `console.warn()` + graceful fallback (skip that enemy, use placeholder)
- Critical errors (WebGL context lost, store corruption): Error boundary catches, show "reload" screen
- Never let a game error crash the whole app — degrade gracefully
- Debug mode (`useDebugMode`): Extra console.log, visual helpers, Leva panels

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow the folder structure — new files go in the correct directory by type
2. Use the naming conventions — PascalCase components, camelCase hooks/stores/utils, SCREAMING_CAPS entity IDs
3. Put game logic in systems/ or store tick() methods — never in renderers
4. Add gameplay constants to gameConfig.js — no magic numbers
5. New entity types follow the definition pattern in entities/
6. Only GameLoop orchestrates game state updates via useFrame

**Anti-Patterns to Avoid:**
- Creating a new Zustand store for a one-off feature (extend existing stores instead)
- Putting game logic inside a renderer component
- Using useEffect for game tick logic (use the GameLoop instead)
- Importing one store inside another store at module level
- Hardcoding gameplay values inside components

## Project Structure & Boundaries

### Complete Project Directory Structure

```
three-spaceship-challenge/
├── package.json
├── package-lock.json
├── vite.config.js
├── tailwind.config.js          # À créer
├── postcss.config.js           # À créer
├── .gitignore
├── README.md
│
├── public/
│   ├── models/                 # GLB/GLTF 3D models
│   │   ├── ships/              # Player ship variants
│   │   ├── enemies/            # Enemy models by type
│   │   └── environment/        # Planets, wormhole, asteroids
│   ├── textures/               # Shared textures (skybox, particles)
│   ├── audio/
│   │   ├── music/              # Background music tracks (MP3/OGG)
│   │   └── sfx/                # Sound effects (MP3/OGG)
│   └── fonts/                  # WOFF2 fonts if custom
│
├── src/
│   ├── index.html
│   ├── index.jsx               # React root + Tailwind import
│   ├── style.css               # Tailwind directives + custom CSS
│   ├── Experience.jsx           # R3F Canvas + phase-based scene routing
│   ├── GameLoop.jsx             # Master useFrame orchestrator
│   │
│   ├── stores/
│   │   ├── useGame.jsx          # Game phase, timer, score, pause state
│   │   ├── usePlayer.jsx        # HP, position, active weapons/boons, invuln
│   │   ├── useEnemies.jsx       # Enemy pool (Float32Array), spawn state
│   │   ├── useWeapons.jsx       # Active weapons, cooldowns, projectile pool
│   │   ├── useBoons.jsx         # Active boons, computed modifiers
│   │   ├── useLevel.jsx         # System timer, planets, wormhole, difficulty
│   │   ├── useCameraStore.jsx   # Camera position/target (existing)
│   │   └── useControlsStore.jsx # Input state, key bindings (existing)
│   │
│   ├── hooks/
│   │   ├── useHybridControls.jsx   # Keyboard input handling (existing, adapt)
│   │   ├── usePlayerMovement.jsx   # Ship movement + rotation (existing, adapt)
│   │   ├── usePlayerCamera.jsx     # Camera follow smooth (existing, adapt)
│   │   └── useDebugMode.jsx        # Debug toggle + helpers (existing)
│   │
│   ├── systems/
│   │   ├── spatialHash.js          # Grid-based spatial partitioning
│   │   ├── collisionSystem.js      # Circle-circle collision queries
│   │   ├── spawnSystem.js          # Wave logic, difficulty curve, spawn rules
│   │   ├── projectileSystem.js     # Projectile movement, lifetime, pooling
│   │   └── progressionSystem.js    # XP curve, level-up pool, difficulty scaling
│   │
│   ├── entities/
│   │   ├── weaponDefs.js           # All weapon definitions + upgrade curves
│   │   ├── enemyDefs.js            # All enemy types + behaviors
│   │   ├── boonDefs.js             # All boon effects + stacking
│   │   └── planetDefs.js           # Planet tiers + scan rewards
│   │
│   ├── scenes/
│   │   ├── GameplayScene.jsx       # Main gameplay (environment + renderers)
│   │   ├── MenuScene.jsx           # Menu background (idle ship + stars)
│   │   ├── BossScene.jsx           # Boss arena (Tier 2)
│   │   └── TunnelScene.jsx         # Wormhole tunnel (Tier 2)
│   │
│   ├── renderers/
│   │   ├── PlayerShip.jsx          # Player ship mesh + animations
│   │   ├── EnemyRenderer.jsx       # InstancedMesh per enemy type
│   │   ├── ProjectileRenderer.jsx  # InstancedMesh for projectiles
│   │   ├── XPOrbRenderer.jsx       # InstancedMesh for XP pickups
│   │   ├── ParticleRenderer.jsx    # GPU particles (explosions, trails)
│   │   └── EnvironmentRenderer.jsx # Skybox, boundaries, decorative elements
│   │
│   ├── ui/
│   │   ├── primitives/
│   │   │   ├── Button.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── StatLine.jsx
│   │   ├── HUD.jsx                 # HP, timer, XP, minimap, dash CD, weapons
│   │   ├── LevelUpModal.jsx        # Level-up choice cards
│   │   ├── GameOverScreen.jsx      # Death sequence + stats + retry
│   │   ├── MainMenu.jsx            # Play, Options, Credits
│   │   ├── TunnelHub.jsx           # Upgrades + dilemmas (Tier 2)
│   │   ├── BossHPBar.jsx           # Boss health display (Tier 2)
│   │   └── LoadingScreen.jsx       # Initial asset loading progress
│   │
│   ├── effects/
│   │   └── ...                     # Post-processing (bloom, vignette, etc.)
│   │
│   ├── shaders/
│   │   └── {effect-name}/
│   │       ├── vertex.glsl
│   │       └── fragment.glsl
│   │
│   ├── audio/
│   │   └── audioManager.js         # Howler.js wrapper, sound registry, volume
│   │
│   └── config/
│       ├── gameConfig.js           # Global tuning constants
│       └── assetManifest.js        # Asset paths + loading priorities
│
└── dist/                           # Build output (gitignored)
```

### Architectural Boundaries

**Layer 1: Config & Data (no dependencies)**
```
config/gameConfig.js  ←  Pure constants, imported by anything
entities/*Defs.js     ←  Pure data objects, imported by systems and stores
```

**Layer 2: Systems (depend on Config only)**
```
systems/spatialHash.js       ←  Pure functions, no React, no stores
systems/collisionSystem.js   ←  Uses spatialHash, returns collision pairs
systems/spawnSystem.js       ←  Reads enemyDefs, returns spawn instructions
systems/projectileSystem.js  ←  Pure movement math
systems/progressionSystem.js ←  XP math, level-up pool generation
```

**Layer 3: Stores (depend on Config + Systems)**
```
stores/usePlayer.jsx    ←  Owns player state, exposes tick() + actions
stores/useEnemies.jsx   ←  Owns enemy pool, exposes tick() + spawn/kill
stores/useWeapons.jsx   ←  Owns weapon state, exposes tick() + fire
stores/useBoons.jsx     ←  Owns boon state, computes modifiers
stores/useLevel.jsx     ←  Owns system timer, difficulty, phase triggers
stores/useGame.jsx      ←  Owns game phase (menu/play/pause/over)
```

**Layer 4: GameLoop (depends on Stores + Systems)**
```
GameLoop.jsx  ←  Reads all stores, calls tick() in order, runs collision
               ←  THE ONLY place where cross-store coordination happens
```

**Layer 5: Rendering (depends on Stores, read-only)**
```
renderers/*   ←  Read store data → update InstancedMesh matrices
scenes/*      ←  Compose renderers + lights + environment
effects/*     ←  Post-processing, read uniforms from stores
```

**Layer 6: UI (depends on Stores, read + dispatch actions)**
```
ui/*          ←  HTML overlay, reads stores for display
              ←  Dispatches store actions on user input (level-up choice, menu click)
              ←  NEVER touches 3D objects or useFrame
```

**Boundary Rules:**
- Lower layers NEVER import from higher layers
- Stores never import other stores
- Renderers never modify store state
- UI never accesses Three.js objects
- GameLoop is the only bridge between stores

### Requirements to Structure Mapping

| FR Category | Store(s) | System(s) | Renderer(s) | UI | Scene |
|-------------|----------|-----------|-------------|-----|-------|
| **Player Control** (FR1-5) | usePlayer, useControlsStore | — | PlayerShip | — | GameplayScene |
| **Combat** (FR6-11) | useWeapons, usePlayer | projectileSystem, collisionSystem | ProjectileRenderer, ParticleRenderer | — | GameplayScene |
| **Progression** (FR12-17) | usePlayer, useBoons, useGame | progressionSystem | XPOrbRenderer | LevelUpModal, HUD | GameplayScene |
| **Enemies** (FR18-22) | useEnemies | spawnSystem, spatialHash, collisionSystem | EnemyRenderer | — | GameplayScene |
| **Environment** (FR23-27) | useLevel | — | EnvironmentRenderer | HUD (minimap) | GameplayScene |
| **Boss** (FR28-32) | useEnemies, useLevel | collisionSystem | EnemyRenderer | BossHPBar | BossScene |
| **Tunnel** (FR33-37) | usePlayer, useGame | — | — | TunnelHub | TunnelScene |
| **Game Flow** (FR38-43) | useGame, useLevel | — | — | MainMenu, HUD, GameOverScreen | All scenes |
| **Audio** (FR44-46) | — (audioManager) | — | — | — | — |

### Data Flow

```
[Keyboard Input]
      ↓
[useControlsStore]  ← stores raw key state
      ↓
[GameLoop.tick()]   ← reads input each frame
      ↓
[usePlayer.tick()]  ← updates position, rotation, dash
      ↓
[useWeapons.tick()] ← fires projectiles based on player facing + cooldowns
      ↓
[useEnemies.tick()] ← moves enemies toward player, spawns new waves
      ↓
[spatialHash.update()] ← rebuilds grid with all entity positions
      ↓
[collisionSystem.resolve()] ← queries grid, returns collision pairs
      ↓
[Apply damage/death/XP]  ← stores update based on collisions
      ↓
[Renderers sync]    ← useFrame reads stores → updates InstancedMesh matrices
      ↓
[UI re-renders]     ← React subscriptions update HUD, modals
```

### Asset Organization

**public/models/:** One GLB per model. Named by entity key matching `modelKey` in defs.
```
models/ships/player-default.glb
models/enemies/drone.glb
models/enemies/scout.glb
models/environment/planet-silver.glb
```

**public/audio/:** Named by sound key matching audioManager registry.
```
audio/music/gameplay-loop.mp3
audio/sfx/laser-fire.mp3
audio/sfx/explosion-small.mp3
audio/sfx/level-up.mp3
```

**config/assetManifest.js:**
```javascript
export const ASSET_MANIFEST = {
  critical: {  // Loaded before menu
    models: ['ships/player-default.glb'],
    textures: ['skybox.png'],
    audio: ['music/menu-loop.mp3'],
  },
  gameplay: {  // Loaded during menu / early gameplay
    models: ['enemies/drone.glb', 'enemies/scout.glb'],
    audio: ['music/gameplay-loop.mp3', 'sfx/laser-fire.mp3'],
  },
  tier2: {     // Loaded silently during gameplay
    models: ['environment/planet-silver.glb', 'enemies/boss-sentinel.glb'],
    audio: ['sfx/boss-theme.mp3'],
  },
}
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are verified compatible:
- R3F v9 designed for React 19 — no conflict
- Drei v10 targets Three.js r174+ — aligned
- Zustand v5 fully supports React 19 concurrent features
- Vite v6.2.2 + Tailwind CSS — standard well-documented setup
- Howler.js is standalone — no framework dependency
- Rapier v2 installed but dormant — no runtime cost if unused

**Pattern Consistency:**
- Naming conventions (PascalCase/camelCase/SCREAMING_CAPS) are consistent and unambiguous
- Layer architecture (Config → Systems → Stores → GameLoop → Renderers → UI) has clear dependency direction
- GameLoop orchestration pattern aligns with Zustand store design (tick methods)
- Entity definition pattern (plain objects) works naturally with InstancedMesh rendering

**Structure Alignment:**
- Project structure directly maps to architectural layers
- Boundaries are enforced by directory organization
- Each FR category maps to specific directories (see Requirements Mapping table)

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All 46 FRs across 9 categories have clear architectural support:
- Player Control (FR1-5): usePlayer store + PlayerShip renderer + existing hooks
- Combat (FR6-11): useWeapons store + projectileSystem + collisionSystem
- Progression (FR12-17): progressionSystem + useBoons + LevelUpModal
- Enemies (FR18-22): useEnemies store + spawnSystem + EnemyRenderer (InstancedMesh)
- Environment (FR23-27): useLevel store + EnvironmentRenderer
- Boss (FR28-32): BossScene + BossHPBar + useEnemies (boss behavior)
- Tunnel (FR33-37): TunnelScene + TunnelHub + useGame/usePlayer
- Game Flow (FR38-43): useGame store + scene routing + UI components
- Audio (FR44-46): audioManager with Howler.js

**Non-Functional Requirements Coverage:**
All 15 NFRs addressed:
- Performance (NFR1-5): InstancedMesh, spatial hashing, object pooling, typed arrays, asset preload
- Compatibility (NFR6-9): Standard WebGL 2.0, no browser-specific APIs, Vite build
- Reliability (NFR10-12): GameLoop pause, localStorage save at transitions, visibilitychange handling
- Usability (NFR13-15): Keyboard-first design, HUD overlay, responsive Tailwind

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All 7 critical/important decisions documented with rationale
- Technology versions specified and verified
- Implementation approach outlined for each decision

**Structure Completeness:**
- Complete directory tree with every file and folder
- All architectural layers defined with clear boundaries
- FR-to-structure mapping table provided

**Pattern Completeness:**
- Naming conventions cover all code artifacts
- Store template with example code provided
- Entity definition patterns with concrete examples
- useFrame rules clearly scoped
- GameLoop orchestration order specified

### Gap Analysis Results

**No critical gaps found.**

**Minor gaps (resolvable during implementation):**
1. Minimap rendering approach — will be a 2D canvas in HUD reading from stores
2. Pause mechanism details — visibilitychange API + Escape key in GameLoop
3. localStorage serialization pattern — serialize relevant store state at system transitions
4. Weapon slot array structure — array[4] in useWeapons, index 0 locked

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (46 FRs, 15 NFRs)
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified (browser-only, WebGL 2.0, solo dev)
- [x] Cross-cutting concerns mapped (7 concerns)

**✅ Architectural Decisions**
- [x] 7 critical/important decisions documented with versions
- [x] Technology stack fully specified and verified
- [x] Integration patterns defined (GameLoop orchestration)
- [x] Performance considerations addressed (InstancedMesh, spatial hash, pooling)

**✅ Implementation Patterns**
- [x] Naming conventions established (files, components, stores, entities)
- [x] Structure patterns defined (6-layer architecture)
- [x] Communication patterns specified (GameLoop as sole bridge)
- [x] Process patterns documented (error handling, useFrame rules)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established (6 layers)
- [x] Integration points mapped (data flow diagram)
- [x] Requirements to structure mapping complete (9 FR categories)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all decisions are coherent, all requirements covered, clear patterns defined

**Key Strengths:**
- Clear separation of concerns via 6-layer architecture
- Performance-first design (InstancedMesh, spatial hashing, typed arrays)
- Deterministic game loop prevents timing bugs
- Entity definition pattern makes adding content trivial
- Existing codebase provides proven foundation (hooks, stores)

**Areas for Future Enhancement:**
- TypeScript migration post-contest for long-term maintainability
- Rapier integration for visual physics effects (Tier 2/3)
- Automated testing setup if project continues post-contest
- Performance profiling and optimization pass before submission

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and layer boundaries
- Refer to this document for all architectural questions
- New entities/weapons/enemies follow the definition patterns in entities/

**First Implementation Priorities:**
1. Install Tailwind CSS + Howler.js
2. Restructure src/ to match target directory structure
3. Create config/gameConfig.js + config/assetManifest.js
4. Create GameLoop.jsx skeleton with tick order
5. Create entity definition files (weaponDefs, enemyDefs, boonDefs)
6. Implement spatialHash.js + collisionSystem.js
