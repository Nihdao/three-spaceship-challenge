# Story 27.2: Critical Hit Numbers - Golden Display

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want critical hits to display with a special golden number and exclamation mark,
So that I feel rewarded for lucky/powerful moments.

## Acceptance Criteria

**Given** the critical hit system
**When** a projectile scores a critical hit (based on player's crit chance stat)
**Then** the damage number appears in golden/yellow color (#FFD700 or similar)
**And** an exclamation mark "!" is appended after the number (e.g., "42!")
**And** the font is slightly larger than normal damage numbers (~1.3x scale)
**And** the animation is more dramatic (pops out faster, maybe a slight bounce)

**Given** visual distinction
**When** multiple damage numbers appear
**Then** critical hit numbers stand out clearly from normal hits
**And** the golden color is bright and eye-catching
**And** the "!" is the same color as the number

**Given** the crit determination
**When** damage is calculated
**Then** the crit check uses the player's current crit chance stat (from upgrades/boons)
**And** the crit multiplier is applied to the damage (e.g., 1.5x or 2x base damage)
**And** the damage number system receives a flag: `{ damage: 42, isCrit: true }`

**Given** future expansion
**When** designed
**Then** the system can support other special damage types (e.g., "WEAK!" for vulnerable enemies)
**And** the color/style can be easily configured per damage type

## Tasks / Subtasks

- [x] Task 1: Implement critical hit calculation logic in GameLoop (AC: #3)
  - [x] 1.1 Add crit chance check when projectile hits enemy (before damage application)
  - [x] 1.2 Apply crit multiplier to damage when crit occurs
  - [x] 1.3 Pass `isCrit` flag to damage number system
  - [x] 1.4 Add gameConfig constants for CRIT_COLOR, CRIT_SCALE_MULT, CRIT_ANIMATION_SPEED

- [x] Task 2: Extend damage number system from Story 27.1 for crit support (AC: #1, #2, #4)
  - [x] 2.1 Add `isCrit` boolean field to damage number data structure
  - [x] 2.2 Modify spawnDamageNumber() to accept isCrit parameter
  - [x] 2.3 Apply golden color (#FFD700) when isCrit is true
  - [x] 2.4 Append "!" to damage text when isCrit is true
  - [x] 2.5 Apply 1.3x scale multiplier to crit numbers
  - [x] 2.6 Add dramatic animation (faster pop, slight bounce effect)

- [x] Task 3: Update GameConfig for crit system (AC: #3)
  - [x] 3.1 Add CRIT_BASE_CHANCE constant (default 0.0 if no upgrades)
  - [x] 3.2 Add CRIT_BASE_MULTIPLIER constant (default 2.0)
  - [x] 3.3 Add visual config: CRIT_NUMBER_COLOR, CRIT_SCALE_MULT, CRIT_ANIMATION_MULT

- [x] Task 4: Verify player stats integration (AC: #3)
  - [x] 4.1 Confirmed: critChance flows from boonModifiers (useBoons.jsx) → composedWeaponMods (GameLoop section 3)
  - [x] 4.2 Confirmed: boonModifiers.critChance is computed and clamped to 1.0 in useBoons.jsx
  - [x] 4.3 Confirmed: isCrit determined at projectile spawn (useWeapons.tick) and propagated to hits; no double-roll

- [x] Task 5: Testing & visual tuning (AC: #2, #4)
  - [x] 5.1 26 unit tests pass covering crit spawn, color, isCrit field, batch spawn, tick persistence
  - [x] 5.2 Golden color #FFD700 configured via GAME_CONFIG.CRIT_HIT_VISUALS.COLOR
  - [x] 5.3 Animation: 1.25x rise speed + 1.33x scale bounce over BOUNCE_DURATION (0.15s)
  - [x] 5.4 Edge case handled: critChance clamped to 1.0 in useBoons.jsx

## Dev Notes

**CRITICAL INTEGRATION POINT — GameLoop.jsx Section 7b (Lines 374-389):**

This story builds on Story 27.1 (basic damage numbers). Story 27.1 creates the damage number system; **this story adds critical hit logic and visual distinction**.

The critical hit check **MUST happen in GameLoop BEFORE damage is applied** to enemies. The current damage resolution flow:

```javascript
// GameLoop.jsx, lines 374-389
if (projectileHits.length > 0) {
  const deathEvents = useEnemies.getState().damageEnemiesBatch(projectileHits)
  // ^ This applies damage — we need crit logic BEFORE this call

  for (let i = 0; i < deathEvents.length; i++) {
    const event = deathEvents[i]
    if (event.killed) {
      // Spawn explosion, XP, etc.
    }
  }
}
```

**Implementation approach:**
1. **Before** `damageEnemiesBatch()`: Loop through `projectileHits`, roll crit for each hit, apply crit multiplier
2. Modify hit structure to include `isCrit` flag: `{ enemyId, damage, isCrit }`
3. Pass modified hits to damage system
4. Spawn damage number with crit styling when `isCrit === true`

**Crit Calculation Logic:**
```javascript
// Read crit stats from composed modifiers (already passed to weapons in line 227)
const critChance = composedWeaponMods.critChance ?? 0 // from boons + upgrades
const critMult = composedWeaponMods.critMultiplier ?? 2.0

// For each projectile hit:
for (let i = 0; i < projectileHits.length; i++) {
  const hit = projectileHits[i]
  const isCrit = Math.random() < critChance
  if (isCrit) {
    hit.damage = Math.floor(hit.damage * critMult)
    hit.isCrit = true
  } else {
    hit.isCrit = false
  }
}

// Then call damageEnemiesBatch(projectileHits) with modified hits
// Spawn damage numbers using hit.isCrit flag
```

**Damage Number System Architecture (from Story 27.1):**
- **Store**: `src/stores/useDamageNumbers.jsx` — Zustand store tracking active damage numbers
- **System**: `src/systems/damageNumberSystem.js` — Logic for spawning, updating, removing numbers
- **Renderer**: `src/renderers/DamageNumberRenderer.jsx` — HTML overlay rendering numbers
- **Data structure**: `{ id, damage, x, y, isCrit, color, scale, opacity, age, velocityY }`

**Rendering Pattern — HTML Overlay (not 3D text):**

Following HUD.jsx pattern, damage numbers are HTML `<div>` elements positioned over the 3D scene:

```jsx
// DamageNumberRenderer.jsx (conceptual)
export default function DamageNumberRenderer() {
  const numbers = useDamageNumbers(state => state.numbers)

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {numbers.map(num => (
        <div
          key={num.id}
          style={{
            position: 'absolute',
            left: num.x,
            top: num.y,
            color: num.isCrit ? '#FFD700' : '#ffffff',
            fontSize: num.isCrit ? '32px' : '24px', // 1.33x scale
            fontWeight: 'bold',
            opacity: num.opacity,
            transform: `translateY(${num.offsetY}px)`,
            // ... more styling
          }}
        >
          {num.damage}{num.isCrit ? '!' : ''}
        </div>
      ))}
    </div>
  )
}
```

**3D to 2D Position Conversion:**
```javascript
// damageNumberSystem.js
import { Vector3 } from 'three'

function spawnDamageNumber(x, z, damage, isCrit, camera) {
  const worldPos = new Vector3(x, 0, z)
  worldPos.project(camera) // Convert to NDC (-1 to 1)

  // NDC to screen pixels
  const screenX = (worldPos.x + 1) * window.innerWidth / 2
  const screenY = (-worldPos.y + 1) * window.innerHeight / 2

  useDamageNumbers.getState().spawn({
    damage,
    x: screenX,
    y: screenY,
    isCrit,
    // ... other fields
  })
}
```

**Animation Timing:**
- **Normal hit**: Float upward 60px over 1.0s, fade out
- **Critical hit**: Float upward 80px over 0.8s (faster), scale pulse (1.0 → 1.3 → 1.0 in first 0.2s), fade out

**Object Pooling Strategy:**

The codebase uses extensive object pooling (see GameLoop entityPoolRef). Damage numbers should follow the same pattern:
- Pre-allocate array of 50 damage number objects
- Reuse inactive slots instead of creating new objects
- Use swap-to-end removal pattern (see xpOrbSystem.js collectOrb() for reference)

**Configuration Constants (add to gameConfig.js):**
```javascript
// Critical Hit Visuals (Story 27.2)
CRIT_HIT_VISUALS: {
  COLOR: '#FFD700',           // Golden color for crit numbers
  SCALE_MULTIPLIER: 1.33,     // 1.33x larger than normal (24px → 32px)
  ANIMATION_SPEED_MULT: 1.25, // 25% faster float-up animation
  BOUNCE_AMPLITUDE: 8,        // pixels — slight bounce on spawn
  BOUNCE_DURATION: 0.15,      // seconds — bounce effect duration
},

// Damage Number Pool (Story 27.1 foundation)
MAX_DAMAGE_NUMBERS: 50,
DAMAGE_NUMBER_LIFETIME: 1.0,        // seconds
DAMAGE_NUMBER_FLOAT_SPEED: 60,     // pixels/sec upward
DAMAGE_NUMBER_NORMAL_COLOR: '#ffffff',
DAMAGE_NUMBER_NORMAL_SIZE: 24,     // pixels (base font size)
```

### Project Structure Notes

**New Files (Story 27.1 creates foundation, this story enhances):**
- `src/stores/useDamageNumbers.jsx` — Zustand store (Story 27.1)
- `src/systems/damageNumberSystem.js` — Spawn/update logic (Story 27.1)
- `src/renderers/DamageNumberRenderer.jsx` — HTML overlay (Story 27.1)

**Modified Files (this story):**
- `src/GameLoop.jsx` — Add crit calculation in section 7b (lines 374-389)
- `src/config/gameConfig.js` — Add CRIT_HIT_VISUALS config section
- `src/systems/damageNumberSystem.js` — Add isCrit parameter, crit styling
- `src/renderers/DamageNumberRenderer.jsx` — Render crit numbers with golden color + "!"

**Architecture Alignment:**
- **Layer 1 (Config)**: gameConfig.js defines CRIT_HIT_VISUALS constants
- **Layer 2 (Systems)**: damageNumberSystem.js handles crit styling logic
- **Layer 3 (Stores)**: useDamageNumbers.jsx stores crit flag in number data
- **Layer 4 (GameLoop)**: Calculates isCrit before damage application
- **Layer 5 (Renderers)**: DamageNumberRenderer.jsx renders crit numbers with special style

**Testing Standards:**
- Unit tests for crit chance calculation (0%, 50%, 100% scenarios)
- Visual tests for crit number distinction (golden color, "!", scale)
- Performance test with 20+ simultaneous crit numbers (frame rate)
- Edge case: critChance > 1.0 should clamp to 1.0 (always crit)

### References

- [Source: _bmad-output/planning-artifacts/epic-27-combat-feedback-system.md#Story 27.1] — Basic damage number foundation (prerequisite)
- [Source: _bmad-output/planning-artifacts/epic-27-combat-feedback-system.md#Story 27.2] — Full story requirements and AC
- [Source: _bmad-output/planning-artifacts/epic-27-combat-feedback-system.md#Technical Notes] — Damage number HTML overlay approach, object pooling
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — 6-layer architecture, GameLoop orchestration
- [Source: src/GameLoop.jsx:374-389] — Damage resolution flow (integration point)
- [Source: src/GameLoop.jsx:227-234] — Composed weapon modifiers (critChance, critMultiplier)
- [Source: src/config/gameConfig.js] — Pattern for adding new config sections
- [Source: src/systems/xpOrbSystem.js] — Object pooling reference pattern (collectOrb swap-to-end)
- [Source: src/ui/HUD.jsx] — HTML overlay positioning pattern
- [Source: _bmad-output/planning-artifacts/epic-20-permanent-upgrades-system.md] — Crit chance from permanent upgrades
- [Source: _bmad-output/planning-artifacts/prd.md#Epic 3] — Boon system (crit chance modifiers)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Task 4 investigation revealed crit was already applied at projectile spawn in useWeapons.jsx:53.
  Added `isCrit` field to projectile data structure to propagate to impact hits correctly.
  Removed the erroneous second crit re-roll that was previously in GameLoop section 7b.

### Completion Notes List

- Crit roll happens once at projectile spawn (useWeapons.tick), stored as `proj.isCrit`
- GameLoop propagates `proj.isCrit` to all hit types (normal, piercing, explosive direct + area)
- CRIT_HIT_VISUALS constants in gameConfig.js: COLOR, SCALE_MULTIPLIER, ANIMATION_SPEED_MULT, BOUNCE_DURATION
- DamageNumberRenderer: golden color, "!" suffix, 1.33x scale bounce, 1.25x rise speed for crits
- 26 unit tests (useDamageNumbers) + 57 weapon tests all pass; 2003/2004 suite (1 pre-existing unrelated failure)

### File List

- `src/config/gameConfig.js` — added CRIT_HIT_VISUALS section
- `src/stores/useDamageNumbers.jsx` — added isCrit support to spawnDamageNumber + spawnDamageNumbers
- `src/ui/DamageNumberRenderer.jsx` — crit rendering: golden color, "!", scale bounce, faster rise
- `src/stores/useWeapons.jsx` — store isCrit flag in projectile at spawn time
- `src/GameLoop.jsx` — propagate proj.isCrit to hit objects (section 7a); spawn damage numbers with isCrit (section 7b)
- `src/stores/__tests__/useDamageNumbers.test.js` — 6 new crit tests added

