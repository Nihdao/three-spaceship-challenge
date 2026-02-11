# Story 4.2: Gameplay HUD

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see critical game information displayed clearly during gameplay,
So that I can make informed survival decisions at a glance.

## Acceptance Criteria

1. **Given** the player is in the gameplay phase **When** the HUD renders **Then** HP bar displays in the top-left (red, continuous bar) **And** system timer displays in the top-center (white, tabular-nums, countdown format MM:SS) **And** XP bar displays at the bottom of the screen (green/cyan, with current level number) **And** weapon slots display in the bottom-right (up to 4 icons, equipped weapons highlighted)

2. **Given** player HP drops below 25% **When** the HUD updates **Then** the HP bar pulses red **And** a subtle red vignette appears on screen edges

3. **Given** the XP bar is nearly full **When** the player is close to leveling up **Then** the XP bar subtly pulses to indicate imminent level-up

4. **Given** the HUD is rendering **When** gameplay is active **Then** all HUD elements use the Tailwind design tokens (game-bg, game-hp, game-xp, game-timer colors) **And** text uses Inter font with tabular-nums for numbers **And** HUD elements use clamp() for responsive sizing (readable at 1080p minimum, NFR15)

5. **Given** the kill counter exists in useGame **When** the HUD renders **Then** the kill count is displayed alongside the timer area (top section)

## Tasks / Subtasks

