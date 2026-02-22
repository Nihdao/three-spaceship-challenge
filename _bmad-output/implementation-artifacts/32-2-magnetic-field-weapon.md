# Story 32.2: MAGNETIC_FIELD — Permanent Aura Zone

Status: ready-for-dev

## Story

As a player,
I want to equip a passive aura weapon that continuously damages nearby enemies,
So that I have always-on area control without needing to aim.

## Acceptance Criteria

1. **[Persistent visual aura]** When MAGNETIC_FIELD is equipped during gameplay, a semi-transparent disc is always visible around the player at `auraRadius` units. The disc has a pulsing edge glow in `#c084fc` that oscillates between scale 0.95× and 1.05× at ~1Hz.

2. **[Damage ticks — all enemies simultaneously]** Every 0.25 seconds, ALL enemies within `effectiveRadius` take `baseDamage * damageMultiplier` damage simultaneously. Crits are rolled per enemy per tick using `critChance`. If no enemies are in range, the tick is a no-op.

3. **[Area scaling with zoneMultiplier]** When `zoneMultiplier` increases via permanent upgrades or boons, both the damage radius and the visual disc scale: `effectiveRadius = auraRadius * zoneMultiplier`. Renderer and GameLoop stay in sync.

4. **[No cooldown, no projectiles]** MAGNETIC_FIELD never generates entries in the `projectiles` array. `useWeapons.tick()` skips it entirely with `continue` (before `weapon.cooldownTimer -= delta`).

5. **[Pool limit = 1]** Only one MAGNETIC_FIELD aura instance exists. The existing `addWeapon()` duplicate check prevents equipping it twice.

6. **[Disc does not occlude gameplay]** The disc is rendered with `depthWrite: false`, additive blending, and low opacity (fill ≈ 0.12, edge ring ≈ 0.40). Enemies and the player ship are fully visible through it.

7. **[`implemented: false` removed]** At the end of this story, the `implemented: false` flag is removed from MAGNETIC_FIELD in `weaponDefs.js`, making it eligible for the level-up pool.

## Tasks / Subtasks

- [ ] Task 1: Add MAGNETIC_FIELD stub to `src/entities/weaponDefs.js`
  - [ ] Add `MAGNETIC_FIELD` entry after `LASER_CROSS` (if Story 32.1 is merged) or after `EXPLOSIVE_ROUND` (if 32.1 not yet merged)
  - [ ] Fields: `id`, `name`, `description`, `baseDamage: 5`, `weaponType: 'magnetic_field'`, `auraRadius: 15`, `tickRate: 0.25`, `projectileColor: '#c084fc'`, `sfxKey: 'magnetic-pulse'`, `knockbackStrength: 0`, `rarityDamageMultipliers`, `slot: 'any'`, `implemented: false`, `upgrades` (levels 2–9)
  - [ ] Omit: `baseCooldown`, `baseSpeed`, `projectileRadius`, `projectileLifetime`, `projectileType`, `projectilePattern` — not applicable to this weapon type

- [ ] Task 2: Skip MAGNETIC_FIELD in `useWeapons.tick()` (`src/stores/useWeapons.jsx`)
  - [ ] After the `laser_cross` branch (if Story 32.1 is merged), add: `if (def.weaponType === 'magnetic_field') { continue }`
  - [ ] If 32.1 is NOT yet merged, add this as the first `weaponType` check before `weapon.cooldownTimer -= delta`
  - [ ] Placement is critical: this `continue` MUST appear before `weapon.cooldownTimer -= delta` (currently line ~42)
  - [ ] No state management in this branch — MAGNETIC_FIELD has no angle, no cycle timer in useWeapons

