# Story 32.1: LASER_CROSS — Rotating Cross Beams

Status: done

## Story

As a player,
I want to equip a weapon that projects 4 rotating laser arms around my ship,
So that I deal continuous damage to enemies around me without needing to aim.

## Acceptance Criteria

1. **[4 rotating arms]** When LASER_CROSS is equipped and in its active phase, 4 beam arms extend from the ship center at 90° intervals, rotating continuously at `rotationSpeed` rad/sec in world space (independent of cursor and ship facing direction).

2. **[Continuous damage — tick-based]** Each enemy whose position intersects an active arm takes `baseDamage` damage every 0.1 seconds (not per-frame spike). The `damageMultiplier` from boons/upgrades applies to each tick. Crits are rolled per tick using `critChance`.

3. **[Active/inactive cycle]** Arms remain visible for `activeTime` seconds, then disappear for `inactiveTime` seconds. The inactive phase duration is reduced by `cooldownMultiplier` (cooldown-reduction boons shorten downtime). Transition is marked by a 0.2s opacity fade-out/fade-in. The cycle repeats automatically.

4. **[No aim dependency]** The cross rotation is in world space only — it does NOT follow cursor direction or ship rotation.

5. **[Visual: #9b5de5]** Arms are rendered as elongated thin box meshes colored `#9b5de5` with moderate emissive glow. Width is `armWidth`, length is `armLength`.

6. **[Pool slot = 1]** LASER_CROSS occupies exactly 1 weapon slot. The 4 arms are a single entity — not 4 separate projectiles. It does NOT push into the `projectiles` array.

7. **[Boon interactions]** `projectileSpeedMultiplier` boons increase the rotation speed (`rotationSpeed * projectileSpeedMultiplier`), causing enemies to be hit more frequently. `cooldownMultiplier` reduces the inactive phase duration only (`activeTime` is unaffected). `damageMultiplier` and `critChance` apply per damage tick as with all weapons.

8. **[`implemented: false` removed]** At the end of this story, the `implemented: false` flag is removed from the LASER_CROSS def in `weaponDefs.js`, making it eligible for the level-up pool.

## Tasks / Subtasks

- [x] Task 1: Add LASER_CROSS stub to `src/entities/weaponDefs.js`
  - [x] Add `LASER_CROSS` entry after EXPLOSIVE_ROUND following the existing def format
  - [x] Fields: `id`, `name`, `description`, `baseDamage`, `weaponType: 'laser_cross'`, `rotationSpeed`, `activeTime`, `inactiveTime`, `armLength`, `armWidth`, `sfxKey`, `rarityDamageMultipliers`, `slot`, `upgrades` (levels 2–9), `implemented: false`
  - [x] No `projectileType`, `baseSpeed`, `projectileLifetime` — these fields are not used for this weapon type

- [x] Task 2: Extend `useWeapons.tick()` for LASER_CROSS (`src/stores/useWeapons.jsx`)
  - [x] In the active weapons loop, before the cooldown block, add: `if (def.weaponType === 'laser_cross') { ... continue }`
  - [x] Inside that block: advance `weapon.laserCrossAngle` (lazy init to 0), manage `weapon.laserCrossIsActive` (lazy init to `true`) and `weapon.laserCrossCycleTimer` (lazy init to 0)
  - [x] Cycle logic: increment timer by delta; when timer exceeds current phase duration (`activeTime` or `inactiveTime`), subtract duration and toggle `laserCrossIsActive`; use `cooldownMultiplier` on `inactiveTime` (shorter inactive = faster reload)
  - [x] Do NOT push any projectile into `newProjectiles` for this weapon type — the `continue` skips all projectile code

- [x] Task 3: Create `src/renderers/LaserCrossRenderer.jsx`
  - [x] `useMemo` for 2 BoxGeometry objects (arm X-axis, arm Z-axis) and 1 MeshBasicMaterial (`#9b5de5`, `transparent: true`, `toneMapped: false`)
  - [x] `useEffect` for geometry + material disposal on unmount
  - [x] `groupRef` for the parent group (position + rotation updated in `useFrame`)
  - [x] `useFrame`: read `useWeapons.getState().activeWeapons` to find LASER_CROSS weapon; read `usePlayer.getState().position`; if not found or not in gameplay phase → set `group.visible = false` and return
  - [x] Set `group.position.set(px, GAME_CONFIG.PROJECTILE_SPAWN_Y_OFFSET, pz)` each frame
  - [x] Set `group.rotation.y = weapon.laserCrossAngle` each frame
  - [x] Compute opacity: if `weapon.laserCrossIsActive` → `Math.min(1, weapon.laserCrossCycleTimer / FADE_TIME)` else `Math.max(0, 1 - weapon.laserCrossCycleTimer / FADE_TIME)` (FADE_TIME = 0.2s)
  - [x] Update `material.opacity = opacity` and `group.visible = opacity > 0`
  - [x] JSX: `<group ref={groupRef}>` with 2 BoxGeometry meshes sharing one MeshBasicMaterial, positioned at group center (group.rotation.y handles world rotation)

- [x] Task 4: Add LASER_CROSS arm-enemy collision in `src/GameLoop.jsx` (section 7a-bis)
  - [x] Insert between section 7a (projectile-enemy collisions) and 7b (apply batch damage), after the `projectileHits` loop
  - [x] Read `useWeapons.getState().activeWeapons` to find the LASER_CROSS weapon; skip if not equipped or `!weapon.laserCrossIsActive`
  - [x] Advance `weapon.laserCrossDamageTick = (weapon.laserCrossDamageTick ?? 0) + clampedDelta`; skip damage if `< LASER_CROSS_TICK_RATE` (0.1s)
  - [x] When tick fires: `weapon.laserCrossDamageTick -= LASER_CROSS_TICK_RATE`; iterate over `enemies`; for each enemy call `isHitByArm()` (exported helper at module level for unit testability)
  - [x] For hitting enemies: roll crit using `composedWeaponMods.critChance`; compute `dmg = baseDamage * composedWeaponMods.damageMultiplier * (isCrit ? composedWeaponMods.critMultiplier : 1)`; push to a local `laserCrossHits` array
  - [x] Apply batch via `useEnemies.getState().damageEnemiesBatch(laserCrossHits)` (reuse existing batch system)
  - [x] Call `useDamageNumbers.getState().spawnDamageNumbers(dnEntries)` for each hit (same pattern as section 7b)
  - [x] Handle death events: call `addExplosion`, `playSFX('explosion')`, `rollDrops`, `incrementKills`, `addScore` (same pattern as section 7c)

- [x] Task 5: Mount `LaserCrossRenderer` in `src/scenes/GameplayScene.jsx`
  - [x] Add `import LaserCrossRenderer from '../renderers/LaserCrossRenderer.jsx'`
  - [x] Render `<LaserCrossRenderer />` in the JSX, alongside `<ProjectileRenderer />` (no conditional needed — it self-hides when LASER_CROSS is not equipped)

- [ ] Task 6: Remove `implemented: false` from LASER_CROSS def
  - [ ] After manual QA (Task 7), remove the `implemented: false` line from `LASER_CROSS` in `weaponDefs.js`

- [ ] Task 7: Manual QA
  - [ ] Force-equip LASER_CROSS via debug console or by directly calling `useWeapons.getState().addWeapon('LASER_CROSS')`
  - [ ] Verify: 4 arms visible, rotating continuously, independent of aim direction
  - [ ] Verify: active/inactive cycle fires with correct durations, fade-out/in visible
  - [ ] Verify: enemies take damage in arm hit zone; no damage spike (per-tick distribution)
  - [ ] Verify: weapon occupies 1 slot, `projectiles.length` does NOT increase when LASER_CROSS fires
  - [ ] **[AI-Review][HIGH] Axis convention** — Verify visually that the collision zone aligns with the rendered arms. `isHitByArm` uses `dirZ = sin(armAngle)` but Three.js Y-rotation maps local +X to `[cos θ, 0, -sin θ]`. If collision zone is mirrored 45° from arms, negate `dirZ` in `isHitByArm`: change `const dirZ = Math.sin(armAngle)` → `const dirZ = -Math.sin(armAngle)` in `src/GameLoop.jsx:37`. [GameLoop.jsx:36-44]
  - [ ] **[AI-Review][MEDIUM] Enemy radius** — Evaluate if `halfWidth = armWidth/2 = 0.5` unit is sufficient. Standard collision adds enemy radius (`proj.radius + enemy.radius`). If enemies feel like they slip through the arms, consider `armHalfWidth + enemy.radius` in `isHitByArm` call at `src/GameLoop.jsx:484-485`.

## Dev Notes

### Codebase Context

**LASER_CROSS stub does NOT exist yet.** Epic 31 (which was supposed to add all stubs) is still in `backlog`. Task 1 of this story creates the stub. The `implemented: false` flag excludes it from the upgrade pool until Task 6.

**`weaponType` is a new field.** Existing weapons use `projectileType` and `projectilePattern` to describe behavior. LASER_CROSS introduces `weaponType: 'laser_cross'` as a top-level discriminator so `useWeapons.tick()` can detect it and skip projectile spawning without checking multiple conditions.

**Lazy initialization pattern (follows `orbitalAngle`).** Do NOT modify `addWeapon()` or `initializeWeapons()` to seed LASER_CROSS fields. Instead, initialize lazily inside `useWeapons.tick()` using `?? 0` / `?? true`:
```js
// In useWeapons.tick(), inside the 'laser_cross' branch:
weapon.laserCrossAngle = (weapon.laserCrossAngle ?? 0) + delta * def.rotationSpeed
weapon.laserCrossIsActive = weapon.laserCrossIsActive ?? true
weapon.laserCrossCycleTimer = (weapon.laserCrossCycleTimer ?? 0) + delta
```
This follows the same pattern as `orbitalAngle` for SATELLITE (`src/stores/useWeapons.jsx:37`).

**Cooldown timer handling.** The existing code mutates `weapon.cooldownTimer -= delta` before the `if (weapon.cooldownTimer <= 0)` block. For LASER_CROSS, the `continue` statement must appear BEFORE this cooldownTimer mutation to avoid corrupting unrelated state. Place the `laser_cross` check at the top of the per-weapon loop iteration, before `weapon.cooldownTimer -= delta`.

**Segment-vs-point arm collision.** The cross has 2 physical "through-center" arms (each passing through the ship center). With group.rotation.y = `laserCrossAngle`, arm 1 points along the rotated X-axis and arm 2 along the rotated Z-axis. In world space:
```js
// armDir1 and armDir2 in XZ plane (group.rotation.y = laserCrossAngle)
// Three.js Y-rotation: x' = x*cos(θ) + z*sin(θ), z' = -x*sin(θ) + z*cos(θ)
// For arm along local X: dir = [cos(laserCrossAngle), 0, -sin(laserCrossAngle)]...
// CAUTION: verify axis direction matches the renderer group.rotation.y convention.
// Simplest: use armAngle directly as Math.atan2 angle in XZ plane.
// Arm 1 angle = laserCrossAngle, Arm 2 angle = laserCrossAngle + Math.PI/2

function isHitByArm(ex, ez, px, pz, armAngle, armLength, armHalfWidth) {
  const dirX = Math.cos(armAngle)
  const dirZ = Math.sin(armAngle)
  const relX = ex - px
  const relZ = ez - pz
  const dot = relX * dirX + relZ * dirZ
  if (dot < -armLength || dot > armLength) return false // beyond arm ends
  const perpX = relX - dot * dirX
  const perpZ = relZ - dot * dirZ
  return Math.hypot(perpX, perpZ) <= armHalfWidth
}

// In GameLoop: check arm1 (angle) and arm2 (angle + PI/2)
const hit = isHitByArm(e.x, e.z, px, pz, weapon.laserCrossAngle, def.armLength, def.armWidth / 2)
         || isHitByArm(e.x, e.z, px, pz, weapon.laserCrossAngle + Math.PI/2, def.armLength, def.armWidth / 2)
```

**⚠️ Axis convention warning.** `group.rotation.y` in Three.js and `Math.cos/sin` in XZ plane must be consistent. In Three.js, a Y rotation of θ maps local +X to world [cos θ, 0, −sin θ]. The arm direction formula above uses [cos θ, 0, sin θ] (standard XZ polar). These differ by a sin sign flip. **The developer must verify visually** that the collision zone aligns with the rendered arms. If they don't match, negate the `sin` term in the `dirZ` of `isHitByArm`.

**Damage tick constant.** Use a local constant inside GameLoop tick (not in gameConfig.js — it's specific to this weapon):
```js
const LASER_CROSS_TICK_RATE = 0.1 // seconds between damage ticks
```

**`damageEnemiesBatch` reuse.** The existing function at `useEnemies.getState().damageEnemiesBatch(hits)` accepts `[{ enemyId, damage, isCrit }]`. Reuse this for LASER_CROSS hits. It returns `deathEvents` — process them identically to section 7c of GameLoop.

**Renderer: one material, two meshes.** The 4-arm visual can be done with 2 `<mesh>` elements sharing one material instance. Arm 1 (`scale.x = armLength * 2`) and Arm 2 (`scale.z = armLength * 2`) at the group center. Set `scale.y = armWidth` for both. Material is created once via `useMemo` and disposed in `useEffect`. **Do NOT create geometry/material inside useFrame** — this is a performance anti-pattern.

```jsx
// In LaserCrossRenderer.jsx useFrame:
const mesh1 = mesh1Ref.current
const mesh2 = mesh2Ref.current
if (!mesh1 || !mesh2) return
// ... position/rotation on groupRef.current
mesh1.material.opacity = opacity
// mesh2 shares same material instance, no need to set again
```

**GameplayScene mount.** Add `<LaserCrossRenderer />` near `<ProjectileRenderer />`. No conditional wrapping needed — the renderer self-hides when LASER_CROSS is absent. This mirrors how `ShockwaveRenderer` and other renderers always mount and internally check state.

### LASER_CROSS Weapon Def (proposed values)

```js
LASER_CROSS: {
  id: 'LASER_CROSS',
  name: 'Laser Cross',
  description: 'Rotating cross beams that damage all nearby enemies',
  baseDamage: 2,             // per tick (0.1s) = 20 DPS at level 1
  weaponType: 'laser_cross', // discriminator for non-projectile handling
  rotationSpeed: 1.5,        // rad/sec (~4.2s per full revolution)
  activeTime: 3.0,           // seconds arms are visible
  inactiveTime: 1.5,         // seconds arms are hidden
  armLength: 12,             // world units (half-length = 6 from center to tip)
  armWidth: 2.0,             // collision + visual width
  projectileColor: '#9b5de5',// used by renderer
  sfxKey: 'laser-cross-fire',// placeholder SFX (will console.warn if missing)
  knockbackStrength: 0,      // no knockback from continuous aura
  rarityDamageMultipliers: { ...DEFAULT_RARITY_DMG },
  slot: 'any',
  implemented: false,        // removed in Task 6
  upgrades: [
    { level: 2, baseDamage: 2.5, rotationSpeed: 1.7, statPreview: 'DPS: 20 → 25' },
    { level: 3, baseDamage: 3,   rotationSpeed: 1.9, statPreview: 'DPS: 25 → 30' },
    { level: 4, baseDamage: 3.5, rotationSpeed: 2.1, statPreview: 'DPS: 30 → 35' },
    { level: 5, baseDamage: 4,   rotationSpeed: 2.4, activeTime: 3.5, statPreview: 'DPS: 35 → 40' },
    { level: 6, baseDamage: 5,   rotationSpeed: 2.7, statPreview: 'DPS: 40 → 50' },
    { level: 7, baseDamage: 6,   rotationSpeed: 3.0, statPreview: 'DPS: 50 → 60' },
    { level: 8, baseDamage: 7,   rotationSpeed: 3.4, armWidth: 2.5, statPreview: 'DPS: 60 → 70' },
    { level: 9, baseDamage: 9,   rotationSpeed: 3.8, activeTime: 4.0, inactiveTime: 1.0, armWidth: 3.0, statPreview: 'DPS: 70 → 90' },
  ],
}
```

Note: upgrades change `baseDamage` and `rotationSpeed`, not `overrides`. The upgrade application in `upgradeWeapon()` stores overrides using `upgrade.damage` and `upgrade.cooldown`. For LASER_CROSS, the tick reads `weapon.overrides?.damage ?? def.baseDamage` — keep this pattern, rename `baseDamage` in upgrades to `damage` to match existing `overrides.damage` convention:
```js
{ level: 2, damage: 2.5, rotationSpeed: 1.7, statPreview: '...' }
```
In `useWeapons.tick()` laser_cross branch: `const baseDamage = weapon.overrides?.damage ?? def.baseDamage`

### Files to Create/Modify

| Action | File | Notes |
|--------|------|-------|
| Modify | `src/entities/weaponDefs.js` | Add LASER_CROSS def after EXPLOSIVE_ROUND |
| Modify | `src/stores/useWeapons.jsx` | Add laser_cross branch in tick() weapon loop |
| **Create** | `src/renderers/LaserCrossRenderer.jsx` | New file |
| Modify | `src/GameLoop.jsx` | Add section 7a-bis after projectile-enemy loop |
| Modify | `src/scenes/GameplayScene.jsx` | Import + mount LaserCrossRenderer |

### Architecture Compliance

- ✅ Game logic (cycle, damage tick) in GameLoop + useWeapons.tick() — NOT in renderer
- ✅ Renderer is read-only: reads from stores, no `set()` calls
- ✅ New renderer in `src/renderers/` — correct layer
- ✅ Weapon def in `src/entities/weaponDefs.js` — data layer
- ✅ No new Zustand store — LASER_CROSS state stored on weapon object (mutable, in-place)
- ✅ `useMemo` for geometries/materials — no allocation in useFrame
- ✅ `useEffect` cleanup for disposal — no memory leak
- ✅ `damageEnemiesBatch` reuse — no duplicated damage logic

### Project Structure Notes

No folder creation needed. `src/renderers/` already exists (20 renderers). `src/components/weapons/` does NOT exist and should NOT be created — LASER_CROSS rendering belongs in `renderers/` per architecture.

No new game config constants needed (LASER_CROSS_TICK_RATE is a local constant in GameLoop, not a globally tunable value at this stage).

The `weaponType` field is a new field in the weapon def schema. It is only read in `useWeapons.tick()` via `def.weaponType === 'laser_cross'`. Other weapons without this field are unaffected (undefined ≠ 'laser_cross').

### References

- [Source: `src/stores/useWeapons.jsx:36-38`] — `orbitalAngle` lazy init pattern to follow for `laserCrossAngle`
- [Source: `src/stores/useWeapons.jsx:44-133`] — Weapons loop structure, `continue` usage, `composedWeaponMods` shape
- [Source: `src/GameLoop.jsx:373-453`] — Projectile-enemy collision + damageEnemiesBatch + death events pattern to replicate for section 7a-bis
- [Source: `src/renderers/ShockwaveRenderer.jsx`] — Minimal renderer pattern (useMemo material, useEffect dispose, useFrame reads from store)
- [Source: `src/renderers/ProjectileRenderer.jsx`] — MeshStandardMaterial + emissive pattern for glowing weapon visuals
- [Source: `src/scenes/GameplayScene.jsx:1-18`] — Where to add the import and mount
- [Source: `_bmad-output/planning-artifacts/epic-32-new-weapon-mechanics.md#Technical Notes`] — Rendering approach: "mesh group parented to player position in R3F, rotating via useFrame"
- [Source: `_bmad-output/planning-artifacts/architecture.md#useFrame Rules`] — "Only GameLoop has a high-priority useFrame for game logic" — the renderer's useFrame is visual-only (position sync, opacity), correct

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `gameConfig.projectileVisuals.test.js`: Motion blur test iterated all weapons including LASER_CROSS (which has no `baseSpeed`), causing `NaN` elongation. Fixed by adding `if (def.weaponType) continue` to skip non-projectile weapons.
- `weaponDefs.test.js`: Multiple tests assumed all weapons share the projectile schema. Fixed by splitting into `PROJECTILE_WEAPON_IDS` (retained + stubs) vs `NON_PROJECTILE_IDS` (LASER_CROSS), updating `describe.each` and per-field assertions accordingly.
- `progressionSystem.test.js`: Transient failure appeared after `git stash` was used to verify pre-existing state; resolved automatically after `git stash pop` restored Story 32.1 changes. Root cause was stash truncating working tree, not a code defect.

### Completion Notes List

- Tasks 1–5 implemented with full TDD (red-green-refactor). All 2421 tests pass across 143 test files.
- `isHitByArm()` exported at module level from `GameLoop.jsx` for unit testability; dedicated test file `src/systems/__tests__/laserCrossCollision.test.js` validates segment-vs-point geometry with 13 cases.
- `DEFAULT_RARITY_DMG` added as named export from `weaponDefs.js` (used by LASER_CROSS's `rarityDamageMultipliers`).
- Upgrades array uses `damage` key (not `baseDamage`) to align with the `overrides.damage` convention used by `upgradeWeapon()`.
- While loop handles large-delta phase transitions (critical for single-tick test scenarios where delta ≥ activeTime + inactiveTime).
- `cooldownMultiplier` applied to `inactiveTime` only (shorter inactive = faster cross cycle); `activeTime` is deliberately unaffected.
- Tasks 6 & 7 intentionally deferred: Task 7 requires in-game manual QA to verify arm/collision axis alignment (Three.js Y-rotation vs XZ polar direction — see axis convention warning in Dev Notes). Task 6 is blocked on Task 7.
- **Dev Notes values adjusted**: Final `armLength: 24` (proposed: 12) and `armWidth: 1.0` (proposed: 2.0). Rationale: doubled reach for wider area coverage at the cost of a narrower hit zone (halfWidth = 0.5 instead of 1.0). Upgrade thresholds scaled proportionally (armWidth 1.25/1.5 at levels 8/9).

### File List

| Action | File |
|--------|------|
| Modified | `src/entities/weaponDefs.js` |
| Modified | `src/entities/__tests__/weaponDefs.test.js` |
| Created | `src/entities/__tests__/weaponDefs.laserCross.test.js` |
| Modified | `src/stores/useWeapons.jsx` |
| Created | `src/stores/__tests__/useWeapons.laserCross.test.js` |
| Created | `src/renderers/LaserCrossRenderer.jsx` |
| Modified | `src/GameLoop.jsx` |
| Modified | `src/scenes/GameplayScene.jsx` |
| Modified | `src/config/__tests__/gameConfig.projectileVisuals.test.js` |
| Created | `src/systems/__tests__/laserCrossCollision.test.js` |

## Change Log

| Date | Change |
|------|--------|
| 2026-02-23 | Story implemented (Tasks 1–5): LASER_CROSS def, useWeapons tick branch, LaserCrossRenderer, GameLoop section 7a-bis, GameplayScene mount. 2421/2421 tests passing. |
