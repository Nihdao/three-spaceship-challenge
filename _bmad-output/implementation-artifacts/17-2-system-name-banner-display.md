# Story 17.2: System Name Banner Display

Status: ready-for-dev

## Story

As a player,
I want to see the system name displayed prominently when I enter a new system,
So that I know which system I'm in and the transition feels polished.

## Acceptance Criteria

1. **Banner Appears During System Entry:** Given the portal animation is playing (phase `'systemEntry'` from Story 17.1), when the ship flies through the portal, then a system name banner fades in at the bottom-center of the screen displaying the system name (e.g., "ALPHA CENTAURI SYSTEM", "PROXIMA SYSTEM", "KEPLER-442 SYSTEM").

2. **Banner Visual Style:** Given the banner is displayed, when it renders, then the text is large (48-64px), bold, and uses the game's primary font (Inter). The text has a subtle glow or text-shadow for readability. The banner background is semi-transparent dark (#000000 at 60% opacity) with border accents matching the game's cyan theme.

3. **Banner Animation Timing:** Given the banner appears, when the animation completes, then the banner fades in over 0.3 seconds, remains visible for 2-3 seconds, and fades out over 0.5 seconds before the player gains full control (before `completeSystemEntry()` is called).

4. **System Names in Config:** Given system names, when they are defined, then each system (1, 2, 3) has a unique name defined in `gameConfig.js` as a `SYSTEM_NAMES` array. The name is pulled dynamically based on `useLevel.currentSystem`.

5. **HTML Overlay Implementation:** Given the banner UI, when it is implemented, then it is a simple HTML overlay component rendered conditionally based on game phase. CSS animations handle fade-in/fade-out (no JavaScript animation libraries needed).

## Tasks / Subtasks

