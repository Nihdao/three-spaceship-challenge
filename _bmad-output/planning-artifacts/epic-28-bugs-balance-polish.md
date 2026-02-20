# Epic 28: Bugs, Balance & Quick Fixes

Le jeu est plus propre, plus réactif et mieux calibré : les bugs visuels sont éliminés, le panneau de debug est masqué, l'audio est équilibré, et le spawn rate met immédiatement la pression dès le début de partie avec une escalade drastique entre systèmes.

## Epic Goals

- Corriger les damage numbers qui restent affichés sur l'écran de game over
- Masquer le panneau Leva (debug) sans désinstaller la librairie
- Corriger le bug de musique (main menu qui perdure / mauvaise transition)
- Rééquilibrer les volumes : SFX plus forts (hors tirs), musique plus discrète
- Augmenter le spawn rate dès le début et le faire escalader drastiquement entre systèmes

## Epic Context

Après les epics 20-27 qui ont solidifié le contenu, plusieurs friction points persistent : un bug où les chiffres de dégâts restent visibles pendant le game over, un panneau Leva qui s'affiche sans utilité en production, une balance audio où la musique étouffe les SFX, et un spawn rate initial trop clément qui ne met pas assez la pression sur le joueur. Cette épic adresse ces points rapidement, sans refactoring architectural.

## Stories

### Story 28.1: Clear Damage Numbers on Game Over

As a player,
I want damage numbers to disappear when I die,
So that I don't see leftover floating numbers on the game over screen.

**Acceptance Criteria:**

**Given** the damage number system
**When** the player dies and the game over screen appears
**Then** all active damage numbers are immediately cleared from the screen
**And** no floating numbers are visible during or after the game over transition

**Given** the technical implementation
**When** the game phase transitions to 'gameOver'
**Then** `useDamageNumbers.getState().clear()` is called (or equivalent reset)
**And** the DamageNumberRenderer correctly shows no numbers after the clear
**And** the fix doesn't break normal gameplay damage number display

**Given** edge cases
**When** a damage number spawns in the same frame as death
**Then** it is also cleared and not visible on the game over screen

### Story 28.2: Hide Leva Debug Panel

As a player,
I want the Leva debug panel to not appear in the game,
So that the interface is clean and uncluttered.

**Acceptance Criteria:**

**Given** the DebugControls component
**When** the game is running
**Then** the Leva panel is completely hidden from the user
**And** the camera orbit/third-person toggle functionality is preserved for development use

**Given** the implementation approach
**When** hiding the panel
**Then** the `useControls` hook from leva is kept (to avoid uninstalling the lib)
**And** the Leva panel is hidden using Leva's built-in `hidden` prop on the root `<Leva>` component, OR by setting `collapsed: true` and `hideCopyButton: true` in a `<Leva hidden />` wrapper
**And** the DebugControls component still compiles and runs without errors
**And** no visible UI element is rendered by Leva

**Given** future dev needs
**When** a developer needs to use the Leva panel
**Then** they can re-enable it by removing the `hidden` prop or changing the config

### Story 28.3: Fix Music Transition & Volume Balance

As a player,
I want the music to transition cleanly between menu and gameplay,
And I want to hear SFX clearly without them being covered by music.

**Acceptance Criteria:**

**Given** the music transition (menu → gameplay)
**When** gameplay starts
**Then** the main menu music fully stops before the gameplay music starts
**And** there is no overlap or bleed of the menu music into gameplay
**And** the gameplay music is selected randomly from available tracks (Story 26.1 behavior preserved)

**Given** gameplay music volume
**When** a gameplay track is playing
**Then** its default volume is reduced to ~0.35 (down from 1.0) to avoid drowning SFX
**And** music volume can still be adjusted by the player in Options

**Given** SFX volume rebalancing
**When** the player triggers SFX (explosions, dash, scans, wormhole, boss events, UI sounds)
**Then** non-weapon SFX are perceived as clearly audible over the music
**And** the VOLUME_CATEGORIES in audioManager.js are adjusted:
  - `sfxFeedbackPositive`: 1.0 (up from 0.9) — explosions, scan-complete, etc.
  - `sfxFeedbackNegative`: 1.2 (up from 1.0) — damage-taken, more urgent
  - `events`: 1.5 (up from 1.2) — boss defeat, game over impact
  - `ui`: 0.7 (up from 0.5) — button sounds now more audible
  - `music` default volume constant: 0.35 (down from 1.0)
**And** weapon SFX (`sfxAction`) remain at 0.8 as-is (user: "les sons de tirs sont fort")

