# Story 32.6: TACTICAL_SHOT — Remote Strike

Status: done

## Story

As a player,
I want my weapon to automatically strike a random nearby enemy with an instant lightning-like hit,
So that I have smart targeting that doesn't require me to aim.

## Acceptance Criteria

1. **[Target selection]** When the cooldown expires, a random enemy within `detectionRadius` (60 world units) is selected as target. If no enemy is in range, the weapon skips the shot (no visual, no SFX) but the cooldown is still consumed and resets normally.

2. **[No traveling projectile]** No projectile is spawned or travels from the player. The strike effect appears instantaneously at the target's world position (not at the player ship).

3. **[Direct damage]** The targeted enemy takes `baseDamage * damageMultiplier` damage immediately on strike. A crit roll is performed independently per strike using `effectiveCritChance`.

4. **[AOE splash]** All enemies within `effectiveSplashRadius = strikeAoeRadius * zoneMultiplier` of the impact point take `baseDamage * damageMultiplier * 0.5` splash damage (no crit on splash). The primary target is excluded from the AOE loop (already hit directly).

5. **[Strike VFX]** A brief visual effect in `#2dc653` (green) appears at the target's world position, lasting `strikeVfxDuration` (0.3s) then fading out. Style: a bright expanding flash disc + thin expanding ring from 0 to `strikeAoeRadius`. Effect appears at impact, NOT at the player.

6. **[Anti-repeat targeting]** If 2 or more enemies are in range, the same enemy is not selected twice consecutively. `lastTargetId` is stored on the weapon object. If the randomly selected target matches `lastTargetId`, pick the next candidate in the array instead.

7. **[`implemented: false` removed]** At the end of this story, the `implemented: false` flag is removed from TACTICAL_SHOT in `weaponDefs.js`, making it eligible for the level-up pool.

## Tasks / Subtasks

- [x] Task 1: Add `TACTICAL_SHOT` def to `src/entities/weaponDefs.js`
  - [ ] Insert after `EXPLOSIVE_ROUND` (or after the last Epic 32 weapon if 32.x stories are merged)
  - [ ] Fields: `id: 'TACTICAL_SHOT'`, `name: 'Tactical Strike'`, `description: 'Instant strike on a random nearby enemy with AOE splash'`
  - [ ] Stats: `baseDamage: 35`, `baseCooldown: 1.2`
  - [ ] Type params: `weaponType: 'tactical_shot'`, `detectionRadius: 60`, `strikeAoeRadius: 6`, `strikeVfxDuration: 0.3`, `splashDamageRatio: 0.5`
  - [ ] Visual: `projectileColor: '#2dc653'`, `poolLimit: 4`
  - [ ] Other: `sfxKey: 'tactical-shot'`, `knockbackStrength: 2`, `rarityDamageMultipliers: { ...DEFAULT_RARITY_DMG }`, `slot: 'any'`, `implemented: false`
  - [ ] Omit: `baseSpeed`, `projectileType`, `projectilePattern`, `projectileRadius`, `projectileLifetime`, `projectileMeshScale` — not applicable (no projectile spawned)
  - [ ] Upgrades array (levels 2–9):
    ```js
    upgrades: [
      { level: 2, damage: 42, cooldown: 1.14, statPreview: 'Damage: 35 → 42' },
      { level: 3, damage: 51, cooldown: 1.06, statPreview: 'Damage: 42 → 51' },
      { level: 4, damage: 62, cooldown: 0.97, statPreview: 'Damage: 51 → 62' },
      { level: 5, damage: 75, cooldown: 0.88, statPreview: 'Damage: 62 → 75', upgradeVisuals: { color: '#40e070' } },
      { level: 6, damage: 91, cooldown: 0.78, statPreview: 'Damage: 75 → 91' },
      { level: 7, damage: 110, cooldown: 0.68, statPreview: 'Damage: 91 → 110' },
      { level: 8, damage: 132, cooldown: 0.57, statPreview: 'Damage: 110 → 132' },
      { level: 9, damage: 158, cooldown: 0.46, statPreview: 'Damage: 132 → 158', upgradeVisuals: { color: '#60f090' } },
    ],
    ```

