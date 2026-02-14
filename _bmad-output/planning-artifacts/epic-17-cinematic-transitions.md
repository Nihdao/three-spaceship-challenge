# Epic 17: Cinematic Transitions & Wormhole Overhaul

The player experiences dramatic cinematic transitions when entering systems, discovering the wormhole, defeating the boss, and exiting the tunnel, with improved wormhole visuals and boss arrival in the gameplay scene instead of arena teleportation.

## Epic Goals

- Create portal spawn animation when entering a new system (portal opens → ship flies through → player gains control)
- Display system name banner during system entry transition
- Replace wormhole donut model with a more visually compelling form
- Boss arrives in the gameplay scene instead of teleporting player to a separate arena
- Wormhole remains visible but inactive after boss spawns, reactivates when boss is defeated
- Add white flash transitions between tunnel exit and system entry, and between boss defeat and wormhole entry

## Epic Context

Currently, system transitions are abrupt: the player simply appears in the gameplay scene with immediate control. The wormhole is a rotating donut shape that feels placeholder. When activated, the player is teleported to a separate BossScene, breaking immersion. Boss defeat transitions are also abrupt.

The original design called for cinematic transitions that make each system feel like a distinct episode, with dramatic entrances and exits. The wormhole should feel like a mysterious cosmic phenomenon, not a simple geometric shape. The boss should feel like it's invading the player's space rather than pulling them into an arena.

## Stories

### Story 17.1: System Entry Portal Animation

As a player,
I want to see a dramatic portal animation when entering a new system,
So that each system feels like a distinct journey and the transition is cinematic.

**Acceptance Criteria:**

**Given** the player exits the tunnel and enters a new system
**When** the transition begins
**Then** a white flash (200ms) covers the screen
**And** the gameplay scene loads in the background during the flash

**Given** the white flash completes
**When** the scene is visible
**Then** a wormhole portal is already present in the center of the play area
**And** the portal is large (20-30 unit diameter) and visually distinct (swirling energy, particle effects)
**And** the portal uses shader effects or animated textures to create a "rip in space" appearance

**Given** the portal is active
**When** the animation plays
**Then** the portal grows from a small point to full size over 0.8-1.0 seconds (ease-out)
**And** particles and energy effects intensify as the portal opens

**Given** the portal is fully open
**When** the ship entry begins
**Then** the player's ship flies through the portal from the far side toward the camera
**And** the ship movement is automatic (player has no control during this phase)
**And** the ship's speed is fast (cinematic fly-in) and decelerates as it reaches the play position

**Given** the ship reaches its starting position
**When** the fly-in completes
**Then** the portal shrinks and disappears over 0.5 seconds
**And** the player gains control of the ship
**And** the system timer starts counting down
**And** enemy spawning begins

**Given** the portal animation
**When** performance is tested
**Then** the animation maintains 60 FPS
**And** the transition from white flash to full control takes 2-3 seconds total

### Story 17.2: System Name Banner Display

As a player,
I want to see the system name displayed prominently when I enter a new system,
So that I know which system I'm in and the transition feels polished.

**Acceptance Criteria:**

**Given** the portal animation is playing
**When** the ship flies through the portal
**Then** a system name banner fades in at the bottom-center of the screen
**And** the banner displays the system name (e.g., "ALPHA CENTAURI SYSTEM", "PROXIMA SYSTEM", "KEPLER-442 SYSTEM")

