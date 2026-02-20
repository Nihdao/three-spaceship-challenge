# Story 25.6: Stats Display Screen

Status: done

## Story

As a player,
I want to view my career statistics from the main menu and have a clean, uncluttered menu layout,
So that I can appreciate my progress and navigate the menu more efficiently.

## Acceptance Criteria

**Given** the main menu
**When** the player clicks "STATS"
**Then** a stats screen opens (overlay style)
**And** the screen displays career stats in clear categories

**Given** the Career section
**When** displayed
**Then** shows: Total Runs, Total Enemies Killed, Total Time Survived, Total Fragments Earned

**Given** the Best Run section
**When** displayed
**Then** shows: Highest System Reached, Longest Run, Most Kills in a Run, Highest Level

**Given** the Favorites section
**When** displayed
**Then** shows: Top 3 Most Used Weapons (with run count), Top 3 Most Used Boons (with run count)

**Given** the display format
**When** designed
**Then** numbers are formatted for readability (e.g., "12,345" kills, "2h 34m" total time)
**And** the layout is clean and easy to scan
**And** a "BACK" button returns to the main menu

**Given** the main menu layout
**When** displayed
**Then** the central column shows only primary actions: PLAY, UPGRADES, ARMORY, STATS
**And** OPTIONS and CREDITS appear as smaller bordered buttons in the bottom-left corner
**And** OPTIONS and CREDITS are not part of keyboard arrow navigation

## Tasks / Subtasks

- [x] Create StatsScreen.jsx component (AC: all)
  - [x] Implement overlay layout matching UpgradesScreen pattern
  - [x] Add Career section with total stats display
  - [x] Add Best Run section with record stats display
  - [x] Add Favorites section with top 3 weapons/boons
  - [x] Implement number formatting utilities (toLocaleString, time format)
  - [x] Add BACK button with keyboard (Escape) support
  - [x] Add responsive grid layout for stat categories
- [x] Add "STATS" menu item to MainMenu.jsx (AC: main menu)
  - [x] Add STATS entry to MENU_ITEMS array
  - [x] Add isStatsOpen state and handler
  - [x] Add keyboard navigation support
  - [x] Conditionally render StatsScreen component
- [x] Reorganize MainMenu layout — OPTIONS & CREDITS to bottom-left corner (AC: main menu layout)
  - [x] Remove OPTIONS and CREDITS from MENU_ITEMS (central column has 4 items only)
  - [x] Add OPTIONS and CREDITS as bordered buttons in bottom-left (absolute positioned)
  - [x] Keyboard arrow navigation cycles through 4 primary items only
- [x] Verify useGlobalStats store integration (AC: all data)
  - [x] Ensure useGlobalStats.jsx exists (from Story 25.5 dependency)
  - [x] Read all required stats from store
  - [x] Handle missing/empty stats gracefully (new save)

## Dev Notes

### Architecture Alignment

**Layer: UI (Layer 6)**
- Location: `src/ui/StatsScreen.jsx`
- Pattern: HTML overlay component, reads from Zustand stores, no 3D interaction
- Similar to: `src/ui/UpgradesScreen.jsx`, `src/ui/MainMenu.jsx`

**Data Source:**
- Primary: `src/stores/useGlobalStats.jsx` (created in Story 25.5)
- Secondary: `src/entities/weaponDefs.js`, `src/entities/boonDefs.js` (for mapping IDs to names/icons)

**UI Pattern:**
- Full-screen overlay with `fixed inset-0 z-50`
- No backdrop — 3D background visible directly (like UpgradesScreen)
- Tailwind CSS styling matching game theme
- Keyboard navigation (Escape to close)
- SFX on interactions (button-hover, button-click)

### Critical Implementation Details

**useGlobalStats Store Shape (from Epic 25, Story 25.5):**
```javascript
{
  totalEnemiesKilled: number,
  totalTimeSurvived: number,        // seconds
  totalRunsPlayed: number,
  totalFragmentsEarned: number,
  mostUsedWeapons: { weaponId: runCount },  // map
  mostUsedBoons: { boonId: runCount },      // map
  bestRun: {
    highestSystemReached: number,
    longestRunTime: number,           // seconds
    mostKillsInRun: number,
    highestLevelReached: number,
  }
}
```

**Number Formatting:**
- Integers: `toLocaleString()` → "12,345"
- Time: Custom function → `formatTime(seconds) => "2h 34m"`
  - Hours: `Math.floor(seconds / 3600)`
  - Minutes: `Math.floor((seconds % 3600) / 60)`
  - Example: 9234 seconds → "2h 33m"
- Fragments: `toLocaleString()` with Fragment symbol `◆`