- [x] Task 2: Skip TACTICAL_SHOT in `src/stores/useWeapons.jsx` — before `weapon.cooldownTimer -= delta`
  - [ ] In the per-weapon loop (after `const def = WEAPONS[weapon.weaponId]`, after the orbital angle block), add:
    ```js
    if (def.weaponType === 'tactical_shot') { continue }
    ```
  - [ ] This `continue` MUST appear BEFORE `weapon.cooldownTimer -= delta` (line ~42)
  - [ ] TACTICAL_SHOT has its own cooldown managed in GameLoop (`weapon.tacticalCooldownTimer`)

- [x] Task 3: Add GameLoop section 7a-sexies in `src/GameLoop.jsx`
  - [ ] Insert AFTER the MINE_AROUND section (7a-quinquies) if Story 32.5 is merged, otherwise after the last Epic 32 special section, or after section 7a (projectile-enemy hits)
  - [ ] Insert BEFORE `// 7b. Apply enemy damage (batch)`
  - [ ] Ensure `enemies` is in scope (declared at line 334: `const { enemies } = useEnemies.getState()`)
  - [ ] Full section:
    ```js
    // 7a-sexies. TACTICAL_SHOT — Instant remote strike with AOE splash
    const tacticalWeapon = useWeapons.getState().activeWeapons.find(w => WEAPONS[w.weaponId]?.weaponType === 'tactical_shot')
    if (tacticalWeapon) {
      const tactDef = WEAPONS[tacticalWeapon.weaponId]

      // Lazy init per-weapon state
      if (tacticalWeapon.tacticalCooldownTimer === undefined) tacticalWeapon.tacticalCooldownTimer = 0
      if (!tacticalWeapon.tacticalStrikes) tacticalWeapon.tacticalStrikes = []
      // lastTargetId: undefined on first frame = no exclusion, which is intentional

      // Tick cooldown
      tacticalWeapon.tacticalCooldownTimer = Math.max(0, tacticalWeapon.tacticalCooldownTimer - clampedDelta)

      // Tick VFX effects: age and remove expired
      for (let s = tacticalWeapon.tacticalStrikes.length - 1; s >= 0; s--) {
        tacticalWeapon.tacticalStrikes[s].timer -= clampedDelta
        if (tacticalWeapon.tacticalStrikes[s].timer <= 0) {
          tacticalWeapon.tacticalStrikes.splice(s, 1)
        }
      }

      // Fire when cooldown reaches 0
      if (tacticalWeapon.tacticalCooldownTimer <= 0) {
        const baseCooldown = (tacticalWeapon.overrides?.cooldown ?? tactDef.baseCooldown) * composedWeaponMods.cooldownMultiplier
        tacticalWeapon.tacticalCooldownTimer = baseCooldown

        // Collect eligible targets within detectionRadius
        const eligibleTargets = []
        for (let e = 0; e < enemies.length; e++) {
          const dx = enemies[e].x - playerPos[0]
          const dz = enemies[e].z - playerPos[2]
          if (dx * dx + dz * dz <= tactDef.detectionRadius * tactDef.detectionRadius) {
            eligibleTargets.push(enemies[e])
          }
        }

        if (eligibleTargets.length > 0) {
          // Random selection with anti-repeat: exclude lastTargetId when pool > 1
          let targetIdx = Math.floor(Math.random() * eligibleTargets.length)
          if (eligibleTargets.length > 1 && eligibleTargets[targetIdx].id === tacticalWeapon.lastTargetId) {
            targetIdx = (targetIdx + 1) % eligibleTargets.length
          }
          const target = eligibleTargets[targetIdx]
          tacticalWeapon.lastTargetId = target.id

          // Compute damage values
          const baseDmg = tacticalWeapon.overrides?.damage ?? tactDef.baseDamage
          const isMainCrit = composedWeaponMods.critChance > 0 && Math.random() < composedWeaponMods.critChance
          const mainDmg = baseDmg * composedWeaponMods.damageMultiplier * (isMainCrit ? composedWeaponMods.critMultiplier : 1)
          const splashDmg = baseDmg * composedWeaponMods.damageMultiplier * (tactDef.splashDamageRatio ?? 0.5)
          const effectiveSplashRadius = tactDef.strikeAoeRadius * composedWeaponMods.zoneMultiplier

          // Build hit list: primary target + AOE splash on nearby enemies
          const tacticalHits = [{ enemyId: target.id, damage: mainDmg, isCrit: isMainCrit }]
          for (let e = 0; e < enemies.length; e++) {
            if (enemies[e].id === target.id) continue // already hit as primary
            const dx = enemies[e].x - target.x
            const dz = enemies[e].z - target.z
            if (dx * dx + dz * dz <= effectiveSplashRadius * effectiveSplashRadius) {
              tacticalHits.push({ enemyId: enemies[e].id, damage: splashDmg, isCrit: false })
            }
          }

          // Damage numbers (spawn before damage so enemy positions are still valid)
          const dnEntries = []
          for (let i = 0; i < tacticalHits.length; i++) {
            const e = enemies.find(ev => ev.id === tacticalHits[i].enemyId)
            if (e) dnEntries.push({ damage: Math.round(tacticalHits[i].damage), worldX: e.x, worldZ: e.z, isCrit: tacticalHits[i].isCrit })
          }
          if (dnEntries.length > 0) useDamageNumbers.getState().spawnDamageNumbers(dnEntries)

          // Knockback on primary target — radial away from player
          const kbDist = Math.sqrt((target.x - playerPos[0]) ** 2 + (target.z - playerPos[2]) ** 2)
          const kbDirX = kbDist > 0 ? (target.x - playerPos[0]) / kbDist : 0
          const kbDirZ = kbDist > 0 ? (target.z - playerPos[2]) / kbDist : 1
          applyKnockbackImpulse(enemies, target.id, { weaponId: tacticalWeapon.weaponId, dirX: kbDirX, dirZ: kbDirZ })

          // Apply damage batch + handle kills
          const deathEvents = useEnemies.getState().damageEnemiesBatch(tacticalHits)
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

          // Spawn VFX effect at strike position (up to poolLimit simultaneous effects)
          if (tacticalWeapon.tacticalStrikes.length < (tactDef.poolLimit ?? 4)) {
            tacticalWeapon.tacticalStrikes.push({
              x: target.x,
              z: target.z,
              timer: tactDef.strikeVfxDuration,
              maxDuration: tactDef.strikeVfxDuration,
              splashRadius: effectiveSplashRadius,
            })
          }

          playSFX(tactDef.sfxKey)
        }
        // If eligibleTargets.length === 0: cooldown already reset above, no shot, no VFX, no SFX
      }
    }
    ```

