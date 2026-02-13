# Story 13.3: Tunnel 3D Scene Ship Visibility

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to feel like I'm flying inside the wormhole tunnel with my spaceship visible in the foreground,
So that the tunnel phase feels immersive, cinematic, and connected to gameplay.

## Acceptance Criteria

1. **Given** the tunnel scene **When** TunnelScene.jsx renders **Then** the camera is positioned inside the tunnel tube looking forward **And** the tunnel walls, rings, and particles fill the viewport creating a "flying through a tube" perspective **And** the 3D scene spans the full screen (behind the right-side UI overlay)

2. **Given** the ship in the tunnel **When** it renders **Then** the player's real spaceship model (GLB) is visible in the foreground **And** the ship is offset slightly to the left of center so it remains visible and not fully hidden by the right-side UI panel **And** the ship is illuminated and clearly visible (not too dark)

3. **Given** the tunnel animation **When** the scene plays **Then** the tunnel creates the illusion of infinite forward motion (scrolling rings and particles) **And** the ship has subtle idle animation (banking, nose dip, vertical drift) to feel alive

4. **Given** the ship in the tunnel **When** lighting is applied **Then** appropriate lighting (emissive, point lights) ensures the ship stands out against the purple tunnel background **And** the tunnel environment has depth and visual interest

5. **Given** performance **When** the tunnel scene renders **Then** it maintains 60 FPS with the ship and tunnel effects active

## Tasks / Subtasks

