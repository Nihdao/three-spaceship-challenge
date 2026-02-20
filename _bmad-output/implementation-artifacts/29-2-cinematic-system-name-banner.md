# Story 29.2: Cinematic System Name Banner Redesign

Status: ready-for-dev

## Story

As a player,
I want the system entry announcement to feel like a cinematic moment,
so that arriving in a new system feels epic and immersive.

## Acceptance Criteria

1. The system name is displayed in large, bold, spaced-out text (~3rem, `tracking-widest`) as the primary line
2. The galaxy name is displayed below in a smaller (~1rem), muted, italic style as a secondary line
3. The two lines are visually distinct — system name ~2.5–3x bigger than galaxy name
4. The galaxy name fades in ~200ms after the system name (staggered CSS animation)
5. The whole banner fades out smoothly after the display duration (existing `systemBanner` keyframe preserved)
6. When `selectedGalaxyId` is null/undefined, only the system name is shown — no empty gap
7. The `system-name-banner` CSS class gains flex-col layout with background/blur on the container
8. A new `.system-name-banner-subtitle` CSS class is added for the galaxy line (with its own fade-in animation)

## Tasks / Subtasks

- [ ] Task 1: Update `SystemNameBanner.jsx` JSX structure (AC: 1, 2, 3, 6)
  - [ ] Remove `const displayName = galaxyName ? ...` (the combined string — no longer needed)
  - [ ] Keep `rawSystemName` for the primary line (unchanged logic)
  - [ ] Keep `galaxy` and `galaxyName` derivation (unchanged)
  - [ ] Render `rawSystemName` in `<div className="system-name-banner-text">`
  - [ ] Conditionally render `{galaxyName && <div className="system-name-banner-subtitle">{galaxy.name}</div>}`
  - [ ] Add `--subtitle-delay` CSS variable to the outer div's `style` prop (see calculation below)

- [ ] Task 2: Calculate `subtitleDelay` in the component (AC: 4)
  - [ ] Add: `const subtitleDelay = animationDelay + FADE_IN_DURATION + 0.2` (= 0.3 + 0.3 + 0.2 = 0.8s)
  - [ ] Pass as `'--subtitle-delay': `${subtitleDelay}s`` in the style prop

- [ ] Task 3: Update `.system-name-banner` CSS class in `src/style.css` (AC: 7)
  - [ ] Add flex layout: `display: flex; flex-direction: column; align-items: center; gap: 4px;`
  - [ ] Move visual styling from `.system-name-banner-text` to the container: `background`, `backdrop-filter`, `padding`, `border-radius`, `box-shadow`
  - [ ] Keep all position/animation properties unchanged

- [ ] Task 4: Update `.system-name-banner-text` CSS class (AC: 1, 3)
  - [ ] Increase `font-size` from `24px` to `3rem` (~48px)
  - [ ] Increase `font-weight` from `700` to `800`
  - [ ] Increase `letter-spacing` from `0.15em` to `0.2em` (tracking-widest)
  - [ ] Remove `background`, `backdrop-filter`, `padding`, `border-radius`, `box-shadow` (moved to container)

- [ ] Task 5: Add `@keyframes subtitleFadeIn` and `.system-name-banner-subtitle` CSS class (AC: 4, 8)
  - [ ] Add `@keyframes subtitleFadeIn` keyframe (fade + slight upward translate)
  - [ ] Add `.system-name-banner-subtitle` rule with delayed fade-in animation using `var(--subtitle-delay, 0.8s)`

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

**Target CSS:**
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
  /* NEW: flex layout for two-line display */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  /* MOVED from .system-name-banner-text: */
  background: rgba(255, 0, 255, 0.15);
  backdrop-filter: blur(8px);
  padding: 12px 28px;
  border-radius: 2px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
}

.system-name-banner-text {
  font-family: 'Inter', sans-serif;
  font-size: 3rem;          /* was: 24px */
  font-weight: 800;         /* was: 700 */
  color: #ffffff;
  text-align: center;
  letter-spacing: 0.2em;   /* was: 0.15em */
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  /* REMOVED: background, backdrop-filter, padding, border-radius, box-shadow */
}

/* NEW keyframe */
@keyframes subtitleFadeIn {
  0%   { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* NEW class */
.system-name-banner-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  letter-spacing: 0.05em;
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

### Completion Notes List

### File List
