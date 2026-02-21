# Story 30.4: Dialogue Definitions & Extensibility

Status: done

## Story

As a developer,
I want dialogue lines to be defined in a single data file,
So that adding new dialogue is trivial and doesn't require touching UI or trigger code.

## Acceptance Criteria

1. **[All dialogue text consolidated]** All dialogue text for the companion system is defined in `src/entities/companionDefs.js`. No dialogue strings exist in JSX components, stores, or Interface.jsx — only event key references are used at trigger sites.

2. **[Complete event key catalogue]** `DIALOGUE_EVENTS` in `companionDefs.js` contains all event keys needed by Stories 30.2 and 30.3:
   - `'system-arrival-1'` — 3 lines for System 1 arrival
   - `'system-arrival-2'` — 3 lines for System 2 arrival
   - `'system-arrival-3'` — 3 lines for System 3 arrival
   - `'planet-radar'` — 3 lines for planet detection
   - `'wormhole-spawn'` — 3 lines for wormhole appearance
   - `'boss-spawn'` — 3 lines for boss entrance
   - `'low-hp-warning'` — 3 lines for critical HP
   - `'boss-defeat'` — 3 lines for boss death
   - `'test-hello'` — retained for dev testing (not triggered in production after 30.2)

3. **[Line object schema]** Every line object has:
   - `line`: string — the dialogue text
   - `duration`: number (seconds) — display duration before auto-dismiss
   - No inline `priority` field needed — priority is passed at trigger call site via `trigger(key, 'high')`

4. **[Companion character definition]** `COMPANION` export in `companionDefs.js` defines the companion in one place:
   - `name`: `'ARIA'`
   - `icon`: `'🛸'`
   — Neither value is hardcoded anywhere else in the codebase.

5. **[Extensibility verified]** Adding a new event requires exactly:
   1. Add event key + lines array to `DIALOGUE_EVENTS` in `companionDefs.js`
   2. Call `useCompanion.getState().trigger('new-event-key')` at the relevant trigger site
   — No changes to `CompanionDialogue.jsx`, `useCompanion.jsx`, or any UI component required.

6. **[Localization-ready architecture]** All dialogue strings live in `companionDefs.js` (not in JSX). The file can be replaced or augmented per language without touching components or logic.

## Tasks / Subtasks

