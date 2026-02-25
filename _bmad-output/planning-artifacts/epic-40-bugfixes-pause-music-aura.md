# Epic 40: Bugfixes — Pause/LevelUp Visuals, Music Retry, Planet Aura Color

Trois bugs ciblés corrigés : les effets visuels de combat (damage numbers, camera shake) ne persistent plus pendant la pause ou le level-up, la musique reprend correctement après un retry depuis le game over, et l'aura de capture des planètes utilise désormais la couleur de la planète plutôt qu'un code couleur tier générique.

## Epic Goals

- Corriger les damage numbers et le camera shake qui restent actifs (ou boucle) pendant la pause / level-up modal
- Corriger la musique de jeu qui ne se relance pas après un retry depuis le game over
- Corriger la couleur de l'aura de capture des planètes pour qu'elle corresponde à la couleur visuelle de la planète

## Epic Context

Après l'Epic 34 (galaxy system) qui a introduit de nouveaux types de planètes avec leurs propres couleurs, et après les Epics 32-33 qui ont enrichi le combat et l'UI, trois bugs de polish persistent. L'aura utilise un mapping tier→couleur générique (gris/or/cyan) qui ne correspond plus aux nouvelles couleurs de planètes (brun/bleu/violet). Pendant la pause, le `DamageNumberRenderer` et le camera shake continuent de s'exécuter car leurs `useFrame` ne vérifient pas `isPaused`. Enfin, dans `useAudio.jsx`, le handler `systemEntry` ne couvre pas le cas `prevPhase === 'gameOver'`, laissant la musique silencieuse après un retry.

## Stories

### Story 40.1: Fix Damage Numbers & Camera Shake During Pause / LevelUp

As a player,
I want damage numbers and screen shake to stop when the game is paused or the level-up modal appears,
So that the UI is clean and no combat effects loop or remain frozen on screen during pauses.

**Acceptance Criteria:**

**Given** the game is paused (`isPaused === true`) or in `levelUp` / `planetReward` phase
**When** damage numbers are active from the last combat frame
**Then** they are hidden immediately — no frozen numbers remain visible over the pause / level-up UI
**And** they resume normally when the game is unpaused

**Given** the camera shake timer (`cameraShakeTimer > 0`)
**When** the game is paused or in a modal phase
**Then** no camera shake offset is applied to the camera position
**And** the shake resumes if the timer is still running when the game unpauses

**Given** the normal gameplay flow
**When** the game is not paused
**Then** damage numbers and camera shake behave exactly as before (no regression)

**Given** the implementation
**When** fixing DamageNumberRenderer
**Then** in `DamageNumberRenderer.useFrame`, add an early return guard: `if (useGame.getState().isPaused) { hide all divs; return }`
**When** fixing camera shake
**Then** in `usePlayerCamera.useFrame`, skip calling `computeCameraFrame` with a non-zero shake timer if `isPaused` — or pass `cameraShakeTimer: 0` override when paused

### Story 40.2: Fix Gameplay Music Not Restarting After Game Over Retry

As a player,
I want the gameplay music to restart when I click Retry after a game over,
So that I don't play in silence after dying.

**Acceptance Criteria:**

**Given** the player clicks Retry on the game over screen
**When** `startGameplay()` is called and phase transitions to `systemEntry` with `prevPhase === 'gameOver'`
**Then** the gameplay music starts (crossfade from silence) with a random track selected from `ASSET_MANIFEST.gameplay.audio.gameplayMusic`
**And** the music is audible at the normal gameplay volume

**Given** the same flow for victory retry (VictoryScreen also calls `startGameplay()`)
**When** phase transitions to `systemEntry` with `prevPhase === 'victory'`
**Then** the gameplay music also restarts correctly (same fix covers both cases)

**Given** the existing transitions (menu → systemEntry, tunnel → systemEntry)
**When** the fix is applied
**Then** those transitions continue to work exactly as before (no regression)

**Given** the implementation
**When** fixing `useAudio.jsx`
**Then** in the `systemEntry` handler, extend the existing condition to include `prevPhase === 'gameOver'` and `prevPhase === 'victory'` as cases that trigger a `crossfadeMusic(selectedTrack, 1000)`

### Story 40.3: Fix Planet Capture Aura Color to Match Planet Color

