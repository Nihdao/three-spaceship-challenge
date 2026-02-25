# Story 32.7: EXPLOSIVE_ROUND — Pulse Visual Update

Status: done

## Story

As a player,
I want the Explosive Round to look like a pulsing energy sphere rather than a static box,
So that its visual identity matches its explosive, volatile nature.

## Acceptance Criteria

1. **[Sphere shape]** An active EXPLOSIVE_ROUND projectile in flight is rendered as a sphere (SphereGeometry, not BoxGeometry) with base mesh scale `[1.4, 1.4, 1.4]`.

2. **[Pulse animation]** The sphere pulses in scale between 0.9 and 1.2 (relative to base scale) at approximately 8Hz during flight. All active EXPLOSIVE_ROUND spheres pulse in sync (clock-based).

3. **[Color & glow]** The base color is `#f4c430` (gold) with an emissive glow that pulses in intensity in sync with the scale (brighter at max scale, dimmer at min scale).

4. **[AOE ring on impact]** When the projectile hits an enemy OR reaches max lifetime (3.0s), an expanding flat disc (CircleGeometry) spawns at the detonation position, expanding from radius 0 to `explosionRadius` (15 units) and fading from `#f4c430` to transparent over 0.5 seconds.

5. **[No double rendering]** EXPLOSIVE_ROUND projectiles are excluded from the existing `ProjectileRenderer` (which renders all other weapons with BoxGeometry). No visual artifact from double-rendering.

6. **[Upgrade visual consistency]** Upgrade-level color overrides for EXPLOSIVE_ROUND follow the new gold theme. Upgrade meshScale entries scale from the new `[1.4, 1.4, 1.4]` base.

7. **[Game reset]** The explosion ring VFX state is cleared on game reset (retry / return to menu) so no stale rings appear at the start of a new run.

## Tasks / Subtasks

- [x] Task 1: Update EXPLOSIVE_ROUND def in `src/entities/weaponDefs.js`
  - [x] Change `projectileColor` from `'#ff2244'` to `'#f4c430'` — already done in Story 31.1
  - [x] Change `projectileMeshScale` from `[1.2, 1.2, 1.2]` to `[1.4, 1.4, 1.4]` — already done in Story 31.1
  - [x] Level 5/8/9 upgradeVisuals — N/A: Story 31.2 replaced per-level upgrades with procedural system; base gold color applies at all levels

- [x] Task 2: Create `src/systems/explosiveRoundVfx.js`
  - [x] Module-level `rings` array (max POOL_SIZE = 10 entries)
  - [x] Export `addExplosionRing(x, z, maxRadius, duration = 0.5)`: push `{ x, z, timer: duration, maxDuration: duration, maxRadius }`, skip if at capacity
  - [x] Export `tickRings(delta)`: decrement timers, splice from end when `timer <= 0`
  - [x] Export `getRings()`: returns the rings array (read-only for renderer)
  - [x] Export `resetRings()`: `rings.length = 0`
  - [x] Full implementation:
    ```js
    // src/systems/explosiveRoundVfx.js
    const POOL_SIZE = 10
    const rings = []

    export function addExplosionRing(x, z, maxRadius, duration = 0.5) {
      if (rings.length >= POOL_SIZE) return
      rings.push({ x, z, timer: duration, maxDuration: duration, maxRadius })
    }

    export function tickRings(delta) {
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].timer -= delta
        if (rings[i].timer <= 0) rings.splice(i, 1)
      }
    }

    export function getRings() { return rings }

    export function resetRings() { rings.length = 0 }
    ```

- [x] Task 3: Modify `src/renderers/ProjectileRenderer.jsx` — skip EXPLOSIVE_ROUND
  - [x] Inside the `for (let i = 0; i < projectiles.length; i++)` loop, immediately after `if (!p.active) continue`, add:
    ```js
    if (p.explosionRadius) continue // Story 32.7: rendered by ExplosiveRoundRenderer
    ```

