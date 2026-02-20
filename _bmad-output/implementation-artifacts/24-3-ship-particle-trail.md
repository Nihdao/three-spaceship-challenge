# Story 24.3: Ship Particle Trail

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want my ship to leave a subtle glowing trail when moving,
so that movement feels dynamic and visually satisfying.

## Acceptance Criteria

1. **AC1 — Trail particles when moving:** A trail of elongated glowing particles appears behind the ship when moving. The trail follows the ship's movement path (not aim direction). Particles fade out over ~0.7 seconds. The trail color is white (`#ffffff`) with 45% base opacity for subtlety. No particles spawn when the ship is stationary; the transition from moving to stationary is smooth.

2. **AC2 — Trail visual style:** The trail consists of elongated particles (2.2x stretch along movement direction) that shrink and dim as they age. Material opacity at 0.45 combined with HSL fade to black gives a subtle, non-distracting effect.

3. **AC3 — Dash trail intensification:** When dashing, the trail intensifies briefly (brighter, more particles). This provides additional visual feedback for the dash action beyond the existing dash trail plane mesh.

4. **AC4 — Performance:** Particle count is limited (max 30-50 trail particles). Particles use InstancedMesh (matching existing ParticleRenderer pattern) for efficient rendering. No measurable FPS impact during normal gameplay.

5. **AC5 — Stationary behavior:** When the ship is not moving, the trail fades out completely. No new particles are spawned. Existing particles continue their fade-out lifecycle.

## Tasks / Subtasks