**Top 3 Extraction:**
```javascript
// Sort mostUsedWeapons by runCount descending, take top 3
const topWeapons = Object.entries(mostUsedWeapons)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)

// Map to weapon names from weaponDefs
topWeapons.map(([id, count]) => ({
  name: WEAPONS[id]?.name ?? 'Unknown',
  icon: WEAPONS[id]?.icon ?? '?',
  count
}))
```

**Empty State Handling:**
- If `totalRunsPlayed === 0` or store is empty:
  - Show "No runs played yet!" message
  - Display all stats as "—" or "0"
  - Favorites section: "Play a run to see your favorites!"

### File Structure & Naming

**New Files:**
- `src/ui/StatsScreen.jsx` — Main stats screen component
- Optional: `src/ui/utils/formatters.js` — Number/time formatting utilities (or inline in StatsScreen)

**Modified Files:**
- `src/ui/MainMenu.jsx` — Add STATS menu item and modal integration

**Component Structure:**
```jsx
StatsScreen({ onClose })
  ├─ Header: Title + BACK button
  ├─ Career Section: Grid of 4 stat cards
  ├─ Best Run Section: Grid of 4 record cards
  └─ Favorites Section: Top 3 weapons + Top 3 boons
```

### Styling & Layout

**Design Language (from existing components):**
- Font: `font-game` (existing game font)
- Color scheme:
  - Text: `text-game-text` (bright), `text-game-text-muted` (dimmed)
  - Accent: `text-[#cc66ff]` (Fragment purple)
  - Success: `text-game-success` (green)
  - Border: `border-game-border`
- Card style: `border rounded-lg p-3 bg-white/[0.05] backdrop-blur-sm`
- Stat labels: `text-xs tracking-[0.3em]` (uppercase, wide spacing)
- Stat values: `text-2xl font-bold tabular-nums`

**Responsive Grid:**
- Career/Best Run: `grid-cols-2 md:grid-cols-4 gap-4`
- Favorites: `grid-cols-1 md:grid-cols-2 gap-4` (weapons left, boons right)

**Accessibility:**
- Semantic HTML: `<section>`, `<h2>`, `<dl>` for stat lists
- ARIA labels on stat cards
- Keyboard navigation (Escape to close)
- Focus management on open/close

### Testing Approach

**Unit Tests (optional, if time allows):**
- `formatTime(seconds)` utility function
- Top 3 extraction logic with edge cases (0 items, 1 item, 5+ items)
- Empty state rendering

**Manual Testing:**
- [ ] Open Stats screen from main menu
- [ ] Verify all sections render correctly
- [ ] Test with empty stats (new save)
- [ ] Test with populated stats (after runs)
- [ ] Verify Escape key closes screen
- [ ] Verify BACK button closes screen
- [ ] Verify number formatting (thousands separator)
- [ ] Verify time formatting (hours + minutes)
- [ ] Verify top 3 weapons/boons display correctly
- [ ] Verify responsive layout on narrow screens

### Project Structure Notes

**6-Layer Architecture Compliance:**
1. **Config/Data**: weaponDefs.js, boonDefs.js (already exist)
2. **Systems**: No game logic in this story (UI only)
3. **Stores**: useGlobalStats.jsx (dependency from Story 25.5)
4. **GameLoop**: No game loop interaction (menu screen)
5. **Rendering**: No 3D rendering (HTML overlay)
6. **UI**: StatsScreen.jsx (this story), MainMenu.jsx (modified)

**Dependency Tree:**
```
StatsScreen.jsx
  ├─ useGlobalStats (Story 25.5 — MUST exist)
  ├─ weaponDefs.js (Epic 11)
  ├─ boonDefs.js (Epic 11)
  └─ audioManager.js (playSFX)
```

### References

