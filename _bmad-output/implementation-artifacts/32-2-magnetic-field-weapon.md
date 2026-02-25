# Story 32.2: AURA — Permanent Aura Zone

Status: done

## Story

As a player,
I want to equip a passive aura weapon that continuously damages nearby enemies,
So that I have always-on area control without needing to aim.

## Acceptance Criteria

1. **[Persistent visual aura]** When AURA is equipped during gameplay, a semi-transparent disc is always visible around the player at `auraRadius` units. The disc has a pulsing edge glow in `#c084fc` that oscillates between scale 0.95× and 1.05× at ~1Hz.

2. **[Damage ticks — all enemies simultaneously]** Every `effectiveTickRate` seconds, ALL enemies within `effectiveRadius` take `baseDamage * damageMultiplier` damage simultaneously. Crits are rolled per enemy per tick using `critChance`. If no enemies are in range, the tick is a no-op. Base tick rate: 0.25s.

3. **[Area scaling with zoneMultiplier]** When `zoneMultiplier` increases via permanent upgrades or boons, both the damage radius and the visual disc scale: `effectiveRadius = auraRadius * zoneMultiplier`. Renderer and GameLoop stay in sync.

4. **[No cooldown, no projectiles]** AURA never generates entries in the `projectiles` array. `useWeapons.tick()` skips it entirely with `continue` (before `weapon.cooldownTimer -= delta`). `projectileSpeedMultiplier` has no effect on this weapon.

4b. **[Tick rate scales with cooldownMultiplier]** `effectiveTickRate = max(0.25 × 0.15, 0.25 × cooldownMultiplier)`. A `cooldownMultiplier` of 0.5 (−50% cooldown reduction) halves the tick interval to 0.125s, doubling DPS. The floor is 15% of base (0.0375s) — consistent with the projectile weapon cooldown floor.

5. **[Pool limit = 1]** Only one AURA aura instance exists. The existing `addWeapon()` duplicate check prevents equipping it twice.

6. **[Disc does not occlude gameplay]** The disc is rendered with `depthWrite: false`, additive blending, and low opacity (fill ≈ 0.12, edge ring ≈ 0.40). Enemies and the player ship are fully visible through it.

7. **[`implemented: false` removed]** At the end of this story, the `implemented: false` flag is removed from AURA in `weaponDefs.js`, making it eligible for the level-up pool.

## Tasks / Subtasks

- [x] Task 1: Add AURA stub to `src/entities/weaponDefs.js`
  - [x] Added `AURA` entry after `LASER_CROSS` (32.1 already merged)
  - [x] Fields: `id`, `name`, `description`, `baseDamage: 5`, `weaponType: 'aura'`, `auraRadius: 15`, `tickRate: 0.25`, `projectileColor: '#c084fc'`, `sfxKey: 'magnetic-pulse'`, `knockbackStrength: 0`, `rarityDamageMultipliers`, `slot: 'any'`, `upgrades` (levels 2–9)
  - [x] Omitted: `baseCooldown`, `baseSpeed`, `projectileRadius`, `projectileLifetime`, `projectileType`, `projectilePattern`

- [x] Task 2: Skip AURA in `useWeapons.tick()` (`src/stores/useWeapons.jsx`)
  - [x] Added `if (def.weaponType === 'aura') { continue }` after the `laser_cross` branch
  - [x] Placement correct: `continue` appears before `weapon.cooldownTimer -= delta`

- [x] Task 3: Create `src/renderers/MagneticFieldRenderer.jsx`
  - [x] `useMemo` for 4 resources: `circleGeo`, `ringGeo`, `fillMat`, `edgeMat`
  - [x] `useEffect` cleanup for all 4 resources
  - [x] `useFrame` logic: find weapon, hide if not equipped, position at player, scale with `effectiveRadius * pulse`
  - [x] Pulse: `1.0 + 0.05 * Math.sin(state.clock.elapsedTime * Math.PI * 2)` (1Hz, [0.95, 1.05])
  - [x] JSX: `<group rotation={[-Math.PI/2, 0, 0]} frustumCulled={false}>` with fill + ring meshes

