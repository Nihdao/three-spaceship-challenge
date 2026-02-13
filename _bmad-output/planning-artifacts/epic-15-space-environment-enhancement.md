# Epic 15: Visual Polish - Space Environment Enhancement

The player experiences a visually rich and immersive space environment with proper lighting consistency, parallax starfield effects, reduced grid visibility, and ambient light zones that enhance the sense of depth and atmosphere.

## Epic Goals

- Unify player ship lighting across all game scenes (GameplayScene, BossScene, TunnelScene)
- Create multi-layer starfield with parallax effect for visual depth
- Reduce or eliminate visible grid lines that break immersion
- Add ambient light zones and nebula-like effects to make space feel less uniformly dark

## Epic Context

**Story 12.1** introduced enhanced player ship lighting (emissive materials, fill light, point light) in GameplayScene, significantly improving ship visibility. However, this lighting setup was not applied to BossScene, resulting in inconsistent player visibility between scenes. Additionally, the current space environment uses static starfields and visible grid lines that reduce visual immersion. The space background is uniformly dark without variation or atmospheric depth.

This epic addresses these visual polish issues to create a more cohesive and immersive space environment across all game phases.

## Stories

### Story 15.1: Unified Player Lighting Across All Scenes

As a player,
I want my spaceship to be consistently well-lit and visible in all game scenes,
So that I never lose track of my ship regardless of the current phase or environment.

**Acceptance Criteria:**

**Given** the player ship is rendered in BossScene
**When** the scene loads
**Then** the same fill light from Story 12.1 is applied to illuminate the player ship
**And** the ship's emissive materials and point light (from PlayerShip.jsx) are active
**And** the ship is clearly visible against the purple boss arena lighting

**Given** the player ship is rendered in TunnelScene
**When** the tunnel phase is active
**Then** appropriate lighting ensures the ship is clearly visible in the tunnel
**And** the ship stands out against the tunnel's scrolling background
**And** the lighting complements the tunnel's visual aesthetic (not too bright, not too dark)

**Given** lighting configuration
**When** gameConfig.js is updated
**Then** PLAYER_SHIP_LIGHTING.FILL_LIGHT_INTENSITY can be overridden per scene if needed
**And** default values work well across GameplayScene, BossScene, and TunnelScene

**Given** all scenes
**When** the player transitions between gameplay → boss → tunnel → gameplay
**Then** the ship visibility remains consistently high throughout all transitions
**And** no visual jarring or sudden brightness changes occur

### Story 15.2: Multi-Layer Starfield with Parallax Effect

As a player,
I want to see stars at different depths with parallax motion,
So that the space environment feels dynamic and three-dimensional.

**Acceptance Criteria:**

**Given** the starfield is rendered in GameplayScene
**When** EnvironmentRenderer displays stars
**Then** stars are organized into 3 distinct layers: distant (background), mid-range, and near
**And** distant stars are smaller and dimmer (opacity 0.3-0.5, size 1-1.5)
**And** mid-range stars are medium (opacity 0.6-0.8, size 1.5-2.5)
**And** near stars are larger and brighter (opacity 0.8-1.0, size 2.5-4)

**Given** the starfield layers
**When** sizeAttenuation is configured
**Then** near stars use sizeAttenuation={true} for depth perception
**And** distant and mid-range stars use sizeAttenuation={false} for consistent backdrop

**Given** the player moves their ship
**When** the camera follows the player
**Then** near stars appear to move faster relative to the camera (parallax effect)
**And** mid-range stars move at medium speed
**And** distant stars move very slowly or remain nearly static
**And** the parallax effect creates a sense of speed and depth

**Given** starfield rendering
**When** performance is tested with 100+ enemies and heavy combat
**Then** the multi-layer starfield maintains 60 FPS
**And** total star count remains within performance budget (≤ 3000 stars total across all layers)

**Given** BossScene starfield
**When** the boss arena is active
**Then** the arena's purple-tinted starfield also uses multi-layer parallax
**And** the effect is consistent with GameplayScene's starfield

### Story 15.3: Grid Visibility Reduction & Ambient Fog

As a player,
I want the spatial grid to be subtle or hidden,
So that the space environment feels more immersive and less like a debug wireframe.

**Acceptance Criteria:**

