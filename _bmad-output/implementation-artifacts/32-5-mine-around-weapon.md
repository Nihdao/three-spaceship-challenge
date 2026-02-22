# Story 32.5: MINE_AROUND — Orbiting Proximity Mines

Status: ready-for-dev

## Story

As a player,
I want mines to orbit my ship and explode when enemies come close,
So that I have automated defensive area control without aiming.

## Acceptance Criteria

1. **[3 orbiting mines]** When MINE_AROUND is equipped, up to `mineCount` (3) mine spheres orbit the player at `orbitalRadius` units. Mines are evenly spaced angularly (120° apart). The orbit rotates at `orbitalSpeed` rad/sec in world space, independent of ship facing or cursor.

2. **[Mine visual]** Each active mine is rendered as a sphere colored `#06d6a0` (teal), with a pulsing scale between 0.7 and 0.9 at ~2Hz. Inactive (exploded, awaiting respawn) mine slots are hidden.

3. **[Proximity detection]** Each frame, for each active mine: if any enemy comes within `mineDetectionRadius` of the mine's world position, the mine triggers immediately.

4. **[AOE explosion]** On detonation, all enemies within `effectiveExplosionRadius = explosionRadius * zoneMultiplier` take `baseDamage * damageMultiplier` damage with a crit roll. Enemies in blast radius receive radial knockback. An explosion VFX (`addExplosion()`) appears at the mine's position.

5. **[Mine respawn]** A detonated mine's slot is empty for `mineRespawnTime` seconds, then respawns and rejoins the orbit formation. Remaining active mines continue orbiting without interruption.

6. **[No cursor or aim dependency]** The orbit uses `weapon.mineOrbitalAngle` which advances purely by time — no `aimDirection` or `playerRotation` input.

7. **[`implemented: false` removed]** At the end of this story, the `implemented: false` flag is removed from MINE_AROUND in `weaponDefs.js`.

## Tasks / Subtasks

- [ ] Task 1: Add `MINE_AROUND` def to `src/entities/weaponDefs.js`
  - [ ] Insert after SHOCKWAVE (or after EXPLOSIVE_ROUND if earlier stories not yet merged)
  - [ ] Fields: `id: 'MINE_AROUND'`, `name: 'Mine Field'`, `description: '3 orbiting mines that explode on enemy proximity'`
  - [ ] Stats: `baseDamage: 50` (per explosion, all enemies in AOE)
  - [ ] Mine params: `weaponType: 'mine_around'`, `mineCount: 3`, `orbitalRadius: 15`, `orbitalSpeed: 0.8` (rad/sec — full orbit ~7.9s), `mineDetectionRadius: 4`, `explosionRadius: 10`, `mineRespawnTime: 5`
  - [ ] Visual: `projectileColor: '#06d6a0'`, `poolLimit: 3`
  - [ ] Other: `sfxKey: 'mine-explosion'`, `knockbackStrength: 4`, `rarityDamageMultipliers: { ...DEFAULT_RARITY_DMG }`, `slot: 'any'`, `implemented: false`
  - [ ] Omit: `baseCooldown`, `baseSpeed`, `projectileType`, `projectilePattern`, `projectileRadius`, `projectileLifetime`, `projectileMeshScale` — not applicable (mines are not projectiles)
  - [ ] Upgrades array (levels 2–9, damage only — no cooldown concept for mines):
    ```js
    upgrades: [
      { level: 2, damage: 60,  statPreview: 'Damage: 50 → 60' },
      { level: 3, damage: 72,  statPreview: 'Damage: 60 → 72' },
      { level: 4, damage: 86,  statPreview: 'Damage: 72 → 86' },
      { level: 5, damage: 102, statPreview: 'Damage: 86 → 102', upgradeVisuals: { color: '#2ee8bb' } },
      { level: 6, damage: 120, statPreview: 'Damage: 102 → 120' },
      { level: 7, damage: 141, statPreview: 'Damage: 120 → 141' },
      { level: 8, damage: 165, statPreview: 'Damage: 141 → 165' },
      { level: 9, damage: 193, statPreview: 'Damage: 165 → 193', upgradeVisuals: { color: '#60f0d0' } },
    ],
    ```

