# Story 45.7: Tagline aléatoire sous le titre du menu principal

Status: done

## Story

As a player,
I want to see a small random humorous phrase below the game title each time I visit the main menu,
So that the game has personality and returning to the menu after a run is slightly rewarding.

## Acceptance Criteria

1. **Given** `src/ui/MainMenu.jsx`
   **When** the component mounts (initial mount or return to menu)
   **Then** a tagline is randomly selected from the pool and displayed — it does NOT change during the session (stable via `useState` initializer function)

2. **Given** the tagline position
   **When** the main menu is displayed
   **Then** it appears between the orange decorative line and the menu buttons:
   ```
   REDSHIFT SURVIVOR          ← h1 title
   ————                       ← orange line (width 32px)
   THE VOID STARES BACK.      ← tagline here
   IT LOOKS DISAPPOINTED.
                              ← gap before buttons
   [ PLAY ]
   [ UPGRADES ]
   ...
   ```

3. **Given** the tagline style
   **When** it is rendered
   **Then** it uses these styles:
   - `fontFamily: "'Space Mono', monospace"`
   - `fontSize: '0.65rem'`
   - `letterSpacing: '0.12em'`
   - `color: 'var(--rs-danger, #e63946)'`
   - `textTransform: 'uppercase'`
   - `textAlign: 'center'`
   - `marginBottom: '2.5rem'`
   - `opacity: 0.85`
   - `userSelect: 'none'`
   - `whiteSpace: 'pre-line'`
   **And** the orange decorative line changes from `marginBottom: "3rem"` to `marginBottom: "1rem"` (the tagline takes over the gap)

4. **Given** the `TAGLINES` pool in `MainMenu.jsx`
   **When** the file is opened
   **Then** the `TAGLINES` constant is defined at module-level (before the component) and contains at minimum:
   ```js
   const TAGLINES = [
     "THE UNIVERSE IS BIGGER THAN YOUR PROBLEMS. FOR NOW.",
     "SPACE IS INFINITE. YOUR HEALTH BAR IS NOT.",
     "EVERY DEATH IS A LEARNING OPPORTUNITY.\nYOU HAVE LEARNED NOTHING.",
     "RECOMMENDED BY 0 OUT OF 1 SENTIENT VOIDS.",
     "TECHNICALLY STILL ALIVE.",
     "YOUR SHIP IS FINE. YOU ARE NOT FINE.",
     "ENEMIES HAVE FAMILIES TOO. (THEY DON'T.)",
     "THE VOID STARES BACK.\nIT LOOKS DISAPPOINTED.",
     "SKILL ISSUE (OPTIONAL DISCLAIMER)",
     "LAST SEEN: ALIVE. STATUS: DEBATABLE.",
     "IF YOU LISTEN CLOSELY, THE ASTEROIDS LAUGH.",
     "NOT ALL WHO WANDER ARE LOST.\nMOST ARE JUST BAD AT THE GAME.",
     "STARS DIED FOR BILLIONS OF YEARS TO MAKE THIS.\nPLEASE DON'T CRASH INTO THEM.",
     "REDSHIFT: WHAT HAPPENS TO YOUR DOPPLER WHEN YOU FLEE.",
     "PRESS PLAY. REGRET LATER.",
   ]
   ```

5. **Given** taglines with `\n`
   **When** they are rendered
   **Then** the tagline element uses `whiteSpace: 'pre-line'` to respect line breaks

6. **Given** returning to menu after a run
   **When** the `MainMenu` component remounts
   **Then** a new random tagline is selected (natural behavior via `useState` init)

7. **Given** `vitest run`
   **When** the story is implemented
   **Then** all existing tests pass — no test checks the textual content of MainMenu

## Tasks / Subtasks

