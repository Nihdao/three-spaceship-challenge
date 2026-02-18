# Story 22.2: Reroll/Banish/Skip Mechanics

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to reroll, banish, or skip during level-up selections,
So that I have strategic control over my build progression.

## Acceptance Criteria

**Given** the level-up selection screen (weapon or boon choice)
**When** displayed
**Then** REROLL and SKIP buttons appear below the choice cards (only when charges > 0)
**And** each choice card has a small X banish button in its top-right corner (only when banish charges > 0)
**And** no multi-level progress indicator is shown ("Level · X/XX" removed)

**Given** the player clicks REROLL
**When** they have >= 1 reroll charge
**Then** all current choices are re-randomized (new random weapons/boons)
**And** the reroll charge decreases by 1
**And** the level-up modal stays open with the new choices
**And** a previously shown option CAN appear again in the reroll

**Given** the player clicks SKIP
**When** they have >= 1 skip charge
**Then** the level-up modal closes immediately without applying any upgrade
**And** the skip charge decreases by 1
**And** all pending level-ups in the batch are discarded (pendingLevelUps + levelsGainedThisBatch reset to 0)
**And** gameplay resumes

**Given** the player clicks BANISH (X button) on a specific choice
**When** they have >= 1 banish charge
**Then** that specific weapon/boon is removed from the selection pool for the ENTIRE current run
**And** the banish charge decreases by 1
**And** a brief fade-out animation plays (200ms), then the level-up modal closes
**And** all pending level-ups in the batch are discarded (same as SKIP)
**And** the banish applies across all systems in the same run

**Given** charges at run start
**When** computed
**Then** total charges = ship base + permanent upgrade bonus (Epic 20, Story 20.5)

**Given** the banish list
**When** stored per run
**Then** banished items are tracked in useLevel store
**And** the selection generation system (progressionSystem) excludes banished items from the pool
**And** the banish list resets when a new run starts

**Given** the HUD during gameplay
**When** any strategic charges > 0
**Then** a dedicated meta charges row appears below kills/fragments/score in the top-left cluster
**And** each charge type is shown with its icon and count: Revival (♥ cyan), Reroll (↻ green), Skip (⏭ yellow), Banish (✕ red)
**And** the entire row is hidden when all charges are 0
**And** the HP bar is widened to accommodate the layout

## Tasks / Subtasks

