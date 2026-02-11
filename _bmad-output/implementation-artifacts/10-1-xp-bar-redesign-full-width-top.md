# Story 10.1: XP Bar Redesign (Full-Width Top)

Status: ready-for-dev

## Story

As a player,
I want to see a highly visible XP bar spanning the full width of the screen at the very top,
So that I can instantly track my progress toward the next level.

## Acceptance Criteria

1. **Given** the player is in gameplay **When** the HUD renders **Then** the XP bar is positioned at the absolute top of the screen (y: 0) **And** the bar spans the full width of the viewport (100vw) **And** the bar height is prominent but not obstructive (e.g., 8-12px)

2. **Given** the XP bar is displayed **When** XP increases **Then** the bar fills from left to right proportional to progress toward next level (e.g., 250/500 XP = 50% filled) **And** the fill uses a vibrant color (cyan/green gradient from UX color spec) **And** the bar animates smoothly when XP is collected (ease-out, 200-300ms)

3. **Given** the XP bar is nearly full (>80%) **When** the player is close to leveling up **Then** the bar subtly pulses or glows to indicate imminent level-up

4. **Given** the player levels up **When** XP resets for the next level **Then** the bar plays a brief flash/fill animation before resetting to 0% **And** the animation is satisfying and clear

## Tasks / Subtasks