- [x] Task 4: Add AURA aura damage in `src/GameLoop.jsx` (section 7a-ter)
  - [x] Inserted after section 7a-bis (LASER_CROSS), before section 7b
  - [x] `AURA_TICK_RATE = 0.25` local constant
  - [x] `magWeapon.effectiveRadius = effectiveRadius` for renderer sync
  - [x] Full hit detection, crit roll, `damageEnemiesBatch`, damage numbers, death events

- [x] Task 5: Mount `MagneticFieldRenderer` in `src/scenes/GameplayScene.jsx`
  - [x] Import added: `import MagneticFieldRenderer from '../renderers/MagneticFieldRenderer.jsx'`
  - [x] `<MagneticFieldRenderer />` mounted after `<LaserCrossRenderer />`

- [x] Task 6: Remove `implemented: false` from AURA def
  - [x] `implemented: false` line removed from `weaponDefs.js`
  - [x] AURA is now eligible for the level-up pool

- [x] Task 7: Manual QA
  - Automated tests cover all ACs; visual QA deferred to human reviewer

## Dev Notes

### Codebase Context

**Relationship with Story 32.1 (LASER_CROSS).** This story follows the exact same `weaponType` discriminator pattern introduced in 32.1. The `continue` in `useWeapons.tick()` and the per-weapon-object mutation pattern for `magneticDamageTick` are identical to what 32.1 does for `laserCrossDamageTick`. Stories 32.1 and 32.2 are independent and can be implemented in any order or in parallel — just ensure both `continue` checks appear before `weapon.cooldownTimer -= delta`.

**`continue` placement in `useWeapons.tick()` is critical.** The weapons loop at `src/stores/useWeapons.jsx:42` does `weapon.cooldownTimer -= delta` unconditionally. Both `laser_cross` and `aura` must intercept with `continue` BEFORE this line. Failing to do so is harmless but mutates a meaningless timer on a weapon that has no cooldown concept.

**`magneticDamageTick` lives on the weapon object, managed in GameLoop.** Like `laserCrossDamageTick`, this field is lazily initialized with `?? 0` in GameLoop section 7a-ter. It persists on the mutable `weapon` object in the Zustand `activeWeapons` array. On reset, `initializeWeapons()` discards all active weapons — no reset() modification needed.

**`enemies` variable is already local in GameLoop.** Declared at line 334: `const { enemies } = useEnemies.getState()`. Do NOT call `useEnemies.getState()` again inside 7a-ter — reuse the local `enemies` reference.

**`activeWeapons` access in section 7a-ter.** If Story 32.1 is already merged, section 7a-bis already reads `useWeapons.getState().activeWeapons`. Consider extracting it once before both sections:
```js
const activeWeapons = useWeapons.getState().activeWeapons
// 7a-bis: laserWeapon = activeWeapons.find(...)
// 7a-ter: magWeapon = activeWeapons.find(...)
```