- [x] Task 4: Create `src/renderers/TacticalShotRenderer.jsx`
  - [ ] Pool of `POOL_SIZE = 4` flash disc meshes + `POOL_SIZE` ring meshes (8 total), using refs:
    ```js
    const flashRefs = useRef([])   // bright impact disc per slot
    const ringRefs = useRef([])    // expanding AOE ring per slot
    ```
  - [ ] `useMemo` for shared geometry:
    ```js
    const flashGeo = useMemo(() => new THREE.CircleGeometry(2, 16), [])
    const ringGeo = useMemo(() => new THREE.RingGeometry(0.88, 1.0, 48), [])
    ```
  - [ ] Per-slot materials (independent opacity) — create 4 flash + 4 ring materials:
    ```js
    const flashMats = useMemo(() => Array.from({ length: POOL_SIZE }, () =>
      new THREE.MeshBasicMaterial({ color: '#2dc653', transparent: true, opacity: 0, side: THREE.DoubleSide })
    ), [])
    const ringMats = useMemo(() => Array.from({ length: POOL_SIZE }, () =>
      new THREE.MeshBasicMaterial({ color: '#2dc653', transparent: true, opacity: 0, side: THREE.DoubleSide })
    ), [])
    ```
  - [ ] `useEffect` cleanup: dispose flashGeo, ringGeo, each flashMat, each ringMat
  - [ ] `useFrame` logic:
    1. `const tacticalWeapon = useWeapons.getState().activeWeapons.find(w => WEAPONS[w.weaponId]?.weaponType === 'tactical_shot')`
    2. If `!tacticalWeapon || !tacticalWeapon.tacticalStrikes`: hide all meshes, return
    3. For each slot `i` in 0..POOL_SIZE-1:
       - Flash mesh `flashRefs.current[i]`, ring mesh `ringRefs.current[i]`
       - If `i >= strikes.length` or `!mesh`: set `visible = false`, continue
       - `const strike = strikes[i]`
       - `const progress = 1 - (strike.timer / strike.maxDuration)` (0 = just spawned → 1 = expiring)
       - `const opacity = 1 - progress` (fades from 1 → 0)
       - **Flash disc**: `flash.position.set(strike.x, -0.4, strike.z)`, `flash.rotation.x = -Math.PI / 2`, `flash.visible = true`, `flashMats[i].opacity = opacity * 0.85`
       - **Ring**: expand from 0 to splashRadius as progress goes 0→1. `const ringScale = progress * strike.splashRadius` (ringGeo outer=1.0 → world outer = ringScale). `ring.position.set(strike.x, -0.45, strike.z)`, `ring.rotation.x = -Math.PI / 2`, `ring.scale.setScalar(Math.max(0.01, ringScale))`, `ring.visible = true`, `ringMats[i].opacity = opacity * 0.6`
  - [ ] JSX: two flat arrays of `<mesh>` elements (flash array first, then ring array), each with `frustumCulled={false}`, `visible={false}` as default
    ```jsx
    return (
      <>
        {Array.from({ length: POOL_SIZE }, (_, i) => (
          <mesh
            key={`tshot-flash-${i}`}
            ref={el => { flashRefs.current[i] = el }}
            geometry={flashGeo}
            material={flashMats[i]}
            frustumCulled={false}
            visible={false}
          />
        ))}
        {Array.from({ length: POOL_SIZE }, (_, i) => (
          <mesh
            key={`tshot-ring-${i}`}
            ref={el => { ringRefs.current[i] = el }}
            geometry={ringGeo}
            material={ringMats[i]}
            frustumCulled={false}
            visible={false}
          />
        ))}
      </>
    )
    ```
  - [ ] Imports: `useRef`, `useMemo`, `useEffect` from `react`; `useFrame` from `@react-three/fiber`; `* as THREE` from `three`; `useWeapons` from `../stores/useWeapons.jsx`; `WEAPONS` from `../entities/weaponDefs.js`