- [ ] Task 1: Create full-width XP bar component structure (AC: #1)
  - [ ] 1.1: Create `src/ui/XPBarFullWidth.jsx` component
  - [ ] 1.2: Position component at absolute top (fixed, top-0, left-0, w-full, z-50)
  - [ ] 1.3: Bar height 8-12px (use h-3 Tailwind class = 12px)
  - [ ] 1.4: Background dark (bg-black/30 or bg-gray-900/40)
  - [ ] 1.5: Filled portion uses cyan/green gradient (bg-gradient-to-r from-game-success to-cyan-400)

- [ ] Task 2: Integrate XPBarFullWidth into HUD (AC: #1)
  - [ ] 2.1: Import XPBarFullWidth into HUD.jsx
  - [ ] 2.2: Render XPBarFullWidth as first child of HUD container
  - [ ] 2.3: Verify XPBarFullWidth renders in gameplay phase only (not menu, gameOver, tunnel)
  - [ ] 2.4: Ensure XPBarFullWidth doesn't interfere with other HUD elements (z-index layering)

- [ ] Task 3: Wire XP progress from usePlayer store (AC: #2)
  - [ ] 3.1: Subscribe to usePlayer store for currentXP, xpForNextLevel
  - [ ] 3.2: Calculate progress percentage: (currentXP / xpForNextLevel) * 100
  - [ ] 3.3: Apply percentage to fill width using inline style or CSS variable
  - [ ] 3.4: Clamp percentage to 0-100 range (safety check)

- [ ] Task 4: Implement smooth fill animation (AC: #2)
  - [ ] 4.1: Add CSS transition to filled portion (transition-all duration-300 ease-out)
  - [ ] 4.2: Test animation when XP increases (collect orb → bar fills smoothly)
  - [ ] 4.3: Verify no jitter or visual glitches during rapid XP gain (multiple orbs)

- [ ] Task 5: Implement imminent level-up pulse effect (AC: #3)
  - [ ] 5.1: Detect when XP progress > 80% (calculate in component)
  - [ ] 5.2: Apply pulse animation when > 80% (animate-pulse Tailwind class or custom keyframe)
  - [ ] 5.3: Add subtle glow effect (shadow-lg shadow-cyan-400/50)
  - [ ] 5.4: Remove pulse when XP resets (after level-up)

- [ ] Task 6: Implement level-up flash animation (AC: #4)
  - [ ] 6.1: Listen for level-up event (usePlayer level change, or useEffect on level)
  - [ ] 6.2: Trigger flash animation: bar fills to 100%, flashes bright white/cyan (200ms)
  - [ ] 6.3: Then reset bar to 0% with fade (100ms)
  - [ ] 6.4: Use React state or CSS animation class toggle
  - [ ] 6.5: Ensure animation doesn't block level-up modal (non-blocking, runs in background)

- [ ] Task 7: Visual polish and UX color spec compliance (AC: #2, #3)
  - [ ] 7.1: Gradient colors match UX spec (cyan #06B6D4, green #10B981 from Tailwind palette)
  - [ ] 7.2: Bar background uses dark/sober palette (black/80 or gray-900/60)
  - [ ] 7.3: Optional: Add subtle border-bottom (border-b border-cyan-500/20)
  - [ ] 7.4: Test readability at 1080p resolution (visible but not distracting)
  - [ ] 7.5: Verify no overlap with other top UI elements (timer, stats from future stories)

- [ ] Task 8: Performance validation (NFR1, NFR5)
  - [ ] 8.1: Test XP bar updates with 60 FPS gameplay (no frame drops)
  - [ ] 8.2: Verify CSS transitions are GPU-accelerated (transform or opacity, not width)
  - [ ] 8.3: If using width animation, switch to transform scaleX for performance
  - [ ] 8.4: Test with 100+ enemies and rapid XP collection (stress test)

- [ ] Task 9: Accessibility and edge cases
  - [ ] 9.1: Ensure XP bar is visible on all supported resolutions (1080p minimum)
  - [ ] 9.2: Test with different viewport aspect ratios (16:9, 16:10, ultrawide)
  - [ ] 9.3: Verify bar resets correctly after death and restart
  - [ ] 9.4: Test XP bar during tunnel phase (should not render, or render with correct data for new system)

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **UI Layer** → XPBarFullWidth.jsx is a pure UI component reading from store
- **Stores** → usePlayer store provides currentXP, xpForNextLevel, level fields
- **No Game Logic** → XP calculation happens in progressionSystem.js, called by GameLoop
- **Rendering Layer** → HUD.jsx composes all overlay UI elements

**Existing Infrastructure:**
- `src/stores/usePlayer.jsx` — Already tracks XP, level, xpForNextLevel (from Epic 3)
- `src/ui/HUD.jsx` — Current HUD with HP, timer, minimap, weapon slots, XP bar (bottom-left)
- `src/systems/progressionSystem.js` — Handles XP curve, level-up triggers
- `config/gameConfig.js` — Contains XP_LEVEL_CURVE array

**Current XP Bar Location:**
- Story 4.2 implemented XP bar in bottom-left of HUD
- Epic 10 Story 10.1 moves it to full-width top
- **Decision:** Keep old XP bar component for reference, create NEW component for full-width design
- Old component can be removed after confirming new design works

### Technical Requirements

**Component Props (XPBarFullWidth.jsx):**
```javascript
// No props needed — reads directly from usePlayer store
// Component is self-contained and subscribes to store
```

**usePlayer Store Fields (already exist):**
```javascript
{
  currentXP: 150,         // Current XP accumulated toward next level
  xpForNextLevel: 500,    // XP required to reach next level
  level: 5,               // Current player level
}
```

**CSS Animation for Level-Up Flash:**
```css
@keyframes xp-flash {
  0% { width: 100%; opacity: 1; }
  50% { filter: brightness(2); }
  100% { width: 0%; opacity: 0.8; }
}
```

**Tailwind Classes Reference:**
- Position: `fixed top-0 left-0 w-full z-50`
- Height: `h-3` (12px) or `h-2` (8px)
- Background: `bg-black/30` or `bg-gray-900/40`
- Fill gradient: `bg-gradient-to-r from-green-400 to-cyan-400`
- Pulse: `animate-pulse` (built-in Tailwind)
- Transition: `transition-all duration-300 ease-out`

### Previous Story Intelligence (Epic 8 Patterns)

**From Story 8.2 (Options Menu):**
- **Modal patterns:** Overlay with bg-black/60, fade-in animation (150ms ease-out)
- **Accessibility:** Focus trap, ESC key listener, inert attribute on background
- **localStorage patterns:** Direct read/write, validate values, defaults if missing
- **Keyboard navigation:** Full support required (arrows, Enter, ESC)

**From Story 8.1 (Main Menu Overhaul):**
- **3D Background patterns:** MenuScene.jsx for animated backgrounds
- **Button styling:** Consistent with game design (cyan/magenta accents)
- **Animation timing:** 150-300ms for UI transitions, spring (300ms) for rewards
- **Performance:** 60 FPS maintained with 3D background animations

**Learnings Applied to Story 10.1:**
- Use consistent animation timing (200-300ms ease-out for fill animation)
- Keep pulse effect subtle (avoid distraction from gameplay)
- Test with multiple rapid updates (XP collection stress test)
- Ensure z-index doesn't conflict with future top-bar elements (timer, stats)

### Git Intelligence (Recent Patterns)

**From commit e0c99a1 (Story 8.2):**
- Files modified: `src/ui/modals/OptionsModal.jsx`, `src/ui/MainMenu.jsx`, `src/audio/audioManager.js`
- Pattern: New modal components in `src/ui/modals/` directory
- localStorage usage: Read/write with validation, defaults for missing keys

**From commit cebd462 (Story 8.1):**
- Files modified: `src/ui/MainMenu.jsx`, `src/scenes/MenuScene.jsx`
- Pattern: 3D background scenes paired with UI overlays
- Animation pattern: fade-in for modals, smooth transitions for scene changes

**Applied to Story 10.1:**
- New component will be `src/ui/XPBarFullWidth.jsx` (not in modals, it's permanent HUD element)
- HUD.jsx will be modified to import and render XPBarFullWidth
- No new stores or systems needed (reads from existing usePlayer)
- CSS animations should follow 200-300ms timing established in Epic 8

### UX Design Specification Compliance

**From UX Doc (Epic 8 Context):**
- **Color System:** UI palette (dark/sober) separate from 3D effects (saturated neon)
- **XP Bar Colors:** Cyan #06B6D4 and Green #10B981 (from Tailwind palette)
- **Animation Timing:** ease-out default (150-300ms), spring for rewards (300ms)
- **Typography:** Inter font, tabular-nums for numbers
- **Spacing:** 4px base unit
- **Accessibility:** Contrast > 4.5:1, keyboard-navigable, visible at 1080p minimum

**XP Bar Specific (from Epic 10 Story):**
- Full-width (100vw) at absolute top (y: 0)
- Height: 8-12px (prominent but not obstructive)
- Fill direction: left-to-right
- Gradient: cyan/green (vibrant, matches UX color spec)
- Pulse effect: >80% progress (subtle, indicates imminent level-up)
- Flash animation: level-up (brief, satisfying, 200ms flash + 100ms reset)

### Architecture Guardrails

**File Structure Requirements (Architecture.md):**
```
src/ui/XPBarFullWidth.jsx  — New component (THIS story creates it)
src/ui/HUD.jsx             — Modified (import and render XPBarFullWidth)
src/stores/usePlayer.jsx   — No changes (already has XP fields)
```

**Layer Boundaries (Architecture.md 6-Layer):**
- XPBarFullWidth is **UI Layer** → reads from stores, no game logic
- HUD is **UI Layer** → composes UI elements
- usePlayer is **Stores Layer** → provides state, no rendering

**Anti-Patterns to AVOID:**
- DO NOT put game logic in XPBarFullWidth (no XP calculation, no level-up triggers)
- DO NOT modify usePlayer store (read-only from UI)
- DO NOT use useFrame in XPBarFullWidth (UI components use React state/effects only)
- DO NOT create a new store for XP bar state (use existing usePlayer)

**Coding Standards (Architecture.md Naming):**
- Component: `XPBarFullWidth.jsx` (PascalCase)
- Props: none (reads directly from store)
- CSS classes: Tailwind utility classes (kebab-case via Tailwind)
- Store subscription: `usePlayer((state) => ({ currentXP: state.currentXP, ... }))`

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- XP bar updates must not cause frame drops
- Use GPU-accelerated CSS properties (transform, opacity) instead of width for animation
- Recommended: Use `transform: scaleX()` on fill element instead of animating width

**NFR5: No Frame Drops During Level-Up:**
- Level-up flash animation must not block rendering
- Use CSS animations (GPU-accelerated) instead of JavaScript setInterval
- Test with level-up modal open simultaneously (both should render smoothly)

**Implementation Recommendation:**
```javascript
// GOOD (GPU-accelerated):
<div className="transform origin-left transition-transform duration-300"
     style={{ transform: `scaleX(${progress / 100})` }} />

// BAD (CPU-bound, causes reflows):
<div className="transition-all duration-300"
     style={{ width: `${progress}%` }} />
```

### Testing Checklist

**Functional Testing:**
- [ ] XP bar visible at top in gameplay phase (not menu, gameOver)
- [ ] Bar fills proportionally as XP increases (50% XP = 50% bar width)
- [ ] Smooth animation when collecting XP orbs (ease-out, 200-300ms)
- [ ] Pulse effect activates at >80% XP (subtle glow, not distracting)
- [ ] Flash animation triggers on level-up (100% → flash → 0%)
- [ ] Bar resets correctly after level-up (new XP threshold applied)
- [ ] Bar resets correctly after death/restart (0 XP, level 1)

**Visual Testing:**
- [ ] Gradient colors match UX spec (cyan/green, vibrant)
- [ ] Bar height appropriate (8-12px, visible but not obstructive)
- [ ] No overlap with other top UI elements (future timer, stats)
- [ ] Readable at 1080p resolution (minimum supported)
- [ ] Contrast meets accessibility standards (>4.5:1)

**Performance Testing:**
- [ ] 60 FPS maintained during rapid XP collection (10+ orbs/second)
- [ ] No frame drops during level-up flash animation
- [ ] No visual jitter or glitches during animation
- [ ] Works correctly with 100+ enemies on screen (stress test)

**Edge Case Testing:**
- [ ] XP bar at 0% displays correctly (empty bar visible)
- [ ] XP bar at 100% displays correctly (full bar before level-up)
- [ ] Multiple rapid level-ups handled correctly (flash animation doesn't stack)
- [ ] Bar hidden during tunnel phase (or displays correctly if kept visible)
- [ ] Works on different viewport sizes (16:9, 16:10, ultrawide)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 10]
- [Source: _bmad-output/planning-artifacts/architecture.md#UI Layer]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#HUD Layout]
- [Source: _bmad-output/implementation-artifacts/8-2-options-menu.md#Animation Patterns]
- [Source: src/stores/usePlayer.jsx — currentXP, xpForNextLevel, level fields]
- [Source: src/ui/HUD.jsx — Current HUD composition]
- [Source: config/gameConfig.js — XP_LEVEL_CURVE]

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled by dev agent)

### Completion Notes List

(To be filled by dev agent)

### File List

(To be filled by dev agent)