As a player,
I want the glowing aura around a planet to match the planet's visual color,
So that the capture zone feels cohesive with the planet I'm approaching.

**Acceptance Criteria:**

**Given** a `PLANET_CINDER` planet (standard tier, brown `#a07855`)
**When** the player enters its scan radius
**Then** the aura glow is brown/amber — matching the planet's color — not grey (silver)

**Given** a `PLANET_PULSE` planet (rare tier, blue `#00b4d8`)
**When** the player enters its scan radius
**Then** the aura glow is blue — matching the planet's color — not yellow (gold)

**Given** a `PLANET_VOID` planet (legendary tier, purple `#9b5de5`)
**When** the player enters its scan radius
**Then** the aura glow is purple — matching the planet's color — not cyan (platinum)

**Given** the completed aura (already scanned planet with `SHOW_COMPLETED_AURA`)
**When** rendered
**Then** it still uses `COMPLETED_COLOR` from config (behavior unchanged)

**Given** the implementation
**When** fixing `PlanetAuraRenderer.jsx`
**Then** remove the `TIER_COLOR_KEY` mapping
**And** use `PLANETS[planet.typeId].color` directly as the aura color instead
**And** the `SILVER_COLOR`, `GOLD_COLOR`, `PLATINUM_COLOR` keys in `GAME_CONFIG.PLANET_AURA` can be left in place (harmless) or removed as part of cleanup

## Technical Notes

**Story 40.1 — DamageNumberRenderer:**
- Dans `DamageNumberRenderer.useFrame` (src/ui/DamageNumberRenderer.jsx:59), lire `useGame.getState().isPaused` au début. Si `true`, masquer tous les divs (`div.style.display = 'none'`) et retourner.
- Pour le camera shake : dans `usePlayerCamera.useFrame` (src/hooks/usePlayerCamera.jsx:50), passer `cameraShakeTimer: 0` quand `isPaused` pour éviter le shake figé. Ou bypasser entièrement `computeCameraFrame` en faveur d'un simple suivi de position sans shake.

**Story 40.2 — Music Retry:**
- Dans `useAudio.jsx` ligne 115, changer la condition de :
  ```js
  if (prevPhase === 'menu' || prevPhase === 'shipSelect' || prevPhase === 'galaxyChoice') {
  ```
  en :
  ```js
  if (prevPhase === 'menu' || prevPhase === 'shipSelect' || prevPhase === 'galaxyChoice' || prevPhase === 'gameOver' || prevPhase === 'victory') {
  ```
- Le `selectedTrack` est déjà calculé avant ce `if`, donc aucun autre changement n'est nécessaire.

**Story 40.3 — Aura Color:**
- Dans `PlanetAuraRenderer.jsx` (lignes 11-15), supprimer `TIER_COLOR_KEY`.
- À la ligne 125-128, remplacer :
  ```js
  const colorKey = planet.scanned && cfg.SHOW_COMPLETED_AURA
    ? 'COMPLETED_COLOR'
    : TIER_COLOR_KEY[planet.tier]
  tempColor.set(cfg[colorKey] || '#ffffff')
  ```
  par :
  ```js
  const color = planet.scanned && cfg.SHOW_COMPLETED_AURA
    ? cfg.COMPLETED_COLOR
    : PLANETS[planet.typeId].color
  tempColor.set(color || '#ffffff')
  ```

## Dependencies

- Story 27.1 (DamageNumberRenderer) — Story 40.1 modifie ce composant
- Story 4.6 (Camera Shake) — Story 40.1 modifie `usePlayerCamera`
- Story 26.1 (Random Music) — Story 40.2 étend la logique existante sans la casser
- Story 12.3 (Planet Aura System) — Story 40.3 modifie `PlanetAuraRenderer`
- Epic 34.1 (Galaxy Profile / Planet Redesign) — a introduit les nouvelles couleurs de planètes

## Success Metrics

- Aucun damage number visible pendant la pause ou le level-up modal (QA visuel)
- Aucun screen shake pendant la pause (QA visuel)
- Musique audible dès le premier frame de gameplay après un retry (QA audio)
- Aura couleur brune sur CINDER, bleue sur PULSE, violette sur VOID (QA visuel)
