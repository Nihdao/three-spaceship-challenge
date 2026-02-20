# Epic 30: Companion Narrative System

Un compagnon de bord commente les événements clés de la partie à travers des bulles de dialogue au bas de l'écran, créant une atmosphère narrative légère et immersive qui renforce le sentiment d'aventure spatiale.

## Epic Goals

- Créer un système de bulles de dialogue en bas d'écran qui se dismiss automatiquement
- Définir un compagnon avec une personnalité (pilote de co-navigation, IA de bord…)
- Déclencher des dialogues contextuels sur les événements de jeu : arrivée système, planète détectée, wormhole apparu, mort du boss, etc.
- Garder le système extensible pour ajouter facilement de nouvelles lignes de dialogue

## Epic Context

Le jeu a maintenant un contenu riche et une progression solide. Ce qui manque encore est un fil narratif léger qui donne du sens aux actions du joueur et rend chaque partie unique. Un compagnon qui commente les événements (à la manière de Hades, FTL, ou Mass Effect pour les interactions de navigation) crée de l'attachement et de la variété sans nécessiter de cutscenes ou de lore lourd. Les dialogues apparaissent en bas de l'écran comme des bulles de chat, se dismiss automatiquement, et n'interrompent jamais le gameplay.

## Stories

### Story 30.1: Companion Dialogue UI Component

As a player,
I want to see dialogue bubbles at the bottom of the screen,
So that my companion can communicate with me without interrupting gameplay.

**Acceptance Criteria:**

**Given** the companion dialogue component
**When** a dialogue is triggered
**Then** a bubble appears at the bottom-left of the screen (above the HUD bottom elements)
**And** the bubble contains: a small character avatar/icon, the character name, and the dialogue text
**And** the bubble has a semi-transparent dark background with a subtle border
**And** the text is readable in all gameplay conditions (good contrast, text shadow)

**Given** the dismiss behavior
**When** a dialogue bubble appears
**Then** it automatically dismisses after ~4 seconds (configurable per dialogue)
**And** the bubble fades out smoothly before disappearing
**And** if a new dialogue triggers while one is already showing, the new one queues up and shows after the current one dismisses
**And** the queue has a max length of 2 — older queued dialogues are dropped if queue is full

**Given** the visual style
**When** rendered
**Then** the bubble slides in from the left or fades in from below with a smooth animation
**And** the font matches the game's visual identity (font-game class)
**And** the avatar is a simple icon or emoji representing the companion character
**And** the bubble does NOT require user interaction to dismiss (fully passive)

**Given** multiple rapid events
**When** several events fire in quick succession
**Then** dialogues are queued and played one at a time, not stacked simultaneously
**And** the queue respects priority: high-priority events (boss appearance, death) can skip the queue

**Given** game phases
**When** on the main menu, game over, or tunnel hub screens
**Then** companion dialogues are NOT shown (gameplay only)
**And** the dialogue system is inactive outside of gameplay phase

### Story 30.2: System Arrival & Navigation Dialogues

As a player,
I want my companion to acknowledge when we arrive in a new system,
So that the system entry feels like a shared adventure moment.

**Acceptance Criteria:**

**Given** arriving in a new system
**When** the phase transitions to 'gameplay' after a system transition (or on first game start)
**Then** the companion says something relevant to the system number and situation
**And** dialogue varies: one of several pre-written lines is randomly selected

**Given** the dialogue lines for system arrival
**When** entering System 1
**Then** possible lines include (randomly selected):
  - "Alright, we're in. Eyes open — they'll know we're here."
  - "New system, new threats. Let's find that wormhole and move."
  - "Sensors are picking up hostiles. Time to work, pilot."

**When** entering System 2
**Then** possible lines include:
  - "Second system. The signals are stronger here. Stay sharp."
  - "This sector's hotter than the last. Don't slow down."
  - "We made it to System 2. Things are about to get real."

**When** entering System 3
**Then** possible lines include:
  - "This is it. The final system. Everything's on the line."
  - "System 3 — the resistance here will be brutal. Good luck."
  - "We're close. Stay alive long enough to find the wormhole."

**Given** the trigger mechanism
**When** the system transition completes and gameplay resumes
**Then** the dialogue fires after a short delay (1.5s) to let the entry animation finish
**And** the dialogue doesn't overlap with the system name banner animation

### Story 30.3: Contextual Event Dialogues

As a player,
I want my companion to react to key in-game events,
So that the game world feels alive and reactive.

**Acceptance Criteria:**

**Given** a planet entering radar range
**When** a planet first becomes detectable (within minimap/radar visibility)
**Then** the companion says something like:
  - "A planet on radar — worth scanning if you get a moment."
  - "Oh, a planet nearby. Could have something useful on it."
  - "Planet detected. Your call, pilot."
**And** this dialogue fires at most once per planet per run (not repeatedly)
**And** it doesn't fire if the player is currently in combat with the boss

**Given** the wormhole appearing
**When** the wormhole spawns in the level
**Then** the companion says something like:
  - "The wormhole just opened! Time to push through."
  - "There it is — the way out. Go!"
  - "Wormhole detected. Clear the path and let's move."
**And** this is a high-priority dialogue that skips any current queue item

