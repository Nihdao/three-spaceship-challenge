# Story 29.3: Upgrade Card UX — Full Card Clickable + Descriptions Visible

Status: done

## Story

As a player,
I want to click anywhere on an upgrade card to buy it and read the full description without text being cut off,
so that the upgrade screen is ergonomic and all upgrade information is accessible.

## Acceptance Criteria

1. The description text is fully visible — no `truncate` class cutting it — wrapping to multiple lines
2. The card height adapts to the text content (no fixed height clipping)
3. On cards with long descriptions, the text wraps cleanly within the card boundaries
4. Clicking anywhere on an upgrade card triggers purchase if the player can afford it and it's not maxed
5. The same `handleBuy` logic runs for the whole card (not just the cost button)
6. The visual feedback (border color, hover state) is applied to the entire card — already the case
7. The cursor is `pointer` on the whole card when purchase is available (`canAfford && !isMaxed`)
8. Clicking the card body when maxed or can't afford does nothing (disabled state preserved via `handleBuy` guard)
9. The card's visual state (opacity, cursor) indicates non-interactability as before
10. The cost button remains visible for reference even when disabled (visual-only, no onClick)

## Tasks / Subtasks

- [x] Task 1: Remove `truncate` from description `<p>` and allow wrapping (AC: 1, 2, 3)
  - [x] In `UpgradeCard`, change line 95 from `truncate` to `leading-relaxed` (removes truncation, enables wrapping)
  - [x] Verify description text wraps naturally within the card grid cell

- [x] Task 2: Move click interaction to the outer card `<div>` (AC: 4, 5, 7)
  - [x] Add `onClick={handleBuy}` to the outer card `<div>` (the one with `border rounded-lg p-3...`)
  - [x] Add `onMouseEnter={() => info.canAfford && !info.isMaxed && playSFX('button-hover')}` to the card div
  - [x] Add `cursor-pointer` to the card className when `canAfford && !isMaxed`
  - [x] Add `cursor-not-allowed` to the card className when `!canAfford && !isMaxed`

- [x] Task 3: Make the cost button visual-only (AC: 10)
  - [x] Remove `onClick={handleBuy}` from the `<button>` element
  - [x] Remove `onMouseEnter` from the `<button>` element (moved to card div)
  - [x] Keep `disabled={!info.canAfford}` on button for visual state
  - [x] Keep all visual classes on button unchanged

## Dev Notes

### The Single File to Touch

Only **`src/ui/UpgradesScreen.jsx`** needs modification — specifically the `UpgradeCard` function (lines 47–128).

No CSS changes. No store changes. No new files.

### Current Code vs. Target Code

**Current `UpgradeCard` outer div (lines 73–84):**
```jsx
<div
  className={`
    border rounded-lg p-3 transition-all duration-150 select-none
    bg-black/40 backdrop-blur-sm
    ${info.isMaxed
      ? 'border-game-success/40'
      : info.canAfford
        ? 'border-game-border hover:border-[#cc66ff]/60 hover:bg-black/50'
        : 'border-game-border/40 opacity-60'
    }
  `}
>
```

**Target outer div:**
```jsx
<div
  className={`
    border rounded-lg p-3 transition-all duration-150 select-none
    bg-black/40 backdrop-blur-sm
    ${info.isMaxed
      ? 'border-game-success/40'
      : info.canAfford
        ? 'border-game-border hover:border-[#cc66ff]/60 hover:bg-black/50 cursor-pointer'
        : 'border-game-border/40 opacity-60 cursor-not-allowed'
    }
  `}
  onClick={handleBuy}
  onMouseEnter={() => info.canAfford && !info.isMaxed && playSFX('button-hover')}
>
```

---

**Current description `<p>` (line 95):**
```jsx
<p className="text-xs text-game-text-muted truncate">{info.description}</p>
```

**Target description `<p>`:**
```jsx
<p className="text-xs text-game-text-muted leading-relaxed">{info.description}</p>
```

---

**Current `<button>` (lines 108–123):**
```jsx
<button
  className={`...`}
  onClick={handleBuy}
  onMouseEnter={() => info.canAfford && playSFX('button-hover')}
  disabled={!info.canAfford}
  aria-label={`Buy ${info.name} for ${info.nextCost} Fragments`}
>
  {info.nextCost}◆
</button>
```

**Target `<button>` (visual reference only):**
```jsx
<button
  className={`...`}
  disabled={!info.canAfford}
  aria-label={`Buy ${info.name} for ${info.nextCost} Fragments`}
  tabIndex={-1}
>
  {info.nextCost}◆
</button>
```

