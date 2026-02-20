# Epic 27: Combat Feedback System (Arcade Feel)

Le joueur ressent immédiatement chaque impact grâce à des damage numbers flottants, des hit flashes sur les ennemis, et du knockback physique, créant une sensation arcade satisfaisante et un sentiment de puissance.

## Epic Goals

- Afficher les damage numbers (chiffres de dégâts) à l'impact de chaque attaque du joueur
- Afficher les dégâts critiques en doré avec un "!" pour les moments héroïques
- Ajouter un hit flash (teinte blanche/rouge) rapide sur les ennemis touchés
- Implémenter un knockback/recul physique des ennemis lors de l'impact
- Afficher les damage numbers en rouge quand le joueur prend des dégâts
- Créer une sensation arcade dynamique et un sentiment de puissance croissante

## Epic Context

Après avoir solidifié la progression et le contenu (Epics 20-25), le jeu a besoin d'un meilleur feedback visuel pour que chaque combat soit satisfaisant. Les damage numbers permettent au joueur de comprendre immédiatement l'efficacité de ses upgrades et créent des moments "wow" quand les chiffres deviennent énormes. Le hit flash et le knockback renforcent l'impact de chaque tir, donnant au joueur le sentiment d'être puissant.

Cette épic s'inspire des jeux arcade classiques (Diablo, Path of Exile, Vampire Survivors) où voir les dégâts s'afficher est partie intégrante du plaisir de jeu. C'est une feature à fort impact visuel mais relativement simple à implémenter.

## Stories

### Story 27.1: Player Damage Numbers - Basic Display

As a player,
I want to see damage numbers appear when I hit enemies,
So that I get immediate visual feedback on my damage output.

**Acceptance Criteria:**

**Given** the damage number system
**When** the player's projectile hits an enemy
**Then** a floating text appears at the impact location showing the damage dealt
**And** the number is displayed in a clear, readable font (large enough to read during combat)
**And** the color is white or light color for normal hits

**Given** the floating animation
**When** a damage number spawns
**Then** the number floats upward from the impact point
**And** the number fades out over ~1 second
**And** the number has a slight random horizontal drift to avoid overlapping numbers
**And** the animation feels snappy and arcade-like (not slow/floaty)

**Given** multiple hits on the same enemy
**When** damage numbers spawn rapidly
**Then** numbers don't stack perfectly on top of each other (random offset)
**And** older numbers remain visible while new ones spawn
**And** performance remains smooth even with many numbers on screen

**Given** the technical implementation
**When** rendering damage numbers
**Then** numbers are rendered as HTML overlay elements (not 3D text)
**And** numbers use position conversion from 3D world coords to 2D screen coords
**And** numbers are removed from DOM after animation completes
**And** a pool/reuse system is used to avoid excessive DOM creation

### Story 27.2: Critical Hit Numbers - Golden Display

As a player,
I want critical hits to display with a special golden number and exclamation mark,
So that I feel rewarded for lucky/powerful moments.

**Acceptance Criteria:**

