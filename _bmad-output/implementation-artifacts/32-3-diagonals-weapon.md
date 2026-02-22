# Story 32.3: DIAGONALS — Cursor-Tracked X Pattern

Status: ready-for-dev

## Story

As a player,
I want to fire 4 projectiles in an X pattern rotated toward my cursor,
So that I can cover multiple angles while still having directional control.

## Acceptance Criteria

1. **[4-projectile X burst]** When the cooldown expires, 4 projectiles are spawned simultaneously at 45° / 135° / 225° / 315° relative to the current `fireAngle` (cursor direction or ship facing). Each projectile travels at `baseSpeed * projectileSpeedMultiplier` units/sec along its spawn angle. Each projectile deals `baseDamage * damageMultiplier` on hit (independent crit roll per projectile). Projectiles are colored `#48cae4`.

2. **[Cursor-aligned rotation]** The X pattern rotates with `fireAngle`, which is already computed in `useWeapons.tick()` from dual-stick `aimDirection` (or ship `playerRotation` as fallback). No extra code needed — DIAGONALS inherits the correct angle automatically for both control modes.

3. **[Per-weapon pool limit]** At most `poolLimit` projectiles from this weapon are active simultaneously. When the cooldown expires and firing would cause the count to exceed `poolLimit`, the oldest active DIAGONALS projectiles are evicted (set `active = false`) to make room before spawning the 4 new ones.

4. **[Standard projectile behavior]** DIAGONALS projectiles follow the same lifecycle as all other projectiles: they move each frame via the projectile system, are checked against enemies via spatial hash collision, despawn on hit or lifetime expiry. No special GameLoop section needed.

5. **[`implemented: false` removed]** At the end of this story, the `implemented: false` flag is removed from DIAGONALS in `weaponDefs.js`, making it eligible for the level-up pool.

## Tasks / Subtasks

- [ ] Task 1: Add `DIAGONALS` def to `src/entities/weaponDefs.js`
  - [ ] Insert after `EXPLOSIVE_ROUND` (or after `MAGNETIC_FIELD` if Story 32.2 is merged)
  - [ ] Fields: `id: 'DIAGONALS'`, `name: 'Diagonals'`, `description: '4 diagonal shots in an X pattern, rotated toward cursor'`
  - [ ] Stats: `baseDamage: 12`, `baseCooldown: 0.55`, `baseSpeed: 280`
  - [ ] Projectile: `projectileType: 'bullet'`, `projectilePattern: 'diagonals'`, `projectileRadius: 0.7`
  - [ ] Visual: `projectileLifetime: 2.5`, `projectileColor: '#48cae4'`, `projectileMeshScale: [0.5, 0.5, 1.5]`
  - [ ] Pool: `poolLimit: 16` (4 projectiles × 4 simultaneous bursts max)
  - [ ] Other: `sfxKey: 'laser-fire'`, `knockbackStrength: 1.5`, `rarityDamageMultipliers: { ...DEFAULT_RARITY_DMG }`, `slot: 'any'`, `implemented: false`
  - [ ] Upgrades array (levels 2–9):
    ```js
    upgrades: [
      { level: 2, damage: 14, cooldown: 0.52, statPreview: 'Damage: 12 → 14' },
      { level: 3, damage: 17, cooldown: 0.49, statPreview: 'Damage: 14 → 17' },
      { level: 4, damage: 21, cooldown: 0.45, statPreview: 'Damage: 17 → 21' },
      { level: 5, damage: 26, cooldown: 0.41, statPreview: 'Damage: 21 → 26', upgradeVisuals: { color: '#72d9f0' } },
      { level: 6, damage: 32, cooldown: 0.37, statPreview: 'Damage: 26 → 32' },
      { level: 7, damage: 39, cooldown: 0.33, statPreview: 'Damage: 32 → 39' },
      { level: 8, damage: 47, cooldown: 0.29, statPreview: 'Damage: 39 → 47', upgradeVisuals: { meshScale: [0.6, 0.6, 1.8] } },
      { level: 9, damage: 57, cooldown: 0.24, statPreview: 'Damage: 47 → 57', upgradeVisuals: { color: '#a0e8f8', meshScale: [0.7, 0.7, 2.1] } },
    ],
    ```

