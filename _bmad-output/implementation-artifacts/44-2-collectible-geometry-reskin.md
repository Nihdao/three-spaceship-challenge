# Story 44.2: Collectible Geometry Reskin

Status: done

## Story

As a player,
I want each collectible type to have a distinct 3D shape,
So that I can identify XP orbs, heal gems, and fragment gems at a glance from across the map.

## Acceptance Criteria

1. **Given** `XPOrbRenderer.jsx` -- standard orbs
   **When** they are rendered
   **Then** the geometry is `OctahedronGeometry(0.3, 0)` (diamond/octahedron with sharp facets)
   **And** `GAME_CONFIG.XP_ORB_MESH_SCALE` is `[2.0, 2.0, 2.0]` → rayon effectif **0.6 units**
   **And** each instance is tilted at `rotation.x = Math.PI * 0.25` (45 deg on X) before `dummy.updateMatrix()` -- this makes the diamond shape readable from the top-down camera
   **And** standard orbs spin slowly on Y: `dummy.rotation.y = elapsed * 1.5` (radians/sec)

2. **Given** `XPOrbRenderer.jsx` -- rare orbs
   **When** they are rendered
   **Then** the geometry is `OctahedronGeometry(0.42, 0)` (slightly larger than standard)
   **And** scale effective `0.42 * 2.0 * RARE_XP_GEM_SCALE_MULTIPLIER(1.3)` → rayon effectif **~1.09 units**
   **And** same X tilt (`Math.PI * 0.25`) + faster Y rotation (`elapsed * 2.5`)
   **And** the golden color `GAME_CONFIG.RARE_XP_GEM_COLOR` is preserved

3. **Given** `FragmentGemRenderer.jsx`
   **When** fragment gems are rendered
   **Then** the geometry is `CylinderGeometry(0.28, 0.28, 0.14, 6)` -- a flat hexagonal disk
   **And** no rotation is applied (the hex disk is naturally readable from the top-down camera)
   **And** the existing pulse animation (scale) is preserved
   **And** the purple color `GAME_CONFIG.FRAGMENT_GEM_COLOR` is preserved
   **And** the material switches from `MeshStandardMaterial` to `MeshBasicMaterial` (unlit, consistent with XP orbs and heal gems, bright without depending on scene lights)

4. **Given** `HealGemRenderer.jsx`
   **When** heal gems are rendered
   **Then** the geometry is a cross "+" shape built by merging two BoxGeometries:
     - horizontal bar: `new THREE.BoxGeometry(0.65, 0.14, 0.22)`
     - vertical bar: `new THREE.BoxGeometry(0.22, 0.14, 0.65)`
     - result: `mergeGeometries([hBar, vBar])`
   **And** the merged geometry is passed to the InstancedMesh
   **And** instances do not rotate (the cross is immediately readable from top-down)
   **And** the current green color is preserved

5. **Given** the three renderers
   **When** the new geometries are used
   **Then** each `useMemo` geometry disposes old geometries in its cleanup (`return () => geometry.dispose()`)
   **And** `vitest run` passes -- renderer tests check counts/positions, not geometries (no test modifications expected)

6. **Given** `vitest run`
   **When** the story is implemented
   **Then** all tests pass

## Tasks / Subtasks

