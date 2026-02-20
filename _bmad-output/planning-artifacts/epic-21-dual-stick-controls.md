# Epic 21: Dual-Stick Controls (Gameplay Foundation)

The player controls ship movement with WASD/arrows/ZQSD and aims independently with the mouse cursor, transforming the game into a dual-stick shooter that differentiates it from auto-aim survivors like Vampire Survivors and Megabonk.

## Epic Goals

- Separate movement (WASD/arrows/ZQSD/left stick) from aiming (mouse cursor/right stick)
- Ship rotation follows the mouse cursor direction, not the movement direction
- Add a subtle crosshair on screen showing where the player is aiming
- Implement ship inertia with acceleration/deceleration for movement (space physics feel)
- Ship tilt (bank) proportional to rotation amplitude — fast turns = more tilt
- Align vortex entry effect color to purple matching the wormhole visual style
- Future-proof for gamepad support (right stick aiming)

## Epic Context

Currently, the ship moves and rotates based on keyboard input only — the ship faces the direction it moves. This creates awkward situations where the player must turn away from enemies to reposition, then turn back to fire. It also makes precise aiming difficult, reducing skill expression.

Switching to dual-stick controls (movement + independent aiming) is the single biggest gameplay differentiator. In Vampire Survivors and Megabonk, combat is auto-aim — the player just moves and damage happens. With dual-stick aiming, the player actively chooses targets, enabling the game to be harder because the player has precise tools. This justifies tougher enemies, denser waves, and strategic positioning.

The movement should feel like a spaceship — acceleration to reach speed, deceleration when input stops, not instant start/stop. The ship's visual tilt during rotation adds juice and communicates the turn intensity.

## Stories

### Story 21.1: Dual-Stick Controls — Movement & Aiming

As a player,
I want to move my ship with WASD and aim with the mouse cursor independently,
So that I can reposition while continuing to fire at enemies in any direction.

**Acceptance Criteria:**

**Given** the player presses movement keys (WASD, arrows, or ZQSD)
**When** input is processed
**Then** the ship moves in the pressed direction (W=forward/up, S=back/down, A=left, D=right)
**And** movement is relative to screen space (W always moves up on screen, not "forward" relative to ship facing)
**And** diagonal movement (e.g., W+D) is normalized to prevent faster diagonal speed

**Given** the mouse cursor position on screen
**When** the aiming system processes input
**Then** the ship rotates to face toward the mouse cursor position
**And** the rotation is smooth and responsive (lerp or instant, tunable)
**And** the ship's Y-axis rotation (facing direction) is decoupled from movement direction

**Given** the ship is moving left (A key) and aiming right (mouse on right side)
**When** both inputs are active simultaneously
**Then** the ship physically moves left on screen
**And** the ship model faces right toward the mouse
**And** weapons fire toward the mouse direction (right)

**Given** no movement keys are pressed
**When** the player only moves the mouse
**Then** the ship rotates to face the mouse but does not translate
**And** the ship decelerates to a stop (see Story 21.3 for inertia)

**Given** the weapon system
**When** auto-fire triggers
**Then** projectiles are fired in the direction the ship is facing (toward mouse cursor)
**And** all existing weapons (primary + secondary slots) fire toward the aim direction
**And** weapons that have specific firing patterns (spread, orbital) adapt to the new aim direction

**Given** keyboard layout support
**When** the player uses ZQSD (French AZERTY layout)
**Then** the movement system recognizes Z=up, Q=left, S=down, D=right
**And** this works alongside WASD and arrow keys (all three layouts simultaneously)

**Given** the existing PlayerShip component
**When** refactored for dual-stick
**Then** bankRef is updated to reflect rotation amplitude rather than movement direction
**And** the useFrame loop in PlayerShip reads mouse position and computes aim angle
**And** the movement vector and aim vector are separate state values

### Story 21.2: Crosshair Display

As a player,
I want to see a subtle crosshair on screen showing where I'm aiming,
So that I have clear visual feedback about my aim direction.

**Acceptance Criteria:**

**Given** the crosshair element
**When** displayed
**Then** a small, subtle crosshair follows the mouse cursor position on screen
**And** the crosshair is visually distinct but not distracting (thin lines, small dot, or subtle reticle)
**And** the crosshair uses a color that stands out against the dark space background (white or light cyan with slight opacity)

**Given** the crosshair design
**When** implemented
**Then** the default cursor is hidden during gameplay
**And** the crosshair is rendered as an HTML overlay element (not a 3D object)
**And** the crosshair position updates every frame to match mouse position

**Given** the crosshair during non-gameplay phases
**When** the game is paused, in menu, or in level-up selection
**Then** the crosshair is hidden and the default cursor returns

**Given** future gamepad support
**When** a gamepad is connected (future epic)
**Then** the crosshair position would be computed from right stick direction at a fixed radius from the ship
**And** the crosshair system is designed to accept position from either mouse or gamepad

### Story 21.3: Ship Inertia Physics

As a player,
I want the ship to accelerate and decelerate smoothly like a spaceship in space,
So that movement feels physical and weighty rather than instant start/stop.

**Acceptance Criteria:**