**Given** the scan loop sound (Story 26.3)
**When** scanning is active
**Then** the scan loop sound is also rebalanced consistently with the new SFX volumes

### Story 28.4: Increase Spawn Rate & Aggressive Difficulty Scaling

As a player,
I want to face enemies immediately from the start and feel increasing pressure across systems,
So that the game is challenging and exciting from the first second.

**Acceptance Criteria:**

**Given** the base spawn rate (System 1, start of game)
**When** gameplay begins
**Then** enemies spawn much faster than before — initial interval target: ~2.0s (down from 5.0s)
**And** the minimum spawn interval is reduced to ~0.8s (down from 1.5s)
**And** the batch ramp rate is accelerated (target: new batch unit every 20s instead of 30s)

**Given** the wave profiles in waveDefs.js
**When** reviewing spawn rate multipliers
**Then** the `spawnRateMultiplier` values in system1 wave phases are increased:
  - 'Easy Start' phase: 1.0 (up from 0.5) — start with real pressure, not a warm-up
  - 'Hard Spike 1': 2.5 (up from 1.5)
  - 'Medium Phase 1': 1.5 (up from 1.0)
  - 'Hard Spike 2': 3.5 (up from 2.0)
  - 'Crescendo': 4.0 (up from 2.5)
**And** system2 wave profiles are at least 1.5x system1 multipliers at equivalent phases
**And** system3 wave profiles are at least 2.5x system1 multipliers at equivalent phases (drastically harder)

**Given** the SPAWN_RAMP_RATE
**When** tuning the config
**Then** `SPAWN_RAMP_RATE` in gameConfig.js is increased from 0.01 to 0.025 for faster interval decay
**And** `SPAWN_INTERVAL_BASE` is reduced from 5.0 to 2.0
**And** `SPAWN_INTERVAL_MIN` is reduced from 1.5 to 0.8
**And** `SPAWN_BATCH_RAMP_INTERVAL` is reduced from 30 to 20

**Given** balance with the player's power level
**When** testing
**Then** System 1 start is challenging but survivable for a new player
**And** System 3 start feels like a brutal pressure cooker (high level player expected)
**And** the difficulty jump between entering System 2 and System 3 is clearly felt

## Technical Notes

**Story 28.1 — Damage Numbers Clear:**
- Add a `clear()` action to `useDamageNumbers` store that resets `damageNumbers` to empty array
- Hook into game phase transition to 'gameOver' — best placed in `useGame` phase setter or `GameLoop.jsx` at game-over detection
- `DamageNumberRenderer` already reads from the store reactively — clearing store is sufficient

**Story 28.2 — Leva Hidden:**
- In the component that renders `<Leva>` (likely `App.jsx` or similar root), add `hidden` prop: `<Leva hidden />`
- Alternatively, in `DebugControls.jsx`, wrap the `useControls` call to be a no-op in production: check `import.meta.env.PROD`
- Simplest approach: find where `<Leva>` is rendered and add the `hidden` prop

**Story 28.3 — Music/Audio:**
- In `audioManager.js`, update `VOLUME_CATEGORIES` constants
- Check `playMusic()` call sites — ensure `stopMusic()` is called before starting gameplay music
- Music default volume: pass `volume: 0.35` when calling `playMusic()` for gameplay tracks

**Story 28.4 — Spawn Balance:**
- Edit `GAME_CONFIG` in `gameConfig.js`: `SPAWN_INTERVAL_BASE`, `SPAWN_INTERVAL_MIN`, `SPAWN_RAMP_RATE`, `SPAWN_BATCH_RAMP_INTERVAL`
- Edit `WAVE_PROFILES` in `waveDefs.js`: increase `spawnRateMultiplier` values per system
- Run `spawnSystem.test.js` and `waveSystem.test.js` after changes — update expected values if needed

## Dependencies

- Story 27.1 (useDamageNumbers store) — Story 28.1 needs clear() action
- Story 23.1 (Dynamic Wave System) — Story 28.4 modifies wave profiles
- Story 26.1/26.2 (Random Music System) — Story 28.3 must not break random track selection

## Success Metrics

- Game over screen shows zero lingering damage numbers (visual QA)
- Leva panel is completely invisible to players (visual QA)
- Main menu music cannot be heard once gameplay starts (audio QA)
- SFX are clearly audible over music in normal gameplay (audio QA)
- System 1 start feels immediately intense (playtest: first 30s has combat pressure)
- System 3 is noticeably much harder than System 1 in enemy count/density (playtest)
