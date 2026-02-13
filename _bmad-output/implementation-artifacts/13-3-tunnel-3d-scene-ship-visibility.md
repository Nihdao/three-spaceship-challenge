# Story 13.3: Tunnel 3D Scene Ship Visibility

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see my spaceship flying through the tunnel in the 3D scene on the left side,
So that the tunnel feels immersive and connected to gameplay.

## Acceptance Criteria

1. **Given** the tunnel scene (left side 3D view) **When** TunnelScene.jsx renders **Then** the player's spaceship is visible in the scene, positioned as if flying through the tunnel **And** the ship is illuminated and clearly visible (not too dark)

2. **Given** the tunnel animation **When** the scene plays **Then** the tunnel creates the illusion of infinite forward motion (scrolling texture or geometry) **And** the ship may have subtle idle animation (banking, nose dip) to add life

3. **Given** the ship in the tunnel **When** lighting is applied **Then** appropriate lighting (directional, ambient, or point lights) ensures the ship stands out **And** the tunnel environment has depth and visual interest (stars, particles, etc.)

4. **Given** performance **When** the tunnel scene renders **Then** it maintains 60 FPS with the ship and tunnel effects active

## Tasks / Subtasks

- [ ] Task 1: Replace ShipPlaceholder with real PlayerShip model (AC: #1)
  - [ ] 1.1: Remove current ShipPlaceholder component (lines 71-82 in TunnelScene.jsx)
  - [ ] 1.2: Import useGLTF from @react-three/drei for Spaceship.glb loading
  - [ ] 1.3: Create TunnelShip component that loads '/models/ships/Spaceship.glb' (same model as PlayerShip)
  - [ ] 1.4: Clone the scene with useMemo(() => scene.clone(), [scene]) to avoid shared material issues
  - [ ] 1.5: Position ship at [0, -1, 10] (same as placeholder — centered, slightly below, in front of camera)
  - [ ] 1.6: Rotate ship 180° (rotation={[0, Math.PI, 0]}) to face forward (same as placeholder)
  - [ ] 1.7: Replace <ShipPlaceholder /> with <TunnelShip /> in TunnelScene return (line 143)
  - [ ] 1.8: Add useGLTF.preload('/models/ships/Spaceship.glb') at bottom of file (asset preloading)

- [ ] Task 2: Apply emissive lighting to ship materials (AC: #1, #3)
  - [ ] 2.1: Import GAME_CONFIG from '../config/gameConfig.js' to access PLAYER_SHIP_LIGHTING constants
  - [ ] 2.2: Traverse clonedScene to find all mesh materials (same pattern as PlayerShip.jsx lines 22-48)
  - [ ] 2.3: Separate hull meshes from engine meshes (check name.includes('engine') or 'thruster')
  - [ ] 2.4: Apply hull emissive: color=#00d4ff (cyan), intensity=0.3 (EMISSIVE_INTENSITY from config)
  - [ ] 2.5: Apply engine emissive: color=#00ffcc (bright cyan), intensity=0.6 (ENGINE_EMISSIVE_INTENSITY)
  - [ ] 2.6: Set materials.needsUpdate = true after emissive changes
  - [ ] 2.7: Store materials in useMemo to avoid re-traversing on every frame

- [ ] Task 3: Add local point light to ship for illumination (AC: #1, #3)
  - [ ] 3.1: Add <pointLight /> as child of ship group (same pattern as PlayerShip.jsx lines 110-116)
  - [ ] 3.2: Set light position={[0, 2, 0]} (above ship, illuminates from top)
  - [ ] 3.3: Set intensity={1.5} (POINT_LIGHT_INTENSITY from config, slightly boosted for tunnel)
  - [ ] 3.4: Set distance={8} (POINT_LIGHT_DISTANCE from config)
  - [ ] 3.5: Set decay={2} (physically-based light falloff)
  - [ ] 3.6: Set color="#ffffff" (neutral white light to preserve ship colors)
  - [ ] 3.7: Test that ship is clearly visible against purple tunnel background

- [ ] Task 4: Add subtle idle animation to ship (AC: #2)
  - [ ] 4.1: Create shipRef with useRef() for the ship group
  - [ ] 4.2: Use useFrame hook to animate ship rotation/position over time
  - [ ] 4.3: Add subtle nose dip: rotation.x = Math.sin(elapsed * 0.5) * 0.05 (±3° pitch)
  - [ ] 4.4: Add subtle banking: rotation.z = Math.cos(elapsed * 0.3) * 0.08 (±5° roll)
  - [ ] 4.5: Add tiny vertical drift: position.y = baseY + Math.sin(elapsed * 0.4) * 0.2 (±0.2 units)
  - [ ] 4.6: Use elapsed time (not delta) for smooth sine waves independent of frame rate
  - [ ] 4.7: Keep animations subtle — ship should feel "alive" but not distracting

- [ ] Task 5: Enhance tunnel lighting for ship visibility (AC: #3)
  - [ ] 5.1: Review current lighting: ambientLight intensity={0.1}, 2 pointLights (lines 136-139)
  - [ ] 5.2: Increase ambientLight intensity from 0.1 → 0.15 (slightly brighter base illumination)
  - [ ] 5.3: Adjust front pointLight (position [0,0,40]) intensity from 0.8 → 1.0 (brighter forward lighting)
  - [ ] 5.4: Consider adding directional light from behind ship (position [0,5,-20]) to create rim lighting effect
  - [ ] 5.5: Set directional light intensity=0.5, color="#4466ff" (blue rim light for depth)
  - [ ] 5.6: Test that ship remains visible during tunnel scrolling animation
  - [ ] 5.7: Verify that tunnel particles (TunnelParticles) don't obscure ship (already handled — particles rendered first)

- [ ] Task 6: Verify tunnel infinite scrolling animation (AC: #2)
  - [ ] 6.1: Confirm TunnelTube shader animation is working (uTime += delta * SCROLL_SPEED at line 63)
  - [ ] 6.2: Confirm TunnelParticles scrolling is working (positions.array[i*3+2] += speeds[i] * delta at line 115)
  - [ ] 6.3: Verify scrolling creates illusion of forward motion (rings and particles move toward camera)
  - [ ] 6.4: Test that ship appears stationary while tunnel scrolls around it (correct perception)
  - [ ] 6.5: No changes needed if already working — just verify in-game

- [ ] Task 7: Performance testing and optimization (AC: #4)
  - [ ] 7.1: Test tunnel scene FPS with ship + lights + particles at 1080p
  - [ ] 7.2: Verify 60 FPS maintained (use r3f-perf or browser DevTools FPS counter)
  - [ ] 7.3: Check draw calls (ship model is ~500 triangles, should be negligible overhead)
  - [ ] 7.4: Ensure ship materials are not recreated on every frame (use useMemo for materials)
  - [ ] 7.5: Ensure ship mesh is not recreated on every frame (use useMemo for clonedScene)
  - [ ] 7.6: Profile with Chrome DevTools Performance tab if FPS drops below 55
  - [ ] 7.7: Consider reducing TUNNEL_SEGMENTS from 64 → 48 if needed (minor visual quality loss)

- [ ] Task 8: Test ship visibility across resolutions and settings (AC: #1, #3)
  - [ ] 8.1: Test at 1920x1080 (primary target) — verify ship clearly visible
  - [ ] 8.2: Test at 1280x720 (minimum supported) — verify ship still visible
  - [ ] 8.3: Test with different monitor brightness settings — verify emissive makes ship glow
  - [ ] 8.4: Test on Firefox and Safari (secondary targets) — verify materials render correctly
  - [ ] 8.5: Verify ship color (#00d4ff cyan) contrasts well with tunnel (#6622cc purple)
  - [ ] 8.6: Test that ship doesn't blend into tunnel particles (#8844ff purple)
  - [ ] 8.7: Take screenshot for visual validation before/after comparison

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **Rendering Layer** → TunnelScene.jsx (3D scene component) — this story adds ship rendering
- **UI Layer** → TunnelHub.jsx (unchanged — HTML overlay on right side)
- **Stores** → useGame, usePlayer (read-only — ship selection data)
- **Config** → gameConfig.js (read-only — PLAYER_SHIP_LIGHTING constants)
- **Systems** → None (tunnel is purely visual, no game logic)
- **GameLoop** → Paused during tunnel phase (unchanged)

**Current TunnelScene.jsx Structure (147 lines):**
- **Lines 1-10:** Imports, constants (TUNNEL_RADIUS, SCROLL_SPEED, colors)
- **Lines 11-31:** Tunnel shader (vertex + fragment shaders for scrolling rings)
- **Lines 33-69:** TunnelTube component (cylindrical geometry with shader material)
- **Lines 71-82:** ShipPlaceholder component (simple cone geometry, to be replaced)
- **Lines 84-128:** TunnelParticles component (300 moving points for depth)
- **Lines 130-146:** TunnelScene component (camera, lights, composition)

**Rendering Order (Z-index from back to front):**
1. TunnelTube (cylinder, BackSide rendering, inside view)
2. TunnelParticles (points, transparent, depth-independent)
3. Ship (mesh with materials, forward-facing, illuminated)
4. Camera (perspectiveCamera at [0,0,30] looking at origin)

### Technical Requirements

**Ship Model Loading (Story 12.1 Pattern):**
- **Model:** '/models/ships/Spaceship.glb' (same as PlayerShip.jsx)
- **Loading:** useGLTF hook from @react-three/drei
- **Cloning:** scene.clone() in useMemo to avoid shared materials with gameplay ship
- **Preloading:** useGLTF.preload() at module level for instant rendering
- **Materials:** Traverse scene to find meshes, separate hull/engine materials by name

**Emissive Lighting (Story 12.1 Pattern):**
- **Hull emissive:** #00d4ff (cyan), intensity 0.3 (GAME_CONFIG.PLAYER_SHIP_LIGHTING.EMISSIVE_INTENSITY)
- **Engine emissive:** #00ffcc (bright cyan), intensity 0.6 (GAME_CONFIG.PLAYER_SHIP_LIGHTING.ENGINE_EMISSIVE_INTENSITY)
- **Point light:** intensity 1.5, distance 8, position [0,2,0], color #ffffff
- **Why emissive matters:** Tunnel has low ambient light (0.1), emissive makes ship glow and stand out

**Animation Pattern:**
- **Idle animation:** Subtle sine waves on rotation (pitch, roll) and position (vertical drift)
- **Frame-independent:** Use elapsed time from useFrame ((state) => { const elapsed = state.clock.elapsedTime })
- **Amplitude:** Keep small (0.05 rad = 3°, 0.2 units) — ship should breathe, not dance
- **Frequencies:** Use different speeds (0.3, 0.4, 0.5 rad/sec) to create organic, non-repetitive motion

**Performance Considerations:**
- **Geometry complexity:** Spaceship.glb is ~500 triangles (low-poly, optimized for gameplay)
- **Material updates:** Materials set once in useMemo, not per-frame
- **Light count:** 4 total lights (1 ambient, 2 pointLights from tunnel, 1 pointLight from ship, optional 1 directional)
- **Shader cost:** Tunnel shader is simple (no complex math, just sine waves)
- **Target:** 60 FPS at 1080p (NFR1), 30+ FPS minimum (NFR2)

**Color Contrast (Accessibility):**
- **Ship cyan (#00d4ff)** vs **Tunnel purple (#6622cc)** → High contrast, good readability
- **Ship emissive** vs **Particle purple (#8844ff)** → Ship glows brighter, easy to distinguish
- **White point light** → Neutral illumination, preserves ship color fidelity

### Project Structure Notes

**Files to Modify:**
- `src/scenes/TunnelScene.jsx` — Replace ShipPlaceholder, add TunnelShip component (lines 71-82 replaced)
  - Add imports: useGLTF, useRef (already has useRef), GAME_CONFIG
  - Add TunnelShip component (60-80 lines, similar to PlayerShip pattern)
  - Update TunnelScene return to use <TunnelShip /> instead of <ShipPlaceholder />
  - Optional: Adjust lighting (ambientLight, pointLights) for better ship visibility

**No Structural Changes:**
- No new files created
- No changes to stores, UI, or game logic
- No changes to TunnelHub.jsx (UI overlay unchanged)
- No changes to usePlayer store (ship data is read-only here)
- No changes to gameConfig.js (lighting constants already exist from Story 12.1)

**Testing Focus:**
- Visual verification: Ship clearly visible, glowing, not too dark
- Animation smoothness: Idle motion is subtle and pleasant, not jarring
- Performance: 60 FPS maintained with ship + tunnel + particles
- Color contrast: Ship stands out from purple tunnel background
- Cross-browser: Materials render correctly on Firefox/Safari

### Previous Story Intelligence

**Story 13.2 Learnings (Sidebar Compaction):**
- TunnelHub UI is compact and fits 1080p without scrolling
- All tunnel interactions (upgrades, dilemma, HP sacrifice, exit) working correctly
- Tunnel phase transitions (enter, exit) are stable
- No changes needed to TunnelScene.jsx for 13.2 — purely UI work

**Story 13.1 Learnings (Tunnel Bugs Resolution):**
- TunnelScene.jsx renders without console errors
- TunnelTube shader scrolling animation is smooth and continuous
- TunnelParticles scrolling creates depth perception
- Exit animation (tunnel-exit-fade) works correctly
- State management (advanceSystem, resetForNewSystem) is stable

**Story 12.1 Learnings (Player Ship Lighting):**
- PlayerShip.jsx established emissive material pattern (hull vs engine separation)
- GAME_CONFIG.PLAYER_SHIP_LIGHTING constants are defined and working
- Point light on ship (intensity 1.5, distance 8) provides good illumination
- Material cloning (scene.clone()) prevents shared material issues between instances
- Emissive + point light combination makes ship visible even in dark environments

**Story 10.6 & Recent Commits:**
- Recent UI work (pause menu, HUD) focused on compact layouts and readability
- All recent stories maintain 60 FPS performance (no degradation)
- PlayerShip model is well-tested and renders correctly in GameplayScene

### Git Intelligence

**Recent Commits Pattern (last 5):**
- **bf92aea:** XP magnetization system (Story 11.1) — systems layer work, no rendering changes
- **873b3e6:** Pause menu with inventory (Story 10.6) — UI layer work, compact layouts
- **5ee711d:** Boon slots visibility (Story 10.5) — HUD additions, no 3D scene changes
- **0636565:** Enhanced minimap (Story 10.3) — UI styling, circular shapes
- **c7c0e97:** Top stats display (Story 10.2) — HUD stats, timer warnings

**Actionable Insights:**
- No recent commits modified TunnelScene.jsx — stable baseline to work from
- PlayerShip.jsx was modified in Story 12.1 (not in last 5 commits, but recent)
- Performance has been stable across recent UI additions (60 FPS maintained)
- No recent work on 3D rendering layer — this story re-engages with Three.js/R3F

**Code Patterns to Follow:**
- Use useMemo for geometry, materials, and scene clones (memory efficiency)
- Use useFrame for animations (frame-independent, elapsed time)
- Use useGLTF.preload for asset loading (instant rendering)
- Apply emissive materials to make objects visible in dark scenes

### Latest Technical Information

**React Three Fiber v9.1.0 (Current Version):**
- useFrame hook: `(state, delta) => {}` where state includes clock.elapsedTime
- useGLTF hook: Returns { scene, materials, nodes } — we use scene.clone() for instances
- Drei helpers: useGLTF.preload() for asset preloading (call outside component)
- No breaking changes from v8 relevant to this story

**Three.js r174 (v0.174.0):**
- Material.emissive: Color property, set with .copy(color) or .set(hex)
- Material.emissiveIntensity: Number, multiplies emissive color (0.0 = off, 1.0 = full)
- Material.needsUpdate: Must set to true after changing material properties
- BackSide rendering: Renders inside of geometry (for tunnel interior view)

**Performance Best Practices (2026):**
- Minimize draw calls: Ship model is 1 draw call (merged geometry)
- Use instancing for repeated objects: Not needed here (single ship)
- Dispose geometries/materials: R3F handles on component unmount
- Avoid creating objects in useFrame: Use refs and mutate existing objects

**Lighting Best Practices:**
- Point lights: Use decay=2 for physically-based falloff (default since Three.js r155)
- Emissive materials: Glow independently of lighting (self-illuminating)
- Ambient light: Provides base illumination, prevents pure black shadows
- Directional light: Optional for rim lighting (creates depth, separates object from background)

### References

- Epic 13: Tunnel Hub Fixes & UX Improvements [Source: _bmad-output/planning-artifacts/epics.md#Epic 13]
- Story 13.3 Requirements: Tunnel 3D scene ship visibility [Source: _bmad-output/planning-artifacts/epics.md#Story 13.3]
- UX Design: Tunnel Hub visual description (split 3D/UI) [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Tunnel Hub]
- Architecture: Scene Management (Menu, Gameplay, Boss, Tunnel, GameOver) [Source: _bmad-output/planning-artifacts/architecture.md#Scene Management]
- Architecture: Asset Loading (preload manifest, Drei preload) [Source: _bmad-output/planning-artifacts/architecture.md#Asset Loading]
- TunnelScene Current Implementation: ShipPlaceholder lines 71-82 [Source: src/scenes/TunnelScene.jsx:71-82]
- PlayerShip Lighting Pattern: Emissive + point light [Source: src/renderers/PlayerShip.jsx:20-116]
- PLAYER_SHIP_LIGHTING Config: Emissive colors, intensities, point light params [Source: src/config/gameConfig.js:PLAYER_SHIP_LIGHTING]
- Story 13.2: Sidebar compaction (TunnelHub UI unchanged) [Source: _bmad-output/implementation-artifacts/13-2-sidebar-layout-compaction-no-scroll.md]
- Story 13.1: Tunnel bugs resolved (TunnelScene stable) [Source: _bmad-output/implementation-artifacts/13-1-tunnel-rendering-interaction-bugs-resolution.md]
- Story 12.1: Player ship lighting improvements (emissive pattern established) [Source: _bmad-output/implementation-artifacts/12-1-player-ship-lighting-improvements.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
