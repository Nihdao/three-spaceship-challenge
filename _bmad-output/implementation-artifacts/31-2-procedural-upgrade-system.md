# Story 31.2: Procedural Upgrade System

Status: done

## Story

As a player,
I want each weapon upgrade to improve a random stat with luck-influenced quality,
so that every upgrade feels unique and investing in luck is meaningfully rewarding.

## Acceptance Criteria

1. **[Stat pool]** When a weapon is upgraded, the system picks one stat at random from: `damage`, `area`, `cooldown`, `knockback`, `crit`. All 5 stats have equal baseline probability.

2. **[Rarity roll]** The rarity of the improvement is rolled via the existing `rollRarity(luck)` function from `src/systems/raritySystem.js`.

3. **[Magnitude table]** The base magnitude is drawn from the upgrade magnitude table:
   ```
            │ Damage │ Area  │ Cooldown │ Knockback │ Crit   │
   COMMON   │ +8%    │ +6%   │ -6%      │ +10%      │ +1.5%  │
   RARE     │ +15%   │ +12%  │ -12%     │ +20%      │ +2.5%  │
   EPIC     │ +25%   │ +20%  │ -20%     │ +35%      │ +4%    │
   LEGENDARY│ +40%   │ +32%  │ -30%     │ +55%      │ +7%    │
   ```

4. **[Luck-biased variance]** A ±3% variance is applied to the base magnitude via a luck-biased power curve:
   ```js
   const u    = Math.random()
   const pow  = Math.max(0.1, 1 - luck * 0.06)  // luck=0 → uniform; luck=15+ → strongly biased toward +3%
   const roll = Math.pow(u, pow) * 6 - 3         // result in [-3, +3], biased toward +3 at high luck
   finalMagnitude = baseMagnitude + roll
   // Exception for crit: Math.max(baseMagnitude, baseMagnitude + roll) — never below base
   ```

5. **[Crit cap]** After applying a crit upgrade, the total crit (`def.critChance + weapon.multipliers.critBonus`) is clamped to `Math.min(1.0, result)` (100% hard cap). Minimum per-roll: uses `Math.max(baseMagnitude, baseMagnitude + roll)` so crit finalMagnitude is always ≥ baseMagnitude.

6. **[Cooldown floor]** Effective cooldown at firing time is `Math.max(def.baseCooldown * 0.15, def.baseCooldown * cooldownMultiplier)` — never below 15% of the weapon's base cooldown.

7. **[Weapon state multipliers]** `useWeapons` stores per-weapon stat multipliers:
   ```js
   weapon.multipliers = {
     damageMultiplier: 1.0,    // multiplicative: effective = def.baseDamage * damageMultiplier
     areaMultiplier: 1.0,      // for weapons using baseArea (radius, explosion radius, aura)
     cooldownMultiplier: 1.0,  // multiplicative: effective = def.baseCooldown * cooldownMultiplier
     knockbackMultiplier: 1.0, // multiplicative: applied at hit resolution time
     critBonus: 0,             // additive: final crit = def.critChance + critBonus + boon.critChance
   }
   ```
   Multipliers initialize to defaults on `addWeapon()`. Each upgrade accumulates (damage/area/cooldown/knockback are multiplicative, critBonus is additive).

8. **[Effective stat computation]** Effective stats computed on-the-fly in `tick()`:
   - `effectiveDamage = def.baseDamage * weapon.multipliers.damageMultiplier`
   - `effectiveCooldown = Math.max(def.baseCooldown * 0.15, def.baseCooldown * weapon.multipliers.cooldownMultiplier)`
   - `totalCrit = Math.min(1.0, def.critChance + weapon.multipliers.critBonus + boonModifiers.critChance)`

9. **[statPreview in level-up UI]** The upgrade is pre-rolled at choice generation time. `choice.statPreview` shows e.g. `"Damage +18% (Rare)"`, `"Cooldown -12% (Rare)"`, `"Crit +2.5% (Rare)"`. The result is stored in `choice.upgradeResult`.

10. **[upgradeWeapon signature]** `upgradeWeapon(weaponId, upgradeResult)` accepts `{ stat, finalMagnitude, rarity }`. `LevelUpModal.jsx` passes `choice.upgradeResult` when calling `upgradeWeapon`.

11. **[Tests pass]** New `src/systems/__tests__/upgradeSystem.test.js` covers all key behaviors. Run: `npx vitest run src/systems/__tests__/upgradeSystem.test.js` — all pass.

## Tasks / Subtasks

