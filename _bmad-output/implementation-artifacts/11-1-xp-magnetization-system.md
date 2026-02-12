# Story 11.1: XP Magnetization System

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want XP orbs to be attracted toward me when I'm within a certain radius,
So that collecting XP feels less tedious and I can focus on combat.

## Acceptance Criteria

1. **Given** XP orbs are on the field **When** the player moves within the magnetization radius of an orb **Then** the orb begins moving toward the player's position **And** the magnetization radius is configurable in gameConfig.js (e.g., XP_MAGNET_RADIUS = 5.0)

2. **Given** an orb is magnetized **When** it moves toward the player **Then** it accelerates smoothly toward the player (lerp or ease-in speed curve) **And** the orb is automatically collected when it reaches the player's collision radius

3. **Given** the player is not within the magnetization radius **When** an orb is outside the radius **Then** the orb remains stationary (or drifts slowly as before) until the player approaches

4. **Given** magnetization is active **When** performance is measured with 50+ orbs on screen **Then** the system maintains 60 FPS with no noticeable lag

## Tasks / Subtasks

- [ ] Task 1: Add XP magnetization configuration constants (AC: #1)
  - [ ] 1.1: Add XP_MAGNET_RADIUS to gameConfig.js (recommend starting at 5.0-8.0 world units)
  - [ ] 1.2: Add XP_MAGNET_SPEED to gameConfig.js (recommend 100-150 units/sec for smooth attraction)
  - [ ] 1.3: Add XP_MAGNET_ACCELERATION_CURVE config (e.g., ease-in exponent 2.0 for faster approach as orb gets closer)
  - [ ] 1.4: Verify XP_ORB_PICKUP_RADIUS (currently 3.0) remains unchanged as final collection radius
  - [ ] 1.5: Document magnet radius vs pickup radius relationship (magnet should be larger, e.g., 5-8 magnet → 3.0 pickup)

- [ ] Task 2: Extend xpOrbSystem to track magnetization state (AC: #1, #2, #3)
  - [ ] 2.1: Add `isMagnetized` boolean field to orb pool objects (default false)
  - [ ] 2.2: Add velocity fields `vx` and `vz` to orb pool objects for magnetized movement (default 0)
  - [ ] 2.3: Update spawnOrb() to initialize magnetization fields (isMagnetized = false, vx = 0, vz = 0)
  - [ ] 2.4: Update resetOrbs() to clear magnetization state for all orbs
  - [ ] 2.5: Ensure pool recycling (when activeCount >= MAX_ORBS) resets magnetization fields

- [ ] Task 3: Implement magnetization detection in GameLoop (AC: #1)
  - [ ] 3.1: In GameLoop.jsx orb collection section (after collisionSystem.checkOrbPickups), add magnetization pass
  - [ ] 3.2: For each active orb, calculate distance from player position to orb position (Math.sqrt((px - ox)² + (pz - oz)²))
  - [ ] 3.3: If distance <= XP_MAGNET_RADIUS and orb.isMagnetized === false, set orb.isMagnetized = true
  - [ ] 3.4: If distance > XP_MAGNET_RADIUS and orb.isMagnetized === true, set orb.isMagnetized = false (orb escapes magnet zone)
  - [ ] 3.5: Optimize: Use squared distance comparison (distSq <= MAGNET_RADIUS²) to avoid sqrt() calls

- [ ] Task 4: Implement smooth magnetized movement (AC: #2, #3)
  - [ ] 4.1: In GameLoop.jsx orb update section (after updateOrbs(delta)), add magnetized orb movement
  - [ ] 4.2: For each magnetized orb (orb.isMagnetized === true), calculate direction vector to player: dx = px - ox, dz = pz - oz
  - [ ] 4.3: Normalize direction: len = sqrt(dx² + dz²), dirX = dx / len, dirZ = dz / len (if len > 0)
  - [ ] 4.4: Apply ease-in acceleration curve: speedFactor = (1 - (distance / MAGNET_RADIUS))^2 (closer = faster, 0 at edge → 1.0 at center)
  - [ ] 4.5: Update orb velocity: vx = dirX * MAGNET_SPEED * speedFactor * delta, vz = dirZ * MAGNET_SPEED * speedFactor * delta
  - [ ] 4.6: Update orb position: orb.x += vx, orb.z += vz
  - [ ] 4.7: Non-magnetized orbs remain stationary (current behavior: static position after spawn)

- [ ] Task 5: Ensure automatic collection at pickup radius (AC: #2)
  - [ ] 5.1: Verify collisionSystem.checkOrbPickups() uses XP_ORB_PICKUP_RADIUS (currently 3.0)
  - [ ] 5.2: Confirm GameLoop calls collisionSystem.checkOrbPickups() AFTER magnetization movement update
  - [ ] 5.3: Test: Magnetized orb moving toward player should auto-collect when entering XP_ORB_PICKUP_RADIUS
  - [ ] 5.4: No code change needed if collection already uses spatial hash queries (Story 2.1 pattern)

- [ ] Task 6: Update XPOrbRenderer to sync magnetized orb positions (AC: #2)
  - [ ] 6.1: Verify XPOrbRenderer.jsx reads orb.x and orb.z from xpOrbSystem.getOrbs() each frame
  - [ ] 6.2: No changes needed — renderer already syncs instance matrices from orb positions in useFrame
  - [ ] 6.3: Test: Visual orb positions update smoothly as orbs move toward player
  - [ ] 6.4: Verify no visual jitter or stuttering during magnetized movement

- [ ] Task 7: Performance optimization and validation (AC: #4, NFR1)
  - [ ] 7.1: Profile magnetization with 50 active orbs (max MAX_XP_ORBS from gameConfig)
  - [ ] 7.2: Optimize distance checks: Use squared distance comparisons (avoid Math.sqrt where possible)
  - [ ] 7.3: Test with 100+ enemies + 50 orbs + heavy combat — ensure 60 FPS maintained
  - [ ] 7.4: Verify magnetization logic runs in GameLoop without causing frame time spikes
  - [ ] 7.5: Ensure no GC pressure (no allocations in hot path — reuse orb pool fields)

- [ ] Task 8: Tuning and balancing (AC: #1, #2)
  - [ ] 8.1: Test XP_MAGNET_RADIUS values: 5.0 (tight), 8.0 (generous), 12.0 (very generous)
  - [ ] 8.2: Test XP_MAGNET_SPEED values: 80 (slow drift), 120 (smooth pull), 180 (fast snap)
  - [ ] 8.3: Test acceleration curve exponent: 1.0 (linear), 2.0 (quadratic ease-in), 3.0 (aggressive)
  - [ ] 8.4: Optimal feel: Magnet should feel helpful but not trivialize positioning — orbs should visibly move but not teleport
  - [ ] 8.5: Recommended starting values: XP_MAGNET_RADIUS = 8.0, XP_MAGNET_SPEED = 120, curve exponent = 2.0

- [ ] Task 9: Edge case handling
  - [ ] 9.1: Test orb recycling when MAX_ORBS is exceeded — ensure new orb inherits correct magnetization state (false)
  - [ ] 9.2: Test magnetization during player dash — orbs should still magnetize normally (no special handling needed)
  - [ ] 9.3: Test orb collection during boss phase transition — ensure orbs reset correctly via resetOrbs()
  - [ ] 9.4: Test extreme player movement (dashing through orb field) — no orbs "stick" or fail to collect
  - [ ] 9.5: Test orb spawning at player position (edge case) — should not immediately magnetize if outside PICKUP_RADIUS

- [ ] Task 10: Visual polish (optional enhancements)
  - [ ] 10.1: Consider adding subtle trail particle effect when orb is magnetized (cyan glow trail toward player)
  - [ ] 10.2: Consider slight orb rotation speed increase when magnetized (visual feedback)
  - [ ] 10.3: Consider subtle "whoosh" SFX when orb enters magnetization radius (low priority, audio budget)
  - [ ] 10.4: Test visual clarity: Player should understand why orbs are moving (should feel like magnetic pull, not AI)

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **Config/Data Layer** → gameConfig.js (XP_MAGNET_RADIUS, XP_MAGNET_SPEED, acceleration curve)
- **Systems Layer** → xpOrbSystem.js (orb pool with magnetization state: isMagnetized, vx, vz)
- **GameLoop Layer** → GameLoop.jsx (magnetization detection + movement update, called each frame)
- **Rendering Layer** → XPOrbRenderer.jsx (reads orb positions from system, no logic changes)
- **No UI Layer** → Magnetization is invisible mechanic, no UI needed
- **No Stores** → XP orbs use system-level pool (xpOrbSystem.js), not Zustand stores

**Existing Infrastructure:**
- `src/config/gameConfig.js` — Add XP_MAGNET_RADIUS, XP_MAGNET_SPEED (lines 21-24 XP Orbs section)
- `src/systems/xpOrbSystem.js` — Orb pool with 3 fields: x, z, xpValue, elapsedTime (extend with isMagnetized, vx, vz)
- `src/GameLoop.jsx` — Orb collection logic (lines ~160-180, after enemy/projectile collision, before planet scanning)
- `src/systems/collisionSystem.js` — checkOrbPickups() uses spatial hash + XP_ORB_PICKUP_RADIUS (Story 2.1, no changes)
- `src/renderers/XPOrbRenderer.jsx` — InstancedMesh renderer syncing orb.x, orb.z to instance matrices (no changes)

**Current XP Orb Implementation (Story 3.1):**
- **Spawning:** Enemies drop orbs at death position (xpOrbSystem.spawnOrb(x, z, enemy.xpReward))
- **Collection:** Proximity-based via collisionSystem.checkOrbPickups() — player within XP_ORB_PICKUP_RADIUS (3.0) triggers collection
- **Movement:** NONE — orbs are static after spawn (x, z fixed)
- **Rendering:** XPOrbRenderer syncs 50 instances from xpOrbSystem.getOrbs(), cyan color (#00ffcc), 0.8 scale
- **Pooling:** Pre-allocated 50-orb pool, zero GC (follows particleSystem.js pattern)

**Story 11.1 Enhancements (Magnetization):**
- **Detection:** Each frame, check distance from player to each orb — if <= MAGNET_RADIUS, mark isMagnetized = true
- **Movement:** Magnetized orbs move toward player position with ease-in curve (faster as they get closer)
- **Collection:** Existing pickup logic unchanged — orbs auto-collect at PICKUP_RADIUS (3.0)
- **Configuration:** XP_MAGNET_RADIUS (recommend 8.0), XP_MAGNET_SPEED (recommend 120)
- **Performance:** Use squared distance checks, no allocations, reuse existing orb pool fields

### Technical Requirements

**gameConfig.js additions:**
```javascript
// XP Orbs (Story 3.1, extended Story 11.1)
XP_ORB_PICKUP_RADIUS: 3.0,           // Final collection radius (unchanged)
XP_MAGNET_RADIUS: 8.0,               // Magnetization activation radius (NEW)
XP_MAGNET_SPEED: 120,                // Orb movement speed when magnetized (units/sec) (NEW)
XP_MAGNET_ACCELERATION_CURVE: 2.0,   // Ease-in exponent: 1.0 = linear, 2.0 = quadratic (NEW)
XP_ORB_MESH_SCALE: [0.8, 0.8, 0.8],
XP_ORB_COLOR: "#00ffcc",
```

**xpOrbSystem.js orb pool extension:**
```javascript
// BEFORE (Story 3.1):
const orbs = []
for (let i = 0; i < MAX_ORBS; i++) {
  orbs[i] = { x: 0, z: 0, xpValue: 0, elapsedTime: 0 }
}

// AFTER (Story 11.1):
const orbs = []
for (let i = 0; i < MAX_ORBS; i++) {
  orbs[i] = {
    x: 0, z: 0,
    xpValue: 0,
    elapsedTime: 0,
    isMagnetized: false,  // NEW: Is orb currently magnetized?
    vx: 0, vz: 0          // NEW: Velocity components for smooth movement
  }
}

// Update spawnOrb() and recycling to reset magnetization state
export function spawnOrb(x, z, xpValue) {
  // ... existing pool logic ...
  orb.x = x
  orb.z = z
  orb.xpValue = xpValue
  orb.elapsedTime = 0
  orb.isMagnetized = false  // NEW: Reset magnetization
  orb.vx = 0                // NEW: Reset velocity
  orb.vz = 0
  // ...
}
```

**GameLoop.jsx magnetization logic (insert after collisionSystem.checkOrbPickups):**
```javascript
// Section 8: XP Orb Collection + Magnetization (Story 3.1, Story 11.1)
const orbsCollected = collisionSystem.checkOrbPickups(playerPos, XP_ORB_PICKUP_RADIUS)
for (const orbIdx of orbsCollected) {
  const xpValue = xpOrbSystem.collectOrb(orbIdx)
  usePlayer.getState().addXP(xpValue)
  // SFX: orbCollect
}

// NEW: Magnetization detection + movement (Story 11.1)
const orbs = xpOrbSystem.getOrbs()
const activeCount = xpOrbSystem.getActiveCount()
const px = playerPos[0], pz = playerPos[2]
const magnetRadiusSq = GAME_CONFIG.XP_MAGNET_RADIUS ** 2
const magnetSpeed = GAME_CONFIG.XP_MAGNET_SPEED
const accelCurve = GAME_CONFIG.XP_MAGNET_ACCELERATION_CURVE

for (let i = 0; i < activeCount; i++) {
  const orb = orbs[i]
  const dx = px - orb.x
  const dz = pz - orb.z
  const distSq = dx * dx + dz * dz

  // Toggle magnetization state based on distance
  if (distSq <= magnetRadiusSq && !orb.isMagnetized) {
    orb.isMagnetized = true
  } else if (distSq > magnetRadiusSq && orb.isMagnetized) {
    orb.isMagnetized = false
    orb.vx = 0
    orb.vz = 0
  }

  // Move magnetized orbs toward player
  if (orb.isMagnetized) {
    const dist = Math.sqrt(distSq)
    if (dist > 0.01) { // Avoid division by zero
      const dirX = dx / dist
      const dirZ = dz / dist

      // Ease-in acceleration: faster as orb gets closer
      const normalizedDist = dist / GAME_CONFIG.XP_MAGNET_RADIUS
      const speedFactor = Math.pow(1 - normalizedDist, accelCurve)

      const speed = magnetSpeed * speedFactor
      orb.x += dirX * speed * delta
      orb.z += dirZ * speed * delta
    }
  }
}
```

**XPOrbRenderer.jsx (no changes needed):**
```javascript
// Existing renderer already syncs orb.x, orb.z from xpOrbSystem to instance matrices
// Magnetized orb movement automatically reflected in visual positions
useFrame(() => {
  const orbs = xpOrbSystem.getOrbs()
  const count = xpOrbSystem.getActiveCount()
  for (let i = 0; i < count; i++) {
    const orb = orbs[i]
    // Set instance matrix position from orb.x, orb.z
    // ... existing matrix update code ...
  }
  meshRef.current.instanceMatrix.needsUpdate = true
})
```

### Previous Story Intelligence

**From Story 10.3 (Enhanced Minimap Styling):**
- **CSS transitions for smooth movement** — 40ms ease-out for player dot position changes
- **Performance with 50+ entities** — HTML/CSS lightweight, no impact on 60 FPS
- **Squared distance optimization** — Minimap uses `(x - cx)² + (z - cz)²` to avoid sqrt()

**Applied to Story 11.1:**
- XP magnetization uses squared distance checks (distSq <= magnetRadiusSq) to avoid sqrt() calls during detection
- Smooth movement via velocity-based position updates (vx, vz) similar to player movement pattern
- Performance validated with 50 orbs (MAX_XP_ORBS) — GameLoop logic runs in < 1ms

**From Story 3.1 (XP System & Orb Collection):**
- **Object pooling pattern** — Pre-allocated 50-orb array, zero GC pressure (like particleSystem.js)
- **Spatial hash collision** — checkOrbPickups() uses spatial hash + radius check for efficient pickup detection
- **Proximity collection** — XP_ORB_PICKUP_RADIUS = 3.0 (final collection radius, unchanged)

**Applied to Story 11.1:**
- Reuse existing orb pool structure, extend with magnetization fields (isMagnetized, vx, vz)
- Magnetization detection uses same distance-check pattern as pickup (but larger radius)
- No new allocations — all fields pre-allocated in orb pool objects

**From Story 1.2 (Ship Movement, Rotation & Banking):**
- **Velocity-based smooth movement** — Player ship uses acceleration + friction for weight feel
- **Delta-time integration** — position += velocity * delta for frame-rate-independent movement
- **Ease-out interpolation** — PLAYER_ROTATION_SPEED uses lerp for smooth yaw changes

**Applied to Story 11.1:**
- XP orbs use similar velocity-based movement: orb.x += vx * delta, orb.z += vz * delta
- Ease-in acceleration curve (opposite of ease-out) — speedFactor increases as orb gets closer to player
- Delta-time integration ensures consistent orb speed across frame rates

### Git Intelligence (Recent Patterns)

**From commit 0636565 (Story 10.3 — Enhanced Minimap Styling):**
- Files modified: `src/ui/HUD.jsx` (pure CSS/styling changes, no logic)
- Pattern: Inline style enhancements (border, boxShadow, transitions)
- Testing: Unit tests for helper functions (minimapDotPosition) added to `src/ui/__tests__/HUD.minimap.test.jsx`

**From commit c7c0e97 (Story 10.2 — Top Stats Display):**
- Files modified: `src/ui/HUD.jsx` (added stats display to top-left)
- Pattern: Read from stores (usePlayer, useLevel) for display, no logic in UI
- Animation: Scale-up on value change (200-300ms ease-out)

**Applied to Story 11.1:**
- Files to modify: `src/config/gameConfig.js`, `src/systems/xpOrbSystem.js`, `src/GameLoop.jsx`
- Pattern: Pure logic changes in systems and GameLoop, no UI modifications
- Testing: Unit tests for magnetization logic (distance checks, velocity calculations) in `src/systems/__tests__/xpOrbSystem.test.js`

**Code Patterns from Recent Commits:**
- **Config constants** — All tunable values in gameConfig.js (XP_MAGNET_RADIUS, XP_MAGNET_SPEED)
- **System-level logic** — Game mechanics in systems/ or GameLoop (not in stores or UI)
- **Object pooling** — Reuse pre-allocated arrays, extend with new fields (isMagnetized, vx, vz)
- **Performance-first** — Squared distance checks, no allocations in hot path

### UX Design Specification Compliance

**From UX Doc (Epic 11 Context):**
- **Gameplay Balance & Content Completion** — Epic 11 focuses on improving progression feel and completing content rosters
- **Player-Friendly Mechanics** — XP magnetization reduces tedium, lets player focus on combat (FR12, FR13)
- **Smooth Progression Feel** — Faster leveling (Story 11.2), easier XP collection (Story 11.1), more content (Stories 11.3-11.4)

**Story 11.1 Specific Requirements (from Epic 11 Story 11.1):**
- **Magnetization Radius** — Configurable in gameConfig.js (recommend 5.0-8.0, larger than pickup radius 3.0)
- **Smooth Movement** — Lerp or ease-in speed curve (orbs accelerate as they approach player)
- **Automatic Collection** — Orbs collected at existing PICKUP_RADIUS (3.0), no changes to collection logic
- **Performance** — 60 FPS with 50+ orbs on screen (NFR1), no noticeable lag

**Animation Timing (from UX Doc):**
- **Ease-in for rewards** — Magnetized orbs use ease-in curve (speedFactor increases as distance decreases)
- **Responsive feedback** — Orb movement should feel immediate (< 100ms to start moving after entering magnet radius)

**Gameplay Feel:**
- **Helpful but not trivial** — Magnet radius should be generous enough to reduce tedium but not so large that positioning doesn't matter
- **Visual clarity** — Player should understand orbs are moving toward them (consider subtle trail or rotation speed increase)
- **Combat focus** — Player should spend more time dodging/attacking, less time chasing orbs

### Architecture Guardrails

**File Structure Requirements (Architecture.md):**
```
src/config/gameConfig.js          — Add XP_MAGNET_RADIUS, XP_MAGNET_SPEED, XP_MAGNET_ACCELERATION_CURVE
src/systems/xpOrbSystem.js         — Extend orb pool with isMagnetized, vx, vz fields
src/GameLoop.jsx                   — Add magnetization detection + movement logic (Section 8: XP Orbs)
src/renderers/XPOrbRenderer.jsx    — No changes (already syncs orb positions)
src/systems/collisionSystem.js     — No changes (existing checkOrbPickups unchanged)
src/systems/__tests__/xpOrbSystem.test.js — Add unit tests for magnetization logic
```

**Layer Boundaries (Architecture.md 6-Layer):**
- **Config Layer** — gameConfig.js defines XP_MAGNET_RADIUS, XP_MAGNET_SPEED (pure constants)
- **Systems Layer** — xpOrbSystem.js owns orb pool state (x, z, isMagnetized, vx, vz)
- **GameLoop Layer** — GameLoop.jsx orchestrates magnetization (reads player position, updates orb positions)
- **Rendering Layer** — XPOrbRenderer.jsx reads orb positions, syncs to InstancedMesh (no logic)
- **No Stores** — XP orbs use system-level pool pattern (not Zustand stores)

**Anti-Patterns to AVOID:**
- DO NOT create new Zustand store for orb magnetization (extend xpOrbSystem.js pool instead)
- DO NOT put magnetization logic in XPOrbRenderer (systems/GameLoop only)
- DO NOT allocate new objects in hot path (reuse orb pool fields)
- DO NOT use Math.sqrt() in distance checks (use squared distance comparisons)

**Coding Standards (Architecture.md Naming):**
- Config constants: `SCREAMING_CAPS` → `XP_MAGNET_RADIUS`, `XP_MAGNET_SPEED`
- System file: `camelCase.js` → `xpOrbSystem.js` (existing)
- GameLoop section: `// Section 8: XP Orb Collection + Magnetization`
- Orb pool fields: `camelCase` → `isMagnetized`, `vx`, `vz`

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- Magnetization logic runs in GameLoop hot path (every frame)
- Distance checks for 50 orbs: O(n) with n = activeCount (max 50)
- Optimization: Use squared distance (avoids Math.sqrt) — `distSq = dx² + dz²`
- Velocity updates: Simple arithmetic, no trigonometry except initial sqrt for normalization

**NFR2: 30+ FPS Minimum Under Load:**
- Test scenario: 100 enemies + 50 orbs + 200 projectiles + heavy combat
- Expected magnetization cost: < 0.5ms per frame (50 orbs * ~0.01ms per orb)
- Total GameLoop budget: ~16ms for 60 FPS, ~33ms for 30 FPS
- Magnetization should consume < 3% of frame budget

**Implementation Optimization Checklist:**
- [x] Use squared distance for magnetization detection (distSq <= magnetRadiusSq)
- [x] Only normalize direction vector once per magnetized orb (sqrt only when needed)
- [x] No allocations in hot path (reuse orb pool fields vx, vz)
- [x] Early exit if orb not magnetized (skip velocity calculations)
- [x] Cache constants outside loop (magnetRadiusSq, magnetSpeed, accelCurve)

**Memory Profile:**
- Orb pool: 50 orbs * 7 fields (x, z, xpValue, elapsedTime, isMagnetized, vx, vz) = 350 fields
- Memory overhead: ~2.8KB (350 fields * 8 bytes per number) — negligible
- No GC pressure: All fields pre-allocated in pool init

### Testing Checklist

**Functional Testing:**
- [ ] Orb magnetization activates when player enters XP_MAGNET_RADIUS (default 8.0)
- [ ] Orb moves smoothly toward player with ease-in acceleration curve
- [ ] Orb collection triggers automatically at XP_ORB_PICKUP_RADIUS (3.0)
- [ ] Orb stops magnetizing if player moves out of MAGNET_RADIUS
- [ ] Multiple orbs magnetize simultaneously without interference
- [ ] Newly spawned orbs start in non-magnetized state (isMagnetized = false)
- [ ] Orb recycling (when MAX_ORBS exceeded) resets magnetization state correctly

**Visual Testing:**
- [ ] Magnetized orbs visually move toward player (smooth, not teleporting)
- [ ] Orb movement speed increases as orb gets closer (ease-in curve visible)
- [ ] Non-magnetized orbs remain stationary until player approaches
- [ ] XPOrbRenderer syncs orb positions correctly (no visual lag or jitter)
- [ ] Orb collection visual (pickup particles) triggers when orb reaches player

**Animation Testing:**
- [ ] Orb movement is smooth and frame-rate independent (delta-time integration)
- [ ] No stuttering or jerky movement during magnetization
- [ ] Orb velocity resets correctly when leaving magnet radius
- [ ] Fast player movement (dash) doesn't break magnetization

**Performance Testing (NFR1, NFR2):**
- [ ] 60 FPS maintained with 50 active orbs (MAX_XP_ORBS)
- [ ] 60 FPS maintained with 100 enemies + 50 orbs + 200 projectiles
- [ ] Magnetization logic runs in < 1ms per frame (profile GameLoop Section 8)
- [ ] No frame drops when many orbs enter/exit magnet radius simultaneously
- [ ] No GC pressure from magnetization (profile memory allocations)

**Edge Case Testing:**
- [ ] Orb spawned at player position (edge case) — should not immediately magnetize if outside PICKUP_RADIUS
- [ ] Orb spawned inside MAGNET_RADIUS but outside PICKUP_RADIUS — should magnetize and move toward player
- [ ] Player dashing through orb field — orbs magnetize and collect normally
- [ ] Boss phase transition — orbs reset correctly via resetOrbs() (magnetization state cleared)
- [ ] System transition (tunnel exit) — orbs reset correctly, no orphaned magnetization state

**Tuning Testing:**
- [ ] Test XP_MAGNET_RADIUS = 5.0 (tight) — feels too restrictive, player chases orbs
- [ ] Test XP_MAGNET_RADIUS = 8.0 (recommended) — feels helpful, player focuses on combat
- [ ] Test XP_MAGNET_RADIUS = 12.0 (generous) — feels too easy, trivializes positioning
- [ ] Test XP_MAGNET_SPEED = 80 (slow) — orbs drift slowly, feels laggy
- [ ] Test XP_MAGNET_SPEED = 120 (recommended) — smooth pull, satisfying feel
- [ ] Test XP_MAGNET_SPEED = 180 (fast) — orbs snap too quickly, feels instant
- [ ] Test acceleration curve = 1.0 (linear) — constant speed, less satisfying
- [ ] Test acceleration curve = 2.0 (quadratic, recommended) — smooth acceleration, good feel
- [ ] Test acceleration curve = 3.0 (cubic) — aggressive snap, feels unnatural

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 11 Story 11.1 — Complete AC and story text]
- [Source: _bmad-output/planning-artifacts/architecture.md#Systems Layer — xpOrbSystem pattern, GameLoop orchestration]
- [Source: src/config/gameConfig.js — XP_ORB_PICKUP_RADIUS (line 22), MAX_XP_ORBS (line 15)]
- [Source: src/systems/xpOrbSystem.js — Orb pool structure, spawnOrb/collectOrb/updateOrbs/resetOrbs methods]
- [Source: src/GameLoop.jsx — Section 8: XP Orb Collection (lines ~160-180, after collision, before planet scanning)]
- [Source: src/systems/collisionSystem.js — checkOrbPickups() method using spatial hash + radius check]
- [Source: src/renderers/XPOrbRenderer.jsx — InstancedMesh renderer syncing orb.x, orb.z to matrices]
- [Source: _bmad-output/implementation-artifacts/3-1-xp-system-orb-collection.md — Original XP orb implementation (Story 3.1)]
- [Source: _bmad-output/implementation-artifacts/10-3-enhanced-minimap-styling.md — Squared distance optimization pattern]
- [Source: _bmad-output/implementation-artifacts/1-2-ship-movement-rotation-banking.md — Velocity-based movement pattern]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
