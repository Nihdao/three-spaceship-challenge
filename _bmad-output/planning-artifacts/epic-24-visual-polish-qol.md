# Epic 24: Visual Polish & Quality of Life

The game world feels more alive with a player-centered minimap, richer space backgrounds, and a ship particle trail, improving visual feedback and game feel.

## Epic Goals

- Minimap follows the player and shows local surroundings instead of the full map
- Space background is less black — darker blue tones, more stars, configurable per galaxy
- Ship leaves a subtle particle trail (neon glow + fading points) behind it

## Epic Context

The minimap currently shows the entire play area, making it a strategic overview rather than a local awareness tool. For a game where enemies converge from all directions, a player-centered minimap showing nearby threats is more useful. The space background is pure black which feels empty and doesn't showcase the game well visually. A subtle colored background (dark blue/purple) with denser starfields would make the game more visually appealing without impacting readability. The ship particle trail adds "juice" to movement, making the player feel faster and more dynamic.

## Stories

### Story 24.1: Minimap — Follow Player & Zoom

As a player,
I want the minimap to follow my ship and show nearby surroundings,
So that I have situational awareness of local threats rather than a full map overview.

**Acceptance Criteria:**

**Given** the minimap
**When** rendered
**Then** the minimap is centered on the player's current position (not the map center)
**And** the minimap shows a zoomed-in view of the area around the player
**And** the visible radius is configurable (MINIMAP_VISIBLE_RADIUS in gameConfig.js)
**And** the zoom level shows enough area to see approaching enemies before they're on screen

**Given** the minimap elements
**When** displayed
**Then** the player ship is always at the center of the minimap
**And** enemies appear as dots/icons when within the visible radius
**And** planets, wormhole, and boss appear as distinct icons
**And** the play area boundary is shown as a border/edge indicator

**Given** the minimap movement
**When** the player moves
**Then** the minimap content scrolls smoothly (enemy dots move relative to player center)
**And** the minimap does NOT rotate with the player (north is always up)

**Given** the existing minimap styling (Story 10.3)
**When** adapted
**Then** the existing visual style is preserved (colors, border, opacity)
**And** only the viewport behavior changes (centered on player, zoomed in)

### Story 24.2: Universe Background Enhancement

As a player,
I want the space background to feel more alive and less stark black,
So that the game world is visually richer and more appealing.

**Acceptance Criteria:**

**Given** the space background
**When** rendered
**Then** the background color is a very dark blue (#0a0a1a or similar) instead of pure black (#000000)
**And** the color is subtle enough to maintain readability of all game elements
**And** the background color is configurable per galaxy (future: different galaxies have different ambient colors)

**Given** the starfield (Story 15.2)
**When** combined with the new background
**Then** star density is increased slightly for a richer feel
**And** stars remain visible and distinct against the darker blue background
**And** the multi-layer parallax from Story 15.2 is preserved

**Given** optional ambient effects
**When** implemented
**Then** subtle nebula-like color gradients may appear in areas (very faint, non-distracting)
**And** the overall feel is "deep space" not "void" — alive but dark

**Given** performance
**When** the background is enhanced
**Then** no measurable FPS impact (background is behind everything, simple render)

### Story 24.3: Ship Particle Trail

As a player,
I want my ship to leave a subtle glowing trail when moving,
So that movement feels dynamic and visually satisfying.

**Acceptance Criteria:**

**Given** the ship is moving
**When** rendered
**Then** a trail of small glowing particles appears behind the ship
**And** the trail follows the ship's movement path (not aim direction)
**And** particles fade out over 0.3-0.5 seconds (short lived, not cluttering)
**And** the trail color matches the ship's engine/thruster area (cyan, white, or ship-specific color)

**Given** the trail visual style
**When** designed
**Then** the trail consists of:
  - A thin neon line/glow close to the ship (brightest)
  - Small point particles that detach and fade (dimmer, more scattered)
**And** the effect is subtle — enhances movement without distracting from gameplay

**Given** the ship is stationary
**When** not moving
**Then** the trail fades out completely
**And** no new particles are spawned
**And** the transition from moving to stationary is smooth

**Given** the ship is dashing
**When** dash is active
**Then** the trail intensifies briefly (brighter, more particles)
**And** this provides additional visual feedback for the dash action

**Given** performance
**When** the trail system runs
**Then** particle count is limited (max 30-50 trail particles)
**And** particles use PointsMaterial or InstancedMesh for efficient rendering
**And** no measurable FPS impact during normal gameplay

## Technical Notes

**Architecture Alignment:**
- **Config Layer**: gameConfig.js — MINIMAP_VISIBLE_RADIUS, TRAIL_PARTICLE_COUNT, BACKGROUND_COLOR
- **UI Layer**: Minimap.jsx — Refactor to player-centered viewport
- **Rendering Layer**: EnvironmentRenderer.jsx — Background color, starfield density
- **Rendering Layer**: ShipTrail.jsx (new) — Particle trail system using PointsMaterial or Trail from Drei

**Minimap Refactor:**
- Currently renders full map with fixed viewport
- Change to: viewport center = player position, viewport size = MINIMAP_VISIBLE_RADIUS * 2
- Transform all minimap element positions relative to player center
- Boundary indicator: draw play area edges as lines at minimap border

**Trail Implementation Options:**
- Drei's `<Trail>` component — Mesh-based trail, easy to use but may not look like particles
- Custom PointsMaterial system — Spawn points at ship position each frame, fade opacity over time
- Ring buffer of positions — Fixed array, oldest particles overwritten, GPU-friendly

**Background:**
- Simple: change scene.background or fog color
- Per-galaxy: store background config in galaxy definitions (Epic 25, Story 25.3)

## Dependencies

- Story 10.3 (Enhanced Minimap Styling) — Existing minimap to refactor
- Story 15.2 (Multi-Layer Starfield Parallax) — Starfield system to enhance
- PlayerShip.jsx — Trail attaches to ship position
- Story 5.1 (Dash) — Trail intensity during dash

## Success Metrics

- Minimap provides useful local awareness during combat (playtest)
- Background feels richer without reducing readability (visual testing)
- Trail adds visual satisfaction to movement without distraction (playtest)
- All three features maintain 60 FPS (performance profiling)

## References

- adam-vision-notes-2026-02-15.md — Sections 2.2/, 2.3/, 2.9/
- brainstorming-session-2026-02-15.md — Epic 24 roadmap
- Vampire Survivors minimap — Local area awareness reference
- Geometry Wars — Neon trail visual reference
