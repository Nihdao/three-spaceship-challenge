# Story 25.5: Persistent Global Stats

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the game to track my career statistics across all runs,
So that I feel a sense of long-term progression and achievement.

## Acceptance Criteria

**Given** the global stats tracking system
**When** implemented
**Then** a new Zustand store (useGlobalStats) persists the following to localStorage:
  - Total enemies killed (all-time)
  - Total time survived (all-time, sum of all runs)
  - Total runs played
  - Total Fragments earned (all-time)
  - Most used weapons (by number of runs where weapon was acquired)
  - Most used boons (same as weapons)
  - Best run stats: highest system reached, longest single run time, most kills in a run, highest level reached in a run

**Given** a run ends (death or victory)
**When** stats are aggregated
**Then** the global stats store is updated with the run's data
**And** "best" records are compared and updated if beaten
**And** weapon/boon usage is incremented for items used in this run

**Given** the data structure
**When** designed
**Then** weapon/boon usage tracking uses a map: { weaponId: runCount }
**And** the store provides computed getters for "top 5 most used" etc.
**And** the store has a version field for future migration if the schema changes

## Tasks / Subtasks

- [x] Task 1: Create useGlobalStats store with persistence (AC: #1, #3)
  - [x] Create src/stores/useGlobalStats.jsx
  - [x] Create src/utils/globalStatsStorage.js (localStorage helpers)
  - [x] Define state structure: career stats, best run stats, weapon/boon usage maps
  - [x] Implement load from localStorage on init (with version migration support)
  - [x] Implement save to localStorage after updates
  - [x] Add version field for future schema changes (start with version: 1)

- [x] Task 2: Implement recordRunEnd action (AC: #2)
  - [x] Create recordRunEnd(runData) action
  - [x] runData includes: kills, timeSurvived, systemsReached, level, fragments, weaponsUsed[], boonsUsed[]
  - [x] Update career totals (totalKills, totalTimeSurvived, totalRuns, totalFragments)
  - [x] Update best run stats (compare and update if beaten)
  - [x] Increment weapon/boon usage counts
  - [x] Save to localStorage after update

- [x] Task 3: Implement computed getters (AC: #3)
  - [x] getTopWeapons(n = 5) — returns top N most used weapons with run counts
  - [x] getTopBoons(n = 5) — returns top N most used boons with run counts
  - [x] getBestRun() — returns object with all best run stats
  - [x] getCareerStats() — returns object with all career totals

- [x] Task 4: Integrate with game over flow (AC: #2)
  - [x] Modify src/ui/GameOverScreen.jsx or game over logic
  - [x] Collect run data when game over occurs (death or victory)
  - [x] Call useGlobalStats.recordRunEnd(runData)
  - [x] Ensure data includes: kills from useGame, time from useGame, fragments from usePlayer, weapons/boons from stores

- [x] Task 5: Integrate with victory flow (AC: #2)
  - [x] Modify victory screen logic (if different from game over)
  - [x] Collect run data when victory occurs
  - [x] Call useGlobalStats.recordRunEnd(runData)

- [x] Task 6: Write tests
  - [x] Test useGlobalStats: recordRunEnd updates career totals
  - [x] Test useGlobalStats: recordRunEnd updates best run stats (beats previous best)
  - [x] Test useGlobalStats: recordRunEnd does NOT update best if not beaten
  - [x] Test useGlobalStats: weapon/boon usage increments correctly
  - [x] Test useGlobalStats: getTopWeapons returns sorted by run count
  - [x] Test useGlobalStats: getTopBoons returns sorted by run count
  - [x] Test useGlobalStats: persistence to localStorage
  - [x] Test useGlobalStats: load from localStorage on init
  - [x] Test useGlobalStats: version migration (if version 0 or missing → migrate to version 1)

## Dev Notes

### Architecture Alignment

This story creates the **global stats tracking system** for career progression across all runs. It introduces a new persistent store that aggregates run data at game over and victory.

**6-Layer Architecture:**
- **Config Layer**: No new config files (reads from existing stores)
- **Stores Layer**: `src/stores/useGlobalStats.jsx` (NEW - this story)
- **Utils Layer**: `src/utils/globalStatsStorage.js` (NEW - localStorage helpers)
- **UI Layer**: `src/ui/GameOverScreen.jsx` (MODIFY - call recordRunEnd)
- **UI Layer**: `src/ui/VictoryScreen.jsx` (MODIFY - call recordRunEnd, if separate from game over)

**This story does NOT touch:**
- Stats Display Screen (Story 25.6 - next story)
- Ship leveling (Story 25.1-25.2)
- Galaxy selection (Story 25.3)
- Armory (Story 25.4)

**This story prepares for:**
- Story 25.6: Stats Display Screen (will read from useGlobalStats)

### Store Structure & Persistence Pattern

Following the **useUpgrades persistence pattern** from Story 20.1, this store uses a dedicated storage utility module.

**State Structure:**
```javascript
{
  version: 1,  // For future schema migrations

  // Career totals (sum across all runs)
  totalKills: 0,
  totalTimeSurvived: 0,  // in seconds
  totalRuns: 0,
  totalFragments: 0,

  // Best run records
  bestRun: {
    highestSystem: 1,      // e.g., System 3 = value 3
    longestTime: 0,        // in seconds
    mostKills: 0,
    highestLevel: 1,
  },

  // Weapon usage tracking (by run count, not total fires)
  weaponUsage: {},  // { 'LASER_FRONT': 5, 'SPREAD_SHOT': 3, ... }

  // Boon usage tracking (by run count, not total applications)
  boonUsage: {},    // { 'DAMAGE_AMP': 8, 'SPEED_BOOST': 6, ... }
}
```

**Storage Pattern (from useUpgrades):**
```javascript
// src/utils/globalStatsStorage.js
export const STORAGE_KEY_GLOBAL_STATS = 'SPACESHIP_GLOBAL_STATS'

export function getPersistedGlobalStats() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_GLOBAL_STATS)
    if (stored !== null) {
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed === 'object') {
        // Version migration logic here if needed
        if (!parsed.version || parsed.version < 1) {
          // Migrate from old format to version 1
          return getDefaultStats()
        }
        return parsed
      }
    }
  } catch {
    // localStorage unavailable or parse error
  }
  return getDefaultStats()
}

function getDefaultStats() {
  return {
    version: 1,
    totalKills: 0,
    totalTimeSurvived: 0,
    totalRuns: 0,
    totalFragments: 0,
    bestRun: { highestSystem: 1, longestTime: 0, mostKills: 0, highestLevel: 1 },
    weaponUsage: {},
    boonUsage: {},
  }
}

export function setPersistedGlobalStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL_STATS, JSON.stringify(stats))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}
```

**Store Structure (useGlobalStats.jsx):**
```javascript
import { create } from 'zustand'
import { getPersistedGlobalStats, setPersistedGlobalStats } from '../utils/globalStatsStorage.js'

const useGlobalStats = create((set, get) => ({
  // --- State (loaded from localStorage) ---
  ...getPersistedGlobalStats(),

  // --- Actions ---
  recordRunEnd: (runData) => {
    const state = get()

    // Update career totals
    const newTotalKills = state.totalKills + runData.kills
    const newTotalTime = state.totalTimeSurvived + runData.timeSurvived
    const newTotalRuns = state.totalRuns + 1
    const newTotalFragments = state.totalFragments + runData.fragments

    // Update best run stats (compare and update if beaten)
    const newBestRun = { ...state.bestRun }
    if (runData.systemsReached > newBestRun.highestSystem) {
      newBestRun.highestSystem = runData.systemsReached
    }
    if (runData.timeSurvived > newBestRun.longestTime) {
      newBestRun.longestTime = runData.timeSurvived
    }
    if (runData.kills > newBestRun.mostKills) {
      newBestRun.mostKills = runData.kills
    }
    if (runData.level > newBestRun.highestLevel) {
      newBestRun.highestLevel = runData.level
    }

    // Increment weapon/boon usage (by run count, not total uses)
    const newWeaponUsage = { ...state.weaponUsage }
    for (const weaponId of runData.weaponsUsed) {
      newWeaponUsage[weaponId] = (newWeaponUsage[weaponId] || 0) + 1
    }

    const newBoonUsage = { ...state.boonUsage }
    for (const boonId of runData.boonsUsed) {
      newBoonUsage[boonId] = (newBoonUsage[boonId] || 0) + 1
    }

    // Update state
    const newState = {
      version: 1,
      totalKills: newTotalKills,
      totalTimeSurvived: newTotalTime,
      totalRuns: newTotalRuns,
      totalFragments: newTotalFragments,
      bestRun: newBestRun,
      weaponUsage: newWeaponUsage,
      boonUsage: newBoonUsage,
    }

    set(newState)
    setPersistedGlobalStats(newState)
  },

  // --- Getters (computed) ---
  getTopWeapons: (n = 5) => {
    const state = get()
    const entries = Object.entries(state.weaponUsage)
    entries.sort((a, b) => b[1] - a[1])  // Sort by count descending
    return entries.slice(0, n).map(([id, count]) => ({ weaponId: id, runCount: count }))
  },

  getTopBoons: (n = 5) => {
    const state = get()
    const entries = Object.entries(state.boonUsage)
    entries.sort((a, b) => b[1] - a[1])  // Sort by count descending
    return entries.slice(0, n).map(([id, count]) => ({ boonId: id, runCount: count }))
  },

  getBestRun: () => get().bestRun,

  getCareerStats: () => {
    const state = get()
    return {
      totalKills: state.totalKills,
      totalTimeSurvived: state.totalTimeSurvived,
      totalRuns: state.totalRuns,
      totalFragments: state.totalFragments,
    }
  },

  // --- Reset (for testing or factory reset) ---
  reset: () => {
    const defaultStats = {
      version: 1,
      totalKills: 0,
      totalTimeSurvived: 0,
      totalRuns: 0,
      totalFragments: 0,
      bestRun: { highestSystem: 1, longestTime: 0, mostKills: 0, highestLevel: 1 },
      weaponUsage: {},
      boonUsage: {},
    }
    set(defaultStats)
    setPersistedGlobalStats(defaultStats)
  },
}))

export default useGlobalStats
```

### Integration Points

**Where to collect run data:**

The run data must be collected at game over (death or victory). The following stores/systems provide the needed data:

**Data Sources:**
- **Kills**: `useEnemies.getState().totalKills` (Epic 2 Story 2.4 - combat resolution)
- **Time Survived**: `useGame.getState().elapsedTime` or similar timer tracking total play time
- **Systems Reached**: `useLevel.getState().currentSystemIndex` or `useGame.getState().currentSystem`
- **Level**: `usePlayer.getState().currentLevel` (Epic 3 Story 3.2 - level-up system)
- **Fragments**: `usePlayer.getState().fragments` (Epic 7 Story 7.1 - fragments)
- **Weapons Used**: `useWeapons.getState().activeWeapons` → map to weapon IDs
- **Boons Used**: `useBoons.getState().activeBoons` → map to boon IDs

**Integration in GameOverScreen.jsx:**

```javascript
// In GameOverScreen.jsx or game over trigger logic
import useGlobalStats from '../stores/useGlobalStats.jsx'
import useEnemies from '../stores/useEnemies.jsx'
import useGame from '../stores/useGame.jsx'
import useLevel from '../stores/useLevel.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'

// When game over occurs (death or victory):
const recordGlobalStats = () => {
  const runData = {
    kills: useEnemies.getState().totalKills || 0,
    timeSurvived: useGame.getState().elapsedTime || 0,  // Needs verification of field name
    systemsReached: useLevel.getState().currentSystemIndex || 1,
    level: usePlayer.getState().currentLevel || 1,
    fragments: usePlayer.getState().fragments || 0,
    weaponsUsed: useWeapons.getState().activeWeapons.map(w => w.id).filter(Boolean),
    boonsUsed: useBoons.getState().activeBoons.map(b => b.id).filter(Boolean),
  }

  useGlobalStats.getState().recordRunEnd(runData)
}

// Call this in useEffect on game over state change or in game over handler
useEffect(() => {
  if (gamePhase === 'gameOver') {
    recordGlobalStats()
  }
}, [gamePhase])
```

**CRITICAL:** Verify exact field names in existing stores:
- `useEnemies.totalKills` existence
- `useGame.elapsedTime` or equivalent timer field
- `useLevel.currentSystemIndex` or equivalent
- `useWeapons.activeWeapons` structure (array of objects with `id` field?)
- `useBoons.activeBoons` structure (array of objects with `id` field?)

These field names may vary — check existing store implementations before integration.

### Data Collection Details

**Weapons Used Tracking:**

Weapons are acquired through level-up choices or planet scans. The `useWeapons` store tracks active weapons in the current run.

Expected structure (verify in useWeapons.jsx):
```javascript
useWeapons.getState().activeWeapons = [
  { id: 'LASER_FRONT', level: 5, ... },
  { id: 'SPREAD_SHOT', level: 2, ... },
  // ... up to 4 weapons
]
```

Extract weapon IDs:
```javascript
const weaponsUsed = useWeapons.getState().activeWeapons
  .map(w => w.id)
  .filter(Boolean)  // Remove null/undefined slots
```

**Boons Used Tracking:**

Boons are acquired through level-up choices or planet scans. The `useBoons` store tracks active boons in the current run.

Expected structure (verify in useBoons.jsx):
```javascript
useBoons.getState().activeBoons = [
  { id: 'DAMAGE_AMP', level: 2, ... },
  { id: 'SPEED_BOOST', level: 1, ... },
  // ... up to 3 boons
]
```

Extract boon IDs:
```javascript
const boonsUsed = useBoons.getState().activeBoons
  .map(b => b.id)
  .filter(Boolean)  // Remove null/undefined slots
```

**Time Tracking:**

The game has a 10-minute system timer (Epic 4 Story 4.2 - gameplay HUD). The elapsed time for global stats should be the **total time survived across all systems**, not just the current system timer.

Possible fields to check in `useGame`:
- `elapsedTime` — total time since run start
- `totalPlayTime` — cumulative time
- `systemTimer` — current system timer (NOT this — resets per system)

If no existing total elapsed time field, may need to add tracking in `useGame` or calculate from system transitions.

### Testing Standards

**Store Tests (src/stores/__tests__/useGlobalStats.test.js):**

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import useGlobalStats from '../useGlobalStats.jsx'

describe('useGlobalStats', () => {
  beforeEach(() => {
    localStorage.clear()
    useGlobalStats.getState().reset()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('initializes with default stats', () => {
    const state = useGlobalStats.getState()
    expect(state.version).toBe(1)
    expect(state.totalKills).toBe(0)
    expect(state.totalRuns).toBe(0)
  })

  it('recordRunEnd updates career totals', () => {
    const runData = {
      kills: 50,
      timeSurvived: 300,
      systemsReached: 2,
      level: 10,
      fragments: 100,
      weaponsUsed: ['LASER_FRONT'],
      boonsUsed: ['DAMAGE_AMP'],
    }

    useGlobalStats.getState().recordRunEnd(runData)

    const state = useGlobalStats.getState()
    expect(state.totalKills).toBe(50)
    expect(state.totalTimeSurvived).toBe(300)
    expect(state.totalRuns).toBe(1)
    expect(state.totalFragments).toBe(100)
  })

  it('recordRunEnd updates best run stats when beaten', () => {
    // First run
    useGlobalStats.getState().recordRunEnd({
      kills: 50,
      timeSurvived: 300,
      systemsReached: 2,
      level: 10,
      fragments: 100,
      weaponsUsed: [],
      boonsUsed: [],
    })

    // Second run with better stats
    useGlobalStats.getState().recordRunEnd({
      kills: 100,  // Better
      timeSurvived: 500,  // Better
      systemsReached: 3,  // Better
      level: 15,  // Better
      fragments: 50,
      weaponsUsed: [],
      boonsUsed: [],
    })

    const best = useGlobalStats.getState().bestRun
    expect(best.mostKills).toBe(100)
    expect(best.longestTime).toBe(500)
    expect(best.highestSystem).toBe(3)
    expect(best.highestLevel).toBe(15)
  })

  it('recordRunEnd does NOT update best if not beaten', () => {
    // First run (best)
    useGlobalStats.getState().recordRunEnd({
      kills: 100,
      timeSurvived: 500,
      systemsReached: 3,
      level: 15,
      fragments: 100,
      weaponsUsed: [],
      boonsUsed: [],
    })

    // Second run (worse)
    useGlobalStats.getState().recordRunEnd({
      kills: 30,
      timeSurvived: 200,
      systemsReached: 1,
      level: 5,
      fragments: 50,
      weaponsUsed: [],
      boonsUsed: [],
    })

    const best = useGlobalStats.getState().bestRun
    expect(best.mostKills).toBe(100)  // Not updated
    expect(best.longestTime).toBe(500)
    expect(best.highestSystem).toBe(3)
    expect(best.highestLevel).toBe(15)
  })

  it('recordRunEnd increments weapon usage', () => {
    useGlobalStats.getState().recordRunEnd({
      kills: 10,
      timeSurvived: 100,
      systemsReached: 1,
      level: 5,
      fragments: 20,
      weaponsUsed: ['LASER_FRONT', 'SPREAD_SHOT'],
      boonsUsed: [],
    })

    const state = useGlobalStats.getState()
    expect(state.weaponUsage['LASER_FRONT']).toBe(1)
    expect(state.weaponUsage['SPREAD_SHOT']).toBe(1)

    // Second run with same weapon
    useGlobalStats.getState().recordRunEnd({
      kills: 10,
      timeSurvived: 100,
      systemsReached: 1,
      level: 5,
      fragments: 20,
      weaponsUsed: ['LASER_FRONT'],
      boonsUsed: [],
    })

    const state2 = useGlobalStats.getState()
    expect(state2.weaponUsage['LASER_FRONT']).toBe(2)
    expect(state2.weaponUsage['SPREAD_SHOT']).toBe(1)
  })

  it('getTopWeapons returns sorted by run count', () => {
    useGlobalStats.getState().recordRunEnd({
      kills: 0, timeSurvived: 0, systemsReached: 1, level: 1, fragments: 0,
      weaponsUsed: ['LASER_FRONT', 'SPREAD_SHOT'],
      boonsUsed: [],
    })
    useGlobalStats.getState().recordRunEnd({
      kills: 0, timeSurvived: 0, systemsReached: 1, level: 1, fragments: 0,
      weaponsUsed: ['LASER_FRONT'],
      boonsUsed: [],
    })
    useGlobalStats.getState().recordRunEnd({
      kills: 0, timeSurvived: 0, systemsReached: 1, level: 1, fragments: 0,
      weaponsUsed: ['MISSILE_HOMING', 'LASER_FRONT'],
      boonsUsed: [],
    })

    const top = useGlobalStats.getState().getTopWeapons(3)
    expect(top.length).toBe(3)
    expect(top[0].weaponId).toBe('LASER_FRONT')
    expect(top[0].runCount).toBe(3)
    expect(top[1].runCount).toBeLessThanOrEqual(top[0].runCount)
  })

  it('persists to localStorage', () => {
    useGlobalStats.getState().recordRunEnd({
      kills: 50,
      timeSurvived: 300,
      systemsReached: 2,
      level: 10,
      fragments: 100,
      weaponsUsed: ['LASER_FRONT'],
      boonsUsed: ['DAMAGE_AMP'],
    })

    const stored = localStorage.getItem('SPACESHIP_GLOBAL_STATS')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored)
    expect(parsed.totalKills).toBe(50)
    expect(parsed.weaponUsage['LASER_FRONT']).toBe(1)
  })

  it('loads from localStorage on init', () => {
    const mockData = {
      version: 1,
      totalKills: 200,
      totalTimeSurvived: 1000,
      totalRuns: 5,
      totalFragments: 500,
      bestRun: { highestSystem: 3, longestTime: 600, mostKills: 100, highestLevel: 20 },
      weaponUsage: { 'LASER_FRONT': 5 },
      boonUsage: { 'DAMAGE_AMP': 3 },
    }

    localStorage.setItem('SPACESHIP_GLOBAL_STATS', JSON.stringify(mockData))

    // Re-import to trigger init (or use a factory function)
    // This test may need adjustment based on how Zustand init works in tests
    const state = useGlobalStats.getState()
    // Note: Zustand stores are singletons, so this test may need reset + re-init pattern
  })
})
```

**Integration Tests:**

Test that game over flow calls `recordRunEnd`:
- Mock game over scenario
- Verify `useGlobalStats.recordRunEnd` is called with correct data
- Verify stats are updated

### Project Structure Notes

**New files created in this story:**
- `src/stores/useGlobalStats.jsx` — Global stats tracking store
- `src/utils/globalStatsStorage.js` — localStorage persistence helpers
- `src/stores/__tests__/useGlobalStats.test.js` — Store tests

**Modified files:**
- `src/ui/GameOverScreen.jsx` — Add recordGlobalStats call on game over
- `src/ui/VictoryScreen.jsx` (if separate) — Add recordGlobalStats call on victory
- OR modify game over logic in `useGame` or `GameLoop` if centralized

**Files NOT modified (read-only references):**
- `src/stores/useEnemies.jsx` ✅ (read totalKills)
- `src/stores/useGame.jsx` ✅ (read elapsedTime or timer)
- `src/stores/useLevel.jsx` ✅ (read currentSystemIndex)
- `src/stores/usePlayer.jsx` ✅ (read currentLevel, fragments)
- `src/stores/useWeapons.jsx` ✅ (read activeWeapons)
- `src/stores/useBoons.jsx` ✅ (read activeBoons)

### Implementation Decisions & Considerations

**DECISION 1: When to call recordRunEnd?**
- **Recommendation:** Call once on game over state change (death or victory)
- **Rationale:** Ensures stats are recorded exactly once per run. Avoid calling multiple times (e.g., on retry button, back to menu) — use a flag or check game phase transition.

**DECISION 2: What counts as "weapons/boons used"?**
- **Recommendation:** Track weapons/boons that were ACQUIRED during the run (in activeWeapons/activeBoons at run end)
- **Rationale:** AC says "most used weapons (by number of runs where weapon was acquired)". This means: if player had LASER_FRONT in this run, increment LASER_FRONT's run count by 1, regardless of how many shots fired.

**DECISION 3: Version migration strategy?**
- **Recommendation:** Start with version 1, add migration logic in `getPersistedGlobalStats()` for future schema changes
- **Rationale:** AC says "store has a version field for future migration if the schema changes". Plan ahead for adding new stats fields later without losing player data.

**DECISION 4: What if a field is missing in existing stores?**
- **Example:** If `useGame.elapsedTime` doesn't exist yet
- **Recommendation:** Use placeholder (0) and add TODO comment, or add field to `useGame` in this story
- **Rationale:** Don't break integration if a field is missing — graceful fallback. Can be improved in follow-up.

**DECISION 5: Should totalFragments be all-time earned or current balance?**
- **Recommendation:** All-time earned (sum of fragments earned across all runs, not current balance)
- **Rationale:** AC says "Total Fragments earned (all-time)". Current balance would be misleading since fragments are spent on upgrades.

**CRITICAL:** Need to track fragments EARNED during the run, not final balance. This may require:
- Adding a `fragmentsEarnedThisRun` field to `usePlayer`
- OR calculating: `fragmentsEarnedThisRun = currentFragments + fragmentsSpentThisRun`
- OR tracking fragment sources (planet scans, enemy drops) separately

**Recommended approach:** Add a `fragmentsEarnedThisRun` counter to `usePlayer` that increments when fragments are added (planet scan, enemy drops) and resets on run start. This is the cleanest solution.

**If fragmentsEarnedThisRun doesn't exist yet:**
- Option A: Add it to `usePlayer` in this story (small change)
- Option B: Use placeholder (current fragments balance) and add TODO for future improvement

**DECISION 6: Handle runs that end before reaching System 1?**
- **Example:** Player dies immediately in System 1
- **Recommendation:** Record all stats as-is (systemsReached = 1, kills = 0, etc.)
- **Rationale:** All runs should be tracked, even short ones. Stats screen (Story 25.6) can show meaningful data even for failed runs.

### Performance Notes

**No performance concerns:**
- Stats are recorded ONCE per run (at run end, not every frame)
- Data structure is small (< 1KB in localStorage)
- Getters (getTopWeapons, etc.) run on-demand, not every frame
- Sorting weapon/boon usage is trivial (< 20 items)

**Best practices:**
- Save to localStorage ONLY on recordRunEnd (not every frame)
- Use computed getters instead of storing derived data
- Version field allows future optimizations without data loss

### References

- [Source: _bmad-output/planning-artifacts/epic-25-meta-content.md#Story 25.5] — Epic context, acceptance criteria, technical notes
- [Source: _bmad-output/planning-artifacts/architecture.md#6-Layer Architecture] — Architecture rules, store patterns
- [Source: src/stores/useUpgrades.jsx] — Persistence pattern reference (Story 20.1)
- [Source: src/utils/upgradesStorage.js] — localStorage helper pattern
- [Source: src/stores/usePlayer.jsx] — Player state structure
- [Source: src/stores/useEnemies.jsx] — Enemy kill tracking
- [Source: src/stores/useGame.jsx] — Game phase and timer tracking
- [Source: src/stores/useLevel.jsx] — System progression tracking
- [Source: src/stores/useWeapons.jsx] — Active weapons tracking
- [Source: src/stores/useBoons.jsx] — Active boons tracking
- [Source: _bmad-output/implementation-artifacts/25-4-armory-catalog-screen.md] — Previous story reference for Epic 25 patterns
- [Source: _bmad-output/planning-artifacts/epic-25-meta-content.md#Story 25.6] — Next story (Stats Display Screen) will consume this data

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Pre-existing `progressionSystem.test.js` failure (1 test) confirmed NOT caused by this story — caused by Story 27.4's rarity scaling of statPreview. Rarity multiplier transforms level 3 LASER_FRONT damage 15 → 20 when RARE rarity is rolled. No action taken (pre-existing issue).
- Data source correction: story notes mentioned `useEnemies.totalKills` but this field doesn't exist. Correct source is `useGame.kills` (confirmed in useGame.jsx line 13). Both GameOverScreen and VictoryScreen already used `useGame.kills`.
- Weapon IDs are at `w.weaponId` (not `w.id`) in useWeapons.activeWeapons. Boon IDs at `b.boonId` (not `b.id`) in useBoons.activeBoons.
- Added `loadFromStorage()` action to enable testable reload-from-localStorage pattern (Zustand singleton constraint).

### Completion Notes List

- Created `src/utils/globalStatsStorage.js` with `getPersistedGlobalStats()`, `setPersistedGlobalStats()`, `getDefaultStats()`, `STORAGE_KEY_GLOBAL_STATS`. Pattern follows `upgradesStorage.js`.
- Created `src/stores/useGlobalStats.jsx` with: `recordRunEnd()`, `loadFromStorage()`, `getTopWeapons()`, `getTopBoons()`, `getBestRun()`, `getCareerStats()`, `reset()`. State initialized from localStorage on module import.
- Modified `GameOverScreen.jsx`: added `useBoons` and `useGlobalStats` imports, `recordRunEnd()` called on first mount in the `statsRef.current` guard block. Uses `useGame.kills`, `totalElapsedTime + systemTimer`, `useLevel.currentSystem`, `usePlayer.currentLevel/fragments`, weapon/boon IDs.
- Modified `VictoryScreen.jsx`: same pattern as GameOverScreen. Already had `useBoons` import.
- 27/27 tests pass in `useGlobalStats.test.js`. No regressions in the rest of the suite (pre-existing 1 failure in progressionSystem unrelated to this story).
- `fragments` tracking uses current balance (not all-time earned) — TODO comment added. A `fragmentsEarnedThisRun` counter would be needed for truly accurate all-time tracking (out of scope for this story).

### File List

- src/stores/useGlobalStats.jsx (NEW)
- src/utils/globalStatsStorage.js (NEW)
- src/stores/__tests__/useGlobalStats.test.js (NEW)
- src/stores/usePlayer.jsx (MODIFIED — added fragmentsEarnedThisRun field and reset in addFragments/reset)
- src/ui/GameOverScreen.jsx (MODIFIED — added useBoons + useGlobalStats imports and recordRunEnd call)
- src/ui/VictoryScreen.jsx (MODIFIED — added useGlobalStats import and recordRunEnd call)

### Change Log

- 2026-02-19: Story 25.5 implemented — persistent global stats store with localStorage, career totals, best run tracking, weapon/boon usage maps, computed getters, and integration in game over + victory screens. (claude-sonnet-4-6)
- 2026-02-20: Code review fixes — (1) Added fragmentsEarnedThisRun to usePlayer (H1: AC violation — fragments now tracks all-time earned, not current balance); (2) Moved recordRunEnd from render body to useEffect in both screens (M1: React anti-pattern); (3) recordRunEnd now uses captured statsRef values instead of repeated getState() calls (M2: redundant calls); (4) getPersistedGlobalStats now merges with getDefaultStats() to protect against corrupted partial data (M3: schema validation); (5) Added test for M3 schema validation — 28/28 tests pass, 0 regressions in full suite. (claude-sonnet-4-6)
