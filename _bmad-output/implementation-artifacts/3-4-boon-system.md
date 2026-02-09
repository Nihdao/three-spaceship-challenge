# Story 3.4: Boon System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to equip up to 3 boons that provide global passive effects to all my weapons,
So that I can enhance my build with synergistic bonuses and feel increasingly powerful.

## Acceptance Criteria

1. **Given** the useBoons store **When** the game starts **Then** no boons are equipped and 3 slots are available

2. **Given** the player selects a boon from level-up **When** an empty boon slot exists **Then** the boon is added to the active boons **And** its effect is immediately computed and applied globally

3. **Given** boonDefs.js contains boon definitions **When** boons are defined **Then** at least 3-4 boon types exist (e.g., SPEED_BOOST, DAMAGE_AMP, CRIT_CHANCE, COOLDOWN_REDUCTION) with clear effect values **And** each boon definition includes stacking rules (if the same boon is offered again at higher level)

4. **Given** active boons exist **When** useBoons computes modifiers **Then** the computed modifiers (damage multiplier, speed multiplier, cooldown multiplier, etc.) are available for GameLoop to pass to useWeapons.tick() **And** boon effects apply to ALL equipped weapons globally

## Tasks / Subtasks

- [x] Task 1: Extend boonDefs.js with complete boon definitions and stacking rules (AC: #3)
  - [x] 1.1: Add stacking tiers (levels 1-3) to DAMAGE_AMP with escalating damageMultiplier (e.g., 1.15 / 1.30 / 1.50)
  - [x] 1.2: Add stacking tiers (levels 1-3) to SPEED_BOOST with escalating speedMultiplier (e.g., 1.20 / 1.35 / 1.50)
  - [x] 1.3: Add stacking tiers (levels 1-3) to COOLDOWN_REDUCTION with escalating cooldownMultiplier (e.g., 0.85 / 0.72 / 0.60)
  - [x] 1.4: Add stacking tiers (levels 1-3) to CRIT_CHANCE with escalating critChance (e.g., 0.10 / 0.20 / 0.30)
  - [x] 1.5: Each boon definition includes `maxLevel`, `tiers` array with per-level effect values, `name`, `description` (updated per level), and `statPreview` string for level-up UI display

- [x] Task 2: Implement computeModifiers in useBoons store (AC: #2, #4)
  - [x] 2.1: Implement `computeModifiers()` — iterate activeBoons, read each boon's current effect from boonDefs (based on boon level), aggregate into a single modifiers object: `{ damageMultiplier, speedMultiplier, cooldownMultiplier, critChance }`
  - [x] 2.2: Multiplicative stacking for multipliers (damageMultiplier starts at 1.0, multiply by each boon's value). Additive stacking for critChance (sum of all crit chance values, capped at 1.0)
  - [x] 2.3: Store computed modifiers in `useBoons` state so GameLoop can read them via `getState().modifiers`
  - [x] 2.4: `computeModifiers()` is called automatically after `addBoon()` and after `upgradeBoon()`

- [x] Task 3: Update useBoons store with boon level tracking and upgrade support (AC: #2, #3)
  - [x] 3.1: Modify `addBoon()` to store `{ boonId, level: 1 }` in activeBoons (instead of just `{ boonId }`)
  - [x] 3.2: Add `upgradeBoon(boonId)` action — increments boon level (up to maxLevel from boonDefs), then calls `computeModifiers()`
  - [x] 3.3: Update `getEquippedBoonIds()` to also return levels if needed, or add `getEquippedBoons()` returning `[{ boonId, level }]`

- [x] Task 4: Integrate boon modifiers into weapon firing via GameLoop (AC: #4)
  - [x] 4.1: In GameLoop step 3 (weapons fire), read boon modifiers from `useBoons.getState().modifiers`
  - [x] 4.2: Pass boon modifiers to `useWeapons.getState().tick()` as an additional parameter
  - [x] 4.3: In `useWeapons.tick()`, apply `damageMultiplier` to projectile damage, `cooldownMultiplier` to weapon cooldown reset value
  - [x] 4.4: Apply `critChance` — on each projectile spawn, roll Math.random() < critChance, if true, double the damage for that projectile

- [x] Task 5: Integrate speed boon into player movement (AC: #4)
  - [x] 5.1: In GameLoop step 2 (player movement), read boon modifiers from `useBoons.getState().modifiers`
  - [x] 5.2: Pass `speedMultiplier` to `usePlayer.getState().tick()` as an additional parameter
  - [x] 5.3: In `usePlayer.tick()`, multiply `PLAYER_BASE_SPEED` by the speedMultiplier when computing target velocity

- [x] Task 6: Update progressionSystem.js for boon upgrade choices (AC: #3)
  - [x] 6.1: In `generateChoices()`, add boon upgrade options for equipped boons that are below maxLevel — type `'boon_upgrade'`, include current level and statPreview showing the improvement
  - [x] 6.2: Boon upgrades should be in the pool alongside weapon upgrades and new weapon/boon options

- [x] Task 7: Update LevelUpModal to handle boon upgrade choice application (AC: #2)
  - [x] 7.1: In `applyChoice()`, add case for `choice.type === 'boon_upgrade'` — call `useBoons.getState().upgradeBoon(choice.id)`

- [x] Task 8: Write/extend unit tests (AC: #1-#4)
  - [x] 8.1: Test computeModifiers — add DAMAGE_AMP boon, verify modifiers.damageMultiplier equals boonDefs value
  - [x] 8.2: Test multiple boons — add DAMAGE_AMP + COOLDOWN_REDUCTION, verify both modifiers computed correctly
  - [x] 8.3: Test boon upgrade — add boon at level 1, upgrade to level 2, verify modifiers update to level 2 values
  - [x] 8.4: Test upgrade cap — upgrade boon to maxLevel, verify further upgrades are rejected
  - [x] 8.5: Test crit chance additive stacking — add multiple crit boons, verify critChance is sum (capped at 1.0)
  - [x] 8.6: Test computeModifiers auto-called after addBoon and upgradeBoon
  - [x] 8.7: Test progressionSystem generates boon_upgrade choices for equipped boons below maxLevel
  - [x] 8.8: Test weapon tick with boon modifiers — verify damage and cooldown are modified correctly
  - [x] 8.9: Test player tick with speed modifier — verify movement speed is multiplied

- [x] Task 9: Verification (AC: #1-#4)
  - [x] 9.1: Start game — verify no boons equipped, 3 slots available (verified via unit test: useBoons starts empty with 3 max slots)
  - [x] 9.2: Level up and select a boon — verify it appears in activeBoons and modifiers are computed (verified via unit tests: addBoon + auto computeModifiers)
  - [x] 9.3: Level up again and select a boon upgrade — verify boon level increases and modifiers update (verified via unit tests: upgradeBoon + modifiers update)
  - [x] 9.4: Equip 3 boons — verify no more boon slots available (verified via unit test: cap at 3 boons)
  - [x] 9.5: Verify weapon damage is increased when DAMAGE_AMP boon is active (verified via unit test: damageMultiplier applied to projectile)
  - [x] 9.6: Verify weapon cooldown is reduced when COOLDOWN_REDUCTION boon is active (verified via unit test: cooldownMultiplier applied to weapon cooldown)
  - [x] 9.7: Verify player moves faster when SPEED_BOOST boon is active (verified via unit test: speedMultiplier produces faster movement)
  - [x] 9.8: Verify game restart resets all boons back to empty (verified via unit test: reset() clears activeBoons and modifiers; GameLoop reset block already calls useBoons.reset())

## Dev Notes

### Mockup References

**Mockup** (`3-4-Boon-UI-Choice-Example.jpg`) — Roguelite boon/shrine UI reference:
- Shows a "Charge Shrine" modal with passive upgrade options: "Gain 8% Duration", "Gain 8% Size", "Gain 5% Luck"
- Each option has a rarity label ("Common") and clear description
- "Ignore Offers" option at the bottom for player choice
- Key takeaway for this story: boon effects should be clearly communicated with percentage values in descriptions. The level-up UI already handles this via the `description` field in boonDefs — this story focuses on making the **backend** work (effect computation and application), not UI changes.

**Design adoption for Story 3.4:**
- Boon descriptions in boonDefs should include the exact effect percentage (e.g., "Increases all weapon damage by 15%") — already done in existing boonDefs
- For upgrade tiers, descriptions should update per level (e.g., "Increases all weapon damage by 30%" at level 2)
- The LevelUpModal from Story 3.2 already renders boon cards — only needs a new case for `boon_upgrade` type in applyChoice()

### Architecture Decisions

- **useBoons.computeModifiers() is the modifier aggregator** (Layer 3: Stores). It reads activeBoons + their levels, looks up effect values from boonDefs, and produces a single `modifiers` object. This object is read by GameLoop and passed to tick() functions as a parameter — stores never import other stores.

- **Boon effects apply through GameLoop parameter passing** — GameLoop reads `useBoons.getState().modifiers` and passes relevant values to `useWeapons.tick()` (damage/cooldown/crit) and `usePlayer.tick()` (speed). This follows the established architecture: GameLoop is the sole bridge between stores.

- **Multiplicative vs additive stacking:**
  - `damageMultiplier`, `speedMultiplier`, `cooldownMultiplier` — multiplicative (start at 1.0, multiply by each boon's value). Having multiple boons of the same type doesn't stack because of the duplicate guard in addBoon. Multiple different multiplier boons multiply together.
  - `critChance` — additive (sum all crit chances, cap at 1.0). Only one CRIT_CHANCE boon can be equipped due to duplicate guard, but boon levels increase the crit value.

- **Crit implementation is simple** — On projectile spawn in `useWeapons.tick()`, if `Math.random() < critChance`, the projectile damage is doubled. No separate crit system or crit visual needed for this story.

- **Boon level tracking** — Each entry in `activeBoons` stores `{ boonId, level }`. The `upgradeBoon()` action increments level and triggers `computeModifiers()`. This parallels how weapon upgrades work in useWeapons.

### Existing Infrastructure Ready

| Component | Status | Details |
|-----------|--------|---------|
| `useBoons.addBoon()` | Ready (needs level) | Adds boon, 3 slot cap, duplicate guard (Story 3.2 skeleton) |
| `useBoons.computeModifiers()` | Stub | Empty function — needs full implementation |
| `useBoons.reset()` | Ready | Resets activeBoons and modifiers |
| `useBoons.getEquippedBoonIds()` | Ready | Returns boon ID array for progressionSystem |
| `boonDefs.js` (4 boons) | Ready (needs tiers) | DAMAGE_AMP, SPEED_BOOST, COOLDOWN_REDUCTION, CRIT_CHANCE with basic effect values |
| `progressionSystem.js` | Ready (needs upgrade case) | Already generates `new_boon` choices — needs `boon_upgrade` for equipped boons |
| `LevelUpModal.jsx` | Ready (needs upgrade case) | Already calls `addBoon()` for `new_boon` — needs `boon_upgrade` → `upgradeBoon()` |
| `GameLoop.jsx` | Needs update | Already imports useBoons — needs to pass modifiers to weapon and player ticks |
| `useWeapons.tick()` | Needs update | Needs to accept and apply boon modifiers parameter |
| `usePlayer.tick()` | Needs update | Needs to accept and apply speed modifier parameter |
| `useBoons.test.js` | Ready | Basic tests exist — extend with modifier computation, upgrade, and stacking tests |

### Key Implementation Details

**boonDefs.js upgrade tiers (Task 1):**
```
export const BOONS = {
  DAMAGE_AMP: {
    id: 'DAMAGE_AMP',
    name: 'Damage Amp',
    maxLevel: 3,
    tiers: [
      { level: 1, description: 'Increases all weapon damage by 15%', effect: { damageMultiplier: 1.15 }, statPreview: 'Damage: +15%' },
      { level: 2, description: 'Increases all weapon damage by 30%', effect: { damageMultiplier: 1.30 }, statPreview: 'Damage: 15% -> 30%' },
      { level: 3, description: 'Increases all weapon damage by 50%', effect: { damageMultiplier: 1.50 }, statPreview: 'Damage: 30% -> 50%' },
    ],
  },
  // ... similar for SPEED_BOOST, COOLDOWN_REDUCTION, CRIT_CHANCE
}
```

Preserve backward compatibility: keep top-level `effect` field (level 1 default) so existing addBoon calls work. The `tiers` array provides per-level lookups.

**computeModifiers (Task 2):**
```
computeModifiers: () => {
  const { activeBoons } = get()
  let damageMultiplier = 1.0
  let speedMultiplier = 1.0
  let cooldownMultiplier = 1.0
  let critChance = 0.0

  for (const boon of activeBoons) {
    const def = BOONS[boon.boonId]
    if (!def) continue
    const tier = def.tiers?.[boon.level - 1]
    const effect = tier?.effect ?? def.effect
    if (effect.damageMultiplier) damageMultiplier *= effect.damageMultiplier
    if (effect.speedMultiplier) speedMultiplier *= effect.speedMultiplier
    if (effect.cooldownMultiplier) cooldownMultiplier *= effect.cooldownMultiplier
    if (effect.critChance) critChance += effect.critChance
  }

  critChance = Math.min(critChance, 1.0)
  set({ modifiers: { damageMultiplier, speedMultiplier, cooldownMultiplier, critChance } })
}
```

**GameLoop integration (Tasks 4 & 5):**
```
// Step 2: Player movement — pass speed modifier
const boonModifiers = useBoons.getState().modifiers
usePlayer.getState().tick(clampedDelta, input, boonModifiers.speedMultiplier ?? 1.0)

// Step 3: Weapons fire — pass boon modifiers
useWeapons.getState().tick(clampedDelta, playerPos, playerState.rotation, boonModifiers)
```

**useWeapons.tick() boon integration (Task 4):**
```
// In tick(delta, playerPosition, playerRotation, boonModifiers = {}):
const { damageMultiplier = 1, cooldownMultiplier = 1, critChance = 0 } = boonModifiers
// When resetting cooldown:
weapon.cooldownTimer = (weapon.overrides?.cooldown ?? def.baseCooldown) * cooldownMultiplier
// When computing damage:
let projDamage = damage * damageMultiplier
if (critChance > 0 && Math.random() < critChance) projDamage *= 2
```

**usePlayer.tick() speed integration (Task 5):**
```
// In tick(delta, input, speedMultiplier = 1):
const effectiveSpeed = PLAYER_BASE_SPEED * speedMultiplier
// Use effectiveSpeed instead of PLAYER_BASE_SPEED for target velocity
```

**progressionSystem boon_upgrade (Task 6):**
```
// After new boon pool, add upgrade options for equipped boons below maxLevel:
for (const boonId of equippedBoonIds) {
  const def = BOONS[boonId]
  if (!def) continue
  const equippedBoon = equippedBoons.find(b => b.boonId === boonId) // Need boon levels passed in
  if (!equippedBoon || equippedBoon.level >= (def.maxLevel || 1)) continue
  const nextTier = def.tiers?.[equippedBoon.level]
  if (!nextTier) continue
  pool.push({
    type: 'boon_upgrade',
    id: boonId,
    name: def.name,
    description: nextTier.description,
    level: nextTier.level,
    icon: null,
    statPreview: nextTier.statPreview || null,
  })
}
```

Note: `generateChoices()` signature needs to accept equipped boons with levels (change `equippedBoonIds` from string[] to `[{ boonId, level }]`), or add a separate parameter. The LevelUpModal already has access to useBoons state for this.

### Previous Story Intelligence (3.3)

**Learnings from Story 3.3 to apply:**
- **Overrides pattern is well-established** — useWeapons applies `weapon.overrides?.damage` and `weapon.overrides?.cooldown` from upgrade tiers. Boon modifiers should layer ON TOP of these overrides (multiply, not replace).
- **GameLoop already passes extra data to systems** — e.g., enemy positions to projectileSystem for homing. Adding boon modifiers as another parameter is the same pattern.
- **progressionSystem already handles new boons** — `new_boon` type is in the pool. Adding `boon_upgrade` follows the exact same pattern as `weapon_upgrade`.
- **LevelUpModal already dispatches addBoon** — Adding upgradeBoon dispatch is trivial (one new else-if case).
- **Code review pattern** — Expect review to flag: modifier application order, crit interaction with upgrade damage, test coverage for edge cases.
- **GameLoop reset block already calls `useBoons.getState().reset()`** — Restart flow is already handled.
- **Per-instance projectile colors are implemented** — ProjectileRenderer reads `p.color` and `p.meshScale` per projectile. Crit hits could get a visual indicator in a future story but is NOT in scope here.

### Git Intelligence

Recent commits follow pattern: `feat: <description> (Story X.Y)` for implementation commits. Key files from Story 3.3 that are relevant:
- `src/stores/useWeapons.jsx` — tick() signature will change (add boonModifiers param)
- `src/GameLoop.jsx` — will add modifier reading and passing
- `src/systems/progressionSystem.js` — will add boon_upgrade choices
- `src/entities/boonDefs.js` — will extend with stacking tiers
- `src/stores/useBoons.jsx` — core implementation target

Stories 3.1-3.3 are implemented but NOT committed (changes in git status). This means all code from Stories 3.1-3.3 is in the working tree and ready to build upon.

### Project Structure Notes

Files to modify:
- `src/entities/boonDefs.js` — Add stacking tiers (levels 1-3) to all 4 boon types
- `src/stores/useBoons.jsx` — Implement computeModifiers(), add upgradeBoon(), update addBoon() to store level
- `src/GameLoop.jsx` — Read boon modifiers, pass to useWeapons.tick() and usePlayer.tick()
- `src/stores/useWeapons.jsx` — Accept boonModifiers parameter in tick(), apply damage/cooldown/crit
- `src/stores/usePlayer.jsx` — Accept speedMultiplier parameter in tick(), apply to movement
- `src/systems/progressionSystem.js` — Add boon_upgrade choices for equipped boons below maxLevel
- `src/ui/LevelUpModal.jsx` — Add boon_upgrade case in applyChoice()
- `src/stores/__tests__/useBoons.test.js` — Extend with modifier computation, upgrade, stacking tests

Files NOT to modify:
- `src/renderers/ProjectileRenderer.jsx` — No visual changes for boons
- `src/renderers/XPOrbRenderer.jsx` — No XP changes
- `src/renderers/EnemyRenderer.jsx` — No enemy changes
- `src/scenes/GameplayScene.jsx` — No scene changes
- `src/systems/collisionSystem.js` — No collision changes
- `src/systems/xpOrbSystem.js` — No XP changes
- `src/systems/spawnSystem.js` — No spawn changes
- `src/stores/useEnemies.jsx` — No enemy state changes
- `src/stores/useGame.jsx` — No phase management changes
- `src/config/gameConfig.js` — No new config constants needed (boon values live in boonDefs)

### Anti-Patterns to Avoid

- Do NOT import useBoons inside useWeapons or usePlayer — pass modifiers as parameters from GameLoop
- Do NOT create a separate boon system module — boon modifier computation stays in useBoons store (Layer 3)
- Do NOT add per-boon visual effects to projectiles — that's out of scope
- Do NOT modify weapon upgrade logic — boon modifiers are applied as a separate multiplication layer on top of weapon overrides
- Do NOT add HP regeneration or shield boon types — only the 4 existing boon types are in scope
- Do NOT modify the LevelUpModal UI layout — only add the upgradeBoon dispatch case
- Do NOT add boon-related config to gameConfig.js — boon values belong in boonDefs.js (entity definitions pattern)
- Do NOT create new Three.js objects or materials for boon effects — this story is pure game logic
- Do NOT add sound effects — that's Story 4.5

### Testing Approach

- **Unit tests (useBoons):** computeModifiers for each boon type individually, multiple boons combined, upgrade level changes, maxLevel cap, crit chance cap at 1.0, auto-recompute after addBoon/upgradeBoon
- **Unit tests (useWeapons):** tick() with boon modifiers — damage multiplied, cooldown reduced, crit chance applied
- **Unit tests (usePlayer):** tick() with speed multiplier — movement speed increased
- **Unit tests (progressionSystem):** boon_upgrade choices generated for equipped boons, not generated for maxed boons
- **Integration:** Browser verification — equip boons, verify weapon damage increases, cooldown decreases, movement speed increases

### References

- [Source: src/stores/useBoons.jsx] — Skeleton store with addBoon(), getEquippedBoonIds(), empty computeModifiers()
- [Source: src/entities/boonDefs.js] — 4 boon definitions with basic effect objects (no tiers yet)
- [Source: src/stores/useWeapons.jsx] — tick() fires projectiles with damage from weapon overrides
- [Source: src/stores/usePlayer.jsx] — tick() applies PLAYER_BASE_SPEED for movement
- [Source: src/GameLoop.jsx] — Already imports useBoons, calls reset() in game start block
- [Source: src/systems/progressionSystem.js] — generateChoices() already includes new_boon type
- [Source: src/ui/LevelUpModal.jsx] — applyChoice() handles new_boon → addBoon()
- [Source: src/stores/__tests__/useBoons.test.js] — Basic tests for addBoon, cap, reset
- [Source: src/config/gameConfig.js] — No boon-specific constants needed
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4] — Acceptance criteria source
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — Inter-store communication via GameLoop
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Layer boundaries, naming conventions
- [Source: _bmad-output/implementation-artifacts/3-3-weapon-slots-upgrades.md] — Previous story learnings, weapon overrides pattern
- [Source: _bmad-output/planning-artifacts/mockups/3-4-Boon-UI-Choice-Example.jpg] — Roguelite boon UI reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered. All implementations followed the story Dev Notes pseudocode closely. 228 tests pass with 0 regressions (pre-review). Post-review: 231 tests pass after code review fixes.

### Completion Notes List

- Task 1: Extended all 4 boon definitions in boonDefs.js with `maxLevel: 3`, `tiers` array (3 levels each), per-tier `description`, `effect`, and `statPreview`. Preserved backward-compatible top-level `effect` field.
- Task 2: Implemented `computeModifiers()` in useBoons — iterates activeBoons, reads tier effects from boonDefs, aggregates multiplicative multipliers (damage, speed, cooldown) and additive critChance (capped at 1.0). Stored in state as `modifiers` object.
- Task 3: Updated `addBoon()` to store `{ boonId, level: 1 }`. Added `upgradeBoon(boonId)` with maxLevel cap. Added `getEquippedBoons()` returning `[{ boonId, level }]`. Both addBoon and upgradeBoon auto-call computeModifiers.
- Task 4: GameLoop reads `useBoons.getState().modifiers` and passes full boonModifiers object to `useWeapons.tick()`. Weapon tick applies damageMultiplier to projectile damage, cooldownMultiplier to cooldown reset, and critChance for 2x damage rolls.
- Task 5: GameLoop passes `speedMultiplier` to `usePlayer.tick()`. Player tick uses `effectiveSpeed = PLAYER_BASE_SPEED * speedMultiplier` for target velocity and acceleration calculations.
- Task 6: Added `equippedBoons` parameter to `generateChoices()`. Generates `boon_upgrade` choices for equipped boons below maxLevel with next tier's description and statPreview.
- Task 7: Added `boon_upgrade` case in LevelUpModal's `applyChoice()` — calls `useBoons.getState().upgradeBoon(choice.id)`. LevelUpModal now passes equippedBoons to generateChoices.
- Task 8: Extended useBoons tests (17 tests), added 4 weapon boon modifier tests, 2 player speed modifier tests, 4 progressionSystem boon_upgrade tests. Full suite: 228 tests passing.
- Task 9: All verification items confirmed via unit tests covering every AC.

### Change Log

- 2026-02-09: Implemented boon system — stacking tiers, modifier computation, GameLoop integration, progression upgrades, comprehensive tests (Story 3.4)
- 2026-02-09: Code review fixes — [H1] Fixed missing description for new_boon choices in progressionSystem.js (uses tiers[0].description + statPreview), [M1] Added 2 crit chance weapon tests (guaranteed crit + no crit), [M2] Added crit cap test that exercises Math.min at 1.0. Suite: 231 tests passing.

### File List

- `src/entities/boonDefs.js` — Modified: Added maxLevel, tiers array with 3 levels for all 4 boons
- `src/stores/useBoons.jsx` — Modified: Implemented computeModifiers(), upgradeBoon(), getEquippedBoons(), updated addBoon() with level tracking, import BOONS
- `src/GameLoop.jsx` — Modified: Read boon modifiers, pass to usePlayer.tick() and useWeapons.tick()
- `src/stores/useWeapons.jsx` — Modified: tick() accepts boonModifiers param, applies damageMultiplier, cooldownMultiplier, critChance
- `src/stores/usePlayer.jsx` — Modified: tick() accepts speedMultiplier param, uses effectiveSpeed for movement
- `src/systems/progressionSystem.js` — Modified: generateChoices() accepts equippedBoons param, generates boon_upgrade choices
- `src/ui/LevelUpModal.jsx` — Modified: applyChoice() handles boon_upgrade type, passes equippedBoons to generateChoices
- `src/stores/__tests__/useBoons.test.js` — Modified: Extended from 6 to 17 tests (computeModifiers, upgradeBoon, stacking, auto-compute)
- `src/stores/__tests__/useWeapons.test.js` — Modified: Added 4 boon modifier integration tests
- `src/stores/__tests__/usePlayer.rotation.test.js` — Modified: Added 2 speed boon modifier tests
- `src/systems/__tests__/progressionSystem.test.js` — Modified: Added 4 boon_upgrade choice tests, updated type validation
