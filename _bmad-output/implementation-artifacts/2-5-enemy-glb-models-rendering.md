# Story 2.5: Enemy GLB Models & Rendering

Status: ready-for-dev

## Story

As a player,
I want enemies to be rendered as 3D robot models instead of primitive shapes, always facing my ship,
So that enemies feel visually polished and combat is more readable.

## Acceptance Criteria

1. **Given** enemies are rendering in the gameplay scene **When** FODDER_BASIC (Drone) enemies spawn **Then** they display using the `Robot Enemy Flying.glb` model **And** FODDER_FAST (Scout) enemies display using the `Robot Enemy Flying Gun.glb` model

2. **Given** enemies are rendered with GLB models **When** the EnemyRenderer renders each frame **Then** each enemy's model faces toward the player ship's position (yaw rotation on Y axis) **And** the facing direction updates every frame as the player moves

3. **Given** GLB models are used for rendering **When** up to MAX_ENEMIES_ON_SCREEN (100) enemies exist **Then** rendering uses InstancedMesh (one per enemy type) by extracting geometry and materials from the loaded GLB **And** performance remains at 60 FPS with 100 enemies on screen **And** the approach does NOT use individual React components per enemy (no per-entity mount/unmount)

4. **Given** the enemyDefs.js configuration **When** a new enemy type is added later **Then** only a `modelPath` field needs to be added to the enemy definition **And** the EnemyRenderer automatically picks up the new model with no code changes

## Tasks / Subtasks

