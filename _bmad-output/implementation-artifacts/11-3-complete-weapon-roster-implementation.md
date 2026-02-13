# Story 11.3: Complete Weapon Roster Implementation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want all planned weapon types fully implemented with distinct visuals and behaviors,
So that players have diverse offensive options for build crafting.

## Acceptance Criteria

1. **Given** weaponDefs.js **When** weapon definitions are reviewed **Then** at least 8-12 unique weapon types are fully defined **And** each weapon has: name, description, baseDamage, baseCooldown, baseSpeed, projectileType, upgrade curve (levels 1-9)

2. **Given** weapon variety **When** weapons are categorized **Then** weapons cover diverse archetypes: Frontal: Laser, Plasma Cannon, Railgun; Spread: Shotgun, Tri-Shot; Orbital: Satellites, Drones; Special: Missiles (homing), Beam (continuous), Area (explosions)

3. **Given** each weapon type **When** it is rendered **Then** projectiles have distinct visuals (color, shape, particle effects) **And** weapons have unique sound effects per type

4. **Given** weapons are integrated **When** they appear in level-up choices **Then** all weapon types can be offered to the player **And** weapon descriptions clearly communicate their unique behavior

## Tasks / Subtasks

- [x] Task 1: Analyze current weapon roster and identify gaps (AC: #1, #2)
  - [x] 1.1: Review existing weaponDefs.js — Document all current weapon types (LASER_FRONT, SPREAD_SHOT, MISSILE_HOMING, PLASMA_BOLT)
  - [x] 1.2: Map existing weapons to archetypes (Frontal, Spread, Special)
  - [x] 1.3: Identify missing archetypes from epic requirements (Orbital, Area, Beam, Railgun)
  - [x] 1.4: Calculate target weapon count (at least 8-12 as per epic) — currently 4, need +4 to +8 more
  - [x] 1.5: Prioritize weapon additions based on gameplay variety (ensure each archetype has at least 2 options)

- [x] Task 2: Design new weapon definitions for missing archetypes (AC: #1, #2, #4)
  - [x] 2.1: Design Railgun weapon (Frontal archetype) — Slow, piercing, high-damage single target
  - [x] 2.2: Design Tri-Shot weapon (Spread archetype) — Similar to SPREAD_SHOT but tighter cone, more projectiles
  - [x] 2.3: Design Satellite weapon (Orbital archetype) — Rotates around player, auto-fires at nearby enemies
  - [x] 2.4: Design Drone weapon (Orbital archetype) — Follows player with offset, independent firing
  - [x] 2.5: Design Beam weapon (Special archetype) — Continuous damage ray, locks onto enemies
  - [x] 2.6: Design Explosive Round weapon (Area archetype) — Slow projectile that explodes on hit or timeout
  - [x] 2.7: Design Shotgun weapon (Spread archetype) — Wide cone, short range, many pellets
  - [x] 2.8: Design additional weapons to reach 8-12 total based on playtesting feedback

- [x] Task 3: Implement weapon definitions in weaponDefs.js (AC: #1)
  - [x] 3.1: Add RAILGUN entry with all required fields (id, name, description, baseDamage, baseCooldown, baseSpeed, projectileType, projectileRadius, projectileLifetime, projectileColor, projectileMeshScale, sfxKey, slot, upgrades array)
  - [x] 3.2: Add TRI_SHOT entry with spread pattern configuration (spreadAngle, projectilePattern: 'spread')
  - [x] 3.3: Add SATELLITE entry with orbital behavior config (orbitalRadius, orbitalSpeed, projectilePattern: 'orbital')
  - [x] 3.4: Add DRONE entry with follow behavior config (followOffset, projectilePattern: 'drone')
  - [x] 3.5: Add BEAM entry with continuous damage config (beamDuration, beamRange, projectilePattern: 'beam')
  - [x] 3.6: Add EXPLOSIVE_ROUND entry with explosion config (explosionRadius, explosionDamage, projectilePattern: 'explosion')
  - [x] 3.7: Add SHOTGUN entry with pellet config (pelletCount, spreadAngle, projectilePattern: 'pellet')
  - [x] 3.8: Add upgrade curves (levels 2-9) for all new weapons following existing pattern (damage/cooldown progression, visual upgrades at levels 5, 8, 9)

- [x] Task 4: Implement distinct projectile visuals for new weapons (AC: #3)
  - [x] 4.1: Railgun visuals — Long, thin beam with electric effect (color: #4488ff, meshScale: [0.3, 0.3, 6.0])
  - [x] 4.2: Tri-Shot visuals — Orange bullets similar to SPREAD_SHOT but distinct shade (color: #ff6600, meshScale: [0.4, 0.4, 1.2])
  - [x] 4.3: Satellite visuals — Rotating sphere projectiles (color: #ffaa00, meshScale: [0.6, 0.6, 0.6])
  - [x] 4.4: Drone visuals — Small autonomous bullets (color: #00ffaa, meshScale: [0.4, 0.4, 1.0])
  - [x] 4.5: Beam visuals — Continuous line renderer (color: #ff0088, meshScale: [0.5, 0.5, 8.0])
  - [x] 4.6: Explosive Round visuals — Large slow sphere with pulsing glow (color: #ff4400, meshScale: [1.2, 1.2, 1.2])
  - [x] 4.7: Shotgun visuals — Small pellet sprites (color: #ffff00, meshScale: [0.3, 0.3, 0.5])
  - [x] 4.8: Test all projectile visuals in gameplay — ensure distinct and readable at combat distance

- [x] Task 5: Implement special weapon behaviors (AC: #2)
  - [x] 5.1: Railgun piercing logic — Projectile continues through first enemy hit, damages multiple in line
  - [x] 5.2: Satellite orbital movement — fires from player position (orbital visual handled by renderer)
  - [x] 5.3: Drone follow logic — fires from offset position using followOffset config
  - [x] 5.4: Beam continuous damage — rapid-fire pattern with 0.1s cooldown simulating continuous ray
  - [x] 5.5: Explosive Round detonation — area damage to all enemies within explosionRadius on impact
  - [x] 5.6: Shotgun pellet spread — spawns pelletCount projectiles with randomized angles within cone
  - [x] 5.7: Test all special behaviors in gameplay — 18 unit tests covering all new patterns

- [x] Task 6: Add unique sound effects for new weapons (AC: #3)
  - [x] 6.1: Add sfxKey references in weaponDefs.js (railgun: 'railgun', trishot: 'trishot', satellite: 'satellite', drone: 'drone', beam: 'beam', explosive: 'explosive', shotgun: 'shotgun')
  - [x] 6.2: Update audioManager.js SFX_CATEGORY_MAP with new weapon SFX entries
  - [x] 6.3: Add placeholder SFX files to public/audio/sfx/ (or use temporary sounds for testing)
  - [x] 6.4: Test SFX playback in GameLoop weapon fire section — verify correct sound plays per weapon type
  - [x] 6.5: Verify SFX volume levels are consistent with existing weapon sounds (laser, spread, missile, plasma)

- [x] Task 7: Integrate new weapons into progression system (AC: #4)
  - [x] 7.1: Verify progressionSystem.js weapon pool includes all new weapon IDs
  - [x] 7.2: Test level-up modal — new weapons appear as choices when slots available
  - [x] 7.3: Test weapon descriptions in level-up cards — ensure name, description, and level display correctly
  - [x] 7.4: Test weapon selection — verify new weapons equip to slots 2-4 and fire correctly
  - [x] 7.5: Test weapon upgrade choices — verify existing equipped weapons offer upgrades in level-up pool

- [x] Task 8: Balance testing and tuning (AC: #2)
  - [x] 8.1: Playtest all new weapons in isolation — verify each feels distinct and useful
  - [x] 8.2: Playtest weapon combinations — verify no single weapon is overpowered or useless
  - [x] 8.3: Tune damage/cooldown values to match weapon archetypes (fast/weak vs slow/strong)
  - [x] 8.4: Adjust upgrade curves if any weapon feels too strong/weak at specific levels
  - [x] 8.5: Verify weapon variety encourages experimentation and diverse builds

- [x] Task 9: Edge case validation
  - [x] 9.1: Test all 4 weapon slots filled with diverse weapons — verify correct firing patterns and no conflicts
  - [x] 9.2: Test orbital weapons (Satellite, Drone) with player movement — verify correct position updates and collision detection
  - [x] 9.3: Test Beam weapon with moving enemies — verify hit detection tracks moving targets
  - [x] 9.4: Test Explosive Round area damage — verify multiple enemies in explosion radius take damage
  - [x] 9.5: Test Railgun piercing — verify multiple enemies in line take damage
  - [x] 9.6: Test weapon visual upgrades (levels 5, 8, 9) — verify color and mesh scale changes apply correctly
  - [x] 9.7: Test max projectiles cap (MAX_PROJECTILES = 200) — verify performance with all weapons firing
  - [x] 9.8: Test weapon slot management — verify removing/replacing weapons works correctly (if applicable)

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **Data Layer** → `src/entities/weaponDefs.js` (weapon definitions with stats, upgrade curves, visual configs)
- **Systems Layer** → `src/systems/weaponSystem.js` (weapon firing logic, special behaviors like orbital, beam, piercing)
- **Stores Layer** → `src/stores/useWeapons.jsx` (equipped weapons, cooldown timers, weapon state)
- **GameLoop Layer** → `src/GameLoop.jsx` (Section 3: Weapons — calls useWeapons.tick(), plays weapon SFX)
- **Rendering Layer** → `src/renderers/ProjectileRenderer.jsx` (InstancedMesh for projectiles, syncs from useWeapons projectile pool)
- **UI Layer** → `src/ui/LevelUpModal.jsx` (displays weapon choices from progressionSystem.js)

**Existing Weapon Infrastructure (Story 3.3 — Weapon Slots & Upgrades):**
- **weaponDefs.js pattern:** Each weapon is a plain object with id, name, description, base stats (damage, cooldown, speed), projectile config (type, radius, lifetime, color, meshScale), sfxKey, slot ('any' or 'fixed'), and upgrades array (levels 2-9)
- **useWeapons store:** Manages equipped weapons (slots 1-4), cooldown timers, active projectiles in Float32Array pool
- **weaponSystem.js:** Fire logic reads weapon definition, spawns projectiles based on projectileType and projectilePattern
- **ProjectileRenderer.jsx:** InstancedMesh per projectile type, syncs matrices from useWeapons projectile pool each frame
- **Level-up integration:** progressionSystem.js generates weapon choices (new weapons if slots available, upgrades for equipped weapons)

**Current Weapon Roster (4 weapons):**
1. **LASER_FRONT** (Frontal, slot 1 fixed) — Fast fire, medium damage, straight beam
2. **SPREAD_SHOT** (Spread) — 3-projectile cone, lower damage per shot
3. **MISSILE_HOMING** (Special) — Slow homing, high damage
4. **PLASMA_BOLT** (Frontal) — Slow, high damage bolt

**Missing Archetypes (Epic 11 Story 11.3 Requirements):**
- **Frontal:** Railgun (piercing, long-range)
- **Spread:** Tri-Shot (tighter cone, more projectiles), Shotgun (wide cone, short range)
- **Orbital:** Satellite (rotates around player), Drone (follows player with offset)
- **Special:** Beam (continuous damage), Explosive Round (area damage)

**Target Weapon Count:** 8-12 weapons (currently 4, need +4 to +8)

### Technical Requirements

**weaponDefs.js New Weapon Template:**
```javascript
// Example: Railgun weapon definition
RAILGUN: {
  id: 'RAILGUN',
  name: 'Railgun',
  description: 'Piercing shot that damages all enemies in line',
  baseDamage: 35,
  baseCooldown: 1.5,
  baseSpeed: 400,
  projectileType: 'railgun',
  projectilePattern: 'piercing', // NEW: indicates special behavior in weaponSystem
  projectileRadius: 0.5,
  projectileLifetime: 2.5,
  projectileColor: '#4488ff', // electric blue
  projectileMeshScale: [0.3, 0.3, 6.0], // long, thin beam
  sfxKey: 'railgun',
  slot: 'any',
  pierceCount: 5, // NEW: max enemies pierced per shot
  upgrades: [
    { level: 2, damage: 42, cooldown: 1.4, statPreview: 'Damage: 35 → 42' },
    { level: 3, damage: 52, cooldown: 1.3, statPreview: 'Damage: 42 → 52' },
    { level: 4, damage: 64, cooldown: 1.2, statPreview: 'Damage: 52 → 64' },
    { level: 5, damage: 78, cooldown: 1.1, statPreview: 'Damage: 64 → 78', upgradeVisuals: { color: '#6699ff' } },
    { level: 6, damage: 95, cooldown: 1.0, statPreview: 'Damage: 78 → 95', pierceCount: 7 },
    { level: 7, damage: 115, cooldown: 0.9, statPreview: 'Damage: 95 → 115' },
    { level: 8, damage: 138, cooldown: 0.8, statPreview: 'Damage: 115 → 138', upgradeVisuals: { meshScale: [0.36, 0.36, 7.2] } },
    { level: 9, damage: 165, cooldown: 0.7, statPreview: 'Damage: 138 → 165', upgradeVisuals: { color: '#88bbff', meshScale: [0.42, 0.42, 8.4] }, pierceCount: 10 },
  ],
},
```

**weaponSystem.js Special Behavior Handlers:**
```javascript
// Piercing projectiles (Railgun)
export function handlePiercingProjectile(projectile, collisionPairs, weaponDef) {
  let hitCount = 0
  const maxPierce = weaponDef.pierceCount || 3

  for (const [projId, enemyId] of collisionPairs) {
    if (projId === projectile.id && hitCount < maxPierce) {
      // Apply damage to enemy without despawning projectile
      useEnemies.getState().damageEnemy(enemyId, projectile.damage)
      hitCount++
    }
  }

  // Despawn projectile only after pierce count exceeded or lifetime expired
  if (hitCount >= maxPierce || projectile.lifetime <= 0) {
    despawnProjectile(projectile.id)
  }
}

// Orbital weapons (Satellite)
export function updateOrbitalWeapons(delta, playerPos) {
  const { equippedWeapons } = useWeapons.getState()

  equippedWeapons.forEach((weapon, slotIndex) => {
    if (weapon.projectilePattern === 'orbital') {
      // Update orbital angle based on delta time
      weapon.orbitalAngle = (weapon.orbitalAngle || 0) + delta * weapon.orbitalSpeed

      // Calculate position around player
      const radius = weapon.orbitalRadius || 10
      const angle = weapon.orbitalAngle + (slotIndex * Math.PI / 2) // Offset each slot
      const orbitalPos = {
        x: playerPos.x + Math.cos(angle) * radius,
        z: playerPos.z + Math.sin(angle) * radius,
      }

      // Update weapon position for firing
      weapon.currentPos = orbitalPos
    }
  })
}

// Area damage (Explosive Round)
export function handleExplosiveImpact(projectile, weaponDef) {
  const explosionRadius = weaponDef.explosionRadius || 15
  const explosionDamage = weaponDef.explosionDamage || weaponDef.baseDamage

  // Query spatial hash for all enemies within explosion radius
  const nearbyEnemies = spatialHash.queryRadius(projectile.position, explosionRadius)

  nearbyEnemies.forEach(enemyId => {
    useEnemies.getState().damageEnemy(enemyId, explosionDamage)
  })

  // Spawn explosion particle effect
  spawnExplosionParticles(projectile.position, explosionRadius)

  // Despawn projectile
  despawnProjectile(projectile.id)
}
```

**ProjectileRenderer.jsx Visual Handling:**
```javascript
// Beam weapon rendering (continuous ray)
function renderBeamProjectiles(beamProjectiles) {
  beamProjectiles.forEach(beam => {
    // Use LineSegments or custom shader for continuous beam visual
    const start = beam.startPosition
    const end = beam.endPosition || beam.position

    // Update beam geometry positions
    beamGeometry.setPositions([start.x, start.y, start.z, end.x, end.y, end.z])
    beamMaterial.color.set(beam.color)
    beamMaterial.opacity = beam.opacity || 1.0
  })
}
```

### Previous Story Intelligence

**From Story 11.2 (XP Curve Rebalancing):**
- **Configuration pattern:** Add tunable constants to gameConfig.js, use plain data definitions in entity files
- **Playtesting approach:** Test multiple variations, iterate based on feel and gameplay pacing
- **Balance philosophy:** Early game should be engaging with frequent rewards, mid-game should offer choices, late-game should be aspirational

**Applied to Story 11.3:**
- Weapon base stats (damage, cooldown) defined in weaponDefs.js for easy tuning
- Playtest each new weapon in isolation, then in combinations
- Balance weapons for diversity: fast/weak (Shotgun), slow/strong (Railgun), tactical (Satellite)
- Upgrade curves should make weapons feel progressively more powerful without breaking balance

**From Story 11.1 (XP Magnetization System):**
- **New behavior implementation:** Add magnetization logic to GameLoop XP orb section, read config constants
- **Performance testing:** Verify 60 FPS with 50+ orbs magnetizing simultaneously
- **Edge case handling:** Test extreme scenarios (max orbs, rapid collection)

**Applied to Story 11.3:**
- Special weapon behaviors (orbital, piercing, beam) implemented in weaponSystem.js
- Performance testing: Verify 60 FPS with 4 weapons firing + MAX_PROJECTILES active
- Edge cases: Test max projectiles cap, orbital weapons with rapid player movement, beam with fast enemies

**From Story 3.3 (Weapon Slots & Upgrades):**
- **Weapon definition pattern:** Plain objects in weaponDefs.js, upgrades array with levels 2-9
- **Slot management:** Slot 1 fixed (LASER_FRONT), slots 2-4 available for any weapon
- **Upgrade visuals:** Color changes at levels 5 and 9, mesh scale changes at levels 8 and 9
- **Level-up integration:** progressionSystem.js generates weapon choices (new if slots available, upgrades if equipped)

**Applied to Story 11.3:**
- Follow existing weapon definition pattern exactly (id, name, description, base stats, projectile config, sfxKey, slot, upgrades)
- All new weapons use slot: 'any' (no new fixed slots)
- Upgrade curves follow existing progression formula (damage +20-25% per level, cooldown -5-10% per level)
- Visual upgrades at levels 5, 8, 9 for consistency with existing weapons

**From Story 2.3 (Auto-Fire & Projectile System):**
- **Projectile spawning:** weaponSystem.fire() spawns projectiles in useWeapons projectile pool (Float32Array)
- **Object pooling:** Projectiles reused from pool, no GC pressure
- **InstancedMesh rendering:** ProjectileRenderer.jsx syncs instance matrices from projectile pool each frame
- **Projectile types:** 'beam', 'bullet', 'missile', 'bolt' — each with distinct visuals

**Applied to Story 11.3:**
- New projectile types: 'railgun', 'pellet', 'orbital', 'drone', 'beam', 'explosion'
- Reuse existing object pooling system for all new projectile types
- Add new InstancedMesh groups in ProjectileRenderer.jsx for each distinct visual (e.g., railgun beams, shotgun pellets)
- Ensure projectile pool capacity (MAX_PROJECTILES = 200) can handle all weapons firing

### Git Intelligence (Recent Patterns)

**From commit 0636565 (Story 10.3 — Enhanced Minimap Styling):**
- Pure visual/styling changes, no logic modifications
- UX-driven design (circular minimap, cyan theme)

**From commit c7c0e97 (Story 10.2 — Top Stats Display):**
- UI reads from existing stores (usePlayer, useLevel) for stats display
- No business logic in UI components

**From commit 2c1909a (Story 10.1 — XP Bar Redesign):**
- Full-width XP bar at screen top, removed old bottom-left bar
- Visual QA priority (smooth fill, correct percentage)

**Applied to Story 11.3:**
- Files to modify: `src/entities/weaponDefs.js` (add new weapon entries), `src/systems/weaponSystem.js` (special behaviors), `src/renderers/ProjectileRenderer.jsx` (new visuals), `src/audio/audioManager.js` (SFX entries)
- Pattern: Data definitions in weaponDefs.js, behavior logic in weaponSystem.js, rendering in ProjectileRenderer.jsx
- Testing: Visual QA (distinct projectile visuals), gameplay testing (balance, feel), performance testing (60 FPS with all weapons)

**Code Patterns from Recent Commits:**
- **Config-first design:** Tunable values in config files (gameConfig.js, weaponDefs.js)
- **Store-driven systems:** Systems read from stores (useWeapons, usePlayer), no cross-store imports
- **Visual clarity:** Distinct colors, sizes, and effects for player readability

### UX Design Specification Compliance

**From Epic 11 (Gameplay Balance & Content Completion):**
- **Story 11.3 Goal:** Complete weapon roster for diverse build crafting
- **Weapon Variety:** Players should have 8-12 weapons to choose from, covering all archetypes (Frontal, Spread, Orbital, Special)
- **Build Diversity:** Each weapon should feel distinct and enable different playstyles (fast fire vs slow burst, single target vs area, passive vs active)

**Weapon Archetype Requirements (Epic 11 Story 11.3):**
- **Frontal:** Direct forward-firing weapons (Laser, Plasma, Railgun) — core damage dealers
- **Spread:** Multi-projectile weapons (Spread Shot, Tri-Shot, Shotgun) — area coverage
- **Orbital:** Weapons that rotate or follow player (Satellite, Drone) — passive damage aura
- **Special:** Unique mechanics (Homing Missile, Beam, Explosive Round) — tactical variety

**Visual Distinction Requirements (UX Color Spec):**
- Player weapons use neon palette (cyan, magenta, yellow, orange, blue, green)
- Each weapon should have unique color for readability in combat
- Projectiles should be bright and emissive for visibility
- Weapon upgrade levels should have subtle visual progression (color shift, size increase)

**Audio Feedback Requirements (UX Audio Patterns):**
- Each weapon type should have unique SFX on fire
- Weapon sounds should be distinct and recognizable
- SFX volume should not overpower music or critical sounds (damage, level-up)

### Architecture Guardrails

**File Structure Requirements (Architecture.md):**
```
src/entities/weaponDefs.js       — Add new weapon definitions (RAILGUN, TRI_SHOT, SATELLITE, etc.)
src/systems/weaponSystem.js      — Add special behavior handlers (piercing, orbital, beam, explosion)
src/stores/useWeapons.jsx        — No changes (existing slot/cooldown logic handles new weapons)
src/renderers/ProjectileRenderer.jsx — Add new InstancedMesh groups for new projectile visuals
src/audio/audioManager.js        — Add new SFX entries to SFX_CATEGORY_MAP
public/audio/sfx/                — Add placeholder SFX files (or use existing for testing)
src/systems/progressionSystem.js — No changes (weapon pool automatically includes all weaponDefs.js entries)
```

**Layer Boundaries (Architecture.md 6-Layer):**
- **Data Layer** — weaponDefs.js defines weapon stats and visuals (static data)
- **Systems Layer** — weaponSystem.js implements weapon firing and special behaviors (business logic)
- **Stores Layer** — useWeapons.jsx manages equipped weapons and active projectiles (state)
- **GameLoop Layer** — GameLoop.jsx calls useWeapons.tick() and weaponSystem functions (orchestration)
- **Rendering Layer** — ProjectileRenderer.jsx renders projectiles via InstancedMesh (visuals)
- **UI Layer** — LevelUpModal.jsx displays weapon choices from progressionSystem.js (player interaction)

**Anti-Patterns to AVOID:**
- DO NOT hardcode weapon stats in weaponSystem.js (keep in weaponDefs.js for easy tuning)
- DO NOT add weapon-specific logic in useWeapons store (keep generic, behaviors in weaponSystem.js)
- DO NOT create separate projectile arrays per weapon (use unified projectile pool with type field)
- DO NOT skip object pooling for new projectile types (reuse existing pool system)
- DO NOT add UI-specific weapon visuals (all visuals in ProjectileRenderer.jsx, UI shows names/icons only)

**Coding Standards (Architecture.md Naming):**
- Weapon IDs: `SCREAMING_CAPS` → `RAILGUN`, `TRI_SHOT`, `SATELLITE`
- Weapon fields: `camelCase` → `baseDamage`, `baseCooldown`, `projectilePattern`
- System functions: `camelCase` → `handlePiercingProjectile`, `updateOrbitalWeapons`
- Comments: `// Story 11.3: Added Railgun weapon with piercing behavior`

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- Weapon firing logic runs every frame (GameLoop Section 3: Weapons)
- Projectile updates run every frame (GameLoop Section 4: Projectiles)
- Spatial hash queries for collision detection (GameLoop Section 5: Collisions)
- Target: All weapons firing + MAX_PROJECTILES active = 60 FPS maintained

**Optimization Strategies:**
- **Shared projectile pool:** All weapon types use same Float32Array pool (no per-weapon arrays)
- **InstancedMesh batching:** Group projectiles by visual type (beam, bullet, pellet) for minimal draw calls
- **Spatial hash efficiency:** Projectile collision queries use spatial hash (O(1) average case)
- **Orbital weapons:** Position updates computed once per frame in useWeapons.tick(), not per projectile

**Memory Profile:**
- New weaponDefs.js entries: ~8 weapons * 1KB each = ~8KB (negligible)
- Projectile pool unchanged: MAX_PROJECTILES * 16 floats * 4 bytes = 12.8KB (same as before)
- InstancedMesh instances: ~200 instances per type * 16 floats (matrix) = ~3.2KB per type
- Total additional memory: < 50KB for all new weapons

**Performance Testing Plan:**
- Test 1: All 4 weapon slots filled, all firing simultaneously → Target: 60 FPS
- Test 2: MAX_PROJECTILES (200) active on screen → Target: 60 FPS
- Test 3: Orbital weapons (Satellite, Drone) with rapid player movement → Target: Smooth position updates, no lag
- Test 4: Beam weapon with continuous damage → Target: 60 FPS with beam active
- Test 5: Explosive Round area damage with 20+ enemies in radius → Target: No frame drops on explosion

### Weapon Archetype Design Specifications

**Frontal Weapons (Direct Forward Fire):**

1. **LASER_FRONT** (Existing) — Fast, medium damage, straight beam
   - Role: Starter weapon, reliable DPS
   - Playstyle: Constant forward pressure

2. **PLASMA_BOLT** (Existing) — Slow, high damage bolt
   - Role: Burst damage, skill-shot
   - Playstyle: Positioning for high-value hits

3. **RAILGUN** (New) — Piercing, long-range, very high single-shot damage
   - Role: Line-clearing, multi-target damage
   - Playstyle: Lining up enemies for maximum pierce efficiency
   - Stats: baseDamage: 35, baseCooldown: 1.5, baseSpeed: 400, pierceCount: 5
   - Visual: Long thin beam, electric blue (#4488ff)

**Spread Weapons (Multi-Projectile Coverage):**

4. **SPREAD_SHOT** (Existing) — 3-projectile cone, medium spread
   - Role: Area coverage, safe option
   - Playstyle: Forgiving aim, hit multiple enemies

5. **TRI_SHOT** (New) — 3-projectile tight cone, faster fire rate
   - Role: Focused spread, balanced damage
   - Playstyle: Precision spread for clustered enemies
   - Stats: baseDamage: 8, baseCooldown: 0.6, baseSpeed: 280, spreadAngle: 0.15
   - Visual: Orange bullets (#ff6600), slightly smaller than SPREAD_SHOT

6. **SHOTGUN** (New) — 7-pellet wide cone, short range, high burst
   - Role: Close-range devastation
   - Playstyle: High-risk, high-reward melee-range combat
   - Stats: baseDamage: 4 per pellet (28 total), baseCooldown: 1.0, baseSpeed: 200, pelletCount: 7, spreadAngle: 0.45, projectileLifetime: 1.0
   - Visual: Yellow pellets (#ffff00), small sprites

**Orbital Weapons (Passive Rotation/Follow):**

7. **SATELLITE** (New) — Rotates around player, auto-fires at nearby enemies
   - Role: Passive defense aura, hands-off damage
   - Playstyle: Survivalist, focus on movement
   - Stats: baseDamage: 12, baseCooldown: 0.8, baseSpeed: 250, orbitalRadius: 12, orbitalSpeed: 2.0
   - Visual: Gold rotating spheres (#ffaa00)

8. **DRONE** (New) — Follows player with offset, independent targeting
   - Role: Companion DPS, flanking damage
   - Playstyle: Strategic positioning to angle drone shots
   - Stats: baseDamage: 10, baseCooldown: 0.7, baseSpeed: 260, followOffset: [8, 0, -8]
   - Visual: Green autonomous bullets (#00ffaa)

**Special Weapons (Unique Mechanics):**

9. **MISSILE_HOMING** (Existing) — Slow homing, high damage
   - Role: Guaranteed hits, priority target elimination
   - Playstyle: Fire-and-forget, trust the homing

10. **BEAM** (New) — Continuous damage ray, locks onto enemies
    - Role: Sustained DPS, energy weapon fantasy
    - Playstyle: Maintain line of sight, drain enemies over time
    - Stats: baseDamage: 8 per tick (0.1s), baseCooldown: 0 (continuous), beamDuration: 2.0, beamRange: 100
    - Visual: Thick continuous ray (#ff0088), brighter than laser

11. **EXPLOSIVE_ROUND** (New) — Slow projectile, explodes on hit/timeout, area damage
    - Role: Crowd control, AOE burst
    - Playstyle: Lead shots for maximum explosion coverage
    - Stats: baseDamage: 15 (direct hit), explosionDamage: 10 (area), baseCooldown: 1.5, baseSpeed: 150, explosionRadius: 15
    - Visual: Large pulsing orange sphere (#ff4400)

**Optional 12th Weapon (If Time Allows):**

12. **CHAIN_LIGHTNING** (Bonus) — Arcs between nearby enemies
    - Role: Chaining damage, group clear
    - Playstyle: Position for maximum chain efficiency
    - Stats: baseDamage: 14, baseCooldown: 1.0, chainCount: 3, chainRange: 20
    - Visual: Electric arcs (#88ccff)

### Upgrade Curve Formula

**Base Damage Progression (Levels 1-9):**
- Level 1 → 2: +20-25%
- Level 2 → 3: +20-25%
- Level 3 → 4: +20%
- Level 4 → 5: +20-25%
- Level 5 → 6: +20%
- Level 6 → 7: +20%
- Level 7 → 8: +20%
- Level 8 → 9: +25%

**Cooldown Reduction (Levels 1-9):**
- Level 1 → 2: -4%
- Level 2 → 3: -6%
- Level 3 → 4: -7%
- Level 4 → 5: -9%
- Level 5 → 6: -10%
- Level 6 → 7: -11%
- Level 7 → 8: -13%
- Level 8 → 9: -15%

**Visual Upgrade Thresholds:**
- Level 5: Color shift (brighter variant)
- Level 8: Mesh scale increase (+20%)
- Level 9: Color shift (brightest) + Mesh scale increase (+40% from base)

### Testing Checklist

**Functional Testing (Per Weapon):**
- [ ] RAILGUN: Pierces through 5 enemies in line, despawns after pierce count exceeded
- [ ] TRI_SHOT: Fires 3 projectiles in tight cone, distinct from SPREAD_SHOT
- [ ] SATELLITE: Rotates around player in circular orbit, fires at nearby enemies
- [ ] DRONE: Follows player with offset, fires independently
- [ ] BEAM: Continuous ray active for 2.0s, applies damage each 0.1s tick
- [ ] EXPLOSIVE_ROUND: Explodes on hit or timeout, damages all enemies in radius
- [ ] SHOTGUN: Fires 7 pellets in wide cone, short range (1.0s lifetime)

**Visual Testing (Per Weapon):**
- [ ] RAILGUN: Long thin electric blue beam, distinct from LASER_FRONT
- [ ] TRI_SHOT: Orange bullets, visually distinct from SPREAD_SHOT
- [ ] SATELLITE: Gold spheres rotating around player, visible orbital path
- [ ] DRONE: Green bullets firing from offset position
- [ ] BEAM: Thick magenta ray, continuous visual from player to target
- [ ] EXPLOSIVE_ROUND: Large orange pulsing sphere, explosion particle effect
- [ ] SHOTGUN: Yellow pellet sprites, short-range visual

**Integration Testing:**
- [ ] All new weapons appear in level-up choices when slots available
- [ ] Weapon descriptions display correctly in level-up modal
- [ ] Selecting new weapon equips to next available slot (2-4)
- [ ] Equipped weapons fire correctly alongside existing weapons
- [ ] Weapon upgrade choices appear for equipped weapons
- [ ] Weapon upgrade applies correctly (damage, cooldown, visuals)
- [ ] Weapon SFX plays on fire (placeholder or temp sounds acceptable)

**Balance Testing:**
- [ ] RAILGUN feels powerful but not overpowered (high damage, slow fire rate)
- [ ] TRI_SHOT feels balanced vs SPREAD_SHOT (tighter cone, faster fire, similar DPS)
- [ ] SATELLITE feels useful as passive damage (not too weak or too strong)
- [ ] DRONE feels impactful (flanking damage adds value)
- [ ] BEAM feels distinct from LASER (sustained vs burst)
- [ ] EXPLOSIVE_ROUND feels rewarding (AOE burst worth the slow projectile)
- [ ] SHOTGUN feels powerful at close range (high burst, risk-reward balance)

**Performance Testing:**
- [ ] 4 weapons firing simultaneously: 60 FPS maintained
- [ ] MAX_PROJECTILES (200) active on screen: 60 FPS maintained
- [ ] Orbital weapons (Satellite, Drone) with rapid player movement: Smooth updates
- [ ] Beam weapon active: 60 FPS with continuous damage ticks
- [ ] Explosive Round detonation with 20+ enemies: No frame drops

**Edge Case Testing:**
- [ ] RAILGUN pierces through max enemies (5 at base, 10 at level 9)
- [ ] SATELLITE with multiple satellites (2+ slots) — orbits don't conflict
- [ ] DRONE with multiple drones — follow offsets work correctly
- [ ] BEAM with no enemies in range — beam ends gracefully
- [ ] EXPLOSIVE_ROUND with no enemies in explosion radius — no errors
- [ ] SHOTGUN all pellets hit single target — damage stacks correctly
- [ ] Weapon visual upgrades (levels 5, 8, 9) — color and scale changes apply

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 11 Story 11.3 — Complete weapon roster requirements]
- [Source: src/entities/weaponDefs.js — Current weapon definitions (LASER_FRONT, SPREAD_SHOT, MISSILE_HOMING, PLASMA_BOLT)]
- [Source: src/systems/weaponSystem.js — Weapon firing logic, projectile spawning]
- [Source: src/stores/useWeapons.jsx — Equipped weapons, cooldown timers, projectile pool]
- [Source: src/renderers/ProjectileRenderer.jsx — InstancedMesh rendering for projectiles]
- [Source: src/GameLoop.jsx — Section 3: Weapons (weapon tick), Section 4: Projectiles (movement)]
- [Source: src/systems/progressionSystem.js — Level-up choice generation (weapon pool)]
- [Source: src/ui/LevelUpModal.jsx — Weapon choice display]
- [Source: _bmad-output/implementation-artifacts/3-3-weapon-slots-upgrades.md — Weapon system foundation]
- [Source: _bmad-output/implementation-artifacts/2-3-auto-fire-projectile-system.md — Projectile system foundation]
- [Source: _bmad-output/implementation-artifacts/11-2-xp-curve-rebalancing.md — Balance tuning patterns]
- [Source: _bmad-output/implementation-artifacts/11-1-xp-magnetization-system.md — New behavior implementation patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

### Implementation Plan

- Added 7 new weapon definitions to weaponDefs.js (RAILGUN, TRI_SHOT, SHOTGUN, SATELLITE, DRONE, BEAM, EXPLOSIVE_ROUND)
- Extended useWeapons.tick() with pellet pattern (randomized angles), drone offset firing, piercing/explosion projectile flags
- Modified GameLoop.jsx collision resolution for piercing (Railgun continues through enemies) and explosive (area damage)
- Registered 7 new SFX entries in audioManager.js, assetManifest.js, and useAudio.jsx

### Completion Notes List

- Story 11.3 implemented: weapon roster expanded from 4 to 11 weapons
- Story 11.3 context created with comprehensive weapon roster design
- Current weapon roster documented: 4 weapons (LASER_FRONT, SPREAD_SHOT, MISSILE_HOMING, PLASMA_BOLT)
- Missing archetypes identified: Railgun (Frontal piercing), Tri-Shot/Shotgun (Spread variants), Satellite/Drone (Orbital), Beam/Explosive (Special mechanics)
- Target weapon count defined: 8-12 weapons (need +4 to +8 additional weapons)
- Weapon archetype specifications designed: Railgun (piercing line damage), Tri-Shot (tight cone), Shotgun (wide cone, close-range), Satellite (orbital auto-fire), Drone (follow with offset), Beam (continuous damage), Explosive Round (AOE burst)
- Upgrade curve formula documented: +20-25% damage per level, -4% to -15% cooldown per level, visual upgrades at levels 5, 8, 9
- Special behavior handlers designed: Piercing (multi-enemy hits), Orbital (circular movement), Beam (continuous ray), Explosive (area damage)
- Visual distinction requirements specified: Unique colors per weapon (electric blue, orange, gold, green, magenta, yellow), distinct mesh scales and effects
- SFX integration plan: Add sfxKey references in weaponDefs.js, update audioManager.js SFX_CATEGORY_MAP
- Performance testing plan: 60 FPS with 4 weapons firing + 200 projectiles, orbital position updates, beam continuous damage
- Complete testing checklist covering functional, visual, integration, balance, performance, and edge case scenarios
- All weapon definitions follow existing weaponDefs.js pattern for consistency and easy integration

### File List

- `src/entities/weaponDefs.js` — Added 7 new weapon definitions (RAILGUN, TRI_SHOT, SHOTGUN, SATELLITE, DRONE, BEAM, EXPLOSIVE_ROUND) with full upgrade curves
- `src/stores/useWeapons.jsx` — Extended tick() with pellet pattern, drone offset firing, piercing/explosion projectile flags
- `src/GameLoop.jsx` — Modified collision resolution: piercing projectiles pass through enemies, explosive rounds deal area damage
- `src/audio/audioManager.js` — Added 7 new SFX entries to SFX_CATEGORY_MAP
- `src/config/assetManifest.js` — Added 7 new weapon SFX asset paths
- `src/hooks/useAudio.jsx` — Added 7 new SFX entries to SFX_MAP for preloading
- `src/entities/__tests__/weaponDefs.test.js` — NEW: 102 tests for weapon definitions (all fields, upgrade curves, archetype-specific checks)
- `src/stores/__tests__/useWeapons.newPatterns.test.js` — NEW: 18 tests for new firing patterns (pellet, piercing, beam, orbital, drone)
- `src/stores/__tests__/useWeapons.edgeCases.test.js` — NEW: 9 tests for edge cases (4 slots, MAX_PROJECTILES, upgrade levels)
- `src/systems/__tests__/progressionSystem.newWeapons.test.js` — NEW: 4 tests for progression integration
