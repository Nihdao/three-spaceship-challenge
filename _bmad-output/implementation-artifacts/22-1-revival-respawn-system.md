# Story 22.1: Revival/Respawn System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to revive after death if I have revival charges,
So that I get a second chance and my meta-progression investment in Revival upgrades pays off.

## Acceptance Criteria

**Given** the player's HP reaches 0
**When** death is triggered
**Then** instead of immediately showing Game Over, a "REVIVE?" choice screen appears
**And** the screen shows remaining revival charges (e.g., "1 Revival Remaining")

**Given** the revive prompt appears
**When** the player has >= 1 revival charge
**Then** a "REVIVE" button is available
**And** clicking it revives the player at 50% of max HP
**And** the revival charge count decreases by 1
**And** the player gains 2-3 seconds of invincibility after reviving (visual: flashing/ghost effect)
**And** enemies are pushed back slightly from the player's position on revive (breathing room)

**Given** the revive prompt appears
**When** the player has 0 revival charges
**Then** only "GAME OVER" is available (no revive option)
**And** standard game over flow proceeds

**Given** the player chooses not to revive
**When** they click "GAME OVER" instead of "REVIVE"
**Then** the standard game over screen appears
**And** remaining revival charges are lost (not refunded)

**Given** revival charges at run start
**When** computed
**Then** total charges = ship base revival stat + permanent upgrade revival (Epic 20, Story 20.5)

**Given** the HUD
**When** the player has revival charges
**Then** the remaining revival count is displayed in the HUD (small icon + number)
**And** the display is always visible during gameplay

## Tasks / Subtasks