**Given** the banner is displayed
**When** it renders
**Then** the text is large (48-64px), bold, and uses the game's primary font (Inter)
**And** the text has a subtle glow or outline for readability
**And** the banner background is semi-transparent dark (#000000 at 60% opacity) with border accents

**Given** the banner appears
**When** the animation completes
**Then** the banner fades in over 0.3 seconds
**And** remains visible for 2-3 seconds
**And** fades out over 0.5 seconds before the player gains full control

**Given** system names
**When** they are defined
**Then** each system (1, 2, 3) has a unique name defined in gameConfig.js (SYSTEM_NAMES array)
**And** the name is pulled dynamically based on useLevel.currentSystem

**Given** the banner UI
**When** it is implemented
**Then** it is a simple HTML overlay component rendered conditionally based on game phase
**And** CSS animations handle fade-in/fade-out (no JavaScript animation libraries needed)

### Story 17.3: Wormhole Visual Overhaul

As a player,
I want the wormhole to look like a mysterious cosmic phenomenon rather than a simple donut,
So that discovering it feels significant and visually impressive.

**Acceptance Criteria:**

**Given** the wormhole is rendered in the gameplay scene
**When** it appears after sufficient exploration time or player proximity to the spawn location
**Then** the wormhole is no longer a simple torus (donut) shape
**And** the wormhole is a layered visual effect combining:
  - Central sphere with swirling shader effect (event horizon)
  - Orbital ring particles rotating around the sphere
  - Subtle gravitational lensing effect (distortion shader, optional Tier 2)

**Given** the wormhole model
**When** it is designed
**Then** the central sphere uses a custom shader or animated texture with swirling motion
**And** the sphere emits light (cyan or purple glow matching UI theme)
**And** the sphere has opacity variations (not fully opaque) to create depth

**Given** the orbital particles
**When** they are rendered
**Then** 20-30 small particles orbit the central sphere in multiple rings
**And** particles use Drei's <Sparkles> or custom PointsMaterial for performance
**And** particles have varied orbit speeds and radii to create dynamic motion

**Given** the wormhole is dormant (pre-activation)
**When** it is visible
**Then** the swirling effect is slow and subtle (low energy state)
**And** the glow is dim
**And** the orbital particles move slowly

**Given** the player activates the wormhole
**When** the activation sequence plays (Story 17.4)
**Then** the swirling effect intensifies (faster rotation, brighter glow)
**And** orbital particles accelerate
**And** the sphere expands slightly before stabilizing

**Given** gravitational lensing (optional Tier 2 enhancement)
**When** the shader is applied
**Then** the space background behind the wormhole appears distorted (radial displacement)
**And** the effect is subtle and does not negatively impact performance

### Story 17.4: Boss Arrival in Gameplay Scene

As a player,
I want the boss to arrive dramatically in the gameplay scene rather than teleporting me to a separate arena,
So that the boss fight feels like an invasion of my space and the transition is seamless.

**Acceptance Criteria:**

**Given** the player activates the wormhole
**When** the activation sequence begins
**Then** the existing shockwave effect clears all enemies from the screen (as per Story 6.1)
**And** the wormhole visual intensifies (swirling faster, brighter glow)
**And** a dramatic sound effect plays (deep rumble, energy surge)

**Given** the shockwave completes
**When** the boss spawn begins
**Then** the boss does NOT spawn in a separate BossScene
**And** instead, the boss materializes near the wormhole in the current GameplayScene
**And** the boss entry uses a particle burst or energy explosion effect
**And** the boss model (SpaceshipBoss.glb) fades in or scales up from small to full size over 1-1.5 seconds

**Given** the boss has arrived
**When** it is fully spawned
**Then** the wormhole remains visible but enters an "inactive" state (dimmed glow, slow swirl)
**And** the wormhole does not respond to player proximity while the boss is alive
**And** the boss HP bar appears at the top-center of the screen (as per Story 6.2)

**Given** the boss is active
**When** the gameplay scene continues
**Then** the same EnvironmentRenderer, GroundPlane, and starfield remain visible (no scene transition)
**And** the player retains full control and can move freely in the play area
**And** the boss uses the same collision and combat systems as regular enemies (no separate arena logic)

**Given** the boss is defeated
**When** its HP reaches 0
**Then** the boss death animation plays (large explosion, particles)
**And** the wormhole reactivates (glow intensifies, swirling accelerates)
**And** a visual indicator shows the wormhole is now interactive (pulsing glow, particle effects)

**Given** the player approaches the reactivated wormhole
**When** they enter its activation zone
**Then** a white flash transition (200ms) occurs
**And** the game transitions to the TunnelScene (as per Story 7.1)

### Story 17.5: Transition Flash Effects

As a player,
I want smooth white flash transitions between key moments,
So that phase changes feel polished and cinematic rather than jarring cuts.

**Acceptance Criteria:**

**Given** the player exits the tunnel and enters a new system
**When** the player clicks "ENTER SYSTEM" in the tunnel
**Then** a white flash (200ms) covers the screen
**And** the flash fades in quickly (50ms) and fades out over 150ms
**And** the system entry portal animation begins as the flash fades out (Story 17.1)

**Given** the player defeats the boss and enters the wormhole
**When** the player moves into the reactivated wormhole's zone
**Then** a white flash (200ms) covers the screen
**And** the TunnelScene loads during the flash
**And** the flash fades out to reveal the tunnel 3D scene and UI

**Given** the white flash effect
**When** it is implemented
**Then** it is a full-screen HTML overlay div with background: white
**And** opacity animates from 0 → 1 → 0 using CSS transitions or React state
**And** the flash is non-blocking and does not freeze the game loop

**Given** the flash timing
**When** transitions occur
**Then** the total flash duration is 200ms (50ms fade-in, 150ms fade-out)
**And** the timing feels snappy and responsive, not sluggish

**Given** flash transitions across the game
**When** they are used consistently
**Then** the same white flash component is reused for:
  - Tunnel exit → System entry
  - Boss defeat → Tunnel entry
  - (Optional) Game over → Retry if desired
**And** the flash visual style is consistent across all uses

## Technical Notes

**Architecture Alignment:**
- **Config Layer**: gameConfig.js — Add SYSTEM_NAMES array, WORMHOLE_VISUAL_CONFIG, CINEMATIC_TRANSITION_TIMINGS
- **Scenes Layer**: GameplayScene.jsx — Integrate boss spawn in-scene, portal animation on entry
- **Rendering Layer**: WormholeRenderer.jsx (new) — Wormhole shader/particle effect
- **UI Layer**: SystemNameBanner.jsx (new) — Banner overlay component
- **UI Layer**: WhiteFlashTransition.jsx (new) — Reusable flash overlay
- **Stores Layer**: useGame.jsx — Manage cinematic phases (portalEntry, bossArrival, etc.)

**Performance Budget:**
- Portal animation: Shader + 30-50 particles (PointsMaterial or Sparkles)
- Wormhole: Custom shader (fragment shader for swirl) + 20-30 orbital particles
- Boss spawn particle burst: Lightweight one-shot effect (reuse explosion particles from enemy deaths)
- White flash: HTML overlay, negligible cost

**Shader Complexity:**
- Wormhole swirl: Fragment shader with time-based UV distortion (simplex noise or sin/cos waves)
- Portal effect: Similar swirl shader with radial gradient opacity
- Gravitational lensing (optional): Fragment shader with radial displacement (medium complexity)

## Dependencies

- Story 6.1 (Wormhole Discovery & Activation) — existing wormhole activation logic
- Story 6.2 (Boss Arena & Combat) — boss spawn and combat logic to adapt
- Story 7.1 (Tunnel Entry & 3D Scene) — tunnel transition target
- useGame store — phase management for cinematic states
- EnvironmentRenderer.jsx — starfield and environment to remain during boss fight

## Success Metrics

- Portal entry animation feels cinematic and polished (visual testing, playtest feedback)
- System name banner is readable and adds to immersion (visual testing)
- Wormhole visual is significantly more impressive than the old donut (visual testing, playtest feedback)
- Boss arrival in-scene feels seamless and dramatic (playtest feedback)
- White flash transitions are smooth and not jarring (visual testing)
- Performance remains at 60 FPS during all transitions and boss arrival (r3f-perf)

## References

- brainstorming-session-2026-02-04.md — tunnel transition design, boss encounter flow
- Story 6.1 (Wormhole Discovery & Activation) — existing wormhole logic
- Story 7.1 (Tunnel Entry & 3D Scene) — tunnel transition
- Three.js ShaderMaterial: https://threejs.org/docs/#api/en/materials/ShaderMaterial
- Drei Sparkles: https://github.com/pmndrs/drei#sparkles
