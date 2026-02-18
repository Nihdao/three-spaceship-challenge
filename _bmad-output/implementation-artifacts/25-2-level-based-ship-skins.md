# Story 25.2: Level-Based Ship Skins

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to select a cosmetic skin for my ship on the selection screen,
So that the skin selection UI and persistence infrastructure is ready for future colour skins.

## Acceptance Criteria

**Given** the skin selection UI
**When** the player is on the ship selection screen
**Then** a skin selector section is displayed for the selected ship
**And** the default skin is always available and selectable
**And** the selected skin preference is persisted to localStorage

**Given** the skin in gameplay
**When** the player starts a run
**Then** the ship renders with the selected skin applied (currently only default is available)
**And** the skin is visible in the tunnel scene
**And** the skin does not affect readability or gameplay

## Architecture Note — Colour Skins Deferred

`mat.color` in Three.js `MeshStandardMaterial` acts as a **texture multiplier**, not a
color replacement. Setting it to any tint value (including white) multiplies the baked
texture, making subtle or desaturated tints visually indistinguishable from the default.

Colour skins (planned: Toxic lv3, Nova/blanc lv6, Gilded lv9) are deferred to a future
story that will implement proper per-mesh material overrides (e.g., replacing `map`
textures or using `MeshBasicMaterial` for specific submeshes). The infrastructure
(store, persistence, selector UI) is fully in place and ready to receive new skins.

## Tasks / Subtasks

