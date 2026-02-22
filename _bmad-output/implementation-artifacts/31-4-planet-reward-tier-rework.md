# Story 31.4: Planet Reward Tier Rework

Status: ready-for-dev

## Story

As a player,
I want planet scan rewards to feel distinctly different by tier,
so that platinum planets are genuinely exciting moments worth pursuing.

## Acceptance Criteria

1. **[Silver — 2 choices, luckStat=0]** When a silver planet reward modal opens, exactly 2 choices are presented, with `luckStat=0` injected (no luck influence on quality). Pool favors upgrades for equipped weapons + boons (existing silver filter logic preserved).

2. **[Gold — 3 choices, real luckStat]** When a gold planet reward modal opens, exactly 3 choices are presented, with `luckStat = player's getLuckStat()` value. Pool is balanced (full pool, same as level-up).

3. **[Platinum — 3+P4 choices, real luckStat]** When a platinum planet reward modal opens, 3 choices are presented base, with a potential 4th via `P4 = Math.min(luckStat / (luckStat + 8), 0.85)`. At luckStat=0: always 3. At luckStat=8: ~50% chance of 4th. Never exceeds 85% probability. luckStat = player's real `getLuckStat()`.

4. **[Platinum — guaranteed RARE+]** After choices are rolled for platinum, if all choices are COMMON, the first choice is forced to RARE minimum (rarity metadata overridden post-roll).

5. **[Platinum — pool priority]** Platinum pool prioritizes new weapons and new boons first (existing priority logic preserved).

6. **[luckStat parameter injection]** `generatePlanetReward()` signature gains a `luckStat` parameter (default 0 for backwards compatibility). The caller `PlanetRewardModal.jsx` reads `(usePlayer.getState().getLuckStat?.() ?? 0) + (useBoons.getState().modifiers.luckBonus ?? 0)` and passes it.

7. **[Tests pass]** Updated test files cover all new behaviors. `npx vitest run src/systems/__tests__/progressionSystem.test.js` — all pass. `npx vitest run` — zero failures globally.

## Tasks / Subtasks