- [x] Task 1: Create `src/systems/upgradeSystem.js` (AC: #1–#6, #9)
  - [x] Define `UPGRADE_MAGNITUDE_TABLE` with exact values (as raw percentages, e.g. `8`, `-6`, `1.5`)
  - [x] Define `UPGRADE_STATS = ['damage', 'area', 'cooldown', 'knockback', 'crit']`
  - [x] Implement `rollUpgrade(weaponId, luckStat = 0)`:
    - Pick random stat from `UPGRADE_STATS`
    - Call `rollRarity(luckStat)` → `rarity`
    - Look up `baseMagnitude` from `UPGRADE_MAGNITUDE_TABLE[rarity][stat]`
    - Apply luck-biased variance → `roll`; `finalMagnitude = baseMagnitude + roll`
    - For crit: `finalMagnitude = Math.max(baseMagnitude, baseMagnitude + roll)`
    - Build `statPreview` string: e.g. `"Damage +18.47%"` (rarity shown via badge, not in text)
    - Return `{ stat, baseMagnitude, finalMagnitude, rarity, statPreview }`
  - [x] Export `rollUpgrade` as named export

- [x] Task 2: Update `src/stores/useWeapons.jsx` — weapon state + multipliers (AC: #7, #8, #10)
  - [x] `addWeapon(weaponId, _rarity = 'COMMON')`: keep signature for backward compat; replace `rarityDamageMultipliers` lookup + `overrides` init with `multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 }`
  - [x] `upgradeWeapon(weaponId, upgradeResult)`: accept `{ stat, finalMagnitude, rarity }` object; `level++`; apply to multiplier
  - [x] `tick()`: replace damage override: `def.baseDamage * (weapon.multipliers?.damageMultiplier ?? 1.0)`
  - [x] `tick()`: replace cooldown override: `Math.max(def.baseCooldown * 0.15, def.baseCooldown * (weapon.multipliers?.cooldownMultiplier ?? 1.0))`
  - [x] `tick()`: add per-weapon crit: `totalCritChance = Math.min(1.0, def.critChance + critBonus + boonCrit)`
  - [x] `tick()`: remove `weapon.overrides?.upgradeVisuals?.color` → always use `def.projectileColor`
  - [x] `tick()`: remove `weapon.overrides?.upgradeVisuals?.meshScale` → always use `def.projectileMeshScale`
  - [x] `tick()`: remove dead `pierceCount` propagation from overrides (RAILGUN removed in 31.1)

- [x] Task 3: Update `src/systems/progressionSystem.js` — upgrade pool + statPreview (AC: #9)
  - [x] Import `rollUpgrade` from `./upgradeSystem.js`
  - [x] `buildFullPool()`: any weapon below level 9 is always upgradeable; `statPreview: null` (filled in applyRarityToChoices)
  - [x] `applyRarityToChoices()`: for `weapon_upgrade` choices, call `rollUpgrade(choice.id, luckStat)` → store as `choice.upgradeResult`
  - [x] `applyRarityToWeaponPreview()` for `new_weapon`: show base stats without rarityDamageMultipliers

- [x] Task 4: Update `src/ui/LevelUpModal.jsx` — pass upgradeResult (AC: #10)
  - [x] In `applyChoice()`: change `upgradeWeapon(choice.id, rarity)` → `upgradeWeapon(choice.id, choice.upgradeResult)`

- [x] Task 5: Write `src/systems/__tests__/upgradeSystem.test.js` (AC: #11)
  - [x] All key behaviors covered and passing

- [x] Task 6: Update stale tests (AC: #11)
  - [x] `src/stores/__tests__/useWeapons.rarity.test.js`: rewritten
  - [x] `src/stores/__tests__/useWeapons.test.js`: updated upgradeWeapon signature
  - [x] `src/stores/__tests__/useWeapons.newPatterns.test.js`: removed dead weapon refs
  - [x] `src/systems/__tests__/progressionSystem.test.js`: updated pool tests
  - [x] `src/systems/__tests__/progressionSystem.newWeapons.test.js`: cleaned dead refs
  - [x] Final check: `npx vitest run` — 2295 tests, zero failures

## Dev Notes

### Prerequisite: Story 31.1 Must Be Done First

Story 31.2 assumes `upgrades[]`, `rarityDamageMultipliers`, and 7 weapons are already removed from `weaponDefs.js`. Do NOT implement on the current codebase — wait for 31.1 to be merged.

After 31.1, the retained weapons are: `LASER_FRONT`, `SPREAD_SHOT`, `BEAM`, `EXPLOSIVE_ROUND` (all with `baseArea`, `critChance`, `poolLimit`, `rarityWeight`). Six stubs exist with `implemented: false`.

### upgradeSystem.js Architecture

`upgradeSystem.js` is Layer 2 (Systems) — pure functions, no store imports. Pattern matches `raritySystem.js`.

```js
// src/systems/upgradeSystem.js
import { rollRarity, getRarityTier } from './raritySystem.js'

const UPGRADE_MAGNITUDE_TABLE = {
  COMMON:    { damage: 8,  area: 6,  cooldown: -6,  knockback: 10, crit: 1.5 },
  RARE:      { damage: 15, area: 12, cooldown: -12, knockback: 20, crit: 2.5 },
  EPIC:      { damage: 25, area: 20, cooldown: -20, knockback: 35, crit: 4   },
  LEGENDARY: { damage: 40, area: 32, cooldown: -30, knockback: 55, crit: 7   },
}

const UPGRADE_STATS = ['damage', 'area', 'cooldown', 'knockback', 'crit']

export function rollUpgrade(weaponId, luckStat = 0) {
  const stat = UPGRADE_STATS[Math.floor(Math.random() * UPGRADE_STATS.length)]
  const rarity = rollRarity(luckStat)
  const baseMagnitude = UPGRADE_MAGNITUDE_TABLE[rarity][stat]

  // Luck-biased variance ±3%
  const u   = Math.random()
  const pow = Math.max(0.1, 1 - luckStat * 0.06)
  const roll = Math.pow(u, pow) * 6 - 3

  let finalMagnitude
  if (stat === 'crit') {
    finalMagnitude = Math.max(baseMagnitude, baseMagnitude + roll)
  } else {
    finalMagnitude = baseMagnitude + roll
  }

  const rarityTier = getRarityTier(rarity)
  const sign = finalMagnitude >= 0 ? '+' : ''
  const statLabel = stat.charAt(0).toUpperCase() + stat.slice(1)
  const statPreview = `${statLabel} ${sign}${finalMagnitude.toFixed(2)}% (${rarityTier.name})`

  return { stat, baseMagnitude, finalMagnitude, rarity, statPreview }
}
```

### Magnitude Table Encoding

Table values are raw percentages. The `/100` conversion happens at accumulation time in `upgradeWeapon()`:
- `damageMultiplier *= (1 + finalMagnitude / 100)` — e.g., +8.47% → `1 * 1.0847`
- Cooldown values are negative in the table (`-6`, `-12`, etc.) — `(1 + (-6.23)/100) = 0.9377` — which correctly reduces cooldown

### Multiplier Semantics

**Multiplicative** for damage/area/cooldown/knockback: compounds per upgrade.
- Example: 3 COMMON damage upgrades → `1.0847 * 1.0847 * 1.0847 ≈ 1.275` (+27.5% total)

**Additive** for critBonus: flat sum.
- Example: 4 COMMON crit upgrades (≈1.5% each) → `critBonus ≈ 0.06` (+6% crit flat)
- Cap: `critBonus = Math.min(1.0 - def.critChance, critBonus)` ensures `def.critChance + critBonus ≤ 1.0`

### tick() Crit Logic Change

Current (before 31.2):
```js
if (critChance > 0 && Math.random() < critChance) { ... }
// critChance = boonModifiers.critChance only
```

After 31.2:
```js
const totalCritChance = Math.min(1.0,
  (def.critChance ?? 0) + (weapon.multipliers?.critBonus ?? 0) + critChance
)
if (totalCritChance > 0 && Math.random() < totalCritChance) { ... }
```

This integrates: weapon base crit (from weaponDefs.critChance) + weapon upgrades (critBonus) + boon crit bonus.

### Dead Code in tick() — Do NOT Remove Yet

After 31.1, these patterns are dead but should NOT be removed in 31.2:
- `projectilePattern === 'pellet'` (SHOTGUN gone)
- `projectilePattern === 'drone'` (DRONE gone)
- `projectilePattern === 'orbital'` (SATELLITE gone)
- `projectilePattern === 'piercing'` (RAILGUN gone)
- `projectilePattern === 'explosion'` (EXPLOSIVE_ROUND stays but pulseAnimation is its new flag)

Epic 32 will reuse/rework these patterns for new weapons. Keep them as-is.

**DO remove** in 31.2:
- `weapon.overrides?.upgradeVisuals?.color` → use `def.projectileColor` directly
- `weapon.overrides?.upgradeVisuals?.meshScale` → use `def.projectileMeshScale` directly
- `overrides.pierceCount` propagation in `upgradeWeapon` (RAILGUN removed, dead code)

### addWeapon() — rarity Parameter Kept But Ignored

Keep signature: `addWeapon(weaponId, _rarity = 'COMMON')`. The parameter is intentionally unused after 31.2. This avoids breaking callers (LevelUpModal, tests). No `rarityDamageMultipliers` lookup, no `overrides` with scaled damage.

### progressionSystem.js — Pool Logic Change

The core `buildFullPool()` change: remove the `if (!nextUpgrade) continue` guard.

Before:
```js
const nextUpgrade = def.upgrades?.[upgradeIndex]
if (!nextUpgrade) continue  // ← skips ALL weapons after 31.1 since upgrades[] is gone!
pool.push({ ..., statPreview: nextUpgrade.statPreview || ... })
```

After:
```js
// Any equipped weapon below MAX_WEAPON_LEVEL can always receive an upgrade
pool.push({
  type: 'weapon_upgrade',
  id: weapon.weaponId,
  name: def.name,
  description: def.description,
  level: weapon.level + 1,
  icon: null,
  statPreview: null,  // filled by rollUpgrade in applyRarityToChoices
})
```

The `choice.upgradeResult` field is added in `applyRarityToChoices()` when processing `weapon_upgrade` entries.

### Stale Test Debt from 31.1

These test files fail after 31.1 (before 31.2):
- `progressionSystem.newWeapons.test.js` — calls `WEAPONS['RAILGUN']` etc.
- `useWeapons.newPatterns.test.js` — tests SHOTGUN/DRONE/SATELLITE patterns

31.2 **must fix them** in Task 6. The acceptance bar: `npx vitest run` with zero failures.

### Project Structure Notes

Production files touched:
- `src/systems/upgradeSystem.js` — NEW (pure system)
- `src/stores/useWeapons.jsx` — weapon state shape + upgradeWeapon + addWeapon + tick
- `src/systems/progressionSystem.js` — buildFullPool + applyRarityToChoices + applyRarityToWeaponPreview
- `src/ui/LevelUpModal.jsx` — 1-line change in applyChoice

Test files touched:
- `src/systems/__tests__/upgradeSystem.test.js` — NEW
- `src/stores/__tests__/useWeapons.rarity.test.js` — rewrite
- `src/stores/__tests__/useWeapons.test.js` — update upgradeWeapon calls
- `src/stores/__tests__/useWeapons.newPatterns.test.js` — clean dead refs
- `src/systems/__tests__/progressionSystem.test.js` — update pool + statPreview
- `src/systems/__tests__/progressionSystem.newWeapons.test.js` — clean dead refs

### References

- [Source: _bmad-output/planning-artifacts/epic-31-weapon-roster-upgrade-system-overhaul.md#Story 31.2] — Full AC, magnitude table, variance formula, multiplier state shape
- [Source: _bmad-output/planning-artifacts/epic-31-weapon-roster-upgrade-system-overhaul.md#Technical Notes] — Exact table values and luck-biased variance code
- [Source: _bmad-output/implementation-artifacts/31-1-weapon-stat-schema-roster-cleanup.md] — Prerequisite: what 31.1 changed, retained weapon stats, scope boundary
- [Source: src/systems/raritySystem.js] — `rollRarity(luckStat)` and `getRarityTier(rarityId)` — reused directly
- [Source: src/stores/useWeapons.jsx] — Current state shape to replace: `overrides.damage`, `overrides.cooldown`, `overrides.upgradeVisuals`, `overrides.pierceCount`
- [Source: src/systems/progressionSystem.js] — `buildFullPool()` lines 99–116, `applyRarityToChoices()` lines 179–205, `applyRarityToWeaponPreview()` lines 207–225
- [Source: src/ui/LevelUpModal.jsx line 41] — applyChoice weapon_upgrade branch
- [Story 22.3] — Established rollRarity() / getRarityTier() — reused unchanged
- [Story 31.1] — Prerequisite: removes upgrades[], rarityDamageMultipliers, 7 weapons
- [Story 31.3] — Will further modify progressionSystem.js (P4 formula, rarityWeight sampling)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- statPreview intentionally omits rarity label — badge shown on card border/badge instead (see `raritySystem.progressionIntegration.test.js` comments). Diverges from AC #9 example text but aligns with UX consistency decision made during implementation.
- Code review (claude-sonnet-4-6) caught and fixed: flaky crit test, double rollRarity in applyRarityToChoices, backward-compat fallback in upgradeWeapon, getRarityTier called 3x, and a missed PlanetRewardModal.jsx using old upgradeWeapon signature.

### File List

- src/systems/upgradeSystem.js (NEW)
- src/systems/__tests__/upgradeSystem.test.js (NEW)
- src/stores/useWeapons.jsx (MODIFIED)
- src/systems/progressionSystem.js (MODIFIED)
- src/ui/LevelUpModal.jsx (MODIFIED)
- src/ui/PlanetRewardModal.jsx (MODIFIED — missed in original implementation, fixed in review)
- src/systems/commandSystem.js (MODIFIED — debug setweaponlevel stub upgradeResult)
- src/stores/__tests__/useWeapons.rarity.test.js (MODIFIED)
- src/stores/__tests__/useWeapons.test.js (MODIFIED)
- src/stores/__tests__/useWeapons.edgeCases.test.js (MODIFIED)
- src/stores/__tests__/useWeapons.newPatterns.test.js (MODIFIED)
- src/systems/__tests__/progressionSystem.test.js (MODIFIED)
- src/systems/__tests__/progressionSystem.newWeapons.test.js (MODIFIED)
