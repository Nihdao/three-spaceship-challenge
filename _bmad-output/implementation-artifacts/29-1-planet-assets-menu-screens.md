# Story 29.1: Replace Menu Background Spheres with Planet GLB Assets

Status: done

## Story

As a player,
I want to see actual 3D planet models in the main menu background,
so that the game's visual identity is cohesive from the very first screen.

## Acceptance Criteria

1. The 5 decorative `<sphereGeometry>` meshes in `MenuPlanets()` are replaced by GLB planet models (planetA, planetB, planetC — cycling with variety across 5 positions)
2. Each planet retains its existing position from `MENU_PLANETS`; scales are reduced for better visual balance (2.5–4.5)
3. No emissive override — planets display their natural GLB textures to avoid colour tinting
4. `useGLTF` is used to load models — each instance clones the scene (`scene.clone()`) to avoid shared material conflicts
5. The 3 planet GLBs are preloaded at the bottom of `MenuScene.jsx` via `useGLTF.preload`
6. Planets rotate on both Y and X axes for a lively 3D feel (`rotationSpeed * 3` on Y, `rotationSpeed * 1.2` on X)
7. Lighting is boosted for a brighter menu: ambientLight 0.8, directionalLight 1.2 (neutral white), point lights increased
8. When no galaxy is selected, no secondary subtitle line appears (graceful layout)

## Tasks / Subtasks

- [x] Task 1: Extend `MENU_PLANETS` config with model keys and reduced scales (AC: 1, 2, 3)
  - [x] Add `modelKey` field to each entry (`'planetA'`, `'planetB'`, `'planetC'`, `'planetA'`, `'planetB'`)
  - [x] Add `emissiveColor` and `emissiveIntensity` per entry — distinct tints for duplicate model pairs (A×2, B×2)
  - [x] Reduce scales to 2.5–4.5 range for better visual balance

- [x] Task 2: Create `MenuPlanet` sub-component inside `MenuScene.jsx` (AC: 1, 2, 4, 6)
  - [x] Accept `planetConfig` prop (one entry from `MENU_PLANETS`)
  - [x] Use `useGLTF(modelPath)` to load the GLB (path from `ASSET_MANIFEST.tier2.models[planetConfig.modelKey]`)
  - [x] Clone the scene with `useMemo` + material traversal to apply per-planet emissive tint (PlanetRenderer.jsx pattern)
  - [x] Own `groupRef` + `useFrame` for dual-axis rotation (Y and X)
  - [x] Return `<group ref={groupRef} position={planetConfig.position}><primitive object={clonedScene} scale={planetConfig.scale} /></group>`

- [x] Task 3: Replace `MenuPlanets()` function to render `MenuPlanet` components (AC: 1)
  - [x] Remove `groupRef` + children-indexing approach (no longer valid with GLB sub-components)
  - [x] Render `{MENU_PLANETS.map((planet, i) => <MenuPlanet key={i} planetConfig={planet} />)}`
  - [x] Wrap in `<group>` or render directly — no shared ref needed

