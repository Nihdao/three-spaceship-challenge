# Story 42.4: Containerize Floating Screens

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want every UI screen's content to be visually contained within a panel,
So that nothing feels like it's floating randomly on a dark background.

## Acceptance Criteria

1. **Given** `GameOverScreen.jsx` **When** stats and buttons are visible (stage >= 4) **Then** the content (taunt, high score, stats, buttons) is wrapped in a visible central panel with `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`, clip-path 16px **And** the title (taunt message) remains outside the panel, above it — the panel contains stats + buttons **And** the panel has a reasonable `max-width` (e.g., `clamp(320px, 40vw, 480px)`) and `padding: 24px`.

2. **Given** `VictoryScreen.jsx` **When** stats and buttons are visible (stage >= 2) **Then** same pattern: `--rs-bg-surface` panel containing stats + buttons, title above.

3. **Given** `RevivePrompt.jsx` **When** the prompt is displayed **Then** the content (title, counter, buttons) is wrapped in a `--rs-bg-surface` panel centered with clip-path 16px and border `--rs-border`.

4. **Given** `LevelUpModal.jsx` **When** the modal is displayed **Then** the main container of the 2 columns has `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`, clip-path 16px, `padding: 24px`.

5. **Given** `PlanetRewardModal.jsx` **When** the modal is displayed **Then** the main container of the 2 columns has `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`, clip-path 16px, `padding: 24px`.

6. **Given** `vitest run` **When** the story is implemented **Then** all tests pass.

## Tasks / Subtasks

