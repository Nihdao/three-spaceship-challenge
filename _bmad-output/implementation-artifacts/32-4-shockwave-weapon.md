# Story 32.4: SHOCKWAVE — Arc Wave Burst

Status: ready-for-dev

## Story

As a player,
I want to emit expanding arc waves toward my cursor that push enemies back hard,
So that I have a powerful area-denial and crowd-control tool.

## Acceptance Criteria

1. **[3-arc burst sequence]** When the cooldown expires, 3 arcs are emitted in sequence: arc 1 spawns immediately, arc 2 after `waveDelay` seconds, arc 3 after `waveDelay * 2` seconds. All 3 arcs use the cursor direction at the moment the cooldown fires (direction is locked at burst start).

2. **[Arc geometry and expansion]** Each arc spans `waveSectorAngle` radians (~120°) centered on the cursor direction. It starts at radius 0 and expands outward at `waveExpandSpeed` units/sec until it reaches `effectiveMaxRadius = waveMaxRadius * zoneMultiplier`, then despawns.

3. **[Once-per-arc damage]** Each enemy can only be damaged once per arc (not per frame). Damage fires when the expanding arc ring crosses through the enemy's position AND the enemy is within the sector angle. Damage = `baseDamage * damageMultiplier` with crit roll per burst.

4. **[Strong knockback]** On hit, the enemy receives a radial knockback impulse outward from the arc center, using the existing `applyKnockbackImpulse()` function with a synthetic projectile-like object `{ weaponId, dirX, dirZ }` pointing radially outward.

5. **[Area scaling]** When `zoneMultiplier` increases via permanent upgrades or boons, `effectiveMaxRadius = waveMaxRadius * zoneMultiplier` scales accordingly. Both visual arc expansion and damage zone scale together.

6. **[Pool limit = 9]** At most 9 arc instances are active simultaneously (3 bursts × 3 arcs). If at the limit when a new arc spawns, the oldest active arc is deactivated.

7. **[Visual fade]** Each arc renders as a thin sector ring in `#f9e547` (bright yellow), fading opacity from ~0.7 to 0 as `currentRadius / maxRadius` progresses from 0 to 1, with additive blending.

8. **[`implemented: false` removed]** At the end of this story, the `implemented: false` flag is removed from SHOCKWAVE in `weaponDefs.js`.

## Tasks / Subtasks

- [ ] Task 1: Add `SHOCKWAVE` def to `src/entities/weaponDefs.js`
  - [ ] Insert after DIAGONALS (or after EXPLOSIVE_ROUND if 32.3 not yet merged)
  - [ ] Fields: `id: 'SHOCKWAVE'`, `name: 'Shockwave'`, `description: '3 expanding arc waves centered on cursor with strong knockback'`
  - [ ] Stats: `baseDamage: 40`, `baseCooldown: 2.5`
  - [ ] Wave params: `weaponType: 'shockwave'`, `waveCount: 3`, `waveDelay: 0.2`, `waveSectorAngle: Math.PI * 2 / 3` (~2.094 rad, 120°), `waveExpandSpeed: 100`, `waveMaxRadius: 22`
  - [ ] Visual: `projectileColor: '#f9e547'`, `poolLimit: 9`
  - [ ] Other: `sfxKey: 'shockwave-fire'`, `knockbackStrength: 5`, `rarityDamageMultipliers: { ...DEFAULT_RARITY_DMG }`, `slot: 'any'`, `implemented: false`
  - [ ] Omit: `baseSpeed`, `projectileType`, `projectilePattern`, `projectileRadius`, `projectileLifetime`, `projectileMeshScale` — not applicable to arc weapons
  - [ ] Upgrades array (levels 2–9, damage + cooldown):
    ```js
    upgrades: [
      { level: 2, damage: 48,  cooldown: 2.4,  statPreview: 'Damage: 40 → 48' },
      { level: 3, damage: 57,  cooldown: 2.25, statPreview: 'Damage: 48 → 57' },
      { level: 4, damage: 68,  cooldown: 2.1,  statPreview: 'Damage: 57 → 68' },
      { level: 5, damage: 81,  cooldown: 1.95, statPreview: 'Damage: 68 → 81', upgradeVisuals: { color: '#fbed6a' } },
      { level: 6, damage: 96,  cooldown: 1.8,  statPreview: 'Damage: 81 → 96' },
      { level: 7, damage: 114, cooldown: 1.65, statPreview: 'Damage: 96 → 114' },
      { level: 8, damage: 135, cooldown: 1.5,  statPreview: 'Damage: 114 → 135' },
      { level: 9, damage: 160, cooldown: 1.35, statPreview: 'Damage: 135 → 160', upgradeVisuals: { color: '#fff0a0' } },
    ],
    ```

