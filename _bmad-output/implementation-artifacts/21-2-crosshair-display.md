# Story 21.2: Crosshair Display

Status: done

## Change Log

- **2026-02-15 (Code Review Fixes):** Fixed architecture violations found in review. Extracted crosshair visual constants (size, color, glow) to gameConfig.js for configurability. Updated ACs to reflect neon purple color choice (user request). Documented global cursor hiding implementation. Added missing files (gameConfig.js, useGame.jsx, usePlayer.jsx) to File List with notes about unrelated changes from previous stories. Story status: done.
- **2026-02-15 (Visual Polish):** Enhanced crosshair visibility per user feedback. Changed color from white to neon purple (#d8a7ff) with glow effect for better visibility. Increased crosshair size to 20px. Added global cursor hiding on body element to ensure cursor disappears over all HTML overlays during gameplay. Tests still passing (1638/1638).
- **2026-02-15:** Implemented crosshair display system. All 5 tasks complete (16 subtasks). Created Crosshair component with CSS-based visual, added mouseScreenPos tracking to useControlsStore, implemented phase-based visibility, and dynamic cursor hiding. Created 7 new tests. Full test suite passing (1638/1638 tests). Ready for code review.

## Story

As a player,
I want to see a subtle crosshair on screen showing where I'm aiming,
So that I have clear visual feedback about my aim direction.

## Acceptance Criteria

**Given** the crosshair element
**When** displayed
**Then** a small, subtle crosshair follows the mouse cursor position on screen
**And** the crosshair is visually distinct but not distracting (thin lines, small dot, or subtle reticle)
**And** the crosshair uses a neon purple color (#d8a7ff) with glow effect for optimal visibility against the dark space background

**Given** the crosshair design
**When** implemented
**Then** the default cursor is hidden during gameplay (both on Canvas and globally on body element)
**And** the crosshair is rendered as an HTML overlay element (not a 3D object)
**And** the crosshair position updates on mouse movement to track cursor position smoothly

**Given** the crosshair during non-gameplay phases
**When** the game is paused, in menu, or in level-up selection
**Then** the crosshair is hidden and the default cursor returns

**Given** future gamepad support
**When** a gamepad is connected (future epic)
**Then** the crosshair position would be computed from right stick direction at a fixed radius from the ship
**And** the crosshair system is designed to accept position from either mouse or gamepad

## Tasks / Subtasks

- [x] Task 1: Create Crosshair component (AC: All)
  - [x] Subtask 1.1: Create src/ui/Crosshair.jsx component
  - [x] Subtask 1.2: Render HTML div overlay with SVG or CSS crosshair visual
  - [x] Subtask 1.3: Use neon purple color (#d8a7ff) with 95% opacity and glow effect (user feedback: better visibility than white/cyan)
  - [x] Subtask 1.4: Center crosshair on cursor position using CSS transform

- [x] Task 2: Integrate mouse position tracking from Story 21.1 (AC: 2)
  - [x] Subtask 2.1: Read mouse screen position from useControlsStore (mouseScreenPos from Story 21.1)
  - [x] Subtask 2.2: Apply position to crosshair div using CSS left/top transform
  - [x] Subtask 2.3: Ensure smooth 60fps updates (React subscription to store)

- [x] Task 3: Hide default cursor during gameplay (AC: 2)
  - [x] Subtask 3.1: Add `cursor: none` CSS rule to Canvas element during gameplay phase
  - [x] Subtask 3.2: Add global cursor hiding on body element for complete coverage over HTML overlays
  - [x] Subtask 3.3: Restore default cursor when phase is not 'gameplay' or 'boss'

- [x] Task 4: Show/hide crosshair based on game phase (AC: 3)
  - [x] Subtask 4.1: Subscribe to useGame phase
  - [x] Subtask 4.2: Render crosshair only when phase === 'gameplay' or phase === 'boss'
  - [x] Subtask 4.3: Hide when phase === 'levelUp', 'pause', 'menu', 'planetReward'

- [x] Task 5: Design for future gamepad support (AC: 4)
  - [x] Subtask 5.1: Structure component to accept position from either mouse or gamepad
  - [x] Subtask 5.2: Add comment placeholder for gamepad right-stick input (future Epic)
  - [x] Subtask 5.3: No implementation needed for gamepad now, just architecture prep

## Dev Notes

### Architectural Context

**Current State (Post Story 21.1):**
- Story 21.1 implemented dual-stick controls: movement (WASD) separated from aiming (mouse cursor)
- useControlsStore extended with `mouseScreenPos: [x, y]` field storing cursor screen coordinates
- Ship rotation now follows mouse cursor direction instead of movement direction
- Weapons fire toward mouse aim direction

**Target State (Story 21.2):**
- Visual crosshair overlay element follows cursor position
- Default OS cursor hidden during gameplay
- Crosshair hidden during UI-heavy phases (menu, level-up, pause)
- Architecture prepared for future gamepad right-stick input

**Dependency Chain:**
Story 21.1 (dual-stick controls) → **Story 21.2 (crosshair display)** → Story 21.3 (ship inertia)

Story 21.1 provides the mouse position tracking in useControlsStore. Story 21.2 uses that position to render a visual crosshair. Story 21.3 is independent (inertia physics) but enhances the dual-stick feel.

### Implementation Strategy

**Phase 1: Create Crosshair Component (Subtask 1.1-1.4)**

Create `src/ui/Crosshair.jsx` as a simple React component:

```jsx
import { useControlsStore } from '../stores/useControlsStore.jsx'
import { useGame } from '../stores/useGame.jsx'

export default function Crosshair() {
  const phase = useGame(s => s.phase)
  const mouseScreenPos = useControlsStore(s => s.mouseScreenPos)

  // Only show during gameplay phases
  if (phase !== 'gameplay' && phase !== 'boss') return null

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${mouseScreenPos[0]}px`,
        top: `${mouseScreenPos[1]}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Crosshair visual */}
    </div>
  )
}
```

**Crosshair Visual Design Options:**

Option A: CSS-based simple crosshair (recommended for simplicity)
```jsx
<div style={{
  width: '16px', height: '16px',
  position: 'relative',
}}>
  {/* Horizontal line */}
  <div style={{
    position: 'absolute',
    width: '16px', height: '1px',
    top: '50%', left: '0',
    backgroundColor: '#ffffff',
    opacity: 0.7,
  }} />
  {/* Vertical line */}
  <div style={{
    position: 'absolute',
    width: '1px', height: '16px',
    top: '0', left: '50%',
    backgroundColor: '#ffffff',
    opacity: 0.7,
  }} />
  {/* Center dot */}
  <div style={{
    position: 'absolute',
    width: '2px', height: '2px',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    opacity: 0.9,
  }} />
</div>
```

Option B: SVG crosshair (more control, slightly complex)
```jsx
<svg width="20" height="20" viewBox="0 0 20 20">
  <circle cx="10" cy="10" r="8" fill="none" stroke="#00ffcc" strokeWidth="1" opacity="0.6" />
  <line x1="10" y1="2" x2="10" y2="6" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
  <line x1="10" y1="14" x2="10" y2="18" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
  <line x1="2" y1="10" x2="6" y2="10" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
  <line x1="14" y1="10" x2="18" y2="10" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
  <circle cx="10" cy="10" r="1.5" fill="#ffffff" opacity="0.9" />
</svg>
```

**Recommendation:** Start with Option A (CSS) for simplicity. Can upgrade to SVG later if needed.

**Phase 2: Mouse Position Integration (Subtask 2.1-2.3)**

Assumptions (based on Story 21.1 context):
- useControlsStore already has `mouseScreenPos: [x, y]` from Story 21.1
- Position updates via `onPointerMove` event listener on canvas
- If mouseScreenPos is null/undefined, crosshair should default to screen center

Fallback if Story 21.1 didn't implement mouseScreenPos:
- Add `mouseScreenPos: [window.innerWidth / 2, window.innerHeight / 2]` to useControlsStore
- Add `setMouseScreenPos: (x, y) => set({ mouseScreenPos: [x, y] })` action
- Add event listener in Experience.jsx or useHybridControls hook

**Phase 3: Hide OS Cursor (Subtask 3.1-3.2)**

Modify Experience.jsx (or Interface.jsx) to conditionally apply `cursor: none` to the canvas:

```jsx
// In Experience.jsx or wherever Canvas is rendered
const phase = useGame(s => s.phase)
const cursorStyle = (phase === 'gameplay' || phase === 'boss') ? 'none' : 'default'

return (
  <Canvas style={{ cursor: cursorStyle }} ... >
    ...
  </Canvas>
)
```

**Phase 4: Phase-Based Visibility (Subtask 4.1-4.3)**

Crosshair visibility logic (already in component above):
- Show: `phase === 'gameplay'` or `phase === 'boss'`
- Hide: `phase === 'menu'`, `'levelUp'`, `'pause'`, `'planetReward'`, `'gameOver'`, `'victory'`, `'tunnel'`

This ensures crosshair only appears when player is actively aiming and firing.

**Phase 5: Gamepad Preparation (Subtask 5.1-5.3)**

No implementation needed now, but architecture should support:
- `mouseScreenPos` could be replaced with `aimScreenPos` (generic name)
- Future: When gamepad connected, compute `aimScreenPos` from right stick direction + fixed radius
- Comment in code:

```jsx
// Future gamepad support:
// If gamepad connected, compute aimScreenPos from:
//   - Ship screen position (project world position to screen)
//   - Right stick direction (angle)
//   - Fixed radius from ship center (e.g., 80px)
// For now, aimScreenPos = mouseScreenPos from mouse input
```

### Testing Requirements

**Visual Testing:**
- Crosshair appears on screen during gameplay
- Crosshair follows cursor smoothly (60fps, no lag)
- Crosshair is visible against dark space background (white/cyan stands out)
- Crosshair is subtle (not distracting, semi-transparent)
- Default OS cursor is hidden during gameplay
- Default OS cursor returns when paused/menu

**Phase Testing:**
- gameplay phase: crosshair visible, cursor hidden
- boss phase: crosshair visible, cursor hidden
- menu phase: crosshair hidden, cursor visible
- levelUp phase: crosshair hidden, cursor visible (user clicking choices)
- pause phase: crosshair hidden, cursor visible

**Edge Cases:**
- Cursor at screen edges → crosshair not clipped or hidden
- Rapid cursor movement → crosshair keeps up (no lag)
- Window resize → crosshair position recalculates correctly

### File Structure Requirements

**Files to Create:**
1. `src/ui/Crosshair.jsx` — New component for crosshair overlay

**Files to Modify:**
1. `src/ui/Interface.jsx` — Import and render `<Crosshair />` component
2. `src/Experience.jsx` — Add `cursor: none` CSS when phase is gameplay/boss
3. `src/stores/useControlsStore.jsx` — *(only if Story 21.1 didn't add mouseScreenPos)* Add mouseScreenPos field

**Files NOT to Modify:**
- HUD.jsx — Crosshair is separate from HUD (different z-index, different purpose)
- GameLoop.jsx — No game logic needed, purely visual
- All stores except useControlsStore — Crosshair reads existing state only

### Project Structure Notes

**Alignment with 6-Layer Architecture:**
- **Layer 1 (Config/Data):** No gameConfig changes needed
- **Layer 2 (Systems):** No system logic needed
- **Layer 3 (Stores):** useControlsStore.mouseScreenPos already exists (from Story 21.1)
- **Layer 4 (GameLoop):** No GameLoop changes needed
- **Layer 5 (Rendering):** No 3D rendering, HTML only
- **Layer 6 (UI):** New Crosshair.jsx component, integrated in Interface.jsx

**UI Layer Pattern:**
- Crosshair.jsx is a presentation component (reads from stores, no state of its own)
- Uses fixed positioning with z-50 (above HUD z-40, below modals z-60+)
- Pointer-events: none (does not block mouse clicks)
- Follows existing HUD pattern: subscribe to store selectors, conditional rendering

**CSS Organization:**
- Inline styles for positioning (dynamic based on mouseScreenPos)
- Tailwind classes for static properties (fixed, pointer-events-none, z-50)
- Follows existing UI component pattern (see HUD.jsx, LevelUpModal.jsx)

### Known Risks & Mitigations

**Risk 1: Mouse position lag (visual delay between cursor and crosshair)**
- Cause: React re-render delay on store update
- Mitigation: Use direct DOM manipulation via ref if needed (update transform in useEffect)
- Benchmark: Test on mid-range hardware, should be imperceptible (<16ms)

**Risk 2: Crosshair visibility against bright visual effects**
- Cause: White explosions, bright projectiles, bloom effects
- Mitigation: Add subtle dark outline/shadow to crosshair for contrast
- Alternative: Use cyan (#00ffcc) instead of white for better differentiation

**Risk 3: Crosshair confusing with UI elements**
- Cause: Player might think crosshair is clickable UI
- Mitigation: Make crosshair visually distinct (thin lines, no solid fill)
- Ensure pointer-events: none to clarify it's not interactive

**Risk 4: Story 21.1 didn't implement mouseScreenPos in useControlsStore**
- Cause: Assumption about Story 21.1 implementation details
- Mitigation: Read useControlsStore first, add mouseScreenPos tracking if missing
- Fallback: Implement in Subtask 2.1 as part of this story (low effort)

### Visual Design Details

**Color Choice Rationale:**
- White (#ffffff, 70% opacity): High contrast against dark space (#050510)
- Cyan (#00ffcc, 70% opacity): Matches player ship lighting, HUD dash indicator
- Recommendation: White for crosshair (neutral, doesn't imply faction/team)

**Size & Proportions:**
- Outer dimension: 16-20px (not too large, not too small)
- Line thickness: 1px (thin, subtle)
- Center dot: 2px diameter (small reference point)
- Gap between center and lines: 2-3px (allows seeing through to target)

**Animation (Optional, Post-MVP):**
- Subtle pulse on weapon fire (0.3s scale 1.0 → 1.1 → 1.0)
- Color flash on hit confirmation (cyan → yellow → cyan)
- Expansion on enemy hover (future epic: target assist)

For Story 21.2, keep it static. Animations can be added in polish pass.

### References

**Epic Source:**
[Source: _bmad-output/planning-artifacts/epic-21-dual-stick-controls.md:73-101]

**Story 21.1 Context:**
[Source: _bmad-output/implementation-artifacts/21-1-dual-stick-controls-movement-aiming.md]

**Architecture:**
[Source: _bmad-output/planning-artifacts/architecture.md#Layer-6-UI]

**HUD Pattern Reference:**
[Source: src/ui/HUD.jsx:299-600 (component structure, phase-based visibility)]

**Existing UI Components for Pattern Reference:**
- src/ui/HUD.jsx — Fixed overlay, phase-based rendering, store subscriptions
- src/ui/SystemNameBanner.jsx — Phase-based visibility, CSS transforms
- src/ui/BossHPBar.jsx — Conditional rendering based on phase

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Implementation Plan

**Phase 1: Store Extension (Task 2)**
- Extended useControlsStore with mouseScreenPos field initialized to screen center
- Added setMouseScreenPos action to update screen coordinates
- Updated resetControls to reset mouseScreenPos to default center
- Implemented safe window detection for test environment compatibility

**Phase 2: Event Tracking (Task 2)**
- Modified useMouseWorldPosition hook to track screen position
- Added mouseScreenPos update in handlePointerMove event handler
- Screen coordinates update alongside existing NDC and world position tracking

**Phase 3: Crosshair Component (Task 1, 4)**
- Created src/ui/Crosshair.jsx as functional React component
- Implemented simple CSS-based crosshair (16px, white, 70-90% opacity)
- Added phase-based visibility (show only during 'gameplay' or 'boss')
- Used fixed positioning with z-50 (above HUD), pointer-events-none

**Phase 4: Cursor Management (Task 3)**
- Wrapped index.jsx render in App component to access game phase
- Added dynamic cursor style to Canvas based on phase
- cursor: none during gameplay/boss, cursor: default otherwise

**Phase 5: Integration & Testing**
- Integrated Crosshair component into Interface.jsx
- Created 7 unit tests for mouseScreenPos store functionality (all passing)
- Full test suite: 1638/1638 tests passing (0 regressions)
- Visual testing to verify crosshair appearance and behavior

### Debug Log References

No debug issues encountered. Implementation followed red-green-refactor cycle:
- RED: Created failing tests for mouseScreenPos store functionality
- GREEN: Implemented minimal code to pass tests
- REFACTOR: No refactoring needed - implementation was clean from start

### Completion Notes List

✅ **All 5 tasks complete (16 subtasks)**
- Task 1: Crosshair component created with CSS-based visual design
- Task 2: mouseScreenPos tracking added to useControlsStore (Story 21.1 didn't implement this)
- Task 3: OS cursor hidden during gameplay phases via dynamic Canvas style
- Task 4: Phase-based visibility implemented (show during gameplay/boss only)
- Task 5: Architecture prepared for future gamepad support with comment placeholders

**Key Implementation Decisions:**
1. Used CSS-based crosshair instead of SVG for simplicity (as recommended in Dev Notes)
2. White color at 70-90% opacity for high contrast against dark space background
3. Added mouseScreenPos to store (wasn't in Story 21.1 despite Dev Notes assumption)
4. Used safe window detection (typeof window !== 'undefined') for test compatibility
5. Wrapped index.jsx in App component to access game phase for cursor styling

**Test Coverage:**
- 7 new unit tests for useControlsStore.mouseScreenPos (all passing)
- No Crosshair component tests (visual testing only - no @testing-library/react)
- Full regression suite: 1638 tests passing

**Visual Testing Results:**
- Crosshair appears during gameplay ✓
- Crosshair follows mouse smoothly ✓
- OS cursor hidden during gameplay ✓
- Crosshair hidden during menu/levelUp/pause ✓
- OS cursor returns during non-gameplay phases ✓

**Visual Polish (User Feedback):**
- Changed crosshair color to neon purple (#d8a7ff) for better visibility
- Added CSS drop-shadow glow effect for neon aesthetic
- Increased crosshair size from 16px to 20px
- Increased line thickness from 1px to 2px
- Added global cursor hiding on body element (not just Canvas)
- Center dot is white with extra glow for focal point
- Matches game's purple/neon aesthetic better than white

### File List

**Files Created:**
- src/ui/Crosshair.jsx (new component)
- src/stores/__tests__/useControlsStore.mouseScreenPos.test.jsx (7 tests)

**Files Modified:**
- src/config/gameConfig.js (added CROSSHAIR_* constants for visual configuration)
- src/stores/useControlsStore.jsx (added mouseScreenPos, setMouseScreenPos, updated resetControls)
- src/hooks/useMouseWorldPosition.jsx (added mouseScreenPos tracking in handlePointerMove)
- src/ui/Interface.jsx (imported and rendered Crosshair component)
- src/index.jsx (wrapped in App component, added dynamic cursor style to Canvas and body element)
- src/stores/useGame.jsx (unrelated changes from Story 17.6 - uncommitted)
- src/stores/usePlayer.jsx (unrelated changes from Story 21.1 - uncommitted)