**Given** the GroundPlane grid in GameplayScene
**When** EnvironmentRenderer displays the grid
**Then** the gridHelper opacity is reduced to near-invisible (color #0a0a0f or darker, very low contrast)
**And** the grid provides subtle spatial orientation without being visually distracting
**Or** the grid is completely removed and replaced with scattered reference points (dim light spots)

**Given** debug mode is enabled
**When** the player activates debug controls
**Then** the grid can be toggled on/off via a debug option
**And** when toggled on, the grid is clearly visible for debugging purposes (bright cyan #00ffcc)

**Given** BossScene arena floor grid
**When** the boss arena renders
**Then** the gridHelper in ArenaFloor follows the same reduced visibility approach
**And** the arena floor remains visually cohesive with the purple lighting theme

**Given** ambient fog is added (optional enhancement)
**When** the scene includes fog
**Then** a subtle THREE.Fog or THREE.FogExp2 is applied with a deep blue-black color (#050510)
**And** fog density is very low (0.0001-0.0005) to add atmospheric depth without obscuring gameplay
**And** fog affects distant stars and environment elements, enhancing depth perception

**Given** grid replacement with reference points
**When** the grid is removed
**Then** 10-15 small, dim point lights or particle clusters are scattered across the play area
**And** these points provide spatial reference without forming a rigid grid pattern
**And** points are cyan (#00ffcc, opacity 0.2-0.3) to match UI theme

### Story 15.4: Ambient Light Zones & Nebula Effects

As a player,
I want to see varied lighting zones and nebula-like effects in space,
So that the environment feels more alive and less uniformly dark.

**Acceptance Criteria:**

**Given** the space environment in GameplayScene
**When** ambient light zones are added
**Then** 2-3 zones of colored ambient light are placed asymmetrically in the play area
**And** zones use soft colors: deep blue (#1a2a4a), purple (#2a1a4a), cyan (#1a3a3a)
**And** each zone is a large, semi-transparent plane or sphere with gradient/radial opacity
**And** zones are positioned far from the player origin (500-1000 units away) to avoid direct interference

**Given** nebula effects
**When** rendered in the environment
**Then** nebulae use meshBasicMaterial with opacity 0.05-0.15 to avoid performance cost
**And** nebulae are large (500-1000 unit radius) billboards or spheres with gradient textures
**And** nebula colors complement the UI palette (cyan, magenta, deep blue, purple)

**Given** base space color
**When** the GroundPlane or space background is rendered
**Then** the base color is slightly brighter than the current #0a0a0f (suggest #0d0d18 or #0f0f1a)
**And** the increased brightness is subtle and doesn't wash out the starfield or UI elements

**Given** light zones and nebulae
**When** the player moves through the play area
**Then** the zones create subtle variations in ambient brightness
**And** the player notices atmospheric depth without harsh lighting changes
**And** the zones do not interfere with enemy visibility or gameplay clarity

**Given** performance
**When** ambient light zones and nebulae are rendered
**Then** the scene maintains 60 FPS with all environmental effects active
**And** memory usage remains within acceptable limits (nebulae are static, no dynamic updates)

**Given** BossScene
**When** ambient effects are considered
**Then** BossScene already has purple lighting and may not need additional nebulae
**Or** a single subtle purple nebula is added to enhance the boss arena's atmosphere
**And** the boss arena's visual identity (purple theme) is preserved

## Technical Notes

**Architecture Alignment:**
- **Config Layer**: gameConfig.js — Add ENVIRONMENT_VISUAL_EFFECTS section for starfield layers, fog, nebula config
- **Rendering Layer**: EnvironmentRenderer.jsx — Multi-layer starfield, ambient fog, nebula planes
- **Scenes Layer**: GameplayScene.jsx, BossScene.jsx, TunnelScene.jsx — Apply fill light consistently
- **No Systems/Stores/GameLoop**: Pure visual enhancements, no game logic changes

**Performance Budget:**
- Multi-layer starfield: ~3000 stars total (1000 per layer)
- Ambient light zones: 2-3 large planes/spheres with meshBasicMaterial (negligible cost)
- Fog: THREE.Fog or FogExp2 (built-in, minimal cost)
- Fill light in BossScene: 1 additional directionalLight (within Three.js limits)

**Color Palette Consistency:**
- Starfield: white-blue gradient (#ffffff to #aaccff)
- Nebulae: cyan (#00ffcc), magenta (#ff00ff), purple (#cc66ff), deep blue (#1a2a4a)
- Grid replacement points: cyan (#00ffcc, low opacity)
- Fog: deep blue-black (#050510)

## Dependencies

- Story 12.1 (Player Ship Lighting Improvements) — completed, provides baseline fill light implementation
- EnvironmentRenderer.jsx, BossScene.jsx, TunnelScene.jsx — existing scene files to modify
- gameConfig.js — PLAYER_SHIP_LIGHTING section (existing), new ENVIRONMENT_VISUAL_EFFECTS section

## Success Metrics

- Player ship visibility is consistent across all scenes (visual testing)
- Starfield parallax effect is noticeable and enhances depth perception (visual testing)
- Grid is no longer visually distracting (visual testing, player feedback)
- Space environment feels more varied and atmospheric (visual testing, player feedback)
- Performance remains at 60 FPS with all environmental enhancements active (r3f-perf, FPS counter)

## References

- Story 12.1 (Player Ship Lighting Improvements) — fill light pattern, PLAYER_SHIP_LIGHTING config
- UX Design Specification — "Cyber Minimal" aesthetic, cyan/magenta color palette
- Architecture.md — 6-layer architecture, Rendering Layer guidelines
- Three.js Fog documentation: https://threejs.org/docs/#api/en/scenes/Fog
- Three.js PointsMaterial sizeAttenuation: https://threejs.org/docs/#api/en/materials/PointsMaterial.sizeAttenuation
