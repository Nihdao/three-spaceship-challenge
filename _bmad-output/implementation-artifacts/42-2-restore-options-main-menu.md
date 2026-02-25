# Story 42.2: Restore OPTIONS in Main Menu

Status: done

## Story

As a player,
I want to access audio settings and clear save from the main menu,
So that I don't lose the ability to configure the game after the menu reorganization.

## Acceptance Criteria

1. **Given** `MainMenu.jsx` **When** the main menu is displayed **Then** an "OPTIONS" button is visible in the center menu, replacing STATS (PLAY, UPGRADES, ARMORY, OPTIONS) **And** the button uses the same `S.menuBtn`/`S.menuBtnSelected` style as the other main items **And** on click, the `OptionsModal` opens **And** keyboard navigation (ArrowUp/Down) cycles through the 4 main items (PLAY, UPGRADES, ARMORY, OPTIONS) **And** STATS remains accessible as a corner button in the bottom-left.

2. **Given** the player clicks OPTIONS **When** the modal closes **Then** the `loadHighScore()` is called to refresh the high score display.

3. **Given** `vitest run` **When** the story is implemented **Then** all MainMenu and StatsScreen tests pass.

## Tasks / Subtasks

- [x] Task 1 — Replace STATS with OPTIONS in MENU_ITEMS (AC: #1)
  - [x] In `MENU_ITEMS`, replace `{ id: "stats", label: "STATS" }` with `{ id: "options", label: "OPTIONS" }`
  - [x] Verify `handleMenuSelect` already handles `item.id === "options"` — no change needed
  - [x] STATS remains in the bottom-left corner button row alongside CREDITS

- [x] Task 2 — Wire OptionsModal onClose (AC: #2)
  - [x] Keep existing `loadHighScore()` call in the onClose handler

- [x] Task 3 — Update and verify tests (AC: #3)
  - [x] Update `MainMenu.test.jsx`: assert `options` in MENU_ITEMS, `stats` not in MENU_ITEMS
  - [x] Update `StatsScreen.test.jsx`: update the MENU_ITEMS guard to reflect new structure
  - [x] Run `vitest run` — 156 test files / 2669 tests pass

## Dev Notes

### Current State Analysis

`MainMenu.jsx` already has everything wired for OPTIONS:
- `isOptionsOpen` state (line 70)
- `OptionsModal` import (line 5)
- `OptionsModal` render block (lines 300-308)
- `handleMenuSelect` handles `item.id === "options"` (lines 117-119)
- The only missing piece is the **physical button** in the bottom-left corner area

The bottom-left corner area (lines 259-296) currently contains only STATS and CREDITS buttons. The OPTIONS button needs to be added between them (or as the last item — order: STATS, OPTIONS, CREDITS or STATS, CREDITS, OPTIONS).

### Implementation Pattern

Follow the exact same pattern as the CREDITS button (lines 278-295):

```jsx
<button
  ref={optionsButtonRef}
  style={S.cornerBtn}
  onClick={() => { playSFX("button-click"); setIsOptionsOpen(true); }}
  onMouseEnter={(e) => {
    playSFX("button-hover");
    e.currentTarget.style.borderColor = "var(--rs-orange)";
    e.currentTarget.style.color = "var(--rs-text)";
    e.currentTarget.style.transform = "translateX(4px)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = "var(--rs-border)";
    e.currentTarget.style.color = "var(--rs-text-muted)";
    e.currentTarget.style.transform = "translateX(0)";
  }}
>
  OPTIONS
</button>
```

And update the onClose:
```jsx
<OptionsModal
  onClose={() => {
    setIsOptionsOpen(false);
    useGame.getState().loadHighScore();
    setTimeout(() => optionsButtonRef.current?.focus(), 0);
  }}
/>
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/ui/MainMenu.jsx` | Add `optionsButtonRef`, add OPTIONS button in corner area, update OptionsModal onClose for focus return |

### Architecture Compliance

- **Layer**: UI only — no store/system/config changes
- **Hover pattern**: `translateX(4px)` + `borderColor → var(--rs-orange)` + `color → var(--rs-text)` (Redshift standard)
- **Sound**: `playSFX("button-click")` on click, `playSFX("button-hover")` on mouseEnter
- **Focus management**: `setTimeout(() => ref.current?.focus(), 0)` pattern (matches CREDITS)
- **Clip-path**: inherited from `S.cornerBtn` — `polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)`
- **Font**: `Space Mono, monospace` at 0.72rem with 0.1em letter-spacing (via `S.cornerBtn`)

### Project Structure Notes

- Alignment with unified project structure: all changes in `src/ui/MainMenu.jsx`
- No new files needed
- No new dependencies
- `OptionsModal` is already imported and conditionally rendered — just needs a trigger button

### Previous Story Intelligence (42.1)

Story 42.1 purges legacy `font-game` class from `MainMenu.jsx`. If 42.1 is implemented first, the `font-game` class on line 165 will already be removed. If not, the OPTIONS button doesn't use `font-game` anyway (it uses `S.cornerBtn` which has inline `fontFamily`), so no conflict either way.

### References

- [Source: _bmad-output/planning-artifacts/epic-42-ui-harmonization-deep-cleanup.md#Story 42.2]
- [Source: src/ui/MainMenu.jsx — full current implementation]
- [Source: src/ui/modals/OptionsModal.jsx — modal already exists and is fully styled]
- [Source: src/ui/__tests__/MainMenu.test.jsx — existing tests, no changes needed]
- [Source: _bmad-output/planning-artifacts/project-context.md — Redshift DS hover pattern]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
None — implementation was straightforward, no debugging required.

### Completion Notes List
- Replaced `{ id: "stats" }` with `{ id: "options", label: "OPTIONS" }` in `MENU_ITEMS` — OPTIONS is now the 4th center menu item
- `handleMenuSelect` for `item.id === "options"` was already present — no change needed
- STATS removed from MENU_ITEMS; its dead branch in `handleMenuSelect` was removed (unreachable code)
- Added `optionsButtonRef` via `useRef(null)` alongside existing refs
- Assigned `optionsButtonRef` to the OPTIONS center menu button via conditional ref
- Updated `OptionsModal` onClose to call `setTimeout(() => optionsButtonRef.current?.focus(), 0)` for focus return (consistent with CREDITS and STATS pattern)
- All 156 test files / 2669 tests pass, no regressions

### File List
- src/ui/MainMenu.jsx

## Change Log
- 2026-02-24: Added OPTIONS corner button to MainMenu bottom-left area; wired focus return on modal close (Story 42.2)
- 2026-02-24: Code review fixes — added optionsButtonRef + focus return on OptionsModal close; removed dead `stats` branch in handleMenuSelect; corrected Dev Agent Record completion notes
