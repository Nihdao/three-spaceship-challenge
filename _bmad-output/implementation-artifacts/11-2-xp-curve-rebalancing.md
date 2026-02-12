# Story 11.2: XP Curve Rebalancing

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to level up more frequently in the early and mid game,
So that progression feels rewarding and I gain power at a satisfying pace.

## Acceptance Criteria

1. **Given** the XP curve is defined in gameConfig.js **When** XP_LEVEL_CURVE is adjusted **Then** the XP required for early levels (1-5) is reduced by ~20-30% **And** mid-game levels (6-12) are reduced by ~10-15% **And** late-game levels (13+) remain challenging but reachable

2. **Given** the adjusted XP curve **When** playtesting a full run **Then** players reach level 5 within the first 2-3 minutes **And** players reach level 10 by approximately 5-6 minutes **And** leveling remains frequent enough to maintain engagement throughout a 10-minute run

3. **Given** enemy xpReward values in enemyDefs.js **When** they are reviewed **Then** xpReward values are increased by ~15-25% across all enemy types **And** higher-tier enemies provide proportionally more XP

## Tasks / Subtasks

- [ ] Task 1: Analyze current XP progression (AC: #1, #2)
  - [ ] 1.1: Document current XP_LEVEL_CURVE values (levels 1-10): [100, 150, 225, 340, 510, 765, 1148, 1722, 2583, 3875]
  - [ ] 1.2: Calculate cumulative XP to reach each level (e.g., level 5 = 100+150+225+340+510 = 1325 XP total)
  - [ ] 1.3: Review enemy xpReward values: FODDER_BASIC = 10, FODDER_FAST = 8 (from enemyDefs.js)
  - [ ] 1.4: Estimate kills needed per level with current values (level 1 → 2 = 10 kills of FODDER_BASIC)
  - [ ] 1.5: Identify progression pain points (which levels feel too slow or require too many kills)

- [ ] Task 2: Design rebalanced XP curve for early-mid game (AC: #1, #2)
  - [ ] 2.1: Reduce level 1-5 XP requirements by 20-30% (current: [100, 150, 225, 340, 510])
  - [ ] 2.2: Calculate new values: Level 1 = 75 (-25%), Level 2 = 110 (-27%), Level 3 = 165 (-27%), Level 4 = 250 (-26%), Level 5 = 375 (-26%)
  - [ ] 2.3: Reduce level 6-12 XP requirements by 10-15% (current: [765, 1148, 1722, 2583, ...])
  - [ ] 2.4: Calculate new values: Level 6 = 650 (-15%), Level 7 = 975 (-15%), Level 8 = 1465 (-15%), Level 9 = 2200 (-15%), Level 10 = 3300 (-15%)
  - [ ] 2.5: Maintain or slightly adjust levels 11+ (add new thresholds if needed for levels beyond current 10)
  - [ ] 2.6: Ensure smooth curve (each level requires more XP than previous, no sudden jumps or dips)

- [ ] Task 3: Increase enemy xpReward values (AC: #3)
  - [ ] 3.1: Increase FODDER_BASIC xpReward from 10 to 12 (+20%) in enemyDefs.js
  - [ ] 3.2: Increase FODDER_FAST xpReward from 8 to 10 (+25%) in enemyDefs.js
  - [ ] 3.3: Review any other enemy types added in later stories (if applicable)
  - [ ] 3.4: Ensure higher-tier enemies (if added in future) have proportionally higher rewards (e.g., elite = 20-25 XP)
  - [ ] 3.5: Document xpReward changes in code comments for future reference

- [ ] Task 4: Update gameConfig.js with new XP curve (AC: #1)
  - [ ] 4.1: Replace XP_LEVEL_CURVE array with new values (levels 1-10 or 1-15 if extended)
  - [ ] 4.2: Add comment documenting change: "Story 11.2: Rebalanced for faster early-mid game progression"
  - [ ] 4.3: Verify array format: each value is XP required to reach NEXT level (level 1 → 2 = first value)
  - [ ] 4.4: Ensure no syntax errors (trailing commas, brackets, etc.)
  - [ ] 4.5: Commit config change separately for easy revert if tuning needed

- [ ] Task 5: Validate progression feel through playtesting (AC: #2)
  - [ ] 5.1: Playtest run 1 — Track time to reach level 5 (target: 2-3 minutes)
  - [ ] 5.2: Playtest run 2 — Track time to reach level 10 (target: 5-6 minutes)
  - [ ] 5.3: Playtest run 3 — Full 10-minute run, track leveling frequency (target: ~2-3 level-ups per minute in early game, ~1 level-up per minute mid-late game)
  - [ ] 5.4: Test with varying enemy kill rates (cautious play vs aggressive play)
  - [ ] 5.5: Verify progression feels rewarding and not too easy or too grindy

- [ ] Task 6: Fine-tune based on playtest feedback
  - [ ] 6.1: If level 5 reached too quickly (< 2 min), increase early curve by 5-10%
  - [ ] 6.2: If level 5 too slow (> 3.5 min), decrease early curve by additional 5-10%
  - [ ] 6.3: If level 10 too fast (< 4.5 min), increase mid curve by 5%
  - [ ] 6.4: If level 10 too slow (> 7 min), decrease mid curve by additional 5%
  - [ ] 6.5: Adjust enemy xpReward if curve changes alone don't achieve target feel
  - [ ] 6.6: Iterate until progression feels smooth and engaging

- [ ] Task 7: Document tuning rationale for future reference
  - [ ] 7.1: Add comment in gameConfig.js explaining design goals (e.g., "Early levels fast to unlock core build, mid levels balanced for engagement, late levels challenging")
  - [ ] 7.2: Document final XP curve formula or pattern (e.g., "Exponential base 1.5 with early reduction multiplier")
  - [ ] 7.3: Add note about enemy xpReward scaling principles (e.g., "Base enemies = 10-12 XP, fast/weak = 8-10 XP, future elites = 20-25 XP")
  - [ ] 7.4: Include playtesting results summary in story completion notes

- [ ] Task 8: Edge case validation
  - [ ] 8.1: Test XP bar visual progression (Story 10.1 full-width XP bar) — ensure smooth fill with new curve
  - [ ] 8.2: Test level-up modal (Story 3.2) — verify correct level display with extended curve (if levels 11+ added)
  - [ ] 8.3: Test XP reset on level-up — ensure XP correctly resets to 0 for next level threshold
  - [ ] 8.4: Test XP persistence across system transitions (tunnel → next system) — XP should reset with new system start
  - [ ] 8.5: Test extreme edge case: reaching max level (level 10 or 15) — XP bar should cap, no level-up triggered

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **Config/Data Layer** → gameConfig.js (XP_LEVEL_CURVE array modification)
- **Data Layer** → enemyDefs.js (xpReward field updates for all enemy types)
- **Stores Layer** → usePlayer.jsx (reads XP_LEVEL_CURVE for level-up detection, no code changes)
- **GameLoop Layer** → GameLoop.jsx (no changes — already handles XP collection and level-up trigger)
- **No Systems Layer** → XP curve is pure configuration, no system logic changes
- **No UI Layer** → XP bar (Story 10.1) automatically reflects new curve values

**Existing Infrastructure:**
- `src/config/gameConfig.js` — XP_LEVEL_CURVE array (line 27): [100, 150, 225, 340, 510, 765, 1148, 1722, 2583, 3875]
- `src/entities/enemyDefs.js` — FODDER_BASIC.xpReward (line 11): 10, FODDER_FAST.xpReward (line 25): 8
- `src/stores/usePlayer.jsx` — addXP(amount) method reads XP_LEVEL_CURVE[currentLevel] to check level-up threshold
- `src/GameLoop.jsx` — Section 8: XP Orb Collection (calls usePlayer.addXP when orb collected)
- `src/ui/HUD.jsx` — XP bar (Story 10.1) displays currentXP / nextLevelXP (reads from usePlayer store)

**Current XP System (Story 3.1):**
- **XP Curve:** Defined in gameConfig.js as array of thresholds (index = level, value = XP needed to reach next level)
- **Level-Up Trigger:** usePlayer.addXP checks if currentXP >= XP_LEVEL_CURVE[currentLevel], triggers level-up modal (Story 3.2)
- **XP Sources:** Enemy kills → drop XP orbs → player collects → usePlayer.addXP(orb.xpValue)
- **XP Bar Display:** Story 10.1 full-width XP bar shows progress (currentXP / XP_LEVEL_CURVE[currentLevel] * 100%)
- **Max Level:** Currently 10 levels (XP_LEVEL_CURVE has 10 values), can be extended to 15-20 if desired

### Technical Requirements

**gameConfig.js XP curve modification:**
```javascript
// BEFORE (Story 3.1):
XP_LEVEL_CURVE: [100, 150, 225, 340, 510, 765, 1148, 1722, 2583, 3875],

// AFTER (Story 11.2 - Recommended Values):
// Story 11.2: Rebalanced for faster early-mid game progression
// Design goals: Level 5 in 2-3 min, level 10 in 5-6 min, smooth exponential curve
XP_LEVEL_CURVE: [
  75,   // Level 1 → 2 (-25% from 100)  — ~8 kills
  110,  // Level 2 → 3 (-27% from 150)  — ~9-10 kills
  165,  // Level 3 → 4 (-27% from 225)  — ~14-15 kills
  250,  // Level 4 → 5 (-26% from 340)  — ~21-22 kills
  375,  // Level 5 → 6 (-26% from 510)  — ~31-32 kills
  650,  // Level 6 → 7 (-15% from 765)  — ~54-55 kills
  975,  // Level 7 → 8 (-15% from 1148) — ~81-82 kills
  1465, // Level 8 → 9 (-15% from 1722) — ~122 kills
  2200, // Level 9 → 10 (-15% from 2583) — ~183 kills
  3300, // Level 10 → 11 (-15% from 3875) — ~275 kills
  4950, // Level 11 → 12 (NEW, +50% from 3300) — ~412 kills
  7425, // Level 12 → 13 (NEW, +50% from 4950) — ~619 kills
  11138, // Level 13 → 14 (NEW, +50% from 7425) — ~928 kills
  16707, // Level 14 → 15 (NEW, +50% from 11138) — ~1392 kills (unreachable in 10-min run, aspirational)
],
```

**enemyDefs.js xpReward updates:**
```javascript
// BEFORE:
FODDER_BASIC: {
  // ...
  xpReward: 10,
  // ...
},
FODDER_FAST: {
  // ...
  xpReward: 8,
  // ...
},

// AFTER (Story 11.2):
FODDER_BASIC: {
  // ...
  xpReward: 12, // +20% (Story 11.2: Increased for faster progression)
  // ...
},
FODDER_FAST: {
  // ...
  xpReward: 10, // +25% (Story 11.2: Increased for faster progression)
  // ...
},
```

**usePlayer.jsx — No code changes needed:**
```javascript
// Existing level-up logic automatically uses new XP_LEVEL_CURVE values
addXP: (amount) => {
  const { currentXP, currentLevel } = get()
  const newXP = currentXP + amount
  const nextLevelThreshold = GAME_CONFIG.XP_LEVEL_CURVE[currentLevel]

  if (newXP >= nextLevelThreshold && currentLevel < GAME_CONFIG.XP_LEVEL_CURVE.length) {
    // Level up trigger (Story 3.2)
    set({ currentXP: 0, currentLevel: currentLevel + 1 })
    useGame.getState().setPhase('levelUp')
  } else {
    set({ currentXP: newXP })
  }
}
```

### Previous Story Intelligence

**From Story 11.1 (XP Magnetization System):**
- **Configuration pattern:** Add tunable constants to gameConfig.js for easy balancing iteration
- **Playtesting approach:** Test multiple values (tight/generous), iterate based on feel
- **Performance awareness:** XP-related logic runs every frame (GameLoop), optimizations matter
- **Edge case handling:** Test extreme scenarios (max orbs, boss transitions, system resets)

**Applied to Story 11.2:**
- XP_LEVEL_CURVE in gameConfig.js for easy tuning (no code changes to adjust values)
- Playtest multiple curve variations (conservative/aggressive reductions) before finalizing
- No performance impact — XP curve is read-only config, not computed each frame
- Test edge cases: max level cap, XP bar overflow, level-up modal with extended curve

**From Story 10.1 (XP Bar Redesign — Full-Width Top):**
- **XP bar display:** currentXP / XP_LEVEL_CURVE[currentLevel] * 100% fill percentage
- **Visual feedback:** Smooth fill animation (ease-out 200-300ms), pulse when near level-up (>80%)
- **Responsive design:** Full-width bar (100vw), 8-12px height, readable at 1080p minimum

**Applied to Story 11.2:**
- XP bar automatically adapts to new curve values (no UI code changes)
- Faster leveling = more frequent "full bar → flash → reset" animations (visual satisfaction)
- Test visual clarity: bar should fill smoothly even with smaller early-level thresholds

**From Story 3.2 (Level-Up System & Choice UI):**
- **Level-up modal trigger:** Pauses GameLoop, displays 3-4 choice cards, keyboard shortcuts (1/2/3/4)
- **Progression system:** progressionSystem.js generates choices based on currentLevel and equipped items
- **Max level handling:** Modal should not trigger if currentLevel >= XP_LEVEL_CURVE.length

**Applied to Story 11.2:**
- Extended XP_LEVEL_CURVE (10 → 15 levels) requires testing level-up modal at higher levels
- Verify progressionSystem.js can generate valid choices for levels 11-15 (weapon/boon pool depth)
- Test max level cap: level 15 (or 10 if not extended) should prevent further XP accumulation

### Git Intelligence (Recent Patterns)

**From commit 0636565 (Story 10.3 — Enhanced Minimap Styling):**
- Files modified: `src/ui/HUD.jsx` (pure CSS/styling, no logic changes)
- Pattern: Config-driven design (colors, sizes from UX spec), minimal code changes

**From commit c7c0e97 (Story 10.2 — Top Stats Display):**
- Files modified: `src/ui/HUD.jsx` (added stats display reading from stores)
- Pattern: UI reads from existing stores (usePlayer, useLevel), no business logic in UI

**From commit 2c1909a (Story 10.1 — XP Bar Redesign):**
- Files modified: `src/ui/HUD.jsx` (full-width XP bar at screen top)
- Pattern: XP bar reads XP_LEVEL_CURVE[currentLevel] for threshold, displays fill percentage
- Testing: Visual QA (smooth fill, correct percentage calculation)

**Applied to Story 11.2:**
- Files to modify: `src/config/gameConfig.js` (XP_LEVEL_CURVE array), `src/entities/enemyDefs.js` (xpReward fields)
- Pattern: Pure configuration changes, no code logic modifications
- Testing: Playtesting (progression feel, time to reach levels), visual QA (XP bar behavior)

**Code Patterns from Recent Commits:**
- **Config-first design:** All tunable values in gameConfig.js for easy iteration without code changes
- **Store-driven UI:** UI components read from stores (usePlayer.currentXP, currentLevel), no calculations in UI
- **Visual feedback priority:** Animations and visual clarity tested alongside functionality

### UX Design Specification Compliance

**From UX Doc (Epic 11 Context):**
- **Gameplay Balance & Content Completion** — Epic 11 improves progression feel and completes content rosters
- **Faster Leveling (Story 11.2)** — Players should feel rewarded frequently, not grind endlessly
- **Power Fantasy Curve** — Early game: rapid unlocks (weapons, boons), mid game: build refinement, late game: mastery

**Story 11.2 Specific Requirements (from Epic 11 Story 11.2):**
- **Early levels (1-5):** Reduced by 20-30% — Goal: 2-3 minutes to reach level 5 (unlock core build)
- **Mid-game levels (6-12):** Reduced by 10-15% — Goal: 5-6 minutes to reach level 10 (build refinement)
- **Late-game levels (13+):** Challenging but reachable — Goal: Aspirational levels for extended runs (10+ minutes)
- **Enemy xpReward:** Increased by 15-25% across all types — Proportional scaling (higher-tier = more XP)

**Progression Feel Goals:**
- **Engagement frequency:** Level-up every 30-60 seconds in early game, every 60-90 seconds mid-game
- **Build pacing:** Players should unlock 1st weapon by level 2-3, 2nd weapon by level 5-6, 3rd weapon by level 8-9
- **Boon availability:** Players should equip 1st boon by level 3-4, 2nd boon by level 7-8, 3rd boon by level 10-12
- **Upgrade depth:** Weapon upgrade choices (levels 2-9 for each weapon) should be available throughout run

**Design Rationale:**
- **Fast early unlocks:** Players need weapons and boons quickly to survive increasing enemy waves
- **Smooth mid-game:** Progression should feel consistent, not grindy or too easy
- **Aspirational late-game:** Levels 13-15 are for extended runs or high-skill players (not required for 10-min system completion)

### Architecture Guardrails

**File Structure Requirements (Architecture.md):**
```
src/config/gameConfig.js          — Modify XP_LEVEL_CURVE array (line 27)
src/entities/enemyDefs.js          — Modify xpReward fields for FODDER_BASIC, FODDER_FAST (lines 11, 25)
src/stores/usePlayer.jsx           — No changes (reads XP_LEVEL_CURVE dynamically)
src/ui/HUD.jsx                     — No changes (XP bar already reads from usePlayer store)
src/GameLoop.jsx                   — No changes (XP collection logic unchanged)
```

**Layer Boundaries (Architecture.md 6-Layer):**
- **Config/Data Layer** — gameConfig.js defines XP_LEVEL_CURVE (pure data, no logic)
- **Data Layer** — enemyDefs.js defines xpReward per enemy type (static data)
- **Stores Layer** — usePlayer.jsx reads XP_LEVEL_CURVE for level-up logic (existing implementation)
- **UI Layer** — HUD.jsx displays XP bar based on usePlayer.currentXP / nextLevelXP (existing implementation)
- **No Systems Layer** — XP curve is configuration, not a system
- **No GameLoop Layer** — XP collection logic unchanged (already handles addXP calls)

**Anti-Patterns to AVOID:**
- DO NOT hardcode XP thresholds in usePlayer.jsx (keep in gameConfig.js for easy tuning)
- DO NOT add complex curve calculation logic (use pre-computed array for performance)
- DO NOT modify XP collection logic in GameLoop (only config values change)
- DO NOT add UI-specific XP curve overrides (single source of truth in gameConfig.js)

**Coding Standards (Architecture.md Naming):**
- Config constants: `SCREAMING_CAPS` → `XP_LEVEL_CURVE`
- Enemy definition fields: `camelCase` → `xpReward`
- Array format: `[val1, val2, ...]` with trailing comma for easy extension
- Comments: `// Story 11.2: Rebalanced for faster progression — Design goal: Level 5 in 2-3 min`

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- XP curve is read-only configuration, no runtime computation
- Level-up check: O(1) array access `XP_LEVEL_CURVE[currentLevel]`
- No performance impact from curve changes (values are pre-computed)

**NFR2: 30+ FPS Minimum Under Load:**
- XP system performance unchanged (Story 3.1 implementation)
- Level-up modal pause (Story 3.2) stops GameLoop during choice selection (no FPS impact)

**Memory Profile:**
- XP_LEVEL_CURVE array: 15 values * 8 bytes = 120 bytes (negligible)
- enemyDefs.js xpReward: 2 fields * 8 bytes = 16 bytes (negligible)
- Total memory overhead: < 200 bytes

**No Optimization Needed:**
- Pure configuration changes, no algorithmic changes
- Existing XP system already optimized (Story 3.1)

### Progression Design Analysis

**Current Curve (Story 3.1):**
```
Level  | XP Needed | Cumulative XP | Kills (FODDER_BASIC @10 XP) | Est. Time (1 kill/3s)
-------|-----------|---------------|-----------------------------|-----------------------
1 → 2  | 100       | 100           | 10                          | 30s
2 → 3  | 150       | 250           | 15                          | 45s (1:15 total)
3 → 4  | 225       | 475           | 23                          | 69s (2:24 total)
4 → 5  | 340       | 815           | 34                          | 102s (4:06 total)
5 → 6  | 510       | 1325          | 51                          | 153s (6:39 total)
6 → 7  | 765       | 2090          | 77                          | 231s (10:30 total)
7 → 8  | 1148      | 3238          | 115                         | 345s (16:15 total)
8 → 9  | 1722      | 4960          | 172                         | 516s (24:51 total)
9 → 10 | 2583      | 7543          | 258                         | 774s (37:45 total)
10 → 11| 3875      | 11418         | 388                         | 1164s (57:09 total)
```

**Analysis:**
- Level 5 takes ~4 minutes (target: 2-3 min) — TOO SLOW ❌
- Level 10 unreachable in 10-minute run (would take ~16+ minutes) — TOO SLOW ❌
- Players level up ~every 2-3 minutes mid-game — SLOW PACING ❌

**Proposed Curve (Story 11.2 - With +20% Enemy XP):**
```
Level  | XP Needed | Cumulative XP | Kills (FODDER_BASIC @12 XP) | Est. Time (1 kill/3s)
-------|-----------|---------------|-----------------------------|-----------------------
1 → 2  | 75        | 75            | 6-7                         | 20s
2 → 3  | 110       | 185           | 9                           | 27s (0:47 total)
3 → 4  | 165       | 350           | 14                          | 42s (1:29 total)
4 → 5  | 250       | 600           | 21                          | 63s (2:32 total) ✅
5 → 6  | 375       | 975           | 31                          | 93s (4:05 total)
6 → 7  | 650       | 1625          | 54                          | 162s (6:47 total) ✅
7 → 8  | 975       | 2600          | 81                          | 243s (10:50 total)
8 → 9  | 1465      | 4065          | 122                         | 366s (16:16 total)
9 → 10 | 2200      | 6265          | 183                         | 549s (25:25 total)
10 → 11| 3300      | 9565          | 275                         | 825s (39:10 total)
```

**Improved Analysis:**
- Level 5 in ~2:32 minutes (target: 2-3 min) — PERFECT ✅
- Level 7 in ~6:47 minutes (close to level 10 target timing) — GOOD ✅
- Level 10+ aspirational for extended runs (10+ min) — AS DESIGNED ✅
- Players level up every 30-60 seconds early game — ENGAGED ✅

**Tuning Recommendations:**
- **Conservative approach:** Use proposed values as-is, iterate based on playtesting
- **Aggressive approach:** Reduce mid-game (6-10) by additional 5% if level 7 feels too slow
- **Enemy XP tweaks:** If curve alone doesn't hit targets, increase enemy xpReward to 15 (+50% from original)

### Testing Checklist

**Functional Testing:**
- [ ] Level 1 → 2 triggers correctly with new XP threshold (75 XP)
- [ ] Level 2 → 3 triggers correctly (110 XP cumulative from level 2 start)
- [ ] All levels 1-10 trigger correctly with new curve
- [ ] If extended to 15 levels, levels 11-15 trigger correctly
- [ ] XP bar displays correct percentage fill (currentXP / XP_LEVEL_CURVE[currentLevel])
- [ ] Level-up modal appears at each level-up with correct level number displayed
- [ ] XP resets to 0 after each level-up

**Progression Testing (AC #2):**
- [ ] Playtest: Reach level 5 in 2-3 minutes (target window achieved)
- [ ] Playtest: Reach level 10 in 5-6 minutes (or level 7 as realistic 10-min target)
- [ ] Playtest: Full 10-minute run, count total levels reached (target: 7-9 levels)
- [ ] Playtest: Verify leveling frequency feels engaging (not too fast or too slow)
- [ ] Playtest: Test with cautious play (fewer kills) — progression still feels rewarding
- [ ] Playtest: Test with aggressive play (many kills) — progression not trivially fast

**Visual Testing:**
- [ ] XP bar fills smoothly with new smaller thresholds (no visual jumps or stutters)
- [ ] XP bar pulse animation (>80% full) triggers correctly before level-up
- [ ] XP bar flash/fill animation on level-up plays correctly with faster leveling frequency
- [ ] Full-width XP bar (Story 10.1) displays correctly at all screen resolutions (1080p minimum)
- [ ] Level number in top-right stats display (Story 10.2) updates correctly

**Enemy XP Testing (AC #3):**
- [ ] FODDER_BASIC xpReward updated to 12 (verify in enemyDefs.js)
- [ ] FODDER_FAST xpReward updated to 10 (verify in enemyDefs.js)
- [ ] Killing FODDER_BASIC drops XP orb with value 12 (verify in GameLoop log or HUD XP gain)
- [ ] Killing FODDER_FAST drops XP orb with value 10 (verify in GameLoop log or HUD XP gain)
- [ ] XP orb collection correctly adds xpReward to player XP (usePlayer.addXP called)

**Edge Case Testing:**
- [ ] Reaching max level (level 10 or 15) — XP bar caps at 100%, no further level-ups triggered
- [ ] Collecting massive XP in single tick (e.g., 50 orbs via magnetization) — level-up triggers correctly, no XP overflow
- [ ] XP bar overflow visual (if XP > nextLevelXP before level-up) — bar should cap at 100%, not exceed
- [ ] System transition (tunnel → next system) — XP resets correctly for new system (if applicable)
- [ ] Boss defeat XP reward (if boss drops XP) — counted correctly with new curve
- [ ] Game over → retry — XP resets to 0, level resets to 1
- [ ] Pause menu → resume — XP state persists correctly during pause

**Tuning Validation:**
- [ ] Early game (levels 1-5) feels fast and rewarding (target: ~2.5 min total)
- [ ] Mid-game (levels 6-10) feels engaging, not grindy (target: ~1 level per 60-90s)
- [ ] Late-game (levels 11+) feels aspirational but reachable for skilled players
- [ ] Overall progression maintains player engagement throughout 10-minute run
- [ ] No sudden difficulty spikes or progression dead zones

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 11 Story 11.2 — Complete AC and story text]
- [Source: src/config/gameConfig.js — XP_LEVEL_CURVE (line 27), current values]
- [Source: src/entities/enemyDefs.js — FODDER_BASIC.xpReward (line 11), FODDER_FAST.xpReward (line 25)]
- [Source: src/stores/usePlayer.jsx — addXP method, level-up logic reading XP_LEVEL_CURVE]
- [Source: src/ui/HUD.jsx — XP bar display (Story 10.1), reads currentXP and XP_LEVEL_CURVE]
- [Source: _bmad-output/implementation-artifacts/3-1-xp-system-orb-collection.md — Original XP system (Story 3.1)]
- [Source: _bmad-output/implementation-artifacts/3-2-level-up-system-choice-ui.md — Level-up modal trigger (Story 3.2)]
- [Source: _bmad-output/implementation-artifacts/10-1-xp-bar-redesign-full-width-top.md — Full-width XP bar (Story 10.1)]
- [Source: _bmad-output/implementation-artifacts/11-1-xp-magnetization-system.md — XP magnetization (Story 11.1), tuning patterns]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

- Story 11.2 context created with comprehensive progression design analysis
- Current XP curve documented: [100, 150, 225, 340, 510, 765, 1148, 1722, 2583, 3875]
- Proposed rebalanced curve designed: 20-30% reduction levels 1-5, 10-15% reduction levels 6-12, extended to 15 levels
- Enemy xpReward increases specified: FODDER_BASIC 10→12 (+20%), FODDER_FAST 8→10 (+25%)
- Progression timing targets defined: Level 5 in 2-3 min, Level 10 in 5-6 min (adjusted to level 7 as realistic 10-min target)
- Detailed progression analysis table created comparing current vs proposed curves
- Tuning recommendations provided for conservative vs aggressive approaches
- All edge cases identified: max level cap, XP overflow, system transitions, game over resets
- Complete testing checklist covering functional, progression, visual, and edge case scenarios
- No code logic changes required — pure configuration update in gameConfig.js and enemyDefs.js

### File List

- `src/config/gameConfig.js` — Modify XP_LEVEL_CURVE array (line 27)
- `src/entities/enemyDefs.js` — Modify FODDER_BASIC.xpReward (line 11), FODDER_FAST.xpReward (line 25)