- [ ] Task 3: Create `src/renderers/MagneticFieldRenderer.jsx`
  - [ ] `useMemo` for 4 resources:
    - `circleGeo = new THREE.CircleGeometry(1, 64)` (unit disc, 64 segments)
    - `ringGeo = new THREE.RingGeometry(0.94, 1.0, 64)` (edge ring, 6% width)
    - `fillMat = new THREE.MeshBasicMaterial({ color: '#c084fc', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })`
    - `edgeMat = new THREE.MeshBasicMaterial({ color: '#c084fc', transparent: true, opacity: 0.40, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })`
  - [ ] `useEffect` cleanup: `circleGeo.dispose(); ringGeo.dispose(); fillMat.dispose(); edgeMat.dispose()`
  - [ ] Refs: `groupRef` (outer group), `discRef` (fill mesh), `ringRef` (edge mesh)
  - [ ] `useFrame` logic:
    - Read `useWeapons.getState().activeWeapons` → find weapon where `WEAPONS[w.weaponId]?.weaponType === 'magnetic_field'`
    - If not found → `groupRef.current.visible = false`, return early
    - `groupRef.current.visible = true`
    - Read `usePlayer.getState().position` → `group.position.set(px, GAME_CONFIG.PROJECTILE_SPAWN_Y_OFFSET, pz)`
    - `const def = WEAPONS[weapon.weaponId]`
    - `const radius = weapon.effectiveRadius ?? weapon.overrides?.auraRadius ?? def.auraRadius`
    - `const pulse = 1.0 + 0.05 * Math.sin(state.clock.elapsedTime * Math.PI * 2)` (1Hz, range [0.95, 1.05])
    - `group.scale.set(radius * pulse, 1, radius * pulse)` (Y stays 1 — disc is flat)
  - [ ] JSX structure:
    ```jsx
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <mesh ref={discRef} geometry={circleGeo} material={fillMat} />
      <mesh ref={ringRef} geometry={ringGeo} material={edgeMat} />
    </group>
    ```
  - [ ] The `rotation={[-Math.PI / 2, 0, 0]}` makes the XY-plane disc lie flat in the XZ game plane
  - [ ] `frustumCulled={false}` prevents the aura from disappearing when the player moves to screen edges

- [ ] Task 4: Add MAGNETIC_FIELD aura damage in `src/GameLoop.jsx` (section 7a-ter)
  - [ ] Insert after section 7a-bis (LASER_CROSS, Story 32.1) or directly after the projectile-enemy loop if 32.1 not merged
  - [ ] Place BEFORE the existing `// 7b. Apply enemy damage (batch)` comment
  - [ ] Declare `MAGNETIC_FIELD_TICK_RATE = 0.25` as a local constant (not in gameConfig.js)
  - [ ] Reuse `activeWeapons` if already declared in 7a-bis, or declare fresh: `const activeWeapons = useWeapons.getState().activeWeapons`
  - [ ] Store `effectiveRadius` on weapon object for renderer sync: `magWeapon.effectiveRadius = effectiveRadius`
  - [ ] Full section code:
    ```js
    // 7a-ter. MAGNETIC_FIELD aura damage
    const MAGNETIC_FIELD_TICK_RATE = 0.25
    const activeWeapons = useWeapons.getState().activeWeapons // reuse from 7a-bis if available
    const magWeapon = activeWeapons.find(w => WEAPONS[w.weaponId]?.weaponType === 'magnetic_field')
    if (magWeapon) {
      const magDef = WEAPONS[magWeapon.weaponId]
      const effectiveRadius = (magWeapon.overrides?.auraRadius ?? magDef.auraRadius) * composedWeaponMods.zoneMultiplier
      magWeapon.effectiveRadius = effectiveRadius // sync for renderer
      magWeapon.magneticDamageTick = (magWeapon.magneticDamageTick ?? 0) + clampedDelta
      if (magWeapon.magneticDamageTick >= MAGNETIC_FIELD_TICK_RATE) {
        magWeapon.magneticDamageTick -= MAGNETIC_FIELD_TICK_RATE
        const baseDmg = magWeapon.overrides?.damage ?? magDef.baseDamage
        const magHits = []
        for (let e = 0; e < enemies.length; e++) {
          const dx = enemies[e].x - playerPos[0]
          const dz = enemies[e].z - playerPos[2]
          if (Math.sqrt(dx * dx + dz * dz) <= effectiveRadius) {
            const isCrit = composedWeaponMods.critChance > 0 && Math.random() < composedWeaponMods.critChance
            const dmg = baseDmg * composedWeaponMods.damageMultiplier * (isCrit ? composedWeaponMods.critMultiplier : 1)
            magHits.push({ enemyId: enemies[e].id, damage: dmg, isCrit })
          }
        }
        if (magHits.length > 0) {
          const dnEntries = []
          for (let i = 0; i < magHits.length; i++) {
            const e = enemies.find(ev => ev.id === magHits[i].enemyId)
            if (e) dnEntries.push({ damage: Math.round(magHits[i].damage), worldX: e.x, worldZ: e.z, isCrit: magHits[i].isCrit })
          }
          if (dnEntries.length > 0) useDamageNumbers.getState().spawnDamageNumbers(dnEntries)
          const deathEvents = useEnemies.getState().damageEnemiesBatch(magHits)
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
    }
    ```

