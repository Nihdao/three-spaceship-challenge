# Epic 35: Exploration & Navigation

Système de carte de découverte (fog of war), grande carte togglable (touche M), refonte de la minimap en style Redshift (carré + triangle directionnel + flèche trou de ver), et tracker de quête contextuel affiché sous la minimap.

## Epic Goals

- Créer un module fog-of-war (`fogSystem.js`) pour tracker la progression d'exploration
- Implémenter une grande carte semi-transparente (touche M, non-pausante) affichant les zones explorées, planètes et trou de ver
- Restyler la minimap : forme carrée angulaire, curseur triangle qui tourne avec la direction du joueur, indicateur de direction du trou de ver quand hors radar
- Ajouter un quest tracker sous la minimap dérivant les objectifs depuis l'état courant du jeu
- Appliquer le design system Redshift sur tous ces composants

## Epic Context

La minimap actuelle est circulaire, joueur = point fixe sans direction, style générique (anti-pattern Redshift). Il n'existe pas de carte globale, ce qui rend l'exploration d'un système de 15 planètes dans une zone 4000×4000 très difficile sans repères. Le joueur n'a aucun retour visuel sur sa progression vers l'objectif (trouver le trou de ver). Cet epic donne au joueur les outils visuels pour naviguer dans le système tout en conservant la tension d'exploration.

## Stories

### Story 35.1: Fog of War Exploration Module

As a player,
I want the large map to only reveal areas I have visited,
So that exploration feels meaningful and progressive.

**Acceptance Criteria:**

**Given** `src/systems/fogSystem.js` (nouveau module)
**When** imported
**Then** it exports: `resetFogGrid()`, `markDiscovered(playerX, playerZ, radius)`, `getDiscoveredCells()`, `FOG_GRID_SIZE` (const)

**Given** a 60×60 grid over a 4000×4000 world
**When** `markDiscovered(x, z, radius)` is called
**Then** all grid cells whose center falls within `radius` of `(x, z)` are marked as discovered
**And** cells are never un-marked (monotonic discovery)

**Given** GameLoop during gameplay
**When** executing (every 10 frames — use a frame counter mod 10)
**Then** `markDiscovered(playerX, playerZ, GAME_CONFIG.MINIMAP_VISIBLE_RADIUS)` is called
**And** the fog update does NOT happen during boss phase (`bossActive === true`)

**Given** system transition (tunnel → new system)
**When** GameLoop detects `prevPhaseRef === 'tunnel'` and enters gameplay
**Then** `resetFogGrid()` is called (new system = fresh exploration)

**Given** `useLevel.reset()`
**When** full game reset
**Then** `resetFogGrid()` is also called from the reset sequence in GameLoop

### Story 35.2: Large Map Overlay (Touche M)

As a player,
I want to open a large map with the M key to see my exploration progress without pausing the game,
So that I can plan my route while staying in danger.

**Acceptance Criteria:**

**Given** the M key is pressed during gameplay
**When** `phase === 'gameplay'` and game is not paused
**Then** the map overlay toggles (open / close); second press closes it
**And** `isPaused` remains `false` — the game continues running

**Given** the map overlay is open
**When** rendered
**Then** it covers ~80% of screen width and ~80% of screen height, centered
**And** background: `var(--rs-bg)` at 85% opacity (semi-transparent — gameplay visible behind)
**And** border: `1px solid var(--rs-border)`, clip-path angulaire (coin coupé haut-droite 16px)
**And** the game is still visible and running behind

**Given** the map contents
**When** rendered
**Then** fog cells that are NOT discovered are rendered dark (`var(--rs-bg)` à 95% opacity)
**And** fog cells that ARE discovered are rendered as a subtle lighter tone (`var(--rs-bg-raised)` à 60% opacity)
**And** discovered planets are shown as colored dots (CINDER `#a07855`, PULSE `#00b4d8`, VOID `#9b5de5`) with scan status (scanned = 30% opacity)
**And** the wormhole is shown if `wormholeState !== 'hidden'` as a pulsing violet dot (`var(--rs-violet)`)
**And** the player position is shown as a triangle SVG at correct map coordinates, rotating with `usePlayer.rotation`
**And** enemies are NOT shown on the large map
**And** cardinal directions (N S E W) are shown at map edges in `Space Mono`

**Given** the map overlay is open and the player moves
**When** positions are updated
**Then** the map refreshes at ~10fps (polling interval, not real-time subscription)

**Given** closing the map
**When** M is pressed again OR Escape is pressed
**Then** the overlay closes

### Story 35.3: Minimap Reskin — Carré, Triangle Joueur, Flèche Trou de Ver

As a player,
I want the minimap to show my direction of travel and point me toward the wormhole when it's off-screen,
So that navigation is intuitive without opening the full map.

**Acceptance Criteria:**

**Given** the minimap container
**When** rendered
**Then** shape is square with angular clip-path: `polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)` (pas de border-radius)
**And** border: `2px solid var(--rs-teal)` (remplace rgba cyan)
**And** background: `var(--rs-bg-surface)` (remplace `rgba(0,0,0,0.65)`)
**And** `MINIMAP.borderRadius` est supprimé ou ignoré

**Given** the player representation on minimap
**When** rendered
**Then** the player dot is replaced by a triangle SVG (▲) of size 8×10px, color `var(--rs-teal)`
**And** the triangle rotates with `usePlayer.rotation` (CSS `transform: rotate(${rotation}rad)`)
**And** the NESW compass labels remain fixed (ne tournent pas avec le joueur)

