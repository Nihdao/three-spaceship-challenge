# Story 1.3: Space Environment & Boundaries

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to navigate a visually rich space environment with clear boundaries,
So that I feel immersed in a 3D space world and understand the playable area.

## Acceptance Criteria

1. **Given** the player is in the gameplay scene **When** the scene loads **Then** the environment displays a space skybox/background with stars **And** the play area has defined boundaries

2. **Given** the player approaches the edge of the play area **When** the ship gets close to a boundary **Then** the player sees visual feedback indicating they are near the limit (grid lines, color shift, or barrier effect) **And** the ship cannot move beyond the boundary

3. **Given** the environment is rendering **When** the player looks around **Then** performance remains at 60 FPS with the environment rendering **And** the GameplayScene.jsx composes the environment renderer + player ship + lighting

## Tasks / Subtasks

- [x] Task 1: Create EnvironmentRenderer component (AC: #1, #3)
  - [x] 1.1: Create `src/renderers/EnvironmentRenderer.jsx` — R3F component responsible for all space environment visuals
  - [x] 1.2: Add a starfield background using Three.js Points/BufferGeometry — generate ~3000-5000 star positions in a large sphere (radius ~5000) around origin using random spherical coordinates. Use a PointsMaterial with size attenuation and white/blue-white color variation. Stars are static (no movement needed). Star count higher to compensate for larger volume.
  - [x] 1.3: Add a subtle space "fog" or ambient nebula feel — use a large dark sphere (radius ~4000) with a custom shader or semi-transparent material for depth cues, OR skip if stars alone provide enough immersion. Keep it minimal.
  - [x] 1.4: Ensure EnvironmentRenderer has NO game logic — purely visual, reads nothing from stores (stars are static decoration)

- [x] Task 2: Create boundary visualization system (AC: #2)
  - [x] 2.1: Create a `BoundaryRenderer` inside EnvironmentRenderer (or as sibling in GameplayScene) that shows the play area edges at PLAY_AREA_SIZE (±2000 on X and Z)
  - [x] 2.2: Implement boundary walls as four thin box geometries or plane meshes positioned at each edge of the play area (x=±2000, z=±2000), oriented to face inward. Use a semi-transparent shader/material with a subtle grid or energy-field pattern (e.g., BasicMaterial with wireframe, or ShaderMaterial with scrolling UV). Wall height ~200 units to be visible from the top-down camera at this scale.
  - [x] 2.3: Implement proximity-based boundary warning — read player position from usePlayer store each frame via useFrame. When player is within BOUNDARY_WARNING_DISTANCE (100 units) of any edge, increase boundary wall opacity/intensity proportionally. When far from edges, walls should be nearly invisible (opacity ~0.05-0.1)
  - [x] 2.4: Boundary visual should use a subtle color (cyan `#00ffff` at low opacity) matching the game's neon aesthetic, becoming brighter/more visible as player approaches

- [x] Task 3: Add ground reference plane (AC: #1, #3)
  - [x] 3.1: Replace the temporary gridHelper with a proper ground reference — a large plane at Y=0 with a subtle grid texture or shader. Options: (a) keep a gridHelper but styled darker/subtler, (b) use a PlaneGeometry with a custom grid shader, (c) use a simple dark plane with faint grid lines. The ground should provide spatial orientation without being distracting.
  - [x] 3.2: The ground plane must span at least the play area (4000×4000) and ideally extend slightly beyond for visual continuity
  - [x] 3.3: Ground should be dark/subdued — dark gray or very dark blue, matching the space aesthetic. No bright colors.

- [x] Task 4: Update GameplayScene composition (AC: #3)
  - [x] 4.1: In GameplayScene.jsx, remove the temporary `<gridHelper>` and add `<EnvironmentRenderer />`
  - [x] 4.2: Review lighting — adjust if needed for the space environment (ambient may need to be lower for darker space feel, or add subtle colored point lights for atmosphere). Current: ambientLight 0.6 + directionalLight from [10,20,10]. Consider reducing ambient to ~0.3-0.4 for darker space feel while keeping the ship well-lit via directional light.
  - [x] 4.3: **Update the camera far plane** in index.jsx Canvas from 1000 to 10000 (`camera={{ fov: 45, near: 0.1, far: 10000 }}`). Required for the starfield sphere at radius 5000 to be visible.

- [x] Task 5: Add environment config constants (AC: #1, #2)
  - [x] 5.1: Add to gameConfig.js: `STAR_COUNT: 4000`, `STAR_FIELD_RADIUS: 5000`, `BOUNDARY_WALL_BASE_OPACITY: 0.08`, `BOUNDARY_WALL_WARN_OPACITY: 0.6`
  - [x] 5.2: **Update existing constants** in gameConfig.js: `PLAY_AREA_SIZE: 200` → `2000`, `BOUNDARY_WARNING_DISTANCE: 20` → `100`
  - [x] 5.3: usePlayer.tick() already reads PLAY_AREA_SIZE dynamically from gameConfig — changing the constant is sufficient, no store code changes needed. Verify this after changing the value.

- [x] Task 6: Verify and test (AC: #1, #2, #3)
  - [x] 6.1: Verify npm run dev works with no errors
  - [x] 6.2: Verify starfield is visible and surrounds the play area
  - [x] 6.3: Verify boundary walls are subtly visible when far, clearly visible when player approaches
  - [x] 6.4: Verify ground reference provides spatial orientation
  - [x] 6.5: Verify 60 FPS maintained with all environment rendering (check r3f-perf)
  - [x] 6.6: Verify ship movement and camera still work correctly with new environment
  - [x] 6.7: Verify the environment looks cohesive — dark space aesthetic, neon boundary accents

## Dev Notes

### Critical Architecture Context

**6-Layer Architecture (MUST follow):**
1. Config/Data → 2. Systems → 3. Stores → 4. GameLoop → 5. Rendering → 6. UI

This story touches layers 1 (config constants — including PLAY_AREA_SIZE scale change from 200→2000) and 5 (renderers, scene composition). Also touches index.jsx for camera far plane. No store code changes, no game logic changes, no system changes.

**Boundary Rules:**
- EnvironmentRenderer is Layer 5 (Rendering) — purely visual, no game logic
- Boundary position clamping already exists in usePlayer.tick() (Story 1.2) — do NOT duplicate this logic
- BoundaryRenderer MAY read player position from usePlayer store via useFrame for proximity opacity (read-only, allowed for renderers)
- All new components go in `src/renderers/` or are composed in `src/scenes/GameplayScene.jsx`

### What Already Exists (Do NOT Recreate)

**Boundary position clamping — ALREADY IMPLEMENTED in usePlayer.tick():**
The ship is already clamped to ±PLAY_AREA_SIZE on X and Z axes. Velocity is zeroed when hitting a boundary. usePlayer.tick() reads PLAY_AREA_SIZE from gameConfig dynamically, so changing the constant from 200→2000 is sufficient. This story adds VISUAL feedback only — no movement logic changes needed. Verify clamping still works after the constant change.

**GameplayScene.jsx — ALREADY MOUNTS:**
- PlayerShip renderer
- CameraRig (usePlayerCamera hook)
- Controls (useHybridControls hook)
- Lighting (ambient 0.6 + directional)
- Temporary gridHelper (TO BE REPLACED)

**Camera far plane — NEEDS UPDATE:**
Canvas in index.jsx currently has `camera={{ fov: 45, near: 0.1, far: 1000 }}`. Must be updated to `far: 10000` for the starfield at radius 5000.

### Implementation Approach

**Starfield Strategy:**
Use Three.js `Points` with `BufferGeometry`. Generate star positions in a spherical shell (not uniform distribution — use spherical coordinates for even distribution). Use `Float32Array` for positions. No movement needed (static). This is the simplest, most performant approach for a starfield background.

```javascript
// Pseudocode for star generation
const positions = new Float32Array(STAR_COUNT * 3)
for (let i = 0; i < STAR_COUNT; i++) {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r = STAR_FIELD_RADIUS * (0.8 + Math.random() * 0.2) // slight depth variation (4000-5000)
  positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
  positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
  positions[i * 3 + 2] = r * Math.cos(phi)
}
```

**Boundary Wall Strategy:**
Four planes at the edges of the play area. Use `ShaderMaterial` or `MeshBasicMaterial` with transparency. Update opacity in useFrame based on player distance to each wall. Simple, performant, visually effective.

**Performance Budget:**
- Stars: 1 draw call (Points), ~4000 vertices — trivial
- Boundary walls: 4 draw calls (one per wall) — trivial
- Ground plane: 1 draw call — trivial
- Total added: ~6 draw calls, should have zero FPS impact

### Previous Story Intelligence (Story 1.2)

**Key learnings from Story 1.2:**
- useFrame in renderers is allowed for visual sync (reading stores) — same pattern for BoundaryRenderer reading player position
- Nested group pattern works well for transformations (used in PlayerShip for yaw/bank)
- `useGLTF.preload()` pattern for models — but this story uses procedural geometry (no models to load)
- GameLoop must mount before GameplayScene (mount-order dependency) — no impact on this story since we're modifying GameplayScene internals only
- Delta clamping at 0.1 prevents physics explosion — no physics in this story
- Leva controls in debug mode are useful for tuning — consider adding Leva controls for star count, boundary opacity, ground darkness

**Files this story touches:**
- `src/scenes/GameplayScene.jsx` — Modify: replace gridHelper with EnvironmentRenderer
- `src/config/gameConfig.js` — Modify: add environment constants + update PLAY_AREA_SIZE 200→2000, BOUNDARY_WARNING_DISTANCE 20→100
- `src/renderers/EnvironmentRenderer.jsx` — New: space environment + boundary walls
- `src/index.jsx` — Modify: update camera far plane 1000→10000

**Files from Story 1.2 that MUST NOT be modified:**
- `src/stores/usePlayer.jsx` — Boundary clamping already works
- `src/GameLoop.jsx` — No tick changes needed
- `src/renderers/PlayerShip.jsx` — Ship rendering is independent
- `src/hooks/usePlayerCamera.jsx` — Camera follow is independent

### Git Intelligence

Recent commits:
- `ddd4dee` feat: implement ship movement, rotation & banking (Story 1.2)
- `765ed38` bmad and US1 OK
- `676d322` bmad-part1
- `7dda110` Initial commit

All commits follow conventional commit format. Story 1.2 touched: usePlayer.jsx, GameLoop.jsx, useHybridControls.jsx, PlayerShip.jsx (new), usePlayerCamera.jsx, GameplayScene.jsx, gameConfig.js.

### Technical Stack Reference

- **Three.js r0.174.0** — BufferGeometry, Points, PointsMaterial, PlaneGeometry, MeshBasicMaterial/ShaderMaterial
- **React Three Fiber v9.1.0** — Declarative JSX for Three.js objects (`<points>`, `<bufferGeometry>`, `<meshBasicMaterial>`, etc.)
- **Drei v10.0.4** — Stars component available (`import { Stars } from '@react-three/drei'`) — consider using this instead of manual starfield if it fits the aesthetic. Check if Stars component provides enough customization.
- **R3F JSX Mesh Pattern:**
  ```jsx
  <mesh position={[0, 0, -2000]} rotation={[0, 0, 0]}>
    <planeGeometry args={[4000, 200]} />
    <meshBasicMaterial color="#00ffff" transparent opacity={0.1} side={THREE.DoubleSide} />
  </mesh>
  ```

**Drei Stars Component Option:**
Drei provides `<Stars>` which generates a starfield with configurable radius, depth, count, and saturation. This could replace manual Points generation:
```jsx
import { Stars } from '@react-three/drei'
<Stars radius={5000} depth={500} count={4000} factor={6} saturation={0} fade speed={0} />
```
Using Drei's Stars is simpler and well-tested. Manual Points gives more control. Developer should evaluate which fits better — Drei Stars is recommended for simplicity unless specific visual effects are needed.

### Color Palette Reference (from UX Spec)

- Boundary walls: `#00ffff` (cyan) at low opacity — matches "game-primary" palette
- Stars: White to blue-white variation
- Ground: Very dark (`#0a0a0f` to `#12121a` range)
- Space ambient: Dark, minimal light pollution
- Boundary warning: Cyan intensity increases with proximity

### Project Structure Notes

- New file: `src/renderers/EnvironmentRenderer.jsx` — follows existing renderers/ pattern (PlayerShip.jsx)
- Modified file: `src/scenes/GameplayScene.jsx` — add EnvironmentRenderer, remove gridHelper
- Modified file: `src/config/gameConfig.js` — add environment constants, update PLAY_AREA_SIZE and BOUNDARY_WARNING_DISTANCE
- Modified file: `src/index.jsx` — update camera far plane from 1000 to 10000
- No new directories needed
- Naming: PascalCase for component (EnvironmentRenderer.jsx)

### Testing Approach

- Visual verification: stars visible in all directions, space feels immersive
- Boundary test: fly toward each edge (x+, x-, z+, z-) — wall becomes visible, ship stops at boundary
- Performance: r3f-perf should show < 1ms for environment rendering
- Camera test: environment stays fixed while camera follows player (stars should be distant enough to feel static)
- Regression: ship movement, rotation, banking, camera follow all still work correctly

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3] — Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — renderers/ directory, scene composition
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules] — Renderers can useFrame for visual sync (read-only)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Naming conventions, component patterns
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — Neon cyan/magenta palette, dark background
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation] — Cyber Minimal direction
- [Source: src/config/gameConfig.js] — PLAY_AREA_SIZE: 200→2000, BOUNDARY_WARNING_DISTANCE: 20→100
- [Source: src/scenes/GameplayScene.jsx] — Current scene composition with temp gridHelper
- [Source: _bmad-output/implementation-artifacts/1-2-ship-movement-rotation-banking.md] — Previous story file list, learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Starfield initially invisible due to top-down camera geometry — stars on sphere at radius 5000 not in FOV when camera looks straight down. Fixed by making ground plane semi-transparent (opacity 0.6) so stars below the plane show through.
- Declarative `<bufferAttribute>` in R3F v9 did not properly attach geometry attributes. Switched to imperative `BufferGeometry` creation via `useMemo` with `geo.setAttribute()` + `computeBoundingSphere()`.
- `sizeAttenuation: true` with `size: 3` made stars invisible at 5000 units distance. Switched to `sizeAttenuation: false` with `size: 2` for consistent star visibility regardless of distance.

### Completion Notes List

- Created `EnvironmentRenderer.jsx` with three sub-components: Starfield, BoundaryRenderer, GroundPlane
- Starfield: 4000 stars in spherical shell (r=4000-5000), white/blue-white colors, using imperative BufferGeometry + Points
- Boundary walls: 4 plane meshes at play area edges (±2000 on X/Z), cyan #00ffff, opacity varies from 0.08 (far) to 0.6 (at boundary) based on player proximity via useFrame
- Ground plane: semi-transparent dark plane (#0a0a0f, opacity 0.6) at Y=-0.1 with subtle gridHelper (#1a1a2e/#12121a), spans 4400×4400
- GameplayScene: removed temp gridHelper, added EnvironmentRenderer import, reduced ambient light from 0.6 to 0.35
- Camera far plane updated from 1000 to 10000 in index.jsx
- gameConfig: added STAR_COUNT, STAR_FIELD_RADIUS, BOUNDARY_WALL_BASE_OPACITY, BOUNDARY_WALL_WARN_OPACITY, BOUNDARY_WALL_HEIGHT, BOUNDARY_WALL_COLOR; updated PLAY_AREA_SIZE 200→2000, BOUNDARY_WARNING_DISTANCE 20→100
- Skipped nebula/fog (Task 1.3) per story guidance — stars alone provide sufficient immersion
- Verified: no console errors, ship movement/camera/boundary clamping all work, environment is cohesive dark space aesthetic
- No store code modified (usePlayer.jsx reads PLAY_AREA_SIZE dynamically — confirmed working)

### Change Log

- 2026-02-07: Implemented Story 1.3 — Space Environment & Boundaries (all 6 tasks completed)
- 2026-02-07: Code Review fixes — moved WALL_HEIGHT/WALL_COLOR to gameConfig (M1), replaced fragile axis heuristic with explicit axis index in WALLS data (M2), added useEffect cleanup for imperative BufferGeometry disposal (M3), consolidated 4 BoundaryWall useFrame hooks into 1 in BoundaryRenderer (M4), added Math.min clamp on proximity t value (L2)

### File List

- `src/renderers/EnvironmentRenderer.jsx` — **New**: Starfield, BoundaryRenderer, GroundPlane components
- `src/scenes/GameplayScene.jsx` — **Modified**: replaced temp gridHelper with EnvironmentRenderer, reduced ambient light 0.6→0.35
- `src/config/gameConfig.js` — **Modified**: added environment constants, updated PLAY_AREA_SIZE 200→2000, BOUNDARY_WARNING_DISTANCE 20→100
- `src/index.jsx` — **Modified**: camera far plane 1000→10000
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — **Modified**: story status ready-for-dev→review
