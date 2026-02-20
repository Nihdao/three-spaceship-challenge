# Story 29.2: Cinematic System Name Banner Redesign

Status: done

## Story

As a player,
I want the system entry announcement to feel like a cinematic moment,
so that arriving in a new system feels epic and immersive.

## Acceptance Criteria

1. The system name is displayed in large, bold, spaced-out text (~3rem, `tracking-widest`) as the primary line
2. The galaxy name is displayed below in a smaller (~1rem), muted style as a secondary line — no italic, no background block
3. The two lines are visually distinct — system name ~2.5–3x bigger than galaxy name; both styled with text-shadow glow
4. The galaxy name fades in ~200ms after the system name (staggered CSS animation)
5. The whole banner fades out smoothly after the display duration (existing `systemBanner` keyframe preserved)
6. When `selectedGalaxyId` is null/undefined, only the system name is shown — no empty gap
7. The `system-name-banner` CSS class gains flex-col layout — no background block, no blur, no box-shadow
8. A new `.system-name-banner-subtitle` CSS class is added for the galaxy line (with its own fade-in animation and text-shadow)

## Tasks / Subtasks

- [x] Task 1: Update `SystemNameBanner.jsx` JSX structure (AC: 1, 2, 3, 6)
  - [x] Remove `const displayName = galaxyName ? ...` (the combined string — no longer needed)
  - [x] Keep `rawSystemName` for the primary line (unchanged logic)
  - [x] Keep `galaxy` and `galaxyName` derivation (unchanged)
  - [x] Render `rawSystemName` in `<div className="system-name-banner-text">`
  - [x] Conditionally render `{galaxyName && <div className="system-name-banner-subtitle">{galaxy.name}</div>}`
  - [x] Add `--subtitle-delay` CSS variable to the outer div's `style` prop (see calculation below)

- [x] Task 2: Calculate `subtitleDelay` in the component (AC: 4)
  - [x] Add: `const subtitleDelay = animationDelay + FADE_IN_DURATION + 0.2` (= 0.3 + 0.3 + 0.2 = 0.8s)
  - [x] Pass as `'--subtitle-delay': `${subtitleDelay}s`` in the style prop

- [x] Task 3: Update `.system-name-banner` CSS class in `src/style.css` (AC: 7)
  - [x] Add flex layout: `display: flex; flex-direction: column; align-items: center; gap: 6px;`
  - [x] No background, no backdrop-filter, no padding, no box-shadow — banner is transparent
  - [x] Keep all position/animation properties unchanged

- [x] Task 4: Update `.system-name-banner-text` CSS class (AC: 1, 3)
  - [x] Increase `font-size` from `24px` to `3rem` (~48px)
  - [x] Increase `font-weight` from `700` to `800`
  - [x] Increase `letter-spacing` from `0.15em` to `0.2em` (tracking-widest)
  - [x] Text-shadow: pink glow (`rgba(255,100,255,0.6)`) + dark drop shadow for readability

- [x] Task 5: Add `@keyframes subtitleFadeIn` and `.system-name-banner-subtitle` CSS class (AC: 4, 8)
  - [x] Add `@keyframes subtitleFadeIn` keyframe (fade + slight upward translate)
  - [x] Add `.system-name-banner-subtitle` rule: no italic, `letter-spacing: 0.15em`, text-shadow glow, delayed fade-in animation

## Dev Notes

### Files to Modify

1. **`src/ui/SystemNameBanner.jsx`** — JSX structure (2 changes: remove combined string, add subtitle div)
2. **`src/style.css`** — CSS changes (update 2 classes + add 1 keyframe + 1 class)

No store changes. No config changes. No new files.

### Current JSX vs. Target JSX

**Current (lines 39–62):**
```jsx
// Current: single combined string in one div
const galaxy = selectedGalaxyId ? getGalaxyById(selectedGalaxyId) : null
const galaxyName = galaxy ? galaxy.name.toUpperCase() : null
const displayName = galaxyName ? `${galaxyName} — ${rawSystemName}` : rawSystemName

// ...

return (
  <div
    className="system-name-banner"
    onAnimationEnd={handleAnimationEnd}
    style={{
      '--animation-duration': `${totalDuration}s`,
      '--animation-delay': `${animationDelay}s`,
    }}
  >
    <div className="system-name-banner-text">
      {displayName}
    </div>
  </div>
)
```