- [ ] Task 2: Add `'diagonals'` angle branch in `src/stores/useWeapons.jsx` (line ~63 in the `angles` block)
  - [ ] In the `if/else if` chain that builds `angles` (currently: `spread` → `pellet` → else single), add a new `else if` **before** the final `else`:
    ```js
    } else if (def.projectilePattern === 'diagonals') {
      angles = [
        fireAngle + Math.PI * 0.25,   // +45°
        fireAngle + Math.PI * 0.75,   // +135°
        fireAngle + Math.PI * 1.25,   // +225°
        fireAngle + Math.PI * 1.75,   // +315°
      ]
    ```
  - [ ] The existing `else` branch (`angles = [fireAngle]`) remains unchanged as the final fallback

- [ ] Task 3: Add poolLimit eviction guard in `src/stores/useWeapons.jsx` — after `angles` is built, before the spawn loop
  - [ ] Insert between `angles` assignment and `for (let a = 0; a < angles.length; a++)`:
    ```js
    // Per-weapon pool limit: evict oldest projectiles to make room (DIAGONALS, and future weapons)
    if (def.poolLimit !== undefined) {
      const weaponProjCount = projectiles.filter(p => p.weaponId === weapon.weaponId && p.active).length
      const toEvict = weaponProjCount + angles.length - def.poolLimit
      if (toEvict > 0) {
        let evicted = 0
        for (let e = 0; e < projectiles.length && evicted < toEvict; e++) {
          if (projectiles[e].weaponId === weapon.weaponId && projectiles[e].active) {
            projectiles[e].active = false
            evicted++
          }
        }
      }
    }
    ```
  - [ ] `projectiles` is iterated in order (oldest first, since new ones are appended). Setting `active = false` marks them for cleanup by `cleanupInactive()`.
  - [ ] The `def.poolLimit !== undefined` guard ensures zero impact on all existing weapons (none have this field)

- [ ] Task 4: Manual QA
  - [ ] Force-equip: `useWeapons.getState().addWeapon('DIAGONALS')` in browser console
  - [ ] Verify 4 projectiles fire per burst in a visible X pattern (not a forward burst)
  - [ ] Move cursor to different directions: confirm the X rotates to track cursor
  - [ ] Keyboard-only (no cursor): confirm X aligns with ship facing direction
  - [ ] Let multiple bursts fire: check `useWeapons.getState().projectiles.filter(p => p.weaponId === 'DIAGONALS' && p.active).length` stays ≤ 16
  - [ ] Confirm projectiles deal damage and trigger damage numbers on enemy hit
  - [ ] Confirm crit numbers appear when crit boon is active

- [ ] Task 5: Remove `implemented: false` from DIAGONALS def after successful QA

## Dev Notes

### Codebase Context

**DIAGONALS is the simplest weapon in Epic 32 — a pure extension of the existing pattern system.** Unlike LASER_CROSS (32.1) and MAGNETIC_FIELD (32.2) which skip the normal projectile path entirely, DIAGONALS flows through the standard `useWeapons.tick()` loop unchanged except for: (1) a new `angles` branch, and (2) an optional poolLimit eviction step. No GameLoop section, no new renderer, no new Zustand state.

**`fireAngle` is already correct for both control modes.** From `src/stores/useWeapons.jsx:28-29`:
```js
const fireDirection = aimDirection ? aimDirection : [Math.sin(playerRotation), -Math.cos(playerRotation)]
const fireAngle = Math.atan2(fireDirection[0], -fireDirection[1])
```
When `aimDirection` is provided (dual-stick), `fireAngle` points at the cursor. When null (keyboard), it uses ship rotation. DIAGONALS inherits this fallback with zero extra code.

**The X pattern: arms at ±45° and ±135° from `fireAngle`.** The offsets `[+π/4, +3π/4, +5π/4, +7π/4]` produce a symmetric X where:
- One arm points 45° ahead-right of cursor (closest arm to cursor direction)
- One arm points 45° behind-right
- One arm points 45° ahead-left
- One arm points 45° behind-left

This is consistent with the epic AC: "one arm always points closest to the cursor direction" (within 45°).

