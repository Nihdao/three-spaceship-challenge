# Story 1.2: Ship Movement, Rotation & Banking

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to move my spaceship smoothly in all directions using WASD or arrow keys, with the ship rotating toward my movement direction and banking during turns,
So that piloting feels responsive, fluid, and visually satisfying.

## Acceptance Criteria

1. **Given** the player is in the gameplay scene **When** the player presses WASD or arrow keys **Then** the spaceship moves in the corresponding direction at PLAYER_BASE_SPEED **And** the spaceship rotates smoothly toward the movement direction (~200ms interpolation for 180°) **And** the spaceship banks/tilts visibly during turns, proportional to turn sharpness **And** input-to-visible-movement latency is < 16ms (1 frame at 60 FPS)

2. **Given** the player releases all movement keys **When** the spaceship decelerates **Then** there is a slight overshoot then stabilization (weight feel) **And** the ship returns to level (no banking) when stationary

3. **Given** the player is moving **When** the camera follows the ship **Then** the camera follows with smooth interpolation (top-down follow) **And** the ship remains centered or near-center of the viewport

4. **Given** the existing useHybridControls hook **When** it is cleaned up for spaceship controls **Then** input is read via useControlsStore and movement is computed in usePlayer.tick() called by GameLoop **And** usePlayerMovement.jsx (Rapier-based) is archived — not used

## Tasks / Subtasks

