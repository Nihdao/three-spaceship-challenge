# Story 12.2: Projectile Visibility Enhancements

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want projectiles to be bright and clearly visible,
So that I can see my attacks and understand what's happening on screen.

## Acceptance Criteria

1. **Given** projectiles are rendered **When** their materials are applied **Then** projectile colors are more saturated and vibrant (neon cyan, magenta, yellow per UX spec) **And** projectiles have emissive materials or glow effects

2. **Given** projectiles are in motion **When** they travel across the screen **Then** they leave subtle particle trails or motion blur effects **And** projectiles are clearly distinguishable from enemy projectiles (player = cyan/green, enemy = red/orange)

3. **Given** visibility enhancements **When** intense combat occurs (50+ projectiles on screen) **Then** projectiles remain visible and readable **And** performance remains at 60 FPS

## Tasks / Subtasks

- [ ] Task 1: Analyze current projectile visibility baseline (AC: #1)
  - [ ] 1.1: Review ProjectileRenderer.jsx and current material setup (emissive, color, toneMapped)
  - [ ] 1.2: Test projectile visibility against different backgrounds (dark space, planets, tunnel)
  - [ ] 1.3: Identify which weapon types have low visibility (check weaponDefs.js projectileColor values)
  - [ ] 1.4: Take screenshots/notes of current projectile appearance (baseline for comparison)
  - [ ] 1.5: Document current projectile material properties (emissive color, emissiveIntensity: 2)

- [ ] Task 2: Increase saturation and brightness of projectile colors (AC: #1)
  - [ ] 2.1: Review all weapon definitions in weaponDefs.js for projectileColor values
  - [ ] 2.2: Update LASER_FRONT projectileColor to brighter cyan (#00ffff → #00ffff, already neon)
  - [ ] 2.3: Update SPREAD_SHOT projectileColor to brighter orange (#ff8800 → #ffaa00 or #ffcc00)
  - [ ] 2.4: Update MISSILE_HOMING projectileColor to brighter red (#ff3333 → #ff5555)
  - [ ] 2.5: Update PLASMA_BOLT projectileColor to brighter magenta (#aa00ff → #dd00ff or #ff00ff)
  - [ ] 2.6: Verify all weapon upgradeVisuals.color values are also saturated (levels 5, 9)
  - [ ] 2.7: Test color changes in gameplay — projectiles should "pop" against dark space

- [ ] Task 3: Increase emissive intensity for enhanced glow (AC: #1)
  - [ ] 3.1: In ProjectileRenderer.jsx, increase emissiveIntensity from 2 to 3-4 (start with 3, tune)
  - [ ] 3.2: Test glow intensity with different weapon types (beam, bullet, missile, bolt)
  - [ ] 3.3: Verify glow is visible but not overpowering (should enhance, not blind)
  - [ ] 3.4: Add configuration constant to gameConfig.js: PROJECTILE_EMISSIVE_INTENSITY
  - [ ] 3.5: Apply emissiveIntensity from config to ProjectileRenderer material
  - [ ] 3.6: Tune emissiveIntensity value for optimal visibility (3.0-4.0 range)

- [ ] Task 4: Add configurable projectile glow settings (AC: #1)
  - [ ] 4.1: Add new PROJECTILE_VISUALS section to gameConfig.js
  - [ ] 4.2: Define PROJECTILE_EMISSIVE_INTENSITY (default 3.0, range 2.0-4.0)
  - [ ] 4.3: Define PROJECTILE_EMISSIVE_BASE_COLOR (default '#ffffff' for material emissive)
  - [ ] 4.4: Define PROJECTILE_GLOW_MULTIPLIER (optional bloom intensity multiplier, default 1.2)
  - [ ] 4.5: Update ProjectileRenderer.jsx to use PROJECTILE_VISUALS config
  - [ ] 4.6: Document all config values with comments explaining effect on visibility

- [ ] Task 5: Add particle trail effects for projectiles (AC: #2)
  - [ ] 5.1: Research Three.js trail approaches (particle systems vs line geometry vs custom shader)
  - [ ] 5.2: Option A (simplest): Use AdditiveBlending on projectile material for motion blur illusion
  - [ ] 5.3: Option B (better): Create ParticleTrailRenderer.jsx for subtle trail particles
  - [ ] 5.4: Option C (advanced): Custom shader with velocity-based motion blur
  - [ ] 5.5: Implement Option A or B (recommend B for better visual clarity)
  - [ ] 5.6: Configure trail length, opacity, and fade duration in gameConfig.js

- [ ] Task 6: Differentiate player vs enemy projectile colors (AC: #2)
  - [ ] 6.1: Review BossProjectileRenderer.jsx for enemy projectile rendering
  - [ ] 6.2: Verify player projectiles use cool colors (cyan #00ffff, green #00ffcc, blue #00ccff)
  - [ ] 6.3: Verify enemy projectiles use warm colors (red #ff3333, orange #ff6600, yellow #ffaa00)
  - [ ] 6.4: Ensure color contrast is high enough for instant recognition
  - [ ] 6.5: Test in combat scenario — player and enemy projectiles should be clearly distinct

- [ ] Task 7: Optimize projectile rendering for performance (AC: #3, NFR1)
  - [ ] 7.1: Profile frame rate with 50+ projectiles on screen (use r3f-perf or DevTools)
  - [ ] 7.2: Verify InstancedMesh rendering remains efficient (one draw call per projectile type)
  - [ ] 7.3: Test with max projectiles (200) + max enemies (100) + 50 orbs — ensure 60 FPS
  - [ ] 7.4: Check GPU usage — emissive materials should have minimal cost
  - [ ] 7.5: If using particle trails, verify trail rendering doesn't drop frames
  - [ ] 7.6: Optimize trail particle count if needed (reduce from 10 to 5 particles per trail)

- [ ] Task 8: Add bloom post-processing enhancement (optional, AC: #1)
  - [ ] 8.1: Check if bloom post-processing is enabled in GameplayScene.jsx or BossScene.jsx
  - [ ] 8.2: If bloom exists, verify it enhances projectile glow without overglow
  - [ ] 8.3: If bloom is missing, consider adding EffectComposer with UnrealBloomPass
  - [ ] 8.4: Tune bloom threshold (0.7-0.9) to only glow bright projectiles, not entire scene
  - [ ] 8.5: Tune bloom strength (0.5-1.0) for subtle enhancement
  - [ ] 8.6: Performance test bloom — should cost < 5ms on mid-range GPUs

- [ ] Task 9: Test visibility across all scenes and scenarios (AC: #1, #2)
  - [ ] 9.1: Test in GameplayScene (dark space background) — projectiles clearly visible
  - [ ] 9.2: Test in BossScene (boss arena lighting) — projectiles visible against boss
  - [ ] 9.3: Test near planets (bright planet surfaces) — projectiles still readable
  - [ ] 9.4: Test during dash (magenta trail present) — projectiles don't conflict with dash VFX
  - [ ] 9.5: Test with multiple weapon types firing simultaneously — all projectiles distinguishable
  - [ ] 9.6: Test enemy projectiles (boss attacks) — clearly distinct from player projectiles

- [ ] Task 10: Add motion blur or speed lines for fast projectiles (optional, AC: #2)
  - [ ] 10.1: Identify fast projectiles (baseSpeed > 250) in weaponDefs.js
  - [ ] 10.2: Add velocity-based scale elongation (stretch projectile mesh in movement direction)
  - [ ] 10.3: In ProjectileRenderer.jsx, calculate velocity magnitude from (dirX, dirZ)
  - [ ] 10.4: Apply scale multiplier to projectile mesh based on speed (faster = longer)
  - [ ] 10.5: Add PROJECTILE_SPEED_SCALE_MULT to gameConfig.js (default 0.01-0.02)
  - [ ] 10.6: Test motion blur effect — fast projectiles should have subtle elongation

- [ ] Task 11: Edge case testing and polish (AC: #3)
  - [ ] 11.1: Test projectile visibility with bloom enabled/disabled — should be visible in both
  - [ ] 11.2: Test projectile visibility during screen shake (damage feedback) — no visual glitches
  - [ ] 11.3: Test projectile visibility during level-up modal — projectiles frozen but visible
  - [ ] 11.4: Test projectile visibility on low-end hardware (Chrome DevTools throttling)
  - [ ] 11.5: Verify no Z-fighting or emissive bleeding with overlapping projectiles

- [ ] Task 12: Documentation and code review preparation
  - [ ] 12.1: Document all material property changes in ProjectileRenderer.jsx with inline comments
  - [ ] 12.2: Document color updates in weaponDefs.js (projectileColor, upgradeVisuals.color)
  - [ ] 12.3: Document new config section PROJECTILE_VISUALS in gameConfig.js with comments
  - [ ] 12.4: Prepare before/after screenshots for code review (baseline vs enhanced visibility)
  - [ ] 12.5: Update Dev Agent Record with completion notes and file list

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **Config/Data Layer** → gameConfig.js (PROJECTILE_VISUALS section), weaponDefs.js (projectileColor)
- **Rendering Layer** → ProjectileRenderer.jsx (material emissive intensity, color application)
- **Rendering Layer** → ParticleTrailRenderer.jsx (optional trail effects, if implemented)
- **No Systems Layer** → Pure visual enhancement, no game logic changes
- **No Stores** → No state changes, only material/color property adjustments
- **No UI Layer** → No UI changes, purely 3D rendering improvements

**Existing Infrastructure:**
- `src/renderers/ProjectileRenderer.jsx` — InstancedMesh rendering for all player projectiles
- `src/renderers/BossProjectileRenderer.jsx` — Enemy projectile rendering (boss attacks)
- `src/entities/weaponDefs.js` — Weapon definitions with projectileColor, projectileMeshScale
- `src/stores/useWeapons.jsx` — Projectile state pool (Float32Array), spawn logic
- `src/systems/projectileSystem.js` — Projectile movement, lifetime, collision
- `src/config/gameConfig.js` — Global constants (will add PROJECTILE_VISUALS section)

**Current Projectile Implementation (from Stories 2.3, 2.4, 2.9, 3.3):**
- **Rendering:** InstancedMesh with BoxGeometry, MeshStandardMaterial (emissive, toneMapped: false)
- **Material:** emissive color #ffffff, emissiveIntensity: 2, color set per-instance from projectile.color
- **Colors:** weaponDefs.js defines projectileColor per weapon (cyan, orange, red, magenta)
- **Scale:** projectileMeshScale defines elongated shapes (beam = [0.75, 0.75, 3.0])
- **Performance:** Single draw call per frame for all projectiles via InstancedMesh
- **Visibility Issues:** Some projectiles (orange, dark magenta) can be hard to see against dark space

**Story 12.2 Enhancements (Projectile Visibility):**
- **Brighter Colors:** Increase saturation for all projectileColor values (cyan, orange → yellow, red → bright red, magenta → bright magenta)
- **Higher Emissive Intensity:** Increase from 2.0 to 3.0-4.0 for stronger glow
- **Particle Trails:** Optional subtle trails using particle system or AdditiveBlending
- **Motion Blur:** Optional velocity-based mesh elongation for fast projectiles
- **Player vs Enemy Distinction:** Cool colors (cyan/green/blue) for player, warm colors (red/orange/yellow) for enemies
- **Configuration:** All visibility values tunable in gameConfig.js (PROJECTILE_VISUALS section)

### Technical Requirements

**gameConfig.js additions (new PROJECTILE_VISUALS section):**
```javascript
// Projectile Visibility (Story 12.2)
PROJECTILE_VISUALS: {
  EMISSIVE_INTENSITY: 3.0,         // Projectile glow intensity (2.0-4.0)
  EMISSIVE_BASE_COLOR: '#ffffff',  // Material emissive color (white)
  TRAIL_ENABLED: false,             // Enable particle trails (performance cost)
  TRAIL_PARTICLE_COUNT: 5,          // Particles per trail (if enabled)
  TRAIL_LIFETIME: 0.3,              // Trail fade duration in seconds
  TRAIL_OPACITY: 0.6,               // Trail particle opacity (0-1)
  MOTION_BLUR_ENABLED: true,        // Enable velocity-based elongation
  SPEED_SCALE_MULT: 0.015,          // Speed-to-scale multiplier for motion blur
  GLOW_MULTIPLIER: 1.2,             // Bloom intensity multiplier (if bloom enabled)
}
```

**weaponDefs.js color updates (brighter, more saturated colors):**
```javascript
export const WEAPONS = {
  LASER_FRONT: {
    // ... existing fields
    projectileColor: '#00ffff',     // Cyan (already bright, keep)
    upgrades: [
      { level: 5, /* ... */, upgradeVisuals: { color: '#44ffff' } }, // Brighter cyan
      { level: 9, /* ... */, upgradeVisuals: { color: '#88ffff' } }, // Even brighter
    ],
  },

  SPREAD_SHOT: {
    // ... existing fields
    projectileColor: '#ffcc00',     // Bright yellow (was #ff8800 orange, now more visible)
    upgrades: [
      { level: 5, /* ... */, upgradeVisuals: { color: '#ffdd33' } }, // Brighter yellow
      { level: 9, /* ... */, upgradeVisuals: { color: '#ffee66' } }, // Very bright yellow
    ],
  },

  MISSILE_HOMING: {
    // ... existing fields
    projectileColor: '#ff5555',     // Bright red (was #ff3333, now more visible)
    upgrades: [
      { level: 5, /* ... */, upgradeVisuals: { color: '#ff7777' } }, // Brighter red
      { level: 9, /* ... */, upgradeVisuals: { color: '#ff9999' } }, // Very bright red
    ],
  },

  PLASMA_BOLT: {
    // ... existing fields
    projectileColor: '#ff00ff',     // Bright magenta (was #aa00ff, now more visible)
    upgrades: [
      { level: 5, /* ... */, upgradeVisuals: { color: '#ff44ff' } }, // Brighter magenta
      { level: 9, /* ... */, upgradeVisuals: { color: '#ff88ff' } }, // Very bright magenta
    ],
  },
}
```

**ProjectileRenderer.jsx material enhancements:**
```javascript
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useWeapons from '../stores/useWeapons.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX = GAME_CONFIG.MAX_PROJECTILES

export default function ProjectileRenderer() {
  const meshRef = useRef()
  const dummyRef = useRef(new THREE.Object3D())
  const tempColorRef = useRef(new THREE.Color())

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: GAME_CONFIG.PROJECTILE_VISUALS.EMISSIVE_BASE_COLOR,  // Story 12.2
        emissiveIntensity: GAME_CONFIG.PROJECTILE_VISUALS.EMISSIVE_INTENSITY, // Story 12.2: increased from 2 to 3+
        toneMapped: false,
        // Optional: AdditiveBlending for subtle trail effect
        // blending: THREE.AdditiveBlending,
        // transparent: true,
        // opacity: 0.9,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const projectiles = useWeapons.getState().projectiles
    const dummy = dummyRef.current
    const tempColor = tempColorRef.current
    const config = GAME_CONFIG.PROJECTILE_VISUALS

    let count = 0
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i]
      if (!p.active) continue

      dummy.position.set(p.x, p.y ?? 0.5, p.z)
      dummy.rotation.set(0, Math.atan2(p.dirX, p.dirZ), 0)

      // Story 12.2: Optional motion blur via velocity-based elongation
      let scaleX = p.meshScale[0]
      let scaleZ = p.meshScale[2]
      if (config.MOTION_BLUR_ENABLED) {
        const speed = Math.sqrt(p.dirX ** 2 + p.dirZ ** 2) * p.speed
        const speedMult = 1.0 + speed * config.SPEED_SCALE_MULT
        scaleZ = p.meshScale[2] * speedMult // Elongate in facing direction
      }

      dummy.scale.set(scaleX, p.meshScale[1], scaleZ)
      dummy.updateMatrix()
      mesh.setMatrixAt(count, dummy.matrix)

      tempColor.set(p.color)  // Color from weaponDefs projectileColor (now brighter)
      mesh.setColorAt(count, tempColor)

      count++
    }

    mesh.count = count
    if (count > 0) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX]}
      frustumCulled={false}
    />
  )
}
```

**Optional ParticleTrailRenderer.jsx (if implementing trail effects):**
```javascript
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useWeapons from '../stores/useWeapons.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

// Trail particles: spawn behind fast-moving projectiles, fade over time
export default function ParticleTrailRenderer() {
  const meshRef = useRef()
  const trailParticles = useRef([]) // Array of {x, y, z, color, opacity, lifetime}

  const geometry = useMemo(() => new THREE.SphereGeometry(0.15, 8, 8), [])
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )

  useFrame((state, delta) => {
    const config = GAME_CONFIG.PROJECTILE_VISUALS
    if (!config.TRAIL_ENABLED) return

    const projectiles = useWeapons.getState().projectiles
    const particles = trailParticles.current

    // Spawn trail particles behind projectiles
    for (const p of projectiles) {
      if (!p.active) continue
      // Spawn particle behind projectile at random interval
      if (Math.random() < 0.3) {
        particles.push({
          x: p.x,
          y: p.y ?? 0.5,
          z: p.z,
          color: p.color,
          opacity: config.TRAIL_OPACITY,
          lifetime: config.TRAIL_LIFETIME,
        })
      }
    }

    // Update trail particle lifetimes and fade
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]
      particle.lifetime -= delta
      particle.opacity = Math.max(0, particle.lifetime / config.TRAIL_LIFETIME) * config.TRAIL_OPACITY
      if (particle.lifetime <= 0) {
        particles.splice(i, 1)
      }
    }

    // Render trail particles (InstancedMesh rendering logic here)
    // ... similar to ProjectileRenderer but with opacity and fade
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, 500]} // Max trail particles
      frustumCulled={false}
    />
  )
}
```

### Previous Story Intelligence

**From Story 12.1 (Player Ship Lighting Improvements):**
- **Emissive material enhancements** — Increased emissive values for better visibility
- **Color coordination** — Cyan theme (#00ffcc) for player ship matches UI palette
- **Performance validation** — Emissive materials have ~0% performance cost
- **Configuration pattern** — All visual tuning in gameConfig.js (PLAYER_SHIP_LIGHTING section)

**Applied to Story 12.2:**
- Use same emissive enhancement approach for projectiles (increase emissiveIntensity)
- Maintain color coordination — player projectiles use cyan/green/blue (cool colors)
- Follow same configuration pattern — PROJECTILE_VISUALS section in gameConfig.js
- Apply same performance testing — verify 60 FPS with 200 projectiles

**From Story 2.9 (Projectile Size & Spawn Offset):**
- **Projectile mesh scale** — projectileMeshScale in weaponDefs.js defines elongated shapes
- **Spawn offset** — PROJECTILE_SPAWN_Y_OFFSET, PROJECTILE_SPAWN_FORWARD_OFFSET for clean spawning
- **Collision radius** — projectileRadius matches visual size for accurate hit detection

**Applied to Story 12.2:**
- Motion blur elongation should respect existing meshScale (multiply, don't override)
- Brighter colors should enhance already-correct collision visuals
- Trail particles should spawn at projectile position (no offset needed)

**From Story 3.3 (Weapon Slots & Upgrades):**
- **Weapon upgrade visuals** — upgradeVisuals.color, upgradeVisuals.meshScale at levels 5, 8, 9
- **Progressive enhancement** — Higher levels get brighter colors and larger meshes
- **Weapon variety** — LASER_FRONT (cyan), SPREAD_SHOT (orange), MISSILE_HOMING (red), PLASMA_BOLT (magenta)

**Applied to Story 12.2:**
- Update all upgradeVisuals.color values to brighter saturated colors
- Maintain progressive enhancement pattern (level 5 brighter, level 9 brightest)
- Ensure all 4 weapon types have distinct, vibrant colors

**From Story 6.2 (Boss Arena Combat):**
- **Boss projectile rendering** — BossProjectileRenderer.jsx separate from player projectiles
- **Orange color for boss attacks** — #ff6600 for telegraphed danger (UX spec)
- **Distinct visual language** — Boss attacks use warm colors (red/orange) for threat clarity

**Applied to Story 12.2:**
- Player projectiles must remain cool colors (cyan/green/blue) for contrast
- Boss projectiles already use orange — verify they remain distinct after player projectile enhancements
- Test player + boss projectiles on screen simultaneously — must be instantly distinguishable

**From Story 10.1-10.5 (HUD Overhaul):**
- **Cyan theme** — UI uses #00ffcc for XP bar, boon icons, minimap (visual cohesion)
- **Color palette consistency** — Game uses cyan/magenta for friendly, red/orange for enemy
- **Visual hierarchy** — Bright colors draw attention (XP bar pulses when nearly full)

**Applied to Story 12.2:**
- LASER_FRONT projectiles should match UI cyan (#00ffff) for visual cohesion
- Magenta projectiles (PLASMA_BOLT) should use bright magenta (#ff00ff) matching dash trail
- Color updates should enhance existing palette, not introduce new colors

### Git Intelligence (Recent Patterns)

**From commit 5ee711d (Story 10.5 — Boon Slots Visibility & Display):**
- Files modified: `src/ui/HUD.jsx`, `src/ui/__tests__/HUD.test.jsx`
- Pattern: Visual enhancements with minimal code changes
- Testing: Unit tests for visual rendering

**From commit c7c0e97 (Story 10.2 — Top Stats Display):**
- Files modified: `src/ui/HUD.jsx`
- Pattern: Added new HUD elements (kills, fragments, score, timer warning)
- Color usage: Warning states use red pulse (#ff0033)

**Applied to Story 12.2:**
- Files to modify: `src/renderers/ProjectileRenderer.jsx`, `src/entities/weaponDefs.js`, `src/config/gameConfig.js`
- Pattern: Material property adjustments (emissive intensity) + color updates (weaponDefs)
- Testing: Visual testing in combat scenarios + performance profiling (60 FPS)

**Code Patterns from Recent Commits:**
- **Config constants** — All tunable values in gameConfig.js with clear sections
- **Inline comments** — Document all changes with "Story X.Y" comments
- **Visual enhancements** — Minimal code changes, maximum visual impact
- **Performance awareness** — Always test FPS after visual changes

### UX Design Specification Compliance

**From UX Doc (Epic 12 Context):**
- **Visual Polish & Player Readability** — Epic 12 focuses on improving visual clarity
- **Chaos Lisible** — Spectacle visuel ne doit jamais sacrifier la compréhension
- **Neon Effects in Gameplay** — 3D effects palette uses saturated cyan/magenta

**Story 12.2 Specific Requirements (from Epic 12 Story 12.2):**
- **Saturated Colors** — Cyan, magenta, yellow per UX spec (neon palette)
- **Emissive Materials or Glow** — Projectiles should have emissive glow
- **Particle Trails or Motion Blur** — Subtle trails for readability in motion
- **Player vs Enemy Distinction** — Cool colors (cyan/green) for player, warm (red/orange) for enemy
- **60 FPS Performance** — No frame drops with 50+ projectiles on screen (NFR1)

**Color System (from UX Doc):**
- **Player/Friendly** — Cyan (#00ffcc, #00ffff), green (#00ff88), blue (#00ccff)
- **Enemy/Danger** — Red (#ff3333), orange (#ff6600), yellow (#ffaa00)
- **3D Effects Palette** — Saturated neon (cyan projectiles #00ffff, magenta dash #ff00ff)

**Animation Timing (from UX Doc):**
- **Linear for alerts** — No animation for projectile glow (always-on emissive)
- **Trail fade** — Ease-out, 200-300ms for particle trail fade
- **Responsive feedback** — Projectile color changes immediate (< 100ms)

**Gameplay Feel:**
- **Lisibilité Combat** — Player must track all projectiles (own and enemy) for dodge decisions
- **Visual Clarity** — Projectiles distinguishable from each other and from environment
- **Satisfaction Visuelle** — Bright, glowing projectiles enhance power fantasy

### Architecture Guardrails

**File Structure Requirements (Architecture.md):**
```
src/config/gameConfig.js                    — Add PROJECTILE_VISUALS section
src/renderers/ProjectileRenderer.jsx        — Increase emissiveIntensity, apply config
src/renderers/BossProjectileRenderer.jsx    — Verify enemy projectile colors (no changes likely)
src/renderers/ParticleTrailRenderer.jsx     — Optional new file for trail effects
src/entities/weaponDefs.js                  — Update projectileColor values (all weapons)
src/entities/weaponDefs.js                  — Update upgradeVisuals.color values (levels 5, 9)
src/renderers/__tests__/ProjectileRenderer.test.jsx — Unit tests for material changes (if needed)
```

**Layer Boundaries (Architecture.md 6-Layer):**
- **Config Layer** — gameConfig.js defines PROJECTILE_VISUALS constants, weaponDefs.js color data
- **Rendering Layer** — ProjectileRenderer.jsx applies emissive intensity, ParticleTrailRenderer (optional)
- **No Systems** — No game logic changes (pure visual enhancement)
- **No Stores** — No state changes (colors and emissive are visual properties only)
- **No GameLoop** — No useFrame logic changes (rendering already syncs projectile state)

**Anti-Patterns to AVOID:**
- DO NOT create new Zustand store for projectile visuals (use gameConfig.js only)
- DO NOT modify projectile colors in useWeapons store (weaponDefs.js is source of truth)
- DO NOT put emissive logic in GameLoop (material properties set in ProjectileRenderer)
- DO NOT add excessive particle trails (performance budget: < 500 trail particles max)

**Coding Standards (Architecture.md Naming):**
- Config section: `SCREAMING_CAPS` → `PROJECTILE_VISUALS`, `EMISSIVE_INTENSITY`
- Component file: `PascalCase.jsx` → `ProjectileRenderer.jsx`, `ParticleTrailRenderer.jsx`
- Entity field: `camelCase` → `projectileColor`, `upgradeVisuals`
- Material properties: `camelCase` → `emissive`, `emissiveIntensity`, `blending`

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- Emissive materials: ~0% cost vs standard materials (same shader complexity)
- Color changes: 0% cost (per-instance color already implemented)
- Motion blur elongation: ~0.5ms cost (simple scale multiplication in useFrame)
- Particle trails (if implemented): ~2-5ms cost depending on trail particle count
- Bloom post-processing (if added): ~3-5ms cost on mid-range GPUs

**NFR2: 30+ FPS Minimum Under Load:**
- Test scenario: 200 projectiles + 100 enemies + 50 orbs + enhanced visuals
- Expected visibility cost: < 5ms total (emissive intensity + optional trails)
- Total frame budget: ~16ms for 60 FPS, ~33ms for 30 FPS
- Projectile enhancements should consume < 10% of frame budget

**Implementation Optimization Checklist:**
- [x] Use emissive properties (no custom shaders) — fastest approach
- [x] Maintain InstancedMesh rendering — single draw call for all projectiles
- [x] Limit trail particles to 500 max — prevent particle explosion
- [x] Apply motion blur via scale (not shader) — simple transform, no shader cost
- [x] Use AdditiveBlending for trails (if implemented) — optimized blend mode

**Memory Profile:**
- Emissive intensity change: 0 bytes (material property update)
- Color updates in weaponDefs.js: 0 bytes (static data)
- Particle trail system: ~20KB (500 particles × 40 bytes per particle)
- Total memory overhead: < 25KB (negligible)

### Testing Checklist

**Functional Testing:**
- [ ] Emissive intensity increased from 2.0 to 3.0+ (visible glow enhancement)
- [ ] All weapon projectileColor values updated to brighter saturated colors
- [ ] All upgradeVisuals.color values updated (levels 5, 9)
- [ ] Config PROJECTILE_VISUALS section created with all tuning constants
- [ ] ProjectileRenderer.jsx applies config values (emissiveIntensity)
- [ ] Motion blur elongation works for fast projectiles (if implemented)
- [ ] Particle trails spawn and fade correctly (if implemented)

**Visual Testing:**
- [ ] Cyan projectiles (LASER_FRONT) clearly visible against dark space
- [ ] Yellow projectiles (SPREAD_SHOT) clearly visible against dark space
- [ ] Red projectiles (MISSILE_HOMING) clearly visible against dark space
- [ ] Magenta projectiles (PLASMA_BOLT) clearly visible against dark space
- [ ] All projectiles distinguishable from each other (color contrast)
- [ ] Player projectiles (cool colors) distinct from boss projectiles (warm colors)
- [ ] Projectiles visible during dash (magenta trail present)
- [ ] Projectiles visible near bright planets

**Weapon Upgrade Testing:**
- [ ] LASER_FRONT level 5 projectiles brighter than level 1 (#44ffff vs #00ffff)
- [ ] LASER_FRONT level 9 projectiles brightest (#88ffff)
- [ ] SPREAD_SHOT level 5/9 projectiles progressively brighter (yellow shades)
- [ ] MISSILE_HOMING level 5/9 projectiles progressively brighter (red shades)
- [ ] PLASMA_BOLT level 5/9 projectiles progressively brighter (magenta shades)

**Performance Testing (NFR1, NFR2):**
- [ ] 60 FPS maintained with 50 projectiles on screen (baseline stress test)
- [ ] 60 FPS maintained with 200 projectiles (max projectiles stress test)
- [ ] 60 FPS with 200 projectiles + 100 enemies + 50 orbs (full combat stress test)
- [ ] GPU usage remains within acceptable range (< 80% on mid-range GPUs)
- [ ] No frame drops during rapid weapon firing (multiple weapons simultaneously)
- [ ] Particle trails don't drop frames (if implemented, test with 500 trail particles)

**Edge Case Testing:**
- [ ] Projectile visibility with bloom enabled/disabled (should be visible in both)
- [ ] Projectile visibility during screen shake (damage feedback)
- [ ] Projectile visibility during level-up modal (gameplay paused, projectiles frozen)
- [ ] Projectile visibility on low-end hardware (Chrome DevTools throttling)
- [ ] No Z-fighting or visual glitches with overlapping projectiles
- [ ] No emissive bleeding onto nearby enemies or environment

**Color Distinction Testing:**
- [ ] Player projectiles vs enemy projectiles clearly distinguishable in combat
- [ ] Cyan laser vs yellow spread shot vs red missile vs magenta plasma — all distinct
- [ ] Projectile colors don't conflict with ship emissive glow (Story 12.1)
- [ ] Projectile colors don't conflict with dash trail (#ff00ff magenta)
- [ ] Projectile colors don't conflict with XP orbs (#00ffcc cyan-green)

**Tuning Testing:**
- [ ] Test EMISSIVE_INTENSITY = 2.0 (current baseline) — may be too dim
- [ ] Test EMISSIVE_INTENSITY = 3.0 (recommended) — good visibility without overglow
- [ ] Test EMISSIVE_INTENSITY = 4.0 (bright) — strong glow, may be too intense
- [ ] Test MOTION_BLUR_ENABLED true/false — verify motion blur enhances without distortion
- [ ] Test SPEED_SCALE_MULT = 0.01 (subtle) vs 0.02 (strong) — tune elongation amount
- [ ] Test TRAIL_ENABLED true/false — verify trail effect enhances without clutter (if implemented)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 12 Story 12.2 — Complete AC and story text]
- [Source: _bmad-output/planning-artifacts/architecture.md#Rendering Layer — ProjectileRenderer.jsx pattern]
- [Source: src/renderers/ProjectileRenderer.jsx — Current InstancedMesh rendering, emissive material]
- [Source: src/entities/weaponDefs.js — Weapon projectileColor and upgradeVisuals definitions]
- [Source: src/config/gameConfig.js — Global constants (will add PROJECTILE_VISUALS)]
- [Source: _bmad-output/implementation-artifacts/12-1-player-ship-lighting-improvements.md — Emissive enhancement pattern]
- [Source: _bmad-output/implementation-artifacts/2-9-projectile-size-spawn-offset.md — Projectile mesh scale and spawn offset]
- [Source: _bmad-output/implementation-artifacts/3-3-weapon-slots-upgrades.md — Weapon upgrade visual progression]
- [Source: _bmad-output/implementation-artifacts/6-2-boss-arena-combat.md — Boss projectile rendering (enemy projectiles)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Color System: cyan/magenta palette, neon effects]
- [Three.js MeshStandardMaterial emissive docs: https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.emissive]
- [Three.js AdditiveBlending docs: https://threejs.org/docs/#api/en/constants/CustomBlendingEquation]
- [Three.js InstancedMesh docs: https://threejs.org/docs/#api/en/objects/InstancedMesh]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
