# Story 30.2: System Arrival & Navigation Dialogues

Status: ready-for-dev

## Story

As a player,
I want my companion to acknowledge when we arrive in a new system,
So that the system entry feels like a shared adventure moment.

## Acceptance Criteria

1. **[System arrival trigger]** When the player enters gameplay from a `systemEntry` phase transition (i.e., a fresh system arrival — not a return from `levelUp` or `planetReward`), ARIA says a relevant line after a 1.5s delay. The 1.5s delay avoids overlap with the SystemNameBanner animation.

2. **[System-specific lines]** Each system has its own pool of 3 dialogue lines randomly selected at trigger time:
   - System 1 lines: "Alright, we're in. Eyes open — they'll know we're here." / "New system, new threats. Let's find that wormhole and move." / "Sensors are picking up hostiles. Time to work, pilot."
   - System 2 lines: "Second system. The signals are stronger here. Stay sharp." / "This sector's hotter than the last. Don't slow down." / "We made it to System 2. Things are about to get real."
   - System 3 lines: "This is it. The final system. Everything's on the line." / "System 3 — the resistance here will be brutal. Good luck." / "We're close. Stay alive long enough to find the wormhole."

3. **[Phase discrimination]** The trigger ONLY fires when `prevPhaseRef.current === 'systemEntry'` (not when returning from `levelUp`, `planetReward`, or `revive`). Using the existing `prevPhaseRef` in Interface.jsx guarantees precision without creating a duplicate ref.

4. **[Test trigger removal]** The temporary `test-hello` trigger added in Story 30.1 (2s delay on any first `gameplay` entry) is removed from Interface.jsx. It is replaced by the proper system-arrival trigger. The `'test-hello'` event key remains in `companionDefs.js` for future dev testing but is no longer called in production.

5. **[Duration]** Each system arrival dialogue uses a 4s display duration (default). Configurable per line entry via the `duration` field.

6. **[Normal priority]** System arrival dialogues use `priority: 'normal'` — they queue behind any already-showing dialogue rather than interrupting it.

## Tasks / Subtasks

