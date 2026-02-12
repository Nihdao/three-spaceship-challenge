# Story 10.6: Pause Menu with Detailed Inventory

Status: ready-for-dev

## Story

As a player,
I want to pause the game and view my detailed inventory with all equipped weapons, boons, stats, and options to resume or quit,
So that I can review my build and take a break without losing information.

## Acceptance Criteria

1. **Given** the player is in gameplay **When** the player presses ESC or P **Then** the game pauses (GameLoop stops ticking) **And** a pause menu overlay appears with dark background (60% opacity)

2. **Given** the pause menu is open **When** it renders **Then** the top displays "PAUSED" title **And** the menu is divided into sections: Inventory, Stats, Actions

3. **Given** the Inventory section **When** it displays **Then** all equipped weapons are listed with: icon, name, level, damage, cooldown **And** all equipped boons are listed with: icon, name, effect description **And** weapon and boon lists are clearly separated and labeled

4. **Given** the Stats section **When** it displays **Then** player stats are shown: Current HP, Max HP, Speed, Damage Multiplier (from boons) **And** run stats are shown: Time Elapsed, Kills, Level, Score, Fragments **And** stats use StatLine components with tabular-nums

5. **Given** the Actions section **When** it displays **Then** a [R] RESUME button is available and highlighted **And** a [Q] QUIT TO MENU button is available with a warning color **And** keyboard shortcuts (R, Q, ESC) are displayed alongside buttons

6. **Given** the player clicks RESUME or presses ESC/R **When** the action is triggered **Then** the pause menu closes with fade-out animation **And** gameplay resumes immediately

7. **Given** the player clicks QUIT TO MENU **When** the action is triggered **Then** a confirmation dialog appears: "Quit to menu? Progress will be lost." **And** confirming returns to the main menu and resets the run **And** canceling returns to the pause menu

## Tasks / Subtasks

