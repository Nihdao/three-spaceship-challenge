# Story 14.1: Camera Top View & Rotation Decoupling

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the camera to remain in a fixed top-down orientation while my ship rotates independently toward my input direction,
So that the game feels more like a classic top-down survivors-like with clearer spatial awareness and less disorientation.

## Acceptance Criteria

**Given** the player is in gameplay
**When** the camera system is active
**Then** the camera maintains a pure top-down view (orthogonal to the play area, looking straight down at Y=0 plane)
**And** the camera position follows the player's XZ position with smooth interpolation
**And** the camera does NOT rotate to follow the player's facing direction

**Given** the player provides directional input (WASD/arrows)
**When** the player moves in any direction
**Then** the ship rotates to face the input direction independently of the camera orientation
**And** the ship's visual banking animation still functions correctly during turns
**And** the ship's movement feels natural and responsive in the fixed top-down view

**Given** weapons are equipped
**When** weapons fire
**Then** projectiles are spawned in the ship's current facing direction (ship.rotation yaw)
**And** projectiles travel correctly in 3D space relative to the ship's orientation
**And** the fixed camera view does not affect weapon targeting accuracy

**Given** the player is navigating the play area
**When** viewing the game from the new top-down camera
**Then** spatial awareness is improved (player can see threats from all directions equally)
**And** the minimap orientation remains consistent with the main view
**And** there is no camera rotation that could cause disorientation

**Given** the camera is in top-down mode
**When** the player dashes (if dash is active)
**Then** the dash barrel roll animation is still visible and satisfying from above
**And** the camera does not tilt or rotate during dash

## Tasks / Subtasks

- [ ] Task 1: Update usePlayerCamera to pure top-down mode (AC: 1)
  - [ ] Subtask 1.1: Remove camera rotation/lookAt logic tied to player facing
  - [ ] Subtask 1.2: Set camera to look straight down at player position (orthogonal view)
  - [ ] Subtask 1.3: Maintain smooth XZ position following with configurable height
  - [ ] Subtask 1.4: Remove velocity-based look-ahead (if present)

- [ ] Task 2: Ensure ship rotation independence (AC: 2)
  - [ ] Subtask 2.1: Verify usePlayer.tick() rotation logic works independently of camera
  - [ ] Subtask 2.2: Test ship rotation at all 8 cardinal/diagonal directions
  - [ ] Subtask 2.3: Verify banking animation still triggers correctly during turns

- [ ] Task 3: Validate weapon firing in top-down view (AC: 3)
  - [ ] Subtask 3.1: Test all weapon types fire in correct direction relative to ship yaw
  - [ ] Subtask 3.2: Verify projectiles spawn at correct offsets from ship position
  - [ ] Subtask 3.3: Test weapon aiming with ship rotating in all directions

- [ ] Task 4: Verify visual consistency and polish (AC: 4, 5)
  - [ ] Subtask 4.1: Test camera shake (Story 4.6) still functions correctly in top-down mode
  - [ ] Subtask 4.2: Verify dash barrel roll animation is visible and satisfying from above
  - [ ] Subtask 4.3: Check that no camera rotation occurs during any game event
  - [ ] Subtask 4.4: Test spatial awareness and gameplay feel in top-down mode

## Dev Notes

### Current Camera Behavior (to be changed)

The current camera system in `src/hooks/usePlayerCamera.jsx`:
- Follows player position with smooth interpolation
- Looks at player position with slight velocity-based lead
- Uses `state.camera.lookAt(smoothedLookAt.current)` which can introduce rotation
- Configured via Leva controls (offsetY, offsetZ, posSmooth, lookSmooth)

The ship rotation in `src/stores/usePlayer.jsx`:
- Rotates to face movement direction using PLAYER_ROTATION_SPEED
- Banking animation tied to turn sharpness
- Rotation is stored as `rotation` field (yaw, in radians)

### Implementation Approach

**Camera Changes (usePlayerCamera.jsx):**
1. Remove the velocity-based look-ahead calculation (`_lookTarget` with velocity offset)
2. Change `state.camera.lookAt()` to always target `[playerX, 0, playerZ]` (fixed Y=0 plane)
3. Optionally: Convert to OrthographicCamera for true top-down feel (or keep PerspectiveCamera with high Y offset)
4. Ensure camera never rotates on X or Z axes (pure top-down = rotation.x = -π/2, rotation.z = 0)

**Ship Rotation (no changes needed in core logic):**
- The ship's rotation is already decoupled from camera
- `usePlayer.tick()` calculates `targetRotation` based on input direction
- Rotation is interpolated smoothly via PLAYER_ROTATION_SPEED
- Banking is visual-only (bankAngle) and applied in PlayerShip.jsx renderer

**Weapons:**
- Weapons already use `usePlayer.getState().rotation` to determine firing direction
- No changes needed in weapon firing logic
- Verify projectiles spawn correctly with ship rotation in all directions

**Potential Issues & Solutions:**
- **Issue**: Camera shake might feel odd if applied in XZ plane only
  - **Solution**: Keep current shake implementation, it adds to camera.position which is fine
- **Issue**: Perspective camera might create visual distortion at edges
  - **Solution**: Increase camera offsetY for more "flattened" perspective, or switch to OrthographicCamera
- **Issue**: Banking animation might be less visible from pure top-down
  - **Solution**: Test and potentially increase bank angle slightly, or keep as-is

### Testing Standards

- Manual playtesting with all 8 directional inputs (N, NE, E, SE, S, SW, W, NW)
- Verify weapon projectiles fire in correct directions for all ship rotations
- Test with multiple weapons equipped (frontal, orbital, spread)
- Verify dash animation is still satisfying from top-down view
- Test camera shake during damage
- Ensure no camera rotation artifacts during any gameplay scenario

### Project Structure Notes

**Files to modify:**
- `src/hooks/usePlayerCamera.jsx` — primary implementation
- Potentially `src/config/gameConfig.js` — adjust camera height/offset defaults if needed

**Files to read/verify:**
- `src/stores/usePlayer.jsx` — understand rotation logic (no changes needed)
- `src/renderers/PlayerShip.jsx` — verify banking animation still renders correctly
- `src/stores/useWeapons.jsx` — verify weapon firing uses ship rotation correctly

**No new files needed.**

Alignment with architecture:
- Camera logic belongs in hooks/ (existing pattern)
- Ship rotation belongs in stores/usePlayer (already there)
- Renderer reads store state and applies visual transforms (already correct)
- GameLoop orchestrates tick order (no changes needed)

### References

- **Source**: Epic 14 definition in sprint-status.yaml
- **Architecture Pattern**: [Architecture.md#Camera - hooks/usePlayerCamera.jsx]
- **Related Stories**:
  - Story 1.2: Ship Movement, Rotation & Banking (established rotation system)
  - Story 4.6: Visual Damage Feedback (camera shake implementation)
  - Story 5.1: Dash / Barrel Roll (dash animation visibility)

**Technical Constraints from Architecture:**
- Camera is managed via `useCameraStore` and `usePlayerCamera` hook
- Camera follows player via useFrame in dedicated hook (not in GameLoop)
- Banking animation is visual-only, applied in PlayerShip.jsx renderer via bankRef Z-axis rotation
- Weapon firing direction is read from `usePlayer.getState().rotation` each frame

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled by dev agent)

### Completion Notes List

(To be filled by dev agent)

### File List

(To be filled by dev agent)
