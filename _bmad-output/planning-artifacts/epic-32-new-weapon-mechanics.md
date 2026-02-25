# Epic 32: New Weapon Mechanics Implementation

Implémentation des 6 nouvelles armes définies en Epic 31 : logique de tir, rendu 3D, collisions, comportements spéciaux (rotation orbitale, aura permanente, mines de proximité, frappe tactique à distance). Chaque arme a une mécanique distincte qui ne se réduit pas à "projectile vers curseur".

## Epic Goals

- Implémenter LASER_CROSS : croix de 4 rayons rotatifs centrés sur le vaisseau
- Implémenter MAGNETIC_FIELD : aura AOE permanente autour du joueur
- Implémenter DIAGONALS : 4 projectiles en X suivant l'angle curseur
- Implémenter SHOCKWAVE : 2-3 arcs d'onde expansive vers le curseur
- Implémenter MINE_AROUND : 3 mines orbitales explosant au contact ennemi
- Implémenter TACTICAL_SHOT : frappe instantanée sur ennemi aléatoire à distance
- Retirer le flag `implemented: false` des stubs (Epic 31.1) une fois chaque arme opérationnelle
- Implémenter le pulse visuel de EXPLOSIVE_ROUND (onde sphérique pulsante en vol)

## Epic Context

Les stubs de données sont posés en Epic 31. Chaque nouvelle arme nécessite une mécanique de tir non-standard que le système de projectiles actuel (`useWeapons`, `GameLoop`) ne couvre pas encore. LASER_CROSS et MAGNETIC_FIELD ne génèrent pas de projectiles au sens traditionnel — ils agissent directement dans l'espace autour du vaisseau. TACTICAL_SHOT frappe sans projectile visible. SHOCKWAVE et MINE_AROUND introduisent des comportements (expansion radiale, explosion de proximité) qui étendent le système de collisions existant. Chaque story de cet epic est indépendante et peut être parallélisée.

## Stories

### Story 32.1: LASER_CROSS — Rotating Cross Beams

As a player,
I want to equip a weapon that projects 4 rotating laser arms around my ship,
So that I deal continuous damage to enemies around me without aiming.

**Acceptance Criteria:**

**Given** LASER_CROSS is equipped
**When** the weapon is in its active phase
**Then** 4 beam arms extend from the ship center at 90° intervals, rotating at `rotationSpeed` rad/sec
**And** each arm is `armLength` units long and `armWidth` units wide (based on `baseArea`)
**And** the arms are colored `#9b5de5` with a subtle glow
**And** enemies overlapping any arm take `baseDamage` per second (continuous, not per-frame spike)

**Given** the active/inactive cycle
**When** `activeTime` seconds have elapsed
**Then** all 4 arms disappear and the weapon enters inactive phase for `inactiveTime` seconds
**And** a subtle visual cue (fade out) signals the transition
**And** when inactive phase ends, arms reappear and resume rotating

**Given** no cursor dependency
**When** the player moves or aims
**Then** the cross rotation is independent of aim direction — it always rotates in world space

**Given** poolLimit
**When** LASER_CROSS is active
**Then** it occupies exactly 1 slot in the active weapon list (the 4 arms are not separate projectile entities)

### Story 32.2: MAGNETIC_FIELD — Permanent Aura Zone

As a player,
I want to equip a passive aura weapon that continuously damages nearby enemies,
So that I have always-on area control without needing to aim.

**Acceptance Criteria:**

**Given** MAGNETIC_FIELD is equipped
**When** the game is in gameplay phase
**Then** a semi-transparent disc is always visible around the player at `auraRadius` units
**And** the disc has a pulsing edge glow in `#c084fc` (pulse scale 0.95 → 1.05 at ~1Hz)
**And** the disc does NOT block or occlude the player's view of the game

**Given** damage ticks
**When** an enemy is within `auraRadius`
**Then** it takes `damagePerSecond / 4` damage every 0.25 seconds (tick rate)
**And** the damage applies to ALL enemies within range simultaneously
**And** the damage scales with the weapon's `damageMultiplier` from procédural upgrades

**Given** area upgrades
**When** `areaMultiplier` increases via upgrade
**Then** the visible disc radius scales accordingly: `effectiveRadius = auraRadius * areaMultiplier`

**Given** poolLimit = 1
**When** MAGNETIC_FIELD is equipped
**Then** only one aura instance exists at all times (no stacking)

### Story 32.3: DIAGONALS — Cursor-Tracked X Pattern

As a player,
I want to fire 4 projectiles in an X pattern rotated toward my cursor,
So that I can cover multiple angles while still having directional control.

**Acceptance Criteria:**

**Given** DIAGONALS fires
**When** the cooldown expires
**Then** 4 projectiles are spawned simultaneously at 45° / 135° / 225° / 315° relative to the cursor angle
**And** each projectile travels at `baseSpeed` units/sec along its spawn angle
**And** each projectile deals `baseDamage` on hit (independent collisions)
**And** projectiles are colored `#48cae4`