- [ ] Task 2: Skip SHOCKWAVE in `src/stores/useWeapons.jsx` — before `weapon.cooldownTimer -= delta`
  - [ ] Add at the TOP of the per-weapon loop (before the existing `orbital` angle check and cooldown decrement):
    ```js
    if (def.weaponType === 'shockwave') { continue }
    ```
  - [ ] This `continue` MUST appear BEFORE `weapon.cooldownTimer -= delta` (line ~42)
  - [ ] SHOCKWAVE cooldown is managed entirely in GameLoop section 7a-quater

- [ ] Task 3: Add GameLoop section 7a-quater in `src/GameLoop.jsx`
  - [ ] Insert AFTER the MAGNETIC_FIELD section (7a-ter) or after section 7a if 32.1/32.2 not yet merged
  - [ ] Insert BEFORE `// 7b. Apply enemy damage (batch)`
  - [ ] Declare `const activeWeapons = useWeapons.getState().activeWeapons` if not already in scope
  - [ ] Full section:
    ```js
    // 7a-quater. SHOCKWAVE arc burst weapon
    const swWeapon = activeWeapons.find(w => WEAPONS[w.weaponId]?.weaponType === 'shockwave')
    if (swWeapon) {
      const swDef = WEAPONS[swWeapon.weaponId]

      // Cooldown (managed here, bypassed in useWeapons.tick via continue)
      if (swWeapon.shockwaveCooldownTimer === undefined) swWeapon.shockwaveCooldownTimer = 0
      swWeapon.shockwaveCooldownTimer -= clampedDelta

      if (swWeapon.shockwaveCooldownTimer <= 0) {
        swWeapon.shockwaveCooldownTimer = (swWeapon.overrides?.cooldown ?? swDef.baseCooldown) * composedWeaponMods.cooldownMultiplier

        // Capture burst parameters at fire time
        const aimDir = playerState.aimDirection
        const aimAngle = aimDir ? Math.atan2(aimDir[0], -aimDir[1]) : playerState.rotation
        const baseDmg = swWeapon.overrides?.damage ?? swDef.baseDamage
        const burstDmg = baseDmg * composedWeaponMods.damageMultiplier
        const burstIsCrit = composedWeaponMods.critChance > 0 && Math.random() < composedWeaponMods.critChance
        const effectiveMaxRadius = swDef.waveMaxRadius * composedWeaponMods.zoneMultiplier

        if (!swWeapon.shockwavePendingArcs) swWeapon.shockwavePendingArcs = []
        if (!swWeapon.shockwaveArcs) swWeapon.shockwaveArcs = []

        // Queue 3 arcs with staggered delays
        for (let w = 0; w < swDef.waveCount; w++) {
          swWeapon.shockwavePendingArcs.push({
            remainingDelay: swDef.waveDelay * w,
            aimAngle,
            damage: burstDmg,
            isCrit: burstIsCrit,
            effectiveMaxRadius,
          })
        }
        playSFX(swDef.sfxKey)
      }

      // Spawn pending arcs whose delay has elapsed
      if (swWeapon.shockwavePendingArcs?.length > 0) {
        const stillPending = []
        for (let p = 0; p < swWeapon.shockwavePendingArcs.length; p++) {
          const pending = swWeapon.shockwavePendingArcs[p]
          pending.remainingDelay -= clampedDelta
          if (pending.remainingDelay <= 0) {
            // Pool eviction: deactivate oldest arc if at limit
            const activeCount = swWeapon.shockwaveArcs.filter(a => a.active).length
            if (activeCount >= swDef.poolLimit) {
              for (let a = 0; a < swWeapon.shockwaveArcs.length; a++) {
                if (swWeapon.shockwaveArcs[a].active) { swWeapon.shockwaveArcs[a].active = false; break }
              }
            }
            swWeapon.shockwaveArcs.push({
              centerX: playerPos[0],
              centerZ: playerPos[2],
              aimAngle: pending.aimAngle,
              sectorAngle: swDef.waveSectorAngle,
              prevRadius: 0,
              currentRadius: 0,
              maxRadius: pending.effectiveMaxRadius,
              expandSpeed: swDef.waveExpandSpeed,
              damage: pending.damage,
              isCrit: pending.isCrit,
              hitEnemies: new Set(),
              active: true,
            })
          } else {
            stillPending.push(pending)
          }
        }
        swWeapon.shockwavePendingArcs = stillPending
      }

      // Expand arcs and detect hits
      const swHits = []
      if (swWeapon.shockwaveArcs) {
        for (let a = 0; a < swWeapon.shockwaveArcs.length; a++) {
          const arc = swWeapon.shockwaveArcs[a]
          if (!arc.active) continue

          const prevR = arc.currentRadius
          arc.prevRadius = prevR
          arc.currentRadius += arc.expandSpeed * clampedDelta

          if (arc.currentRadius >= arc.maxRadius) {
            arc.active = false
            continue
          }

          const halfSector = arc.sectorAngle / 2
          for (let e = 0; e < enemies.length; e++) {
            const enemy = enemies[e]
            if (arc.hitEnemies.has(enemy.id)) continue

            const dx = enemy.x - arc.centerX
            const dz = enemy.z - arc.centerZ
            const dist = Math.sqrt(dx * dx + dz * dz)

            // Ring crossing: enemy distance is between prevRadius and currentRadius (+ enemy radius)
            if (dist < prevR - enemy.radius || dist > arc.currentRadius + enemy.radius) continue

            // Sector check (same angle convention as fireAngle in useWeapons)
            const enemyAngle = Math.atan2(dx, -dz)
            let angleDiff = enemyAngle - arc.aimAngle
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
            if (Math.abs(angleDiff) > halfSector) continue

            arc.hitEnemies.add(enemy.id)
            const radialDirX = dist > 0 ? dx / dist : 0
            const radialDirZ = dist > 0 ? dz / dist : 1
            swHits.push({ enemyId: enemy.id, damage: arc.damage, isCrit: arc.isCrit, dirX: radialDirX, dirZ: radialDirZ })
          }
        }

        // Prune fully inactive arcs to prevent unbounded array growth
        if (swWeapon.shockwaveArcs.length > swDef.poolLimit * 3) {
          swWeapon.shockwaveArcs = swWeapon.shockwaveArcs.filter(a => a.active)
        }
      }

      // Apply shockwave hits
      if (swHits.length > 0) {
        const dnEntries = []
        for (let i = 0; i < swHits.length; i++) {
          const e = enemies.find(ev => ev.id === swHits[i].enemyId)
          if (e) dnEntries.push({ damage: Math.round(swHits[i].damage), worldX: e.x, worldZ: e.z, isCrit: swHits[i].isCrit })
        }
        if (dnEntries.length > 0) useDamageNumbers.getState().spawnDamageNumbers(dnEntries)

        for (let i = 0; i < swHits.length; i++) {
          applyKnockbackImpulse(enemies, swHits[i].enemyId, { weaponId: swWeapon.weaponId, dirX: swHits[i].dirX, dirZ: swHits[i].dirZ })
        }

        const hitsBatch = swHits.map(h => ({ enemyId: h.enemyId, damage: h.damage, isCrit: h.isCrit }))
        const deathEvents = useEnemies.getState().damageEnemiesBatch(hitsBatch)
        for (let i = 0; i < deathEvents.length; i++) {
          const event = deathEvents[i]
          if (event.killed) {
            addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
            playSFX('explosion')
            rollDrops(event.enemy.typeId, event.enemy.x, event.enemy.z, event.enemy)
            useGame.getState().incrementKills()
            useGame.getState().addScore(GAME_CONFIG.SCORE_PER_KILL)
          }
        }
      }
    }
    ```

