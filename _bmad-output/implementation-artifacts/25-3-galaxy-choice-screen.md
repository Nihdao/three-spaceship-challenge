# Story 25.3: Galaxy Choice Screen

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to choose a galaxy before starting a run,
So that I have a sense of destination and the game can support multiple levels in the future.

## Acceptance Criteria

**Given** the flow after clicking PLAY and selecting a ship
**When** the player is ready to start
**Then** a "SELECT GALAXY" screen appears before the run begins
**And** only unlocked galaxies are shown (initially one: Andromeda Reach)

**Given** the galaxy display
**When** shown
**Then** each galaxy has:
- A name
- A short description (1-2 sentences)
- Number of systems (e.g., "3 SYSTEMS")
**And** the available galaxy is pre-selected and highlighted
**And** the background shows the same space scene as the main menu and ship selection (not a black screen)
**And** the UI uses the game's purple/violet accent color

**Given** the player clicks TRAVEL (or presses ENTER/SPACE)
**When** the galaxy is confirmed
**Then** the run begins with the selected galaxy's configuration
**And** the galaxy name appears in the system entry banner (Story 17.2)

**Given** future challenge modifiers
**When** designed for later
**Then** the galaxy data structure supports challengeSlots and fragmentMultiplier fields for future expansion
**And** no challenge UI is shown in this version

## Tasks / Subtasks

