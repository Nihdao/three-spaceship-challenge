# Story 25.4: Armory Catalog Screen

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to browse all available weapons and boons in an Armory screen,
So that I understand what's available and have a collection goal.

## Acceptance Criteria

**Given** the main menu
**When** the player clicks "ARMORY"
**Then** a catalog screen opens (overlay style, like ship selection)
**And** the screen has two tabs: Weapons, Boons

**Given** the Weapons tab
**When** displayed
**Then** all weapons are listed with:
  - Icon/visual representation
  - Name
  - Short description of how it works (1-2 sentences)
  - Whether it's been "discovered" (used in at least one run)
**And** undiscovered weapons show as silhouettes with "???" name (optional: or just show all)

**Given** the Boons tab
**When** displayed
**Then** all boons are listed with the same format as weapons
**And** boons are organized by category (offensive, defensive, utility) if applicable

**Given** the data source
**When** populating the Armory
**Then** weapon data comes from weaponDefs.js
**And** boon data comes from boonDefs.js
**And** discovery state is tracked in a persistent store (localStorage)

## Tasks / Subtasks

- [x] Task 1: Add ARMORY button to MainMenu (AC: #1)
  - [x] Modify src/ui/MainMenu.jsx to add ARMORY menu item
  - [x] Use existing MENU_ITEMS pattern
  - [x] Wire button to open armory overlay (state transition)

- [x] Task 2: Create useArmory store for discovery tracking (AC: #4)
  - [x] Create src/stores/useArmory.jsx
  - [x] Track discovered weapons (Set or object)
  - [x] Track discovered boons (Set or object)
  - [x] markDiscovered(type, id) action
  - [x] isDiscovered(type, id) getter
  - [x] Persist to localStorage (pattern from useUpgrades/usePlayer)
  - [x] Load from localStorage on init

- [x] Task 3: Create Armory.jsx overlay component (AC: #1, #5)
  - [x] Create src/ui/Armory.jsx (NEW file)
  - [x] Full-screen overlay (pattern from UpgradesScreen.jsx)
  - [x] Keep 3D background visible directly (no dark backdrop)
  - [x] Tab navigation: Weapons, Boons
  - [x] BACK button to close and return to main menu
  - [x] Keyboard: Escape to close, Tab to navigate tabs

- [x] Task 4: Create Weapons tab content (AC: #2)
  - [x] Read all weapons from weaponDefs.js (Object.keys(WEAPONS))
  - [x] Display in grid layout (similar to UpgradesScreen grid)
  - [x] WeaponCard component: icon (placeholder or emoji), name, description
  - [x] Show discovery status (discovered = full view, undiscovered = silhouette/"???" OR just show all)
  - [x] DECISION: Show with discovery badges — full view for discovered, "???" for undiscovered

- [x] Task 5: Create Boons tab content (AC: #3)
  - [x] Read all boons from boonDefs.js (Object.keys(BOONS))
  - [x] Display in grid layout (same as Weapons)
  - [x] BoonCard component: icon, name, description (tier 1 description)
  - [x] Optional: Organize by category — flat grid chosen (12 boons clear without grouping)
  - [x] Show discovery status (same pattern as weapons)

- [x] Task 7: Integrate discovery tracking into gameplay (AC: #4)
  - [x] When player picks up a weapon (level-up or planet scan): mark discovered
  - [x] When player picks up a boon (level-up or planet scan): mark discovered
  - [x] Centralized in LevelUpModal.jsx and PlanetRewardModal.jsx (avoids circular imports)
  - [x] Discovery persists across runs (localStorage)

- [x] Task 8: Write tests
  - [x] Test MainMenu: ARMORY button renders
  - [x] Test Armory: renders all 11 weapons from weaponDefs.js
  - [x] Test Armory: renders all 12 boons from boonDefs.js
  - [x] Test useArmory: markDiscovered() adds to discovered set
  - [x] Test useArmory: isDiscovered() returns correct state
  - [x] Test useArmory: persistence to/from localStorage

## Dev Notes

### Architecture Alignment

This story creates the **Armory catalog UI** for browsing available weapons and boons. It introduces a new lightweight store for tracking discovery state across runs.

**6-Layer Architecture:**
- **Config Layer**: `src/entities/weaponDefs.js` (ALREADY EXISTS - 11 weapons)
- **Config Layer**: `src/entities/boonDefs.js` (ALREADY EXISTS - 12 boons)
- **Stores Layer**: `src/stores/useArmory.jsx` (NEW - discovery tracking)
- **UI Layer**: `src/ui/Armory.jsx` (NEW - this story)
- **UI Layer**: `src/ui/MainMenu.jsx` (MODIFY - add ARMORY button)

**This story does NOT touch:**
- Weapon or boon definitions (already complete in Stories 11.3-11.4)
- Combat systems or gameplay logic
- Ship progression (Story 25.1-25.2)
- Galaxy selection (Story 25.3)

### Available Weapons & Boons (from defs)

**11 Weapons in weaponDefs.js:**
1. LASER_FRONT - Front Laser
2. SPREAD_SHOT - Spread Shot (3 projectiles in cone)
3. MISSILE_HOMING - Homing Missile (tracks enemies)
4. PLASMA_BOLT - Plasma Bolt (slow, high damage)
5. RAILGUN - Railgun (piercing)
6. TRI_SHOT - Tri-Shot (3 projectiles, tight cone)
7. SHOTGUN - Shotgun (burst of pellets)
8. SATELLITE - Satellite (orbital auto-fire)
9. DRONE - Drone (companion follower)
10. BEAM - Beam Cannon (continuous damage ray)
11. EXPLOSIVE_ROUND - Explosive Round (area damage)

**12 Boons in boonDefs.js:**
1. DAMAGE_AMP - Damage Amp (+damage%)
2. SPEED_BOOST - Speed Boost (+movement speed%)
3. COOLDOWN_REDUCTION - Rapid Fire (-cooldown%)
4. CRIT_CHANCE - Critical Strike (+crit chance%)
5. CRIT_MULTIPLIER - Critical Power (+crit damage multiplier)
6. PROJECTILE_SPEED - Velocity Rounds (+projectile speed%)
7. MAX_HP_UP - Hull Reinforcement (+max HP flat)
8. HP_REGEN - Auto Repair (+HP regen/sec)
9. DAMAGE_REDUCTION - Armor Plating (-damage taken%)
10. XP_GAIN - Neural Link (+XP gain%)
11. FRAGMENT_GAIN - Scavenger (+Fragment rewards%)
12. PICKUP_RADIUS - Magnetic Field (+pickup radius%)

**Boon Categories (optional organization):**
- **Offensive**: DAMAGE_AMP, COOLDOWN_REDUCTION, CRIT_CHANCE, CRIT_MULTIPLIER, PROJECTILE_SPEED
- **Defensive**: MAX_HP_UP, HP_REGEN, DAMAGE_REDUCTION
- **Utility**: SPEED_BOOST, XP_GAIN, FRAGMENT_GAIN, PICKUP_RADIUS

### Existing UI Patterns to Follow

**Overlay Pattern (from UpgradesScreen.jsx):**

The Armory screen follows the same full-screen overlay pattern as UpgradesScreen:
- Full-screen view that replaces MainMenu when open
- No dark backdrop - 3D background visible directly
- Clean header with title and BACK button
- Grid layout for content
- Escape key closes overlay
- Uses Tailwind CSS for styling

**Reference from UpgradesScreen.jsx:**
```jsx
export default function UpgradesScreen({ onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        playSFX('button-click')
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center font-game animate-fade-in">
      <div className="relative w-full max-w-4xl px-6 py-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { playSFX('button-click'); onClose() }}>
            &larr; BACK
          </button>
          <h1>TITLE</h1>
          {/* Optional right content */}
        </div>
        {/* Content grid */}
      </div>
    </div>
  )
}
```

**MainMenu Integration (from MainMenu.jsx):**

The MainMenu uses MENU_ITEMS array pattern:
```jsx
export const MENU_ITEMS = [
  { id: "play", label: "PLAY" },
  { id: "upgrades", label: "UPGRADES" },
  { id: "options", label: "OPTIONS" },
  { id: "credits", label: "CREDITS" },
];
```

**To add ARMORY:**
```jsx
export const MENU_ITEMS = [
  { id: "play", label: "PLAY" },
  { id: "upgrades", label: "UPGRADES" },
  { id: "armory", label: "ARMORY" },  // NEW — after UPGRADES
  { id: "options", label: "OPTIONS" },
  { id: "credits", label: "CREDITS" },
];
```

Then handle in `handleMenuSelect()`:
```jsx
const [isArmoryOpen, setIsArmoryOpen] = useState(false);

const handleMenuSelect = useCallback((item) => {
  if (fading) return;
  if (item.id === "armory") {
    playSFX("button-click");
    setIsArmoryOpen(true);
  }
  // ... other cases
}, [fading]);

// Render:
{!isArmoryOpen && <div className="main-menu">...</div>}
{isArmoryOpen && <Armory onClose={() => setIsArmoryOpen(false)} />}
```

**Card Layout Pattern:**

Similar to UpgradeCard in UpgradesScreen.jsx, create simple cards for weapons/boons:
```jsx
function WeaponCard({ weaponId }) {
  const weaponDef = WEAPONS[weaponId]
  const isDiscovered = useArmory(s => s.isDiscovered('weapon', weaponId))

  return (
    <div className="border rounded-lg p-3 bg-white/[0.05] backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-2xl">{isDiscovered ? '🔫' : '❓'}</span>
        <div>
          <h3 className="text-sm font-semibold text-game-text">
            {isDiscovered ? weaponDef.name : '???'}
          </h3>
          <p className="text-xs text-game-text-muted">
            {isDiscovered ? weaponDef.description : 'Undiscovered'}
          </p>
        </div>
      </div>
    </div>
  )
}
```

**OR simpler approach (AC says "optional" to hide undiscovered):**
```jsx
function WeaponCard({ weaponId }) {
  const weaponDef = WEAPONS[weaponId]

  return (
    <div className="border rounded-lg p-3">
      <h3>{weaponDef.name}</h3>
      <p>{weaponDef.description}</p>
    </div>
  )
}
```

The second approach is simpler and AC says "optional: or just show all". Recommend showing all for better player understanding.

### Discovery Tracking Store

**useArmory.jsx store structure:**

```javascript
import { create } from 'zustand'

const STORAGE_KEY = 'armory-discovery'

function loadDiscoveryState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { weapons: new Set(), boons: new Set() }
    const parsed = JSON.parse(saved)
    return {
      weapons: new Set(parsed.weapons || []),
      boons: new Set(parsed.boons || []),
    }
  } catch (err) {
    console.warn('Failed to load armory discovery state:', err)
    return { weapons: new Set(), boons: new Set() }
  }
}

function saveDiscoveryState(state) {
  try {
    const data = {
      weapons: Array.from(state.discovered.weapons),
      boons: Array.from(state.discovered.boons),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.warn('Failed to save armory discovery state:', err)
  }
}

const useArmory = create((set, get) => ({
  // State
  discovered: loadDiscoveryState(),

  // Actions
  markDiscovered: (type, id) => {
    set(state => {
      const newDiscovered = {
        ...state.discovered,
        [type]: new Set([...state.discovered[type], id]),
      }
      saveDiscoveryState({ discovered: newDiscovered })
      return { discovered: newDiscovered }
    })
  },

  isDiscovered: (type, id) => {
    return get().discovered[type]?.has(id) ?? false
  },

  reset: () => {
    set({ discovered: { weapons: new Set(), boons: new Set() } })
    localStorage.removeItem(STORAGE_KEY)
  },
}))

export default useArmory
```

**Integration points:**

When player acquires a weapon or boon (level-up, planet scan, etc.), mark discovered:
```javascript
// In useBoons.addBoon() or useWeapons.addWeapon():
useArmory.getState().markDiscovered('weapon', weaponId)
useArmory.getState().markDiscovered('boon', boonId)
```

This can be added to existing stores or called from GameLoop when level-up happens.

### Tab Navigation

**Tab structure:**

```jsx
const TABS = ['Weapons', 'Boons']

function Armory({ onClose }) {
  const [activeTab, setActiveTab] = useState('Weapons')

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-4 mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Weapons' && <WeaponsGrid />}
      {activeTab === 'Boons' && <BoonsGrid />}
    </div>
  )
}
```

**Tab styling (consistent with project):**
- Active tab: highlighted border/background
- Inactive tabs: muted colors
- Hover effects on all tabs

### Data Reading Patterns

**Reading all weapons:**
```javascript
import { WEAPONS } from '../entities/weaponDefs.js'

const weaponIds = Object.keys(WEAPONS)  // ['LASER_FRONT', 'SPREAD_SHOT', ...]

<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
  {weaponIds.map(weaponId => (
    <WeaponCard key={weaponId} weaponId={weaponId} />
  ))}
</div>
```

**Reading all boons:**
```javascript
import { BOONS } from '../entities/boonDefs.js'

const boonIds = Object.keys(BOONS)  // ['DAMAGE_AMP', 'SPEED_BOOST', ...]

<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
  {boonIds.map(boonId => (
    <BoonCard key={boonId} boonId={boonId} />
  ))}
</div>
```

**Weapon data structure (from weaponDefs.js):**
```javascript
WEAPONS.LASER_FRONT = {
  id: 'LASER_FRONT',
  name: 'Front Laser',
  description: 'Fires a laser beam forward',
  // ... other fields
}
```

**Boon data structure (from boonDefs.js):**
```javascript
BOONS.DAMAGE_AMP = {
  id: 'DAMAGE_AMP',
  name: 'Damage Amp',
  maxLevel: 3,
  tiers: [
    { level: 1, description: 'Increases all weapon damage by 15%', ... },
    // ...
  ]
}
```

Use `tiers[0].description` for boon card description (level 1 description).

### Visual Design

**Color Scheme:**
- Background: Dark semi-opaque (bg-black/40) for readability over 3D background
- Borders: Game border color (border-game-border)
- Text: White for names (text-game-text), muted for descriptions (text-game-text-muted)
- Active tab: Highlighted border (border-game-accent)
- Discovered items: Full color with colored badge (green for weapons, purple for boons)
- Undiscovered items: "???" name, grayed icon (opacity-30)

**Layout:**
- Header: Title centered, BACK button left, optional Fragment balance right
- Tab navigation: Below header, horizontally aligned
- Content grid: 2-3 columns responsive (grid-cols-2 md:grid-cols-3)
- Cards: Compact, icon + name + description

**Card size:**
- Compact for fitting many items on screen
- Similar to UpgradeCard sizing
- Icon ~2xl (text-2xl for emoji)

### Integration with Gameplay

**When to mark discovered:**

1. **Level-up:** When player selects a weapon or boon from level-up choices
2. **Planet scan:** When planet rewards a weapon or boon
3. **Tunnel hub:** When player purchases Fragment upgrades (not applicable for weapons/boons)
4. **Game start:** Optionally mark starter weapon (LASER_FRONT) as discovered

**Where to add markDiscovered calls:**

**Option A: Centralized in level-up logic**
```javascript
// In src/systems/progressionSystem.js or wherever level-up choice is applied
function applyLevelUpChoice(choice) {
  if (choice.type === 'weapon') {
    useWeapons.getState().addWeapon(choice.weaponId)
    useArmory.getState().markDiscovered('weapon', choice.weaponId)
  } else if (choice.type === 'boon') {
    useBoons.getState().addBoon(choice.boonId)
    useArmory.getState().markDiscovered('boon', choice.boonId)
  }
}
```

**Option B: Inside store actions**
```javascript
// In useWeapons.addWeapon():
addWeapon: (weaponId) => {
  // ... existing logic
  useArmory.getState().markDiscovered('weapon', weaponId)
}

// In useBoons.addBoon():
addBoon: (boonId) => {
  // ... existing logic
  useArmory.getState().markDiscovered('boon', boonId)
}
```

**CRITICAL:** Avoid circular imports. Check that useArmory doesn't import useWeapons/useBoons and vice versa. Option A (centralized in progression logic) is safer.

**Starter weapon discovery:**
```javascript
// In GameLoop or game init:
useEffect(() => {
  useArmory.getState().markDiscovered('weapon', 'LASER_FRONT')
}, [])
```

Or mark on first run start.

### Performance Notes

**No performance concerns:**
- 11 weapons + 12 boons = 23 cards total (trivial for React)
- No 3D rendering or heavy computation
- Discovery state is lightweight (Set of strings)
- localStorage saves are infrequent (only on discovery)

**Best practices:**
- Use React.memo for cards if needed (likely not necessary)
- Avoid re-creating card components on every render
- Tab switching is instant (conditional rendering, no data fetching)

### Testing Standards

**Component tests:**
- Test MainMenu: ARMORY button renders in MENU_ITEMS
- Test Armory: renders Weapons tab by default
- Test Armory: renders all 11 weapons from weaponDefs.js
- Test Armory: renders all 12 boons from boonDefs.js
- Test Armory: BACK button closes overlay
- Test Armory: Escape key closes overlay
- Test Armory: Tab switching works (Weapons ↔ Boons)

**Store tests:**
- Test useArmory: markDiscovered() adds weapon to discovered set
- Test useArmory: markDiscovered() adds boon to discovered set
- Test useArmory: isDiscovered() returns true for discovered items
- Test useArmory: isDiscovered() returns false for undiscovered items
- Test useArmory: persistence to localStorage
- Test useArmory: load from localStorage on init
- Test useArmory: reset() clears discovery state

**Integration tests:**
- Test discovery flow: acquiring weapon marks it as discovered
- Test discovery flow: acquiring boon marks it as discovered
- Test UI updates: Armory reflects discovered state

**Mock pattern:**
```javascript
vi.mock('../stores/useArmory.jsx', () => ({
  default: vi.fn(() => ({
    discovered: { weapons: new Set(), boons: new Set() },
    markDiscovered: vi.fn(),
    isDiscovered: vi.fn(() => false),
  }))
}))
```

### Project Structure Notes

**New files created in this story:**
- `src/stores/useArmory.jsx` — Discovery tracking store
- `src/ui/Armory.jsx` — Armory catalog overlay
- `src/stores/__tests__/useArmory.test.js` — Store tests
- `src/ui/__tests__/Armory.test.jsx` — Component tests

**Modified files:**
- `src/ui/MainMenu.jsx` — Add ARMORY button to MENU_ITEMS
- `src/stores/useWeapons.jsx` OR `src/systems/progressionSystem.js` — Add markDiscovered calls (TBD)
- `src/stores/useBoons.jsx` OR `src/systems/progressionSystem.js` — Add markDiscovered calls (TBD)

**Files NOT modified (read-only references):**
- `src/entities/weaponDefs.js` ✅ (11 weapons)
- `src/entities/boonDefs.js` ✅ (12 boons)

### Implementation Decisions

**DECISION 1: Show all items or hide undiscovered?**
- **Recommendation:** Show all items with names and descriptions
- **Rationale:** AC says "optional: or just show all". Showing all is better for player education and simpler to implement. Discovery tracking can still be added later if desired (mark discovered items with a checkmark or badge).

**DECISION 2: Organize boons by category?**
- **Recommendation:** Simple list, no category grouping
- **Rationale:** AC says "if applicable". With only 12 boons, a flat grid is clear enough. Category grouping can be added later if needed.

**DECISION 3: Where to add markDiscovered calls?**
- **Recommendation:** Centralized in level-up choice handler (progressionSystem or GameLoop)
- **Rationale:** Avoids circular imports, keeps discovery logic in one place, easier to test.

**DECISION 4: Items tab — removed (2026-02-21)**
- **Decision:** Items tab removed entirely from the Armory. The concept won't be implemented.
- **Rationale:** Scope reduction — Armory now only covers Weapons and Boons.

### References

- [Source: _bmad-output/planning-artifacts/epic-25-meta-content.md#Story 25.4] — Epic context, acceptance criteria
- [Source: src/entities/weaponDefs.js] — All 11 weapon definitions
- [Source: src/entities/boonDefs.js] — All 12 boon definitions
- [Source: src/ui/MainMenu.jsx] — Main menu structure, MENU_ITEMS pattern
- [Source: src/ui/UpgradesScreen.jsx] — Overlay pattern, card layout, grid styling
- [Source: _bmad-output/implementation-artifacts/20-2-upgrades-menu-screen.md] — Reference for catalog screen implementation
- [Source: _bmad-output/planning-artifacts/architecture.md#6-Layer Architecture] — Architecture rules, UI layer guidelines
- [Source: _bmad-output/planning-artifacts/epic-25-meta-content.md#Technical Notes] — Architecture alignment

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation straightforward, no blocking issues.

### Completion Notes List

- ✅ Task 1: Added ARMORY to MENU_ITEMS in MainMenu.jsx, wired to isArmoryOpen state (pattern identical to isUpgradesOpen)
- ✅ Task 2: Created useArmory.jsx store with Set-based discovery tracking, localStorage persistence via 'armory-discovery' key. Uses same pattern as upgradesStorage.js. markDiscovered deduplicates (early return if already discovered).
- ✅ Tasks 3-5: Created Armory.jsx full-screen overlay following UpgradesScreen.jsx pattern exactly. WeaponCard and BoonCard components show discovered items with emoji icons, undiscovered items with "???" silhouette. Keyboard: Escape closes, Tab switches tabs.
- ✅ Task 7: Discovery tracking centralized in LevelUpModal.jsx and PlanetRewardModal.jsx — both files call useArmory.getState().markDiscovered() when new_weapon or new_boon choice is applied. Avoids circular imports.
- ✅ Task 8: 30 new tests across 2 test files. Full suite: 128 files, 2149 tests — zero regressions.
- DECISION 1: Show all items but with discovery status (discovered = full info, undiscovered = "???")
- DECISION 2: Flat grid for boons (12 items, no category grouping needed)
- DECISION 3: Centralized discovery calls in modal UI files (avoids circular imports)
- DECISION 4: Items tab removed — won't be implemented (scope reduction)

### File List

- src/stores/useArmory.jsx (NEW)
- src/ui/Armory.jsx (NEW — +getWeaponCardDisplayData, +getBoonCardDisplayData, +computeNextTab helpers)
- src/stores/__tests__/useArmory.test.js (NEW)
- src/ui/__tests__/Armory.test.jsx (NEW — +18 tests for card display data and Tab cycling)
- src/ui/MainMenu.jsx (MODIFIED — ARMORY button + Armory import)
- src/ui/LevelUpModal.jsx (MODIFIED — markDiscovered on new_weapon/new_boon)
- src/ui/PlanetRewardModal.jsx (MODIFIED — markDiscovered on new_weapon/new_boon)
- src/GameLoop.jsx (MODIFIED — markDiscovered('weapons', 'LASER_FRONT') at run start)

## Change Log

- 2026-02-19: Story 25.4 implemented — Armory catalog screen with weapon/boon discovery tracking, ARMORY button in MainMenu, useArmory store with localStorage persistence, Armory.jsx full-screen overlay (Weapons/Boons/Items tabs), discovery integration in LevelUpModal and PlanetRewardModal. 30 new tests, 2149 total — zero regressions.
- 2026-02-19: Code review fixes — [H1] GameLoop.jsx: starter weapon LASER_FRONT now marked discovered at run start; [M1+M2] Armory.jsx: exported getWeaponCardDisplayData, getBoonCardDisplayData, computeNextTab helpers; Armory.test.jsx: +18 tests for card display data (discovered vs undiscovered) and Tab keyboard cycling. 2167 tests total — zero regressions.
- 2026-02-21: Scope reduction — Items tab removed from Armory (won't be implemented). ARMORY_TABS now `['Weapons', 'Boons']`. ItemsPlaceholder component removed. Tests updated accordingly (tab cycling now Weapons ↔ Boons). Story AC and Dev Notes amended.