**Alternative interpretation: align one arm directly with cursor.** If you want one arm to point exactly at the cursor, use offsets `[0, +π/2, +π, +3π/2]` instead (0°/90°/180°/270°). The epic says "45° / 135° / 225° / 315° relative to cursor angle" which means the first arm is at cursor+45°, not cursor+0°. Use the `+π/4` base offset as specified in Task 2. If QA reveals the pattern feels off, adjust to `[0, Math.PI/2, Math.PI, 3*Math.PI/2]` to align one arm with cursor.

**Pool eviction iterates in insertion order (FIFO).** `projectiles` array has oldest entries first since `set({ projectiles: projectiles.concat(newProjectiles) })` appends new ones to the end. The eviction loop correctly removes the earliest (oldest) matching projectiles.

**`projectiles.filter()` in the eviction check: no performance concern.** This O(N) scan runs at most once per fire event (every ~0.55s), not every frame. With `MAX_PROJECTILES = 200`, this is trivially fast.

**`def.poolLimit` guard is purely additive.** All 10 existing weapons (`LASER_FRONT`, `SPREAD_SHOT`, `MISSILE_HOMING`, etc.) have no `poolLimit` field, so `def.poolLimit !== undefined` is always `false` for them. The eviction code never runs for existing weapons.

**Spawn position: standard `fwd` offset.** `spawnX = playerPosition[0] + fireDirection[0] * fwd`, same as LASER_FRONT. All 4 DIAGONALS projectiles spawn from the same forward-offset point (near ship nose), then diverge in their respective directions.

**No new renderer.** `ProjectileRenderer` (in `src/renderers/ProjectileRenderer.jsx`) renders all entries in `useWeapons.getState().projectiles` regardless of `weaponId`. DIAGONALS bullets will appear as standard elongated meshes in `#48cae4` (cyan-aqua), visually distinct from existing weapons.

**No GameLoop modification.** The `createProjectileSystem()` handles movement and collision for all projectiles. `DIAGONALS` projectiles are indistinguishable from `LASER_FRONT` bullets at the physics/collision level.

**Relationship with Stories 32.1 and 32.2.** All three stories are independent. Story 32.3 does not use the `weaponType` discriminator or `continue` skip introduced in 32.1/32.2. It can be merged in any order. The only ordering consideration: if 32.2 is already merged, insert DIAGONALS after MAGNETIC_FIELD in the def file; otherwise, insert after EXPLOSIVE_ROUND.

**`sfxKey: 'laser-fire'` reuses an existing audio key** — same as SPREAD_SHOT. No audio changes needed. All SFX files are placeholders per project memory; `audioManager.js` handles missing files gracefully.

### DIAGONALS Weapon Def

```js
DIAGONALS: {
  id: 'DIAGONALS',
  name: 'Diagonals',
  description: '4 diagonal shots in an X pattern, rotated toward cursor',
  baseDamage: 12,
  baseCooldown: 0.55,
  baseSpeed: 280,
  projectileType: 'bullet',
  projectilePattern: 'diagonals', // new value — handled in useWeapons.tick() angles block
  poolLimit: 16,                  // max active DIAGONALS projectiles (4 bursts × 4 shots)
  projectileRadius: 0.7,
  projectileLifetime: 2.5,
  projectileColor: '#48cae4',     // cyan-aqua — distinct from LASER_FRONT (#00ffff) and others
  projectileMeshScale: [0.5, 0.5, 1.5],
  sfxKey: 'laser-fire',
  knockbackStrength: 1.5,
  rarityDamageMultipliers: { ...DEFAULT_RARITY_DMG },
  slot: 'any',
  implemented: false,             // removed in Task 5
  upgrades: [
    { level: 2, damage: 14, cooldown: 0.52, statPreview: 'Damage: 12 → 14' },
    { level: 3, damage: 17, cooldown: 0.49, statPreview: 'Damage: 14 → 17' },
    { level: 4, damage: 21, cooldown: 0.45, statPreview: 'Damage: 17 → 21' },
    { level: 5, damage: 26, cooldown: 0.41, statPreview: 'Damage: 21 → 26', upgradeVisuals: { color: '#72d9f0' } },
    { level: 6, damage: 32, cooldown: 0.37, statPreview: 'Damage: 26 → 32' },
    { level: 7, damage: 39, cooldown: 0.33, statPreview: 'Damage: 32 → 39' },
    { level: 8, damage: 47, cooldown: 0.29, statPreview: 'Damage: 39 → 47', upgradeVisuals: { meshScale: [0.6, 0.6, 1.8] } },
    { level: 9, damage: 57, cooldown: 0.24, statPreview: 'Damage: 47 → 57', upgradeVisuals: { color: '#a0e8f8', meshScale: [0.7, 0.7, 2.1] } },
  ],
},
```