- [ ] Task 2: Skip MINE_AROUND in `src/stores/useWeapons.jsx` — before `weapon.cooldownTimer -= delta`
  - [ ] Add at the TOP of the per-weapon loop (before orbital angle check and cooldown decrement):
    ```js
    if (def.weaponType === 'mine_around') { continue }
    ```
  - [ ] This `continue` MUST appear BEFORE `weapon.cooldownTimer -= delta` (line ~42)
  - [ ] MINE_AROUND has no cooldown concept — all mine logic is in GameLoop

- [ ] Task 3: Add GameLoop section 7a-quinquies in `src/GameLoop.jsx`
  - [ ] Insert AFTER the SHOCKWAVE section (7a-quater) or after 7a-ter / 7a if earlier stories not merged
  - [ ] Insert BEFORE `// 7b. Apply enemy damage (batch)`
  - [ ] Ensure `activeWeapons` is in scope (declared in earlier section or declare fresh)
  - [ ] Full section:
    ```js
    // 7a-quinquies. MINE_AROUND orbiting proximity mines
    const mineWeapon = activeWeapons.find(w => WEAPONS[w.weaponId]?.weaponType === 'mine_around')
    if (mineWeapon) {
      const mineDef = WEAPONS[mineWeapon.weaponId]

      // Lazy init mine state on weapon object
      if (!mineWeapon.mines) {
        mineWeapon.mines = Array.from({ length: mineDef.mineCount }, (_, i) => ({
          slotIndex: i,
          active: true,
          respawnTimer: 0,
        }))
        mineWeapon.mineOrbitalAngle = 0
      }

      // Advance orbital angle (world space, independent of aim)
      mineWeapon.mineOrbitalAngle += mineDef.orbitalSpeed * clampedDelta

      // Tick respawn timers for inactive mines
      for (let m = 0; m < mineWeapon.mines.length; m++) {
        const mine = mineWeapon.mines[m]
        if (!mine.active) {
          mine.respawnTimer -= clampedDelta
          if (mine.respawnTimer <= 0) mine.active = true
        }
      }

      // Proximity check, detonation, and AOE damage
      const effectiveExplosionRadius = mineDef.explosionRadius * composedWeaponMods.zoneMultiplier
      const baseDmg = mineWeapon.overrides?.damage ?? mineDef.baseDamage
      const mineDmg = baseDmg * composedWeaponMods.damageMultiplier
      const mineIsCrit = composedWeaponMods.critChance > 0 && Math.random() < composedWeaponMods.critChance
      const mineHits = []

      for (let m = 0; m < mineWeapon.mines.length; m++) {
        const mine = mineWeapon.mines[m]
        if (!mine.active) continue

        const angle = mineWeapon.mineOrbitalAngle + (Math.PI * 2 / mineDef.mineCount) * mine.slotIndex
        const mineX = playerPos[0] + Math.cos(angle) * mineDef.orbitalRadius
        const mineZ = playerPos[2] + Math.sin(angle) * mineDef.orbitalRadius

        // Proximity check — any enemy within detection radius triggers mine
        let triggered = false
        for (let e = 0; e < enemies.length; e++) {
          const dx = enemies[e].x - mineX
          const dz = enemies[e].z - mineZ
          if (Math.sqrt(dx * dx + dz * dz) <= mineDef.mineDetectionRadius) {
            triggered = true
            break
          }
        }

        if (!triggered) continue

        // Detonation: AOE damage to all enemies in explosion radius
        for (let e = 0; e < enemies.length; e++) {
          const dx = enemies[e].x - mineX
          const dz = enemies[e].z - mineZ
          const dist = Math.sqrt(dx * dx + dz * dz)
          if (dist <= effectiveExplosionRadius) {
            const rdx = dist > 0 ? dx / dist : 0
            const rdz = dist > 0 ? dz / dist : 1
            mineHits.push({ enemyId: enemies[e].id, damage: mineDmg, isCrit: mineIsCrit, dirX: rdx, dirZ: rdz })
          }
        }

        // Deactivate mine and start respawn timer
        mine.active = false
        mine.respawnTimer = mineDef.mineRespawnTime

        // Explosion VFX + SFX
        addExplosion(mineX, mineZ, mineDef.projectileColor, 2.5)
        playSFX(mineDef.sfxKey)
      }

      // Apply mine explosion hits (deduplicate: enemy hit by multiple simultaneous mine AOEs → take damage once)
      if (mineHits.length > 0) {
        const seenEnemies = new Set()
        const uniqueHits = []
        for (let i = 0; i < mineHits.length; i++) {
          if (!seenEnemies.has(mineHits[i].enemyId)) {
            seenEnemies.add(mineHits[i].enemyId)
            uniqueHits.push(mineHits[i])
          }
        }

        const dnEntries = []
        for (let i = 0; i < uniqueHits.length; i++) {
          const e = enemies.find(ev => ev.id === uniqueHits[i].enemyId)
          if (e) dnEntries.push({ damage: Math.round(uniqueHits[i].damage), worldX: e.x, worldZ: e.z, isCrit: uniqueHits[i].isCrit })
        }
        if (dnEntries.length > 0) useDamageNumbers.getState().spawnDamageNumbers(dnEntries)

        for (let i = 0; i < uniqueHits.length; i++) {
          applyKnockbackImpulse(enemies, uniqueHits[i].enemyId, { weaponId: mineWeapon.weaponId, dirX: uniqueHits[i].dirX, dirZ: uniqueHits[i].dirZ })
        }

        const hitsBatch = uniqueHits.map(h => ({ enemyId: h.enemyId, damage: h.damage, isCrit: h.isCrit }))
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

- [ ] Task 4: Create `src/renderers/MineAroundRenderer.jsx`
  - [ ] Pool of 3 mesh refs (`meshRefs = useRef([])`, assigned via `ref={el => { meshRefs.current[i] = el }}`)
  - [ ] `useMemo` for shared geometry and material:
    ```js
    const mineGeo = useMemo(() => new THREE.SphereGeometry(0.8, 16, 16), [])
    const mineMat = useMemo(() => new THREE.MeshBasicMaterial({
      color: '#06d6a0',
      transparent: false,
    }), [])
    ```
  - [ ] `useEffect` cleanup: `mineGeo.dispose(); mineMat.dispose()`
  - [ ] `useFrame` logic:
    1. Find MINE_AROUND weapon: `useWeapons.getState().activeWeapons.find(w => WEAPONS[w.weaponId]?.weaponType === 'mine_around')`
    2. Hide all 3 meshes if weapon not found or `!mineWeapon.mines`
    3. Read `usePlayer.getState().position` for player world position
    4. For each slot `i` in 0..2:
       - `const mine = mineWeapon.mines[i]`
       - `const mesh = meshRefs.current[i]`
       - If `!mine.active`: `mesh.visible = false`, continue
       - `const angle = mineWeapon.mineOrbitalAngle + (Math.PI * 2 / 3) * i`
       - `mesh.position.set(playerPos[0] + Math.cos(angle) * orbitalRadius, -0.5, playerPos[2] + Math.sin(angle) * orbitalRadius)`
       - Pulse: `const pulse = 0.8 + 0.1 * Math.sin(state.clock.elapsedTime * Math.PI * 4)` (~2Hz, range [0.7, 0.9])
       - `mesh.scale.setScalar(pulse)`
       - `mesh.visible = true`
  - [ ] Read `orbitalRadius` from `WEAPONS[mineWeapon.weaponId].orbitalRadius`
  - [ ] Import: `useWeapons`, `usePlayer`, `WEAPONS`, `THREE` + R3F hooks
  - [ ] JSX: 3 `<mesh>` elements sharing geometry + material, each with `ref={el => { meshRefs.current[i] = el }}`, `frustumCulled={false}`
  - [ ] No conditional rendering needed — renderer self-manages visibility in `useFrame`

- [ ] Task 5: Mount `MineAroundRenderer` in `src/scenes/GameplayScene.jsx`
  - [ ] Add import: `import MineAroundRenderer from '../renderers/MineAroundRenderer.jsx'`
  - [ ] Render `<MineAroundRenderer />` alongside other weapon renderers
  - [ ] No conditional needed — self-hides when not equipped

- [ ] Task 6: Manual QA
  - [ ] Force-equip: `useWeapons.getState().addWeapon('MINE_AROUND')` in browser console
  - [ ] Verify 3 sphere mines orbit the player, evenly spaced 120° apart
  - [ ] Verify orbit rotation is continuous and independent of cursor/ship facing
  - [ ] Verify pulse scale animation on each mine (~2Hz breathing)
  - [ ] Walk into an enemy group: confirm mine triggers when enemy enters detection radius, explosion VFX appears at mine position
  - [ ] Verify AOE: multiple enemies in explosion radius all take damage simultaneously
  - [ ] Verify mine disappears after explosion; after `mineRespawnTime` seconds, it reappears
  - [ ] Verify other mines continue orbiting without interruption during a mine's respawn timer
  - [ ] Optional: apply zone boon and confirm explosion radius visually covers more ground

- [ ] Task 7: Remove `implemented: false` from MINE_AROUND def after successful QA

## Dev Notes

### Codebase Context

**MINE_AROUND has no projectile, no cooldown, no firing event.** It is a "persistent orbital defense" — mines always exist while the weapon is equipped, autonomously detonating on proximity. The entire lifecycle (orbit, proximity check, detonation, respawn) is managed in GameLoop section 7a-quinquies. `useWeapons.tick()` is bypassed entirely via `continue`.

**Mine state lives on the weapon object.** `weapon.mines` (array of 3 mine slot objects) and `weapon.mineOrbitalAngle` (shared orbital phase) are lazily initialized on the first GameLoop frame after the weapon is equipped. This follows the same pattern as `magneticDamageTick` (32.2), `laserCrossDamageTick` (32.1), `shockwaveArcs` (32.4) — in-place mutation with no Zustand `set()` overhead.

**Mine positions are computed per frame, not stored.** `mineX = playerPos[0] + cos(angle) * orbitalRadius`, `mineZ = playerPos[2] + sin(angle) * orbitalRadius`. Both GameLoop (for collision) and renderer (for mesh placement) compute positions independently from `weapon.mineOrbitalAngle` + `playerPos`. No position sync is needed between layers.

**SATELLITE weapon already uses `orbitalAngle` on its weapon object** (from `src/stores/useWeapons.jsx:36-38`). MINE_AROUND uses `mineOrbitalAngle` — a different field name — so there is no conflict if both weapons are equipped simultaneously.

**The `continue` in useWeapons.tick() skips the `orbitalAngle` update** (line 36-38). But MINE_AROUND uses `mineOrbitalAngle` managed in GameLoop instead, so this is correct.

**MINE_AROUND has no `baseCooldown`.** Upgrade objects omit `cooldown`, so `upgradeWeapon()` will set `weapon.overrides.cooldown = undefined`. This is harmless — the GameLoop never reads a cooldown for this weapon type.

**Hit deduplication is needed for simultaneous mine explosions.** If two mines detonate in the same frame (two enemies trigger two different mines), an enemy could appear in both AOE radius checks. The `seenEnemies` Set ensures each enemy takes damage once per frame from mine explosions.

**`addExplosion(mineX, mineZ, color, scale)` with `scale = 2.5`** creates a larger particle burst than the standard enemy death explosion. Looking at GameLoop line ~312: `addExplosion(te.newX, te.newZ, '#cc66ff', 0.5)` uses 0.5 for teleport effects; line ~408: `addExplosion(proj.x, proj.z, proj.color)` uses default for projectile hits. Scale 2.5 gives a notably larger mine explosion that feels impactful.

**`sfxKey: 'mine-explosion'` is a placeholder** — same as all SFX in this project. `audioManager.js` handles missing files gracefully with `console.warn`.

**`orbitalSpeed: 0.8` rad/sec** = full orbit in `2π / 0.8 ≈ 7.85` seconds. This is slower than SATELLITE (`orbitalSpeed: 2.0` = 3.14s/orbit) which is appropriate — defensive mines should move more predictably.

**`mineDetectionRadius: 4` world units** — slightly larger than a typical enemy radius (enemies have `radius ≈ 1-2` units). Provides a clear "proximity zone" without triggering from too far away.

**`explosionRadius: 10` world units** — covers a decent cluster area. With `zoneMultiplier` from upgrades, this can grow significantly.

**Renderer uses shared geometry and material** for all 3 mines (they're identical visually). Unlike SHOCKWAVE weapon which needs per-arc opacity (9 individual materials), MINE_AROUND mines all have the same appearance at the same time — shared material is correct and efficient.

**`MeshBasicMaterial` vs `MeshStandardMaterial`** — Using `MeshBasicMaterial` for the mines follows the pattern of most renderers in this project (ShockwaveRenderer, MagneticFieldRenderer per 32.2). The mines will appear as flat-shaded teal spheres. If a glowing appearance is desired, `emissiveIntensity` via `MeshStandardMaterial` can be added later — keep it simple for now.

**Renderer position Y = -0.5** — same as `PROJECTILE_SPAWN_Y_OFFSET = -0.5`. This places mines at the ship's weapon fire height, visually below the ship model. Adjust to 0 if mines should orbit at the same height as the ship.

**`frustumCulled={false}`** prevents mines from disappearing when the player moves close to the edge of the frustum. Essential since mines orbit nearby.

**On reset.** `useWeapons.reset()` clears `activeWeapons: []`. All weapon object properties including `mines` and `mineOrbitalAngle` are garbage collected. No explicit cleanup needed.

**On unequip.** `addWeapon()` duplicate-check prevents re-equipping. But if the weapon is somehow removed (no dedicated unequip UI currently), the mine state is discarded with the weapon object.

### MINE_AROUND Weapon Def

```js
MINE_AROUND: {
  id: 'MINE_AROUND',
  name: 'Mine Field',
  description: '3 orbiting mines that explode on enemy proximity',
  baseDamage: 50,               // per explosion (all enemies in AOE)
  weaponType: 'mine_around',    // discriminator — bypasses cooldown/projectile in useWeapons.tick()
  mineCount: 3,                 // number of mine slots
  orbitalRadius: 15,            // world units — orbit distance from player
  orbitalSpeed: 0.8,            // rad/sec — full orbit ≈ 7.9s
  mineDetectionRadius: 4,       // world units — proximity trigger radius per mine
  explosionRadius: 10,          // world units — AOE damage radius (base, before zoneMultiplier)
  mineRespawnTime: 5,           // seconds between explosion and mine reappearance
  poolLimit: 3,                 // = mineCount (informational — used by renderer, not eviction logic)
  projectileColor: '#06d6a0',   // teal/mint — mine sphere + explosion VFX color
  sfxKey: 'mine-explosion',     // placeholder SFX
  knockbackStrength: 4,         // radial outward knockback on detonation
  rarityDamageMultipliers: { ...DEFAULT_RARITY_DMG },
  slot: 'any',
  implemented: false,           // removed in Task 7
  upgrades: [
    { level: 2, damage: 60,  statPreview: 'Damage: 50 → 60' },
    { level: 3, damage: 72,  statPreview: 'Damage: 60 → 72' },
    { level: 4, damage: 86,  statPreview: 'Damage: 72 → 86' },
    { level: 5, damage: 102, statPreview: 'Damage: 86 → 102', upgradeVisuals: { color: '#2ee8bb' } },
    { level: 6, damage: 120, statPreview: 'Damage: 102 → 120' },
    { level: 7, damage: 141, statPreview: 'Damage: 120 → 141' },
    { level: 8, damage: 165, statPreview: 'Damage: 141 → 165' },
    { level: 9, damage: 193, statPreview: 'Damage: 165 → 193', upgradeVisuals: { color: '#60f0d0' } },
  ],
},
```

Note: upgrades use `damage` key only. No `cooldown` field — `upgradeWeapon()` will write `overrides.cooldown = undefined`, which is harmless since cooldown logic is never reached for this weapon type.

### Files to Create / Modify

| Action | File | Notes |
|--------|------|-------|
| Modify | `src/entities/weaponDefs.js` | Add MINE_AROUND def |
| Modify | `src/stores/useWeapons.jsx` | Add `mine_around` `continue` before cooldownTimer decrement |
| Modify | `src/GameLoop.jsx` | Add section 7a-quinquies |
| **Create** | `src/renderers/MineAroundRenderer.jsx` | New renderer — 3 orbital sphere meshes |
| Modify | `src/scenes/GameplayScene.jsx` | Import + mount MineAroundRenderer |

### Architecture Compliance

- ✅ Game logic (orbit, proximity, explosion) in GameLoop — NOT in renderer
- ✅ Renderer reads from stores only — no `set()` calls
- ✅ New renderer in `src/renderers/` — correct layer, follows naming convention
- ✅ Weapon def in `src/entities/weaponDefs.js` — data layer
- ✅ No new Zustand store — mine state stored on weapon object (in-place mutation)
- ✅ `useMemo` for geometry and material — no allocation in useFrame
- ✅ `useEffect` cleanup — no memory leak
- ✅ `damageEnemiesBatch` reuse — no duplicated damage logic
- ✅ `applyKnockbackImpulse` reuse — no duplicated knockback logic
- ✅ `weaponType: 'mine_around'` discriminator — consistent Epic 32 pattern
- ✅ Hit deduplication via Set — correct "once per mine per frame per enemy" guarantee
- ✅ `addExplosion()` reuse for VFX — no new particle system code
- ✅ Mine positions computed per frame — no secondary state sync needed

### Project Structure Notes

`MineAroundRenderer.jsx` follows PascalCase convention. 3 `<mesh>` elements (not `instancedMesh`) since count is small (3) and all visibility is toggled identically from `useFrame`.

The `mine_around` `weaponType` discriminator follows the same pattern as `'laser_cross'` (32.1), `'magnetic_field'` (32.2), `'shockwave'` (32.4).

`mineCount`, `orbitalRadius`, `orbitalSpeed`, `mineDetectionRadius`, `explosionRadius`, `mineRespawnTime` are all new per-weapon fields following the same convention as `homing`, `spreadAngle`, `orbitalRadius` (SATELLITE), `explosionRadius` (EXPLOSIVE_ROUND).

Note that SATELLITE already uses `def.orbitalRadius` and `def.orbitalSpeed` in `useWeapons.tick()` (lines 87-89). MINE_AROUND reuses the same field names semantically, but is entirely managed in GameLoop (not useWeapons.tick()), so there is no actual code reuse or conflict.

### References

- [Source: `src/stores/useWeapons.jsx:36-38`] — SATELLITE `orbitalAngle` lazy-init pattern: `weapon.orbitalAngle = (weapon.orbitalAngle || 0) + delta * orbitalSpeed` — MINE_AROUND follows same pattern with `mineOrbitalAngle`
- [Source: `src/stores/useWeapons.jsx:86-90`] — SATELLITE spawn position from orbit angle: `playerPosition[0] + Math.cos(orbitalAngle) * orbitalRadius` — MINE_AROUND uses same formula for mine world positions
- [Source: `src/stores/useWeapons.jsx:42`] — `weapon.cooldownTimer -= delta` — `mine_around` `continue` must precede this line
- [Source: `src/systems/knockbackSystem.js:20-41`] — `applyKnockbackImpulse(enemies, enemyId, { weaponId, dirX, dirZ })` — synthetic proj object pattern
- [Source: `src/GameLoop.jsx:397-412`] — EXPLOSIVE_ROUND AOE damage loop: `for (let e = 0; e < enemies.length; e++) { if (dist <= explosionRadius) { projectileHits.push(...) } }` — MINE_AROUND uses same AOE pattern
- [Source: `src/GameLoop.jsx:407`] — `addExplosion(proj.x, proj.z, proj.color)` — reused as `addExplosion(mineX, mineZ, mineDef.projectileColor, 2.5)` for mine explosions
- [Source: `src/GameLoop.jsx:251-259`] — `composedWeaponMods.zoneMultiplier` for `effectiveExplosionRadius` scaling
- [Source: `src/GameLoop.jsx:334`] — `const { enemies } = useEnemies.getState()` — in scope for section 7a-quinquies
- [Source: `src/renderers/MagneticFieldRenderer.jsx` (Story 32.2)] — Pattern for persistent weapon renderer with no Zustand subscription: `useWeapons.getState()` directly in `useFrame`, shared geometry/material, `frustumCulled={false}`
- [Source: `_bmad-output/planning-artifacts/epic-32-new-weapon-mechanics.md#Story 32.5`] — AC: `mineCount=3`, `orbitalRadius`, `orbitalSpeed`, `mineDetectionRadius`, `explosionRadius`, `knockbackStrength`, `mineRespawnTime`, color `#06d6a0`
- [Source: `_bmad-output/implementation-artifacts/32-4-shockwave-weapon.md`] — GameLoop section structure pattern: init check, arc/mine loop, hit dedup, `damageEnemiesBatch`, death events

## Dev Agent Record

### Agent Model Used

_to be filled_

### Debug Log References

### Completion Notes List

### File List
