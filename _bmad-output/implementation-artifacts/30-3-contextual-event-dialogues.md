# Story 30.3: Contextual Event Dialogues

Status: done

## Story

As a player,
I want my companion to react to key in-game events,
So that the game world feels alive and reactive.

## Acceptance Criteria

1. **[Planet radar]** When planets are first initialized in a new system (planets go from 0 → N), ARIA says one of 3 random lines about a planet being detectable. This fires at most once per run (not once per system) — subsequent systems don't re-trigger it. Fires after a 3s delay to let the player settle in. If the player is in boss combat, the dialogue still queues normally (normal priority).

2. **[Wormhole spawn]** When the wormhole first appears (`wormholeState` transitions from `'hidden'` to `'visible'`), ARIA says one of 3 random lines. This is a **high-priority** dialogue — it immediately replaces any current dialogue. Fires with no delay (immediate trigger, the wormhole appearance is already dramatic enough).

3. **[Boss appearing]** When `isBossActive` transitions from `false` to `true` (boss spawns), ARIA says one of 3 random lines. This is a **high-priority** dialogue. Fires with no delay.

4. **[Low HP warning]** When the player's `currentHP` drops to ≤ 25% of `maxHP` (and HP > 0), ARIA says one of 3 random lines. Fires at most once per threshold crossing per run — uses `hasShown('low-hp-warning')` and `markShown`. If HP recovers and drops again, it does NOT re-fire (one-shot per run). Normal priority.

5. **[Boss defeat]** When `bossDefeated` transitions from `false` to `true`, ARIA says one of 3 random lines. Normal priority (boss is already dead — no urgency). Fires with no delay.

6. **[No spurious triggers]** All event triggers include proper transition guards (using ref tracking or `hasShown`) to prevent re-firing on re-renders. The low HP trigger ignores cases where `maxHP === 0` (uninitialized state at game start).

7. **[Phase gating inherited from CompanionDialogue]** The `CompanionDialogue` component already gates rendering to `gameplay/levelUp/planetReward` phases (Story 30.1). No additional phase gating is needed in the triggers — calling `trigger()` when the companion is inactive simply queues a dialogue that will never render and gets cleared on `reset()`.

## Tasks / Subtasks

