# Story 40.1: Fix Damage Numbers & Camera Shake During Pause / LevelUp

Status: done

## Story

As a player,
I want damage numbers and screen shake to stop when the game is paused or the level-up modal appears,
so that the UI is clean and no combat effects loop or remain frozen on screen during pauses.

## Acceptance Criteria

1. **Given** the game is paused (`isPaused === true`) or in `levelUp` / `planetReward` phase — **When** damage numbers are active from the last combat frame — **Then** they are hidden immediately (no frozen numbers visible over pause / level-up UI) — **And** they resume normally when the game is unpaused.

2. **Given** the camera shake timer (`cameraShakeTimer > 0`) — **When** the game is paused or in a modal phase — **Then** no camera shake offset is applied to the camera position — **And** the shake resumes if the timer is still running when the game unpauses.

3. **Given** normal gameplay flow — **When** the game is not paused — **Then** damage numbers and camera shake behave exactly as before (no regression).

4. **Given** the implementation of DamageNumberRenderer — **When** fixing it — **Then** in `DamageNumberRenderer.useFrame`, add an early return guard that reads `useGame.getState().isPaused`, hides all divs, and returns.

5. **Given** the implementation of camera shake — **When** fixing it — **Then** in `usePlayerCamera.useFrame`, pass `cameraShakeTimer: 0` override to `computeCameraFrame` when `isPaused`.

## Tasks / Subtasks

