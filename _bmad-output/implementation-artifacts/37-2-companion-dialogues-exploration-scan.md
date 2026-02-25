# Story 37.2: Companion Dialogues — Exploration & Scan Guidance

Status: done

## Story

As a player,
I want ARIA to hint at scanning planets when I arrive in a system,
so that the exploration objective is clear from the start without reading a tutorial.

## Acceptance Criteria

1. **[system-arrival scan lines]** `system-arrival-1`, `system-arrival-2`, `system-arrival-3` each gain at least 2 new lines that mention scanning planets to find/open the wormhole. Existing 3 lines are preserved (appended, not replaced).

2. **[system-arrival-1 directive]** At least one of the new lines in `system-arrival-1` is strongly directive — unambiguously tells the player that scanning is the primary task (first system, first impression).

3. **[near-wormhole-threshold event]** A new event `'near-wormhole-threshold'` is added to `DIALOGUE_EVENTS` in `companionDefs.js` with exactly 3 lines and `duration: 4` each:
   - `"One more scan. The wormhole is almost ready."`
   - `"Almost there — one more planet and the passage opens."`
   - `"Last scan. Do it and we're through."`

4. **[GameLoop trigger]** After `scanResult.completed` in GameLoop section 7g, the near-threshold companion hint fires when `scannedCount === nearThreshold - 1` and has not fired yet this run (one-shot via `markShown`/`hasShown`).

5. **[one-shot per run]** `near-wormhole-threshold` fires at most once per run — the `shownEvents` Set in `useCompanion.jsx` is not cleared between systems (`clearQueue()` preserves it), only on full run reset (`reset()`).

6. **[wormhole-spawn lines unchanged]** Existing `'wormhole-spawn'` lines are reviewed and confirmed still valid (neutral — no reference to timer or scan as cause). No changes needed.

7. **[test file updated]** `companionDefs.test.js` is updated:
   - `'near-wormhole-threshold'` added to `PRODUCTION_EVENT_KEYS`
   - The `'has exactly 3 lines'` test updated to `toBeGreaterThanOrEqual(3)` (system-arrival events will have 5 lines)
   - All existing tests still pass

## Tasks / Subtasks

