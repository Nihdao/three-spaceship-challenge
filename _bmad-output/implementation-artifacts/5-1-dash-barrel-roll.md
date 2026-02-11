# Story 5.1: Dash / Barrel Roll

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to perform a dash/barrel roll that makes me temporarily invulnerable with a clear cooldown indicator,
So that I have an active survival skill that creates clutch moments.

## Acceptance Criteria

1. **Given** the player is in gameplay **When** the player presses Space (or Shift) **Then** if dash is off cooldown, the ship performs a barrel roll animation **And** the player becomes invulnerable for DASH_DURATION (0.3s from gameConfig) **And** a magenta trail visual effect displays during the dash **And** a distinctive whoosh sound plays

2. **Given** the dash completes **When** the invulnerability ends **Then** the cooldown starts (DASH_COOLDOWN, 3s from gameConfig) **And** the dash cooldown indicator in the HUD shows remaining time (radial or bar)

3. **Given** the dash cooldown finishes **When** it reaches 0 **Then** a subtle glow appears on the dash icon in HUD **And** a subtle "ding" sound plays to signal readiness

4. **Given** the dash is on cooldown **When** the player presses Space (or Shift) **Then** nothing happens (input ignored, no feedback needed)

## Tasks / Subtasks

- [x] Task 1: Add dash state to usePlayer store (AC: #1, #2, #4)
  - [x] 1.1: Add `isDashing` (bool, false), `dashTimer` (float, 0), `dashCooldownTimer` (float, 0) to usePlayer state
  - [x] 1.2: Add `startDash()` action: checks `!isDashing && dashCooldownTimer <= 0`, then sets `isDashing: true`, `dashTimer: DASH_DURATION`, `isInvulnerable: true`
  - [x] 1.3: In `tick()`, when `isDashing && dashTimer > 0`: decrement `dashTimer` by delta. When `dashTimer <= 0`: set `isDashing: false`, `dashCooldownTimer: DASH_COOLDOWN`, end invulnerability only if `invulnerabilityTimer` has also expired (dash invulnerability should not cancel damage i-frames)
  - [x] 1.4: In `tick()`, when `!isDashing && dashCooldownTimer > 0`: decrement `dashCooldownTimer` by delta, clamp to 0
  - [x] 1.5: In `reset()`, reset `isDashing: false`, `dashTimer: 0`, `dashCooldownTimer: 0`

- [x] Task 2: Add dash input handling in GameLoop (AC: #1, #4)
  - [x] 2.1: After reading input from useControlsStore, check `input.dash` (already mapped to Space key)
  - [x] 2.2: Call `usePlayer.getState().startDash()` when `input.dash` is true (guard inside startDash prevents repeat calls)
  - [x] 2.3: Edge detection: use a `prevDashRef` to only trigger on press (transition false→true), not while held

- [x] Task 3: Add Shift key to dash input mapping (AC: #1)
  - [x] 3.1: In `src/index.jsx`, add `"ShiftLeft"` and `"ShiftRight"` to the dash keys array: `{ name: "dash", keys: ["Space", "ShiftLeft", "ShiftRight"] }`

- [x] Task 4: Implement barrel roll animation in PlayerShip (AC: #1)
  - [x] 4.1: In `PlayerShip.jsx`, read `isDashing` and `dashTimer` from usePlayer store in existing useFrame
  - [x] 4.2: When `isDashing`, apply a full 360-degree roll (Z-axis rotation on `bankRef`) over DASH_DURATION using progress `(DASH_DURATION - dashTimer) / DASH_DURATION * Math.PI * 2`
  - [x] 4.3: When not dashing, resume normal banking animation (existing behavior)

- [x] Task 5: Add dash invulnerability visual effect on ship (AC: #1)
  - [x] 5.1: When `isDashing`, apply magenta emissive tint on cloned scene materials (emissive color boost)
  - [x] 5.2: Distinct magenta tint differentiates dash from damage i-frames
  - [x] 5.3: Simple approach — material emissive property, no new shaders

- [x] Task 6: Add magenta trail effect during dash (AC: #1)
  - [x] 6.1: Stretched semi-transparent plane behind ship, reused mesh (no per-frame allocation)
  - [x] 6.2: Trail color: magenta (`#ff00ff` from DASH_TRAIL_COLOR config)
  - [x] 6.3: Trail fades out using opacity based on remaining dashTimer, hidden when dash ends
  - [x] 6.4: Performance: single reused mesh, visibility toggle, no GC pressure

- [x] Task 7: Add dash cooldown indicator to HUD (AC: #2, #3)
  - [x] 7.1: In `HUD.jsx`, subscribe to `dashCooldownTimer` and `isDashing` from usePlayer
  - [x] 7.2: Circular indicator in bottom-right area next to weapon slots
  - [x] 7.3: When cooldown active: shows countdown number in orange (#ffaa00)
  - [x] 7.4: When dash ready: shows "RDY" in cyan (#00ffcc) with subtle glow
  - [x] 7.5: Label "SPACE" below indicator
  - [x] 7.6: Uses `#ffaa00` for cooldown state, `#00ffcc` for ready state

- [x] Task 8: Add dash sound effects (AC: #1, #3)
  - [x] 8.1: Add `'dash-whoosh'` entry to `SFX_CATEGORY_MAP` in audioManager.js with category `'sfxAction'`
  - [x] 8.2: Add `'dash-ready'` entry to `SFX_CATEGORY_MAP` with category `'ui'`
  - [x] 8.3: Add audio file paths to `assetManifest.js` gameplay section: `dashWhoosh` and `dashReady`
  - [x] 8.4: In GameLoop, play `'dash-whoosh'` when `startDash()` succeeds
  - [x] 8.5: Detect cooldown-just-finished transition via `prevDashCooldownRef` and play `'dash-ready'`
  - [x] 8.6: Audio files not created (no audio tools available) — consistent with existing SFX pattern (all other SFX files also missing from public/audio/sfx/, gracefully handled by audioManager)

- [x] Task 9: Add gameConfig constants if missing (AC: #1, #2)
  - [x] 9.1: Verified `DASH_COOLDOWN: 3` and `DASH_DURATION: 0.3` already exist in GAME_CONFIG
  - [x] 9.2: Added `DASH_TRAIL_COLOR: '#ff00ff'` for magenta trail
  - [x] 9.3: No other constants needed

- [x] Task 10: Verification (AC: #1, #2, #3, #4)
  - [x] 10.6: Take damage during dash → no HP loss (invulnerable) — verified by unit test
  - [x] 10.7: Dash during existing damage invulnerability → invulnerability continues — verified by unit test
  - [x] 10.9: Run full test suite — 366/366 tests pass, no regressions
  - [ ] 10.1-10.5, 10.8: Visual/browser verification — requires manual testing

## Dev Notes

### Architecture Decisions

- **Dash state in usePlayer store, NOT a new store** — Architecture anti-pattern explicitly says "do not create a new Zustand store for a one-off feature — extend existing stores instead." `isDashing`, `dashTimer`, `dashCooldownTimer` belong in usePlayer alongside `isInvulnerable`, `invulnerabilityTimer`, and `contactDamageCooldown`. The dash is fundamentally a player state.

- **Barrel roll animation in PlayerShip.jsx, NOT a separate component** — PlayerShip already has a useFrame reading `rotation` and `bankAngle` from usePlayer. Adding the barrel roll animation here (conditional Z-axis rotation on bankRef during `isDashing`) is the minimal, correct approach. This is a visual-only useFrame, explicitly allowed per architecture.

- **Dash input via edge detection in GameLoop** — The `dash` key in useControlsStore is a boolean that stays true while held. The GameLoop must detect the press edge (false→true transition) to trigger a single dash per press, not continuously call startDash(). Use a `prevDashRef` ref for this.

- **Invulnerability interaction** — The dash grants its own invulnerability for DASH_DURATION (0.3s). When the dash ends, invulnerability should continue ONLY if the player also has active damage i-frames (`invulnerabilityTimer > 0`). If not, invulnerability ends. This avoids the dash canceling damage i-frames or damage i-frames extending the dash invulnerability.

- **Trail effect approach** — Keep it minimal for Tier 2. A simple stretched semi-transparent mesh (elongated plane or cylinder) positioned behind the ship during dash, colored magenta, is sufficient. Avoid particle system complexity if a simple mesh achieves the visual goal. Alternative: use 3-4 fading ghost copies of the ship position from previous frames.

- **No post-processing for trail** — Consistent with Story 4.6 decision: the `effects/` directory is empty. Use mesh-based or overlay-based visuals, not EffectComposer.

### Existing Infrastructure Status

| Component | Status | Relevance |
|-----------|--------|-----------|
| `useControlsStore.jsx` | **Has `dash: false`** | Input state already exists — Space key sets this to true |
| `useHybridControls.jsx` | **Syncs `dash`** | `keyboardDash` already synced from Drei to store |
| `index.jsx` | **Has `dash: ["Space"]`** | Key mapping exists — need to add `"ShiftLeft"`, `"ShiftRight"` |
| `gameConfig.js` | **Has `DASH_COOLDOWN: 3`, `DASH_DURATION: 0.3`** | Constants already defined |
| `usePlayer.jsx` | **No dash state** | Need to add `isDashing`, `dashTimer`, `dashCooldownTimer`, `startDash()`, tick decay, reset |
| `GameLoop.jsx` | **No dash logic** | Need to add dash input edge detection + startDash() call + SFX triggers |
| `PlayerShip.jsx` | **Has bankRef** | bankRef on Z-axis rotation — barrel roll adds a full 360° Z rotation during dash |
| `HUD.jsx` | **No dash indicator** | Need to add cooldown indicator in bottom-right area |
| `audioManager.js` | **No dash entries** | Need to add `'dash-whoosh'` and `'dash-ready'` to SFX_CATEGORY_MAP |
| `assetManifest.js` | **No dash audio** | Need to add dash audio paths to gameplay section |

### Key Implementation Details

**usePlayer.startDash():**
```javascript
startDash: () => {
  const state = get()
  if (state.isDashing) return
  if (state.dashCooldownTimer > 0) return
  set({
    isDashing: true,
    dashTimer: GAME_CONFIG.DASH_DURATION,
    isInvulnerable: true,
  })
},
```

**usePlayer.tick() — dash timer decay (add after existing invulnerability timer section):**
```javascript
// --- Dash timer ---
let isDashing = state.isDashing
let dashTimer = state.dashTimer
let dashCooldownTimer = state.dashCooldownTimer

if (isDashing && dashTimer > 0) {
  dashTimer = Math.max(0, dashTimer - delta)
  if (dashTimer <= 0) {
    isDashing = false
    dashCooldownTimer = GAME_CONFIG.DASH_COOLDOWN
    // End invulnerability ONLY if damage i-frames also expired
    if (invulnerabilityTimer <= 0) {
      isInvulnerable = false
    }
  }
} else if (!isDashing && dashCooldownTimer > 0) {
  dashCooldownTimer = Math.max(0, dashCooldownTimer - delta)
}
```

**GameLoop — dash input edge detection (add after input reading, section 1):**
```javascript
// Dash input (edge detection: trigger only on press, not hold)
if (input.dash && !prevDashRef.current) {
  const dashResult = usePlayer.getState().startDash()
  // startDash returns undefined but modifies state — check isDashing after
  if (usePlayer.getState().isDashing) {
    playSFX('dash-whoosh')
  }
}
prevDashRef.current = input.dash
```

**PlayerShip.jsx — barrel roll (modify existing useFrame):**
```javascript
useFrame(() => {
  if (!groupRef.current || !bankRef.current) return
  const { position, rotation, bankAngle, isDashing, dashTimer } = usePlayer.getState()

  groupRef.current.position.set(position[0], position[1], position[2])
  groupRef.current.rotation.set(0, Math.PI - rotation, 0)

  if (isDashing) {
    // Full 360° roll over DASH_DURATION
    const progress = (GAME_CONFIG.DASH_DURATION - dashTimer) / GAME_CONFIG.DASH_DURATION
    bankRef.current.rotation.set(0, 0, progress * Math.PI * 2)
  } else {
    bankRef.current.rotation.set(0, 0, bankAngle)
  }
})
```

**HUD dash indicator (add in bottom-right area near weapon slots):**
```jsx
{/* Dash cooldown indicator — bottom-right, above weapons */}
<div className="flex flex-col items-center gap-0.5">
  <div
    className="border rounded-full flex items-center justify-center"
    style={{
      width: 'clamp(36px, 3.6vw, 48px)',
      height: 'clamp(36px, 3.6vw, 48px)',
      borderColor: dashCooldownTimer > 0 ? '#ffaa00' : '#00ffcc',
      backgroundColor: dashCooldownTimer > 0 ? '#ffaa0015' : '#00ffcc20',
    }}
  >
    <span style={{ fontSize: 'clamp(9px, 0.9vw, 12px)', color: dashCooldownTimer > 0 ? '#ffaa00' : '#00ffcc' }}>
      {dashCooldownTimer > 0 ? Math.ceil(dashCooldownTimer) : 'RDY'}
    </span>
  </div>
  <span className="text-game-text-muted" style={{ fontSize: 'clamp(8px, 0.8vw, 10px)' }}>
    SPACE
  </span>
</div>
```

### Previous Story Intelligence (4.6)

**Learnings from Story 4.6 and earlier epics to apply:**
- **Timer decay pattern** — usePlayer.tick() already decrements `invulnerabilityTimer`, `contactDamageCooldown`, `damageFlashTimer`, `cameraShakeTimer` using `Math.max(0, timer - delta)`. Use the exact same pattern for `dashTimer` and `dashCooldownTimer`.
- **Camera shake is separate from dash** — Camera shake is triggered by `takeDamage()` only. Dash does not trigger camera shake. Keep these systems independent.
- **isInvulnerable interaction** — `takeDamage()` checks `isInvulnerable` as its first guard. When dash sets `isInvulnerable: true`, all damage is automatically blocked. No changes needed to `takeDamage()`.
- **Audio pattern** — SFX are played from GameLoop (not from store actions). Follow the same pattern: play `'dash-whoosh'` from GameLoop after confirming startDash() succeeded.
- **HTML overlay for HUD elements** — Consistent with existing HUD approach. Dash cooldown indicator should be an HTML div, not a 3D element.
- **Code review fixes from 4.6** — Avoid corrupting persistent refs (like `smoothedPosition`). If the barrel roll temporarily overrides `bankAngle`, make sure normal banking resumes cleanly when dash ends.

### Git Intelligence

Recent commits show established patterns:
- `eb45e9a` — Story 4.1: Main menu, timer, kill counter, phase management
- Stories 4.2-4.6 are implemented (visual damage feedback, audio, HUD, game over, victory)
- All previous stores follow the `tick()` + action + `reset()` pattern
- GameLoop follows deterministic tick order with sections numbered 1-9
- SFX are triggered from GameLoop, not from stores

**Relevant code patterns from recent work:**
- Input edge detection pattern not yet used — this is new for dash. Use a `useRef(false)` for `prevDashRef`
- `usePlayer.getState()` already called multiple times in GameLoop — add dash logic after player movement (section 2) or as a new sub-section
- `PlayerShip.jsx` useFrame reads from `usePlayer.getState()` — add `isDashing` and `dashTimer` to the destructured read

### Project Structure Notes

**Files to MODIFY:**
- `src/stores/usePlayer.jsx` — Add `isDashing`, `dashTimer`, `dashCooldownTimer`, `startDash()`, tick decay, reset
- `src/GameLoop.jsx` — Add dash input edge detection (`prevDashRef`), call `startDash()`, play SFX, detect cooldown finish
- `src/renderers/PlayerShip.jsx` — Add barrel roll animation during `isDashing`
- `src/ui/HUD.jsx` — Add dash cooldown indicator (bottom-right)
- `src/audio/audioManager.js` — Add `'dash-whoosh'` and `'dash-ready'` to `SFX_CATEGORY_MAP`
- `src/config/assetManifest.js` — Add dash audio asset paths
- `src/config/gameConfig.js` — Add `DASH_TRAIL_COLOR` (DASH_COOLDOWN and DASH_DURATION already exist)
- `src/index.jsx` — Add `"ShiftLeft"`, `"ShiftRight"` to dash keys array

**Files to CREATE:**
- `public/audio/sfx/dash-whoosh.mp3` — Placeholder dash sound effect (source or create)
- `public/audio/sfx/dash-ready.mp3` — Placeholder ready ding sound (source or create)

**Files NOT to modify:**
- `src/stores/useControlsStore.jsx` — Already has `dash: false`, no changes needed
- `src/hooks/useHybridControls.jsx` — Already syncs `dash` from Drei to store, no changes needed
- `src/hooks/usePlayerCamera.jsx` — Camera shake is independent from dash, no changes needed
- `src/Experience.jsx` — Scene routing unchanged
- `src/ui/Interface.jsx` — HUD already rendered during gameplay
- `src/stores/useGame.jsx` — No dash-related state
- `src/scenes/GameplayScene.jsx` — PlayerShip already mounted here

### Anti-Patterns to Avoid

- Do NOT create a new Zustand store (e.g., "useDash") — extend usePlayer, which already owns invulnerability state
- Do NOT use `useEffect` or `setTimeout` for dash timing — use timer decay in `usePlayer.tick()` (deterministic, consistent with existing pattern)
- Do NOT continuously trigger `startDash()` while Space is held — use edge detection (false→true transition) in GameLoop
- Do NOT modify `takeDamage()` — it already checks `isInvulnerable`, which dash sets to true. No changes needed
- Do NOT create heavy particle systems for the trail — keep it simple (mesh-based or a few fading ghosts)
- Do NOT add post-processing effects for the trail — `effects/` directory is empty; use mesh-based visuals
- Do NOT import usePlayer inside PlayerShip at module level for game logic — use `getState()` inline in useFrame (existing pattern)
- Do NOT add the dash indicator as a 3D element — use HTML overlay in HUD (consistent with all other HUD elements)
- Do NOT modify the camera during dash — no camera zoom or special camera effect needed; keep camera behavior independent

### Testing Approach

- **Unit tests (usePlayer store):**
  - `startDash()` sets `isDashing: true`, `dashTimer: DASH_DURATION`, `isInvulnerable: true`
  - `startDash()` during cooldown does nothing (returns early)
  - `startDash()` while already dashing does nothing
  - `tick()` decrements `dashTimer` during dash
  - `tick()` transitions from dashing to cooldown when `dashTimer` reaches 0
  - `tick()` decrements `dashCooldownTimer` when not dashing
  - `tick()` clamps timers to 0
  - `takeDamage()` during dash is blocked (invulnerable)
  - `reset()` clears all dash state
  - Invulnerability persists if damage i-frames active when dash ends

- **Visual tests (browser verification):**
  - Space → barrel roll animation plays
  - Space → ship becomes invulnerable (take no damage from enemies)
  - Space → magenta trail visible
  - Space → whoosh sound plays
  - After dash → cooldown indicator appears in HUD
  - Cooldown finishes → indicator shows ready, ding sound plays
  - Space during cooldown → nothing happens
  - 60 FPS maintained during all dash effects
  - No regressions on existing test suite

### Scope Summary

This story adds the dash/barrel roll mechanic: pressing Space (or Shift) triggers a 0.3s barrel roll animation with temporary invulnerability, a magenta trail effect, and a distinctive whoosh sound. After the dash, a 3s cooldown starts with a visible HUD indicator. When the cooldown finishes, a subtle ding sound plays and the indicator shows a ready state. The implementation extends usePlayer with dash state (`isDashing`, `dashTimer`, `dashCooldownTimer`, `startDash()`), adds edge-detected input in GameLoop, adds barrel roll animation to PlayerShip, adds a cooldown indicator to HUD, and registers two new SFX entries.

**Key deliverables:**
1. `usePlayer.jsx` — isDashing, dashTimer, dashCooldownTimer state + startDash() action + tick decay + reset
2. `GameLoop.jsx` — Dash input edge detection + startDash() call + SFX triggers (whoosh + ready)
3. `PlayerShip.jsx` — 360-degree barrel roll animation during isDashing
4. `HUD.jsx` — Dash cooldown indicator (bottom-right, radial/bar with key hint)
5. `audioManager.js` — dash-whoosh and dash-ready SFX entries
6. `assetManifest.js` — Dash audio asset paths
7. `index.jsx` — Add ShiftLeft/ShiftRight to dash key mapping
8. Trail effect — Simple magenta visual behind ship during dash
9. gameConfig.js — DASH_TRAIL_COLOR constant (DASH_COOLDOWN and DASH_DURATION already exist)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] — Acceptance criteria: barrel roll animation, invulnerability 0.3s, magenta trail, whoosh sound, 3s cooldown, HUD indicator, ding on ready
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — Stores never import other stores; extend existing stores for one-off features
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules] — Only GameLoop has high-priority useFrame; renderer useFrames for visual sync are allowed
- [Source: _bmad-output/planning-artifacts/architecture.md#Constants & Configuration] — DASH_COOLDOWN: 3, DASH_DURATION: 0.3 already in gameConfig template
- [Source: _bmad-output/planning-artifacts/architecture.md#Anti-Patterns] — "Creating a new Zustand store for a one-off feature" is anti-pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — "Le dash pourrait être oublié → besoin de feedback visuel fort quand disponible"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — `--color-cooldown: #ffaa00` for dash cooldown indicator
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Audio Patterns] — Actions joueur (tir, dash) at 80% volume
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#HUD Composition] — "ProgressBar (HP, XP) + timer + minimap + dash CD + weapon slots"
- [Source: src/stores/usePlayer.jsx] — Existing tick() timer decay pattern (invulnerabilityTimer, contactDamageCooldown, damageFlashTimer)
- [Source: src/stores/useControlsStore.jsx] — `dash: false` already defined
- [Source: src/hooks/useHybridControls.jsx] — keyboardDash already synced to store
- [Source: src/index.jsx:17] — dash key mapping: `["Space"]` — add ShiftLeft/ShiftRight
- [Source: src/GameLoop.jsx] — Deterministic tick order, SFX played from GameLoop
- [Source: src/renderers/PlayerShip.jsx] — bankRef for Z-axis rotation, useFrame reads from usePlayer
- [Source: src/ui/HUD.jsx] — Existing layout: HP top-left, timer top-center, XP bottom-left, weapons bottom-right
- [Source: src/config/gameConfig.js:8-9] — DASH_COOLDOWN: 3, DASH_DURATION: 0.3 already defined
- [Source: src/audio/audioManager.js] — SFX_CATEGORY_MAP pattern, playSFX() function
- [Source: src/config/assetManifest.js] — gameplay.audio section for SFX assets
- [Source: _bmad-output/implementation-artifacts/4-6-visual-damage-feedback.md] — Previous story patterns: timer decay, HTML overlay, visual feedback approach

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Task 1 RED phase: 13 tests created, all failing (startDash not a function)
- Task 1 GREEN phase: Reset() missing dash fields caused test pollution across test cases
- Task 1 fix: Large-delta tick handling — leftover delta after dash ends applied to cooldown timer

### Completion Notes List

- All 10 tasks implemented
- 13 dash-specific unit tests pass
- Full suite: 366/366 tests pass, 0 regressions
- Audio placeholder files not created (no ffmpeg/sox/lame available) — consistent with project pattern (all SFX files missing, gracefully handled)
- Visual/browser verification items (10.1-10.5, 10.8) require manual testing

### File List

**Modified:**
- `src/stores/usePlayer.jsx` — isDashing, dashTimer, dashCooldownTimer state + startDash() action + tick decay + reset
- `src/GameLoop.jsx` — Dash input edge detection (prevDashRef) + startDash() call + SFX triggers (whoosh + ready)
- `src/renderers/PlayerShip.jsx` — 360-degree barrel roll animation + magenta emissive tint + trail mesh
- `src/ui/HUD.jsx` — Dash cooldown indicator (circular, bottom-right next to weapons)
- `src/audio/audioManager.js` — dash-whoosh (sfxAction) and dash-ready (ui) in SFX_CATEGORY_MAP
- `src/config/assetManifest.js` — dashWhoosh and dashReady audio paths in gameplay section
- `src/config/gameConfig.js` — DASH_TRAIL_COLOR constant
- `src/index.jsx` — ShiftLeft/ShiftRight added to dash key mapping
- `src/hooks/useAudio.jsx` — dash-whoosh and dash-ready added to SFX_MAP

**Created:**
- `src/stores/__tests__/usePlayer.dash.test.js` — 13 unit tests for dash mechanics

## Senior Developer Review (AI)

**Reviewer:** Adam — 2026-02-10
**Outcome:** Approved with fixes applied

### Findings

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| H2 | HIGH | 6 files modified in git but not in story File List (Experience.jsx, usePlayerCamera.jsx, style.css, Interface.jsx, LevelUpModal.jsx, MainMenu.jsx) — these are uncommitted changes from Epic 4 stories, not Story 5.1 changes | Noted (git hygiene) |
| M1 | MEDIUM | Emissive restore in PlayerShip assumes no other system modifies mesh emissives — fragile for future extensions | Fixed (comment added) |
| M2 | MEDIUM | Trail mesh was child of bankRef — rotated 360° with barrel roll instead of staying horizontal behind ship | **Fixed** (moved to groupRef) |
| M3 | MEDIUM | No integration tests for GameLoop dash logic (edge detection, SFX triggers) — store tests cover core mechanics | Noted (acceptable for Tier 2) |
| L1 | LOW | Dash indicator shows orange during active dash — could use magenta for visual consistency | Noted |
| L2 | LOW | Ready state glow is subtle (boxShadow 8px 60% opacity) — matches AC "subtle glow" wording | Noted |

### Fixes Applied

1. **PlayerShip.jsx** — Moved trail `<mesh>` from inside `<group ref={bankRef}>` to inside `<group ref={groupRef}>` so the trail stays horizontal during barrel roll instead of spinning with the ship
2. **PlayerShip.jsx** — Added comment on emissive restore assumption for future maintainability
3. Full test suite: 366/366 pass after fixes, 0 regressions

### Change Log

- 2026-02-10: Code review — M2 trail rotation bug fixed, M1 comment added, story status → done