**Given** cursor rotation
**When** the player aims at a different direction
**Then** the entire X pattern rotates so one arm always points closest to the cursor direction
**And** if no cursor is active (keyboard-only mode), the X aligns with the ship's facing direction

**Given** poolLimit
**When** DIAGONALS fires rapidly
**Then** at most `poolLimit` total projectiles from this weapon are active simultaneously
**And** if at poolLimit, the oldest projectile despawns before spawning new ones

**Given** standard projectile behavior
**When** a DIAGONALS projectile hits an enemy or reaches `projectileLifetime`
**Then** it despawns normally (same as LASER_FRONT collision system)

### Story 32.4: SHOCKWAVE — Arc Wave Burst

As a player,
I want to emit expanding arc waves toward my cursor that push enemies back hard,
So that I have a powerful area-denial and crowd-control tool.

**Acceptance Criteria:**

**Given** SHOCKWAVE fires
**When** the cooldown expires
**Then** `waveCount` (3) arcs are emitted in sequence with `waveDelay` seconds between each
**And** each arc spans `waveSectorAngle` radians (~120°) centered on the cursor direction
**And** each arc expands outward at `waveExpandSpeed` units/sec from radius 0 to `waveMaxRadius`
**And** arcs are rendered as thin curved lines/meshes in `#f9e547` that fade as they expand

**Given** enemy contact
**When** an expanding arc passes through an enemy's position
**Then** the enemy takes `baseDamage` damage once per arc (not per frame)
**And** the enemy receives a strong knockback impulse in the arc's outward direction (`knockbackStrength`)

**Given** area upgrades
**When** `areaMultiplier` increases
**Then** `waveMaxRadius` scales: `effectiveMaxRadius = waveMaxRadius * areaMultiplier`

**Given** poolLimit = 9
**When** multiple SHOCKWAVE bursts are active
**Then** at most 9 arc instances (3 bursts × 3 arcs) exist simultaneously

### Story 32.5: MINE_AROUND — Orbiting Proximity Mines

As a player,
I want mines to orbit my ship and explode when enemies come close,
So that I have automated defensive area control without aiming.

**Acceptance Criteria:**

**Given** MINE_AROUND is equipped
**When** the game is in gameplay phase
**Then** up to `mineCount` (3) mine spheres orbit the player at `orbitalRadius` units
**And** mines are evenly spaced angularly (120° apart for 3 mines)
**And** mines are colored `#06d6a0`, sphere-shaped, with a subtle pulsing scale

**Given** proximity detection
**When** an enemy comes within `mineDetectionRadius` of a mine
**Then** the mine explodes immediately
**And** all enemies within `explosionRadius` take `baseDamage` damage
**And** enemies in blast radius receive knockback proportional to `knockbackStrength`
**And** the explosion is accompanied by a brief visual flash (AOE ring or particle burst)

**Given** mine respawn
**When** a mine has exploded
**Then** that mine slot is empty for `mineRespawnTime` seconds
**And** after the timer, a new mine spawns and joins the orbit formation
**And** remaining mines maintain their orbit throughout (no position reset)

**Given** no cursor dependency
**When** the player aims
**Then** mine orbit continues independently of cursor or ship facing direction

### Story 32.6: TACTICAL_SHOT — Remote Strike

As a player,
I want my weapon to automatically strike a random nearby enemy with an instant lightning-like hit,
So that I have smart targeting that doesn't require me to aim.

**Acceptance Criteria:**

**Given** TACTICAL_SHOT fires
**When** the cooldown expires
**Then** a random enemy within `detectionRadius` is selected as target
**And** if no enemy is in range, the weapon skips the shot (no visual, cooldown still ticks)

**Given** the strike
**When** a target is selected
**Then** a brief visual flash/strike effect appears directly at the enemy's world position
**And** the effect lasts `strikeVfxDuration` seconds and is colored `#2dc653`
**And** the effect does NOT travel from the player — it appears instantly at the target
**And** the targeted enemy takes `baseDamage` damage immediately

**Given** the AOE
**When** the strike lands
**Then** all enemies within `strikeAoeRadius` of the impact point take `baseDamage * 0.5` splash damage
**And** the AOE is visualized by a brief expanding ring at `#2dc653` (fades in 0.3s)

**Given** target selection fairness
**When** multiple enemies are in range
**Then** selection is uniformly random among all valid targets
**And** the same enemy is not guaranteed to be targeted consecutively (re-roll if same as last target when pool > 1)

### Story 32.7: EXPLOSIVE_ROUND — Pulse Visual Update

As a player,
I want the Explosive Round to look like a pulsing energy sphere rather than a static box,
So that its visual identity matches its explosive, volatile nature.

**Acceptance Criteria:**

**Given** an EXPLOSIVE_ROUND projectile in flight
**When** rendered each frame
**Then** it is displayed as a sphere (`[1.4, 1.4, 1.4]` scale) not an elongated mesh
**And** it pulses in scale between 0.9 and 1.2 at ~8Hz during flight
**And** the base color is `#f4c430` with an emissive glow that pulses in sync with the scale

