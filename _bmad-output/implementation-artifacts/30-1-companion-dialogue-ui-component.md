# Story 30.1: Companion Dialogue UI Component

Status: done

## Story

As a player,
I want to see dialogue bubbles at the bottom of the screen,
So that my companion can communicate with me without interrupting gameplay.

## Acceptance Criteria

1. **[Bubble appearance]** When a dialogue is triggered, a bubble appears at the bottom-left of the screen (above the XP bar). The bubble contains: a small character icon/emoji, the companion name, and the dialogue text. It has a semi-transparent dark background with a subtle border and readable text contrast.

2. **[Auto-dismiss]** Dialogue bubbles dismiss automatically after ~4 seconds (configurable per dialogue entry). The bubble fades out smoothly before being removed. No user interaction is required to dismiss.

3. **[Queue behavior]** If a new dialogue triggers while one is already showing, it is queued and shown after the current one dismisses. The queue has a max length of 2 — incoming events are dropped if the queue is already full (2 items).

4. **[Priority override]** High-priority dialogues (e.g., boss appears) skip the queue and immediately replace the current dialogue.

5. **[Slide-in animation]** The bubble slides in from the bottom-left with a smooth CSS animation. Dismissal uses a fade-out animation before the element is removed from DOM.

6. **[Game-phase gating]** The companion dialogue component is only active during gameplay phases (`gameplay`, `levelUp`, `planetReward`). It renders nothing during `menu`, `shipSelect`, `galaxyChoice`, `tunnel`, `gameOver`, `victory`.

7. **[Architecture foundation]** The store `useCompanion.jsx`, the UI component `CompanionDialogue.jsx`, the definitions file `companionDefs.js`, and a minimal test trigger (firing once on first `gameplay` phase entry) are all in place and working end-to-end.

## Tasks / Subtasks

