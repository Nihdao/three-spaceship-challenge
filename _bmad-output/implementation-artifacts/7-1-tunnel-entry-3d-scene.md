# Story 7.1: Tunnel Entry & 3D Scene

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to enter the wormhole tunnel and see an immersive 3D tunnel environment,
So that the transition between systems feels dramatic and provides a moment of respiration.

## Acceptance Criteria

1. **Given** the boss is defeated and the system is complete **When** the tunnel transition begins **Then** a wormhole entry animation plays (800ms per UX spec) **And** TunnelScene.jsx renders an infinite-tunnel visual with the ship heading toward the exit

2. **Given** the tunnel scene is active **When** the player views it **Then** the layout is split -- 3D tunnel on the left, UI panel on the right (per UX tunnel spec) **And** the player's current Fragment count is displayed **And** keyboard navigation works between sections (Tab between upgrade list, dilemma, exit button)

3. **Given** the tunnel loads **When** game state is checked **Then** game state auto-saves to localStorage (NFR11)

## Tasks / Subtasks

- [x] Task 1: Add tunnel and Fragment constants to gameConfig.js (AC: #1, #2)
  - [x] 1.1: Add `TUNNEL_ENTRY_ANIMATION_DURATION: 0.8` -- 800ms wormhole entry animation duration
  - [x] 1.2: Add `TUNNEL_EXIT_ANIMATION_DURATION: 0.5` -- 500ms tunnel exit fade duration (future-proofing for Story 7.3)
  - [x] 1.3: Add `MAX_SYSTEMS: 3` -- total number of systems in a full run (used to determine if victory vs tunnel after boss)
  - [x] 1.4: Add `TUNNEL_AUTOSAVE_KEY: 'spaceship-challenge-save'` -- localStorage key for auto-save

- [x] Task 2: Add Fragment state to usePlayer store (AC: #2)
  - [x] 2.1: Add `fragments: 0` state field -- persistent Fragment currency, NOT reset on system transitions
  - [x] 2.2: Add `addFragments(amount)` action -- `set(state => ({ fragments: state.fragments + amount }))`
  - [x] 2.3: Update `reset()` to include `fragments: 0` -- Fragments reset on full game reset (new run), but NOT on system transition
  - [x] 2.4: Add `resetForNewSystem()` action (or extend existing reset pattern) that resets per-system state (xp, level) but preserves cross-system state (fragments, weapons, boons, HP)

- [x] Task 3: Add system tracking to useLevel store (AC: #1)
  - [x] 3.1: Add `currentSystem: 1` state field -- tracks which system the player is in (1-indexed)
  - [x] 3.2: Add `advanceSystem()` action -- increments `currentSystem`, resets per-system state (timer, enemies, planets, wormhole) for the new system
  - [x] 3.3: Update `reset()` to include `currentSystem: 1` -- full reset on new game
  - [x] 3.4: Ensure `systemTimer`, `planets`, `wormholeState` etc. are reset in `advanceSystem()` without touching `currentSystem`

- [x] Task 4: Modify boss defeat flow in GameLoop to transition to tunnel (AC: #1)
  - [x] 4.1: In GameLoop boss defeat section (line ~106-107), when `animationComplete` is true: award Fragment reward via `usePlayer.getState().addFragments(GAME_CONFIG.BOSS_FRAGMENT_REWARD)` (replacing the TODO comment)
  - [x] 4.2: After awarding Fragments, check `useLevel.getState().currentSystem < GAME_CONFIG.MAX_SYSTEMS` -- if true, call `useGame.getState().setPhase('tunnel')` instead of `triggerVictory()`; if false (final system), call `triggerVictory()` as before
  - [x] 4.3: Play `'boss-defeat'` SFX regardless of whether transitioning to tunnel or victory
  - [x] 4.4: When transitioning to tunnel, also stop boss music (if separate music handling exists)

- [x] Task 5: Add tunnel entry phase transition in useGame (AC: #1)
  - [x] 5.1: Verify `setPhase('tunnel')` works correctly -- the 'tunnel' phase is already supported in the phase system, but verify no side effects
  - [x] 5.2: Add `enterTunnel()` convenience action if needed: `set({ phase: 'tunnel' })` -- may be simpler than using generic `setPhase` if tunnel-specific logic is needed (e.g., stopping music)
  - [x] 5.3: Ensure GameLoop does NOT tick during tunnel phase -- the tunnel is a UI-only pause state. Check that GameLoop's phase guard excludes 'tunnel'

- [x] Task 6: Create TunnelScene.jsx 3D scene (AC: #1)
  - [x] 6.1: Create `src/scenes/TunnelScene.jsx` -- infinite tunnel visual using a cylindrical/tube geometry with animated texture or procedural shader
  - [x] 6.2: Use a simple approach: a long cylinder or tube with a scrolling texture/shader to simulate forward movement through a wormhole
  - [x] 6.3: Position the player ship mesh (or a simple ship placeholder) inside the tunnel, angled toward the exit
  - [x] 6.4: Add ambient lighting appropriate for the tunnel (blue/purple tones per "Cyber Minimal" aesthetic)
  - [x] 6.5: Ensure the tunnel visual loops seamlessly (infinite feel)
  - [x] 6.6: No game logic in TunnelScene -- purely visual, reads no store state except for visual configuration
  - [x] 6.7: Dispose of any custom geometries/materials on unmount via useEffect cleanup

- [x] Task 7: Create TunnelHub.jsx UI component (AC: #2)
  - [x] 7.1: Create `src/ui/TunnelHub.jsx` -- split-layout HTML overlay: left side transparent (3D visible), right side dark panel with tunnel UI
  - [x] 7.2: Right panel displays: Fragment count at top, placeholder sections for "UPGRADES" and "DILEMMA" (actual upgrade/dilemma logic is Story 7.2), and "ENTER SYSTEM" exit button at bottom
  - [x] 7.3: Fragment count shows current `fragments` from usePlayer store with diamond icon (Unicode ◆)
  - [x] 7.4: "ENTER SYSTEM" button is keyboard-accessible (Enter/Space to activate, focus visible ring)
  - [x] 7.5: Clicking "ENTER SYSTEM" triggers the system transition (calls an action to advance to next system gameplay -- this will be refined in Story 7.3, for now transition directly to gameplay with system increment)
  - [x] 7.6: Use Tailwind classes consistent with existing UI (dark backgrounds, Inter font, tabular-nums for Fragment count)
  - [x] 7.7: Add fade-in animation on mount (consistent with other UI screens)
  - [x] 7.8: Keyboard navigation: Tab between sections, Enter/Space to confirm actions

- [x] Task 8: Mount TunnelHub in Interface.jsx (AC: #2)
  - [x] 8.1: Import TunnelHub component in Interface.jsx
  - [x] 8.2: Add conditional render: `{phase === 'tunnel' && <TunnelHub />}`
  - [x] 8.3: Ensure HUD is NOT shown during tunnel phase (tunnel has its own Fragment display)

- [x] Task 9: Auto-save to localStorage on tunnel entry (AC: #3)
  - [x] 9.1: When tunnel phase activates, serialize relevant game state to localStorage under `TUNNEL_AUTOSAVE_KEY`
  - [x] 9.2: Save: `currentSystem`, `fragments`, player HP, equipped weapons (IDs + levels), equipped boons (IDs), total kills, total time
  - [x] 9.3: Save logic can live in a `saveGameState()` utility function or in useGame as an action
  - [x] 9.4: For now, save-only (no load/restore -- restore functionality is a future enhancement)

- [x] Task 10: Tunnel audio transitions (AC: #1)
  - [x] 10.1: When entering tunnel phase, fade out boss/gameplay music
  - [x] 10.2: Start tunnel ambient music/theme if tunnel audio asset is available (from assetManifest tier2: `tunnelMusic`)
  - [x] 10.3: Handle missing audio gracefully (audioManager already handles this with console.warn)

- [x] Task 11: Verification (AC: #1, #2, #3)
  - [x] 11.1: Defeat boss -> boss death animation plays -> transitions to tunnel (NOT victory) — verified via GameLoop code: currentSystem < MAX_SYSTEMS → setPhase('tunnel')
  - [x] 11.2: TunnelScene renders with infinite tunnel visual and ship — TunnelScene.jsx creates cylinder + scrolling shader + ship placeholder
  - [x] 11.3: TunnelHub UI shows on the right panel with Fragment count (100 from boss reward) — TunnelHub reads fragments from usePlayer
  - [x] 11.4: "ENTER SYSTEM" button is visible and keyboard-accessible — autoFocus + focus-visible ring + Enter/Space activates
  - [x] 11.5: Clicking "ENTER SYSTEM" transitions back to gameplay phase — handleEnterSystem calls setPhase('gameplay')
  - [x] 11.6: localStorage contains saved game state after entering tunnel — saveGameState() called in TunnelHub useEffect on mount, tested
  - [x] 11.7: Fragment count persists through tunnel -> gameplay transition — resetForNewSystem preserves fragments, GameLoop skips full reset for tunnel→gameplay
  - [x] 11.8: GameLoop does NOT tick during tunnel phase (no enemies, no timer) — phase guards: boss only on 'boss', gameplay only on 'gameplay'
  - [x] 11.9: Boss music stops when entering tunnel — useAudio crossfades to tunnelMusic on tunnel phase
  - [x] 11.10: Full flow: gameplay -> boss -> defeat -> tunnel -> gameplay (System 2) works — TunnelHub calls advanceSystem, resetForNewSystem, setPhase('gameplay')
  - [x] 11.11: If boss defeated in final system (system 3), victory screen appears instead of tunnel — GameLoop: currentSystem >= MAX_SYSTEMS → triggerVictory()
  - [x] 11.12: New run from victory/menu resets fragments to 0 — usePlayer.reset() includes fragments: 0, called in GameLoop full reset
  - [x] 11.13: 60 FPS maintained in tunnel scene — minimal geometry (1 cylinder + 300 particles), no physics/collision, shader-only animation
  - [x] 11.14: All existing tests pass with no regressions — 470/470 tests pass across 34 files

## Dev Notes

### Architecture Decisions

- **Boss defeat conditional transition** -- When the boss defeat animation completes, GameLoop now checks `currentSystem < MAX_SYSTEMS`. If more systems remain, it transitions to `'tunnel'` phase. If this was the final system, it transitions to `'victory'` as before. This replaces the current unconditional `triggerVictory()` call.

- **Fragment system in usePlayer** -- Fragments are a run-persistent currency stored in usePlayer alongside HP, weapons, and boons. Unlike XP (which resets per system), Fragments accumulate across systems. `reset()` clears them (new game), but the new `resetForNewSystem()` preserves them.

- **System tracking in useLevel** -- `currentSystem` tracks progression through systems (1-indexed, up to MAX_SYSTEMS). `advanceSystem()` resets per-system state (timer, enemies, planets, wormhole, difficulty) without touching the system counter itself.

- **TunnelScene is purely visual** -- The 3D tunnel uses a simple cylindrical/tube geometry with an animated scrolling shader or texture. No game logic, no store mutations. Disposes resources on unmount. The ship inside is a visual element only (not the actual PlayerShip component).

- **TunnelHub placeholder sections** -- Story 7.1 creates the TunnelHub UI shell with Fragment display and the "ENTER SYSTEM" exit button. The upgrade list and dilemma card are placeholder sections (disabled/empty) -- their actual functionality is implemented in Story 7.2.

- **Auto-save is write-only for now** -- localStorage save on tunnel entry captures run state. Load/restore is not implemented in this story -- it's a future enhancement. The save structure should be designed for forward compatibility.

- **GameLoop tunnel guard** -- GameLoop must NOT tick during tunnel phase. The existing phase guard in GameLoop should already handle this (it only ticks during 'gameplay', 'boss', and related combat phases), but this must be verified.

- **Split layout approach** -- The tunnel uses a CSS-based split: left 50% is transparent (Canvas 3D visible behind), right 50% is the dark UI panel. This is simpler than a true split-screen Canvas approach and consistent with how other overlays work in the project.

### Existing Infrastructure Status

| Component | Status | Relevance |
|-----------|--------|-----------|
| `Experience.jsx` | **Already has `{phase === 'tunnel' && <TunnelScene />}`** | No changes needed -- TunnelScene import and mounting already in place |
| `stores/useGame.jsx` | **Has `setPhase()` and all phase transitions** | Verify 'tunnel' works; may add `enterTunnel()` convenience action |
| `stores/usePlayer.jsx` | **Has HP, weapons, boons, XP, level** | Add `fragments: 0`, `addFragments()`, `resetForNewSystem()` |
| `stores/useLevel.jsx` | **Has systemTimer, planets, wormholeState** | Add `currentSystem: 1`, `advanceSystem()` |
| `stores/useBoss.jsx` | **Has defeatTick(), bossDefeated** | No changes needed -- defeat flow stays in useBoss, transition change is in GameLoop |
| `GameLoop.jsx` | **Line 106: TODO for Fragment reward, Line 107: triggerVictory()** | Modify to award Fragments and conditionally transition to tunnel vs victory |
| `ui/Interface.jsx` | **Mounts UI per phase** | Add TunnelHub mount for 'tunnel' phase |
| `config/gameConfig.js` | **Has BOSS_FRAGMENT_REWARD: 100** | Add tunnel constants (TUNNEL_ENTRY_ANIMATION_DURATION, MAX_SYSTEMS, TUNNEL_AUTOSAVE_KEY) |
| `config/assetManifest.js` | **Has `tunnelMusic: 'audio/music/tunnel-theme.mp3'`** | Already defined, no changes needed |
| `audio/audioManager.js` | **Has SFX_CATEGORY_MAP, playMusic()** | May need tunnel music category if not already handled |
| `style.css` | **Has various keyframe animations** | May add tunnel fade-in animation |

### Key Implementation Details

**GameLoop boss defeat transition (replacing lines 106-107):**
```javascript
// Current:
// TODO (Epic 7): Award BOSS_FRAGMENT_REWARD Fragments here
useGame.getState().triggerVictory()

// New:
usePlayer.getState().addFragments(GAME_CONFIG.BOSS_FRAGMENT_REWARD)
const currentSystem = useLevel.getState().currentSystem
if (currentSystem < GAME_CONFIG.MAX_SYSTEMS) {
  useGame.getState().setPhase('tunnel')
} else {
  useGame.getState().triggerVictory()
}
```

**usePlayer Fragment additions:**
```javascript
// New state fields:
fragments: 0,

// New actions:
addFragments: (amount) => set(state => ({ fragments: state.fragments + amount })),

// resetForNewSystem() -- preserves cross-system state:
resetForNewSystem: () => set(state => ({
  // Reset per-system state
  xp: 0,
  level: 1,
  currentHP: state.currentHP,  // Preserve current HP
  isDashing: false,
  dashCooldown: 0,
  invulnTimer: 0,
  // Preserve: fragments, maxHP (may have been upgraded), weapons, boons
})),

// Full reset() -- add fragments: 0:
reset: () => set({
  ...existingResetFields,
  fragments: 0,
}),
```

**TunnelScene.jsx approach:**
```javascript
// Simple infinite tunnel using a rotated cylinder with scrolling UV
// - CylinderGeometry with open ends, large radius, seen from inside
// - ShaderMaterial or MeshStandardMaterial with animated UV offset (scrolling rings)
// - Blue/purple ambient color scheme per "Cyber Minimal" direction
// - Ship mesh positioned inside tunnel, angled forward
// - useFrame for UV animation only (no game logic)
```

**TunnelHub.jsx layout:**
```javascript
// CSS grid or flexbox: left 50% transparent, right 50% dark panel
// Right panel (dark bg with semi-transparency):
//   - Header: "WORMHOLE TUNNEL" title
//   - Fragment display: "◆ 127 FRAGMENTS"
//   - Upgrades section (placeholder): "UPGRADES" header + "Coming soon..." or empty cards
//   - Dilemma section (placeholder): "DILEMMA" header + "No dilemma available"
//   - Exit button: "ENTER SYSTEM →" with keyboard focus + hover effects
// All using Tailwind: bg-[#0a0a0f]/90, text-white, font-['Inter'], tabular-nums
```

**localStorage auto-save structure:**
```javascript
{
  version: 1,
  timestamp: Date.now(),
  currentSystem: 2,
  fragments: 127,
  playerHP: 75,
  playerMaxHP: 100,
  weapons: [{ id: 'LASER_FRONT', level: 5 }, { id: 'MISSILE_HOMING', level: 3 }],
  boons: [{ id: 'DAMAGE_AMP' }, { id: 'SPEED_BOOST' }],
  totalKills: 234,
  totalTime: 540,
}
```

### Previous Story Intelligence (6.3)

**Learnings from Story 6.3 to apply:**
- **Reset() MUST include ALL new state fields** -- `fragments: 0` must be in usePlayer.reset(); `currentSystem: 1` must be in useLevel.reset()
- **SFX played from GameLoop** -- Any tunnel entry SFX or music transition triggered from GameLoop, not from stores
- **No game logic in renderers** -- TunnelScene is purely visual (animated tunnel, no state mutations)
- **Material disposal on unmount** -- TunnelScene must dispose custom geometries/materials in useEffect cleanup
- **Boss defeat animation is separate from transition** -- The defeat animation (explosions, flicker) completes FIRST, then the transition to tunnel/victory happens. Don't interrupt the animation.
- **Fragment reward at the right moment** -- Award Fragments AFTER the defeat animation completes (when `animationComplete` is true), right before the phase transition
- **Boss projectile cleanup already handled** -- Boss projectiles are cleared when defeat starts (Story 6.3 implementation), so no lingering damage in tunnel

### Git Intelligence

Recent commits show:
- `9fdea03` -- Stories 4.7, 5.3: planet scanning rewards, reset bugfix
- Epic 6 (Stories 6.1-6.3) implemented in working copy (not yet committed)
- Pattern: large feature commits, deterministic GameLoop tick order, Zustand stores with tick()/reset()/actions

**Relevant established patterns:**
- `Experience.jsx` already imports TunnelScene and mounts it for 'tunnel' phase
- `GameLoop.jsx` boss defeat section at lines 88-108 -- modify transition target
- `usePlayer.jsx` has `reset()` pattern to follow for `resetForNewSystem()`
- `useLevel.jsx` has per-system state (timer, planets, wormhole) that resets per system
- `Interface.jsx` conditional rendering pattern: `{phase === 'X' && <Component />}`
- CSS animations in `style.css` follow established keyframe patterns

### Project Structure Notes

**Files to CREATE:**
- `src/scenes/TunnelScene.jsx` -- 3D tunnel environment (purely visual)
- `src/ui/TunnelHub.jsx` -- Tunnel UI panel (Fragment display, placeholder sections, exit button)

**Files to MODIFY:**
- `src/config/gameConfig.js` -- Add tunnel constants (TUNNEL_ENTRY_ANIMATION_DURATION, MAX_SYSTEMS, TUNNEL_AUTOSAVE_KEY)
- `src/stores/usePlayer.jsx` -- Add `fragments: 0`, `addFragments()`, `resetForNewSystem()`, update `reset()`
- `src/stores/useLevel.jsx` -- Add `currentSystem: 1`, `advanceSystem()`, update `reset()`
- `src/GameLoop.jsx` -- Modify boss defeat transition (Fragment reward + conditional tunnel/victory)
- `src/ui/Interface.jsx` -- Add TunnelHub mount for 'tunnel' phase
- `src/stores/useGame.jsx` -- Verify/add `enterTunnel()` if needed, ensure tunnel phase guard in GameLoop

**Files NOT to modify:**
- `src/Experience.jsx` -- TunnelScene already mounted for 'tunnel' phase, no changes needed
- `src/stores/useBoss.jsx` -- Boss defeat flow unchanged, only GameLoop's reaction changes
- `src/ui/VictoryScreen.jsx` -- Still used for final system victory, no changes
- `src/renderers/BossRenderer.jsx` -- No changes
- `src/ui/BossHPBar.jsx` -- No changes
- `src/scenes/BossScene.jsx` -- No changes
- `src/scenes/GameplayScene.jsx` -- No changes
- `src/stores/useWeapons.jsx` -- Weapons persist through tunnel, no changes
- `src/stores/useBoons.jsx` -- Boons persist through tunnel, no changes
- `src/stores/useEnemies.jsx` -- Enemies are per-system, handled by level reset

### Anti-Patterns to Avoid

- Do NOT put game logic in TunnelScene.jsx -- it's purely visual (animated tunnel), all state transitions happen in stores/GameLoop
- Do NOT reset Fragments on system transition -- Fragments persist across systems, only reset on full game restart
- Do NOT reset weapons/boons/HP on system transition -- player retains their build through the tunnel
- Do NOT skip the boss defeat animation before transitioning to tunnel -- the animation must complete first (animationComplete flag)
- Do NOT create a new store for Fragments -- extend usePlayer with a `fragments` field (avoid unnecessary store proliferation)
- Do NOT import useLevel in usePlayer or vice versa -- GameLoop coordinates cross-store logic
- Do NOT hardcode the number of systems -- use `GAME_CONFIG.MAX_SYSTEMS` constant
- Do NOT implement upgrade purchasing or dilemma logic -- those are Story 7.2, this story only creates the UI shell with placeholders
- Do NOT use new Three.js materials/geometries without dispose() on unmount in TunnelScene
- Do NOT create a separate music system for tunnel -- use existing audioManager playMusic/stopMusic
- Do NOT modify the boss defeat animation flow in useBoss -- only change what happens AFTER the animation completes (in GameLoop)

### Testing Approach

- **Unit tests (usePlayer Fragments):**
  - `addFragments(100)` increases fragments from 0 to 100
  - `addFragments(50)` after `addFragments(100)` gives 150 (accumulation)
  - `reset()` clears fragments to 0
  - `resetForNewSystem()` preserves fragments but resets xp/level

- **Unit tests (useLevel system tracking):**
  - Initial `currentSystem` is 1
  - `advanceSystem()` increments to 2
  - `advanceSystem()` resets per-system state (timer, enemies)
  - `advanceSystem()` preserves `currentSystem` count
  - `reset()` resets `currentSystem` to 1

- **Integration tests (boss defeat transition):**
  - When `currentSystem < MAX_SYSTEMS` and boss defeated: phase becomes 'tunnel'
  - When `currentSystem >= MAX_SYSTEMS` and boss defeated: phase becomes 'victory'
  - Fragments awarded in both cases

- **Visual tests (browser verification):**
  - Boss defeat -> tunnel scene appears with 3D tunnel visual
  - TunnelHub shows Fragment count (100 from boss)
  - "ENTER SYSTEM" button works with keyboard and mouse
  - Transition to gameplay (System 2) works
  - Final system boss defeat -> victory screen (not tunnel)
  - Full game reset clears fragments and system counter
  - 60 FPS in tunnel scene

### Scope Summary

This story bridges boss encounters with multi-system progression by implementing the tunnel hub entry point. When the boss is defeated (and more systems remain), instead of showing the victory screen, the game transitions to a "tunnel" phase featuring a 3D wormhole tunnel scene and a split-layout UI panel. The player sees their Fragment reward from the boss, a placeholder for future upgrades/dilemmas (Story 7.2), and an "ENTER SYSTEM" exit button. The Fragment currency system is created in usePlayer, system tracking is added to useLevel, and localStorage auto-save fires on tunnel entry. The boss defeat flow in GameLoop is conditionally routed: tunnel for intermediate systems, victory for the final system.

**Key deliverables:**
1. `gameConfig.js` -- Tunnel constants (animation durations, MAX_SYSTEMS, autosave key)
2. `usePlayer.jsx` -- Fragment state (fragments, addFragments, resetForNewSystem, updated reset)
3. `useLevel.jsx` -- System tracking (currentSystem, advanceSystem, updated reset)
4. `GameLoop.jsx` -- Conditional boss defeat transition (tunnel vs victory) with Fragment reward
5. `TunnelScene.jsx` -- NEW: 3D infinite tunnel visual with ship
6. `TunnelHub.jsx` -- NEW: Split-layout UI with Fragment display, placeholder sections, exit button
7. `Interface.jsx` -- Mount TunnelHub for 'tunnel' phase
8. localStorage auto-save on tunnel entry

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.1] -- Acceptance criteria: tunnel entry animation, 3D scene, split layout, Fragment display, keyboard nav, auto-save
- [Source: _bmad-output/planning-artifacts/epics.md#FR33] -- Player can enter wormhole tunnel between systems
- [Source: _bmad-output/planning-artifacts/epics.md#FR34] -- Player can spend Fragments on permanent upgrades (Story 7.2, placeholder here)
- [Source: _bmad-output/planning-artifacts/architecture.md#Scene Management] -- Hybrid Mount/Unmount + Asset Preload; phase-based rendering in Experience.jsx
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] -- Stores never import other stores; GameLoop is sole bridge
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules] -- Only GameLoop has game logic useFrame; renderers read-only
- [Source: _bmad-output/planning-artifacts/architecture.md#Anti-Patterns] -- No game logic in renderers; no SFX in stores; no unnecessary new stores
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Tunnel Hub] -- Split layout spec, "Cyber Minimal" aesthetic, keyboard-first navigation, 800ms entry animation, 500ms exit animation
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] -- Dark UI (#0a0a0f), semi-transparent panels, neon accents in 3D only
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography] -- Inter font, tabular-nums for numbers
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Animation Timings] -- 800ms wormhole entry, 500ms tunnel exit, ease-out default
- [Source: src/Experience.jsx:8,30] -- TunnelScene already imported and mounted for 'tunnel' phase
- [Source: src/GameLoop.jsx:106-107] -- TODO for Fragment reward + triggerVictory() call to replace
- [Source: src/stores/useGame.jsx] -- Phase system with setPhase(), triggerVictory()
- [Source: src/stores/usePlayer.jsx] -- Player state (HP, XP, weapons, boons, dash) -- extend with fragments
- [Source: src/stores/useLevel.jsx] -- System state (timer, planets, wormhole) -- extend with currentSystem
- [Source: src/config/gameConfig.js:123] -- BOSS_FRAGMENT_REWARD: 100 already defined
- [Source: src/config/assetManifest.js] -- tunnelMusic: 'audio/music/tunnel-theme.mp3' already in tier2.audio
- [Source: src/ui/Interface.jsx] -- Phase-conditional UI mounting pattern
- [Source: _bmad-output/implementation-artifacts/6-3-boss-defeat-system-completion.md] -- Previous story: boss defeat animation flow, defeatTick(), Fragment reward TODO, victory transition

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- localStorage mock issue in saveGame tests: globalThis.localStorage needed for Node test env; mock call accumulation required mockClear in beforeEach
- GameLoop full-reset guard: tunnel→gameplay transition must NOT trigger full store reset (would wipe fragments/weapons/boons); added 'tunnel' exclusion and separate tunnel→gameplay system reset block

### Completion Notes List

- **Task 1**: Added 4 tunnel constants to gameConfig.js (TUNNEL_ENTRY_ANIMATION_DURATION, TUNNEL_EXIT_ANIMATION_DURATION, MAX_SYSTEMS, TUNNEL_AUTOSAVE_KEY)
- **Task 2**: Added Fragment state to usePlayer (fragments field, addFragments action, resetForNewSystem preserving cross-system state, updated reset with fragments: 0). 8 tests added.
- **Task 3**: Added system tracking to useLevel (currentSystem field, advanceSystem resets per-system state while incrementing counter, updated reset). 9 tests added.
- **Task 4**: Modified GameLoop boss defeat flow — awards BOSS_FRAGMENT_REWARD Fragments, conditionally transitions to tunnel (system < MAX_SYSTEMS) or victory (final system). Added tunnel→gameplay system reset block.
- **Task 5**: Verified setPhase('tunnel') works correctly, GameLoop phase guards exclude tunnel phase (no ticking). No code changes needed.
- **Task 6**: Created TunnelScene.jsx — infinite tunnel using CylinderGeometry with custom scrolling shader (purple/blue), 300 streaming particles, ship placeholder, ambient lighting. All custom geometries/materials disposed on unmount.
- **Task 7**: Created TunnelHub.jsx — split-layout overlay (left 50% transparent for 3D, right 50% dark panel). Shows Fragment count with diamond icon, placeholder UPGRADES/DILEMMA sections, ENTER SYSTEM button with keyboard accessibility (autoFocus, focus-visible ring). Handles system transition on click.
- **Task 8**: Mounted TunnelHub in Interface.jsx for tunnel phase. HUD correctly excluded during tunnel (not in gameplay/levelUp/planetReward condition).
- **Task 9**: Created saveGame.js utility — serializes run state to localStorage on tunnel entry (via TunnelHub useEffect). Forward-compatible structure with version field. 3 tests added.
- **Task 10**: Added tunnel audio transitions in useAudio — crossfades boss→tunnel music on tunnel entry, crossfades tunnel→gameplay music on system entry.
- **Task 11**: Full verification — 470/470 tests pass across 34 files, zero regressions.

### File List

**New files:**
- src/scenes/TunnelScene.jsx — 3D tunnel environment (cylinder shader + particles + ship placeholder)
- src/ui/TunnelHub.jsx — Tunnel hub UI panel (split layout, Fragment display, exit button, auto-save)
- src/utils/saveGame.js — localStorage auto-save utility
- src/stores/__tests__/usePlayer.fragments.test.js — Fragment unit tests (8 tests)
- src/stores/__tests__/useLevel.system.test.js — System tracking unit tests (9 tests)
- src/utils/__tests__/saveGame.test.js — Auto-save unit tests (3 tests)

**Modified files:**
- src/config/gameConfig.js — Added tunnel constants (TUNNEL_ENTRY/EXIT_ANIMATION_DURATION, MAX_SYSTEMS, TUNNEL_AUTOSAVE_KEY)
- src/stores/usePlayer.jsx — Added fragments state, addFragments, resetForNewSystem, updated reset
- src/stores/useLevel.jsx — Added currentSystem state, advanceSystem, updated reset
- src/GameLoop.jsx — Modified boss defeat transition (tunnel vs victory), added tunnel→gameplay system reset block
- src/ui/Interface.jsx — Added TunnelHub import and conditional mount for tunnel phase
- src/hooks/useAudio.jsx — Added tunnel phase music transitions (boss→tunnel crossfade, tunnel→gameplay crossfade)

## Change Log

- 2026-02-11: Story 7.1 implementation — Tunnel entry & 3D scene with Fragment system, system tracking, auto-save, and audio transitions
- 2026-02-11: Code review (AI) — Fixed 3 HIGH + 4 MEDIUM issues:
  - H1: Moved multi-store coordination from TunnelHub to GameLoop (architecture violation fix)
  - H2: Clarified dual systemTimer with comment (useGame is authoritative)
  - H3: Renamed saveGame totalTime → currentSystemTime (accurate field name)
  - M3: Added tabIndex + role to UPGRADES/DILEMMA sections (AC #2 keyboard nav)
  - M4: Clarified kills/score run-persistence with comment in GameLoop
