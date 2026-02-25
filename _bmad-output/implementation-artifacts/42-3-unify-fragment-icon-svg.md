# Story 42.3: Unify Fragment Icon (SVG everywhere)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the fragment icon to look identical everywhere in the UI,
So that the currency has a consistent visual identity.

## Acceptance Criteria

1. **Given** `HUD.jsx` **When** fragments are displayed in the stats cluster **Then** the icon uses `<FragmentIcon size={14} color="var(--rs-violet)" />` — no longer the Unicode character `"◆"`.

2. **Given** `TunnelHub.jsx` **When** the fragment counter is displayed **Then** the icon uses `<FragmentIcon>` — no longer `&#9670;` or `◆`.

3. **Given** `ShipSelect.jsx` **When** the level-up cost displays the diamond symbol **Then** the icon uses `<FragmentIcon>` — no longer `◆`.

4. **Given** `UpgradesScreen.jsx` **When** the fragment balance header and upgrade cost buttons display the diamond symbol **Then** the icon uses `<FragmentIcon>` — no longer `◆`.

5. **Given** `StatsScreen.jsx` **When** the "FRAGMENTS EARNED" stat card is displayed **Then** the icon uses `<FragmentIcon>` — no longer `◆`.

6. **Given** any file in `src/ui/` **When** searching for `◆`, `&#9670;`, `&#x25C6;` **Then** zero occurrences — all replaced by the `<FragmentIcon>` component.

7. **Given** `vitest run` **When** the story is implemented **Then** all tests pass.

## Tasks / Subtasks