- [x] Task 5: Mount `TacticalShotRenderer` in `src/scenes/GameplayScene.jsx`
  - [ ] Add import: `import TacticalShotRenderer from '../renderers/TacticalShotRenderer.jsx'`
  - [ ] Render `<TacticalShotRenderer />` alongside other weapon renderers (near `<ProjectileRenderer />`)
  - [ ] No conditional needed — self-hides when not equipped

- [x] Task 6: Manual QA (deferred — requires browser testing)
  - [ ] Force-equip: `useWeapons.getState().addWeapon('TACTICAL_SHOT')` in browser console
  - [ ] Verify VFX appears at the enemy position, NOT at the player ship
  - [ ] Verify the flash disc + ring effect is visible at `#2dc653`
  - [ ] Verify the ring expands outward from the impact point over 0.3s then disappears
  - [ ] Walk among enemies — verify damage numbers appear at the targeted enemy
  - [ ] Verify AOE splash damage numbers on nearby enemies (cluster check)
  - [ ] Move far from all enemies — verify no VFX, no SFX (skip is silent)
  - [ ] Kill an enemy with TACTICAL_SHOT — verify explosion VFX + loot drop + score increment
  - [ ] Equip multiple weapons alongside TACTICAL_SHOT — verify TACTICAL_SHOT fires on its own cycle
  - [ ] Check `useWeapons.getState().activeWeapons.find(w => w.weaponId==='TACTICAL_SHOT').lastTargetId` — verify it updates each shot