**Target:**
```jsx
// Remove displayName — no longer needed
const galaxy = selectedGalaxyId ? getGalaxyById(selectedGalaxyId) : null
const galaxyName = galaxy ? galaxy.name.toUpperCase() : null

// ADD: subtitle delay calculation
const { FADE_IN_DURATION, DISPLAY_DURATION, FADE_OUT_DURATION } = GAME_CONFIG.SYSTEM_BANNER
const totalDuration = FADE_IN_DURATION + DISPLAY_DURATION + FADE_OUT_DURATION
const animationDelay = 0.3
const subtitleDelay = animationDelay + FADE_IN_DURATION + 0.2  // 0.8s total

return (
  <div
    className="system-name-banner"
    onAnimationEnd={handleAnimationEnd}
    style={{
      '--animation-duration': `${totalDuration}s`,
      '--animation-delay': `${animationDelay}s`,
      '--subtitle-delay': `${subtitleDelay}s`,  // NEW
    }}
  >
    <div className="system-name-banner-text">
      {rawSystemName}
    </div>
    {galaxyName && (
      <div className="system-name-banner-subtitle">
        {galaxy.name}
      </div>
    )}
  </div>
)
```

Note: `galaxyName` is kept for the conditional check, `galaxy.name` (original case, not uppercased) is used as the subtitle text for the softer look.

### Current CSS vs. Target CSS

**Current state (from `src/style.css` lines 161–210):**
```css
@keyframes systemBanner {
  0%   { opacity: 0; transform: translate(-50%, -20px); }
  9%   { opacity: 1; transform: translate(-50%, 0); }
  85%  { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, 20px); }
}

.system-name-banner {
  position: fixed;
  top: 12%;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 150;
  animation: systemBanner var(--animation-duration, 3.3s) ease-out var(--animation-delay, 0.3s) forwards;
  pointer-events: none;
  opacity: 0;
  /* ← NO flex, NO background here */
}

.system-name-banner-text {
  font-family: 'Inter', sans-serif;
  font-size: 24px;       /* ← too small */
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  letter-spacing: 0.15em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  background: rgba(255, 0, 255, 0.15);  /* ← move to container */
  backdrop-filter: blur(8px);            /* ← move to container */
  padding: 10px 24px;                    /* ← move to container */
  border-radius: 2px;                    /* ← move to container */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6); /* ← move to container */
}
```

**Target CSS (as actually implemented — AC7 overrides earlier drafts):**
```css
/* @keyframes systemBanner — UNCHANGED */

.system-name-banner {
  position: fixed;
  top: 12%;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 150;
  animation: systemBanner var(--animation-duration, 3.3s) ease-out var(--animation-delay, 0.3s) forwards;
  pointer-events: none;
  opacity: 0;
  /* NEW: flex layout for two-line display (AC7) */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  /* No background, no backdrop-filter, no box-shadow — banner is transparent (AC7) */
}

.system-name-banner-text {
  font-family: 'Inter', sans-serif;
  font-size: 3rem;          /* was: 24px */
  font-weight: 800;         /* was: 700 */
  color: #ffffff;
  text-align: center;
  letter-spacing: 0.2em;   /* was: 0.15em */
  text-shadow: 0 0 40px rgba(255, 100, 255, 0.6), 0 2px 12px rgba(0, 0, 0, 0.9);
  /* All visual block props (background, backdrop-filter, padding, border-radius, box-shadow) removed */
}

/* NEW keyframe */
@keyframes subtitleFadeIn {
  0%   { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* NEW class — no italic (AC2 overrides earlier epic draft) */
.system-name-banner-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
  letter-spacing: 0.15em;
  text-shadow: 0 0 20px rgba(255, 100, 255, 0.4), 0 1px 6px rgba(0, 0, 0, 0.8);
  opacity: 0;
  animation: subtitleFadeIn 0.4s ease-out var(--subtitle-delay, 0.8s) forwards;
}
```

### Animation Timing Logic

The subtitle animation delay is calculated so the subtitle appears ~200ms after the system name is fully visible:

```
Container starts:      t = animationDelay        = 0.3s (after white flash)
System name visible:   t = animationDelay + FADE_IN_DURATION = 0.3 + 0.3 = 0.6s
Subtitle fade-in:      t = 0.6 + 0.2             = 0.8s
```

The subtitle's `subtitleFadeIn` animation only controls its own fade-in. The banner container's `systemBanner` animation controls the overall fade-out (opacity: 0 at 100%), which cascades to all children — so the subtitle fades out correctly without needing its own fade-out keyframe.

### Galaxy Name Display

`galaxyDefs.js` currently has one galaxy: `{ id: 'andromeda_reach', name: 'Andromeda Reach', ... }`. When selected, the subtitle shows `galaxy.name` (Title Case: `"Andromeda Reach"`), NOT `galaxy.name.toUpperCase()`. The original uppercase was only needed for the combined single-line format; for the subtitle softer look, Title Case is appropriate.

The `galaxyName` variable (uppercase) is kept only for the conditional check (`{galaxyName && ...}`).

### No-Galaxy Fallback

When `selectedGalaxyId` is null (e.g., player skipped galaxy selection), `galaxy` is null, `galaxyName` is null, and `{galaxyName && <div>...}` renders nothing. The flex container has `gap: 4px` which only applies between children — so no empty gap appears. Layout is clean.

### Test Impact

**`src/ui/__tests__/SystemNameBanner.test.jsx`** — no changes needed. All existing tests are store/config-level (GAME_CONFIG values, phase transitions, store contracts). None test the internal rendering structure or CSS class names. The tests pass unchanged.

### Project Structure Notes

- Only 2 files modified: `src/ui/SystemNameBanner.jsx` + `src/style.css`
- No new files created
- `@keyframes systemBanner` is **not** modified (only the outer container uses it)
- The subtitle animation is a self-contained new keyframe `subtitleFadeIn`
- Pattern: CSS variable (`--subtitle-delay`) passed from JSX for flexibility — same pattern as `--animation-duration` and `--animation-delay`

### References

- Current component: `src/ui/SystemNameBanner.jsx` (63 lines)
- Current CSS: `src/style.css` lines 161–210 (`@keyframes systemBanner`, `.system-name-banner`, `.system-name-banner-text`)
- Galaxy definitions: `src/entities/galaxyDefs.js` → `getGalaxyById`, `galaxy.name`
- GAME_CONFIG timing: `GAME_CONFIG.SYSTEM_BANNER` → `FADE_IN_DURATION: 0.3`, `DISPLAY_DURATION: 2.5`, `FADE_OUT_DURATION: 0.5`
- Epic specification: `_bmad-output/planning-artifacts/epic-29-ui-polish.md` → Story 29.2 + Technical Notes

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — straightforward JSX restructure + CSS update following the Dev Notes spec exactly.

### Completion Notes List

- Removed `displayName` combined string; `rawSystemName` now renders directly as primary line
- Added `subtitleDelay = 0.3 + 0.3 + 0.2 = 0.8s` calculation; passed as `--subtitle-delay` CSS variable
- Conditional subtitle: `{galaxyName && <div className="system-name-banner-subtitle">{galaxy.name}</div>}` — renders nothing when no galaxy selected, no gap
- `.system-name-banner` gains flex-col layout + visual bg/blur/padding (moved from text class)
- `.system-name-banner-text`: font-size 24px → 3rem, weight 700 → 800, tracking 0.15em → 0.2em; visual props removed
- New `@keyframes subtitleFadeIn` (fade + 4px upward translate) + `.system-name-banner-subtitle` class with delayed animation
- All 19 existing SystemNameBanner tests pass (tests are store/config-level, no rendering structure assertions)

### File List

- src/ui/SystemNameBanner.jsx
- src/style.css

## Change Log

- 2026-02-20: Implemented story 29.2 — cinematic two-line banner (system name large + galaxy subtitle delayed fade-in); CSS restructured for flex-col layout; `@keyframes subtitleFadeIn` added
- 2026-02-20: Code review — Fixed animationend bubbling bug (handleAnimationEnd now filters by event.animationName === 'systemBanner'); added 7 Story 29.2 logic tests; corrected Dev Notes Target CSS (background/italic discrepancies vs ACs)