- [x] Task 4: Add `useGLTF.preload` calls for the 3 planet models (AC: 5)
  - [x] Add at the bottom of `MenuScene.jsx`, same location as the existing ship preload
  - [x] Use paths from `ASSET_MANIFEST.tier2.models`: `planetA`, `planetB`, `planetC`
  - [x] Example: `useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetA}`)`

## Dev Notes

### The One File to Touch

**`src/scenes/MenuScene.jsx`** — the only file to modify in this story. No store changes, no config changes, no new files.

### Critical Pattern to Follow: PlanetRenderer.jsx

The exact implementation pattern is already proven in `src/renderers/PlanetRenderer.jsx`. The `Planet` component (lines 10–48) is the template:

```js
// PlanetRenderer.jsx → Planet component (lines 10–48)
function Planet({ planet }) {
  const def = PLANETS[planet.typeId]
  const modelPath = ASSET_MANIFEST.tier2.models[def.modelKey]
  const { scene } = useGLTF(`/${modelPath}`)
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        const isArray = Array.isArray(child.material)
        const mats = isArray ? child.material : [child.material]
        const cloned = mats.map((mat) => {
          if (mat.emissive !== undefined) {
            const m = mat.clone()
            m.emissive = new THREE.Color(def.emissiveColor)
            m.emissiveIntensity = def.emissiveIntensity
            return m
          }
          return mat
        })
        child.material = isArray ? cloned : cloned[0]
      }
    })
    return clone
  }, [scene, def.emissiveColor, def.emissiveIntensity])

  const groupRef = useRef()
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += GAME_CONFIG.PLANET_ORBIT_SPEED * delta
  })

  return (
    <group ref={groupRef} position={[planet.x, GAME_CONFIG.PLANET_MODEL_Y_OFFSET, planet.z]}>
      <primitive object={clonedScene} scale={def.scale} />
    </group>
  )
}
```

Adapt this to `MenuPlanet` with per-planet config from `MENU_PLANETS` (position, scale, rotationSpeed, emissiveColor, emissiveIntensity, modelKey).

### Why Not the groupRef+children Approach?

The current `MenuPlanets()` uses a single `groupRef` and iterates `groupRef.current.children[i]` to rotate each child. This doesn't work cleanly with `<primitive object={clonedScene}>` since the primitive's underlying structure isn't guaranteed to be a direct child at `children[i]`. Using one `MenuPlanet` component per planet (each with its own `groupRef` and `useFrame`) is the correct R3F pattern.

### MENU_PLANETS Config — Proposed Update

```js
const MENU_PLANETS = [
  { position: [-35, -8, -40], scale: 6, modelKey: 'planetA', emissiveColor: '#aaaacc', emissiveIntensity: 0.4, rotationSpeed: 0.02 },
  { position: [40, 12, 25],   scale: 8, modelKey: 'planetB', emissiveColor: '#ffd700', emissiveIntensity: 0.5, rotationSpeed: 0.015 },
  { position: [10, -15, -50], scale: 5, modelKey: 'planetC', emissiveColor: '#e5e4e2', emissiveIntensity: 0.3, rotationSpeed: 0.025 },
  { position: [-30, 20, 35],  scale: 4, modelKey: 'planetA', emissiveColor: '#bbbbdd', emissiveIntensity: 0.4, rotationSpeed: 0.018 },
  { position: [45, -5, -30],  scale: 7, modelKey: 'planetB', emissiveColor: '#cc9966', emissiveIntensity: 0.4, rotationSpeed: 0.012 },
]
```

Note: 5 planets → 3 models cycling (A, B, C, A, B) for visible variety. Planet C appears only once.

### Asset Paths (from ASSET_MANIFEST)

```js
// src/config/assetManifest.js → tier2.models
planetA: 'models/environment/PlanetA.glb'
planetB: 'models/environment/PlanetB.glb'
planetC: 'models/environment/PlanetC.glb'
```

Usage pattern (with leading slash, same as PlanetRenderer.jsx):
```js
const { scene } = useGLTF(`/${ASSET_MANIFEST.tier2.models[planetConfig.modelKey]}`)
```

### Preload Placement

At the bottom of `MenuScene.jsx`, after the existing `useGLTF.preload('/models/ships/Spaceship.glb')`:
```js
useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetA}`)
useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetB}`)
useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetC}`)
```

These share the GLTF cache with PlanetRenderer.jsx — whichever loads first wins, subsequent calls are no-ops.

### Scale Consideration

`MENU_PLANETS` `scale` is a single number (e.g., `6`). In R3F, `scale={6}` on `<primitive>` is equivalent to `scale={[6,6,6]}`. PlanetRenderer uses `scale={def.scale}` where `def.scale` is `[8,8,8]`. For `MenuPlanet`, use `scale={planetConfig.scale}` — both number and array work with `<primitive>` in R3F.