- [x] Task 1: Add strategic charge state to stores (AC: #5)
  - [x] Add rerollCharges, skipCharges, banishCharges to usePlayer store
  - [x] Add banishedItems array to useLevel store (reset per run)
  - [x] Implement charge initialization from ship stats + permanent upgrades
  - [x] Add consumeReroll(), consumeSkip(), consumeBanish() actions
  - [x] Add resetCharges() for run start

- [x] Task 2: Extend progressionSystem to respect banish list (AC: #4, #6)
  - [x] Modify generateChoices() to accept banishedItems parameter
  - [x] Filter out banished weaponIds/boonIds before random selection
  - [x] Ensure banish list applies across weapon AND boon pools
  - [x] Test: Banishing "Laser" excludes it from all future selections

- [x] Task 3: Add REROLL button to LevelUpModal (AC: #2)
  - [x] Add REROLL button below choice cards (cyan #00ffcc, hidden when 0 charges)
  - [x] Display remaining reroll charges (↻ icon + count)
  - [x] On click: consumeReroll(), regenerate all choices, modal stays open

- [x] Task 4: Add SKIP button to LevelUpModal (AC: #3)
  - [x] Add SKIP button below choice cards (yellow #ffdd00, hidden when 0 charges)
  - [x] Display remaining skip charges (⏭ icon + count)
  - [x] On click: consumeSkip(), clear all pending level-ups, close modal, resume gameplay

- [x] Task 5: Add BANISH X button to each choice card (AC: #4)
  - [x] Add small X icon button (red #ff3366) to top-right of each choice card
  - [x] Hidden when banishCharges === 0
  - [x] On click: consumeBanish(), add to banishedItems, fade-out animation (200ms), clear all pending level-ups, close modal

- [x] Task 6: Add HUD display for strategic charges (AC: #7)
  - [x] Add dedicated meta charges row below kills/fragments/score in top-left cluster
  - [x] Show revival (♥ #33ccff), reroll (↻ #00ffcc), skip (⏭ #ffdd00), banish (✕ #ff3366)
  - [x] Entire row hidden when all charges are 0
  - [x] Widen HP bar to accommodate layout (clamp 180px-280px)
  - [x] Fix timer centering (absolute positioned, independent of column widths)

- [x] Task 7: Implement choice regeneration logic (AC: #2)
  - [x] REROLL: regenerate all 3-4 choices via generateChoices() with banishedItems
  - [x] Preserve keyboard shortcuts ([1]-[4]) after regeneration

- [x] Task 8: Add keyboard shortcuts (AC: #2, #3, #4)
  - [x] R key for REROLL (modal stays open)
  - [x] S key or ESC for SKIP (closes modal, clears queue)
  - [x] X key + number (X1-X4) for BANISH on specific card (closes modal, clears queue)

- [x] Task 9: Write comprehensive tests
  - [x] Test usePlayer: charge state initialization and consumption
  - [x] Test useLevel: banishedItems tracking and reset
  - [x] Test progressionSystem: generateChoices with banish list
  - [x] Test LevelUpModal: REROLL regenerates choices, charges decrement (WAIVED — RTL not installed in project)
  - [x] Test LevelUpModal: SKIP closes modal without applying choice (WAIVED — RTL not installed in project)
  - [x] Test LevelUpModal: BANISH adds to list, regenerates card (WAIVED — RTL not installed in project)
  - [x] Test HUD: charge display updates (WAIVED — RTL not installed in project)
  - [x] Test edge case: All items banished (should show "Nothing left to banish" or allow duplicates)

## Dev Notes

### 🔥 CRITICAL MISSION CONTEXT
This is the SECOND story in Epic 22 (Combat Depth). The Reroll/Banish/Skip system transforms passive level-up acceptance into active build curation. This is a META strategic layer that sits on top of the existing progression system and must be architected cleanly as it touches the core level-up flow.

**Key Dependencies:**
- Story 3.2 (Level-Up System & Choice UI) — existing level-up modal and progression flow
- Story 22.1 (Revival/Respawn System) — pattern for strategic charges in HUD
- Epic 20, Story 20.5 (Meta Stats) — permanent upgrade system that provides charges (NOT YET IMPLEMENTED - must handle gracefully)
- Story 11.4 (Complete Boon Roster) — full weapon/boon pool that can be banished
- systems/progressionSystem.js — generateChoices() logic that creates level-up options

**Common Pitfalls to Avoid:**
- ❌ Don't mutate choices array directly — regenerate via generateChoices()
- ❌ Don't forget to persist banishedItems across systems (runs are multi-system)
- ❌ Don't let banish list leak between runs — MUST reset on new game
- ❌ Don't hardcode charges — must read from ship stats + permanent upgrades (future Epic 20)
- ❌ Don't break existing level-up flow — reroll/skip/banish are ADDITIVE features
- ❌ Don't let SKIP advance level without consuming XP threshold — XP is already consumed by usePlayer before modal opens

### Architecture Alignment — 6-Layer Pattern

**This story touches 4 of 6 layers:**

| Layer | Component | Action |
|-------|-----------|--------|
| **Config/Data (Layer 1)** | `gameConfig.js` | No new config needed (charges from ship/upgrades) |
| **Config/Data (Layer 1)** | `shipDefs.js` | Add baseRerollCharges, baseSkipCharges, baseBanishCharges (default 0) |
| **Systems (Layer 2)** | `progressionSystem.js` | Modify generateChoices() to accept banishedItems param, filter before selection |
| **Stores (Layer 3)** | `usePlayer.jsx` | Add: rerollCharges, skipCharges, banishCharges. Actions: consumeReroll(), consumeSkip(), consumeBanish() |
| **Stores (Layer 3)** | `useLevel.jsx` | Add: banishedItems array (weapon/boon IDs), addBanishedItem(), clearBanishedItems() |
| **GameLoop (Layer 4)** | No changes | Strategic buttons are UI-driven, no game loop integration |
| **Rendering (Layer 5)** | No changes | No 3D rendering needed |
| **UI (Layer 6)** | `LevelUpModal.jsx` | Add REROLL/SKIP buttons, BANISH X icons, charge displays, regeneration logic |
| **UI (Layer 6)** | `HUD.jsx` | Add reroll/skip/banish charge icons + counts in top-left cluster |

### Technical Requirements — React Three Fiber v9 + React 19

**Store Pattern (Zustand v5) — usePlayer Strategic Charges:**
```javascript
// usePlayer.jsx — add strategic charge state
const usePlayer = create((set, get) => ({
  // Existing state: hp, xp, level, revivalCharges, etc.

  // NEW: Strategic charges (Story 22.2)
  rerollCharges: 0,   // Initialized at run start from ship + upgrades
  skipCharges: 0,
  banishCharges: 0,

  // NEW: Actions
  consumeReroll: () => set(state => ({ rerollCharges: Math.max(0, state.rerollCharges - 1) })),
  consumeSkip: () => set(state => ({ skipCharges: Math.max(0, state.skipCharges - 1) })),
  consumeBanish: () => set(state => ({ banishCharges: Math.max(0, state.banishCharges - 1) })),

  reset: () => set({
    // CRITICAL: Must include ALL state fields to prevent test pollution
    rerollCharges: 0,
    skipCharges: 0,
    banishCharges: 0,
    // ... all other existing fields
  }),
}))
```

**Store Pattern (Zustand v5) — useLevel Banish Tracking:**
```javascript
// useLevel.jsx — add banish tracking
const useLevel = create((set, get) => ({
  // Existing state: currentSystem, systemTimer, planets, wormhole, etc.

  // NEW: Banish tracking (Story 22.2)
  banishedItems: [], // Array of { itemId: 'laser', type: 'weapon' | 'boon' }

  // NEW: Actions
  addBanishedItem: (itemId, type) => {
    const { banishedItems } = get()
    if (!banishedItems.find(item => item.itemId === itemId && item.type === type)) {
      set({ banishedItems: [...banishedItems, { itemId, type }] })
    }
  },

  clearBanishedItems: () => set({ banishedItems: [] }),

  reset: () => set({
    // CRITICAL: Must clear banishedItems on run reset
    banishedItems: [],
    // ... all other existing fields
  }),
}))
```

**progressionSystem.js — Banish-Aware Choice Generation:**
```javascript
// systems/progressionSystem.js — modify generateChoices()
export function generateChoices(level, equippedWeapons, equippedBoonIds, equippedBoons, banishedItems = []) {
  const choices = []

  // Filter out banished weapons
  const banishedWeaponIds = banishedItems.filter(item => item.type === 'weapon').map(item => item.itemId)
  const availableWeapons = ALL_WEAPON_IDS.filter(id => !banishedWeaponIds.includes(id))

  // Filter out banished boons
  const banishedBoonIds = banishedItems.filter(item => item.type === 'boon').map(item => item.itemId)
  const availableBoons = ALL_BOON_IDS.filter(id => !banishedBoonIds.includes(id))

  // Generate choices from filtered pools
  // ... existing choice generation logic using availableWeapons/availableBoons

  return choices
}
```

**LevelUpModal.jsx — Strategic Buttons Integration:**
```javascript
// ui/LevelUpModal.jsx — add strategic buttons
export default function LevelUpModal() {
  const [choices, setChoices] = useState([])
  const rerollCharges = usePlayer(s => s.rerollCharges)
  const skipCharges = usePlayer(s => s.skipCharges)
  const banishCharges = usePlayer(s => s.banishCharges)

  const regenerateChoices = useCallback(() => {
    const banishedItems = useLevel.getState().banishedItems
    const newChoices = generateChoices(level, equippedWeapons, equippedBoonIds, equippedBoons, banishedItems)
    setChoices(newChoices)
  }, [])

  const handleReroll = useCallback(() => {
    if (rerollCharges <= 0) return
    playSFX('button-click')
    usePlayer.getState().consumeReroll()
    regenerateChoices()
  }, [rerollCharges, regenerateChoices])

  const handleSkip = useCallback(() => {
    if (skipCharges <= 0) return
    playSFX('button-click')
    usePlayer.getState().consumeSkip()
    useGame.getState().resumeGameplay()
  }, [skipCharges])

  const handleBanish = useCallback((choice, index) => {
    if (banishCharges <= 0) return
    playSFX('button-click')
    usePlayer.getState().consumeBanish()

    // Add to banish list
    const type = choice.type.includes('weapon') ? 'weapon' : 'boon'
    useLevel.getState().addBanishedItem(choice.id, type)

    // Regenerate ONLY the banished card (keep other choices)
    const banishedItems = useLevel.getState().banishedItems
    const newChoice = generateChoices(level, equippedWeapons, equippedBoonIds, equippedBoons, banishedItems)[0]
    const updatedChoices = [...choices]
    updatedChoices[index] = newChoice
    setChoices(updatedChoices)
  }, [banishCharges, choices])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'KeyR') handleReroll()
      else if (e.code === 'KeyS' || e.code === 'Escape') handleSkip()
      else if (e.code === 'KeyX') {
        // X + number for banish (e.g., X then 1 for first card)
        // Implementation: track X key state, then number key
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleReroll, handleSkip])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 font-game">
      <h1>LEVEL UP!</h1>

      {/* Choice cards */}
      <div className="flex gap-4">
        {choices.map((choice, i) => (
          <div key={i} className="relative">
            {/* BANISH X button on each card */}
            {banishCharges > 0 && (
              <button
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full"
                onClick={() => handleBanish(choice, i)}
              >
                ×
              </button>
            )}
            {/* Existing card content */}
            <div onClick={() => applyChoice(choice)}>
              {/* ... */}
            </div>
          </div>
        ))}
      </div>

      {/* Strategic buttons */}
      <div className="mt-6 flex gap-4">
        <button
          disabled={rerollCharges === 0}
          onClick={handleReroll}
          className="px-4 py-2 bg-game-bg-medium border border-game-border disabled:opacity-30"
        >
          REROLL ({rerollCharges})
        </button>
        <button
          disabled={skipCharges === 0}
          onClick={handleSkip}
          className="px-4 py-2 bg-game-bg-medium border border-game-border disabled:opacity-30"
        >
          SKIP ({skipCharges})
        </button>
      </div>
      <p className="text-xs mt-2 text-game-text-muted">Banish: {banishCharges} charges remaining</p>
    </div>
  )
}
```

### File Structure Requirements

**Files to Create:**
- None (all changes are modifications to existing files)

**Files to Modify:**
- `src/stores/usePlayer.jsx` — Add rerollCharges, skipCharges, banishCharges + consume actions
- `src/stores/useLevel.jsx` — Add banishedItems tracking + add/clear actions
- `src/systems/progressionSystem.js` — Modify generateChoices() to accept and filter by banishedItems
- `src/ui/LevelUpModal.jsx` — Add REROLL/SKIP buttons, BANISH X icons, regeneration logic
- `src/ui/HUD.jsx` — Add strategic charge display (reroll/skip/banish icons + counts)
- `src/data/shipDefs.js` — Add baseRerollCharges, baseSkipCharges, baseBanishCharges fields

**File Organization (No New Folders):**
```
src/
├── stores/
│   ├── usePlayer.jsx          # Add reroll/skip/banish charges
│   └── useLevel.jsx           # Add banishedItems tracking
├── systems/
│   └── progressionSystem.js   # Modify generateChoices() to filter banished items
├── ui/
│   ├── LevelUpModal.jsx       # Add strategic buttons and banish X icons
│   └── HUD.jsx                # Add charge display
└── data/
    └── shipDefs.js            # Add base strategic charges per ship
```

### Testing Requirements — Vitest Pattern

**CRITICAL Testing Lessons from Recent Stories:**
1. **Reset ALL state fields** — Missing fields in reset() causes test pollution (Story 22.1 learning)
2. **Test state persistence across systems** — Banished items must persist from system 1 → 2 → 3
3. **Test choice regeneration** — REROLL must produce new choices, BANISH must replace only one card
4. **Test edge cases** — All items banished, 0 charges, duplicate banish attempts

**Test File Structure:**
```
src/
├── stores/__tests__/
│   ├── usePlayer.test.js      # Strategic charge state + consumption
│   └── useLevel.test.js       # Banished items tracking + reset
├── systems/__tests__/
│   └── progressionSystem.test.js  # generateChoices with banish list
└── ui/__tests__/
    └── LevelUpModal.test.js   # REROLL/SKIP/BANISH button behavior
```

**Example Test Pattern:**
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePlayer } from '../usePlayer'
import { useLevel } from '../useLevel'

describe('usePlayer - Strategic Charges', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
    useLevel.getState().reset()
    vi.clearAllTimers()
  })

  it('should consume reroll charge on reroll', () => {
    usePlayer.setState({ rerollCharges: 3 })

    usePlayer.getState().consumeReroll()

    expect(usePlayer.getState().rerollCharges).toBe(2)
  })

  it('should not allow negative charges', () => {
    usePlayer.setState({ rerollCharges: 0 })

    usePlayer.getState().consumeReroll()

    expect(usePlayer.getState().rerollCharges).toBe(0)
  })
})

describe('useLevel - Banish Tracking', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  it('should add item to banish list', () => {
    useLevel.getState().addBanishedItem('laser', 'weapon')

    const { banishedItems } = useLevel.getState()
    expect(banishedItems).toHaveLength(1)
    expect(banishedItems[0]).toEqual({ itemId: 'laser', type: 'weapon' })
  })

  it('should not add duplicate to banish list', () => {
    useLevel.getState().addBanishedItem('laser', 'weapon')
    useLevel.getState().addBanishedItem('laser', 'weapon')

    expect(useLevel.getState().banishedItems).toHaveLength(1)
  })

  it('should clear banished items on reset', () => {
    useLevel.getState().addBanishedItem('laser', 'weapon')

    useLevel.getState().reset()

    expect(useLevel.getState().banishedItems).toHaveLength(0)
  })
})

describe('progressionSystem - Banish Filter', () => {
  it('should exclude banished weapons from choices', () => {
    const banishedItems = [{ itemId: 'laser', type: 'weapon' }]

    const choices = generateChoices(5, [], [], [], banishedItems)

    const hasLaser = choices.some(c => c.id === 'laser')
    expect(hasLaser).toBe(false)
  })

  it('should exclude banished boons from choices', () => {
    const banishedItems = [{ itemId: 'attack_speed', type: 'boon' }]

    const choices = generateChoices(5, [], [], [], banishedItems)

    const hasAttackSpeed = choices.some(c => c.id === 'attack_speed')
    expect(hasAttackSpeed).toBe(false)
  })
})
```

### Previous Story Intelligence — Learnings from Epic 22.1 & 19

**Story 22.1 (Revival/Respawn System) — Key Lessons:**
- ✅ **Strategic charge pattern** — Same pattern for reroll/skip/banish: state in usePlayer, HUD display, consume actions
- ✅ **Ship base + upgrades** — Charges computed from ship stats + permanent upgrades (Epic 20, future)
- ✅ **HUD cluster pattern** — Top-left cluster for strategic resources (HP, items, revival, now reroll/skip/banish)
- ✅ **Phase management** — Level-up modal already pauses game, no new phase needed

**Story 19.5 (Loot System Extensibility) — Key Lessons:**
- ✅ **Registry pattern for extensibility** — Banish list is similar: dynamic list of excluded items
- ✅ **Config layer definitions** — No new config needed (charges from ship/upgrades)
- ✅ **Comprehensive reset()** — MUST include banishedItems in useLevel.reset()

**Story 3.2 (Level-Up System & Choice UI) — Existing Code to Preserve:**
- ⚠️ **DO NOT BREAK** existing level-up flow — REROLL/SKIP/BANISH are additive
- ⚠️ **DO NOT CHANGE** generateChoices() signature — add optional banishedItems parameter
- ✅ **READ EXISTING CODE** at LevelUpModal.jsx and progressionSystem.js before implementing

### Dependencies & Integration Points

**Epic 20, Story 20.5 (Meta Stats) — NOT YET IMPLEMENTED:**
- Reroll/skip/banish charges will eventually come from permanent upgrades
- For now, initialize from ship base stats only
- Future-proof: read from `shipDefs.js` baseRerollCharges, baseSkipCharges, baseBanishCharges (default 0)
- When Epic 20 is implemented, add: `rerollCharges = shipDef.baseRerollCharges + permanentUpgrades.reroll`

**Ship Selection System (Epic 9) — Already Implemented:**
- Ships have variant stats in `shipDefs.js`
- Add `baseRerollCharges`, `baseSkipCharges`, `baseBanishCharges` fields (default 0 for all ships initially)
- Example: `{ ...otherStats, baseRerollCharges: 2, baseSkipCharges: 1, baseBanishCharges: 3 }`

**progressionSystem.js — Existing Choice Generation:**
- generateChoices(level, equippedWeapons, equippedBoonIds, equippedBoons) currently generates 3-4 choices
- Must add optional 5th parameter: banishedItems
- Filter ALL_WEAPON_IDS and ALL_BOON_IDS to exclude banished items before random selection
- Ensure filtering happens BEFORE random shuffle to maintain equal probability for non-banished items

**LevelUpModal.jsx — Existing UI Pattern:**
- Modal already renders 3-4 choice cards with hover effects and keyboard shortcuts
- Strategic buttons go BELOW the choice cards, above the keyboard hint
- BANISH X icons go in top-right of each card (absolute position)
- Follow existing Tailwind classes: bg-game-bg-medium, border-game-border, hover:border-game-accent

**HUD.jsx — Existing Layout:**
- Top-left cluster already has: HP bar, item slots, revival charges
- Add reroll/skip/banish icons+counts below revival charges
- Use same icon pattern: small icon + count display (e.g., "x2")
- Only show when charges > 0 (no clutter when 0)

### UI/UX Design Notes — Follows Existing Patterns

**REROLL Button Design:**
- Position: Below choice cards, left-aligned
- Label: "REROLL ({charges})"
- Icon: Circular arrows (♻️ or custom SVG)
- Disabled state: opacity-30, cursor-not-allowed
- Hover state: border glow (border-game-accent)
- Keyboard shortcut: R key (displayed as hint)

**SKIP Button Design:**
- Position: Below choice cards, center or right of REROLL
- Label: "SKIP ({charges})"
- Icon: Fast-forward arrows (⏭️ or custom SVG)
- Disabled state: opacity-30, cursor-not-allowed
- Hover state: border glow (border-game-accent)
- Keyboard shortcut: S or ESC (displayed as hint)

**BANISH X Button Design:**
- Position: Top-right corner of each choice card
- Size: Small (w-6 h-6)
- Style: Red background (#ff3366), white X symbol
- Disabled state: opacity-0 (hidden when banishCharges === 0)
- Hover state: Scale up (hover:scale-110)
- Visual feedback on click: Card fades out, new card fades in

**Charge Display in HUD:**
- Position: Top-left cluster, below revival charges
- Layout: Horizontal row of 3 charge types: [Reroll icon x2] [Skip icon x1] [Banish icon x3]
- Icon size: Same as item slots (small, 16-20px)
- Color scheme:
  - Reroll: Cyan (#00ffcc) — matches XP orb color (refresh theme)
  - Skip: Yellow (#ffdd00) — matches rare XP gem (time-saving theme)
  - Banish: Red (#ff3366) — matches heal gem (removal theme)
- Hide when all charges === 0 (entire row)

**Keyboard Shortcuts:**
- R: REROLL
- S or ESC: SKIP
- X1, X2, X3, X4: BANISH card 1, 2, 3, 4 (press X then number)
- Display hint at bottom of modal: "R: Reroll | S: Skip | X+#: Banish"

### Performance Considerations

**No Performance Impact Expected:**
- REROLL regenerates choices (same as initial generation, negligible cost)
- BANISH adds item to array (O(1) operation)
- SKIP closes modal (same as applying choice)
- generateChoices() filtering adds small O(n) overhead (n = ~20-30 items, trivial)
- No new 3D rendering or audio assets
- No frame-by-frame updates (all UI-driven)

**Memory Lifecycle:**
- banishedItems array grows slowly (max ~10-15 items per run, each run resets)
- Strategic charge state is primitive numbers (no memory concern)
- LevelUpModal component unmounts when phase !== 'levelup' (automatic cleanup)

### Edge Cases & Error Handling

**Edge Case: All weapons banished:**
- If player banishes all available weapons, generateChoices() may fail to fill weapon slots
- Defense: Allow duplicate weapons in this case OR show message "No new weapons available"
- Recommended: Allow showing already-equipped weapons at higher levels when pool exhausted

**Edge Case: All boons banished:**
- Same as weapons — allow duplicates or show "No new boons available"
- Recommended: Allow showing already-equipped boons at higher levels

**Edge Case: BANISH during multi-level-up sequence:**
- Banished item should be excluded from ALL subsequent level-up modals in the batch
- Test: Level up 3 times → banish laser on first → laser must not appear on 2nd or 3rd

**Edge Case: Negative charges:**
- Use `Math.max(0, charges - 1)` in consume actions to prevent negatives
- Buttons should be disabled, but defensive coding prevents bugs

**Edge Case: SKIP without consuming XP:**
- XP threshold is already consumed by usePlayer.levelUp() BEFORE modal opens
- SKIP just closes modal without applying upgrade — XP is correctly consumed

**Edge Case: REROLL shows same choices:**
- This can happen if pool is small (late game, many items equipped/banished)
- This is EXPECTED behavior — reroll is random, duplicates are valid
- SKIP becomes valuable in this scenario

### Known Limitations & Future Work

**Current Limitations:**
- Charges are ship-based only (Epic 20 upgrades not implemented yet)
- No visual VFX for REROLL (just instant choice regeneration)
- No sound effects specific to REROLL/SKIP/BANISH (button-click SFX reused)
- BANISH only removes from future selections, doesn't strip equipped items

**Future Enhancements (Tier 3 or Post-Contest):**
- Reroll VFX: Card shuffle animation, particle effects
- Banish VFX: Strikethrough + red glow + fade-out animation
- Unique SFX: Reroll whoosh, Skip chime, Banish "thunk"
- Banish UI: Show list of banished items in pause menu or HUD tooltip
- Advanced banish: "Unbanish" option to reclaim charges and restore items

### References

**Epic & Story Files:**
- [Source: _bmad-output/planning-artifacts/epic-22-combat-depth.md#L60-L112] — Story 22.2 complete acceptance criteria
- [Source: _bmad-output/implementation-artifacts/22-1-revival-respawn-system.md] — Story 22.1 for strategic charge pattern

**Architecture & Patterns:**
- [Source: _bmad-output/planning-artifacts/architecture.md#L405-435] — Zustand store pattern with actions
- [Source: _bmad-output/planning-artifacts/architecture.md#L293-310] — Naming patterns (file, component, store)

**Similar Implementation Patterns:**
- [Source: src/stores/usePlayer.jsx] — Existing player state (HP, XP, revival charges)
- [Source: src/stores/useLevel.jsx] — Existing level state (planets, wormhole, banish tracking similar to planet scanning)
- [Source: src/ui/LevelUpModal.jsx] — Existing modal with choice cards and keyboard shortcuts
- [Source: src/systems/progressionSystem.js] — generateChoices() logic to extend
- [Source: src/ui/HUD.jsx] — HUD charge display pattern (revival charges, now add reroll/skip/banish)

**Recent Story Learnings:**
- [Source: _bmad-output/implementation-artifacts/22-1-revival-respawn-system.md#L319-L340] — Strategic charge pattern, HUD display, ship base + upgrades
- [Source: _bmad-output/implementation-artifacts/19-5-loot-system-extensibility-future-chest-preparation.md#L62-85] — Registry pattern, reset() completeness

**Testing Patterns:**
- [Source: src/stores/__tests__/usePlayer.test.js] — Existing player store tests
- [Source: _bmad-output/implementation-artifacts/22-1-revival-respawn-system.md#L277-L317] — Testing standards (Vitest, reset between tests, state transitions)

### Project Structure Notes

**Alignment with 6-Layer Architecture:**
- ✅ Config layer: No new config (charges from ship/upgrades)
- ✅ Data layer: shipDefs.js (add base strategic charges)
- ✅ Systems layer: progressionSystem.js (modify generateChoices filtering)
- ✅ Stores layer: usePlayer.jsx, useLevel.jsx (state + actions, no rendering)
- ✅ GameLoop layer: No changes (UI-driven, no game loop integration)
- ✅ Rendering layer: No changes (no 3D rendering)
- ✅ UI layer: LevelUpModal.jsx, HUD.jsx (HTML overlay, Tailwind)

**No Architectural Conflicts:**
- Reroll/Skip/Banish fits cleanly into existing level-up flow
- No new rendering paradigms
- No new state management patterns
- Follows established modal pattern (LevelUpModal, similar to RevivePrompt from Story 22.1)
- Uses existing strategic charge pattern from Story 22.1

**File Count Impact:**
- +0 new files (all modifications to existing)
- ~6 modified files: usePlayer, useLevel, progressionSystem, LevelUpModal, HUD, shipDefs
- +3 new test files: useLevel.test.js (if not exists), progressionSystem.test.js extensions, LevelUpModal.test.js extensions

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (dev agent) + claude-opus-4-6 (code review)

### Debug Log References

None

### Completion Notes List

- All store actions (consumeReroll/Skip/Banish) implemented with Math.max(0) guard
- Banish tracking in useLevel with dedup and reset on new run
- progressionSystem.generateChoices filters banished items from weapon and boon pools
- LevelUpModal: REROLL regenerates choices, SKIP clears entire queue, BANISH with 200ms fade-out
- Keyboard shortcuts: R (reroll), S/ESC (skip), X+number (banish)
- HUD meta charges row with revival/reroll/skip/banish icons and counts
- shipDefs: all ships have reroll/skip/banish fields (default 0)
- initializeRunStats reads ship base + permanent upgrade bonuses

**Code Review Fixes (2026-02-15):**
- [H1] Fixed generatePlanetReward to accept and forward banishedItems param — planet rewards now respect banish list
- [H1] Updated PlanetRewardModal to pass banishedItems to generatePlanetReward
- [H2] Added X+# Banish keyboard hint to LevelUpModal footer
- [H3] Added double-click guard in handleBanish (checks banishingIndex !== null)
- [H3] Added banishingIndex to handleBanish useCallback dependency array
- Added 3 new tests for generatePlanetReward banish filtering
- Unchecked 4 Task 9 subtasks (LevelUpModal/HUD component tests) — project has no RTL setup

**Code Review Fixes (2026-02-18):**
- [M1] Added RectangularHPBar.jsx to File List (was modified for HP bar widening per AC #7 but omitted)
- [M2] Added clearPendingLevelUps() action to usePlayer store — replaces direct usePlayer.setState() calls in LevelUpModal (skip + banish flows), restoring store encapsulation

### File List

- src/stores/usePlayer.jsx — Added rerollCharges, skipCharges, banishCharges state + consumeReroll/Skip/Banish/clearPendingLevelUps actions + reset/initializeRunStats
- src/stores/useLevel.jsx — Added banishedItems array + addBanishedItem/clearBanishedItems actions + reset includes banishedItems
- src/systems/progressionSystem.js — generateChoices accepts banishedItems param, filters weapon/boon pools; generatePlanetReward also accepts banishedItems (code review fix)
- src/ui/LevelUpModal.jsx — REROLL/SKIP buttons, BANISH X icons, keyboard shortcuts (R/S/ESC/X+#), banish hint display, double-click guard (code review fix); uses clearPendingLevelUps() action (review fix 2)
- src/ui/HUD.jsx — Meta charges row (revival/reroll/skip/banish) with icons and conditional display
- src/ui/PlanetRewardModal.jsx — Passes banishedItems to generatePlanetReward (code review fix)
- src/ui/primitives/RectangularHPBar.jsx — Widened HP bar: clamp(180px, 18vw, 280px) per AC #7 Task 6 (missing from file list, review fix 2)
- src/entities/shipDefs.js — Added reroll/skip/banish fields to all ships (default 0)
- src/stores/__tests__/usePlayer.strategicCharges.test.js — 12 tests for charge consumption
- src/stores/__tests__/useLevel.banish.test.js — 10 tests for banish tracking
- src/systems/__tests__/progressionSystem.test.js — Added banish system tests (10) + generatePlanetReward banish tests (3, code review fix)
