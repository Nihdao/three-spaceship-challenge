# Story 20.2: Upgrades Menu Screen

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to access an UPGRADES screen from the main menu,
So that I can browse, purchase, and manage my permanent upgrades before starting a run.

## Acceptance Criteria

**Given** the main menu
**When** the player sees the menu options
**Then** an "UPGRADES" button appears below "PLAY"
**And** the button uses the same styling as existing menu buttons

**Given** the player clicks UPGRADES
**When** the screen opens
**Then** the upgrade screen overlays the main menu (keeping the 3D background visible, similar to ship selection)
**And** all 14 upgrades are listed (available ones active, locked ones grayed if batch not yet implemented)
**And** each upgrade shows: name, current level / max level, next level cost in Fragments, bonus description
**And** the player's total available Fragments are prominently displayed

**Given** an upgrade that can be purchased
**When** the player has enough Fragments and hasn't maxed the upgrade
**Then** a "BUY" or "+" button is active/highlighted
**And** clicking it purchases one level

**Given** an upgrade at max level
**When** displayed
**Then** it shows "MAX" instead of a cost
**And** the buy button is disabled

**Given** the screen layout
**When** designed
**Then** upgrades are organized in a clean grid or list
**And** similar to the tunnel wormhole fragment upgrades in visual style
**And** a "BACK" button returns to the main menu

## Tasks / Subtasks

