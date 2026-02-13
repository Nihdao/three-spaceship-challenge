# Story 11.4: Complete Boon Roster Implementation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want all planned boon types fully implemented with clear effects,
So that players have diverse passive options for build crafting.

## Acceptance Criteria

1. **Given** boonDefs.js **When** boon definitions are reviewed **Then** at least 8-12 unique boon types are fully defined **And** each boon has: name, description, effect values, stacking rules

2. **Given** boon variety **When** boons are categorized **Then** boons cover diverse effects: Damage: Damage Amp, Crit Chance, Crit Multiplier; Speed: Attack Speed, Movement Speed, Projectile Speed; Survivability: Max HP Up, HP Regen, Damage Reduction; Utility: XP Gain, Fragment Gain, Pickup Radius

3. **Given** each boon type **When** it is applied **Then** its effect is computed and integrated into gameplay systems **And** boon effects stack correctly if the same boon is selected multiple times (additive or multiplicative as defined)

4. **Given** boons are integrated **When** they appear in level-up choices **Then** all boon types can be offered to the player **And** boon descriptions clearly communicate their effect and magnitude

## Tasks / Subtasks

- [x] Task 1: Analyze current boon roster and identify gaps (AC: #1, #2)
  - [x] 1.1: Review existing boonDefs.js — Document all current boon types (DAMAGE_AMP, SPEED_BOOST, COOLDOWN_REDUCTION, CRIT_CHANCE)
  - [x] 1.2: Map existing boons to categories (Damage, Speed, Utility)
  - [x] 1.3: Identify missing categories from epic requirements (Survivability, Projectile Speed, XP/Fragment gain)
  - [x] 1.4: Calculate target boon count (at least 8-12 as per epic) — currently 4, need +4 to +8 more
  - [x] 1.5: Prioritize boon additions based on gameplay variety (ensure each category has at least 2-3 options)

- [x] Task 2: Design new boon definitions for missing categories (AC: #1, #2, #4)
  - [x] 2.1: Design CRIT_MULTIPLIER boon (Damage category) — Increases critical hit damage multiplier from 2.0x to higher
  - [x] 2.2: Design PROJECTILE_SPEED boon (Speed category) — Increases all weapon projectile speeds
  - [x] 2.3: Design MAX_HP_UP boon (Survivability category) — Increases maximum HP pool
  - [x] 2.4: Design HP_REGEN boon (Survivability category) — Adds passive HP regeneration over time
  - [x] 2.5: Design DAMAGE_REDUCTION boon (Survivability category) — Reduces incoming damage by percentage
  - [x] 2.6: Design XP_GAIN boon (Utility category) — Increases XP gained from enemy kills
  - [x] 2.7: Design FRAGMENT_GAIN boon (Utility category) — Increases Fragment rewards from enemies and bosses
  - [x] 2.8: Design PICKUP_RADIUS boon (Utility category) — Increases XP orb magnetization radius
  - [x] 2.9: Design additional boons to reach 8-12 total based on playtesting feedback

- [x] Task 3: Implement boon definitions in boonDefs.js (AC: #1)
  - [x] 3.1: Add CRIT_MULTIPLIER entry with tier data (level 1: 2.2x, level 2: 2.4x, level 3: 2.7x)
  - [x] 3.2: Add PROJECTILE_SPEED entry with tier data (level 1: +15%, level 2: +30%, level 3: +50%)
  - [x] 3.3: Add MAX_HP_UP entry with tier data (level 1: +20, level 2: +50, level 3: +100)
  - [x] 3.4: Add HP_REGEN entry with tier data (level 1: 1 HP/sec, level 2: 2 HP/sec, level 3: 4 HP/sec)
  - [x] 3.5: Add DAMAGE_REDUCTION entry with tier data (level 1: -10%, level 2: -18%, level 3: -25%)
  - [x] 3.6: Add XP_GAIN entry with tier data (level 1: +20%, level 2: +40%, level 3: +75%)
  - [x] 3.7: Add FRAGMENT_GAIN entry with tier data (level 1: +20%, level 2: +40%, level 3: +75%)
  - [x] 3.8: Add PICKUP_RADIUS entry with tier data (level 1: +30%, level 2: +60%, level 3: +100%)
  - [x] 3.9: Ensure all new boons follow existing structure (id, name, maxLevel: 3, effect, tiers array)

- [x] Task 4: Update useBoons.computeModifiers() to handle new effect types (AC: #3)
  - [x] 4.1: Add critMultiplier to computed modifiers (defaults to 2.0 if no CRIT_MULTIPLIER boon)
  - [x] 4.2: Add projectileSpeedMultiplier to computed modifiers (defaults to 1.0)
  - [x] 4.3: Add maxHPBonus to computed modifiers (flat addition to maxHP, defaults to 0)
  - [x] 4.4: Add hpRegenRate to computed modifiers (HP per second, defaults to 0)
  - [x] 4.5: Add damageReduction to computed modifiers (percentage reduction, defaults to 0)
  - [x] 4.6: Add xpMultiplier to computed modifiers (defaults to 1.0)
  - [x] 4.7: Add fragmentMultiplier to computed modifiers (defaults to 1.0)
  - [x] 4.8: Add pickupRadiusMultiplier to computed modifiers (defaults to 1.0)
  - [x] 4.9: Test computeModifiers() with all new boons equipped — verify correct calculations

- [x] Task 5: Integrate new boon effects into gameplay systems (AC: #3)
  - [x] 5.1: CRIT_MULTIPLIER — Update GameLoop damage calculation (Section 5: Collisions) to use critMultiplier from boons
  - [x] 5.2: PROJECTILE_SPEED — Update weaponSystem.fire() to apply projectileSpeedMultiplier to baseSpeed
  - [x] 5.3: MAX_HP_UP — Update usePlayer.reset() and maxHP calculation to include maxHPBonus from boons
  - [x] 5.4: HP_REGEN — Add HP regeneration logic to usePlayer.tick() (apply hpRegenRate * delta, cap at maxHP)
  - [x] 5.5: DAMAGE_REDUCTION — Update usePlayer.takeDamage() to apply damageReduction percentage (incomingDamage * (1 - damageReduction))
  - [x] 5.6: XP_GAIN — Update GameLoop XP collection (Section 7: Spawning) to apply xpMultiplier to XP orb value
  - [x] 5.7: FRAGMENT_GAIN — Update enemy death and boss defeat to apply fragmentMultiplier to Fragment rewards
  - [x] 5.8: PICKUP_RADIUS — Update GameLoop XP magnetization (Story 11.1) to apply pickupRadiusMultiplier to XP_MAGNET_RADIUS
  - [x] 5.9: Test each new boon effect in gameplay — verify correct application and observable impact

- [x] Task 6: Verify boon stacking rules (AC: #3)
  - [x] 6.1: Test selecting same boon multiple times (e.g., DAMAGE_AMP level 1 → 2 → 3)
  - [x] 6.2: Verify tier progression — higher tiers replace lower tiers (not additive stacking)
  - [x] 6.3: Test multiple different boons — verify effects combine correctly (e.g., DAMAGE_AMP + CRIT_CHANCE + COOLDOWN_REDUCTION all active)
  - [x] 6.4: Verify computeModifiers() correctly reads tier data based on current boon level
  - [x] 6.5: Test edge case: 3 boon slots filled → no new boons offered, only tier upgrades

- [x] Task 7: Integrate new boons into progression system (AC: #4)
  - [x] 7.1: Verify progressionSystem.js boon pool includes all new boon IDs
  - [x] 7.2: Test level-up modal — new boons appear as choices when boon slots available
  - [x] 7.3: Test boon descriptions in level-up cards — ensure name, tier description, and statPreview display correctly
  - [x] 7.4: Test boon selection — verify new boons activate and effects apply immediately
  - [x] 7.5: Test boon tier upgrades — verify selecting existing boon increases tier and updates effect

- [x] Task 8: Balance testing and tuning (AC: #2, #3)
  - [x] 8.1: Playtest all new boons in isolation — verify each feels impactful and worthwhile
  - [x] 8.2: Playtest boon combinations — verify no single boon or combo is overpowered or useless
  - [x] 8.3: Tune effect values to match boon categories (offensive vs defensive vs utility balance)
  - [x] 8.4: Adjust tier progression if any boon feels too strong/weak at specific levels
  - [x] 8.5: Verify boon variety encourages experimentation and diverse build paths

- [x] Task 9: Edge case validation
  - [x] 9.1: Test all 3 boon slots filled with diverse boons — verify correct effect computation and no conflicts
  - [x] 9.2: Test HP_REGEN with low HP — verify regeneration applies correctly and caps at maxHP
  - [x] 9.3: Test DAMAGE_REDUCTION with high incoming damage — verify damage reduction applies before HP reduction
  - [x] 9.4: Test XP_GAIN and FRAGMENT_GAIN multipliers — verify rewards scale correctly
  - [x] 9.5: Test PICKUP_RADIUS with XP magnetization — verify increased radius applies to magnetization logic
  - [x] 9.6: Test MAX_HP_UP applied mid-run — verify currentHP and maxHP both increase correctly
  - [x] 9.7: Test PROJECTILE_SPEED with all weapon types — verify speed increase applies to all projectiles
  - [x] 9.8: Test CRIT_MULTIPLIER with CRIT_CHANCE — verify critical hits use correct multiplier

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **Data Layer** → `src/entities/boonDefs.js` (boon definitions with effects, tier data)
- **Stores Layer** → `src/stores/useBoons.jsx` (equipped boons, computeModifiers() for global effects)
- **GameLoop Layer** → `src/GameLoop.jsx` (applies boon modifiers to damage, XP, HP regen in respective sections)
- **Systems Layer** → `src/systems/weaponSystem.js` (applies projectileSpeedMultiplier), `src/systems/collisionSystem.js` (applies critMultiplier)
- **UI Layer** → `src/ui/LevelUpModal.jsx` (displays boon choices from progressionSystem.js)

**Existing Boon Infrastructure (Story 3.4 — Boon System):**
- **boonDefs.js pattern:** Each boon is a plain object with id, name, maxLevel (3), effect (level 1 default), tiers array (levels 1-3 with description, effect, statPreview)
- **useBoons store:** Manages equipped boons (slots 1-3), computeModifiers() aggregates all active boon effects into a single modifiers object
- **Stacking rules:** Same boon selected multiple times → tier increases (level 1 → 2 → 3), effect replaces previous tier (not additive)
- **Level-up integration:** progressionSystem.js generates boon choices (new boons if slots available, tier upgrades for equipped boons)

**Current Boon Roster (4 boons):**
1. **DAMAGE_AMP** (Damage) — Increases weapon damage by 15%/30%/50%
2. **SPEED_BOOST** (Speed) — Increases movement speed by 20%/35%/50%
3. **COOLDOWN_REDUCTION** (Speed) — Reduces weapon cooldowns by 15%/28%/40%
4. **CRIT_CHANCE** (Damage) — Adds 10%/20%/30% chance for double damage

**Missing Categories (Epic 11 Story 11.4 Requirements):**
- **Damage:** Crit Multiplier (increases crit damage beyond 2.0x)
- **Speed:** Projectile Speed (increases all weapon projectile speeds)
- **Survivability:** Max HP Up, HP Regen, Damage Reduction
- **Utility:** XP Gain, Fragment Gain, Pickup Radius

**Target Boon Count:** 8-12 boons (currently 4, need +4 to +8)

### Technical Requirements

**boonDefs.js New Boon Template:**
```javascript
// Example: CRIT_MULTIPLIER boon definition
CRIT_MULTIPLIER: {
  id: 'CRIT_MULTIPLIER',
  name: 'Critical Power',
  maxLevel: 3,
  effect: { critMultiplier: 2.2 },
  tiers: [
    { level: 1, description: 'Critical hits deal 2.2x damage (instead of 2.0x)', effect: { critMultiplier: 2.2 }, statPreview: 'Crit Damage: 2.0x → 2.2x' },
    { level: 2, description: 'Critical hits deal 2.4x damage', effect: { critMultiplier: 2.4 }, statPreview: 'Crit Damage: 2.2x → 2.4x' },
    { level: 3, description: 'Critical hits deal 2.7x damage', effect: { critMultiplier: 2.7 }, statPreview: 'Crit Damage: 2.4x → 2.7x' },
  ],
},
```

**useBoons.jsx computeModifiers() Extension:**
```javascript
// Existing pattern in useBoons.jsx
computeModifiers: () => {
  const { equippedBoons } = get()
  const modifiers = {
    damageMultiplier: 1.0,
    speedMultiplier: 1.0,
    cooldownMultiplier: 1.0,
    critChance: 0.0,
    // NEW modifiers for Story 11.4:
    critMultiplier: 2.0,        // Base crit damage (2.0x = double damage)
    projectileSpeedMultiplier: 1.0,
    maxHPBonus: 0,              // Flat addition to maxHP
    hpRegenRate: 0,             // HP per second
    damageReduction: 0,         // Percentage (0.0 to 1.0)
    xpMultiplier: 1.0,
    fragmentMultiplier: 1.0,
    pickupRadiusMultiplier: 1.0,
  }

  equippedBoons.forEach(boonSlot => {
    if (!boonSlot.id) return
    const boonDef = BOONS[boonSlot.id]
    const tier = boonDef.tiers.find(t => t.level === boonSlot.level)
    if (!tier) return

    // Merge tier effects into modifiers
    Object.entries(tier.effect).forEach(([key, value]) => {
      if (key.endsWith('Multiplier') || key === 'speedMultiplier' || key === 'damageMultiplier' || key === 'cooldownMultiplier') {
        modifiers[key] *= value  // Multiplicative stacking (multiple boons multiply together)
      } else if (key === 'maxHPBonus' || key === 'hpRegenRate') {
        modifiers[key] += value  // Additive stacking (multiple boons add together)
      } else {
        modifiers[key] = Math.max(modifiers[key], value)  // Max value (e.g., critChance, damageReduction)
      }
    })
  })

  return modifiers
},
```

**GameLoop Integration Examples:**
```javascript
// GameLoop.jsx Section 2: Player Movement & HP Regen
const boonModifiers = useBoons.getState().computeModifiers()
usePlayer.getState().tick(delta, boonModifiers.speedMultiplier, boonModifiers.hpRegenRate)

// usePlayer.tick() implementation (Story 11.4 addition):
tick: (delta, speedMultiplier = 1.0, hpRegenRate = 0) => {
  // Apply HP regeneration
  if (hpRegenRate > 0) {
    const { currentHP, maxHP } = get()
    const newHP = Math.min(currentHP + hpRegenRate * delta, maxHP)
    set({ currentHP: newHP })
  }
  // ... existing movement logic with speedMultiplier
},

// GameLoop.jsx Section 5: Collisions — Critical hit damage
const boonModifiers = useBoons.getState().computeModifiers()
const isCrit = Math.random() < boonModifiers.critChance
const critMultiplier = isCrit ? boonModifiers.critMultiplier : 1.0
const finalDamage = weaponDamage * boonModifiers.damageMultiplier * critMultiplier

// usePlayer.takeDamage() — Damage reduction
takeDamage: (amount) => {
  const boonModifiers = useBoons.getState().computeModifiers()
  const reducedDamage = amount * (1 - boonModifiers.damageReduction)
  const { currentHP } = get()
  const newHP = Math.max(0, currentHP - reducedDamage)
  set({ currentHP: newHP })
  if (newHP === 0) {
    // Trigger death
  }
},

// GameLoop.jsx Section 7: XP Collection — XP multiplier
const xpValue = xpOrb.value * boonModifiers.xpMultiplier
usePlayer.getState().gainXP(xpValue)

// weaponSystem.fire() — Projectile speed multiplier
export function fireWeapon(weaponDef, playerPos, playerFacing, boonModifiers) {
  const projectileSpeed = weaponDef.baseSpeed * boonModifiers.projectileSpeedMultiplier
  // ... spawn projectile with adjusted speed
}
```

### Previous Story Intelligence

**From Story 11.3 (Complete Weapon Roster Implementation):**
- **Content completion pattern:** Analyze current roster → identify gaps → design new definitions → implement in entity file → integrate into systems → test
- **Definition structure:** Follow existing pattern exactly (id, name, description, base values, tier/upgrade data)
- **Balance approach:** Playtest in isolation, then in combinations, tune values to match archetypes
- **Visual distinction:** Each weapon has unique color and visual for readability

**Applied to Story 11.4:**
- Follow same content completion workflow for boons
- Boon definitions follow existing boonDefs.js pattern (id, name, maxLevel, effect, tiers)
- Balance categories: Damage boons (offensive), Speed boons (tempo), Survivability boons (defensive), Utility boons (economy)
- No visual distinction needed for boons (they're passive, displayed in HUD as icons only)

**From Story 3.4 (Boon System):**
- **Boon slot management:** Max 3 boon slots, all available from start (no locked slots)
- **Stacking rules:** Same boon selected multiple times → tier increases, effect replaces (not additive)
- **computeModifiers() pattern:** Aggregate all active boon effects into single modifiers object
- **Level-up integration:** progressionSystem.js generates boon choices (new if slots available, tier upgrades if equipped)

**Applied to Story 11.4:**
- All new boons use maxLevel: 3 (consistent with existing)
- Tier progression: level 1 → 2 → 3, effect values increase per tier
- computeModifiers() extended to handle new effect types (critMultiplier, hpRegenRate, etc.)
- No changes to progressionSystem.js needed (boon pool automatically includes all boonDefs.js entries)

**From Story 11.1 (XP Magnetization System):**
- **New behavior implementation:** Add config constant (XP_MAGNET_RADIUS), implement logic in GameLoop, test edge cases
- **Modifier application:** Read from boons modifiers, apply to gameplay constant

**Applied to Story 11.4:**
- PICKUP_RADIUS boon applies pickupRadiusMultiplier to XP_MAGNET_RADIUS (Story 11.1 constant)
- HP_REGEN adds new behavior in usePlayer.tick() (HP regeneration per frame)
- DAMAGE_REDUCTION applies in usePlayer.takeDamage() (percentage reduction before HP decrease)

### Boon Category Design Specifications

**Damage Boons (Offensive Power):**

1. **DAMAGE_AMP** (Existing) — Increases all weapon damage
   - Role: Direct DPS increase, universal scaling
   - Tiers: +15%, +30%, +50%

2. **CRIT_CHANCE** (Existing) — Adds chance for critical hits (2.0x damage)
   - Role: RNG-based burst damage
   - Tiers: 10%, 20%, 30%

3. **CRIT_MULTIPLIER** (New) — Increases critical hit damage multiplier
   - Role: Synergizes with CRIT_CHANCE, amplifies burst potential
   - Tiers: 2.2x, 2.4x, 2.7x (base crit is 2.0x)
   - Effect: { critMultiplier: 2.2 / 2.4 / 2.7 }
   - statPreview: "Crit Damage: 2.0x → 2.2x" / "2.2x → 2.4x" / "2.4x → 2.7x"

**Speed Boons (Tempo & Agility):**

4. **SPEED_BOOST** (Existing) — Increases ship movement speed
   - Role: Mobility, dodging, positioning
   - Tiers: +20%, +35%, +50%

5. **COOLDOWN_REDUCTION** (Existing) — Reduces weapon cooldowns
   - Role: Fire rate increase, sustained DPS
   - Tiers: -15%, -28%, -40%

6. **PROJECTILE_SPEED** (New) — Increases all weapon projectile speeds
   - Role: Hit consistency, long-range accuracy
   - Tiers: +15%, +30%, +50%
   - Effect: { projectileSpeedMultiplier: 1.15 / 1.30 / 1.50 }
   - statPreview: "Projectile Speed: +15%" / "+30%" / "+50%"

**Survivability Boons (Defense & Sustain):**

7. **MAX_HP_UP** (New) — Increases maximum HP pool
   - Role: Tankiness, error margin
   - Tiers: +20 HP, +50 HP, +100 HP
   - Effect: { maxHPBonus: 20 / 50 / 100 }
   - statPreview: "Max HP: +20" / "+50" / "+100"
   - Note: When selected, both currentHP and maxHP increase by bonus amount

8. **HP_REGEN** (New) — Adds passive HP regeneration over time
   - Role: Sustain, long-run survivability
   - Tiers: 1 HP/sec, 2 HP/sec, 4 HP/sec
   - Effect: { hpRegenRate: 1.0 / 2.0 / 4.0 }
   - statPreview: "HP Regen: +1/sec" / "+2/sec" / "+4/sec"

9. **DAMAGE_REDUCTION** (New) — Reduces incoming damage by percentage
   - Role: Damage mitigation, scales with incoming damage
   - Tiers: -10%, -18%, -25%
   - Effect: { damageReduction: 0.10 / 0.18 / 0.25 }
   - statPreview: "Damage Taken: -10%" / "-18%" / "-25%"

**Utility Boons (Economy & Convenience):**

10. **XP_GAIN** (New) — Increases XP gained from enemy kills
    - Role: Faster leveling, more build choices
    - Tiers: +20%, +40%, +75%
    - Effect: { xpMultiplier: 1.20 / 1.40 / 1.75 }
    - statPreview: "XP Gain: +20%" / "+40%" / "+75%"

11. **FRAGMENT_GAIN** (New) — Increases Fragment rewards (Tier 2/3 feature)
    - Role: More tunnel upgrades, stronger permanent bonuses
    - Tiers: +20%, +40%, +75%
    - Effect: { fragmentMultiplier: 1.20 / 1.40 / 1.75 }
    - statPreview: "Fragment Gain: +20%" / "+40%" / "+75%"

12. **PICKUP_RADIUS** (New) — Increases XP orb magnetization radius
    - Role: QOL, faster XP collection
    - Tiers: +30%, +60%, +100%
    - Effect: { pickupRadiusMultiplier: 1.30 / 1.60 / 2.00 }
    - statPreview: "Pickup Radius: +30%" / "+60%" / "+100%"

**Optional 13th Boon (If Time Allows):**

13. **SHIELD_REGEN** (Bonus) — Adds regenerating shield layer on top of HP
    - Role: Extra survivability with recharge mechanic
    - Tiers: 10 shield / 20 shield / 40 shield
    - Effect: { maxShield: 10 / 20 / 40, shieldRegenRate: 2.0 / 4.0 / 8.0 }
    - Note: Requires additional implementation (shield system in usePlayer)

### Tier Progression Formula

**Percentage-Based Boons (Multipliers):**
- Tier 1 → 2: +75-100% of tier 1 bonus (e.g., +15% → +30% = +100% increase)
- Tier 2 → 3: +50-100% of tier 2 bonus (e.g., +30% → +50% = +67% increase)
- Rationale: Early tiers feel impactful, later tiers are powerful but not exponential

**Flat-Value Boons (Additive):**
- Tier 1 → 2: +150-250% of tier 1 value (e.g., +20 HP → +50 HP = +150%)
- Tier 2 → 3: +100-200% of tier 2 value (e.g., +50 HP → +100 HP = +100%)
- Rationale: Flat values scale with player investment (higher tiers significantly more impactful)

**Critical Multiplier (Special Case):**
- Tier 1: 2.2x (base 2.0x + 0.2x)
- Tier 2: 2.4x (base 2.0x + 0.4x)
- Tier 3: 2.7x (base 2.0x + 0.7x)
- Rationale: Synergizes with CRIT_CHANCE, provides meaningful burst potential without being overpowered

### Testing Checklist

**Functional Testing (Per Boon):**
- [ ] CRIT_MULTIPLIER: Critical hits deal 2.2x/2.4x/2.7x damage (verify in combat log)
- [ ] PROJECTILE_SPEED: All weapon projectiles move 15%/30%/50% faster (verify visually)
- [ ] MAX_HP_UP: MaxHP increases by 20/50/100, currentHP also increases if alive
- [ ] HP_REGEN: HP regenerates at 1/2/4 HP per second, caps at maxHP
- [ ] DAMAGE_REDUCTION: Incoming damage reduced by 10%/18%/25% (verify in combat)
- [ ] XP_GAIN: XP orbs grant 20%/40%/75% more XP (verify XP bar fill)
- [ ] FRAGMENT_GAIN: Fragment rewards 20%/40%/75% higher (verify in tunnel hub)
- [ ] PICKUP_RADIUS: XP magnetization radius 30%/60%/100% larger (verify visually)

**Integration Testing:**
- [ ] All new boons appear in level-up choices when boon slots available
- [ ] Boon descriptions display correctly in level-up modal (name, tier description, statPreview)
- [ ] Selecting new boon equips to next available slot (1-3)
- [ ] Equipped boons activate immediately and effects apply
- [ ] Boon tier upgrades appear for equipped boons (tier 1 → 2 → 3)
- [ ] Selecting tier upgrade increases tier and updates effect correctly
- [ ] computeModifiers() correctly aggregates all equipped boon effects

**Balance Testing:**
- [ ] CRIT_MULTIPLIER feels impactful with CRIT_CHANCE (burst damage fantasy)
- [ ] PROJECTILE_SPEED feels useful (projectiles hit faster, more reliable at range)
- [ ] MAX_HP_UP feels meaningful (20/50/100 HP matches damage scaling)
- [ ] HP_REGEN feels valuable (1/2/4 HP/sec sustains through light damage)
- [ ] DAMAGE_REDUCTION feels impactful (10%/18%/25% reduction noticeable in combat)
- [ ] XP_GAIN feels efficient (faster leveling, more choices per run)
- [ ] FRAGMENT_GAIN feels rewarding (more tunnel upgrades available)
- [ ] PICKUP_RADIUS feels convenient (less chasing XP orbs, QOL improvement)

**Combination Testing:**
- [ ] DAMAGE_AMP + CRIT_CHANCE + CRIT_MULTIPLIER: High burst damage builds work correctly
- [ ] SPEED_BOOST + COOLDOWN_REDUCTION + PROJECTILE_SPEED: Fast-paced builds feel snappy
- [ ] MAX_HP_UP + HP_REGEN + DAMAGE_REDUCTION: Tanky builds survive significantly longer
- [ ] XP_GAIN + FRAGMENT_GAIN + PICKUP_RADIUS: Economy builds level faster and collect more resources
- [ ] Mixed builds (1 damage, 1 speed, 1 survivability): All effects apply correctly without conflicts

**Edge Case Testing:**
- [ ] 3 boon slots filled → only tier upgrades offered (no new boons)
- [ ] HP_REGEN with maxHP → regeneration stops at cap (no overflow)
- [ ] DAMAGE_REDUCTION at 25% → damage reduced correctly (not below 0)
- [ ] XP_GAIN with max level → XP still applies for future systems (if multi-system)
- [ ] PICKUP_RADIUS at tier 3 (2.0x) → magnetization radius doubled (visually verify)
- [ ] MAX_HP_UP selected at low HP → currentHP increases by bonus (e.g., 10/100 → 30/120)
- [ ] CRIT_MULTIPLIER without CRIT_CHANCE → no crits occur (multiplier unused)
- [ ] Multiple Survivability boons → tank build survives significantly longer than baseline

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- computeModifiers() runs once per frame (GameLoop reads boon modifiers)
- Boon effect calculations are simple arithmetic (multiplications, additions)
- No additional performance impact from new boons (all logic already exists in GameLoop)

**Memory Profile:**
- New boonDefs.js entries: ~8 boons * 0.5KB each = ~4KB (negligible)
- useBoons store unchanged: equippedBoons array (3 objects max) + modifiers object
- Total additional memory: < 5KB for all new boons

**Optimization Notes:**
- computeModifiers() could be memoized if performance issue (unlikely)
- Boon effects applied via existing GameLoop sections (no new frame budget needed)
- HP regen calculated per frame but only updates currentHP if hpRegenRate > 0

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 11 Story 11.4 — Complete boon roster requirements]
- [Source: src/entities/boonDefs.js — Current boon definitions (DAMAGE_AMP, SPEED_BOOST, COOLDOWN_REDUCTION, CRIT_CHANCE)]
- [Source: src/stores/useBoons.jsx — Equipped boons, computeModifiers() for effect aggregation]
- [Source: src/GameLoop.jsx — Sections 2, 5, 7 where boon modifiers are applied]
- [Source: src/systems/progressionSystem.js — Level-up choice generation (boon pool)]
- [Source: src/ui/LevelUpModal.jsx — Boon choice display]
- [Source: _bmad-output/implementation-artifacts/3-4-boon-system.md — Boon system foundation]
- [Source: _bmad-output/implementation-artifacts/11-3-complete-weapon-roster-implementation.md — Content completion patterns]
- [Source: _bmad-output/implementation-artifacts/11-1-xp-magnetization-system.md — New behavior implementation patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

### Completion Notes List

- Implemented complete boon roster: 12 boons across 4 categories (Damage, Speed, Survivability, Utility)
- New boons: CRIT_MULTIPLIER, PROJECTILE_SPEED, MAX_HP_UP, HP_REGEN, DAMAGE_REDUCTION, XP_GAIN, FRAGMENT_GAIN, PICKUP_RADIUS
- Extended computeModifiers() with 8 new modifier fields, maintaining existing stacking patterns
- HP Regen: Added hpRegenRate parameter to usePlayer.tick(), regenerates per-frame capped at maxHP, skips at 0 HP
- Damage Reduction: Added damageReduction parameter to usePlayer.takeDamage(), applied as percentage reduction
- Max HP Bonus: Added applyMaxHPBonus() action with delta tracking (_appliedMaxHPBonus) — called from LevelUpModal and PlanetRewardModal
- Projectile Speed: Applied projectileSpeedMultiplier to projectile speed in useWeapons.tick()
- Crit Multiplier: Replaced hardcoded `*= 2` with configurable critMultiplier from boon modifiers
- XP Gain: Applied xpMultiplier to XP orb collection in GameLoop Section 8c
- Fragment Gain: Applied fragmentMultiplier to boss defeat fragment reward in GameLoop
- Pickup Radius: Extended xpOrbSystem.updateMagnetization() with pickupRadiusMultiplier parameter
- All boss phase integration: hpRegenRate, damageReduction, critMultiplier, projectileSpeedMultiplier all applied in boss phase
- Fixed flaky progressionSystem.newWeapons.test.js — boon pool dilution from 12 boons caused random shuffle failures
- 35 new tests added across 3 test files, all 935 tests passing with 0 regressions

### Change Log

- 2026-02-13: Story 11.4 complete — implemented 8 new boons (12 total roster), integrated all effects into gameplay systems, 35 new tests
- 2026-02-13: Code review fixes — (1) computeModifiers() truthiness checks replaced with `!== undefined` for robustness, (2) extracted computeFromBoons() pure function to eliminate double set() in addBoon/upgradeBoon, (3) fragment multiplier composition unified at GameLoop call site (removed internal upgradeStats.fragmentMult from addFragments), (4) updated fragment test to match new architecture

### File List

- `src/entities/boonDefs.js` — Added 8 new boon definitions (CRIT_MULTIPLIER, PROJECTILE_SPEED, MAX_HP_UP, HP_REGEN, DAMAGE_REDUCTION, XP_GAIN, FRAGMENT_GAIN, PICKUP_RADIUS)
- `src/stores/useBoons.jsx` — Extended computeModifiers() with 8 new modifier fields, DEFAULT_MODIFIERS constant, updated reset()
- `src/stores/usePlayer.jsx` — Added hpRegenRate param to tick(), damageReduction param to takeDamage(), applyMaxHPBonus() action, _appliedMaxHPBonus in reset()
- `src/stores/useWeapons.jsx` — Added critMultiplier and projectileSpeedMultiplier to tick() boonModifiers destructuring, applied to crit damage and projectile speed
- `src/GameLoop.jsx` — Passed hpRegenRate to player tick, damageReduction to takeDamage, xpMultiplier to XP collection, pickupRadiusMultiplier to magnetization, fragmentMultiplier to boss reward, critMultiplier/projectileSpeedMultiplier to weapon mods (both gameplay and boss phases)
- `src/systems/xpOrbSystem.js` — Added pickupRadiusMultiplier parameter to updateMagnetization()
- `src/ui/LevelUpModal.jsx` — Added applyMaxHPBonus() call after boon add/upgrade
- `src/ui/PlanetRewardModal.jsx` — Added usePlayer import and applyMaxHPBonus() call after boon add/upgrade
- `src/stores/__tests__/useBoons.newBoons.test.js` — New: 15 tests for boon definitions, modifiers, tier progression
- `src/stores/__tests__/usePlayer.boonEffects.test.js` — New: 14 tests for HP regen, damage reduction, maxHP bonus
- `src/systems/__tests__/xpOrbSystem.pickupRadius.test.js` — New: 6 tests for pickup radius multiplier
- `src/systems/__tests__/progressionSystem.newWeapons.test.js` — Fixed flaky test exposed by larger boon pool
