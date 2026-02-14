# Story 17.5: Transition Flash Effects

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want smooth white flash transitions between key moments,
So that phase changes feel polished and cinematic rather than jarring cuts.

## Acceptance Criteria

1. **Tunnel Exit → System Entry Flash (Already Implemented):** Given the player exits the tunnel and enters a new system, when the player clicks "ENTER SYSTEM" in the tunnel, then a white flash (200ms) covers the screen, fades in quickly (50ms) and fades out over 150ms, and the system entry portal animation begins as the flash fades out (Story 17.1). This is already working — no changes needed.

2. **Boss Defeat → Tunnel Entry Flash:** Given the player defeats the boss and enters the wormhole, when the player moves into the reactivated wormhole's zone, then a white flash (200ms) covers the screen, the TunnelScene loads during the flash, and the flash fades out to reveal the tunnel 3D scene and UI.

3. **White Flash Implementation (Reuse Existing):** Given the white flash effect, when it is implemented, then it reuses the existing `WhiteFlashTransition` component (full-screen HTML overlay div with background: white, opacity animates 0 → 1 → 0 using CSS animation). The flash is non-blocking and does not freeze the game loop.

4. **Flash Timing Consistency:** Given the flash timing, when transitions occur, then the total flash duration is 200ms (matching `GAME_CONFIG.SYSTEM_ENTRY.FLASH_DURATION`). The timing feels snappy and responsive.

5. **Component Reuse Across Transitions:** Given flash transitions across the game, when they are used consistently, then the same WhiteFlashTransition component is reused for: tunnel exit → system entry (already done), and boss defeat → wormhole → tunnel entry (new). The flash visual style is consistent across all uses.

## Tasks / Subtasks

