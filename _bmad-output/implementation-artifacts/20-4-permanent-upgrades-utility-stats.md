# Story 20.4: Permanent Upgrades — Utility Stats

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to unlock utility stat upgrades (Magnet, Luck, ExpBonus, Curse),
So that I can customize my meta-build toward different playstyles between runs.

## Acceptance Criteria

**Given** the utility stat upgrades
**When** defined in upgrade config
**Then** each upgrade has:
  - Magnet (pickup radius increase): 2 levels (e.g., +15%, +30%)
  - Luck (better loot/gem drop chances): 3 levels (e.g., +5%, +10%, +15% — influences Fragment/HP/XP gem/chest drop rates)
  - Exp Bonus (XP gain multiplier): 5 levels (e.g., +5%, +10%, +15%, +20%, +25%)
  - Curse (enemy spawn rate increase for more combat/loot): 5 levels (e.g., +10%, +20%, +30%, +40%, +50% spawn rate)
**And** each level has escalating Fragment costs

**Given** the Magnet upgrade
**When** active in gameplay
**Then** the XP/loot magnetization radius (XP_MAGNET_RADIUS) is multiplied by the bonus

**Given** the Luck upgrade
**When** active in gameplay
**Then** all loot drop chance rolls (rare XP, heal gem, Fragment gem) are increased by the luck percentage
**And** future rarity rolls (Epic 22, Story 22.3) are influenced by luck

**Given** the Exp Bonus upgrade
**When** active in gameplay
**Then** all XP gains are multiplied by the bonus (applies to standard orbs, rare gems, etc.)

**Given** the Curse upgrade
**When** active in gameplay
**Then** enemy spawn rates are increased by the curse percentage
**And** this stacks with the dynamic wave system (Epic 23)

## Tasks / Subtasks

