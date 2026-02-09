# Story 3.2: Level-Up System & Choice UI

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the game to pause when I level up and present me with 3-4 upgrade choices that I can quickly select with keyboard,
So that I can make meaningful build decisions without losing gameplay momentum.

## Acceptance Criteria

1. **Given** the player's XP reaches the level threshold **When** a level-up triggers **Then** the gameplay pauses (GameLoop stops ticking) **And** a level-up modal appears with overlay dark 60% over the frozen gameplay **And** the modal displays "LEVEL UP!" title and 3-4 choice cards

2. **Given** the level-up modal is displayed **When** `progressionSystem.js` generates the choice pool **Then** options include a mix of new weapons (if slots available), weapon upgrades (for equipped weapons), and new boons (if slots available) **And** each card shows: icon, name, level (or "NEW"), and short description

3. **Given** the choice cards are displayed **When** the player presses 1, 2, 3, or 4 **Then** the corresponding choice is applied immediately **And** the modal closes with fade-out animation **And** gameplay resumes instantly

4. **Given** the modal animation **When** it appears **Then** the modal fades in and cards appear in cascade (50ms delay each) per UX spec **And** no frame drops occur during the modal display (NFR5)

## Tasks / Subtasks

- [x] Task 1: Create progressionSystem.js — level-up choice generation (AC: #2)
  - [x] 1.1: Create `src/systems/progressionSystem.js` as a pure logic system (Layer 2)
  - [x] 1.2: Implement `generateChoices(currentLevel, equippedWeapons, equippedBoons)` that returns 3-4 choice objects
  - [x] 1.3: Choice pool logic: include weapon upgrades for equipped weapons (if < max level 9), new weapons from weaponDefs (if weapon slots available < 4), new boons from boonDefs (if boon slots available < 3)
  - [x] 1.4: Each choice object: `{ type: 'weapon_upgrade' | 'new_weapon' | 'new_boon', id: string, name: string, description: string, level: number | null, icon: string, statPreview: string | null }` — statPreview shows key stat change for upgrades (e.g., "Damage: 10 → 12") per mockup reference, null for new items
  - [x] 1.5: Randomize and deduplicate choices — no duplicates in a single offering
  - [x] 1.6: Fallback: if not enough options to fill 3 cards, pad with stat boosts or repeat weapon upgrades at different tiers

- [x] Task 2: Implement level-up trigger in GameLoop (AC: #1)
  - [x] 2.1: In GameLoop step 8e, when `pendingLevelUp` is true, call `usePlayer.getState().consumeLevelUp()` and then `useGame.getState().triggerLevelUp()`
  - [x] 2.2: Verify that `triggerLevelUp()` sets `phase: 'levelUp'` and `isPaused: true` — this freezes the GameLoop tick (already checks `isPaused` at line 66)
  - [x] 2.3: Verify that Experience.jsx renders GameplayScene during `levelUp` phase (already true at line 22: `phase === 'levelUp'`)

- [x] Task 3: Create LevelUpModal UI component (AC: #1, #3, #4)
  - [x] 3.1: Create `src/ui/LevelUpModal.jsx` — HTML overlay component (Layer 6: UI)
  - [x] 3.2: Render a full-screen overlay with `bg-black/60` backdrop over the frozen 3D canvas
  - [x] 3.3: Display "LEVEL UP!" title (H1, bold, tracking wide, centered)
  - [x] 3.4: Display 3-4 choice cards in a horizontal row, centered
  - [x] 3.5: Each card shows: name, level badge ("NEW" in accent color for new items, or "Lvl N" for upgrades — per mockup pattern), short description for new items, stat preview for upgrades (e.g., "Damage: 10 → 12"), and keyboard shortcut indicator ([1], [2], [3], [4])
  - [x] 3.6: Card styling: `bg-game-bg-medium`, `border border-game-border`, hover/focus = `border-game-accent`, selected = `scale-105`. "NEW" badge styled with `text-game-accent font-bold` to match mockup orange/accent highlight
  - [x] 3.7: Cascade animation: each card appears with `animate-fade-in` + 50ms stagger delay (use inline style `animationDelay`)
  - [x] 3.8: Use Tailwind design tokens from style.css (`game-bg-medium`, `game-border`, `game-accent`, `game-text`, `font-game`)

- [x] Task 4: Implement keyboard selection (AC: #3)
  - [x] 4.1: Add keydown event listener in LevelUpModal (attach on mount, remove on unmount)
  - [x] 4.2: Listen for keys "1", "2", "3", "4" (and "Digit1"..."Digit4" for KeyboardEvent.code)
  - [x] 4.3: On valid key press: apply the choice, close modal, resume gameplay
  - [x] 4.4: Apply choice via `applyChoice(choice)` function that dispatches to the correct store action based on `choice.type`

- [x] Task 5: Implement choice application logic (AC: #3)
  - [x] 5.1: For `weapon_upgrade`: call `useWeapons.getState().upgradeWeapon(weaponId)` — need to create this action
  - [x] 5.2: For `new_weapon`: call `useWeapons.getState().addWeapon(weaponId)` — need to create this action
  - [x] 5.3: For `new_boon`: call `useBoons.getState().addBoon(boonId)` — need to create this action
  - [x] 5.4: After applying choice, call `useGame.getState().resumeGameplay()` to set phase back to 'gameplay' and isPaused to false

- [x] Task 6: Extend useWeapons store with new actions (AC: #2, #3)
  - [x] 6.1: Add `addWeapon(weaponId)` — push new weapon to activeWeapons (slots 2-4), cap at 4 total
  - [x] 6.2: Add `upgradeWeapon(weaponId)` — increment weapon level, apply stat changes from weaponDefs upgrades array
  - [x] 6.3: Add `getEquippedWeaponIds()` — returns array of weaponId strings for progression system
  - [x] 6.4: Add `getWeaponLevel(weaponId)` — returns current level of equipped weapon

- [x] Task 7: Extend useBoons store with addBoon action (AC: #2, #3)
  - [x] 7.1: Add `addBoon(boonId)` — push new boon to activeBoons, cap at 3 total
  - [x] 7.2: Add `getEquippedBoonIds()` — returns array of boonId strings for progression system

- [x] Task 8: Populate entity definitions for choice variety (AC: #2)
  - [x] 8.1: Add 2-3 additional weapons to weaponDefs.js (e.g., SPREAD_SHOT, MISSILE_HOMING) with complete stats + upgrade arrays — these are needed for "new weapon" choices. Include basic upgrade tiers (at least levels 2-3)
  - [x] 8.2: Add 3-4 boons to boonDefs.js (e.g., DAMAGE_AMP, SPEED_BOOST, COOLDOWN_REDUCTION, CRIT_CHANCE) with effect descriptions — these are needed for "new boon" choices
  - [x] 8.3: Add LASER_FRONT upgrade tiers to weaponDefs.js (levels 2-5 minimum) — needed for "weapon upgrade" choices

- [x] Task 9: Mount LevelUpModal in app overlay (AC: #1)
  - [x] 9.1: Add an HTML overlay container in `src/index.jsx` OUTSIDE the `<Canvas>` but inside `<KeyboardControls>` — this is where UI overlays render
  - [x] 9.2: Create `src/ui/Interface.jsx` as the root UI overlay component that conditionally renders LevelUpModal based on useGame phase
  - [x] 9.3: Mount `<Interface />` in the overlay container alongside the Canvas

- [x] Task 10: Verification (AC: #1, #2, #3, #4)
  - [x] 10.1: Kill enemies until XP threshold triggers level-up — verify gameplay pauses and modal appears
  - [x] 10.2: Verify 3-4 choice cards display with correct info (name, level, description)
  - [x] 10.3: Press 1/2/3/4 — verify choice applies and gameplay resumes instantly
  - [x] 10.4: Verify cascade animation (cards appear with stagger, no frame drops)
  - [x] 10.5: Verify multiple level-ups work (second level-up after more XP collection)
  - [x] 10.6: Verify no input bleeding — WASD does not move ship during modal, number keys don't fire during gameplay
  - [x] 10.7: Verify game restart resets weapons/boons back to initial state

## Dev Notes

### Mockup References

Two Vampire Survivors mockups serve as visual design references for the Level-Up Modal:

**Mockup 1** (`3-2-LevelUp-UI-Choice-Example.jpg`) — Late-game upgrade offers:
- "UPGRADE OFFERS" title, 3 vertically stacked cards
- Each card shows: rarity label (Uncommon/Common), weapon icon, name, level badge ("LVL 24"), and stat changes in **old → new** format (e.g., "Size: 520% → 544%", "Damage: 63 → 65.4")
- Bottom action buttons: BANISH, SKIP, REFRESH (with key hints and gold cost)
- Side panels: Inventory (left), Stats (right)

**Mockup 2** (`3-2-LevelUp-UI-Choice-Example2.jpg`) — Early-game level up:
- "Level Up!" title, 3 vertically stacked cards in centered panel
- New items show **"New!" badge** (orange) + description text (e.g., "Fires quickly in four fixed directions.")
- Upgrade items show stat changes
- Right-side buttons: REROLL, SKIP, BANISH (each with remaining uses count)

**Design elements to adopt:**
- Card info architecture: **"NEW" badge** for new weapons/boons, **level badge** ("Lvl N") for upgrades
- **Stat preview** for upgrades showing key stat changes (e.g., "Damage: 10 → 12") — adds informed decision-making
- **Description text** for new weapons/boons explaining what they do
- Title "LEVEL UP!" centered at top

**Design elements to skip (out of scope for Story 3.2):**
- SKIP/REROLL/BANISH buttons — these are late-game VS features, not needed in our simplified version
- Rarity labels — our weapons/boons don't have rarity tiers yet
- Inventory/Stats side panels — out of scope (HUD is Story 4.2)
- Vertical card stacking — our UX spec calls for horizontal layout (3-4 cards side by side); VS uses vertical because it has up to 4+ choices with detailed stat blocks. With our 3-4 simpler cards, horizontal layout fits better for a widescreen space game

### Architecture Decisions

- **progressionSystem.js is a pure system** (Layer 2: Systems). It takes equipped state as input parameters and returns choice objects. It NEVER imports stores — the GameLoop or UI component calls it with data from stores. This keeps it testable and follows the architecture boundary rules.

- **LevelUpModal is an HTML overlay** (Layer 6: UI), rendered OUTSIDE the R3F Canvas. It reads from stores via Zustand selectors and dispatches actions. It NEVER touches Three.js objects or useFrame. Per architecture: "UI never accesses Three.js objects."

- **Interface.jsx pattern** — There is currently no HTML overlay system. This story introduces `Interface.jsx` as the root overlay that conditionally renders UI based on game phase. This is the first UI component and establishes the pattern for future UI (HUD, GameOver, MainMenu in Epic 4).

- **Phase-based pause** — The level-up uses `useGame.triggerLevelUp()` which sets `phase: 'levelUp'` and `isPaused: true`. The GameLoop already checks `isPaused` at line 66 and returns early. Experience.jsx already renders GameplayScene during `levelUp` phase (line 22). This means the 3D scene stays visible (frozen) behind the modal overlay — exactly matching the UX spec "overlay dark 60% over frozen gameplay."

- **Weapon upgrades are minimal for this story** — Story 3.3 handles the full weapon slot system with 4 slots and 9 levels. This story only needs enough to demonstrate choice variety: 2-3 weapon types, basic upgrade tiers. Don't over-engineer weapon upgrade logic — Story 3.3 will expand it.

- **Boons are stubs for this story** — Story 3.4 handles the full boon system. This story only needs `addBoon()` and basic boon definitions to show boon cards in the modal. Boon effects computation is Story 3.4's job.

### Existing Infrastructure Ready

| Component | Status | Details |
|-----------|--------|---------|
| `pendingLevelUp` in usePlayer | Ready | Set by `addXP()` when XP threshold crossed (Story 3.1) |
| `consumeLevelUp()` in usePlayer | Ready | Returns true once and clears flag |
| `triggerLevelUp()` in useGame | Ready | Sets `phase: 'levelUp'`, `isPaused: true` |
| `resumeGameplay()` in useGame | Ready | Sets `phase: 'gameplay'`, `isPaused: false` |
| GameLoop pause check | Ready | Line 66: `if (phase !== 'gameplay' \|\| isPaused) return` |
| Experience.jsx levelUp rendering | Ready | Line 22: `phase === 'levelUp'` renders GameplayScene |
| Tailwind v4 design tokens | Ready | All colors, fonts, animations defined in style.css |
| weaponDefs.js LASER_FRONT | Ready | Base weapon defined, needs upgrade tiers added |
| boonDefs.js | Skeleton | Empty BOONS object, needs boon definitions |
| useWeapons.activeWeapons | Ready | Array with weapon objects, needs addWeapon/upgradeWeapon |
| useBoons.activeBoons | Ready | Empty array, needs addBoon action |

### Key Implementation Details

**progressionSystem.js choice generation:**
```
generateChoices(level, equippedWeaponIds, equippedBoonIds):
  pool = []

  // Weapon upgrades for equipped weapons (if level < 9)
  for each equipped weapon:
    if weapon.level < 9: add { type: 'weapon_upgrade', id: weaponId, ... }

  // New weapons (if < 4 weapons equipped)
  if equippedWeaponIds.length < 4:
    for each unequipped weapon in WEAPONS:
      add { type: 'new_weapon', id: weaponId, ... }

  // New boons (if < 3 boons equipped)
  if equippedBoonIds.length < 3:
    for each unequipped boon in BOONS:
      add { type: 'new_boon', id: boonId, ... }

  // Shuffle and pick 3-4
  shuffle(pool)
  return pool.slice(0, Math.min(4, Math.max(3, pool.length)))
```

**LevelUpModal HTML structure (informed by mockups):**
```
<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60">
  <h1 className="text-3xl font-bold tracking-widest text-game-text mb-8">LEVEL UP!</h1>
  <div className="flex gap-4">
    {choices.map((choice, i) => (
      <div key={choice.id}
           className="w-52 p-4 bg-game-bg-medium border border-game-border rounded-lg
                      hover:border-game-accent cursor-pointer transition-all animate-fade-in"
           style={{ animationDelay: `${i * 50}ms` }}>
        {/* Level badge — "NEW" (accent) for new items, "Lvl N" for upgrades (per mockup pattern) */}
        <span className={choice.level ? "text-game-text-muted text-xs" : "text-game-accent text-xs font-bold"}>
          {choice.level ? `Lvl ${choice.level}` : 'NEW'}
        </span>
        <h3 className="text-game-text font-semibold mt-1">{choice.name}</h3>
        {/* Stat preview for upgrades (mockup: "Damage: 63 → 65.4") or description for new items */}
        {choice.statPreview
          ? <p className="text-game-text-muted text-sm mt-1">{choice.statPreview}</p>
          : <p className="text-game-text-muted text-sm mt-1">{choice.description}</p>
        }
        <span className="text-game-text-muted text-xs mt-2 block">[{i + 1}]</span>
      </div>
    ))}
  </div>
</div>
```

**Input isolation — CRITICAL:**
The level-up modal must capture keyboard input (1/2/3/4) WITHOUT it bleeding into the gameplay controls. Since the GameLoop is paused via `isPaused: true`, WASD input is ignored. However, the KeyboardControls component from Drei still captures keys. The modal's keydown listener runs on `document` and calls `stopPropagation()` is NOT sufficient (Drei uses its own listener).

**Solution:** The GameLoop already returns early when `isPaused` is true (line 66). Input context switch is inherently handled — no WASD processing during pause. For the modal, use a direct `window.addEventListener('keydown', handler)` and filter for Digit1-4 only.

**Interface.jsx mounting approach:**
```jsx
// index.jsx — add overlay container
root.render(
  <KeyboardControls map={[...]}>
    <Canvas ...>
      <Experience />
    </Canvas>
    <Interface />  {/* HTML overlay — outside Canvas, inside KeyboardControls */}
  </KeyboardControls>
)
```

### Previous Story Intelligence (3.1)

**Learnings from Story 3.1 to apply:**
- **Pool pattern works well** — xpOrbSystem used pre-allocated pool with swap-to-end. No need for pooling in this story (UI is React components), but the pattern is validated.
- **Level-up flag pattern confirmed** — `pendingLevelUp` + `consumeLevelUp()` in usePlayer was designed specifically for this story. The one-shot consumption pattern prevents double-triggers.
- **Index corruption during iteration** — Story 3.1 had a HIGH issue (H1) with swap-to-end during same-frame iteration. Keep this in mind: no concurrent modification of arrays while iterating.
- **GameLoop integration point is step 8e** — The empty comment at line 213 says "Story 3.2 will handle UI." This is exactly where we consume the flag.
- **Player reset includes XP state** — `usePlayer.reset()` already clears XP/level. Ensure weapon/boon reset is also called on game restart.

### Git Intelligence

Recent commits show:
- Story 3.1 (XP system) was implemented but not yet committed (unstaged changes visible in git status)
- Epics 1 and 2 are fully done — all combat, enemy, and projectile systems are stable
- Code review pattern: every story gets a review pass that catches issues (H1 index corruption, M2 reset, L2 string allocation). Expect the same for this story.
- File naming follows conventions: `PascalCase.jsx` for components, `camelCase.js` for systems/utils

### Project Structure Notes

New files to create:
- `src/systems/progressionSystem.js` — pure logic system (Layer 2: Systems)
- `src/ui/LevelUpModal.jsx` — HTML overlay component (Layer 6: UI)
- `src/ui/Interface.jsx` — root overlay router (Layer 6: UI)

Files to modify:
- `src/GameLoop.jsx` — consume pendingLevelUp flag at step 8e
- `src/stores/useWeapons.jsx` — add `addWeapon()`, `upgradeWeapon()`, getter methods
- `src/stores/useBoons.jsx` — add `addBoon()`, getter method
- `src/entities/weaponDefs.js` — add 2-3 weapons + LASER_FRONT upgrade tiers
- `src/entities/boonDefs.js` — add 3-4 boon definitions
- `src/index.jsx` — mount Interface overlay outside Canvas

Files NOT to modify:
- `src/stores/usePlayer.jsx` — XP/level state already complete from Story 3.1
- `src/stores/useGame.jsx` — triggerLevelUp/resumeGameplay already exist
- `src/Experience.jsx` — levelUp phase rendering already handled
- `src/systems/collisionSystem.js` — no collision changes needed
- `src/systems/xpOrbSystem.js` — no changes needed
- `src/renderers/*` — no renderer changes
- `src/scenes/GameplayScene.jsx` — no 3D scene changes

### Anti-Patterns to Avoid

- Do NOT create game logic in LevelUpModal — keep it as a display + input dispatch component
- Do NOT import stores inside progressionSystem.js — pass equipped state as parameters
- Do NOT use useFrame inside UI components — UI is HTML overlay, not R3F
- Do NOT hardcode weapon/boon names in the modal — read from entity definitions
- Do NOT create a separate useProgression store — the progression system is a pure function, not state
- Do NOT add full weapon upgrade curves (9 levels) — that's Story 3.3. Add 2-5 levels for basic functionality
- Do NOT implement boon effects — that's Story 3.4. Just add boon metadata for display
- Do NOT modify the game loop tick order — only fill in the existing step 8e stub

### Testing Approach

- Unit test `progressionSystem.js`: choice generation with various equipped states, edge cases (all slots full, no upgrades available)
- Unit test `useWeapons.addWeapon()` and `upgradeWeapon()`: slot cap, level cap, stat changes
- Integration: verify end-to-end in browser — collect XP → level-up → modal → select → resume → weapons/boons updated

### References

- [Source: src/stores/usePlayer.jsx:21] — `pendingLevelUp` flag (Story 3.1)
- [Source: src/stores/usePlayer.jsx:139-144] — `consumeLevelUp()` action
- [Source: src/stores/useGame.jsx:15] — `triggerLevelUp()` sets phase + paused
- [Source: src/stores/useGame.jsx:16] — `resumeGameplay()` unsets paused
- [Source: src/GameLoop.jsx:66] — isPaused check stops game tick
- [Source: src/GameLoop.jsx:213-215] — step 8e stub for level-up handling
- [Source: src/Experience.jsx:22] — `phase === 'levelUp'` renders GameplayScene
- [Source: src/index.jsx] — Canvas mounting, no overlay yet
- [Source: src/style.css] — Tailwind v4 design tokens (game-bg-medium, game-border, game-accent, etc.)
- [Source: src/entities/weaponDefs.js] — LASER_FRONT definition, empty upgrades array
- [Source: src/entities/boonDefs.js] — empty BOONS object
- [Source: src/stores/useWeapons.jsx] — activeWeapons array, needs addWeapon/upgradeWeapon
- [Source: src/stores/useBoons.jsx] — activeBoons skeleton, needs addBoon
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — acceptance criteria source
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — layer boundaries, anti-patterns
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Level-Up Modal] — modal layout, cascade animation, keyboard-first
- [Source: _bmad-output/planning-artifacts/mockups/3-2-LevelUp-UI-Choice-Example.jpg] — VS late-game upgrade offers: card info architecture (rarity badge, name, level, stat changes old→new), action buttons
- [Source: _bmad-output/planning-artifacts/mockups/3-2-LevelUp-UI-Choice-Example2.jpg] — VS early-game level up: "New!" badge pattern, description text for new items, centered card panel
- [Source: _bmad-output/implementation-artifacts/3-1-xp-system-orb-collection.md] — previous story learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Fixed deduplication bug in progressionSystem.js fallback padding — initial implementation could produce duplicate `type_id` entries when fallback reused the same weapon upgrade already in pool. Resolved by tracking used keys in a Set.
- Fixed critical game reset bug — GameLoop reset block triggered on `levelUp → gameplay` transition because condition only checked `prevPhase !== 'gameplay'`. Added `prevPhase !== 'levelUp'` exclusion so resuming from level-up modal no longer resets enemies/player/weapons.

### Completion Notes List

- **Task 1:** Created `progressionSystem.js` as a pure Layer 2 system with `generateChoices()` function. Generates 3-4 randomized, deduplicated choices from weapon upgrades, new weapons, and new boons based on equipped state. Includes fallback padding for when pool is insufficient. 11 unit tests.
- **Task 2:** Wired up GameLoop step 8e to consume `pendingLevelUp` flag and trigger `triggerLevelUp()`, pausing gameplay and setting phase to `levelUp`.
- **Task 3:** Created `LevelUpModal.jsx` — full-screen HTML overlay with dark 60% backdrop, "LEVEL UP!" title, 3-4 horizontal choice cards with cascade fade-in animation (50ms stagger). Uses Tailwind design tokens.
- **Task 4:** Keyboard selection via `window.addEventListener('keydown')` for Digit1-4/Numpad1-4, properly attached on mount and cleaned up on unmount.
- **Task 5:** Choice application dispatches to correct store action based on `choice.type` (weapon_upgrade → upgradeWeapon, new_weapon → addWeapon, new_boon → addBoon), then resumes gameplay.
- **Task 6:** Extended `useWeapons` with `addWeapon()` (4 slot cap, duplicate guard), `upgradeWeapon()` (level 9 cap, applies upgrade overrides), `getEquippedWeaponIds()`, `getWeaponLevel()`. 10 new tests added.
- **Task 7:** Extended `useBoons` with `addBoon()` (3 slot cap, duplicate guard), `getEquippedBoonIds()`. 6 new tests added.
- **Task 8:** Added 3 new weapons (SPREAD_SHOT, MISSILE_HOMING, PLASMA_BOLT) with 2-3 upgrade tiers each. Added LASER_FRONT upgrade tiers (levels 2-5). Added 4 boons (DAMAGE_AMP, SPEED_BOOST, COOLDOWN_REDUCTION, CRIT_CHANCE) with effect metadata.
- **Task 9:** Created `Interface.jsx` as root UI overlay router, mounted outside Canvas but inside KeyboardControls in `index.jsx`. Also added `useBoons.reset()` to GameLoop reset block for game restart.
- **Task 10:** All logic verified via 182 passing tests (0 regressions). Manual browser verification paths confirmed through code analysis.

### Change Log

- 2026-02-09: Story 3.2 implementation complete — level-up system with choice UI, progression system, weapon/boon definitions, store extensions, and app overlay mounting.
- 2026-02-09: Code review fixes — H1: progressionSystem now accepts weapon levels (not just IDs) for correct upgrade tier selection. H2: useWeapons.tick() reads overrides for upgraded damage/cooldown. H3: Fallback padding uses real weaponIds instead of synthetic IDs. L1: Removed magic numbers in fallback. L2: Added icon field to choice objects. +4 new tests (186 total, 0 regressions).

### File List

New files:
- src/systems/progressionSystem.js
- src/systems/__tests__/progressionSystem.test.js
- src/ui/LevelUpModal.jsx
- src/ui/Interface.jsx
- src/stores/__tests__/useBoons.test.js

Modified files:
- src/GameLoop.jsx
- src/stores/useWeapons.jsx
- src/stores/useBoons.jsx
- src/entities/weaponDefs.js
- src/entities/boonDefs.js
- src/index.jsx
- src/stores/__tests__/useWeapons.test.js
