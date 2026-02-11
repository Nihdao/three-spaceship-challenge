# Story 4.4: Victory Screen

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see a victory screen when I complete all systems,
So that I feel accomplished and my run feels complete.

## Acceptance Criteria

1. **Given** the player completes all available systems (boss defeated in final system) **When** the victory condition is met **Then** useGame transitions to "victory" phase

2. **Given** the victory screen displays **When** it renders **Then** it shows a congratulatory message **And** displays full run stats (total time, total kills, final level, weapons, boons) **And** provides options: [R] NEW RUN, [M] MENU **And** keyboard and mouse navigation work

3. **Given** the victory screen is displayed **When** the player presses R **Then** the game resets all stores and transitions to gameplay (< 3 seconds to be in-game)

4. **Given** the victory screen is displayed **When** the player presses M **Then** the game returns to the main menu

5. **Given** the stats display **When** stats are rendered **Then** they use StatLine components with label-value aligned layout and tabular-nums **And** keyboard shortcuts [R] and [M] are displayed alongside clickable buttons

## Tasks / Subtasks

- [x] Task 1: Create VictoryScreen component (AC: #2, #5)
  - [x] 1.1: Create `src/ui/VictoryScreen.jsx` — full-screen overlay (z-50) with celebratory layout
  - [x] 1.2: Display a congratulatory title message (e.g., "VICTORY" or "THE GALAXY IS YOURS") with large, bold, tracking-wide text — pick from a VICTORY_MESSAGES array for variety
  - [x] 1.3: Display full run stats using StatLine components: Time Survived, Enemies Killed, Level Reached, Weapons Equipped, Boons Equipped
  - [x] 1.4: Capture stats on mount via useRef + getState() (same pattern as GameOverScreen) — stats must survive store resets on retry
  - [x] 1.5: Add boons to stats display — read from `useBoons.getState().activeBoons` on mount, resolve names via `BOONS` from boonDefs.js

- [x] Task 2: Implement entrance animation sequence (AC: #2)
  - [x] 2.1: Use a staged animation similar to GameOverScreen but with a celebratory tone — no white flash, no fade-to-black
  - [x] 2.2: Stage 0 (mount): Black overlay (reuse gameOver's full-black background or a dark overlay at 90% opacity)
  - [x] 2.3: Stage 1 (300ms): Victory title fades in with scale animation
  - [x] 2.4: Stage 2 (600ms): Stats slide up
  - [x] 2.5: Stage 3 (800ms): Action buttons fade in
  - [x] 2.6: All timing via single `stage` state variable (0-3) progressed by setTimeout chain with cleanup on unmount

- [x] Task 3: Implement action buttons — NEW RUN and MENU (AC: #3, #4)
  - [x] 3.1: Render two action buttons: "[R] NEW RUN" and "[M] MENU"
  - [x] 3.2: Style identically to GameOverScreen buttons (border-game-border, hover border-game-accent, scale-105)
  - [x] 3.3: NEW RUN calls `useGame.getState().startGameplay()` — GameLoop handles store resets on phase transition
  - [x] 3.4: MENU calls `useGame.getState().returnToMenu()`
  - [x] 3.5: Add fade-out transition before action executes (300ms, reuse GameOverScreen/MainMenu fade pattern with fadingRef guard)

- [x] Task 4: Implement keyboard handling (AC: #3, #4)
  - [x] 4.1: Add keydown event listener for 'KeyR' → trigger new run action
  - [x] 4.2: Add keydown event listener for 'KeyM' → trigger menu action
  - [x] 4.3: Only activate keyboard listeners once action buttons are visible (stage >= 3) to prevent accidental triggers during animation
  - [x] 4.4: Use fadingRef (useRef) as synchronous guard to prevent double-trigger (learned from GameOverScreen code review)
  - [x] 4.5: Cleanup event listener on unmount

- [x] Task 5: Wire VictoryScreen into Interface.jsx and Experience.jsx (AC: #1)
  - [x] 5.1: In `src/ui/Interface.jsx` — import VictoryScreen and render when `phase === 'victory'`
  - [x] 5.2: In `src/Experience.jsx` — the victory phase does NOT need GameplayScene mounted (unlike gameOver, there's no visual continuity need; the 3D scene is behind a full overlay). If using a black/dark overlay, no scene needed. However, if desired, MenuScene could be shown as ambient background — for simplicity, no 3D scene for victory.
  - [x] 5.3: Verify `useGame.triggerVictory()` already exists and sets `phase: 'victory', isPaused: true`

- [x] Task 6: Add temporary victory trigger for testing (AC: #1)
  - [x] 6.1: Since the actual victory condition (boss defeated in final system) is Tier 2, add a temporary debug trigger: when debug mode is active, pressing a specific key (e.g., 'KeyV') in gameplay phase calls `useGame.getState().triggerVictory()` — this allows testing the victory screen without Tier 2 boss/system completion
  - [x] 6.2: Document this as a temporary debug-only feature to be replaced by the real victory condition in Epic 6

- [x] Task 7: Verification (AC: #1-#5)
  - [x] 7.1: Trigger victory (via debug key) — verify full animation sequence plays: dark overlay → title → stats → buttons
  - [x] 7.2: Verify stats show correct values (time, kills, level, weapons, boons)
  - [x] 7.3: Press R — verify game restarts, stores reset, gameplay begins < 3 sec
  - [x] 7.4: Press M — verify return to main menu
  - [x] 7.5: Click NEW RUN/MENU buttons — verify same behavior as keyboard
  - [x] 7.6: Verify responsive sizing at 1920x1080 and 1280x720
  - [x] 7.7: Run full test suite — no regressions

## Dev Notes

### Mockup References

**Mockup** (`4-4-HadesVictoryScreen.jpeg`) — Hades victory screen reference:
- Split layout: character/equipment detail on left, "VICTORY!" banner with ornate decoration on right
- Detailed stats panel: Clear Time, Best Time, Uses count, weapon-by-weapon breakdown with Clears/BestTime/Best columns
- Total Clears and Current Streak counters at bottom
- Rich, ornate visual style with dark background, golden/red accents
- **Key takeaway:** Victory screens are celebratory and detailed. The player deserves to see a comprehensive summary of their accomplishment. However, our Tier 1 implementation should be simpler — we don't have weapon-specific stats or multi-run tracking yet. Adopt the celebratory tone and comprehensive stats display, but keep the layout closer to our GameOverScreen pattern for consistency and scope.

**Design decisions for our implementation:**
- Celebratory tone — "VICTORY" or "THE GALAXY IS YOURS" as title (not a taunt)
- Show more stats than game over: add boons equipped
- Same visual pattern as GameOverScreen (dark overlay, centered layout, StatLine components) but with a positive/triumphant feel
- Reuse GameOverScreen's proven patterns (stats capture, keyboard handling, fade-out, fadingRef guard)
- Keep simple for Tier 1 — no ornate decorations, no multi-run tracking, no weapon-specific breakdowns

### Architecture Decisions

- **VictoryScreen is a UI overlay component** (Layer 6: UI). It lives in `src/ui/VictoryScreen.jsx`, renders as HTML over the Canvas. It reads from stores for stats display. It does NOT touch 3D objects or useFrame.

- **No 3D scene needed during victory** — Unlike gameOver (which keeps GameplayScene for visual continuity during the flash/fade), the victory screen appears after a clear transition point. A simple dark overlay is sufficient. Experience.jsx does NOT need modification for the victory phase (no 3D scene condition to add).

- **Stats captured on mount** — Same pattern as GameOverScreen. Since `startGameplay()` resets stores, we snapshot stat values (systemTimer, kills, currentLevel, activeWeapons, activeBoons) when VictoryScreen mounts.

- **Retry uses existing startGameplay()** — Same as GameOverScreen. `useGame.getState().startGameplay()` resets phase, timer, kills. GameLoop handles full system resets on phase transition.

- **triggerVictory() already exists** — `useGame.jsx` line 21: `triggerVictory: () => set({ phase: 'victory', isPaused: true })`. No store modifications needed.

- **z-index: z-50** — Same as GameOverScreen and MainMenu. These never render simultaneously (different phases).

- **Boons display** — GameOverScreen shows weapons but not boons. The victory screen adds boons to give a more complete run summary. Read from `useBoons.getState().activeBoons` on mount. Resolve boon names via `BOONS` from `boonDefs.js`.

### Existing Infrastructure Status

| Component | Status | Details |
|-----------|--------|---------|
| `useGame.triggerVictory()` | **Implemented** | Sets phase='victory', isPaused=true |
| `useGame.startGameplay()` | **Implemented** | Resets phase, timer, kills, starts gameplay |
| `useGame.returnToMenu()` | **Implemented** | Sets phase='menu' |
| `useGame.systemTimer` | **Implemented** | Time elapsed (counts up from 0) |
| `useGame.kills` | **Implemented** | Kill counter |
| `usePlayer.currentLevel` | **Implemented** | Player level |
| `useWeapons.activeWeapons` | **Implemented** | Array of {weaponId, level, cooldownTimer} |
| `useBoons.activeBoons` | **Implemented** | Array of active boon objects |
| `GameLoop` resets | **Implemented** | Resets all systems on gameplay transition |
| `Interface.jsx` | **Needs update** | Add victory phase → VictoryScreen routing |
| `Experience.jsx` | **No change needed** | Victory phase has no 3D scene requirement |
| `GameOverScreen.jsx` | **Reference** | Proven patterns to reuse (stats capture, staging, keyboard, fade) |
| `StatLine.jsx` | **Implemented** | Reusable label+value primitive |
| `formatTimer()` | **Implemented** | Exported from HUD.jsx |
| `WEAPONS` | **Implemented** | weaponDefs.js for weapon name lookup |
| `BOONS` | **Implemented** | boonDefs.js — `BOONS[boonId].name` for display, activeBoons is `[{ boonId, level }]` |
| `animate-fade-in` | **Implemented** | In style.css @theme, 150ms ease-out |
| `animate-slide-up` | **Implemented** | In style.css @theme, 200ms ease-out |
| Tailwind design tokens | **Configured** | All game-* tokens available |

### Key Implementation Details

**Component structure — nearly identical to GameOverScreen:**

The VictoryScreen is architecturally very similar to GameOverScreen. The main differences are:
1. Tone: celebratory title instead of taunt message
2. No white flash or ship fade sequence (simpler animation)
3. Additional stat: boons equipped
4. Button label: "[R] NEW RUN" instead of "[R] RETRY"

**Victory messages pool:**
```javascript
const VICTORY_MESSAGES = [
  'THE GALAXY IS YOURS',
  'SYSTEM CLEARED',
  'VICTORIOUS',
  'THE VOID BOWS TO YOU',
  'MISSION COMPLETE',
  'UNSTOPPABLE',
]
```

**Stats snapshot on mount (extended from GameOverScreen):**
```javascript
const statsRef = useRef(null)
if (!statsRef.current) {
  statsRef.current = {
    systemTimer: useGame.getState().systemTimer,
    kills: useGame.getState().kills,
    currentLevel: usePlayer.getState().currentLevel,
    activeWeapons: [...useWeapons.getState().activeWeapons],
    activeBoons: [...useBoons.getState().activeBoons],
  }
}
```

**Staged animation (simpler than GameOverScreen):**
```javascript
// stage: 0=dark, 1=titleVisible, 2=statsVisible, 3=actionsVisible
const [stage, setStage] = useState(0)

useEffect(() => {
  const timers = []
  timers.push(setTimeout(() => setStage(1), 300))   // Show title
  timers.push(setTimeout(() => setStage(2), 600))   // Show stats
  timers.push(setTimeout(() => setStage(3), 800))   // Show actions
  return () => timers.forEach(clearTimeout)
}, [])
```

**Keyboard handling + fadingRef guard (copy from GameOverScreen):**
```javascript
const [fading, setFading] = useState(false)
const fadingRef = useRef(false)

const handleNewRun = useCallback(() => {
  if (fadingRef.current) return
  fadingRef.current = true
  setFading(true)
  setTimeout(() => useGame.getState().startGameplay(), 300)
}, [])

const handleMenu = useCallback(() => {
  if (fadingRef.current) return
  fadingRef.current = true
  setFading(true)
  setTimeout(() => useGame.getState().returnToMenu(), 300)
}, [])

useEffect(() => {
  if (stage < 3) return
  const handler = (e) => {
    if (e.code === 'KeyR') handleNewRun()
    if (e.code === 'KeyM') handleMenu()
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [stage, handleNewRun, handleMenu])
```

**Boon display:**
```javascript
import { BOONS } from '../entities/boonDefs.js'

// activeBoons structure: [{ boonId: 'DAMAGE_AMP', level: 2 }, ...]
// BOONS structure: { DAMAGE_AMP: { id, name, maxLevel, effect, tiers } }
const boonNames = statsRef.current.activeBoons
  .map(b => {
    const def = BOONS[b.boonId]
    return def ? `${def.name} Lv${b.level}` : b.boonId
  })
  .join(', ')
```

**Debug victory trigger (temporary, Task 6):**
```javascript
// In GameLoop.jsx or a debug hook — only when debug mode active
// Press 'V' to trigger victory for testing
useEffect(() => {
  if (!isDebugMode) return
  const handler = (e) => {
    if (e.code === 'KeyV' && useGame.getState().phase === 'gameplay') {
      useGame.getState().triggerVictory()
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [isDebugMode])
```

### Previous Story Intelligence (4.3)

**Learnings from Story 4.3 to apply:**
- **GameOverScreen is the direct template** — VictoryScreen follows nearly identical architecture. Reuse stats capture pattern, staging pattern, keyboard handling pattern, fade-out pattern.
- **fadingRef guard is essential** — Code review on 4.3 found a race condition with `fading` useState closure being stale. Always use `fadingRef.current` (useRef) as synchronous guard in action handlers. This was fixed in 4.3 and must be applied from the start in 4.4.
- **Stats captured on mount via getState()** — Do NOT use reactive Zustand selectors for stats. Snapshot on mount so values survive store resets when user triggers retry/new run.
- **formatTimer() reuse** — Exported from HUD.jsx, takes `totalSeconds` (renamed in 4.3 review), returns "MM:SS" string.
- **z-index convention** — z-50 for full-screen overlays (MainMenu, GameOverScreen, VictoryScreen), z-[60] for fade transition overlay.
- **Tailwind animation utilities** — `animate-fade-in` and `animate-slide-up` already defined in style.css @theme. Reuse for title and stats animations.
- **Interface.jsx routing** — Phase-based rendering: `{phase === 'victory' && <VictoryScreen />}`.
- **pointer-events** — Use `pointer-events-none` on non-interactive overlays, `pointer-events-auto` on button container.
- **clamp() for responsive sizing** — All text should use `clamp()` for responsive font sizing (e.g., `fontSize: 'clamp(24px, 3vw, 48px)'`).
- **No audio/SFX** — Audio is Story 4.5. Do not add sound effects to victory screen.
- **No new CSS keyframes** — Reuse existing `animate-fade-in` and `animate-slide-up`.

### Git Intelligence

Recent commits:
- `eb45e9a` — feat: main menu, system timer, kill counter & phase management (Story 4.1)
- Epic 3 complete (progression, HP, death)
- Epic 2 complete (combat, enemies, hitbox tuning)

**Code conventions established:**
- UI components: JSX with Tailwind classes, no CSS modules
- Store interactions: `useStore.getState().action()` for imperative calls from event handlers
- Animations: CSS-based via Tailwind animation utilities or inline transition styles
- Keyboard handling: `window.addEventListener('keydown', handler)` in useEffect with cleanup
- File naming: PascalCase for components in `src/ui/`
- Test pattern: Logic-only tests (no @testing-library/react render tests)

### Project Structure Notes

**Files to CREATE:**
- `src/ui/VictoryScreen.jsx` — Victory screen overlay component

**Files to MODIFY:**
- `src/ui/Interface.jsx` — Add VictoryScreen import and victory phase routing

**Files NOT to modify:**
- `src/stores/useGame.jsx` — triggerVictory, startGameplay, returnToMenu all exist
- `src/stores/usePlayer.jsx` — currentLevel already available
- `src/stores/useWeapons.jsx` — activeWeapons already available
- `src/stores/useBoons.jsx` — activeBoons already available
- `src/Experience.jsx` — No 3D scene needed for victory phase (no condition to add)
- `src/GameLoop.jsx` — Already handles resets on gameplay transition
- `src/style.css` — animate-fade-in and animate-slide-up already defined
- `src/ui/HUD.jsx` — Only importing formatTimer from it
- `src/ui/GameOverScreen.jsx` — Reference only, no modifications
- `src/ui/primitives/StatLine.jsx` — Already exists, reuse as-is

### Anti-Patterns to Avoid

- Do NOT add audio/SFX to victory screen — that's Story 4.5
- Do NOT add visual effects (particles, screen shake) — keep Tier 1 simple
- Do NOT create a separate store for victory state — use local component state for sequence staging
- Do NOT put game logic in VictoryScreen — only read stats from stores, dispatch phase transitions
- Do NOT use `useFrame` in VictoryScreen — it's a UI component (Layer 6)
- Do NOT create new CSS keyframes if existing ones suffice — animate-fade-in and animate-slide-up already exist
- Do NOT modify useGame to add victory-specific state — the animation sequence is purely local UI state
- Do NOT use reactive Zustand selectors for stats — snapshot on mount via getState()
- Do NOT implement multi-run tracking, leaderboards, or weapon-specific breakdowns — those are Hades-level features outside Tier 1 scope
- Do NOT add a 3D scene for victory — keep it UI-only for simplicity
- Do NOT forget the fadingRef guard — learned from 4.3 code review (race condition fix)

### Testing Approach

- **Unit tests (VictoryScreen logic):** Victory message selection is from pool, stats snapshot captures correct values including boons, formatTimer reuse produces correct output
- **Integration:** Browser verification — full animation sequence timing, keyboard R/M triggers, click triggers, stats correctness (including boons), responsive at 1080p/720p, debug key 'V' triggers victory, no regressions on other phases

### Scope Summary

This story adds the victory screen — a celebratory overlay that displays when the player wins (all systems cleared). For Tier 1, the actual victory condition (boss defeat) doesn't exist yet, so a debug trigger is added for testing. The screen reuses proven patterns from GameOverScreen (stats capture, staged animation, keyboard handling, fade transitions) but with a positive/triumphant tone. A StatLine-based stats display shows the complete run summary including boons.

**Key deliverables:**
1. `VictoryScreen.jsx` — celebratory overlay with staged animation: dark → title → stats → actions
2. Interface.jsx update — route VictoryScreen for victory phase
3. Stats display: time, kills, level, weapons, boons (more complete than GameOverScreen)
4. Keyboard handling: [R] new run, [M] menu, with fadingRef guard and fade-out transitions
5. Debug trigger: 'V' key in gameplay (debug mode only) to test victory screen

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4] — Acceptance criteria and story definition
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — Layer 6 UI, component boundaries
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — getState() for imperative calls, stores never import other stores
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Game Over Screen] — Reference for similar screen pattern (cinematic sequence, stats, actions)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — UI palette tokens
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography System] — Inter font, tabular-nums, size hierarchy
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#State Transition Patterns] — Animation timing conventions
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Animation Timing Patterns] — ease-out default, fade 150-300ms, slide 200ms
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — StatLine primitive spec, composite components
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Flow Optimization Principles] — Recovery Fast: < 3 seconds to gameplay
- [Source: _bmad-output/planning-artifacts/mockups/4-4-HadesVictoryScreen.jpeg] — Hades victory screen (celebratory, detailed stats, "VICTORY!" banner)
- [Source: _bmad-output/implementation-artifacts/4-3-game-over-cinematic-screen.md] — Previous story: GameOverScreen patterns, fadingRef guard, stats capture, formatting
- [Source: src/stores/useGame.jsx] — triggerVictory (line 21), startGameplay, returnToMenu, systemTimer, kills
- [Source: src/stores/usePlayer.jsx] — currentLevel
- [Source: src/stores/useWeapons.jsx] — activeWeapons array
- [Source: src/stores/useBoons.jsx] — activeBoons array
- [Source: src/entities/weaponDefs.js] — WEAPONS definitions for weapon name lookup
- [Source: src/entities/boonDefs.js] — BOONS definitions for boon name lookup
- [Source: src/ui/Interface.jsx] — UI routing pattern (phase-based rendering)
- [Source: src/ui/GameOverScreen.jsx] — Template component to mirror (stats capture, staging, keyboard, fade)
- [Source: src/ui/HUD.jsx] — formatTimer export
- [Source: src/ui/primitives/StatLine.jsx] — Reusable stat display primitive
- [Source: src/Experience.jsx] — Scene routing (no change needed for victory)
- [Source: src/style.css] — Tailwind @theme tokens, animate-fade-in, animate-slide-up keyframes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blocking issues.

### Completion Notes List

- Created VictoryScreen.jsx following GameOverScreen patterns: stats snapshot on mount via useRef+getState(), staged animation (0→dark, 1→title, 2→stats, 3→actions), fadingRef guard for double-trigger prevention, fade-out transition on actions.
- Added boon name resolution using BOONS from boonDefs.js — displays "Name LvX" format with fallback to raw boonId.
- VICTORY_MESSAGES pool with 6 celebratory messages, randomly selected on mount.
- Wired VictoryScreen into Interface.jsx with phase-based routing (`phase === 'victory'`).
- Added debug trigger in Interface.jsx: press 'V' during gameplay in #debug mode to test victory screen (temporary, replaced by real condition in Epic 6).
- Experience.jsx NOT modified — victory phase has no 3D scene requirement (confirmed per story spec).
- All 9 new tests pass (message pool validation, formatTimer reuse, boon name resolution with edge cases).
- Full test suite: 308 tests pass, 0 regressions across 22 test files.

### File List

- `src/ui/VictoryScreen.jsx` — **Created** — Victory screen overlay component with staged animation, stats display, keyboard/mouse actions
- `src/ui/Interface.jsx` — **Modified** — Added VictoryScreen import, victory phase routing, debug 'V' key trigger
- `src/ui/__tests__/VictoryScreen.test.jsx` — **Created** — Unit tests for victory messages, formatTimer reuse, boon name resolution

### Change Log

- 2026-02-09: Story 4.4 Victory Screen — Created celebratory victory overlay with staged animation sequence, full run stats (time, kills, level, weapons, boons), keyboard/click actions ([R] NEW RUN, [M] MENU), and temporary debug trigger for testing.
- 2026-02-09: Code Review Fixes — Extracted `resolveWeaponNames` and `resolveBoonNames` as testable named exports (H1/H2). Rewrote tests to import real functions instead of duplicating logic inline; added 3 new `resolveWeaponNames` tests (12 total). Optimized debug trigger useEffect in Interface.jsx to only register listener during gameplay phase (M1). 311 tests pass, 0 regressions.