- [ ] Task 4: Create `src/renderers/ShockwaveWeaponRenderer.jsx`
  - [ ] **This is a NEW renderer, distinct from the existing `ShockwaveRenderer.jsx`** (which renders enemy shockwaves from `useEnemies`)
  - [ ] Use a pool of `POOL_SIZE = 9` individual meshes, each with its own cloned material (for per-arc opacity fade)
  - [ ] `useMemo` for base geometry and material array:
    ```js
    const sectorAngle = Math.PI * 2 / 3 // 120° — must match swDef.waveSectorAngle
    const arcGeo = useMemo(() => new THREE.RingGeometry(0.88, 1.0, 64, 1, 0, sectorAngle), [])
    const materials = useMemo(() => Array.from({ length: POOL_SIZE }, () =>
      new THREE.MeshBasicMaterial({
        color: '#f9e547',
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    ), [])
    ```
  - [ ] `useEffect` cleanup: `arcGeo.dispose()` + `materials.forEach(m => m.dispose())`
  - [ ] `meshRefs = useRef([])` — assigned via `ref={el => { meshRefs.current[i] = el }}`
  - [ ] `useFrame` logic:
    1. Hide all 9 mesh slots: `for (let i = 0; i < POOL_SIZE; i++) if (meshRefs.current[i]) meshRefs.current[i].visible = false`
    2. Find SHOCKWAVE weapon: `activeWeapons.find(w => WEAPONS[w.weaponId]?.weaponType === 'shockwave')`
    3. If not found or no `shockwaveArcs`, return early
    4. For each active arc (up to POOL_SIZE):
       - `mesh.visible = true`
       - `mesh.position.set(arc.centerX, 0.3, arc.centerZ)`
       - Scale: `const s = arc.currentRadius; mesh.scale.set(s, s, 1)`
       - Rotation: `mesh.rotation.set(-Math.PI / 2, arc.aimAngle - sectorAngle / 2, 0)` — flattens ring to XZ plane, then centers the 120° arc on aimAngle
       - ⚠️ **Calibration note**: The `-Math.PI/2` X rotation + Y rotation convention may need adjustment. During QA (Task 5), verify that the arc visually extends in the direction the cursor points. If the arc appears 90° off, adjust by adding/subtracting `Math.PI/2` to the Y rotation.
       - Opacity: `materials[slot].opacity = Math.max(0, (1 - arc.currentRadius / arc.maxRadius) * 0.7)`
  - [ ] JSX: render 9 `<mesh>` elements, each with `ref={el => { meshRefs.current[i] = el }}`, `geometry={arcGeo}`, `material={materials[i]}`, `frustumCulled={false}`
  - [ ] Read from `useWeapons` via `useWeapons.getState()` (NO hook subscription — same as MagneticFieldRenderer pattern)
  - [ ] Import: `import useWeapons from '../stores/useWeapons.jsx'` + `import { WEAPONS } from '../entities/weaponDefs.js'`