- [x] Task 1: Create galaxy definitions config (AC: #2)
  - [x] Create src/entities/galaxyDefs.js (NEW file)
  - [x] Define GALAXIES constant: array of galaxy objects
  - [x] Each galaxy: { id, name, description, systemCount, locked, challengeSlots }
  - [x] Initial galaxy: id='andromeda_reach', name='Andromeda Reach', systemCount=3, locked=false
  - [x] challengeSlots: empty array [] (future-proofing for challenge modifiers)
  - [x] Export helper: getAvailableGalaxies() returns unlocked galaxies
  - [x] Export helper: getDefaultGalaxy() returns first unlocked galaxy

- [x] Task 2: Add galaxy selection phase to useGame store (AC: #1, #3)
  - [x] Modify src/stores/useGame.jsx
  - [x] Add state field: selectedGalaxyId (string, default: null)
  - [x] Action: setSelectedGalaxy(galaxyId) — updates selectedGalaxyId
  - [x] Action: startGalaxyChoice() — sets phase to 'galaxyChoice', isPaused false
  - [x] Modify startGameplay() to set phase='systemEntry' (keep existing behavior)
  - [x] In reset(), clear selectedGalaxyId to null

- [x] Task 3: Create GalaxyChoice UI component (AC: #1, #2, #3)
  - [x] Create src/ui/GalaxyChoice.jsx (NEW file)
  - [x] Read availableGalaxies from galaxyDefs.getAvailableGalaxies() (unlocked only)
  - [x] Read selectedGalaxyId from useGame store
  - [x] Two-panel layout matching ShipSelect.jsx: left list, right detail card
  - [x] Show galaxy name, description, system count badge — no preview image
  - [x] No challenges section (reserved for future story)
  - [x] BACK button → useGame.setPhase('shipSelect')
  - [x] TRAVEL button → useGame.startGameplay() (proceeds to systemEntry phase)
  - [x] Keyboard: ESC = back, ENTER/SPACE = travel
  - [x] Play SFX on button clicks (button-click, button-hover)
  - [x] Background: MenuScene mounted for galaxyChoice phase in Experience.jsx (same space scene as menu/ship select)
  - [x] Color accent: galaxy violet (#cc44ff), matching game UI palette

- [x] Task 4: Wire 3D background for galaxyChoice phase
  - [x] Modify src/Experience.jsx
  - [x] Add 'galaxyChoice' to MenuScene mount condition
  - [x] Ensures space scene is visible behind the UI overlay (no black background)

- [x] Task 5: Wire GalaxyChoice into game flow (AC: #1)
  - [x] Modify src/ui/Interface.jsx
  - [x] Import GalaxyChoice component
  - [x] Add conditional render: {phase === 'galaxyChoice' && <GalaxyChoice />}
  - [x] Modify src/ui/ShipSelect.jsx
  - [x] In handleStart(), replace useGame.startGameplay() with useGame.startGalaxyChoice()
  - [x] This creates flow: ShipSelect → galaxyChoice phase → GalaxyChoice screen → startGameplay() → systemEntry

- [x] Task 6: Integrate galaxy name into system banner (AC: #3)
  - [x] Modify src/ui/SystemNameBanner.jsx
  - [x] Read selectedGalaxyId from useGame store
  - [x] Look up galaxy name from GALAXIES array
  - [x] Display format: "{GALAXY_NAME} — {SYSTEM_NAME}" (e.g., "ANDROMEDA REACH — ALPHA CENTAURI")
  - [x] If selectedGalaxyId is null (backward compatibility), show only system name
  - [x] Keep same visual style and animation timing from Story 17.2

- [x] Task 7: Write tests
  - [x] Test galaxyDefs: GALAXIES array has at least 1 galaxy
  - [x] Test galaxyDefs: getAvailableGalaxies() returns only unlocked galaxies
  - [x] Test galaxyDefs: getDefaultGalaxy() returns first unlocked galaxy
  - [x] Test useGame: setSelectedGalaxy() updates selectedGalaxyId
  - [x] Test useGame: startGalaxyChoice() sets phase to 'galaxyChoice'
  - [x] Test useGame: reset() clears selectedGalaxyId
  - [x] Test GalaxyChoice: renders single galaxy card with correct data
  - [x] Test GalaxyChoice: BACK button returns to shipSelect phase
  - [x] Test GalaxyChoice: START button proceeds to systemEntry phase
  - [x] Test SystemNameBanner: displays galaxy name when selectedGalaxyId is set

## Dev Notes

### Architecture Alignment

This story creates the **galaxy selection screen** that appears after ship selection and before run start, establishing the foundation for future multi-galaxy and challenge modifier systems.

**6-Layer Architecture:**
- **Config Layer**: `src/entities/galaxyDefs.js` (NEW) — Galaxy definitions with id, name, description, systemCount, challengeSlots
- **Stores Layer**: `src/stores/useGame.jsx` (MODIFY) — Add selectedGalaxyId state + setSelectedGalaxy/startGalaxyChoice actions
- **UI Layer**: `src/ui/GalaxyChoice.jsx` (NEW) — Galaxy selection screen overlay
- **UI Layer**: `src/ui/Interface.jsx` (MODIFY) — Wire GalaxyChoice rendering for galaxyChoice phase
- **UI Layer**: `src/ui/ShipSelect.jsx` (MODIFY) — Change handleStart to trigger startGalaxyChoice instead of startGameplay
- **UI Layer**: `src/ui/SystemNameBanner.jsx` (MODIFY) — Display galaxy name with system name
- **GameLoop**: No changes (galaxy choice is pre-gameplay selection)

### Key Source Files

| File | Change | Layer |
|------|--------|-------|
| `src/entities/galaxyDefs.js` | **NEW** — Galaxy data definitions | Config |
| `src/stores/useGame.jsx` | **MODIFY** — Add selectedGalaxyId state + actions | Stores |
| `src/ui/GalaxyChoice.jsx` | **NEW** — Galaxy selection screen component | UI |
| `src/ui/Interface.jsx` | **MODIFY** — Add galaxyChoice phase rendering | UI |
| `src/ui/ShipSelect.jsx` | **MODIFY** — Change handleStart to go to galaxyChoice | UI |
| `src/ui/SystemNameBanner.jsx` | **MODIFY** — Display galaxy name with system name | UI |

### Game Flow Integration

**Current flow (before Story 25.3):**
```
Main Menu → Ship Select → startGameplay() → systemEntry phase → gameplay phase
```

**New flow (after Story 25.3):**
```
Main Menu → Ship Select → startGalaxyChoice() → galaxyChoice phase → GalaxyChoice screen
         → [Player clicks START] → startGameplay() → systemEntry phase → gameplay phase
```

**Phase transitions:**
1. **shipSelect → galaxyChoice**: ShipSelect.handleStart() calls useGame.startGalaxyChoice()
2. **galaxyChoice → systemEntry**: GalaxyChoice.handleStart() calls useGame.startGameplay()
3. **systemEntry → gameplay**: Existing flow (Story 17.1) via completeSystemEntry()

**Backward navigation:**
- galaxyChoice → shipSelect: GalaxyChoice.handleBack() calls useGame.setPhase('shipSelect')

### Galaxy Data Structure

**galaxyDefs.js structure:**
```javascript
export const GALAXIES = [
  {
    id: 'andromeda_reach',
    name: 'Andromeda Reach',
    description: 'A spiral arm teeming with hostile fleets and rich asteroid fields.',
    systemCount: 3,
    locked: false,
    colorTheme: '#4a9eff', // Blue accent for galaxy identity
    challengeSlots: [], // Future: array of challenge IDs
    fragmentMultiplier: 1.0, // Future: modified by active challenges
  },
  // Future galaxies (locked: true):
  // {
  //   id: 'cygnus_expanse',
  //   name: 'Cygnus Expanse',
  //   description: 'Dense nebulae hide deadly surprises in every sector.',
  //   systemCount: 3,
  //   locked: true,
  //   colorTheme: '#a855f7', // Purple
  //   challengeSlots: [],
  //   fragmentMultiplier: 1.0,
  // },
]

export function getAvailableGalaxies() {
  return GALAXIES.filter(g => !g.locked)
}

export function getDefaultGalaxy() {
  return getAvailableGalaxies()[0] || GALAXIES[0]
}

export function getGalaxyById(id) {
  return GALAXIES.find(g => g.id === id)
}
```

**Design rationale:**
- **systemCount = 3**: Matches current game (3 systems per run)
- **challengeSlots**: Empty array now, will hold challenge modifier IDs in future (e.g., ['less_time', 'no_minimap'])
- **fragmentMultiplier**: Base 1.0, will be computed from active challenges (e.g., 1.0 + 0.3 + 0.2 = 1.5x)
- **colorTheme**: Galaxy identity color, used for visual accents in UI
- **locked**: Future galaxies start locked, unlock via progression system (Epic 25 expansion)

### useGame Store Extension

**State additions:**
```javascript
// In src/stores/useGame.jsx:
const useGame = create(
  subscribeWithSelector((set, get) => ({
    // --- Existing state ---
    phase: 'menu',
    isPaused: false,
    // ... other existing fields ...

    // --- NEW: Galaxy selection (Story 25.3) ---
    selectedGalaxyId: null, // Galaxy ID for current/upcoming run

    // --- NEW: Actions (Story 25.3) ---
    setSelectedGalaxy: (galaxyId) => set({ selectedGalaxyId: galaxyId }),

    startGalaxyChoice: () => {
      const defaultGalaxy = getDefaultGalaxy()
      set({
        phase: 'galaxyChoice',
        isPaused: false,
        selectedGalaxyId: defaultGalaxy.id, // Pre-select default galaxy
      })
    },

    // --- MODIFIED: startGameplay (Story 25.3) ---
    startGameplay: () => set((s) => ({
      phase: 'systemEntry', // Changed from direct gameplay to systemEntry (existing)
      isPaused: false,
      systemTimer: 0,
      totalElapsedTime: 0,
      score: 0,
      kills: 0,
      prevCombatPhase: 'gameplay',
      highScore: s.highScore,
      isNewHighScore: false,
      // Story 17.6: Reset flash flags
      wormholeFirstTouch: false,
      tunnelTransitionPending: false,
      tunnelEntryFlashTriggered: false,
      // NOTE: selectedGalaxyId is NOT reset here — persists through systemEntry → gameplay
    })),

    // --- MODIFIED: reset (Story 25.3) ---
    reset: () => set({
      phase: 'menu',
      isPaused: false,
      systemTimer: 0,
      totalElapsedTime: 0,
      score: 0,
      kills: 0,
      rewardTier: null,
      prevCombatPhase: 'gameplay',
      highScore: 0,
      isNewHighScore: false,
      wormholeFirstTouch: false,
      tunnelTransitionPending: false,
      tunnelEntryFlashTriggered: false,
      _debugGrid: false,
      selectedGalaxyId: null, // NEW: Clear galaxy selection on full reset
    }),
  }))
)
```

**CRITICAL NOTES:**
- **selectedGalaxyId persists through systemEntry → gameplay**: Do NOT reset it in startGameplay() — it's needed for SystemNameBanner display
- **Pre-selection in startGalaxyChoice()**: Automatically select the default (first unlocked) galaxy when entering the galaxyChoice phase
- **Backward compatibility**: If selectedGalaxyId is null (e.g., old save data), SystemNameBanner shows only system name

### GalaxyChoice UI Component

**Component structure:**
```javascript
import useGame from '../stores/useGame.jsx'
import { GALAXIES, getAvailableGalaxies, getGalaxyById } from '../entities/galaxyDefs.js'
import { playSFX } from '../audio/audioManager.js'

export default function GalaxyChoice() {
  const selectedGalaxyId = useGame((s) => s.selectedGalaxyId)
  const availableGalaxies = getAvailableGalaxies()
  const selectedGalaxy = getGalaxyById(selectedGalaxyId) || availableGalaxies[0]

  const handleStart = () => {
    playSFX('button-click')
    useGame.getState().startGameplay() // Proceeds to systemEntry phase
  }

  const handleBack = () => {
    playSFX('button-click')
    useGame.getState().setPhase('shipSelect')
  }

  // Keyboard: ESC = back, ENTER/SPACE = start
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        handleBack()
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        handleStart()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-game animate-fade-in">
      {/* BACK button (top-left) */}
      <button
        onClick={handleBack}
        className="absolute top-8 left-8 px-4 py-2 text-sm tracking-widest text-game-text-muted hover:text-game-text transition-colors select-none"
      >
        &larr; BACK
      </button>

      {/* Center: Galaxy Selection Card */}
      <div className="flex flex-col items-center gap-8 max-w-2xl p-8">
        <h2
          className="text-3xl font-bold tracking-[0.2em] text-game-text mb-4 select-none"
          style={{ textShadow: '0 0 30px rgba(255, 0, 255, 0.3)' }}
        >
          CHOOSE YOUR GALAXY
        </h2>

        {/* Galaxy Card (single, pre-selected) */}
        <div
          className="w-full bg-game-bg/60 border-2 border-game-accent rounded-lg p-8 backdrop-blur-sm ring-2 ring-game-accent/40"
          style={{
            boxShadow: `0 0 40px ${selectedGalaxy.colorTheme}40`,
            borderColor: selectedGalaxy.colorTheme,
          }}
        >
          {/* Galaxy Name */}
          <h3
            className="text-2xl font-bold tracking-[0.15em] text-game-text mb-3"
            style={{ textShadow: `0 0 20px ${selectedGalaxy.colorTheme}60`, color: selectedGalaxy.colorTheme }}
          >
            {selectedGalaxy.name.toUpperCase()}
          </h3>

          {/* Galaxy Description */}
          <p className="text-sm text-game-text-muted mb-4 leading-relaxed">
            {selectedGalaxy.description}
          </p>

          {/* System Count Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="px-3 py-1 bg-game-accent/20 border border-game-accent/50 rounded text-xs tracking-widest text-game-accent">
              {selectedGalaxy.systemCount} SYSTEMS
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-game-border/20 my-4" />

          {/* CHALLENGES Section (Future-Proofed, Disabled) */}
          <div className="opacity-40">
            <p className="text-[10px] tracking-widest uppercase text-game-text-muted mb-2">
              Challenges (Coming Soon)
            </p>
            <div className="space-y-2">
              {/* Placeholder challenge checkboxes (disabled) */}
              <div className="flex items-center gap-2 text-xs text-game-text-muted">
                <input type="checkbox" disabled className="opacity-50" />
                <span>Less Time: -3 min/system, +30% Fragments</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-game-text-muted">
                <input type="checkbox" disabled className="opacity-50" />
                <span>No Minimap: +20% Fragments</span>
              </div>
            </div>
          </div>
        </div>

        {/* START Button */}
        <button
          onClick={handleStart}
          onMouseEnter={() => playSFX('button-hover')}
          className="px-8 py-3 bg-game-accent text-game-bg font-bold tracking-[0.15em] rounded-lg hover:bg-game-accent/90 transition-all select-none text-lg"
          style={{ boxShadow: '0 0 20px rgba(255, 0, 255, 0.4)' }}
        >
          START RUN
        </button>
      </div>
    </div>
  )
}
```

**UI Design Notes:**
- **Single galaxy card**: Initially only one galaxy available, so no grid layout needed
- **Pre-selected and highlighted**: The single galaxy is always selected (border-game-accent, ring effect)
- **Future-proofing**: Challenge checkboxes are present but disabled with "Coming Soon" label
- **Visual hierarchy**: Galaxy name uses galaxy.colorTheme for identity, card border glows with same color
- **Keyboard navigation**: ESC/ENTER/SPACE for full keyboard control
- **Aesthetic alignment**: Matches ShipSelect.jsx style (same font, colors, spacing, button styles)

### SystemNameBanner Integration

**Modify SystemNameBanner.jsx to include galaxy name:**
```javascript
// In src/ui/SystemNameBanner.jsx:
import useGame from '../stores/useGame.jsx'
import useLevel from '../stores/useLevel.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { getGalaxyById } from '../entities/galaxyDefs.js'

export default function SystemNameBanner() {
  const phase = useGame((s) => s.phase)
  const currentSystem = useLevel((s) => s.currentSystem)
  const selectedGalaxyId = useGame((s) => s.selectedGalaxyId) // NEW: Read galaxy ID

  if (phase !== 'systemEntry') return null

  const systemName = GAME_CONFIG.SYSTEM_NAMES[currentSystem - 1] || `SYSTEM ${currentSystem}`

  // NEW: Look up galaxy name if selectedGalaxyId is set
  const galaxy = selectedGalaxyId ? getGalaxyById(selectedGalaxyId) : null
  const galaxyName = galaxy ? galaxy.name.toUpperCase() : null

  // NEW: Display format: "GALAXY_NAME — SYSTEM_NAME" or just "SYSTEM_NAME" if no galaxy
  const displayText = galaxyName ? `${galaxyName} — ${systemName}` : systemName

  return (
    <div className="system-banner">
      <p className="system-banner-text">{displayText}</p>
    </div>
  )
}
```

**Display examples:**
- **With galaxy selected**: "ANDROMEDA REACH — ALPHA CENTAURI"
- **Without galaxy (backward compatibility)**: "ALPHA CENTAURI"

**CRITICAL:** The SystemNameBanner must handle `selectedGalaxyId === null` gracefully for backward compatibility with existing save data or if the player somehow skips galaxy selection.

### Interface.jsx Integration

**Add GalaxyChoice rendering:**
```javascript
// In src/ui/Interface.jsx:
import GalaxyChoice from './GalaxyChoice.jsx'

export default function Interface() {
  const phase = useGame((s) => s.phase)
  // ... existing code ...

  return (
    <>
      {phase === 'menu' && <MainMenu />}
      {phase === 'shipSelect' && <ShipSelect />}
      {phase === 'galaxyChoice' && <GalaxyChoice />} {/* NEW: Galaxy selection screen */}
      {phase === 'systemEntry' && <SystemNameBanner />}
      {/* ... rest of phase rendering ... */}
    </>
  )
}
```

### ShipSelect.jsx Modification

**Change handleStart to go to galaxyChoice phase:**
```javascript
// In src/ui/ShipSelect.jsx, MODIFY handleStart:
const handleStart = () => {
  playSFX('button-click')
  usePlayer.getState().setCurrentShipId(selectedShipIdRef.current)
  // CHANGED: Instead of useGame.getState().startGameplay(), call startGalaxyChoice()
  useGame.getState().startGalaxyChoice() // NEW: Go to galaxy choice screen first
}
```

**This change creates the new flow:**
- ShipSelect → galaxyChoice phase → GalaxyChoice screen
- GalaxyChoice → systemEntry phase → SystemNameBanner → gameplay

### Future Expansion Considerations

**Challenge Modifiers (NOT in this story, future Epic 25+ content):**
The UI is designed to accommodate future challenge modifiers without major refactoring:

**Data structure extension (future):**
```javascript
{
  id: 'andromeda_reach',
  name: 'Andromeda Reach',
  // ... existing fields ...
  challengeSlots: ['less_time', 'no_minimap'], // Active challenges for this galaxy
  fragmentMultiplier: 1.5, // Computed from challenges (1.0 + 0.3 + 0.2)
}

// Challenge definitions (future file: challengeDefs.js)
export const CHALLENGES = {
  less_time: {
    id: 'less_time',
    name: 'Limited Time',
    description: 'Each system has 3 minutes less time',
    fragmentBonus: 0.3, // +30% Fragments
    effects: { systemTimerReduction: 180 }, // -3 minutes (180 seconds)
  },
  no_minimap: {
    id: 'no_minimap',
    name: 'No Minimap',
    description: 'Minimap is disabled',
    fragmentBonus: 0.2, // +20% Fragments
    effects: { disableMinimap: true },
  },
  // ... more challenges ...
}
```

**GalaxyChoice UI extension (future):**
- Enable challenge checkboxes
- On checkbox toggle: update galaxy.challengeSlots array
- Compute fragmentMultiplier = 1.0 + sum(challenge.fragmentBonus)
- Display total Fragment bonus prominently
- Apply challenge effects during gameplay (via useLevel or useGame stores)

**CRITICAL:** This story does NOT implement challenge logic — only reserves UI space and data structure fields for future expansion.

### Multiple Galaxies (Future)

When additional galaxies are added (future Epic 25+ content):
- Add new galaxy objects to GALAXIES array with `locked: true`
- Implement unlock system (e.g., "defeat final boss of previous galaxy to unlock next")
- Convert GalaxyChoice UI from single card to grid layout (similar to ShipSelect grid)
- Add galaxy selection state (currently only one galaxy, so always selected)
- Add galaxy unlock animations/celebrations

**Data structure is ready:**
```javascript
export const GALAXIES = [
  { id: 'andromeda_reach', name: 'Andromeda Reach', locked: false, ... },
  { id: 'cygnus_expanse', name: 'Cygnus Expanse', locked: true, ... }, // Future
  { id: 'orions_gate', name: "Orion's Gate", locked: true, ... }, // Future
]
```

**UI adaptation (future):**
- Change from single card to 3-column grid (similar to ship selection)
- Add lock icons and "LOCKED" badges for unavailable galaxies
- Add unlock requirements tooltips ("Defeat final boss of Andromeda Reach")

### Testing Standards

Follow the project's Vitest testing standards:

**Config tests (galaxyDefs.test.js):**
- Test: GALAXIES array has at least 1 galaxy
- Test: Each galaxy has required fields (id, name, description, systemCount, locked, colorTheme, challengeSlots, fragmentMultiplier)
- Test: getAvailableGalaxies() returns only galaxies with locked=false
- Test: getDefaultGalaxy() returns first unlocked galaxy
- Test: getGalaxyById() returns correct galaxy or undefined

**Store tests (useGame.test.js):**
- Test: setSelectedGalaxy() updates selectedGalaxyId
- Test: startGalaxyChoice() sets phase to 'galaxyChoice' and pre-selects default galaxy
- Test: startGameplay() preserves selectedGalaxyId (does NOT reset it)
- Test: reset() clears selectedGalaxyId to null
- Test: selectedGalaxyId persists through systemEntry → gameplay phases

**Integration tests:**
- Test: ShipSelect.handleStart() transitions to galaxyChoice phase
- Test: GalaxyChoice.handleStart() transitions to systemEntry phase
- Test: GalaxyChoice.handleBack() returns to shipSelect phase
- Test: SystemNameBanner displays galaxy name when selectedGalaxyId is set
- Test: SystemNameBanner shows only system name when selectedGalaxyId is null (backward compatibility)

**UI tests (GalaxyChoice.test.jsx):**
- Test: Component renders single galaxy card with correct data
- Test: BACK button calls useGame.setPhase('shipSelect')
- Test: START button calls useGame.startGameplay()
- Test: ESC key triggers handleBack
- Test: ENTER/SPACE keys trigger handleStart
- Test: Challenge checkboxes are present but disabled
- Test: SFX played on button hover and click

**CRITICAL:** All tests must reset store state between test cases. Use `useGame.getState().reset()` in afterEach().

### Performance Notes

- Pure UI component — zero GPU cost (HTML overlay)
- Single React subscription to phase and selectedGalaxyId — minimal re-render cost
- No game loop integration — galaxy selection happens before gameplay initialization
- No asset loading needed — text-based UI with CSS styling only

### Project Structure Notes

**New files:**
- `src/entities/galaxyDefs.js` — Galaxy data definitions
- `src/ui/GalaxyChoice.jsx` — Galaxy selection screen component
- `src/entities/__tests__/galaxyDefs.test.js` — Config tests
- `src/ui/__tests__/GalaxyChoice.test.jsx` — UI component tests

**Modified files:**
- `src/stores/useGame.jsx` — Add selectedGalaxyId state + setSelectedGalaxy/startGalaxyChoice actions
- `src/ui/Interface.jsx` — Add galaxyChoice phase rendering
- `src/ui/ShipSelect.jsx` — Change handleStart to call startGalaxyChoice
- `src/ui/SystemNameBanner.jsx` — Display galaxy name with system name
- `src/stores/__tests__/useGame.test.js` — Extend tests for galaxy selection state

**NOT in this story:**
- Challenge modifier logic (Epic 25+ expansion)
- Multiple galaxy unlock system (Epic 25+ expansion)
- Galaxy-specific visual themes in gameplay (future polish)
- Galaxy selection persistence to localStorage (currently session-only, resets on menu)

### Dependencies on Other Stories

**Depends on:**
- Story 9.3 (Ship Selection Persistence) — Ship selection UI pattern to mirror ✅ DONE
- Story 17.2 (System Name Banner Display) — Banner integration for galaxy name ✅ DONE
- Story 17.1 (System Entry Portal Animation) — systemEntry phase exists ✅ DONE
- Epic 20 (Permanent Upgrades) — Fragment economy for challenge bonuses (future) ✅ DONE

**Blocks:**
- None — Story 25.3 is optional content that does not block other stories
- Stories 25.1 and 25.2 can proceed in parallel (ship leveling and skins are independent of galaxy selection)

**Blocked by:**
- None — All dependencies are complete

### Common Pitfalls & Solutions

**Pitfall 1: selectedGalaxyId reset too early**
- **Cause:** Resetting selectedGalaxyId in startGameplay() before SystemNameBanner reads it
- **Solution:** Do NOT reset selectedGalaxyId in startGameplay() — only reset in reset() or returnToMenu()

**Pitfall 2: Missing backward compatibility**
- **Cause:** SystemNameBanner crashes when selectedGalaxyId is null
- **Solution:** Always check if selectedGalaxyId is null before getGalaxyById(), show only system name if no galaxy

**Pitfall 3: Keyboard event collision**
- **Cause:** GalaxyChoice keyboard listener conflicts with ShipSelect or other screens
- **Solution:** GalaxyChoice listener only active when phase === 'galaxyChoice', cleanup in useEffect return

**Pitfall 4: Challenge UI misleading**
- **Cause:** Players think challenges are functional when they're only placeholders
- **Solution:** Clearly label "Coming Soon", disable checkboxes, reduce opacity to 40%

**Pitfall 5: Multiple galaxies assumption**
- **Cause:** UI assumes grid layout when only one galaxy exists
- **Solution:** Use single centered card for initial implementation, refactor to grid when multiple galaxies added

### Visual Design Notes

**Galaxy Card Aesthetic:**
- **Color identity**: Each galaxy has a colorTheme (blue for Andromeda, purple for Cygnus, etc.)
- **Glow effect**: Card border and text shadow use galaxy colorTheme for identity
- **Pre-selection**: Single galaxy is always selected (no need for selection state)
- **Challenge section**: De-emphasized (opacity 40%) to clearly indicate "not yet available"

**Typography:**
- Galaxy name: Large (text-2xl), bold, tracking-[0.15em], colored with galaxy.colorTheme
- Description: Small (text-sm), text-game-text-muted, leading-relaxed for readability
- System count badge: Uppercase, tracking-widest, accent color

**Layout:**
- Centered card design (not grid) since only one galaxy available
- BACK button top-left (matches ShipSelect pattern)
- START button below card, large and prominent
- Challenge section integrated into card (future expansion)

### References

- [Source: _bmad-output/planning-artifacts/epic-25-meta-content.md#Story 25.3] — Story acceptance criteria, galaxy choice spec
- [Source: _bmad-output/planning-artifacts/architecture.md] — 6-layer architecture, file organization patterns
- [Source: src/stores/useGame.jsx] — Game phase management, state structure
- [Source: src/ui/ShipSelect.jsx] — UI pattern to mirror (overlay screen, keyboard navigation, SFX)
- [Source: src/ui/SystemNameBanner.jsx] — Banner integration for galaxy name display
- [Source: src/ui/Interface.jsx] — Phase-based conditional rendering pattern
- [Source: _bmad-output/implementation-artifacts/17-2-system-name-banner-display.md] — System banner implementation (Story 17.2)
- [Source: _bmad-output/implementation-artifacts/25-1-ship-level-progression.md] — Ship progression patterns (Story 25.1)
- [Source: _bmad-output/implementation-artifacts/25-2-level-based-ship-skins.md] — Ship customization patterns (Story 25.2)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Created `src/entities/galaxyDefs.js` with GALAXIES array (1 unlocked galaxy: Andromeda Reach), and helpers `getAvailableGalaxies()`, `getDefaultGalaxy()`, `getGalaxyById()`.
- Extended `src/stores/useGame.jsx` with `selectedGalaxyId` state (default null), `setSelectedGalaxy()`, `startGalaxyChoice()` actions, and updated `reset()` to clear selectedGalaxyId.
- Created `src/ui/GalaxyChoice.jsx` — full-screen overlay matching ShipSelect.jsx aesthetic, two-panel layout (left list + right detail card), galaxy name/description/system count badge, ESC/ENTER/SPACE keyboard support, SFX. No challenge section (reserved for future story).
- Wired into game flow: Interface.jsx renders GalaxyChoice for `galaxyChoice` phase; ShipSelect.handleStart() now calls `startGalaxyChoice()` instead of `startGameplay()`.
- Updated `src/ui/SystemNameBanner.jsx` to display "GALAXY — SYSTEM" format (e.g., "ANDROMEDA REACH — ALPHA CENTAURI") when selectedGalaxyId is set, with null fallback showing only system name.
- Removed hardcoded " SYSTEM" suffix from banner render — displayName is now fully self-contained.
- All tests pass with 0 regressions. New tests: 16 (galaxyDefs) + 10 (useGame galaxy) + 16 (GalaxyChoice store contract) + 14 (GalaxyChoice component display data, H1 fix).

### File List

- src/entities/galaxyDefs.js (NEW)
- src/ui/GalaxyChoice.jsx (NEW)
- src/entities/__tests__/galaxyDefs.test.js (NEW)
- src/ui/__tests__/GalaxyChoice.test.jsx (NEW)
- src/stores/useGame.jsx (MODIFIED)
- src/ui/Interface.jsx (MODIFIED)
- src/ui/ShipSelect.jsx (MODIFIED)
- src/ui/SystemNameBanner.jsx (MODIFIED)
- src/stores/__tests__/useGame.test.js (MODIFIED)
- src/Experience.jsx (MODIFIED — galaxyChoice added to MenuScene mount condition)
- _bmad-output/implementation-artifacts/sprint-status.yaml (MODIFIED)

## Change Log

- 2026-02-19: Story 25.3 implemented — Galaxy choice screen created with Andromeda Reach galaxy, wired into ShipSelect → galaxyChoice → systemEntry flow, galaxy name shown in SystemNameBanner. 42 new tests added. (claude-sonnet-4-6)
- 2026-02-19: Code review fixes — returnToMenu() now resets selectedGalaxyId; GalaxyChoice.jsx exports getGalaxyCardDisplayData() for testability; GALAXIES unused import removed; GalaxyChoice.test.jsx extended with 14 component display data tests; Completion Notes corrected. (claude-sonnet-4-6)