- [ ] Task 1: Update `src/entities/companionDefs.js` — add system arrival events (AC: #2, #5)
  - [ ] Add event key `'system-arrival-1'` with 3 dialogue line objects (each with `line` and `duration: 4`)
  - [ ] Add event key `'system-arrival-2'` with 3 dialogue line objects
  - [ ] Add event key `'system-arrival-3'` with 3 dialogue line objects
  - [ ] Keep the existing `'test-hello'` entry (do NOT remove it — still useful for dev)

- [ ] Task 2: Update `src/ui/Interface.jsx` — replace test-hello with system-arrival trigger (AC: #1, #3, #4)
  - [ ] Import `useLevel` from `'../stores/useLevel.jsx'`
  - [ ] **Remove** the `test-hello` useEffect added in Story 30.1 (the one with 2s delay on `gameplay` entry)
  - [ ] **Add** a new useEffect that watches `phase`:
    - Condition: `phase === 'gameplay'` AND `prevPhaseRef.current === 'systemEntry'`
    - Read `useLevel.getState().currentSystem` (gives 1, 2, or 3)
    - After 1500ms, call `useCompanion.getState().trigger('system-arrival-' + currentSystem)`
    - Return cleanup: `clearTimeout(timer)`
  - [ ] **Do NOT** add a new `prevPhaseRef` — reuse the one already present in Interface.jsx (line 33)
  - [ ] **Do NOT** add a new `useLevel` subscription (use `getState()` only — no reactive subscription needed)

- [ ] Task 3: Manual QA (AC: #1, #2, #3, #6)
  - [ ] Start new game → enter System 1 → verify ARIA says a System 1 line ~1.5s after gameplay starts
  - [ ] Progress to System 2 → verify a System 2 line fires (different from System 1 lines)
  - [ ] Progress to System 3 → verify a System 3 line fires
  - [ ] Trigger a level-up during gameplay → dismiss it → verify NO companion line fires on levelUp→gameplay return
  - [ ] Verify the `test-hello` bubble no longer appears on game start

## Dev Notes

### Critical Architecture Rules

**Trigger placement — NOT in stores:**
The companion trigger must live in `Interface.jsx` as a `useEffect`, NOT in `useGame`, `useLevel`, or `useEnemies`. The architecture rule "Stores NEVER import other stores at module level" prohibits `useGame` from importing `useCompanion` at the top level. Interface.jsx already watches phase and is the correct location for all companion triggers — this is the established pattern from Story 30.1.

**prevPhaseRef reuse — MANDATORY:**
Interface.jsx already declares `const prevPhaseRef = useRef(phase)` (line 33) and updates it at the end of the flash useEffect: `prevPhaseRef.current = phase` (line 42). This ref accurately reflects the previous phase on every render cycle. Do NOT create a second `const prevPhaseRefForCompanion = useRef(phase)` — that would be a duplicate tracking the same value.

**Why `prevPhaseRef.current === 'systemEntry'` and not `!== 'gameplay'`:**
The condition `phase === 'gameplay' && prevPhaseRef.current !== 'gameplay'` (used in Story 30.1's test trigger) fires on ANY first entry to gameplay, including returns from `levelUp`, `planetReward`, and `revive`. For system arrival we need to be more precise: only transitions from `systemEntry` → `gameplay` represent a fresh system arrival. Using `prevPhaseRef.current === 'systemEntry'` is the correct gate.

**Phase transition flow reference:**
```
galaxyChoice → [startGameplay()] → systemEntry → [completeSystemEntry()] → gameplay
  levelUp → [resumeGameplay()] → gameplay       (prevPhase: levelUp — must NOT trigger)
  planetReward → [resumeGameplay()] → gameplay  (prevPhase: planetReward — must NOT trigger)
  revive → [resumeFromRevive()] → gameplay      (prevPhase: revive — must NOT trigger)
```

Only the first flow has `prevPhaseRef.current === 'systemEntry'`.

**No `hasShown`/`markShown` needed:**
System arrival fires exactly once per system visit by nature — the `systemEntry → gameplay` transition happens once per system. There is no risk of firing multiple times. No Set tracking required.

**useLevel access pattern:**
```javascript
// Correct — one-time read at trigger time, no reactive subscription:
const currentSystem = useLevel.getState().currentSystem
useCompanion.getState().trigger('system-arrival-' + currentSystem)
```
Do NOT use `useLevel(s => s.currentSystem)` inside Interface (would add an unnecessary React subscription that rerenders Interface on every system change).

### Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `src/entities/companionDefs.js` | **MODIFY** | Add 3 system-arrival event keys |
| `src/ui/Interface.jsx` | **MODIFY** | Remove test-hello, add system-arrival trigger |

### Implementation Reference — companionDefs.js Addition

```javascript
// src/entities/companionDefs.js — add inside DIALOGUE_EVENTS:
'system-arrival-1': [
  { line: "Alright, we're in. Eyes open — they'll know we're here.", duration: 4 },
  { line: "New system, new threats. Let's find that wormhole and move.", duration: 4 },
  { line: "Sensors are picking up hostiles. Time to work, pilot.", duration: 4 },
],
'system-arrival-2': [
  { line: "Second system. The signals are stronger here. Stay sharp.", duration: 4 },
  { line: "This sector's hotter than the last. Don't slow down.", duration: 4 },
  { line: "We made it to System 2. Things are about to get real.", duration: 4 },
],
'system-arrival-3': [
  { line: "This is it. The final system. Everything's on the line.", duration: 4 },
  { line: "System 3 — the resistance here will be brutal. Good luck.", duration: 4 },
  { line: "We're close. Stay alive long enough to find the wormhole.", duration: 4 },
],
```

### Implementation Reference — Interface.jsx Changes

**Remove** this block (Story 30.1 test trigger):
```javascript
// REMOVE THIS — test trigger replaced by real system arrival in 30.2:
useEffect(() => {
  if (phase === 'gameplay' && prevPhaseRef.current !== 'gameplay') {
    const timer = setTimeout(() => {
      useCompanion.getState().trigger('test-hello')
    }, 2000)
    return () => clearTimeout(timer)
  }
}, [phase])
```

**Add** this block instead (note: reuses the existing `prevPhaseRef`):
```javascript
// Story 30.2: System arrival companion dialogue
useEffect(() => {
  if (phase === 'gameplay' && prevPhaseRef.current === 'systemEntry') {
    const currentSystem = useLevel.getState().currentSystem
    const timer = setTimeout(() => {
      useCompanion.getState().trigger('system-arrival-' + currentSystem)
    }, 1500)
    return () => clearTimeout(timer)
  }
}, [phase])
```

**CRITICAL order in file:**
The `prevPhaseRef.current = phase` update happens at the END of the flash useEffect (line 42). The companion useEffect reads `prevPhaseRef.current` at the START of its execution. Since both useEffects depend on `[phase]`, React runs them in the order they are declared. Place the companion useEffect AFTER the flash useEffect to guarantee `prevPhaseRef.current` holds the previous (not current) phase when the companion effect reads it.

Wait — actually React runs ALL effects in order BEFORE any of them update the ref. Both effects run with the same `prevPhaseRef.current` value as long as the ref update happens synchronously inside one of them. The update `prevPhaseRef.current = phase` (line 42) runs during the flash useEffect execution. So the companion useEffect (running after) would see the ALREADY UPDATED ref value.

**Fix**: The companion useEffect must be declared BEFORE the flash useEffect (or the flash useEffect's ref update must be kept), OR the companion effect must capture the previous phase from the ref BEFORE the flash effect runs.

**Simplest and correct solution**: Declare the companion useEffect BEFORE the flash useEffect in the component body. This ensures it reads the correct pre-update `prevPhaseRef.current` value.

```javascript
// MUST come BEFORE the flash useEffect in Interface.jsx:
// Story 30.2: System arrival companion dialogue
useEffect(() => {
  if (phase === 'gameplay' && prevPhaseRef.current === 'systemEntry') {
    const currentSystem = useLevel.getState().currentSystem
    const timer = setTimeout(() => {
      useCompanion.getState().trigger('system-arrival-' + currentSystem)
    }, 1500)
    return () => clearTimeout(timer)
  }
}, [phase])
// Then the existing flash useEffect follows (which updates prevPhaseRef.current = phase):
useEffect(() => {
  if (phase === 'systemEntry' && prevPhaseRef.current !== 'systemEntry') {
    // ... flash logic ...
  }
  prevPhaseRef.current = phase  // ← companion effect already ran with old value ✓
}, [phase])
```

### Import additions needed in Interface.jsx

```javascript
import useLevel from '../stores/useLevel.jsx'
// useCompanion is already imported from Story 30.1
```

### Z-Index / Rendering Reference (unchanged from 30.1)

| Component | z-index |
|-----------|---------|
| HUD | ~10–20 |
| CompanionDialogue | 42 |
| DamageNumberRenderer | 45 |
| GameOverScreen | 50 |
| WhiteFlash | 60 |

### Previous Story Intelligence (from 30.1)

- `useCompanion` store is created at `src/stores/useCompanion.jsx` with `trigger(eventKey, priority)`, `dismiss()`, `clear()`, `reset()`
- `CompanionDialogue.jsx` renders at bottom-left (`bottom: 5.5rem, left: 1.5rem, z-index: 42`) gated by `gameplay/levelUp/planetReward` phases
- `companionDefs.js` already has `'test-hello'` entry and `getRandomLine()` helper
- Interface.jsx already imports `useCompanion` and registers `<CompanionDialogue />`
- `prevPhaseRef` is the single ref tracking previous phase — do NOT duplicate

### Dependency on Story 30.1

This story REQUIRES 30.1 to be done first:
- `useCompanion` store must exist
- `CompanionDialogue` must be registered in Interface.jsx
- `companionDefs.js` must exist with `getRandomLine()` exported

### Testing Notes

No automated tests required for this story (same rationale as 30.1 — trigger logic is simple and verified by manual QA). The trigger logic can be manually verified by:
- Entering each of the 3 systems and observing the correct pool of lines
- Returning from levelUp and confirming no spurious trigger

### Recent Git Patterns

```
86f00f9 feat: red player damage numbers with code review fixes (Story 27.5)
e3b4b72 feat: stats display screen with career statistics (Story 25.6)
```

- Feature commits use format: `feat: {description} (Story {X.Y})`
- Interface.jsx modifications are incremental — add imports at top, add useEffects in order, add conditional renders in JSX

### Project Structure Notes

- `src/entities/companionDefs.js` → Layer 1 (Config/Data) — pure JS, no React/store imports
- `src/ui/Interface.jsx` → Layer 6 (UI hub) — correct location for companion triggers per architecture
- Story 30.2 adds zero new files — pure modification of existing 30.1 infrastructure

### References

- Epic 30: `_bmad-output/planning-artifacts/epic-30-companion-narrative.md` → Story 30.2 acceptance criteria and dialogue lines
- Story 30.1: `_bmad-output/implementation-artifacts/30-1-companion-dialogue-ui-component.md` → useCompanion store pattern, Interface.jsx registration
- `src/ui/Interface.jsx` → `prevPhaseRef` declaration (line 33), flash useEffect with ref update (lines 35–42)
- `src/stores/useLevel.jsx` → `currentSystem` field (integer 1, 2, or 3)
- `src/stores/useGame.jsx` → Phase flow: `systemEntry → gameplay` via `completeSystemEntry()`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