- [x] Task 1 — Add panel to `GameOverScreen.jsx` (AC: #1)
  - [x] Add a wrapper `<div>` around the stats section (`stage >= 4` StatLine block) and action buttons (`stage >= 5` block) with panel styles: `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`, `clipPath: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)`, `padding: 24px`, `maxWidth: clamp(320px, 40vw, 480px)`, `width: '100%'`
  - [x] Keep the taunt `<h1>` (stage >= 3) and high score `<p>` OUTSIDE and ABOVE the panel
  - [x] The panel must only appear at `stage >= 4` (same visibility as stats) — not before, to preserve cinematic sequencing
  - [x] Stats container inside the panel should no longer need `mt-10` (margin absorbed by panel padding)
  - [x] Action buttons inside the panel should no longer need `mt-10` (vertical flow inside panel)

- [x] Task 2 — Add panel to `VictoryScreen.jsx` (AC: #2)
  - [x] Same pattern as GameOverScreen: wrap stats (stage >= 2) + buttons (stage >= 3) in a panel
  - [x] Title `<h1>` (stage >= 1) and high score `<p>` stay OUTSIDE
  - [x] Panel appears at `stage >= 2` (same as stats)
  - [x] Same panel styles: `--rs-bg-surface`, `--rs-border`, clip-path 16px, padding 24px, maxWidth `clamp(320px, 40vw, 480px)`

- [x] Task 3 — Add panel to `RevivePrompt.jsx` (AC: #3)
  - [x] Wrap the entire visible content (title "REVIVE?", accent bar, subtitle, buttons) in a panel `<div>` with `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`, clip-path 16px, `padding: 24px`, centered via flex on the overlay
  - [x] The overlay background (`rgba(13,11,20,0.88)`) stays as-is on the outer container; the panel is placed inside it
  - [x] Panel should have `display: flex`, `flexDirection: column`, `alignItems: center` to preserve the current centered layout

- [x] Task 4 — Add panel to `LevelUpModal.jsx` (AC: #4)
  - [x] Apply panel styles to the existing 2-column flex container (the inner `<div>` at line ~145 with `display: flex`, `flexWrap: wrap`, `maxWidth: 860`)
  - [x] Add: `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`, `clipPath: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)`, `padding: 24px`
  - [x] The keyboard hints `<p>` at the bottom (position: absolute) stays outside the panel

- [x] Task 5 — Add panel to `PlanetRewardModal.jsx` (AC: #5)
  - [x] Apply panel styles to the existing 2-column flex container (the `<div style={S.container}>` at line ~190)
  - [x] Add: `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`, `clipPath: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)`, `padding: 24px`

- [x] Task 6 — Run tests (AC: #6)
  - [x] `vitest run` → all tests pass (156 test files, 2669 tests — all green)
  - [x] Tests are store-level data contract tests (no DOM queries for style classes) — passed without modification

## Dev Notes

### Current State Analysis

All five screens currently render their content directly on a semi-transparent overlay (`rgba(13,11,20,0.88)` or `var(--rs-bg)` with opacity). The content floats without any visible panel/card container. This is inconsistent with PauseMenu, ShipSelect, TunnelHub, and other screens that use `--rs-bg-surface` panels.

**GameOverScreen.jsx** (262 lines):
- Cinematic staging system (stages 0-5): flash → fadeToBlack → taunt → stats → actions
- Content overlay is `fixed inset-0 z-[51] flex flex-col items-center justify-center`
- Stats section (stage >= 4): `<div>` with maxWidth `clamp(260px, 30vw, 400px)` containing `<StatLine>` components
- Action buttons (stage >= 5): `<div>` with flex gap-6
- **Panel must NOT appear before stage 4** to preserve cinematic timing. The panel wrapping stats+buttons should use `stage >= 4` conditional.
- Stats `mt-10` and buttons `mt-10` can be replaced by panel padding + `gap` inside the panel.

**VictoryScreen.jsx** (263 lines):
- Similar staging system (stages 0-3): dark → title → stats → actions
- Same structure as GameOverScreen but with different timing
- Stats (stage >= 2) and buttons (stage >= 3) need wrapping
- Panel appears at stage >= 2

**RevivePrompt.jsx** (193 lines):
- No staging — content appears immediately with `animate-fade-in`
- Overlay has `background: rgba(13,11,20,0.88)` applied inline via `S.overlay`
- Contains: title "REVIVE?", orange accent bar, subtitle, 2 buttons
- All content is centered via `flex flex-col items-center justify-center`
- Panel wraps everything inside the overlay

**LevelUpModal.jsx** (327 lines):
- No staging — content appears immediately
- Overlay: `fixed inset-0 z-50` with `backgroundColor: rgba(13,11,20,0.88)`
- Inner container: `display: flex`, `flexWrap: wrap`, `gap: 24`, `maxWidth: 860`, `padding: 0 16px`
- Two columns: left (Build Overview, 220px) and right (Title + Cards, flex: 1 minWidth 320)
- Keyboard hints `<p>` is `position: absolute, bottom: 24` — lives outside the flow
- Panel styles applied to the inner container; keyboard hints stay outside
- **Note**: LevelUpModal still has `text-game-text` and `text-game-text-muted` Tailwind classes on lines 305-306, 319 — these may have been cleaned up by story 42.1 already. If not, they should still work (Tailwind 4 ignores unknown classes without error). This story does NOT need to fix them — that's 42.1's scope.

**PlanetRewardModal.jsx** (285 lines):
- No staging — content appears immediately
- Overlay via `S.overlay` (position: fixed, background rgba)
- Inner container `S.container`: `display: flex`, `gap: 24`, `maxWidth: 720`, `padding: 0 16px`
- Two columns: left (Scan Info, 200px) and right (Title + Cards, flex: 1 minWidth 280)
- Panel styles applied to `S.container`

### Panel Style Reference (Redshift DS)

The standard Redshift modal panel style is:
```js
{
  background: 'var(--rs-bg-surface)',
  border: '1px solid var(--rs-border)',
  clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
  padding: 24,
}
```

This matches the pattern used in PauseMenu (clip-path 16px panels), TunnelHub sidebar panels, and ShipSelect card containers. The `16px` cut is the "modal" size per the project-context clip-path reference.

### Critical Implementation Notes

1. **Cinematic timing (GameOverScreen/VictoryScreen)**: The panel MUST appear at the same time as the stats — not before. If the panel fades in at stage 3 (taunt) while stats appear at stage 4, it would show an empty panel briefly. Solution: the panel wrapper uses the same `stage >= 4` (GameOver) or `stage >= 2` (Victory) conditional as the stats.

2. **Pointer events**: GameOverScreen/VictoryScreen use `pointer-events-none` on the content overlay and `pointer-events-auto` on buttons. The panel itself should NOT add `pointer-events-auto` (let children handle it), but it does need to not block the pointer-events flow. Since it's a child of `pointer-events-none`, individual buttons inside still need `pointer-events-auto`.

3. **Animation classes**: Existing `animate-fade-in` and `animate-slide-up` classes on stats/buttons inside the panel should be preserved. The panel itself can also use `animate-fade-in` for a clean entrance.

4. **No `borderRadius`**: Per Redshift DS anti-patterns — use clip-path, never border-radius.

### Test Impact Assessment

All four test files (GameOverScreen, VictoryScreen, LevelUpModal, PlanetRewardModal) test **store data contracts and display logic only** — they don't render React components or query the DOM for style classes. RevivePrompt has no test file at all. Therefore, adding a visual panel wrapper will NOT break any existing tests.

### Files to Modify

| File | Changes |
|------|---------|
| `src/ui/GameOverScreen.jsx` | Wrap stats + buttons in a `--rs-bg-surface` panel, adjust margins |
| `src/ui/VictoryScreen.jsx` | Same pattern — wrap stats + buttons in panel |
| `src/ui/RevivePrompt.jsx` | Add inner panel container with `--rs-bg-surface` |
| `src/ui/LevelUpModal.jsx` | Add panel styles to existing 2-column container |
| `src/ui/PlanetRewardModal.jsx` | Add panel styles to existing `S.container` |

### Architecture Compliance

- **Layer**: UI only — no store/system/config/rendering changes
- **Design system**: `var(--rs-bg-surface)`, `var(--rs-border)`, clip-path 16px (modal size) — all per Redshift DS
- **Anti-patterns avoided**: No border-radius, no hardcoded hex, no backdrop-filter blur
- **No new dependencies**
- **No new files**

### Project Structure Notes

- All changes confined to `src/ui/` — five component files
- No store, system, or config changes needed
- Consistent with existing paneled screens (PauseMenu, ShipSelect, TunnelHub)
- [Source: _bmad-output/planning-artifacts/project-context.md — Redshift DS clip-path patterns]

### Previous Story Intelligence (42.1, 42.2, 42.3)

- **42.1** (Purge legacy Tailwind) may have cleaned up `text-game-*` classes in LevelUpModal. If running after 42.1, those classes will already be gone. If running before 42.1, the classes still exist but don't affect this story's work (panel is purely additive).
- **42.2** (Restore OPTIONS) only touches MainMenu.jsx — no conflict.
- **42.3** (Unify Fragment Icon) only touches HUD, TunnelHub, ShipSelect, UpgradesScreen, StatsScreen — no conflict with the 5 files modified here.
- Stories 42.1-42.3 are all marked `ready-for-dev`. This story has **no dependency** on any of them.

### Git Intelligence

Recent commits show the Redshift DS panel pattern established across Epic 33 and 39:
- `cce84dc feat(33.2): HUD emoji → SVG icon replacement + review fixes`
- `e0fbbe5 feat(34.1): galaxy profile enrichment & planet type redesign`

The clip-path panel pattern (`polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)`) is consistently used in PauseMenu, ShipSelect, TunnelHub, and options modals.

### Risk Notes

- **GameOverScreen/VictoryScreen cinematic staging**: If the panel appears before its content (wrong stage conditional), it will show an empty container briefly. Ensure the panel and its children share the same stage gate.
- **Layout shift in LevelUpModal**: Adding padding to the 2-column container might cause the left column (220px) + right column (minWidth 320) to wrap differently. The existing `padding: 0 16px` should be replaced by `padding: 24` (24px all sides), and `maxWidth` may need a small increase (860 → ~900) to compensate for the extra 48px of horizontal padding. Test visually.

### References

- [Source: _bmad-output/planning-artifacts/epic-42-ui-harmonization-deep-cleanup.md#Story 42.4]
- [Source: _bmad-output/planning-artifacts/project-context.md — Redshift DS clip-path patterns, anti-patterns]
- [Source: src/ui/GameOverScreen.jsx — current floating structure, cinematic staging]
- [Source: src/ui/VictoryScreen.jsx — current floating structure, staging]
- [Source: src/ui/RevivePrompt.jsx — current floating structure, no staging]
- [Source: src/ui/LevelUpModal.jsx — 2-column container, keyboard hints outside flow]
- [Source: src/ui/PlanetRewardModal.jsx — 2-column S.container pattern]
- [Source: src/ui/__tests__/GameOverScreen.test.jsx — store-level tests only, no DOM]
- [Source: src/ui/__tests__/VictoryScreen.test.jsx — store-level tests only]
- [Source: src/ui/__tests__/LevelUpModal.test.jsx — store-level tests only]
- [Source: src/ui/__tests__/PlanetRewardModal.test.jsx — store-level tests only]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation was straightforward. All 5 files modified as specified. No test failures.

### Completion Notes List

- Task 1 (GameOverScreen): Replaced separate stats+buttons conditionals with a single panel `<div>` at `stage >= 4`. Buttons remain conditionally rendered inside the panel at `stage >= 5`. Removed `mt-10` from both inner divs; panel `gap: 24` handles vertical spacing. Title (taunt) and high score label stay outside/above the panel.
- Task 2 (VictoryScreen): Same pattern — panel at `stage >= 2`, buttons at `stage >= 3` inside panel. Title at `stage >= 1` stays outside.
- Task 3 (RevivePrompt): Added inner panel `<div>` wrapping all content (h1, accent bar, subtitle, buttons). Outer overlay keeps `rgba(13,11,20,0.88)` background unchanged. Panel uses `display: flex; flex-direction: column; align-items: center` to preserve centered layout.
- Task 4 (LevelUpModal): Added panel styles (`background`, `border`, `clipPath`) to the existing 2-column flex container. Changed `padding: '0 16px'` to `padding: 24`. Keyboard hints `<p>` (position: absolute, bottom: 24) remains outside the panel.
- Task 5 (PlanetRewardModal): Added panel styles to `S.container` — changed `padding: '0 16px'` to `padding: 24`, added `background`, `border`, `clipPath`.
- Task 6: `vitest run` — 156 test files, 2669 tests, all passing. No test modifications needed (all tests are store-level data contracts with no DOM style queries).

### File List

src/ui/GameOverScreen.jsx
src/ui/VictoryScreen.jsx
src/ui/RevivePrompt.jsx
src/ui/LevelUpModal.jsx
src/ui/PlanetRewardModal.jsx

## Change Log

- 2026-02-24: Added `--rs-bg-surface` panel containers to GameOverScreen, VictoryScreen, RevivePrompt, LevelUpModal, PlanetRewardModal. All screens now wrap their content in clip-path 16px panels consistent with PauseMenu/TunnelHub/ShipSelect Redshift DS pattern.
- 2026-02-24 (code review fixes): LevelUpModal right column paddingBottom reduced 48→16 (no longer needed with panel padding:24 handling the bottom gap). PlanetRewardModal S.rightCol paddingBottom:48 removed (no keyboard hints in this screen, value was vestigial). RevivePrompt buttons REVIVE+GAME OVER added type="button" for consistency with rest of codebase.