- [x] Task 1 — Add trail config to gameConfig.js (AC: #1, #3, #4)
  - [x] Add `SHIP_TRAIL` section to `ENVIRONMENT_VISUAL_EFFECTS` with: `MAX_PARTICLES` (50), `PARTICLE_LIFETIME` (0.7), `EMISSION_RATE` (20 particles/sec), `PARTICLE_SIZE` (0.3), `COLOR` ('#ffffff'), `DASH_EMISSION_MULTIPLIER` (2.5), `DASH_BRIGHTNESS_MULTIPLIER` (1.5), `MIN_SPEED_THRESHOLD` (5), `PARTICLE_ELONGATION` (2.2)
- [x] Task 2 — Create particleTrailSystem.js (AC: #1, #4, #5)
  - [x] Pre-allocate particle pool (same pattern as `particleSystem.js`): `{ x, z, dirX, dirZ, lifetime, elapsedTime, active, color, size }`
  - [x] Export: `emitTrailParticle(x, z, color, lifetime, size, dirX, dirZ)`, `updateTrailParticles(delta)`, `getTrailParticles()`, `getActiveTrailCount()`, `resetTrailParticles()`
  - [x] Use swap-with-last compaction for expired particles (same as explosion system)
- [x] Task 3 — Create TrailRenderer.jsx (AC: #1, #2)
  - [x] InstancedMesh with SphereGeometry(1, 4, 4) and MeshBasicMaterial (toneMapped: false, transparent: true, opacity: 0.45)
  - [x] Per-instance color via instanceColor (fade opacity via lightness: `ageFactor = 1 - elapsedTime/lifetime`)
  - [x] Per-instance scale: shrink as particle ages, elongated along movement direction via `lookAt` + non-uniform Z scale (`PARTICLE_ELONGATION`)
  - [x] Set `frustumCulled={false}`
  - [x] Dispose geometry + material in useEffect cleanup
- [x] Task 4 — Integrate trail emission in GameLoop (AC: #1, #3, #5)
  - [x] After player movement tick (section 2), read position + velocity from `usePlayer.getState()`
  - [x] Calculate speed: `Math.hypot(velocity[0], velocity[2])`
  - [x] If speed > `MIN_SPEED_THRESHOLD`: emit particles at `EMISSION_RATE * delta` rate
  - [x] If `isDashing`: multiply emission rate by `DASH_EMISSION_MULTIPLIER`
  - [x] Call `updateTrailParticles(delta)` each frame
- [x] Task 5 — Add TrailRenderer to GameplayScene (AC: #1)
  - [x] Import and render `<TrailRenderer />` in GameplayScene alongside other renderers
- [x] Task 6 — Add reset call (AC: #5)
  - [x] Call `resetTrailParticles()` on game reset (same location as other particle/system resets)
- [x] Task 7 — Write tests (AC: #1, #4, #5)
  - [x] Config tests: `SHIP_TRAIL` section exists with all required fields, `MAX_PARTICLES <= 100`
  - [x] System tests: `emitTrailParticle` adds particles, `updateTrailParticles` ages and removes expired, pool doesn't exceed max, `resetTrailParticles` clears all

## Dev Notes

### Architecture Compliance — 6-Layer Pattern

- **Config Layer** (`src/config/gameConfig.js`): Add `SHIP_TRAIL` under `ENVIRONMENT_VISUAL_EFFECTS`
- **Systems Layer** (`src/systems/particleTrailSystem.js`): New file — pre-allocated particle pool, pure logic, no R3F
- **Rendering Layer** (`src/renderers/TrailRenderer.jsx`): New file — InstancedMesh renderer reading from particleTrailSystem
- **GameLoop** (`src/hooks/GameLoop.jsx`): Add trail emission after player movement tick + `updateTrailParticles(delta)` call
- **Scene Layer** (`src/scenes/GameplayScene.jsx`): Mount `<TrailRenderer />`
- **No store changes**: Trail is purely visual — no Zustand store needed

### Existing Patterns to Follow Exactly

**particleSystem.js** (explosion particles) is the template:
- Pre-allocated array of particle objects in module scope
- `activeCount` tracks live particles
- Swap-with-last compaction when particles expire
- Exported functions: emit, update, get, getCount, reset
- Zero dynamic allocation during gameplay

**ParticleRenderer.jsx** is the rendering template:
- `useRef()` for meshRef + dummyRef (THREE.Object3D)
- `useMemo()` for geometry/material creation (NOT in useFrame)
- `useFrame()` reads system state, updates instance matrices + colors
- `useEffect()` cleanup disposes geometry + material
- `frustumCulled={false}` on the instancedMesh
- MeshBasicMaterial with `toneMapped: false` for bright glow
- instanceColor via `InstancedBufferAttribute` for per-particle color/fade

### PlayerShip Position Access

Read position from store in GameLoop (NOT prop drilling):
```javascript
const { position, isDashing } = usePlayer.getState()
```

Position is `[x, y, z]` array. Trail particles spawn at `(position[0], position[2])` — the XZ plane.

Velocity for speed check: compute from position delta or use `velocity` if available in store. If velocity is not directly in usePlayer, compute `speed = Math.hypot(dx, dz)` from frame-to-frame position change (store previous position in a ref).

### Existing Dash Trail (PlayerShip.jsx lines 104-114)

There is already a magenta plane mesh (`DASH_TRAIL_COLOR: '#ff00ff'`) visible only during dash. The new particle trail is a SEPARATE, additive effect:
- Existing dash trail: plane mesh, magenta, visible only during dash
- New particle trail: elongated particles, white, visible when moving, intensified during dash
- Both effects coexist — do NOT remove the existing dash trail

### Trail Emission Spawn Position

Particles should spawn slightly behind the ship center (offset -2 to -4 units along the ship's movement direction). Add small random scatter (+-0.3 units) for organic look. The Y position for all trail particles is 0 (ground plane level, same as ship).

### Color Fading Strategy

Use instanceColor lightness for fade (same as ParticleRenderer explosions):
```javascript
const ageFactor = 1 - (particle.elapsedTime / particle.lifetime)
colorRef.current.setHSL(hue, saturation, lightness * ageFactor)
meshRef.current.setColorAt(i, colorRef.current)
```
This dims the particle to black as it ages, creating a natural fade-out. Extract the base HSL from `SHIP_TRAIL.COLOR` once at init.

### GameLoop Integration Point

In GameLoop.jsx, the tick order is sections 1-9. Trail emission fits after player movement:
```
// Section 2: Player movement
usePlayer.getState().tick(delta, input)

// NEW: Section 2.5 — Trail particle emission
// Read position, compute speed, emit if moving
// Call updateTrailParticles(delta) to age all particles
```

### Performance Budget

- 50 particles max × 1 InstancedMesh = 1 draw call
- SphereGeometry(1, 4, 4) = 32 triangles per particle → 1600 triangles total (negligible)
- No useFrame allocation — all refs and pre-allocated objects
- No texture loading — pure color material
- Expected: <0.1ms CPU per frame, <0.01ms GPU

### Files to Create

| File | Purpose |
|------|---------|
| `src/systems/particleTrailSystem.js` | Pre-allocated particle pool + update logic |
| `src/renderers/TrailRenderer.jsx` | InstancedMesh renderer for trail particles |

### Files to Modify

| File | Change |
|------|--------|
| `src/config/gameConfig.js` | Add `SHIP_TRAIL` config under `ENVIRONMENT_VISUAL_EFFECTS` |
| `src/hooks/GameLoop.jsx` | Add trail emission after player tick + updateTrailParticles call |
| `src/scenes/GameplayScene.jsx` | Mount `<TrailRenderer />` |

### Files NOT to Modify

- `src/renderers/PlayerShip.jsx` — Do not add trail logic here; trail is a separate renderer
- `src/stores/usePlayer.jsx` — No store changes needed; trail is visual-only
- `src/systems/particleSystem.js` — Do not reuse explosion particles; separate pool for trail

### Testing Strategy

- **Config tests** (`src/config/__tests__/`): Validate SHIP_TRAIL config exists with correct fields and bounds
- **System tests** (`src/systems/__tests__/particleTrailSystem.test.js`): Unit test emit, update, age-out, pool limits, reset
- **No renderer tests needed**: Visual rendering tested via manual playtest (consistent with existing renderer pattern — ParticleRenderer has no unit tests)

### Drei Trail Component — DO NOT USE

Drei v10.0.4 (installed version) has a `<Trail>` component but it creates mesh-based ribbon trails, not point particles. It's designed for continuous line trails, not scattered particle effects. Use custom InstancedMesh implementation instead (matches existing codebase patterns).

### Project Structure Notes

- All new files follow established naming: `camelCase` for systems, `PascalCase` for renderers
- New files go in existing `src/systems/` and `src/renderers/` directories
- Config additions nest under existing `ENVIRONMENT_VISUAL_EFFECTS` section
- No new dependencies needed — uses THREE.js core (InstancedMesh, SphereGeometry, MeshBasicMaterial)

### Previous Story Intelligence (Story 24.2)

Story 24.2 (Universe Background Enhancement) is ready-for-dev but not yet implemented. It modifies `EnvironmentRenderer.jsx` and `gameConfig.js` (ENVIRONMENT_VISUAL_EFFECTS section). If 24.2 runs first, be aware of new config keys in `ENVIRONMENT_VISUAL_EFFECTS` (BACKGROUND section). The trail story adds its own `SHIP_TRAIL` key — no conflict expected.

### Git Intelligence

Recent commits focus on permanent upgrades (Story 20.1), loot system (Stories 19.x), and transitions (Stories 17.x). No recent changes to particle systems, renderers, or GameLoop trail logic. The explosion particle system (particleSystem.js + ParticleRenderer.jsx) has been stable since Epic 2.

### References

- [Source: _bmad-output/planning-artifacts/epic-24-visual-polish-qol.md#Story 24.3]
- [Source: src/systems/particleSystem.js] — Explosion particle pool pattern to replicate
- [Source: src/renderers/ParticleRenderer.jsx] — InstancedMesh renderer pattern to replicate
- [Source: src/config/gameConfig.js#ENVIRONMENT_VISUAL_EFFECTS] — Config location for trail constants
- [Source: src/renderers/PlayerShip.jsx#lines 46-89] — Position reading pattern via usePlayer.getState()
- [Source: src/hooks/GameLoop.jsx] — Tick order for trail emission integration
- [Source: src/scenes/GameplayScene.jsx] — Scene composition for mounting TrailRenderer

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — clean implementation, no debugging needed.

### Completion Notes List
- Task 1: Added SHIP_TRAIL config under ENVIRONMENT_VISUAL_EFFECTS with 11 fields (including PARTICLE_ELONGATION, SPAWN_OFFSET_BEHIND, SPAWN_SCATTER)
- Task 2: Created particleTrailSystem.js with pre-allocated pool (dirX/dirZ + isDashing per particle), swap-with-last compaction, JSDoc documentation, all 5 exported functions
- Task 3: Created TrailRenderer.jsx with InstancedMesh, HSL-based color fading with dash brightness multiplier, directional elongation via manual atan2 rotation (performance optimized), opacity 0.45, frustumCulled=false, useEffect cleanup with comment
- Task 4: Integrated trail emission in GameLoop section 2c — speed computed from frame-to-frame position delta with safety guard, emission rate accumulator, config-driven spawn offset + scatter, dash multiplier + isDashing flag passed to emitter
- Task 5: Mounted TrailRenderer in GameplayScene alongside other renderers
- Task 6: Added resetTrailParticles() calls in both reset paths (tunnel transition + new game)
- Task 7: 19 tests total (12 config + 7 system), all passing. Full regression suite: 1481 tests, 89 files, 0 failures.

### Change Log
- 2026-02-15: Implemented ship particle trail system (Story 24.3) — all 7 tasks complete
- 2026-02-15: Post-implementation tuning per user feedback — white color, larger particles (0.3), longer lifetime (0.7s), directional elongation (2.2x), 45% opacity for subtlety
- 2026-02-15: Code review fixes (11 issues) — AC3 dash brightness fully implemented, PARTICLE_ELONGATION test coverage, performance optimization (atan2 rotation), magic numbers extracted to config, JSDoc documentation added, division-by-zero safety guard, all MEDIUM issues resolved

### File List
- `src/config/gameConfig.js` — Modified: added SHIP_TRAIL config under ENVIRONMENT_VISUAL_EFFECTS
- `src/systems/particleTrailSystem.js` — Created: pre-allocated particle pool with emit/update/reset
- `src/renderers/TrailRenderer.jsx` — Created: InstancedMesh renderer with HSL fade
- `src/GameLoop.jsx` — Modified: added trail emission (section 2c), import, reset calls
- `src/scenes/GameplayScene.jsx` — Modified: mounted TrailRenderer
- `src/config/__tests__/gameConfig.shipTrail.test.js` — Created: 9 config validation tests
- `src/systems/__tests__/particleTrailSystem.test.js` — Created: 7 system unit tests
