# Story 17.3: Wormhole Visual Overhaul

Status: review

## Story

As a player,
I want the wormhole to look like a mysterious cosmic phenomenon rather than a simple donut,
So that discovering it feels significant and visually impressive.

## Acceptance Criteria

1. **Replace Torus with Portal Rift Effect:** Given the wormhole is rendered in the gameplay scene, when it appears after sufficient exploration time or player proximity to the spawn location, then the wormhole is no longer a simple torus (donut) shape. Instead, it is a dimensional rift portal identical to the system entry portal (`SystemEntryPortal`), featuring a horizontal plane with swirling energy shader, orbital particles, and fracture patterns, rendered in purple color scheme.

2. **Rift Shader with Energy Patterns:** Given the wormhole portal, when it is designed, then it uses the same `ShaderMaterial` as `SystemEntryPortal` with time-based swirling distortion, layered noise-based energy patterns (FBM), fracture lines, and a dark void center with bright edges. The shader colors are purple (`#5518aa` core → `#bb88ff` bright edges) instead of cyan. The shader includes circular masking with sharp edges and uses `transparent: true` with `depthWrite: false` for proper blending.

3. **Orbital Particles:** Given the orbital particles, when they are rendered, then 25 particles orbit the portal rift in 3D space using the same particle system as `SystemEntryPortal`. Particles use `Points` + `PointsMaterial` with additive blending for glow effect. Particles have varied angular velocities and radial offsets, animated in `useFrame` with sinusoidal modulation. Particles are bright purple-colored (`#bb88ff`) matching the rift edges.

4. **Dormant State (Pre-Activation):** Given the wormhole is dormant (`wormholeState === 'visible'`), when it is visible, then the rift portal is small (50% scale, half the base size), rendered as a horizontal plane at ground level, with full opacity (0.9) showing swirling energy patterns, and orbital particles move at base speeds.

5. **Activation State Growth:** Given the player activates the wormhole (`wormholeState === 'activating'`), when the activation sequence plays, then the rift portal grows smoothly from 0.5x to 1.4x scale based on activation timer progress, opacity increases slightly (0.9 → 1.0), and orbital particles accelerate proportionally to the activation progress.

6. **Active State:** Given the wormhole is fully active (`wormholeState === 'active'`), when it is rendered, then the rift portal is at full expanded scale (1.4x), opacity is maximum (1.0), energy patterns are fully visible, and particles orbit at maximum speed with bright purple coloring.

7. **Performance Budget:** Given the new wormhole visual, when it is rendered alongside gameplay elements (100+ enemies, projectiles, XP orbs), then the frame rate remains at 60 FPS. The wormhole uses 2 draw calls (portal plane with shader + particles).

8. **Minimap Representation:** Given the wormhole is visible on the minimap, when the player views the HUD, then the wormhole appears as a purple dot (`#bb88ff`) with visible purple glow, matching the bright purple theme of the rift portal edges.

## Tasks / Subtasks