**Source Documents:**
- [Source: epic-25-meta-content.md#Story 25.6]
- [Source: architecture.md#UI Layer (Layer 6)]
- [Source: architecture.md#Naming Patterns — Components]

**Similar Components (reference patterns):**
- `src/ui/UpgradesScreen.jsx` — Overlay layout, keyboard handling, grid cards
- `src/ui/MainMenu.jsx` — Menu integration, modal state management
- `src/ui/HUD.jsx` — Number formatting patterns (score, fragments)

**Entity Definitions:**
- `src/entities/weaponDefs.js` — Weapon names and icons
- `src/entities/boonDefs.js` — Boon names and icons

### Known Dependencies

**CRITICAL: Story 25.5 Dependency**
- Story 25.5 (Persistent Global Stats) creates `src/stores/useGlobalStats.jsx`
- Story 25.5 implements the stats tracking system
- Story 25.5 updates stats at run end
- **This story (25.6) CANNOT be implemented before Story 25.5**
- If 25.5 is not complete, this story will fail at runtime (missing store import)

**Mitigation:**
- Verify Story 25.5 status before starting implementation
- If 25.5 is backlog, implement 25.5 first OR create placeholder useGlobalStats with mock data
- Dev agent should check for `src/stores/useGlobalStats.jsx` existence before starting

### Implementation Sequence

1. **Verify Story 25.5 completion**
   - Check if `src/stores/useGlobalStats.jsx` exists
   - If missing: HALT and implement Story 25.5 first
2. **Create StatsScreen.jsx**
   - Start with empty state UI (no stats)
   - Add layout sections (Career, Best Run, Favorites)
   - Implement number/time formatting utilities
   - Connect to useGlobalStats store
   - Add populated state rendering
   - Test with mock data
3. **Integrate into MainMenu.jsx**
   - Add STATS menu item to MENU_ITEMS
   - Add state management (isStatsOpen)
   - Add keyboard navigation support
   - Conditionally render StatsScreen
4. **Test full flow**
   - Menu → Stats → BACK → Menu
   - Keyboard navigation (arrows, enter, escape)
   - Data accuracy with real runs

### Visual Design Notes

**Layout Preview:**
```
╔═══════════════════════════════════════════════════════════╗
║  ← BACK          CAREER STATISTICS              [Close]  ║
║                                                            ║
║  CAREER                                                   ║
║  ┌──────────┬──────────┬──────────┬──────────┐          ║
║  │Total Runs│  Enemies │   Time   │Fragments │          ║
║  │    42    │  12,345  │ 5h 23m   │ ◆ 8,450  │          ║
║  └──────────┴──────────┴──────────┴──────────┘          ║
║                                                            ║
║  BEST RUN                                                 ║
║  ┌──────────┬──────────┬──────────┬──────────┐          ║
║  │ System   │ Longest  │Most Kills│Max Level │          ║
║  │    3     │  18m 42s │   892    │    27    │          ║
║  └──────────┴──────────┴──────────┴──────────┘          ║
║                                                            ║
║  FAVORITES                                                ║
║  ┌──────────────────────┬──────────────────────┐         ║
║  │ Top Weapons          │ Top Boons            │         ║
║  │ 1. Laser (28 runs)   │ 1. Speed (32 runs)   │         ║
║  │ 2. Missile (24 runs) │ 2. Damage (28 runs)  │         ║
║  │ 3. Railgun (18 runs) │ 3. Regen (24 runs)   │         ║
║  └──────────────────────┴──────────────────────┘         ║
╚═══════════════════════════════════════════════════════════╝
```

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Store field names in `useGlobalStats.jsx` differ from story Dev Notes: actual fields are `totalKills`, `totalRuns`, `totalFragments` (not `totalEnemiesKilled`, `totalRunsPlayed`, `totalFragmentsEarned`). Used actual store fields in implementation.
- `WEAPONS` and `BOONS` defs have no `icon` field — omitted icons from Favorites list, used names only.
- Pre-existing test failures in `usePlayer.damage.test.js` (Story 27.5, ready-for-dev) — not caused by this story.

### Completion Notes List

- Created `src/ui/StatsScreen.jsx` with Career, Best Run, and Favorites sections following UpgradesScreen overlay pattern
- `formatTime()` utility exported and unit-tested (13 tests pass)
- Empty state handled when `totalRuns === 0`: shows "No runs played yet!" message
- Top 3 weapons/boons via `getTopWeapons(3)` / `getTopBoons(3)` computed getters from store
- Integrated STATS item into `MainMenu.jsx` MENU_ITEMS between ARMORY and OPTIONS
- Added `isStatsOpen` state, handler in `handleMenuSelect`, keyboard nav guard, and conditional render
- All 13 new tests pass; 2217/2222 existing tests pass (5 pre-existing failures from Story 27.5)

### File List

- `src/ui/StatsScreen.jsx` (new)
- `src/ui/__tests__/StatsScreen.test.jsx` (new)
- `src/ui/MainMenu.jsx` (modified)
- `src/ui/__tests__/MainMenu.test.jsx` (modified)

### Change Log

- 2026-02-20: Story 25.6 implemented — StatsScreen component created, STATS added to MainMenu
- 2026-02-20: MainMenu layout reorganized — OPTIONS & CREDITS moved to bottom-left corner buttons, central column reduced to 4 primary items
- 2026-02-20: Code review fixes — focus management (backButtonRef + statsButtonRef), BACK button hover SFX, StatCard `<dl>/<dt>/<dd>` semantic HTML, MainMenu.test.jsx assertions for 'stats' and 'armory' in MENU_ITEMS