- [x] Task 1: Guard DamageNumberRenderer against pause state (AC: #1, #4)
  - [x] 1.1: In `useFrame` at line 59 of `DamageNumberRenderer.jsx`, read `useGame.getState().isPaused` at the top
  - [x] 1.2: If `isPaused === true`, iterate all divRefs and set `display = 'none'`, then `return`
  - [x] 1.3: Import `useGame` at top of file (if not already imported)

- [x] Task 2: Guard camera shake against pause state (AC: #2, #5)
  - [x] 2.1: In `usePlayerCamera.useFrame` (after the `systemEntry` early-return), read `isPaused` from `useGame.getState()`
  - [x] 2.2: When calling `computeCameraFrame`, if `isPaused && playerState.cameraShakeTimer > 0`, pass `{ ...playerState, cameraShakeTimer: 0 }` instead of `playerState`
  - [x] 2.3: Do NOT change the signature of `computeCameraFrame` — it is a pure exported function with existing tests

- [x] Task 3: Add regression tests (AC: #3)
  - [x] 3.1: Guard is in the hook's `useFrame` (not in `computeCameraFrame`) — cannot be easily unit-tested without R3F mocks. Integration note: the pause-guard path requires `useGame.getState().isPaused === true` AND `cameraShakeTimer > 0` simultaneously; covered by manual QA. `computeCameraFrame` tests unchanged per design.
  - [x] 3.2: All 6 existing `usePlayerCamera.test.js` tests confirmed passing (no regression)

## Dev Notes

### DamageNumberRenderer fix (Task 1)

**File:** `src/ui/DamageNumberRenderer.jsx` — `useFrame` at line 59

Current code starts immediately reading `damageNumbers` and iterating. Fix: add guard at the very top of `useFrame`:

```js
useFrame(() => {
  // Guard: hide all numbers during pause / modal phases (Story 40.1)
  if (useGame.getState().isPaused) {
    const refs = divRefs.current
    for (let i = 0; i < MAX_COUNT; i++) {
      if (refs[i]) refs[i].style.display = 'none'
    }
    return
  }

  const { damageNumbers } = useDamageNumbers.getState()
  // ... rest unchanged
```

`useGame` must be imported. Check line 1–6 of the file — it currently imports `useDamageNumbers` and `useGame` is NOT imported. Add:
```js
import useGame from '../stores/useGame.jsx'
```

**Why `isPaused` is sufficient:** All pause-inducing transitions set `isPaused: true` — `triggerLevelUp`, `triggerPlanetReward`, `enterRevivePhase`, `triggerGameOver`, `triggerVictory`, `setPaused(true)`. So a single `isPaused` guard covers levelUp, planetReward, and all other paused states.

### Camera shake fix (Task 2)

**File:** `src/hooks/usePlayerCamera.jsx` — `usePlayerCamera` function, `useFrame` callback at line 50

Current code passes `playerState` directly to `computeCameraFrame`, which reads `cameraShakeTimer` from it. Fix at the call site only:

```js
useFrame((state, delta) => {
  const { phase, isPaused } = useGame.getState()
  if (phase === 'systemEntry') {
    smoothedPosition.current.set(0, offsetY, 0)
    state.camera.position.copy(smoothedPosition.current)
    state.camera.rotation.set(-Math.PI / 2, 0, 0)
    return
  }
  const playerState = usePlayer.getState()
  // Story 40.1: suppress shake while paused — pass 0 override instead of mutating playerState
  const effectivePlayerState = isPaused && playerState.cameraShakeTimer > 0
    ? { ...playerState, cameraShakeTimer: 0 }
    : playerState
  computeCameraFrame(state.camera, smoothedPosition.current, effectivePlayerState, delta, offsetY, posSmooth, state.clock.elapsedTime)
})
```

**Object allocation note:** `{ ...playerState, cameraShakeTimer: 0 }` is only created when `isPaused === true AND cameraShakeTimer > 0` simultaneously — this is a rare edge case (pause triggered mid-shake). No per-frame allocation in normal gameplay.

**Why NOT to change `computeCameraFrame`:** This function is exported and tested independently in `src/hooks/__tests__/usePlayerCamera.test.js`. Adding an `isPaused` param would require updating all 6 test call sites and adds coupling. The guard belongs in the hook's `useFrame` where game state is already read.

### Project Structure Notes

- Files to touch: `src/ui/DamageNumberRenderer.jsx` and `src/hooks/usePlayerCamera.jsx`
- No config changes needed — `isPaused` is already managed in `useGame.jsx`
- No new files needed — both are single-line-guard fixes

### Testing notes

- `src/hooks/__tests__/usePlayerCamera.test.js` tests `computeCameraFrame` directly — these must continue to pass unchanged
- The pause guard lives in the hook's `useFrame` (not in `computeCameraFrame`), so it cannot be easily unit-tested without R3F mocks
- Acceptable testing approach: verify existing tests pass + manual QA (pause during active shake, pause with active damage numbers)
- If a unit test is desired for the DamageNumberRenderer guard, it would require mocking `useGame.getState()` — worth adding if the pattern has precedent in the codebase, otherwise skip per architecture: "Pas de tests pour les composants visuels purs"

### References

- Epic 40 context: `_bmad-output/planning-artifacts/epic-40-bugfixes-pause-music-aura.md#Story-40.1`
- DamageNumberRenderer source: `src/ui/DamageNumberRenderer.jsx` (Story 27.1)
- Camera hook source: `src/hooks/usePlayerCamera.jsx` (Story 14.1 / 4.6)
- isPaused definition: `src/stores/useGame.jsx` lines 9, 25, 62–68
- Camera shake impl: `src/hooks/usePlayerCamera.jsx` lines 29–34 in `computeCameraFrame`
- Test file (must not regress): `src/hooks/__tests__/usePlayerCamera.test.js`
- Project context: `_bmad-output/planning-artifacts/project-context.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None_

### Completion Notes List

- Task 1: Added `import useGame from '../stores/useGame.jsx'` to `DamageNumberRenderer.jsx`. Added `isPaused` guard at top of `useFrame` — iterates all `divRefs` and sets `display = 'none'`, then returns early. Covers all pause phases (levelUp, planetReward, manual pause, game over, etc.) via the single `isPaused` flag.
- Task 2: Added `isPaused` destructuring from `useGame.getState()` in `usePlayerCamera.useFrame`. When `isPaused && cameraShakeTimer > 0`, passes `{ ...playerState, cameraShakeTimer: 0 }` to `computeCameraFrame` — no mutation of store state, no signature change to the pure function.
- Task 3: Existing 6 tests in `usePlayerCamera.test.js` all pass (6/6). Guard not unit-testable without R3F mocks — integration/manual QA approach confirmed per Dev Notes architecture note.
- Pre-existing failure in `useWeapons.test.js` (`clearProjectiles should preserve upgraded weapons`) confirmed unrelated to this story's changes.

### File List

- `src/ui/DamageNumberRenderer.jsx` (modified)
- `src/hooks/usePlayerCamera.jsx` (modified)

## Senior Developer Review (AI)

**Reviewer:** Adam · 2026-02-23
**Outcome:** Approved with fixes applied

### Findings Applied

- **[MEDIUM] M1 — `usePlayerCamera.jsx`**: Commentaire trompeur sur l'allocation du spread. Mis à jour pour documenter que l'allocation se produit frame-par-frame pendant toute la durée de la pause (pas juste une fois), car `cameraShakeTimer` ne décrémente pas pendant la pause.
- **[MEDIUM] M2 — `DamageNumberRenderer.jsx`**: Absence de garantie d'ordre d'exécution des `useFrame`. Ajouté un commentaire "Ordering contract" documentant la dépendance sur l'ordre de mount (GameLoop before DamageNumberRenderer).
- **[LOW] L1 — `DamageNumberRenderer.jsx`**: Itération redondante sur MAX_COUNT divs à chaque frame de pause soutenue. Ajouté `wasPausedRef` — l'itération ne s'exécute plus que sur la frame de transition vers le pause state.
- **[LOW] L2 — Task 3.1**: Pas de test automatisé pour le pause guard. Accepté per project architecture ("Pas de tests pour les composants visuels purs") — DamageNumberRenderer classé comme composant visuel.
- **[LOW] L3 — Dev Notes**: Justification "rare edge case" dans les Dev Notes maintenant documentée correctement dans le commentaire du code.

### Validation

- isPaused vérifié dans useGame.jsx: `triggerLevelUp`, `triggerPlanetReward`, `triggerGameOver`, `triggerVictory`, `enterRevivePhase` → tous set `isPaused: true` ✓
- GameLoop arrêté pendant pause (line 220: `if (phase !== 'gameplay' || isPaused) return`) → damage number ages gelés pendant pause ✓
- gameOver cleanup (`useDamageNumbers.reset()`) s'exécute avant le guard → pas de regression ✓
- Tous les ACs implémentés et vérifiés ✓

## Change Log

- 2026-02-23: Story 40.1 implemented — pause guard for damage numbers renderer and camera shake suppression during pause (claude-sonnet-4-6)
- 2026-02-23: Code review fixes — M1 commentaire allocation, M2 ordering contract, L1 wasPausedRef optimization (claude-sonnet-4-6)
