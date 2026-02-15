# Story 20.3: Fragment Display on Main Menu

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see my accumulated Fragment count on the main menu,
So that I know how many resources I have available for upgrades.

## Acceptance Criteria

**Given** the main menu screen
**When** displayed
**Then** the player's total Fragment count appears near or below the BEST RUN display
**And** the Fragment icon uses the consistent purple color (#cc66ff)
**And** the count updates after each run when new Fragments are earned

## Tasks / Subtasks

- [x] Task 1: Add Fragment display to MainMenu.jsx (AC: #1, #2, #3)
  - [x] Modify src/ui/MainMenu.jsx
  - [x] Import usePlayer store to read fragments
  - [x] Add Fragment count display near/below BEST RUN display (top-right area)
  - [x] Use purple color (#cc66ff) for Fragment icon/text
  - [x] Match BEST RUN styling pattern (label + value)
  - [x] Use purple lozenge ◆ icon (matches HUD, PauseMenu, UpgradesScreen)

- [x] Task 2: Write tests
  - [x] Test MainMenu: Store contract — usePlayer exposes fragments field
  - [x] Test MainMenu: Fragment count updates when usePlayer.fragments changes
  - [x] Test MainMenu: Fragments survive resetForNewSystem (persist between runs)
  - [x] Test MainMenu: MENU_ITEMS export contains expected entries
  - [ ] Test MainMenu: Fragment display uses purple color (requires @testing-library/react — not installed)
  - [ ] Test MainMenu: Fragment display positioned near BEST RUN (requires @testing-library/react — not installed)

## Dev Notes

### Architecture Alignment

This is a **pure UI story** that adds a simple Fragment count display to the existing MainMenu.jsx. The Fragment counter already exists in usePlayer store (Story 19.3 implemented Fragment drops). This story simply makes the Fragment count **visible** on the main menu.

**6-Layer Architecture:**
- **Stores Layer**: `src/stores/usePlayer.jsx` (READ-ONLY) — Fragment counter already exists (line 46: `fragments: 0`)
- **UI Layer**: `src/ui/MainMenu.jsx` (MODIFY) — Add Fragment display

**This story does NOT:**
- Create any new stores or data structures (Fragment counter already exists)
- Implement permanent upgrades (Story 20.1 — already ready-for-dev)
- Create upgrades menu (Story 20.2 — already ready-for-dev)
- Modify Fragment earning logic (Story 19.3 — already done)

### Key Source Files

| File | Change | Layer |
|------|--------|-------|
| `src/ui/MainMenu.jsx` | **MODIFY** — Add Fragment display near BEST RUN | UI |
| `src/stores/usePlayer.jsx` | **READ-ONLY** — Fragment counter (line 46) | Stores |

### Existing Fragment Infrastructure

The Fragment economy is fully implemented:
- **usePlayer.fragments** (line 46): Fragment counter
- **usePlayer.addFragments(amount)**: Increments/decrements fragments
- **Fragment persistence**: Fragments are preserved across system transitions (resetForNewSystem)
- **Fragment drops**: Story 19.3 implemented enemy drops (12% chance, purple gems)
- **Boss rewards**: Story 6.3 implemented boss rewards (100 Fragments)
- **Tunnel upgrades**: Story 7.2 allows spending Fragments in tunnel hub

**CRITICAL:** The Fragment counter is in `usePlayer` store, NOT `useGame` store. Do not confuse with high score persistence pattern.

### MainMenu.jsx Current Structure

The MainMenu component currently displays:
- **Title**: "REDSHIFT SURVIVOR" (centered)
- **High Score**: Top-right corner (lines 100-107)
  - Label: "BEST RUN" (text-game-text-muted, text-xs, tracking-[0.3em])
  - Value: High score number (text-2xl, font-bold, tabular-nums, text-game-text)
  - Position: `absolute top-8 right-8 text-right`
- **Menu buttons**: PLAY, OPTIONS, CREDITS (centered)

**Fragment display should follow the same visual pattern as BEST RUN:**
```jsx
// Current BEST RUN pattern (lines 100-107)
<div className="absolute top-8 right-8 text-right select-none">
  <p className="text-game-text-muted text-xs tracking-[0.3em]">
    BEST RUN
  </p>
  <p className="text-2xl font-bold tabular-nums text-game-text">
    {highScore > 0 ? highScore.toLocaleString() : "---"}
  </p>
</div>
```

### Visual Design Guidance

**Layout Options:**

**Option A: Below BEST RUN (Recommended)**
Stack the Fragment display directly below the BEST RUN display in the same top-right corner:
```jsx
<div className="absolute top-8 right-8 text-right select-none space-y-6">
  {/* High score display */}
  <div>
    <p className="text-game-text-muted text-xs tracking-[0.3em]">BEST RUN</p>
    <p className="text-2xl font-bold tabular-nums text-game-text">
      {highScore > 0 ? highScore.toLocaleString() : "---"}
    </p>
  </div>

  {/* Fragment display */}
  <div>
    <p className="text-game-text-muted text-xs tracking-[0.3em]">FRAGMENTS</p>
    <p className="text-2xl font-bold tabular-nums text-purple-400">
      💎 {fragments.toLocaleString()}
    </p>
  </div>
</div>
```

**Option B: Side-by-side (Alternative)**
Place Fragment display next to BEST RUN horizontally:
```jsx
<div className="absolute top-8 right-8 flex gap-8 text-right select-none">
  {/* High score */}
  <div>...</div>
  {/* Fragments */}
  <div>...</div>
</div>
```

**Recommended: Option A (stacked vertically).** This is cleaner and follows the Epic 20 spec: "near or below BEST RUN."

**Color Scheme:**
- **Fragment text color**: `text-purple-400` or `text-[#cc66ff]` (Epic 20 spec)
- **Fragment icon**: 💎 gem emoji (already used for Fragment gems in-game)
- **Label**: `text-game-text-muted` (same as BEST RUN label)
- **Value**: `text-2xl font-bold tabular-nums` (same as high score value)

**Number formatting:**
Use `.toLocaleString()` to format large numbers with commas (e.g., "1,234" instead of "1234"), matching the BEST RUN pattern.

### Integration Points

**Reading Fragment count:**
```jsx
import usePlayer from '../stores/usePlayer.jsx'

export default function MainMenu() {
  const fragments = usePlayer((s) => s.fragments)

  // Display:
  // 💎 {fragments.toLocaleString()}
}
```

**CRITICAL:** Use Zustand selector to subscribe only to fragments field:
```jsx
const fragments = usePlayer((s) => s.fragments)
```

**NOT:**
```jsx
const player = usePlayer() // ❌ Subscribes to ALL player state changes, causes unnecessary re-renders
```

### Fragment Count Updates

The Fragment count will auto-update via Zustand reactivity:
- When a run ends and player returns to main menu, Fragment count reflects new total
- No manual refresh needed — Zustand subscription handles UI updates
- Fragments persist across system transitions (resetForNewSystem preserves fragments)

**Fragment earning flow:**
1. Player kills enemies → Fragment gems drop (12% chance)
2. Player collects gems → `usePlayer.addFragments(1)` called
3. Player completes boss → `usePlayer.addFragments(100)` called
4. Player returns to main menu → Fragment display shows updated total

**Fragment spending flow (Story 20.2):**
1. Player opens Upgrades menu (Story 20.2)
2. Player purchases upgrade → `useUpgrades.purchaseUpgrade()` calls `usePlayer.addFragments(-cost)`
3. Player returns to main menu → Fragment display shows reduced total

**IMPORTANT:** This story only displays Fragment count. It does NOT handle Fragment earning, spending, or persistence—those are already implemented in other stories.

### Testing Standards

Follow the project's Vitest testing standards:

**Component tests:**
- Test MainMenu: Fragment display renders with correct value from usePlayer.fragments
- Test MainMenu: Fragment display uses purple color (#cc66ff or text-purple-400)
- Test MainMenu: Fragment count formatted with .toLocaleString() (commas)
- Test MainMenu: Fragment display positioned near BEST RUN (visual regression if applicable)
- Test MainMenu: Fragment count updates when usePlayer.fragments changes

**Integration tests:**
- Test Fragment count reactivity: mock usePlayer store, change fragments, verify UI updates

Example test:
```javascript
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import MainMenu from '../MainMenu.jsx'

vi.mock('../stores/usePlayer.jsx', () => ({
  default: vi.fn((selector) => selector({ fragments: 450 }))
}))

vi.mock('../stores/useGame.jsx', () => ({
  default: vi.fn((selector) => selector({ highScore: 1000 }))
}))

test('MainMenu displays Fragment count', () => {
  render(<MainMenu />)
  expect(screen.getByText(/450/)).toBeInTheDocument()
  expect(screen.getByText(/FRAGMENTS/i)).toBeInTheDocument()
})

test('MainMenu displays Fragment count with purple color', () => {
  render(<MainMenu />)
  const fragmentValue = screen.getByText(/450/)
  expect(fragmentValue).toHaveClass('text-purple-400') // or test computed style
})
```

**CRITICAL:** Mock both `usePlayer` and `useGame` stores in tests to prevent side effects and ensure predictable test data.

### Performance Notes

**No performance concerns for this story:**
- Simple static display, no animations or complex logic
- Zustand selector ensures only Fragment changes trigger re-render
- No useFrame or 3D rendering involved
- `.toLocaleString()` is fast for small numbers (Fragment counts are typically < 10,000)

**Best practices:**
- Use Zustand selector to subscribe only to `fragments` field
- No need for React.memo (MainMenu doesn't re-render frequently)

### Project Structure Notes

**Modified files:**
- `src/ui/MainMenu.jsx` — Add Fragment display near BEST RUN

**New files:**
- `src/ui/__tests__/MainMenu.test.jsx` — Add Fragment display tests (or extend existing tests if file exists)

**Files NOT modified:**
- `src/stores/usePlayer.jsx` — Fragment counter already exists (line 46)
- `src/stores/useUpgrades.jsx` — Created in Story 20.1, not needed for this story
- `src/entities/permanentUpgradesDefs.js` — Created in Story 20.1, not needed for this story

### Fragment Color Consistency

**Purple color usage across the game:**
- **Fragment gems in-game**: Purple glow (#cc66ff)
- **Tunnel Fragment upgrades**: Purple theme
- **Permanent upgrades menu**: Purple theme (Story 20.2)
- **Main menu Fragment display**: Should match purple theme

**Tailwind color options:**
- `text-purple-400` — Standard Tailwind purple (lighter)
- `text-purple-500` — Standard Tailwind purple (medium)
- `text-[#cc66ff]` — Exact color from Epic 20 spec (custom hex)

**Recommendation:** Use `text-purple-400` for consistency with existing Tailwind theme, or `text-[#cc66ff]` if exact color match is critical.

### UX Considerations

**Why show Fragments on main menu?**
- Players need to know if they can afford upgrades before opening Upgrades menu (Story 20.2)
- Seeing Fragment count reinforces "one more run" motivation (rogue-lite meta-progression)
- Visual feedback that Fragments persist across runs (not lost on death)

**Why near/below BEST RUN?**
- Groups meta-progression stats together (high score + currency)
- Top-right corner is non-intrusive (doesn't block main menu buttons)
- Consistent positioning with other persistent stats

**Fragment count of 0:**
Display "0" (not "---" like high score). Fragments are always a valid number, even if zero. Players start with 0 Fragments and earn them over time.

### References

- [Source: _bmad-output/planning-artifacts/epic-20-permanent-upgrades-system.md#Story 20.3] — Epic context, Story 20.3 acceptance criteria
- [Source: src/ui/MainMenu.jsx] — Main menu structure, BEST RUN display pattern (lines 100-107)
- [Source: src/stores/usePlayer.jsx] — Fragment counter (line 46: `fragments: 0`)
- [Source: _bmad-output/implementation-artifacts/20-1-permanent-upgrades-combat-stats.md] — Story 20.1 context (permanent upgrades foundation)
- [Source: _bmad-output/implementation-artifacts/20-2-upgrades-menu-screen.md] — Story 20.2 context (upgrades menu)
- [Source: _bmad-output/implementation-artifacts/19-3-fragment-drops.md] — Fragment gem drop implementation
- [Source: _bmad-output/planning-artifacts/epic-20-permanent-upgrades-system.md#Epic Context] — Fragment economy design, purple color (#cc66ff)
- [Source: _bmad-output/planning-artifacts/architecture.md#UI Layer] — 6-layer architecture, UI component guidelines

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

None — clean implementation with no issues.

### Completion Notes List

- Task 1: Added Fragment display to MainMenu.jsx below BEST RUN using Option A (stacked vertically). Imported usePlayer with Zustand selector `(s) => s.fragments` for optimized subscription. Used `text-[#cc66ff]` for exact purple color match per Epic 20 spec. Uses ◆ (purple lozenge) icon matching HUD, PauseMenu, and UpgradesScreen. Fragment count formatted with `.toLocaleString()` and displays "0" when zero (not "---"). Label uses same `text-game-text-muted text-xs tracking-[0.3em]` pattern as BEST RUN.
- Task 2: Created `src/ui/__tests__/MainMenu.test.jsx` with 5 tests covering: store contract (fragments field exposed), addFragments reactivity, reset behavior, resetForNewSystem persistence, and MENU_ITEMS export verification. Tests follow project pattern (store-level logic tests via Vitest, no @testing-library/react since not installed). Purple color and DOM positioning tests require @testing-library/react — marked as deferred.

### Change Log

- 2026-02-15: Implemented Fragment display on main menu (Story 20.3) — added purple Fragment counter below BEST RUN display, created MainMenu test file with 6 tests.
- 2026-02-15: Code review — Rewrote MainMenu.test.jsx: removed 2 meaningless tests (JS API toLocaleString, 0===0), removed duplicate store tests (already in usePlayer.fragments.test.js), added resetForNewSystem persistence test and MENU_ITEMS export test. Updated task checklist to honestly reflect test infra limitations (purple color/positioning tests deferred — require @testing-library/react). Fixed misleading comment in MainMenu.jsx. [Reviewer: Adam]

### File List

- `src/ui/MainMenu.jsx` (modified) — Added usePlayer import, fragments selector, Fragment display section below BEST RUN
- `src/ui/__tests__/MainMenu.test.jsx` (new) — 6 tests for Fragment display store logic and formatting