**Given** the explosion on impact
**When** the projectile hits an enemy or reaches max lifetime
**Then** the explosion AOE ring expands outward as a flat disc (not a sphere)
**And** the disc fades from `#f4c430` to transparent as it expands to `explosionRadius`

### Story 32.8: Dead Code Cleanup — Remove Unused Weapon Fields

As a developer,
I want to remove dead code fields from all weapon definitions,
So that the weapon schema is minimal, consistent, and doesn't mislead future contributors.

**Acceptance Criteria:**

**Given** the 6 new weapons (LASER_CROSS, MAGNETIC_FIELD, DIAGONALS, SHOCKWAVE, MINE_AROUND, TACTICAL_SHOT)
**When** I inspect their definitions in `weaponDefs.js`
**Then** `upgrades[]` arrays are removed from all 6 (never read by game code — procedural system handles upgrades)
**And** `rarityDamageMultipliers` is removed from all 5 that have it (LASER_CROSS, MAGNETIC_FIELD, SHOCKWAVE, MINE_AROUND, TACTICAL_SHOT)
**And** the `DEFAULT_RARITY_DMG` export constant is removed entirely (no consumers)

**Given** LASER_CROSS
**When** I inspect its definition
**Then** `implemented: false` is removed (was supposed to be removed in Story 32.1 AC#8 but was missed)

**Given** all 10 weapons
**When** I inspect the file
**Then** every weapon has exactly the fields consumed by game code — no orphan fields remain
**And** existing tests in `weaponDefs.test.js` are updated to reflect the removal (no test expects `upgrades` or `rarityDamageMultipliers`)

### Story 32.9: Legacy Weapon Schema Alignment — Add `weaponType` Discriminator

As a developer,
I want the 4 legacy weapons (LASER_FRONT, SPREAD_SHOT, BEAM, EXPLOSIVE_ROUND) to have a `weaponType` field,
So that the schema is uniform across all 10 weapons and `useWeapons.tick()` can be simplified with a single dispatch pattern.

**Acceptance Criteria:**

**Given** LASER_FRONT
**When** I inspect its definition
**Then** it has `weaponType: 'projectile'`

**Given** SPREAD_SHOT
**When** I inspect its definition
**Then** it has `weaponType: 'projectile'`

**Given** BEAM
**When** I inspect its definition
**Then** it has `weaponType: 'beam_continuous'`

**Given** EXPLOSIVE_ROUND
**When** I inspect its definition
**Then** it has `weaponType: 'projectile_explosion'`

**Given** `useWeapons.tick()`
**When** processing weapons
**Then** existing behavior is unchanged — the `weaponType` field is additive (no logic change in this story, enables future refactors)

**Given** `weaponDefs.test.js`
**When** all tests run
**Then** a new test validates every weapon has a `weaponType` string field
**And** all existing tests pass

## Technical Notes

**Rendering approach per weapon:**
- LASER_CROSS: mesh group parented to player position in R3F, rotating via useFrame
- MAGNETIC_FIELD: single `<mesh>` with transparent disc geometry + animated shader or scale
- DIAGONALS: extends existing projectile spawning system (4 spawns per fire event)
- SHOCKWAVE: arc meshes spawned as short-lived entities, scaled per frame via useFrame
- MINE_AROUND: 3 persistent mesh instances following player, proximity check in GameLoop
- TACTICAL_SHOT: ephemeral VFX component spawned at enemy worldPosition

**Collision integration:**
- LASER_CROSS: per-frame arm segment vs enemy AABB check in GameLoop
- MAGNETIC_FIELD: per-tick radius check in GameLoop (same as existing AOE pattern)
- SHOCKWAVE: expanding radius check clamped to sector angle
- MINE_AROUND: proximity check per mine per frame
- TACTICAL_SHOT: no collision — direct damage call on selected enemy

**`implemented` flag removal:**
Each story removes `implemented: false` from its weapon stub in `weaponDefs.js` as its final task, which auto-includes the weapon in the progression pool.

## Dependencies

- Epic 31 (Weapon Data & Upgrade System) — weapon stubs must exist before mechanics
- Story 2.6 / 11.3 (Projectile system) — DIAGONALS reuses existing projectile infrastructure
- Story 27.x (Combat feedback) — explosion VFX patterns reused for MINE_AROUND and TACTICAL_SHOT

## Success Metrics

- All 6 weapons fire and deal damage in a live game session (QA: equip each, verify kills)
- LASER_CROSS never requires aiming — rotation is fully independent of cursor (QA: keyboard-only mode)
- MAGNETIC_FIELD aura scales visually when area is upgraded (QA: upgrade area, check disc radius)
- MINE_AROUND mines respawn after explosion within expected timer (QA: stopwatch test)
- TACTICAL_SHOT VFX appears at the enemy, not at the player (QA: visual check from distance)
- EXPLOSIVE_ROUND sphere pulses visibly during flight (QA: slow-motion capture or visual check)