- [x] Task 1 — Replace `◆` in `HUD.jsx` AnimatedStat (AC: #1)
  - [x] Import `FragmentIcon` from `'./icons/index.jsx'`
  - [x] In the fragments `AnimatedStat` (line ~407), replace `icon="◆"` with `icon={<FragmentIcon size={14} color="var(--rs-violet)" />}`
  - [x] Verify that `AnimatedStat` supports a JSX element for its `icon` prop (not just a string) — if it only supports strings, pass `icon` as a render function or refactor the icon rendering inside AnimatedStat to handle both strings and React elements

- [x] Task 2 — Replace `&#9670;` in `TunnelHub.jsx` (AC: #2)
  - [x] Import `FragmentIcon` from `'./icons/index.jsx'`
  - [x] Line ~277: replace `<span style={{ color: 'var(--rs-violet)' }}>&#9670;</span>` with `<FragmentIcon size={14} color="var(--rs-violet)" />`
  - [x] Line ~397: replace `{upgrade.fragmentCost}&#9670;` with `{upgrade.fragmentCost}<FragmentIcon size={12} color="var(--rs-violet)" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 2 }} />` — or wrap in a flex container for alignment

- [x] Task 3 — Replace `◆` in `ShipSelect.jsx` (AC: #3)
  - [x] Import `FragmentIcon` from `'./icons/index.jsx'`
  - [x] Line ~720: replace `<span style={{ color: 'var(--rs-violet)' }}>◆</span>` with `<FragmentIcon size={14} color="var(--rs-violet)" />`

- [x] Task 4 — Replace `◆` in `UpgradesScreen.jsx` (AC: #4)
  - [x] Import `FragmentIcon` from `'./icons/index.jsx'`
  - [x] Line ~184: replace `{info.nextCost}◆` with `{info.nextCost}<FragmentIcon size={12} color="var(--rs-violet)" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 2 }} />` (or wrap in flex)
  - [x] Line ~241: replace `<span style={{ color: 'var(--rs-violet)' }} className="text-lg">◆</span>` with `<FragmentIcon size={18} color="var(--rs-violet)" />`

- [x] Task 5 — Replace `◆` in `StatsScreen.jsx` (AC: #5)
  - [x] Import `FragmentIcon` from `'./icons/index.jsx'`
  - [x] Line ~156: replaced string template with JSX fragment `<><FragmentIcon size={18} .../>{totalFragments.toLocaleString()}</>` — StatCard renders `{value}` directly in JSX so React elements work fine

- [x] Task 6 — Verify zero Unicode diamond occurrences (AC: #6)
  - [x] Run grep for `◆`, `&#9670;`, `&#x25C6;` in `src/ui/` — confirmed zero matches

- [x] Task 7 — Run tests (AC: #7)
  - [x] `vitest run` → 2669 tests pass, 0 failures

## Dev Notes

### Current State Analysis

The `FragmentIcon` SVG component already exists at `src/ui/icons/index.jsx:49` and is already used in:
- `src/ui/MainMenu.jsx:210` — fragment counter in menu
- `src/ui/PauseMenu.jsx:303` — via StatLine `icon={FragmentIcon}` prop

Six files still use Unicode diamonds (`◆` or `&#9670;`) and need migration:
1. `HUD.jsx:407` — `icon="◆"` in AnimatedStat
2. `TunnelHub.jsx:277` — `<span>&#9670;</span>` in sidebar fragment display
3. `TunnelHub.jsx:397` — `{cost}&#9670;` in upgrade button
4. `ShipSelect.jsx:720` — `<span>◆</span>` in level-up cost
5. `UpgradesScreen.jsx:184` — `{cost}◆` in upgrade button
6. `UpgradesScreen.jsx:241` — `<span>◆</span>` in header balance
7. `StatsScreen.jsx:156` — `◆` in StatCard value string

### Key Implementation Consideration: AnimatedStat icon prop

The `AnimatedStat` component in HUD.jsx currently receives `icon` as a string (`"◆"`). Check whether it renders the icon via `{icon}` in JSX (which would accept React elements) or whether it treats it as a text string. If it renders `{icon}` directly, passing `<FragmentIcon ... />` will work. If not, a small refactor of the icon rendering may be needed.

### Key Implementation Consideration: StatCard value prop

The `StatsScreen.jsx` `StatCard` receives `value` as a string (`"◆ 1,234"`). Since the fragment icon needs to become an SVG, the value prop may need to accept JSX or a separate `icon` prop needs to be introduced. Alternatively, compose the value inline with a flex wrapper.

### Key Implementation Consideration: Inline SVG alignment

SVGs in inline text flow need `display: 'inline-block'` and `verticalAlign: 'middle'` (or `-0.125em`) to align properly with text. In flex containers this is handled automatically. Choose the approach that matches the existing layout of each occurrence.

### FragmentIcon component reference

```jsx
// src/ui/icons/index.jsx:49
export function FragmentIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <path d="m258.396 21.375..." />
    </svg>
  )
}
```

Default size is 14, default color is `currentColor`. For fragment displays, typical usage: `<FragmentIcon size={14} color="var(--rs-violet)" />`.

### Files to Modify

| File | Changes |
|------|---------|
| `src/ui/HUD.jsx` | Import FragmentIcon, replace `icon="◆"` in AnimatedStat |
| `src/ui/TunnelHub.jsx` | Import FragmentIcon, replace 2× `&#9670;` |
| `src/ui/ShipSelect.jsx` | Import FragmentIcon, replace 1× `◆` |
| `src/ui/UpgradesScreen.jsx` | Import FragmentIcon, replace 2× `◆` |
| `src/ui/StatsScreen.jsx` | Import FragmentIcon, replace 1× `◆` in StatCard value |

### Architecture Compliance

- **Layer**: UI only — no store/system/config changes
- **Icon system**: Uses existing `FragmentIcon` from `src/ui/icons/index.jsx` (Epic 33 SVG icon system)
- **Design system**: `color="var(--rs-violet)"` matches Redshift palette for fragments
- **Anti-pattern avoided**: Unicode emoji/symbols → SVG (project-context rule #6)

### Project Structure Notes

- All changes are in `src/ui/` — no new files needed
- No new dependencies
- `FragmentIcon` is already exported and battle-tested in MainMenu and PauseMenu
- Alignment with Redshift DS: SVG icons everywhere, no Unicode symbols

### Previous Story Intelligence (42.1 & 42.2)

- **42.1** purges legacy Tailwind classes (`text-game-*`, `font-game`) from the same files. If 42.1 runs first, `UpgradesScreen.jsx:242` will no longer have `className="text-game-text"` — the `<span>` at line 241 will be replaced differently. The fragment icon replacement is independent of class changes.
- **42.2** only touches `MainMenu.jsx` (which already uses FragmentIcon). No conflict.
- Both stories are marked `ready-for-dev`. This story has no dependency on either — can be implemented in any order.

### Git Intelligence

Recent commits show the SVG icon migration pattern from Epic 33:
- `cce84dc feat(33.2): HUD emoji → SVG icon replacement + review fixes` — same pattern: replacing emoji/unicode with SVG components in HUD
- `e493903 feat(33.1): SVG icon system + StatLine function icon support` — established the icon system and `icon` prop pattern

The 33.2 commit is the closest precedent — it replaced emoji characters in HUD.jsx with SVG icon components. Follow the exact same approach.

### References

- [Source: _bmad-output/planning-artifacts/epic-42-ui-harmonization-deep-cleanup.md#Story 42.3]
- [Source: src/ui/icons/index.jsx:49 — FragmentIcon component definition]
- [Source: src/ui/HUD.jsx:407 — AnimatedStat with icon="◆"]
- [Source: src/ui/TunnelHub.jsx:277,397 — &#9670; occurrences]
- [Source: src/ui/ShipSelect.jsx:720 — ◆ in level-up cost]
- [Source: src/ui/UpgradesScreen.jsx:184,241 — ◆ occurrences]
- [Source: src/ui/StatsScreen.jsx:156 — ◆ in StatCard value]
- [Source: src/ui/MainMenu.jsx:210 — existing FragmentIcon usage (reference pattern)]
- [Source: src/ui/PauseMenu.jsx:303 — existing FragmentIcon via StatLine (reference pattern)]
- [Source: _bmad-output/planning-artifacts/project-context.md — anti-pattern #6: no emojis/unicode]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
None — implementation was straightforward.

### Completion Notes List
- Task 1 (HUD.jsx): `AnimatedStat` already handles function-type icons via `typeof icon === 'function'` check. Passed `icon={FragmentIcon}` (the component function), which renders as `<FragmentIcon size={14} color="currentColor" />` inheriting violet from the parent `style={{ color: 'var(--rs-violet)' }}`.
- Task 2 (TunnelHub.jsx): Two `&#9670;` replaced. Fragment counter in header uses `size={14}`, upgrade button cost uses `size={12}` with `inline-block` alignment.
- Task 3 (ShipSelect.jsx): Added `FragmentIcon` to existing multi-icon import block. Level-up cost span replaced.
- Task 4 (UpgradesScreen.jsx): Upgrade cost button `size={12}` inline; header balance `size={18}` replacing `text-lg` span.
- Task 5 (StatsScreen.jsx): `StatCard` renders `{value}` directly in JSX `<dd>`, so passing a React fragment `<><FragmentIcon .../>{number}</>` works cleanly. Used `size={18}` to match `1.5rem` Bebas Neue font size.
- Zero unicode diamonds remain in `src/ui/` (grep confirmed).
- All 2669 tests pass.
- **Code review fix (42.3):** `FragmentIcon` did not accept `style` prop — added `style` to component signature and forwarded to `<svg>` element (`icons/index.jsx:49`). Four call sites passed `style` for inline-text alignment (`TunnelHub.jsx:399`, `ShipSelect.jsx:725`, `UpgradesScreen.jsx:185`, `StatsScreen.jsx:157`) — these now apply correctly.
- **Code review fix (42.3):** Added `src/ui/__tests__/icons.test.jsx` with 5 tests covering `FragmentIcon` exports, default props, `style` prop forwarding regression guard.

### File List
- src/ui/HUD.jsx
- src/ui/TunnelHub.jsx
- src/ui/ShipSelect.jsx
- src/ui/UpgradesScreen.jsx
- src/ui/StatsScreen.jsx
- src/ui/icons/index.jsx
- src/ui/__tests__/icons.test.jsx

### Change Log
- 2026-02-24: Replace all Unicode diamond `◆`/`&#9670;` occurrences in src/ui/ with `<FragmentIcon>` SVG component (Story 42.3)
- 2026-02-24: Code review — add `style` prop to `FragmentIcon` (icons/index.jsx); add icons.test.jsx with 5 regression tests