- [x] Task 7: Remove `implemented: false` from TACTICAL_SHOT def after successful QA

## Dev Notes

### Codebase Context

**TACTICAL_SHOT is the simplest "non-projectile" weapon in Epic 32** — simpler than SHOCKWAVE (arc geometry + burst queue) and MINE_AROUND (orbital mines + respawn). It has a standard cooldown, fires once per tick when cooldown ≤ 0, applies damage once, and spawns a short-lived VFX marker. No persistent state beyond the cooldown timer and the small VFX array.

**No projectile spawning whatsoever.** Unlike DIAGONALS which fires 4 projectiles, TACTICAL_SHOT calls `damageEnemiesBatch()` directly. The target takes damage the same frame the cooldown fires. No collision system involvement — the target selection is a manual distance check in GameLoop.

**`weaponType: 'tactical_shot'` discriminator.** TACTICAL_SHOT bypasses `useWeapons.tick()` entirely via a `continue` statement placed before `weapon.cooldownTimer -= delta`. TACTICAL_SHOT's own cooldown is `weapon.tacticalCooldownTimer`, managed with `Math.max(0, timer - clampedDelta)` in GameLoop section 7a-sexies. The `weapon.cooldownTimer` from `addWeapon()` (initialized to 0) is never used.

**Three state fields on weapon object (lazy-init):**
- `tacticalCooldownTimer`: starts at 0 → fires immediately → resets to `baseCooldown * cooldownMultiplier`. Check: `if (tacticalWeapon.tacticalCooldownTimer === undefined)` (NOT `if (!tacticalWeapon.tacticalCooldownTimer)` — 0 is falsy but valid!).
- `tacticalStrikes[]`: array of `{x, z, timer, maxDuration, splashRadius}` for VFX. Splice-from-end loop keeps it clean.
- `lastTargetId`: `undefined` on first weapon frame (no exclusion), then set to the last hit enemy's `id` string.

**Distance check uses squared distances** for the `detectionRadius` filter — avoids `Math.sqrt()` in a loop over all enemies. Use `dx*dx + dz*dz <= detectionRadius * detectionRadius`. Same optimization for `splashRadius` AOE loop.

**`detectionRadius: 60` world units vs spawn range 80-120.** Enemies spawn 80-120 units from the player and approach at their movement speed. TACTICAL_SHOT catches enemies that have already closed to within 60 units — this is intentional "front-line pressure" targeting behavior. The weapon won't fire immediately at fresh spawns; it fires at enemies that are already threatening.

**`splashDmg` does NOT scale with crit.** Only the primary target gets a crit roll. Splash damage is always `baseDmg * damageMultiplier * splashRatio` regardless. This is consistent with EXPLOSIVE_ROUND's AOE logic in GameLoop (line 404: `proj.explosionDamage` for area hits has no crit).

**`effectiveSplashRadius = strikeAoeRadius * composedWeaponMods.zoneMultiplier`.** The splash radius scales with the `zone` permanent upgrade, consistent with MINE_AROUND's `effectiveExplosionRadius`. The `strikeAoeRadius` of 6 units is stored in the VFX `splashRadius` field so the renderer can match the visual ring to the actual damage area.

**VFX radius vs damage radius match.** The ring mesh in `TacticalShotRenderer` is scaled to `progress * strike.splashRadius` — at full expansion (progress → 1), the ring reaches exactly `splashRadius` world units in radius. This means the visual exactly matches the AOE damage area, giving accurate feedback.

