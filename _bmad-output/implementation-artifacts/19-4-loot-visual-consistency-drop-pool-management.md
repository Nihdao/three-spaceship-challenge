# Story 19.4: Loot Visual Consistency & Drop Pool Management

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want loot drop logic centralized in a single lootSystem.js and visuals consistent across all collectible types,
so that the system is maintainable, drop behavior is easy to tune, and players can instantly distinguish loot types.

## Acceptance Criteria

1. **Given** lootSystem.js is created, **when** an enemy dies in GameLoop.jsx, **then** `lootSystem.rollDrops(enemyTypeId, x, z)` is called as the single entry point for all loot spawning, replacing the individual drop rolls scattered across the death handler.

2. **Given** rollDrops is called, **when** drop chances are evaluated, **then** each loot type is rolled independently (an enemy CAN drop both a rare XP gem AND a Fragment gem if both rolls succeed). Standard XP orb always drops (existing behavior). Rare XP gem replaces the standard orb when its roll succeeds.

3. **Given** drop chances are configured in gameConfig.js, **when** the LOOT config section is read, **then** all drop-related constants are grouped together in a single `LOOT` subsection: `RARE_XP_GEM_DROP_CHANCE`, `HEAL_GEM_DROP_CHANCE`, `FRAGMENT_DROP_CHANCE`, along with their value/amount constants.

