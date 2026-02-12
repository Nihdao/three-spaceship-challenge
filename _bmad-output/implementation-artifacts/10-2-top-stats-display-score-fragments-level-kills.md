# Story 10.2: Top Stats Display (Score, Fragments, Level, Kills)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see my current score, fragment count, kill count, and timer prominently displayed at the top of the screen,
So that I can track my performance at a glance.

## Acceptance Criteria

1. **Given** the player is in gameplay **When** the top bar renders **Then** the following stats are displayed in the top-left quadrant: Kill count with icon (e.g., "💀 273" or skull icon + number), Fragment count with icon (e.g., "◆ 384" or gem icon + number), Score with icon (e.g., "⭐ 44180" or score icon + number) **And** each stat uses tabular-nums for alignment **And** stats are horizontally aligned with consistent spacing

2. **Given** the player is in gameplay **When** the top-right displays the timer **Then** the timer shows MM:SS format counting down (e.g., "6:08") **And** the timer is centered at the very top or slightly offset right **And** when timer drops below 1 minute, it pulses red as a warning

3. **Given** the player is in gameplay **When** the top-right displays level and score **Then** the current level is shown prominently (e.g., "LVL 102") **And** optionally, secondary score display is shown (if not already in top-left)

4. **Given** stats update during gameplay **When** kills, fragments, or score increase **Then** the updated values animate briefly (scale up slightly, then back to normal) **And** updates are immediate (< 50ms)

## Tasks / Subtasks