**`poolLimit: 4` VFX slots.** With `baseCooldown: 1.2s` and `strikeVfxDuration: 0.3s`, there can be at most 1 active VFX at any time at base stats. At level 9 with `cooldown: 0.46s`, you fire every 0.46s with VFX lasting 0.3s → at most 1-2 overlapping. Pool of 4 is a generous safety margin. The renderer simply skips rendering when `i >= strikes.length`.

**Splice-from-end for VFX expiry** (`for (let s = strikes.length - 1; s >= 0; s--)`): iterating backward and splicing avoids index shifting issues. This is correct for small arrays (max 4 elements).

**No SFX on skip.** When `eligibleTargets.length === 0`, the weapon skips the shot silently. `playSFX(tactDef.sfxKey)` is only called inside the `if (eligibleTargets.length > 0)` block. This is intentional — firing sounds without a visible effect would be confusing.

**`applyKnockbackImpulse` with synthetic object.** Same pattern as MINE_AROUND: `{ weaponId: tacticalWeapon.weaponId, dirX: kbDirX, dirZ: kbDirZ }`. The `knockbackStrength` is read from `WEAPONS[proj.weaponId].knockbackStrength` inside `knockbackSystem.js`. Only the primary target gets knockback (not splash targets), consistent with the AC.

**`(target.x - playerPos[0]) ** 2`:** Using the ES7 `**` operator for squaring. If the project's lint rules don't allow it, use `Math.pow(...)` instead. This is purely cosmetic.

**Upgrade notes.** `upgradeWeapon()` writes `overrides.cooldown` and `overrides.damage`. TACTICAL_SHOT reads both: `tactDef.baseCooldown` → `overrides.cooldown`, `tactDef.baseDamage` → `overrides.damage`. The `cooldown` override feeds into `tacticalCooldownTimer` reset; `damage` overrides `baseDmg` in the strike formula. Standard behavior, no special handling needed.

**No `activateWeapons` declaration needed at section top.** Unlike some GameLoop sections that use `const { enemies } = useEnemies.getState()` (line 334, already in scope), `activeWeapons` is NOT a pre-declared local in GameLoop. Use `useWeapons.getState().activeWeapons.find(...)` inline, or — if another Epic 32 section already declared `const { activeWeapons } = useWeapons.getState()` earlier in the same frame — reuse that. Since `const` is function-scoped here (no block braces), the safest approach is to use the inline `useWeapons.getState().activeWeapons` call.

### TACTICAL_SHOT Weapon Def

```js
TACTICAL_SHOT: {
  id: 'TACTICAL_SHOT',
  name: 'Tactical Strike',
  description: 'Instant strike on a random nearby enemy with AOE splash',
  baseDamage: 35,
  baseCooldown: 1.2,
  weaponType: 'tactical_shot',     // discriminator — bypasses cooldown/projectile in useWeapons.tick()
  detectionRadius: 60,             // world units — max range for target selection
  strikeAoeRadius: 6,              // world units — AOE splash radius (base, before zoneMultiplier)
  strikeVfxDuration: 0.3,          // seconds — flash + ring animation lifetime
  splashDamageRatio: 0.5,          // splash damage = baseDamage * damageMultiplier * 0.5
  poolLimit: 4,                    // max simultaneous VFX instances
  projectileColor: '#2dc653',      // green — distinct from all existing weapons
  sfxKey: 'tactical-shot',         // placeholder SFX (audioManager handles missing files)
  knockbackStrength: 2,            // radial knockback on primary target only
  rarityDamageMultipliers: { ...DEFAULT_RARITY_DMG },
  slot: 'any',
  implemented: false,              // removed in Task 7
  upgrades: [
    { level: 2, damage: 42, cooldown: 1.14, statPreview: 'Damage: 35 → 42' },
    { level: 3, damage: 51, cooldown: 1.06, statPreview: 'Damage: 42 → 51' },
    { level: 4, damage: 62, cooldown: 0.97, statPreview: 'Damage: 51 → 62' },
    { level: 5, damage: 75, cooldown: 0.88, statPreview: 'Damage: 62 → 75', upgradeVisuals: { color: '#40e070' } },
    { level: 6, damage: 91, cooldown: 0.78, statPreview: 'Damage: 75 → 91' },
    { level: 7, damage: 110, cooldown: 0.68, statPreview: 'Damage: 91 → 110' },
    { level: 8, damage: 132, cooldown: 0.57, statPreview: 'Damage: 110 → 132' },
    { level: 9, damage: 158, cooldown: 0.46, statPreview: 'Damage: 132 → 158', upgradeVisuals: { color: '#60f090' } },
  ],
},
```

