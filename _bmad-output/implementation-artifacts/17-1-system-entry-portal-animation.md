# Story 17.1: System Entry Portal Animation

Status: review

## Story

As a player,
I want to see a dramatic portal animation when entering a new system,
So that each system feels like a distinct journey and the transition is cinematic.

## Acceptance Criteria

1. **White Flash on System Entry:** Given the player starts a new game or exits the tunnel and enters a new system, when the transition begins, then a white flash (200ms) covers the screen and the gameplay scene loads in the background during the flash.

2. **Portal Spawn at Center:** Given the white flash completes, when the scene is visible, then a wormhole portal is already present in the center of the play area (position [0, 0, 0]), visually distinct with swirling energy and particle effects, 20-30 unit diameter.

3. **Portal Open Animation:** Given the portal is active, when the animation plays, then the portal grows from a small point to full size over 0.8-1.0 seconds (ease-out), with particles and energy effects intensifying as it opens.

4. **Ship Fly-Through:** Given the portal is fully open, when the ship entry begins, then the player's ship flies through the portal from the far side toward the camera automatically (no player control), decelerating as it reaches the play position.

5. **Portal Close & Control Handoff:** Given the ship reaches its starting position, when the fly-in completes, then the portal shrinks and disappears over 0.5 seconds, the player gains control, the system timer starts, and enemy spawning begins.

6. **Performance:** Given the portal animation, when performance is tested, then the animation maintains 60 FPS and the transition from white flash to full control takes 2-3 seconds total.

## Tasks / Subtasks