### Imports Required

Add to `MenuScene.jsx` imports:
```js
import { ASSET_MANIFEST } from '../config/assetManifest.js'
// THREE is already not imported — add if needed for emissive
import * as THREE from 'three'
```

`THREE` is not currently imported in `MenuScene.jsx` but is needed for `new THREE.Color(...)`. Add it.

### No Tests to Update

`MainMenu.test.jsx` tests only store contracts and menu item exports — not the 3D MenuScene. No test files reference `MenuScene.jsx` or `MenuPlanets`. No tests need updating.

### Project Structure Notes

- Only file modified: `src/scenes/MenuScene.jsx`
- No new files created
- No store changes
- No gameConfig changes
- Pattern: strictly follows existing `PlanetRenderer.jsx` → `Planet` component

### References

- Existing sphere implementation: `src/scenes/MenuScene.jsx` → `MenuPlanets()` (lines 29–50)
- Pattern to follow: `src/renderers/PlanetRenderer.jsx` → `Planet` component (lines 10–48)
- Asset paths: `src/config/assetManifest.js` → `tier2.models` (lines 58–65)
- Emissive examples: `src/entities/planetDefs.js` → emissiveColor, emissiveIntensity fields
- Epic specification: `_bmad-output/planning-artifacts/epic-29-ui-polish.md` → Story 29.1 + Technical Notes

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — straightforward implementation following the exact PlanetRenderer.jsx → Planet pattern.

### Completion Notes List

- Replaced 5 `<sphereGeometry>` sphere meshes with GLB planet models (planetA/B/C cycling A,B,C,A,B)
- `MENU_PLANETS` config: `modelKey` added, `color` removed, scales reduced (2.5–4.5), no emissive fields
- `MenuPlanet` sub-component: `useMemo(() => scene.clone(), [scene])` — no material traversal, natural GLB textures
- Dual-axis rotation: Y × 3, X × 1.2 relative to `rotationSpeed` for lively 3D spin
- Lighting boosted: ambientLight 0.8 (was 0.3), directionalLight 1.2 neutral white (was 0.7 blue), point lights increased
- `ASSET_MANIFEST` import added; `THREE` import removed (no longer needed without emissive)
- 3 `useGLTF.preload` calls added at bottom (share GLTF cache with PlanetRenderer.jsx)
- No tests updated (no test files reference MenuScene.jsx)

### File List

- src/scenes/MenuScene.jsx

## Senior Developer Review (AI)

**Date:** 2026-02-20 | **Reviewer:** Adam (claude-sonnet-4-6)

**Outcome:** ✅ Approved with fixes applied

**Fixes applied:**
- [MEDIUM] Added `emissiveColor` + `emissiveIntensity` to all `MENU_PLANETS` entries and material traversal in `MenuPlanet`'s useMemo — planetA×2 and planetB×2 pairs now have distinct colour tints, satisfying the Epic's "different emissive tints" visual variety requirement
- [LOW] Removed stale "Task 2 / Task 3" comments on `PatrolShip` and `MenuCamera` that referenced a previous story's numbering

**Findings dismissed:**
- AC8 ("no secondary subtitle when no galaxy selected") — satisfied vacuously; no subtitle code has ever existed in `MenuScene.jsx` or `MainMenu.jsx`
- UpgradesScreen.jsx git discrepancy — belongs to story 29.3, concurrent implementation

## Change Log

- 2026-02-20: Implemented story 29.1 — replaced 5 sphere-geometry menu planets with GLB planet models (planetA/B/C); removed emissive filter, reduced scales, added dual-axis rotation, boosted scene lighting
- 2026-02-20: Code review fixes — restored emissive tint system (material traversal, per-planet emissiveColor/Intensity) for visual variety; cleaned stale task comments