- [x] Task 1: Implement usePlayer.tick() movement logic (AC: #1, #2, #4)
  - [x] 1.1: Add new fields to usePlayer store state: `velocity: [0, 0, 0]`, `rotation: 0` (yaw radians), `bankAngle: 0` (roll radians), `speed: 0` (scalar for UI/debug). Keep existing position/HP/invuln fields.
  - [x] 1.2: Implement tick(delta, input) — compute direction vector from input (moveForward/moveBackward/moveLeft/moveRight), normalize diagonal movement to prevent 1.41x speed, apply acceleration toward targetVelocity (direction * PLAYER_BASE_SPEED), decelerate with PLAYER_FRICTION when no input (overshoot feel)
  - [x] 1.3: Implement smooth rotation — compute target yaw from movement direction via Math.atan2(dirX, -dirZ), interpolate current yaw toward target using PLAYER_ROTATION_SPEED * delta. Handle angle wrapping via shortest path: `diff = targetYaw - yaw; while(diff > PI) diff -= 2*PI; while(diff < -PI) diff += 2*PI; yaw += diff * speed * delta`
  - [x] 1.4: Implement banking — compute bankAngle proportional to lateral turn rate (yaw delta per frame), lerp bankAngle back to 0 when not turning, clamp to PLAYER_MAX_BANK_ANGLE
  - [x] 1.5: Clamp position to PLAY_AREA_SIZE boundaries (+/-200 on X and Z)

- [x] Task 2: Wire GameLoop to call usePlayer.tick() (AC: #4)
  - [x] 2.1: In GameLoop.jsx, uncomment/add Step 1 (input) — read controls from useControlsStore.getState()
  - [x] 2.2: Add Step 2 (player movement) — call usePlayer.getState().tick(clampedDelta, input)

- [x] Task 3: Clean up input hooks for spaceship (AC: #4)
  - [x] 3.1: Review useHybridControls.jsx — ensure keyboard mappings W/ArrowUp→moveForward, S/ArrowDown→moveBackward, A/ArrowLeft→moveLeft, D/ArrowRight→moveRight are synced to useControlsStore
  - [x] 3.2: Remove legacy fish controls (moveUp, moveDown, swimFast) if still present in useHybridControls
  - [x] 3.3: Archive usePlayerMovement.jsx to src/_archive/ — it uses Rapier physics (setLinvel/setAngvel) and is NOT used for spaceship movement. All movement logic lives in usePlayer.tick()
  - [x] 3.4: Ensure useHybridControls is mounted in GameplayScene or Experience

- [x] Task 4: Create PlayerShip renderer (AC: #1, #2)
  - [x] 4.1: Create src/renderers/PlayerShip.jsx — a R3F component that reads position, rotation (yaw), and bankAngle from usePlayer store
  - [x] 4.2: Use the existing spaceship GLB model (public/models/Spaceship.glb or ships/ directory) via useGLTF from Drei
  - [x] 4.3: Apply yaw rotation on Y axis, bank rotation on Z axis (or X depending on ship orientation)
  - [x] 4.4: Use useFrame to READ position/rotation/bankAngle from usePlayer store and apply to mesh transform each frame. NO interpolation logic in renderer — all smoothing happens in usePlayer.tick()

- [x] Task 5: Implement camera follow (AC: #3)
  - [x] 5.1: Adapt usePlayerCamera.jsx for top-down follow — camera positioned above player looking down, smooth lerp to follow player position
  - [x] 5.2: Camera offset: approximately [0, 30, 15] from player (tunable via Leva in debug mode)
  - [x] 5.3: Camera lookAt player position with slight lead based on velocity direction

- [x] Task 6: Set up GameplayScene (AC: #1, #3)
  - [x] 6.1: In GameplayScene.jsx, mount PlayerShip, camera hook, basic lighting (ambient + directional)
  - [x] 6.2: Add a simple ground plane or grid as spatial reference (temporary — will be replaced by space environment in Story 1.3)
  - [x] 6.3: Add useHybridControls hook mounting if not already active

- [x] Task 7: Add movement config constants (AC: #1, #2)
  - [x] 7.1: Add to gameConfig.js: PLAYER_ACCELERATION, PLAYER_FRICTION (deceleration), PLAYER_ROTATION_SPEED, PLAYER_MAX_BANK_ANGLE
  - [x] 7.2: Tune values for responsive feel: acceleration ~PLAYER_BASE_SPEED * 5, friction ~0.92 per frame, max bank ~0.4 radians (~23°)

- [x] Task 8: Verify and test (AC: #1, #2, #3, #4)
  - [x] 8.1: Verify npm run dev works with no errors
  - [x] 8.2: Verify WASD/arrows move ship in correct directions
  - [x] 8.3: Verify ship rotates smoothly toward movement direction
  - [x] 8.4: Verify ship banks during turns and returns to level
  - [x] 8.5: Verify deceleration overshoot when releasing keys
  - [x] 8.6: Verify camera follows smoothly
  - [x] 8.7: Verify ship cannot move beyond PLAY_AREA_SIZE boundaries (+/-200 on X and Z)

## Dev Notes

### Critical Architecture Context

**6-Layer Architecture (MUST follow):**
1. Config/Data → 2. Systems → 3. Stores → 4. GameLoop → 5. Rendering → 6. UI

This story touches layers 1 (config), 3 (usePlayer store), 4 (GameLoop wiring), and 5 (PlayerShip renderer, camera, GameplayScene).

**Boundary Rules:**
- Movement LOGIC goes in usePlayer.tick() (Layer 3: Store)
- Visual representation goes in PlayerShip.jsx (Layer 5: Renderer)
- GameLoop orchestrates by calling usePlayer.tick() (Layer 4)
- PlayerShip reads from usePlayer store — NEVER modifies store state
- Camera logic can use useFrame for smooth interpolation (allowed for camera)

### Movement Architecture

The movement system must follow this data flow:
```
[Keyboard] → [useControlsStore] → [GameLoop reads input]
                                        ↓
                                  [usePlayer.tick(delta, input)]
                                        ↓
                                  [usePlayer store updates position/rotation/bank]
                                        ↓
                                  [PlayerShip.jsx reads store → updates mesh transform]
                                  [usePlayerCamera reads store → updates camera position]
```

**CRITICAL: Do NOT use a physics engine (Rapier/Cannon) for ship movement.** The existing usePlayerMovement.jsx uses Rapier-style `setLinvel`/`setAngvel` — this must be replaced with pure math in usePlayer.tick(). Ship movement is pure position math (velocity += acceleration * delta, position += velocity * delta).

**CRITICAL: Do NOT put movement logic in usePlayerMovement.jsx hook or in a useFrame inside PlayerShip.** All movement computation happens in usePlayer.tick(), called by GameLoop. The hook-based approach from the fish game is being replaced by the store-based tick pattern.

### usePlayer Store — Required State Extensions

Current state (from Story 1.1):
```javascript
position: [0, 0, 0],
currentHP: 100,
maxHP: 100,
isInvulnerable: false,
```

Add for Story 1.2:
```javascript
velocity: [0, 0, 0],       // [vx, 0, vz] — Y stays 0 (top-down game)
rotation: 0,                // yaw in radians (Y-axis rotation)
bankAngle: 0,               // roll/tilt in radians (Z-axis visual rotation)
speed: 0,                   // current scalar speed (for UI/debug)
```

### Movement Math Specifics

**Top-down coordinate system:**
```
     -Z (forward, W key = "into screen")
      ↑
-X ← [ship] → +X
      ↓
     +Z (backward, S key = "toward camera")

Y is up. Camera looks down from above.
```

**Direction from input:**
```javascript
let dirX = (input.moveRight ? 1 : 0) - (input.moveLeft ? 1 : 0)
let dirZ = (input.moveForward ? -1 : 0) + (input.moveBackward ? 1 : 0)
// Normalize diagonal to prevent 1.41x speed
const length = Math.sqrt(dirX * dirX + dirZ * dirZ)
if (length > 0) { dirX /= length; dirZ /= length }
```

**Acceleration model:**
- When input active: velocity lerps toward targetVelocity (direction * PLAYER_BASE_SPEED)
- When no input: velocity decays via friction multiplier (0.92^delta → per-frame multiply)
- This creates overshoot on release (AC #2)

**Rotation (yaw):**
- Target yaw = Math.atan2(dirX, -dirZ) — face movement direction
- Handle angle wrapping (shortest path around 2π) then interpolate:
```javascript
let diff = targetYaw - currentYaw
while (diff > Math.PI) diff -= Math.PI * 2
while (diff < -Math.PI) diff += Math.PI * 2
currentYaw += diff * PLAYER_ROTATION_SPEED * delta
```

**Banking:**
- Bank angle proportional to yaw change rate (angular velocity)
- bankAngle = lerp(bankAngle, targetBank, 0.1)
- Max bank: PLAYER_MAX_BANK_ANGLE (~0.4 radians / ~23°)
- Returns to 0 when yaw is stable

### Existing Hooks — What to Reuse vs Replace

**useHybridControls.jsx — ADAPT:**
The hook maps keyboard keys to useControlsStore. It currently maps W→moveForward, S→moveBackward, A→moveLeft, D→moveRight. It may still have fish-era mappings (moveUp, moveDown, swimFast). Clean up any legacy mappings. Ensure arrow keys also map correctly. This hook must be mounted somewhere in the R3F tree (GameplayScene or Experience).

**usePlayerMovement.jsx — DO NOT USE for gameplay movement:**
This hook uses physics engine (setLinvel, setAngvel). The new movement is pure math in usePlayer.tick(). This hook can remain in the codebase for reference but should NOT be imported in GameplayScene. May be deleted or archived later.

**usePlayerCamera.jsx — ADAPT heavily:**
Current implementation follows a fish in 3rd-person. Needs to be rewritten for top-down camera looking down at the ship. Keep the lerp-based smooth following pattern. Change offset to be above player (Y ~30, Z ~15 for slight angle). lookAt player position.

### Spaceship 3D Model

The spaceship GLB model is confirmed at `public/models/ships/Spaceship.glb`. Load via:
```jsx
import { useGLTF } from '@react-three/drei'
const { scene } = useGLTF('/models/ships/Spaceship.glb')
```

**Model orientation:** Ensure the ship "front" aligns with -Z in local space so rotation math (atan2) works correctly. If the model faces +Z, rotate it 180° on Y during load.

### GameLoop Integration

In GameLoop.jsx, implement Steps 1 and 2:

```javascript
// 1. Input
const input = useControlsStore.getState()

// 2. Player movement
usePlayer.getState().tick(clampedDelta, input)
```

Only these two steps are needed for Story 1.2. Steps 3-9 remain commented for future stories.

### gameConfig.js — New Constants Needed

```javascript
// Player movement (Story 1.2)
PLAYER_ACCELERATION: 750,      // units/sec² — how fast ship reaches full speed
PLAYER_FRICTION: 0.92,         // per-frame velocity decay when no input (0-1, lower = more drag)
PLAYER_ROTATION_SPEED: 10,     // radians/sec interpolation speed for yaw
PLAYER_MAX_BANK_ANGLE: 0.4,    // radians (~23°) — max visual tilt during turns
PLAYER_BANK_SPEED: 8,          // how fast bank angle responds
```

These values are starting points — tune for "responsive but weighty" feel using Leva in debug mode.

### Previous Story Intelligence (Story 1.1)

**Key learnings from Story 1.1:**
- Tailwind CSS v4 uses @tailwindcss/vite plugin (not PostCSS config)
- useGame store uses subscribeWithSelector middleware
- GameLoop checks `phase !== 'gameplay' || isPaused` to skip ticks
- Delta is clamped to 0.1 to prevent physics explosion after tab-return
- Entity definitions are plain objects in entities/ directory
- Store pattern: create((set, get) => ({ state, tick, actions }))
- DebugControls were cleaned up — only camera mode toggle remains
- All fish-game files archived to src/_archive/

**Files from Story 1.1 relevant to Story 1.2:**
- `src/stores/usePlayer.jsx` — Extend with velocity/rotation/bank state
- `src/stores/useControlsStore.jsx` — Already has spaceship controls
- `src/GameLoop.jsx` — Wire tick calls
- `src/Experience.jsx` — Already routes to GameplayScene
- `src/scenes/GameplayScene.jsx` — Currently empty, needs content
- `src/hooks/useHybridControls.jsx` — Needs cleanup and verification
- `src/hooks/usePlayerCamera.jsx` — Needs top-down adaptation
- `src/config/gameConfig.js` — Add movement constants

**Review fix from Story 1.1:** usePlayer.jsx position is stored as plain array `[0,0,0]` (accepted as-is during review, flagged as "will be addressed in Story 1.2"). Decide whether to keep as array or convert to object {x, y, z} — array is fine for performance and store simplicity.

### Project Structure Notes

- All new files go in existing directories created in Story 1.1
- PlayerShip.jsx → `src/renderers/PlayerShip.jsx` (renderers/ directory, per architecture)
- No new directories needed
- Naming: PascalCase for component (PlayerShip.jsx), camelCase for hook adaptations

### Testing Approach

- Visual verification: ship moves in WASD directions, rotates smoothly, banks during turns
- Frame budget: movement + camera < 1ms per frame (simple math, should be trivial)
- Boundary test: ship stops at PLAY_AREA_SIZE edges
- Tab unfocus: return to tab should not cause position jump (delta clamping handles this)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#State Architecture] — GameLoop centralized, stores expose tick()
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Naming, store patterns, useFrame rules
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow] — Input → GameLoop → Stores → Renderers
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules] — Only GameLoop has high-priority useFrame for game logic
- [Source: _bmad-output/implementation-artifacts/1-1-project-foundation-architecture-setup.md] — Previous story file list, completion notes, review findings
- [Source: src/config/gameConfig.js] — PLAYER_BASE_SPEED: 150, PLAY_AREA_SIZE: 200
- [Source: src/stores/usePlayer.jsx] — Current skeleton state
- [Source: src/GameLoop.jsx] — Current skeleton with commented tick order

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Vite HMR causes module instance duplication when using dynamic `import()` from browser console — stores imported from console are different instances than those in the React tree. Resolved by exposing stores on `window` for testing, then cleaning up.

### Completion Notes List

- Implemented complete movement system in usePlayer.tick(): direction from input, diagonal normalization, exponential acceleration toward target velocity, friction-based deceleration with overshoot feel
- Smooth yaw rotation with shortest-path angle wrapping and configurable interpolation speed
- Banking proportional to turn rate (yaw angular velocity), with exponential lerp back to 0 when not turning
- Position clamping at PLAY_AREA_SIZE boundaries with velocity zeroing on contact
- GameLoop wired with Steps 1 (input read) and 2 (player tick)
- useHybridControls cleaned up: removed legacy fish controls (moveUp, moveDown, swimFast), added dash sync
- usePlayerMovement.jsx archived to src/_archive/ (Rapier-based, not used)
- PlayerShip renderer reads from store each frame via useFrame, applies yaw on Y axis and bank on Z axis via nested group
- usePlayerCamera rewritten for top-down follow with offset [0, 30, 15], smooth lerp, and velocity-based look-ahead
- GameplayScene assembled with PlayerShip, camera, controls, lighting, and temporary grid
- Movement config constants added: PLAYER_ACCELERATION=750, PLAYER_FRICTION=0.92, PLAYER_ROTATION_SPEED=10, PLAYER_MAX_BANK_ANGLE=0.4, PLAYER_BANK_SPEED=8
- Position kept as plain array [0,0,0] per Story 1.1 review decision
- useGame.jsx refactored from anonymous export to named const (no behavior change)

### File List

- `src/stores/usePlayer.jsx` — Modified: added velocity/rotation/bankAngle/speed state, implemented tick() with full movement logic, updated reset()
- `src/GameLoop.jsx` — Modified: wired Steps 1 (input) and 2 (player tick), added useControlsStore and usePlayer imports
- `src/hooks/useHybridControls.jsx` — Modified: removed legacy fish controls (moveUp/moveDown/swimFast), added dash sync, simplified to use selector for setControl
- `src/hooks/usePlayerMovement.jsx` → `src/_archive/usePlayerMovement.jsx` — Archived: Rapier-based movement not used for spaceship
- `src/renderers/PlayerShip.jsx` — New: R3F renderer component, loads Spaceship.glb, applies position/yaw/bank from usePlayer store
- `src/hooks/usePlayerCamera.jsx` — Modified: complete rewrite for top-down camera follow with smooth lerp and velocity lead
- `src/scenes/GameplayScene.jsx` — Modified: mounts PlayerShip, CameraRig, Controls, lighting, and temp grid
- `src/config/gameConfig.js` — Modified: added PLAYER_ACCELERATION, PLAYER_FRICTION, PLAYER_ROTATION_SPEED, PLAYER_MAX_BANK_ANGLE, PLAYER_BANK_SPEED
- `src/stores/useGame.jsx` — Modified: minor refactor from anonymous default export to named const (for debug, then cleaned up)

## Change Log

- 2026-02-07: Implemented Story 1.2 — Ship Movement, Rotation & Banking. Full movement system with acceleration/deceleration, smooth yaw rotation, banking on turns, boundary clamping, top-down camera follow, and GameplayScene assembly.
