# Story 15.4: Ambient Light Zones & Nebula Effects

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see varied lighting zones and nebula-like effects in space,
So that the environment feels more alive and less uniformly dark.

## Acceptance Criteria

1. **Given** the space environment in GameplayScene **When** ambient light zones are added **Then** 2-3 zones of colored ambient light are placed asymmetrically in the play area **And** zones use soft colors: deep blue (#1a2a4a), purple (#2a1a4a), cyan (#1a3a3a) **And** each zone is a large, semi-transparent plane or sphere with gradient/radial opacity **And** zones are positioned far from the player origin (500-1000 units away) to avoid direct interference

2. **Given** nebula effects **When** rendered in the environment **Then** nebulae use meshBasicMaterial with opacity 0.05-0.15 to avoid performance cost **And** nebulae are large (500-1000 unit radius) billboards or spheres with gradient textures **And** nebula colors complement the UI palette (cyan, magenta, deep blue, purple)

3. **Given** base space color **When** the GroundPlane or space background is rendered **Then** the base color is slightly brighter than the current #0a0a0f (suggest #0d0d18 or #0f0f1a) **And** the increased brightness is subtle and doesn't wash out the starfield or UI elements

4. **Given** light zones and nebulae **When** the player moves through the play area **Then** the zones create subtle variations in ambient brightness **And** the player notices atmospheric depth without harsh lighting changes **And** the zones do not interfere with enemy visibility or gameplay clarity

5. **Given** performance **When** ambient light zones and nebulae are rendered **Then** the scene maintains 60 FPS with all environmental effects active **And** memory usage remains within acceptable limits (nebulae are static, no dynamic updates)

6. **Given** BossScene **When** ambient effects are considered **Then** BossScene already has purple lighting and may not need additional nebulae **Or** a single subtle purple nebula is added to enhance the boss arena's atmosphere **And** the boss arena's visual identity (purple theme) is preserved

## Tasks / Subtasks

- [ ] Task 1: Design ambient light zone system (AC: #1, #4)
  - [ ] 1.1: Determine number and placement of light zones (2-3 zones, positioned 500-1000 units from origin)
  - [ ] 1.2: Define zone positions asymmetrically across play area (avoid symmetrical grid pattern)
  - [ ] 1.3: Select zone colors: deep blue (#1a2a4a), purple (#2a1a4a), cyan (#1a3a3a)
  - [ ] 1.4: Decide zone geometry: large planes (billboards) vs spheres (volumetric feel)
  - [ ] 1.5: Design gradient/radial opacity for smooth light falloff

- [ ] Task 2: Design nebula effect system (AC: #2)
  - [ ] 2.1: Determine nebula count (2-3 nebulae, one per light zone or separate)
  - [ ] 2.2: Select nebula size range (500-1000 unit radius for large-scale effect)
  - [ ] 2.3: Choose nebula colors: cyan (#00ffcc), magenta (#ff00ff), purple (#cc66ff), deep blue (#1a2a4a)
  - [ ] 2.4: Design nebula geometry: billboards (always face camera) vs spheres (volumetric)
  - [ ] 2.5: Plan gradient texture or radial opacity for nebula appearance

- [ ] Task 3: Update gameConfig.js with ambient effects configuration (AC: #1, #2, #3)
  - [ ] 3.1: Add ENVIRONMENT_VISUAL_EFFECTS.AMBIENT_LIGHT_ZONES section
  - [ ] 3.2: Define zone configuration: positions, colors, sizes, opacity
  - [ ] 3.3: Add ENVIRONMENT_VISUAL_EFFECTS.NEBULAE section
  - [ ] 3.4: Define nebula configuration: positions, colors, sizes, opacity
  - [ ] 3.5: Update GROUND_PLANE_BASE_COLOR from #0a0a0f to #0d0d18 or #0f0f1a

- [ ] Task 4: Create AmbientLightZones component (AC: #1, #4)
  - [ ] 4.1: Create new component in EnvironmentRenderer.jsx or separate file
  - [ ] 4.2: Import AMBIENT_LIGHT_ZONES config from gameConfig.js
  - [ ] 4.3: Render 2-3 light zones based on config positions
  - [ ] 4.4: Use meshBasicMaterial with zone color, opacity, transparent, depthWrite={false}
  - [ ] 4.5: If using planes (billboards), ensure they always face camera or use cylindrical billboards
  - [ ] 4.6: If using spheres, use large radius (500-1000) with low opacity for volumetric effect

- [ ] Task 5: Create NebulaRenderer component (AC: #2, #4)
  - [ ] 5.1: Create new component in EnvironmentRenderer.jsx or separate file
  - [ ] 5.2: Import NEBULAE config from gameConfig.js
  - [ ] 5.3: Render 2-3 nebulae based on config positions
  - [ ] 5.4: Use meshBasicMaterial with nebula color, opacity 0.05-0.15, transparent, depthWrite={false}
  - [ ] 5.5: Generate or use gradient texture for radial opacity falloff (bright center → transparent edge)
  - [ ] 5.6: If using billboards, ensure rotation always faces camera (useFrame or R3F Billboard from Drei)

- [ ] Task 6: Update GroundPlane base plane color (AC: #3)
  - [ ] 6.1: Read current GroundPlane in EnvironmentRenderer.jsx (line 110-113)
  - [ ] 6.2: Update meshBasicMaterial color from #0a0a0f to #0d0d18 (or #0f0f1a if brighter feel desired)
  - [ ] 6.3: Test brightness increase — ensure it's subtle and doesn't wash out starfield
  - [ ] 6.4: Verify UI elements (HUD) remain legible against new base color

- [ ] Task 7: Integrate ambient effects into EnvironmentRenderer (AC: #1, #2)
  - [ ] 7.1: Import AmbientLightZones and NebulaRenderer in EnvironmentRenderer.jsx
  - [ ] 7.2: Add <AmbientLightZones /> and <NebulaRenderer /> to EnvironmentRenderer group
  - [ ] 7.3: Order rendering: Starfield → Nebulae → AmbientLightZones → BoundaryRenderer → GroundPlane
  - [ ] 7.4: Ensure depthWrite={false} on all ambient effects to prevent z-fighting

- [ ] Task 8: Optional BossScene ambient enhancement (AC: #6)
  - [ ] 8.1: Evaluate if BossScene needs additional nebula (already has purple theme)
  - [ ] 8.2: If adding, create single purple nebula in boss arena background
  - [ ] 8.3: Use purple (#2a1a4a or #cc66ff), opacity 0.08-0.12, large radius (300-500 for arena)
  - [ ] 8.4: Position nebula behind boss spawn point for dramatic backdrop
  - [ ] 8.5: Verify nebula enhances atmosphere without interfering with boss visibility

- [ ] Task 9: Visual testing and tuning (AC: #1, #2, #3, #4)
  - [ ] 9.1: Test ambient light zones in GameplayScene — subtle color variations visible
  - [ ] 9.2: Test nebulae appearance — large, atmospheric, non-distracting
  - [ ] 9.3: Test base plane color increase — slight brightness boost, no washed-out effect
  - [ ] 9.4: Test player movement through zones — gradual ambient changes, no harsh transitions
  - [ ] 9.5: Test enemy visibility — ambient effects don't obscure enemies or reduce contrast
  - [ ] 9.6: Test with multi-layer starfield (Story 15.2) — ambient effects complement stars
  - [ ] 9.7: Test with reduced grid (Story 15.3) — ambient effects enhance immersion

- [ ] Task 10: Performance validation (AC: #5)
  - [ ] 10.1: Profile GameplayScene FPS with ambient light zones (target: 60 FPS)
  - [ ] 10.2: Profile FPS with nebulae rendered (meshBasicMaterial low cost, ~0.1-0.2ms)
  - [ ] 10.3: Test with 100+ enemies, heavy combat — ambient effects don't drop FPS
  - [ ] 10.4: Check draw calls — 2-3 zones + 2-3 nebulae = 4-6 additional draw calls (acceptable)
  - [ ] 10.5: Monitor memory usage — nebulae textures (if used) are small and static

- [ ] Task 11: Integration testing with Epic 15 stories
  - [ ] 11.1: Test with Story 15.1 (unified player lighting) — no lighting conflicts
  - [ ] 11.2: Test with Story 15.2 (multi-layer starfield) — nebulae enhance parallax depth
  - [ ] 11.3: Test with Story 15.3 (reduced grid) — ambient effects complement subtle grid
  - [ ] 11.4: Verify Epic 15 goal achieved: visually rich, immersive space environment

- [ ] Task 12: Edge case testing
  - [ ] 12.1: Test at play area boundaries — nebulae don't reveal boundary walls early
  - [ ] 12.2: Test during dash (high-speed movement) — ambient effects remain smooth
  - [ ] 12.3: Test during camera shake (damage feedback) — zones don't flicker or glitch
  - [ ] 12.4: Test scene transitions (menu → gameplay → boss → tunnel) — ambient effects load/unload cleanly
  - [ ] 12.5: Test on different monitor brightness/contrast settings — ambient effects still visible

- [ ] Task 13: Documentation and code review preparation
  - [ ] 13.1: Document ambient light zones config in gameConfig.js with inline comments
  - [ ] 13.2: Document nebula config in gameConfig.js with tuning guidance
  - [ ] 13.3: Add component-level comments in AmbientLightZones and NebulaRenderer
  - [ ] 13.4: Update EnvironmentRenderer.jsx inline comments for new rendering order
  - [ ] 13.5: Prepare before/after comparison screenshots (with/without ambient effects)
  - [ ] 13.6: Update Dev Agent Record with completion notes and file list

## Dev Notes

### Epic Context

This story is part of **Epic 15: Visual Polish - Space Environment Enhancement**, which aims to create a visually rich and immersive space environment with proper lighting consistency, parallax starfield effects, reduced grid visibility, and ambient light zones.

**Epic Goals:**
- Unify player ship lighting across all game scenes (Story 15.1)
- Create multi-layer starfield with parallax effect (Story 15.2)
- Reduce or eliminate visible grid lines that break immersion (Story 15.3)
- **Add ambient light zones and nebula-like effects to make space feel less uniformly dark (Story 15.4 — THIS STORY)**

**Current Problem:**
The space environment is uniformly dark (#0a0a0f base color) with static starfield and minimal color variation. This creates a monotonous, flat appearance that lacks atmospheric depth. The environment feels cold and lifeless, missing the visual richness of space depicted in sci-fi media (nebulae, colored gas clouds, ambient light zones).

**Story 15.4 Goal:**
Transform the space environment from uniformly dark to visually varied by adding 2-3 ambient light zones (deep blue, purple, cyan) and 2-3 large nebula effects. These elements create subtle color variations, enhance atmospheric depth, and make space feel more alive without interfering with gameplay clarity.

**Story Sequence in Epic:**
- Story 15.1 (Unified Player Lighting) → Ready-for-dev — Lighting consistency across scenes
- Story 15.2 (Multi-Layer Starfield) → Ready-for-dev — Parallax depth effect
- Story 15.3 (Grid Visibility Reduction) → Ready-for-dev — Immersive environment polish
- **Story 15.4 (Ambient Light Zones) → THIS STORY** — Final environmental polish, atmospheric richness

### Architecture Context

**6-Layer Architecture Alignment:**
- **Config/Data Layer** → gameConfig.js (new ENVIRONMENT_VISUAL_EFFECTS.AMBIENT_LIGHT_ZONES and NEBULAE sections)
- **Rendering Layer** → EnvironmentRenderer.jsx (AmbientLightZones, NebulaRenderer components)
- **Scenes Layer** → GameplayScene.jsx (uses EnvironmentRenderer), BossScene.jsx (optional purple nebula)
- **No Systems Layer** → Pure visual enhancement, no game logic changes
- **No Stores** → No state changes (ambient effects are static, positioned once)
- **No UI Layer** → No UI changes (purely 3D rendering improvements)

**Existing Infrastructure:**

**EnvironmentRenderer.jsx Current Structure (132 lines):**
```javascript
// Starfield: 4000 stars in spherical distribution, white-blue gradient
function Starfield() { ... }

// BoundaryRenderer: 4 walls with dynamic opacity based on player proximity
function BoundaryRenderer() { ... }

// GroundPlane: Base plane (#0a0a0f) + gridHelper (#1a1a2e / #12121a)
function GroundPlane() { ... }

export default function EnvironmentRenderer() {
  return (
    <group>
      <Starfield />
      <BoundaryRenderer />
      <GroundPlane />
    </group>
  )
}
```

**GameplayScene.jsx Current Lighting (lines 31-39):**
```javascript
{/* Lighting */}
<ambientLight intensity={0.35} />
<directionalLight position={[10, 20, 10]} intensity={1} />
{/* Player fill light for enhanced visibility (Story 12.1) */}
<directionalLight
  position={_fill.FILL_LIGHT_POSITION}
  intensity={_fill.FILL_LIGHT_INTENSITY}
  castShadow={false}
/>
```

**Current Environment Colors:**
- Base plane: #0a0a0f (RGB 10, 10, 15) — very dark blue-tinted black
- Grid center: #1a1a2e (RGB 26, 26, 46) — dark blue-gray (Story 15.3 will reduce)
- Grid sub: #12121a (RGB 18, 18, 26) — darker blue-gray (Story 15.3 will reduce)
- Starfield: white-blue (#ffffff to #aaccff gradient)
- Boundary walls: #00ffff (cyan)

**Story 15.4 Approach:**

**Primary Strategy: Ambient Light Zones**

Create 2-3 large, semi-transparent geometric shapes (planes or spheres) with colored materials positioned far from player origin. These zones provide subtle color variations without direct lighting changes (using meshBasicMaterial, not actual lights, to avoid lighting calculations).

**Zone Placement Strategy:**
- Zone 1 (Deep Blue): Position [800, 0, -600] — Northeast quadrant, deep blue (#1a2a4a)
- Zone 2 (Purple): Position [-700, 0, 800] — Southwest quadrant, purple (#2a1a4a)
- Zone 3 (Cyan): Position [500, 0, 900] — Southeast quadrant, cyan (#1a3a3a)
- Asymmetric placement avoids visual repetition
- 500-1000 unit distance keeps zones in background, visible but non-intrusive

**Zone Geometry Options:**
- **Option A: Large Planes (Billboards)** — Flat billboards always facing camera (simpler, lower poly)
  - Size: 1000x1000 units
  - Use R3F `<Billboard>` from Drei for auto-rotation
  - Radial gradient texture or shader for opacity falloff
- **Option B: Large Spheres** — Volumetric feel, visible from all angles
  - Radius: 500-700 units
  - Use meshBasicMaterial with opacity, no lighting calculations
  - Radial opacity via texture or material opacity property

**Recommended: Option A (Billboards)** — Simpler implementation, predictable appearance, lower geometry cost.

**Secondary Strategy: Nebula Effects**

Nebulae are larger, more diffuse versions of light zones, using very low opacity (0.05-0.15) to create atmospheric haze. Nebulae can overlap or be positioned near light zones for cohesive appearance.

**Nebula Placement Strategy:**
- Nebula 1 (Cyan): Position [900, 0, -800] — Near Zone 1, larger radius (800 units), cyan (#00ffcc)
- Nebula 2 (Magenta): Position [-900, 0, 700] — Near Zone 2, larger radius (900 units), magenta (#ff00ff)
- Nebula 3 (Purple): Position [600, 0, 1000] — Near Zone 3, larger radius (700 units), purple (#cc66ff)
- Overlapping zones + nebulae creates layered atmospheric depth

**Nebula Rendering Approach:**
- Use large billboards (1500x1500 units) or spheres (radius 800-1000)
- meshBasicMaterial with very low opacity (0.05-0.15) — barely visible, atmospheric
- Gradient texture: bright center → transparent edges (radial falloff)
- depthWrite={false} to prevent z-fighting with starfield and other effects

**Tertiary Strategy: Base Plane Color Adjustment**

Increase base plane color from #0a0a0f (very dark) to #0d0d18 or #0f0f1a (slightly brighter). This subtle change makes ambient light zones and nebulae more visible by providing slightly more contrast.

**Color Rationale:**
- Current: #0a0a0f (RGB 10, 10, 15, luminance ~11)
- Proposed: #0d0d18 (RGB 13, 13, 24, luminance ~16) — ~50% brighter, still very dark
- Alternative: #0f0f1a (RGB 15, 15, 26, luminance ~18) — ~60% brighter, slightly more noticeable
- Recommendation: #0d0d18 for subtle boost without washing out starfield

**BossScene Consideration:**

BossScene already has strong purple theming (purple lighting, purple grid, purple ambient). Adding too many ambient effects may dilute the boss arena's distinct visual identity.

**Recommendation:**
- Skip ambient light zones in BossScene (arena is smaller, 400x400, zones would be too close)
- Optional: Add single purple nebula (radius 300-400) behind boss spawn point for dramatic backdrop
- Use purple (#2a1a4a or #cc66ff), opacity 0.08-0.12 (slightly higher than GameplayScene for more noticeable effect in arena)
- Position: [0, 0, -200] (behind boss spawn, visible from player perspective at arena center)

### Technical Requirements

**gameConfig.js additions (new ENVIRONMENT_VISUAL_EFFECTS sections):**

```javascript
// Environment Visual Effects (Story 15.2 - Starfield, Story 15.3 - Grid, Story 15.4 - Ambient Zones)
ENVIRONMENT_VISUAL_EFFECTS: {
  // ... STARFIELD_LAYERS from Story 15.2 ...
  // ... GRID_VISIBILITY from Story 15.3 ...

  AMBIENT_LIGHT_ZONES: {
    enabled: true,                      // Set to false to disable ambient zones
    zones: [
      {
        id: 'deep-blue-zone',
        position: [800, 0, -600],       // Northeast quadrant
        color: '#1a2a4a',               // Deep blue
        size: [1000, 1000],             // Width x Height (for planes) or radius (for spheres)
        geometry: 'billboard',          // 'billboard' or 'sphere'
        opacity: 0.15,                  // Semi-transparent
      },
      {
        id: 'purple-zone',
        position: [-700, 0, 800],       // Southwest quadrant
        color: '#2a1a4a',               // Purple
        size: [1000, 1000],
        geometry: 'billboard',
        opacity: 0.12,
      },
      {
        id: 'cyan-zone',
        position: [500, 0, 900],        // Southeast quadrant
        color: '#1a3a3a',               // Cyan-tinted dark
        size: [1000, 1000],
        geometry: 'billboard',
        opacity: 0.18,
      },
    ],
  },

  NEBULAE: {
    enabled: true,                      // Set to false to disable nebulae
    nebulae: [
      {
        id: 'cyan-nebula',
        position: [900, 0, -800],       // Near deep-blue-zone
        color: '#00ffcc',               // Cyan
        size: 800,                      // Radius (for spheres) or half-width (for billboards)
        geometry: 'billboard',          // 'billboard' or 'sphere'
        opacity: 0.10,                  // Very low opacity, atmospheric haze
      },
      {
        id: 'magenta-nebula',
        position: [-900, 0, 700],       // Near purple-zone
        color: '#ff00ff',               // Magenta
        size: 900,
        geometry: 'billboard',
        opacity: 0.08,
      },
      {
        id: 'purple-nebula',
        position: [600, 0, 1000],       // Near cyan-zone
        color: '#cc66ff',               // Purple
        size: 700,
        geometry: 'billboard',
        opacity: 0.12,
      },
    ],
  },

  // Base space color (updated from #0a0a0f)
  GROUND_PLANE_BASE_COLOR: '#0d0d18',   // Slightly brighter than original, subtle boost
},
```

**AmbientLightZones Component (new in EnvironmentRenderer.jsx or separate file):**

```javascript
import { Billboard } from '@react-three/drei'
import { GAME_CONFIG } from '../config/gameConfig.js'

const { AMBIENT_LIGHT_ZONES } = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS

function AmbientLightZones() {
  if (!AMBIENT_LIGHT_ZONES.enabled) return null

  return (
    <group>
      {AMBIENT_LIGHT_ZONES.zones.map((zone) => {
        if (zone.geometry === 'billboard') {
          // Billboard always faces camera
          return (
            <Billboard key={zone.id} position={zone.position}>
              <planeGeometry args={zone.size} />
              <meshBasicMaterial
                color={zone.color}
                transparent
                opacity={zone.opacity}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </Billboard>
          )
        } else if (zone.geometry === 'sphere') {
          // Sphere visible from all angles
          const radius = zone.size[0] / 2 // Use first size value as radius
          return (
            <mesh key={zone.id} position={zone.position}>
              <sphereGeometry args={[radius, 32, 32]} />
              <meshBasicMaterial
                color={zone.color}
                transparent
                opacity={zone.opacity}
                depthWrite={false}
                side={THREE.BackSide} // Render inside of sphere
              />
            </mesh>
          )
        }
      })}
    </group>
  )
}

export default AmbientLightZones
```

**NebulaRenderer Component (new in EnvironmentRenderer.jsx or separate file):**

```javascript
import { Billboard } from '@react-three/drei'
import { GAME_CONFIG } from '../config/gameConfig.js'

const { NEBULAE } = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS

function NebulaRenderer() {
  if (!NEBULAE.enabled) return null

  return (
    <group>
      {NEBULAE.nebulae.map((nebula) => {
        if (nebula.geometry === 'billboard') {
          // Large billboard with nebula effect
          const size = nebula.size * 2 // nebula.size is radius, multiply for billboard dimensions
          return (
            <Billboard key={nebula.id} position={nebula.position}>
              <planeGeometry args={[size, size]} />
              <meshBasicMaterial
                color={nebula.color}
                transparent
                opacity={nebula.opacity}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </Billboard>
          )
        } else if (nebula.geometry === 'sphere') {
          // Large sphere with nebula effect
          return (
            <mesh key={nebula.id} position={nebula.position}>
              <sphereGeometry args={[nebula.size, 32, 32]} />
              <meshBasicMaterial
                color={nebula.color}
                transparent
                opacity={nebula.opacity}
                depthWrite={false}
                side={THREE.BackSide} // Render inside
              />
            </mesh>
          )
        }
      })}
    </group>
  )
}

export default NebulaRenderer
```

**EnvironmentRenderer.jsx Updated:**

```javascript
import AmbientLightZones from './AmbientLightZones.jsx' // or inline
import NebulaRenderer from './NebulaRenderer.jsx' // or inline
import { GAME_CONFIG } from '../config/gameConfig.js'

const { GROUND_PLANE_BASE_COLOR } = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS

function GroundPlane() {
  const gridSize = GAME_CONFIG.PLAY_AREA_SIZE * 2.2
  return (
    <group>
      {/* Semi-transparent dark base plane — updated color for subtle brightness boost */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial
          color={GROUND_PLANE_BASE_COLOR} // Updated from #0a0a0f to #0d0d18
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
      {/* Subtle grid for spatial orientation (Story 15.3 reduces visibility) */}
      <gridHelper args={[gridSize, 40, '#1a1a2e', '#12121a']} position={[0, 0, 0]} />
    </group>
  )
}

export default function EnvironmentRenderer() {
  return (
    <group>
      <Starfield />
      <NebulaRenderer />        {/* Render nebulae behind light zones */}
      <AmbientLightZones />     {/* Render light zones in front of nebulae */}
      <BoundaryRenderer />
      <GroundPlane />
    </group>
  )
}
```

**Optional: Gradient Texture for Radial Opacity**

For more realistic nebula appearance, generate a radial gradient texture (bright center → transparent edges):

```javascript
import { useMemo } from 'react'
import * as THREE from 'three'

function createRadialGradientTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const centerX = size / 2
  const centerY = size / 2
  const radius = size / 2

  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')    // Bright center
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)') // Mid
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')    // Transparent edge

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function NebulaRenderer() {
  const gradientTexture = useMemo(() => createRadialGradientTexture(512), [])

  // ... use gradientTexture in meshBasicMaterial:
  // <meshBasicMaterial color={nebula.color} map={gradientTexture} transparent opacity={nebula.opacity} ... />
}
```

**Note:** Gradient texture adds realism but increases complexity. For MVP, uniform opacity billboards are sufficient. Add gradient textures in post-contest polish if desired.

### Previous Story Intelligence

**From Story 15.3 (Grid Visibility Reduction & Ambient Fog):**
- **Goal:** Reduce grid visibility to near-invisible, add optional ambient fog
- **Status:** Ready-for-dev (may be implemented before or during Story 15.4 dev)
- **Grid Reduction:** New colors #0d0d18 / #0a0a0f for GameplayScene, #1a0828 / #0d0415 for BossScene
- **Optional Fog:** THREE.FogExp2 with color #050510, density 0.0003 (very low, atmospheric depth)
- **Impact on Story 15.4:** Reduced grid visibility enhances ambient light zones by removing visual clutter; fog (if added) complements nebulae for layered atmospheric depth

**Applied to Story 15.4:**
- Ambient light zones stand out more against subtle grid (grid no longer competes for attention)
- If fog is added in Story 15.3, nebulae in Story 15.4 create layered atmospheric effects (fog → nebulae → light zones → starfield)
- Base plane color increase (#0d0d18) in Story 15.4 aligns with Story 15.3's goal of subtle environmental polish

**From Story 15.2 (Multi-Layer Starfield with Parallax):**
- **Goal:** 3-layer starfield (distant, mid, near) with parallax motion for depth perception
- **Status:** Ready-for-dev
- **Implementation:** EnvironmentRenderer refactored with StarfieldLayer components, parallax via useFrame
- **Impact on Story 15.4:** Multi-layer starfield creates rich background — ambient light zones and nebulae enhance this depth by adding color variation

**Applied to Story 15.4:**
- Nebulae positioned behind starfield layers create sense of distant cosmic structures
- Ambient light zones in mid-ground (500-1000 units) interact visually with mid/near starfield layers
- Parallax motion from Story 15.2 + static light zones from Story 15.4 = dynamic depth perception

**From Story 15.1 (Unified Player Lighting Across All Scenes):**
- **Goal:** Consistent player ship lighting in GameplayScene, BossScene, TunnelScene
- **Status:** Ready-for-dev
- **Approach:** Add directional fill light to all scenes (PLAYER_SHIP_LIGHTING.FILL_LIGHT_INTENSITY)
- **Impact on Story 15.4:** No conflict — player lighting is directional, ambient zones are environment background

**Applied to Story 15.4:**
- Player fill light remains focal point (bright, focused), ambient zones provide background atmosphere (dim, diffuse)
- No lighting calculations in ambient zones (meshBasicMaterial), so no interference with player directional light
- BossScene purple lighting + optional purple nebula = cohesive purple theme

**From Story 12.1 (Player Ship Lighting Improvements):**
- **Context:** Enhanced player ship visibility with emissive materials, fill light, point light
- **Fill Light:** Directional light positioned [0, 15, 10], intensity 1.2 (GameplayScene)
- **Applied to Story 15.4:** Player remains well-lit focal point, ambient zones enhance background without washing out player

**From Story 1.3 (Space Environment & Boundaries):**
- **Grid Creation:** GroundPlane with gridHelper for spatial orientation
- **Base Plane:** Color #0a0a0f, opacity 0.2
- **Starfield:** 4000 stars, white-blue gradient
- **Applied to Story 15.4:** Story 15.4 builds on Story 1.3's foundation by adding color variation and atmospheric depth to originally uniform dark space

**From Git History (Recent Commits):**
- **43bf073:** Mandatory dilemma gate (Story 13.4) — no environment changes
- **afe39a1:** Tunnel ship visibility with GLB model (Story 13.3) — no GameplayScene environment changes
- **bd4e071:** Infinite level XP scaling (Story 14.3) — no environment changes
- Recent commits focus on gameplay systems and UI — Epic 15 is first major environment polish pass since Story 1.3 (initial environment) and Story 12.1 (player lighting)

**Key Takeaway from Git:**
- No recent environment rendering changes beyond Story 12.1 player lighting (6+ stories ago)
- Epic 15 (Stories 15.1-15.4) is comprehensive environment polish epic
- Story 15.4 is final environment polish story in Epic 15, completing visual richness goal

### Architecture Guardrails

**File Structure Requirements (Architecture.md):**
```
src/config/gameConfig.js                        — Add ENVIRONMENT_VISUAL_EFFECTS.AMBIENT_LIGHT_ZONES, NEBULAE, GROUND_PLANE_BASE_COLOR
src/renderers/EnvironmentRenderer.jsx           — Integrate AmbientLightZones and NebulaRenderer
src/renderers/AmbientLightZones.jsx (new)       — Optional separate file for light zones component
src/renderers/NebulaRenderer.jsx (new)          — Optional separate file for nebula component
src/scenes/GameplayScene.jsx                    — No changes needed (uses EnvironmentRenderer)
src/scenes/BossScene.jsx                        — Optional: Add single purple nebula for boss arena backdrop
```

**Layer Boundaries (Architecture.md 6-Layer):**
- **Config Layer** — gameConfig.js adds AMBIENT_LIGHT_ZONES, NEBULAE, GROUND_PLANE_BASE_COLOR (pure data)
- **Rendering Layer** — EnvironmentRenderer.jsx integrates new components, AmbientLightZones and NebulaRenderer render visual effects
- **Scenes Layer** — GameplayScene, BossScene use EnvironmentRenderer (no scene-level changes needed)
- **No Systems** — No game logic changes (pure visual enhancement)
- **No Stores** — No state changes (ambient effects are static, positioned once on mount)
- **No GameLoop** — No centralized game loop changes

**Anti-Patterns to AVOID:**
- DO NOT use actual Three.js lights (PointLight, SpotLight) for ambient zones — use meshBasicMaterial for performance
- DO NOT position zones too close to player origin (< 500 units) — zones should be distant background elements
- DO NOT use high opacity (> 0.2 for zones, > 0.15 for nebulae) — effects should be subtle, atmospheric
- DO NOT add dynamic zone movement or animation — zones are static for performance and visual stability
- DO NOT add zones/nebulae to TunnelScene — tunnel has custom scrolling background, ambient effects may conflict
- DO NOT create per-frame updates for ambient effects — all positions and colors are static config
- DO NOT use complex geometry (high poly spheres) — use low poly (32 segments) or billboards for efficiency

**Coding Standards (Architecture.md Naming):**
- Config section: `SCREAMING_CAPS` → `AMBIENT_LIGHT_ZONES`, `NEBULAE`, `GROUND_PLANE_BASE_COLOR`
- Config properties: `camelCase` → `enabled`, `zones`, `nebulae`, `position`, `color`, `size`, `opacity`, `geometry`
- Component: `PascalCase` → `AmbientLightZones`, `NebulaRenderer`
- Variables: `camelCase` → `zone`, `nebula`, `gradientTexture`, `size`, `radius`

**Three.js / R3F Specific Guardrails:**
- Use Drei's `<Billboard>` for auto-rotation billboards (always face camera)
- Set `depthWrite={false}` on all ambient materials to prevent z-fighting with starfield
- Use `side={THREE.DoubleSide}` for billboards (visible from both sides)
- Use `side={THREE.BackSide}` for spheres (render inside of sphere for volumetric effect)
- Dispose textures (if used) in useEffect cleanup: `return () => texture.dispose()`
- Keep geometry segments low (32x32 for spheres) — ambient effects are distant, high detail not needed

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- Ambient light zones: 2-3 billboards or spheres with meshBasicMaterial = ~0.1-0.2ms per frame (negligible)
- Nebulae: 2-3 large billboards or spheres with very low opacity = ~0.1-0.2ms per frame (negligible)
- Base plane color change: Zero performance impact (static color)
- Total performance overhead: ~0.2-0.4ms per frame (< 1% of 16.67ms budget at 60 FPS)
- **Net Performance Impact:** Negligible, well within budget

**Draw Call Budget:**
- Ambient light zones: 2-3 draw calls (one per zone)
- Nebulae: 2-3 draw calls (one per nebula)
- Total added draw calls: 4-6
- Current GameplayScene draw calls: ~20-30 (enemies, projectiles, player, environment)
- New total: ~26-36 draw calls (well within WebGL limits, ~50-100 draw calls comfortable for 60 FPS)

**Memory Profile:**
- Ambient light zones: 3 plane/sphere geometries + 3 materials = ~10KB
- Nebulae: 3 plane/sphere geometries + 3 materials = ~10KB
- Gradient texture (if used): 512x512 RGBA = ~1MB (one texture, reused for all nebulae)
- Total memory overhead: ~20KB (no textures) or ~1MB (with gradient texture)
- Impact: Negligible (< 1% of typical 30-min session memory usage)

**NFR4: Scene Transitions < 2 seconds:**
- Ambient effects are static geometry, created once on EnvironmentRenderer mount
- No additional assets to load (colors are inline, no external textures unless gradient added)
- Scene transitions unaffected (ambient effects mount/unmount with EnvironmentRenderer)

**Implementation Optimization Checklist:**
- [x] Use meshBasicMaterial (no lighting calculations, CPU-friendly)
- [x] Set depthWrite={false} (no z-buffer writes, prevents overdraw cost)
- [x] Keep geometry low-poly (32 segments for spheres, single quad for billboards)
- [x] Position zones far from player (500-1000 units, minimal screen coverage)
- [x] Use static positions (no per-frame updates, zero CPU cost)
- [x] Limit zone count to 2-3 (balance visual richness vs draw calls)
- [x] Limit nebula count to 2-3 (balance atmospheric depth vs draw calls)
- [x] Reuse gradient texture if used (one texture for all nebulae, not per-nebula)

**Performance Testing Plan:**
- Baseline FPS: Measure GameplayScene FPS before Story 15.4 (target: 60 FPS)
- With ambient zones: Add AmbientLightZones, measure FPS (expect: 60 FPS, < 0.5ms impact)
- With nebulae: Add NebulaRenderer, measure FPS (expect: 60 FPS, < 0.5ms total)
- Under load: Test with 100+ enemies, heavy combat (expect: 60 FPS maintained, ambient effects negligible)
- Draw call count: Use r3f-perf to verify draw calls increase by 4-6 only
- Memory usage: Monitor Chrome DevTools memory tab during 10-min gameplay (expect: stable, no leaks)

### Testing Checklist

**Functional Testing (Ambient Light Zones, AC: #1):**
- [ ] GameplayScene renders 2-3 ambient light zones at configured positions
- [ ] Zones use correct colors (deep blue #1a2a4a, purple #2a1a4a, cyan #1a3a3a)
- [ ] Zones are large (1000x1000 units or 500-700 radius) and semi-transparent (opacity 0.12-0.18)
- [ ] Zones are positioned far from player origin (500-1000 units away)
- [ ] Zones do not obstruct player view or interfere with gameplay

**Functional Testing (Nebulae, AC: #2):**
- [ ] GameplayScene renders 2-3 nebulae at configured positions
- [ ] Nebulae use correct colors (cyan #00ffcc, magenta #ff00ff, purple #cc66ff)
- [ ] Nebulae are large (500-1000 radius) and very low opacity (0.05-0.15)
- [ ] Nebulae create atmospheric haze without obscuring enemies or player
- [ ] Nebulae complement UI color palette (cyan, magenta, purple theme)

**Functional Testing (Base Plane Color, AC: #3):**
- [ ] GroundPlane base plane color updated from #0a0a0f to #0d0d18 (or #0f0f1a)
- [ ] Base plane brightness increase is subtle and non-distracting
- [ ] Starfield remains visible and not washed out by brighter base
- [ ] UI elements (HUD) remain legible against new base color

**Functional Testing (Player Movement, AC: #4):**
- [ ] Moving through ambient light zones creates subtle color variations in environment
- [ ] Color transitions are gradual and smooth (no harsh lighting changes)
- [ ] Zones do not interfere with enemy visibility or targeting
- [ ] Zones enhance atmospheric depth without reducing gameplay clarity
- [ ] Player always remains well-lit focal point (fill light from Story 15.1 preserved)

**Performance Testing (AC: #5):**
- [ ] 60 FPS maintained in GameplayScene with ambient light zones rendered
- [ ] 60 FPS maintained with nebulae rendered
- [ ] 60 FPS maintained with 100+ enemies and heavy combat (stress test)
- [ ] Draw calls increase by 4-6 only (verify with r3f-perf or browser DevTools)
- [ ] Memory usage remains stable during 10-min gameplay session (no leaks)

**BossScene Testing (Optional, AC: #6):**
- [ ] BossScene preserves purple lighting theme (no ambient zones added)
- [ ] If purple nebula added, it enhances boss arena atmosphere without interfering with boss visibility
- [ ] Purple nebula (if added) is subtle (opacity 0.08-0.12) and positioned behind boss spawn
- [ ] Boss arena visual identity remains distinct from GameplayScene

**Integration Testing with Epic 15 Stories:**
- [ ] Ambient effects work with Story 15.1 (unified player lighting) — no lighting conflicts
- [ ] Ambient effects complement Story 15.2 (multi-layer starfield) — zones enhance parallax depth
- [ ] Ambient effects work with Story 15.3 (reduced grid) — zones stand out against subtle grid
- [ ] Epic 15 goal achieved: visually rich, immersive space environment with proper lighting, starfield depth, reduced grid, and ambient color variation

**Visual Comparison Testing:**
- [ ] Capture before screenshots (uniform dark space without ambient effects)
- [ ] Capture after screenshots (space with ambient zones + nebulae + brighter base)
- [ ] Compare immersion quality — after should feel significantly more atmospheric and alive
- [ ] Compare gameplay clarity — after should maintain clear enemy visibility and focal points
- [ ] Ambient effects create noticeable visual richness without sacrificing performance

**Edge Case Testing:**
- [ ] Ambient zones visible but non-intrusive at play area boundaries (don't reveal walls early)
- [ ] Zones remain smooth during dash (high-speed movement, no visual glitches)
- [ ] Zones remain stable during camera shake (damage feedback, no flickering)
- [ ] Scene transitions (menu → gameplay → boss → tunnel) load/unload ambient effects cleanly
- [ ] Ambient effects work on different monitor brightness/contrast settings (still visible, not washed out)

**User Experience Testing:**
- [ ] Space environment feels more alive and varied (not uniformly dark)
- [ ] Ambient zones create sense of depth and scale (cosmic structures in distance)
- [ ] Nebulae add atmospheric richness without distracting from gameplay
- [ ] Base plane brightness boost is noticeable but subtle (doesn't feel washed out)
- [ ] Overall environment feels polished and immersive (Epic 15 goal achieved)

### UX Design Specification Compliance

**From UX Doc (Epic 15 Context):**
- **Visual Polish & Player Readability** — Epic 15 focuses on creating visually rich, immersive space environment with reduced visual clutter and enhanced atmospheric depth
- **Immersion** — Ambient light zones and nebulae transform uniform dark space into varied, atmospheric environment
- **Atmospheric Depth** — Multi-layer starfield (Story 15.2) + subtle grid (Story 15.3) + ambient zones (Story 15.4) = comprehensive depth perception

**Story 15.4 Specific Requirements:**
- **Ambient Light Zones:** 2-3 zones, soft colors (deep blue, purple, cyan), semi-transparent (opacity 0.12-0.18)
- **Nebulae:** 2-3 nebulae, complementary colors (cyan, magenta, purple), very low opacity (0.05-0.15)
- **Base Plane Color:** Slightly brighter (#0d0d18 or #0f0f1a) for subtle contrast boost
- **Positioning:** Zones 500-1000 units from origin (distant background, non-intrusive)
- **Performance:** 60 FPS maintained, negligible performance cost

**Color System (from UX Doc + Epic 15):**
- **Ambient Zone Colors:** Deep blue #1a2a4a, purple #2a1a4a, cyan #1a3a3a (soft, muted tones)
- **Nebula Colors:** Cyan #00ffcc, magenta #ff00ff, purple #cc66ff (complement UI palette)
- **Base Plane Color:** #0d0d18 (subtle brightness increase from #0a0a0f)
- **Consistency:** All colors align with existing UI color palette (cyan, magenta, purple theme)

**Visual Hierarchy (from UX Doc):**
- **Primary Focus:** Player ship, enemies, projectiles — highest contrast and brightness (unchanged)
- **Secondary Focus:** UI elements (HUD, minimap) — moderate contrast (unchanged)
- **Tertiary Focus:** Environment (starfield, boundaries, ambient zones) — subtle, non-distracting (ambient zones in this category)
- **Background:** Grid and fog (if added) — barely visible, provides orientation without competing for attention

**Animation Timing (from UX Doc):**
- **Ambient Zones:** Static (no animation) — constant atmospheric presence
- **Nebulae:** Static (no animation) — constant background elements
- **No dynamic effects:** All ambient effects positioned once on mount, zero runtime updates for performance

**Accessibility Considerations:**
- **Gameplay Clarity:** Ambient zones do not reduce enemy visibility or interfere with targeting
- **Color Contrast:** Player and enemies remain high-contrast focal points, ambient zones are low-contrast background
- **Performance:** 60 FPS maintained ensures smooth gameplay for all players
- **Visual Overload:** Subtle, low-opacity ambient effects prevent visual clutter or overstimulation

### References

- [Source: _bmad-output/planning-artifacts/epic-15-space-environment-enhancement.md#Story 15.4 — Complete AC and story text, technical notes, color palette, performance budget]
- [Source: src/renderers/EnvironmentRenderer.jsx — Current environment implementation (Starfield, BoundaryRenderer, GroundPlane), lines 0-132]
- [Source: src/scenes/GameplayScene.jsx — Current lighting setup (ambientLight, directionalLight, player fill light), lines 23-39]
- [Source: src/config/gameConfig.js — Current environment config (STAR_COUNT, STAR_FIELD_RADIUS, PLAY_AREA_SIZE, BOUNDARY_* constants), lines 73-79]
- [Source: _bmad-output/implementation-artifacts/15-3-grid-visibility-reduction-ambient-fog.md — Story 15.3 grid reduction, optional fog, base plane color context]
- [Source: _bmad-output/implementation-artifacts/15-2-multi-layer-starfield-parallax.md — Story 15.2 starfield layers (ambient zones complement parallax depth)]
- [Source: _bmad-output/implementation-artifacts/15-1-unified-player-lighting-all-scenes.md — Story 15.1 player fill light (no conflict with ambient zones)]
- [Source: _bmad-output/implementation-artifacts/12-1-player-ship-lighting-improvements.md — Story 12.1 player lighting pattern, PLAYER_SHIP_LIGHTING config]
- [Source: _bmad-output/implementation-artifacts/1-3-space-environment-boundaries.md — Story 1.3 original environment creation (base plane, grid, starfield)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Rendering Layer — Rendering patterns, 6-layer architecture, meshBasicMaterial usage]
- [Three.js Billboard (Drei): https://github.com/pmndrs/drei#billboard]
- [Three.js meshBasicMaterial: https://threejs.org/docs/#api/en/materials/MeshBasicMaterial]
- [Three.js CanvasTexture: https://threejs.org/docs/#api/en/textures/CanvasTexture]
- [React Three Fiber performance best practices: https://docs.pmnd.rs/react-three-fiber/advanced/pitfalls]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