**Given** the boss appearing
**When** the boss enters the gameplay scene (Story 17.4 trigger)
**Then** the companion says something like:
  - "That's the guardian of this system. We need to take it down."
  - "Big contact — hostile, massive. This is the boss fight, pilot."
  - "Titan Cruiser incoming. All weapons, go!"
**And** this is a high-priority dialogue

**Given** low HP warning
**When** the player's HP drops below 25% of max
**Then** the companion says something like (at most once per HP threshold crossing):
  - "Hull integrity critical — don't get hit again!"
  - "We're taking heavy damage. Disengage if you can!"
  - "Shields down, hull compromised. Careful out there."

**Given** boss defeat
**When** the boss is defeated
**Then** the companion says something like:
  - "It's down! Nice flying, pilot."
  - "Target destroyed. Let's get to that wormhole."
  - "We got it! Now move — more will come."

### Story 30.4: Dialogue Definitions & Extensibility

As a developer,
I want dialogue lines to be defined in a single data file,
So that adding new dialogue is trivial and doesn't require touching UI or trigger code.

**Acceptance Criteria:**

**Given** the companion dialogue definitions
**When** looking at the codebase
**Then** all dialogue text is defined in `src/entities/companionDefs.js` (new file)
**And** dialogues are organized by event key: `'system-arrival-1'`, `'planet-radar'`, `'wormhole-spawn'`, etc.
**And** each event has an array of possible lines (randomly selected on trigger)
**And** each line can optionally have a `priority` field ('normal' | 'high') and a `duration` in seconds

**Given** the companion character definition
**When** reviewing companionDefs.js
**Then** the companion has a defined name (e.g., "ARIA" or "NAV-7") and icon/emoji
**And** the name and icon are configurable in one place (not hardcoded in the component)

**Given** adding new dialogue
**When** a developer wants to add lines for a new event
**Then** they only need to:
  1. Add the event key and lines to `companionDefs.js`
  2. Call `useCompanion.getState().trigger('new-event-key')` at the right place
**And** no changes to UI components or the dialogue rendering system are required

**Given** localization readiness
**When** the system is designed
**Then** all text is in English as specified (not hardcoded in JSX but in the defs file)
**And** the architecture supports future language switching (string keys in defs file)

## Technical Notes

**Architecture:**
- **Store**: `useCompanion.jsx` (new Zustand store) — tracks `queue: []`, `current: null`, `shownEvents: Set`
  - Actions: `trigger(eventKey)`, `dismiss()`, `clear()`
  - `trigger()`: looks up lines in companionDefs, picks random, adds to queue (respecting max queue size and priority)
- **Component**: `CompanionDialogue.jsx` (new UI component) — renders current dialogue bubble with auto-dismiss timer
- **Defs**: `src/entities/companionDefs.js` (new) — all text, companion info, event → lines mapping
- **Triggers**: placed in `GameLoop.jsx` or relevant stores (same pattern as `playSFX`)

**Trigger integration points:**
- System arrival: `useGame` phase setter, when `playing` resumes after tunnel exit
- Planet in radar: `useLevel` planet update, when planet.isVisible first becomes true (or within scan radius)
- Wormhole spawn: `useLevel` wormhole spawn action
- Boss spawn: `useEnemies` boss spawn action (Story 17.4)
- Low HP: `usePlayer` damage handler, when HP crosses 25% threshold
- Boss defeat: `useEnemies` boss death handler

**Auto-dismiss timer:**
- `CompanionDialogue` uses `useEffect` + `setTimeout` to auto-dismiss after `current.duration` seconds
- When timer fires: calls `useCompanion.getState().dismiss()` which pops next from queue
- Animation: CSS `animate-slide-in` from bottom, `animate-fade-out` before dismiss

**Queue management:**
- Normal events: pushed to end of queue if `queue.length < 2`, otherwise dropped
- High-priority events: replace the current dialogue immediately (bypass queue)
- `shownEvents` Set: tracks one-shot events (planet radar, low HP) — checked before triggering

**Component placement:**
- `CompanionDialogue` rendered in `HUD.jsx` or directly in `App.jsx` (outside Canvas, HTML overlay)
- z-index: 40 (below game over z-50, above regular HUD elements)
- Position: bottom-left, above the XP bar (bottom ~6rem margin)

## Dependencies

- Story 4.2 (Gameplay HUD) — CompanionDialogue placed alongside HUD
- Epic 20 (usePlayer store) — low HP trigger reads player HP state
- Story 6.2 / Story 22.4 (Boss system) — boss spawn/defeat triggers
- Story 6.1 (Wormhole) — wormhole spawn trigger
- Story 5.2 (Planet system) — planet radar trigger

## Success Metrics

- Dialogue bubbles appear and dismiss cleanly without user interaction (visual QA)
- No gameplay interruption from dialogues (QA: game runs normally while dialogue shows)
- All event triggers fire correctly (QA: test each event type)
- Players notice and read the companion dialogue (playtest: spontaneous comments about companion)
- Adding a new dialogue line takes < 2 minutes (developer test: add new event to companionDefs.js)
- Companion character feels consistent and has personality (playtest: players identify with the companion)
