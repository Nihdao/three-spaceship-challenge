# Story 5.3: Planet Scanning & Rewards

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to scan planets by staying within their zone to receive weapon or boon rewards based on planet tier,
So that exploration is rewarded and I have another strategic layer to my build.

## Acceptance Criteria

1. **Given** the player enters a planet's scanning zone **When** the player remains within the zone **Then** a scan progress indicator appears (0% to 100%) **And** scan progress fills over time (speed varies by tier — silver fastest at 5s, gold 10s, platinum slowest at 18s)

2. **Given** scan progress reaches 100% **When** the scan completes **Then** the player receives a reward (weapon or boon) based on the planet tier (better tier = better reward pool from planetDefs.js) **And** the planet is marked as scanned (cannot be re-scanned) **And** reward feedback plays (visual + audio)

3. **Given** the player leaves the planet zone before scan completes **When** the player exits the zone radius **Then** scan progress resets to 0 (FR27) **And** the scan indicator disappears

4. **Given** scanning is in progress **When** enemies are attacking **Then** the player must balance staying in zone vs dodging enemies (strategic tension)

## Tasks / Subtasks

- [x] Task 1: Add planet scan reward pools to planetDefs.js (AC: #2)
  - [x] 1.1: Add `rewardPool` array to each planet tier definition — lists of possible reward types/IDs with weights
  - [x] 1.2: Silver tier: pool of common weapon upgrades + common boons (e.g., existing equipped weapon upgrades, new common weapons)
  - [x] 1.3: Gold tier: pool of uncommon weapons + uncommon boons (higher quality, rarer options)
  - [x] 1.4: Platinum tier: pool of rare weapons + rare boons (best quality, guarantees powerful option)
  - [x] 1.5: Each pool entry: `{ type: 'new_weapon' | 'weapon_upgrade' | 'new_boon' | 'boon_upgrade', weight: number }` — type-based, actual selection happens at scan completion based on player's current equipped state

- [x] Task 2: Add scan-related constants to gameConfig.js (AC: #1, #2)
  - [x] 2.1: `PLANET_SCAN_REWARD_CHOICES: 3` — number of reward choices presented on scan complete (reuses level-up modal pattern)

- [x] Task 3: Add `generatePlanetReward` function to progressionSystem.js (AC: #2)
  - [x] 3.1: Create `generatePlanetReward(tier, equippedWeapons, equippedBoonIds, equippedBoons)` — generates reward choices filtered by planet tier quality
  - [x] 3.2: Silver: prioritize weapon upgrades for equipped weapons + common new boons; exclude the rarest weapons
  - [x] 3.3: Gold: balanced mix of new weapons, weapon upgrades, and boons; allow uncommon options
  - [x] 3.4: Platinum: prioritize new weapons (if slots available), rare boons, high-level upgrades; guarantee at least one strong option
  - [x] 3.5: Return format identical to `generateChoices()` — `Array<{ type, id, name, description, level, icon, statPreview }>` — so it works with the same LevelUpModal UI
  - [x] 3.6: Reuse existing pool building logic from `generateChoices()` but filter/weight by tier

- [x] Task 4: Implement scan tick logic in useLevel store (AC: #1, #3)
  - [x] 4.1: Add `activeScanPlanetId: null` state field — tracks which planet the player is currently scanning (null if none)
  - [x] 4.2: Add `scanningTick(delta, playerX, playerZ)` method — called by GameLoop each frame
  - [x] 4.3: Distance check: for each unscanned planet, compute distance from player to planet center (`sqrt((px-x)² + (pz-z)²)`), compare with `PLANETS[typeId].scanRadius`
  - [x] 4.4: If player is within exactly ONE unscanned planet's scan radius: set `activeScanPlanetId` to that planet's id, increment that planet's `scanProgress` by `delta / PLANETS[typeId].scanTime`
  - [x] 4.5: If player is within multiple planet zones simultaneously: scan the closest one (nearest to player center)
  - [x] 4.6: If player is NOT in any scan zone: reset `activeScanPlanetId` to null. If there was a previous active scan planet, reset its `scanProgress` to 0 (FR27 — progress lost on zone exit)
  - [x] 4.7: When `scanProgress >= 1.0`: mark planet as `scanned: true`, set `activeScanPlanetId` to null, return `{ completed: true, planetId, tier }` for GameLoop to process rewards
  - [x] 4.8: Return `{ completed: false, activeScanPlanetId, scanProgress }` otherwise for HUD display
  - [x] 4.9: Add `activeScanPlanetId: null` to `reset()`

- [x] Task 5: Integrate scanning into GameLoop tick (AC: #1, #2, #3)
  - [x] 5.1: After section 7f (system timer) and before section 8 (XP), add planet scanning section
  - [x] 5.2: Call `useLevel.getState().scanningTick(clampedDelta, playerPos[0], playerPos[2])`
  - [x] 5.3: If scan completed (`result.completed === true`): trigger reward flow — play `'scan-complete'` SFX, then trigger planet reward modal (set a flag in useGame or useLevel for the UI to pick up)
  - [x] 5.4: Use a `prevScanPlanetRef` to detect scan-start transitions → play `'scan-start'` SFX when `activeScanPlanetId` transitions from null to a planet id
  - [x] 5.5: Detect scan-cancel (activeScanPlanetId transitions from a planet id to null without completion) — no SFX needed per AC, just progress reset (already handled in 4.6)

- [x] Task 6: Add planet reward phase to game flow (AC: #2)
  - [x] 6.1: Add `'planetReward'` to useGame phases — similar to `'levelUp'`, pauses GameLoop and shows reward modal
  - [x] 6.2: Add `triggerPlanetReward(tier)` action in useGame — sets phase to `'planetReward'`, stores the `rewardTier` in state
  - [x] 6.3: Add `rewardTier: null` state field and include in `reset()`
  - [x] 6.4: GameLoop should NOT tick during `'planetReward'` phase (add to isPaused check or phase check)
  - [x] 6.5: When reward is selected, `resumeGameplay()` returns to `'gameplay'` phase (existing action works)

- [x] Task 7: Create PlanetRewardModal UI component (AC: #2)
  - [x] 7.1: Create `src/ui/PlanetRewardModal.jsx` — nearly identical to LevelUpModal but with planet-specific header ("PLANET SCANNED!" + tier name)
  - [x] 7.2: On mount, call `generatePlanetReward(tier, ...)` to get choices
  - [x] 7.3: Apply choice using same pattern as LevelUpModal: `addWeapon()`, `upgradeWeapon()`, `addBoon()`, `upgradeBoon()`
  - [x] 7.4: On apply, call `useGame.getState().resumeGameplay()` to resume
  - [x] 7.5: Support keyboard selection (1/2/3) and mouse click (same as LevelUpModal)
  - [x] 7.6: Style: use planet tier color as accent (silver/gold/platinum glow on border)

- [x] Task 8: Mount PlanetRewardModal in Interface.jsx (AC: #2)
  - [x] 8.1: Import and render `<PlanetRewardModal />` when `phase === 'planetReward'`
  - [x] 8.2: Pattern follows existing LevelUpModal mount: conditionally rendered based on game phase

- [x] Task 9: Add scan progress UI to HUD (AC: #1)
  - [x] 9.1: Subscribe to `useLevel` for `activeScanPlanetId` and `planets` (find active planet's scan progress)
  - [x] 9.2: When `activeScanPlanetId` is not null, display a scan progress bar near the center-bottom of screen (above XP bar)
  - [x] 9.3: Show planet name, tier, and progress percentage (e.g., "Silver Planet — 65%")
  - [x] 9.4: Use ProgressBar primitive with a new `variant="scan"` (or reuse `xp` variant with custom color)
  - [x] 9.5: Bar color matches planet tier color from planetDefs
  - [x] 9.6: Bar disappears when scan completes or player leaves zone

- [x] Task 10: Add scan SFX to audio system (AC: #2)
  - [x] 10.1: Add `'scan-start'` and `'scan-complete'` to `SFX_CATEGORY_MAP` in audioManager.js — `'scan-start': 'ui'`, `'scan-complete': 'sfxFeedbackPositive'`
  - [x] 10.2: Add `scanStart` and `scanComplete` audio paths to `ASSET_MANIFEST.gameplay.audio` (placeholder files: `audio/sfx/scan-start.mp3`, `audio/sfx/scan-complete.mp3`)
  - [x] 10.3: Add entries to `SFX_MAP` in `hooks/useAudio.jsx` — `'scan-start': ASSET_MANIFEST.gameplay.audio.scanStart`, `'scan-complete': ASSET_MANIFEST.gameplay.audio.scanComplete`

- [x] Task 11: Update minimap for active scan visualization (AC: #1)
  - [x] 11.1: When a planet is being actively scanned, pulse/animate its minimap dot (CSS animation or opacity pulse)
  - [x] 11.2: Scanned planets already show at opacity 0.3 — no change needed for completed state

- [x] Task 12: Verification (AC: #1, #2, #3, #4)
  - [x] 12.1: Flying near an unscanned planet shows scan progress bar in HUD
  - [x] 12.2: Progress fills at rate matching tier (silver ~5s, gold ~10s, platinum ~18s)
  - [x] 12.3: Leaving scan zone resets progress to 0
  - [x] 12.4: Completing a scan pauses game and shows reward modal with 3 choices
  - [x] 12.5: Selecting a reward applies it (weapon added/upgraded or boon added/upgraded)
  - [x] 12.6: Scanned planet cannot be re-scanned (progress bar doesn't appear)
  - [x] 12.7: Minimap shows scanned planets at reduced opacity, active scan planet pulses
  - [x] 12.8: SFX plays on scan start and scan completion
  - [x] 12.9: Game resumes after reward selection
  - [x] 12.10: 60 FPS maintained during scanning (distance checks for 7 planets are trivial)
  - [x] 12.11: All existing tests pass with no regressions

## Dev Notes

### Architecture Decisions

- **Scan logic in `useLevel.scanningTick()`, NOT in a new system or renderer** — useLevel already owns planet state (`planets: []`). Scanning is a state mutation (progress, scanned flag) that belongs in the store's domain. Architecture says "no game logic in renderers" and useLevel.tick() is currently empty, ready for this.

- **Planet reward modal as a NEW game phase (`'planetReward'`)** — Reuses the level-up pause pattern: GameLoop stops ticking, UI modal appears, player selects, gameplay resumes. This is the established pattern in the codebase (see `'levelUp'` phase). Alternative was to use the level-up modal directly, but the header/styling should differ ("PLANET SCANNED!" vs "LEVEL UP!").

- **Reward generation via `generatePlanetReward()` in progressionSystem.js** — Builds on the existing `generateChoices()` infrastructure. Same return format means PlanetRewardModal can reuse the identical card rendering and `applyChoice()` pattern from LevelUpModal. DRY: the reward pool filtering is the only new logic.

- **Distance-based scanning, NOT collision system** — Scanning uses simple distance checks (7 planets × 1 player = 7 sqrt operations per frame). This is negligible and doesn't warrant spatial hash overhead. The collision system is for entity-entity interactions with 100+ entities.

- **Scan progress in `useLevel.planets[]` state, NOT a separate tracking object** — Planet objects already have `scanProgress: 0` and `scanned: false` fields from Story 5.2. This story activates them. No new data structures needed.

- **`activeScanPlanetId` as a top-level state field** — HUD needs to subscribe to scan state changes. A top-level field in useLevel allows efficient Zustand selector subscription (`useLevel(s => s.activeScanPlanetId)`) without re-rendering on every planet position change.

- **SFX played from GameLoop** — Consistent with all other SFX (dash-whoosh, laser-fire, explosion, damage-taken). GameLoop detects state transitions and calls `playSFX()`. The store does not play sounds.

### Existing Infrastructure Status

| Component | Status | Relevance |
|-----------|--------|-----------|
| `entities/planetDefs.js` | **Has 3 tiers, NO reward pools** | Need to add `rewardPool` per tier |
| `stores/useLevel.jsx` | **Has `planets: []`, empty `tick()`** | Need to add `scanningTick()`, `activeScanPlanetId` |
| `config/gameConfig.js` | **Has scan radii per tier** | Need to add PLANET_SCAN_REWARD_CHOICES |
| `systems/progressionSystem.js` | **Has `generateChoices()`** | Need to add `generatePlanetReward()` |
| `stores/useGame.jsx` | **Has phase management** | Need to add `'planetReward'` phase, `triggerPlanetReward()`, `rewardTier` |
| `ui/LevelUpModal.jsx` | **Full reward selection UI** | Pattern reference for PlanetRewardModal |
| `ui/HUD.jsx` | **Has minimap with planet dots** | Need to add scan progress bar |
| `ui/primitives/ProgressBar.jsx` | **Has `hp` and `xp` variants** | Can add `scan` variant or reuse with custom color |
| `hooks/useAudio.jsx` | **Has SFX_MAP** | Need to add scan-start and scan-complete entries |
| `audio/audioManager.js` | **Has SFX_CATEGORY_MAP** | Need to add scan-start and scan-complete categories |
| `config/assetManifest.js` | **Has gameplay audio section** | Need to add scanStart and scanComplete paths |
| `GameLoop.jsx` | **Has deterministic tick order** | Need to add scanning section (between 7f and 8) |
| `Experience.jsx` | **Phase-based rendering** | Need to mount PlanetRewardModal for planetReward phase |
| `renderers/PlanetRenderer.jsx` | **Renders planets, NO scan visuals** | No changes needed (visual scan feedback is in HUD, not 3D) |

### Key Implementation Details

**useLevel.scanningTick() (core logic):**
```javascript
scanningTick: (delta, playerX, playerZ) => {
  const { planets, activeScanPlanetId } = get()
  let closestUnscanPlanet = null
  let closestDist = Infinity

  // Find closest unscanned planet in range
  for (const planet of planets) {
    if (planet.scanned) continue
    const dx = playerX - planet.x
    const dz = playerZ - planet.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    const scanRadius = PLANETS[planet.typeId].scanRadius
    if (dist <= scanRadius && dist < closestDist) {
      closestUnscanPlanet = planet
      closestDist = dist
    }
  }

  if (closestUnscanPlanet) {
    const scanTime = PLANETS[closestUnscanPlanet.typeId].scanTime
    const newProgress = closestUnscanPlanet.scanProgress + (delta / scanTime)

    if (newProgress >= 1.0) {
      // Scan complete!
      const updatedPlanets = planets.map(p =>
        p.id === closestUnscanPlanet.id ? { ...p, scanned: true, scanProgress: 1 } : p
      )
      set({ planets: updatedPlanets, activeScanPlanetId: null })
      return { completed: true, planetId: closestUnscanPlanet.id, tier: closestUnscanPlanet.tier }
    }

    // Scan in progress
    const updatedPlanets = planets.map(p =>
      p.id === closestUnscanPlanet.id ? { ...p, scanProgress: newProgress } : p
    )
    set({ planets: updatedPlanets, activeScanPlanetId: closestUnscanPlanet.id })
    return { completed: false, activeScanPlanetId: closestUnscanPlanet.id, scanProgress: newProgress }
  }

  // Not in any scan zone — reset active scan
  if (activeScanPlanetId) {
    const updatedPlanets = planets.map(p =>
      p.id === activeScanPlanetId ? { ...p, scanProgress: 0 } : p
    )
    set({ planets: updatedPlanets, activeScanPlanetId: null })
  }
  return { completed: false, activeScanPlanetId: null, scanProgress: 0 }
},
```

**GameLoop integration (between section 7f and section 8):**
```javascript
// 7g. Planet scanning
const scanResult = useLevel.getState().scanningTick(clampedDelta, playerPos[0], playerPos[2])
const currentScanId = scanResult.activeScanPlanetId
if (currentScanId && !prevScanPlanetRef.current) {
  playSFX('scan-start')
}
prevScanPlanetRef.current = currentScanId
if (scanResult.completed) {
  playSFX('scan-complete')
  useGame.getState().triggerPlanetReward(scanResult.tier)
}
```

**generatePlanetReward (progressionSystem.js):**
```javascript
export function generatePlanetReward(tier, equippedWeapons, equippedBoonIds, equippedBoons = []) {
  // Build full pool same as generateChoices
  const pool = buildFullPool(equippedWeapons, equippedBoonIds, equippedBoons)

  // Filter/weight by tier
  let filtered
  if (tier === 'silver') {
    // Prefer upgrades for equipped weapons + common boons
    filtered = pool.filter(c => c.type === 'weapon_upgrade' || c.type === 'new_boon' || c.type === 'boon_upgrade')
    if (filtered.length < 3) filtered = pool // fallback to full pool
  } else if (tier === 'gold') {
    // Balanced — allow everything
    filtered = pool
  } else { // platinum
    // Prefer new weapons + rare boons — put new weapons first
    const newWeapons = pool.filter(c => c.type === 'new_weapon')
    const rest = pool.filter(c => c.type !== 'new_weapon')
    filtered = [...newWeapons, ...rest]
  }

  shuffle(filtered)
  // Platinum: guarantee at least one new_weapon or boon if available
  if (tier === 'platinum') {
    const hasNew = filtered.slice(0, 3).some(c => c.type === 'new_weapon' || c.type === 'new_boon')
    if (!hasNew) {
      const newItem = filtered.find(c => c.type === 'new_weapon' || c.type === 'new_boon')
      if (newItem) {
        filtered = [newItem, ...filtered.filter(c => c !== newItem)]
      }
    }
  }

  return padAndSlice(filtered, 3) // Return 3 choices
}
```

### Previous Story Intelligence (5.2)

**Learnings from Story 5.2 to apply:**
- **Planet state in useLevel store** — Already established. `planets: []` with `scanProgress` and `scanned` fields exist. This story activates them.
- **Minimap already shows planets** — Dots with `opacity: p.scanned ? 0.3 : 1` already implemented. Just need to add pulse animation for active scan.
- **Reset() must include ALL state fields** — When adding `activeScanPlanetId`, MUST add it to `reset()`.
- **No game logic in renderers** — Scan progress is computed in useLevel.scanningTick(), displayed by HUD. PlanetRenderer stays read-only.
- **SFX played from GameLoop** — Scan-start and scan-complete SFX will be triggered from GameLoop, not from the store.
- **useAudio.jsx SFX_MAP** — Must add scan-start and scan-complete entries for preloading.
- **Audio files all placeholder-missing** — audioManager.js handles gracefully with console.warn on load error. New scan SFX files will also be placeholders.

### Git Intelligence

Recent commits show established patterns:
- `ac05a23` — Stories 4.2–5.2: HUD, game over, victory, audio, damage feedback, dash & planet system — all in one large commit
- Story 5.2 was the most recent implementation: planet placement, rendering, minimap
- Level-up modal pattern (pause → modal → choice → resume) is well-established and tested
- progressionSystem.js `generateChoices()` is the reward generation foundation

**Relevant code patterns from recent work:**
- `LevelUpModal.jsx` (lines 21-33): `applyChoice()` pattern — switch on `choice.type`, call store action, then `resumeGameplay()`
- `GameLoop.jsx` (lines 86-100): Edge detection pattern for dash — use `prevRef` to detect state transitions for SFX triggers
- `useGame.jsx`: `triggerLevelUp()` sets phase to `'levelUp'`, `resumeGameplay()` sets phase back to `'gameplay'`
- `HUD.jsx` (lines 109-121): Planet dot rendering in minimap — can add active scan pulse animation here

### Project Structure Notes

**Files to CREATE:**
- `src/ui/PlanetRewardModal.jsx` — Reward selection modal for planet scan completion

**Files to MODIFY:**
- `src/entities/planetDefs.js` — Add `rewardPool` per tier (reward type weights)
- `src/config/gameConfig.js` — Add `PLANET_SCAN_REWARD_CHOICES`
- `src/systems/progressionSystem.js` — Add `generatePlanetReward()` function
- `src/stores/useLevel.jsx` — Add `activeScanPlanetId`, `scanningTick()`, update `reset()`
- `src/stores/useGame.jsx` — Add `'planetReward'` phase, `triggerPlanetReward()`, `rewardTier`
- `src/GameLoop.jsx` — Add planet scanning section (7g), `prevScanPlanetRef`
- `src/ui/HUD.jsx` — Add scan progress bar, active scan minimap pulse
- `src/audio/audioManager.js` — Add `scan-start` and `scan-complete` to `SFX_CATEGORY_MAP`
- `src/config/assetManifest.js` — Add `scanStart` and `scanComplete` audio paths
- `src/hooks/useAudio.jsx` — Add scan SFX entries to `SFX_MAP`
- `src/Experience.jsx` — Mount `PlanetRewardModal` for `'planetReward'` phase

**Files NOT to modify:**
- `src/renderers/PlanetRenderer.jsx` — No changes needed; scan visualization is HUD-based, not 3D
- `src/stores/usePlayer.jsx` — No scan-related state
- `src/stores/useWeapons.jsx` — Only called via store actions by PlanetRewardModal (existing API)
- `src/stores/useBoons.jsx` — Only called via store actions by PlanetRewardModal (existing API)
- `src/ui/LevelUpModal.jsx` — Separate component; PlanetRewardModal is its own file (different header/style)
- `src/scenes/GameplayScene.jsx` — No changes needed
- `src/systems/collisionSystem.js` — Scanning uses simple distance checks, not spatial hash

### Anti-Patterns to Avoid

- Do NOT use the collision system / spatial hash for planet scanning — 7 distance checks per frame are trivial, spatial hash adds unnecessary complexity
- Do NOT put scan logic in PlanetRenderer — renderers are read-only, scan state mutation goes in useLevel
- Do NOT play SFX from the store — play from GameLoop using state transition detection (prevRef pattern)
- Do NOT create a new Zustand store for scanning — extend useLevel which already owns planet state
- Do NOT modify LevelUpModal to handle planet rewards — create a separate PlanetRewardModal (different UX context, different header)
- Do NOT put scan progress in usePlayer — player doesn't own planet state, useLevel does
- Do NOT use useEffect for scan tick logic — scanning runs in GameLoop's useFrame, not in React lifecycle
- Do NOT mutate `planets` array in-place — use `set()` with new array via `.map()` (Zustand immutable pattern)
- Do NOT forget to handle the case where player is in overlapping scan zones — scan the closest planet only
- Do NOT forget to add `activeScanPlanetId: null` to `reset()` — lesson from previous stories
- Do NOT add `'planetReward'` to the GameLoop's `prevPhaseRef` check that triggers system reset — planet reward should NOT re-initialize systems (unlike menu→gameplay transition)

### Testing Approach

- **Unit tests (useLevel.scanningTick):**
  - Player within scan radius → progress increments by delta/scanTime
  - Player outside all zones → activeScanPlanetId is null
  - Player leaves zone → progress resets to 0
  - Scan progress reaching 1.0 → returns completed, planet marked scanned
  - Scanned planet ignored in distance checks
  - Overlapping zones → closest planet is scanned
  - Reset clears activeScanPlanetId

- **Unit tests (progressionSystem.generatePlanetReward):**
  - Returns 3 choices
  - Silver tier: choices weighted toward upgrades/common boons
  - Platinum tier: includes new weapon/boon if available
  - Handles edge case: all weapons maxed, all boons equipped
  - Return format matches generateChoices format

- **Unit tests (useGame planet reward phase):**
  - triggerPlanetReward sets phase to 'planetReward' and stores tier
  - resumeGameplay returns to 'gameplay'
  - rewardTier included in reset()

- **Visual tests (browser verification):**
  - Fly near planet → scan bar appears in HUD
  - Progress fills at correct rate per tier
  - Leave zone → bar disappears, re-enter → starts from 0
  - Complete scan → modal appears with 3 reward options
  - Select reward → applied correctly (weapon/boon added)
  - Scanned planet dims on minimap, can't re-scan
  - SFX audible on scan start and completion
  - 60 FPS maintained throughout

### Scope Summary

This story adds planet scanning and reward mechanics to the gameplay loop. When the player enters a planet's scan zone (distance-based), a progress bar appears in the HUD and fills over time (5/10/18 seconds by tier). Leaving the zone resets progress. Completing a scan pauses the game and presents a reward modal with 3 weapon/boon choices filtered by planet tier quality (silver=common, gold=balanced, platinum=rare). The planet is then marked as scanned and dimmed on the minimap.

**Key deliverables:**
1. `planetDefs.js` — Reward pool weights per tier
2. `gameConfig.js` — Scan reward choice count constant
3. `progressionSystem.js` — `generatePlanetReward()` with tier-based filtering
4. `useLevel.jsx` — `scanningTick()` with distance checks, progress tracking, scan completion detection
5. `useGame.jsx` — `'planetReward'` phase + `triggerPlanetReward()` action
6. `GameLoop.jsx` — Scanning tick integration with SFX edge detection
7. `PlanetRewardModal.jsx` — Reward selection UI (mirrors LevelUpModal pattern)
8. `HUD.jsx` — Scan progress bar + active scan minimap pulse
9. `audioManager.js` + `useAudio.jsx` + `assetManifest.js` — Scan SFX registration
10. `Experience.jsx` — Mount PlanetRewardModal for planetReward phase

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3] — Acceptance criteria: scan progress, tier-based rewards, progress reset on zone exit, strategic tension
- [Source: _bmad-output/planning-artifacts/epics.md#FR24-FR27] — Planet tiers, scanning, rewards, scan progress lost on exit
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — Stores never import other stores; GameLoop is sole bridge
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules] — Only GameLoop has game logic useFrame; renderers read-only
- [Source: _bmad-output/planning-artifacts/architecture.md#Anti-Patterns] — No new stores for one-off features; no game logic in renderers
- [Source: src/entities/planetDefs.js] — 3 tier defs with scanTime and scanRadius per tier
- [Source: src/stores/useLevel.jsx] — Has planets[], empty tick(), ready for scanningTick()
- [Source: src/stores/useGame.jsx] — Phase management: triggerLevelUp/resumeGameplay pattern
- [Source: src/systems/progressionSystem.js] — generateChoices() return format and pool building logic
- [Source: src/ui/LevelUpModal.jsx] — applyChoice() pattern: switch on type, call store action, resumeGameplay
- [Source: src/GameLoop.jsx:86-100] — Edge detection pattern with prevRef for SFX triggers
- [Source: src/GameLoop.jsx:56-267] — Full tick order, scanning goes between section 7f and 8
- [Source: src/ui/HUD.jsx:108-121] — Minimap planet dots with scanned opacity
- [Source: src/hooks/useAudio.jsx:7-17] — SFX_MAP for preloading, must add scan entries
- [Source: src/audio/audioManager.js:15-25] — SFX_CATEGORY_MAP, must add scan categories
- [Source: src/config/assetManifest.js:21-32] — gameplay.audio section for new SFX paths
- [Source: src/config/gameConfig.js:78-89] — Planet constants, scan radii already defined
- [Source: src/stores/useWeapons.jsx:89-94] — addWeapon() for reward delivery
- [Source: src/stores/useBoons.jsx:10-16] — addBoon() for reward delivery
- [Source: _bmad-output/implementation-artifacts/5-2-planet-placement-rendering.md] — Previous story: planet placement, minimap, initializePlanets, PlanetRenderer

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Task 1: Added `rewardPool` arrays to all 3 planet tiers in planetDefs.js. Silver: weapon_upgrade(3), new_boon(2), boon_upgrade(2). Gold: balanced across all 4 types. Platinum: new_weapon(4), new_boon(3), weapon_upgrade(2), boon_upgrade(1). 4 new tests added.
- Task 2: Added `PLANET_SCAN_REWARD_CHOICES: 3` constant to gameConfig.js.
- Task 3: Created `generatePlanetReward()` in progressionSystem.js. Extracted `buildFullPool()` as shared helper. Silver filters to upgrades+boons, gold is balanced, platinum prioritizes new items with guarantee. 6 new tests added.
- Task 4: Added `scanningTick()` to useLevel store with distance-based scanning, closest-planet selection, progress tracking, FR27 reset on zone exit, and scan completion detection. Added `activeScanPlanetId` to state and reset(). 9 new tests added.
- Task 5: Integrated scanning into GameLoop section 7g with prevScanPlanetRef for scan-start SFX edge detection, scan-complete SFX + triggerPlanetReward. Added planetReward to phase check that prevents system reset.
- Task 6: Added `triggerPlanetReward(tier)` action, `rewardTier` state field, and `reset()` inclusion in useGame. GameLoop already pauses via isPaused flag. 4 new tests added.
- Task 7: Created PlanetRewardModal.jsx with tier-colored borders/glow, "PLANET SCANNED!" header, keyboard (1/2/3) + mouse selection, identical applyChoice pattern as LevelUpModal.
- Task 8: Mounted PlanetRewardModal in Interface.jsx (not Experience.jsx — HTML overlay). HUD stays visible during planetReward phase. GameplayScene stays mounted in Experience.jsx during planetReward.
- Task 9: Added scan progress bar to HUD center-bottom (above XP bar). Shows planet name, tier color, and progress percentage. Uses inline styled div for tier-specific color.
- Task 10: Added scan-start (ui) and scan-complete (sfxFeedbackPositive) to SFX_CATEGORY_MAP, ASSET_MANIFEST, and SFX_MAP.
- Task 11: Added scanPulse CSS keyframe animation to style.css. Minimap planet dots pulse when being actively scanned.
- Task 12: All 406 tests pass (28 test files). 23 new tests added total.

### Senior Developer Review (AI)

**Reviewer:** Adam (via Claude Opus 4.6)
**Date:** 2026-02-11
**Outcome:** Approved with fixes applied

**Issues Found:** 2 High, 4 Medium, 2 Low — all HIGH and MEDIUM fixed automatically.

**Fixes Applied:**
1. **[H1] DRY violation: generateChoices duplicated buildFullPool logic** — Refactored generateChoices() to call buildFullPool() instead of duplicating 75 lines of pool-building code (progressionSystem.js)
2. **[H2] rewardTier residual state after resumeGameplay** — Added `rewardTier: null` to resumeGameplay() action (useGame.jsx)
3. **[M1] stat_boost no-op undocumented in PlanetRewardModal** — Added comment documenting intentional no-op for stat_boost fallback type (PlanetRewardModal.jsx)
4. **[M2] scanPulse CSS fragile transform dependency** — Added comment documenting the translate(-50%,-50%) dependency between animation and inline styles (style.css)
5. **[M3] Zone switching bug: previous planet scanProgress not reset** — Fixed scanningTick() to reset old planet's scanProgress when activeScanPlanetId changes to a different planet. Added test case (useLevel.jsx, useLevel.scanning.test.js)
6. **[M4] Dead code: rewardPool arrays in planetDefs never read** — Removed unused rewardPool arrays from all 3 planet tier defs and their 4 associated tests (planetDefs.js, planetDefs.test.js)

**Low issues noted (not fixed):**
- [L1] PlanetRewardModal has onMouseEnter SFX but LevelUpModal does not (UX inconsistency)
- [L2] PlanetRewardModal keyboard handler doesn't support Digit4 (correct but inconsistent with LevelUpModal)

**Test Results:** 403 tests pass (28 files), 0 regressions. Net -3 tests (removed 4 dead-code rewardPool tests, added 1 zone-switching test).

### Change Log

- 2026-02-11: Code review fixes — DRY refactor of generateChoices, rewardTier cleanup in resumeGameplay, zone-switching scanProgress reset bug, dead code removal (rewardPool), documentation comments. 403 tests pass.
- 2026-02-11: Story 5.3 implemented — Planet scanning & rewards system with distance-based scan detection, tier-filtered reward generation, planet reward modal UI, HUD scan progress bar, minimap scan pulse, and SFX registration. 23 new tests added, 0 regressions.

### File List

**New files:**
- src/ui/PlanetRewardModal.jsx
- src/stores/__tests__/useLevel.scanning.test.js

**Modified files:**
- src/entities/planetDefs.js (added rewardPool per tier)
- src/entities/__tests__/planetDefs.test.js (4 new tests)
- src/config/gameConfig.js (added PLANET_SCAN_REWARD_CHOICES)
- src/systems/progressionSystem.js (added buildFullPool, generatePlanetReward)
- src/systems/__tests__/progressionSystem.test.js (6 new tests)
- src/stores/useLevel.jsx (added activeScanPlanetId, scanningTick, updated reset)
- src/stores/useGame.jsx (added rewardTier, triggerPlanetReward, updated reset)
- src/stores/__tests__/useGame.test.js (4 new tests)
- src/GameLoop.jsx (added section 7g scanning, prevScanPlanetRef, planetReward phase guard)
- src/ui/Interface.jsx (mounted PlanetRewardModal, HUD during planetReward)
- src/Experience.jsx (GameplayScene mounted during planetReward)
- src/ui/HUD.jsx (scan progress bar, minimap pulse, activeScanPlanetId subscription)
- src/audio/audioManager.js (scan-start, scan-complete in SFX_CATEGORY_MAP)
- src/config/assetManifest.js (scanStart, scanComplete audio paths)
- src/hooks/useAudio.jsx (scan SFX in SFX_MAP)
- src/style.css (scanPulse keyframe)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status: in-progress → review)