**Given** the wormhole is spawned (`wormholeState !== 'hidden'`)
**When** the wormhole IS within `MINIMAP_VISIBLE_RADIUS`
**Then** it is shown as a pulsing violet dot (comportement actuel préservé)

**Given** the wormhole is spawned
**When** the wormhole is OUTSIDE `MINIMAP_VISIBLE_RADIUS`
**Then** a small triangle arrow (SVG, color `var(--rs-violet)`, 6px) is positioned on the minimap edge
**And** the arrow points in the direction from player to wormhole
**And** position on edge = intersection of the direction vector with the minimap boundary

**Given** `wormholeState === 'hidden'`
**When** no wormhole exists
**Then** no arrow is shown

### Story 35.4: Quest Tracker HUD

As a player,
I want to see my current objective displayed below the minimap,
So that I always know what to do next without ambiguity.

**Acceptance Criteria:**

**Given** the quest tracker component rendered below the minimap
**When** `wormholeState === 'hidden'`
**Then** displays: `SCAN PLANETS` with progress `X / Y` where X = scanned count, Y = threshold count (e.g. `8 / 12`)
**And** the label uses Bebas Neue, color `var(--rs-teal)`

**Given** `wormholeState === 'visible'`
**When** quest tracker renders
**Then** displays: `LOCATE THE WORMHOLE`
**And** color `var(--rs-violet)` avec animation pulse lente (500ms alternate)

**Given** `bossActive === true`
**When** quest tracker renders
**Then** displays: `DESTROY THE GUARDIAN`
**And** color `var(--rs-danger)` avec animation pulse rapide (300ms alternate)

**Given** `wormholeState === 'reactivated'`
**When** quest tracker renders
**Then** displays: `ENTER THE WORMHOLE`
**And** color `var(--rs-violet)`, animation pulse lente

**Given** `phase === 'boss'` ou phase non-gameplay
**When** quest tracker renders
**Then** it is hidden (null)

**Given** quest tracker styling
**When** rendered
**Then** panel has `border-left: 3px solid currentQuestColor` + `var(--rs-bg-surface)` background
**And** width matches minimap width
**And** font: Bebas Neue (label), Space Mono (compteur X/Y)
**And** label text en UPPERCASE, `letter-spacing: 0.08em`

## Technical Notes

**fogSystem.js structure:**
```js
const FOG_GRID_SIZE = 60
const WORLD_SIZE = 4000  // 2 × PLAY_AREA_SIZE
const CELL_SIZE = WORLD_SIZE / FOG_GRID_SIZE  // ~66.7 units

const _grid = new Uint8Array(FOG_GRID_SIZE * FOG_GRID_SIZE)  // 0 = hidden, 1 = discovered

export function resetFogGrid() { _grid.fill(0) }

export function markDiscovered(wx, wz, radius) {
  // Convert world coords to grid, iterate cells in radius bounding box
}

export function getDiscoveredCells() { return _grid }  // read-only view
export { FOG_GRID_SIZE, CELL_SIZE }
```

**Wormhole edge arrow position:**
```js
// direction from player to wormhole
const dx = wormhole.x - playerX, dz = wormhole.z - playerZ
const angle = Math.atan2(dz, dx)
// Intersect ray with minimap square boundary (half-size = 50%)
// Use min(abs(cos), abs(sin)) to find which edge is hit first
const abscos = Math.abs(Math.cos(angle)), abssin = Math.abs(Math.sin(angle))
const scale = 0.5 / Math.max(abscos, abssin)
const edgeX = 50 + Math.cos(angle) * scale * 100  // %
const edgeZ = 50 + Math.sin(angle) * scale * 100  // %
```

**Quest tracker state derivation:**
```js
const scannedCount = planets.filter(p => p.scanned).length
const threshold = galaxyConfig ? Math.ceil(galaxyConfig.planetCount * galaxyConfig.wormholeThreshold) : 12
```

**Fog map rendering (canvas ou CSS grid):**
- Canvas 2D recommandé (60×60 px canvas, scaled up via CSS) pour performance
- `ctx.fillStyle` par cellule selon _grid value
- Planètes et wormhole dessinés par-dessus en SVG overlay

**Files touched:**
- `src/systems/fogSystem.js` (nouveau) — module fog of war (35.1)
- `src/GameLoop.jsx` — fog update toutes les 10 frames, resetFogGrid on transition (35.1)
- `src/ui/MapOverlay.jsx` (nouveau) — grande carte (35.2)
- `src/ui/HUD.jsx` — minimap reskin + player triangle + wormhole arrow + quest tracker (35.3, 35.4)
- `src/ui/QuestTracker.jsx` (nouveau) — composant quest isolé (35.4)

## Dependencies

- Epic 34 — galaxyConfig.planetCount et wormholeThreshold (pour QuestTracker compteur)
- Story 34.4 — wormhole scan-based trigger (wormholeState change au scan, pas au timer)
- Epic 30 (Companion) — les dialogues wormhole-spawn sont déclenchés depuis GameLoop, pas ce composant

## Success Metrics

- La grande carte s'ouvre et se ferme avec M sans freezer le jeu (QA: enemies bougent derrière)
- Les zones explorées s'accumulent correctement entre les ouvertures de carte (QA: navigation test)
- Le triangle joueur sur minimap pointe dans la direction de mouvement (QA: cercle complet)
- La flèche trou de ver s'affiche correctement sur le bord de la minimap quand hors radar (QA: spawn à 800u)
- Le quest tracker passe de "SCAN PLANETS 0/12" à "LOCATE THE WORMHOLE" au 12e scan (QA)
- La minimap est visuellement dans le style Redshift (QA: aucun anti-pattern)