- [x] Task 1: Add UPGRADES button to MainMenu (AC: #1)
  - [x] Modify src/ui/MainMenu.jsx to add UPGRADES button below PLAY
  - [x] Use existing button styling pattern from MainMenu
  - [x] Wire button to open upgrades overlay (state transition)

- [x] Task 2: Create UpgradesScreen overlay component (AC: #2, #5)
  - [x] Create src/ui/UpgradesScreen.jsx (NEW file)
  - [x] Implement full-screen view replacing MainMenu (menu hidden when upgrades open)
  - [x] Keep 3D background visible directly (no dark backdrop — avoids visual conflict)
  - [x] Add BACK button to close overlay and return to main menu
  - [x] Grid or list layout for 6 upgrade entries (all currently defined upgrades)

- [x] Task 3: Create UpgradeCard component for each upgrade (AC: #2, #3, #4)
  - [x] Create UpgradeCard inline in UpgradesScreen.jsx
  - [x] Display: upgrade icon, name, description
  - [x] Display: current level / max level (e.g., "3 / 5")
  - [x] Display: next level cost in Fragments (e.g., "200 Fragments")
  - [x] Display: cumulative bonus description (e.g., "+15% Attack Power")
  - [x] BUY button: active if affordable and not maxed, disabled otherwise
  - [x] Show "MAX" label when upgrade is fully leveled
  - [x] N/A: Gray out batches 2-3 — only 6 upgrades exist in permanentUpgradesDefs.js currently

- [x] Task 4: Display player's Fragment balance prominently (AC: #2)
  - [x] Read usePlayer.getState().fragments
  - [x] Display at top of UpgradesScreen (header bar with ◆ icon)
  - [x] Use consistent purple color (#cc66ff) for Fragment icon/text

- [x] Task 5: Wire BUY button to useUpgrades.purchaseUpgrade (AC: #3)
  - [x] Import useUpgrades store
  - [x] On BUY click: call useUpgrades.getState().purchaseUpgrade(upgradeId)
  - [x] Handle success/failure (insufficient fragments, already maxed)
  - [x] Fragment balance auto-updates via Zustand subscription

- [x] Task 6: Visual styling matching tunnel upgrades (AC: #5)
  - [x] Reference TunnelHub.jsx for Fragment upgrade card styling
  - [x] Use similar card backgrounds, borders, hover effects
  - [x] Consistent typography and spacing

- [x] Task 7: Write tests
  - [x] Test MainMenu: UPGRADES button renders below PLAY
  - [x] Test UpgradesScreen: all upgrades render with correct info (UPGRADE_IDS)
  - [x] Test UpgradeCard: BUY button disabled when not affordable (getUpgradeDisplayInfo)
  - [x] Test UpgradeCard: shows "MAX" when fully leveled
  - [x] Test purchase flow: purchaseUpgrade succeeds/fails correctly

## Dev Notes

### Architecture Alignment

This story creates the **UI layer** for the permanent upgrades system. The data layer (useUpgrades store) was already implemented in Story 20.1. This story focuses purely on creating the user interface to browse and purchase upgrades.

**6-Layer Architecture:**
- **Config Layer**: `src/entities/permanentUpgradesDefs.js` (ALREADY EXISTS from Story 20.1)
- **Stores Layer**: `src/stores/useUpgrades.jsx` (ALREADY EXISTS from Story 20.1)
- **Stores Layer**: `src/stores/usePlayer.jsx` (ALREADY EXISTS - Fragment balance)
- **UI Layer**: `src/ui/UpgradesScreen.jsx` (NEW - this story)
- **UI Layer**: `src/ui/UpgradeCard.jsx` (NEW - this story, or inline component)
- **UI Layer**: `src/ui/MainMenu.jsx` (MODIFY - add UPGRADES button)

**This story does NOT touch:**
- Story 20.3 (Fragment display on main menu) - separate story
- Story 20.7 (Ship selection stats display) - separate story
- Story 20.8 (HP bar redesign) - separate story
- The upgrade definitions or store logic - already done in Story 20.1

### Previous Story Intelligence (Story 20.1)

**Key learnings from Story 20.1 implementation:**

Story 20.1 created the complete permanent upgrades foundation:
- **useUpgrades store** (`src/stores/useUpgrades.jsx`) with full persistence
- **permanentUpgradesDefs.js** (`src/entities/permanentUpgradesDefs.js`) with all 14 upgrade definitions
- **upgradesStorage.js** (`src/utils/upgradesStorage.js`) for localStorage get/set
- **Run initialization** integrated into usePlayer

**Store API available for this story:**
```javascript
import useUpgrades from '../stores/useUpgrades.jsx'

// Actions available:
useUpgrades.getState().purchaseUpgrade(upgradeId)  // Returns true/false
useUpgrades.getState().getUpgradeLevel(upgradeId)  // Returns 0-5
useUpgrades.getState().getTotalFragmentsSpent()    // Returns total spent
useUpgrades.getState().getComputedBonuses()        // Returns bonus values

// State:
useUpgrades.getState().upgradeLevels  // { ATTACK_POWER: 2, ARMOR: 1, ... }
```

**Upgrade definitions structure:**
```javascript
// From permanentUpgradesDefs.js
import { PERMANENT_UPGRADES } from '../entities/permanentUpgradesDefs.js'

PERMANENT_UPGRADES.ATTACK_POWER = {
  id: 'ATTACK_POWER',
  name: 'Attack Power',
  description: 'Increases weapon damage',
  icon: '⚔️',
  maxLevel: 5,
  levels: [
    { level: 1, cost: 50, bonus: 0.05 },
    { level: 2, cost: 100, bonus: 0.05 },
    // ...
  ]
}
```

**All 14 upgrades defined:**
1. ATTACK_POWER (5 levels)
2. ARMOR (5 levels)
3. MAX_HP (3 levels)
4. REGEN (3 levels)
5. ATTACK_SPEED (3 levels)
6. ZONE (3 levels)
7. MAGNET (2 levels) - Batch 2
8. LUCK (3 levels) - Batch 2
9. EXP_BONUS (5 levels) - Batch 2
10. CURSE (5 levels) - Batch 2
11. REVIVAL (2 levels) - Batch 3
12. REROLL (3 levels) - Batch 3
13. SKIP (3 levels) - Batch 3
14. BANISH (3 levels) - Batch 3

**CRITICAL: Story 20.1 only implemented Batch 1 (combat stats) gameplay effects.** Batches 2-3 are defined in permanentUpgradesDefs.js but don't have gameplay effects yet. The UI should show all 14 upgrades, but you can visually indicate which ones are "coming soon" if desired (optional polish).

**Fragment balance:**
- Stored in `usePlayer.getState().fragments`
- Modified via `usePlayer.getState().addFragments(amount)` (can be negative)
- When `purchaseUpgrade()` is called, it internally calls `usePlayer.getState().addFragments(-cost)`

**Important patterns from Story 20.1:**
- Persistence happens automatically in purchaseUpgrade() action
- No manual localStorage calls needed in UI
- Zustand subscriptions auto-update UI when upgrades change
- Fragment costs escalate: 50, 100, 200, 350, 500 for 5-level upgrades

### Key Source Files

| File | Relevance | Layer |
|------|-----------|-------|
| `src/ui/MainMenu.jsx` | **MODIFY** — Add UPGRADES button | UI |
| `src/ui/UpgradesScreen.jsx` | **NEW** — Main upgrades overlay | UI |
| `src/ui/UpgradeCard.jsx` | **NEW** — Individual upgrade card component (or inline) | UI |
| `src/stores/useUpgrades.jsx` | **READ-ONLY** — Created in Story 20.1, use actions here | Stores |
| `src/stores/usePlayer.jsx` | **READ-ONLY** — Fragment balance | Stores |
| `src/entities/permanentUpgradesDefs.js` | **READ-ONLY** — All 14 upgrade definitions | Config |
| `src/ui/ShipSelect.jsx` | **REFERENCE** — Overlay pattern to copy | UI |
| `src/ui/TunnelHub.jsx` | **REFERENCE** — Fragment upgrade card styling | UI |

**Files created in Story 20.1 (DO NOT RECREATE):**
- `src/stores/useUpgrades.jsx` ✅
- `src/entities/permanentUpgradesDefs.js` ✅
- `src/utils/upgradesStorage.js` ✅

### Existing UI Patterns to Follow

**Overlay Pattern (from ShipSelect.jsx):**
The upgrades screen should be a full-screen overlay similar to ship selection:
- Semi-transparent dark backdrop (e.g., `bg-black/80`)
- 3D background scene remains visible behind overlay
- Mounted/unmounted based on game phase or state flag
- BACK button to return to main menu

**Reference implementation:**
```jsx
// MainMenu.jsx (existing pattern)
const [showUpgrades, setShowUpgrades] = useState(false)

return (
  <>
    {!showUpgrades && (
      <div className="menu-container">
        <button onClick={() => setShowUpgrades(true)}>UPGRADES</button>
      </div>
    )}
    {showUpgrades && (
      <UpgradesScreen onClose={() => setShowUpgrades(false)} />
    )}
  </>
)
```

**Button Styling (from MainMenu.jsx):**
The existing main menu uses consistent button styling. Match this pattern:
- Large text, uppercase
- Hover effects (scale, brightness)
- Tailwind classes like `text-4xl`, `font-bold`, `hover:scale-105`
- White or cyan text on dark background

**Card Layout (from TunnelHub.jsx):**
The tunnel Fragment upgrades use card-based layouts. Reference this for upgrade cards:
- Card backgrounds with borders
- Icon + name + description layout
- Cost displayed prominently
- Buy button aligned consistently
- Hover effects on cards

**Typical card structure:**
```jsx
<div className="upgrade-card bg-gray-800/90 border border-purple-500/50 rounded-lg p-4">
  <div className="flex items-center gap-3">
    <span className="text-3xl">{upgrade.icon}</span>
    <div>
      <h3 className="text-xl font-bold text-white">{upgrade.name}</h3>
      <p className="text-sm text-gray-300">{upgrade.description}</p>
    </div>
  </div>
  <div className="mt-2 flex justify-between items-center">
    <span className="text-purple-400">Level {currentLevel} / {maxLevel}</span>
    <button className="buy-button">BUY ({nextCost} Fragments)</button>
  </div>
</div>
```

### Integration Points

**Reading upgrade state:**
```jsx
import useUpgrades from '../stores/useUpgrades.jsx'
import { PERMANENT_UPGRADES } from '../entities/permanentUpgradesDefs.js'

function UpgradesScreen() {
  const upgradeLevels = useUpgrades(state => state.upgradeLevels)

  // For each upgrade:
  const upgradeId = 'ATTACK_POWER'
  const upgradeDef = PERMANENT_UPGRADES[upgradeId]
  const currentLevel = upgradeLevels[upgradeId] || 0
  const nextLevelDef = upgradeDef.levels[currentLevel] // undefined if maxed
  const isMaxed = currentLevel >= upgradeDef.maxLevel
  const nextCost = nextLevelDef?.cost
}
```

**Reading Fragment balance:**
```jsx
import usePlayer from '../stores/usePlayer.jsx'

function UpgradesScreen() {
  const fragments = usePlayer(state => state.fragments)

  // Check if player can afford an upgrade:
  const canAfford = fragments >= nextCost && !isMaxed
}
```

**Purchasing an upgrade:**
```jsx
import useUpgrades from '../stores/useUpgrades.jsx'

function UpgradeCard({ upgradeId }) {
  const handleBuy = () => {
    const success = useUpgrades.getState().purchaseUpgrade(upgradeId)
    if (!success) {
      console.warn('Purchase failed - not enough fragments or already maxed')
    }
    // UI auto-updates via Zustand subscription, no manual refresh needed
  }

  return <button onClick={handleBuy}>BUY</button>
}
```

**Computing cumulative bonus for display:**
Story 20.1 implemented helper functions in permanentUpgradesDefs.js:
```javascript
import { getTotalBonus } from '../entities/permanentUpgradesDefs.js'

const currentLevel = 3
const totalBonus = getTotalBonus('ATTACK_POWER', currentLevel)
// Returns cumulative bonus at current level (e.g., 0.15 for 3 levels)
```

Use this to display cumulative bonuses like "+15% Attack Power" in the card description.

### Visual Design Guidance

**Layout Options:**

**Option A: Grid Layout (Recommended)**
```jsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-8">
  {Object.keys(PERMANENT_UPGRADES).map(upgradeId => (
    <UpgradeCard key={upgradeId} upgradeId={upgradeId} />
  ))}
</div>
```

**Option B: List Layout (Alternative)**
```jsx
<div className="flex flex-col gap-3 p-8 max-w-4xl mx-auto">
  {Object.keys(PERMANENT_UPGRADES).map(upgradeId => (
    <UpgradeCard key={upgradeId} upgradeId={upgradeId} />
  ))}
</div>
```

Grid layout is recommended for visual consistency with the 14 upgrades, similar to the tunnel upgrade cards.

**Fragment Balance Display:**
Place at the top center or top right of the overlay:
```jsx
<div className="text-center mb-6">
  <span className="text-2xl text-purple-400">💎 Fragments: {fragments}</span>
</div>
```

**Locked/Coming Soon Upgrades (Optional Polish):**
If you want to visually indicate Batch 2-3 upgrades are not yet fully functional:
```jsx
const isBatch1 = ['ATTACK_POWER', 'ARMOR', 'MAX_HP', 'REGEN', 'ATTACK_SPEED', 'ZONE'].includes(upgradeId)

<div className={`upgrade-card ${!isBatch1 ? 'opacity-50' : ''}`}>
  {!isBatch1 && <span className="text-xs text-yellow-400">Coming Soon</span>}
</div>
```

**However, this is optional.** The acceptance criteria say "locked ones grayed if batch not yet implemented," but all upgrades ARE purchasable and tracked—they just don't have gameplay effects yet. Your choice to add visual indication or not.

**Color Scheme:**
- Primary: Purple/Magenta for Fragments (#cc66ff)
- Background: Dark gray/black with transparency
- Borders: Purple glow (#cc66ff with opacity)
- Text: White for names, gray for descriptions
- Buttons: Purple background when active, gray when disabled

### State Management Pattern

**Local vs Global State:**
- `useUpgrades` and `usePlayer` are global Zustand stores (already exist)
- `showUpgrades` overlay visibility can be local state in MainMenu.jsx
- No need to create a new store for UI state

**Typical component structure:**
```jsx
// MainMenu.jsx
import { useState } from 'react'
import UpgradesScreen from './UpgradesScreen.jsx'

export default function MainMenu() {
  const [showUpgrades, setShowUpgrades] = useState(false)

  return (
    <>
      {!showUpgrades && (
        <div className="main-menu">
          <button onClick={() => setShowUpgrades(true)}>UPGRADES</button>
        </div>
      )}
      {showUpgrades && <UpgradesScreen onClose={() => setShowUpgrades(false)} />}
    </>
  )
}
```

```jsx
// UpgradesScreen.jsx
import useUpgrades from '../stores/useUpgrades.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { PERMANENT_UPGRADES } from '../entities/permanentUpgradesDefs.js'

export default function UpgradesScreen({ onClose }) {
  const upgradeLevels = useUpgrades(state => state.upgradeLevels)
  const fragments = usePlayer(state => state.fragments)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
      <div className="max-w-6xl w-full p-8">
        <h1>PERMANENT UPGRADES</h1>
        <div>Fragments: {fragments}</div>

        <div className="grid grid-cols-3 gap-4">
          {Object.keys(PERMANENT_UPGRADES).map(upgradeId => (
            <UpgradeCard key={upgradeId} upgradeId={upgradeId} />
          ))}
        </div>

        <button onClick={onClose}>BACK</button>
      </div>
    </div>
  )
}
```

### Performance Notes

**No performance concerns for this story:**
- 14 upgrade cards is trivial for React rendering
- Zustand subscriptions are efficient (only re-render when state changes)
- No useFrame or 3D rendering involved
- No heavy computations (upgrade level lookups are O(1))

**Best practices:**
- Use Zustand selectors to subscribe only to needed state
- Avoid re-creating upgrade card components on every render (React.memo if needed, but likely not necessary)

### Testing Standards

Follow the project's Vitest testing standards:

**Component tests:**
- Test MainMenu: UPGRADES button renders and opens overlay
- Test UpgradesScreen: renders all 14 upgrades
- Test UpgradesScreen: Fragment balance displays correctly
- Test UpgradesScreen: BACK button closes overlay
- Test UpgradeCard: displays upgrade name, description, icon
- Test UpgradeCard: displays current level / max level correctly
- Test UpgradeCard: displays next level cost
- Test UpgradeCard: BUY button disabled when not affordable
- Test UpgradeCard: BUY button disabled when maxed
- Test UpgradeCard: shows "MAX" label when fully leveled
- Test UpgradeCard: clicking BUY calls purchaseUpgrade action

**Integration tests:**
- Test purchase flow: clicking BUY decrements Fragment balance
- Test purchase flow: clicking BUY increments upgrade level
- Test UI updates: upgrade card reflects new level after purchase

**CRITICAL:** Mock useUpgrades and usePlayer stores in tests to prevent side effects. Use Vitest's `vi.mock()` or create test fixtures.

Example test:
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import UpgradeCard from '../UpgradeCard.jsx'

vi.mock('../stores/useUpgrades.jsx', () => ({
  default: vi.fn(() => ({
    upgradeLevels: { ATTACK_POWER: 2 },
    purchaseUpgrade: vi.fn(() => true),
  }))
}))

vi.mock('../stores/usePlayer.jsx', () => ({
  default: vi.fn(() => ({ fragments: 500 }))
}))

test('UpgradeCard displays correctly', () => {
  render(<UpgradeCard upgradeId="ATTACK_POWER" />)
  expect(screen.getByText('Attack Power')).toBeInTheDocument()
  expect(screen.getByText(/Level 2 \/ 5/)).toBeInTheDocument()
})
```

### Project Structure Notes

**New files created in this story:**
- `src/ui/UpgradesScreen.jsx` — Full-screen overlay for browsing upgrades
- `src/ui/UpgradeCard.jsx` — Individual upgrade card component (optional - can be inline in UpgradesScreen)
- `src/ui/__tests__/UpgradesScreen.test.jsx` — Component tests
- `src/ui/__tests__/UpgradeCard.test.jsx` — Component tests (if separate component)

**Modified files:**
- `src/ui/MainMenu.jsx` — Add UPGRADES button and overlay state

**Files NOT modified (already exist from Story 20.1):**
- `src/stores/useUpgrades.jsx` ✅
- `src/entities/permanentUpgradesDefs.js` ✅
- `src/utils/upgradesStorage.js` ✅
- `src/stores/usePlayer.jsx` ✅

**File organization:**
All UI components go in `src/ui/` directory following the 6-layer architecture. Upgrades screen is UI layer only, reading from stores and dispatching actions.

### References

- [Source: _bmad-output/planning-artifacts/epic-20-permanent-upgrades-system.md#Story 20.2] — Epic context, Story 20.2 acceptance criteria
- [Source: _bmad-output/implementation-artifacts/20-1-permanent-upgrades-combat-stats.md] — Story 20.1 implementation details, useUpgrades store API
- [Source: src/entities/permanentUpgradesDefs.js] — All 14 upgrade definitions (created in Story 20.1)
- [Source: src/stores/useUpgrades.jsx] — Permanent upgrades store with purchaseUpgrade action (created in Story 20.1)
- [Source: src/stores/usePlayer.jsx] — Fragment balance (usePlayer.fragments)
- [Source: src/ui/MainMenu.jsx] — Main menu structure, button styling patterns
- [Source: src/ui/ShipSelect.jsx] — Overlay pattern reference (full-screen overlay keeping 3D background)
- [Source: src/ui/TunnelHub.jsx] — Fragment upgrade card styling reference
- [Source: _bmad-output/planning-artifacts/architecture.md#UI Layer] — 6-layer architecture, UI component guidelines
- [Source: _bmad-output/planning-artifacts/epic-20-permanent-upgrades-system.md#Technical Notes] — Architecture alignment, UI layer specifications

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

None — clean implementation with no issues.

### Completion Notes List

- **Task 1:** Added "UPGRADES" entry to exported MENU_ITEMS array in MainMenu.jsx, positioned after PLAY and before OPTIONS. Added `isUpgradesOpen` state with full wiring (keyboard guard, inert attribute, handleMenuSelect).
- **Task 2:** Created UpgradesScreen.jsx as a full-screen view that replaces the MainMenu (menu hidden when open). No dark backdrop — 3D background visible directly to avoid visual conflict. Uses animate-fade-in. Escape key closes. BACK button in header.
- **Task 3:** UpgradeCard component inline in UpgradesScreen.jsx. Displays icon, name, description, level/maxLevel, next cost with ◆ symbol, cumulative bonus formatted per type (%, /s, flat). Shows "MAX" badge when fully leveled. BUY button disabled when unaffordable or maxed. Exported `getUpgradeDisplayInfo()` helper for testability.
- **Task 4:** Fragment balance displayed in header bar with purple ◆ icon (#cc66ff) and tabular-nums for alignment.
- **Task 5:** BUY click calls `useUpgrades.getState().purchaseUpgrade(upgradeId)`. Plays 'upgrade-purchase' SFX on success. UI auto-updates via Zustand subscriptions.
- **Task 6:** Visual styling follows TunnelHub patterns: dark card backgrounds with white/5% opacity, purple borders, hover effects, consistent typography. Grid layout (2-3 columns responsive).
- **Task 7:** 25 tests covering: MENU_ITEMS structure, UPGRADE_IDS completeness, getUpgradeDisplayInfo for all states (level 0, partial, maxed, unaffordable, unknown), BONUS_FORMATS mapping validation, exhaustive per-upgrade coverage at level 0 and max level, fragment affordability, purchase integration (success, failure, maxed, UI reflection).
- **Note:** Only 6 upgrades currently exist in permanentUpgradesDefs.js (Batch 1). Story Dev Notes mentioned 14 but Batches 2-3 are not yet defined in the codebase. UI dynamically renders all defined upgrades.

### File List

- `src/ui/MainMenu.jsx` — MODIFIED: Added UPGRADES to MENU_ITEMS (exported), isUpgradesOpen state, UpgradesScreen import/render
- `src/ui/UpgradesScreen.jsx` — NEW: Full-screen overlay with UpgradeCard components, getUpgradeDisplayInfo helper, UPGRADE_IDS export, BONUS_FORMATS mapping
- `src/ui/__tests__/UpgradesScreen.test.jsx` — NEW: 25 tests for MainMenu button, upgrade display info, BONUS_FORMATS, exhaustive per-upgrade coverage, fragment balance, purchase flow

## Senior Developer Review (AI)

**Reviewer:** Adam on 2026-02-15
**Outcome:** Approved with fixes applied

### Issues Found & Resolution

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| H1 | HIGH | Tests only validate pure functions, no DOM rendering tests | Added 6 new tests (BONUS_FORMATS, exhaustive per-upgrade). Note: project has no @testing-library/react — consistent with codebase pattern |
| M1 | MEDIUM | AC#2 says "all 14 upgrades" but only 6 exist in defs | Deferred — Batch 2-3 defs are Stories 20.4/20.5 scope. UI dynamically renders whatever is defined |
| M2 | MEDIUM | formatBonus() hardcodes upgrade IDs — fragile | Fixed: Replaced with extensible BONUS_FORMATS mapping object |
| M3 | MEDIUM | No keyboard grid navigation between upgrade cards | Accepted: Tab navigation works (native buttons). Arrow-key grid nav is out of AC scope |
| L1 | LOW | Escape key doesn't play SFX (inconsistent with BACK) | Fixed |
| L2 | LOW | Dead variable `def` in formatBonus() | Fixed (removed) |
| L3 | LOW | No aria-label on BUY buttons | Fixed: added descriptive aria-label |

### Files Modified in Review
- `src/ui/UpgradesScreen.jsx` — BONUS_FORMATS mapping, formatBonus() refactor, Escape SFX, aria-label, dead code removal
- `src/ui/__tests__/UpgradesScreen.test.jsx` — 6 new tests (19 → 25)
- `_bmad-output/implementation-artifacts/20-2-upgrades-menu-screen.md` — Status → done, review notes

## Change Log

- 2026-02-15: Implemented Upgrades Menu Screen (Story 20.2) — UPGRADES button in MainMenu, full-screen UpgradesScreen overlay with 6 upgrade cards, purchase flow, Fragment balance display, 19 tests passing
- 2026-02-15: Code review fixes — Replaced hardcoded formatBonus() with extensible BONUS_FORMATS mapping (M2), added Escape SFX for consistency (L1), removed dead variable (L2), added aria-label on BUY buttons (L3), added 6 new tests for BONUS_FORMATS and exhaustive per-upgrade coverage (H1). 25 tests total.