Upgrades use `damage` and `cooldown` keys — consistent with all existing weapons and `upgradeWeapon()` at `src/stores/useWeapons.jsx:170-172`.

### Files to Create / Modify

| Action | File | Notes |
|--------|------|-------|
| Modify | `src/entities/weaponDefs.js` | Add DIAGONALS def after EXPLOSIVE_ROUND (or MAGNETIC_FIELD) |
| Modify | `src/stores/useWeapons.jsx` | Add `diagonals` angles branch + poolLimit eviction guard |

**No new files. No GameLoop changes. No renderer changes.**

### Architecture Compliance

- ✅ Weapon def in `src/entities/weaponDefs.js` — data layer, correct location
- ✅ Firing pattern computed in `useWeapons.tick()` — consistent with `spread`, `pellet`, `orbital`
- ✅ Pool eviction via `active = false` — same mechanism as `cleanupInactive()` uses project-wide
- ✅ No new Zustand store — DIAGONALS has no per-weapon persistent state beyond standard `cooldownTimer`
- ✅ `projectilePattern: 'diagonals'` — follows same discriminator naming convention as existing patterns
- ✅ `def.poolLimit` guard — backwards-compatible, zero impact on existing 10 weapons
- ✅ No per-frame allocation — `angles` array created once per fire event only
- ✅ Renderer-agnostic — `ProjectileRenderer` handles all projectiles by design

### Project Structure Notes

No folder creation needed. Changes are minimal: 2 files modified, ~20 lines of new code total.

`projectilePattern: 'diagonals'` is a new string value but follows the exact convention of `'spread'`, `'pellet'`, `'orbital'`, `'drone'`, `'beam'`, `'piercing'`, `'explosion'` — all defined in-place in the weapon def and checked with `===` comparisons in `useWeapons.tick()`.

`def.poolLimit` is a new field on the weapon def object, following the same convention as `homing`, `spreadAngle`, `pierceCount`, `pelletCount`, `orbitalRadius` — per-weapon-type fields that don't need to exist on every weapon.

### References

- [Source: `src/stores/useWeapons.jsx:22-29`] — `tick()` parameters, `fireDirection`/`fireAngle` dual-stick computation with keyboard fallback
- [Source: `src/stores/useWeapons.jsx:63-77`] — `angles` if/else chain where `diagonals` branch is inserted (after `pellet`, before final `else`)
- [Source: `src/stores/useWeapons.jsx:42-48`] — `weapon.cooldownTimer -= delta` and global `MAX_PROJECTILES` cap (runs before angle computation — still applies)
- [Source: `src/stores/useWeapons.jsx:92-132`] — Per-angle projectile spawn loop (reused unchanged)
- [Source: `src/stores/useWeapons.jsx:199-205`] — `cleanupInactive()` — filters out `active = false` projectiles (eviction mechanism)
- [Source: `src/config/gameConfig.js:27`] — `MAX_PROJECTILES: 200` global cap (takes priority over per-weapon poolLimit)
- [Source: `src/entities/weaponDefs.js:34-62`] — `SPREAD_SHOT` as reference for `bullet` projectile type and upgrade format
- [Source: `_bmad-output/planning-artifacts/epic-32-new-weapon-mechanics.md#Story 32.3`] — Original acceptance criteria, color spec (`#48cae4`), poolLimit mention
- [Source: `_bmad-output/planning-artifacts/epic-32-new-weapon-mechanics.md#Technical Notes`] — "DIAGONALS: extends existing projectile spawning system (4 spawns per fire event)"
- [Source: `_bmad-output/implementation-artifacts/32-2-magnetic-field-weapon.md`] — Epic 32 story format reference

## Dev Agent Record

### Agent Model Used

_to be filled_

### Debug Log References

### Completion Notes List

### File List