- [ ] Task 1: Add model paths to enemyDefs.js (AC: #1, #4)
  - [ ] 1.1: Add `modelPath` field to FODDER_BASIC: `'/models/enemies/Robot%20Enemy%20Flying.glb'`
  - [ ] 1.2: Add `modelPath` field to FODDER_FAST: `'/models/enemies/Robot%20Enemy%20Flying%20Gun.glb'`
  - [ ] 1.3: Update assetManifest.js gameplay.models to reference actual enemy model paths

- [ ] Task 2: Update EnemyRenderer to use GLB geometry with InstancedMesh (AC: #1, #2, #3)
  - [ ] 2.1: Load each enemy type's GLB using `useGLTF` from Drei (preloaded at module level with `useGLTF.preload()`)
  - [ ] 2.2: Extract the first `BufferGeometry` and `Material` from the loaded GLB scene by traversing children to find the first Mesh node. Use `useMemo` to cache the extraction
  - [ ] 2.3: Replace the `TYPE_GEOMETRY` factory map and `MeshStandardMaterial` creation with GLB-extracted geometry+material per type
  - [ ] 2.4: Keep the existing InstancedMesh per-type pattern (`EnemyTypeMesh` component) — one InstancedMesh per enemy type using GLB geometry instead of primitive geometry
  - [ ] 2.5: Keep the existing `useFrame` loop that syncs instance matrices from store data (position, rotation, scale). The facing-player rotation (`Math.atan2(dx, -dz)`) is already implemented — verify it works correctly with GLB model orientation and adjust if the model's default forward direction differs from -Z
  - [ ] 2.6: Keep the existing `useEffect` cleanup for geometry/material disposal. Note: GLB geometry loaded via useGLTF is cached by Drei — call `geometry.dispose()` only for cloned geometries, not the cached originals. If the GLB geometry is used directly (not cloned), skip disposal for it and only dispose materials created locally
  - [ ] 2.7: Set `frustumCulled = false` on InstancedMesh (already present)

- [ ] Task 3: Adjust meshScale values in enemyDefs.js (AC: #1)
  - [ ] 3.1: Test GLB models at current meshScale and adjust to look proportionally correct relative to the player ship and play area. GLB models may need different scales than primitive geometries
  - [ ] 3.2: Document chosen scale values with brief rationale

- [ ] Task 4: Visual verification (AC: #1, #2, #3)
  - [ ] 4.1: Verify both enemy types display correct GLB models in-game
  - [ ] 4.2: Verify enemies rotate to face the player as the player moves around
  - [ ] 4.3: Verify performance stays at 60 FPS with 50+ enemies (check with r3f-perf)
  - [ ] 4.4: Verify no console errors or WebGL warnings
  - [ ] 4.5: Verify existing tests (89) still pass — no regressions

## Dev Notes

### Critical Architecture Context

**This story ONLY modifies Layer 5 (Rendering) and Layer 1 (Config/Data).** No game logic, stores, or systems change.

**Files to modify:**
- `src/renderers/EnemyRenderer.jsx` — Replace primitive geometries with GLB-extracted geometry+material
- `src/entities/enemyDefs.js` — Add `modelPath` field, adjust `meshScale`
- `src/config/assetManifest.js` — Update enemy model paths

**Files NOT to modify:**
- `src/stores/useEnemies.jsx` — Enemy state management unchanged
- `src/systems/spawnSystem.js` — Spawning logic unchanged
- `src/GameLoop.jsx` — Tick order unchanged
- `src/systems/collisionSystem.js` — Collision unchanged
- All existing test files — DO NOT modify

### GLB Extraction Pattern

The key technique is extracting geometry+material from a loaded GLB for use with InstancedMesh:

```javascript
import { useGLTF } from '@react-three/drei'

// Inside EnemyTypeMesh, per enemy type:
const { scene } = useGLTF(def.modelPath)

// Extract first mesh's geometry and material
const { geometry, material } = useMemo(() => {
  let geo = null, mat = null
  scene.traverse((child) => {
    if (!geo && child.isMesh) {
      geo = child.geometry
      mat = child.material
    }
  })
  return { geometry: geo, material: mat }
}, [scene])
```

This preserves the InstancedMesh pattern (1 draw call per type) while using the GLB's actual geometry and materials.

### GLB Model Orientation

GLB models may have their forward direction pointing in a different axis than Three.js default (-Z). After loading, test the facing-player rotation and adjust if needed:
- If model faces +Z by default: add `Math.PI` to the rotation
- If model faces +X or -X: rotate offset accordingly
- The dummy rotation in useFrame may need: `dummy.rotation.set(0, Math.atan2(dx, -dz) + ROTATION_OFFSET, 0)`

### Performance Constraint

**MUST use InstancedMesh** — one per enemy type. DO NOT create individual React components per enemy. The previous attempt (reverting in Story 2.3 code review) used individual `<primitive>` per enemy with `useEnemies((s) => s.enemies)` as a selector, causing:
- N draw calls instead of 2
- O(n²) per-frame updates
- React re-renders on every state change
- Memory leaks from undisposed clones

This story must avoid ALL of those issues.

### Animations

GLB models may contain skeletal animations. This story uses **static InstancedMesh** (no animation). InstancedMesh does not support per-instance skeletal animation natively. If animated enemies are desired in the future, that would require a separate story using GPU-based instanced animation (vertex shader approach) or THREE.BatchedMesh.

### Available GLB Assets

- `/models/enemies/Robot Enemy Flying.glb` — Robot without gun (Drone / FODDER_BASIC)
- `/models/enemies/Robot Enemy Flying Gun.glb` — Robot with gun (Scout / FODDER_FAST)

Note: paths with spaces need URL encoding: `Robot%20Enemy%20Flying.glb`

### Technical Stack Reference

- **Drei v10.0.4** — `useGLTF` for GLB loading + caching, `useGLTF.preload()` for eager loading
- **Three.js v0.174.0** — InstancedMesh, scene.traverse() for geometry extraction
- **React Three Fiber v9.1.0** — useFrame for instance matrix sync

### References

- [Source: src/renderers/EnemyRenderer.jsx] — Current InstancedMesh per-type pattern (to keep, swap geometry source)
- [Source: src/entities/enemyDefs.js] — Enemy definitions with modelKey field (to add modelPath)
- [Source: src/renderers/PlayerShip.jsx] — Example of useGLTF usage in this project
- [Source: _bmad-output/planning-artifacts/architecture.md] — InstancedMesh requirement for enemies
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — "enemies render via InstancedMesh with one draw call per type"
- [Source: _bmad-output/implementation-artifacts/2-3-auto-fire-projectile-system.md#Code Review] — Reverted GLB rewrite due to performance issues

## Change Log

- 2026-02-07: Story created from code review findings — Story 2.3 attempted GLB enemy rendering but was reverted due to critical performance issues (per-enemy React components, O(n²) updates, memory leaks). This story implements it properly with InstancedMesh.

## Dev Agent Record

### File List

**Modified files:**
- src/renderers/EnemyRenderer.jsx
- src/entities/enemyDefs.js
- src/config/assetManifest.js