**Given** the critical hit system
**When** a projectile scores a critical hit (based on player's crit chance stat)
**Then** the damage number appears in golden/yellow color (#FFD700 or similar)
**And** an exclamation mark "!" is appended after the number (e.g., "42!")
**And** the font is slightly larger than normal damage numbers (~1.3x scale)
**And** the animation is more dramatic (pops out faster, maybe a slight bounce)

**Given** visual distinction
**When** multiple damage numbers appear
**Then** critical hit numbers stand out clearly from normal hits
**And** the golden color is bright and eye-catching
**And** the "!" is the same color as the number

**Given** the crit determination
**When** damage is calculated
**Then** the crit check uses the player's current crit chance stat (from upgrades/boons)
**And** the crit multiplier is applied to the damage (e.g., 1.5x or 2x base damage)
**And** the damage number system receives a flag: `{ damage: 42, isCrit: true }`

**Given** future expansion
**When** designed
**Then** the system can support other special damage types (e.g., "WEAK!" for vulnerable enemies)
**And** the color/style can be easily configured per damage type

### Story 27.3: Enemy Hit Flash - Visual Impact Feedback

As a player,
I want enemies to flash white (or red) briefly when hit,
So that I get instant visual confirmation of successful hits.

**Acceptance Criteria:**

**Given** the hit flash system
**When** an enemy takes damage
**Then** the enemy's material flashes to a bright color (white preferred, or bright red)
**And** the flash lasts ~100-150ms (very brief)
**And** the enemy smoothly transitions back to its original color

**Given** the flash intensity
**When** applied
**Then** the flash is noticeable but not jarring (not pure white, slightly tinted)
**And** the flash uses emissive material property or color lerp
**And** multiple hits can re-trigger the flash (flash timer resets)

**Given** the technical implementation
**When** an enemy is hit
**Then** the hit flash is applied in the enemy's tick() or via a dedicated hitFlash system
**And** each enemy instance has a `hitFlashTimer` that counts down
**And** while hitFlashTimer > 0, the material color is overridden
**And** the original material color is restored when timer reaches 0

**Given** performance considerations
**When** many enemies are hit simultaneously (e.g., explosive weapon)
**Then** flash animation doesn't cause lag
**And** material updates are efficient (avoid cloning materials per frame)

### Story 27.4: Enemy Knockback - Physics Impact

As a player,
I want enemies to recoil slightly when hit,
So that I feel the physical impact of my weapons.

**Acceptance Criteria:**

**Given** the knockback system
**When** a projectile hits an enemy
**Then** the enemy is pushed back (away from the projectile's direction of travel)
**And** the knockback distance is small but noticeable (~0.5-1.5 units)
**And** the knockback happens instantly (impulse-style, not smooth push)

**Given** knockback force
**When** calculated
**Then** the force is based on the projectile's direction vector
**And** knockback strength can vary by weapon type (e.g., shotgun has more knockback than laser)
**And** knockback is applied as a velocity impulse added to the enemy's movement

**Given** enemy collision
**When** an enemy is knocked back into another enemy
**Then** enemies can push each other slightly (basic physics interaction)
**And** enemies don't get stuck overlapping permanently
**And** the spatial hash collision system handles the new positions

**Given** balance considerations
**When** tuning knockback
**Then** knockback doesn't push enemies out of the playable area or into walls
**And** knockback feels satisfying without making combat chaotic
**And** bosses have reduced knockback (or none) to feel more massive

**Given** future expansion
**When** designed
**Then** specific boons/weapons could modify knockback strength
**And** some weapons could have no knockback (e.g., beam weapons)
**And** knockback data is part of weapon definitions

### Story 27.5: Player Damage Numbers - Red Display

As a player,
I want to see damage numbers in red when I take damage,
So that I'm immediately aware of incoming threats.

**Acceptance Criteria:**

**Given** the player damage system
**When** the player takes damage
**Then** a floating text appears near the player ship showing the damage taken
**And** the number is displayed in red color (e.g., #FF4444 or #FF0000)
**And** the font size is consistent with player damage numbers (or slightly larger for visibility)

**Given** the number position
**When** a damage number spawns
**Then** the number appears at the player's position (or slightly offset)
**And** the number floats upward and fades out (same animation as enemy damage numbers)
**And** multiple damage instances don't overlap (random offset)

**Given** visual clarity
**When** the player is taking rapid damage
**Then** red numbers are clearly visible against the space background
**And** the numbers have a dark outline or shadow for readability
**And** the animation feels urgent/alarming (faster rise speed?)

**Given** the technical implementation
**When** player HP is reduced
**Then** the damage number system is called with: `{ damage: X, isPlayerDamage: true }`
**And** the number is rendered using the same system as enemy damage numbers
**And** the color is determined by the `isPlayerDamage` flag

**Given** integration with existing feedback
**When** the player takes damage
**Then** the red damage number complements the existing screen shake/flash (Story 4.6)
**And** the combined feedback feels cohesive, not overwhelming

## Technical Notes

**Architecture Alignment:**
- **Systems Layer**: damageNumberSystem.js (new) — Manages creation, animation, and cleanup of damage numbers
- **Systems Layer**: hitFlashSystem.js (new) — Manages enemy hit flash timers and material updates
- **Systems Layer**: knockbackSystem.js (new) — Applies knockback impulses to enemies on hit
- **Stores Layer**: useDamageNumbers.js (new) — Zustand store tracking active damage numbers
- **Renderers Layer**: DamageNumberRenderer.jsx (new) — HTML overlay rendering damage numbers
- **Config Layer**: weaponDefs.js — Add knockback strength per weapon type
- **GameLoop**: Integrate new systems into tick cycle (after collision resolution)

**Damage Number Implementation:**
- HTML overlay approach (not 3D Text mesh for performance)
- Convert 3D position to 2D screen coords: `vector.project(camera)` → `screenX/Y`
- CSS animation or requestAnimationFrame for smooth float-up effect
- Object pool pattern to reuse DOM elements:
  ```js
  { id, damage, x, y, color, scale, opacity, age }
  ```
- Numbers stored in useDamageNumbers store, rendered by DamageNumberRenderer.jsx

**Hit Flash Implementation:**
- Each enemy has `hitFlashTimer: 0` in state
- On hit: `hitFlashTimer = 0.15` (150ms)
- In enemy tick: `hitFlashTimer = Math.max(0, hitFlashTimer - delta)`
- While hitFlashTimer > 0: `mesh.material.emissive.set(flashColor)`
- When hitFlashTimer reaches 0: restore original emissive

**Knockback Implementation:**
- Knockback force: `knockbackVector = projectile.direction * knockbackStrength * -1`
- Applied to enemy velocity: `enemy.velocity.add(knockbackVector)`
- Enemy movement system handles the new velocity (existing code)
- Spatial hash updates positions after knockback

**Critical Hit Logic:**
- Add `critChance` and `critMultiplier` to player stats (usePlayer store)
- On projectile hit: `const isCrit = Math.random() < player.critChance`
- If crit: `finalDamage = baseDamage * player.critMultiplier`
- Pass `{ damage: finalDamage, isCrit }` to damage number system

**Performance Considerations:**
- Limit max damage numbers on screen (e.g., 50) — remove oldest if limit reached
- Use CSS transforms (translateY, opacity) for animation (GPU-accelerated)
- Batch DOM updates in single RAF loop
- Reuse DOM elements instead of creating/destroying constantly

## Dependencies

- Story 2.4 (Combat Resolution & Feedback) — Collision/damage system to hook into
- Story 3.5 (HP System & Death) — Player damage handling
- Story 4.6 (Visual Damage Feedback) — Existing screen shake/flash to complement
- Epic 20 (Permanent Upgrades) — Crit chance stat from upgrades
- Story 11.3 (Complete Weapon Roster) — weaponDefs for knockback config

## Success Metrics

- Damage numbers are readable and don't clutter the screen (playtest)
- Critical hits feel satisfying and rewarding (playtest: players notice and comment on big crits)
- Hit flash provides clear feedback without being distracting (visual testing)
- Knockback adds physicality to combat without making it chaotic (playtest)
- Player damage numbers are alarming and clear (playtest: players react to red numbers)
- Overall combat feels more arcade-like and satisfying (playtest feedback)

## References

- adam-vision-notes-2026-02-15.md — Combat feedback, arcade feel
- Vampire Survivors — Damage numbers, hit feedback
- Diablo III — Floating combat text, critical hit visuals
- Path of Exile — Damage numbers, knockback mechanics
- Enter the Gungeon — Enemy knockback on hit
- Brotato — Clear damage feedback, arcade feel