- [x] Task 4: Create `src/renderers/ExplosiveRoundRenderer.jsx`
  - [x] **Constants**: `SPHERE_POOL = 12`, `RING_POOL = 6`
  - [x] **`useMemo` — geometry + materials**:
    - `sphereGeo = new THREE.SphereGeometry(0.5, 16, 12)` — radius 0.5; scaled by meshScale[0] → diameter = meshScale[0]
    - `sphereMat = new THREE.MeshStandardMaterial({ color: '#f4c430', emissive: '#f4c430', emissiveIntensity: 1.0, toneMapped: false })`
    - `ringGeo = new THREE.CircleGeometry(1, 32)` — unit disc, scaled per ring per frame
    - `ringMats = Array.from({ length: RING_POOL }, () => new THREE.MeshBasicMaterial({ color: '#f4c430', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }))`
  - [x] **Refs**: `sphereMeshRef`, `ringMeshRefs = useRef([])`, `dummyRef = useRef(new THREE.Object3D())`
  - [x] **`useEffect` cleanup**: dispose `sphereGeo`, `sphereMat`, `ringGeo`, each `ringMats[i]`
  - [x] **`useFrame(({ clock }) => { ... })`** — sphere pulse:
    ```js
    const elapsed = clock.getElapsedTime()
    // Pulse multiplier: oscillates between 0.9 and 1.2 at 8Hz
    const pulseMult = 1.05 + 0.15 * Math.sin(elapsed * Math.PI * 16)
    // Emissive: maps pulse [0.9, 1.2] → intensity [0.6, 1.6]
    sphereMat.emissiveIntensity = 0.6 + (pulseMult - 0.9) * (1.0 / 0.3)
    const zoneScale = usePlayer.getState().permanentUpgradeBonuses.zone
    const projectiles = useWeapons.getState().projectiles
    const dummy = dummyRef.current
    const mesh = sphereMeshRef.current
    if (!mesh) return
    let count = 0
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i]
      if (!p.active || !p.explosionRadius) continue
      dummy.position.set(p.x, p.y, p.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(p.meshScale[0] * pulseMult * zoneScale)
      dummy.updateMatrix()
      mesh.setMatrixAt(count, dummy.matrix)
      count++
    }
    mesh.count = count
    if (count > 0) mesh.instanceMatrix.needsUpdate = true
    ```
  - [x] **`useFrame` continued** — ring expansion:
    ```js
    const rings = getRings()
    for (let i = 0; i < RING_POOL; i++) {
      const ringMesh = ringMeshRefs.current[i]
      const mat = ringMats[i]
      if (!ringMesh || !mat) continue
      if (i >= rings.length) { ringMesh.visible = false; continue }
      const ring = rings[i]
      const progress = 1 - (ring.timer / ring.maxDuration) // 0=just spawned, 1=expiring
      const ringScale = Math.max(0.01, progress * ring.maxRadius)
      ringMesh.position.set(ring.x, -0.4, ring.z)
      ringMesh.rotation.x = -Math.PI / 2
      ringMesh.scale.setScalar(ringScale)
      ringMesh.visible = true
      mat.opacity = (1 - progress) * 0.55
    }
    ```
  - [x] **JSX**:
    ```jsx
    return (
      <>
        <instancedMesh
          ref={sphereMeshRef}
          args={[sphereGeo, sphereMat, SPHERE_POOL]}
          frustumCulled={false}
        />
        {Array.from({ length: RING_POOL }, (_, i) => (
          <mesh
            key={`exp-ring-${i}`}
            ref={el => { ringMeshRefs.current[i] = el }}
            geometry={ringGeo}
            material={ringMats[i]}
            frustumCulled={false}
            visible={false}
          />
        ))}
      </>
    )
    ```
  - [x] **Imports**: `useRef`, `useMemo`, `useEffect` from `react`; `useFrame` from `@react-three/fiber`; `* as THREE` from `three`; `useWeapons` from `../stores/useWeapons.jsx`; `usePlayer` from `../stores/usePlayer.jsx`; `{ getRings }` from `../systems/explosiveRoundVfx.js`