- [x] Add `TAGLINES` constant at module-level in `src/ui/MainMenu.jsx` (AC: #4)
  - [x] Place before the `MainMenu` function declaration
  - [x] Include all 15 phrases as specified
- [x] Add `tagline` state in `MainMenu` component (AC: #1, #6)
  - [x] `const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)])`
  - [x] Destructure only the value (no setter needed — tagline is stable per mount)
- [x] Update orange decorative line `marginBottom` from `"3rem"` to `"1rem"` (AC: #3)
  - [x] Line 231 in current `MainMenu.jsx`: `marginBottom: "3rem"` → `marginBottom: "1rem"`
- [x] Insert tagline `<p>` element between orange line and menu buttons (AC: #2, #3, #5)
  - [x] Insert after the `<div>` title block (closing `</div>` at line ~232) and before the `<div className="flex flex-col items-center gap-4">` at line 235
  - [x] Apply all styles from AC#3
- [x] Run `vitest run` and confirm 0 regressions (AC: #7)

## Dev Notes

### Exact Insertion Point in MainMenu.jsx

Current structure (relevant excerpt):
```jsx
{/* Title */}
<div>
  <h1 style={{ ... }}>REDSHIFT SURVIVOR</h1>
  <div style={{ width: "32px", height: "2px", background: "var(--rs-orange)", marginTop: "6px", marginBottom: "3rem" }} />
</div>

{/* Menu items */}
<div className="flex flex-col items-center gap-4">
```

Target structure after change:
```jsx
{/* Title */}
<div>
  <h1 style={{ ... }}>REDSHIFT SURVIVOR</h1>
  <div style={{ width: "32px", height: "2px", background: "var(--rs-orange)", marginTop: "6px", marginBottom: "1rem" }} />
</div>

{/* Tagline */}
<p style={{
  fontFamily: "'Space Mono', monospace",
  fontSize: '0.65rem',
  letterSpacing: '0.12em',
  color: 'var(--rs-danger, #e63946)',
  textTransform: 'uppercase',
  textAlign: 'center',
  marginBottom: '2.5rem',
  opacity: 0.85,
  userSelect: 'none',
  whiteSpace: 'pre-line',
}}>
  {tagline}
</p>

{/* Menu items */}
<div className="flex flex-col items-center gap-4">
```

### CSS Variable Verified

`--rs-danger: #ef233c;` is defined at line 169 in `src/style.css` — use `var(--rs-danger, #e63946)` as specified (the fallback `#e63946` is slightly different from the actual value `#ef233c`, both are accessible red on dark background).

### useState Initializer Pattern

Use the lazy initializer form:
```js
const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)])
```
This guarantees `Math.random()` is called only once per component mount, not on every render. No setter needed — the tagline is intentionally stable for the session duration.

### No Import Changes Required

`useState` is already imported at line 1: `import { useState, useEffect, useCallback, useRef } from "react"`. No new imports needed.

### Architecture Layer

This story touches **UI** layer only. No stores, no game loop, no config, no systems involved. Purely additive — adds a constant and one JSX element.

### Project Structure Notes

- File to modify: `src/ui/MainMenu.jsx` (single file, single concern)
- `TAGLINES` placed at module-level (before `export const MENU_ITEMS`) following existing module-level constant pattern (`S` style object, `MENU_ITEMS` array)
- The tagline `<p>` is rendered inside the `{!isUpgradesOpen && !isArmoryOpen && !isStatsOpen && <div>` conditional block — it will correctly hide with the rest of the menu when a screen is open

### Taglines With \n — Rendering

Taglines like `"EVERY DEATH IS A LEARNING OPPORTUNITY.\nYOU HAVE LEARNED NOTHING."` will render as two lines when `whiteSpace: 'pre-line'` is applied to the `<p>`. No `<br>` tags needed in JSX.

### References

- [Source: _bmad-output/planning-artifacts/epic-45-player-experience-polish.md#Story 45.7]
- [Source: src/ui/MainMenu.jsx#L1-L345] — full current state of the file
- [Source: src/style.css#L169] — `--rs-danger: #ef233c;` CSS variable confirmed present

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None._

### Completion Notes List

- Added `TAGLINES` array (15 entries) at module-level in `src/ui/MainMenu.jsx`, before `MENU_ITEMS`.
- Added `const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)])` as first state in `MainMenu` component — lazy initializer ensures single selection per mount.
- Updated orange decorative line `marginBottom` from `"3rem"` to `"1rem"` (AC#3).
- Inserted `<p>` tagline element with all specified styles between the title `<div>` and menu buttons `<div>` (AC#2, #3, #5).
- Confirmed `whiteSpace: 'pre-line'` correctly handles `\n` in multi-line taglines (AC#5).
- `vitest run` : 25 pre-existing failures (unrelated stores/systems), 0 new regressions from this story (AC#7).

### File List

- `src/ui/MainMenu.jsx`

### Change Log

- 2026-02-27: Story 45.7 implemented — random tagline display added to main menu (Story: 45-7-main-menu-random-tagline)