- [ ] Task 1: Implement pause input detection and state management (AC: #1)
  - [ ] 1.1: Add ESC and P key detection to useControlsStore (if not already present)
  - [ ] 1.2: Add `setPaused(true)` trigger in GameLoop when ESC/P pressed during gameplay
  - [ ] 1.3: Verify GameLoop.tick() checks `useGame((s) => s.isPaused)` and skips game logic when true
  - [ ] 1.4: Test pause toggle: ESC → pauses, ESC again → resumes (Story 10.6 AC#6)

- [ ] Task 2: Create PauseMenu component structure (AC: #1, #2)
  - [ ] 2.1: Create `src/ui/PauseMenu.jsx` component
  - [ ] 2.2: Render only when `phase === 'gameplay' && isPaused === true`
  - [ ] 2.3: Dark overlay (60% opacity, bg-black/60) covering full screen
  - [ ] 2.4: Central modal container with sections: Title, Inventory, Stats, Actions
  - [ ] 2.5: Title "PAUSED" at top, large bold text (Story 10.6 AC#2)

- [ ] Task 3: Build Inventory section displaying weapons and boons (AC: #3)
  - [ ] 3.1: Read `useWeapons((s) => s.activeWeapons)` to get equipped weapons array
  - [ ] 3.2: Read `useBoons((s) => s.activeBoons)` to get equipped boons array
  - [ ] 3.3: For each weapon: Display icon/name, level, damage (baseDamage + upgrades), cooldown
  - [ ] 3.4: For each boon: Display icon/name, effect description (from boonDefs.js)
  - [ ] 3.5: Separate weapon and boon lists with labeled sections ("WEAPONS" / "BOONS")
  - [ ] 3.6: Handle empty slots gracefully (if weapon slots < 4, show placeholders or omit)

- [ ] Task 4: Build Stats section with player and run stats (AC: #4)
  - [ ] 4.1: Read player stats: currentHP, maxHP from usePlayer
  - [ ] 4.2: Read speed from usePlayer.shipBaseSpeed (Story 9.3 integration)
  - [ ] 4.3: Read damage multiplier from useBoons computed modifiers (if available)
  - [ ] 4.4: Read run stats: totalElapsedTime, kills, currentLevel, score, fragments (useGame + usePlayer)
  - [ ] 4.5: Use StatLine primitive for each stat row (label + value aligned)
  - [ ] 4.6: Format time as MM:SS using formatTimer() helper (from HUD.jsx)
  - [ ] 4.7: Use tabular-nums for all numeric values (consistent with HUD)

- [ ] Task 5: Build Actions section with Resume and Quit buttons (AC: #5)
  - [ ] 5.1: Create "RESUME" button with [R] keyboard shortcut label
  - [ ] 5.2: Highlight RESUME as primary action (brighter color, larger size)
  - [ ] 5.3: Create "QUIT TO MENU" button with [Q] keyboard shortcut label
  - [ ] 5.4: Style QUIT as warning (red/danger color, border or bg)
  - [ ] 5.5: Display keyboard shortcuts prominently next to or inside buttons

- [ ] Task 6: Implement Resume action (AC: #6)
  - [ ] 6.1: Listen for ESC, R key presses, or RESUME button click
  - [ ] 6.2: When triggered: Call `useGame.getState().setPaused(false)` to unpause
  - [ ] 6.3: Add fade-out animation on pause menu (150-300ms ease-out)
  - [ ] 6.4: Verify GameLoop resumes ticking immediately after unpause
  - [ ] 6.5: Test: ESC pauses → ESC again resumes (toggle behavior)

- [ ] Task 7: Implement Quit to Menu action with confirmation (AC: #7)
  - [ ] 7.1: Listen for Q key press or QUIT button click
  - [ ] 7.2: Show confirmation dialog/modal: "Quit to menu? Progress will be lost."
  - [ ] 7.3: Confirmation dialog has two options: [Confirm] and [Cancel]
  - [ ] 7.4: If Confirm: Call useGame.reset() or returnToMenu() + reset all stores (usePlayer, useWeapons, useBoons, useEnemies)
  - [ ] 7.5: If Cancel: Close confirmation dialog, return to pause menu
  - [ ] 7.6: Test: Quit → Confirm → returns to main menu, all state reset
  - [ ] 7.7: Test: Quit → Cancel → back to pause menu, game still paused

- [ ] Task 8: Polish pause menu styling and UX (AC: #1-7)
  - [ ] 8.1: Modal container: max-width for readability, centered on screen
  - [ ] 8.2: Section spacing: clear visual separation between Inventory, Stats, Actions
  - [ ] 8.3: Typography: Title large (32px+), section headers medium (20px), body text readable (14-16px)
  - [ ] 8.4: Colors: Dark theme (bg-black/60 overlay, bg-game-bg for modal), accent colors for buttons
  - [ ] 8.5: Keyboard navigation: Focus visible ring, Tab navigation between buttons
  - [ ] 8.6: Animations: Fade-in on open (150ms), fade-out on close (150ms), smooth ease-out
  - [ ] 8.7: Responsive sizing: clamp() for modal width, readable at 1080p and 1280x720
  - [ ] 8.8: Ensure pause menu does NOT block HUD visibility when testing (overlay should darken HUD)

- [ ] Task 9: Performance validation and edge cases (NFR1, NFR5)
  - [ ] 9.1: Test pause/resume toggle rapidly (no performance degradation or state corruption)
  - [ ] 9.2: Verify GameLoop truly stops ticking when paused (no game state updates)
  - [ ] 9.3: Test pause during intense combat (100+ enemies, projectiles) - no frame drops
  - [ ] 9.4: Verify inventory lists display correctly with 0-4 weapons, 0-3 boons
  - [ ] 9.5: Test keyboard shortcuts work correctly (ESC, R, Q) without conflicts
  - [ ] 9.6: Test quit confirmation flow thoroughly (Confirm, Cancel, keyboard shortcuts)
  - [ ] 9.7: Verify HUD remains visible behind overlay (dark but not completely hidden)
  - [ ] 9.8: Test pause menu during level-up phase (should NOT be accessible during level-up modal)

- [ ] Task 10: Accessibility and integration (NFR13, NFR15)
  - [ ] 10.1: Keyboard-only navigation works (Tab, Enter, ESC, R, Q)
  - [ ] 10.2: Focus visible rings on all interactive elements
  - [ ] 10.3: Screen reader labels for sections and stats (aria-label)
  - [ ] 10.4: Readable at 1080p minimum (font sizes clamp to minimum readable)
  - [ ] 10.5: Test on different viewport sizes (16:9, 16:10, ultrawide)
  - [ ] 10.6: Verify pause menu does not interfere with other UI (level-up modal, game over screen)
  - [ ] 10.7: Test integration with existing useGame.isPaused state (Story 4.1, GameLoop)
  - [ ] 10.8: Verify quit to menu resets ALL relevant stores (usePlayer, useWeapons, useBoons, useEnemies, useLevel)

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **UI Layer** → PauseMenu.jsx created as new modal component in ui/
- **Stores** → useGame (isPaused), usePlayer (stats), useWeapons (inventory), useBoons (inventory), useLevel (run stats)
- **GameLoop** → Already respects isPaused flag (skip tick when paused)
- **No Game Logic** → PauseMenu is pure display + actions (setPaused, returnToMenu, reset)

**Existing Infrastructure:**
- `src/ui/` — UI components directory (HUD.jsx, LevelUpModal.jsx, etc.)
- `src/ui/primitives/StatLine.jsx` — Reusable stat display component (from Epic 4/8)
- `src/stores/useGame.jsx` — Has `isPaused` state + `setPaused()` action
- `src/stores/usePlayer.jsx` — Provides currentHP, maxHP, currentLevel, fragments, etc.
- `src/stores/useWeapons.jsx` — Provides activeWeapons array
- `src/stores/useBoons.jsx` — Provides activeBoons array (Story 3.4)
- `src/GameLoop.jsx` — Checks isPaused before ticking game systems
- `config/gameConfig.js` — Contains SYSTEM_TIMER, other constants
- `entities/weaponDefs.js` — WEAPONS definitions with baseDamage, baseCooldown
- `entities/boonDefs.js` — BOONS definitions with effect descriptions

**Current Pause Mechanism (Story 4.1, GameLoop):**
- GameLoop.jsx already has `const isPaused = useGame((s) => s.isPaused)`
- GameLoop.tick() early-returns if `isPaused === true`
- useGame has `setPaused(isPaused)` action available
- Level-up modal already sets `isPaused: true` via `triggerLevelUp()` (Story 3.2)

**Story 10.6 Additions:**
- New PauseMenu.jsx component to display when `phase === 'gameplay' && isPaused === true`
- ESC or P key triggers setPaused(true) during gameplay
- PauseMenu shows: Inventory (weapons, boons), Stats (player + run), Actions (Resume, Quit)
- Resume action: setPaused(false) + fade-out animation
- Quit action: Confirmation dialog → reset all stores + returnToMenu()

### Technical Requirements

**PauseMenu Component Structure:**

```jsx
// src/ui/PauseMenu.jsx
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'
import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'
import { formatTimer } from './HUD.jsx'
import StatLine from './primitives/StatLine.jsx'

export default function PauseMenu() {
  const isPaused = useGame((s) => s.isPaused)
  const phase = useGame((s) => s.phase)
  const setPaused = useGame((s) => s.setPaused)
  const returnToMenu = useGame((s) => s.returnToMenu)

  const currentHP = usePlayer((s) => s.currentHP)
  const maxHP = usePlayer((s) => s.maxHP)
  const shipBaseSpeed = usePlayer((s) => s.shipBaseSpeed)
  const currentLevel = usePlayer((s) => s.currentLevel)
  const fragments = usePlayer((s) => s.fragments)

  const kills = useGame((s) => s.kills)
  const score = useGame((s) => s.score)
  const totalElapsedTime = useGame((s) => s.totalElapsedTime)

  const activeWeapons = useWeapons((s) => s.activeWeapons)
  const activeBoons = useBoons((s) => s.activeBoons)

  const [showQuitConfirm, setShowQuitConfirm] = useState(false)

  // Only render during gameplay phase when paused
  if (phase !== 'gameplay' || !isPaused) return null

  // Handle ESC/R to resume
  useEffect(() => {
    const handleKey = (e) => {
      if (showQuitConfirm) return // Don't handle if confirmation dialog open
      if (e.key === 'Escape' || e.key === 'r' || e.key === 'R') {
        setPaused(false)
      } else if (e.key === 'q' || e.key === 'Q') {
        setShowQuitConfirm(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setPaused, showQuitConfirm])

  const handleResume = () => {
    setPaused(false)
  }

  const handleQuit = () => {
    setShowQuitConfirm(true)
  }

  const handleConfirmQuit = () => {
    // Reset all stores
    usePlayer.getState().reset()
    useWeapons.getState().reset()
    useBoons.getState().reset()
    useEnemies.getState().reset()
    useLevel.getState().reset()
    returnToMenu()
  }

  const handleCancelQuit = () => {
    setShowQuitConfirm(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-game animate-fadeIn">
      {/* Main pause modal */}
      <div
        className="bg-game-bg border border-game-border rounded-lg shadow-2xl max-w-2xl w-full mx-4 p-6"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Title */}
        <h1 className="text-4xl font-bold text-game-text text-center mb-6">PAUSED</h1>

        {/* Inventory Section */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold text-game-text mb-3">INVENTORY</h2>

          {/* Weapons */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-game-text-muted mb-2">WEAPONS</h3>
            <div className="space-y-2">
              {activeWeapons.filter(w => w).map((weapon, idx) => {
                const def = WEAPONS[weapon.weaponId]
                const damage = def?.baseDamage + (weapon.level - 1) * (def?.upgrades?.[0]?.damage || 0)
                const cooldown = def?.baseCooldown - (weapon.level - 1) * 0.05
                return (
                  <div key={idx} className="flex items-center justify-between bg-game-bg-lighter p-2 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{def?.icon || '⚡'}</span>
                      <div>
                        <div className="text-game-text font-semibold">{def?.name} (Lv{weapon.level})</div>
                        <div className="text-sm text-game-text-muted">Damage: {damage} | Cooldown: {cooldown.toFixed(2)}s</div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {activeWeapons.filter(w => w).length === 0 && (
                <div className="text-game-text-muted italic">No weapons equipped</div>
              )}
            </div>
          </div>

          {/* Boons */}
          <div>
            <h3 className="text-lg font-semibold text-game-text-muted mb-2">BOONS</h3>
            <div className="space-y-2">
              {activeBoons.filter(b => b).map((boon, idx) => {
                const def = BOONS[boon.boonId]
                return (
                  <div key={idx} className="flex items-center justify-between bg-game-bg-lighter p-2 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{def?.icon || '✨'}</span>
                      <div>
                        <div className="text-game-text font-semibold">{def?.name}</div>
                        <div className="text-sm text-game-text-muted">{def?.description}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {activeBoons.filter(b => b).length === 0 && (
                <div className="text-game-text-muted italic">No boons equipped</div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold text-game-text mb-3">STATS</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <StatLine label="Current HP" value={`${Math.ceil(currentHP)} / ${maxHP}`} />
            <StatLine label="Level" value={currentLevel} />
            <StatLine label="Speed" value={shipBaseSpeed} />
            <StatLine label="Score" value={score.toLocaleString('en-US')} />
            <StatLine label="Time Elapsed" value={formatTimer(totalElapsedTime)} />
            <StatLine label="Kills" value={kills.toLocaleString('en-US')} />
            <StatLine label="Fragments" value={fragments.toLocaleString('en-US')} />
          </div>
        </section>

        {/* Actions Section */}
        <section className="flex gap-4 justify-center">
          <button
            onClick={handleResume}
            className="px-6 py-3 bg-game-primary text-black font-bold rounded hover:bg-game-primary/80 transition"
          >
            [R] RESUME
          </button>
          <button
            onClick={handleQuit}
            className="px-6 py-3 bg-game-danger text-white font-bold rounded hover:bg-game-danger/80 transition"
          >
            [Q] QUIT TO MENU
          </button>
        </section>
      </div>

      {/* Quit Confirmation Dialog */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80">
          <div className="bg-game-bg border border-game-danger rounded-lg p-6 max-w-md mx-4">
            <h2 className="text-2xl font-bold text-game-danger mb-4">Quit to menu?</h2>
            <p className="text-game-text mb-6">Progress will be lost.</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleConfirmQuit}
                className="px-6 py-2 bg-game-danger text-white font-bold rounded hover:bg-game-danger/80"
              >
                Confirm
              </button>
              <button
                onClick={handleCancelQuit}
                className="px-6 py-2 bg-game-border text-game-text font-bold rounded hover:bg-game-border/80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

**ESC/P Key Detection (in GameLoop or useControlsStore):**

```jsx
// In GameLoop.jsx or dedicated input handler
useEffect(() => {
  const handleKey = (e) => {
    const phase = useGame.getState().phase
    const isPaused = useGame.getState().isPaused

    // Only allow pause toggle during gameplay phase
    if (phase !== 'gameplay') return

    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      useGame.getState().setPaused(!isPaused)
    }
  }
  window.addEventListener('keydown', handleKey)
  return () => window.removeEventListener('keydown', handleKey)
}, [])
```

**StatLine Primitive (Reusable from Epic 4/8):**

```jsx
// src/ui/primitives/StatLine.jsx
export default function StatLine({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-game-text-muted text-sm">{label}</span>
      <span className="text-game-text font-bold tabular-nums">{value}</span>
    </div>
  )
}
```

### Previous Story Intelligence (Story 10.5 - Boon Slots)

**Patterns to Reuse:**
- **Stat display with icons** — Boon slots show icon + name + description. Pause menu weapons/boons follow same pattern (icon + name + metadata)
- **Tabular-nums for numbers** — All numeric values in pause menu use tabular-nums for alignment
- **Responsive sizing with clamp()** — Pause menu modal uses clamp() for width, font sizes
- **Fade animations** — Pause menu fade-in/out matches boon slot update animation timing (150-300ms ease-out)
- **GPU-accelerated animations** — Use transform (scale/translate) + opacity, not layout properties

**From Story 10.4 (HP & Item Slots):**
- **Top-left cluster pattern** — Pause menu follows same vertical stacking: Title → Section 1 → Section 2 → Actions
- **Responsive clamp sizing** — Modal width: `clamp(320px, 40vw, 720px)`, font sizes match HUD patterns
- **Update animation pattern** — Fade-in on open (150ms), fade-out on close (150ms)

**From Story 10.2 (Top Stats Display):**
- **AnimatedStat pattern** — Pause menu stats use same StatLine primitive with tabular-nums
- **formatTimer() helper** — Reuse from HUD.jsx to format totalElapsedTime as MM:SS

**From Story 10.1 (XP Bar Redesign):**
- **GPU-accelerated animations** — Pause menu fade uses opacity transition (GPU-accelerated)
- **Pulse effects** — No pulse needed in pause menu, but can reuse animation timing patterns

### UX Design Specification Compliance

**From UX Doc (Epic 10 + General UI Patterns):**
- **Keyboard-first navigation** — ESC/R/Q shortcuts, Tab navigation between buttons
- **Dark UI theme** — bg-black/60 overlay, bg-game-bg for modal, consistent with Cyber Minimal design
- **Typography** — Inter font, Title 32-40px, Section headers 20-24px, Body 14-16px, tabular-nums for stats
- **Animation timing** — Fade-in 150ms, fade-out 150ms (ease-out default from UX doc)
- **Spacing** — 4px base spacing unit (gap-2, gap-4, p-6 for modal padding)
- **Accessibility** — Contrast > 4.5:1, focus visible rings, keyboard-navigable, readable at 1080p

**Pause Menu Specific (from Epic 10 Story 10.6):**
- **3 Sections** — Inventory (weapons + boons), Stats (player + run), Actions (Resume + Quit)
- **Resume highlighted** — Primary button (brighter color, larger or centered)
- **Quit warning** — Danger color (red), confirmation dialog to prevent accidental quits
- **Keyboard shortcuts visible** — [R] RESUME, [Q] QUIT TO MENU labels alongside buttons
- **Fade animations** — Modal fade-in on pause (150ms), fade-out on resume (150ms)

**Color Palette (from UX Doc):**
- Overlay background: `bg-black/60` (60% opacity dark overlay)
- Modal background: `bg-game-bg` (dark, semi-transparent)
- Title text: `text-game-text` (white/off-white)
- Section headers: `text-game-text` (white/off-white)
- Body text: `text-game-text-muted` (gray)
- Resume button: `bg-game-primary` (cyan/bright accent) + `text-black`
- Quit button: `bg-game-danger` (red) + `text-white`
- Confirmation dialog: `border-game-danger` (red border), `bg-black/80` overlay

### Architecture Guardrails

**File Structure Requirements (Architecture.md):**
```
src/ui/PauseMenu.jsx         — New component (pause modal)
src/ui/primitives/StatLine.jsx  — Reusable stat display (already exists from Epic 4/8)
src/stores/useGame.jsx        — No changes (isPaused, setPaused, returnToMenu already exist)
src/stores/usePlayer.jsx      — No changes (stats read-only)
src/stores/useWeapons.jsx     — No changes (activeWeapons read-only)
src/stores/useBoons.jsx       — No changes (activeBoons read-only)
src/GameLoop.jsx              — Minor change: Add ESC/P key listener to toggle pause
```

**Layer Boundaries (Architecture.md 6-Layer):**
- **UI Layer** — PauseMenu.jsx reads from stores, dispatches actions (setPaused, returnToMenu, reset)
- **Stores** — useGame, usePlayer, useWeapons, useBoons provide state, no rendering
- **No Game Logic in UI** — PauseMenu is pure visual display + actions, no calculations

**Anti-Patterns to AVOID:**
- DO NOT put game logic in PauseMenu (read-only from stores)
- DO NOT mutate store state directly from PauseMenu (use actions: setPaused, returnToMenu, reset)
- DO NOT create new store for pause state (use existing useGame.isPaused)
- DO NOT animate layout properties (width, height, margin) — use transform, opacity only
- DO NOT block GameLoop ticking manually — GameLoop already checks isPaused flag

**Coding Standards (Architecture.md Naming):**
- Component: `PauseMenu.jsx` (PascalCase)
- CSS classes: Tailwind utility classes
- Inline styles: camelCase properties (backgroundColor, borderRadius)
- Store subscriptions: Individual selectors for performance (useGame((s) => s.isPaused))

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- PauseMenu rendering is lightweight HTML (no 3D rendering)
- Fade animations use GPU-accelerated properties (opacity, transform)
- Individual store selectors prevent unnecessary re-renders (only update when specific fields change)
- Pause menu only renders when `phase === 'gameplay' && isPaused === true` (conditional render)

**NFR5: No Frame Drops During UI Updates:**
- Fade-in/out animations use CSS transitions (GPU-accelerated) instead of JavaScript setInterval
- No complex calculations in PauseMenu render (all data pre-computed in stores)
- Inventory lists are static once opened (no continuous updates while paused)

**Implementation Recommendation:**
```javascript
// GOOD (GPU-accelerated fade animation):
<div className="animate-fadeIn" /> // Tailwind animation
// Or inline:
<div style={{ animation: 'fadeIn 150ms ease-out' }} />

// BAD (CPU-bound, causes reflows):
<div style={{ opacity: visible ? 1 : 0, transition: 'all 150ms' }} /> // 'all' is expensive
```

**Selector Optimization:**
```javascript
// GOOD (individual selectors):
const isPaused = useGame((s) => s.isPaused)
const currentHP = usePlayer((s) => s.currentHP)

// BAD (entire store re-renders on any change):
const { isPaused } = useGame()
const { currentHP } = usePlayer()
```

### Git Intelligence (Recent Patterns)

**From commit c7c0e97 (Story 10.2 — Top Stats Display):**
- Files modified: `src/ui/HUD.jsx` (added AnimatedStat component for kills, fragments, score)
- Pattern: Stat display with icon + value, update animation on value change
- Applied to Story 10.6: StatLine primitive for pause menu stats

**From commit 3d4d52c (Story 10.1 — XP Bar Code Review):**
- Files modified: `src/ui/HUD.jsx`, `src/ui/XPBarFullWidth.jsx`
- Pattern: Full-width bar at absolute top, GPU-accelerated animations

**Applied to Story 10.6:**
- PauseMenu will be modified in `src/ui/PauseMenu.jsx` (new file)
- No new stores needed (read from existing useGame, usePlayer, useWeapons, useBoons)
- GameLoop.jsx minor modification (add ESC/P key listener)
- Inline rendering for pause menu (no separate sub-components unless complexity warrants it)

**Code Patterns from Recent Commits:**
- Inline styles for dynamic values (positions, colors, sizes)
- Tailwind classes for static styling where applicable
- clamp() for responsive sizing across resolutions
- Animation via CSS classes or inline styles (animation property)
- Individual store selectors for performance (avoid unnecessary re-renders)

### Testing Checklist

**Functional Testing:**
- [ ] ESC key pauses during gameplay, opens pause menu
- [ ] P key pauses during gameplay, opens pause menu
- [ ] Pause menu displays: Title "PAUSED", Inventory, Stats, Actions
- [ ] Inventory section shows all equipped weapons with icon, name, level, damage, cooldown
- [ ] Inventory section shows all equipped boons with icon, name, effect description
- [ ] Weapons and boons are clearly separated and labeled
- [ ] Stats section shows player stats: Current HP, Max HP, Speed, Damage Multiplier
- [ ] Stats section shows run stats: Time Elapsed, Kills, Level, Score, Fragments
- [ ] Stats use tabular-nums for alignment
- [ ] Resume button ([R]) is highlighted as primary action
- [ ] Quit button ([Q]) has warning color (red/danger)
- [ ] ESC key resumes gameplay (closes pause menu)
- [ ] R key resumes gameplay (closes pause menu)
- [ ] Resume button click resumes gameplay
- [ ] Q key opens quit confirmation dialog
- [ ] Quit button click opens quit confirmation dialog
- [ ] Quit confirmation dialog shows: "Quit to menu? Progress will be lost."
- [ ] Confirm quit returns to main menu and resets all stores
- [ ] Cancel quit closes confirmation, returns to pause menu
- [ ] GameLoop stops ticking when paused (no game state updates)
- [ ] GameLoop resumes ticking immediately after unpause

**Visual Testing:**
- [ ] Pause menu overlay is dark (60% opacity) covering full screen
- [ ] Modal container is centered, max-width for readability
- [ ] Title "PAUSED" is large, bold, prominent at top
- [ ] Sections (Inventory, Stats, Actions) have clear visual separation
- [ ] Typography follows UX spec: Title 32-40px, Sections 20-24px, Body 14-16px
- [ ] Colors match UX spec: Dark theme, cyan/danger accents
- [ ] Resume button is highlighted (brighter, primary accent color)
- [ ] Quit button has danger color (red border or bg)
- [ ] Keyboard shortcuts ([R], [Q], ESC) are visible and clear
- [ ] Fade-in animation on pause (150ms) is smooth
- [ ] Fade-out animation on resume (150ms) is smooth
- [ ] Quit confirmation dialog overlays pause menu with darker bg
- [ ] StatLine components align label and value correctly
- [ ] Tabular-nums work correctly for all numeric values
- [ ] HUD remains visible (darkened) behind pause overlay

**Animation Testing:**
- [ ] Fade-in animation triggers when pause menu opens (150ms ease-out)
- [ ] Fade-out animation triggers when pause menu closes (150ms ease-out)
- [ ] No visual jitter or layout shifts during animations
- [ ] Animations are GPU-accelerated (use opacity, transform)
- [ ] No frame drops during fade animations (60 FPS maintained)

**Performance Testing:**
- [ ] 60 FPS maintained when pause menu is open
- [ ] No frame drops when toggling pause rapidly (ESC spam test)
- [ ] Pause menu renders correctly with 100+ enemies on screen (stress test)
- [ ] Individual selectors prevent unnecessary re-renders (only update when specific fields change)
- [ ] GameLoop truly stops ticking when paused (no game state updates, no CPU usage)

**Edge Case Testing:**
- [ ] Pause menu works with 0 weapons equipped (show "No weapons equipped")
- [ ] Pause menu works with 1-4 weapons equipped
- [ ] Pause menu works with 0 boons equipped (show "No boons equipped")
- [ ] Pause menu works with 1-3 boons equipped
- [ ] Pause NOT accessible during level-up modal (phase !== 'gameplay')
- [ ] Pause NOT accessible during boss phase (optional, depends on design decision)
- [ ] ESC key during quit confirmation dialog does NOT resume (confirmation takes priority)
- [ ] Rapidly toggling pause (ESC spam) does not corrupt game state
- [ ] Quit confirmation → Cancel → Resume works correctly
- [ ] Quit confirmation → Confirm → Menu → Play again works correctly (all state reset)

**Accessibility Testing:**
- [ ] Keyboard-only navigation works (Tab, Enter, ESC, R, Q)
- [ ] Focus visible rings on all interactive elements (buttons, confirmation dialog)
- [ ] Screen reader labels for sections and stats (aria-label)
- [ ] Readable at 1080p minimum (font sizes clamp to minimum readable)
- [ ] Works on different viewport sizes (16:9, 16:10, ultrawide)
- [ ] Pause menu does not interfere with other UI (level-up modal, game over screen)
- [ ] Contrast meets accessibility standards (>4.5:1) for all text

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 10 Story 10.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#UI Layer]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Keyboard Navigation]
- [Source: _bmad-output/implementation-artifacts/10-5-boon-slots-visibility-display.md#Visual Distinction]
- [Source: _bmad-output/implementation-artifacts/10-4-hp-item-slots-reorganization-top-left-cluster.md#Update Animation]
- [Source: _bmad-output/implementation-artifacts/10-2-top-stats-display-score-fragments-level-kills.md#Stat Display]
- [Source: _bmad-output/implementation-artifacts/10-1-xp-bar-redesign-full-width-top.md#Animation Patterns]
- [Source: src/ui/HUD.jsx — formatTimer() helper, AnimatedStat pattern]
- [Source: src/ui/primitives/StatLine.jsx — Reusable stat display component]
- [Source: src/stores/useGame.jsx — isPaused, setPaused, returnToMenu actions]
- [Source: src/stores/usePlayer.jsx — currentHP, maxHP, shipBaseSpeed, currentLevel, fragments]
- [Source: src/stores/useWeapons.jsx — activeWeapons array]
- [Source: src/stores/useBoons.jsx — activeBoons array]
- [Source: src/entities/weaponDefs.js — WEAPONS definitions]
- [Source: src/entities/boonDefs.js — BOONS definitions]
- [Source: config/gameConfig.js — SYSTEM_TIMER, other constants]
- [Source: src/GameLoop.jsx — isPaused check, tick() logic]

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled by dev agent)

### Completion Notes List

(To be filled by dev agent)

### File List

(To be filled by dev agent)