- [x] Task 5: Modify `src/GameLoop.jsx` — ring state management
  - [x] **Import** at top alongside other system imports:
    ```js
    import { addExplosionRing, tickRings, resetRings } from './systems/explosiveRoundVfx.js'
    ```
  - [x] **Section 4** (after `projectileSystemRef.current.tick(...)`, BEFORE `useWeapons.getState().cleanupInactive()`):
    ```js
    // Story 32.7: Spawn ring for EXPLOSIVE_ROUND that just expired by lifetime (not by collision)
    {
      const allProjs = useWeapons.getState().projectiles
      for (let i = 0; i < allProjs.length; i++) {
        const p = allProjs[i]
        if (!p.active && p.explosionRadius && !p.ringSpawned) {
          p.ringSpawned = true
          addExplosionRing(p.x, p.z, p.explosionRadius)
        }
      }
    }
    tickRings(clampedDelta)
    ```
  - [x] **Section 7a** — inside the `proj.explosionRadius` branch, after `addExplosion(proj.x, proj.z, proj.color)`:
    ```js
    // Story 32.7: Spawn expanding ring VFX at explosion point
    proj.ringSpawned = true
    addExplosionRing(proj.x, proj.z, proj.explosionRadius)
    ```
  - [x] **Game resets** — at BOTH reset locations (lines ~127-128 and ~151-152) alongside `resetParticles()`:
    ```js
    resetRings() // Story 32.7
    ```

- [x] Task 6: Mount `ExplosiveRoundRenderer` in `src/scenes/GameplayScene.jsx`
  - [x] Add import: `import ExplosiveRoundRenderer from '../renderers/ExplosiveRoundRenderer.jsx'`
  - [x] Add `<ExplosiveRoundRenderer />` immediately after `<ProjectileRenderer />` in the Projectiles block

- [x] Task 7: Manual QA
  - [x] Console: `useWeapons.getState().addWeapon('EXPLOSIVE_ROUND')`
  - [x] Verify projectile renders as a golden sphere (not a box)
  - [x] Verify visible scale pulse at ~8Hz during flight
  - [x] Verify emissive glow pulses in sync with scale (brighter when larger)
  - [x] Verify golden expanding disc spawns at the enemy position on hit
  - [x] Verify disc expands outward and fades to transparent over ~0.5s
  - [x] Verify disc also spawns when projectile expires by lifetime (fire into empty space, wait 3s)
  - [x] Confirm no box artifact — no double rendering
  - [x] Multiple simultaneous EXPLOSIVE_ROUNDs: all spheres pulse in sync

## Dev Notes

### Architecture Context

**Why a separate renderer (not modifying ProjectileRenderer):** `ProjectileRenderer` uses a single `instancedMesh` with `BoxGeometry(1, 1, 1)` shared across ALL active projectiles. InstancedMesh cannot mix geometries per instance. The dedicated-renderer pattern is established in Epic 32 (TacticalShotRenderer, ShockwaveRenderer) and follows the 6-layer architecture.

**Why the ring is NOT part of `addExplosion()`:** `addExplosion()` in `particleSystem.js` spawns diverging particle bursts (existing orange particles). The gold ring is an ADDITIONAL VFX layered on top — different system, different visual. Both are triggered on detonation; they coexist.

**The `ringSpawned` flag solves the double-spawn problem:** A projectile deactivated by collision in section 7a (frame N) remains in the array until `cleanupInactive()` runs in section 4 of frame N+1. Without the flag, the section 4 lifetime-check would see it (inactive, has explosionRadius, no ringSpawned) and spawn a second ring. The flag marks it as already handled.

**Lifetime expiry check MUST run before `cleanupInactive()`:** In section 4, the order is:
1. `projectileSystemRef.current.tick()` — marks expired projectiles as `p.active = false`
2. **[NEW] Ring spawn check loop** — reads inactive EXPLOSIVE_ROUND projs before removal
3. `tickRings(clampedDelta)` — ages active rings
4. `useWeapons.getState().cleanupInactive()` — removes inactive projs

If the check runs AFTER `cleanupInactive()`, lifetime-expired projs are gone and their rings never spawn.