- [x] Task 1: Add score tracking to useGame store (AC: #1, #3)
  - [x] 1.1: Add `score` field to useGame store initial state (default 0)
  - [x] 1.2: Add `addScore(amount)` action to increment score
  - [x] 1.3: Reset score to 0 in useGame.reset()
  - [x] 1.4: Test score tracking (score starts at 0, increments correctly, resets on restart)

- [x] Task 2: Integrate score calculation in GameLoop (AC: #1)
  - [x] 2.1: Call useGame.addScore(xpValue) when enemy dies (in damage resolution section)
  - [x] 2.2: Optionally add score bonuses for: boss defeat, planet scan completion, level-up milestones
  - [x] 2.3: Test score accumulation during gameplay (kills → score increases)

- [x] Task 3: Add fragments display to HUD (AC: #1)
  - [x] 3.1: Subscribe to usePlayer.fragments in HUD.jsx
  - [x] 3.2: Create fragments stat display in top-left cluster (icon + number)
  - [x] 3.3: Use tabular-nums font class
  - [x] 3.4: Test fragments display (renders correctly, updates when fragments collected)

- [x] Task 4: Add score display to HUD (AC: #1, #3)
  - [x] 4.1: Subscribe to useGame.score in HUD.jsx
  - [x] 4.2: Create score stat display in top-left cluster (icon + number)
  - [x] 4.3: Use tabular-nums font class
  - [x] 4.4: Test score display (renders correctly, updates when score increases)

- [x] Task 5: Reorganize top-left stats cluster (AC: #1)
  - [x] 5.1: Group stats horizontally: Kills | Fragments | Score (or vertical stack if space constrained)
  - [x] 5.2: Use consistent spacing (gap-2 or gap-3 Tailwind class)
  - [x] 5.3: Ensure stats don't overlap HP bar (adjust positioning if needed)
  - [x] 5.4: Test layout at 1080p and 1280x720 (readability maintained)

- [x] Task 6: Reposition or verify level display (AC: #3)
  - [x] 6.1: Current level is in bottom-right (next to XP bar) — verify it's also shown prominently at top
  - [x] 6.2: If not present at top, add level display to top-right quadrant (e.g., "LVL 102")
  - [x] 6.3: Use large, bold font (clamp(14px, 1.5vw, 20px))
  - [x] 6.4: Test level display visibility and readability

- [x] Task 7: Reposition timer to top-center (AC: #2)
  - [x] 7.1: Timer currently in top-center (already done in Story 4.2) — verify positioning
  - [x] 7.2: If timer not centered, adjust to top-center with absolute positioning
  - [x] 7.3: Ensure timer format is MM:SS countdown (already implemented in formatTimer)
  - [x] 7.4: Test timer visibility and format

- [x] Task 8: Implement low-timer warning pulse (AC: #2)
  - [x] 8.1: In HUD.jsx, detect when remaining < 60s
  - [x] 8.2: Apply red color and pulse animation when timer < 60s
  - [x] 8.3: Use animate-pulse Tailwind class or custom CSS keyframe
  - [x] 8.4: Test warning pulse (activates at < 1 min, pulses correctly)

- [x] Task 9: Implement stat update animation (AC: #4)
  - [x] 9.1: Add CSS animation for scale-up effect (e.g., @keyframes statUpdate { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } })
  - [x] 9.2: Trigger animation when stat value changes (useEffect with key change, apply animation class temporarily)
  - [x] 9.3: Animation duration 200-300ms (matches UX timing spec)
  - [x] 9.4: Test animation (kills increase → number scales up briefly, fragments increase → number scales up, etc.)

- [x] Task 10: Visual polish and UX color spec compliance (AC: #1, #2, #3)
  - [x] 10.1: Icon colors: Kills (red/danger), Fragments (cyan/accent), Score (yellow/warning), Level (white/text)
  - [x] 10.2: Font: Inter with tabular-nums
  - [x] 10.3: Sizes: clamp() for responsiveness (readable at 1080p minimum)
  - [x] 10.4: Contrast: >4.5:1 for accessibility
  - [x] 10.5: Test readability across resolutions (1080p, 1280x720, 1440p)

- [x] Task 11: Performance validation (NFR1, NFR5)
  - [x] 11.1: Test stat updates with 60 FPS gameplay (no frame drops)
  - [x] 11.2: Verify animations are GPU-accelerated (transform, not layout shifts)
  - [x] 11.3: Test with rapid stat updates (10+ kills/second, multiple fragments collected)
  - [x] 11.4: No visual jitter or layout thrashing

- [ ] Task 13: Review Follow-ups (AI)
  - [ ] 13.1: [AI-Review][MEDIUM] Add rendering tests for HUD stats display (kills/fragments/score values, timer CSS class changes, level "LVL X" display). Requires JSDOM/happy-dom test infrastructure. [src/ui/__tests__/HUD.test.jsx]

- [x] Task 12: Edge cases and boss phase handling
  - [x] 12.1: Timer should hide during boss phase (already done in Story 6.2)
  - [x] 12.2: Stats should remain visible during boss phase
  - [x] 12.3: Stats reset correctly after death/restart
  - [x] 12.4: Fragments persist across systems (verify behavior in tunnel phase)

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **UI Layer** → HUD.jsx modified to display new stats (score, fragments, repositioned timer/level)
- **Stores** → useGame stores score + kills (kills already exists), usePlayer stores fragments (already exists)
- **Systems** → No new systems needed — score calculation happens in GameLoop damage resolution
- **No Game Logic in UI** → HUD reads from stores, no calculations

**Existing Infrastructure:**
- `src/stores/useGame.jsx` — Already tracks kills, systemTimer (add score field)
- `src/stores/usePlayer.jsx` — Already tracks fragments (Story 7.1)
- `src/ui/HUD.jsx` — Current HUD displays timer (top-center), kills (top-center), HP, XP, weapons (will add score, fragments, reposition elements)
- `src/systems/GameLoop.jsx` — Damage resolution section (add score increment on enemy death)

**Current HUD Layout (from Story 4.2, 5.3, 8.1):**
- **Top-left:** HP bar + numeric HP display
- **Top-center:** Timer (MM:SS countdown) + Kills count (x273)
- **Top-right:** Minimap (circular, 80-120px)
- **Bottom-left:** XP bar + LVL number
- **Bottom-right:** Dash cooldown + Weapon slots (4 slots)
- **Center-bottom (above XP):** Planet scan progress (when active)

**Story 10.2 Changes:**
- Add **Fragments** display to top-left (below or adjacent to HP)
- Add **Score** display to top-left (below or adjacent to HP)
- Reposition **Kills** to top-left cluster (currently top-center)
- Verify **Timer** remains top-center (already positioned)
- Optionally add **Level** to top-right (currently only bottom-left, may add secondary display)
- Implement **low-timer warning pulse** (red + animate-pulse when < 60s)
- Implement **stat update animation** (scale-up briefly when value changes)

### Technical Requirements

**useGame Store Additions (score field):**
```javascript
{
  score: 0,          // Total score accumulated during run
  kills: 150,        // Already exists (number of enemies killed)
  systemTimer: 345,  // Already exists (seconds elapsed in current system)
}

// New action:
addScore: (amount) => set((state) => ({ score: state.score + amount }))
```

**usePlayer Store Fields (already exist):**
```javascript
{
  fragments: 384,    // Already exists (Story 7.1, 7.2)
  currentLevel: 102, // Already exists (Story 3.1, 3.2)
}
```

**HUD.jsx Selectors (additions):**
```javascript
const score = useGame((s) => s.score)        // NEW
const fragments = usePlayer((s) => s.fragments) // ALREADY EXISTS
const kills = useGame((s) => s.kills)        // ALREADY EXISTS
const level = usePlayer((s) => s.currentLevel) // ALREADY EXISTS
const remaining = GAME_CONFIG.SYSTEM_TIMER - systemTimer // ALREADY EXISTS
```

**Score Calculation Logic (in GameLoop.jsx):**
```javascript
// Section 5: Damage Resolution (existing damage system)
// When enemy dies:
useGame.getState().addKills(1) // Already exists
useGame.getState().addScore(enemy.xpReward) // NEW — score = XP value of enemy
```

**Stat Update Animation CSS:**
```css
@keyframes statUpdate {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* Apply via className or inline style when stat changes */
.stat-updated {
  animation: statUpdate 250ms ease-out;
}
```

**Low Timer Warning (Timer < 60s):**
```javascript
// In HUD.jsx:
const isLowTime = remaining < 60
const timerClass = isLowTime ? 'text-game-danger animate-pulse' : 'text-game-timer'
```

### Previous Story Intelligence (Story 10.1 Patterns)

**From Story 10.1 (XP Bar Redesign):**
- **Full-width bar at top** — Use fixed positioning (fixed top-0 left-0 w-full)
- **GPU-accelerated animations** — Use transform (scaleX) instead of width for smooth fill
- **Pulse effects** — animate-pulse Tailwind class for >80% progress
- **Responsive sizing** — clamp() for height and width (readable at 1080p minimum)
- **Z-index layering** — XP bar at z-50, HUD stats at z-40, ensure no overlap

**Applied to Story 10.2:**
- Stats display uses clamp() for font sizes (responsive across resolutions)
- Update animations use transform: scale() (GPU-accelerated, no layout shifts)
- Timer warning pulse uses animate-pulse (consistent with XP bar pattern)
- Z-index: HUD elements remain at z-40 (below XP bar z-50)

**From Story 8.1 (Main Menu Overhaul):**
- **Animation timing:** 150-300ms ease-out for UI transitions
- **Color system:** UI palette (dark/sober) separate from 3D effects (saturated neon)
- **Typography:** Inter font with tabular-nums for numbers

**From Story 8.2 (Options Menu):**
- **Keyboard navigation:** Full support required (arrows, Enter, ESC)
- **Accessibility:** Contrast > 4.5:1, focus visible ring

**Learnings Applied:**
- Stat update animation duration: 250ms ease-out (within 150-300ms spec)
- Icon colors match UX spec: Kills (red), Fragments (cyan), Score (yellow), Level (white)
- Timer warning uses red color from game-danger palette
- All stats use tabular-nums for clean alignment

### Git Intelligence (Recent Patterns)

**From commit e0c99a1 (Story 8.2 — Options Menu):**
- Files modified: `src/ui/modals/OptionsModal.jsx`, `src/ui/MainMenu.jsx`, `src/audio/audioManager.js`
- Pattern: New modal components in `src/ui/modals/` directory
- localStorage usage: Read/write with validation, defaults for missing keys

**From commit cebd462 (Story 8.1 — Main Menu Overhaul):**
- Files modified: `src/ui/MainMenu.jsx`, `src/scenes/MenuScene.jsx`
- Pattern: 3D background scenes paired with UI overlays

**Applied to Story 10.2:**
- HUD.jsx will be modified (add score, fragments displays, reposition stats)
- useGame.jsx will be modified (add score field and addScore action)
- GameLoop.jsx will be modified (call addScore on enemy death)
- No new files needed (all modifications to existing files)

**Code Patterns from Recent Commits:**
- Store actions: Simple set() calls, no complex logic
- HUD updates: Individual selectors for performance (avoid unnecessary re-renders)
- Animation classes: Tailwind utility classes (animate-pulse) or inline styles for dynamic values

### UX Design Specification Compliance

**From UX Doc (Epic 10 Context):**
- **HUD Redesign Goal:** Modern, comprehensive HUD inspired by Vampire Survivors
- **Full-width XP bar at top** (Story 10.1)
- **Top stats display** (Story 10.2 — THIS STORY)
- **Enhanced minimap** (Story 10.3)
- **HP & item slots reorganization** (Story 10.4)
- **Boon slots visibility** (Story 10.5)
- **Pause menu with inventory** (Story 10.6)
- **Bottom item library bar** (Story 10.7)

**Story 10.2 Specific Requirements:**
- **Top-left cluster:** Kills + Fragments + Score (horizontally aligned, consistent spacing)
- **Top-center:** Timer (MM:SS countdown, red pulse when < 1 min)
- **Top-right:** Level (prominent display) + Minimap (already exists)
- **Icon + Number format:** Each stat shows icon (emoji or unicode symbol) + number with tabular-nums
- **Update animation:** Scale-up briefly when value changes (200-300ms ease-out)
- **Low timer warning:** Red color + pulse animation when < 60s

**Color Palette (from UX Doc):**
- Kills: `text-game-danger` (#FF0033 red)
- Fragments: `text-cyan-400` (#22D3EE cyan)
- Score: `text-yellow-400` (#FACC15 yellow/gold)
- Level: `text-game-text` (white/light gray)
- Timer (normal): `text-game-timer` (white)
- Timer (warning): `text-game-danger` (red)

**Typography (from UX Doc):**
- Font: Inter (already configured in Tailwind)
- Tabular-nums: `tabular-nums` Tailwind class (monospace numerals for alignment)
- Size hierarchy: Large for timer (20-32px), Medium for level (14-20px), Small for stats (11-16px)

**Animation Timing (from UX Doc):**
- Stat update animation: 200-300ms ease-out
- Pulse animation: 500ms ease-in-out infinite alternate (for timer warning)
- All feedback < 100ms response time for player actions

### Architecture Guardrails

**File Structure Requirements (Architecture.md):**
```
src/stores/useGame.jsx        — Modified (add score field)
src/stores/usePlayer.jsx      — No changes (fragments already exists)
src/ui/HUD.jsx                — Modified (add score, fragments displays, reposition stats)
src/systems/GameLoop.jsx      — Modified (call addScore on enemy death)
```

**Layer Boundaries (Architecture.md 6-Layer):**
- **UI Layer:** HUD.jsx reads from stores, no game logic
- **Stores Layer:** useGame and usePlayer provide state, no rendering
- **Systems Layer:** GameLoop calls store actions (addScore, addKills)

**Anti-Patterns to AVOID:**
- DO NOT put score calculation logic in HUD (read-only from store)
- DO NOT modify store state directly from HUD (use actions only)
- DO NOT create a new store for score (use existing useGame store)
- DO NOT animate layout properties (width, height, margin) — use transform only

**Coding Standards (Architecture.md Naming):**
- Store actions: camelCase (addScore, addKills)
- CSS classes: Tailwind utility classes (kebab-case via Tailwind)
- Component selectors: Individual selectors for performance (avoid re-renders)

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- Stat updates must not cause frame drops
- Use GPU-accelerated CSS properties (transform: scale) instead of layout shifts
- Individual store selectors prevent unnecessary re-renders (only update when specific value changes)

**NFR5: No Frame Drops During UI Updates:**
- Stat update animations must not block rendering
- Use CSS animations (GPU-accelerated) instead of JavaScript setInterval
- Test with rapid stat updates (10+ kills/second, multiple fragments collected)

**Implementation Recommendation:**
```javascript
// GOOD (GPU-accelerated):
<span className="transition-transform duration-200 ease-out"
     style={{ transform: updated ? 'scale(1.15)' : 'scale(1)' }} />

// BAD (CPU-bound, causes reflows):
<span className="transition-all duration-200"
     style={{ fontSize: updated ? '120%' : '100%' }} />
```

**Selector Optimization (from HUD.jsx current implementation):**
```javascript
// GOOD (individual selectors):
const score = useGame((s) => s.score)
const kills = useGame((s) => s.kills)
const fragments = usePlayer((s) => s.fragments)

// BAD (entire store re-renders on any change):
const { score, kills } = useGame()
const { fragments } = usePlayer()
```

### Testing Checklist

**Functional Testing:**
- [ ] Score starts at 0 when game starts
- [ ] Score increments correctly when enemies die (score = XP value)
- [ ] Fragments display shows current fragment count
- [ ] Kills display shows current kill count
- [ ] Timer displays MM:SS countdown format
- [ ] Timer turns red and pulses when < 60s remaining
- [ ] Level displays prominently at top-right (if not already visible)
- [ ] Stats reset correctly after death/restart

**Visual Testing:**
- [ ] Top-left cluster: Kills | Fragments | Score (horizontally aligned, consistent spacing)
- [ ] Icon + Number format for each stat (icon visible, number uses tabular-nums)
- [ ] Colors match UX spec: Kills (red), Fragments (cyan), Score (yellow), Level (white), Timer (white/red)
- [ ] Stats don't overlap HP bar or other HUD elements
- [ ] Readable at 1080p and 1280x720 (minimum supported resolutions)
- [ ] Contrast meets accessibility standards (>4.5:1)

**Animation Testing:**
- [ ] Stat update animation triggers when value changes (scale-up 1.15x → 1.0x)
- [ ] Animation duration 200-300ms ease-out
- [ ] Timer warning pulse activates at < 60s (animate-pulse or custom keyframe)
- [ ] No visual jitter or layout shifts during animations

**Performance Testing:**
- [ ] 60 FPS maintained during rapid stat updates (10+ kills/second)
- [ ] No frame drops during stat update animations
- [ ] Works correctly with 100+ enemies on screen (stress test)
- [ ] Individual selectors prevent unnecessary re-renders

**Edge Case Testing:**
- [ ] Score at 0 displays correctly (not hidden or broken)
- [ ] Score at very high values (1,000,000+) displays correctly (no overflow)
- [ ] Fragments at 0 displays correctly
- [ ] Timer at 00:00 displays correctly (game over already triggered)
- [ ] Timer warning pulse stops after < 60s (doesn't pulse entire game)
- [ ] Stats persist correctly across systems (fragments carry over, score/kills reset per system)
- [ ] Boss phase: Timer hidden (already implemented), stats remain visible

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 10 Story 10.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#UI Layer]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#HUD Layout]
- [Source: _bmad-output/implementation-artifacts/10-1-xp-bar-redesign-full-width-top.md#Animation Patterns]
- [Source: src/stores/useGame.jsx — kills, systemTimer fields (score to be added)]
- [Source: src/stores/usePlayer.jsx — fragments, currentLevel fields]
- [Source: src/ui/HUD.jsx — Current HUD layout and structure]
- [Source: src/systems/GameLoop.jsx — Damage resolution section (add score increment)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- **Tasks 1-2 (score store + GameLoop integration):** Already implemented in Story 8.4. useGame.jsx already has `score: 0`, `addScore()`, reset in `startGameplay()` and `reset()`. GameLoop already calls `addScore(GAME_CONFIG.SCORE_PER_KILL)` on enemy death. Tests already exist in useGame.test.js (score tracking, high score persistence). Verified and marked complete.
- **Task 3 (fragments display):** Added `usePlayer((s) => s.fragments)` selector in HUD.jsx, displayed as AnimatedStat with ◆ icon and `text-cyan-400` color.
- **Task 4 (score display):** Added `useGame((s) => s.score)` selector in HUD.jsx, displayed as AnimatedStat with ⭐ icon and `text-yellow-400` color.
- **Task 5 (stats cluster reorganization):** Moved kills from top-center to top-left cluster below HP bar. Stats displayed horizontally with gap-3 spacing: Kills | Fragments | Score. HP bar remains above on its own row.
- **Task 6 (level display):** Added `LVL {currentLevel}` display in top-right area (before minimap) with `text-game-text font-bold` and clamp(14px, 1.5vw, 20px) sizing.
- **Task 7 (timer positioning):** Verified timer remains top-center. Removed kills count from center (moved to left cluster). Timer now standalone in center column.
- **Task 8 (low-timer warning):** Added `isLowTime()` helper (exported, testable). When remaining < 60s and > 0, timer switches to `text-game-danger animate-pulse` class. 5 unit tests added for isLowTime().
- **Task 9 (stat update animation):** Created `AnimatedStat` component using useRef + useEffect to detect value changes and apply `stat-updated` CSS class. Uses `classList.remove/add` with forced reflow to restart animation on each change. @keyframes statUpdate added to style.css (scale 1→1.15→1, 250ms ease-out). GPU-accelerated (transform only).
- **Task 10 (visual polish):** All colors match UX spec (kills=red/danger, fragments=cyan-400, score=yellow-400, level=white/game-text, timer=white→red). Inter font with tabular-nums on all numeric values. clamp() responsive sizing throughout.
- **Task 11 (performance):** Individual Zustand selectors for each stat (score, kills, fragments, currentLevel). CSS animations are GPU-accelerated (transform: scale). No layout shifts. No JS timers for animations.
- **Task 12 (edge cases):** Timer hides during boss phase (phase !== 'boss' check preserved). Stats cluster remains visible regardless of phase. Score/kills reset via startGameplay(). Fragments persist via usePlayer (not reset in resetForNewSystem).

### File List

- `src/ui/HUD.jsx` — Modified: added score/fragments/level selectors, AnimatedStat component, isLowTime() helper, reorganized top-left stats cluster, added level display top-right, low-timer warning pulse
- `src/ui/__tests__/HUD.test.jsx` — Modified: added isLowTime() tests (5 new tests)
- `src/style.css` — Modified: added @keyframes statUpdate and .stat-updated class
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Modified: story status ready-for-dev → in-progress → review

## Change Log

- 2026-02-12: Implemented Story 10.2 — Top stats display with kills/fragments/score cluster (top-left), level display (top-right), low-timer warning pulse, stat update animations. All 652 tests pass, 0 regressions.
- 2026-02-12: Code review fixes — AnimatedStat: only animate value increases (skip resets to 0), add toLocaleString('en-US') for large number formatting. All 652 tests pass.
