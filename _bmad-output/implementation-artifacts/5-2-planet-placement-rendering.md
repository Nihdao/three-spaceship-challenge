# Story 5.2: Planet Placement & Rendering

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see planets of different tiers scattered in the space environment,
So that I have points of interest to discover and explore.

## Acceptance Criteria

1. **Given** the gameplay scene loads **When** planets are placed **Then** planets of different tiers (silver, gold, platinum) are positioned in the play area according to planetDefs.js **And** each tier has a visually distinct appearance (size, color, effects)

2. **Given** planets are in the scene **When** the player navigates near a planet **Then** the planet is visible on the minimap **And** the planet renders with appropriate 3D model/visual from the asset manifest

3. **Given** the useLevel store **When** it tracks planet state **Then** each planet has: position, tier, scanned status, scan progress

## Tasks / Subtasks

- [x] Task 1: Define planet data in planetDefs.js (AC: #1)
  - [x] 1.1: Define 3 tiers: `PLANET_SILVER`, `PLANET_GOLD`, `PLANET_PLATINUM` with distinct properties (scanTime, reward pool quality, color, size scale, model key)
  - [x] 1.2: Each planet def includes: `id`, `name`, `tier` (silver/gold/platinum), `scanTime` (seconds), `color`, `emissiveColor`, `scale` (model scale multiplier), `modelKey` (maps to assetManifest tier2 models), `scanRadius` (world units — zone the player must stay in)
  - [x] 1.3: Tier hierarchy: silver = common/fast scan, gold = uncommon/medium scan, platinum = rare/slow scan

- [x] Task 2: Add planet config constants to gameConfig.js (AC: #1, #3)
  - [x] 2.1: `PLANET_COUNT_SILVER: 4` — number of silver planets per system
  - [x] 2.2: `PLANET_COUNT_GOLD: 2` — number of gold planets per system
  - [x] 2.3: `PLANET_COUNT_PLATINUM: 1` — number of platinum planets per system
  - [x] 2.4: `PLANET_SCAN_RADIUS_SILVER: 40` — scan zone radius for silver planets
  - [x] 2.5: `PLANET_SCAN_RADIUS_GOLD: 50` — scan zone radius for gold planets
  - [x] 2.6: `PLANET_SCAN_RADIUS_PLATINUM: 60` — scan zone radius for platinum planets
  - [x] 2.7: `PLANET_MIN_DISTANCE_FROM_CENTER: 200` — minimum distance from world center (0,0) to avoid crowding spawn area
  - [x] 2.8: `PLANET_MIN_DISTANCE_BETWEEN: 300` — minimum distance between planets to spread them out
  - [x] 2.9: `PLANET_PLACEMENT_MARGIN: 100` — distance from play area boundary to keep planets inside safe zone
  - [x] 2.10: `PLANET_MODEL_Y_OFFSET: -35` — Y position offset (planets sit below the gameplay plane so ship flies over them; adjusted from -50 to -35 during visual tuning)
  - [x] 2.11: `PLANET_ORBIT_SPEED: 0.1` — slow rotation speed for visual idle animation (radians/sec)

- [x] Task 3: Extend useLevel store with planet state (AC: #3)
  - [x] 3.1: Change `planets: []` initial state type — each planet object: `{ id: string, typeId: string, tier: string, x: number, z: number, scanned: boolean, scanProgress: number }`
  - [x] 3.2: Add `initializePlanets()` action: generates planet placements using random positions within play area bounds, respecting min distances (from center, between planets, from boundary). Uses planetDefs for type/tier properties
  - [x] 3.3: Placement algorithm: for each tier, generate N planets (from gameConfig counts). For each, pick random (x, z) within `[-PLAY_AREA_SIZE + margin, PLAY_AREA_SIZE - margin]`, reject if too close to center or other planets (retry up to 50 times)
  - [x] 3.4: Add `getPlanets()` getter for renderer access
  - [x] 3.5: Update `reset()` to clear planets array: `planets: []`
  - [x] 3.6: Planet state fields `scanned` and `scanProgress` are initialized to `false` and `0` — scanning logic is Story 5.3

- [x] Task 4: Call initializePlanets from GameLoop on game start (AC: #1, #3)
  - [x] 4.1: In GameLoop, inside the `phase === 'gameplay' && prevPhaseRef.current !== 'gameplay' && prevPhaseRef.current !== 'levelUp'` reset block, add `useLevel.getState().initializePlanets()` call
  - [x] 4.2: This ensures planets are generated fresh each run, consistent with how other systems reset

- [x] Task 5: Create PlanetRenderer component (AC: #1, #2)
  - [x] 5.1: Create `src/renderers/PlanetRenderer.jsx` — renders all planets in the scene
  - [x] 5.2: Read planet array from `useLevel` store
  - [x] 5.3: For each planet, render the corresponding GLB model (PlanetA.glb for silver, PlanetB.glb for gold, PlanetC.glb for platinum) using `useGLTF`
  - [x] 5.4: Position each planet at `(planet.x, PLANET_MODEL_Y_OFFSET, planet.z)` with scale from planetDefs
  - [x] 5.5: Add slow idle rotation animation via useFrame (PLANET_ORBIT_SPEED per second, Y-axis)
  - [x] 5.6: Add tier-specific emissive glow (subtle for silver, brighter for gold, brightest for platinum) using emissive color from planetDefs
  - [x] 5.7: Preload all 3 planet GLB models: `useGLTF.preload()` for each
  - [x] 5.8: Each planet renders its own `<primitive>` with cloned scene (avoid shared scene mutation between instances)

- [x] Task 6: Mount PlanetRenderer in GameplayScene (AC: #1)
  - [x] 6.1: Import and add `<PlanetRenderer />` to GameplayScene.jsx, after EnvironmentRenderer

- [x] Task 7: Add planets to minimap in HUD (AC: #2)
  - [x] 7.1: Add a minimap component in HUD top-right corner — simple 2D canvas or div representation
  - [x] 7.2: Show play area boundaries as a square/rectangle outline
  - [x] 7.3: Show player position as a small white dot
  - [x] 7.4: Show each planet as a colored dot matching its tier color (silver/gold/platinum)
  - [x] 7.5: Scale world coordinates to minimap coordinates: `minimapX = (worldX / PLAY_AREA_SIZE) * minimapHalfSize`
  - [x] 7.6: Minimap size: `clamp(80px, 8vw, 120px)` square, semi-transparent dark background
  - [x] 7.7: Subscribe to usePlayer (position) and useLevel (planets) for data

- [x] Task 8: Verification (AC: #1, #2, #3)
  - [x] 8.1: Planets visible in gameplay scene at random positions
  - [x] 8.2: Each tier visually distinct (different model, scale, glow)
  - [x] 8.3: Planets appear on minimap with correct colors and relative positions
  - [x] 8.4: Player dot moves correctly on minimap as ship navigates
  - [x] 8.5: Planets regenerate on new game (reset + re-initialize)
  - [x] 8.6: No performance regression (60 FPS maintained with 7 planets + existing scene)
  - [x] 8.7: Planets don't spawn on top of each other or at world center

## Dev Notes

### Architecture Decisions

- **Planet state in useLevel store, NOT a new store** — Architecture anti-pattern says "do not create a new Zustand store for a one-off feature." useLevel already has `planets: []` in its state and is the correct domain owner for system-level features (timer, difficulty, planets, wormhole).

- **PlanetRenderer as a new component in renderers/** — Consistent with existing pattern: `EnemyRenderer.jsx`, `ProjectileRenderer.jsx`, `XPOrbRenderer.jsx`. Each entity type gets its own renderer component. Planets are a distinct entity type.

- **Individual meshes, NOT InstancedMesh** — With only 7 planets total (4+2+1), there's no need for InstancedMesh instancing. Individual `<primitive>` components with cloned scenes are simpler and allow per-planet emissive/color customization. InstancedMesh is for 50+ identical entities (enemies, projectiles, orbs).

- **Planet placement at game start, NOT on the fly** — Planets are fixed environment features, not dynamic spawns. Generate all positions once in `initializePlanets()`, called during the reset block when gameplay starts.

- **Minimap as HTML overlay in HUD** — Consistent with all other HUD elements (HP bar, timer, dash cooldown). A simple div with absolute-positioned dots is the minimal approach. No 3D minimap or canvas needed for 7 planets + 1 player dot.

- **Planet models preloaded at component level** — Using `useGLTF.preload()` calls at module level in PlanetRenderer.jsx. These models are listed in `tier2` of assetManifest.js and already have paths defined.

- **No scanning logic in this story** — Story 5.2 is purely placement + rendering + minimap visibility. Scanning (progress, rewards, zone detection) is Story 5.3.

### Existing Infrastructure Status

| Component | Status | Relevance |
|-----------|--------|-----------|
| `entities/planetDefs.js` | **Empty** (`PLANETS = {}`) | Need to populate with 3 tier definitions |
| `stores/useLevel.jsx` | **Has `planets: []`** | Need to add `initializePlanets()` action, planets already in initial state |
| `config/gameConfig.js` | **No planet constants** | Need to add counts, radii, distances, model offset, orbit speed |
| `config/assetManifest.js` | **Has tier2 planet models** | PlanetA, PlanetB, PlanetC GLB paths already defined |
| `public/models/environment/` | **Has PlanetA.glb, PlanetB.glb, PlanetC.glb** | 3D models already available |
| `renderers/` | **No PlanetRenderer** | Need to create new renderer component |
| `scenes/GameplayScene.jsx` | **No planet rendering** | Need to mount PlanetRenderer |
| `ui/HUD.jsx` | **No minimap** | Need to add minimap component (top-right corner per UX spec) |
| `GameLoop.jsx` | **No planet initialization** | Need to call `initializePlanets()` in reset block |

### Key Implementation Details

**planetDefs.js:**
```javascript
export const PLANETS = {
  PLANET_SILVER: {
    id: 'PLANET_SILVER',
    name: 'Silver Planet',
    tier: 'silver',
    scanTime: 5,        // seconds to scan (fast — Story 5.3)
    color: '#c0c0c0',   // silver
    emissiveColor: '#808080',
    emissiveIntensity: 0.3,
    scale: [8, 8, 8],   // model scale
    modelKey: 'planetA', // maps to assetManifest.tier2.models.planetA
  },
  PLANET_GOLD: {
    id: 'PLANET_GOLD',
    name: 'Gold Planet',
    tier: 'gold',
    scanTime: 10,
    color: '#ffd700',
    emissiveColor: '#ffaa00',
    emissiveIntensity: 0.5,
    scale: [12, 12, 12],
    modelKey: 'planetB',
  },
  PLANET_PLATINUM: {
    id: 'PLANET_PLATINUM',
    name: 'Platinum Planet',
    tier: 'platinum',
    scanTime: 18,
    color: '#e5e4e2',
    emissiveColor: '#b0e0e6',
    emissiveIntensity: 0.7,
    scale: [16, 16, 16],
    modelKey: 'planetC',
  },
}
```

**useLevel.initializePlanets():**
```javascript
initializePlanets: () => {
  const planets = []
  const margin = GAME_CONFIG.PLANET_PLACEMENT_MARGIN
  const minCenter = GAME_CONFIG.PLANET_MIN_DISTANCE_FROM_CENTER
  const minBetween = GAME_CONFIG.PLANET_MIN_DISTANCE_BETWEEN
  const range = GAME_CONFIG.PLAY_AREA_SIZE - margin

  const tiers = [
    { typeId: 'PLANET_SILVER', count: GAME_CONFIG.PLANET_COUNT_SILVER },
    { typeId: 'PLANET_GOLD', count: GAME_CONFIG.PLANET_COUNT_GOLD },
    { typeId: 'PLANET_PLATINUM', count: GAME_CONFIG.PLANET_COUNT_PLATINUM },
  ]

  for (const { typeId, count } of tiers) {
    const def = PLANETS[typeId]
    for (let i = 0; i < count; i++) {
      let x, z, valid
      let attempts = 0
      do {
        x = (Math.random() * 2 - 1) * range
        z = (Math.random() * 2 - 1) * range
        const distFromCenter = Math.sqrt(x * x + z * z)
        valid = distFromCenter >= minCenter
        if (valid) {
          for (const p of planets) {
            const dx = p.x - x, dz = p.z - z
            if (Math.sqrt(dx * dx + dz * dz) < minBetween) {
              valid = false
              break
            }
          }
        }
        attempts++
      } while (!valid && attempts < 50)

      planets.push({
        id: `${typeId}_${i}`,
        typeId,
        tier: def.tier,
        x, z,
        scanned: false,
        scanProgress: 0,
      })
    }
  }
  set({ planets })
},
```

**PlanetRenderer.jsx (high-level structure):**
```jsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import useLevel from '../stores/useLevel.jsx'
import { PLANETS } from '../entities/planetDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { ASSET_MANIFEST } from '../config/assetManifest.js'

function Planet({ planet }) {
  const def = PLANETS[planet.typeId]
  const modelPath = ASSET_MANIFEST.tier2.models[def.modelKey]
  const { scene } = useGLTF(`/${modelPath}`)
  const clonedScene = useMemo(() => scene.clone(), [scene])
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += GAME_CONFIG.PLANET_ORBIT_SPEED * delta
    }
  })

  return (
    <group ref={groupRef} position={[planet.x, GAME_CONFIG.PLANET_MODEL_Y_OFFSET, planet.z]}>
      <primitive object={clonedScene} scale={def.scale} />
    </group>
  )
}

export default function PlanetRenderer() {
  const planets = useLevel((s) => s.planets)
  return (
    <group>
      {planets.map((planet) => (
        <Planet key={planet.id} planet={planet} />
      ))}
    </group>
  )
}

// Preload planet models
useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetA}`)
useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetB}`)
useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetC}`)
```

**Minimap in HUD (high-level structure):**
```jsx
{/* Minimap — top-right corner */}
<div style={{
  position: 'absolute',
  top: '1rem',
  right: '1.5rem',
  width: 'clamp(80px, 8vw, 120px)',
  height: 'clamp(80px, 8vw, 120px)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '4px',
  backgroundColor: 'rgba(0,0,0,0.5)',
  overflow: 'hidden',
}}>
  {/* Player dot */}
  <div style={{
    position: 'absolute',
    width: '4px', height: '4px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    left: `${50 + (playerPos[0] / GAME_CONFIG.PLAY_AREA_SIZE) * 50}%`,
    top: `${50 + (playerPos[2] / GAME_CONFIG.PLAY_AREA_SIZE) * 50}%`,
    transform: 'translate(-50%, -50%)',
  }} />
  {/* Planet dots */}
  {planets.map((p) => (
    <div key={p.id} style={{
      position: 'absolute',
      width: '5px', height: '5px',
      borderRadius: '50%',
      backgroundColor: PLANETS[p.typeId]?.color,
      left: `${50 + (p.x / GAME_CONFIG.PLAY_AREA_SIZE) * 50}%`,
      top: `${50 + (p.z / GAME_CONFIG.PLAY_AREA_SIZE) * 50}%`,
      transform: 'translate(-50%, -50%)',
      opacity: p.scanned ? 0.3 : 1,
    }} />
  ))}
</div>
```

### Previous Story Intelligence (5.1)

**Learnings from Story 5.1 to apply:**
- **Timer decay pattern** — Not directly relevant here (no timers in this story), but scan timers in Story 5.3 will follow this pattern.
- **Reset() must include ALL state fields** — Critical lesson: when adding `initializePlanets()`, the `reset()` must clear `planets: []`. Already in existing reset().
- **SFX played from GameLoop** — No SFX in this story (planet ambience could be future).
- **Audio files all missing** — Not relevant (no audio in this story).
- **useAudio.jsx SFX_MAP** — Not relevant (no new SFX).
- **Code review: trail moved from bankRef to groupRef** — Reminder that parent group choice matters for rotation behavior. Planet idle rotation should be on the planet's own group, not a shared parent.

### Git Intelligence

Recent commits show established patterns:
- `eb45e9a` — Story 4.1: Main menu, timer, kill counter, phase management
- Epic 5 started with Story 5.1 (dash/barrel roll) — done
- All previous renderers follow the pattern: read from store → render meshes → useFrame for visual updates only
- GameLoop reset block initializes all systems on new game start
- GameplayScene composes all renderers in a flat list

**Relevant code patterns from recent work:**
- `EnemyRenderer.jsx` and `XPOrbRenderer.jsx` use InstancedMesh — but planets don't need this (only 7 planets)
- `EnvironmentRenderer.jsx` uses static geometry — planets are semi-static (fixed position, slow rotation)
- `PlayerShip.jsx` shows how to clone a GLB scene and apply per-frame updates
- HUD uses Zustand selectors for individual fields to minimize re-renders

### Project Structure Notes

**Files to CREATE:**
- `src/renderers/PlanetRenderer.jsx` — New renderer for planet GLB models with idle rotation and tier-specific emissive glow

**Files to MODIFY:**
- `src/entities/planetDefs.js` — Populate with PLANET_SILVER, PLANET_GOLD, PLANET_PLATINUM definitions
- `src/config/gameConfig.js` — Add planet counts, scan radii, distances, model offset, orbit speed
- `src/stores/useLevel.jsx` — Add `initializePlanets()` action, import PLANETS from planetDefs
- `src/GameLoop.jsx` — Call `useLevel.getState().initializePlanets()` in game start reset block
- `src/scenes/GameplayScene.jsx` — Mount `<PlanetRenderer />`
- `src/ui/HUD.jsx` — Add minimap in top-right corner (player dot + planet dots)

**Files NOT to modify:**
- `src/config/assetManifest.js` — Planet model paths already defined in tier2 section
- `src/stores/usePlayer.jsx` — No planet-related state
- `src/stores/useGame.jsx` — No planet-related state
- `src/renderers/EnvironmentRenderer.jsx` — Planets are separate from static environment
- `src/Experience.jsx` — Scene routing unchanged
- `src/audio/audioManager.js` — No new audio for this story
- `public/models/environment/` — GLB models already present (PlanetA.glb, PlanetB.glb, PlanetC.glb)

### Anti-Patterns to Avoid

- Do NOT create a new Zustand store (e.g., "usePlanets") — extend useLevel, which already owns planet state
- Do NOT use InstancedMesh for 7 planets — overkill, use individual `<primitive>` components with cloned scenes
- Do NOT put game logic in PlanetRenderer — it should only read from store and render. Scanning logic (Story 5.3) will be in useLevel.tick() called by GameLoop
- Do NOT hardcode planet positions — use random placement with distance constraints, stored in useLevel
- Do NOT import usePlayer inside PlanetRenderer for game logic — the renderer is read-only
- Do NOT use `useEffect` for planet rotation — use `useFrame` (existing pattern for all visual animations)
- Do NOT create a Canvas-based minimap — use simple HTML divs with absolute positioning (consistent with HUD approach)
- Do NOT add scanning UI in this story — that is Story 5.3 scope
- Do NOT create separate scene for each planet — render all planets inside GameplayScene via PlanetRenderer
- Do NOT forget to clone the GLB scene — multiple planets of the same tier must not share scene objects (mutation would affect all instances)

### Testing Approach

- **Unit tests (useLevel store):**
  - `initializePlanets()` generates correct number of planets per tier (4 silver + 2 gold + 1 platinum = 7)
  - All planets have valid positions within play area bounds minus margin
  - No planet is closer than MIN_DISTANCE_FROM_CENTER to world center
  - No two planets are closer than MIN_DISTANCE_BETWEEN to each other
  - Each planet has correct initial state: `scanned: false`, `scanProgress: 0`
  - `reset()` clears planets array

- **Visual tests (browser verification):**
  - 7 planets visible in gameplay scene at various positions
  - Each tier has distinct appearance (different GLB model, scale, glow)
  - Planets slowly rotate (idle animation)
  - Minimap shows player dot and planet dots
  - Planet dots on minimap match tier colors
  - Player dot moves correctly on minimap
  - New game regenerates planet positions
  - 60 FPS maintained with planets rendered

### Scope Summary

This story adds planet placement and rendering to the gameplay scene. It populates `planetDefs.js` with 3 tier definitions (silver, gold, platinum), extends `useLevel` with an `initializePlanets()` action that randomly places 7 planets (4 silver, 2 gold, 1 platinum) with distance constraints, creates a `PlanetRenderer` component that loads and renders GLB models with tier-specific scale and emissive glow plus idle rotation, and adds a minimap to the HUD showing player position and planet locations. No scanning or rewards logic — that is Story 5.3.

**Key deliverables:**
1. `planetDefs.js` — 3 tier definitions with visual and gameplay properties
2. `gameConfig.js` — Planet count, distance, and rendering constants
3. `useLevel.jsx` — `initializePlanets()` action with placement algorithm
4. `GameLoop.jsx` — Call `initializePlanets()` on game start
5. `PlanetRenderer.jsx` — New renderer with GLB loading, tier glow, idle rotation
6. `GameplayScene.jsx` — Mount PlanetRenderer
7. `HUD.jsx` — Minimap with player dot and planet dots

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2] — Acceptance criteria: planet tiers, placement per planetDefs, visually distinct, minimap visibility, useLevel tracking
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — renderers/ for InstancedMesh components (though planets use individual meshes due to low count)
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — Stores never import other stores; GameLoop is sole bridge
- [Source: _bmad-output/planning-artifacts/architecture.md#Entity Definition Patterns] — Plain object definitions in entities/
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules] — Renderer useFrames for visual sync only, no game logic
- [Source: _bmad-output/planning-artifacts/architecture.md#Anti-Patterns] — No new stores for one-off features; no game logic in renderers
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#HUD Composition] — "minimap + dash CD + weapon slots" — minimap in top-right corner
- [Source: src/entities/planetDefs.js] — Empty PLANETS object, ready to populate
- [Source: src/stores/useLevel.jsx] — Already has `planets: []` in initial state
- [Source: src/config/assetManifest.js] — tier2.models: planetA, planetB, planetC paths defined
- [Source: public/models/environment/] — PlanetA.glb, PlanetB.glb, PlanetC.glb exist
- [Source: src/config/gameConfig.js] — PLAY_AREA_SIZE: 2000, no planet constants yet
- [Source: src/GameLoop.jsx:59-67] — Game start reset block where initializePlanets should be called
- [Source: src/scenes/GameplayScene.jsx] — Renderer composition pattern
- [Source: src/renderers/EnvironmentRenderer.jsx] — Environment rendering pattern (Starfield, BoundaryRenderer, GroundPlane)
- [Source: src/renderers/PlayerShip.jsx] — GLB clone + useFrame visual update pattern
- [Source: src/ui/HUD.jsx] — Layout pattern, Zustand selectors, clamp() responsive sizing
- [Source: _bmad-output/implementation-artifacts/5-1-dash-barrel-roll.md] — Previous story learnings: reset() must include all fields, SFX from GameLoop

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation, no debugging required.

### Completion Notes List

- Task 1: Populated planetDefs.js with 3 tier definitions (silver/gold/platinum) including all visual and gameplay properties. Unit tests verify structure, fields, tier hierarchy, and model key uniqueness (9 tests).
- Task 2: Added 11 planet-related constants to gameConfig.js — counts per tier, scan radii, distance constraints, model Y offset, orbit speed.
- Task 3: Extended useLevel store with `initializePlanets()` action implementing random placement with distance constraints (min from center, min between planets, boundary margin). Unit tests verify counts, field structure, bounds, distances, reset, and uniqueness (8 tests).
- Task 3.4: Renderer accesses planets via Zustand selector `useLevel((s) => s.planets)` — standard pattern, no explicit getter needed.
- Task 4: Added `useLevel.getState().initializePlanets()` call in GameLoop's reset block to generate planets on each new game start.
- Task 5: Created PlanetRenderer.jsx — reads from useLevel store, renders each planet with cloned GLB scene, tier-specific emissive glow, and Y-axis idle rotation via useFrame. Preloads all 3 planet models.
- Task 6: Mounted PlanetRenderer in GameplayScene after EnvironmentRenderer.
- Task 7: Added minimap to HUD top-right corner — div-based with player dot (white) and planet dots (tier-colored), coordinates scaled from world space to minimap percentages.
- Task 8: Visual verification items — require browser testing. Unit tests confirm placement constraints (no overlap, no center spawn). 383/383 tests pass with 0 regressions.

### Change Log

- 2026-02-11: Story 5.2 implementation — Planet placement, rendering, and minimap. 7 files modified, 3 files created.
- 2026-02-11: Code review fixes — (1) PlanetRenderer material clone to prevent shared mutation, (2) Added scanRadius field to planetDefs, (3) Placement algorithm console.warn on constraint failure, (4) Story Y offset corrected to -35.

### File List

**Created:**
- src/renderers/PlanetRenderer.jsx
- src/entities/__tests__/planetDefs.test.js
- src/stores/__tests__/useLevel.planets.test.js

**Modified:**
- src/entities/planetDefs.js — Populated with 3 tier definitions
- src/config/gameConfig.js — Added 11 planet constants
- src/stores/useLevel.jsx — Added initializePlanets() action, imported PLANETS and GAME_CONFIG
- src/GameLoop.jsx — Added useLevel import, initializePlanets() call in reset block
- src/scenes/GameplayScene.jsx — Mounted PlanetRenderer
- src/ui/HUD.jsx — Added minimap with player/planet dots, imported useLevel and PLANETS