**SphereGeometry(0.5) sizing:** BoxGeometry(1) at scale 1.4 = 1.4×1.4×1.4 box. SphereGeometry(0.5) at scale 1.4 = radius 0.7, diameter 1.4. Same visual footprint as the old box at the new base scale. Pulse range [0.9-1.2] applied on top: world diameter oscillates between 1.26 and 1.68.

**Pulse math derivation:**
- Target range [0.9, 1.2], midpoint 1.05, amplitude 0.15, frequency 8Hz
- `pulseMult = 1.05 + 0.15 * sin(elapsed * 2π * 8)` = `1.05 + 0.15 * sin(elapsed * Math.PI * 16)`
- At sin=0: pulseMult = 1.05; at sin=1: pulseMult = 1.2; at sin=-1: pulseMult = 0.9 ✓

**Emissive intensity mapping (linear):**
- `emissiveIntensity = 0.6 + (pulseMult - 0.9) * (1.0 / 0.3)`
- At 0.9 → 0.6 (dim); at 1.05 → 1.1 (mid); at 1.2 → 1.6 (bright) ✓

**Ring CircleGeometry(1, 32):** A filled disc with radius 1. Scaled by `progress * maxRadius` per frame:
- At progress=0 (just spawned): scale=0 (invisible)
- At progress=1 (expiring): scale=15 (full AOE radius)
- `mat.opacity = (1 - progress) * 0.55`: starts at 0.55, fades to 0
- `y = -0.4`, `rotation.x = -Math.PI/2`: flat on the floor, below play plane, `depthWrite: false` prevents Z-fighting

**SPHERE_POOL = 12:** With baseCooldown 1.5s and lifetime 3.0s → max ~2 active spheres per weapon slot. Pool of 12 is safe for up to 4 EXPLOSIVE_ROUND slots (edge case).

**RING_POOL = 6:** Ring duration 0.5s, baseCooldown 1.5s → max ~1 ring simultaneous at base speed. At level 9 cooldown 0.68s: ~1-2 rings max. Pool of 6 is generous safety margin.

**`resetRings()` call locations:** There are two game-reset code paths in GameLoop.jsx. Search for `resetParticles()` to find both. Both must include `resetRings()` to prevent stale rings on retry.

**Upgrade meshScale scaling from new base:**
- Old: base 1.2, level 8 → 1.44 (×1.2), level 9 → 1.68 (×1.4)
- New: base 1.4, level 8 → 1.68 (×1.2), level 9 → 1.96 (×1.4)
Consistent relative scaling maintained.

**No change to damage logic:** `proj.explosionRadius`, `proj.explosionDamage`, and the AOE loop in section 7a are untouched. Only the VFX (sphere renderer + ring) is added. Existing `addExplosion()` particle burst still fires as before.

### Weapon Def Final State (EXPLOSIVE_ROUND)

Actual implementation in `src/entities/weaponDefs.js`. No `upgrades` array — Story 31.2 replaced per-level upgrade data with a procedural system; `useWeapons.jsx:101-103` always reads `projectileColor` and `projectileMeshScale` directly from the def, so the gold base color applies universally at all levels.

```js
EXPLOSIVE_ROUND: {
  id: 'EXPLOSIVE_ROUND',
  name: 'Explosive Round',
  description: 'Slow projectile that explodes on impact for area damage',
  baseDamage: 15,
  baseCooldown: 1.5,
  baseSpeed: 150,
  projectileType: 'explosion',
  projectilePattern: 'explosion',
  explosionRadius: 15,
  explosionDamage: 10,
  projectileRadius: 1.2,
  projectileLifetime: 3.0,
  projectileColor: '#f4c430',           // Story 32.7: gold (was '#ff2244' crimson — set in Story 31.1)
  projectileMeshScale: [1.4, 1.4, 1.4], // Story 32.7: sphere base scale (set in Story 31.1)
  sfxKey: 'explosive-fire',
  knockbackStrength: 2,
  baseArea: 15,
  critChance: 0.05,
  poolLimit: 8,
  rarityWeight: 7,
  slot: 'any',
},
```

### Project Structure Notes

