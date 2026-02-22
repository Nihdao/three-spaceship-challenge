# Epic 34: Galaxy System Foundation & Planet Redesign

Activation du système galaxie en gameplay : enrichissement de `galaxyDefs.js` avec les paramètres de simulation, refonte des définitions planètes (CINDER / PULSE / VOID), génération procédurale luck-weighted, spawn joueur aléatoire, noms de systèmes procéduraux, et remplacement du déclencheur de trou de ver timer-based par un déclencheur basé sur les scans.

## Epic Goals

- Enrichir `galaxyDefs.js` avec le profil gameplay complet d'Andromeda Reach (planètes, ennemis, difficulté)
- Renommer et restyler les 3 types de planètes en CINDER / PULSE / VOID (palette Redshift)
- Réécrire `initializePlanets()` pour générer 15 planètes luck-weighted depuis le profil galaxie
- Spawner le joueur à une position aléatoire (pas toujours au centre)
- Générer un nom de système aléatoire depuis le pool galaxie à chaque entrée de système
- Remplacer le déclencheur timer du trou de ver par le seuil de scan (75% des planètes)
- Brancher `enemySpeedMult` et `difficultyScalingPerSystem` depuis le profil galaxie vers GameLoop

## Epic Context

`galaxyDefs.js` est actuellement vide de gameplay — la sélection de galaxie n'a aucun effet sur la simulation. `selectedGalaxyId` est stocké dans `useGame` mais jamais lu par GameLoop ou `useLevel`. Le trou de ver spawn via `WORMHOLE_SPAWN_TIMER_THRESHOLD = 0.01` (quasi-immédiat), ce qui ne crée aucune boucle d'exploration. Les planètes sont codées en dur (4 Silver + 2 Gold + 1 Platinum = 7 total), toujours générées au centre, sans influence de la luck. Le joueur spawn toujours en `[0, 0, 0]`. Cet epic pose les fondations de ce que la galaxie signifie en gameplay et transforme l'exploration en objectif central.

## Profil Andromeda Reach (référence de design)

```
Galaxie    : Andromeda Reach
Systèmes   : 3
Planètes   : 15 par système
Threshold  : 75% → 12 planètes scannées déclenchent le trou de ver
Distribution base (luck=0) : 8 Standard / 5 Rare / 2 Légendaires
luckRarityBias par +1 luck  : standard -0.15 / rare +0.10 / legendary +0.05
  → À luck=8 : ~6.8 Standard / 5.8 Rare / 2.4 Légendaires (normalisé à 15)
galaxyRarityBias            : 0.0 (neutre — référence absolue pour les autres galaxies)
enemySpeedMult              : 1.5 (+50% vitesse de base)
difficultyScalingPerSystem  : { hp: 1.25, damage: 1.20, speed: 1.10, xpReward: 1.15 }
  → Système 2 = scaling^1, Système 3 = scaling^2
```

## Typage planètes Redshift

```
PLANET_CINDER  (Standard)  : #a07855 / emissive #6b4c2a 0.2  / scale [8,8,8]   / scanTime 5s  / scanRadius 40
PLANET_PULSE   (Rare)      : #00b4d8 / emissive #0096c7 0.6  / scale [12,12,12]/ scanTime 10s / scanRadius 50
PLANET_VOID    (Legendary) : #9b5de5 / emissive #7b45c5 1.0  / scale [16,16,16]/ scanTime 18s / scanRadius 60
```

## Stories

### Story 34.1: Galaxy Profile Enrichment & Planet Type Redesign

As a developer,
I want `galaxyDefs.js` to carry the full gameplay profile of Andromeda Reach and `planetDefs.js` to use the CINDER/PULSE/VOID nomenclature,
So that all downstream systems can derive their parameters from a single authoritative data source.

**Acceptance Criteria:**

**Given** `galaxyDefs.js`
**When** `getGalaxyById('andromeda_reach')` is called
**Then** the returned object includes: `planetCount: 15`, `wormholeThreshold: 0.75`, `planetRarity: { standard: 8, rare: 5, legendary: 2 }`, `luckRarityBias: { standard: -0.15, rare: 0.10, legendary: 0.05 }`, `galaxyRarityBias: 0`, `enemySpeedMult: 1.5`, `difficultyScalingPerSystem: { hp: 1.25, damage: 1.20, speed: 1.10, xpReward: 1.15 }`, `systemNamePool: [array of ≥12 names]`