- [ ] Task 5: Mount `ShockwaveWeaponRenderer` in `src/scenes/GameplayScene.jsx`
  - [ ] Add import: `import ShockwaveWeaponRenderer from '../renderers/ShockwaveWeaponRenderer.jsx'`
  - [ ] Render `<ShockwaveWeaponRenderer />` alongside `<ProjectileRenderer />` and `<MagneticFieldRenderer />` (if 32.2 merged)
  - [ ] No conditional needed — self-hides when SHOCKWAVE is not equipped

- [ ] Task 6: Manual QA
  - [ ] Force-equip: `useWeapons.getState().addWeapon('SHOCKWAVE')` in browser console
  - [ ] Verify burst: 3 arcs appear in sequence (~0.2s apart), all pointing toward cursor
  - [ ] Verify arc expansion: arcs expand outward and fade from bright yellow to transparent
  - [ ] Verify direction tracking: aim cursor in different directions, confirm arcs follow
  - [ ] Verify hit: walk cursor arc through a group of enemies, confirm each enemy takes damage ONCE per arc (not per frame)
  - [ ] Verify knockback: enemies visibly jump outward on hit (strong radial displacement)
  - [ ] Verify `Set` one-hit: log `arc.hitEnemies` size — should match visible damage numbers
  - [ ] Verify poolLimit: rapid firing, confirm max 9 arcs visible simultaneously
  - [ ] **Calibration check**: verify arc is visually centered on cursor direction (adjust rotation offset if needed — see Task 4 ⚠️ note)