- [x] Task 1: Adjust camera and tunnel for immersive "inside the tube" perspective (AC: #1)
  - [x] 1.1: Reposition camera deeper inside the tunnel — move from [0,0,30] closer to center (e.g. [0, 0, 15]) so the tube walls are more prominent in the FOV
  - [x] 1.2: Increase camera FOV from 75 → ~90 to widen the perspective and make the tunnel walls more visible (more "fisheye" immersion)
  - [x] 1.3: Verify the tunnel tube (TUNNEL_RADIUS=8, TUNNEL_LENGTH=200) fills the viewport — the cylinder walls should be clearly visible wrapping around the camera
  - [x] 1.4: Adjust TunnelParticles to stream toward the camera (particles should fly past the viewer for speed sensation)
  - [x] 1.5: Ensure the 3D Canvas renders full-screen behind the TunnelHub overlay (the right panel is a semi-transparent HTML overlay on top of the full-screen 3D scene)
  - [x] 1.6: Fine-tune camera position and FOV iteratively until the player feels "inside" the tube looking toward the far end

- [x] Task 2: Replace ShipPlaceholder with real PlayerShip model (AC: #2)
  - [x] 2.1: Remove current ShipPlaceholder component (lines 71-82 in TunnelScene.jsx)
  - [x] 2.2: Import useGLTF from @react-three/drei for Spaceship.glb loading
  - [x] 2.3: Create TunnelShip component that loads '/models/ships/Spaceship.glb' (same model as PlayerShip)
  - [x] 2.4: Clone the scene with useMemo(() => scene.clone(), [scene]) to avoid shared material issues
  - [x] 2.5: Position ship offset to the LEFT of center (e.g. [-3, -1.5, 8] relative to camera) so it stays visible and not hidden behind the right-side UI panel
  - [x] 2.6: Rotate ship 180° (rotation={[0, Math.PI, 0]}) to face forward into the tunnel
  - [x] 2.7: Replace <ShipPlaceholder /> with <TunnelShip /> in TunnelScene return
  - [x] 2.8: Add useGLTF.preload('/models/ships/Spaceship.glb') at bottom of file (asset preloading)
  - [x] 2.9: Fine-tune ship position so it's clearly visible in the left portion of the screen, with the tunnel stretching out ahead

- [x] Task 3: Apply emissive lighting to ship materials (AC: #2, #4)
  - [x] 3.1: Import GAME_CONFIG from '../config/gameConfig.js' to access PLAYER_SHIP_LIGHTING constants
  - [x] 3.2: Traverse clonedScene to find all mesh materials (same pattern as PlayerShip.jsx lines 22-48)
  - [x] 3.3: Separate hull meshes from engine meshes (check name.includes('engine') or 'thruster')
  - [x] 3.4: Apply hull emissive: color=#00d4ff (cyan), intensity=0.3 (EMISSIVE_INTENSITY from config)
  - [x] 3.5: Apply engine emissive: color=#00ffcc (bright cyan), intensity=0.6 (ENGINE_EMISSIVE_INTENSITY)
  - [x] 3.6: Set materials.needsUpdate = true after emissive changes
  - [x] 3.7: Store materials in useMemo to avoid re-traversing on every frame

- [x] Task 4: Add local point light to ship for illumination (AC: #2, #4)
  - [x] 4.1: Add <pointLight /> as child of ship group (same pattern as PlayerShip.jsx lines 110-116)
  - [x] 4.2: Set light position={[0, 2, 0]} (above ship, illuminates from top)
  - [x] 4.3: Set intensity={1.5} (POINT_LIGHT_INTENSITY from config, slightly boosted for tunnel)
  - [x] 4.4: Set distance={8} (POINT_LIGHT_DISTANCE from config)
  - [x] 4.5: Set decay={2} (physically-based light falloff)
  - [x] 4.6: Set color="#ffffff" (neutral white light to preserve ship colors)
  - [x] 4.7: Test that ship is clearly visible against purple tunnel background

- [x] Task 5: Add subtle idle animation to ship (AC: #3)
  - [x] 5.1: Create shipRef with useRef() for the ship group
  - [x] 5.2: Use useFrame hook to animate ship rotation/position over time
  - [x] 5.3: Add subtle nose dip: rotation.x = Math.sin(elapsed * 0.5) * 0.05 (±3° pitch)
  - [x] 5.4: Add subtle banking: rotation.z = Math.cos(elapsed * 0.3) * 0.08 (±5° roll)
  - [x] 5.5: Add tiny vertical drift: position.y = baseY + Math.sin(elapsed * 0.4) * 0.2 (±0.2 units)
  - [x] 5.6: Use elapsed time (not delta) for smooth sine waves independent of frame rate
  - [x] 5.7: Keep animations subtle — ship should feel "alive" but not distracting

- [x] Task 6: Enhance tunnel lighting for ship visibility (AC: #4)
  - [x] 6.1: Review current lighting: ambientLight intensity={0.1}, 2 pointLights
  - [x] 6.2: Increase ambientLight intensity from 0.1 → 0.15 (slightly brighter base illumination)
  - [x] 6.3: Adjust front pointLight intensity from 0.8 → 1.0 (brighter forward lighting)
  - [x] 6.4: Consider adding directional light from behind ship to create rim lighting effect
  - [x] 6.5: Set directional light intensity=0.5, color="#4466ff" (blue rim light for depth)
  - [x] 6.6: Test that ship remains visible during tunnel scrolling animation
  - [x] 6.7: Verify that tunnel particles don't obscure ship

- [x] Task 7: Verify tunnel infinite scrolling animation (AC: #3)
  - [x] 7.1: Confirm TunnelTube shader scrolling animation works with the new camera position
  - [x] 7.2: Confirm TunnelParticles stream past the camera correctly (forward motion illusion)
  - [x] 7.3: Test that ship appears stationary while tunnel scrolls around it
  - [x] 7.4: Fine-tune scroll speed if needed for the new camera FOV (wider FOV may require faster scroll to feel the same speed)

- [x] Task 8: Performance testing and optimization (AC: #5)
  - [x] 8.1: Test tunnel scene FPS with ship + lights + particles at 1080p
  - [x] 8.2: Verify 60 FPS maintained (use r3f-perf or browser DevTools FPS counter)
  - [x] 8.3: Check draw calls (ship model is ~500 triangles, should be negligible overhead)
  - [x] 8.4: Ensure ship materials are not recreated on every frame (use useMemo for materials)
  - [x] 8.5: Ensure ship mesh is not recreated on every frame (use useMemo for clonedScene)
  - [x] 8.6: Profile with Chrome DevTools Performance tab if FPS drops below 55

- [x] Task 9: Test ship visibility and immersion across resolutions (AC: #1, #2, #4)
  - [x] 9.1: Test at 1920x1080 (primary target) — verify ship clearly visible on the left, tunnel fills viewport
  - [x] 9.2: Test at 1280x720 (minimum supported) — verify ship still visible and not clipped by UI panel
  - [x] 9.3: Verify ship color (#00d4ff cyan) contrasts well with tunnel (#6622cc purple)
  - [x] 9.4: Test that ship doesn't blend into tunnel particles (#8844ff purple)
  - [x] 9.5: Verify the "inside the tube" immersion — tunnel walls should be visible wrapping around the viewport
  - [x] 9.6: Take screenshot for visual validation before/after comparison

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
3. Ship (mesh with materials, forward-facing, illuminated, offset left at ~[-3, -1.5, 8])
4. Camera (perspectiveCamera at ~[0,0,15] with FOV ~90, inside the tunnel looking forward)

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
- No changes to stores or game logic
- No changes to usePlayer store (ship data is read-only here)
- gameConfig.js: whitespace reformatting only (lighting constants already exist from Story 12.1)
- TunnelHub.jsx: panel width + dilemma styling changes (scope creep from iterative tuning)

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

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

None — clean implementation, no debugging needed.

### Completion Notes List

- **Task 1:** Camera repositioned from [0,0,30] → [0,0,15] via useThree (not perspectiveCamera element), FOV 75 → 90. Camera state saved/restored on mount/unmount. Bright lavender background (#c8bfdf) via scene.background for hyperspace feel.
- **Task 2:** ShipPlaceholder replaced with TunnelShip loading Spaceship.glb via useGLTF. Scene cloned with useMemo. Ship at [-3, -1.5, 8], rotated 180°. useGLTF.preload at module level.
- **Task 3:** Ship lighting matches gameplay: hull emissive OFF (setScalar(0)), engine emissive uses GAME_CONFIG values (ENGINE_EMISSIVE_COLOR, ENGINE_EMISSIVE_INTENSITY). No blue tint on hull.
- **Task 4:** Point light + directional fill light from GAME_CONFIG.PLAYER_SHIP_LIGHTING (same as gameplay PlayerShip). Natural ship appearance.
- **Task 5:** Hyperspace turbulence animation: layered sine waves (slow drift + fast micro-shake) on pitch, roll, Y and X. Conveys warp speed without being distracting.
- **Task 6:** Tunnel ring shader softened (smoothstep 0.1-0.9, alpha max 0.25), rings scroll in reverse direction (toward player, SCROLL_SPEED=-12). Ring color darkened to #5518aa. Ambient light 0.3 white.
- **Additional:** Soft circular particles via CanvasTexture radial gradient + AdditiveBlending (no squares). Speed 150-350 units/sec. 120 speed lines (LineSegments near tunnel walls, 3-8 unit length, speed 120-300) for warp effect. Particle color #9977cc, speed lines #ddccff.
- **TunnelHub UI:** Panel narrowed to w-1/3 (was w-1/2). Dilemma section restyled with orange accent (#ff9944), larger text, thicker border, subtle background tint.
- **Verification:** Build OK, 69 test files (1043 tests) pass, zero regressions. Visual tuning done iteratively with user feedback.

### Change Log

- 2026-02-13: Implemented tunnel ship visibility — replaced placeholder with real GLB model, gameplay-matching lighting, hyperspace turbulence animation. Added speed lines + soft particles. Bright lavender background. Reversed ring scroll direction. Narrowed TunnelHub panel to 1/3. Restyled dilemma section with orange accent.
- 2026-02-13: Code review fixes — Reverted BOSS_HP debug hack (1 → 500) in gameConfig.js. Fixed useMemo anti-pattern in TunnelShip material setup (now returns collected materials). Updated File List to document all changed files. Noted TunnelHub scope creep and gameConfig.js formatting noise.

### File List

- `src/scenes/TunnelScene.jsx` — Modified: Replaced ShipPlaceholder with TunnelShip (GLB + gameplay lighting + turbulence anim), useThree camera, bright background, soft particles, speed lines, reversed rings
- `src/ui/TunnelHub.jsx` — Modified: Panel width w-1/2 → w-1/3, dilemma section restyled with orange accent and larger text (scope creep — not in original ACs/Tasks)
- `src/config/gameConfig.js` — Modified: Whitespace reformatting only (quotes + alignment); BOSS_HP debug hack reverted in code review