- [x] Task 1: Create ProgressBar UI primitive (AC: #1, #4)
  - [x] 1.1: Create `src/ui/primitives/ProgressBar.jsx` — reusable bar component with `value`, `max`, `variant` (hp, xp, cooldown, boss) props
  - [x] 1.2: Implement variant-specific colors (hp → game-hp red, xp → game-xp green/cyan, cooldown → game-cooldown orange, boss → red)
  - [x] 1.3: Add smooth CSS transition on value changes (150ms ease-out)
  - [x] 1.4: Add pulse animation support (for HP < 25% and XP near-full states)

- [x] Task 2: Create HUD component shell (AC: #1, #4)
  - [x] 2.1: Create `src/ui/HUD.jsx` — fixed overlay with `pointer-events-none` (so clicks pass through to Canvas)
  - [x] 2.2: Wire HUD into `src/ui/Interface.jsx` — render when `phase === 'gameplay'` (also render during 'levelUp' so HUD stays visible behind modal)
  - [x] 2.3: Set up Zustand subscriptions: `useGame` (systemTimer, kills), `usePlayer` (currentHP, maxHP, currentLevel, currentXP, xpToNextLevel), `useWeapons` (activeWeapons)

- [x] Task 3: Implement HP bar — top-left (AC: #1, #2)
  - [x] 3.1: Render ProgressBar variant="hp" with `currentHP / maxHP` values
  - [x] 3.2: Display HP text as "HP" label with numeric value (e.g., "75 / 100")
  - [x] 3.3: Add pulse animation when `currentHP / maxHP < 0.25`
  - [x] 3.4: Add red vignette overlay (CSS pseudo-element or separate div) that fades in when HP < 25%, pulses at 500ms ease-in-out per UX spec

- [x] Task 4: Implement timer and kill counter — top-center (AC: #1, #5)
  - [x] 4.1: Compute countdown display: `GAME_CONFIG.SYSTEM_TIMER - systemTimer`, format as MM:SS with tabular-nums
  - [x] 4.2: Display kill counter with skull/crosshair icon or simple label
  - [x] 4.3: Style with `text-game-timer` (white), bold, large readable size using clamp()

- [x] Task 5: Implement XP bar — bottom of screen (AC: #1, #3)
  - [x] 5.1: Render ProgressBar variant="xp" with `currentXP / xpToNextLevel` values
  - [x] 5.2: Display current level number next to the bar (e.g., "LVL 7")
  - [x] 5.3: Add subtle pulse when `currentXP / xpToNextLevel > 0.85` (near level-up)

- [x] Task 6: Implement weapon slots — bottom-right (AC: #1)
  - [x] 6.1: Render up to 4 weapon slot indicators based on `activeWeapons` from useWeapons store
  - [x] 6.2: Show weapon name/abbreviation and level for each equipped slot
  - [x] 6.3: Show empty slots as dimmed/outlined placeholders
  - [x] 6.4: Use weapon color from weaponDefs for each slot's accent

- [x] Task 7: Responsive sizing and polish (AC: #4)
  - [x] 7.1: Apply clamp() to all HUD text sizes for 1080p minimum readability
  - [x] 7.2: Ensure HUD does not interfere with gameplay interaction (pointer-events-none on container, pointer-events-auto only on interactive elements if any)
  - [x] 7.3: Test HUD at different viewport sizes (1920x1080, 1280x720) — elements remain readable

- [x] Task 8: Verification (AC: #1-#5)
  - [x] 8.1: Play game — verify all HUD elements render correctly during gameplay
  - [x] 8.2: Take damage — verify HP bar decreases and pulses red when < 25%
  - [x] 8.3: Verify red vignette appears and pulses at low HP
  - [x] 8.4: Verify timer counts down in MM:SS format
  - [x] 8.5: Kill enemies — verify kill counter increments
  - [x] 8.6: Collect XP — verify XP bar fills and pulses near level-up
  - [x] 8.7: Equip new weapons via level-up — verify weapon slots update
  - [x] 8.8: Verify HUD stays visible during levelUp phase (behind the modal)
  - [x] 8.9: Run full test suite — no regressions

### Review Follow-ups (AI)

- [ ] [AI-Review][MEDIUM] Add React component rendering tests for HUD and ProgressBar (current tests only cover exported helper functions, not actual rendering/DOM output)
- [ ] [AI-Review][MEDIUM] Weapon slot abbreviation uses fragile `name.split(' ')[0]` — consider adding an `abbreviation` field to weaponDefs if new weapons cause display issues [src/ui/HUD.jsx:133]
- [ ] [AI-Review][LOW] Timer+Kills placement diverges from UX spec layout (spec shows top-right, story AC says top-center) — document this intentional change in UX spec or keep as-is

## Senior Developer Review (AI)

**Reviewer:** Adam (via Claude Opus 4.6)
**Date:** 2026-02-09
**Outcome:** Approved with minor fixes applied

**Summary:** All 5 Acceptance Criteria are fully implemented. All 8 tasks (37 subtasks) marked [x] are verified as genuinely complete. Code quality is good — proper Zustand selector patterns, clean separation of testable logic, appropriate use of Tailwind design tokens, responsive clamp() sizing throughout.

**Issues Found:** 0 Critical, 2 High (downgraded to Medium), 4 Medium, 2 Low
**Issues Fixed:** 3 (division-by-zero guards in shouldPulseHP/shouldPulseXP, misleading test comment, missing sprint-status.yaml in File List)
**Action Items Created:** 3 (React rendering tests, weapon abbreviation fragility, UX spec layout divergence documentation)
**Tests:** 286/286 passing (2 new edge case tests added)

## Dev Notes

### Mockup References

**Mockup** (`4-2-XPBarTop_ChronoTop_and_LifeUnderPlayer.png`) — Megabonk-style HUD reference:
- Timer prominently at top-center (9:44)
- Stats/kills in top-left area
- HP bar (red, 100/100) positioned near the player character
- Level indicator (LVL 0) and minimap in top-right
- **Key takeaway:** Timer top-center is very readable, HP near player draws attention to danger. However, our UX spec places HP in top-left and timer in top-center — follow UX spec positioning since it was designed specifically for our game's layout.

**UX Spec HUD Layout (authoritative):**
```
+-----------------------------------------------------------+
| [HP Bar]                    [Timer]  [Kills]               |
|                              09:42    x247                 |
|                                                            |
|                    << GAMEPLAY >>                          |
|                                                            |
| [XP Bar ==================== LVL 7]     [W1][W2][W3][W4]  |
+-----------------------------------------------------------+
```

**Design decisions:**
- Follow UX spec layout positions (top-left HP, top-center timer+kills, bottom-left XP, bottom-right weapons)
- Minimap deferred to a later task/story — it requires separate rendering logic and is not in this story's ACs
- No dash cooldown indicator in this story — that's Tier 2 (Story 5.1)

### Architecture Decisions

- **HUD is a UI overlay component** (Layer 6: UI). It lives in `src/ui/HUD.jsx`, renders as HTML over the Canvas. It reads from stores for display. It does NOT touch 3D objects or useFrame.

- **ProgressBar is a reusable primitive** in `src/ui/primitives/ProgressBar.jsx`. It will be reused later by BossHPBar (Story 6.2) and potentially cooldown indicators (Story 5.1). Support `variant` prop for color switching.

- **HUD must render during both 'gameplay' AND 'levelUp' phases** — when the LevelUpModal appears, the HUD should remain visible behind it (at lower z-index). Interface.jsx currently only renders LevelUpModal during levelUp; HUD should render whenever phase is gameplay or levelUp.

- **pointer-events-none** — The HUD container must not block clicks to the Canvas. Use `pointer-events-none` on the container. If any HUD element becomes interactive later, add `pointer-events-auto` on that specific element.

- **Timer display is countdown** — useGame stores `systemTimer` counting UP from 0. The HUD computes `GAME_CONFIG.SYSTEM_TIMER - systemTimer` and formats as MM:SS. This matches AC #4 from Story 4.1 which says "counting down from SYSTEM_TIMER".

### Existing Infrastructure Status

| Component | Status | Details |
|-----------|--------|---------|
| `useGame.systemTimer` | **Implemented** | Counts up from 0, incremented in GameLoop |
| `useGame.kills` | **Implemented** | Kill counter, incremented on enemy death |
| `usePlayer.currentHP/maxHP` | **Implemented** | Base 100, reduced by damage |
| `usePlayer.currentLevel` | **Implemented** | Incremented on level-up |
| `usePlayer.currentXP` | **Implemented** | Current XP toward next level |
| `usePlayer.xpToNextLevel` | **Implemented** | XP threshold for current level |
| `useWeapons.activeWeapons` | **Implemented** | Array of {weaponId, level, cooldownTimer} |
| `src/ui/Interface.jsx` | **Implemented** | Currently routes MainMenu + LevelUpModal |
| `src/ui/primitives/` | **Exists, empty** | Directory ready, no primitives yet |
| `src/ui/HUD.jsx` | **Missing** | Needs to be created |
| `src/ui/primitives/ProgressBar.jsx` | **Missing** | Needs to be created |
| Tailwind HUD tokens | **Configured** | game-hp, game-xp, game-timer, game-cooldown all defined |

### Key Implementation Details

**Zustand subscriptions (use individual selectors for performance):**
```javascript
// In HUD.jsx — use separate selectors to avoid unnecessary re-renders
const systemTimer = useGame(s => s.systemTimer)
const kills = useGame(s => s.kills)
const currentHP = usePlayer(s => s.currentHP)
const maxHP = usePlayer(s => s.maxHP)
const currentLevel = usePlayer(s => s.currentLevel)
const currentXP = usePlayer(s => s.currentXP)
const xpToNextLevel = usePlayer(s => s.xpToNextLevel)
const activeWeapons = useWeapons(s => s.activeWeapons)
```

**Timer formatting:**
```javascript
const remaining = Math.max(0, GAME_CONFIG.SYSTEM_TIMER - systemTimer)
const minutes = Math.floor(remaining / 60)
const seconds = Math.floor(remaining % 60)
const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
```

**ProgressBar primitive:**
```javascript
// src/ui/primitives/ProgressBar.jsx
// Props: value (0-max), max (default 100), variant ('hp'|'xp'|'cooldown'|'boss'), pulse (boolean)
// Colors per variant from Tailwind tokens:
//   hp → bg-game-hp (#ff3355), pulse → bg-game-hp-low (#ff0033)
//   xp → bg-game-xp (#00ff88)
//   cooldown → bg-game-cooldown (#ffaa00)
//   boss → bg-game-hp (#ff3355, large variant)
// Width = (value / max) * 100% with CSS transition
```

**Red vignette effect (HP < 25%):**
```css
/* Use a fixed positioned div with radial gradient or box-shadow inset */
/* Pulse animation: opacity oscillates between 0.3 and 0.6 over 500ms ease-in-out */
.low-hp-vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 80px rgba(255, 0, 51, 0.4);
  animation: vignettePulse 500ms ease-in-out infinite alternate;
}
@keyframes vignettePulse {
  from { opacity: 0.3; }
  to { opacity: 0.7; }
}
```

**Weapon slot display — read from weaponDefs:**
```javascript
import { WEAPONS } from '../entities/weaponDefs.js'
// For each weapon in activeWeapons:
//   const def = WEAPONS[weapon.weaponId]
//   Display: def.name (abbreviated), weapon.level, colored by def.color or projectile color
```

### Previous Story Intelligence (4.1)

**Learnings from Story 4.1 to apply:**
- **Interface.jsx pattern** — render components based on `useGame` phase selector. HUD should follow same pattern but render for BOTH 'gameplay' and 'levelUp'.
- **Tailwind tokens work well** — Story 4.1 used `text-game-text`, `bg-game-bg/90`, etc. HUD should use same tokens consistently.
- **LevelUpModal z-index** — LevelUpModal uses `z-50`. HUD should use `z-40` so it renders behind the modal overlay.
- **MainMenu uses fade transition** — HUD doesn't need fade (it appears with gameplay), but consider a quick fade-in for polish.
- **Timer counts UP** — SystemTimer increments from 0. The Story 4.1 review noted this is intentional; HUD must compute countdown as `SYSTEM_TIMER - systemTimer`.
- **Code review finding [AI-Review][MEDIUM]** — React component tests for MainMenu are still pending. Don't need to fix that in this story, but be aware the testing pattern for UI components is not yet established.
- **getState() caching** — Story 4.1 review caught excessive `getState()` calls. In HUD, use Zustand React hooks (not getState) since HUD is a React component that benefits from subscriptions.

### Git Intelligence

Recent commits:
- `eb45e9a` — feat: main menu, system timer, kill counter & phase management (Story 4.1)
- Prior epics established: GameLoop orchestration, store patterns, UI overlay patterns

**Code conventions established:**
- UI components: JSX with Tailwind classes, no CSS modules
- Store subscriptions: individual selectors for performance
- Animations: CSS-based via Tailwind animation utilities or @keyframes
- File naming: PascalCase for components, camelCase for stores

### Project Structure Notes

**Files to CREATE:**
- `src/ui/HUD.jsx` — Main HUD overlay component
- `src/ui/primitives/ProgressBar.jsx` — Reusable progress bar primitive

**Files to MODIFY:**
- `src/ui/Interface.jsx` — Add HUD rendering for gameplay and levelUp phases

**Files NOT to modify:**
- `src/stores/useGame.jsx` — All needed state already exists
- `src/stores/usePlayer.jsx` — All needed state already exists
- `src/stores/useWeapons.jsx` — All needed state already exists
- `src/GameLoop.jsx` — No game logic changes needed
- `src/config/gameConfig.js` — SYSTEM_TIMER already defined (600)
- `src/style.css` — May need minor additions for vignette keyframe, but prefer inline Tailwind

**Potential style.css addition (only if needed):**
- `@keyframes vignettePulse` for low-HP vignette animation
- `@keyframes hpPulse` for HP bar pulse animation
- `@keyframes xpPulse` for XP bar near-full pulse

### Anti-Patterns to Avoid

- Do NOT create a minimap — that's a separate feature requiring 2D canvas rendering of game world; not in this story's ACs
- Do NOT add dash cooldown indicator — that's Tier 2 (Story 5.1)
- Do NOT add audio/SFX to HUD — that's Story 4.5
- Do NOT put game logic in HUD — only read from stores, no mutations
- Do NOT use `useFrame` in HUD — it's a UI component (Layer 6), not a renderer
- Do NOT use `getState()` pattern in HUD — use Zustand React hooks for reactive subscriptions
- Do NOT create separate stores for HUD state — all data comes from existing stores
- Do NOT make HUD interactive (clickable) — it's display-only with `pointer-events-none`
- Do NOT over-engineer ProgressBar — keep it simple with variant-based colors, avoid complex prop APIs

### Testing Approach

- **Unit tests (ProgressBar):** Renders correctly for each variant, width matches value/max ratio, pulse class applied when pulse prop is true
- **Unit tests (HUD):** Renders all sections (HP, timer, kills, XP, weapons), formats timer as MM:SS countdown, shows pulse state when HP < 25%, shows XP pulse when > 85%
- **Integration:** Browser verification — HUD visible during gameplay, data updates in real-time, HUD persists during levelUp modal, responsive at 1080p and 720p

### Scope Summary

This story adds the gameplay HUD — a non-interactive overlay displaying all critical real-time information. The HUD reads from existing stores (useGame, usePlayer, useWeapons) and renders with Tailwind CSS. A reusable ProgressBar primitive is created for HP and XP bars (will be reused by future stories). The red vignette effect at low HP adds urgency feedback.

**Key deliverables:**
1. `ProgressBar.jsx` — reusable bar primitive with variant-based styling and pulse animation
2. `HUD.jsx` — gameplay overlay with HP bar, timer, kill counter, XP bar, weapon slots
3. Low-HP vignette — CSS-based pulsing red screen edge effect
4. Interface.jsx update — route HUD for gameplay + levelUp phases

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — Layer 6 UI
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — Store subscription patterns
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#HUD Gameplay] — HUD layout specification
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — UI palette + functional palette tokens
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography System] — Inter font, tabular-nums, size hierarchy
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Spacing & Layout Foundation] — 4px spacing unit, HUD layout diagram
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — HP critical pulse, XP near-full pulse
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Considerations] — Contrast > 4.5:1, focus visible
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy] — Desktop-first, 1920x1080 primary, 1280x720 must work
- [Source: _bmad-output/planning-artifacts/mockups/4-2-XPBarTop_ChronoTop_and_LifeUnderPlayer.png] — Megabonk HUD reference
- [Source: _bmad-output/implementation-artifacts/4-1-main-menu-game-phase-management.md] — Previous story learnings
- [Source: src/stores/useGame.jsx] — systemTimer, kills, phase
- [Source: src/stores/usePlayer.jsx] — currentHP, maxHP, currentLevel, currentXP, xpToNextLevel
- [Source: src/stores/useWeapons.jsx] — activeWeapons array
- [Source: src/entities/weaponDefs.js] — Weapon definitions (names, colors)
- [Source: src/ui/Interface.jsx] — UI routing pattern
- [Source: src/ui/LevelUpModal.jsx] — UI component pattern reference
- [Source: src/style.css] — Tailwind tokens (game-hp, game-xp, game-timer, etc.)
- [Source: src/config/gameConfig.js] — SYSTEM_TIMER: 600

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- Created `ProgressBar.jsx` — reusable primitive with `value`, `max`, `variant` (hp/xp/cooldown/boss), `pulse` props. Exports `getProgressBarProps()` for testable logic. Uses Tailwind tokens (bg-game-hp, bg-game-xp, bg-game-cooldown) with 150ms CSS transition and animate-pulse-glow animation.
- Created `HUD.jsx` — fixed overlay (z-40, pointer-events-none) with HP bar (top-left), countdown timer + kill counter (top-center), XP bar with level display (bottom), and 4 weapon slots (bottom-right). Exports `formatTimer()`, `shouldPulseHP()`, `shouldPulseXP()` for testable logic.
- Red vignette effect renders when HP < 25% — uses CSS box-shadow inset with `vignettePulse` keyframe animation (500ms ease-in-out alternate, opacity 0.3–0.7).
- Updated `Interface.jsx` to render HUD during both `gameplay` and `levelUp` phases. HUD (z-40) renders behind LevelUpModal (z-50).
- Added `@keyframes vignettePulse` to `style.css` for the low-HP vignette effect.
- All HUD text uses `clamp()` for responsive sizing (readable at 1080p minimum).
- Weapon slots display weapon name abbreviation, level, and use projectileColor from weaponDefs for accent coloring. Empty slots show dimmed placeholders.
- 28 unit tests (12 ProgressBar + 16 HUD logic) — all pass with zero regressions (286/286 total).
- Browser verification confirmed: HP bar updates, timer countdown MM:SS, kill counter increments, XP bar fills, XP pulse at >85%, HP pulse + red vignette at <25%, weapon slots update on level-up, HUD visible behind LevelUpModal.

### Change Log

- 2026-02-09: Story 4.2 — Gameplay HUD implemented (all 8 tasks complete)
- 2026-02-09: Code review — Fixed division-by-zero guards in shouldPulseHP/shouldPulseXP, fixed misleading test comment, added 2 edge case tests (286 total)

### File List

New files:
- src/ui/HUD.jsx
- src/ui/primitives/ProgressBar.jsx
- src/ui/__tests__/ProgressBar.test.jsx
- src/ui/__tests__/HUD.test.jsx

Modified files:
- src/ui/Interface.jsx
- src/style.css
- _bmad-output/implementation-artifacts/sprint-status.yaml
