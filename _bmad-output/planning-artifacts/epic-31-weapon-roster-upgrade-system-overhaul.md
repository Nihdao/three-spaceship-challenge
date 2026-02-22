# Epic 31: Weapon Roster & Upgrade System Overhaul

Refonte complète du roster d'armes (suppression de 7 armes, ajout de 6 nouvelles, mise à jour des couleurs par famille sémantique) et remplacement du système d'upgrades prédéfinies par un système procédural basé sur des stats aléatoires pondérées par la luck. Refonte également des formules de level-up et des récompenses planètes.

## Epic Goals

- Supprimer les 7 armes obsolètes et définir les stubs des 6 nouvelles armes
- Ajouter les nouveaux champs de stats au schéma de weaponDefs (`baseArea`, `critChance`, `poolLimit`, `rarityWeight`)
- Appliquer le système de couleurs sémantiques par famille (Cold / Arcane / Volatile / Bio)
- Remplacer le tableau `upgrades[]` figé par un système procédural (stat aléatoire × rareté × variance luck)
- Refondre les formules de génération des choix de level-up (P4, P_upgrade, pool pondéré)
- Refondre les récompenses des scans planètes selon leur tier (Silver / Gold / Platinum)

## Epic Context

Le roster actuel comporte des armes aux mécaniques redondantes (MISSILE_HOMING / PLASMA_BOLT / DRONE tous dans le même registre "tir lent puissant") et des upgrades entièrement codées en dur niveau par niveau. Ce système prédit exactement ce que le joueur obtiendra à chaque niveau, tuant la surprise. Le nouveau système procédural (stat aléatoire + rareté influencée par la luck + variance ±3%) rend chaque upgrade unique et valorise la stat de luck. Parallèlement, les nouvelles armes couvrent des archétypes distincts : orbital (LASER_CROSS), aura (MAGNETIC_FIELD), directionnel X (DIAGONALS), onde de choc (SHOCKWAVE), mine (MINE_AROUND), ciblage tactique (TACTICAL_SHOT).

## Stories

### Story 31.1: Weapon Stat Schema & Roster Cleanup

As a developer,
I want the weapon definitions to reflect the new roster and stat schema,
So that the data layer is ready before implementing new weapon mechanics and the procédural upgrade system.

**Acceptance Criteria:**

**Given** the weapon definitions file
**When** reviewed post-story
**Then** the following weapons are REMOVED: `MISSILE_HOMING`, `PLASMA_BOLT`, `RAILGUN`, `TRI_SHOT`, `SHOTGUN`, `SATELLITE`, `DRONE`
**And** the field `rarityDamageMultipliers` is removed from all remaining weapon defs (remplacé par le système procédural Story 31.2)