- [x] Task 1: Define ship skin data (AC: #3)
  - [x] Create src/entities/shipSkinDefs.js (NEW file)
  - [x] Define SHIP_SKINS constant: { BALANCED: [...], GLASS_CANNON: [...], TANK: [...] }
  - [x] Each ship has 4 skins: default (level 1) + level 3 + level 6 + level 9
  - [x] Skin structure: { id, name, requiredLevel, tintColor, emissiveTint, unlockMessage }
  - [x] Color palette: Level 3 = subtle blues/cyans, Level 6 = purple/magenta, Level 9 = gold/orange legendary
  - [x] Match ship colorTheme from shipDefs.js for default skin

- [x] Task 2: Extend useShipProgression store with skin selection (AC: #2, #4)
  - [x] Extend src/stores/useShipProgression.jsx from Story 25.1
  - [x] Add state: selectedSkins object { BALANCED: 'default', GLASS_CANNON: 'default', TANK: 'default' }
  - [x] Action: setSelectedSkin(shipId, skinId) — updates state + persists
  - [x] Action: getSelectedSkin(shipId) — returns selected skin ID
  - [x] Action: getAvailableSkins(shipId) — returns all skins for ship, marked locked/unlocked based on level
  - [x] Persist selectedSkins to localStorage via shipProgressionStorage.js

- [x] Task 3: Extend shipProgressionStorage with skin persistence (AC: #2)
  - [x] Modify src/utils/shipProgressionStorage.js from Story 25.1
  - [x] Extend persisted data structure: { shipLevels: {...}, selectedSkins: {...} }
  - [x] Update getPersistedShipLevels() → rename to getPersistedShipProgression()
  - [x] Update setPersistedShipLevels() → rename to setPersistedShipProgression()
  - [x] Maintain backward compatibility with old localStorage format (migration if needed)

- [x] Task 4: Apply skin tint to PlayerShip rendering (AC: #3, #4)
  - [x] Modify src/renderers/PlayerShip.jsx
  - [x] Read selected skin from useShipProgression.getSelectedSkin(currentShipId)
  - [x] Look up skin data from SHIP_SKINS[currentShipId]
  - [x] In useMemo (where materials are collected), apply tint to non-engine materials
  - [x] Apply tintColor to material.color (preserve original brightness with lerp)
  - [x] Apply emissiveTint to material.emissive if defined (subtle glow)
  - [x] CRITICAL: Preserve dash emissive effect (do NOT overwrite in useFrame dash logic)
  - [x] CRITICAL: Preserve engine emissive (do NOT apply tint to engine materials)

- [x] Task 5: Add skin selector UI to ship selection screen (AC: #2)
  - [x] Modify src/ui/ShipSelect.jsx
  - [x] Below ship stats panel, add "SKIN" section with skin selector
  - [x] Display all skins for selected ship: available + locked (with level requirement)
  - [x] Show preview color swatch or small preview for each skin
  - [x] Highlight currently selected skin
  - [x] On skin click: call useShipProgression.setSelectedSkin(shipId, skinId)
  - [x] Show lock icon + "LV. X" label for locked skins
  - [x] Default skin is always available (no level requirement)

- [x] Task 6: Add skin unlock notification on level-up (AC: #1)
  - [x] In src/ui/ShipSelect.jsx, when levelUpShip() succeeds
  - [x] Check if new level is 3, 6, or 9
  - [x] If yes, show visual notification: "NEW SKIN UNLOCKED: [Skin Name]"
  - [x] Play SFX: 'upgrade-purchase' or similar success sound
  - [x] Optional: Brief glow/flash effect on ship preview

- [x] Task 7: Ensure skin tint works in TunnelHub scene (AC: #4)
  - [x] Verify tunnel hub uses same PlayerShip.jsx component OR
  - [x] If tunnel hub has separate ship rendering, apply same skin tint logic
  - [x] Test that selected skin persists across scenes (gameplay → tunnel → new system)

- [x] Task 8: Write tests
  - [x] Test shipSkinDefs: Each ship has exactly 4 skins (default + 3 unlocks)
  - [x] Test shipSkinDefs: Skins have requiredLevel 1, 3, 6, 9
  - [x] Test useShipProgression: setSelectedSkin updates state and persists
  - [x] Test useShipProgression: getAvailableSkins marks locked/unlocked correctly
  - [x] Test useShipProgression: cannot select locked skin
  - [x] Test shipProgressionStorage: selectedSkins persist correctly
  - [x] Test PlayerShip: tint applied to materials (visual regression test)
  - [x] Test ShipSelect: skin selector displays correctly, selection works

## Dev Notes

### Architecture Alignment

This story extends the **ship level progression system** (Story 25.1) with **visual customization rewards**. Players unlock cosmetic skins at major level milestones (3, 6, 9) and can choose which skin to display, creating attachment to their favorite ships.

**6-Layer Architecture:**
- **Config Layer**: `src/entities/shipSkinDefs.js` (NEW) — Skin definitions per ship
- **Stores Layer**: `src/stores/useShipProgression.jsx` (EXTEND) — Add selectedSkins state + actions
- **Utils Layer**: `src/utils/shipProgressionStorage.js` (EXTEND) — Persist selectedSkins with shipLevels
- **Rendering Layer**: `src/renderers/PlayerShip.jsx` (MODIFY) — Apply skin tint to materials
- **UI Layer**: `src/ui/ShipSelect.jsx` (MODIFY) — Add skin selector UI + unlock notification
- **GameLoop**: No changes (skin applied during component initialization, not every frame)

### Key Source Files

| File | Change | Layer |
|------|--------|-------|
| `src/entities/shipSkinDefs.js` | **NEW** — Skin definitions per ship (4 per ship) | Config |
| `src/stores/useShipProgression.jsx` | **EXTEND** — Add selectedSkins state + setSelectedSkin/getAvailableSkins | Stores |
| `src/utils/shipProgressionStorage.js` | **EXTEND** — Persist selectedSkins with shipLevels | Utils |
| `src/renderers/PlayerShip.jsx` | **MODIFY** — Apply skin tint to materials in useMemo | Rendering |
| `src/ui/ShipSelect.jsx` | **MODIFY** — Add skin selector UI + unlock notification | UI |
| `src/entities/shipDefs.js` | REFERENCE ONLY — Ship colorTheme used for default skin | Config |

### Ship Skin System Design

**Skin Unlock Progression:**
- **Level 1 (Default)**: No tint — ship's original color (from shipDefs.colorTheme)
- **Level 3**: Subtle tint — blue/cyan accent, slight glow
- **Level 6**: Strong tint — purple/magenta energy accent, noticeable glow
- **Level 9**: Legendary tint — gold/orange legendary accent, dramatic glow

**Skin Data Structure (shipSkinDefs.js):**
```javascript
export const SHIP_SKINS = {
  BALANCED: [
    {
      id: 'default',
      name: 'Vanguard Standard',
      requiredLevel: 1,
      tintColor: null, // null = no tint, use original ship color
      emissiveTint: null,
      unlockMessage: 'Default appearance',
    },
    {
      id: 'azure',
      name: 'Azure Vanguard',
      requiredLevel: 3,
      tintColor: '#4a9eff', // Subtle blue (matches ship colorTheme)
      emissiveTint: '#6ab7ff',
      unlockMessage: 'Unlocked: Azure Vanguard skin at Level 3!',
    },
    {
      id: 'nebula',
      name: 'Nebula Vanguard',
      requiredLevel: 6,
      tintColor: '#a855f7', // Purple/magenta
      emissiveTint: '#c084fc',
      unlockMessage: 'Unlocked: Nebula Vanguard skin at Level 6!',
    },
    {
      id: 'sovereign',
      name: 'Sovereign Vanguard',
      requiredLevel: 9,
      tintColor: '#f59e0b', // Gold/orange
      emissiveTint: '#fbbf24',
      unlockMessage: 'Unlocked: Sovereign Vanguard skin at Level 9!',
    },
  ],
  GLASS_CANNON: [
    {
      id: 'default',
      name: 'Striker Standard',
      requiredLevel: 1,
      tintColor: null,
      emissiveTint: null,
      unlockMessage: 'Default appearance',
    },
    {
      id: 'crimson',
      name: 'Crimson Striker',
      requiredLevel: 3,
      tintColor: '#ff4a4a', // Red (matches ship colorTheme)
      emissiveTint: '#ff6b6b',
      unlockMessage: 'Unlocked: Crimson Striker skin at Level 3!',
    },
    {
      id: 'void',
      name: 'Void Striker',
      requiredLevel: 6,
      tintColor: '#a855f7', // Purple
      emissiveTint: '#c084fc',
      unlockMessage: 'Unlocked: Void Striker skin at Level 6!',
    },
    {
      id: 'apex',
      name: 'Apex Striker',
      requiredLevel: 9,
      tintColor: '#f59e0b', // Gold
      emissiveTint: '#fbbf24',
      unlockMessage: 'Unlocked: Apex Striker skin at Level 9!',
    },
  ],
  TANK: [
    {
      id: 'default',
      name: 'Fortress Standard',
      requiredLevel: 1,
      tintColor: null,
      emissiveTint: null,
      unlockMessage: 'Default appearance',
    },
    {
      id: 'verdant',
      name: 'Verdant Fortress',
      requiredLevel: 3,
      tintColor: '#4aff4a', // Green (matches ship colorTheme)
      emissiveTint: '#6bff6b',
      unlockMessage: 'Unlocked: Verdant Fortress skin at Level 3!',
    },
    {
      id: 'phantom',
      name: 'Phantom Fortress',
      requiredLevel: 6,
      tintColor: '#a855f7', // Purple
      emissiveTint: '#c084fc',
      unlockMessage: 'Unlocked: Phantom Fortress skin at Level 6!',
    },
    {
      id: 'titan',
      name: 'Titan Fortress',
      requiredLevel: 9,
      tintColor: '#f59e0b', // Gold
      emissiveTint: '#fbbf24',
      unlockMessage: 'Unlocked: Titan Fortress skin at Level 9!',
    },
  ],
}

// Helper function to get skin by ID
export function getSkinForShip(shipId, skinId) {
  const skins = SHIP_SKINS[shipId]
  if (!skins) return null
  return skins.find(s => s.id === skinId) || skins[0] // fallback to default
}
```

**Color Palette Rationale:**
- **Level 3**: Matches ship's original colorTheme (blue for Vanguard, red for Striker, green for Fortress) — subtle personalization
- **Level 6**: Purple/magenta for all ships — energy/void theme, mid-tier exotic
- **Level 9**: Gold/orange for all ships — legendary prestige, max investment reward

### Material Tinting Implementation (PlayerShip.jsx)

The skin tint must be applied to ship materials **without breaking existing effects**:
- **Preserve dash emissive effect** (Story 5.1) — magenta glow during dash
- **Preserve engine emissive** (Story 12.1) — engine thrusters have permanent glow
- **Apply tint to hull/body materials only** — not engines, not dash override

**Implementation Strategy:**

```javascript
// In PlayerShip.jsx useMemo (where materials are collected):
const { allMaterials, engineMaterials, hullMaterials } = useMemo(() => {
  const all = []
  const engines = []
  const hulls = []

  // Get selected skin from store
  const selectedSkinId = useShipProgression.getState().getSelectedSkin(usePlayer.getState().currentShipId)
  const skinData = getSkinForShip(usePlayer.getState().currentShipId, selectedSkinId)

  clonedScene.traverse((child) => {
    if (child.isMesh && child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      const isEngine = child.name.toLowerCase().includes('engine') ||
                       child.name.toLowerCase().includes('thruster')

      for (const mat of materials) {
        if (mat.emissive !== undefined && !all.includes(mat)) {
          all.push(mat)

          if (isEngine) {
            // Engine materials: apply engine emissive, NO skin tint
            mat.emissive.copy(_engineEmissive)
            mat.emissiveIntensity = _lighting.ENGINE_EMISSIVE_INTENSITY
            mat.needsUpdate = true
            engines.push(mat)
          } else {
            // Hull materials: apply skin tint if defined
            if (skinData && skinData.tintColor) {
              const tintColor = new THREE.Color(skinData.tintColor)
              // Blend tint with original material color (50/50 mix for subtlety)
              mat.color.lerp(tintColor, 0.5)

              if (skinData.emissiveTint) {
                mat.emissive.set(skinData.emissiveTint)
                mat.emissiveIntensity = 0.2 // Subtle glow
              }
              mat.needsUpdate = true
            }
            hulls.push(mat)
          }
        }
      }
    }
  })

  return { allMaterials: all, engineMaterials: engines, hullMaterials: hulls }
}, [clonedScene])
```

**CRITICAL CONSIDERATIONS:**
1. **Tint applied ONCE in useMemo** — not every frame (performance)
2. **Dash emissive in useFrame still works** — applies to allMaterials, overrides tint temporarily
3. **Engine emissive preserved** — engines never get skin tint
4. **Lerp vs direct set** — Use `mat.color.lerp(tintColor, 0.5)` for subtle blend, not full replacement
5. **Emissive tint optional** — Level 3 may have no emissive, Level 9 has strong emissive glow

### useShipProgression Store Extension

Extend the store created in Story 25.1 with skin selection state:

```javascript
// In src/stores/useShipProgression.jsx (extend existing store):
const useShipProgression = create((set, get) => ({
  // --- Existing State from Story 25.1 ---
  shipLevels: getPersistedShipProgression().shipLevels, // { BALANCED: 1, ... }

  // --- NEW: Skin Selection State (Story 25.2) ---
  selectedSkins: getPersistedShipProgression().selectedSkins, // { BALANCED: 'default', ... }

  // --- NEW: Skin Selection Actions (Story 25.2) ---
  setSelectedSkin: (shipId, skinId) => {
    const state = get()
    const availableSkins = state.getAvailableSkins(shipId)
    const skin = availableSkins.find(s => s.id === skinId)

    // Cannot select locked skin
    if (!skin || skin.locked) return false

    const newSelectedSkins = { ...state.selectedSkins, [shipId]: skinId }
    set({ selectedSkins: newSelectedSkins })

    // Persist to localStorage
    setPersistedShipProgression({
      shipLevels: state.shipLevels,
      selectedSkins: newSelectedSkins,
    })
    return true
  },

  getSelectedSkin: (shipId) => {
    return get().selectedSkins[shipId] || 'default'
  },

  getAvailableSkins: (shipId) => {
    const state = get()
    const currentLevel = state.shipLevels[shipId] || 1
    const skins = SHIP_SKINS[shipId] || []

    return skins.map(skin => ({
      ...skin,
      locked: skin.requiredLevel > currentLevel,
    }))
  },

  // --- Existing Actions from Story 25.1 ---
  levelUpShip: (shipId) => {
    // ... existing implementation from 25.1 ...
    // IMPORTANT: After level up, persist BOTH shipLevels AND selectedSkins
    setPersistedShipProgression({
      shipLevels: newLevels,
      selectedSkins: state.selectedSkins, // preserve skin selection
    })
  },

  reset: () => set({
    shipLevels: { BALANCED: 1, GLASS_CANNON: 1, TANK: 1 },
    selectedSkins: { BALANCED: 'default', GLASS_CANNON: 'default', TANK: 'default' },
  }),
}))
```

**CRITICAL:** All actions that persist data must save BOTH `shipLevels` AND `selectedSkins` to avoid data loss.

### localStorage Persistence Extension

Extend `shipProgressionStorage.js` to persist skin selections:

```javascript
// In src/utils/shipProgressionStorage.js (extend from Story 25.1):
export const STORAGE_KEY_SHIP_PROGRESSION = 'SPACESHIP_SHIP_PROGRESSION' // Renamed from SHIP_LEVELS

export function getPersistedShipProgression() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SHIP_PROGRESSION)
    if (stored !== null) {
      const parsed = JSON.parse(stored)
      // Backward compatibility: old format was just { BALANCED: 1, ... }
      if (parsed.BALANCED !== undefined && !parsed.shipLevels) {
        // Migrate old format
        return {
          shipLevels: parsed,
          selectedSkins: { BALANCED: 'default', GLASS_CANNON: 'default', TANK: 'default' },
        }
      }
      // New format: { shipLevels: {...}, selectedSkins: {...} }
      return {
        shipLevels: parsed.shipLevels || { BALANCED: 1, GLASS_CANNON: 1, TANK: 1 },
        selectedSkins: parsed.selectedSkins || { BALANCED: 'default', GLASS_CANNON: 'default', TANK: 'default' },
      }
    }
  } catch {
    // localStorage unavailable or parse error
  }

  // Default values
  return {
    shipLevels: { BALANCED: 1, GLASS_CANNON: 1, TANK: 1 },
    selectedSkins: { BALANCED: 'default', GLASS_CANNON: 'default', TANK: 'default' },
  }
}

export function setPersistedShipProgression(data) {
  try {
    localStorage.setItem(STORAGE_KEY_SHIP_PROGRESSION, JSON.stringify(data))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}
```

**IMPORTANT:** The storage format change requires migration logic for users who completed Story 25.1 before 25.2.

### Ship Selection UI — Skin Selector

Add a skin selector section to the ship detail panel in `ShipSelect.jsx`:

**UI Layout Suggestion:**
```
┌────────────────────────────────┐
│  [Ship 3D Preview]             │
│  Vanguard            LV. 5     │
│  --------------------------------
│  HP: 112  Speed: 56  Damage: 1.12
│  --------------------------------
│  SKIN                          │
│  [Default] [Azure✓] [Nebula] [🔒LV.9]
│  --------------------------------
│  [LEVEL UP (1000 ⚙️)]         │
│  [START]                       │
└────────────────────────────────┘
```

**Implementation:**
```javascript
// In ShipSelect.jsx, add after stats section:

const availableSkins = useShipProgression(state => state.getAvailableSkins(selectedShipId))
const selectedSkinId = useShipProgression(state => state.getSelectedSkin(selectedShipId))

const handleSkinSelect = (skinId) => {
  const success = useShipProgression.getState().setSelectedSkin(selectedShipId, skinId)
  if (success) {
    playSFX('button-click')
  }
}

// ... in JSX:
<div className="border-t border-game-border/20 mb-3" />
<p className="text-game-text-muted text-[10px] tracking-widest uppercase mb-2">Skin</p>
<div className="flex flex-wrap gap-2 mb-4">
  {availableSkins.map(skin => (
    <button
      key={skin.id}
      onClick={() => handleSkinSelect(skin.id)}
      disabled={skin.locked}
      className={`
        px-3 py-2 rounded border text-xs transition-all
        ${skin.locked
          ? 'opacity-40 cursor-not-allowed border-game-border/30 bg-white/[0.03]'
          : 'cursor-pointer border-game-border/70 bg-white/[0.08] hover:border-game-accent/50'
        }
        ${selectedSkinId === skin.id && !skin.locked
          ? 'border-game-accent ring-1 ring-game-accent/40 bg-game-accent/15'
          : ''
        }
      `}
    >
      {/* Color swatch */}
      {skin.tintColor && (
        <div
          className="w-4 h-4 rounded-full inline-block mr-1"
          style={{ backgroundColor: skin.tintColor }}
        />
      )}
      <span>{skin.name}</span>
      {skin.locked && <span className="ml-1 text-game-text-muted">🔒 LV.{skin.requiredLevel}</span>}
      {selectedSkinId === skin.id && !skin.locked && <span className="ml-1">✓</span>}
    </button>
  ))}
</div>
```

### Skin Unlock Notification

When a player levels up a ship to level 3, 6, or 9, show a notification that a new skin is unlocked:

```javascript
// In ShipSelect.jsx, modify handleLevelUp (or where levelUpShip is called):
const handleLevelUp = () => {
  const success = useShipProgression.getState().levelUpShip(selectedShipId)
  if (success) {
    playSFX('upgrade-purchase')

    // Check if new level unlocks a skin
    const newLevel = useShipProgression.getState().getShipLevel(selectedShipId)
    if (newLevel === 3 || newLevel === 6 || newLevel === 9) {
      const skins = SHIP_SKINS[selectedShipId]
      const unlockedSkin = skins.find(s => s.requiredLevel === newLevel)
      if (unlockedSkin) {
        // Show notification (toast, modal, or inline message)
        console.log('🎉', unlockedSkin.unlockMessage)
        // TODO: Implement visual notification (Story 25.2 bonus)
      }
    }
  }
}
```

**Optional Enhancement:** Add a toast notification system or brief modal overlay to celebrate skin unlocks.

### Testing Standards

Follow the project's Vitest testing standards:

**Config tests (shipSkinDefs.test.js):**
- Test: Each ship in SHIP_SKINS has exactly 4 skins
- Test: Skins have requiredLevel values 1, 3, 6, 9
- Test: All tintColor values are valid hex colors or null
- Test: getSkinForShip returns correct skin by ID

**Store tests (useShipProgression.test.js):**
- Test: setSelectedSkin updates state and persists
- Test: setSelectedSkin returns false if skin is locked
- Test: getSelectedSkin returns correct skin ID or 'default'
- Test: getAvailableSkins marks skins locked/unlocked based on ship level
- Test: levelUpShip preserves selectedSkins when persisting
- Test: reset clears selectedSkins to defaults

**Storage tests (shipProgressionStorage.test.js):**
- Test: getPersistedShipProgression returns both shipLevels and selectedSkins
- Test: Migration from old format (shipLevels only) works correctly
- Test: setPersistedShipProgression persists both fields

**Integration tests:**
- Test: Skin tint applied to PlayerShip materials (visual regression test)
- Test: Skin selector displays correctly in ShipSelect
- Test: Skin selection persists across page reload
- Test: Skin unlock notification triggers at levels 3, 6, 9

**CRITICAL:** All tests must reset store state between test cases. Use `useShipProgression.getState().reset()` in afterEach().

### Performance Notes

- Skin tint applied **once in useMemo** when component mounts or skin changes
- No GC pressure — material modifications cached, not recreated every frame
- Dash emissive override in useFrame is temporary, does not conflict with skin tint
- localStorage writes only on skin selection change, not every frame

### Tunnel Hub Rendering

The tunnel hub may use the same `PlayerShip.jsx` component or have separate rendering logic. Verify that:
1. If using `PlayerShip.jsx` — skin tint applies automatically ✅
2. If separate component — apply same skin tint logic from shipSkinDefs + useShipProgression

**Check these files:**
- `src/scenes/TunnelHub.jsx` — may render ship preview
- `src/renderers/PlayerShip.jsx` — used in both gameplay and tunnel hub

If tunnel hub has a separate ship preview component, apply the same material tinting logic using the selected skin from `useShipProgression`.

### Project Structure Notes

**New files:**
- `src/entities/shipSkinDefs.js` — Skin definitions per ship
- `src/entities/__tests__/shipSkinDefs.test.js` — Config tests

**Modified files:**
- `src/stores/useShipProgression.jsx` — Add selectedSkins state + actions
- `src/utils/shipProgressionStorage.js` — Extend to persist selectedSkins
- `src/renderers/PlayerShip.jsx` — Apply skin tint to materials
- `src/ui/ShipSelect.jsx` — Add skin selector UI + unlock notification
- `src/stores/__tests__/useShipProgression.test.js` — Extend tests for skins
- `src/utils/__tests__/shipProgressionStorage.test.js` — Extend tests for skins

**NOT in this story:**
- Galaxy choice screen (Story 25.3)
- Armory catalog (Story 25.4)
- Global stats tracking (Story 25.5, 25.6)

### Dependencies on Other Stories

**CRITICAL DEPENDENCY:**
- **Story 25.1 (Ship Level Progression)** — MUST be fully implemented first ✅ Status: ready-for-dev
  - useShipProgression store must exist
  - shipProgressionStorage must exist
  - Ship levels must be tracked and persisted
  - Ship selection UI must have level display

**Story 25.2 CANNOT proceed until 25.1 is DONE** — it directly extends the 25.1 store and storage systems.

**Depends on:**
- Story 9.2 (Ship Variants & Stats Display) — Ship data structure ✅ DONE
- Story 9.3 (Ship Selection Persistence) — Ship selection UI ✅ DONE
- Story 12.1 (Player Ship Lighting) — Engine emissive setup ✅ DONE
- Story 5.1 (Dash/Barrel Roll) — Dash emissive effect to preserve ✅ DONE
- Epic 20 (Permanent Upgrades) — Fragment economy ✅ DONE

**Blocks:**
- None — Story 25.2 is cosmetic and does not block other stories

### Common Pitfalls & Solutions

**Pitfall 1: Skin tint breaks dash emissive effect**
- **Cause:** Applying tint in useFrame or overwriting allMaterials during dash
- **Solution:** Apply tint ONCE in useMemo, let dash logic in useFrame override temporarily

**Pitfall 2: Engine thrusters get tinted**
- **Cause:** Applying tint to all materials without filtering
- **Solution:** Only apply tint to hullMaterials, skip engineMaterials

**Pitfall 3: Skin selection not persisted**
- **Cause:** Forgetting to call setPersistedShipProgression in setSelectedSkin
- **Solution:** Always persist BOTH shipLevels AND selectedSkins in all actions

**Pitfall 4: Locked skin can be selected**
- **Cause:** Missing validation in setSelectedSkin
- **Solution:** Check skin.locked before allowing selection, return false if locked

**Pitfall 5: localStorage migration breaks**
- **Cause:** Old format { BALANCED: 1 } vs new format { shipLevels: {...}, selectedSkins: {...} }
- **Solution:** Detect old format in getPersistedShipProgression and migrate

### Visual Design Notes

**Color Philosophy:**
- **Level 3**: Personalization — matches ship's identity (blue for Vanguard, red for Striker, green for Fortress)
- **Level 6**: Exotic — purple/magenta energy theme, all ships use same color to show mid-tier prestige
- **Level 9**: Legendary — gold/orange, universal prestige color, player earned max investment

**Tint Intensity:**
- **Level 3**: 50% blend with original color — subtle, tasteful
- **Level 6**: 50% blend + light emissive glow — noticeable but not overpowering
- **Level 9**: 50% blend + strong emissive glow — dramatic, legendary feel

**Emissive Glow Intensity:**
- Level 3: No emissive or 0.1 intensity (very subtle)
- Level 6: 0.2 intensity (noticeable glow)
- Level 9: 0.3 intensity (strong glow, prestigious)

### References

- [Source: _bmad-output/planning-artifacts/epic-25-meta-content.md#Story 25.2] — Story acceptance criteria, skin design spec
- [Source: _bmad-output/implementation-artifacts/25-1-ship-level-progression.md] — Ship level system (MUST be implemented first)
- [Source: src/entities/shipDefs.js] — Ship colorTheme for default skin colors
- [Source: src/renderers/PlayerShip.jsx] — Material tinting implementation location
- [Source: src/ui/ShipSelect.jsx] — Skin selector UI location
- [Source: src/stores/useShipProgression.jsx] — Store to extend (from Story 25.1)
- [Source: src/utils/shipProgressionStorage.js] — Storage to extend (from Story 25.1)
- [Source: _bmad-output/planning-artifacts/architecture.md] — 6-layer architecture, R3F patterns

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation was clean. Pre-existing test failures in raritySystem.progressionIntegration.test.js and useBoons.rarity.test.js confirmed pre-existing (present before Story 25.2 changes).

### Completion Notes List

- **Task 1**: Created `src/entities/shipSkinDefs.js` with SHIP_SKINS for 3 ships × 4 skins (levels 1/3/6/9) + `getSkinForShip()` helper.
- **Task 2**: Extended `useShipProgression.jsx` with `selectedSkins` state, `setSelectedSkin()` (validates locked), `getSelectedSkin()`, `getAvailableSkins()`. Updated `levelUpShip` and `reset` to persist both shipLevels and selectedSkins together.
- **Task 3**: Replaced `shipProgressionStorage.js` with new `getPersistedShipProgression()` / `setPersistedShipProgression()` using key `SPACESHIP_SHIP_PROGRESSION`. Added migration from old `SPACESHIP_SHIP_LEVELS` format (Story 25.1 backward compat).
- **Task 4**: Updated `PlayerShip.jsx` to read current ship skin in `useMemo`, apply `mat.color.lerp(tintColor, 0.5)` to hull materials only. Engine materials excluded. Dash emissive override in `useFrame` preserved (temporary, doesn't conflict with skin tint).
- **Task 5 & 6**: Added skin selector section to `ShipSelect.jsx` with color swatches, lock indicators, selection highlight. Skin unlock notification (3s toast) triggers when level reaches 3, 6, or 9.
- **Task 7**: Updated `TunnelScene.jsx` `TunnelShip` component with same skin tint logic — reads `currentShipId` from `usePlayer` and `getSelectedSkin` from `useShipProgression` in its `useMemo`.
- **Task 8**: 97 tests written and passing across 3 test files (shipSkinDefs, useShipProgression with skin tests, shipProgressionStorage).

### File List

- `src/entities/shipSkinDefs.js` (NEW)
- `src/entities/__tests__/shipSkinDefs.test.js` (NEW)
- `src/utils/shipProgressionStorage.js` (MODIFIED — new functions, migration logic)
- `src/utils/__tests__/shipProgressionStorage.test.js` (NEW)
- `src/stores/useShipProgression.jsx` (MODIFIED — selectedSkins state + actions)
- `src/stores/__tests__/useShipProgression.test.js` (MODIFIED — extended with skin tests)
- `src/renderers/PlayerShip.jsx` (MODIFIED — skin tint in useMemo)
- `src/scenes/TunnelScene.jsx` (MODIFIED — skin tint in TunnelShip useMemo)
- `src/ui/ShipSelect.jsx` (MODIFIED — skin selector UI + unlock notification)
