# Story 7.4: HP Sacrifice (Tier 3)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to sacrifice Fragments to recover HP in the tunnel,
So that I can trade resources for survival when running low on health.

## Acceptance Criteria

1. **Given** the player is in the tunnel with low HP **When** the HP sacrifice option is available **Then** the player can spend a defined amount of Fragments to recover a portion of HP **And** the exchange rate is displayed clearly (e.g., "50◆ → +25 HP")

2. **Given** the player confirms the sacrifice **When** Fragments are spent **Then** HP increases by the defined amount (capped at maxHP) **And** Fragment count decreases **And** visual/audio feedback confirms the transaction

3. **Given** the player has insufficient Fragments **When** viewing the sacrifice option **Then** the option is disabled/grayed out

## Tasks / Subtasks

- [x] Task 1: Define HP sacrifice constants in gameConfig.js (AC: #1)
  - [x] 1.1: Add HP_SACRIFICE_FRAGMENT_COST to gameConfig.js (e.g., 50 fragments)
  - [x] 1.2: Add HP_SACRIFICE_HP_RECOVERY to gameConfig.js (e.g., 25 HP)
  - [~] 1.3: ~~Add HP_SACRIFICE_MIN_FRAGMENTS threshold~~ — Skipped: cost itself serves as min threshold (redundant config avoided)
  - [x] 1.4: Ensure exchange rate is balanced (cost:recovery ratio feels fair but significant)

- [x] Task 2: Add HP sacrifice action to usePlayer store (AC: #2)
  - [x] 2.1: Add sacrificeFragmentsForHP() action to usePlayer.jsx
  - [x] 2.2: Check if player has sufficient fragments (currentFragments >= HP_SACRIFICE_FRAGMENT_COST)
  - [x] 2.3: If sufficient: deduct HP_SACRIFICE_FRAGMENT_COST from fragments
  - [x] 2.4: Add HP_SACRIFICE_HP_RECOVERY to currentHP, clamped to maxHP
  - [x] 2.5: Return success status (true if transaction completed, false if insufficient fragments)
  - [x] 2.6: Ensure transaction is atomic (both fragment deduction and HP gain happen together)

- [x] Task 3: Add HP sacrifice section to TunnelHub UI (AC: #1, #3)
  - [x] 3.1: Add "HP Recovery" section to TunnelHub.jsx, below upgrades and dilemmas sections
  - [x] 3.2: Display current HP and maxHP (e.g., "HP: 45 / 100")
  - [x] 3.3: Display exchange rate clearly: "50◆ → +25 HP" (read from gameConfig)
  - [x] 3.4: Show "RECOVER HP" button with keyboard shortcut (e.g., [H])
  - [x] 3.5: If currentFragments < HP_SACRIFICE_FRAGMENT_COST, disable button and gray out section
  - [x] 3.6: If currentHP === maxHP, show "HP Full" message instead of button (or gray out)
  - [x] 3.7: Ensure section is visible on TunnelHub right-side UI panel (below dilemmas)

- [x] Task 4: Implement HP sacrifice transaction flow (AC: #2)
  - [x] 4.1: On "RECOVER HP" button click (or [H] key press), call usePlayer.getState().sacrificeFragmentsForHP()
  - [x] 4.2: If transaction succeeds, show visual feedback (HP bar animates up, green flash)
  - [x] 4.3: Play SFX: 'hp-recover' sound (if asset exists) or use generic positive SFX
  - [x] 4.4: Update TunnelHub display immediately (new fragment count, new HP)
  - [x] 4.5: If transaction fails (insufficient fragments), show error message briefly (red flash, "Not enough Fragments")

- [x] Task 5: Visual and audio feedback (AC: #2)
  - [x] 5.1: When HP sacrifice succeeds, animate HP bar in TunnelHub (green glow, pulse)
  - [x] 5.2: Show "+25 HP" floating text above HP section (fade-up CSS animation, 800ms)
  - [x] 5.3: Play 'hp-recover' SFX (add to audioManager SFX_CATEGORY_MAP if asset available)
  - [~] 5.4: ~~Fragment count number tween~~ — Simplified: Zustand reactivity provides instant update; no manual tween needed
  - [x] 5.5: Ensure feedback is immediate (< 100ms) and clear

- [x] Task 6: Edge cases and validation (AC: #2, #3)
  - [x] 6.1: If currentHP is already at maxHP, disable HP sacrifice (show "HP Full" message)
  - [x] 6.2: If currentFragments < HP_SACRIFICE_FRAGMENT_COST, disable HP sacrifice (grayed out)
  - [x] 6.3: If multiple HP sacrifices are made in one tunnel visit, ensure each transaction works correctly
  - [x] 6.4: If player has exactly HP_SACRIFICE_FRAGMENT_COST fragments, one sacrifice should leave them at 0 fragments
  - [x] 6.5: If player has currentHP = maxHP - 10, and HP_SACRIFICE_HP_RECOVERY = 25, ensure HP is clamped to maxHP (not overhealed)
  - [x] 6.6: Ensure HP sacrifice persists through system transition (if player sacrifices in tunnel 1, HP is retained in System 2)

- [x] Task 7: Keyboard navigation and accessibility (AC: #1)
  - [x] 7.1: Add [H] keyboard shortcut for "RECOVER HP" action
  - [x] 7.2: Ensure [H] shortcut only works when HP sacrifice is enabled (not grayed out)
  - [x] 7.3: Add keyboard focus styling to "RECOVER HP" button (focus ring)
  - [x] 7.4: Ensure Tab navigation cycles through upgrades → dilemmas → HP sacrifice → ENTER SYSTEM

- [x] Task 8: Integration with existing tunnel systems (AC: #1, #2)
  - [x] 8.1: Verify HP sacrifice works alongside Story 7.2 upgrades and dilemmas (if implemented)
  - [x] 8.2: If player accepts a dilemma that reduces maxHP (e.g., -20% Max HP), ensure HP sacrifice respects the new maxHP
  - [x] 8.3: If player purchases a +Max HP upgrade, ensure HP sacrifice respects the new maxHP
  - [x] 8.4: Ensure fragment count is shared correctly between upgrades, dilemmas, and HP sacrifice (all read from usePlayer.fragments)
  - [x] 8.5: If player has 100 fragments, purchases an upgrade for 50◆, then wants to sacrifice for HP, ensure only 50◆ remain available

- [x] Task 9: Testing and verification (AC: #1, #2, #3)
  - [x] 9.1: Enter tunnel with 100 fragments and 45 HP (maxHP 100)
  - [x] 9.2: HP sacrifice section shows "50◆ → +25 HP" and "RECOVER HP" button is enabled
  - [x] 9.3: Click "RECOVER HP" → fragments drop to 50, HP rises to 70, visual/audio feedback plays
  - [x] 9.4: Click "RECOVER HP" again → fragments drop to 0, HP rises to 95, button grays out (insufficient fragments)
  - [x] 9.5: Enter tunnel with 30 fragments and 50 HP → HP sacrifice button is grayed out (insufficient fragments)
  - [x] 9.6: Enter tunnel with 100 fragments and 100 HP (full HP) → HP sacrifice shows "HP Full" message (or grayed out)
  - [x] 9.7: Enter tunnel with 80 HP (maxHP 100), sacrifice once → HP becomes 100 (clamped, not 105)
  - [x] 9.8: Accept dilemma that reduces maxHP to 80, then sacrifice → HP capped at new maxHP (80)
  - [x] 9.9: Sacrifice in tunnel 1 → enter System 2 → HP from sacrifice is retained
  - [x] 9.10: Full flow: Boss defeat → tunnel → purchase upgrade (50◆) → sacrifice HP (50◆) → ENTER SYSTEM → System 2 with recovered HP

- [x] Task 10: Performance and polish (AC: #2)
  - [x] 10.1: Ensure HP sacrifice transaction completes instantly (no delay)
  - [x] 10.2: Ensure visual animations do not block user input (can still navigate tunnel UI during feedback)
  - [x] 10.3: Ensure 60 FPS maintained during HP sacrifice feedback animations
  - [x] 10.4: All existing tests pass with no regressions (470+ tests from Story 7.1)

## Dev Notes

### Architecture Decisions

- **HP sacrifice as a player action** — HP sacrifice is modeled as a player action in usePlayer.jsx, similar to how upgrades are purchased (Story 7.2) or dilemmas are accepted. This keeps all player resource management (fragments, HP) in one store.

- **Exchange rate balance** — The default exchange rate (50◆ → +25 HP) makes HP sacrifice a strategic decision. With BOSS_FRAGMENT_REWARD = 100, the player can sacrifice twice per boss defeat. This trades offense (upgrades) for survival (HP recovery).

- **Clamping to maxHP** — HP recovery is clamped to maxHP, ensuring the player cannot overheal. If a dilemma reduces maxHP (e.g., -20% Max HP), HP sacrifice respects the new cap.

- **UI placement** — HP sacrifice section is placed below upgrades and dilemmas in TunnelHub's right-side panel, visually separating it from other choices. The player sees: upgrades → dilemmas → HP sacrifice → ENTER SYSTEM (bottom).

- **Keyboard shortcut [H]** — Following the tunnel UI pattern (upgrades use 1-4, dilemmas use A/R), HP sacrifice uses [H] for "Health" or "Heal". This makes the tunnel fully keyboard-navigable.

- **Tier 3 scope** — Story 7.4 is marked Tier 3 (optional polish). If time is limited, this story can be skipped without breaking the core game loop. HP sacrifice is a quality-of-life feature for players who enter tunnels with low HP.

### Existing Infrastructure Status

| Component | Status | Relevance |
|-----------|--------|-----------|
| `stores/usePlayer.jsx` | **Has fragments, currentHP, maxHP** | Add sacrificeFragmentsForHP() action |
| `ui/TunnelHub.jsx` | **Created in Story 7.1, has upgrade/dilemma sections** | Add HP sacrifice section below dilemmas |
| `config/gameConfig.js` | **Has BOSS_FRAGMENT_REWARD: 100** | Add HP_SACRIFICE_FRAGMENT_COST, HP_SACRIFICE_HP_RECOVERY |
| `audio/audioManager.js` | **Has SFX_CATEGORY_MAP** | Add 'hp-recover' SFX if asset available |
| `hooks/useAudio.jsx` | **Has SFX_MAP for preloading** | Add 'hp-recover' to SFX_MAP |
| `stores/usePlayer.jsx resetForNewSystem()` | **Preserves fragments, HP across systems** | No changes needed (HP sacrifice effect persists) |
| `ui/TunnelHub.jsx upgrade flow` | **Story 7.2: purchasing upgrades** | Reference similar transaction pattern for HP sacrifice |

### Key Implementation Details

**gameConfig.js additions:**
```javascript
// HP Sacrifice (Tier 3) — Story 7.4
export const HP_SACRIFICE_FRAGMENT_COST = 50  // Fragments required to recover HP
export const HP_SACRIFICE_HP_RECOVERY = 25     // HP gained from one sacrifice
```

**usePlayer.jsx action:**
```javascript
sacrificeFragmentsForHP: () => {
  const { fragments, currentHP, maxHP } = get()

  if (fragments < GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST) {
    return false // Insufficient fragments
  }

  if (currentHP >= maxHP) {
    return false // Already at full HP
  }

  const newFragments = fragments - GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST
  const newHP = Math.min(maxHP, currentHP + GAME_CONFIG.HP_SACRIFICE_HP_RECOVERY)

  set({ fragments: newFragments, currentHP: newHP })

  // Play SFX in caller (TunnelHub)
  return true // Transaction succeeded
},
```

**TunnelHub.jsx HP sacrifice section:**
```javascript
// In TunnelHub component:
const { fragments, currentHP, maxHP } = usePlayer()
const canSacrifice = fragments >= GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST && currentHP < maxHP

const handleHPSacrifice = () => {
  const success = usePlayer.getState().sacrificeFragmentsForHP()

  if (success) {
    audioManager.play('hp-recover') // Or generic positive SFX
    // Trigger visual feedback (green flash, HP bar animate)
  } else {
    // Show error feedback (red flash, "Not enough Fragments")
  }
}

// JSX:
<div className="hp-sacrifice-section">
  <h3>HP Recovery</h3>
  <p>HP: {currentHP} / {maxHP}</p>
  <p>Exchange: {GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST}◆ → +{GAME_CONFIG.HP_SACRIFICE_HP_RECOVERY} HP</p>

  {currentHP >= maxHP ? (
    <p className="text-game-success">HP Full</p>
  ) : (
    <button
      onClick={handleHPSacrifice}
      disabled={!canSacrifice}
      className={`recover-hp-btn ${!canSacrifice ? 'disabled' : ''}`}
    >
      [H] RECOVER HP
    </button>
  )}
</div>
```

**Keyboard shortcut (TunnelHub.jsx):**
```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === 'h' || e.key === 'H') {
      if (canSacrifice) {
        handleHPSacrifice()
      }
    }
  }

  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [canSacrifice])
```

### Previous Story Intelligence (7.1, 7.2, 7.3)

**Learnings from Story 7.1 to apply:**
- **Fragments system** — usePlayer already tracks fragments (gained from boss defeat: 100◆). HP sacrifice is another way to spend fragments.
- **TunnelHub UI structure** — Right-side panel has upgrade and dilemma sections. HP sacrifice goes below these, maintaining visual hierarchy.
- **resetForNewSystem()** — Already preserves fragments and HP across systems. HP sacrifice effect (recovered HP) will persist through system transitions automatically.

**Learnings from Story 7.2 to apply (if implemented):**
- **Purchase transaction pattern** — Story 7.2 likely uses a similar pattern for purchasing upgrades: check if player has enough fragments → deduct cost → apply effect → play feedback. HP sacrifice follows the same pattern.
- **Disabled state handling** — If player cannot afford an upgrade, button is grayed out. Same for HP sacrifice when fragments < cost.
- **Fragment count display** — TunnelHub shows current fragment count. HP sacrifice updates this display immediately on transaction.

**Learnings from Story 7.3 to apply:**
- **Tunnel exit flow** — When player clicks "ENTER SYSTEM", all tunnel state (upgraded stats, dilemma effects, recovered HP) persists into the next system. No special handling needed for HP sacrifice.
- **System transition** — advanceSystem() resets per-system state (timer, enemies, wormhole), but does NOT reset HP or fragments. HP sacrifice effect persists.

### Git Intelligence

Recent commits show:
- Epic 6 (Stories 6.1-6.3) implemented (boss, wormhole, Fragment reward)
- Epic 7.1 implemented (tunnel entry, Fragment system, TunnelHub shell)
- Pattern: resource management (XP, Fragments) tracked in stores, UI components dispatch actions

**Relevant established patterns:**
- **usePlayer for resource management** — Fragments, HP, maxHP, weapons, boons all managed in usePlayer
- **TunnelHub as resource spending UI** — Upgrades (Story 7.2) and HP sacrifice (Story 7.4) both interact with usePlayer via action methods
- **Keyboard shortcuts for tunnel actions** — Upgrades use 1-4, dilemmas use A/R, HP sacrifice uses [H]

### Project Structure Notes

**Files to MODIFY:**
- `src/config/gameConfig.js` — Add HP_SACRIFICE_FRAGMENT_COST, HP_SACRIFICE_HP_RECOVERY
- `src/stores/usePlayer.jsx` — Add sacrificeFragmentsForHP() action
- `src/ui/TunnelHub.jsx` — Add HP sacrifice section (below dilemmas)
- `src/audio/audioManager.js` — Add 'hp-recover' to SFX_CATEGORY_MAP (if asset exists)
- `src/hooks/useAudio.jsx` — Add 'hp-recover' to SFX_MAP for preloading (if asset exists)

**Files NOT to modify:**
- `src/stores/useLevel.jsx` — No changes (HP sacrifice is player state, not level state)
- `src/GameLoop.jsx` — No changes (HP sacrifice happens in tunnel phase, not during gameplay tick)
- `src/scenes/TunnelScene.jsx` — No changes (purely visual)
- `src/Experience.jsx` — No changes (scene routing unchanged)

**Files to CREATE:**
- None — all logic fits into existing files

### Anti-Patterns to Avoid

- Do NOT create a separate store for HP sacrifice — extend usePlayer with the sacrificeFragmentsForHP() action
- Do NOT allow HP to exceed maxHP — always clamp to maxHP, even if player has dilemmas or upgrades affecting maxHP
- Do NOT allow HP sacrifice when fragments < cost — check canSacrifice condition before allowing transaction
- Do NOT forget to update fragment count immediately — UI should reflect new fragment count instantly after sacrifice
- Do NOT allow HP sacrifice to interrupt tunnel exit animation (Story 7.3) — HP sacrifice completes before player clicks "ENTER SYSTEM"
- Do NOT hardcode fragment cost or HP recovery — use gameConfig.js constants
- Do NOT skip visual/audio feedback — HP sacrifice should feel satisfying with immediate feedback
- Do NOT allow HP sacrifice during gameplay or boss phase — only available in tunnel phase (TunnelHub component)

### Testing Approach

- **Unit tests (usePlayer HP sacrifice action):**
  - `sacrificeFragmentsForHP()` returns false if fragments < cost
  - `sacrificeFragmentsForHP()` returns false if currentHP >= maxHP
  - `sacrificeFragmentsForHP()` deducts HP_SACRIFICE_FRAGMENT_COST from fragments
  - `sacrificeFragmentsForHP()` adds HP_SACRIFICE_HP_RECOVERY to currentHP
  - `sacrificeFragmentsForHP()` clamps currentHP to maxHP (no overhealing)
  - Multiple sacrifices in one tunnel visit work correctly
  - HP sacrifice respects dilemma-modified maxHP (e.g., -20% Max HP)

- **Integration tests (TunnelHub HP sacrifice flow):**
  - Enter tunnel with 100◆ and 45 HP → HP sacrifice enabled
  - Click "RECOVER HP" → fragments drop to 50◆, HP rises to 70
  - Click "RECOVER HP" again → fragments drop to 0◆, HP rises to 95, button grays out
  - Enter tunnel with 30◆ and 50 HP → HP sacrifice grayed out (insufficient fragments)
  - Enter tunnel with 100◆ and 100 HP → HP sacrifice shows "HP Full" (or grayed out)

- **System transition tests (cross-system HP persistence):**
  - Boss defeat (System 1) → tunnel → sacrifice HP (45 HP → 70 HP) → ENTER SYSTEM → System 2 starts with 70 HP
  - System 2 gameplay → take damage (70 HP → 40 HP) → boss defeat → tunnel → sacrifice HP (40 HP → 65 HP) → ENTER SYSTEM → System 3 starts with 65 HP

- **Visual tests (browser verification):**
  - "RECOVER HP" button is visually distinct (green accent color)
  - Disabled state is clear (grayed out, cursor not-allowed)
  - HP bar animates smoothly when HP increases (green pulse)
  - "+25 HP" floating text appears above HP bar
  - Fragment count updates instantly (number tween animation)
  - 'hp-recover' SFX plays on successful sacrifice
  - Keyboard shortcut [H] works when section has focus
  - 60 FPS during feedback animations

### Scope Summary

Story 7.4 adds an optional HP sacrifice mechanic to the tunnel hub, allowing players to trade Fragments for HP recovery. This is a Tier 3 feature (polish/quality-of-life) that enhances strategic depth but is not required for core gameplay. When the player is in the tunnel with low HP, they can spend 50 Fragments to recover 25 HP (values from gameConfig.js). The exchange rate is clearly displayed ("50◆ → +25 HP"), and the "RECOVER HP" button is enabled only if the player has sufficient fragments and is not at full HP. On transaction, fragments are deducted, HP increases (capped at maxHP), and visual/audio feedback confirms the action. The feature integrates seamlessly with Story 7.2 upgrades and dilemmas (all share the same fragment pool), and HP recovered in the tunnel persists through system transitions (resetForNewSystem preserves HP). Keyboard shortcut [H] enables quick access. The implementation is minimal (one new action in usePlayer, one new UI section in TunnelHub), making it a low-risk Tier 3 addition.

**Key deliverables:**
1. `config/gameConfig.js` — Add HP_SACRIFICE_FRAGMENT_COST, HP_SACRIFICE_HP_RECOVERY constants
2. `stores/usePlayer.jsx` — Add sacrificeFragmentsForHP() action
3. `ui/TunnelHub.jsx` — Add HP sacrifice section with "RECOVER HP" button, [H] shortcut, disabled state handling
4. `audio/audioManager.js` — Add 'hp-recover' SFX (if asset available)
5. `hooks/useAudio.jsx` — Add 'hp-recover' to SFX_MAP (if asset available)
6. Unit tests for sacrificeFragmentsForHP() action
7. Integration tests for TunnelHub HP sacrifice flow
8. System transition tests for HP persistence

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.4] — Acceptance criteria: Fragment cost, HP recovery, exchange rate display, insufficient fragments handling
- [Source: _bmad-output/planning-artifacts/epics.md#FR36] — Player can sacrifice Fragments to recover HP (Tier 3)
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — usePlayer manages player resources (fragments, HP, maxHP)
- [Source: _bmad-output/planning-artifacts/architecture.md#UI Layer] — TunnelHub dispatches store actions for player choices (upgrades, dilemmas, HP sacrifice)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Tunnel Hub] — Tunnel UI layout: upgrades, dilemmas, HP sacrifice, ENTER SYSTEM
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Keyboard Navigation] — Keyboard-first navigation, all actions accessible via shortcuts
- [Source: src/ui/TunnelHub.jsx] — Created in Story 7.1, has upgrade/dilemma sections, right-side panel layout
- [Source: src/stores/usePlayer.jsx] — Has fragments, currentHP, maxHP, resetForNewSystem() (preserves HP/fragments)
- [Source: src/config/gameConfig.js] — Has BOSS_FRAGMENT_REWARD: 100 (fragment source)
- [Source: _bmad-output/implementation-artifacts/7-1-tunnel-entry-3d-scene.md] — Previous story: tunnel entry, Fragment system, resetForNewSystem
- [Source: _bmad-output/implementation-artifacts/7-2-fragment-upgrades-dilemmas.md] — Related story: upgrades and dilemmas share fragment pool with HP sacrifice
- [Source: _bmad-output/implementation-artifacts/7-3-tunnel-exit-system-transition.md] — Related story: system transitions preserve HP from tunnel

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Added HP_SACRIFICE_FRAGMENT_COST (50) and HP_SACRIFICE_HP_RECOVERY (25) constants to gameConfig.js
- Added sacrificeFragmentsForHP() action to usePlayer.jsx — checks fragment sufficiency, checks HP < maxHP, atomically deducts fragments and adds HP (clamped to maxHP), returns boolean success
- Added "HP RECOVERY" section to TunnelHub.jsx below dilemmas — displays current HP/maxHP, exchange rate, "RECOVER HP" button with [H] shortcut, "HP Full" message when at max, disabled state when insufficient fragments, green flash feedback on success
- Added 'hp-recover' SFX to audioManager.js (SFX_CATEGORY_MAP), useAudio.jsx (SFX_MAP), and assetManifest.js (tier2.audio)
- 13 unit tests covering: insufficient fragments, full HP, fragment deduction, HP recovery, clamping, multiple sacrifices, exact cost edge case, dilemma-modified maxHP, atomicity, system transition persistence, config constants
- Task 1.3 note: HP_SACRIFICE_MIN_FRAGMENTS not added as separate constant — the cost itself serves as the minimum threshold (canSacrifice uses HP_SACRIFICE_FRAGMENT_COST directly), avoiding redundant config
- Task 5.2/5.4: Floating text and number tween animations kept simple — green flash on success via CSS transition (border + background change on 400ms timeout). Zustand reactivity handles instant UI updates without manual animation.
- All 537 tests pass with 0 regressions

### Change Log

- 2026-02-11: Story 7.4 HP Sacrifice implementation — added gameConfig constants, usePlayer action, TunnelHub UI section, audio SFX registration, keyboard shortcut [H], 13 unit tests
- 2026-02-11: Code review fixes — added "+25 HP" floating text with fade-up animation (H3/Task 5.2), added error flash feedback on failed sacrifice (M1/Task 4.5), added missing test for full-HP-with-sufficient-fragments edge case (M3), corrected task 1.3 and 5.4 status to reflect actual implementation decisions

### File List

- src/config/gameConfig.js (modified — added HP_SACRIFICE_FRAGMENT_COST, HP_SACRIFICE_HP_RECOVERY)
- src/stores/usePlayer.jsx (modified — added sacrificeFragmentsForHP() action)
- src/ui/TunnelHub.jsx (modified — added HP Recovery section with button, exchange rate, disabled states, [H] shortcut)
- src/audio/audioManager.js (modified — added 'hp-recover' to SFX_CATEGORY_MAP)
- src/hooks/useAudio.jsx (modified — added 'hp-recover' to SFX_MAP)
- src/config/assetManifest.js (modified — added hpRecover audio path)
- src/stores/__tests__/usePlayer.hpSacrifice.test.js (new — 14 unit tests for HP sacrifice)
- src/style.css (modified — added hpFloatUp keyframes for floating text animation)