4. **Given** all collectibles are on screen, **when** the player looks at them, **then** each type is immediately distinguishable by color:
   - Standard XP orb: cyan-green (#00ffcc)
   - Rare XP gem: golden-yellow (#ffdd00), 1.3x scale, pulse
   - Heal gem: red-pink (#ff3366), pulse animation
   - Fragment gem: purple (#cc66ff), pulse animation

5. **Given** the Fragment icon in the HUD (Interface.jsx), **when** displayed, **then** it uses purple (#cc66ff) matching the Fragment gem drops, not cyan.

6. **Given** loot rendering, **when** multiple collectible types exist, **then** each type uses its own InstancedMesh with object pooling, and the game maintains 60 FPS with 50+ mixed collectibles on screen.

7. **Given** lootSystem.js exports, **when** the game resets, **then** `lootSystem.resetAll()` clears all gem pools in one call (delegates to each subsystem's reset).

## Tasks / Subtasks

- [ ] Task 1: Create lootSystem.js — centralized drop logic (AC: #1, #2, #7)
  - [ ] Import spawnOrb from xpOrbSystem, spawnHealGem from healGemSystem, spawnGem from fragmentGemSystem
  - [ ] Import GAME_CONFIG for all drop chance/amount constants
  - [ ] Import ENEMIES from enemyDefs for xpReward lookup
  - [ ] `rollDrops(enemyTypeId, x, z)` — single entry point:
    - Look up `xpReward` from `ENEMIES[enemyTypeId]`
    - Roll rare XP gem: `Math.random() < RARE_XP_GEM_DROP_CHANCE`
      - If rare: `spawnOrb(x, z, xpReward * RARE_XP_GEM_MULTIPLIER, true)`
      - If not rare: `spawnOrb(x, z, xpReward, false)` (standard orb)
    - Roll heal gem: `Math.random() < HEAL_GEM_DROP_CHANCE`
      - If success: `spawnHealGem(x, z, HEAL_GEM_RESTORE_AMOUNT)`
    - Roll fragment gem: `Math.random() < FRAGMENT_DROP_CHANCE`
      - If success: `spawnGem(x, z, FRAGMENT_DROP_AMOUNT)`
  - [ ] `resetAll()` — calls resetOrbs(), resetHealGems(), resetFragmentGems()
  - [ ] Export rollDrops, resetAll

- [ ] Task 2: Consolidate LOOT config in gameConfig.js (AC: #3)
  - [ ] Group all loot constants into a clear LOOT section with comment header
  - [ ] Ensure constants exist (added by Stories 19.1-19.3): RARE_XP_GEM_DROP_CHANCE (0.10), RARE_XP_GEM_MULTIPLIER (3), HEAL_GEM_DROP_CHANCE (0.04), HEAL_GEM_RESTORE_AMOUNT (20), FRAGMENT_DROP_CHANCE (0.12), FRAGMENT_DROP_AMOUNT (1)
  - [ ] Add visual config constants if not already present: XP_ORB_COLOR ("#00ffcc"), RARE_XP_GEM_COLOR ("#ffdd00"), HEAL_GEM_COLOR ("#ff3366"), FRAGMENT_GEM_COLOR ("#cc66ff")
  - [ ] Add comment block documenting the color legend for quick reference

- [ ] Task 3: Refactor GameLoop.jsx death handler to use lootSystem (AC: #1)
  - [ ] Replace individual drop rolls in section 7c with single `rollDrops(event.enemy.typeId, event.enemy.x, event.enemy.z)` call
  - [ ] Remove direct imports of spawnOrb from GameLoop (lootSystem handles it)
  - [ ] Keep explosion spawn and kill counter in GameLoop (not loot-related)
  - [ ] Replace resetOrbs() (and resetHealGems/resetFragmentGems if present) with `lootSystem.resetAll()` in reset section

- [ ] Task 4: Fix Fragment HUD color to purple (AC: #5)
  - [ ] In Interface.jsx line ~352, change Fragment AnimatedStat from `colorClass="text-cyan-400"` to `style={{ color: '#cc66ff' }}`
  - [ ] Verify purple (#cc66ff) displays consistently

- [ ] Task 5: Verify visual consistency across all renderers (AC: #4, #6)
  - [ ] Verify XPOrbRenderer uses #00ffcc for standard orbs and #ffdd00 for rare (per-instance color from Story 19.1)
  - [ ] Verify HealGemRenderer uses #ff3366 (Story 19.2)
  - [ ] Verify FragmentGemRenderer uses #cc66ff (Story 19.3)
  - [ ] Verify each renderer uses its own InstancedMesh with proper pool capacity
  - [ ] Run visual test: spawn all 4 collectible types simultaneously, confirm instant visual distinction

- [ ] Task 6: Write tests for lootSystem.js (AC: #1, #2, #7)
  - [ ] Test rollDrops always spawns standard XP orb when xpReward > 0
  - [ ] Test rollDrops spawns rare XP gem (3x value, isRare=true) when rare roll succeeds, replacing standard orb
  - [ ] Test rollDrops spawns heal gem when heal roll succeeds (independent of other rolls)
  - [ ] Test rollDrops spawns fragment gem when fragment roll succeeds (independent of other rolls)
  - [ ] Test rollDrops can spawn multiple loot types from one enemy death (e.g., rare XP + fragment)
  - [ ] Test rollDrops with unknown enemyTypeId defaults to 0 xpReward gracefully
  - [ ] Test resetAll calls all subsystem resets

## Dev Notes

### Architecture Compliance — 6-Layer Pattern

| Layer | Component | Action |
|-------|-----------|--------|
| Config/Data | `gameConfig.js` | Consolidate LOOT section with all drop/visual constants |
| Systems | `lootSystem.js` (**NEW**) | Centralized drop logic — single entry point for all loot spawning |
| Systems | `xpOrbSystem.js` | No changes (already extended by Story 19.1 with isRare) |
| Systems | `healGemSystem.js` | No changes (created by Story 19.2) |
| Systems | `fragmentGemSystem.js` | No changes (created by Story 19.3) |
| GameLoop | `GameLoop.jsx` | Replace scattered drop rolls with single `rollDrops()` call |
| Rendering | All gem renderers | Verify color consistency only — no code changes expected |
| UI | `Interface.jsx` | Fix Fragment icon color to purple |

### Prerequisites — Stories 19.1, 19.2, 19.3 Must Be Done First

This story depends on all three previous stories being implemented:

- **Story 19.1** creates: `isRare` field in xpOrbSystem, rare XP gem visual in XPOrbRenderer, rare drop roll in GameLoop
- **Story 19.2** creates: `healGemSystem.js`, `HealGemRenderer.jsx`, `CATEGORY_HEAL_GEM`, heal drop roll in GameLoop
- **Story 19.3** creates: `fragmentGemSystem.js`, `FragmentGemRenderer.jsx`, `CATEGORY_FRAGMENT_GEM`, fragment drop roll in GameLoop

Story 19.4 **centralizes** the three separate drop rolls from those stories into a single `lootSystem.rollDrops()` call.

### lootSystem.js Design

The system is a thin orchestration layer — it does NOT manage pools or rendering. It delegates to existing subsystems:

```
lootSystem.rollDrops(enemyTypeId, x, z)
  ├── Lookup xpReward from ENEMIES[enemyTypeId]
  ├── Roll rare XP gem → spawnOrb(x, z, value, isRare)
  │   └── OR standard XP orb → spawnOrb(x, z, value, false)
  ├── Roll heal gem → spawnHealGem(x, z, amount)
  └── Roll fragment gem → spawnGem(x, z, amount)
```

Key design decisions:
- **Rare XP replaces standard**: When rare roll succeeds, it replaces the standard orb (not additive). This matches Story 19.1 AC #1 ("drops instead of a standard XP orb").
- **Heal + Fragment are independent**: Both can drop from the same enemy death. This adds exciting multi-drop moments.
- **No weighted/exclusive system**: Each roll is a simple `Math.random() < chance` — independent probability per type. This is simpler and more transparent than a weighted pool.

### GameLoop.jsx Refactoring

**Before (after Stories 19.1-19.3, scattered in section 7c):**
```javascript
for (const event of deathEvents) {
  if (event.killed) {
    addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
    playSFX('explosion')
    // 19.1: rare XP roll
    const xpReward = ENEMIES[event.enemy.typeId]?.xpReward ?? 0
    if (xpReward > 0) {
      const isRare = Math.random() < RARE_XP_GEM_DROP_CHANCE
      spawnOrb(x, z, isRare ? xpReward * RARE_XP_GEM_MULTIPLIER : xpReward, isRare)
    }
    // 19.2: heal gem roll
    if (Math.random() < HEAL_GEM_DROP_CHANCE) spawnHealGem(x, z, HEAL_GEM_RESTORE_AMOUNT)
    // 19.3: fragment roll
    if (Math.random() < FRAGMENT_DROP_CHANCE) spawnGem(x, z, FRAGMENT_DROP_AMOUNT)
    useGame.getState().incrementKills()
    useGame.getState().addScore(SCORE_PER_KILL)
  }
}
```

**After (Story 19.4 — clean single call):**
```javascript
for (const event of deathEvents) {
  if (event.killed) {
    addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
    playSFX('explosion')
    rollDrops(event.enemy.typeId, event.enemy.x, event.enemy.z)
    useGame.getState().incrementKills()
    useGame.getState().addScore(SCORE_PER_KILL)
  }
}
```

This reduces the death handler from ~10 lines of drop logic to 1 line. The drop logic lives in `lootSystem.js` where it can be tested in isolation.

### Reset Consolidation

**Before (scattered):**
```javascript
resetOrbs()
resetHealGems()
resetFragmentGems()
```

**After:**
```javascript
lootSystem.resetAll()
```

### Color Legend (for gameConfig.js comment)

```
// LOOT COLOR LEGEND:
// Standard XP orb:  #00ffcc (cyan-green)
// Rare XP gem:      #ffdd00 (golden-yellow) — 1.3x scale, pulse
// Heal gem:         #ff3366 (red-pink) — pulse animation
// Fragment gem:     #cc66ff (purple) — pulse animation
// Fragment HUD icon: #cc66ff (purple) — must match gem color
```

### HUD Fragment Color Fix

In `src/ui/Interface.jsx` line ~352:
```javascript
// BEFORE:
<AnimatedStat value={fragments} icon="◆" colorClass="text-cyan-400" label="fragments" />

// AFTER:
<AnimatedStat value={fragments} icon="◆" style={{ color: '#cc66ff' }} label="fragments" />
```

Note: Check if AnimatedStat supports `style` prop. If not, either add a `style` prop pass-through or use a custom CSS class. The `colorClass` prop uses Tailwind utility classes — `#cc66ff` has no Tailwind equivalent, so inline style or a custom class in `style.css` is needed.

### Existing Collision/Magnetization — No Changes

Story 19.4 does NOT touch collision detection or magnetization logic. Those remain in GameLoop.jsx sections 8a-8c, handled per-subsystem (XP orbs, heal gems, fragment gems). Only the DROP SPAWNING is centralized, not collection/pickup.

### Performance Notes

After all 19.x stories, total collectible budget:
- MAX_XP_ORBS = 50 (includes rare gems in same pool)
- MAX_HEAL_GEMS = 30
- MAX_FRAGMENT_GEMS = 20
- **Total: 100 instances across 3 InstancedMesh draw calls**

This is well within the performance budget. lootSystem.js adds zero overhead — it's a pure function that delegates to existing spawn functions.

### Testing Strategy

lootSystem.js tests should mock the subsystem spawn functions to verify:
1. Correct spawn function is called with correct arguments
2. Drop rolls respect config probabilities (use deterministic Math.random seeding or mock)
3. Rare XP replaces standard (mutually exclusive within XP type)
4. Heal and Fragment are independent (both can fire)
5. Edge case: enemy with 0 xpReward still rolls heal/fragment but skips XP orb
6. resetAll delegates to all three subsystem resets

Test file: `src/systems/__tests__/lootSystem.test.js`

### Project Structure Notes

- `src/systems/lootSystem.js` — NEW file, follows systems layer convention
- `src/systems/__tests__/lootSystem.test.js` — NEW test file
- All other changes are modifications to existing files
- No new directories needed

### References

- [Source: src/GameLoop.jsx#L476-489] — Enemy death handler (section 7c) to refactor
- [Source: src/GameLoop.jsx#L574-603] — XP orb collection (section 8) — NOT touched by this story
- [Source: src/systems/xpOrbSystem.js] — spawnOrb API (extended by 19.1 with isRare param)
- [Source: src/systems/collisionSystem.js#L4-21] — CATEGORY constants and COLLISION_PAIRS
- [Source: src/config/gameConfig.js#L18-30] — XP_ORB and magnet constants
- [Source: src/ui/Interface.jsx#L352] — Fragment HUD display (cyan → purple fix)
- [Source: src/entities/enemyDefs.js] — ENEMIES dict with xpReward per type
- [Source: _bmad-output/implementation-artifacts/19-1-rare-xp-gem-drops.md] — Rare XP gem story
- [Source: _bmad-output/implementation-artifacts/19-2-heal-gem-drops.md] — Heal gem story
- [Source: _bmad-output/implementation-artifacts/19-3-fragment-drops.md] — Fragment gem story
- [Source: _bmad-output/planning-artifacts/epic-19-enemy-loot-system.md] — Epic context

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