- [ ] Task 1: Update `generatePlanetReward()` signature in `progressionSystem.js` (AC: #6)
  - [ ] Change signature: `export function generatePlanetReward(tier, equippedWeapons, equippedBoonIds, equippedBoons = [], banishedItems = [], luckStat = 0)`

- [ ] Task 2: Implement tier-based count + effectiveLuck (AC: #1, #2, #3)
  - [ ] Replace `const count = GAME_CONFIG.PLANET_SCAN_REWARD_CHOICES` with:
    ```js
    let count, effectiveLuck
    if (tier === 'silver') {
      count = 2
      effectiveLuck = 0
    } else if (tier === 'gold') {
      count = 3
      effectiveLuck = luckStat
    } else {
      // platinum
      const P4 = luckStat === 0 ? 0 : Math.min(luckStat / (luckStat + 8), 0.85)
      count = Math.random() < P4 ? 4 : 3
      effectiveLuck = luckStat
    }
    ```
  - [ ] Replace the hardcoded `0` in `applyRarityToChoices(filtered.slice(0, count), 0)` with `effectiveLuck`
  - [ ] Store return value in `const result` (not directly returned — needed for platinum post-processing)

- [ ] Task 3: Implement platinum guaranteed RARE+ enforcement (AC: #4)
  - [ ] After `applyRarityToChoices()`, add post-processing block:
    ```js
    if (tier === 'platinum') {
      const allCommon = result.every(c => c.rarity === 'COMMON')
      if (allCommon) {
        const rarityTier = getRarityTier('RARE')
        result[0] = {
          ...result[0],
          rarity: 'RARE',
          rarityColor: rarityTier.color,
          rarityName: rarityTier.name,
          rarityMultiplier: rarityTier.bonusMultiplier,
        }
      }
    }
    return result
    ```
  - [ ] `getRarityTier` is already imported at line 4 — no new import needed

- [ ] Task 4: Update `PlanetRewardModal.jsx` caller (AC: #6)
  - [ ] In `useEffect` (lines 32–38), add luckStat read before `setChoices()`:
    ```js
    const luckStat = (usePlayer.getState().getLuckStat?.() ?? 0) + (useBoons.getState().modifiers.luckBonus ?? 0)
    setChoices(generatePlanetReward(rewardTier, equippedWeapons, equippedBoonIds, equippedBoons, banishedItems, luckStat))
    ```
  - [ ] `usePlayer` (line 3) and `useBoons` (line 5) are already imported — no new imports needed

- [ ] Task 5: Update `src/systems/__tests__/progressionSystem.test.js` (AC: #7)
  - [ ] Fix test "returns exactly 3 choices" (line ~236): silver now returns 2 — update to `toHaveLength(2)` or split
  - [ ] Fix test "handles edge case: all weapons maxed, all boons equipped" (line ~285):
    - Replace `{ weaponId: 'MISSILE_HOMING', level: 9 }` → `{ weaponId: 'BEAM', level: 9 }`
    - Replace `{ weaponId: 'PLASMA_BOLT', level: 9 }` → `{ weaponId: 'EXPLOSIVE_ROUND', level: 9 }`
    - This test uses platinum tier — still returns stat_boost pads; `toHaveLength` stays valid but may return 3 or 4 depending on P4; use `toBeGreaterThanOrEqual(2)` or call with luckStat=0 to force 3
  - [ ] Add test: `silver always returns 2 choices` (run 10 times, all `choices.length === 2`)
  - [ ] Add test: `gold always returns 3 choices` (run 10 times, all `choices.length === 3`)
  - [ ] Add test: `platinum with luckStat=0 always returns 3` (run 20 times, all `choices.length === 3`)
  - [ ] Add test: `platinum guaranteed RARE+ — never all COMMON` (run 20 times, `choices.some(c => c.rarity !== 'COMMON')` always true)

- [ ] Task 6: Final validation (AC: #7)
  - [ ] `npx vitest run src/systems/__tests__/progressionSystem.test.js` — zero failures
  - [ ] `npx vitest run` — zero failures globally

## Dev Notes

### Prerequisites: Stories 31.1, 31.2, 31.3 Must Be Complete

**Do NOT implement on the pre-31.1/31.2/31.3 codebase.** Story 31.4 assumes:
- **31.1 done**: 7 weapons removed; `rarityWeight` field present; stubs flagged `implemented: false`
- **31.2 done**: `applyRarityToChoices()` calls `rollUpgrade()` for `weapon_upgrade`; `statPreview` format is `"Damage +15% (Rare)"`
- **31.3 done**: `generateChoices()` refactored with P4/P_upgrade logic

Story 31.4 **only modifies `generatePlanetReward()`** and its caller. Do NOT touch `generateChoices()`, `buildFullPool()`, or `applyRarityToChoices()`.

### Target Implementation — Full `generatePlanetReward()` Body

```js
export function generatePlanetReward(tier, equippedWeapons, equippedBoonIds, equippedBoons = [], banishedItems = [], luckStat = 0) {
  const pool = buildFullPool(equippedWeapons, equippedBoonIds, equippedBoons, banishedItems)

  let count, effectiveLuck
  if (tier === 'silver') {
    count = 2
    effectiveLuck = 0
  } else if (tier === 'gold') {
    count = 3
    effectiveLuck = luckStat
  } else {
    // platinum
    const P4 = luckStat === 0 ? 0 : Math.min(luckStat / (luckStat + 8), 0.85)
    count = Math.random() < P4 ? 4 : 3
    effectiveLuck = luckStat
  }

  let filtered
  if (tier === 'silver') {
    filtered = pool.filter(c => c.type === 'weapon_upgrade' || c.type === 'new_boon' || c.type === 'boon_upgrade')
    if (filtered.length < count) filtered = pool
  } else if (tier === 'gold') {
    filtered = pool
  } else {
    // platinum: new weapons + new boons first
    const newItems = pool.filter(c => c.type === 'new_weapon' || c.type === 'new_boon')
    const rest = pool.filter(c => c.type !== 'new_weapon' && c.type !== 'new_boon')
    filtered = [...newItems, ...rest]
  }

  shuffle(filtered)

  // Platinum: guarantee at least one new_weapon or new_boon if available (AC: #5)
  if (tier === 'platinum') {
    const topSlice = filtered.slice(0, count)
    const hasNew = topSlice.some(c => c.type === 'new_weapon' || c.type === 'new_boon')
    if (!hasNew) {
      const newItem = filtered.find(c => c.type === 'new_weapon' || c.type === 'new_boon')
      if (newItem) {
        filtered = [newItem, ...filtered.filter(c => c !== newItem)]
      }
    }
  }

  // Pad if pool too small (edge case: all maxed)
  while (filtered.length < count) {
    filtered.push({
      type: 'stat_boost',
      id: `stat_boost_${filtered.length}`,
      name: 'Stat Boost',
      description: 'Minor stat improvement',
      level: null,
      icon: null,
      statPreview: null,
    })
  }

  const result = applyRarityToChoices(filtered.slice(0, count), effectiveLuck)

  // Platinum: guaranteed RARE+ enforcement (AC: #4)
  if (tier === 'platinum') {
    const allCommon = result.every(c => c.rarity === 'COMMON')
    if (allCommon) {
      const rarityTier = getRarityTier('RARE')
      result[0] = {
        ...result[0],
        rarity: 'RARE',
        rarityColor: rarityTier.color,
        rarityName: rarityTier.name,
        rarityMultiplier: rarityTier.bonusMultiplier,
      }
    }
  }

  return result
}
```

### GAME_CONFIG.PLANET_SCAN_REWARD_CHOICES

The constant `GAME_CONFIG.PLANET_SCAN_REWARD_CHOICES` (= 3) will no longer be used in `generatePlanetReward()`. Leave it in `gameConfig.js` — do not remove it. Simply stop importing/using it inside `generatePlanetReward()`.

### Platinum Guaranteed RARE — Scope Note

The forced RARE override only sets rarity metadata fields (`rarity`, `rarityColor`, `rarityName`, `rarityMultiplier`). The `statPreview` string from `rollUpgrade()` (31.2) is already baked in and may not precisely match RARE magnitude. This is acceptable — the rarity badge will visually show RARE. A full re-roll of `rollUpgrade()` is out of scope for this story.

### Keyboard Handler in PlanetRewardModal.jsx — No Change Needed

The keyboard handler (lines 62–75) handles Digit1–Digit3. With silver showing 2 choices, Digit3 fires with index=2 which is `>= choices.length` (2), so the condition `index < choices.length` fails silently — safe. With platinum potentially showing 4 choices, Digit4 won't work. Adding Digit4 is **out of scope** for 31.4.

### Stale Tests to Fix in progressionSystem.test.js

**"returns exactly 3 choices" (line ~236)** — uses silver tier:
```js
expect(choices).toHaveLength(3)  // ← must become 2 for silver
```
Simplest fix: rename test to "silver returns exactly 2 choices" and update assertion.

**"handles edge case: all weapons maxed, all boons equipped" (line ~285)**:
```js
{ weaponId: 'MISSILE_HOMING', level: 9 },  // removed in 31.1
{ weaponId: 'PLASMA_BOLT', level: 9 },      // removed in 31.1
```
Replace with `{ weaponId: 'BEAM', level: 9 }` and `{ weaponId: 'EXPLOSIVE_ROUND', level: 9 }`. This test uses platinum tier — to avoid flakiness from P4 randomness, call `generatePlanetReward('platinum', fourMaxWeapons, allBoons, maxedBoons, [], 0)` with explicit `luckStat=0` so count is deterministically 3. Update assertion to `toHaveLength(3)`.

**"return format matches generateChoices format" (line ~297)** — uses gold tier: still valid, no change.

### Caller Pattern from LevelUpModal.jsx (reference)

```js
// LevelUpModal.jsx line 28-29 — use same pattern in PlanetRewardModal.jsx
const luckStat = (usePlayer.getState().getLuckStat?.() ?? 0) + (useBoons.getState().modifiers.luckBonus ?? 0)
```

### Project Structure Notes

**Production files touched:**
- `src/systems/progressionSystem.js` — `generatePlanetReward()` function only (lines 261–309)
- `src/ui/PlanetRewardModal.jsx` — `useEffect` caller (line 37)

**Test files touched:**
- `src/systems/__tests__/progressionSystem.test.js` — fix stale weapon refs, fix silver count, add tier-count + platinum RARE+ tests

**Does NOT change:**
- `generateChoices()` — already done in 31.3
- `buildFullPool()` — already done in 31.1/31.2/31.3
- `applyRarityToChoices()` — already done in 31.2
- `src/config/gameConfig.js` — `PLANET_SCAN_REWARD_CHOICES` stays, just unused in generatePlanetReward

### References

- [Source: _bmad-output/planning-artifacts/epic-31-weapon-roster-upgrade-system-overhaul.md#Story 31.4] — Full AC and tier behavior specs
- [Source: src/systems/progressionSystem.js lines 261–309] — Current `generatePlanetReward()` to modify
- [Source: src/ui/PlanetRewardModal.jsx lines 32–38] — Caller; needs luckStat injected
- [Source: src/systems/__tests__/progressionSystem.test.js lines 233–326] — Existing tests to fix/extend
- [Source: src/systems/progressionSystem.js line 4] — `getRarityTier` already imported, no new import needed
- [Source: _bmad-output/implementation-artifacts/31-3-levelup-formula-rework.md#P4 Formula] — P4 formula reused identically for platinum
- [Source: src/ui/LevelUpModal.jsx line 28] — luckStat caller pattern to copy in PlanetRewardModal

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