- [ ] Task 5: Mount `MagneticFieldRenderer` in `src/scenes/GameplayScene.jsx`
  - [ ] Add import: `import MagneticFieldRenderer from '../renderers/MagneticFieldRenderer.jsx'`
  - [ ] Render `<MagneticFieldRenderer />` alongside `<ProjectileRenderer />` — no conditional needed (self-hides when not equipped)

- [ ] Task 6: Remove `implemented: false` from MAGNETIC_FIELD def
  - [ ] After manual QA (Task 7), remove the `implemented: false` line from MAGNETIC_FIELD in `weaponDefs.js`

- [ ] Task 7: Manual QA
  - [ ] Force-equip: `useWeapons.getState().addWeapon('MAGNETIC_FIELD')` in browser console
  - [ ] Verify disc is visible at correct radius, flat on the ground plane, following the player
  - [ ] Verify pulsing scale animation (edge glow breathes 0.95 → 1.05 at ~1Hz)
  - [ ] Verify disc does NOT occlude enemies or player ship
  - [ ] Verify enemies within range take damage every ~0.25s; enemies outside range are unaffected
  - [ ] Verify `useWeapons.getState().projectiles.length` stays at 0 when only MAGNETIC_FIELD is equipped
  - [ ] Verify weapon occupies exactly 1 slot in `activeWeapons`
  - [ ] Optional: apply a zone permanent upgrade and confirm disc radius scales visually

## Dev Notes

### Codebase Context

**Relationship with Story 32.1 (LASER_CROSS).** This story follows the exact same `weaponType` discriminator pattern introduced in 32.1. The `continue` in `useWeapons.tick()` and the per-weapon-object mutation pattern for `magneticDamageTick` are identical to what 32.1 does for `laserCrossDamageTick`. Stories 32.1 and 32.2 are independent and can be implemented in any order or in parallel — just ensure both `continue` checks appear before `weapon.cooldownTimer -= delta`.

**`continue` placement in `useWeapons.tick()` is critical.** The weapons loop at `src/stores/useWeapons.jsx:42` does `weapon.cooldownTimer -= delta` unconditionally. Both `laser_cross` and `magnetic_field` must intercept with `continue` BEFORE this line. Failing to do so is harmless but mutates a meaningless timer on a weapon that has no cooldown concept.

**`magneticDamageTick` lives on the weapon object, managed in GameLoop.** Like `laserCrossDamageTick`, this field is lazily initialized with `?? 0` in GameLoop section 7a-ter. It persists on the mutable `weapon` object in the Zustand `activeWeapons` array. On reset, `initializeWeapons()` discards all active weapons — no reset() modification needed.

**`enemies` variable is already local in GameLoop.** Declared at line 334: `const { enemies } = useEnemies.getState()`. Do NOT call `useEnemies.getState()` again inside 7a-ter — reuse the local `enemies` reference.

**`activeWeapons` access in section 7a-ter.** If Story 32.1 is already merged, section 7a-bis already reads `useWeapons.getState().activeWeapons`. Consider extracting it once before both sections:
```js
const activeWeapons = useWeapons.getState().activeWeapons
// 7a-bis: laserWeapon = activeWeapons.find(...)
// 7a-ter: magWeapon = activeWeapons.find(...)
```