- [ ] Task 1: Extend Interface.jsx flash detection for boss→tunnel transition (AC: #2, #3, #5)
  - [ ] 1.1 In the `useEffect` that detects phase transitions (lines 25-30), add detection for transition TO `'tunnel'` phase from any combat phase (gameplay or boss)
  - [ ] 1.2 When detected, set `showFlash` to `true` (same state variable used for systemEntry flash)
  - [ ] 1.3 The `WhiteFlashTransition` component already renders with `active={showFlash}` and `onComplete={() => setShowFlash(false)}` — no changes needed to the JSX

- [ ] Task 2: Verify flash triggers correctly in gameplay flow (AC: #2, #4)
  - [ ] 2.1 Manual playtest: defeat boss → wormhole reactivates → fly into wormhole → white flash → tunnel UI appears
  - [ ] 2.2 Verify flash duration matches 200ms (same as tunnel→systemEntry)
  - [ ] 2.3 Verify flash does not trigger when entering tunnel from menu or other non-combat sources (if applicable)
  - [ ] 2.4 Verify the existing tunnel→systemEntry flash still works correctly (no regression)

## Dev Notes

### Architecture & Pattern Compliance

**6-Layer Architecture Adherence:**
- **Config (Layer 1):** No changes — `SYSTEM_ENTRY.FLASH_DURATION: 0.2` already defined in `gameConfig.js` (line ~251) and reused for all flash transitions.
- **Stores (Layer 3):** No changes — phase transitions (`setPhase('tunnel')`) already exist. Flash is purely a UI concern triggered by phase change detection.
- **GameLoop (Layer 4):** No changes — the boss defeat → tunnel transition is already handled (or will be by Story 17.4). This story only adds the visual flash overlay.
- **Rendering (Layer 5):** No changes — no 3D rendering involved.
- **UI (Layer 6):** `Interface.jsx` — extend the existing phase transition detection useEffect to also trigger flash on transitions to `'tunnel'` phase from combat phases.

**Key Insight — Minimal Change Required:**
This story is primarily a 3-5 line change in `Interface.jsx`. The WhiteFlashTransition component already exists and is fully reusable. The only missing piece is triggering it on the boss→tunnel phase transition.

### Critical Implementation Details

**Current WhiteFlashTransition Architecture:**
- Component: `src/ui/WhiteFlashTransition.jsx` (34 lines) — accepts `active`, `onComplete`, `duration` props
- CSS animation: `whiteFlash` keyframes in `src/style.css` (0% opacity:0, 25% opacity:1, 100% opacity:0)
- Currently triggered: in `Interface.jsx` lines 22-30 when phase transitions TO `'systemEntry'`
- Duration: `GAME_CONFIG.SYSTEM_ENTRY.FLASH_DURATION * 1000` = 200ms

**Current Phase Transition Detection (Interface.jsx lines 22-30):**
```javascript
const [showFlash, setShowFlash] = useState(false)
const prevPhaseRef = useRef(phase)
useEffect(() => {
  if (phase === 'systemEntry' && prevPhaseRef.current !== 'systemEntry') {
    setShowFlash(true)
  }
  prevPhaseRef.current = phase
}, [phase])
```

**Required Change — Add tunnel detection:**
The useEffect should ALSO trigger `setShowFlash(true)` when `phase === 'tunnel'` AND the previous phase was a combat phase (`'gameplay'` or `'boss'`). This covers:
- Current flow: `gameplay` → `tunnel` (when boss is defeated and player enters wormhole)
- Legacy flow: `boss` → `tunnel` (if Story 17.4 hasn't been implemented yet)

**Guard against false triggers:**
- Do NOT trigger flash when entering tunnel from menu (game start, first system — this transition goes menu → gameplay, not directly to tunnel)
- Do NOT trigger when tunnel is entered from victory/gameOver (these are separate phases)
- Only trigger from `'gameplay'` or `'boss'` → `'tunnel'` transitions

**WhiteFlashTransition JSX rendering (Interface.jsx line ~73-77):**
```jsx
<WhiteFlashTransition
  active={showFlash}
  onComplete={() => setShowFlash(false)}
  duration={GAME_CONFIG.SYSTEM_ENTRY.FLASH_DURATION * 1000}
/>
```
This already renders and handles cleanup — no changes needed here.

### Dependency on Story 17.4

Story 17.4 changes the boss fight flow so the boss spawns in GameplayScene (no separate BossScene). After boss defeat, the wormhole reactivates and the player flies into it, triggering `setPhase('tunnel')`. This story's flash will trigger on that transition.

If Story 17.4 is NOT yet implemented, the current flow is `'boss'` → `'tunnel'`, which is why the detection should cover both `prevPhase === 'gameplay'` and `prevPhase === 'boss'`.

### Files to Modify

| File | Change |
|------|--------|
| `src/ui/Interface.jsx` | Add `'tunnel'` phase detection (from combat phases) to the existing flash useEffect (~3 lines added) |

### Files NOT Modified

| File | Reason |
|------|--------|
| `src/ui/WhiteFlashTransition.jsx` | Already fully reusable — no changes needed |
| `src/style.css` | `whiteFlash` keyframes already defined |
| `src/config/gameConfig.js` | `SYSTEM_ENTRY.FLASH_DURATION` already configured (0.2s) |
| `src/stores/useGame.jsx` | Phase management unchanged |
| `src/GameLoop.jsx` | Boss defeat flow unchanged — Story 17.4 handles transition logic |
| `src/scenes/GameplayScene.jsx` | No rendering changes |
| `src/Experience.jsx` | Scene mounting logic unchanged |

### Project Structure Notes

- No new files created
- Single file modification (`Interface.jsx`) with ~3 lines added
- Consistent with existing WhiteFlashTransition usage pattern established in Story 17.1
- Reuses same config constant, same CSS animation, same component

### Testing Approach

- No unit tests needed — this is a CSS/UI visual effect triggered by React state
- Manual playtest required: verify flash appears on boss→tunnel transition
- Verify no regression on existing tunnel→systemEntry flash
- Verify flash does not appear on non-combat→tunnel transitions

### Previous Story Intelligence

**From Story 17.1 (review):**
- Introduced WhiteFlashTransition component and CSS keyframes
- Wired into Interface.jsx with prevPhaseRef pattern for phase transition detection
- Uses `GAME_CONFIG.SYSTEM_ENTRY.FLASH_DURATION * 1000` for duration
- Component accepts `active`, `onComplete`, `duration` props — clean reusable API

**From Story 17.4 (ready-for-dev):**
- Changes boss fight to occur in GameplayScene (no separate BossScene)
- Boss defeat → wormhole reactivation → player enters wormhole → `setPhase('tunnel')`
- Task 5.2 explicitly says: "Reuse existing WhiteFlashTransition component for the flash"
- This confirms Story 17.5 is the flash integration that Story 17.4 depends on

### Git Intelligence

Recent commits focus on visual polish (starfield parallax, grid fog, lighting). The codebase consistently uses:
- CSS animations for UI transitions (keyframes in style.css)
- React state + useEffect for phase transition detection
- Config constants from gameConfig.js for all timing values
- No animation libraries — all vanilla CSS + React state

### References

- [Source: _bmad-output/planning-artifacts/epic-17-cinematic-transitions.md#Story 17.5]
- [Source: _bmad-output/implementation-artifacts/17-1-system-entry-portal-animation.md — WhiteFlashTransition creation, Interface.jsx wiring]
- [Source: _bmad-output/implementation-artifacts/17-4-boss-arrival-in-gameplay-scene.md — Task 5.2 references WhiteFlashTransition reuse]
- [Source: src/ui/WhiteFlashTransition.jsx — existing reusable component (34 lines)]
- [Source: src/ui/Interface.jsx — lines 22-30 phase transition detection, lines 73-77 component rendering]
- [Source: src/style.css — lines 71-75 whiteFlash keyframes]
- [Source: src/config/gameConfig.js — SYSTEM_ENTRY.FLASH_DURATION: 0.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