- [x] Task 1: Add cinematic config constants (AC: #1, #3, #4, #5)
  - [x] 1.1 Add `SYSTEM_ENTRY` config block to `gameConfig.js` with timing constants (flash duration, portal grow time, ship fly-in time, portal shrink time, total duration)
  - [x] 1.2 Add `SYSTEM_NAMES` array to `gameConfig.js` for system name display (used by Story 17.2 later)

- [x] Task 2: Add 'systemEntry' phase to useGame store (AC: #4, #5)
  - [x] 2.1 Add `'systemEntry'` to phase management in `useGame.jsx`
  - [x] 2.2 Add `systemEntryTimer` state field (counts elapsed time during cinematic)
  - [x] 2.3 Add `startSystemEntry()` action that sets phase to `'systemEntry'` and resets timer
  - [x] 2.4 Add `completeSystemEntry()` action that transitions to `'gameplay'` phase
  - [x] 2.5 Update `reset()` to include new fields

- [x] Task 3: Update Experience.jsx scene routing (AC: #2)
  - [x] 3.1 Add `'systemEntry'` to the `showGameplay` condition so GameplayScene is mounted during portal animation
  - [x] 3.2 Ensure GameLoop is active but skips gameplay ticks during `'systemEntry'` phase

- [x] Task 4: Update GameLoop for systemEntry phase (AC: #4, #5)
  - [x] 4.1 In GameLoop, skip all gameplay tick sections (1-9) when phase is `'systemEntry'`
  - [x] 4.2 Optionally tick the systemEntryTimer during this phase
  - [x] 4.3 Ensure transition from `'tunnel'` to `'systemEntry'` properly resets enemies, weapons, particles, orbs

- [x] Task 5: Create WhiteFlashTransition component (AC: #1)
  - [x] 5.1 Create `src/ui/WhiteFlashTransition.jsx` — full-screen HTML overlay div with `background: white`
  - [x] 5.2 Animate opacity: 0 → 1 (50ms) → 0 (150ms) using CSS transitions
  - [x] 5.3 Accept `active` prop and `onComplete` callback
  - [x] 5.4 Add CSS keyframes to `style.css`

- [x] Task 6: Create SystemEntryPortal renderer (AC: #2, #3, #4, #5)
  - [x] 6.1 Create `src/renderers/SystemEntryPortal.jsx` — 3D component rendered inside GameplayScene
  - [x] 6.2 Portal mesh: large disc/ring with swirling shader effect (time-based UV distortion using `ShaderMaterial` or animated emissive `MeshStandardMaterial`)
  - [x] 6.3 Portal particles: 30-50 particles around portal using `Points` + `PointsMaterial` (or Drei `<Sparkles>`)
  - [x] 6.4 Portal grow animation: scale from 0.1 → 1.0 over 0.8-1.0s (ease-out) driven by useFrame
  - [x] 6.5 Ship fly-in: animate PlayerShip from behind portal (z = -100) to center (z = 0) over ~1.5s with deceleration
  - [x] 6.6 Portal shrink: scale from 1.0 → 0 over 0.5s after ship arrival
  - [x] 6.7 On animation complete, call `useGame.getState().completeSystemEntry()`

- [x] Task 7: Update TunnelHub exit flow (AC: #1)
  - [x] 7.1 Modify `TunnelHub.jsx` `executeSystemTransition()` to call `setPhase('systemEntry')` instead of `setPhase('gameplay')`
  - [x] 7.2 Trigger WhiteFlashTransition before phase change

- [x] Task 8: Wire up Interface.jsx (AC: #1)
  - [x] 8.1 Add WhiteFlashTransition to Interface.jsx, active during tunnel→systemEntry transition
  - [x] 8.2 Conditionally render based on a trigger flag (e.g., `showFlash` state in useGame or local state)

- [ ] Task 9: Testing & performance validation (AC: #6)
  - [ ] 9.1 Manual playtest: verify full animation sequence (flash → portal grow → ship fly-in → portal shrink → control)
  - [ ] 9.2 Verify 60 FPS with r3f-perf during portal animation
  - [ ] 9.3 Verify total cinematic duration is 2-3 seconds
  - [ ] 9.4 Verify enemy spawning and timer start only after `completeSystemEntry()`

## Dev Notes

### Architecture & Pattern Compliance

**6-Layer Architecture Adherence:**
- **Config (Layer 1):** All timing constants go in `gameConfig.js` under `SYSTEM_ENTRY` namespace. No magic numbers.
- **Stores (Layer 3):** `useGame.jsx` owns the `'systemEntry'` phase and timer. No new store needed.
- **GameLoop (Layer 4):** Must skip gameplay ticks during `'systemEntry'` but allow rendering. Add phase check at the top of the gameplay tick block.
- **Rendering (Layer 5):** `SystemEntryPortal.jsx` goes in `src/renderers/`. It reads phase from `useGame` via `getState()` in useFrame. No game logic here — only visual animation.
- **UI (Layer 6):** `WhiteFlashTransition.jsx` goes in `src/ui/`. Pure HTML overlay, no 3D.

**Store Pattern:**
```javascript
// useGame.jsx additions follow existing pattern:
systemEntryTimer: 0,
startSystemEntry: () => set({ phase: 'systemEntry', systemEntryTimer: 0, isPaused: false }),
completeSystemEntry: () => set({ phase: 'gameplay' }),
// reset() must include systemEntryTimer: 0
```

**useFrame Rules:**
- SystemEntryPortal uses its own useFrame for visual animation (allowed per architecture — renderers can have useFrame for visual sync)
- Animation is driven by elapsed time tracked in a local ref (not store state, to avoid unnecessary re-renders)
- GameLoop's useFrame still runs but early-returns for gameplay ticks when phase is `'systemEntry'`

### Existing Code Patterns to Follow

**Phase Transitions (existing pattern from TunnelHub.jsx):**
```javascript
// Current flow: TunnelHub → executeSystemTransition → setPhase('gameplay')
// New flow: TunnelHub → executeSystemTransition → setPhase('systemEntry')
//           SystemEntryPortal animation completes → completeSystemEntry() → phase: 'gameplay'
```

**Experience.jsx Scene Mounting (existing pattern):**
```javascript
// Current: showGameplay includes 'gameplay', 'planetReward', 'gameOver', and levelUp variants
// Add: 'systemEntry' to showGameplay condition
const showGameplay = phase === 'gameplay' || phase === 'systemEntry' || phase === 'planetReward' || ...
```

**GameLoop Phase Reset (existing pattern at lines 72-106):**
```javascript
// Current: When transitioning from 'tunnel' to 'gameplay', resets enemies/weapons/particles
// New: Same reset should happen for tunnel → systemEntry transition
// Check prevPhaseRef.current === 'tunnel' && (phase === 'gameplay' || phase === 'systemEntry')
```

**CSS Animation Pattern (existing in style.css):**
```css
/* Follow existing @keyframes pattern, e.g. tunnelExitFade, fadeIn, fadeOut */
@keyframes whiteFlash {
  0% { opacity: 0; }
  25% { opacity: 1; }  /* 50ms fade-in at 200ms total */
  100% { opacity: 0; }  /* 150ms fade-out */
}
```

### Critical Implementation Details

**Portal Visual Design:**
- Position: World origin [0, 0, 0] — always center of play area
- Size: 20-30 unit diameter (radius 10-15). For reference, `WORMHOLE_ACTIVATION_RADIUS` is 25 units.
- Visual: Disc or ring mesh with emissive material. Cyan/purple glow (#00ccff or #8844ff) matching game theme.
- Particles: Use `Points` with `PointsMaterial` (not `<Sparkles>` from Drei if performance is a concern — Points is more controllable). 30-50 particles orbiting the portal ring.
- Shader option: `MeshStandardMaterial` with animated emissive is simpler. Full `ShaderMaterial` with swirl is more visually impressive but more complex. Start simple, upgrade if time permits.

**Ship Fly-In Animation:**
- The PlayerShip is already rendered in GameplayScene via `<PlayerShip />` component.
- During `'systemEntry'` phase, the ship's position should be controlled by the animation, NOT by player input.
- Approach: In PlayerShip.jsx or SystemEntryPortal.jsx, when phase is `'systemEntry'`, override position from animation controller instead of from usePlayer store.
- Alternative: Set player position directly in the store during animation via `usePlayer.getState().setPosition(animatedPos)`, then stop overriding when animation completes.
- Ship starts at z = -100 (behind portal, facing camera) and flies to z = 0 (center). Use eased interpolation (ease-out cubic).

**GameLoop Behavior During systemEntry:**
- The GameLoop MUST NOT tick gameplay systems (enemies, weapons, projectiles, collisions).
- However, rendering useFrames (starfield parallax, environment) should continue working — these are independent of GameLoop.
- The GameLoop phase check should be: `if (phase !== 'gameplay' && phase !== 'boss') return` for the gameplay tick block. Currently it checks specific phases — ensure `'systemEntry'` is excluded.

**Tunnel Exit Integration:**
- Current flow in `TunnelHub.jsx`: CSS fade-out → `executeSystemTransition()` → `setPhase('gameplay')`
- New flow: CSS fade-out → white flash starts → `executeSystemTransition()` → `setPhase('systemEntry')` → GameplayScene mounts with SystemEntryPortal → animation plays → `completeSystemEntry()` → phase becomes `'gameplay'`
- The white flash should bridge the tunnel fade-out and the portal appearance.

**WhiteFlashTransition Reusability:**
- This component will be reused in Story 17.5 for other transitions (boss defeat → tunnel entry, game over → retry).
- Design it as a simple, self-contained component: `<WhiteFlashTransition active={boolean} onComplete={callback} duration={200} />`
- Place it in `src/ui/` since it's an HTML overlay.

### Files to Modify

| File | Change |
|------|--------|
| `src/config/gameConfig.js` | Add `SYSTEM_ENTRY` config block with timing constants |
| `src/stores/useGame.jsx` | Add `'systemEntry'` phase, `systemEntryTimer`, `startSystemEntry()`, `completeSystemEntry()`, update `reset()` |
| `src/Experience.jsx` | Add `'systemEntry'` to `showGameplay` condition |
| `src/GameLoop.jsx` | Skip gameplay ticks during `'systemEntry'`, handle tunnel→systemEntry reset |
| `src/ui/TunnelHub.jsx` | Change `setPhase('gameplay')` to `setPhase('systemEntry')` in `executeSystemTransition()` |
| `src/ui/Interface.jsx` | Add WhiteFlashTransition component |
| `src/scenes/GameplayScene.jsx` | Mount SystemEntryPortal renderer |
| `src/style.css` | Add white flash keyframes |

### Files to Create

| File | Purpose |
|------|---------|
| `src/ui/WhiteFlashTransition.jsx` | Reusable full-screen white flash overlay (HTML div) |
| `src/renderers/SystemEntryPortal.jsx` | Portal mesh + particles + ship fly-in animation (R3F component) |

### Project Structure Notes

- All new files follow existing naming conventions (PascalCase for components)
- `WhiteFlashTransition.jsx` in `ui/` — consistent with other overlay components (HUD, TunnelHub, etc.)
- `SystemEntryPortal.jsx` in `renderers/` — consistent with WormholeRenderer, ParticleRenderer pattern
- No new stores needed — extends existing `useGame.jsx`
- No new systems needed — animation is visual-only (Layer 5)

### Performance Budget

- Portal mesh: 1 draw call (disc or ring geometry)
- Portal particles: 1 draw call (Points with 30-50 vertices)
- Portal shader: Simple time-based UV distortion (very cheap)
- White flash: HTML overlay — zero GPU cost
- Total additional: ~2 draw calls during 2-3s cinematic. Well within budget.

### Testing Approach

- No unit tests needed for visual animation (animation is visual-only)
- Ensure `reset()` in useGame includes `systemEntryTimer: 0` to prevent test pollution
- Manual playtest: verify sequence timing, FPS, and control handoff
- Verify existing tests still pass after adding new phase (especially GameLoop tests that check phase conditions)

### References

- [Source: _bmad-output/planning-artifacts/epic-17-cinematic-transitions.md#Story 17.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Scene Management]
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules]
- [Source: src/stores/useGame.jsx — phase management]
- [Source: src/GameLoop.jsx — tick order, phase reset logic lines 72-106]
- [Source: src/Experience.jsx — showGameplay condition]
- [Source: src/ui/TunnelHub.jsx — executeSystemTransition()]
- [Source: src/renderers/WormholeRenderer.jsx — existing wormhole visual patterns]
- [Source: src/config/gameConfig.js — WORMHOLE_* constants pattern]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- No debug issues encountered during implementation.

### Completion Notes List
- Task 1: Added SYSTEM_ENTRY config block with all timing constants (flash 200ms, portal grow 0.9s, ship fly-in 1.2s, portal shrink 0.5s, portal radius 12, 40 particles). Added SYSTEM_NAMES array for Story 17.2.
- Task 2: Added `systemEntryTimer` field, `startSystemEntry()` and `completeSystemEntry()` actions to useGame store. Updated `reset()` to include `systemEntryTimer: 0`.
- Task 3: Added `'systemEntry'` to `showGameplay` condition in Experience.jsx so GameplayScene mounts during portal animation.
- Task 4: Updated GameLoop tunnel→systemEntry reset condition. Added `'systemEntry'` exclusion to the new-game reset guard. GameLoop naturally skips gameplay ticks since `phase !== 'gameplay'` check at line 326.
- Task 5: Created WhiteFlashTransition.jsx — reusable HTML overlay with CSS keyframe animation (whiteFlash). Accepts `active`, `onComplete`, `duration` props.
- Task 6: Created SystemEntryPortal.jsx — R3F renderer with custom ShaderMaterial rift/fissure effect (fbm noise, swirl distortion, cyan→purple gradient, fracture lines), 40 orbiting particles (Points with additive blending), 3-phase timeline animation (grow → slide-in → shrink) driven by useFrame with local refs. Ship slides from portal (Z=+40) to center (Z=0) facing upward. Camera fixed at center during animation (no follow).
- Task 7: Changed TunnelHub.jsx `executeSystemTransition()` to call `startSystemEntry()` instead of `setPhase('gameplay')`.
- Task 8: Wired WhiteFlashTransition in Interface.jsx with phase transition detection (tunnel→systemEntry) using useEffect + prevPhaseRef.
- Task 9: Requires manual playtest — all automated tests pass (1124/1126, 2 pre-existing failures from Story 18.1).
- Total cinematic duration: 0.2s flash + 0.9s portal grow + 1.2s ship fly-in + 0.5s portal shrink = 2.8s (within 2-3s target).

### Change Log
- 2026-02-14: Implemented full system entry portal animation (Story 17.1) — white flash, portal grow/shrink, ship fly-through, control handoff.
- 2026-02-14: Extended to trigger on first game start (not just tunnel exits). Replaced basic ring with ShaderMaterial rift/fissure effect (fbm noise, swirl distortion, cyan→purple gradient). Ship slides from portal position (Z=+40) upward to center (Z=0) facing up. Camera fixed at center during systemEntry (no follow). Updated startGameplay() to route through systemEntry phase. Fixed tests.

### File List
- `src/config/gameConfig.js` (modified) — Added SYSTEM_ENTRY config block and SYSTEM_NAMES array
- `src/stores/useGame.jsx` (modified) — Added systemEntryTimer, startSystemEntry(), completeSystemEntry(), updated reset()
- `src/Experience.jsx` (modified) — Added 'systemEntry' to showGameplay condition
- `src/GameLoop.jsx` (modified) — Updated tunnel reset condition to include systemEntry, excluded systemEntry from new-game reset
- `src/ui/WhiteFlashTransition.jsx` (created) — Reusable white flash overlay component
- `src/renderers/SystemEntryPortal.jsx` (created) — Portal animation renderer with grow/fly-in/shrink phases
- `src/ui/TunnelHub.jsx` (modified) — Changed executeSystemTransition to use startSystemEntry()
- `src/ui/Interface.jsx` (modified) — Added WhiteFlashTransition with tunnel→systemEntry trigger
- `src/scenes/GameplayScene.jsx` (modified) — Mounted SystemEntryPortal renderer
- `src/style.css` (modified) — Added whiteFlash CSS keyframes
- `src/hooks/usePlayerCamera.jsx` (modified) — Fixed camera at center during systemEntry phase
- `src/stores/__tests__/shipSelectFlow.test.js` (modified) — Updated phase expectation after startGameplay
- `src/stores/__tests__/usePlayer.shipSelect.test.js` (modified) — Updated phase expectation after startGameplay