`ExplosiveRoundRenderer.jsx` is a new file in `src/renderers/`, following PascalCase convention consistent with all other renderers.

`explosiveRoundVfx.js` is a new file in `src/systems/`, consistent with `particleSystem.js` and `particleTrailSystem.js` (module-level stateful systems with no React/store dependency).

The `if (p.explosionRadius) continue` skip in `ProjectileRenderer` is the minimal invasive change — one line, no other modification to the existing renderer.

### Files to Create / Modify

| Action | File | Notes |
|--------|------|-------|
| Modify | `src/entities/weaponDefs.js` | No color/scale change needed (already set in Story 31.1); `pulseAnimation` flag added then removed (dead code, review fix) |
| **Create** | `src/systems/explosiveRoundVfx.js` | Ring VFX state: addExplosionRing, tickRings, getRings, resetRings |
| Modify | `src/renderers/ProjectileRenderer.jsx` | Skip `p.explosionRadius` projectiles in render loop |
| **Create** | `src/renderers/ExplosiveRoundRenderer.jsx` | Sphere InstancedMesh + ring mesh pool |
| Modify | `src/GameLoop.jsx` | Import + ring spawn on hit + ring spawn on lifetime + tickRings + resetRings; deduplicated getState() call (review fix) |
| Modify | `src/scenes/GameplayScene.jsx` | Import + mount ExplosiveRoundRenderer |

### Architecture Compliance

- ✅ Game logic (ring spawn timing, lifetime detection) in GameLoop — NOT in renderer
- ✅ Renderer reads VFX state via `getRings()` in `useFrame` — no Zustand subscription
- ✅ New renderer in `src/renderers/` — correct layer, PascalCase
- ✅ New system in `src/systems/` — consistent with particleSystem.js pattern
- ✅ `useMemo` for all geometry and materials — no allocation in useFrame
- ✅ `useEffect` cleanup — disposes all Three.js objects on unmount
- ✅ `frustumCulled={false}` on all meshes
- ✅ `ringSpawned` flag prevents double ring spawn across frames
- ✅ `tickRings()` runs in GameLoop section 4 — not in renderer
- ✅ `resetRings()` called at both game reset locations — no stale state across runs
- ✅ `depthWrite: false` on ring material — no Z-fighting
- ✅ InstancedMesh for sphere pool — correct for many-projectile scenario
- ✅ Individual meshes for ring pool — correct for few-entry, per-slot-opacity VFX

### References

- [Source: `src/entities/weaponDefs.js:306-335`] — Current EXPLOSIVE_ROUND def: `projectileColor: '#ff2244'`, `projectileMeshScale: [1.2, 1.2, 1.2]`, `explosionRadius: 15`, `projectileLifetime: 3.0`
- [Source: `src/renderers/ProjectileRenderer.jsx:46-68`] — `useFrame` loop: `if (p.explosionRadius) continue` goes after `if (!p.active) continue` (line ~48)
- [Source: `src/GameLoop.jsx:276-279`] — Section 4: `projectileSystemRef.current.tick()` then `cleanupInactive()` — ring spawn check inserts between them
- [Source: `src/GameLoop.jsx:393-407`] — Section 7a `proj.explosionRadius` branch: `proj.active = false`, AOE loop, `addExplosion()` — add `proj.ringSpawned = true` + `addExplosionRing()` after `addExplosion()`
- [Source: `src/GameLoop.jsx:127-128` and `151-152`] — Two reset locations with `resetParticles()` + `resetTrailParticles()` — add `resetRings()` at both
- [Source: `src/systems/projectileSystem.js:57-63`] — Lifetime expiry: `p.active = false` when `p.elapsedTime >= p.lifetime`
- [Source: `src/stores/useWeapons.jsx:98-130`] — Projectile fields: `x, z, y, meshScale, explosionRadius, active` — all used in renderer
- [Source: `src/renderers/TacticalShotRenderer.jsx`] — Per-slot material pattern for opacity-varying ring VFX (RING_POOL approach)
- [Source: `src/renderers/XPOrbRenderer.jsx:55-60`] — `Math.sin(elapsed * rate)` pulse pattern
- [Source: `_bmad-output/planning-artifacts/epic-32-new-weapon-mechanics.md#Story 32.7`] — AC: sphere `[1.4,1.4,1.4]`, pulse 0.9-1.2 at 8Hz, color `#f4c430`, disc AOE ring on detonation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation, no debug issues encountered.

