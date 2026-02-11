# Story 9.1: Ship Selection UI

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to select my spaceship from a grid of variants before starting a run,
So that I can choose a playstyle that fits my preferences.

## Acceptance Criteria

**Given** the player clicks PLAY from the main menu
**When** the ship selection screen appears
**Then** the screen layout is split: left side shows a grid of ship variants, right side shows selected ship details

**Given** the ship grid (left side)
**When** it renders
**Then** ship variants are displayed as cards in a grid (2-3 columns)
**And** each card shows: ship icon/thumbnail, ship name
**And** locked ships are grayed out with a lock icon (for future unlockable variants)
**And** at least 1 ship is unlocked by default

**Given** the player hovers or selects a ship card
**When** interaction occurs
**Then** the card highlights with visual feedback
**And** the right panel updates to show the selected ship's details

**Given** the ship selection screen
**When** the player confirms their choice
**Then** a "START" button is available (bottom-right or center-bottom)
**And** clicking START begins the gameplay with the selected ship
**And** the selected ship persists for the run

**Given** the player wants to return
**When** a BACK button is clicked
**Then** the player returns to the main menu

## Tasks / Subtasks

- [ ] Task 1: Create ShipSelect phase and UI component (AC: #1, #4)
  - [ ] 1.1: Add 'shipSelect' phase to useGame store phases list
  - [ ] 1.2: Create src/ui/ShipSelect.jsx component with split layout (left grid, right detail panel)
  - [ ] 1.3: Wire ShipSelect to render in Interface.jsx when phase === 'shipSelect'
  - [ ] 1.4: Update MainMenu PLAY button click to transition to 'shipSelect' instead of directly to gameplay
  - [ ] 1.5: Add BACK button in ShipSelect that returns to 'menu' phase

- [ ] Task 2: Create ship definitions data (AC: #2, from Story 9.2)
  - [ ] 2.1: Create src/entities/shipDefs.js with at least 1 ship variant (e.g., BALANCED)
  - [ ] 2.2: Define ship properties: id, name, description, baseHP, baseSpeed, baseDamageMultiplier, locked status
  - [ ] 2.3: Mark first ship (BALANCED) as unlocked: true, others as locked: true for future
  - [ ] 2.4: Add modelPath pointing to existing Spaceship.glb or placeholder
  - [ ] 2.5: Export SHIPS object with all variants

- [ ] Task 3: Implement ship grid (left panel) (AC: #2)
  - [ ] 3.1: Map over SHIPS array to render grid of ShipCard components
  - [ ] 3.2: Use CSS Grid with 2-3 columns (grid-cols-2 md:grid-cols-3)
  - [ ] 3.3: Each ShipCard shows: ship icon/thumbnail (placeholder box or tiny 3D preview), ship name
  - [ ] 3.4: Locked ships: gray out card, add lock icon, disable interaction
  - [ ] 3.5: Unlocked ships: full color, clickable/hoverable
  - [ ] 3.6: Selected ship: highlight with border or glow effect

- [ ] Task 4: Implement ship detail panel (right side) (AC: #3, from Story 9.2)
  - [ ] 4.1: Display selected ship's name prominently
  - [ ] 4.2: Display ship description text
  - [ ] 4.3: Display base stats in StatLine format: HP, Speed, Damage (with tabular-nums)
  - [ ] 4.4: Optionally show ship 3D preview (if time allows) using same ship model scaled down
  - [ ] 4.5: Panel updates reactively when player selects different ship card

- [ ] Task 5: Implement selection state management (AC: #2, #3)
  - [ ] 5.1: Add local state in ShipSelect.jsx: selectedShipId (default to first unlocked ship)
  - [ ] 5.2: Add shipId to usePlayer store (currentShipId field for selected ship)
  - [ ] 5.3: On ship card click, update selectedShipId local state → right panel updates
  - [ ] 5.4: Keyboard navigation: arrow keys navigate grid, Enter selects ship (optional but nice)

- [ ] Task 6: Implement START button and gameplay integration (AC: #3, from Story 9.3)
  - [ ] 6.1: Add START button in bottom-right or center-bottom of ShipSelect UI
  - [ ] 6.2: START button enabled only if a ship is selected (always true for now, 1 ship unlocked)
  - [ ] 6.3: On START click: store selectedShipId in usePlayer.currentShipId, transition to gameplay phase
  - [ ] 6.4: usePlayer.reset() should initialize from SHIPS[currentShipId] stats (baseHP, baseSpeed, baseDamageMultiplier)
  - [ ] 6.5: GameplayScene uses currentShipId to determine which ship model to render

- [ ] Task 7: Keyboard navigation and accessibility (AC: #2, #4)
  - [ ] 7.1: Arrow keys navigate ship grid (Left/Right/Up/Down)
  - [ ] 7.2: Enter or Space confirms selection and focuses START button
  - [ ] 7.3: Pressing START (Enter/click) transitions to gameplay
  - [ ] 7.4: ESC or BACK button returns to main menu
  - [ ] 7.5: Focus management: auto-focus first unlocked ship on mount

- [ ] Task 8: Visual polish and styling (AC: #1, #2, #3)
  - [ ] 8.1: Use Tailwind CSS with game design tokens (game-bg, game-primary, game-text)
  - [ ] 8.2: Left panel: dark background, cards with borders, hover effects
  - [ ] 8.3: Right panel: similar dark background, clean typography, stat display with icons
  - [ ] 8.4: Locked ships: opacity-50, grayscale filter, lock icon overlay
  - [ ] 8.5: Selected ship: border-game-primary, subtle glow or scale effect
  - [ ] 8.6: START button: prominent, game-primary bg, hover effects
  - [ ] 8.7: BACK button: subtle, top-left corner, game-text-muted

- [ ] Task 9: Integration with existing flow (AC: #4, from Story 9.3)
  - [ ] 9.1: Verify MainMenu PLAY → ShipSelect → Gameplay flow works end-to-end
  - [ ] 9.2: Verify BACK button returns to MainMenu without breaking state
  - [ ] 9.3: Verify selected ship stats apply correctly in gameplay (HP, speed, damage)
  - [ ] 9.4: Verify ship model renders correctly in GameplayScene (if model switching implemented)
  - [ ] 9.5: Verify multiple runs: can reselect ship between runs

- [ ] Task 10: Optional enhancements (time permitting)
  - [ ] 10.1: Add ship preview 3D scene in right panel (mini Canvas with ship model rotating)
  - [ ] 10.2: Add SFX on ship selection (selection_confirm.mp3)
  - [ ] 10.3: Add hover sound on ship cards (hover.mp3 — already exists for menus)
  - [ ] 10.4: Add tooltips for locked ships explaining unlock requirements (future feature)
  - [ ] 10.5: Add transition animation when entering/exiting ship selection screen

## Dev Notes

### Mockup Reference Analysis

**Mockup file:** `_bmad-output/planning-artifacts/mockups/9-1-CharacterSelect.png`

The mockup shows a character selection screen from what appears to be a League of Legends-style game. Key design elements observed:

**Layout structure:**
- **Left side (60-70% width):** Grid of character portraits in a scrollable panel. Characters are displayed as square cards with portraits and names. Grid appears to be 4 columns.
- **Right side (30-40% width):** Selected character detail panel showing:
  - Large character portrait/model at top
  - Character name prominently displayed
  - Character role/type indicators
  - Ability icons/descriptions (4-5 abilities shown)
  - Stats or attribute information
- **Bottom bar:** Contains action buttons (likely "Lock In" / "Confirm" equivalent to our START button)

**Visual style:**
- Dark theme with semi-transparent overlays
- Selected character highlighted with bright border (appears gold/yellow)
- Rich visual hierarchy with icons, borders, and color coding
- Character portraits are high-quality art assets

**Design decisions to adopt for ship selection:**

1. **Split layout confirmed** — Left grid (ship cards) + Right detail panel (selected ship info) is the correct approach per mockup
2. **Grid density** — Mockup uses 4 columns; for ships we should use 2-3 columns (fewer ships initially, larger cards for better 3D preview visibility)
3. **Selection highlight** — Bold border around selected card (use game-primary color for consistency)
4. **Detail panel content** — Large visual at top (ship 3D preview if time allows), name + description + stats below
5. **Bottom action buttons** — START button prominent at bottom (like "Lock In"), BACK button subtle in corner
6. **Locked items** — Mockup doesn't show locked state clearly, but standard pattern: grayscale + lock icon + reduced opacity
7. **Scrollable grid** — Not needed initially (only 1 ship), but structure should support future expansion

**Adaptations for our game:**
- Simpler visual style (less ornate than LoL) — clean "cyber minimal" aesthetic per UX spec
- Ship cards can use placeholder boxes initially, optionally tiny 3D previews later
- Stats in right panel: HP, Speed, Damage (simpler than LoL ability details)
- No role indicators needed (all ships are DPS-focused)

### Architecture Decisions

**Phase management:**
- Add new 'shipSelect' phase to useGame store phase enum
- Flow: 'menu' → (PLAY click) → 'shipSelect' → (START click) → 'gameplay'
- BACK button: 'shipSelect' → 'menu'

**Ship data structure:**
- Create `src/entities/shipDefs.js` similar to weaponDefs.js, enemyDefs.js pattern
- Each ship: `{ id, name, description, baseHP, baseSpeed, baseDamageMultiplier, locked, modelPath }`
- Initially only 1 ship (BALANCED) with `locked: false`, others `locked: true` for future unlockables

**State management:**
- `usePlayer` store gains `currentShipId` field (string, defaults to first unlocked ship ID)
- `usePlayer.reset()` reads from `SHIPS[currentShipId]` to initialize baseHP, baseSpeed, baseDamageMultiplier
- ShipSelect.jsx has local state for `selectedShipId` (preview selection before confirming)

**UI component structure:**
- `src/ui/ShipSelect.jsx` — main component, split layout
- `src/ui/components/ShipCard.jsx` (optional) — individual ship card for grid
- Render via `Interface.jsx` when `phase === 'shipSelect'`

**Model rendering:**
- Story 9.1 focuses on UI — ship model switching in GameplayScene is **optional**
- If implemented: PlayerShip.jsx reads `usePlayer.currentShipId` and loads corresponding GLB
- If skipped: all ships use same Spaceship.glb model (stats differentiation only)

**Keyboard navigation:**
- Arrow keys to navigate grid (like MainMenu arrows navigate buttons)
- Enter/Space to select ship and focus START button
- ESC to go back to menu
- Pattern: maintain focus state, use useEffect with keyboard event listeners

### Existing Infrastructure Status

| Component | Status | Relevance |
|-----------|--------|-----------|
| `src/stores/useGame.jsx` | **Has phase management (menu, gameplay, boss, tunnel, gameOver, victory)** | Extend phases enum with 'shipSelect' |
| `src/stores/usePlayer.jsx` | **Manages player HP, position, speed, damage** | Add currentShipId field, update reset() to initialize from ship stats |
| `src/ui/MainMenu.jsx` | **PLAY button triggers transition to gameplay** | Change PLAY click to transition to 'shipSelect' instead |
| `src/ui/Interface.jsx` | **Renders UI components per phase** | Add case for phase === 'shipSelect' → render <ShipSelect /> |
| `src/scenes/GameplayScene.jsx` | **Renders PlayerShip** | Optionally read usePlayer.currentShipId to load different model |
| `src/components/PlayerShip.jsx` | **Renders player ship model** | Optionally make model dynamic based on currentShipId |
| `public/models/ships/Spaceship.glb` | **Default ship model** | Use as BALANCED ship model, or all ships for now |

### Key Implementation Details

**shipDefs.js structure:**
```javascript
// src/entities/shipDefs.js
export const SHIPS = {
  BALANCED: {
    id: 'BALANCED',
    name: 'Vanguard',
    description: 'Well-rounded ship with balanced stats. Perfect for beginners.',
    baseHP: 100,
    baseSpeed: 50,
    baseDamageMultiplier: 1.0,
    locked: false,
    modelPath: '/models/ships/Spaceship.glb', // Existing model
  },
  // Future ships (locked for Story 9.1):
  GLASS_CANNON: {
    id: 'GLASS_CANNON',
    name: 'Striker',
    description: 'High damage but low HP. High risk, high reward.',
    baseHP: 60,
    baseSpeed: 60,
    baseDamageMultiplier: 1.5,
    locked: true, // Not available yet
    modelPath: '/models/ships/Spaceship.glb', // Same model for now
  },
  TANK: {
    id: 'TANK',
    name: 'Fortress',
    description: 'High HP and durability. Slower but survives longer.',
    baseHP: 150,
    baseSpeed: 40,
    baseDamageMultiplier: 0.8,
    locked: true, // Not available yet
    modelPath: '/models/ships/Spaceship.glb', // Same model for now
  },
}

// Helper to get first unlocked ship
export function getDefaultShipId() {
  const unlocked = Object.values(SHIPS).find(ship => !ship.locked)
  return unlocked?.id || 'BALANCED'
}
```

**ShipSelect.jsx structure:**
```javascript
import { useState, useEffect } from 'react'
import useGame from '../stores/useGame'
import usePlayer from '../stores/usePlayer'
import { SHIPS } from '../entities/shipDefs'

export default function ShipSelect() {
  const setPhase = useGame(state => state.setPhase)
  const setCurrentShipId = usePlayer(state => state.setCurrentShipId)

  // Local state for preview selection
  const [selectedShipId, setSelectedShipId] = useState(
    Object.values(SHIPS).find(s => !s.locked)?.id || 'BALANCED'
  )

  const selectedShip = SHIPS[selectedShipId]
  const unlockedShips = Object.values(SHIPS).filter(s => !s.locked)

  const handleShipClick = (shipId) => {
    if (SHIPS[shipId].locked) return
    setSelectedShipId(shipId)
    // TODO: Play selection SFX
  }

  const handleStart = () => {
    setCurrentShipId(selectedShipId)
    // TODO: Play confirm SFX
    setPhase('gameplay')
  }

  const handleBack = () => {
    setPhase('menu')
  }

  // TODO: Keyboard navigation (arrows, Enter, ESC)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-game-bg/95">
      {/* BACK button */}
      <button
        onClick={handleBack}
        className="absolute top-8 left-8 px-4 py-2 text-game-text-muted hover:text-game-text transition-colors"
      >
        ← BACK
      </button>

      <div className="flex gap-8 w-full h-full max-w-7xl p-8">
        {/* LEFT: Ship Grid */}
        <div className="flex-1 overflow-y-auto">
          <h2 className="text-2xl font-bold text-game-text mb-4">SELECT YOUR SHIP</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.values(SHIPS).map(ship => (
              <button
                key={ship.id}
                onClick={() => handleShipClick(ship.id)}
                disabled={ship.locked}
                className={`
                  relative p-4 border-2 rounded-lg transition-all
                  ${ship.locked
                    ? 'opacity-50 grayscale cursor-not-allowed border-game-text-muted/30'
                    : 'hover:scale-105 cursor-pointer border-game-text-muted/50 hover:border-game-primary/50'
                  }
                  ${selectedShipId === ship.id && !ship.locked
                    ? 'border-game-primary shadow-lg shadow-game-primary/30'
                    : ''
                  }
                `}
              >
                {/* Ship icon/thumbnail (placeholder box for now) */}
                <div className="aspect-square bg-game-text-muted/10 rounded mb-2 flex items-center justify-center">
                  {ship.locked ? (
                    <span className="text-4xl">🔒</span>
                  ) : (
                    <span className="text-2xl">🚀</span>
                  )}
                </div>
                <p className="text-game-text font-semibold">{ship.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Ship Detail Panel */}
        <div className="w-96 bg-game-bg/50 border border-game-text-muted/30 rounded-lg p-6 flex flex-col">
          <h3 className="text-xl font-bold text-game-text mb-2">{selectedShip.name}</h3>
          <p className="text-game-text-muted mb-6">{selectedShip.description}</p>

          {/* Stats */}
          <div className="space-y-2 mb-auto">
            <div className="flex justify-between">
              <span className="text-game-text-muted">HP</span>
              <span className="text-game-text font-bold tabular-nums">{selectedShip.baseHP}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-game-text-muted">Speed</span>
              <span className="text-game-text font-bold tabular-nums">{selectedShip.baseSpeed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-game-text-muted">Damage</span>
              <span className="text-game-text font-bold tabular-nums">{selectedShip.baseDamageMultiplier}x</span>
            </div>
          </div>

          {/* START button */}
          <button
            onClick={handleStart}
            className="w-full py-3 bg-game-primary text-game-bg font-bold rounded-lg hover:scale-105 transition-transform"
          >
            START
          </button>
        </div>
      </div>
    </div>
  )
}
```

**useGame phase extension:**
```javascript
// src/stores/useGame.jsx
// Existing phases: 'menu', 'gameplay', 'levelUp', 'boss', 'tunnel', 'gameOver', 'victory'
// Add: 'shipSelect'

// In INITIAL_STATE, ensure phase defaults to 'menu'
// Add 'shipSelect' to any phase validation logic if present
```

**usePlayer extension:**
```javascript
// src/stores/usePlayer.jsx
import { SHIPS, getDefaultShipId } from '../entities/shipDefs'

// Add to INITIAL_STATE:
currentShipId: getDefaultShipId(), // 'BALANCED'

// Add action:
setCurrentShipId: (shipId) => set({ currentShipId: shipId }),

// Update reset() method:
reset: () => {
  const { currentShipId } = get()
  const ship = SHIPS[currentShipId]
  set({
    // ... existing reset fields
    currentHP: ship.baseHP,
    maxHP: ship.baseHP,
    // Speed and damage multiplier used in tick logic
  })
},
```

### Previous Story Intelligence (Story 8.1)

**Learnings from Story 8.1 to apply:**

- **Phase transition pattern** — MainMenu PLAY button uses `setPhase('gameplay')`. For ship selection, change this to `setPhase('shipSelect')`, then ShipSelect START button does `setPhase('gameplay')`.

- **Keyboard navigation pattern** — MainMenu uses arrow keys + Enter for navigation. ShipSelect should follow similar pattern: arrows navigate grid, Enter selects/confirms, ESC goes back.

- **Placeholder modals pattern** — Story 8.1 added OPTIONS/CREDITS buttons with placeholder modals. ShipSelect can skip modals (it's a full screen, not a modal), but the accessibility patterns (focus management, ESC to close) apply.

- **Tailwind styling patterns** — MainMenu uses game-bg, game-primary, game-text tokens. ShipSelect should follow same design tokens for consistency.

- **useGame phases** — Story 8.1 confirmed phase management works via `useGame.setPhase()`. Adding 'shipSelect' phase is straightforward, just extend the enum and add conditional render in Interface.jsx.

- **Auto-focus pattern** — MainMenu auto-focuses PLAY button on mount. ShipSelect should auto-focus first unlocked ship card for immediate keyboard interaction.

**Files modified in Story 8.1:**
- `src/ui/MainMenu.jsx` — Extended menu items, added placeholders
- `src/scenes/MenuScene.jsx` — Enhanced background visuals
- `src/ui/Interface.jsx` — Renders MainMenu when phase === 'menu'

**Patterns established:**
- Full-screen UI components for different phases (MainMenu for 'menu', TunnelHub for 'tunnel', etc.)
- Keyboard-first navigation with visual focus indicators
- Placeholder features for upcoming stories (OPTIONS, CREDITS)

### Git Intelligence

Recent commits confirm:
- Story 8.1 (main menu visual overhaul) just completed
- Epic 7 (tunnel hub) and Epic 6 (boss encounters) completed previously
- Pattern: Stories build incrementally, each adding new phase or feature without breaking existing flows

**Relevant established patterns:**
- **Phase-based UI rendering** — Interface.jsx switches UI component based on useGame.phase
- **Entity definitions as plain objects** — weaponDefs.js, enemyDefs.js, boonDefs.js, planetDefs.js all follow same pattern → shipDefs.js should match
- **Zustand store actions** — Stores expose actions (setPhase, setCurrentShipId) called by UI components
- **Tailwind for all UI** — No CSS modules or styled-components, everything uses Tailwind utility classes

### Project Structure Notes

**Files to CREATE:**
- `src/entities/shipDefs.js` — Ship data definitions (SHIPS object, getDefaultShipId function)
- `src/ui/ShipSelect.jsx` — Main ship selection screen component
- Optional: `src/ui/components/ShipCard.jsx` — Individual ship card component (can be inline in ShipSelect.jsx initially)

**Files to MODIFY:**
- `src/stores/useGame.jsx` — Add 'shipSelect' to phases (if phases are explicitly enumerated)
- `src/stores/usePlayer.jsx` — Add currentShipId field, setCurrentShipId action, update reset() to initialize from ship stats
- `src/ui/MainMenu.jsx` — Change PLAY button onClick from `setPhase('gameplay')` to `setPhase('shipSelect')`
- `src/ui/Interface.jsx` — Add case `if (phase === 'shipSelect') return <ShipSelect />`
- Optional: `src/components/PlayerShip.jsx` — Make ship model dynamic based on usePlayer.currentShipId (Story 9.3 territory)

**Files NOT to modify:**
- `src/GameLoop.jsx` — No changes needed (ship stats read from usePlayer at runtime)
- `src/scenes/GameplayScene.jsx` — Minor change if ship model switching implemented, but not required for Story 9.1 UI focus
- `src/scenes/MenuScene.jsx` — No changes (menu background unaffected by ship selection)

**Assets required:**
- No new 3D models required — reuse `/public/models/ships/Spaceship.glb` for all ships initially
- Optional: Ship icon images (if not using placeholder boxes) — can be screenshots of ship models or simple icons
- Optional: Lock icon SVG for locked ships (or use emoji 🔒 as placeholder)

### Anti-Patterns to Avoid

- **Do NOT break existing gameplay flow** — Ship selection must fit cleanly between menu and gameplay, not replace or interfere with existing transitions
- **Do NOT hardcode ship stats in multiple places** — All stats come from shipDefs.js, usePlayer.reset() reads from there, no magic numbers in components
- **Do NOT forget to handle locked ships** — Clicking locked ships should do nothing (or show tooltip), not throw errors or select them
- **Do NOT skip keyboard navigation** — ShipSelect must be fully keyboard-navigable (arrows, Enter, ESC) per UX spec
- **Do NOT implement ship model switching in Story 9.1 if it blocks UI completion** — Model switching is Story 9.3 territory, UI can ship with all ships using same model
- **Do NOT create complex 3D preview scenes in Story 9.1 if time-constrained** — Placeholder ship icons (boxes, emojis, or simple images) are acceptable, 3D preview is "nice to have"
- **Do NOT forget to update Interface.jsx** — ShipSelect won't render unless Interface.jsx adds the phase conditional
- **Do NOT use modals for ship selection** — ShipSelect is a full-screen phase transition, not a modal overlay (unlike OPTIONS/CREDITS placeholders in Story 8.1)

### Testing Approach

- **Visual tests (browser verification):**
  - Load game → main menu → click PLAY → ship selection screen appears
  - Ship selection screen shows left grid (1 unlocked ship visible, others locked with lock icons)
  - Right panel shows selected ship details (name, description, stats)
  - Clicking unlocked ship card highlights it and updates right panel
  - Clicking locked ship does nothing (or shows tooltip)
  - START button is visible and prominent
  - Clicking START transitions to gameplay with correct ship stats applied
  - BACK button returns to main menu
  - Keyboard navigation: arrows navigate grid, Enter selects, ESC goes back

- **Integration tests:**
  - Ship stats (baseHP, baseSpeed, baseDamageMultiplier) apply correctly in gameplay
  - Player starts with HP = SHIPS[currentShipId].baseHP
  - Movement speed matches SHIPS[currentShipId].baseSpeed
  - Weapon damage applies SHIPS[currentShipId].baseDamageMultiplier
  - Multiple runs: can reselect ship between runs without state pollution

- **Accessibility tests:**
  - Keyboard navigation works without mouse
  - Focus indicators visible on selected ship card
  - ESC key returns to menu from anywhere in ship selection
  - Locked ships clearly indicated (grayscale, lock icon, disabled)

### Scope Summary

Story 9.1 creates the ship selection UI screen that sits between the main menu and gameplay. When the player clicks PLAY from the main menu, they are now taken to a ship selection screen instead of directly starting gameplay. The ship selection screen has a split layout: the left side displays a grid of ship variant cards (2-3 columns), and the right side shows details for the currently selected ship. Each ship card shows the ship's icon/thumbnail and name. Locked ships are grayed out with a lock icon and cannot be selected. At least one ship (BALANCED) is unlocked by default. When the player selects a ship, the right panel updates to show the ship's name, description, and base stats (HP, Speed, Damage multiplier). A START button at the bottom confirms the selection and begins gameplay with the chosen ship. A BACK button allows returning to the main menu. The screen is fully keyboard-navigable (arrows, Enter, ESC).

The story creates `src/entities/shipDefs.js` for ship data definitions (following the pattern of weaponDefs.js, enemyDefs.js, etc.), extends `usePlayer` store to track the selected ship via `currentShipId`, and creates `src/ui/ShipSelect.jsx` as the new UI component. The main menu's PLAY button is updated to transition to the 'shipSelect' phase instead of 'gameplay', and the ship selection's START button then transitions to 'gameplay'. The player's base stats (HP, speed, damage) are initialized from the selected ship's definition when gameplay begins. Model switching (rendering different ship GLBs) is optional for Story 9.1 and will be refined in Story 9.3.

**Key deliverables:**
1. `src/entities/shipDefs.js` — Ship definitions with at least BALANCED (unlocked) and 2-3 locked variants
2. `src/ui/ShipSelect.jsx` — Full ship selection UI with grid, detail panel, START/BACK buttons
3. `src/stores/usePlayer.jsx` — Add currentShipId, setCurrentShipId, integrate ship stats into reset()
4. `src/ui/MainMenu.jsx` — Change PLAY button to transition to 'shipSelect' phase
5. `src/ui/Interface.jsx` — Add ShipSelect rendering for 'shipSelect' phase
6. Tests confirming ship selection → gameplay flow, correct stat application, keyboard navigation

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 9.1] — Acceptance criteria: Split layout (left grid, right detail panel), ship cards with icon/name, locked ships grayed with lock icon, at least 1 unlocked, highlight on selection, START button, BACK button, keyboard navigation
- [Source: _bmad-output/planning-artifacts/epics.md#Story 9.2] — Ship variant definitions (BALANCED, GLASS_CANNON, TANK) with baseHP, baseSpeed, baseDamageMultiplier, description
- [Source: _bmad-output/planning-artifacts/epics.md#Story 9.3] — Ship selection persistence and integration (currentShipId used throughout run, model rendering integration)
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 9] — Overview: Ship Selection System — allow player to choose ship variant with displayed base stats before starting run
- [Source: _bmad-output/planning-artifacts/architecture.md#Entity Management] — Entity definitions pattern: plain objects in entities/ directory (weaponDefs.js, enemyDefs.js, boonDefs.js, planetDefs.js) → shipDefs.js follows same
- [Source: _bmad-output/planning-artifacts/architecture.md#State Architecture] — Zustand stores expose pure actions, UI components dispatch actions, stores never import other stores
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Keyboard Navigation] — Keyboard-first navigation throughout all menus and modals (arrows + Enter/Space)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pre-run Flow] — Pre-run flow: Play → Ship Select (proto: 1 only) → Galaxy Select (proto: 1 only) → Tunnel Hub → Enter System
- [Source: _bmad-output/planning-artifacts/mockups/9-1-CharacterSelect.png] — Mockup reference: Split layout (left grid, right detail panel), selected item highlighted with border, action buttons at bottom
- [Source: _bmad-output/implementation-artifacts/8-1-main-menu-visual-overhaul.md] — Previous story: phase transitions (PLAY button changes phase), keyboard navigation patterns, Tailwind styling tokens, focus management
- [Source: src/stores/useGame.jsx] — Phase management system (menu, gameplay, boss, tunnel, gameOver, victory) → extend with 'shipSelect'
- [Source: src/stores/usePlayer.jsx] — Player state management (HP, position, speed, weapons, boons) → add currentShipId
- [Source: src/ui/MainMenu.jsx] — Main menu PLAY button triggers phase transition → change to 'shipSelect'
- [Source: src/ui/Interface.jsx] — UI component routing based on phase → add ShipSelect case

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