- [x] Task 1: Complete `src/entities/companionDefs.js` with all event keys (AC: #2, #3)
  - [x] Add `'system-arrival-1'` with 3 line objects (duration: 4)
  - [x] Add `'system-arrival-2'` with 3 line objects (duration: 4)
  - [x] Add `'system-arrival-3'` with 3 line objects (duration: 4)
  - [x] Add `'planet-radar'` with 3 line objects (duration: 3–4)
  - [x] Add `'wormhole-spawn'` with 3 line objects (duration: 3–4)
  - [x] Add `'boss-spawn'` with 3 line objects (duration: 4–5)
  - [x] Add `'low-hp-warning'` with 3 line objects (duration: 4)
  - [x] Add `'boss-defeat'` with 3 line objects (duration: 4)
  - [x] Keep `'test-hello'` as-is — not removed, just no longer triggered in production
  - [x] Add section comment separating test entries from production entries

- [x] Task 2: Verify no dialogue text exists outside companionDefs.js (AC: #1, #4)
  - [x] Grep for hardcoded dialogue strings in Interface.jsx, CompanionDialogue.jsx, useCompanion.jsx
  - [x] Confirm `COMPANION.name` and `COMPANION.icon` are used from import, not re-declared elsewhere
  - [x] Confirm `CompanionDialogue.jsx` reads name/icon from the `COMPANION` import

- [x] Task 3: Automated tests cover smoke test requirements (AC: #5) — `src/entities/__tests__/companionDefs.test.js`
  - [x] Confirm `getRandomLine('system-arrival-1')` returns a valid line object
  - [x] Confirm `getRandomLine('boss-spawn')` returns a line object with duration >= 4
  - [x] Confirm unknown key returns `null` (existing behavior of `getRandomLine`)

## Dev Notes

### What This Story Does (and Doesn't Do)

This is a **developer-facing data story** — no new player-visible behaviour. The goal is making `companionDefs.js` the **complete canonical source** for all companion content before (or as a complement to) Stories 30.2 and 30.3 adding the trigger code.

**Stories 30.2 and 30.3 each include defs additions in their task lists.** Story 30.4 consolidates all of that in one place. If 30.2 and 30.3 have already been implemented when this story runs, Task 1 reduces to a verification pass. If they haven't, Task 1 pre-populates all content so that 30.2/30.3 implementation only needs to add trigger code in Interface.jsx.

### Current State of companionDefs.js

After Story 30.1, `companionDefs.js` looks like:

```javascript
export const COMPANION = {
  name: 'ARIA',
  icon: '🛸',
}

export const DIALOGUE_EVENTS = {
  'test-hello': [
    { line: "Systems online. Ready when you are, pilot.", duration: 4 },
    // ... 5 more lines
  ],
  // Stories 30.2 and 30.3 will add more event keys here
}

export function getRandomLine(eventKey) {
  const entries = DIALOGUE_EVENTS[eventKey]
  if (!entries || entries.length === 0) return null
  return entries[Math.floor(Math.random() * entries.length)]
}
```

Story 30.4 fills in the `DIALOGUE_EVENTS` object completely.

### Complete Target State of companionDefs.js

```javascript
// Layer 1 (Config/Data) — no imports from stores or React
export const COMPANION = {
  name: 'ARIA',
  icon: '🛸',
}

export const DIALOGUE_EVENTS = {
  // ─── DEV / TEST ───────────────────────────────────────────────────────────
  'test-hello': [
    { line: "Systems online. Ready when you are, pilot.", duration: 4 },
    { line: "All systems nominal. Let's make this count.", duration: 4 },
    { line: "Navigation locked. Enemies incoming — stay sharp.", duration: 4 },
    { line: "Shields at full. Time to show them what we've got.", duration: 4 },
    { line: "I've got your back out there. Good luck.", duration: 4 },
    { line: "Weapon systems primed. Let's do this.", duration: 4 },
  ],

  // ─── STORY 30.2: System Arrival ───────────────────────────────────────────
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

  // ─── STORY 30.3: Contextual Events ────────────────────────────────────────
  'planet-radar': [
    { line: "A planet on radar — worth scanning if you get a moment.", duration: 4 },
    { line: "Oh, a planet nearby. Could have something useful on it.", duration: 4 },
    { line: "Planet detected. Your call, pilot.", duration: 3 },
  ],
  'wormhole-spawn': [
    { line: "The wormhole just opened! Time to push through.", duration: 4 },
    { line: "There it is — the way out. Go!", duration: 3 },
    { line: "Wormhole detected. Clear the path and let's move.", duration: 4 },
  ],
  'boss-spawn': [
    { line: "That's the guardian of this system. We need to take it down.", duration: 5 },
    { line: "Big contact — hostile, massive. This is the boss fight, pilot.", duration: 5 },
    { line: "Titan Cruiser incoming. All weapons, go!", duration: 4 },
  ],
  'low-hp-warning': [
    { line: "Hull integrity critical — don't get hit again!", duration: 4 },
    { line: "We're taking heavy damage. Disengage if you can!", duration: 4 },
    { line: "Shields down, hull compromised. Careful out there.", duration: 4 },
  ],
  'boss-defeat': [
    { line: "It's down! Nice flying, pilot.", duration: 4 },
    { line: "Target destroyed. Let's get to that wormhole.", duration: 4 },
    { line: "We got it! Now move — more will come.", duration: 4 },
  ],
}

export function getRandomLine(eventKey) {
  const entries = DIALOGUE_EVENTS[eventKey]
  if (!entries || entries.length === 0) return null
  return entries[Math.floor(Math.random() * entries.length)]
}
```

### Extensibility Pattern — Developer Guide

**To add a new companion event (e.g., 'scan-complete'):**

1. Add to `DIALOGUE_EVENTS` in `src/entities/companionDefs.js`:
```javascript
'scan-complete': [
  { line: "Scan complete. Data uploaded.", duration: 3 },
  { line: "Got what we needed. Good work.", duration: 3 },
],
```

2. Call trigger at the right moment (e.g., in `Interface.jsx` useEffect, or a store action via `getState()`):
```javascript
useCompanion.getState().trigger('scan-complete')
// For high-priority (bypasses current dialogue queue):
useCompanion.getState().trigger('boss-spawn', 'high')
```

**That's it. No other files need to change.**

### Priority Is Set at Call Site, Not in Defs

Priority (`'normal'` | `'high'`) is **not** stored in the line object — it's passed as the second argument to `trigger()`. This keeps the defs file focused on content (text, duration) and lets the caller decide urgency based on context.

```javascript
// Normal priority (queues behind current dialogue)
useCompanion.getState().trigger('planet-radar')

// High priority (immediately replaces current dialogue)
useCompanion.getState().trigger('wormhole-spawn', 'high')
useCompanion.getState().trigger('boss-spawn', 'high')
```

Per the epic's technical notes, `wormhole-spawn` and `boss-spawn` should always be called with `'high'` priority — this is the caller's responsibility (handled in Stories 30.2/30.3 trigger code).

### Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `src/entities/companionDefs.js` | **MODIFY** | Add 8 event keys with all dialogue lines + section comments |

Zero new files created. Zero changes to Interface.jsx, useCompanion.jsx, or any component.

### Architecture Compliance

- `companionDefs.js` is **Layer 1 (Config/Data)** — pure JS, no React, no store imports. This must be preserved. The file already satisfies this constraint.
- `getRandomLine()` is the only helper — no complex logic belongs in this file.
- `COMPANION` export is referenced by `CompanionDialogue.jsx` via import. Verify it reads `COMPANION.name` and `COMPANION.icon` from there (not hardcoded).

### Previous Story Intelligence (30.1 → 30.3)

| Story | What was established |
|-------|----------------------|
| 30.1 | `useCompanion` store, `CompanionDialogue.jsx`, `companionDefs.js` structure, `getRandomLine()`, `shownEvents` Set, `markShown`/`hasShown` pattern |
| 30.2 | (ready-for-dev) Interface.jsx trigger for `system-arrival-N`, `useLevel.getState().currentSystem` pattern, `prevPhaseRef` ordering |
| 30.3 | (ready-for-dev) 5 contextual triggers in Interface.jsx, transition-tracking refs, `hasShown` for one-shot events |

Story 30.4 complements all three by ensuring the defs file is complete regardless of 30.2/30.3 implementation order.

### Git Intelligence

Recent companion-related commits:
```
e50fe61 feat: companion dialogue UI infrastructure with fade-out fix (Story 30.1)
```

Commit format for this story: `feat: complete companion dialogue definitions (Story 30.4)`

This story modifies only `src/entities/companionDefs.js` — a small, focused diff.

### Project Structure Notes

- `src/entities/companionDefs.js` → Layer 1 data (pure JS, no imports)
- No other layer touched

### References

- Epic 30: `_bmad-output/planning-artifacts/epic-30-companion-narrative.md` → Story 30.4 acceptance criteria, all dialogue lines for all events
- Story 30.2: `_bmad-output/implementation-artifacts/30-2-system-arrival-navigation-dialogues.md` → system-arrival-1/2/3 exact line text and duration values
- Story 30.3: `_bmad-output/implementation-artifacts/30-3-contextual-event-dialogues.md` → 5 contextual event keys, exact line text, priority rules
- Story 30.1: `_bmad-output/implementation-artifacts/30-1-companion-dialogue-ui-component.md` → `useCompanion` store API, `trigger(key, priority)` signature
- `src/entities/companionDefs.js` → current file (only `test-hello` populated after 30.1)
- `src/stores/useCompanion.jsx` → `trigger()` implementation, priority handling logic

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implementation was completed incrementally: system-arrival events added in Story 30.2, contextual events added in Story 30.3. Story 30.4 reviewed and verified the final consolidated state.
- `COMPANION.icon` ('🛸') now consumed by `CompanionDialogue.jsx` as emoji fallback when avatar image `/assets/navi.png` fails to load.
- Automated test suite created in `src/entities/__tests__/companionDefs.test.js` following project defs testing pattern.

### File List

- `src/entities/companionDefs.js` — modified: all 8 production event keys added with 3 dialogue lines each
- `src/ui/CompanionDialogue.jsx` — modified: `CompanionAvatar` sub-component added to use `COMPANION.icon` as image fallback (review fix)
- `src/entities/__tests__/companionDefs.test.js` — created: automated tests for COMPANION identity, event catalogue, line schema, and `getRandomLine` behaviour (review fix)