**Given** the player presses a movement key
**When** the ship starts moving
**Then** the ship accelerates from 0 to max speed over a short duration (e.g., 0.2-0.4 seconds)
**And** acceleration is configurable in gameConfig.js (SHIP_ACCELERATION, SHIP_MAX_SPEED)
**And** the acceleration curve feels responsive (not sluggish — quick to reach cruising speed)

**Given** the player releases all movement keys
**When** input stops
**Then** the ship decelerates from current speed to 0 over a short duration (e.g., 0.3-0.5 seconds)
**And** deceleration is configurable (SHIP_DECELERATION or SHIP_FRICTION)
**And** the ship slides to a stop rather than stopping instantly

**Given** the player changes movement direction
**When** pressing opposite keys (e.g., was moving right, now presses left)
**Then** the ship decelerates from current velocity, passes through 0, then accelerates in the new direction
**And** the transition feels smooth and natural

**Given** the ship's visual tilt (bank)
**When** the ship rotates to face the mouse
**Then** the tilt (Z-axis rotation via bankRef) is proportional to the rotation speed/amplitude
**And** fast rotations produce stronger tilt
**And** slow rotations or no rotation produce minimal tilt
**And** the tilt smoothly returns to neutral when rotation stops

**Given** dash (Story 5.1) interaction with inertia
**When** the player dashes
**Then** dash overrides normal movement physics (instant burst in dash direction)
**And** after dash ends, the ship resumes normal inertia-based movement

**Given** boundary interaction with inertia
**When** the ship reaches the play area boundary
**Then** the ship decelerates and stops at the boundary (no bouncing, no passing through)
**And** velocity is zeroed on the boundary-touching axis

### Story 21.4: Vortex Purple Tint

As a player,
I want the system entry vortex to match the wormhole's purple color scheme,
So that the visual style is consistent across all portal/wormhole effects.

**Acceptance Criteria:**

**Given** the system entry vortex (portal animation from Story 17.1)
**When** rendered
**Then** the vortex uses purple tones matching the wormhole visual (#9933ff, #cc66ff range)
**And** the particle effects during portal entry also use purple tints
**And** the overall visual style is cohesive with the wormhole (Story 17.3)

## Technical Notes

**Architecture Alignment:**
- **Config Layer**: gameConfig.js — SHIP_ACCELERATION, SHIP_DECELERATION, SHIP_MAX_SPEED, AIM_ROTATION_SPEED
- **Stores Layer**: usePlayer.js — velocity vector, aim angle as separate from movement angle
- **GameLoop**: Update movement physics (acceleration/deceleration) in the movement section
- **Rendering Layer**: PlayerShip.jsx — Refactor useFrame to read mouse position, compute aim rotation, apply inertia
- **UI Layer**: Crosshair.jsx (new) — HTML overlay element following cursor

**Control Refactor Impact:**
- PlayerShip.jsx: Major refactor — separate movement vector from aim/rotation
- GameLoop.jsx: Movement section needs velocity-based position updates instead of direct translation
- Weapon system: Fire direction changes from ship movement direction to ship facing direction (aim)
- bankRef: Now driven by aim rotation amplitude, not movement direction
- Camera: May need adjustment if currently following ship rotation

**Mouse Position to World Direction:**
- Convert mouse screen position to a direction vector from ship position
- Use THREE.Vector2 for screen coords, project to world plane at ship height
- atan2(dx, dz) gives the aim angle for ship Y-rotation

**Keyboard Input:**
- Support simultaneous WASD + ZQSD + Arrows (addEventListener, not exclusive)
- Normalize diagonal input vectors
- Input system already exists in usePlayer or GameLoop — extend it

**Performance:**
- Mouse position tracking: negligible (mousemove event → state)
- Inertia physics: simple velocity += acceleration * delta, position += velocity * delta
- Crosshair: CSS transform on HTML div — negligible

## Dependencies

- Story 14.1 (Camera Top View & Rotation Decoupling) — Camera already decoupled from ship rotation
- Story 14.2 (Organic Ship Movement & Acceleration) — Existing acceleration system to build upon/replace
- Story 5.1 (Dash/Barrel Roll) — Dash interaction with inertia system
- PlayerShip.jsx — Primary component to refactor
- GameLoop.jsx — Movement section to update
- All weapon systems — Fire direction source changes

## Success Metrics

- Aiming feels precise and responsive — player can strafe and fire in different directions (playtest)
- Movement feels physical but not sluggish — acceleration is quick, deceleration adds weight (playtest)
- No loss of control during intense combat — dual-stick doesn't create confusion (playtest)
- Crosshair is helpful without being distracting (visual testing)
- Performance unchanged — mouse tracking and inertia add negligible overhead
- AZERTY/QWERTY/Arrow layouts all work simultaneously

## References

- adam-vision-notes-2026-02-15.md — Sections 2.1/
- brainstorming-session-2026-02-15.md — Epic 21 roadmap
- Geometry Wars — Reference for dual-stick spaceship feel
- Enter the Gungeon — Dual-stick with dodge roll (similar to dash)
- Story 14.2 — Existing organic movement acceleration to build upon