Note: `tabIndex={-1}` removes the button from keyboard tab order since the card div is the interactive element. This keeps accessibility clean (keyboard users navigate the card, not the nested button).

### handleBuy Guard — Already Correct

The existing `handleBuy` function already handles the disabled state correctly:
```js
const handleBuy = () => {
  if (info.isMaxed || !info.canAfford) return  // ← guard in place
  ...
}
```

No changes needed to `handleBuy` itself. Moving `onClick` to the card div works without any logic change.

### Cursor Strategy

- `isMaxed` → default cursor (no pointer, no not-allowed — card is just informational)
- `canAfford && !isMaxed` → `cursor-pointer`
- `!canAfford && !isMaxed` → `cursor-not-allowed` (already has `opacity-60`)

### Grid Layout — No Changes Needed

The upgrade grid uses `grid-cols-2 md:grid-cols-3 gap-3` (line 192). Cards use `p-3`. With `truncate` removed, descriptions wrap within the cell width. Cards in the same row will have different heights — this is fine with CSS grid (row height auto-expands to the tallest card). No fixed heights, no overflow hidden in the current implementation.

### Button Visual Classes Unchanged

The button's visual classes are not modified — they already style correctly for `canAfford`/`!canAfford` states using `disabled` attribute. The Tailwind `disabled:` variant and the explicit `disabled={!info.canAfford}` prop handle visual state without onClick being needed.

### No Test Changes Required

No tests cover `UpgradeCard` rendering or interaction in the current test suite. The exported `getUpgradeDisplayInfo` and `UPGRADE_IDS` remain unchanged. No store logic is touched.

Note: Testing card click/keyboard behavior requires `@testing-library/react` (not currently installed). See action item in Tasks.

### Project Structure Notes

- **Only file modified**: `src/ui/UpgradesScreen.jsx`
- Pattern consistency: previous stories (e.g., 29.2) follow minimal-file-touch approach
- No regressions: `handleBuy`, store integration, SFX all preserved
- The `isMaxed` visual branch renders `<span>MAX</span>` instead of a button — no changes there

### References

- File to edit: `src/ui/UpgradesScreen.jsx` lines 47–128 (`UpgradeCard` function)
- Epic spec: `_bmad-output/planning-artifacts/epic-29-ui-polish.md` → Story 29.3 + Technical Notes section
- Store: `src/stores/useUpgrades.jsx` → `purchaseUpgrade()` (untouched)
- Defs: `src/entities/permanentUpgradesDefs.js` → `PERMANENT_UPGRADES`, `getTotalBonus` (untouched)

### Review Follow-ups (AI)

- [ ] [AI-Review][MEDIUM] Add `@testing-library/react` and write component tests for: card click triggers `handleBuy`, `onKeyDown` Enter/Space activates card, `tabIndex` is 0 when affordable and -1 otherwise [src/ui/__tests__/UpgradesScreen.test.jsx]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- Removed `truncate` from description `<p>`, replaced with `leading-relaxed` — descriptions now wrap to multiple lines within the card (AC 1, 2, 3)
- Moved `onClick={handleBuy}` and `onMouseEnter` SFX trigger to the outer card `<div>` — entire card is now clickable (AC 4, 5, 7)
- Added `cursor-pointer` when `canAfford && !isMaxed`, `cursor-not-allowed` when `!canAfford && !isMaxed` (AC 7, 9)
- Removed `onClick` and `onMouseEnter` from cost `<button>`, added `tabIndex={-1}` — button is now visual-only reference (AC 10)
- `handleBuy` guard (`if isMaxed || !canAfford return`) already handles AC 8 correctly — no logic change needed
- All 20 UpgradesScreen tests pass. Pre-existing failures (audio, MainMenu stats) unrelated to this story.

**Code review fixes (2026-02-20):**
- Added `role="button"`, `tabIndex={canAfford && !isMaxed ? 0 : -1}`, `onKeyDown` (Enter/Space), and `aria-label` to card div — restores keyboard accessibility regression introduced when button was made visual-only
- Added `aria-hidden="true"` and `pointer-events-none` to cost button — removes misleading aria-label and hover styles from visual-only element; clicks now pass through cleanly to card div

### File List

- src/ui/UpgradesScreen.jsx

## Change Log

- 2026-02-20: Implemented Story 29.3 — UpgradeCard full card clickable + descriptions visible. Modified UpgradesScreen.jsx: removed `truncate` from description, moved onClick/onMouseEnter/cursors to outer card div, made cost button visual-only with tabIndex={-1}.
- 2026-02-20: Code review fixes — added keyboard accessibility (role, tabIndex, onKeyDown, aria-label) to card div; added aria-hidden + pointer-events-none to cost button.