**Given** `planetDefs.js`
**When** the planet types are enumerated
**Then** `PLANET_CINDER` (Standard), `PLANET_PULSE` (Rare), `PLANET_VOID` (Legendary) exist with the Redshift color palette
**And** `PLANET_SILVER`, `PLANET_GOLD`, `PLANET_PLATINUM` are removed
**And** tous les fichiers qui référençaient les anciens types sont mis à jour (useLevel, tests, HUD)

**Given** planet tier field
**When** any planet def is read
**Then** `tier` is one of: `'standard'`, `'rare'`, `'legendary'`

### Story 34.2: Luck-Weighted Planet Generation & Random Player Spawn

As a player,
I want planets to be generated with luck-influenced rarity and to start each system at a random position,
So that every run feels different and investing in luck is visually rewarding.

**Acceptance Criteria:**

**Given** `initializePlanets(galaxyConfig)` called on system entry
**When** executed with Andromeda Reach config at luck=0
**Then** exactly 15 planets are generated, distributed ~8 CINDER / ~5 PULSE / ~2 VOID via weighted random
**And** at luck=8, the distribution shifts measurably toward PULSE and VOID

**Given** luck-weighted rarity roll
**When** a planet's type is rolled
**Then** effective weights = `base + luckRarityBias * getLuckValue()`, clamped to minimum 0 for each rarity
**And** weights are re-normalized to sum to `planetCount` before distribution

**Given** player spawn position on system entry
**When** a new system begins (new run or tunnel transition)
**Then** player spawns at a random position `(x, z)` with `x, z ∈ [-1200, +1200]` (uniform random)
**And** position is NOT always `[0, 0, 0]`
**And** `usePlayer.reset()` and system-entry code use this randomized spawn

### Story 34.3: Procedural System Names

As a player,
I want each system to display a unique randomly-generated name,
So that every run feels like a different expedition.

**Acceptance Criteria:**

**Given** `useLevel` state
**When** the store is initialized
**Then** it contains `currentSystemName: null` and a set of `usedSystemNames` (per-run tracking)

**Given** system entry (new run or tunnel transition)
**When** `initializeSystemName(pool)` is called
**Then** a name is picked randomly from `galaxyConfig.systemNamePool` excluding already-used names for this run
**And** `currentSystemName` is set to that name
**And** `SystemNameBanner` reads `currentSystemName` from `useLevel` (not hardcoded)

**Given** reset
**When** `useLevel.reset()` is called
**Then** `currentSystemName: null` and `usedSystemNames: []` are reset

### Story 34.4: Wormhole Scan-Based Trigger

As a player,
I want the wormhole to appear after scanning 75% of system planets,
So that exploration is the primary objective and the timer is pressure — not the trigger.

**Acceptance Criteria:**

**Given** the wormhole spawn logic in GameLoop
**When** a scan completes (`scanResult.completed === true`)
**Then** the count of scanned planets is checked against `Math.ceil(galaxyConfig.planetCount * galaxyConfig.wormholeThreshold)` (= 12 for Andromeda)
**And** if threshold is met and `wormholeState === 'hidden'`, `spawnWormhole()` is called
**And** the timer-based spawn (`newTimer >= threshold`) is removed

**Given** `WORMHOLE_SPAWN_TIMER_THRESHOLD` in `gameConfig.js`
**When** reviewed post-story
**Then** it is either removed or clearly marked deprecated (no gameplay usage)

**Given** the timer
**When** the system timer expires before the wormhole spawns
**Then** game over is still triggered (timer pressure unchanged)

**Given** edge case: all planets scanned before timer
**When** wormhole is already `visible` or beyond
**Then** scanning more planets has no effect on wormhole state (idempotent check)

### Story 34.5: Enemy Speed & Difficulty from Galaxy Profile

As a developer,
I want enemy speed and per-system difficulty scaling to be driven by the galaxy profile,
So that different galaxies can have distinct feels without modifying hardcoded config.

**Acceptance Criteria:**

**Given** `spawnEnemies()` in GameLoop
**When** enemies are spawned in Andromeda Reach
**Then** each enemy's base speed is multiplied by `galaxyConfig.enemySpeedMult` (1.5) in addition to existing system scaling
**And** the effective speed for FODDER_BASIC at system 1 is ≥ 25 (17 × 1.5)