- [x] Task 1 — Update `src/entities/companionDefs.js` (AC: #1, #2, #3, #6)
  - [x] 1.1 Append ≥2 scan-hinting lines to `system-arrival-1` (existing 3 preserved → total ≥5)
    - At least one line must be strongly directive: scanning is the primary task
  - [x] 1.2 Append ≥2 scan-hinting lines to `system-arrival-2` (existing 3 preserved → total ≥5)
  - [x] 1.3 Append ≥2 scan-hinting lines to `system-arrival-3` (existing 3 preserved → total ≥5)
  - [x] 1.4 Add `'near-wormhole-threshold'` event with exactly 3 lines, `duration: 4` each (verbatim from AC #3)
  - [x] 1.5 Review `'wormhole-spawn'` — confirm neutral wording, no changes needed

- [x] Task 2 — Update `src/GameLoop.jsx` (AC: #4, #5)
  - [x] 2.1 Locate `// Scan completed successfully` block at ~line 748
  - [x] 2.2 After `useGame.getState().triggerPlanetReward(scanResult.tier)`, add near-threshold trigger (see Dev Notes for exact code)
  - [x] 2.3 No new imports required — `useCompanion` and `GAME_CONFIG` already imported

- [x] Task 3 — Update `src/entities/__tests__/companionDefs.test.js` (AC: #7)
  - [x] 3.1 Add `'near-wormhole-threshold'` to `PRODUCTION_EVENT_KEYS` array (line ~4)
  - [x] 3.2 Change `toHaveLength(3)` → `toBeGreaterThanOrEqual(3)` in the "has exactly 3 lines" test (line ~37)
  - [x] 3.3 Run tests: `npx vitest run src/entities/__tests__/companionDefs.test.js` — all green

- [x] Task 4 — Run full test suite (AC: all)
  - [x] 4.1 `npx vitest run` — all tests pass

## Dev Notes

### GameLoop.jsx — Exact Code Change (Task 2.2)

**Location:** `src/GameLoop.jsx`, scan completion block (~line 748):

**BEFORE:**
```js
// Scan completed successfully
if (scanResult.completed) {
  stopScanLoop()
  playSFX('scan-complete')
  useGame.getState().triggerPlanetReward(scanResult.tier)
}
```

**AFTER:**
```js
// Scan completed successfully
if (scanResult.completed) {
  stopScanLoop()
  playSFX('scan-complete')
  useGame.getState().triggerPlanetReward(scanResult.tier)
  // Story 37.2: Near-wormhole-threshold companion hint (one-shot per run)
  // TODO(34.4): Replace with galaxyConfig.wormholeThreshold × planetCount when scan-based wormhole is live
  if (!useCompanion.getState().hasShown('near-wormhole-threshold')) {
    const totalPlanets = GAME_CONFIG.PLANET_COUNT_SILVER + GAME_CONFIG.PLANET_COUNT_GOLD + GAME_CONFIG.PLANET_COUNT_PLATINUM
    const nearThreshold = Math.ceil(totalPlanets * 0.75) // 75% threshold = 6 of 7
    const scannedCount = useLevel.getState().planets.filter(p => p.scanned).length
    if (scannedCount === nearThreshold - 1) {
      useCompanion.getState().trigger('near-wormhole-threshold')
      useCompanion.getState().markShown('near-wormhole-threshold')
    }
  }
}
```

**No new imports needed:**
- `useCompanion` — already imported at line 28 (`import useCompanion from './stores/useCompanion.jsx'`)
- `GAME_CONFIG` — already imported at line 17
- `useLevel` — already imported at line 7

**Why `useLevel.getState()` fresh (not `levelState`)?**
`levelState` is captured at ~line 555, BEFORE `scanningTick()` at ~line 733. The newly scanned planet is written to the Zustand store inside `scanningTick()`, so `useLevel.getState().planets` here reflects the post-scan state (planet just marked `scanned: true`). Reusing `levelState` would give a count 1 too low.

**Threshold math (current planet counts):**
- `PLANET_COUNT_SILVER: 4`, `PLANET_COUNT_GOLD: 2`, `PLANET_COUNT_PLATINUM: 1` → total = 7
- `Math.ceil(7 * 0.75)` = `Math.ceil(5.25)` = 6
- `nearThreshold - 1` = 5 → triggers when 5th planet is scanned

**TODO(34.4) note:** Story 34.4 (`ready-for-dev`) will add `galaxyConfig.planetCount` and `galaxyConfig.wormholeThreshold` to `galaxyDefs.js`, and change the wormhole to spawn at scan-based threshold. At that point, update this block to use:
```js
const gc = getGalaxyById(useGame.getState().selectedGalaxyId)
const totalPlanets = gc?.planetCount ?? useLevel.getState().planets.length
const wormholeRatio = gc?.wormholeThreshold ?? 0.75
const nearThreshold = Math.ceil(totalPlanets * wormholeRatio)
```
This would also require importing `getGalaxyById` from `'./entities/galaxyDefs.js'`.

### companionDefs.js — Content Reference

**Current lines (MUST be preserved verbatim):**
```js
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

**New lines to append (from epic AC — dev can adapt wording):**
```js
// system-arrival-1 additions (at least one strongly directive):
{ line: "Scan the planets in this sector — that's how we find the passage out.", duration: 4 }, // directive
{ line: "This system's wormhole is dormant. Scan enough planets and it'll wake up.", duration: 4 },

// system-arrival-2 additions:
{ line: "Detecting multiple planet signatures. Get scanning, that's our way through.", duration: 4 },
{ line: "The wormhole won't reveal itself. We need to sweep those planets first.", duration: 4 },

// system-arrival-3 additions:
{ line: "Last system. Scan those planets — the wormhole won't open itself.", duration: 4 },
{ line: "Find the planets, scan them, and we're done here.", duration: 4 },
```

**New event:**
```js
'near-wormhole-threshold': [
  { line: "One more scan. The wormhole is almost ready.", duration: 4 },
  { line: "Almost there — one more planet and the passage opens.", duration: 4 },
  { line: "Last scan. Do it and we're through.", duration: 4 },
],
```

### wormhole-spawn Review

Existing lines are neutral (no mention of timer or scan as cause) — valid for both scan-based and timer-based trigger:
- "The wormhole just opened! Time to push through."
- "There it is — the way out. Go!"
- "Wormhole detected. Clear the path and let's move."

**No changes needed.** ✓

### ⚠️ Critical: companionDefs.test.js Requires Update (Task 3)

**This test WILL FAIL if not updated:**

```js
// Line ~37 in src/entities/__tests__/companionDefs.test.js
// CURRENT — breaks because system-arrival-* events will have 5 lines:
it.each(PRODUCTION_EVENT_KEYS)('%s — has exactly 3 lines', (key) => {
  expect(DIALOGUE_EVENTS[key]).toHaveLength(3)  // ← FAILS for system-arrival-*
})

// AFTER — update to at least 3:
it.each(PRODUCTION_EVENT_KEYS)('%s — has at least 3 lines', (key) => {
  expect(DIALOGUE_EVENTS[key].length).toBeGreaterThanOrEqual(3)  // ← passes
})
```

**Also update `PRODUCTION_EVENT_KEYS` (line ~4):**
```js
const PRODUCTION_EVENT_KEYS = [
  'system-arrival-1',
  'system-arrival-2',
  'system-arrival-3',
  'planet-radar',
  'wormhole-spawn',
  'boss-spawn',
  'low-hp-warning',
  'boss-defeat',
  'near-wormhole-threshold',  // ← ADD THIS
]
```

The test at line ~56 (`boss-spawn has duration >= 4`) is unaffected.

### One-Shot Scope — Per-Run Not Per-System

`shownEvents` in `useCompanion.jsx` is a module-level Set:
- **`clearQueue()`** (called between systems at GameLoop ~line 131): clears `current`/`queue` only — `shownEvents` PRESERVED
- **`reset()`** (called on full restart at GameLoop ~line 155): clears `shownEvents`

Consequence: `near-wormhole-threshold` fires at most once per run. After triggering in system 1, it does not re-fire in systems 2 or 3. This is correct per AC #5 and consistent with `planet-radar` and `low-hp-warning` (same pattern).

### Architecture Compliance

- `companionDefs.js` is Layer 1 (Config/Data) — no imports from stores or React ✓
- `GameLoop.jsx` is Layer 4 — companion triggers from GameLoop follows established pattern ✓
- `useCompanion` API (`trigger`, `markShown`, `hasShown`) unchanged — no store modifications ✓
- No new imports needed in GameLoop

### Project Structure Notes

**Files touched:**
- `src/entities/companionDefs.js` — append lines to `system-arrival-1/2/3`, add `near-wormhole-threshold`
- `src/GameLoop.jsx` — add near-threshold trigger block in scan completion (~line 752)
- `src/entities/__tests__/companionDefs.test.js` — update line count test + add new event key

**Files NOT touched:**
- `src/stores/useCompanion.jsx` — no API changes needed
- `src/ui/CompanionDialogue.jsx` — reskinned in Story 37.1, untouched here
- `src/style.css` — all `--rs-*` variables confirmed present (Story 37.1)

### References

- [Source: _bmad-output/planning-artifacts/epic-37-companion-ui-polish.md#Story 37.2] — full AC and Technical Notes
- [Source: src/entities/companionDefs.js] — current DIALOGUE_EVENTS structure; `system-arrival-*` have 3 lines each
- [Source: src/stores/useCompanion.jsx] — `trigger`, `markShown`, `hasShown`, `clearQueue`, `reset` API
- [Source: src/GameLoop.jsx#28] — `useCompanion` already imported
- [Source: src/GameLoop.jsx#131] — `clearQueue()` between systems (preserves shownEvents)
- [Source: src/GameLoop.jsx#155] — `reset()` on full restart (clears shownEvents)
- [Source: src/GameLoop.jsx#748–753] — scan completion block (insertion point)
- [Source: src/config/gameConfig.js#168–170] — `PLANET_COUNT_SILVER: 4`, `PLANET_COUNT_GOLD: 2`, `PLANET_COUNT_PLATINUM: 1`
- [Source: src/entities/__tests__/companionDefs.test.js#4–13] — `PRODUCTION_EVENT_KEYS` array to extend
- [Source: src/entities/__tests__/companionDefs.test.js#37] — `toHaveLength(3)` test that must become `toBeGreaterThanOrEqual(3)`
- [Source: _bmad-output/implementation-artifacts/37-1-companion-dialogue-reskin.md] — previous story (CSS-only; all CSS vars confirmed present; CompanionDialogue Redshift-compliant)
- [Source: _bmad-output/implementation-artifacts/34-4-wormhole-scan-based-trigger.md] — future threshold formula; `getGalaxyById` approach documented for TODO(34.4)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation straightforward. Note: Story 34.4 was already implemented, so the near-threshold trigger was placed inside the existing `if (scanGalaxyConfig && ...)` block (reusing already-computed `threshold` and `scannedCount`), which is cleaner than the Dev Notes' fallback approach using `GAME_CONFIG.PLANET_COUNT_*`.

### Completion Notes List

- ✅ Task 1: `companionDefs.js` — appended 2 scan-hinting lines to each system-arrival-1/2/3 (originals preserved). Added `near-wormhole-threshold` event with exactly 3 verbatim lines (duration: 4). Confirmed `wormhole-spawn` wording neutral, no changes.
- ✅ Task 2: `GameLoop.jsx` — added near-threshold companion hint inside existing 34.4 scan-galaxy-config block, reusing computed `threshold`/`scannedCount`. Guard: `hasShown('near-wormhole-threshold')` + `scannedCount === threshold - 1`. One-shot per run via `markShown`.
- ✅ Task 3: `companionDefs.test.js` — added `near-wormhole-threshold` to `PRODUCTION_EVENT_KEYS` (9 total), updated test count string, changed `toHaveLength(3)` → `toBeGreaterThanOrEqual(3)` with updated description.
- ✅ Task 4: All 2532 tests pass across 148 test files, zero regressions.

### File List

- src/entities/companionDefs.js
- src/GameLoop.jsx
- src/entities/__tests__/companionDefs.test.js
- src/stores/__tests__/useCompanion.test.js

### Senior Developer Review (AI)

**Date:** 2026-02-24 | **Reviewer:** Adam (AI Code Review)

**Verdict: APPROVED after fixes**

All 7 ACs fully implemented and verified against source. 2 issues fixed during review:

**Fixed — HIGH**: `useCompanion.test.js` clearQueue/reset preservation tests did not include `near-wormhole-threshold` (AC #5 explicitly requires this event to be one-shot per run). Added to existing tests + added dedicated `near-wormhole-threshold one-shot` describe block (3 new tests).

**Fixed — MEDIUM**: No test covered the `trigger → markShown → hasShown guard → blocks second trigger` sequence for this specific event. New describe block explicitly tests: fires once, survives system transition, resets on new run.

**Fixed — LOW**: Stale comment in `companionDefs.test.js` line 83 (`// With 3 lines and 50 draws`) updated to reflect 5 lines post-37.2.

**Test count:** 64 tests pass across both modified test files (21 useCompanion +3, 43 companionDefs unchanged count).

## Change Log

- 2026-02-24: Implemented Story 37.2 — ARIA scan guidance dialogues. Added 2 scan-hinting lines per system-arrival event (total 5 lines each), added `near-wormhole-threshold` one-shot event (3 lines), wired GameLoop trigger at scan threshold - 1. Updated companion test suite (9 event keys, flexible line count). 2532 tests pass.
- 2026-02-24: Code review fixes — added `near-wormhole-threshold` to useCompanion clearQueue/reset tests; added dedicated one-shot behavior describe block (3 tests); fixed stale comment in companionDefs.test.js.