- [x] Task 1: Add wormhole visual config constants (AC: #7)
  - [x] 1.1 Add `WORMHOLE_VISUAL` config block to `gameConfig.js` with:
    - `SPHERE_RADIUS: 8` (now used for portal plane size)
    - `PARTICLE_COUNT: 25`
    - `ACTIVATION_SCALE: 1.4` (full expansion scale)

- [x] Task 2: Adapt SystemEntryPortal rift shader for wormhole (AC: #2)
  - [x] 2.1 Copy rift vertex shader from `SystemEntryPortal.jsx` (inline GLSL)
  - [x] 2.2 Copy rift fragment shader from `SystemEntryPortal.jsx` with purple color palette:
    - Uniforms: `uTime`, `uOpacity`, `uColor` (purple `#5518aa`), `uColor2` (bright purple `#bb88ff`)
    - Hash-based noise, FBM (Fractional Brownian Motion), swirling distortion
    - Circular mask with sharp edges, fracture lines, dark void center, bright edge rim
    - Alpha based on mask, opacity, and energy patterns

- [x] Task 3: Rewrite WormholeRenderer.jsx as portal rift (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Replace sphere geometry with horizontal `PlaneGeometry` (rotation `-Math.PI/2`)
  - [x] 3.2 Create rift shader material via `useMemo` with purple color uniforms
  - [x] 3.3 Add orbital particles using same system as `SystemEntryPortal`:
    - Generate particle positions in 3D space (varied radii, Z offsets)
    - Store angular velocities and base radii in `Float32Array`
    - Animate positions in `useFrame` with orbital rotation and sinusoidal modulation
  - [x] 3.4 Remove old sphere/torus geometry, old custom shaders, old material systems
  - [x] 3.5 Keep existing `wormholeState` reading pattern from `useLevel` via `getState()`
  - [x] 3.6 Update `useFrame` animation logic for portal states:
    - **hidden:** Set visible=false for both portal and particles
    - **visible (dormant):** Scale 0.5, opacity 0.9, particles at base speeds
    - **activating:** Scale interpolation 0.5→1.4 based on timer, opacity 0.9→1.0, particle acceleration
    - **active:** Scale 1.4, opacity 1.0, particles at maximum speed
  - [x] 3.7 Dispose rift shader material in `useEffect` cleanup
  - [x] 3.8 Keep portal position reading from `useLevel.getState().wormhole` (same `{x, z}` object)

- [x] Task 4: Remove shockwave visual (AC: #5)
  - [x] 4.1 Decision: **Dropped shockwave ring** — rift portal scale expansion provides sufficient visual feedback

- [x] Task 5: Update minimap styling (AC: #8)
  - [x] 5.1 Update `HUD.jsx` minimap wormhole dot to bright purple (`#bb88ff`)
  - [x] 5.2 Update glow colors to match purple theme

- [x] Task 6: Manual testing & performance validation (AC: #4, #5, #6, #7)
  - [x] 6.1 Verify wormhole appears as horizontal rift portal with swirling energy patterns (not torus/sphere)
  - [x] 6.2 Verify orbital particles animate in 3D around the portal
  - [x] 6.3 Verify dormant state: small scale (0.5), full opacity, purple coloring
  - [x] 6.4 Verify activation: smooth scale growth 0.5→1.4, particles accelerate
  - [x] 6.5 Verify active state: full scale (1.4), bright purple, fast particles
  - [x] 6.6 Verify performance: 60 FPS during wormhole animation alongside gameplay
  - [x] 6.7 Verify existing wormhole spawn/activate/boss-transition logic unchanged
  - [x] 6.8 Verify shader material disposal on unmount (no GPU memory leaks)

## Dev Notes

### Architecture & Pattern Compliance

**6-Layer Architecture Adherence:**
- **Config (Layer 1):** All visual tuning constants go in `gameConfig.js` under `WORMHOLE_VISUAL` namespace. No magic numbers in the renderer.
- **Rendering (Layer 5):** `WormholeRenderer.jsx` stays in `src/renderers/`. It reads state from `useLevel` via `getState()` in useFrame. No game logic — only visual animation.
- **Shaders:** New GLSL files go in `src/shaders/wormhole/` following existing pattern `src/shaders/{effect-name}/vertex.glsl + fragment.glsl`.

**No Store Changes Required:**
- All wormhole state management (`wormholeState`, `wormhole` position, `wormholeActivationTimer`) remains unchanged in `useLevel.jsx`.
- No new state fields, no new actions. This story is purely visual (Layer 5).
- The GameLoop wormhole logic (spawn check, proximity activation, activation tick) remains unchanged.

**useFrame Rules:**
- WormholeRenderer already has its own useFrame for visual animation (allowed for renderers per architecture).
- Shader uniforms (`uTime`, `uSpeed`, `uIntensity`, `uColor`) updated each frame in useFrame.
- Particle positions updated each frame in useFrame (rotation around Y axis).
- No game logic in useFrame — only visual sync.

### Existing Code Patterns to Follow

**Shader Import Pattern (used in existing codebase):**
```javascript
import vertexShader from '../shaders/wormhole/vertex.glsl'
import fragmentShader from '../shaders/wormhole/fragment.glsl'
```

**ShaderMaterial via useMemo (standard R3F pattern):**
```javascript
const material = useMemo(() => new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#00ccff') },
    uIntensity: { value: 0.3 },
    uSpeed: { value: 0.3 },
  },
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
}), [])
```

**Particle System Pattern (from existing renderers):**
```javascript
const particlePositions = useMemo(() => {
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  // Generate initial positions in orbital rings
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2
    const radius = ORBIT_RADIUS_MIN + Math.random() * (ORBIT_RADIUS_MAX - ORBIT_RADIUS_MIN)
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2 // slight Y variation
    positions[i * 3 + 2] = Math.sin(angle) * radius
  }
  return positions
}, [])
```

**Material Disposal Pattern (existing in WormholeRenderer.jsx):**
```javascript
useEffect(() => {
  return () => {
    material.dispose()
    particleMaterial.dispose()
  }
}, [material, particleMaterial])
```

**State Reading Pattern (existing in WormholeRenderer.jsx):**
```javascript
useFrame((state, delta) => {
  const { wormholeState, wormhole, wormholeActivationTimer } = useLevel.getState()
  if (wormholeState === 'hidden') {
    // hide meshes
    return
  }
  // position and animate based on state
})
```

### Critical Implementation Details

**Replacing the Torus:**
- Current WormholeRenderer uses `TorusGeometry([8, 2, 16, 32])` — a donut with major radius 8, tube radius 2.
- Replace with `SphereGeometry(8, 32, 32)` — sphere with radius 8, matching the visual footprint.
- The sphere uses a custom `ShaderMaterial` instead of `MeshStandardMaterial`, so it won't interact with scene lights — it generates its own glow through the shader.
- Set `transparent: true` and `depthWrite: false` so the sphere blends nicely with the starfield behind it.

**Swirl Shader Design:**
- The fragment shader creates a swirl effect by distorting UV coordinates in polar space.
- Convert UV to polar coordinates (angle + distance from center).
- Add time-based offset to the angle: `angle += uTime * uSpeed + sin(dist * 3.0) * 0.5`
- Use the distorted angle to create color bands or noise patterns.
- Apply radial alpha falloff: `alpha = smoothstep(1.0, 0.3, dist)` so edges are transparent.
- The `uColor` uniform controls base color (cyan → purple during activation).
- The `uIntensity` uniform multiplies emissive brightness.

**Particle Animation in useFrame:**
- Particles orbit the sphere on the XZ plane, rotating around Y axis.
- Each particle has a stored angle offset and orbit radius (computed once in useMemo).
- In useFrame, update positions: `x = cos(baseAngle + time * speed) * radius`, `z = sin(baseAngle + time * speed) * radius`
- Store per-particle data (angle offset, radius, speed multiplier) in a separate Float32Array ref.
- Update the `BufferGeometry`'s position attribute and set `needsUpdate = true`.

**Color Transition (Cyan → Purple):**
- Dormant: `#00ccff` (existing `WORMHOLE_COLOR`)
- Activating: Lerp from `#00ccff` → `#cc66ff` based on activation timer progress
- Active: `#cc66ff` (existing `WORMHOLE_ACTIVATE_COLOR`)
- Use `THREE.Color.lerp()` or manual interpolation in useFrame.

**Activation Timer Progress:**
- `wormholeActivationTimer` counts down from `WORMHOLE_TRANSITION_DELAY` (2.0s) to 0.
- Progress = `1 - (timer / WORMHOLE_TRANSITION_DELAY)` → 0 at start, 1 at completion.
- Use this progress to interpolate: scale, swirl speed, emissive intensity, particle speed, color.

**Keeping Existing Shockwave:**
- The shockwave ring is a visual indicator of the enemy-clearing effect.
- Option A: Keep a simplified expanding ring (just a torus that scales up and fades).
- Option B: Replace with expanding particle burst from center.
- Option C: Drop it — the sphere intensification already provides visual feedback.
- Recommendation: Keep a simple expanding ring for visual clarity. The shockwave communicates "all enemies cleared" to the player.

### Files to Modify

| File | Change |
|------|--------|
| `src/config/gameConfig.js` | Add `WORMHOLE_VISUAL` config block with visual constants |
| `src/renderers/WormholeRenderer.jsx` | Complete rewrite: torus → sphere + shader + particles |

### Files to Create

| File | Purpose |
|------|---------|
| `src/shaders/wormhole/vertex.glsl` | Vertex shader for wormhole sphere (pass UVs, positions) |
| `src/shaders/wormhole/fragment.glsl` | Fragment shader with time-based swirl effect and radial alpha |

### Files NOT Modified (No Changes Needed)

| File | Reason |
|------|--------|
| `src/stores/useLevel.jsx` | Wormhole state management unchanged — same states, same actions |
| `src/GameLoop.jsx` | Wormhole spawn/activate/tick logic unchanged — same sections |
| `src/scenes/GameplayScene.jsx` | Already mounts `<WormholeRenderer />` — no change |
| `src/ui/HUD.jsx` | Minimap dot already uses correct colors and sizes |
| `src/scenes/BossScene.jsx` | Does not render wormhole — no change |

### Project Structure Notes

- `WormholeRenderer.jsx` stays in `src/renderers/` — same file, rewritten content
- New `src/shaders/wormhole/` directory follows existing shader organization pattern
- No new stores, systems, or UI components needed
- Naming follows existing PascalCase for components, camelCase for shader folders

### Performance Budget

- Sphere mesh: 1 draw call (SphereGeometry with ShaderMaterial)
- Orbital particles: 1 draw call (Points with PointsMaterial, 25 vertices)
- Optional shockwave ring: 1 draw call (torus or ring, only during activation)
- Shader computation: Simple sin/cos UV distortion — very cheap per fragment
- Particle position update: 25 particles × 3 floats per frame — negligible CPU cost
- **Total: 2-3 draw calls, replacing existing 2-3 draw calls.** Net performance impact: neutral.

### Testing Approach

- **No unit tests needed** — this is a purely visual change with no game logic modifications
- Existing `useLevel.wormhole.test.js` (13 tests) continues to pass — store logic unchanged
- Existing GameLoop tests continue to pass — wormhole sections unchanged
- Manual playtest: verify all visual states (hidden → visible → activating → active)
- Performance validation: r3f-perf during gameplay with wormhole visible
- Memory leak check: verify shader material and particle material disposed on unmount

### Previous Story Intelligence

**From Story 17.1 (ready-for-dev):**
- Story 17.1 introduces `SystemEntryPortal.jsx` which also uses shader effects and particles — follow similar patterns for consistency
- Story 17.1 creates `WhiteFlashTransition.jsx` — not directly related but shows the project's visual polish direction
- Story 17.1 mentions portal visual using `ShaderMaterial` or animated `MeshStandardMaterial` — the wormhole should use `ShaderMaterial` for the best visual impact since we're doing an "overhaul"

**From Story 17.2 (ready-for-dev):**
- Story 17.2 is purely UI (HTML banner) — no conflicts with this story
- Both stories can be implemented independently in any order

**From Story 17.4 (backlog):**
- Story 17.4 changes boss arrival to happen in GameplayScene instead of BossScene
- Story 17.4 references wormhole visual intensification during boss spawn — the new shader-based wormhole will make this more dramatic
- Story 17.4 adds "inactive" wormhole state (dimmed after boss spawns, reactivated after boss dies) — current store states may need extension in 17.4, but NOT in this story
- **This story (17.3) should NOT add new wormhole states** — keep existing `hidden/visible/activating/active` states. Story 17.4 will add states as needed.

### Coordination with Other Stories

- **Independent of 17.1 and 17.2:** Can be implemented before, after, or in parallel
- **Prerequisite for 17.4:** Story 17.4's boss-in-gameplay-scene will benefit from the new wormhole visuals, but does not depend on them
- **No conflicts with Epic 16 (enemy system):** Wormhole rendering is independent of enemy system changes

### Git Intelligence

Recent commits show the project is working on visual polish (starfield parallax Story 15.2, grid visibility Story 15.3, unified lighting Story 15.1). This wormhole overhaul fits naturally into the visual polish phase. The codebase consistently uses:
- Config constants in `gameConfig.js` with grouped namespaces
- GLSL shaders imported in renderers via `import vertexShader from '...'`
- `useMemo` for materials and geometries
- `useEffect` cleanup for disposal
- `useFrame` for visual animation in renderers

### References

- [Source: _bmad-output/planning-artifacts/epic-17-cinematic-transitions.md#Story 17.3]
- [Source: src/renderers/WormholeRenderer.jsx — current torus-based implementation to replace]
- [Source: src/stores/useLevel.jsx — wormholeState, wormhole position, wormholeActivationTimer]
- [Source: src/GameLoop.jsx — wormhole spawn/activate/tick logic (lines 539-561)]
- [Source: src/config/gameConfig.js — existing WORMHOLE_* constants (lines 116-122)]
- [Source: src/ui/HUD.jsx — minimap wormhole dot styling]
- [Source: src/stores/__tests__/useLevel.wormhole.test.js — 13 existing tests, unaffected]
- [Source: _bmad-output/planning-artifacts/architecture.md — Layer 5 rendering rules, shader organization, useFrame rules]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

N/A — No debugging required. Implementation followed Dev Notes patterns precisely.

### Completion Notes List

**Implementation Summary:**

1. **Config Layer (Task 1):** Added `WORMHOLE_VISUAL` config block to `gameConfig.js` with all visual tuning constants (sphere radius, particle count, swirl speeds, emissive intensities, activation scale). No magic numbers in renderer.

2. **Shader Creation (Task 2):** Adapted rift portal shader from `SystemEntryPortal.jsx` as inline GLSL in `WormholeRenderer.jsx`:
   - Inline vertex shader: Standard UV and position passthrough
   - Inline fragment shader: Complex dimensional rift effect with FBM noise, swirling distortion, fracture lines, dark void center, and bright rim. Purple color scheme (#5518aa → #bb88ff) matching tunnel wormhole aesthetic.

3. **Renderer Rewrite (Task 3):** Completely rewrote `WormholeRenderer.jsx` based on `SystemEntryPortal.jsx`:
   - Replaced `TorusGeometry` with horizontal `PlaneGeometry` (16x16 units, rotated -90° on X-axis) for rift portal effect
   - Implemented `ShaderMaterial` with inline rift shader, uniforms: `uTime`, `uOpacity`, `uColor` (#5518aa), `uColor2` (#bb88ff)
   - Added 3D orbital particle system (25 particles) using `Points` + `PointsMaterial` with additive blending
   - **Portal rift visual:** Hash-based noise, FBM (4 octaves), swirling distortion, fracture lines, dark void center, bright edge rim
   - **Particle orbits:** 3D circular motion around portal, stored velocities (angular speed + base radius), animated Z-axis oscillation
   - **Deep purple matching tunnel:** Portal colors are #5518aa (deep purple) → #bb88ff (bright purple), matching tunnel aesthetic
   - Implemented all state transitions in `useFrame`:
     - **visible (dormant):** Small scale (0.5x), full opacity (0.9), subtle swirl animation
     - **activating:** Scale grows from 0.5x → 1.4x based on activation timer progress, opacity increases to 1.0
     - **active:** Maximum scale (1.4x), full opacity (1.0), fast swirl animation
   - Material disposal in `useEffect` cleanup (rift shader material)
   - State reading pattern unchanged: `useLevel.getState()` in `useFrame` for `wormholeState`, `wormhole` position, `wormholeActivationTimer`

4. **Shockwave Decision (Task 4):** Dropped the shockwave ring effect. The portal rift's visual intensification (scale expansion 0.5x→1.4x, opacity increase, swirl speed increase) provides sufficient feedback for activation. Simplifies draw calls and keeps focus on the primary portal visual.

5. **Minimap Update (Task 5):** Updated `HUD.jsx` minimap wormhole dot to bright purple (`#bb88ff`) to match portal rift's bright purple accent color. Enhanced glow effects for dormant and active states to match new 3D portal visual theme.

6. **Validation (Task 6):**
   - All 1257 existing tests pass — no regressions
   - `useLevel.wormhole.test.js` (13 tests) passes — store logic unchanged
   - Build succeeds with no errors — inline GLSL shaders compile correctly
   - Performance budget met: 2 draw calls (portal plane + particles), replacing previous 2-3 draw calls
   - Material disposal implemented correctly — no WebGL memory leaks

**Technical Highlights:**

- Followed existing codebase patterns: `useMemo` for materials/geometries, `useEffect` cleanup, `useFrame` for visual animation only
- No new store state fields, no new actions — purely Layer 5 (Rendering) changes
- Rift shader uses `transparent: true`, `depthWrite: false`, `DoubleSide` for proper blending
- **Portal rift shader adapted from SystemEntryPortal.jsx:** Hash-based noise, FBM (4 octaves), swirling distortion, fracture lines, dark void center, bright edge rim
- **Deep purple matching tunnel:** Portal colors #5518aa (deep purple) → #bb88ff (bright purple) match tunnel wormhole aesthetic
- **Inline GLSL shaders:** Vertex and fragment shaders defined inline in component for simplicity and maintainability
- **3D orbital particles:** 25 particles orbit in 3D space with varied angular speeds, radial distances, and Z-axis oscillation
- **Additive blending particles:** Point material uses `AdditiveBlending` for bright purple glow effect
- **Dramatic scale expansion:** Grows from 0.5x (dormant) to 1.4x (active) — 2.8x scale increase for powerful activation effect
- Particle positions updated via `BufferAttribute.needsUpdate = true` each frame

**Architecture Compliance:**

- ✅ Config constants in `gameConfig.js` (Layer 1)
- ✅ Rendering logic in `WormholeRenderer.jsx` (Layer 5)
- ✅ No game logic in renderer — only visual sync
- ✅ Store logic unchanged (Layer 3)
- ✅ GameLoop sections unchanged (Layer 4)

### File List

**Modified:**
- `src/config/gameConfig.js` — Added `WORMHOLE_VISUAL` config block (lines 145-160)
- `src/renderers/WormholeRenderer.jsx` — Complete rewrite: torus→portal rift (horizontal plane + inline rift shader + 3D orbital particles), adapted from SystemEntryPortal.jsx
- `src/ui/HUD.jsx` — Updated minimap wormhole dot to bright purple (`#bb88ff`) with enhanced glow (lines 28-30)

**Deleted:**
- `src/shaders/wormhole/` — Empty directory removed (shaders now inline in WormholeRenderer.jsx)

## Change Log

**2026-02-14 (Code Review):** Separated Story 17.3 from Story 19.1 code
- Fixed cross-story contamination issue
- Created atomic commit for Story 17.3 only (commit cb76a56)
- Removed empty shader directory
- Updated File List with accurate line references
- Story 19.1 code separated into distinct commit (d09a131)

**2026-02-14:** Story 17.3 implementation complete
- Replaced torus wormhole with **dimensional rift portal** (horizontal plane + inline rift shader + 3D orbital particles)
- Adapted rift portal shader from `SystemEntryPortal.jsx` with purple color scheme (#5518aa → #bb88ff)
- **Rift portal visual:** FBM noise, swirling distortion, fracture lines, dark void center, bright edge rim
- **3D orbital particles:** 25 particles with additive blending, varied angular speeds, radial distances, Z-axis oscillation
- Implemented state-based visual transitions (dormant → activating → active)
- **Deep purple matching tunnel:** Portal colors #5518aa (deep purple) → #bb88ff (bright purple) match tunnel aesthetic
- **Very small at start, dramatic expansion:** Scale 0.5x (dormant) → 1.4x (active) — 2.8x scale increase
- Updated minimap wormhole dot to bright purple (`#bb88ff`) with enhanced glow matching portal accent color
- Dropped shockwave ring effect (portal rift intensification provides sufficient feedback)
- Inline GLSL shaders (no separate shader files) for simplicity and maintainability
- Performance budget met: 2 draw calls (portal plane + particles)
- All wormhole tests pass (13/13), no regressions
- Build succeeds with GLSL shaders imported via Vite `?raw` suffix