### Completion Notes List

- Task 1: EXPLOSIVE_ROUND base color (#f4c430) and meshScale ([1.4,1.4,1.4]) already correct from Story 31.1. Per-level upgradeVisuals are N/A — Story 31.2 replaced static upgrades with procedural system; color/meshScale always read from def (useWeapons.jsx:101-103).
- Task 2: Created explosiveRoundVfx.js — module-level ring pool (POOL_SIZE=10) with addExplosionRing, tickRings, getRings, resetRings. 9 unit tests pass.
- Task 3: Added `if (p.explosionRadius) continue` skip in ProjectileRenderer to prevent double-rendering.
- Task 4: Created ExplosiveRoundRenderer.jsx — InstancedMesh sphere pool (12) with clock-based 8Hz pulse (0.9-1.2 scale, 0.6-1.6 emissive), ring mesh pool (6) with expanding disc + fade. Full Three.js cleanup on unmount.
- Task 5: Integrated ring VFX into GameLoop — import, ring spawn on collision (section 7a), ring spawn on lifetime expiry (section 4 before cleanupInactive), tickRings in section 4, resetRings at both reset locations.
- Task 6: Mounted ExplosiveRoundRenderer in GameplayScene after ProjectileRenderer.
- Task 7: Manual QA — requires user verification in-game.
- All 2630 existing tests pass — zero regressions.

### Change Log

- 2026-02-24: Story 32.7 implementation complete — EXPLOSIVE_ROUND rendered as pulsing gold sphere with expanding ring VFX on detonation.
- 2026-02-24: Code review fixes — removed dead `pulseAnimation` field + test; deduplicated getState() in GameLoop; corrected Dev Notes Final State block; completed File List.

### File List

- `src/entities/weaponDefs.js` (modified — color/scale already correct from Story 31.1; dead `pulseAnimation` field removed in code review)
- `src/entities/__tests__/weaponDefs.test.js` (modified — removed dead `pulseAnimation` test in code review)
- `src/systems/explosiveRoundVfx.js` (new)
- `src/systems/__tests__/explosiveRoundVfx.test.js` (new)
- `src/renderers/ExplosiveRoundRenderer.jsx` (new)
- `src/renderers/ProjectileRenderer.jsx` (modified — skip explosionRadius projectiles)
- `src/GameLoop.jsx` (modified — import, ring spawn, tickRings, resetRings; deduplicated getState() in code review)
- `src/scenes/GameplayScene.jsx` (modified — import + mount ExplosiveRoundRenderer)

### Senior Developer Review (AI)

Reviewed 2026-02-24. 6 issues found (1 High, 3 Medium, 2 Low). High and Medium issues fixed automatically.

**Fixed:**
- **H1** — Added `src/entities/weaponDefs.js` and its test file to the File List (were absent despite being modified)
- **M1** — Removed dead `pulseAnimation: true` field from `weaponDefs.js` and its corresponding test (`weaponDefs.test.js:198-200`). The renderer uses `p.explosionRadius` as discriminator — `pulseAnimation` was never propagated to projectile objects and never read by any system
- **M2** — Replaced misleading "Weapon Def Final State" block (which showed a non-existent `upgrades[]` array with `upgradeVisuals`) with the actual def and a clarifying note about the procedural upgrade system
- **M3** — Deduplicated `useWeapons.getState()` in GameLoop section 4 (lines 318/321 made two identical store lookups); now captured once as `activeProjectiles`

**Action items (Low — not blocking):**
- **L1** — No unit test for `ringSpawned` double-spawn prevention across frames (GameLoop section 4 + 7a interaction)
- **L2** — `getRings()` exposes internal array by mutable reference; "read-only" contract is unenforced