**Given** per-system difficulty scaling
**When** entering system N of Andromeda Reach
**Then** HP multiplier = `galaxyConfig.difficultyScalingPerSystem.hp ^ (N-1)` (system 1: ×1.0, system 2: ×1.25, system 3: ×1.5625)
**And** same formula applies to damage, speed, xpReward multipliers
**And** these galaxy-derived multipliers REPLACE `GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM` for galaxies that define `difficultyScalingPerSystem`

**Given** `GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM`
**When** a galaxy defines `difficultyScalingPerSystem`
**Then** the galaxy config takes precedence; `ENEMY_SCALING_PER_SYSTEM` is used as fallback only if no galaxy scaling is defined

## Technical Notes

**Andromeda Reach `systemNamePool`:**
```
'IRON REACH', 'SHATTERED VEIL', 'DEAD ORBIT', 'BURNING FRONT',
'ASHEN BELT', 'VOID CORONA', 'FRACTURE ZONE', 'BLEEDING ARM',
'DUST CORRIDOR', 'SILENT WRECK', 'PALE MARGIN', 'SULFUR TIDE',
'CINDER GATE', 'RUST MERIDIAN', 'TORN NEBULA', 'COLLAPSED RIM'
```

**Luck-weighted roll:**
```js
function rollPlanetTypes(galaxyConfig, luckValue) {
  const bias = galaxyConfig.luckRarityBias
  const base = galaxyConfig.planetRarity
  const weights = {
    standard:  Math.max(0.5, base.standard  + bias.standard  * luckValue),
    rare:      Math.max(0,   base.rare      + bias.rare      * luckValue),
    legendary: Math.max(0,   base.legendary + bias.legendary * luckValue),
  }
  const total = weights.standard + weights.rare + weights.legendary
  // Normalize and distribute across planetCount via weighted random
}
```

**difficultyScalingPerSystem formula:**
```js
const systemIndex = currentSystem - 1 // 0-based
const scaling = galaxyConfig.difficultyScalingPerSystem
const hpMult   = Math.pow(scaling.hp,       systemIndex)
const dmgMult  = Math.pow(scaling.damage,   systemIndex)
const spdMult  = Math.pow(scaling.speed,    systemIndex) * galaxyConfig.enemySpeedMult
const xpMult   = Math.pow(scaling.xpReward, systemIndex)
```

**Player spawn in reset/initSystem:**
```js
const spawnRange = 1200
const spawnX = (Math.random() * 2 - 1) * spawnRange
const spawnZ = (Math.random() * 2 - 1) * spawnRange
usePlayer.getState().setPosition([spawnX, 0, spawnZ])
```

**Files touched:**
- `src/entities/galaxyDefs.js` — profil Andromeda Reach enrichi (34.1)
- `src/entities/planetDefs.js` — CINDER / PULSE / VOID (34.1)
- `src/stores/useLevel.jsx` — initializePlanets(config), currentSystemName, usedSystemNames (34.2, 34.3, 34.4)
- `src/stores/usePlayer.jsx` — randomized spawn in reset + setPosition (34.2)
- `src/GameLoop.jsx` — wormhole trigger sur scan, galaxy config lu via selectedGalaxyId, enemy scaling (34.4, 34.5)
- `src/ui/HUD.jsx` — références PLANET_SILVER/GOLD/PLATINUM → CINDER/PULSE/VOID (34.1)
- `src/ui/SystemNameBanner.jsx` — lit currentSystemName depuis useLevel (34.3)
- Tests concernés : useLevel.scanning, useLevel.wormhole, useLevel.planets, useLevel.system

## Dependencies

- Epic 5 (Planet Scanning) — scanningTick() réutilisé
- Epic 6 (Wormhole) — spawnWormhole() réutilisé
- Story 25.3 (Galaxy Choice) — selectedGalaxyId en place dans useGame
- Epic 29 (System Name Banner) — SystemNameBanner existant à rebrancher

## Success Metrics

- 15 planètes générées par système (QA: console.log planets.length)
- Distribution planètes shifted vers rare/legendary avec luck=8 vs luck=0 (QA: 10 runs comparés)
- Joueur ne commence jamais à [0,0,0] sur 10 parties consécutives (QA: log position)
- Le trou de ver n'apparaît jamais avant la 12e planète scannée (QA: tous les scans < 12 → wormholeState resté 'hidden')
- Vitesse FODDER_BASIC en jeu ≥ 25 unités/s (QA: console.log enemy.speed)
- Système 3 d'Andromeda Reach nettement plus dur que système 1 (QA: ressenti)
- Chaque système a un nom différent sur 3 systèmes consécutifs (QA: 5 runs)
