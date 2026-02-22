# Story 31.2: Procedural Upgrade System

Status: ready-for-dev

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

- [ ] Task 1: Create `src/systems/upgradeSystem.js` (AC: #1–#6, #9)
  - [ ] Define `UPGRADE_MAGNITUDE_TABLE` with exact values (as raw percentages, e.g. `8`, `-6`, `1.5`)
  - [ ] Define `UPGRADE_STATS = ['damage', 'area', 'cooldown', 'knockback', 'crit']`
  - [ ] Implement `rollUpgrade(weaponId, luckStat = 0)`:
    - Pick random stat from `UPGRADE_STATS`
    - Call `rollRarity(luckStat)` → `rarity`
    - Look up `baseMagnitude` from `UPGRADE_MAGNITUDE_TABLE[rarity][stat]`
    - Apply luck-biased variance → `roll`; `finalMagnitude = baseMagnitude + roll`
    - For crit: `finalMagnitude = Math.max(baseMagnitude, baseMagnitude + roll)`
    - Build `statPreview` string: e.g. `"Damage +18.47% (Rare)"`, `"Cooldown -8.23% (Common)"`, `"Crit +1.50% (Common)"`
    - Return `{ stat, baseMagnitude, finalMagnitude, rarity, statPreview }`
  - [ ] Export `rollUpgrade` as named export

- [ ] Task 2: Update `src/stores/useWeapons.jsx` — weapon state + multipliers (AC: #7, #8, #10)
  - [ ] `addWeapon(weaponId, _rarity = 'COMMON')`: keep signature for backward compat; replace `rarityDamageMultipliers` lookup + `overrides` init with `multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 }`
  - [ ] `upgradeWeapon(weaponId, upgradeResult)`: accept `{ stat, finalMagnitude, rarity }` object; `level++`; apply to multiplier:
    - `damage` → `damageMultiplier *= (1 + finalMagnitude / 100)`
    - `area` → `areaMultiplier *= (1 + finalMagnitude / 100)`
    - `cooldown` → `cooldownMultiplier *= (1 + finalMagnitude / 100)`; then clamp: `cooldownMultiplier = Math.max(0.15, cooldownMultiplier)`
    - `knockback` → `knockbackMultiplier *= (1 + finalMagnitude / 100)`
    - `crit` → `critBonus += finalMagnitude / 100`; clamp: `critBonus = Math.min(1.0 - def.critChance, critBonus)`
    - Store `weapon.rarity = upgradeResult.rarity` (latest upgrade rarity for UI badge)
  - [ ] `tick()`: replace damage override: `def.baseDamage * (weapon.multipliers?.damageMultiplier ?? 1.0)`
  - [ ] `tick()`: replace cooldown override: `Math.max(def.baseCooldown * 0.15, def.baseCooldown * (weapon.multipliers?.cooldownMultiplier ?? 1.0))`
  - [ ] `tick()`: add per-weapon crit: `const totalCritChance = Math.min(1.0, (def.critChance ?? 0) + (weapon.multipliers?.critBonus ?? 0) + critChance)`; use `totalCritChance` in the crit roll
  - [ ] `tick()`: remove `weapon.overrides?.upgradeVisuals?.color` → always use `def.projectileColor`
  - [ ] `tick()`: remove `weapon.overrides?.upgradeVisuals?.meshScale` → always use `def.projectileMeshScale`
  - [ ] `tick()`: remove dead `pierceCount` propagation from overrides (RAILGUN removed in 31.1)

- [ ] Task 3: Update `src/systems/progressionSystem.js` — upgrade pool + statPreview (AC: #9)
  - [ ] Import `rollUpgrade` from `./upgradeSystem.js`
  - [ ] `buildFullPool()`: remove `const nextUpgrade = def.upgrades?.[upgradeIndex]; if (!nextUpgrade) continue` — replace with: any weapon below level 9 is always upgradeable; `statPreview: null` (filled later in applyRarityToChoices)
  - [ ] Remove the fallback loop (lines ~49–69) that iterates `def.upgrades.length` — no longer valid
  - [ ] `applyRarityToChoices()`: for `weapon_upgrade` choices, call `rollUpgrade(choice.id, luckStat)` → store result as `choice.upgradeResult`; set `choice.statPreview = upgradeResult.statPreview`; set `choice.rarity = upgradeResult.rarity`; set rarityColor/rarityName from `getRarityTier(upgradeResult.rarity)`
  - [ ] `applyRarityToWeaponPreview()` for `new_weapon`: replace `def.rarityDamageMultipliers` lookup with: `"Damage: ${def.baseDamage} | Crit: ${(def.critChance * 100).toFixed(1)}%"`

- [ ] Task 4: Update `src/ui/LevelUpModal.jsx` — pass upgradeResult (AC: #10)
  - [ ] In `applyChoice()` line 41: change `upgradeWeapon(choice.id, rarity)` → `upgradeWeapon(choice.id, choice.upgradeResult)`

- [ ] Task 5: Write `src/systems/__tests__/upgradeSystem.test.js` (AC: #11)
  - [ ] Test: returns object with `{ stat, baseMagnitude, finalMagnitude, rarity, statPreview }`
  - [ ] Test: `stat` is one of the 5 valid stats
  - [ ] Test: `rarity` is one of `COMMON | RARE | EPIC | LEGENDARY`
  - [ ] Test: damage COMMON `finalMagnitude` is between `5` and `11` (8 ± 3)
  - [ ] Test: cooldown COMMON `finalMagnitude` is between `-9` and `-3`
  - [ ] Test: crit `finalMagnitude >= baseMagnitude` (never below floor)
  - [ ] Test: statPreview matches format regex `/^(Damage|Area|Cooldown|Knockback|Crit) [+-]\d+(\.\d+)?% \((Common|Rare|Epic|Legendary)\)$/`
  - [ ] Test with forced rarity (mock `rollRarity`): LEGENDARY damage → baseMagnitude = 40

- [ ] Task 6: Update stale tests (AC: #11)
  - [ ] `src/stores/__tests__/useWeapons.rarity.test.js`: rewrite — rarity no longer scales `addWeapon` damage; `upgradeWeapon` takes `{ stat, finalMagnitude, rarity }` object
  - [ ] `src/stores/__tests__/useWeapons.test.js`: update any `upgradeWeapon(id, 'COMMON')` calls to mock upgradeResult
  - [ ] `src/stores/__tests__/useWeapons.newPatterns.test.js`: remove TRI_SHOT / RAILGUN / SATELLITE / SHOTGUN refs (removed in 31.1); update upgradeWeapon signature
  - [ ] `src/systems/__tests__/progressionSystem.test.js`: update weapon_upgrade pool tests — no upgrades[] dependency; statPreview format now "Stat +X% (Rarity)"
  - [ ] `src/systems/__tests__/progressionSystem.newWeapons.test.js`: remove dead weapon ID refs; verify new stubs (with `implemented: false`) appear in pool
  - [ ] Final check: `npx vitest run` — zero failures

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

### Completion Notes List

### File List