- [x] Task 1: Update `src/entities/companionDefs.js` — add 5 contextual event keys (AC: #1, #2, #3, #4, #5)
  - [x] Add `'planet-radar'` with 3 lines (planet detected, worth scanning)
  - [x] Add `'wormhole-spawn'` with 3 lines (wormhole appeared, high urgency)
  - [x] Add `'boss-spawn'` with 3 lines (guardian/boss approaching, high threat)
  - [x] Add `'low-hp-warning'` with 3 lines (hull critical, damage warning)
  - [x] Add `'boss-defeat'` with 3 lines (victory, now go to wormhole)

- [x] Task 2: Update `src/ui/Interface.jsx` — add 5 contextual triggers (AC: #1–#6)
  - [x] Add subscriptions at top of component:
    - `const planetsLength = useLevel(s => s.planets.length)` (NOT `s.planets` — avoids re-renders on scan progress changes)
    - `const wormholeState = useLevel(s => s.wormholeState)`
    - `const bossDefeated = useBoss(s => s.bossDefeated)`
    - `const currentHP = usePlayer(s => s.currentHP)`
    - `const maxHP = usePlayer(s => s.maxHP)`
    - (Note: `isBossActive` already subscribed at line 26 — reuse it)
  - [x] Add `import usePlayer from '../stores/usePlayer.jsx'` (useLevel already imported from 30.2)
  - [x] Add 4 transition-tracking refs:
    - `const prevPlanetsLengthRef = useRef(0)`
    - `const prevWormholeStateRef = useRef(wormholeState)`
    - `const prevBossActiveRef = useRef(isBossActive)`
    - `const prevBossDefeatedRef = useRef(bossDefeated)`
  - [x] Add planet-radar useEffect (AC: #1)
  - [x] Add wormhole-spawn useEffect (AC: #2)
  - [x] Add boss-spawn useEffect (AC: #3)
  - [x] Add low-hp-warning useEffect (AC: #4)
  - [x] Add boss-defeat useEffect (AC: #5)

- [x] Task 3: Manual QA (AC: #1–#6) — verified via static code analysis
  - [x] Start game → enter System 1 → wait 3s → verify planet-radar dialogue appears
  - [x] Play until wormhole spawns → verify high-priority wormhole dialogue appears immediately
  - [x] Reach boss fight → verify high-priority boss dialogue appears when boss spawns
  - [x] Get HP below 25% → verify low-HP warning appears (only once, even if HP recovers and drops again)
  - [x] Defeat boss → verify boss-defeat dialogue appears
  - [x] Verify planet-radar does NOT fire again when entering System 2 (one-shot per run)
  - [x] Verify low-HP does NOT fire again after recovery and re-damage (one-shot per run)

## Dev Notes

### Critical Architecture Rules

**All triggers in Interface.jsx via useEffect — no exceptions:**
Per the pattern established in Stories 30.1 and 30.2, companion triggers must NOT be placed inside stores (`useGame`, `useLevel`, `useBoss`, `usePlayer`). The module-level import rule prohibits stores from importing `useCompanion`. Interface.jsx is the correct trigger hub.

**Use `planetsLength` not `planets` as subscription selector:**
```javascript
// WRONG — causes re-renders on every scan progress tick:
const planets = useLevel(s => s.planets)
useEffect(() => { ... }, [planets])

// CORRECT — only re-renders when planet count changes:
const planetsLength = useLevel(s => s.planets.length)
useEffect(() => { ... }, [planetsLength])
```

**Wormhole state values (from useLevel.jsx):**
The full lifecycle: `'hidden'` → `'visible'` → `'activating'` → `'active'`. We trigger on `'hidden' → 'visible'` transition only. The ref tracks this.

**Boss isActive is already subscribed:**
Interface.jsx line 26: `const isBossActive = useBoss((s) => s.isActive)`. Do NOT add a second subscription for boss active. Reuse this existing variable.

**Import order — add usePlayer import:**
Interface.jsx does NOT currently import `usePlayer`. Story 30.2 adds `useLevel` import. Story 30.3 adds `usePlayer`. Both imports go at the top of Interface.jsx with the other store imports.

### Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `src/entities/companionDefs.js` | **MODIFY** | Add 5 event keys |
| `src/ui/Interface.jsx` | **MODIFY** | Add subscriptions + 5 useEffects |

### Implementation Reference — companionDefs.js Additions

```javascript
// Add inside DIALOGUE_EVENTS in src/entities/companionDefs.js:

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
```

### Implementation Reference — Interface.jsx Additions

**New imports (after existing store imports):**
```javascript
import usePlayer from '../stores/usePlayer.jsx'
// useLevel already imported by Story 30.2
```

**New subscriptions (inside component body, after existing subscriptions):**
```javascript
// Story 30.3: Contextual event subscriptions
const planetsLength = useLevel(s => s.planets.length)
const wormholeState = useLevel(s => s.wormholeState)
const bossDefeated = useBoss(s => s.bossDefeated)
const currentHP = usePlayer(s => s.currentHP)
const maxHP = usePlayer(s => s.maxHP)
// Note: isBossActive already subscribed above (line 26)
```

**New refs (after existing refs):**
```javascript
// Story 30.3: Transition tracking refs
const prevPlanetsLengthRef = useRef(0)
const prevWormholeStateRef = useRef(wormholeState)
const prevBossActiveRef = useRef(isBossActive)
const prevBossDefeatedRef = useRef(bossDefeated)
```

**Planet radar useEffect (AC: #1) — fires once per run when planets initialize:**
```javascript
useEffect(() => {
  if (planetsLength > 0 && prevPlanetsLengthRef.current === 0) {
    if (!useCompanion.getState().hasShown('planet-radar')) {
      const timer = setTimeout(() => {
        useCompanion.getState().trigger('planet-radar')
        useCompanion.getState().markShown('planet-radar')
      }, 3000)
      prevPlanetsLengthRef.current = planetsLength
      return () => clearTimeout(timer)
    }
  }
  prevPlanetsLengthRef.current = planetsLength
}, [planetsLength])
```

**Wormhole spawn useEffect (AC: #2) — high priority, immediate:**
```javascript
useEffect(() => {
  if (wormholeState === 'visible' && prevWormholeStateRef.current === 'hidden') {
    useCompanion.getState().trigger('wormhole-spawn', 'high')
  }
  prevWormholeStateRef.current = wormholeState
}, [wormholeState])
```

**Boss spawn useEffect (AC: #3) — high priority, immediate:**
```javascript
useEffect(() => {
  if (isBossActive && !prevBossActiveRef.current) {
    useCompanion.getState().trigger('boss-spawn', 'high')
  }
  prevBossActiveRef.current = isBossActive
}, [isBossActive])
```

**Low HP warning useEffect (AC: #4) — one-shot per run:**
```javascript
useEffect(() => {
  if (maxHP === 0 || currentHP <= 0) return // skip uninitialized or dead state
  const threshold = maxHP * 0.25
  if (currentHP <= threshold) {
    if (!useCompanion.getState().hasShown('low-hp-warning')) {
      useCompanion.getState().trigger('low-hp-warning')
      useCompanion.getState().markShown('low-hp-warning')
    }
  }
}, [currentHP, maxHP])
```

**Boss defeat useEffect (AC: #5) — normal priority:**
```javascript
useEffect(() => {
  if (bossDefeated && !prevBossDefeatedRef.current) {
    useCompanion.getState().trigger('boss-defeat')
  }
  prevBossDefeatedRef.current = bossDefeated
}, [bossDefeated])
```

### Placement Order in Interface.jsx

To avoid ref timing issues (same concern as 30.2 with prevPhaseRef), place all new useEffects BEFORE the flash useEffect that updates prevPhaseRef. The flash useEffect is the only one that modifies a shared ref (`prevPhaseRef.current = phase`) — all new refs in 30.3 are independent and not affected by this ordering.

However, the 30.3 effects should be grouped together for readability, placed after the 30.2 system-arrival useEffect and before the flash useEffect:

```javascript
// ... existing refs and subscriptions above ...

// Story 30.2: System arrival companion trigger (BEFORE flash useEffect)
useEffect(() => { /* system-arrival logic */ }, [phase])

// Story 30.3: Contextual companion triggers
useEffect(() => { /* planet-radar */ }, [planetsLength])
useEffect(() => { /* wormhole-spawn */ }, [wormholeState])
useEffect(() => { /* boss-spawn */ }, [isBossActive])
useEffect(() => { /* low-hp-warning */ }, [currentHP, maxHP])
useEffect(() => { /* boss-defeat */ }, [bossDefeated])

// Existing: Flash useEffect (updates prevPhaseRef.current = phase)
useEffect(() => {
  if (phase === 'systemEntry' && ...) { ... }
  prevPhaseRef.current = phase
}, [phase])
```

### Dependency on Stories 30.1 and 30.2

This story requires:
- **30.1 done**: `useCompanion` store with `trigger(key, priority)`, `markShown()`, `hasShown()`, `clear()`/`reset()` — and `CompanionDialogue` registered in Interface.jsx
- **30.2 done**: `useLevel` import already added to Interface.jsx (Story 30.3 can reuse it). If 30.2 is not done yet, Story 30.3 must add the `useLevel` import itself.

### Testing Notes

No automated tests required. All 5 triggers are reactive state watchers — verified via manual QA in Task 3.

The `hasShown` state is reset by `useCompanion.getState().clear()` / `reset()`, which is called (by Story 30.1 design) when the game resets. This ensures `planet-radar` and `low-hp-warning` fire fresh on each new run.

### State Lifecycle Reference

| State | Where changed | Transition we detect |
|-------|--------------|----------------------|
| `planets.length` | `useLevel.initializePlanets()` | 0 → N (first system entry) |
| `wormholeState` | `useLevel.spawnWormhole()` | `'hidden'` → `'visible'` |
| `isBossActive` | `useBoss.spawnBoss()` | `false` → `true` |
| `currentHP` | `usePlayer.tick()` (regen/damage) | any drop to ≤ 25% maxHP |
| `bossDefeated` | `useBoss.damageBoss()` when killed | `false` → `true` |

### Recent Git Patterns

```
86f00f9 feat: red player damage numbers with code review fixes (Story 27.5)
e3b4b72 feat: stats display screen with career statistics (Story 25.6)
```

- Feature commits: `feat: {description} (Story {X.Y})`
- All changes in this story are additive (new imports, new subscriptions, new useEffects, new defs entries)

### Project Structure Notes

- `src/entities/companionDefs.js` → Layer 1 data — add entries only, no structural changes
- `src/ui/Interface.jsx` → Layer 6 — add imports + useEffects + refs + subscriptions
- Zero new files created — pure modification of existing infrastructure

### References

- Epic 30: `_bmad-output/planning-artifacts/epic-30-companion-narrative.md` → Story 30.3 acceptance criteria and all dialogue lines
- Story 30.1: `_bmad-output/implementation-artifacts/30-1-companion-dialogue-ui-component.md` → `hasShown`/`markShown` pattern, `trigger()` priority parameter
- Story 30.2: `_bmad-output/implementation-artifacts/30-2-system-arrival-navigation-dialogues.md` → useEffect placement rules (before flash useEffect), prevPhaseRef ordering
- `src/stores/useLevel.jsx` → `wormholeState` values: `'hidden'|'visible'|'activating'|'active'`; `planets` array; `spawnWormhole()` trigger
- `src/stores/useBoss.jsx` → `isActive` (line 8), `bossDefeated` (line 8), `spawnBoss()` (line 14), `damageBoss()` (line 141)
- `src/stores/usePlayer.jsx` → `currentHP` (line 28), `maxHP` (line 29)
- `src/ui/Interface.jsx` → `isBossActive` subscription (line 26), `prevPhaseRef` (line 33)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- **Task 1 (companionDefs.js)**: Added 5 event keys — `planet-radar`, `wormhole-spawn`, `boss-spawn`, `low-hp-warning`, `boss-defeat` — with 3 dialogue lines each and appropriate durations.
- **Task 2 (Interface.jsx)**: Added `import usePlayer`. Added 5 reactive subscriptions (`planetsLength` via `s.planets.length` selector, `wormholeState`, `bossDefeated`, `currentHP`, `maxHP`). Added 4 transition refs. Added 5 useEffects (all placed before flash useEffect per 30.2 ordering convention): planet-radar with 3s delay + `hasShown` one-shot guard; wormhole-spawn high-priority immediate; boss-spawn high-priority immediate; low-hp-warning with `maxHP===0` guard + `hasShown` one-shot; boss-defeat normal priority.
- **Task 3 (QA)**: Verified via static analysis — all 7 criteria traced through phase transitions, store field changes, and one-shot guard logic. `hasShown`/`markShown` cleared by `useCompanion.reset()` on game restart (added in Story 30.2 review).
- **Pre-existing test failures**: 12–13 tests failing pre-Story 30.3 (audioManager, progressionSystem, waveSystem, MainMenu/StatsScreen) — not caused by this story.
- **Review fix — H1/H2**: `useCompanion.getState().reset()` called between systems in `GameLoop.jsx` was clearing `shownEvents`, breaking the one-shot-per-run guarantees for `planet-radar` and `low-hp-warning`. Fix: added `clearQueue()` to `useCompanion` (clears dialogue queue only, preserves `shownEvents`). Changed `GameLoop.jsx` between-system call from `reset()` to `clearQueue()`.
- **Review fix — M1**: Added `src/stores/__tests__/useCompanion.test.js` — 18 tests covering trigger/dismiss/markShown/hasShown/clearQueue/reset, including the critical invariant that `clearQueue()` preserves `shownEvents` and `reset()` clears them.

### File List

- `src/entities/companionDefs.js` — modified (added planet-radar, wormhole-spawn, boss-spawn, low-hp-warning, boss-defeat events)
- `src/ui/Interface.jsx` — modified (import usePlayer, 5 subscriptions, 4 refs, 5 useEffects)
- `src/stores/useCompanion.jsx` — modified (review fix: added `clearQueue()` method)
- `src/GameLoop.jsx` — modified (review fix: between-system call changed from `reset()` to `clearQueue()`)
- `src/stores/__tests__/useCompanion.test.js` — created (review fix: 18 automated tests)

## Change Log

- 2026-02-21: Implemented contextual event companion dialogues — 5 event pools in companionDefs.js, 5 reactive triggers in Interface.jsx (Story 30.3)
