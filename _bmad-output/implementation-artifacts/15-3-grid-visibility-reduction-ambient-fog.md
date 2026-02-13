# Story 15.3: Grid Visibility Reduction & Ambient Fog

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the spatial grid to be subtle or hidden,
So that the space environment feels more immersive and less like a debug wireframe.

## Acceptance Criteria

1. **Given** the GroundPlane grid in GameplayScene **When** EnvironmentRenderer displays the grid **Then** the gridHelper opacity is reduced to near-invisible (color #0a0a0f or darker, very low contrast) **And** the grid provides subtle spatial orientation without being visually distracting **Or** the grid is completely removed and replaced with scattered reference points (dim light spots)

2. **Given** debug mode is enabled **When** the player activates debug controls **Then** the grid can be toggled on/off via a debug option **And** when toggled on, the grid is clearly visible for debugging purposes (bright cyan #00ffcc)

3. **Given** BossScene arena floor grid **When** the boss arena renders **Then** the gridHelper in ArenaFloor follows the same reduced visibility approach **And** the arena floor remains visually cohesive with the purple lighting theme

4. **Given** ambient fog is added (optional enhancement) **When** the scene includes fog **Then** a subtle THREE.Fog or THREE.FogExp2 is applied with a deep blue-black color (#050510) **And** fog density is very low (0.0001-0.0005) to add atmospheric depth without obscuring gameplay **And** fog affects distant stars and environment elements, enhancing depth perception

5. **Given** grid replacement with reference points **When** the grid is removed **Then** 10-15 small, dim point lights or particle clusters are scattered across the play area **And** these points provide spatial reference without forming a rigid grid pattern **And** points are cyan (#00ffcc, opacity 0.2-0.3) to match UI theme

## Tasks / Subtasks

- [ ] Task 1: Analyze current grid implementation (AC: #1, #3)
  - [ ] 1.1: Read EnvironmentRenderer.jsx GroundPlane component — note gridHelper args (gridSize, divisions 40, colors '#1a1a2e' / '#12121a')
  - [ ] 1.2: Read BossScene.jsx ArenaFloor component — note gridHelper args (gridSize, divisions 20, colors '#2a1040' / '#1a0828')
  - [ ] 1.3: Document current grid visibility and contrast levels
  - [ ] 1.4: Capture baseline screenshot of grid in GameplayScene and BossScene
  - [ ] 1.5: Identify grid visibility pain points (too distracting, breaks immersion)

- [ ] Task 2: Design grid visibility reduction approach (AC: #1, #3)
  - [ ] 2.1: Option A — Reduce grid color contrast (use darker colors closer to base plane color)
  - [ ] 2.2: Option B — Remove gridHelper entirely, replace with scattered reference points
  - [ ] 2.3: Decide on primary approach (recommend Option A for simplicity, Option B if grid removal desired)
  - [ ] 2.4: Define new grid colors for GameplayScene: main '#0d0d18', sub '#0a0a0f' (very low contrast)
  - [ ] 2.5: Define new grid colors for BossScene: main '#1a0828', sub '#0d0415' (purple-tinted, very low contrast)

- [ ] Task 3: Implement reduced-visibility grid in EnvironmentRenderer.jsx (AC: #1)
  - [ ] 3.1: Update GroundPlane gridHelper colors from '#1a1a2e' / '#12121a' to '#0d0d18' / '#0a0a0f'
  - [ ] 3.2: Test grid visibility in GameplayScene — should be barely visible, subtle spatial orientation
  - [ ] 3.3: Optionally reduce grid divisions from 40 to 30 or 20 (fewer lines = less visual clutter)
  - [ ] 3.4: Verify grid still provides spatial reference without being distracting
  - [ ] 3.5: Capture after screenshot for comparison

- [ ] Task 4: Implement reduced-visibility grid in BossScene.jsx (AC: #3)
  - [ ] 4.1: Update ArenaFloor gridHelper colors from '#2a1040' / '#1a0828' to '#1a0828' / '#0d0415'
  - [ ] 4.2: Test grid visibility in BossScene — should be barely visible, cohesive with purple theme
  - [ ] 4.3: Optionally reduce grid divisions from 20 to 15 (fewer lines for cleaner look)
  - [ ] 4.4: Verify grid blends with purple lighting and doesn't distract from boss fight
  - [ ] 4.5: Capture after screenshot for comparison

- [ ] Task 5: Add debug grid toggle (AC: #2)
  - [ ] 5.1: Add DEBUG_GRID_VISIBLE config option to gameConfig.js (default: false for production)
  - [ ] 5.2: Update GroundPlane to conditionally render bright debug grid when DEBUG_GRID_VISIBLE === true
  - [ ] 5.3: Debug grid colors: main '#00ffcc', sub '#00aaaa' (bright cyan, high contrast)
  - [ ] 5.4: Add Leva debug control for DEBUG_GRID_VISIBLE toggle (if Leva panel exists)
  - [ ] 5.5: Test debug toggle — grid should switch between subtle (off) and bright cyan (on)

- [ ] Task 6: Implement ambient fog (optional enhancement, AC: #4)
  - [ ] 6.1: Decide if fog should be added (enhances depth but adds visual layer — test first)
  - [ ] 6.2: Add AMBIENT_FOG config section to gameConfig.js (enabled, color, density)
  - [ ] 6.3: Add <fog> element to GameplayScene with THREE.FogExp2, color '#050510', density 0.0003
  - [ ] 6.4: Test fog visibility — should add subtle depth without obscuring enemies or player
  - [ ] 6.5: Tune fog density (0.0001-0.0005 range) for optimal atmospheric effect
  - [ ] 6.6: Optionally add fog to BossScene with purple-tinted color '#0a0515'
  - [ ] 6.7: Verify fog doesn't impact gameplay clarity or FPS

- [ ] Task 7: Implement scattered reference points (alternative to grid, AC: #5)
  - [ ] 7.1: If grid removal is chosen, create SpatialReferencePoints component
  - [ ] 7.2: Generate 10-15 random positions within play area (avoid center spawn zone)
  - [ ] 7.3: Render small point lights or particle clusters at each position
  - [ ] 7.4: Point lights: color '#00ffcc', intensity 0.5, distance 20, opacity 0.2-0.3
  - [ ] 7.5: Ensure reference points are visible but non-distracting
  - [ ] 7.6: Test spatial orientation with reference points vs. grid

- [ ] Task 8: Update gameConfig.js with new environment settings (AC: #1, #2, #4)
  - [ ] 8.1: Add ENVIRONMENT_VISUAL_EFFECTS section if not already present (Story 15.2 may have added it)
  - [ ] 8.2: Add GRID_VISIBILITY subsection with colors, debug toggle, visibility mode
  - [ ] 8.3: Example: GRID_VISIBLE_DEFAULT: false, GRID_DEBUG_COLOR: '#00ffcc', GRID_SUBTLE_COLORS: {...}
  - [ ] 8.4: Add AMBIENT_FOG subsection with enabled flag, color, density
  - [ ] 8.5: Document all new config options with inline comments

- [ ] Task 9: Visual testing and tuning (AC: #1, #3, #4)
  - [ ] 9.1: Test GameplayScene with reduced-visibility grid — should be subtle, not distracting
  - [ ] 9.2: Test BossScene with reduced-visibility grid — should blend with purple theme
  - [ ] 9.3: Test debug grid toggle — bright cyan grid appears when enabled
  - [ ] 9.4: If fog added, test fog depth effect — subtle atmospheric enhancement
  - [ ] 9.5: Test at different camera angles and distances — grid visibility remains consistent
  - [ ] 9.6: Compare before/after screenshots — clear immersion improvement

- [ ] Task 10: Performance validation (NFR1)
  - [ ] 10.1: Profile GameplayScene FPS with reduced grid (should be same as before)
  - [ ] 10.2: If fog added, profile FPS impact (THREE.Fog has minimal cost, ~0.1ms)
  - [ ] 10.3: If reference points added, profile FPS with 10-15 point lights (negligible cost)
  - [ ] 10.4: Verify 60 FPS maintained in all scenarios
  - [ ] 10.5: Check draw calls — grid reduction doesn't add draw calls, fog adds none

- [ ] Task 11: Edge case testing
  - [ ] 11.1: Test grid visibility during camera shake (damage feedback) — should remain subtle
  - [ ] 11.2: Test grid visibility during dash (high-speed movement) — should not become distracting
  - [ ] 11.3: Test fog (if added) at play area boundaries — fog should not reveal boundary walls prematurely
  - [ ] 11.4: Test debug grid toggle during gameplay — should work seamlessly
  - [ ] 11.5: Test grid visibility against multi-layer starfield (Story 15.2) — should complement, not clash

- [ ] Task 12: Documentation and code review preparation
  - [ ] 12.1: Document grid visibility changes in EnvironmentRenderer.jsx inline comments
  - [ ] 12.2: Document debug toggle usage in gameConfig.js comments
  - [ ] 12.3: If fog added, document fog config and tuning guidance
  - [ ] 12.4: Prepare before/after comparison screenshots
  - [ ] 12.5: Update Dev Agent Record with completion notes and file list

## Dev Notes

### Epic Context

This story is part of **Epic 15: Visual Polish - Space Environment Enhancement**, which aims to create a visually rich and immersive space environment with proper lighting consistency, parallax starfield effects, reduced grid visibility, and ambient light zones.

**Epic Goals:**
- Unify player ship lighting across all game scenes (Story 15.1)
- Create multi-layer starfield with parallax effect (Story 15.2)
- **Reduce or eliminate visible grid lines that break immersion (Story 15.3 — THIS STORY)**
- Add ambient light zones and nebula-like effects (Story 15.4)

**Current Problem:**
The spatial grid in both GameplayScene and BossScene uses relatively bright colors (#1a1a2e, #12121a for gameplay; #2a1040, #1a0828 for boss) that create a visible "debug wireframe" aesthetic. This breaks immersion and makes the space environment feel like a development scene rather than a polished game environment.

**Story 15.3 Goal:**
Transform the grid from a visible debug tool into a subtle spatial reference that provides orientation without visual distraction. The grid should be barely visible in normal gameplay, with an optional debug toggle for development.

**Story Sequence in Epic:**
- Story 15.1 (Unified Player Lighting) → Ready-for-dev — Lighting consistency across scenes
- Story 15.2 (Multi-Layer Starfield) → Ready-for-dev — Parallax depth effect
- **Story 15.3 (Grid Visibility Reduction) → THIS STORY** — Immersive environment polish
- Story 15.4 (Ambient Light Zones) → Backlog — Nebula effects and color variation

### Architecture Context

**6-Layer Architecture Alignment:**
- **Config/Data Layer** → gameConfig.js (new ENVIRONMENT_VISUAL_EFFECTS.GRID_VISIBILITY section)
- **Rendering Layer** → EnvironmentRenderer.jsx (GroundPlane grid color update), BossScene.jsx (ArenaFloor grid color update)
- **Scenes Layer** → GameplayScene.jsx (uses EnvironmentRenderer), BossScene.jsx (ArenaFloor inline component)
- **No Systems Layer** → Pure visual enhancement, no game logic changes
- **No Stores** → No state changes (grid visibility is static config or debug toggle)
- **No UI Layer** → No UI changes (purely 3D rendering improvements)

**Existing Infrastructure:**

**EnvironmentRenderer.jsx GroundPlane (lines 106-122):**
```javascript
function GroundPlane() {
  const gridSize = PLAY_AREA_SIZE * 2.2  // gridSize = 2000 * 2.2 = 4400
  return (
    <group>
      {/* Semi-transparent dark base plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial color="#0a0a0f" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      {/* Subtle grid for spatial orientation */}
      <gridHelper
        args={[gridSize, 40, '#1a1a2e', '#12121a']}  // 40 divisions, colors: main / sub
        position={[0, 0, 0]}
      />
    </group>
  )
}
```

**Current Grid Analysis:**
- **GridHelper Args:** `[size: 4400, divisions: 40, colorCenterLine: '#1a1a2e', colorGrid: '#12121a']`
- **ColorCenterLine (#1a1a2e):** RGB(26, 26, 46) — slightly blue-tinted dark gray
- **ColorGrid (#12121a):** RGB(18, 18, 26) — very dark blue-tinted gray
- **Base Plane Color (#0a0a0f):** RGB(10, 10, 15) — almost black with slight blue tint
- **Contrast Issue:** Center line (#1a1a2e) is ~16 luminance units brighter than base plane (#0a0a0f = ~10 luminance), creating visible grid lines

**BossScene.jsx ArenaFloor (lines 53-64):**
```javascript
function ArenaFloor() {
  const gridSize = ARENA_SIZE * 2.2  // ARENA_SIZE = 400, gridSize = 880
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial color="#0a0015" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <gridHelper args={[gridSize, 20, '#2a1040', '#1a0828']} position={[0, 0, 0]} />
    </group>
  )
}
```

**Boss Arena Grid Analysis:**
- **GridHelper Args:** `[size: 880, divisions: 20, colorCenterLine: '#2a1040', colorGrid: '#1a0828']`
- **ColorCenterLine (#2a1040):** RGB(42, 16, 64) — purple-tinted, relatively bright
- **ColorGrid (#1a0828):** RGB(26, 8, 40) — darker purple
- **Base Plane Color (#0a0015):** RGB(10, 0, 21) — very dark purple-tinted black
- **Contrast Issue:** Center line (#2a1040) is significantly brighter (~40 luminance) than base plane (~15 luminance), creating visible purple grid

**Story 15.3 Approach:**

**Primary Strategy: Reduce Color Contrast**
- GameplayScene: Darken grid colors to near-base-plane levels
  - New ColorCenterLine: `#0d0d18` — RGB(13, 13, 24) — very close to base plane #0a0a0f
  - New ColorGrid: `#0a0a0f` — RGB(10, 10, 15) — matches base plane exactly
  - Result: Grid barely visible, provides subtle spatial reference without distraction
- BossScene: Darken purple grid colors to match arena floor
  - New ColorCenterLine: `#1a0828` — RGB(26, 8, 40) — matches current ColorGrid
  - New ColorGrid: `#0d0415` — RGB(13, 4, 21) — very close to base plane #0a0015
  - Result: Purple-tinted grid barely visible, cohesive with boss arena theme

**Secondary Strategy: Debug Toggle**
- Add `DEBUG_GRID_VISIBLE` config flag (default: false)
- When true, use bright cyan colors for grid visibility: `#00ffcc` (main), `#00aaaa` (sub)
- Integrate with existing debug system (Leva panels, debug console)

**Optional Enhancement: Ambient Fog**
- Add THREE.FogExp2 to GameplayScene with color `#050510`, density `0.0003`
- Fog adds atmospheric depth without obscuring gameplay
- Affects distant stars and environment, enhances sense of space
- Boss arena fog (optional): purple-tinted `#0a0515`, density `0.0002`

**Alternative Strategy: Reference Points (If Grid Removal Desired)**
- Remove gridHelper entirely
- Replace with 10-15 scattered point lights or particle clusters
- Colors: cyan `#00ffcc`, opacity 0.2-0.3, distance 20-30 units
- Positioned randomly within play area, avoiding center spawn zone
- Provides spatial reference without rigid grid pattern

### Technical Requirements

**gameConfig.js additions (new ENVIRONMENT_VISUAL_EFFECTS.GRID_VISIBILITY section):**

```javascript
// Environment Visual Effects (Story 15.3 - Grid Visibility)
ENVIRONMENT_VISUAL_EFFECTS: {
  // ... STARFIELD_LAYERS from Story 15.2 ...

  GRID_VISIBILITY: {
    // Gameplay scene grid
    GAMEPLAY: {
      enabled: true,                    // Set to false to hide grid entirely
      divisions: 40,                    // Grid line divisions (40 = original, reduce to 30/20 for fewer lines)
      colorCenterLine: '#0d0d18',      // Very dark blue-gray, barely visible
      colorGrid: '#0a0a0f',            // Matches base plane color, nearly invisible
    },
    // Boss scene grid
    BOSS: {
      enabled: true,
      divisions: 20,
      colorCenterLine: '#1a0828',      // Dark purple, barely visible
      colorGrid: '#0d0415',            // Very dark purple, nearly invisible
    },
    // Debug mode (bright grid for development)
    DEBUG: {
      enabled: false,                   // Toggle via Leva or debug console
      colorCenterLine: '#00ffcc',      // Bright cyan for high visibility
      colorGrid: '#00aaaa',            // Darker cyan for sub-lines
    },
  },

  AMBIENT_FOG: {
    enabled: false,                     // Set to true to enable fog (optional enhancement)
    gameplay: {
      color: '#050510',                 // Deep blue-black fog color
      density: 0.0003,                  // Very low density (0.0001-0.0005 range)
    },
    boss: {
      color: '#0a0515',                 // Purple-tinted fog for boss arena
      density: 0.0002,                  // Even lower density for smaller arena
    },
  },
},
```

**EnvironmentRenderer.jsx GroundPlane update:**

```javascript
import { GAME_CONFIG } from '../config/gameConfig.js'

const { GRID_VISIBILITY } = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS

function GroundPlane() {
  const gridSize = GAME_CONFIG.PLAY_AREA_SIZE * 2.2

  // Use debug colors if debug mode active, otherwise subtle colors
  const gridConfig = GRID_VISIBILITY.DEBUG.enabled
    ? GRID_VISIBILITY.DEBUG
    : GRID_VISIBILITY.GAMEPLAY

  return (
    <group>
      {/* Semi-transparent dark base plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial color="#0a0a0f" transparent opacity={0.2} depthWrite={false} />
      </mesh>

      {/* Conditionally render grid if enabled */}
      {gridConfig.enabled && (
        <gridHelper
          args={[
            gridSize,
            gridConfig.divisions || GRID_VISIBILITY.GAMEPLAY.divisions,
            gridConfig.colorCenterLine,
            gridConfig.colorGrid,
          ]}
          position={[0, 0, 0]}
        />
      )}
    </group>
  )
}
```

**BossScene.jsx ArenaFloor update:**

```javascript
import { GAME_CONFIG } from '../config/gameConfig.js'

const { GRID_VISIBILITY } = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS

function ArenaFloor() {
  const gridSize = GAME_CONFIG.BOSS_ARENA_SIZE * 2.2

  // Use debug colors if debug mode active, otherwise subtle boss colors
  const gridConfig = GRID_VISIBILITY.DEBUG.enabled
    ? GRID_VISIBILITY.DEBUG
    : GRID_VISIBILITY.BOSS

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial color="#0a0015" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {gridConfig.enabled && (
        <gridHelper
          args={[
            gridSize,
            gridConfig.divisions || GRID_VISIBILITY.BOSS.divisions,
            gridConfig.colorCenterLine,
            gridConfig.colorGrid,
          ]}
          position={[0, 0, 0]}
        />
      )}
    </group>
  )
}
```

**Optional: GameplayScene with Ambient Fog:**

```javascript
import { GAME_CONFIG } from '../config/gameConfig.js'

const { AMBIENT_FOG } = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS

export default function GameplayScene() {
  return (
    <>
      {/* Add fog to scene (applies to all rendering) */}
      {AMBIENT_FOG.enabled && (
        <fog attach="fog" args={[AMBIENT_FOG.gameplay.color, AMBIENT_FOG.gameplay.density]} />
      )}

      {/* ... rest of GameplayScene components ... */}
    </>
  )
}
```

**Note on THREE.Fog vs THREE.FogExp2:**
- `<fog>` in R3F maps to THREE.Fog (linear fog: near/far distance)
- For exponential fog (density-based), use `<fogExp2>`: `<fogExp2 attach="fog" args={[color, density]} />`
- Recommended: THREE.FogExp2 for space environment (density-based, no hard cutoff)

**Fog Implementation in R3F:**
```jsx
{AMBIENT_FOG.enabled && (
  <fogExp2
    attach="fog"
    args={[AMBIENT_FOG.gameplay.color, AMBIENT_FOG.gameplay.density]}
  />
)}
```

### Previous Story Intelligence

**From Story 15.2 (Multi-Layer Starfield with Parallax):**
- **Goal:** Create 3-layer starfield (distant, mid, near) with parallax motion for depth perception
- **Implementation:** EnvironmentRenderer.jsx refactored with StarfieldLayer components, parallax via useFrame
- **Status:** Ready-for-dev (may be implemented before or during Story 15.3 dev)
- **Impact on Story 15.3:** Multi-layer starfield creates rich background — reduced grid visibility will prevent grid from clashing with starfield layers

**Applied to Story 15.3:**
- Subtle grid complements multi-layer starfield (grid doesn't compete visually with stars)
- Fog (if added) affects starfield layers, enhancing depth created by parallax
- Grid reduction + starfield parallax = cohesive immersive environment

**From Story 15.1 (Unified Player Lighting Across All Scenes):**
- **Goal:** Consistent player ship lighting in GameplayScene, BossScene, TunnelScene
- **Approach:** Add directional fill light to all scenes
- **Status:** Ready-for-dev
- **Impact on Story 15.3:** No conflict — lighting changes don't affect grid or fog

**From Story 1.3 (Space Environment & Boundaries):**
- **Grid Creation:** GroundPlane introduced with gridHelper for spatial orientation
- **Original Grid Colors:** '#1a1a2e' (center), '#12121a' (grid) — relatively bright, visible
- **Design Intent:** Provide spatial reference in vast play area (4000x4000 units)
- **Problem:** Grid too visible, creates debug wireframe aesthetic

**Applied to Story 15.3:**
- Story 15.3 directly addresses Story 1.3's grid visibility issue
- Maintains spatial reference function while drastically reducing visual presence
- Debug toggle allows developers to restore original bright grid when needed

**From Story 14.1 (Camera Top View & Rotation Decoupling):**
- **Camera Position:** Top-down view, follows player with slight lag
- **Camera Angle:** Fixed top-down angle (no rotation)
- **Impact on Grid:** Top-down view makes horizontal grid highly visible — grid reduction critical for immersion

**Applied to Story 15.3:**
- Top-down camera means grid is always in view — subtle colors essential
- Camera lag (from Story 14.1) doesn't affect grid visibility (grid is static)

**From Story 6.2 (Boss Arena Combat):**
- **Boss Arena:** Purple-themed arena with custom ArenaFloor grid
- **Grid Colors:** Purple-tinted '#2a1040' / '#1a0828' — matches arena aesthetic but too visible
- **Design Intent:** Purple grid complements boss purple lighting

**Applied to Story 15.3:**
- Story 15.3 preserves purple theme while reducing grid visibility
- New colors (#1a0828 / #0d0415) maintain purple tint but much darker

**From Git History (Recent Commits):**
- **afe39a1:** Tunnel ship visibility with GLB model and hyperspace effects (Story 13.3) — no grid changes
- **bd4e071:** Infinite level XP scaling (Story 14.3) — no environment changes
- **3e5422c:** Organic ship movement (Story 14.2) — no environment changes
- **e76871f:** Top-down camera (Story 14.1) — **RELEVANT:** camera angle makes grid highly visible, grid reduction needed
- Recent commits focus on gameplay systems — no recent environment polish beyond Story 14.1 camera

**Key Takeaway from Git:**
- No recent grid changes since Story 1.3 (initial creation)
- Story 15.3 is first environment polish pass on grid visibility
- Story 14.1 camera change (top-down) makes grid reduction more important

### Architecture Guardrails

**File Structure Requirements (Architecture.md):**
```
src/config/gameConfig.js                    — Add ENVIRONMENT_VISUAL_EFFECTS.GRID_VISIBILITY section
src/renderers/EnvironmentRenderer.jsx       — Update GroundPlane gridHelper colors + conditional rendering
src/scenes/BossScene.jsx                    — Update ArenaFloor gridHelper colors + conditional rendering
src/scenes/GameplayScene.jsx                — Optional: Add <fogExp2> if AMBIENT_FOG enabled
```

**Layer Boundaries (Architecture.md 6-Layer):**
- **Config Layer** — gameConfig.js adds GRID_VISIBILITY and AMBIENT_FOG config (pure data)
- **Rendering Layer** — EnvironmentRenderer.jsx (GroundPlane), BossScene.jsx (ArenaFloor) update gridHelper colors
- **Scenes Layer** — GameplayScene, BossScene optionally add fog
- **No Systems** — No game logic changes (pure visual enhancement)
- **No Stores** — No state changes (grid config is static, fog is scene-level)
- **No GameLoop** — No centralized game loop changes

**Anti-Patterns to AVOID:**
- DO NOT remove spatial orientation entirely (grid provides important reference in large play area)
- DO NOT use overly bright debug colors in production builds (debug toggle should default to false)
- DO NOT add high-density fog that obscures gameplay (fog density must be very low: 0.0001-0.0005)
- DO NOT create per-frame grid updates (grid colors are static, set once)
- DO NOT add fog to TunnelScene (tunnel has custom scrolling background, fog may conflict)
- DO NOT hardcode grid colors in components (use gameConfig.js for tunability)

**Coding Standards (Architecture.md Naming):**
- Config section: `SCREAMING_CAPS` → `ENVIRONMENT_VISUAL_EFFECTS`, `GRID_VISIBILITY`, `AMBIENT_FOG`
- Config properties: `camelCase` → `colorCenterLine`, `colorGrid`, `enabled`, `divisions`
- Component: `PascalCase` → `GroundPlane`, `ArenaFloor`
- Variables: `camelCase` → `gridConfig`, `gridSize`

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- Grid color changes: Zero performance impact (gridHelper is static geometry, colors set once)
- Grid removal (if chosen): Saves ~0.1ms per frame (one less draw call)
- Fog (if added): THREE.FogExp2 has minimal cost (~0.05-0.1ms per frame on mid-range GPU)
- Reference points (if added): 10-15 point lights = ~0.2-0.3ms (negligible, within budget)
- **Net Performance Impact:** Neutral or slight improvement (grid removal saves more than fog costs)

**NFR4: Scene Transitions < 2 seconds:**
- Grid changes are static configuration — no impact on scene transitions
- Fog is created once on scene mount — negligible memory/load time
- No additional assets to load (grid and fog are procedural)

**Implementation Optimization Checklist:**
- [x] Use static grid colors (no per-frame updates) — zero runtime cost
- [x] Conditionally render grid based on config — allows complete removal if desired
- [x] Keep fog density very low (0.0001-0.0005) — minimal shader cost
- [x] Avoid excessive reference points (10-15 max) — low light count overhead
- [x] No new geometries or textures — purely color/visibility changes

**Memory Profile:**
- Grid color changes: Zero memory impact (same gridHelper, different colors)
- Fog: ~100 bytes (fog parameters) — negligible
- Reference points (if added): 10-15 light objects * ~200 bytes = ~3KB — negligible
- Total memory overhead: < 5KB (no impact on 30-min session memory usage)

### Testing Checklist

**Functional Testing (Grid Visibility):**
- [ ] GameplayScene grid is barely visible with new colors (#0d0d18 / #0a0a0f)
- [ ] GameplayScene grid still provides subtle spatial orientation
- [ ] BossScene arena grid is barely visible with purple-tinted colors (#1a0828 / #0d0415)
- [ ] BossScene arena grid blends cohesively with purple lighting theme
- [ ] Grid visibility is consistent at different camera angles (top-down view)
- [ ] Grid does not distract from gameplay or visual focal points (player ship, enemies)

**Debug Toggle Testing (AC: #2):**
- [ ] Debug grid toggle defaults to false (subtle grid in production)
- [ ] When debug toggle enabled, grid switches to bright cyan (#00ffcc / #00aaaa)
- [ ] Debug grid is clearly visible and useful for spatial debugging
- [ ] Debug toggle works in both GameplayScene and BossScene
- [ ] Debug toggle can be controlled via Leva panel (if integrated)
- [ ] Debug toggle state persists across scenes (if state management added)

**Ambient Fog Testing (Optional, AC: #4):**
- [ ] Fog (if enabled) adds subtle atmospheric depth to GameplayScene
- [ ] Fog density is very low (0.0001-0.0005) and doesn't obscure enemies or player
- [ ] Fog affects distant stars, enhancing multi-layer starfield depth (Story 15.2)
- [ ] Fog color (#050510 deep blue-black) complements space theme
- [ ] Boss arena fog (if added) uses purple-tinted color (#0a0515)
- [ ] Boss arena fog density is appropriate for smaller arena size
- [ ] Fog doesn't reveal boundary walls prematurely

**Reference Points Testing (Alternative, AC: #5):**
- [ ] If grid removed, 10-15 reference points are scattered across play area
- [ ] Reference points are dim and non-distracting (cyan #00ffcc, opacity 0.2-0.3)
- [ ] Reference points provide spatial orientation without rigid grid pattern
- [ ] Reference points avoid center spawn zone (no interference with spawning)
- [ ] Reference points are visible but don't compete with gameplay visuals

**Performance Testing (NFR1, NFR4):**
- [ ] 60 FPS maintained in GameplayScene with reduced-visibility grid
- [ ] 60 FPS maintained in BossScene with reduced-visibility grid
- [ ] If fog added, 60 FPS maintained with fog active (fog cost < 0.1ms)
- [ ] If reference points added, 60 FPS maintained with 10-15 point lights
- [ ] No frame drops during scene transitions (menu → gameplay → boss)
- [ ] No visual glitches or flickering with new grid colors

**Visual Comparison Testing:**
- [ ] Capture before screenshots (original bright grid in GameplayScene + BossScene)
- [ ] Capture after screenshots (subtle grid in GameplayScene + BossScene)
- [ ] Compare immersion quality — after should feel significantly more polished
- [ ] Compare spatial orientation — after should still provide subtle reference
- [ ] Grid reduction creates noticeable immersion improvement

**Integration Testing with Epic 15 Stories:**
- [ ] Reduced grid complements multi-layer starfield (Story 15.2, if implemented)
- [ ] Grid doesn't clash with starfield layers (distant, mid, near stars)
- [ ] Grid visibility works with unified player lighting (Story 15.1, if implemented)
- [ ] Grid reduction enhances overall space environment polish (Epic 15 goal)

**Edge Case Testing:**
- [ ] Grid visibility during camera shake (damage feedback) — remains subtle
- [ ] Grid visibility during dash (high-speed movement) — doesn't become distracting
- [ ] Grid visibility at play area boundaries — provides orientation without revealing walls early
- [ ] Debug grid toggle during active gameplay — seamless transition
- [ ] Grid colors work with different monitor brightness/contrast settings

**User Experience Testing:**
- [ ] Grid no longer feels like debug wireframe
- [ ] Space environment feels more immersive and polished
- [ ] Spatial orientation is still intuitive (players don't feel lost)
- [ ] Grid reduction enhances overall visual quality without sacrificing function

### UX Design Specification Compliance

**From UX Doc (Epic 15 Context):**
- **Visual Polish & Player Readability** — Epic 15 focuses on creating visually rich, immersive space environment with reduced visual clutter
- **Immersion** — Grid reduction removes debug wireframe aesthetic, enhancing immersion
- **Spatial Orientation** — Subtle grid maintains spatial reference without distraction

**Story 15.3 Specific Requirements:**
- **Grid Visibility:** Near-invisible in normal gameplay (colors close to base plane)
- **Debug Toggle:** Bright cyan grid available for development debugging (not visible to players)
- **Ambient Fog:** Optional enhancement for atmospheric depth (very low density, doesn't obscure gameplay)
- **Consistency Across Scenes:** Both GameplayScene and BossScene use reduced-visibility grids

**Color System (from UX Doc + Epic 15):**
- **Gameplay Grid Colors:** `#0d0d18` (center), `#0a0a0f` (grid) — very dark blue-gray, barely visible
- **Boss Grid Colors:** `#1a0828` (center), `#0d0415` (grid) — dark purple-tinted, cohesive with arena theme
- **Debug Grid Colors:** `#00ffcc` (center), `#00aaaa` (grid) — bright cyan for high visibility (matches UI theme)
- **Fog Color:** `#050510` (gameplay), `#0a0515` (boss) — deep blue-black / purple-tinted

**Visual Hierarchy (from UX Doc):**
- **Primary Focus:** Player ship, enemies, projectiles — highest contrast and brightness
- **Secondary Focus:** UI elements (HUD, minimap) — moderate contrast
- **Tertiary Focus:** Environment (starfield, boundaries) — subtle, non-distracting
- **Background:** Grid and fog — barely visible, provides orientation without competing for attention

**Animation Timing (from UX Doc):**
- **Grid:** Static (no animation) — instant visibility change on debug toggle
- **Fog:** Static (no animation) — constant atmospheric effect

**Accessibility Considerations:**
- **Spatial Orientation:** Subtle grid + fog maintain spatial reference for all players
- **Debug Mode:** Bright grid available for visually impaired developers who need high-contrast spatial reference
- **Performance:** Grid reduction + fog have zero accessibility impact (no FPS drop, no visual obfuscation)

### References

- [Source: _bmad-output/planning-artifacts/epic-15-space-environment-enhancement.md#Story 15.3 — Complete AC and story text]
- [Source: src/renderers/EnvironmentRenderer.jsx#GroundPlane — Current grid implementation (lines 106-122), colors '#1a1a2e' / '#12121a']
- [Source: src/scenes/BossScene.jsx#ArenaFloor — Boss arena grid (lines 53-64), colors '#2a1040' / '#1a0828']
- [Source: src/config/gameConfig.js — Current environment config (STAR_COUNT, STAR_FIELD_RADIUS, PLAY_AREA_SIZE, BOUNDARY_* constants)]
- [Source: _bmad-output/implementation-artifacts/15-2-multi-layer-starfield-parallax.md — Story 15.2 starfield layers (grid must complement starfield)]
- [Source: _bmad-output/implementation-artifacts/15-1-unified-player-lighting-all-scenes.md — Story 15.1 lighting pattern (no conflict with grid)]
- [Source: _bmad-output/implementation-artifacts/1-3-space-environment-boundaries.md — Story 1.3 original grid creation]
- [Source: _bmad-output/implementation-artifacts/14-1-camera-top-view-rotation-decoupling.md — Story 14.1 camera (top-down view makes grid highly visible)]
- [Source: _bmad-output/implementation-artifacts/6-2-boss-arena-combat.md — Story 6.2 boss arena creation with purple grid]
- [Source: _bmad-output/planning-artifacts/architecture.md#Rendering Layer — Rendering patterns, 6-layer architecture]
- [Three.js GridHelper docs: https://threejs.org/docs/#api/en/helpers/GridHelper]
- [Three.js Fog docs: https://threejs.org/docs/#api/en/scenes/Fog]
- [Three.js FogExp2 docs: https://threejs.org/docs/#api/en/scenes/FogExp2]
- [React Three Fiber fog element: https://docs.pmnd.rs/react-three-fiber/api/objects#fog]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