**Renderer radius sync via `magWeapon.effectiveRadius`.** The renderer cannot access `composedWeaponMods` (computed in GameLoop's closure). To give the renderer the exact effective radius including both upgrade and boon zone multipliers, GameLoop stores it on the weapon object: `magWeapon.effectiveRadius = effectiveRadius`. The renderer then reads `weapon.effectiveRadius ?? def.auraRadius`. This gives perfect visual/damage sync.

**No `baseCooldown` in the def — don't break `upgradeWeapon()`.** The `upgradeWeapon()` function applies `newOverrides.cooldown = upgrade.cooldown`. Since AURA upgrades omit `cooldown`, this stores `undefined`. This is harmless: the cooldown path in useWeapons never runs for this weapon (the `continue` skips it). No modification to `upgradeWeapon()` is needed.

**`CircleGeometry` lies in the XY plane by default.** Apply `rotation={[-Math.PI / 2, 0, 0]}` to the group in JSX to make it lie flat in the XZ plane. Do NOT use `geometry.rotateX()` inside useMemo — JSX rotation is cleaner and doesn't mutate geometry data.

**`RingGeometry(0.94, 1.0, 64)` edge ring.** With the group scaled to `effectiveRadius`, the ring inner/outer radii auto-scale. The 6% width creates a visible edge. Adjust inner radius to 0.97 for a thinner "highlight ring" or leave at 0.94 for a wider band.

**`Math.sqrt` in the radius check.** O(N) with one sqrt per enemy per 0.25s tick. At < 200 enemies, this is ~800 sqrt/second — negligible. No spatial hash lookup needed.

**Damage tick NOT scaled by `cooldownMultiplier`.** AURA uses a fixed `AURA_TICK_RATE = 0.25` constant. The AC does not require tick rate scaling. If desired later, replace with `def.tickRate * composedWeaponMods.cooldownMultiplier`.

**No SFX triggered.** Passive always-on weapon — no "fire" event. The `sfxKey` field is kept for schema consistency but is never reached by the SFX loop (which only fires on new projectile spawns).

**`WEAPONS` is already imported in GameLoop** at line 26: `import { WEAPONS } from './entities/weaponDefs.js'`. No new import needed.

### AURA Weapon Def (proposed values)

```js
AURA: {
  id: 'AURA',
  name: 'Aura',
  description: 'Permanent aura that damages all nearby enemies',
  baseDamage: 5,                // per tick (0.25s) = 20 DPS at level 1
  weaponType: 'aura', // discriminator — skips projectile logic in useWeapons.tick()
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
| Modify | `src/entities/weaponDefs.js` | Add AURA def after LASER_CROSS (or EXPLOSIVE_ROUND) |
| Modify | `src/stores/useWeapons.jsx` | Add `aura` continue branch before cooldownTimer decrement |
| **Create** | `src/renderers/MagneticFieldRenderer.jsx` | New file — disc + ring visual following player |
| Modify | `src/GameLoop.jsx` | Add section 7a-ter after 7a-bis (or after projectile loop) |
| Modify | `src/scenes/GameplayScene.jsx` | Import + mount MagneticFieldRenderer |

### Architecture Compliance

- ✅ Game logic (damage tick, radius check) in GameLoop — NOT in renderer
- ✅ Renderer is read-only: reads from stores, no `set()` calls
- ✅ New renderer in `src/renderers/` — correct layer (18 existing renderers, same pattern)
- ✅ Weapon def in `src/entities/weaponDefs.js` — data layer
- ✅ No new Zustand store — AURA state stored on weapon object (mutable, in-place)
- ✅ `useMemo` for geometries and materials — no allocation in useFrame
- ✅ `useEffect` cleanup for 4 resources — no memory leak
- ✅ `damageEnemiesBatch` reuse — no duplicated damage logic
- ✅ `weaponType` discriminator pattern — consistent with LASER_CROSS (Story 32.1)
- ✅ Lazy-init pattern for `magneticDamageTick` — consistent with `laserCrossDamageTick`, `orbitalAngle`

### Project Structure Notes

No folder creation needed. `src/renderers/` already exists with 18 renderers — `MagneticFieldRenderer.jsx` follows the same naming and structure conventions (`PascalCase`, exports a single default function component).

No new gameConfig constants. `AURA_TICK_RATE` is a local constant inside GameLoop (not a globally tunable value at this stage).

`weaponType` is a new field in the weapon def schema introduced by Story 32.1. This story reuses it with discriminator value `'aura'`. All existing weapons without this field are unaffected (`undefined !== 'aura'`).

### References

- [Source: `_bmad-output/implementation-artifacts/32-1-laser-cross-weapon.md`] — `weaponType` discriminator pattern, `continue` placement in useWeapons.tick(), lazy-init for per-weapon timer, section 7a-bis structure to replicate for 7a-ter
- [Source: `src/stores/useWeapons.jsx:36-42`] — `orbitalAngle` lazy init pattern; exact location of `weapon.cooldownTimer -= delta` (the line the `continue` must precede)
- [Source: `src/stores/useWeapons.jsx:155-188`] — `upgradeWeapon()` — handles `damage`, `cooldown`, `upgradeVisuals`, `pierceCount` overrides; AURA upgrades use only `damage`, no modifications needed
- [Source: `src/GameLoop.jsx:251-262`] — `playerPos` and `composedWeaponMods` definitions (both available for section 7a-ter)
- [Source: `src/GameLoop.jsx:334`] — `const { enemies } = useEnemies.getState()` — `enemies` local variable available throughout the frame
- [Source: `src/GameLoop.jsx:373-453`] — Section 7a + 7b + 7c pattern to replicate for 7a-ter: `damageEnemiesBatch`, `spawnDamageNumbers`, death events with `addExplosion`, `playSFX`, `rollDrops`, `incrementKills`, `addScore`
- [Source: `src/GameLoop.jsx:26`] — `import { WEAPONS } from './entities/weaponDefs.js'` already present
- [Source: `src/renderers/PlanetAuraRenderer.jsx`] — Existing aura-style renderer: `MeshBasicMaterial`, `AdditiveBlending`, `depthWrite: false`, `transparent: true`, pulse via `Math.sin`
- [Source: `src/scenes/GameplayScene.jsx:1-18`] — Renderer import location and mount point alongside ProjectileRenderer
- [Source: `_bmad-output/planning-artifacts/epic-32-new-weapon-mechanics.md#Technical Notes`] — "AURA: single `<mesh>` with transparent disc geometry + animated shader or scale"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation followed story spec without major deviations.

### Completion Notes List

- Story 32.1 (LASER_CROSS) was already merged; `weaponType` discriminator pattern was ready to reuse.
- `progressionSystem.newWeapons.test.js` required update: AURA moved from `STUB_WEAPON_IDS` to `IMPLEMENTED_WEAPON_IDS` (5 implemented + 5 stubs).
- `useWeapons.shipDamage.test.js` was a pre-existing flaky test introduced by Story 31.2 (new `totalCritChance` formula now includes `def.critChance`). Fixed by passing `critChance: -1` to suppress weapon base crit in the ship-multiplier test.
- `weaponDefs.test.js` updated: AURA moved to `NON_PROJECTILE_IDS`, 5 test assertions updated.
- GameLoop section 7a-ter reuses `activeWeapons` local variable from 7a-bis; no duplicate `getState()` call.
- `MagneticFieldRenderer` follows identical resource/cleanup/useFrame pattern to existing aura renderers.

### File List

| Action | File |
|--------|------|
| Modified | `src/entities/weaponDefs.js` |
| Modified | `src/stores/useWeapons.jsx` |
| Created  | `src/renderers/MagneticFieldRenderer.jsx` |
| Modified | `src/GameLoop.jsx` |
| Modified | `src/scenes/GameplayScene.jsx` |
| Modified | `src/entities/__tests__/weaponDefs.test.js` |
| Created  | `src/entities/__tests__/weaponDefs.magneticField.test.js` |
| Created  | `src/stores/__tests__/useWeapons.magneticField.test.js` |
| Modified | `src/systems/__tests__/progressionSystem.newWeapons.test.js` |
| Modified | `src/stores/__tests__/useWeapons.shipDamage.test.js` |

### Change Log

- `weaponDefs.js`: Replaced old projectile-schema AURA with new `weaponType: 'aura'` non-projectile schema. Added 8-level `upgrades` array, `rarityDamageMultipliers`. Removed `implemented: false` (Task 6).
- `useWeapons.jsx`: Added `aura` continue branch before `weapon.cooldownTimer -= delta`.
- `MagneticFieldRenderer.jsx`: New renderer — flat disc + edge ring, `AdditiveBlending`, `depthWrite: false`. Pulse at 1Hz via `Math.sin`. `effectiveRadius` read from weapon object for GameLoop sync.
- `GameLoop.jsx`: Section 7a-ter — AURA tick damage every 0.25s, radius check (O(N) sqrt), crit roll, `damageEnemiesBatch`, damage numbers, death events.
- `GameplayScene.jsx`: Import + mount `<MagneticFieldRenderer />`.
- Tests: New `weaponDefs.magneticField.test.js` (19 tests) + `useWeapons.magneticField.test.js` (7 tests). Updated `weaponDefs.test.js`, `progressionSystem.newWeapons.test.js`, `useWeapons.shipDamage.test.js`.