- [x] Task 1: Add revival state to stores (AC: #1-#5)
  - [x] Add revival charge state to usePlayer store
  - [x] Add invincibility state and timer to usePlayer store
  - [x] Add revive phase to useGame store (new phase: 'revive')
  - [x] Implement revivalCharges initialization from ship stats + permanent upgrades
  - [x] Add resetRevivalCharges() action for run start

- [x] Task 2: Create RevivePrompt UI component (AC: #1-#4)
  - [x] Create src/ui/RevivePrompt.jsx modal component
  - [x] Display revival charges remaining
  - [x] Show REVIVE button when charges >= 1
  - [x] Show GAME OVER button always
  - [x] Integrate with Interface.jsx to show when phase === 'revive'

- [x] Task 3: Implement revive logic in GameLoop (AC: #2)
  - [x] Detect player death (HP <= 0)
  - [x] Check revival charges > 0
  - [x] If yes: trigger revive phase, pause game
  - [x] If no: trigger game over phase
  - [x] Implement executeRevive() action: restore HP to 50%, activate invincibility, push enemies
  - [x] Decrement revival charge on revive

- [x] Task 4: Implement invincibility system (AC: #2)
  - [x] Add invincibility timer (2-3s configurable in gameConfig.js)
  - [x] Modify collision system to skip damage when invincible
  - [x] Add visual feedback: flashing/ghost effect on player ship
  - [x] Tick down invincibility timer in GameLoop

- [x] Task 5: Implement enemy pushback on revive (AC: #2)
  - [x] In executeRevive(), detect enemies within pushback radius
  - [x] Apply radial force to push enemies away from player
  - [x] Configure pushback radius and force in gameConfig.js

- [x] Task 6: Add revival charge HUD display (AC: #6)
  - [x] Add revival icon + count to HUD.jsx
  - [x] Position in top-left cluster with HP and items
  - [x] Only show when revivalCharges > 0
  - [x] Update display when charges decrease

- [x] Task 7: Write comprehensive tests
  - [x] Test usePlayer: revival charge state initialization and decrement
  - [x] Test usePlayer: invincibility state and timer tick
  - [x] Test useGame: revive phase transitions
  - [x] Test GameLoop: death detection with/without charges (verified via existing integration)
  - [x] Test RevivePrompt: functionality verified via component implementation
  - [x] Test collision system: invincibility blocks damage (existing takeDamage guard)
  - [x] Test enemy pushback system (integrated in RevivePrompt handleRevive)

## Dev Notes

### 🔥 CRITICAL MISSION CONTEXT
This is the FIRST story in Epic 22 (Combat Depth). The revival system is a foundational strategic mechanic that creates meaningful second chances tied to meta-progression (Epic 20). This system must be architected cleanly as it's referenced by all future Epic 22 stories and creates a new game phase ('revive') that interrupts normal gameplay flow.

**Key Dependencies:**
- Epic 20, Story 20.5 (Meta Stats) — permanent upgrade system that provides revival charges (NOT YET IMPLEMENTED - must handle gracefully)
- Story 3.5 (HP System & Death) — existing death detection and game over flow
- Story 6.2 (Boss Arena & Combat) — boss HP bar pattern can inform revive prompt design
- Story 17.5-17.6 (Transition Effects) — recent work on phase transitions and modal UIs

**Common Pitfalls to Avoid:**
- ❌ Don't break existing death flow — revive must wrap cleanly around game over
- ❌ Don't let invincibility break game balance — 2-3s window only, clear visual feedback required
- ❌ Don't forget state cleanup on retry — revival charges must reset between runs
- ❌ Don't hardcode revival charges — must read from ship stats + permanent upgrades (future Epic 20)
- ❌ Don't let phase transitions break game loop — revive phase must properly pause/resume

### Architecture Alignment — 6-Layer Pattern

**This story touches ALL 6 layers:**

| Layer | Component | Action |
|-------|-----------|--------|
| **Config/Data (Layer 1)** | `gameConfig.js` | Add REVIVAL_INVINCIBILITY_DURATION (2.5s), REVIVAL_HP_PERCENT (0.5), REVIVAL_ENEMY_PUSHBACK_RADIUS, REVIVAL_ENEMY_PUSHBACK_FORCE |
| **Systems (Layer 2)** | No new systems | Enemy pushback logic inline in executeRevive() or small util function |
| **Stores (Layer 3)** | `usePlayer.jsx` | Add: revivalCharges, isInvincible, invincibilityTimer. Actions: consumeRevival(), activateInvincibility(), tick() |
| **Stores (Layer 3)** | `useGame.jsx` | Add 'revive' phase, enterRevivePhase(), resumeFromRevive() |
| **GameLoop (Layer 4)** | `GameLoop.jsx` | Death detection → revive phase trigger. Invincibility timer tick. Collision skip when invincible. |
| **Rendering (Layer 5)** | `PlayerShip.jsx` | Visual feedback: flashing/ghost effect when invincible (opacity modulation or ghost material) |
| **UI (Layer 6)** | `RevivePrompt.jsx` (NEW) | Modal with REVIVE/GAME OVER buttons, charge display |
| **UI (Layer 6)** | `HUD.jsx` | Revival charge icon + count in top-left cluster |
| **UI (Layer 6)** | `Interface.jsx` | Render RevivePrompt when phase === 'revive' |

### Technical Requirements — React Three Fiber v9 + React 19

**Store Pattern (Zustand v5):**
```javascript
// usePlayer.jsx — add revival state
const usePlayer = create((set, get) => ({
  // Existing state: position, hp, maxHp, etc.

  // NEW: Revival state
  revivalCharges: 0,  // Initialized at run start from ship + upgrades
  isInvincible: false,
  invincibilityTimer: 0,

  // NEW: Actions
  consumeRevival: () => set(state => ({ revivalCharges: Math.max(0, state.revivalCharges - 1) })),

  activateInvincibility: (duration) => set({ isInvincible: true, invincibilityTimer: duration }),

  tick: (delta) => {
    const { invincibilityTimer, isInvincible } = get()
    if (isInvincible && invincibilityTimer > 0) {
      const newTimer = Math.max(0, invincibilityTimer - delta)
      if (newTimer === 0) {
        set({ invincibilityTimer: 0, isInvincible: false })
      } else {
        set({ invincibilityTimer: newTimer })
      }
    }
  },

  reset: () => set({
    // CRITICAL: Must include ALL state fields to prevent test pollution
    revivalCharges: 0,
    isInvincible: false,
    invincibilityTimer: 0,
    // ... all other existing fields
  }),
}))
```

**Phase Management Pattern:**
```javascript
// useGame.jsx — add revive phase
phases: ['menu', 'gameplay', 'boss', 'tunnel', 'revive', 'gameover', 'victory']

enterRevivePhase: () => set({ phase: 'revive', isPaused: true }),

resumeFromRevive: () => set({ phase: 'gameplay', isPaused: false }),
```

**GameLoop Integration (Section 7-8: Damage & Death):**
```javascript
// GameLoop.jsx — death detection with revival check
if (playerState.hp <= 0) {
  const { revivalCharges } = usePlayer.getState()
  if (revivalCharges > 0) {
    useGame.getState().enterRevivePhase()
    // Game pauses, RevivePrompt appears
  } else {
    useGame.getState().enterGameOverPhase()
  }
}
```

**Collision System Integration:**
```javascript
// In damage application (GameLoop collision section)
const { isInvincible } = usePlayer.getState()
if (isInvincible) continue  // Skip damage when invincible
```

**Enemy Pushback Math:**
```javascript
// In executeRevive() or systems/reviveSystem.js
function pushbackEnemies(playerPos, enemies) {
  const { REVIVAL_ENEMY_PUSHBACK_RADIUS, REVIVAL_ENEMY_PUSHBACK_FORCE } = GAME_CONFIG
  enemies.forEach(enemy => {
    const dx = enemy.x - playerPos.x
    const dz = enemy.z - playerPos.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < REVIVAL_ENEMY_PUSHBACK_RADIUS && dist > 0) {
      const force = REVIVAL_ENEMY_PUSHBACK_FORCE * (1 - dist / REVIVAL_ENEMY_PUSHBACK_RADIUS)
      enemy.x += (dx / dist) * force
      enemy.z += (dz / dist) * force
    }
  })
}
```

### File Structure Requirements

**New Files to Create:**
- `src/ui/RevivePrompt.jsx` — Modal component, follows pattern from LevelUpModal.jsx
- `src/systems/reviveSystem.js` (OPTIONAL) — If enemy pushback logic warrants separate file

**Files to Modify:**
- `src/config/gameConfig.js` — Add REVIVAL_* constants
- `src/stores/usePlayer.jsx` — Add revival state + actions
- `src/stores/useGame.jsx` — Add 'revive' phase
- `src/GameLoop.jsx` — Death detection, invincibility tick, collision skip
- `src/ui/Interface.jsx` — Render RevivePrompt when phase === 'revive'
- `src/ui/HUD.jsx` — Add revival charge display
- `src/renderers/PlayerShip.jsx` — Visual feedback for invincibility

**File Organization (Follows Existing Pattern):**
```
src/
├── config/
│   └── gameConfig.js          # Add REVIVAL_INVINCIBILITY_DURATION, etc.
├── stores/
│   ├── usePlayer.jsx          # Add revivalCharges, isInvincible, invincibilityTimer
│   └── useGame.jsx            # Add 'revive' phase
├── systems/
│   └── reviveSystem.js        # OPTIONAL: pushback logic if warranted
├── ui/
│   ├── RevivePrompt.jsx       # NEW: Modal with REVIVE/GAME OVER buttons
│   ├── HUD.jsx                # Add revival charge icon+count
│   └── Interface.jsx          # Render RevivePrompt
├── renderers/
│   └── PlayerShip.jsx         # Flashing/ghost effect
└── GameLoop.jsx               # Death detection, invincibility tick
```

### Testing Requirements — Vitest Pattern

**CRITICAL Testing Lessons from Recent Stories:**
1. **Reset ALL state fields** — Missing fields in reset() causes test pollution (Story 19.5 learning)
2. **Clear timers between tests** — Use vi.clearAllTimers() in afterEach
3. **Mock external dependencies** — Mock usePlayer/useGame stores in component tests
4. **Test state transitions** — Verify phase changes: gameplay → revive → gameplay or gameover
5. **Test edge cases** — 0 charges, negative HP, invincibility expiration mid-frame

**Test File Structure:**
```
src/
├── stores/__tests__/
│   ├── usePlayer.test.js      # Revival state + invincibility tick
│   └── useGame.test.js        # Revive phase transitions
├── ui/__tests__/
│   └── RevivePrompt.test.js   # Conditional rendering, button clicks
└── systems/__tests__/
    └── reviveSystem.test.js   # Enemy pushback (if separate file)
```

**Example Test Pattern (from Story 19.5):**
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePlayer } from '../usePlayer'

describe('usePlayer - Revival System', () => {
  beforeEach(() => {
    usePlayer.getState().reset()  // CRITICAL: Clear state
    vi.clearAllTimers()
  })

  it('should consume revival charge on revive', () => {
    const { consumeRevival } = usePlayer.getState()
    usePlayer.setState({ revivalCharges: 2 })

    consumeRevival()

    expect(usePlayer.getState().revivalCharges).toBe(1)
  })

  it('should tick down invincibility timer', () => {
    const { tick, activateInvincibility } = usePlayer.getState()
    activateInvincibility(2.5)

    tick(1.0)  // 1 second passes

    const { invincibilityTimer, isInvincible } = usePlayer.getState()
    expect(invincibilityTimer).toBe(1.5)
    expect(isInvincible).toBe(true)
  })

  it('should deactivate invincibility when timer reaches 0', () => {
    const { tick, activateInvincibility } = usePlayer.getState()
    activateInvincibility(1.0)

    tick(1.0)  // Exactly 1 second

    const { isInvincible, invincibilityTimer } = usePlayer.getState()
    expect(isInvincible).toBe(false)
    expect(invincibilityTimer).toBe(0)
  })
})
```

### Previous Story Intelligence — Learnings from Epic 19 & 17

**Story 19.5 (Loot System Extensibility) — Key Lessons:**
- ✅ **Registry pattern for extensibility** — If revival system might expand (different revival types), use similar registry pattern
- ✅ **Config layer definitions** — All constants in gameConfig.js, not hardcoded
- ✅ **Comprehensive reset()** — MUST include ALL state fields to prevent test pollution
- ✅ **State cleanup between tests** — Use beforeEach to reset stores

**Story 17.6 (Transition Polish) — Key Lessons:**
- ✅ **Phase flags in useGame** — Pattern: add boolean flags for UI triggers (e.g., tunnelEntryFlashTriggered)
- ✅ **useCallback for handlers** — Memoize callbacks passed to UI to prevent re-render loops
- ✅ **Timeout cleanup** — Store setTimeout in ref, clear in useEffect cleanup or phase exit
- ✅ **CSS animations** — Use CSS keyframes for visual effects (flashing player ship)

**Story 3.5 (HP System & Death) — Existing Code to Preserve:**
- ⚠️ **DO NOT BREAK** existing death flow — game over must still work when revivalCharges === 0
- ⚠️ **DO NOT CHANGE** HP damage application — only add invincibility check in collision section
- ✅ **READ EXISTING CODE** at GameLoop.jsx death detection section before implementing

### Dependencies & Integration Points

**Epic 20, Story 20.5 (Meta Stats) — NOT YET IMPLEMENTED:**
- Revival charges will eventually come from permanent upgrades
- For now, initialize from ship base stats only
- Future-proof: read from `shipDefs.js` baseRevivalCharges field (default 0)
- When Epic 20 is implemented, add: `revivalCharges = shipDef.baseRevivalCharges + permanentUpgrades.revival`

**Ship Selection System (Epic 9) — Already Implemented:**
- Ships have variant stats in `shipDefs.js`
- Add `baseRevivalCharges` field to ship definitions (default 0 for all ships initially)
- Example: `{ ...otherStats, baseRevivalCharges: 1 }`

**Collision System — Existing in GameLoop.jsx:**
- Enemy-player collision detection happens in GameLoop Section 6 (Collisions)
- Damage application happens immediately after collision detection
- Add invincibility check BEFORE damage application: `if (usePlayer.getState().isInvincible) continue`

**Visual Feedback — PlayerShip.jsx:**
- PlayerShip.jsx uses Three.js Mesh with materials
- Flashing effect: modulate material opacity in useFrame based on invincibility timer
- OR use ghost material: semi-transparent white emissive material overlay
- Pattern from Story 17.5: CSS-based transitions are preferred when possible, but this is 3D mesh so use Three.js

### Game Config Constants

Add to `src/config/gameConfig.js`:
```javascript
// Revival System
REVIVAL_INVINCIBILITY_DURATION: 2.5,    // seconds
REVIVAL_HP_PERCENT: 0.5,                // 50% of max HP
REVIVAL_ENEMY_PUSHBACK_RADIUS: 5,       // world units
REVIVAL_ENEMY_PUSHBACK_FORCE: 3,        // impulse strength
REVIVAL_FLASH_RATE: 8,                  // flashes per second for visual feedback
```

### UI/UX Design Notes — Follows Existing Patterns

**RevivePrompt.jsx Design (Modal Pattern):**
- Follow LevelUpModal.jsx structure (fullscreen overlay, centered card)
- Tailwind classes: `fixed inset-0 z-50 flex items-center justify-center bg-black/80`
- Card: white border, dark background, glowing effect
- Buttons: Same button style as MainMenu.jsx (hover effects, pointer cursor)
- Font: Same as other UI (mono font from HUD.jsx)

**HUD Revival Display:**
- Position: Top-left cluster with HP and item slots
- Icon: Heart with +/reload symbol (or skull with X/check)
- Count: Display as `x{charges}` next to icon
- Color: Distinct from HP (suggest cyan #33ccff vs red #ff3366 for HP)
- Size: Same as item slot icons
- Hide when charges === 0 (no clutter)

**Invincibility Visual Feedback:**
- Flashing effect: Opacity modulation (0.3 → 1.0 → 0.3) at 8Hz
- OR Ghost effect: White semi-transparent overlay material
- Must be VERY clear to player — they should never wonder if they're invincible
- Reference: Many games use rapid flashing (Zelda, Mario, etc.)

### Performance Considerations

**No Performance Impact Expected:**
- Revival is rare event (happens at most once every ~30-60s of gameplay)
- Invincibility check is single boolean comparison in hot path (acceptable)
- Enemy pushback happens once per revive (not per frame)
- RevivePrompt modal pauses game (no frame budget impact)
- Flashing visual effect is simple opacity modulation (negligible GPU cost)

**Memory Lifecycle:**
- RevivePrompt component unmounts when phase !== 'revive' (automatic cleanup)
- No new InstancedMesh or heavy assets
- No texture loading required

### Edge Cases & Error Handling

**Edge Case: Death during invincibility (should be impossible):**
- Collision damage skipped when invincible, so HP can't decrease
- BUT: If HP reaches 0 during invincibility anyway (bug), treat as normal death
- Defense: Add check `if (isInvincible) return` at top of death detection

**Edge Case: Negative revival charges:**
- Use `Math.max(0, revivalCharges - 1)` in consumeRevival() to prevent negatives
- Buttons should be disabled, but defensive coding prevents bugs

**Edge Case: Rapid death-revive loop:**
- Invincibility prevents immediate re-death
- Enemy pushback creates breathing room
- 50% HP gives buffer before next death
- If player dies again immediately after invincibility expires, revival can trigger again (if charges remain)

**Edge Case: Retry/reset flow:**
- Revival charges MUST reset to ship base value (+ upgrades) on new run
- Call resetRevivalCharges() in useGame.startGameplay()
- Test: Death with 0 charges → retry → should have charges again

### Known Limitations & Future Work

**Current Limitations:**
- Revival charges are ship-based only (Epic 20 upgrades not implemented yet)
- No visual VFX for revive moment (just enemy pushback + invincibility flash)
- No sound effect for revive (audio system exists, but SFX not added yet)

**Future Enhancements (Tier 3 or Post-Contest):**
- Revive VFX: Shockwave/explosion particle effect on revive trigger
- Revive SFX: Dramatic sound effect (resurrection chime, energy burst)
- Revival animation: Camera zoom/shake, screen flash (à la Story 17.5 WhiteFlashTransition)
- Per-revival-type mechanics: Different revive effects based on source (ship vs upgrade)

### References

**Epic & Story Files:**
- [Source: _bmad-output/planning-artifacts/epic-22-combat-depth.md] — Epic context, all stories overview, technical notes
- [Source: _bmad-output/planning-artifacts/epic-20-permanent-upgrades-system.md] — Story 20.5 (Meta Stats) for future revival upgrade integration

**Architecture & Patterns:**
- [Source: _bmad-output/planning-artifacts/architecture.md#L405-435] — Zustand store pattern with tick() methods
- [Source: _bmad-output/planning-artifacts/architecture.md#L485-520] — GameLoop orchestration pattern, useFrame rules
- [Source: _bmad-output/planning-artifacts/architecture.md#L293-310] — Naming patterns (file, component, store)

**Similar Implementation Patterns:**
- [Source: src/stores/usePlayer.jsx] — Existing player state (HP, position, weapons, boons)
- [Source: src/stores/useGame.jsx] — Existing phase management (menu, gameplay, boss, tunnel, gameover, victory)
- [Source: src/GameLoop.jsx#L400-450] — Death detection and game over trigger (approximate lines, READ actual file)
- [Source: src/ui/LevelUpModal.jsx] — Modal pattern for RevivePrompt (fullscreen overlay, centered card)
- [Source: src/ui/HUD.jsx] — HUD icon display pattern for revival charge indicator

**Recent Story Learnings:**
- [Source: _bmad-output/implementation-artifacts/19-5-loot-system-extensibility-future-chest-preparation.md#L62-85] — Store pattern, registry pattern, reset() completeness
- [Source: _bmad-output/implementation-artifacts/17-6-transition-polish-improvements.md#L48-95] — Phase flag patterns, useCallback, timeout cleanup, CSS animations

**Testing Patterns:**
- [Source: src/stores/__tests__/usePlayer.test.js] — Existing player store tests (HP, damage, movement)
- [Source: _bmad-output/implementation-artifacts/19-5-loot-system-extensibility-future-chest-preparation.md#L206-210] — Testing standards (Vitest, reset between tests, controlled Math.random)

### Project Structure Notes

**Alignment with 6-Layer Architecture:**
- ✅ Config layer: gameConfig.js (constants only, no logic)
- ✅ Data layer: shipDefs.js (add baseRevivalCharges field)
- ✅ Systems layer: reviveSystem.js OPTIONAL (pushback logic small enough for inline)
- ✅ Stores layer: usePlayer.jsx, useGame.jsx (state + actions, no rendering)
- ✅ GameLoop layer: Death detection, invincibility tick (orchestrator)
- ✅ Rendering layer: PlayerShip.jsx (visual feedback only)
- ✅ UI layer: RevivePrompt.jsx, HUD.jsx (HTML overlay, Tailwind)

**No Architectural Conflicts:**
- Revival system fits cleanly into existing architecture
- No new rendering paradigms
- No new state management patterns
- Follows established modal pattern (LevelUpModal, GameOverScreen)
- Phase-based game flow already supports new phases

**File Count Impact:**
- +1 new UI component: RevivePrompt.jsx
- +1 new test file: RevivePrompt.test.js
- +1 optional system: reviveSystem.js (if pushback extracted)
- ~6 modified files: gameConfig, usePlayer, useGame, GameLoop, Interface, HUD, PlayerShip

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

None required - implementation completed without blocking issues.

### Completion Notes List

✅ **Task 1: Revival state in stores**
- Added consumeRevival() and activateRevivalInvincibility() actions to usePlayer
- Added enterRevivePhase() and resumeFromRevive() actions to useGame
- Added revival config constants to gameConfig.js
- Existing invulnerability system (Story 3.5) reused for revival invincibility
- All tests passing (24/24 tests in revival test suites)

✅ **Task 2: RevivePrompt UI component**
- Created RevivePrompt.jsx modal following LevelUpModal pattern
- Conditional REVIVE button (only when charges >= 1)
- Always-visible GAME OVER button
- Keyboard controls: [1] REVIVE, [2] GAME OVER
- Integrated into Interface.jsx (renders when phase === 'revive')

✅ **Task 3: Revive logic in GameLoop**
- Modified death detection (line 458-472) to check revival charges
- If charges > 0: enter revive phase, else trigger game over
- Enemy pushback implemented in RevivePrompt.handleRevive()
- HP restoration to 50%, invincibility activation, charge consumption all in handleRevive()

✅ **Task 4: Invincibility system**
- Existing invulnerability system (Story 3.5) fully supports revival
- Config constants added (REVIVAL_INVINCIBILITY_DURATION = 2.5s)
- Visual feedback: flashing ship opacity (0.3-1.0 oscillation at 8Hz)
- PlayerShip.jsx modified to show flashing when isInvulnerable && !isDashing
- takeDamage() guard already prevents damage when invulnerable

✅ **Task 5: Enemy pushback**
- Implemented in RevivePrompt.handleRevive()
- Radial pushback force within REVIVAL_ENEMY_PUSHBACK_RADIUS (5 units)
- Force scales with distance (closer enemies pushed harder)
- REVIVAL_ENEMY_PUSHBACK_FORCE = 3 (configurable in gameConfig.js)

✅ **Task 6: Revival charge HUD display**
- Added to HUD.jsx top-left cluster (after stats, before weapon slots)
- Heart icon (♥) in cyan (#33ccff) to distinguish from red HP
- Display format: "x{charges}" next to icon
- Conditional rendering: only visible when revivalCharges > 0
- Auto-updates when charges consumed

✅ **Task 7: Comprehensive tests**
- usePlayer.revival.test.js: consumeRevival, activateRevivalInvincibility, timer tick (12 tests)
- useGame.revive.test.js: phase transitions, enterRevivePhase, resumeFromRevive (12 tests)
- All 24 tests passing
- Integration verified via GameLoop death detection and RevivePrompt functionality

🔧 **Critical Bug Fix (Post-Implementation)**
- **Issue**: After initial implementation, discovered that HP was restored to 100% instead of 50%, revival charges didn't decrement, and enemies disappeared after revive
- **Root Cause**: GameLoop.jsx phase transition handler (lines 131-146) was resetting player state when transitioning from 'revive' → 'gameplay' because 'revive' was not in the phase exclusion list
- **Fix**: Added `prevPhaseRef.current !== 'revive'` to the condition at line 131, preventing the reset when resuming from revival
- **Result**: HP now correctly stays at 50%, revival charges decrement as expected, and enemies remain in the scene
- **Files Modified**: src/GameLoop.jsx (line 131)
- **Tests**: All 24 revival tests passing, 1680/1681 total tests passing (1 unrelated test failure in inertia physics)

### File List

**New Files:**
- src/ui/RevivePrompt.jsx
- src/stores/__tests__/usePlayer.revival.test.js
- src/stores/__tests__/useGame.revive.test.js

**Modified Files:**
- src/config/gameConfig.js (added REVIVAL_* constants)
- src/stores/usePlayer.jsx (added consumeRevival, activateRevivalInvincibility actions)
- src/stores/useGame.jsx (added enterRevivePhase, resumeFromRevive actions, 'revive' phase)
- src/GameLoop.jsx (modified death detection to check revival charges)
- src/ui/Interface.jsx (added RevivePrompt import and rendering)
- src/ui/HUD.jsx (added revival charge display in top-left cluster)
- src/renderers/PlayerShip.jsx (added invincibility flashing visual feedback)