- [ ] Task 7: Remove `implemented: false` from SHOCKWAVE def after successful QA

## Dev Notes

### Codebase Context

**SHOCKWAVE is the most architecturally complex weapon in Epic 32.** It requires a dedicated GameLoop section to manage: burst cooldown, arc spawn queue, arc expansion, per-arc sector hit detection, and knockback. The arc entities are stored directly on the weapon object as mutable arrays (`shockwaveArcs`, `shockwavePendingArcs`), following the same in-place mutation pattern established by `magneticDamageTick` (Story 32.2) and `laserCrossDamageTick` (Story 32.1).

**Critical distinction from the EXISTING `ShockwaveRenderer.jsx`.** The file `src/renderers/ShockwaveRenderer.jsx` renders ENEMY shockwaves from `useEnemies.getState().shockwaves`. It renders CIRCULAR rings that damage the PLAYER (`CATEGORY_SHOCKWAVE:CATEGORY_PLAYER` in collision matrix). The new `ShockwaveWeaponRenderer.jsx` is completely separate: sector arcs, from player, damaging enemies, no collision system registration.

**Do NOT add player SHOCKWAVE arcs to `useEnemies.shockwaves`.** That store is solely for enemy-spawned circular waves. Adding player arcs there would break the collision detection (they'd damage the player instead of enemies) and mix architecture layers.

**`useWeapons.tick()` `continue` placement.** The SHOCKWAVE `continue` must appear BEFORE `weapon.cooldownTimer -= delta` at line ~42. SHOCKWAVE has no `baseCooldown`... wait — it DOES have a `baseCooldown` (2.5s), but the cooldown is managed in GameLoop, not useWeapons. The `weapon.cooldownTimer` field will always be 0 (set at `addWeapon()` time, never decremented since we `continue`). This is harmless. Do NOT modify `upgradeWeapon()` — it will store `cooldown: undefined` (from upgrades that omit cooldown field)... wait, the SHOCKWAVE upgrades DO include `cooldown` — `upgradeWeapon()` will apply it to `weapon.overrides.cooldown`. The GameLoop then reads: `(swWeapon.overrides?.cooldown ?? swDef.baseCooldown) * composedWeaponMods.cooldownMultiplier`. This is correct and no modification to `upgradeWeapon()` is needed.

**Cooldown timer lazy initialization.** `swWeapon.shockwaveCooldownTimer === undefined` on first frame (the field doesn't exist on fresh weapon objects). Initializing to 0 means the first burst fires immediately on equip, consistent with all other weapons (`cooldownTimer: 0` at `addWeapon()` time).

**Burst queue timing.** Arc 1: `remainingDelay = 0` (fires as soon as pending arcs are processed, i.e., same frame as burst trigger). Arcs 2 and 3: `remainingDelay = waveDelay` and `2 * waveDelay`. The pending arcs loop decrements `remainingDelay -= clampedDelta` before checking `<= 0`, so arc 1 spawns on the same frame as the burst trigger (since `0 - clampedDelta < 0` immediately). This is the intended behavior.

**Hit detection: ring crossing check.** The condition `dist >= prevR - enemy.radius && dist <= arc.currentRadius + enemy.radius` catches enemies that are at or near the arc's current radius. Adding `enemy.radius` as tolerance ensures enemies with larger collision radii are reliably caught. The `prevR` lower bound prevents re-triggering if the arc is near the enemy for multiple frames (combined with the `hitEnemies` Set).

**`Math.atan2(dx, -dz)` angle convention.** This matches `useWeapons.tick()`:
```js
// useWeapons: fireAngle = Math.atan2(fireDirection[0], -fireDirection[1])
// GameLoop: enemyAngle = Math.atan2(dx, -dz)
// Same convention — atan2(worldX, -worldZ)
```
Both measure angle from the "forward" direction (-Z world = up screen) clockwise.

**`applyKnockbackImpulse` reuse.** The function reads `WEAPONS[proj.weaponId].knockbackStrength`. The synthetic `{ weaponId: swWeapon.weaponId, dirX, dirZ }` object matches the function's expected interface. No modification to `knockbackSystem.js` needed.

**Arc array pruning.** The guard `if (swWeapon.shockwaveArcs.length > swDef.poolLimit * 3)` only triggers cleanup when the array grows significantly beyond the pool limit (e.g., after many burst cycles). This prevents the array from growing indefinitely over long play sessions. The threshold `poolLimit * 3 = 27` gives comfortable headroom.

**SFX timing.** `playSFX(swDef.sfxKey)` is called directly in the cooldown trigger block, NOT through the projectile-count-based SFX system (which only works for standard projectiles). The SFX fires once per burst (not per arc), which is the correct behavior for a burst weapon.

**`playerState` is in scope.** At GameLoop line 250, `const playerState = usePlayer.getState()`. Section 7a-quater runs after line 262, so `playerState` and `playerPos` are available without re-reading the store.

**`composedWeaponMods` is in scope.** Available from line 251, includes `damageMultiplier`, `cooldownMultiplier`, `critChance`, `critMultiplier`, `zoneMultiplier`.

**`enemies` local variable is in scope.** Declared at line 334: `const { enemies } = useEnemies.getState()`. Do NOT redeclare inside section 7a-quater.

**`activeWeapons` variable.** If Stories 32.1 (laser_cross) or 32.2 (magnetic_field) are already merged, they likely already declare `const activeWeapons = useWeapons.getState().activeWeapons` before their sections. If not, declare it at the top of section 7a-quater.

**Renderer: per-arc opacity requires individual materials.** `instancedMesh` with uniform material can't vary opacity per instance without a custom shader. Since `poolLimit = 9` is small, 9 individual meshes with 9 cloned `MeshBasicMaterial` instances is the correct tradeoff. The materials are created once in `useMemo` and mutated in `useFrame` via `materials[slot].opacity = value`.

**RingGeometry thetaStart/thetaLength.** `THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength)`:
- Inner 0.88, outer 1.0: produces a thin 12% ring (visually a bright arc edge)
- `thetaLength = Math.PI * 2/3` (120°): creates a sector arc
- The arc starts at angle 0 (pointing in +X direction in the XY plane of the geometry)
- After `rotation.set(-Math.PI/2, Y, 0)`: `+X` in world XY → `+X` in world XZ; `+Y` in world XY → `-Z` in world XZ
- To center the arc on `aimAngle`, the Y rotation should offset by `aimAngle` minus the sector half-width and the angle difference between the geometry's natural start direction and the game's "forward" direction

**Rotation calibration is required during QA.** The exact Y rotation offset depends on the game's coordinate conventions. Start with `mesh.rotation.set(-Math.PI / 2, aimAngle - sectorAngle / 2, 0)` and adjust empirically. If the arc appears offset, try adding `Math.PI / 2` to the Y component. Document the final working offset in the story's File List.

**On game reset.** `useWeapons.reset()` clears `activeWeapons: []`. All weapon object references (including `shockwaveArcs`, `shockwavePendingArcs`) are garbage collected. No explicit cleanup needed.

### SHOCKWAVE Weapon Def

```js
SHOCKWAVE: {
  id: 'SHOCKWAVE',
  name: 'Shockwave',
  description: '3 expanding arc waves centered on cursor with strong knockback',
  baseDamage: 40,
  baseCooldown: 2.5,
  weaponType: 'shockwave',        // discriminator — skip in useWeapons.tick(), managed in GameLoop
  waveCount: 3,                   // arcs per burst
  waveDelay: 0.2,                 // seconds between arc spawns in a burst
  waveSectorAngle: Math.PI * 2/3, // ~120° arc width (2.094 rad)
  waveExpandSpeed: 100,           // units/sec expansion rate
  waveMaxRadius: 22,              // world units (base, before zoneMultiplier)
  poolLimit: 9,                   // max active arcs (3 bursts × 3 arcs)
  projectileColor: '#f9e547',     // bright yellow arc (referenced by renderer)
  sfxKey: 'shockwave-fire',       // placeholder SFX
  knockbackStrength: 5,           // strong radial knockback (read by applyKnockbackImpulse)
  rarityDamageMultipliers: { ...DEFAULT_RARITY_DMG },
  slot: 'any',
  implemented: false,             // removed in Task 7
  upgrades: [
    { level: 2, damage: 48,  cooldown: 2.4,  statPreview: 'Damage: 40 → 48' },
    { level: 3, damage: 57,  cooldown: 2.25, statPreview: 'Damage: 48 → 57' },
    { level: 4, damage: 68,  cooldown: 2.1,  statPreview: 'Damage: 57 → 68' },
    { level: 5, damage: 81,  cooldown: 1.95, statPreview: 'Damage: 68 → 81', upgradeVisuals: { color: '#fbed6a' } },
    { level: 6, damage: 96,  cooldown: 1.8,  statPreview: 'Damage: 81 → 96' },
    { level: 7, damage: 114, cooldown: 1.65, statPreview: 'Damage: 96 → 114' },
    { level: 8, damage: 135, cooldown: 1.5,  statPreview: 'Damage: 114 → 135' },
    { level: 9, damage: 160, cooldown: 1.35, statPreview: 'Damage: 135 → 160', upgradeVisuals: { color: '#fff0a0' } },
  ],
},
```

### Files to Create / Modify

| Action | File | Notes |
|--------|------|-------|
| Modify | `src/entities/weaponDefs.js` | Add SHOCKWAVE def |
| Modify | `src/stores/useWeapons.jsx` | Add `shockwave` `continue` branch before cooldownTimer decrement |
| Modify | `src/GameLoop.jsx` | Add section 7a-quater (cooldown + burst queue + expansion + hit detection) |
| **Create** | `src/renderers/ShockwaveWeaponRenderer.jsx` | New renderer — sector arc pool (distinct from enemy ShockwaveRenderer) |
| Modify | `src/scenes/GameplayScene.jsx` | Import + mount ShockwaveWeaponRenderer |

### Architecture Compliance

- ✅ Game logic (cooldown, arc expansion, hit detection) in GameLoop — NOT in renderer
- ✅ Renderer reads from stores only — no `set()` calls
- ✅ New renderer in `src/renderers/` — correct layer, follows naming convention
- ✅ Weapon def in `src/entities/weaponDefs.js` — data layer
- ✅ No new Zustand store — arc state stored on weapon object (same pattern as MAGNETIC_FIELD)
- ✅ `useMemo` for geometry and materials — no allocation in useFrame
- ✅ `useEffect` cleanup for geometry + 9 materials — no memory leak
- ✅ `damageEnemiesBatch` reuse — no duplicated damage logic
- ✅ `applyKnockbackImpulse` reuse — no duplicated knockback logic
- ✅ `weaponType: 'shockwave'` discriminator — consistent with LASER_CROSS (32.1) and MAGNETIC_FIELD (32.2)
- ✅ Hit deduplication via `Set` — correct "once-per-arc" guarantee
- ✅ Arc state mutation in-place — no Zustand `set()` overhead per frame
- ✅ Existing `ShockwaveRenderer.jsx` unchanged — enemy waves are unaffected

### Project Structure Notes

`ShockwaveWeaponRenderer.jsx` follows the same PascalCase naming convention as all 18 existing renderers. Its name clearly distinguishes it from `ShockwaveRenderer.jsx` (enemy) at a glance.

The `weaponType: 'shockwave'` discriminator field is new on this weapon, but the pattern is established by Stories 32.1/32.2. All existing weapons without this field are unaffected.

`waveCount`, `waveDelay`, `waveSectorAngle`, `waveExpandSpeed`, `waveMaxRadius` are all new per-weapon fields — same pattern as `orbitalRadius`, `spreadAngle`, `explosionRadius` (per-weapon-type fields).

### References

- [Source: `src/stores/useEnemies.jsx:142-184`] — `spawnShockwave()` + `tickShockwaves()` — shows enemy shockwave pattern (do NOT reuse — different category/direction)
- [Source: `src/renderers/ShockwaveRenderer.jsx`] — Enemy shockwave renderer — circular, `useEnemies` source, additive blending; SHOCKWAVE weapon renderer follows same visual approach but sector-based
- [Source: `src/systems/knockbackSystem.js:20-41`] — `applyKnockbackImpulse(enemies, enemyId, proj)` — `proj` needs `weaponId` + `dirX`/`dirZ`; synthetic object works fine
- [Source: `src/GameLoop.jsx:250-275`] — Section 3 (weapon fire) + SFX trigger pattern — SHOCKWAVE skips the projectile count check; plays SFX directly
- [Source: `src/GameLoop.jsx:334`] — `const { enemies } = useEnemies.getState()` — available in scope for section 7a-quater
- [Source: `src/GameLoop.jsx:251-259`] — `composedWeaponMods` fields: `damageMultiplier`, `cooldownMultiplier`, `critChance`, `critMultiplier`, `zoneMultiplier`
- [Source: `src/GameLoop.jsx:373-453`] — Sections 7a + 7b + 7c: `damageEnemiesBatch`, `spawnDamageNumbers`, death handling with `addExplosion`, `playSFX`, `rollDrops`, `incrementKills`, `addScore` — replicate for SHOCKWAVE hits
- [Source: `src/stores/useWeapons.jsx:42`] — `weapon.cooldownTimer -= delta` — SHOCKWAVE `continue` must precede this line
- [Source: `src/renderers/PlanetAuraRenderer.jsx`] — Pattern for aura-style renderer with `MeshBasicMaterial`, `AdditiveBlending`, `depthWrite: false`, per-frame opacity update
- [Source: `_bmad-output/implementation-artifacts/32-2-magnetic-field-weapon.md`] — MAGNETIC_FIELD pattern: `weaponType` discriminator, lazy-init timer on weapon object, `continue` placement, GameLoop section structure
- [Source: `_bmad-output/planning-artifacts/epic-32-new-weapon-mechanics.md#Story 32.4`] — Original AC: `waveCount=3`, `waveDelay`, `waveSectorAngle~120°`, `knockbackStrength`, `poolLimit=9`, color `#f9e547`

## Dev Agent Record

### Agent Model Used

_to be filled_

### Debug Log References

### Completion Notes List

### File List
