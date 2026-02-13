# Story 13.1: Tunnel Rendering & Interaction Bugs Resolution

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to identify and fix all bugs in the tunnel hub scene and UI,
So that players have a smooth experience between systems.

## Acceptance Criteria

1. **Given** the tunnel phase activates **When** TunnelScene.jsx and TunnelHub UI render **Then** no console errors are thrown **And** the 3D tunnel scene renders correctly without visual glitches

2. **Given** tunnel interactions (upgrades, dilemmas) **When** the player clicks buttons or makes selections **Then** all interactions work as expected without errors **And** Fragment spending updates correctly **And** stat changes apply correctly

3. **Given** the tunnel exit **When** the player clicks "ENTER SYSTEM" **Then** the transition to the next gameplay system occurs without errors **And** the game state resets correctly for the new system

4. **Given** playtesting **When** multiple tunnel visits occur in a single run **Then** no state pollution or bugs accumulate across visits

## Tasks / Subtasks

- [ ] Task 1: Identify and document current tunnel bugs (AC: #1-4)
  - [ ] 1.1: Test tunnel scene entry from boss defeat - check console for errors
  - [ ] 1.2: Verify TunnelScene.jsx renders without visual glitches (shader, geometry, particles)
  - [ ] 1.3: Check TunnelHub.jsx for console errors during mount and interactions
  - [ ] 1.4: Document any rendering artifacts or visual issues
  - [ ] 1.5: Document any interaction bugs (button clicks, keyboard shortcuts, state updates)

- [ ] Task 2: Fix TunnelScene rendering bugs (AC: #1)
  - [ ] 2.1: Verify TunnelTube shader compiles correctly and renders as expected
  - [ ] 2.2: Check geometry disposal in cleanup (useEffect return) to prevent memory leaks
  - [ ] 2.3: Verify ShipPlaceholder renders at correct position and rotation
  - [ ] 2.4: Check TunnelParticles geometry and position updates work correctly
  - [ ] 2.5: Test camera positioning and FOV for optimal tunnel view
  - [ ] 2.6: Verify lighting creates proper tunnel atmosphere without artifacts

- [ ] Task 3: Fix TunnelHub interaction bugs (AC: #2)
  - [ ] 3.1: Test upgrade purchase logic - verify fragment deduction and stat application
  - [ ] 3.2: Test dilemma accept/refuse logic - verify effects apply correctly
  - [ ] 3.3: Test HP sacrifice logic - verify fragment cost and HP recovery
  - [ ] 3.4: Check keyboard shortcuts (1-5 for upgrades, Y/N for dilemma, H for HP, Enter for exit)
  - [ ] 3.5: Verify button click handlers work correctly (onMouseEnter hover sounds, onClick actions)
  - [ ] 3.6: Test edge cases (insufficient fragments, HP already full, all upgrades purchased)

- [ ] Task 4: Fix tunnel exit transition bugs (AC: #3)
  - [ ] 4.1: Test "ENTER SYSTEM" button - verify transition animation plays
  - [ ] 4.2: Check useLevel.advanceSystem() - verify currentSystem increments correctly
  - [ ] 4.3: Check usePlayer.resetForNewSystem() - verify player state resets (weapons, boons, HP preserved, XP/level reset)
  - [ ] 4.4: Verify useGame.setPhase('gameplay') transitions correctly to gameplay
  - [ ] 4.5: Test new system spawn logic - verify enemies, planets, wormhole spawn correctly
  - [ ] 4.6: Verify timer resets to SYSTEM_TIMER for new system

- [ ] Task 5: Fix state pollution across tunnel visits (AC: #4)
  - [ ] 5.1: Test multiple tunnel visits in a single run (beat boss → tunnel → gameplay → beat boss → tunnel again)
  - [ ] 5.2: Verify dilemma selection is stable but unique per tunnel visit (useMemo dependency array)
  - [ ] 5.3: Check that purchased upgrades persist across visits (don't reappear)
  - [ ] 5.4: Verify accepted dilemmas don't reappear in subsequent tunnels
  - [ ] 5.5: Check that HP sacrifice state resets correctly between visits
  - [ ] 5.6: Verify fragment count persists correctly across systems
  - [ ] 5.7: Test exit animation cleanup - verify fadingRef.current resets correctly

- [ ] Task 6: Add defensive error handling (AC: #1-4)
  - [ ] 6.1: Add null checks for currentDilemma before accessing properties
  - [ ] 6.2: Add validation in handlePurchaseUpgrade to prevent double-purchase
  - [ ] 6.3: Add validation in handleEnterSystem to prevent double-trigger (fadingRef.current guard)
  - [ ] 6.4: Add try-catch around critical state transitions (advanceSystem, resetForNewSystem, setPhase)
  - [ ] 6.5: Add console.warn for unexpected states (e.g., fragments < 0, invalid upgrade ID)
  - [ ] 6.6: Verify all audio SFX calls have proper fallback (audioManager handles missing files)

- [ ] Task 7: Test edge cases and integration (AC: #1-4)
  - [ ] 7.1: Test tunnel entry with 0 fragments - verify UI displays correctly
  - [ ] 7.2: Test tunnel entry with HP full - verify HP sacrifice disabled
  - [ ] 7.3: Test tunnel entry with all upgrades purchased - verify "All upgrades purchased" message
  - [ ] 7.4: Test tunnel entry with no available dilemmas - verify "No dilemma available" message
  - [ ] 7.5: Test rapid button clicking (spam upgrade buttons, spam exit button)
  - [ ] 7.6: Test keyboard shortcut conflicts (e.g., pressing Enter while typing)
  - [ ] 7.7: Verify tunnel works correctly after multiple deaths and retries

- [ ] Task 8: Performance and memory validation (NFR1, NFR4)
  - [ ] 8.1: Test tunnel scene rendering - verify 60 FPS maintained
  - [ ] 8.2: Verify tunnel particle system performs well (300 particles, updated each frame)
  - [ ] 8.3: Check memory usage - verify geometries and materials are disposed on unmount
  - [ ] 8.4: Test transition animations - verify < 2 seconds total (entry + exit)
  - [ ] 8.5: Verify no memory leaks after multiple tunnel visits (use browser DevTools memory profiler)

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **UI Layer** → TunnelHub.jsx (HTML overlay, Tailwind styled)
- **Rendering Layer** → TunnelScene.jsx (Three.js shader, geometry, particles)
- **Stores** → useGame (phase management), usePlayer (fragments, HP, upgrades), useLevel (currentSystem)
- **Systems** → None for tunnel (purely UI-driven interactions)
- **GameLoop** → Paused during tunnel phase (no tick() calls)
- **Config** → GAME_CONFIG (HP_SACRIFICE_FRAGMENT_COST, HP_SACRIFICE_HP_RECOVERY)

**Existing Infrastructure:**
- `src/scenes/TunnelScene.jsx` — 3D tunnel rendering with shader, particles, ship placeholder
- `src/ui/TunnelHub.jsx` — Right-side UI panel with upgrades, dilemma, HP sacrifice, enter system button
- `src/stores/useGame.jsx` — Phase management (setPhase('tunnel'))
- `src/stores/usePlayer.jsx` — Fragments, HP, permanentUpgrades, acceptedDilemmas, applyPermanentUpgrade(), acceptDilemma(), sacrificeFragmentsForHP(), resetForNewSystem()
- `src/stores/useLevel.jsx` — currentSystem, advanceSystem()
- `src/entities/upgradeDefs.js` — UPGRADES definitions (fragment costs, effects)
- `src/entities/dilemmaDefs.js` — DILEMMAS definitions (effects, descriptions)
- `src/config/gameConfig.js` — HP_SACRIFICE_FRAGMENT_COST, HP_SACRIFICE_HP_RECOVERY
- `src/audio/audioManager.js` — SFX playback (playSFX())
- `src/utils/saveGame.js` — saveGameState() for auto-save on tunnel entry

**Current Tunnel Implementation (Epic 7):**
- TunnelScene uses custom shader for infinite tunnel effect with scrolling rings
- TunnelHub displays upgrades (1-5), dilemma (Y/N), HP sacrifice (H), enter system (Enter)
- Keyboard shortcuts for all actions (1-5 for upgrades, Y/N for dilemma, H for HP, Enter for exit)
- Stable dilemma selection per tunnel visit (useMemo with empty dependency array)
- Auto-save on tunnel entry (useEffect)
- Exit animation with fadingRef guard to prevent double-trigger
- Purchased upgrades and accepted dilemmas persist across visits

**Known Potential Issues (to investigate):**
- TunnelScene shader uniforms may not dispose correctly on unmount
- TunnelHub keyboard shortcuts may conflict with browser shortcuts (Enter)
- Exit animation may not reset fadingRef.current correctly on cancel/error
- Dilemma useMemo may cause stale closure issues with acceptedDilemmas
- Multiple tunnel visits may accumulate event listeners if not cleaned up properly
- State transitions (advanceSystem, resetForNewSystem, setPhase) may fail without error handling

### Technical Requirements

**TunnelScene.jsx Requirements:**
- Shader material must compile correctly (vertex + fragment shaders)
- Geometry must be created once and disposed on unmount (useMemo + useEffect cleanup)
- useFrame updates (uTime.value, particle positions) must not cause performance issues
- Camera position and FOV must provide optimal tunnel view (inside tunnel looking forward)
- Lighting must create proper purple/blue atmosphere without artifacts

**TunnelHub.jsx Requirements:**
- All state updates (fragments, HP, upgrades, dilemmas) must be atomic and error-free
- Keyboard shortcuts must work correctly without conflicts
- Button click handlers must play SFX and update state correctly
- Edge cases must be handled gracefully (0 fragments, HP full, all upgrades purchased, no dilemmas)
- Exit animation must prevent double-trigger via fadingRef guard
- onAnimationEnd callback must execute state transitions correctly

**State Management Requirements:**
- usePlayer.applyPermanentUpgrade(upgradeId) must deduct fragments and apply stat changes atomically
- usePlayer.acceptDilemma(dilemmaId) must apply bonus/malus and prevent re-selection
- usePlayer.sacrificeFragmentsForHP() must deduct fragments and add HP atomically
- useLevel.advanceSystem() must increment currentSystem and reset system-level state
- usePlayer.resetForNewSystem() must reset XP, level, active weapons/boons, but preserve fragments and permanent upgrades
- useGame.setPhase('gameplay') must transition to gameplay without errors

**Error Handling Requirements:**
- All button handlers must validate state before execution (fragments >= cost, HP < maxHP, etc.)
- All state transitions must be wrapped in try-catch or have validation guards
- Console errors must be caught and logged (avoid uncaught exceptions)
- Audio SFX calls must handle missing files gracefully (audioManager handles this)

### Project Structure Notes

**Alignment with Unified Project Structure:**
- TunnelScene.jsx in src/scenes/ (3D scene components)
- TunnelHub.jsx in src/ui/ (HTML overlay UI)
- useGame, usePlayer, useLevel in src/stores/ (Zustand stores)
- upgradeDefs.js, dilemmaDefs.js in src/entities/ (data definitions)
- gameConfig.js in src/config/ (global constants)
- audioManager.js in src/audio/ (Howler.js wrapper)
- saveGame.js in src/utils/ (localStorage persistence)

**No Detected Conflicts:**
- Tunnel implementation follows established patterns from Epic 4 (scene management, phase transitions)
- No conflicts with existing systems (GameLoop paused during tunnel, no tick() needed)
- TunnelHub uses same UI primitives as other screens (buttons, keyboard shortcuts, SFX)

### References

- Epic 7 Stories (7.1, 7.2, 7.3, 7.4) define tunnel requirements [Source: _bmad-output/planning-artifacts/epics.md#Epic 7]
- Architecture: Scene Management (Mount/Unmount + Asset Preload) [Source: _bmad-output/planning-artifacts/architecture.md#Scene Management]
- Architecture: State Architecture (Centralized Game Loop) [Source: _bmad-output/planning-artifacts/architecture.md#State Architecture]
- UX Design: Tunnel Hub layout (3D left, UI right, keyboard shortcuts) [Source: _bmad-output/planning-artifacts/ux-design-specification.md]
- Game Loop: Paused during tunnel phase (isPaused = true) [Source: src/GameLoop.jsx]
- usePlayer: Fragment management, upgrades, dilemmas, HP sacrifice [Source: src/stores/usePlayer.jsx]
- useLevel: System progression, advanceSystem() [Source: src/stores/useLevel.jsx]
- useGame: Phase management (setPhase) [Source: src/stores/useGame.jsx]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