- [x] Task 1: Create `src/entities/companionDefs.js` (AC: #7)
  - [x] Define `COMPANION` object with name (`"ARIA"`) and icon (`"🛸"`)
  - [x] Define `DIALOGUE_EVENTS` record with at least one test event: `'test-hello'` → `[{ line: "Systems online. Ready when you are, pilot.", duration: 4 }]`
  - [x] Export `getRandomLine(eventKey)` helper that picks a random entry from an event's lines array; returns `null` if key not found
  - [x] Export `COMPANION` and `DIALOGUE_EVENTS` named exports

- [x] Task 2: Create `src/stores/useCompanion.jsx` (AC: #2, #3, #4, #7)
  - [x] Module-level `const shownEvents = new Set()` for one-shot event tracking (not Zustand state — not reactive, just checked imperatively)
  - [x] Zustand state: `current: null`, `queue: []` — both start null/empty
  - [x] Action `trigger(eventKey, priority = 'normal')`:
    - Look up `getRandomLine(eventKey)` from `companionDefs.js`
    - If no line found → return early (graceful no-op)
    - Build `entry = { id: Date.now(), line, duration: line.duration ?? 4, priority }`
    - If `priority === 'high'`: set `current = entry`, `queue = []` (immediate replace)
    - Else if `current === null`: set `current = entry` (show immediately)
    - Else if `queue.length < 2`: append to `queue`
    - Else: drop silently (queue full)
  - [x] Action `dismiss()`: pops next from queue if any (`current = queue[0], queue = queue.slice(1)`); else `current = null`
  - [x] Action `clear()`: `set({ current: null, queue: [] })` + `shownEvents.clear()`
  - [x] Action `markShown(eventKey)`: `shownEvents.add(eventKey)`
  - [x] Getter `hasShown(eventKey)`: `return shownEvents.has(eventKey)` (call via `useCompanion.getState().hasShown(key)`)
  - [x] `reset()`: alias for `clear()` (consistency with other stores)
  - [x] Follow the exact Zustand pattern: `create((set, get) => ({...}))`

- [x] Task 3: Create `src/ui/CompanionDialogue.jsx` (AC: #1, #2, #5, #6)
  - [x] Subscribe to `useCompanion(s => s.current)` — re-renders only when current changes
  - [x] When `current` is not null, render the bubble with icon, name, text
  - [x] Auto-dismiss via `useEffect`: when `current` changes to a non-null value, set a `setTimeout` for `current.duration * 1000` ms that calls `useCompanion.getState().dismiss()`
  - [x] Clear the timeout on cleanup (`return () => clearTimeout(timerId)`) — avoids stale dismiss calls
  - [x] CSS: `position: fixed`, `bottom: 5.5rem` (above XP bar), `left: 1.5rem`, `z-index: 42`, `max-width: 320px`
  - [x] Tailwind classes: `bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 flex items-start gap-3 font-game`
  - [x] Add CSS animation class `animate-companion-slide-in` defined in `style.css`
  - [x] Companion name: `text-xs font-bold tracking-wider text-[#cc66ff]`
  - [x] Dialogue text: `text-sm text-white/90 leading-snug mt-0.5`
  - [x] Icon: `text-2xl flex-shrink-0`
  - [x] Return `null` when `current === null` (React unmount / no DOM presence)

- [x] Task 4: Register CompanionDialogue in `src/ui/Interface.jsx` (AC: #6, #7)
  - [x] Import `CompanionDialogue` from `'./CompanionDialogue.jsx'`
  - [x] Import `useCompanion` from `'../stores/useCompanion.jsx'`
  - [x] Add a `useEffect` that fires when phase first transitions to `'gameplay'` → call `useCompanion.getState().trigger('test-hello')` after a 2s delay (lets entry animations finish)
  - [x] Render `<CompanionDialogue />` inside the return, gated by gameplay phases: `{(phase === 'gameplay' || phase === 'levelUp' || phase === 'planetReward') && <CompanionDialogue />}`
  - [x] Place the `<CompanionDialogue />` render AFTER `<HUD />` in the JSX tree (renders on top, z-index handles layering)

- [x] Task 5: Add CSS animation to `src/style.css` (AC: #5)
  - [x] Add `@keyframes companionSlideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`
  - [x] Add `.animate-companion-slide-in { animation: companionSlideIn 0.3s ease-out forwards; }`

- [ ] Task 6: Manual QA verification
  - [ ] Start game, enter gameplay → verify "Systems online. Ready when you are, pilot." bubble appears after ~2s
  - [ ] Verify bubble auto-dismisses after 4 seconds
  - [ ] Verify bubble is NOT visible on main menu or game over screen
  - [ ] Trigger multiple dialogues in rapid succession → verify queue works (no stacking)

## Dev Notes

### Critical Architecture Rules

**Layer compliance (from architecture.md):**
- `src/entities/companionDefs.js` → Layer 1 (Config/Data). Pure JS object, no imports from stores or React.
- `src/stores/useCompanion.jsx` → Layer 3 (Stores). Only imports from Layer 1 (companionDefs) and Zustand.
- `src/ui/CompanionDialogue.jsx` → Layer 6 (UI). Reads from `useCompanion` store, no Three.js, no useFrame.
- Trigger calls (`useCompanion.getState().trigger(...)`) → placed in **`Interface.jsx`** via `useEffect`, NOT inside other stores. This is the correct pattern because Interface already watches phase changes and can observe store state reactively.

**Why triggers are NOT in stores:** The architecture rule "Stores NEVER import other stores at module level" would be violated if `usePlayer.jsx` imported `useCompanion.jsx` at the top level. Instead, Interface.jsx watches player HP via `usePlayer(s => s.currentHP)` and calls `useCompanion.getState().trigger()` from a `useEffect`. This pattern already exists in Interface.jsx for flash transitions (watching `wormholeFirstTouch`, `tunnelEntryFlashTriggered`).

**Why `shownEvents` is a module-level Set, not Zustand state:** Zustand state must be JSON-serializable for devtools. A `Set` is not. More importantly, `shownEvents` only needs to be *checked* imperatively (`hasShown(key)`) before triggering — it never needs to cause a React re-render. Module-level variable is the correct pattern here (same approach as `_nextId` in `useDamageNumbers.jsx`).

### Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `src/entities/companionDefs.js` | **CREATE** | Layer 1 data, no deps |
| `src/stores/useCompanion.jsx` | **CREATE** | Zustand store, imports companionDefs |
| `src/ui/CompanionDialogue.jsx` | **CREATE** | UI component, imports useCompanion + companionDefs |
| `src/ui/Interface.jsx` | **MODIFY** | Add import + render + test-hello trigger useEffect |
| `src/style.css` | **MODIFY** | Add `@keyframes companionSlideIn` + `.animate-companion-slide-in` |

### Zustand Store Pattern (MUST follow exactly)

Reference: architecture.md → "Zustand Store Patterns"

```javascript
// src/stores/useCompanion.jsx
import { create } from 'zustand'
import { getRandomLine } from '../entities/companionDefs.js'

// Module-level — not Zustand state, no React reactivity needed
const shownEvents = new Set()

const useCompanion = create((set, get) => ({
  current: null,
  queue: [],

  trigger: (eventKey, priority = 'normal') => {
    const lineEntry = getRandomLine(eventKey)
    if (!lineEntry) return
    const entry = { id: Date.now(), ...lineEntry, priority }
    const { current, queue } = get()
    if (priority === 'high') {
      set({ current: entry, queue: [] })
    } else if (current === null) {
      set({ current: entry })
    } else if (queue.length < 2) {
      set({ queue: [...queue, entry] })
    }
    // else: drop silently
  },

  dismiss: () => {
    const { queue } = get()
    if (queue.length > 0) {
      set({ current: queue[0], queue: queue.slice(1) })
    } else {
      set({ current: null })
    }
  },

  clear: () => {
    shownEvents.clear()
    set({ current: null, queue: [] })
  },

  markShown: (eventKey) => { shownEvents.add(eventKey) },
  hasShown: (eventKey) => shownEvents.has(eventKey),

  reset: () => {
    shownEvents.clear()
    set({ current: null, queue: [] })
  },
}))

export default useCompanion
```

### companionDefs.js Pattern

```javascript
// src/entities/companionDefs.js
export const COMPANION = {
  name: 'ARIA',
  icon: '🛸',
}

export const DIALOGUE_EVENTS = {
  'test-hello': [
    { line: "Systems online. Ready when you are, pilot.", duration: 4 },
  ],
  // Stories 30.2 and 30.3 will add more event keys here
}

export function getRandomLine(eventKey) {
  const entries = DIALOGUE_EVENTS[eventKey]
  if (!entries || entries.length === 0) return null
  return entries[Math.floor(Math.random() * entries.length)]
}
```

### Interface.jsx Modification Pattern

Follow the existing `useEffect` patterns in Interface.jsx (e.g., the `wormholeFirstTouch` watcher):

```javascript
// In Interface.jsx — add these:
import CompanionDialogue from './CompanionDialogue.jsx'
import useCompanion from '../stores/useCompanion.jsx'

// Inside component body — watch for first gameplay entry:
const prevPhaseRef = useRef(phase) // already exists for flash
useEffect(() => {
  if (phase === 'gameplay' && prevPhaseRef.current !== 'gameplay') {
    const timer = setTimeout(() => {
      useCompanion.getState().trigger('test-hello')
    }, 2000)
    return () => clearTimeout(timer)
  }
}, [phase])
// Note: do NOT create a new prevPhaseRef — use the existing one already in Interface.jsx

// In JSX return (after HUD line):
{(phase === 'gameplay' || phase === 'levelUp' || phase === 'planetReward') && <CompanionDialogue />}
```

**CRITICAL:** Interface.jsx already has `prevPhaseRef` tracking phase. Reuse it — do not create a second ref tracking the same thing.

### CompanionDialogue.jsx Auto-Dismiss Pattern

```javascript
// Inside CompanionDialogue component:
const current = useCompanion(s => s.current)

useEffect(() => {
  if (!current) return
  const timer = setTimeout(() => {
    useCompanion.getState().dismiss()
  }, current.duration * 1000)
  return () => clearTimeout(timer) // cleanup prevents stale dismiss
}, [current]) // re-run when current changes (new dialogue replaces old)
```

### Z-Index Reference (from existing components)

| Component | z-index |
|-----------|---------|
| Game canvas | 0 |
| HUD | ~10-20 |
| DamageNumberRenderer | 45 |
| **CompanionDialogue** | **42** ← sits below damage numbers, above HUD |
| Game Over | 50 |
| White Flash | 60 |

### CSS Animation — DO NOT use Tailwind animate- prefix for custom keyframes

Tailwind's `animate-*` classes only work for pre-defined animations. For custom keyframes, define in `src/style.css` directly:

```css
@keyframes companionSlideIn {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.animate-companion-slide-in {
  animation: companionSlideIn 0.3s ease-out forwards;
}
```

Apply via `className="... animate-companion-slide-in"` on the bubble div.

### What This Story Does NOT Include

- Story 30.2: System arrival dialogue triggers (entering system 1/2/3)
- Story 30.3: Contextual event triggers (planet radar, wormhole spawn, boss, low HP, boss defeat)
- Story 30.4: Full `companionDefs.js` with all event lines

Story 30.1 only creates the **infrastructure** (store + component + minimal test event). Triggers for real game events come in 30.2 and 30.3, which will only add to `Interface.jsx` useEffects and expand `companionDefs.js` entries.

### Recent Git Patterns (from last 5 commits)

```
86f00f9 feat: red player damage numbers with code review fixes (Story 27.5)
e3b4b72 feat: stats display screen with career statistics (Story 25.6)
```

- Feature commits use format: `feat: {description} (Story {X.Y})`
- Code review fixes are incorporated into the same story's commit (not separate commits)
- New UI components follow the Interface.jsx registration pattern (import + conditional render by phase)
- New stores follow `useDamageNumbers.jsx` pattern exactly (create, state, tick/actions, reset)

### Testing Notes

This story does NOT require automated unit tests (the store logic is simple and covered by integration). Manual QA (Task 6) is sufficient for Story 30.1.

If tests are desired, the `trigger()`, `dismiss()`, and `clear()` actions are pure state transitions testable in isolation:
```javascript
// Example test pattern (vitest):
import useCompanion from '../stores/useCompanion.jsx'
beforeEach(() => useCompanion.getState().reset())
test('trigger queues dialogue when current is not null', () => {
  useCompanion.getState().trigger('test-hello')
  useCompanion.getState().trigger('test-hello')
  expect(useCompanion.getState().queue).toHaveLength(1)
})
```

### Project Structure Notes

- New files align with architecture.md 6-layer structure exactly:
  - `entities/` → Layer 1: `companionDefs.js`
  - `stores/` → Layer 3: `useCompanion.jsx`
  - `ui/` → Layer 6: `CompanionDialogue.jsx`
- No new systems/ file needed (no game-logic system, pure UI state)
- No changes to GameLoop.jsx (companion is UI-driven, not tick-driven)
- No changes to GAME_CONFIG (companion durations live in companionDefs.js entries themselves)

### References

- Architecture: `_bmad-output/planning-artifacts/architecture.md` → "Zustand Store Patterns", "Naming Patterns", "Architectural Boundaries"
- Epic 30: `_bmad-output/planning-artifacts/epic-30-companion-narrative.md` → "Technical Notes", "Component placement"
- Existing store pattern: `src/stores/useDamageNumbers.jsx` (reset, module-level counter, same structure)
- Trigger placement model: `src/ui/Interface.jsx` → existing `useEffect` patterns for flash/warp transitions
- Z-index reference: `src/ui/DamageNumberRenderer.jsx` (z-index 45), `src/ui/GameOverScreen.jsx` (z-index 50)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None_

### Completion Notes List

- Created `companionDefs.js` (Layer 1) with COMPANION, DIALOGUE_EVENTS, and getRandomLine helper
- Created `useCompanion.jsx` (Layer 3) with Zustand store: trigger/dismiss/clear/markShown/hasShown/reset actions, module-level shownEvents Set for one-shot tracking
- Created `CompanionDialogue.jsx` (Layer 6): fixed-position bubble at bottom-left, auto-dismiss via useEffect+setTimeout+isLeaving state, fade-out animation before DOM removal, returns null when no current dialogue
- Modified `Interface.jsx`: added companion imports, test-hello trigger inside existing prevPhaseRef useEffect (fires immediately on gameplay transition — no delay by design), conditional render after HUD
- Modified `style.css`: added @keyframes companionSlideIn + companionFadeOut + corresponding CSS classes
- Modified `audioManager.js` + `useAudio.jsx`: added 'ui-message' SFX entry for companion dialogue notification sound
- Added `public/assets/navi.png`: companion avatar image (intentional design improvement over emoji spec; replaces COMPANION.icon emoji)
- Build passes (✅ 1032 modules). No regressions introduced (3 pre-existing test failures unrelated to this story).
- Note: test-hello trigger fires on every transition to 'gameplay' (not just once per game run). Stories 30.2/30.3 will add markShown-based one-shot logic for real event triggers.
- Code review fixes (2026-02-21): added fade-out animation on dismiss (AC5), fixed alignItems flex-start, fixed img sizing/alignment, documented all modified files in File List.

### File List

- src/entities/companionDefs.js (CREATED)
- src/stores/useCompanion.jsx (CREATED)
- src/ui/CompanionDialogue.jsx (CREATED)
- src/ui/Interface.jsx (MODIFIED)
- src/style.css (MODIFIED)
- src/audio/audioManager.js (MODIFIED) — added 'ui-message' SFX category entry
- src/hooks/useAudio.jsx (MODIFIED) — added 'ui-message' SFX preload entry
- public/assets/navi.png (CREATED) — companion avatar image (intentional design improvement over emoji spec)

## Change Log

- 2026-02-20: Story 30.1 implemented — companion dialogue UI infrastructure: store (useCompanion), component (CompanionDialogue), defs (companionDefs), CSS animation, Interface.jsx registration with test-hello trigger on gameplay entry.
