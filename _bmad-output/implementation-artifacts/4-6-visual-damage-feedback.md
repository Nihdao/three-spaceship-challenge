# Story 4.6: Visual Damage Feedback

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see screen flash and shake when I take damage,
So that hits feel impactful and I have immediate visual confirmation of danger.

## Acceptance Criteria

1. **Given** the player takes damage **When** the damage is applied **Then** a brief red screen flash appears (100ms, subtle opacity) **And** the camera shakes briefly (100-200ms, linear easing, small amplitude) **And** the feedback is immediate (< 50ms after damage event)

2. **Given** the player takes critical damage (HP drops below 25%) **When** low HP state activates **Then** a persistent red vignette effect appears at screen edges **And** the vignette pulses (500ms loop, ease-in-out)

3. **Given** visual effects are rendering **When** multiple damage events occur rapidly **Then** effects stack gracefully without becoming disorienting **And** performance remains at 60 FPS

## Tasks / Subtasks

- [x] Task 1: Add damage flash state to usePlayer store (AC: #1)
  - [x]1.1: Add `damageFlashTimer` field to usePlayer state (initial: 0), decremented in `tick()` each frame
  - [x]1.2: In `takeDamage()`, set `damageFlashTimer` to `DAMAGE_FLASH_DURATION` (100ms = 0.1s) from gameConfig
  - [x]1.3: In `tick()`, decrement `damageFlashTimer` by delta, clamp to 0
  - [x]1.4: In `reset()`, reset `damageFlashTimer` to 0

- [x] Task 2: Add camera shake state to usePlayer store (AC: #1)
  - [x]2.1: Add `cameraShakeTimer` field to usePlayer state (initial: 0)
  - [x]2.2: Add `cameraShakeIntensity` field to usePlayer state (initial: 0)
  - [x]2.3: In `takeDamage()`, set `cameraShakeTimer` to `CAMERA_SHAKE_DURATION` (0.15s) and `cameraShakeIntensity` to `CAMERA_SHAKE_AMPLITUDE` from gameConfig
  - [x]2.4: In `tick()`, decrement `cameraShakeTimer` by delta, clamp to 0; set intensity to 0 when timer expires
  - [x]2.5: In `reset()`, reset `cameraShakeTimer` and `cameraShakeIntensity` to 0

- [x] Task 3: Implement camera shake in usePlayerCamera (AC: #1, #3)
  - [x]3.1: In `usePlayerCamera`, read `cameraShakeTimer` and `cameraShakeIntensity` from usePlayer store each frame
  - [x]3.2: When `cameraShakeTimer > 0`, apply random offset to camera position (X and Z axes only — Y stays fixed for top-down) proportional to remaining timer (linear decay)
  - [x]3.3: Use deterministic pseudo-random or sine-based shake to avoid true randomness per frame (consistent feel)
  - [x]3.4: Ensure shake amplitude is small (1-2 world units max) to avoid disorientation

- [x] Task 4: Implement red damage flash overlay in HUD (AC: #1, #3)
  - [x]4.1: In HUD.jsx, subscribe to `damageFlashTimer` from usePlayer store
  - [x]4.2: When `damageFlashTimer > 0`, render a full-screen red overlay div with opacity proportional to remaining timer (fades out as timer decreases)
  - [x]4.3: Use `pointer-events-none` and `fixed inset-0` to cover screen without blocking interaction
  - [x]4.4: Color: `game-danger` (#ff3333) at max ~20% opacity (subtle, not blinding)
  - [x]4.5: Ensure multiple rapid damage events restart the timer (re-flash) without stacking opacity

- [x] Task 5: Add gameConfig constants (AC: #1)
  - [x]5.1: Add `DAMAGE_FLASH_DURATION: 0.1` (seconds) to GAME_CONFIG
  - [x]5.2: Add `CAMERA_SHAKE_DURATION: 0.15` (seconds) to GAME_CONFIG
  - [x]5.3: Add `CAMERA_SHAKE_AMPLITUDE: 1.5` (world units) to GAME_CONFIG

- [x] Task 6: Verify low HP vignette already works (AC: #2)
  - [x]6.1: Confirm HUD.jsx already renders low HP vignette when `currentHP / maxHP < 0.25` (via `shouldPulseHP`)
  - [x]6.2: Confirm `vignettePulse` keyframe animation exists in style.css
  - [x]6.3: If already working, mark this task as no-op (AC #2 is already satisfied by Story 4.2)

- [x] Task 7: Verification (AC: #1, #2, #3)
  - [x]7.1: Take damage → verify red flash appears and fades out over ~100ms
  - [x]7.2: Take damage → verify camera shakes briefly and settles
  - [x]7.3: Take rapid consecutive damage → verify effects restart cleanly without disorientation
  - [x]7.4: HP drops below 25% → verify red vignette pulses persistently (already from Story 4.2)
  - [x]7.5: Verify 60 FPS maintained during damage effects
  - [x]7.6: Run full test suite — no regressions

## Dev Notes

### Architecture Decisions

- **Damage flash state in usePlayer store, NOT a new store** — The Architecture anti-pattern explicitly says "do not create a new Zustand store for a one-off feature — extend existing stores instead." `damageFlashTimer` and `cameraShakeTimer` belong in usePlayer since they're triggered by `takeDamage()` and decayed in `tick()`. This follows the existing pattern of `invulnerabilityTimer` and `contactDamageCooldown` already in usePlayer.

- **Camera shake in usePlayerCamera, NOT a separate component** — The camera hook already runs a useFrame that sets camera position each frame. Adding shake offset here is the minimal, correct approach. Creating a separate CameraShake component would violate the architecture principle that only GameLoop has high-priority useFrame for game logic; camera interpolation useFrame is explicitly allowed in renderers/camera hooks.

- **Red flash as HTML overlay in HUD, NOT post-processing** — The `effects/` directory is empty. Adding a post-processing pass (EffectComposer + custom shader) for a simple red flash is over-engineering. A `<div>` with red background and opacity transition achieves the same visual result at zero GPU cost. This is consistent with the existing low HP vignette (already an HTML div with `boxShadow` in HUD.jsx).

- **No event system needed** — `takeDamage()` directly sets the timer values. The HUD reads them via Zustand subscription. The camera hook reads them via `getState()` in its existing useFrame. No pubsub, no events, no callbacks.

- **Graceful stacking (AC #3)** — When multiple damage events occur rapidly, `takeDamage()` simply resets the timers to their max duration. Since the player has invulnerability frames (0.5s) and contact damage cooldown (0.5s), the minimum interval between damage events is 0.5s, which is longer than the flash (0.1s) and shake (0.15s) durations. So overlap is rare, and resetting the timer handles it cleanly.

### Existing Infrastructure Status

| Component | Status | Relevance |
|-----------|--------|-----------|
| `usePlayer.jsx` | **Implemented** | Already has `takeDamage()`, `tick()`, `reset()`, `invulnerabilityTimer`, `contactDamageCooldown` — add `damageFlashTimer`, `cameraShakeTimer`, `cameraShakeIntensity` |
| `usePlayerCamera.jsx` | **Implemented** | Already has useFrame setting camera position each frame — add shake offset |
| `HUD.jsx` | **Implemented** | Already has low HP vignette div — add damage flash overlay div |
| `style.css` | **Implemented** | Already has `vignettePulse` keyframe for low HP — no new keyframes needed for damage flash (opacity driven by JS timer) |
| `gameConfig.js` | **Implemented** | Add `DAMAGE_FLASH_DURATION`, `CAMERA_SHAKE_DURATION`, `CAMERA_SHAKE_AMPLITUDE` |
| `GameLoop.jsx` | **Implemented** | No changes needed — `takeDamage()` already called in section 7d, timer decay happens in usePlayer.tick() |
| `GameplayScene.jsx` | **Implemented** | No changes needed |
| `effects/` | **Empty** | Not used — HTML overlay approach avoids post-processing setup |

### Key Implementation Details

**Camera shake pattern (usePlayerCamera.jsx):**
```javascript
// Inside existing useFrame callback, after smoothed position calculation:
const { cameraShakeTimer, cameraShakeIntensity } = usePlayer.getState()
if (cameraShakeTimer > 0) {
  // Linear decay: intensity fades as timer approaches 0
  const t = cameraShakeTimer / GAME_CONFIG.CAMERA_SHAKE_DURATION
  const amp = cameraShakeIntensity * t
  // Sine-based deterministic shake (avoids Math.random() per frame)
  const elapsed = state.clock.elapsedTime
  const shakeX = Math.sin(elapsed * 37.5) * amp
  const shakeZ = Math.cos(elapsed * 53.1) * amp
  smoothedPosition.current.x += shakeX
  smoothedPosition.current.z += shakeZ
}
```

**Damage flash overlay (HUD.jsx):**
```jsx
{/* Damage flash — red overlay that fades out */}
{damageFlashTimer > 0 && (
  <div
    className="fixed inset-0 pointer-events-none bg-game-danger"
    style={{
      opacity: 0.2 * (damageFlashTimer / GAME_CONFIG.DAMAGE_FLASH_DURATION),
    }}
  />
)}
```

**usePlayer.takeDamage() additions:**
```javascript
takeDamage: (amount) => {
  const state = get()
  if (state.isInvulnerable) return
  if (state.contactDamageCooldown > 0) return
  set({
    currentHP: Math.max(0, state.currentHP - amount),
    isInvulnerable: true,
    invulnerabilityTimer: GAME_CONFIG.INVULNERABILITY_DURATION,
    lastDamageTime: Date.now(),
    contactDamageCooldown: GAME_CONFIG.CONTACT_DAMAGE_COOLDOWN,
    // NEW: Visual damage feedback
    damageFlashTimer: GAME_CONFIG.DAMAGE_FLASH_DURATION,
    cameraShakeTimer: GAME_CONFIG.CAMERA_SHAKE_DURATION,
    cameraShakeIntensity: GAME_CONFIG.CAMERA_SHAKE_AMPLITUDE,
  })
},
```

### Previous Story Intelligence (4.5)

**Learnings from Story 4.5 to apply:**
- **audioManager pattern** — SFX is already wired in GameLoop section 7d: `playSFX('damage-taken')` fires after `takeDamage()`. Visual feedback should trigger from the same `takeDamage()` call, not from a separate detection mechanism. This is already naturally handled since `takeDamage()` sets the flash/shake timers.
- **Test approach** — Logic-only tests (no @testing-library/react). Test `takeDamage()` sets `damageFlashTimer` and `cameraShakeTimer`, test `tick()` decrements them, test `shouldPulseHP()` helper.
- **Code review fixes from 4.5** — Pay attention to volume/timing. Audio feedback (damage-taken SFX) already fires < 50ms after damage. Visual feedback (flash + shake) must also be < 50ms, which is guaranteed since `takeDamage()` sets the values synchronously and both HUD (React re-render) and camera (next useFrame) pick them up within 1-2 frames.

### Git Intelligence

Recent commits show established patterns:
- `eb45e9a` — Story 4.1: Main menu, timer, kill counter, phase management
- Stories 4.2-4.5 are implemented but not yet committed (in working tree)

**Relevant code patterns from recent work:**
- usePlayer store: `tick()` decrements timers (`contactDamageCooldown`, `invulnerabilityTimer`) — add `damageFlashTimer` and `cameraShakeTimer` decay using the exact same pattern
- HUD.jsx: Subscribes to individual store selectors for performance — add `damageFlashTimer` selector
- usePlayerCamera.jsx: `useFrame` reads from usePlayer via `getState()` — add shake offset using same pattern
- gameConfig.js: All constants centralized — add feedback constants here

### Project Structure Notes

**Files to MODIFY:**
- `src/stores/usePlayer.jsx` — Add `damageFlashTimer`, `cameraShakeTimer`, `cameraShakeIntensity` state + timer decay in tick() + set in takeDamage() + reset in reset()
- `src/hooks/usePlayerCamera.jsx` — Add camera shake offset in existing useFrame after smooth position calculation
- `src/ui/HUD.jsx` — Add damage flash overlay div (subscribe to damageFlashTimer)
- `src/config/gameConfig.js` — Add `DAMAGE_FLASH_DURATION`, `CAMERA_SHAKE_DURATION`, `CAMERA_SHAKE_AMPLITUDE`

**Files NOT to modify:**
- `src/GameLoop.jsx` — No changes needed; `takeDamage()` already called, timer decay is in usePlayer.tick()
- `src/Experience.jsx` — No changes needed
- `src/ui/Interface.jsx` — No changes needed
- `src/scenes/GameplayScene.jsx` — No changes needed
- `src/style.css` — No new keyframes needed (flash opacity driven by JS timer, vignettePulse already exists for low HP)
- `src/stores/useGame.jsx` — No damage-related state
- `src/audio/audioManager.js` — Audio already handled in Story 4.5

### Anti-Patterns to Avoid

- Do NOT add a post-processing EffectComposer pipeline just for a red flash — HTML overlay is simpler, cheaper, and consistent with existing HUD approach
- Do NOT create a new Zustand store (e.g., "useFeedback") for visual feedback state — extend usePlayer, which already owns damage timers
- Do NOT use `useEffect` or `setTimeout` for flash/shake timing — decrement timers in usePlayer.tick() (already called every frame by GameLoop) for deterministic behavior
- Do NOT use `Math.random()` for camera shake — use sine/cosine with clock time for deterministic, smooth shake
- Do NOT apply camera shake to Y axis — this is a top-down game, Y shake would look like zoom in/out instead of shake
- Do NOT make flash opacity too high — max 20% opacity to avoid disorienting the player (UX spec: "subtle opacity")
- Do NOT add new useFrame callbacks — modify the existing one in usePlayerCamera (render-level useFrame for visual effects is allowed per architecture)
- Do NOT import usePlayer inside usePlayerCamera at module level — use `getState()` inline (existing pattern)

### Testing Approach

- **Unit tests (usePlayer store):**
  - `takeDamage()` sets `damageFlashTimer` to `DAMAGE_FLASH_DURATION`
  - `takeDamage()` sets `cameraShakeTimer` to `CAMERA_SHAKE_DURATION`
  - `tick()` decrements `damageFlashTimer` and `cameraShakeTimer`
  - `tick()` clamps timers to 0 (don't go negative)
  - `reset()` zeros out flash and shake timers
  - `takeDamage()` during invulnerability does NOT set flash/shake timers
- **Visual tests (browser verification):**
  - Take damage → red flash visible, fades out
  - Take damage → camera shakes briefly
  - Rapid damage → effects restart cleanly
  - Low HP → persistent vignette (pre-existing)
  - 60 FPS maintained during all effects
  - No regressions on existing 334+ tests

### Scope Summary

This story adds two visual damage feedback mechanisms: a brief red screen flash (HTML overlay) and a camera shake, both triggered when the player takes damage. A persistent red vignette for low HP (< 25%) already exists from Story 4.2. The implementation extends the existing usePlayer store with two new timers (`damageFlashTimer`, `cameraShakeTimer`), adds shake logic to the existing usePlayerCamera hook, and adds a flash overlay div to the existing HUD component. Three new constants are added to gameConfig. No new files, no new stores, no post-processing pipeline — minimal changes to 4 existing files.

**Key deliverables:**
1. `usePlayer.jsx` — damageFlashTimer + cameraShakeTimer state, decay in tick(), set in takeDamage(), reset in reset()
2. `usePlayerCamera.jsx` — Camera shake offset using sine-based displacement with linear decay
3. `HUD.jsx` — Red damage flash overlay with opacity driven by timer
4. `gameConfig.js` — DAMAGE_FLASH_DURATION, CAMERA_SHAKE_DURATION, CAMERA_SHAKE_AMPLITUDE constants

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.6] — Acceptance criteria: red screen flash (100ms), camera shake (100-200ms, linear, small amplitude), < 50ms response, persistent vignette < 25% HP
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules] — Only GameLoop has high-priority useFrame for game logic; camera useFrame for smooth interpolation is allowed
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — Stores never import other stores; extend existing stores, don't create new ones
- [Source: _bmad-output/planning-artifacts/architecture.md#Anti-Patterns] — "Creating a new Zustand store for a one-off feature" is explicitly listed as anti-pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — "Dégât reçu: Screen shake léger, flash rouge HP, < 50ms", "HP critique: HP bar pulse, vignette rouge, Continu"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Animation Timing Patterns] — "Screen shake: linear, 100-200ms", "Pulse (warning): ease-in-out, 500ms loop"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — game-danger #ff3333 for damage/warnings
- [Source: src/stores/usePlayer.jsx] — Existing takeDamage(), tick() timer decay pattern (invulnerabilityTimer, contactDamageCooldown)
- [Source: src/hooks/usePlayerCamera.jsx] — Existing useFrame with smoothedPosition — add shake offset after lerp
- [Source: src/ui/HUD.jsx] — Existing low HP vignette div (lines 149-158) — add damage flash overlay alongside
- [Source: src/config/gameConfig.js] — Existing constants pattern: HIT_FLASH_DURATION_MS, INVULNERABILITY_DURATION, etc.
- [Source: src/style.css] — Existing vignettePulse keyframe (lines 45-48)
- [Source: src/GameLoop.jsx#L182-183] — takeDamage() + playSFX('damage-taken') already called at this point
- [Source: _bmad-output/implementation-artifacts/4-5-audio-system.md] — Previous story: audio system complete, damage-taken SFX already wired

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

None — clean implementation, no debugging required.

### Completion Notes List

- All 7 tasks completed successfully
- 19 unit tests (usePlayer.visualFeedback.test.js) — all passing
- Full test suite: 353 tests passing, 0 failures, 0 regressions
- Task 6 (low HP vignette) confirmed as no-op — AC #2 already satisfied by Story 4.2
- Red-green-refactor cycle followed: RED (12 failures) → GREEN (16 pass) → no refactor needed

### Code Review Fixes (2026-02-09)

- **[MEDIUM] Fixed camera shake corrupting smoothedPosition ref** — `usePlayerCamera.jsx`: Shake offset now applied to `state.camera.position` after copy, not to the persistent `smoothedPosition` ref. Prevents smooth-follow drift during/after shake.
- **[MEDIUM] Fixed test testing wrong guard** — `usePlayer.visualFeedback.test.js`: "contactDamageCooldown > 0" test now resets `isInvulnerable` and `invulnerabilityTimer` to properly isolate the cooldown guard.
- **[MEDIUM] Added missing re-flash timer restart test** — `usePlayer.visualFeedback.test.js`: New test verifies `takeDamage()` during active flash resets timer to max duration.
- **[LOW] Merged duplicate getState() call** — `usePlayerCamera.jsx`: Single destructured `getState()` call for position, velocity, and shake state.
- **[LOW] Added cameraShakeTimer guard tests** — `usePlayer.visualFeedback.test.js`: 2 new tests for invulnerability and cooldown blocking on cameraShakeTimer.

### File List

**Modified:**
- `src/config/gameConfig.js` — Added DAMAGE_FLASH_DURATION, CAMERA_SHAKE_DURATION, CAMERA_SHAKE_AMPLITUDE
- `src/stores/usePlayer.jsx` — Added damageFlashTimer, cameraShakeTimer, cameraShakeIntensity state + decay in tick() + set in takeDamage() + reset
- `src/hooks/usePlayerCamera.jsx` — Added sine-based camera shake offset with linear decay; review fix: shake applied to camera.position not smoothedPosition ref
- `src/ui/HUD.jsx` — Added red damage flash overlay div with opacity driven by damageFlashTimer

**Created:**
- `src/stores/__tests__/usePlayer.visualFeedback.test.js` — 19 unit tests for visual damage feedback store logic