- [ ] Task 1: Add SYSTEM_NAMES config to gameConfig.js (AC: #4)
  - [ ] 1.1 Add `SYSTEM_NAMES` array to `GAME_CONFIG` with 3 system names (e.g., `["ALPHA CENTAURI", "PROXIMA", "KEPLER-442"]`)
  - [ ] 1.2 Add `SYSTEM_BANNER` config block with timing constants: `FADE_IN_DURATION: 0.3`, `DISPLAY_DURATION: 2.5`, `FADE_OUT_DURATION: 0.5`

- [ ] Task 2: Create SystemNameBanner UI component (AC: #1, #2, #3, #5)
  - [ ] 2.1 Create `src/ui/SystemNameBanner.jsx` — HTML overlay div positioned at bottom-center
  - [ ] 2.2 Read `phase` from `useGame` store and `currentSystem` from `useLevel` store
  - [ ] 2.3 Show banner only when `phase === 'systemEntry'`
  - [ ] 2.4 Display system name from `GAME_CONFIG.SYSTEM_NAMES[currentSystem - 1]` (1-indexed to 0-indexed)
  - [ ] 2.5 Style: large bold text (48-64px, Inter font), text-shadow/glow for readability, semi-transparent dark background (#000000 at 60% opacity), border accents (cyan theme)
  - [ ] 2.6 CSS animation: fade-in (0.3s), hold (2.5s), fade-out (0.5s) using CSS `@keyframes` in `style.css`
  - [ ] 2.7 Banner should auto-animate on mount (triggered by phase becoming `'systemEntry'`)

- [ ] Task 3: Wire SystemNameBanner into Interface.jsx (AC: #1, #5)
  - [ ] 3.1 Import `SystemNameBanner` in `Interface.jsx`
  - [ ] 3.2 Render `<SystemNameBanner />` conditionally when `phase === 'systemEntry'`

- [ ] Task 4: Add CSS keyframes to style.css (AC: #3)
  - [ ] 4.1 Add `@keyframes systemBannerFadeIn` and related animation rules
  - [ ] 4.2 Define animation sequence: fade-in → hold → fade-out using a single composite animation or animation-delay chain

- [ ] Task 5: Manual testing & verification (AC: #1-#5)
  - [ ] 5.1 Verify banner appears during system entry phase and is positioned bottom-center
  - [ ] 5.2 Verify correct system name displays for each system (1, 2, 3)
  - [ ] 5.3 Verify animation timing: 0.3s fade-in, ~2.5s visible, 0.5s fade-out
  - [ ] 5.4 Verify banner disappears before player gains control
  - [ ] 5.5 Verify banner styling matches game aesthetic (glow, semi-transparent background, Inter font)

## Dev Notes

### Architecture & Pattern Compliance

**6-Layer Architecture Adherence:**
- **Config (Layer 1):** `SYSTEM_NAMES` array and `SYSTEM_BANNER` timing constants go in `gameConfig.js`. No magic numbers in the component.
- **UI (Layer 6):** `SystemNameBanner.jsx` goes in `src/ui/`. Pure HTML overlay, no 3D. Reads from stores for display only.

**Store Reading Pattern:**
- Read `phase` from `useGame` via React subscription: `useGame((s) => s.phase)`
- Read `currentSystem` from `useLevel` via React subscription: `useLevel((s) => s.currentSystem)`
- No store modifications — this is a display-only component.

**No New Store State Needed:**
- The banner lifecycle is entirely driven by CSS animation timing, triggered by the `'systemEntry'` phase.
- No timer state in any store — CSS `animation-duration` and `animation-delay` handle the entire sequence.
- The banner mounts when phase is `'systemEntry'` and unmounts when phase changes to `'gameplay'`.

### Existing Code Patterns to Follow

**Interface.jsx Phase Rendering (existing pattern):**
```javascript
// Current: Conditional rendering based on phase
{phase === 'menu' && <MainMenu />}
{phase === 'boss' && <BossHPBar />}
// New: Add SystemNameBanner for systemEntry phase
{phase === 'systemEntry' && <SystemNameBanner />}
```

**CSS Animation Pattern (existing in style.css):**
- Follow existing `@keyframes` patterns used in the project (e.g., fadeIn, fadeOut).
- Use a single `@keyframes systemBanner` animation combining fade-in, hold, and fade-out phases.

**Config Constants Pattern (existing in gameConfig.js):**
```javascript
// Follow existing grouped config pattern like PLANET_AURA, PROJECTILE_VISUALS
SYSTEM_NAMES: ["ALPHA CENTAURI", "PROXIMA", "KEPLER-442"],
SYSTEM_BANNER: {
  FADE_IN_DURATION: 0.3,
  DISPLAY_DURATION: 2.5,
  FADE_OUT_DURATION: 0.5,
},
```

### Critical Implementation Details

**Banner Positioning:**
- Bottom-center of screen: `position: fixed; bottom: 15%; left: 50%; transform: translateX(-50%);`
- High z-index to appear above game scene but below any modal overlays.

**System Name Lookup:**
- `SYSTEM_NAMES` is 0-indexed array, `currentSystem` from `useLevel` is 1-indexed.
- Lookup: `GAME_CONFIG.SYSTEM_NAMES[currentSystem - 1]` with fallback `"SYSTEM " + currentSystem`.

**CSS Animation Approach:**
- Use a single `@keyframes` animation with percentage-based phases:
  - Total duration = FADE_IN + DISPLAY + FADE_OUT = 0.3 + 2.5 + 0.5 = 3.3s
  - 0% → opacity: 0 (start)
  - ~9% (0.3/3.3) → opacity: 1 (fade-in complete)
  - ~85% ((0.3+2.5)/3.3) → opacity: 1 (hold ends)
  - 100% → opacity: 0 (fade-out complete)
- Apply `animation-fill-mode: forwards` so banner stays hidden after animation ends.

**Dependency on Story 17.1:**
- This story depends on Story 17.1 introducing the `'systemEntry'` phase in `useGame`.
- If Story 17.1 is not yet implemented, the `'systemEntry'` phase won't exist. The banner component can be created regardless — it will simply never render until the phase is added.
- Story 17.1 tasks include adding `SYSTEM_NAMES` to gameConfig.js (Task 1.2). If 17.1 is implemented first, the config may already exist. If not, add it here.

**Font:**
- The game uses Inter font family (referenced in existing CSS). The banner text should use `font-family: 'Inter', sans-serif`.

### Files to Modify

| File | Change |
|------|--------|
| `src/config/gameConfig.js` | Add `SYSTEM_NAMES` array and `SYSTEM_BANNER` config block |
| `src/ui/Interface.jsx` | Import and render `<SystemNameBanner />` for `'systemEntry'` phase |
| `src/style.css` | Add `@keyframes systemBanner` animation and `.system-banner` styles |

### Files to Create

| File | Purpose |
|------|---------|
| `src/ui/SystemNameBanner.jsx` | System name banner overlay component (HTML div, CSS animated) |

### Project Structure Notes

- `SystemNameBanner.jsx` in `src/ui/` — consistent with other overlay components (HUD, BossHPBar, GameOverScreen)
- No new stores, systems, or renderers needed — purely a UI display component
- All timing constants in `gameConfig.js` — no magic numbers
- Naming follows existing PascalCase convention for UI components

### Performance Budget

- Pure HTML/CSS overlay — zero GPU cost
- Single React subscription to `phase` and `currentSystem` — minimal re-render cost
- CSS animation handled by browser compositor — no JavaScript animation overhead

### Testing Approach

- No unit tests needed — this is a visual display component with no game logic
- Ensure `useGame.reset()` already handles all fields (verified: it does)
- Manual playtest: verify banner appears, displays correct name, animates smoothly, disappears before control handoff
- Verify existing tests still pass — no game logic changes

### Previous Story Intelligence

**From Story 17.1 (ready-for-dev):**
- Story 17.1 introduces the `'systemEntry'` phase in `useGame.jsx` with `startSystemEntry()` and `completeSystemEntry()` actions
- Story 17.1 Task 1.2 mentions adding `SYSTEM_NAMES` array to gameConfig.js — coordinate to avoid duplication
- The `SystemEntryPortal.jsx` renderer handles the portal animation sequence during `'systemEntry'` phase
- `WhiteFlashTransition.jsx` is created in Story 17.1 as a reusable overlay — follow similar HTML overlay pattern
- The system entry cinematic takes 2-3 seconds total — banner timing (3.3s total) should fit within or slightly exceed this window

**Coordination Note:**
- If Story 17.1 is implemented first, `SYSTEM_NAMES` and `'systemEntry'` phase may already exist. Check before adding.
- If Story 17.2 is implemented first, add `SYSTEM_NAMES` to config and the banner component. The banner won't render until 17.1 adds the phase.

### Git Intelligence

Recent commits show the project is working on visual polish (starfield parallax, grid visibility, unified lighting). The codebase follows consistent patterns:
- Config constants in `gameConfig.js` with grouped namespaces
- UI components as HTML overlays reading from Zustand stores
- CSS animations in `style.css` with `@keyframes`

### References

- [Source: _bmad-output/planning-artifacts/epic-17-cinematic-transitions.md#Story 17.2]
- [Source: _bmad-output/implementation-artifacts/17-1-system-entry-portal-animation.md — systemEntry phase, SYSTEM_NAMES config]
- [Source: src/config/gameConfig.js — config constant patterns (PLANET_AURA, PROJECTILE_VISUALS)]
- [Source: src/stores/useGame.jsx — phase management, existing phases]
- [Source: src/stores/useLevel.jsx — currentSystem field (1-indexed, starts at 1)]
- [Source: src/ui/Interface.jsx — conditional phase rendering pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md — 6-layer architecture, UI layer rules]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