**Renderer radius sync via `magWeapon.effectiveRadius`.** The renderer cannot access `composedWeaponMods` (computed in GameLoop's closure). To give the renderer the exact effective radius including both upgrade and boon zone multipliers, GameLoop stores it on the weapon object: `magWeapon.effectiveRadius = effectiveRadius`. The renderer then reads `weapon.effectiveRadius ?? def.auraRadius`. This gives perfect visual/damage sync.

**No `baseCooldown` in the def — don't break `upgradeWeapon()`.** The `upgradeWeapon()` function applies `newOverrides.cooldown = upgrade.cooldown`. Since MAGNETIC_FIELD upgrades omit `cooldown`, this stores `undefined`. This is harmless: the cooldown path in useWeapons never runs for this weapon (the `continue` skips it). No modification to `upgradeWeapon()` is needed.

**`CircleGeometry` lies in the XY plane by default.** Apply `rotation={[-Math.PI / 2, 0, 0]}` to the group in JSX to make it lie flat in the XZ plane. Do NOT use `geometry.rotateX()` inside useMemo — JSX rotation is cleaner and doesn't mutate geometry data.

**`RingGeometry(0.94, 1.0, 64)` edge ring.** With the group scaled to `effectiveRadius`, the ring inner/outer radii auto-scale. The 6% width creates a visible edge. Adjust inner radius to 0.97 for a thinner "highlight ring" or leave at 0.94 for a wider band.

**`Math.sqrt` in the radius check.** O(N) with one sqrt per enemy per 0.25s tick. At < 200 enemies, this is ~800 sqrt/second — negligible. No spatial hash lookup needed.

**Damage tick NOT scaled by `cooldownMultiplier`.** MAGNETIC_FIELD uses a fixed `MAGNETIC_FIELD_TICK_RATE = 0.25` constant. The AC does not require tick rate scaling. If desired later, replace with `def.tickRate * composedWeaponMods.cooldownMultiplier`.

**No SFX triggered.** Passive always-on weapon — no "fire" event. The `sfxKey` field is kept for schema consistency but is never reached by the SFX loop (which only fires on new projectile spawns).

**`WEAPONS` is already imported in GameLoop** at line 26: `import { WEAPONS } from './entities/weaponDefs.js'`. No new import needed.

### MAGNETIC_FIELD Weapon Def (proposed values)

```js
MAGNETIC_FIELD: {
  id: 'MAGNETIC_FIELD',
  name: 'Magnetic Field',
  description: 'Permanent aura that damages all nearby enemies',
  baseDamage: 5,                // per tick (0.25s) = 20 DPS at level 1
  weaponType: 'magnetic_field', // discriminator — skips projectile logic in useWeapons.tick()
  auraRadius: 15,               // world units (base disc radius, before zoneMultiplier)
  tickRate: 0.25,               // seconds between damage ticks (informational; GameLoop uses local constant)
  projectileColor: '#c084fc',   // used by MagneticFieldRenderer for disc and ring color
  sfxKey: 'magnetic-pulse',     // placeholder — never triggered (passive weapon)
  knockbackStrength: 0,         // no knockback from aura field
  rarityDamageMultipliers: { ...DEFAULT_RARITY_DMG },
  slot: 'any',
  implemented: false,           // removed in Task 6
  upgrades: [
    { level: 2, damage: 6,  statPreview: 'DPS: 20 → 24' },
    { level: 3, damage: 7,  statPreview: 'DPS: 24 → 28' },
    { level: 4, damage: 9,  statPreview: 'DPS: 28 → 36' },
    { level: 5, damage: 11, statPreview: 'DPS: 36 → 44' },
    { level: 6, damage: 14, statPreview: 'DPS: 44 → 56' },
    { level: 7, damage: 17, statPreview: 'DPS: 56 → 68' },
    { level: 8, damage: 21, statPreview: 'DPS: 68 → 84' },
    { level: 9, damage: 26, statPreview: 'DPS: 84 → 104' },
  ],
}
```

Note: upgrades use `damage` key (not `baseDamage`) — matches `weapon.overrides.damage` convention used by `upgradeWeapon()` and read as `magWeapon.overrides?.damage ?? magDef.baseDamage` in GameLoop. Radius stays fixed at `def.auraRadius` for all upgrade levels; zone scaling happens at runtime via `zoneMultiplier`.

### Files to Create / Modify

| Action | File | Notes |
|--------|------|-------|
| Modify | `src/entities/weaponDefs.js` | Add MAGNETIC_FIELD def after LASER_CROSS (or EXPLOSIVE_ROUND) |
| Modify | `src/stores/useWeapons.jsx` | Add `magnetic_field` continue branch before cooldownTimer decrement |
| **Create** | `src/renderers/MagneticFieldRenderer.jsx` | New file — disc + ring visual following player |
| Modify | `src/GameLoop.jsx` | Add section 7a-ter after 7a-bis (or after projectile loop) |
| Modify | `src/scenes/GameplayScene.jsx` | Import + mount MagneticFieldRenderer |

### Architecture Compliance

- ✅ Game logic (damage tick, radius check) in GameLoop — NOT in renderer
- ✅ Renderer is read-only: reads from stores, no `set()` calls
- ✅ New renderer in `src/renderers/` — correct layer (18 existing renderers, same pattern)
- ✅ Weapon def in `src/entities/weaponDefs.js` — data layer
- ✅ No new Zustand store — MAGNETIC_FIELD state stored on weapon object (mutable, in-place)
- ✅ `useMemo` for geometries and materials — no allocation in useFrame
- ✅ `useEffect` cleanup for 4 resources — no memory leak
- ✅ `damageEnemiesBatch` reuse — no duplicated damage logic
- ✅ `weaponType` discriminator pattern — consistent with LASER_CROSS (Story 32.1)
- ✅ Lazy-init pattern for `magneticDamageTick` — consistent with `laserCrossDamageTick`, `orbitalAngle`

### Project Structure Notes

No folder creation needed. `src/renderers/` already exists with 18 renderers — `MagneticFieldRenderer.jsx` follows the same naming and structure conventions (`PascalCase`, exports a single default function component).

No new gameConfig constants. `MAGNETIC_FIELD_TICK_RATE` is a local constant inside GameLoop (not a globally tunable value at this stage).

`weaponType` is a new field in the weapon def schema introduced by Story 32.1. This story reuses it with discriminator value `'magnetic_field'`. All existing weapons without this field are unaffected (`undefined !== 'magnetic_field'`).

### References

- [Source: `_bmad-output/implementation-artifacts/32-1-laser-cross-weapon.md`] — `weaponType` discriminator pattern, `continue` placement in useWeapons.tick(), lazy-init for per-weapon timer, section 7a-bis structure to replicate for 7a-ter
- [Source: `src/stores/useWeapons.jsx:36-42`] — `orbitalAngle` lazy init pattern; exact location of `weapon.cooldownTimer -= delta` (the line the `continue` must precede)
- [Source: `src/stores/useWeapons.jsx:155-188`] — `upgradeWeapon()` — handles `damage`, `cooldown`, `upgradeVisuals`, `pierceCount` overrides; MAGNETIC_FIELD upgrades use only `damage`, no modifications needed
- [Source: `src/GameLoop.jsx:251-262`] — `playerPos` and `composedWeaponMods` definitions (both available for section 7a-ter)
- [Source: `src/GameLoop.jsx:334`] — `const { enemies } = useEnemies.getState()` — `enemies` local variable available throughout the frame
- [Source: `src/GameLoop.jsx:373-453`] — Section 7a + 7b + 7c pattern to replicate for 7a-ter: `damageEnemiesBatch`, `spawnDamageNumbers`, death events with `addExplosion`, `playSFX`, `rollDrops`, `incrementKills`, `addScore`
- [Source: `src/GameLoop.jsx:26`] — `import { WEAPONS } from './entities/weaponDefs.js'` already present
- [Source: `src/renderers/PlanetAuraRenderer.jsx`] — Existing aura-style renderer: `MeshBasicMaterial`, `AdditiveBlending`, `depthWrite: false`, `transparent: true`, pulse via `Math.sin`
- [Source: `src/scenes/GameplayScene.jsx:1-18`] — Renderer import location and mount point alongside ProjectileRenderer
- [Source: `_bmad-output/planning-artifacts/epic-32-new-weapon-mechanics.md#Technical Notes`] — "MAGNETIC_FIELD: single `<mesh>` with transparent disc geometry + animated shader or scale"

## Dev Agent Record

### Agent Model Used

_to be filled_

### Debug Log References

### Completion Notes List

### File List