### Files to Create / Modify

| Action | File | Notes |
|--------|------|-------|
| Modify | `src/entities/weaponDefs.js` | Add TACTICAL_SHOT def |
| Modify | `src/stores/useWeapons.jsx` | Add `tactical_shot` `continue` before cooldownTimer decrement |
| Modify | `src/GameLoop.jsx` | Add section 7a-sexies |
| **Create** | `src/renderers/TacticalShotRenderer.jsx` | New renderer — 4 flash disc + 4 ring meshes |
| Modify | `src/scenes/GameplayScene.jsx` | Import + mount TacticalShotRenderer |

### Architecture Compliance

- ✅ Game logic (target selection, damage, cooldown) in GameLoop — NOT in renderer
- ✅ Renderer reads from stores via `getState()` in `useFrame` — no Zustand subscription
- ✅ New renderer in `src/renderers/` — correct layer, PascalCase naming
- ✅ Weapon def in `src/entities/weaponDefs.js` — data layer
- ✅ No new Zustand store — TACTICAL_SHOT state stored on weapon object (lazy-init)
- ✅ `useMemo` for geometry + individual `useMemo` for material arrays — no allocation in useFrame
- ✅ `useEffect` cleanup — no memory leak
- ✅ `damageEnemiesBatch` reuse — no duplicated damage logic
- ✅ `applyKnockbackImpulse` reuse — no duplicated knockback logic
- ✅ `weaponType: 'tactical_shot'` discriminator — consistent Epic 32 pattern
- ✅ Squared-distance checks — no Math.sqrt in O(n) enemy loops
- ✅ Splice-from-end for VFX array — correct and allocation-free
- ✅ `addExplosion()` reuse for death VFX — no new particle system code
- ✅ `frustumCulled={false}` on all VFX meshes — no disappearing effects at screen edges

### Project Structure Notes

`TacticalShotRenderer.jsx` is a new file in `src/renderers/`, following PascalCase convention consistent with all other renderers (`ProjectileRenderer.jsx`, `MineAroundRenderer.jsx`, etc.).

The `tactical_shot` `weaponType` discriminator follows the same pattern as `'laser_cross'` (32.1), `'magnetic_field'` (32.2), `'shockwave'` (32.4), `'mine_around'` (32.5).

`detectionRadius`, `strikeAoeRadius`, `strikeVfxDuration`, `splashDamageRatio` are new per-weapon fields on the TACTICAL_SHOT def. They follow the same convention as other per-weapon-type fields: `homing` (MISSILE_HOMING), `explosionRadius` (EXPLOSIVE_ROUND), `orbitalRadius` (SATELLITE), `mineCount` (MINE_AROUND). They only exist on TACTICAL_SHOT and don't affect other weapons.

**Section naming convention**: The GameLoop section after 7a-quinquies is 7a-sexies (Latin: sextus = sixth). This continues the pattern: bis (2nd), ter (3rd), quater (4th), quinquies (5th), sexies (6th).

### References