**Given** the new stat schema
**When** any weapon def is read
**Then** it includes the fields: `baseArea` (number, 1.0 = neutre), `critChance` (float 0–1, min 0.015), `poolLimit` (integer), `rarityWeight` (integer, plus grand = plus commun)
**And** `critChance` est toujours ≥ 0.015 (plancher 1.5%, pas d'upgrade négative)

**Given** the color system
**When** reviewing the projectile colors per weapon
**Then** COLD family: `LASER_FRONT=#00e5ff`, `BEAM=#0096c7`, `DIAGONALS=#48cae4`
**And** ARCANE family: `LASER_CROSS=#9b5de5`, `MAGNETIC_FIELD=#c084fc`
**And** VOLATILE family: `SPREAD_SHOT=#ffd60a`, `SHOCKWAVE=#f9e547`, `EXPLOSIVE_ROUND=#f4c430`
**And** BIO family: `MINE_AROUND=#06d6a0`, `TACTICAL_SHOT=#2dc653`
**And** aucune couleur n'empiète sur le spectre ennemi (`#ef233c` / `#ff4f1f` strictement réservés)

**Given** BEAM adjustments
**When** the BEAM weapon is fired
**Then** `projectileMeshScale` is `[0.12, 0.12, 8.0]` (beam très fin)
**And** `projectileColor` is `#0096c7`

**Given** EXPLOSIVE_ROUND adjustments
**When** the EXPLOSIVE_ROUND projectile is rendered
**Then** `projectileMeshScale` is `[1.4, 1.4, 1.4]` (sphère uniforme)
**And** `projectileColor` is `#f4c430`
**And** the def includes `pulseAnimation: true` (flag pour le rendu, implémenté en Epic 32)

**Given** the 6 new weapon stubs
**When** the weapon defs are read
**Then** `LASER_CROSS`, `MAGNETIC_FIELD`, `DIAGONALS`, `SHOCKWAVE`, `MINE_AROUND`, `TACTICAL_SHOT` are present with all required fields filled (baseDamage, baseCooldown, baseArea, critChance, poolLimit, rarityWeight, projectileColor, projectileType)
**And** these weapons are flagged `implemented: false` pour les exclure du pool de jeu jusqu'à Epic 32

### Story 31.2: Procédural Upgrade System

As a player,
I want each weapon upgrade to improve a random stat with luck-influenced quality,
So that every upgrade feels unique and investing in luck is meaningfully rewarding.

**Acceptance Criteria:**

**Given** the upgrade system
**When** a weapon is upgraded (level-up or planet scan)
**Then** the system picks one stat at random among: `damage`, `area`, `cooldown`, `knockback`, `crit`
**And** the rarity of the improvement is rolled via the existing `rollRarity(luck)` function
**And** the base magnitude is drawn from the upgrade magnitude table (see Technical Notes)
**And** a ±3% variance is applied via a luck-biased power curve (see Technical Notes)

**Given** upgrade magnitudes
**When** a LEGENDARY damage upgrade is rolled
**Then** the effective magnitude is `40% + roll` where roll ∈ [-3%, +3%] biaisé vers +3% par la luck

**Given** crit upgrade
**When** any crit upgrade is applied
**Then** `critChance` after application is clamped to `Math.min(result, 1.0)` (100% hard cap)
**And** the minimum upgrade for crit is 1.5% (COMMON floor — roll négatif impossible pour crit)

**Given** cooldown upgrade
**When** any cooldown upgrade is applied
**Then** effective cooldown is never lower than `baseCooldown * 0.15` (floor par arme)

**Given** weapon state in store
**When** a weapon has been upgraded N times
**Then** `useWeapons` stores per-weapon stat multipliers: `{ damageMultiplier, areaMultiplier, cooldownMultiplier, knockbackMultiplier, critBonus, level }`
**And** effective stats are computed on-the-fly by multiplying base def values by these multipliers

**Given** the statPreview in level-up UI
**When** an upgrade card is displayed
**Then** it shows which stat was rolled and the projected magnitude (e.g., "Damage +18% (Rare)")

### Story 31.3: Level-Up Formula Rework

As a player,
I want the level-up pool to respect my luck investment and weapon rarity weights,
So that luck is a meaningful stat that tangibly improves my upgrade quality and variety.

**Acceptance Criteria:**

**Given** the 4th choice probability
**When** level-up choices are generated
**Then** a 4th choice is added with probability `P4 = Math.min(luck / (luck + 8), 0.85)`
**And** at luck=0, P4=0 (jamais de 4e choix sans luck)
**And** at luck=8, P4≈50% ; at luck=20, P4≈71% ; jamais au-delà de 85%

**Given** the upgrade vs new-weapon probability
**When** slots are still available (player has room for new weapons/boons)
**Then** each slot has probability `P_upgrade = Math.max(0.10, (0.5 + 0.1*x) - luck * 0.04)` d'être une upgrade plutôt qu'une nouvelle arme
**And** x=2 si le niveau est pair, x=1 si impair

**Given** the weighted pool sampling
**When** new weapons are candidates in the pool
**Then** weapons are sampled proportionally to their `rarityWeight` (no uniform sampling)
**And** no weapon can appear twice in the same set of choices (no duplicates)
**And** fully leveled weapons (level 9) are excluded from the pool

**Given** all weapon slots are full
**When** generating choices
**Then** P_upgrade = 1.0 (forced — only upgrades or boons)

### Story 31.4: Planet Reward Tier Rework

As a player,
I want planet scan rewards to feel distinctly different by tier,
So that platinum planets are genuinely exciting moments worth pursuing.

**Acceptance Criteria:**

**Given** a Silver planet scan
**When** the reward modal opens
**Then** exactly 2 choices are presented
**And** luckStat injected = 0 (no luck influence — raw quality)
**And** pool favors upgrades for equipped weapons + boons (existing logic preserved)

**Given** a Gold planet scan
**When** the reward modal opens
**Then** exactly 3 choices are presented
**And** luckStat = player's real getLuckStat() value
**And** pool is balanced (full pool, same as level-up)

**Given** a Platinum planet scan
**When** the reward modal opens
**Then** 3 choices are presented base, with a potential 4th via P4 formula at player luck
**And** luckStat = player's real getLuckStat()
**And** at least one choice is guaranteed RARE or above (if all rolled COMMON, the first is rerolled to RARE minimum)
**And** pool prioritizes new weapons and new boons first

**Given** luckStat injection
**When** generatePlanetReward() is called
**Then** it receives the player luckStat as a parameter (not hardcoded 0)
**And** the caller (GameLoop or reward trigger) reads `usePlayer.getState().getLuckStat()`

## Technical Notes

**Upgrade magnitude table:**
```
         │ Damage │ Area  │ Cooldown │ Knockback │ Crit   │
COMMON   │ +8%    │ +6%   │ -6%      │ +10%      │ +1.5%  │
RARE     │ +15%   │ +12%  │ -12%     │ +20%      │ +2.5%  │
EPIC     │ +25%   │ +20%  │ -20%     │ +35%      │ +4%    │
LEGENDARY│ +40%   │ +32%  │ -30%     │ +55%      │ +7%    │
```

**Luck-biased variance (±3%):**
```js
const u    = Math.random()
const pow  = Math.max(0.1, 1 - luck * 0.06)   // luck=0 uniforme, luck=15+ très biaisé
const roll = Math.pow(u, pow) * 6 - 3          // [-3, +3] biaisé vers +3
finalMagnitude = baseMagnitude + roll
// Crit: Math.max(baseMagnitude, baseMagnitude + roll) — never below base
```

**Weapon family colors:**
- COLD `#00e5ff` / `#0096c7` / `#48cae4`
- ARCANE `#9b5de5` / `#c084fc`
- VOLATILE `#ffd60a` / `#f9e547` / `#f4c430`
- BIO `#06d6a0` / `#2dc653`

**Files touched:**
- `src/entities/weaponDefs.js` — schéma + roster (31.1)
- `src/systems/progressionSystem.js` — formules P4, P_upgrade, pool pondéré (31.3 + 31.4)
- `src/stores/useWeapons.jsx` — état upgrades procédurales (31.2)
- `src/systems/upgradeSystem.js` (nouveau) — logique rollUpgrade() (31.2)

## Dependencies

- Epic 22 (Combat Depth) — useWeapons store existant
- Story 22.3 (Rarity system) — rollRarity() réutilisé
- Epic 32 (New Weapon Mechanics) — bloqué par 31.1 (stubs requis)

## Success Metrics

- Les 7 armes retirées n'apparaissent plus en jeu (QA: zero reference in active pool)
- Chaque upgrade de niveau montre une stat différente de la précédente ≥50% du temps (QA: sample 20 runs)
- La luck à 10+ augmente visiblement la qualité moyenne des upgrades (QA: comparer distribution COMMON/RARE/EPIC)
- Les planètes Platinum proposent systématiquement ≥1 RARE (QA: 10 scans consécutifs)
- Aucune couleur d'arme joueur ne ressemble aux projectiles ennemis (#ef233c) (QA visuel)