- [x] Replace XPOrbRenderer standard geometry: `IcosahedronGeometry(0.3, 1)` -> `OctahedronGeometry(0.3, 0)` (AC: #1)
  - [x] Add X-axis tilt + Y-axis spin in useFrame for standard orbs
- [x] Replace XPOrbRenderer rare geometry: `OctahedronGeometry(0.4, 0)` -> `OctahedronGeometry(0.42, 0)` (AC: #2)
  - [x] Add X-axis tilt + faster Y-axis spin in useFrame for rare orbs
- [x] Replace FragmentGemRenderer geometry: `SphereGeometry(1, 8, 8)` -> `CylinderGeometry(0.28, 0.28, 0.14, 6)` (AC: #3)
  - [x] Switch material from MeshStandardMaterial to MeshBasicMaterial
- [x] Replace HealGemRenderer geometry: `SphereGeometry(1, 8, 8)` -> merged cross BoxGeometry (AC: #4)
  - [x] Import `mergeGeometries` from Three.js addons
- [x] Verify all geometry dispose() calls in useEffect cleanup (AC: #5)
- [x] Run `vitest run` and confirm all tests pass (AC: #6)

## Dev Notes

This story is a **visual-only change** across 3 renderer files. No systems, stores, or GameLoop modifications. No new files.

### XPOrbRenderer.jsx — Diamond Shape + Rotation

**Current state** (lines 21-23):
- Standard: `IcosahedronGeometry(0.3, 1)` -- rounded, near-spherical (detail=1 subdivides facets)
- Rare: `OctahedronGeometry(0.4, 0)` -- already a diamond, but too small per new spec

**Target state**:
- Standard: `OctahedronGeometry(0.3, 0)` -- sharp diamond, no subdivision (detail=0 = 8 triangular faces)
- Rare: `OctahedronGeometry(0.42, 0)` -- slightly larger diamond, same sharp shape

**Rotation in useFrame** (lines 57-82):
Currently, `dummy.position.set()` and `dummy.scale.set()` are called before `dummy.updateMatrix()`, but **no rotation is set**. The dummy Object3D rotation persists between iterations since it's a shared ref (`dummyRef`). You MUST explicitly set rotation for every instance.

For standard orbs (inside the `else` block, line 74-81):
```js
dummy.rotation.set(Math.PI * 0.25, elapsed * 1.5, 0)
```

For rare orbs (inside the `if (orb.isRare)` block, line 62-73):
```js
dummy.rotation.set(Math.PI * 0.25, elapsed * 2.5, 0)
```

Place `dummy.rotation.set(...)` BEFORE `dummy.updateMatrix()` in both branches.

**IMPORTANT**: Since dummy is shared between standard and rare branches, the rotation from one branch persists into the next if not explicitly set. The current code doesn't set rotation at all, so adding it to both branches is clean and correct.

### FragmentGemRenderer.jsx — Hexagonal Disk + Material Switch

**Current state** (lines 14-24):
- Geometry: `SphereGeometry(1, 8, 8)` with scale `FRAGMENT_GEM_SCALE: [1.0, 1.0, 1.0]`
- Material: `MeshStandardMaterial` with `emissive`, `emissiveIntensity: 2`

**Target state**:
- Geometry: `CylinderGeometry(0.28, 0.28, 0.14, 6)` -- 6 radial segments = hexagonal shape, flat (height 0.14)
- Material: `MeshBasicMaterial({ color: GAME_CONFIG.FRAGMENT_GEM_COLOR, toneMapped: false })`

**Material change detail**: Remove `emissive`, `emissiveIntensity`, `roughness`, `metalness`. MeshBasicMaterial with `toneMapped: false` gives a bright, glowing appearance without needing scene lights -- consistent with XPOrbRenderer and HealGemRenderer which already use MeshBasicMaterial.

**Sizing note**: With the old SphereGeometry(1) at scale [1.0, 1.0, 1.0], the sphere was 1.0 unit radius. With CylinderGeometry(0.28, 0.28, 0.14, 6) at the same scale, the hex disk has radius 0.28. This is intentional -- the XP orbs at OctahedronGeometry(0.3) with scale [0.8, 0.8, 0.8] render at ~0.24 effective radius, so the fragment hex at 0.28 is slightly larger. The pulse animation still applies correctly.

**No rotation needed**: The hexagonal disk is naturally flat and readable from the top-down camera. The existing animation loop does not set rotation, and no rotation should be added.

### HealGemRenderer.jsx — Cross Shape via mergeGeometries

**Current state** (line 17):
- Geometry: `SphereGeometry(1, 8, 8)` at scale `0.8 * pulse`

**Target state**:
- Geometry: Merged cross from two BoxGeometry bars:
  ```js
  const hBar = new THREE.BoxGeometry(0.65, 0.14, 0.22)
  const vBar = new THREE.BoxGeometry(0.22, 0.14, 0.65)
  const crossGeo = mergeGeometries([hBar, vBar])
  hBar.dispose()
  vBar.dispose()
  ```

**Import**: `import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'`

Three.js version is `^0.174.0`. The `three/examples/jsm/` path is the standard import path for this version. The project has precedent for this pattern in archived files (see `src/_archive/Lights.jsx`). Alternative path `three/addons/utils/BufferGeometryUtils.js` also works for r152+ but the `examples/jsm` pattern is the established convention.

**Cross construction**: Both BoxGeometry bars share center (0,0,0) and have the same Y height (0.14), so they are coplanar and form a clean "+" shape when merged. The horizontal bar extends along X (0.65 wide, 0.22 deep) and the vertical bar along Z (0.22 wide, 0.65 deep).

**Dispose strategy**: The two source BoxGeometries (`hBar`, `vBar`) must be disposed immediately after merging since `mergeGeometries` creates a new combined BufferGeometry. The merged geometry is then disposed in the `useEffect` cleanup as usual.

**In `useMemo`**:
```js
const geometry = useMemo(() => {
  const hBar = new THREE.BoxGeometry(0.65, 0.14, 0.22)
  const vBar = new THREE.BoxGeometry(0.22, 0.14, 0.65)
  const merged = mergeGeometries([hBar, vBar])
  hBar.dispose()
  vBar.dispose()
  return merged
}, [])
```

**No rotation needed**: The cross is already readable from top-down since it lies in the X-Z plane with Y as thickness.

### Architecture Compliance

- **Layer**: Rendering only -- no changes to Config/Data, Systems, Stores, or GameLoop
- **Pattern**: All three renderers follow the same pattern: `useMemo` for geometry, `useRef` for material, `useEffect` cleanup for dispose, `useFrame` for instance matrix updates
- **Memory**: All geometries properly disposed via `useEffect` cleanup. Source geometries for merge disposed immediately after use.
- **Performance**: No new per-frame allocations. `mergeGeometries` runs once in `useMemo`. Rotation calls (`dummy.rotation.set`) are trivial O(1) per instance.
- **No dummy.rotation.order change needed**: Default is `'XYZ'` which is correct for our rotation.set(x, y, z) calls.

### Testing Notes

Renderer tests in this project test instance counts and positions, not geometries or materials. No test modifications should be needed. Run `vitest run` to confirm.

Grep for any geometry-specific assertions: `grep -rn "IcosahedronGeometry\|SphereGeometry\|OctahedronGeometry" src/**/__tests__/` -- if any test asserts on geometry type, it needs updating.

### Project Structure Notes

- Renderer files: `src/renderers/XPOrbRenderer.jsx`, `src/renderers/FragmentGemRenderer.jsx`, `src/renderers/HealGemRenderer.jsx`
- Config (read-only): `src/config/gameConfig.js` -- `XP_ORB_MESH_SCALE`, `FRAGMENT_GEM_SCALE`, `FRAGMENT_GEM_COLOR`, `RARE_XP_GEM_COLOR`, `HEAL_GEM_COLOR`, `RARE_XP_GEM_SCALE_MULTIPLIER`, `RARE_XP_GEM_PULSE_SPEED`, `FRAGMENT_GEM_PULSE_SPEED`
- No new files created
- No config changes needed

### References

- [Source: epic-44-collectibles-overhaul.md#Story 44.2] -- Full acceptance criteria and technical notes
- [Source: src/renderers/XPOrbRenderer.jsx:21] -- Current `IcosahedronGeometry(0.3, 1)` standard geometry
- [Source: src/renderers/XPOrbRenderer.jsx:23] -- Current `OctahedronGeometry(0.4, 0)` rare geometry
- [Source: src/renderers/XPOrbRenderer.jsx:57-82] -- useFrame loop where rotation must be added
- [Source: src/renderers/FragmentGemRenderer.jsx:14] -- Current `SphereGeometry(1, 8, 8)`
- [Source: src/renderers/FragmentGemRenderer.jsx:15-24] -- Current `MeshStandardMaterial` with emissive
- [Source: src/renderers/HealGemRenderer.jsx:17] -- Current `SphereGeometry(1, 8, 8)`
- [Source: src/renderers/HealGemRenderer.jsx:20-26] -- Already `MeshBasicMaterial`
- [Source: src/config/gameConfig.js:56] -- `XP_ORB_MESH_SCALE: [0.8, 0.8, 0.8]`
- [Source: src/config/gameConfig.js:77] -- `FRAGMENT_GEM_SCALE: [1.0, 1.0, 1.0]`
- [Source: package.json:30] -- `"three": "^0.174.0"`
- [Source: project-context.md] -- Architecture 6 layers, test conventions

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No blockers encountered. Pure visual-only change across 3 renderer files.

### Completion Notes List

- XPOrbRenderer: standard geo IcosahedronGeometry(0.3,1) → OctahedronGeometry(0.3,0); rare geo OctahedronGeometry(0.4,0) → OctahedronGeometry(0.42,0). Added dummy.rotation.set(Math.PI*0.25, elapsed*1.5, 0) for standard and dummy.rotation.set(Math.PI*0.25, elapsed*2.5, 0) for rare, placed before dummy.updateMatrix() in both branches. XP_ORB_MESH_SCALE ajusté [0.8,0.8,0.8] → [2.0,2.0,2.0] pour lisibilité (rayon effectif standard 0.6 units).
- FragmentGemRenderer: SphereGeometry(1,8,8) → CylinderGeometry(0.28,0.28,0.14,6). MeshStandardMaterial (emissive) → MeshBasicMaterial({ color, toneMapped: false }). No rotation added.
- HealGemRenderer: imported mergeGeometries from three/examples/jsm/utils/BufferGeometryUtils.js. SphereGeometry(1,8,8) → merged cross (hBar BoxGeometry(0.65,0.14,0.22) + vBar BoxGeometry(0.22,0.14,0.65)). Source bars disposed immediately after merge. No rotation added.
- All dispose() calls verified in useEffect cleanups. 158 test files, 2694 tests — all pass, zero regressions.

### File List

- src/renderers/XPOrbRenderer.jsx
- src/renderers/FragmentGemRenderer.jsx
- src/renderers/HealGemRenderer.jsx

### Change Log

- 2026-02-25: Collectible geometry reskin — diamond XP orbs with Y-spin, hexagonal fragment disk (unlit), cross heal gem via mergeGeometries