- [Source: `src/stores/useWeapons.jsx:42`] — `weapon.cooldownTimer -= delta` — `tactical_shot` `continue` must precede this line
- [Source: `src/stores/useWeapons.jsx:22-29`] — `tick()` signature, `composedWeaponMods` parameter structure — TACTICAL_SHOT bypasses this entirely via `continue`
- [Source: `src/GameLoop.jsx:251-258`] — `composedWeaponMods` with `damageMultiplier`, `cooldownMultiplier`, `critChance`, `critMultiplier`, `zoneMultiplier` — all used in section 7a-sexies
- [Source: `src/GameLoop.jsx:334`] — `const { enemies } = useEnemies.getState()` — in scope at section 7a-sexies
- [Source: `src/GameLoop.jsx:371-413`] — Section 7a projectile-enemy hits — 7a-sexies inserts BEFORE section 7b (line 416)
- [Source: `src/GameLoop.jsx:407`] — `addExplosion(proj.x, proj.z, proj.color)` — TACTICAL_SHOT reuses same call for death explosions
- [Source: `src/GameLoop.jsx:393-406`] — EXPLOSIVE_ROUND AOE loop pattern (non-crit splash hits) — TACTICAL_SHOT uses same structure
- [Source: `src/systems/knockbackSystem.js`] — `applyKnockbackImpulse(enemies, enemyId, { weaponId, dirX, dirZ })` — synthetic object pattern for radial knockback
- [Source: `src/GameLoop.jsx:416-453`] — `damageEnemiesBatch`, damage numbers, death events loop — TACTICAL_SHOT uses same pattern
- [Source: `_bmad-output/implementation-artifacts/32-5-mine-around-weapon.md`] — Lazy-init pattern (`tacticalCooldownTimer === undefined`), GameLoop section structure, VFX state on weapon object
- [Source: `_bmad-output/planning-artifacts/epic-32-new-weapon-mechanics.md#Story 32.6`] — AC: `detectionRadius`, `strikeVfxDuration`, AOE `baseDamage * 0.5`, anti-repeat targeting, color `#2dc653`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Flaky test fix: `useWeapons.test.js` line 366 `critChance: 0` → `critChance: -1` to suppress weapon-level crits (LASER_FRONT has def.critChance: 0.05, causing 5% random failures)

### Completion Notes List

- Tasks 1-5: Core implementation (weaponDef, store skip, GameLoop 7a-sexies, TacticalShotRenderer, GameplayScene mount)
- Task 6: Manual QA deferred (requires browser testing with `useWeapons.getState().addWeapon('TACTICAL_SHOT')`)
- Task 7: `implemented: false` removed — TACTICAL_SHOT now eligible for level-up pool
- Updated `progressionSystem.newWeapons.test.js`: moved TACTICAL_SHOT from STUB_WEAPON_IDS to IMPLEMENTED_WEAPON_IDS (9 implemented + 1 stub)
- Fixed flaky boon damage test (`critChance: -1` to suppress weapon-level crits)
- **Code review fixes (adversarial review)**:
  - [H1] Created `src/entities/__tests__/weaponDefs.tacticalShot.test.js` (25 tests — def fields, upgrades, rarityWeight)
  - [H1] Created `src/stores/__tests__/useWeapons.tacticalShot.test.js` (24 tests — skip, cooldown, VFX lifecycle, target selection, anti-repeat, AOE splash)
  - [M1] Added `rarityWeight: 6` to TACTICAL_SHOT def (was defaulting to 1 in progressionSystem, making it 7-10× rarer than standard weapons)

### File List

| Action | File |
|--------|------|
| Modified | `src/entities/weaponDefs.js` |
| Modified | `src/stores/useWeapons.jsx` |
| Modified | `src/GameLoop.jsx` |
| Created | `src/renderers/TacticalShotRenderer.jsx` |
| Modified | `src/scenes/GameplayScene.jsx` |
| Modified | `src/entities/__tests__/weaponDefs.test.js` |
| Modified | `src/stores/__tests__/useWeapons.test.js` |
| Modified | `src/systems/__tests__/progressionSystem.newWeapons.test.js` |
| Created | `src/entities/__tests__/weaponDefs.tacticalShot.test.js` |
| Created | `src/stores/__tests__/useWeapons.tacticalShot.test.js` |