- [x] Task 1: Add 4 utility upgrades to permanentUpgradesDefs.js (AC: #1)
  - [x] Add MAGNET upgrade definition (2 levels, +15%/+30%, costs 80/160)
  - [x] Add LUCK upgrade definition (3 levels, +5%/+10%/+15%, costs 100/200/400)
  - [x] Add EXP_BONUS upgrade definition (5 levels, +5% per level, costs 60/120/240/420/600)
  - [x] Add CURSE upgrade definition (5 levels, +10% per level, costs 50/100/200/350/500)
  - [x] Follow same structure as combat stats from Story 20.1
  - [x] Set escalating Fragment costs consistent with combat stats balance

- [x] Task 2: Extend useUpgrades store to compute utility bonuses (AC: #1)
  - [x] Modify getComputedBonuses() to include: magnet, luck, expBonus, curse
  - [x] Return all 10 bonuses (6 combat + 4 utility)
  - [x] Ensure persistence works for new upgrades (no schema migration needed)

- [x] Task 3: Apply Magnet upgrade in XP magnetization (AC: #2)
  - [x] Modify magnetization calls in GameLoop.jsx to compose boon pickupRadius with permanent magnet
  - [x] Multiply XP_MAGNET_RADIUS by permanentUpgradeBonuses.magnet
  - [x] Ensure loot gems (Fragment, Heal) also use magnified radius

- [x] Task 4: Apply Luck upgrade to loot drop rolls (AC: #3)
  - [x] Modify loot drop logic in lootSystem.js (rare XP gem, heal gem, Fragment gem)
  - [x] Add luck percentage to drop chance calculations (additive, capped at 1.0)
  - [x] Note: Rarity rolls for Epic 22 will be implemented later

- [x] Task 5: Apply Exp Bonus to XP gain (AC: #4)
  - [x] Modify XP award logic in GameLoop.jsx (XP orb collection)
  - [x] Multiply XP amount by permanentUpgradeBonuses.expBonus (stacks multiplicatively with boon XP mult)

- [x] Task 6: Apply Curse to enemy spawn rate (AC: #5)
  - [x] Modify spawn rate calculation in spawnSystem.js
  - [x] Increase spawn rate by permanentUpgradeBonuses.curse percentage (divides interval)
  - [x] Stacking behavior documented for Epic 23 dynamic wave system (multiplicative)

- [x] Task 7: Write tests
  - [x] Test permanentUpgradesDefs: all 4 utility upgrades have valid structure
  - [x] Test useUpgrades: getComputedBonuses includes magnet, luck, expBonus, curse
  - [x] Test integration: magnet applies to XP radius
  - [x] Test integration: luck increases drop chances
  - [x] Test integration: expBonus multiplies XP gains
  - [x] Test integration: curse increases spawn rates

## Dev Notes

### Architecture Alignment

This story **extends** the permanent upgrades system created in Story 20.1 by adding 4 utility stats to the existing config and store. It follows the exact same patterns as combat stats but integrates into different gameplay systems (magnetization, loot drops, XP progression, enemy spawning).

**6-Layer Architecture:**
- **Config Layer**: `src/entities/permanentUpgradesDefs.js` (MODIFY) — Add 4 utility upgrade definitions
- **Stores Layer**: `src/stores/useUpgrades.jsx` (MODIFY) — Extend getComputedBonuses() to return utility bonuses
- **Systems Layer**: `src/systems/spawnSystem.js` (MODIFY if applicable) — Apply curse to spawn rate
- **GameLoop**: `src/GameLoop.jsx` (MODIFY) — Apply luck to drop rolls, expBonus to XP, cursor to spawn
- **Rendering Layer**: `src/renderers/XPOrbRenderer.jsx` (MODIFY if applicable) — Apply magnet to magnetization radius

**This story does NOT:**
- Create new stores or data structures (reuses useUpgrades from Story 20.1)
- Create UI components (Story 20.2 already handles upgrades menu, will show all 10 upgrades)
- Modify Fragment display or main menu (Story 20.3 already done)
- Implement rarity system (Epic 22, Story 22.3 will use luck bonus)

### Key Source Files

| File | Change | Layer |
|------|--------|-------|
| `src/entities/permanentUpgradesDefs.js` | **ADD** 4 utility upgrade definitions (MAGNET, LUCK, EXP_BONUS, CURSE) | Config |
| `src/stores/useUpgrades.jsx` | **MODIFY** getComputedBonuses() to include utility stats | Stores |
| `src/GameLoop.jsx` | **MODIFY** loot drop logic, XP award logic, spawn rate logic | GameLoop |
| `src/renderers/XPOrbRenderer.jsx` | **MODIFY** magnetization radius (if magnetization lives here) | Rendering |
| `src/systems/spawnSystem.js` | **MODIFY** spawn rate calculation (if spawn logic lives here) | Systems |

### Story 20.1 Foundation Review

Story 20.1 created:
- **permanentUpgradesDefs.js**: 6 combat stats (ATTACK_POWER, ARMOR, MAX_HP, REGEN, ATTACK_SPEED, ZONE)
- **useUpgrades store**: purchaseUpgrade(), getUpgradeLevel(), getTotalFragmentsSpent(), getComputedBonuses()
- **upgradesStorage.js**: localStorage persistence
- **Integration**: Combat stats applied at run start and in GameLoop

**This story simply adds 4 more upgrades to the same file and extends the same getComputedBonuses() function.**

### Utility Upgrade Definitions

Following the Epic 20 spec and Story 20.1 patterns:

```javascript
// src/entities/permanentUpgradesDefs.js — ADD these 4 upgrades to existing PERMANENT_UPGRADES object

export const PERMANENT_UPGRADES = {
  // ... existing 6 combat stats from Story 20.1 ...

  MAGNET: {
    id: 'MAGNET',
    name: 'Magnet',
    description: 'Increases pickup radius for XP and loot',
    icon: '🧲',
    maxLevel: 2,
    levels: [
      { level: 1, cost: 80, bonus: 0.15 }, // +15% radius
      { level: 2, cost: 160, bonus: 0.15 }, // +30% total
    ],
  },

  LUCK: {
    id: 'LUCK',
    name: 'Luck',
    description: 'Increases loot drop chances',
    icon: '🍀',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 100, bonus: 0.05 }, // +5% drop chance
      { level: 2, cost: 200, bonus: 0.05 }, // +10% total
      { level: 3, cost: 400, bonus: 0.05 }, // +15% total
    ],
  },

  EXP_BONUS: {
    id: 'EXP_BONUS',
    name: 'Exp Bonus',
    description: 'Increases XP gain from all sources',
    icon: '⭐',
    maxLevel: 5,
    levels: [
      { level: 1, cost: 60, bonus: 0.05 }, // +5% XP
      { level: 2, cost: 120, bonus: 0.05 }, // +10% total
      { level: 3, cost: 240, bonus: 0.05 }, // +15% total
      { level: 4, cost: 420, bonus: 0.05 }, // +20% total
      { level: 5, cost: 600, bonus: 0.05 }, // +25% total
    ],
  },

  CURSE: {
    id: 'CURSE',
    name: 'Curse',
    description: 'Increases enemy spawn rate for more combat and loot',
    icon: '💀',
    maxLevel: 5,
    levels: [
      { level: 1, cost: 50, bonus: 0.10 }, // +10% spawn rate
      { level: 2, cost: 100, bonus: 0.10 }, // +20% total
      { level: 3, cost: 200, bonus: 0.10 }, // +30% total
      { level: 4, cost: 350, bonus: 0.10 }, // +40% total
      { level: 5, cost: 500, bonus: 0.10 }, // +50% total
    ],
  },
}
```

**Cost Analysis:**
- MAGNET (2 levels): 80 + 160 = 240 total
- LUCK (3 levels): 100 + 200 + 400 = 700 total
- EXP_BONUS (5 levels): 60 + 120 + 240 + 420 + 600 = 1440 total
- CURSE (5 levels): 50 + 100 + 200 + 350 + 500 = 1200 total

**Utility stats total: 3580 Fragments**
**Combined with combat stats (3800): 7380 Fragments to max all 10 upgrades**

**IMPORTANT:** These costs are balanced assuming players earn ~100-200 Fragments per run (enemy drops + boss reward). Adjust if playtest shows imbalance.

### Zustand Store Extension

Modify the existing `getComputedBonuses()` function in useUpgrades.jsx to include utility stats:

```javascript
// src/stores/useUpgrades.jsx — MODIFY existing function
getComputedBonuses: () => {
  const state = get()
  const bonuses = {
    // Combat stats (existing from Story 20.1)
    attackPower: 1.0,   // Multiplier (1.0 = no bonus, 1.25 = +25%)
    armor: 0,           // Flat reduction
    maxHP: 0,           // Flat addition
    regen: 0,           // Flat addition (HP/s)
    attackSpeed: 1.0,   // Multiplier (0.85 = -15% cooldown)
    zone: 1.0,          // Multiplier (1.30 = +30% size)

    // Utility stats (new in Story 20.4)
    magnet: 1.0,        // Multiplier (1.30 = +30% radius)
    luck: 0.0,          // Additive percentage (0.15 = +15% drop chance)
    expBonus: 1.0,      // Multiplier (1.25 = +25% XP)
    curse: 0.0,         // Additive percentage (0.50 = +50% spawn rate)
  }

  for (const [upgradeId, level] of Object.entries(state.upgradeLevels)) {
    const upgradeDef = PERMANENT_UPGRADES[upgradeId]
    if (!upgradeDef) continue

    for (let i = 0; i < level; i++) {
      const levelDef = upgradeDef.levels[i]
      if (!levelDef) continue

      // Apply bonuses based on upgrade type
      if (upgradeId === 'ATTACK_POWER') {
        bonuses.attackPower += levelDef.bonus
      } else if (upgradeId === 'ARMOR') {
        bonuses.armor += levelDef.bonus
      } else if (upgradeId === 'MAX_HP') {
        bonuses.maxHP += levelDef.bonus
      } else if (upgradeId === 'REGEN') {
        bonuses.regen += levelDef.bonus
      } else if (upgradeId === 'ATTACK_SPEED') {
        bonuses.attackSpeed -= levelDef.bonus // Reduction!
      } else if (upgradeId === 'ZONE') {
        bonuses.zone += levelDef.bonus
      } else if (upgradeId === 'MAGNET') {
        bonuses.magnet += levelDef.bonus
      } else if (upgradeId === 'LUCK') {
        bonuses.luck += levelDef.bonus
      } else if (upgradeId === 'EXP_BONUS') {
        bonuses.expBonus += levelDef.bonus
      } else if (upgradeId === 'CURSE') {
        bonuses.curse += levelDef.bonus
      }
    }
  }

  return bonuses
},
```

**IMPORTANT:** Ensure backward compatibility — if useUpgrades has no utility upgrades purchased yet, the bonuses should default to neutral values (1.0 for multipliers, 0.0 for additive).

### Gameplay Integration: Magnet

The XP magnetization system currently lives in either GameLoop.jsx or XPOrbRenderer.jsx. Find the code that handles XP orb collection radius and apply the magnet multiplier.

**Expected code location (find this in GameLoop or XP system):**
```javascript
// Current XP magnetization (approximate location)
const XP_MAGNET_RADIUS = 2.0 // Base radius in world units

// In GameLoop tick or XP collection logic:
const distanceToPlayer = Vector3.distanceTo(playerPos, orbPos)
if (distanceToPlayer < XP_MAGNET_RADIUS) {
  // Collect orb
}
```

**Modified with Magnet upgrade:**
```javascript
const XP_MAGNET_RADIUS = 2.0 // Base radius
const magnetBonus = usePlayer.getState().permanentUpgradeBonuses.magnet || 1.0
const effectiveMagnetRadius = XP_MAGNET_RADIUS * magnetBonus

const distanceToPlayer = Vector3.distanceTo(playerPos, orbPos)
if (distanceToPlayer < effectiveMagnetRadius) {
  // Collect orb
}
```

**CRITICAL:** The magnet upgrade should also apply to loot gems (Fragment, Heal) if they use a separate magnetization system. Ensure all pickup items use the same magnified radius.

**Integration point:** At run start, when `usePlayer.initializeRunStats()` is called (Story 20.1), the permanentUpgradeBonuses.magnet is already computed and stored in usePlayer state. GameLoop or XP system just reads it.

### Gameplay Integration: Luck

The loot drop system was implemented in Story 19.3 (Fragment drops) and earlier stories (rare XP gems, heal gems). Luck should increase the drop chance for all these gems.

**Expected code location (find this in GameLoop or loot drop logic):**
```javascript
// Current loot drop logic (approximate)
const FRAGMENT_DROP_CHANCE = 0.12 // 12% base
const RARE_XP_DROP_CHANCE = 0.08 // 8% base
const HEAL_GEM_DROP_CHANCE = 0.05 // 5% base (if exists)

if (Math.random() < FRAGMENT_DROP_CHANCE) {
  spawnFragmentGem(enemyPosition)
}
```

**Modified with Luck upgrade:**
```javascript
const FRAGMENT_DROP_CHANCE = 0.12
const luckBonus = usePlayer.getState().permanentUpgradeBonuses.luck || 0.0
const effectiveFragmentDropChance = FRAGMENT_DROP_CHANCE + luckBonus

if (Math.random() < effectiveFragmentDropChance) {
  spawnFragmentGem(enemyPosition)
}
```

**IMPORTANT:** Luck is **additive** (not multiplicative). A 12% drop chance + 15% luck = 27% drop chance (not 13.8%). This gives players more agency and feels more impactful.

**Edge case:** Ensure drop chance never exceeds 1.0 (100%):
```javascript
const effectiveDropChance = Math.min(1.0, baseDropChance + luckBonus)
```

**Future-proofing for Epic 22:** Story 22.3 (Boon/Weapon Rarity System) will add rarity rolls (common/rare/epic). Luck should influence these rolls by increasing the chance of higher rarities. Document this for Epic 22 implementation.

### Gameplay Integration: Exp Bonus

XP is awarded in multiple places:
1. Enemy kills (standard XP orbs)
2. Rare XP gem pickup (Story 19.1 or similar)
3. Potentially scan rewards or dilemma rewards

**Expected code location (find this in GameLoop or progression logic):**
```javascript
// Current XP award (approximate)
const xpAmount = enemyDef.xpReward // e.g., 10 XP
usePlayer.getState().addXP(xpAmount)
```

**Modified with Exp Bonus upgrade:**
```javascript
const baseXP = enemyDef.xpReward
const expBonusMult = usePlayer.getState().permanentUpgradeBonuses.expBonus || 1.0
const finalXP = Math.floor(baseXP * expBonusMult)
usePlayer.getState().addXP(finalXP)
```

**IMPORTANT:** Apply expBonus **before** any boon modifiers (if Epic 3 has XP multiplier boons, they should stack multiplicatively).

**Example stacking:**
- Base XP: 10
- Exp Bonus (permanent): +25% → 12.5 XP
- Boon XP multiplier: +50% → 18.75 XP
- Final: 18 XP (floored)

**CRITICAL:** Apply expBonus to ALL XP sources, not just enemy kills. Rare XP gems, scan rewards, dilemma XP bonuses should all be magnified.

### Gameplay Integration: Curse

The enemy spawn system likely lives in `src/systems/spawnSystem.js` or within `useEnemies.tick()`. Curse increases the spawn rate, making the game harder but also more rewarding (more XP and loot).

**Expected code location (find this in spawnSystem or useEnemies):**
```javascript
// Current spawn rate (approximate)
const SPAWN_INTERVAL = 2.0 // Spawn every 2 seconds
const spawnTimer = state.spawnTimer - delta

if (spawnTimer <= 0) {
  spawnEnemy()
  state.spawnTimer = SPAWN_INTERVAL
}
```

**Modified with Curse upgrade:**
```javascript
const BASE_SPAWN_INTERVAL = 2.0
const curseBonus = usePlayer.getState().permanentUpgradeBonuses.curse || 0.0
const spawnRateMultiplier = 1.0 + curseBonus // e.g., 1.5 for +50% curse
const effectiveSpawnInterval = BASE_SPAWN_INTERVAL / spawnRateMultiplier

const spawnTimer = state.spawnTimer - delta
if (spawnTimer <= 0) {
  spawnEnemy()
  state.spawnTimer = effectiveSpawnInterval
}
```

**IMPORTANT:** Curse reduces the spawn interval, which **increases** the spawn rate. A +50% curse means enemies spawn 50% faster (interval reduced from 2.0s to 1.33s).

**Alternative approach (if spawn count is used instead of interval):**
```javascript
const baseSpawnCount = calculateSpawnCount(difficulty)
const curseBonus = usePlayer.getState().permanentUpgradeBonuses.curse || 0.0
const spawnCountMultiplier = 1.0 + curseBonus
const finalSpawnCount = Math.ceil(baseSpawnCount * spawnCountMultiplier)
```

**Epic 23 Stacking:** Epic 23 (Wave & Enemy Systems) will introduce a dynamic wave system that also modifies spawn rates. Curse should stack multiplicatively with dynamic waves:
- Dynamic wave multiplier: 1.3 (30% more enemies)
- Curse multiplier: 1.5 (+50% curse)
- Final spawn rate: 1.3 × 1.5 = 1.95 (95% more enemies than base)

**Document this stacking behavior for Epic 23 implementation.**

### XP Magnetization Deep Dive

The XP magnetization system (Story 11.1) likely works as follows:

1. XP orbs spawn at enemy death position
2. Each frame, check distance from player to each orb
3. If distance < XP_MAGNET_RADIUS, move orb toward player (or collect immediately)
4. Player "collects" orb when distance < COLLECTION_RADIUS (very small, e.g., 0.3)

**Current implementation (find this in XPOrbRenderer or GameLoop):**
```javascript
// XP orb magnetization (approximate)
const XP_MAGNET_RADIUS = 2.0 // Magnet activates at 2 units distance
const COLLECTION_RADIUS = 0.3 // Collection happens at 0.3 units

for (const orb of xpOrbs) {
  const dist = distance(playerPos, orb.position)

  if (dist < XP_MAGNET_RADIUS) {
    // Move orb toward player
    orb.position.lerp(playerPos, magnetSpeed * delta)
  }

  if (dist < COLLECTION_RADIUS) {
    collectXP(orb)
  }
}
```

**Modified with Magnet upgrade:**
```javascript
const XP_MAGNET_RADIUS = 2.0
const COLLECTION_RADIUS = 0.3
const magnetBonus = usePlayer.getState().permanentUpgradeBonuses.magnet || 1.0
const effectiveMagnetRadius = XP_MAGNET_RADIUS * magnetBonus // e.g., 2.0 * 1.30 = 2.6

for (const orb of xpOrbs) {
  const dist = distance(playerPos, orb.position)

  if (dist < effectiveMagnetRadius) {
    orb.position.lerp(playerPos, magnetSpeed * delta)
  }

  if (dist < COLLECTION_RADIUS) {
    collectXP(orb)
  }
}
```

**IMPORTANT:** Only the magnetization radius should scale with Magnet upgrade, NOT the collection radius. Collection radius should remain constant (or scale very minimally) to avoid trivializing XP collection.

**Loot gems (Fragment, Heal):** If they use a separate system, apply the same magnet multiplier. If they share the XP magnetization system, they will automatically benefit from the magnet upgrade.

### Fragment Economy Update

**Fragment costs for utility stats:**
- MAGNET (2 levels): 240 total
- LUCK (3 levels): 700 total
- EXP_BONUS (5 levels): 1440 total
- CURSE (5 levels): 1200 total

**Total utility stats: 3580 Fragments**

**Combined with combat stats (3800 from Story 20.1):**
- Total to max 10 upgrades: **7380 Fragments**

**Fragment earning rate (current implementation):**
- Enemy drops (12% chance): ~10-20 Fragments per run (depends on kills)
- Boss reward: 100 Fragments per boss
- Tunnel dilemmas: Variable (0-50 Fragments estimated)

**Estimated Fragments per run: 100-200**

**Progression pacing:**
- Players can afford 1-2 upgrades every 2-3 runs
- Full maxing requires ~40-80 runs (balanced for long-term engagement)

**IMPORTANT:** This does NOT include Epic 20.5 meta stats (Revival, Reroll, Skip, Banish), which will add more Fragment sinks. Total system cost will be even higher.

### Testing Standards

Follow the project's Vitest testing standards:

**Config tests:**
- Test permanentUpgradesDefs: MAGNET, LUCK, EXP_BONUS, CURSE have valid structure
- Test all utility upgrades: maxLevel matches spec, levels array complete, costs escalate
- Test no duplicate upgrade IDs across combat + utility stats

**Store tests:**
- Test useUpgrades: getComputedBonuses() includes magnet, luck, expBonus, curse
- Test useUpgrades: utility bonuses default to neutral values (1.0 or 0.0) when no upgrades
- Test useUpgrades: purchasing utility upgrades updates bonuses correctly
- Test useUpgrades: persistence saves and loads utility upgrades

**Integration tests:**
- Test magnet: XP magnetization radius increases with MAGNET upgrade
- Test luck: loot drop chances increase with LUCK upgrade
- Test expBonus: XP gains are multiplied with EXP_BONUS upgrade
- Test curse: enemy spawn rate increases with CURSE upgrade
- Test stacking: curse stacks with dynamic wave system (if Epic 23 implemented)

**CRITICAL:** Use `useUpgrades.getState().reset()` in afterEach() to prevent test pollution.

### Performance Notes

- Utility bonuses computed once at run start, not every frame (same as combat stats)
- getComputedBonuses() extends from O(6) to O(10) upgrades — still negligible
- No new stores or persistence — reuses Story 20.1 infrastructure
- Magnet radius check happens every frame for every orb — already optimized in Story 11.1
- Luck affects drop rolls only on enemy death — not frame-critical
- Exp bonus affects XP award — infrequent (enemy death only)
- Curse affects spawn timing — already in GameLoop tick, no added overhead

**No performance concerns for this story.**

### Project Structure Notes

**Modified files:**
- `src/entities/permanentUpgradesDefs.js` — Add 4 utility upgrade definitions
- `src/stores/useUpgrades.jsx` — Extend getComputedBonuses() to include utility stats
- `src/GameLoop.jsx` — Apply luck to loot drops, expBonus to XP, curse to spawns
- `src/renderers/XPOrbRenderer.jsx` or magnetization logic — Apply magnet to radius
- `src/systems/spawnSystem.js` or `useEnemies.tick()` — Apply curse to spawn rate

**New files:**
- `src/entities/__tests__/permanentUpgradesDefs.utility.test.js` — Utility upgrade tests

**NOT modified:**
- `src/ui/UpgradesScreen.jsx` — Story 20.2 already shows all upgrades, no changes needed
- `src/stores/usePlayer.jsx` — Bonuses already read from permanentUpgradeBonuses (Story 20.1)
- `src/ui/MainMenu.jsx` — Fragment display already implemented (Story 20.3)

### Stacking Behavior Documentation

**Magnet + Future Magnet Boons (if any):**
- Permanent magnet: 1.30 (+30%)
- Boon magnet: 1.50 (+50%)
- Final: 1.30 × 1.50 = 1.95 (+95% total)

**Luck + Future Luck Boons (if any):**
- Permanent luck: +15% (additive)
- Boon luck: +10% (additive)
- Final: +25% total drop chance

**Exp Bonus + Boon XP Multipliers:**
- Permanent exp: 1.25 (+25%)
- Boon XP: 1.50 (+50%)
- Final: 1.25 × 1.50 = 1.875 (+87.5% total)

**Curse + Dynamic Wave System (Epic 23):**
- Permanent curse: 1.50 (+50%)
- Dynamic wave: 1.30 (+30%)
- Final: 1.50 × 1.30 = 1.95 (+95% spawn rate)

**IMPORTANT:** Document these stacking rules in gameConfig.js or a stacking.md file for future reference.

### UX Considerations

**Why utility stats?**
- Magnet: Quality of life, reduces tedious movement for pickups
- Luck: Increases loot excitement, rewards risk-taking
- Exp Bonus: Accelerates progression for experienced players
- Curse: Risk/reward trade-off for advanced players

**Why separate from combat stats?**
- Different playstyles: combat-focused vs loot-focused vs progression-focused
- Encourages experimentation with different meta-builds
- Provides meaningful choices (spend on power vs speed vs resources)

**Curse as a "difficulty modifier":**
- Curse is unique — it makes the game harder but more rewarding
- Advanced players can "self-impose" higher difficulty for faster progression
- Risk: dying faster due to more enemies
- Reward: more XP, more loot, faster level-ups

### References

- [Source: _bmad-output/planning-artifacts/epic-20-permanent-upgrades-system.md#Story 20.4] — Epic context, utility stats spec
- [Source: _bmad-output/implementation-artifacts/20-1-permanent-upgrades-combat-stats.md] — Story 20.1 foundation patterns
- [Source: _bmad-output/implementation-artifacts/20-3-fragment-display-menu.md] — Fragment display context
- [Source: src/entities/permanentUpgradesDefs.js] — Combat stats definitions (from Story 20.1)
- [Source: src/stores/useUpgrades.jsx] — Upgrades store (from Story 20.1)
- [Source: src/GameLoop.jsx] — Loot drop logic, XP award logic, spawn rate logic
- [Source: src/renderers/XPOrbRenderer.jsx] — XP magnetization logic (Story 11.1)
- [Source: src/systems/spawnSystem.js] — Enemy spawn system (if exists)
- [Source: _bmad-output/implementation-artifacts/19-3-fragment-drops.md] — Fragment gem drop implementation
- [Source: _bmad-output/implementation-artifacts/11-1-xp-magnetization-system.md] — XP magnetization reference
- [Source: _bmad-output/planning-artifacts/architecture.md#6-Layer Architecture] — System integration patterns

## Change Log

- 2026-02-15: Implemented all 7 tasks — 4 utility upgrades (MAGNET, LUCK, EXP_BONUS, CURSE) added to config, store extended with 4 new bonus computations, integrated into magnetization (GameLoop + fragmentGemSystem), loot drops (lootSystem), XP gains (GameLoop), and spawn rates (spawnSystem). Full test coverage added.
- 2026-02-15: Code review fixes — Added stacking documentation comments in GameLoop.jsx (M-1), replaced non-deterministic luck test with mocked Math.random (M-2), added ratio verification to curse spawn test (M-3), updated File List documentation (M-4). 1463 tests pass.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Task 1: Added 4 utility upgrade definitions to permanentUpgradesDefs.js following Story 20.1 combat stats pattern. Costs: MAGNET (240 total), LUCK (700 total), EXP_BONUS (1440 total), CURSE (1200 total). Combined utility total: 3580 Fragments.
- Task 2: Extended getComputedBonuses() in useUpgrades store to return 10 bonuses (6 combat + 4 utility). Updated DEFAULT_PERMANENT_BONUSES in usePlayer.jsx to include neutral defaults for new utility stats.
- Task 3: Composed boon pickupRadiusMultiplier with permanent magnet upgrade in GameLoop. Updated fragmentGemSystem.updateMagnetization() to accept pickupRadiusMultiplier parameter (was missing). All 3 magnetization systems (XP orbs, heal gems, fragment gems) now benefit from magnet upgrade.
- Task 4: Applied luck bonus in lootSystem.rollDrops() — additive to both rare XP gem chance and registry-based drop chances (heal gem, fragment gem). Capped at 1.0.
- Task 5: Applied expBonus multiplier to XP orb collection in GameLoop (multiplicative stacking with boon xpMultiplier, floored with Math.floor).
- Task 6: Applied curse in spawnSystem.js — divides spawn interval by (1 + curseBonus) to increase spawn rate. Stacks multiplicatively with future Epic 23 dynamic wave system.
- Task 7: 7 integration tests + 5 config tests + 5 store tests = 17 new tests. All 1462 tests pass (0 regressions).

### File List

- `src/entities/permanentUpgradesDefs.js` — MODIFIED: Added MAGNET, LUCK, EXP_BONUS, CURSE upgrade definitions
- `src/stores/useUpgrades.jsx` — MODIFIED: Extended getComputedBonuses() with 4 utility bonus types
- `src/stores/usePlayer.jsx` — MODIFIED: Updated DEFAULT_PERMANENT_BONUSES to include utility stat defaults
- `src/GameLoop.jsx` — MODIFIED: Composed magnet with pickupRadius, applied expBonus to XP collection, added stacking documentation
- `src/systems/lootSystem.js` — MODIFIED: Applied luck bonus to all drop chance rolls (rare XP + registry loot)
- `src/systems/spawnSystem.js` — MODIFIED: Applied curse to reduce spawn interval
- `src/systems/fragmentGemSystem.js` — MODIFIED: Added pickupRadiusMultiplier parameter to updateMagnetization()
- `src/entities/__tests__/permanentUpgradesDefs.test.js` — MODIFIED: Added tests for 4 utility upgrades (structure, levels, no duplicates)
- `src/stores/__tests__/useUpgrades.test.js` — MODIFIED: Added tests for utility bonus defaults and computations
- `src/systems/__tests__/utilityUpgradesIntegration.test.js` — NEW: Integration tests for magnet, luck, expBonus, curse (deterministic with mocked Math.random)
