# Story 17.3: Wormhole Visual Overhaul

Status: ready-for-dev

## Story

As a player,
I want the wormhole to look like a mysterious cosmic phenomenon rather than a simple donut,
So that discovering it feels significant and visually impressive.

## Acceptance Criteria

1. **Replace Torus with Layered Visual Effect:** Given the wormhole is rendered in the gameplay scene, when it appears after sufficient exploration time or player proximity to the spawn location, then the wormhole is no longer a simple torus (donut) shape. Instead, it is a layered visual effect combining a central sphere with swirling shader effect (event horizon), orbital ring particles rotating around the sphere, and subtle light emission.

2. **Central Sphere with Swirling Shader:** Given the wormhole model, when it is designed, then the central sphere uses a custom `ShaderMaterial` with time-based UV distortion (simplex noise or sin/cos wave swirl pattern). The sphere emits light (cyan glow `#00ccff` matching existing `WORMHOLE_COLOR`). The sphere has opacity variations (not fully opaque) to create depth — using `transparent: true` and alpha channel in the fragment shader.

3. **Orbital Particles:** Given the orbital particles, when they are rendered, then 20-30 small particles orbit the central sphere in multiple rings. Particles use `Points` + `PointsMaterial` (matching existing particle patterns in the codebase). Particles have varied orbit speeds and radii to create dynamic motion. Particles are cyan-colored matching the wormhole theme.

4. **Dormant State (Pre-Activation):** Given the wormhole is dormant (`wormholeState === 'visible'`), when it is visible, then the swirling effect is slow and subtle (low energy state), the glow is dim (emissive intensity 0.2-0.5 range, pulsing), and the orbital particles move slowly.

5. **Activation State Intensification:** Given the player activates the wormhole (`wormholeState === 'activating'`), when the activation sequence plays, then the swirling effect intensifies (faster rotation in shader, brighter glow), orbital particles accelerate, the sphere scale expands slightly (1.0 to 1.3-1.5x) before stabilizing, and the color shifts from cyan to purple (`#cc66ff`, matching existing `WORMHOLE_ACTIVATE_COLOR`).

6. **Active State:** Given the wormhole is fully active (`wormholeState === 'active'`), when it is rendered, then the sphere is bright and steady at expanded scale, the glow is at maximum intensity, and the particles orbit at full speed with purple coloring.

7. **Performance Budget:** Given the new wormhole visual, when it is rendered alongside gameplay elements (100+ enemies, projectiles, XP orbs), then the frame rate remains at 60 FPS. The wormhole uses at most 2-3 draw calls (sphere mesh + particles + optional inner glow).

## Tasks / Subtasks

- [ ] Task 1: Add wormhole visual config constants (AC: #2, #3, #4, #5, #7)
  - [ ] 1.1 Add `WORMHOLE_VISUAL` config block to `gameConfig.js` with:
    - `SPHERE_RADIUS: 8` (replaces torus major radius)
    - `SPHERE_SEGMENTS: 32`
    - `PARTICLE_COUNT: 25`
    - `PARTICLE_ORBIT_RADIUS_MIN: 10`
    - `PARTICLE_ORBIT_RADIUS_MAX: 14`
    - `DORMANT_SWIRL_SPEED: 0.3`
    - `ACTIVE_SWIRL_SPEED: 1.5`
    - `DORMANT_PARTICLE_SPEED: 0.5`
    - `ACTIVE_PARTICLE_SPEED: 2.0`
    - `DORMANT_EMISSIVE_MIN: 0.2`
    - `DORMANT_EMISSIVE_MAX: 0.5`
    - `ACTIVE_EMISSIVE: 2.0`
    - `ACTIVATION_SCALE: 1.4`

- [ ] Task 2: Create wormhole swirl shader (AC: #2)
  - [ ] 2.1 Create `src/shaders/wormhole/vertex.glsl` — standard vertex shader passing UVs and position
  - [ ] 2.2 Create `src/shaders/wormhole/fragment.glsl` — time-based UV distortion with swirl pattern:
    - Input uniforms: `uTime`, `uColor` (vec3), `uIntensity` (float), `uSpeed` (float)
    - Swirl effect: polar coordinate UV distortion using `sin/cos` waves modulated by time
    - Alpha gradient: radial falloff from center (opaque center → transparent edges)
    - Color: base color modulated by swirl pattern and intensity

- [ ] Task 3: Rewrite WormholeRenderer.jsx (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 3.1 Replace torus geometry with `SphereGeometry` using `ShaderMaterial` (import GLSL shaders)
  - [ ] 3.2 Create shader material via `useMemo` with uniforms: `uTime`, `uColor`, `uIntensity`, `uSpeed`
  - [ ] 3.3 Add orbital particles using `Points` + `PointsMaterial`:
    - Generate particle positions in circular orbits (multiple rings at varied radii)
    - Store positions in `Float32Array` via `useMemo`
    - Animate positions in `useFrame` by rotating around Y axis at varied speeds
  - [ ] 3.4 Remove old torus geometry, old inner glow disc, and old shockwave ring
  - [ ] 3.5 Keep existing `wormholeState` reading pattern from `useLevel` via `getState()`
  - [ ] 3.6 Update `useFrame` animation logic:
    - **hidden:** Don't render (return early or set visible=false)
    - **visible (dormant):** Slow swirl (`DORMANT_SWIRL_SPEED`), dim pulsing emissive, slow particle orbits
    - **activating:** Faster swirl, increasing emissive, particle acceleration, scale expansion, color shift cyan→purple
    - **active:** Maximum swirl speed, full brightness, fast particles, steady expanded scale, purple color
  - [ ] 3.7 Dispose old materials in `useEffect` cleanup, create new shader material disposal
  - [ ] 3.8 Keep mesh position reading from `useLevel.getState().wormhole` (same `{x, z}` object)

- [ ] Task 4: Update shockwave visual during activation (AC: #5)
  - [ ] 4.1 Replace old torus shockwave ring with a simpler particle burst or expanding ring effect
  - [ ] 4.2 Or remove shockwave visual entirely — the enemy clear is already handled by GameLoop logic (Story 6.1), and activation intensification provides visual feedback
  - [ ] 4.3 Decision: keep shockwave ring if simple to implement with new visual style, otherwise drop it

- [ ] Task 5: Update minimap styling (AC: #1)
  - [ ] 5.1 Review HUD.jsx minimap wormhole dot — no changes needed unless visual size/color should match new design
  - [ ] 5.2 Minimap dot already uses correct colors (`#00ccff` dormant, size changes for active) — verify compatibility

- [ ] Task 6: Manual testing & performance validation (AC: #4, #5, #6, #7)
  - [ ] 6.1 Verify wormhole appears as sphere with swirling shader (not torus)
  - [ ] 6.2 Verify orbital particles animate around the sphere
  - [ ] 6.3 Verify dormant state: slow swirl, dim glow, slow particles
  - [ ] 6.4 Verify activation: faster swirl, brighter glow, particle acceleration, scale expansion, cyan→purple color shift
  - [ ] 6.5 Verify active state: maximum brightness, fast particles, steady purple
  - [ ] 6.6 Verify performance with r3f-perf: 60 FPS during wormhole animation alongside gameplay
  - [ ] 6.7 Verify existing wormhole spawn/activate/boss-transition logic unchanged (GameLoop sections, useLevel actions)
  - [ ] 6.8 Verify material disposal on unmount (no WebGL memory leaks)

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

### Debug Log References

### Completion Notes List

### File List
