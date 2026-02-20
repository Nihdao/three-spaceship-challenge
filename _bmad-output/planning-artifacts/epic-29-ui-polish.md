# Epic 29: UI & Visual Polish

L'interface du jeu gagne en lisibilité, en cinématisme et en cohérence visuelle : les planètes 3D arrivent dans les menus, le banner système devient une véritable annonce cinématique, les upgrades permanentes sont enfin ergonomiques et leur progression est satisfaisante.

## Epic Goals

- Remplacer les sphères génériques par les vrais assets GLB de planètes dans les écrans de menu
- Rendre le banner "nom du système" cinématique : grand titre + sous-titre galaxie
- Rendre l'écran d'upgrades permanentes ergonomique : descriptions complètes + clic sur toute la carte
- Rééquilibrer la progression des upgrades permanentes avec des bonus exponentiels (petits au début, significatifs aux derniers niveaux)

## Epic Context

Après les épics de contenu, l'interface présente plusieurs friction points visuels et ergonomiques. Le banner système affiche une seule ligne peu lisible mélangeant galaxie et système. Les upgrades permanentes ont des descriptions coupées et un bouton minuscule à cliquer. Les bonus d'upgrade sont plats (5% par niveau partout) rendant les niveaux avancés peu satisfaisants. Certains écrans de menu utilisent encore des placeholders géométriques au lieu des assets 3D disponibles. Cette épic apporte une finition visuelle et fonctionnelle significative.

## Stories

### Story 29.1: Replace Menu Background Spheres with Planet GLB Assets

As a player,
I want to see actual 3D planet models in the main menu background,
So that the game's visual identity is cohesive from the very first screen.

**Acceptance Criteria:**

**Given** the current MenuScene.jsx
**When** the main menu is displayed
**Then** the 5 decorative `<sphereGeometry>` sphere meshes in `MenuPlanets()` are replaced by GLB planet models
**And** each of the 5 positions maps to one of the 3 available planet GLB assets (PlanetA, PlanetB, PlanetC — distributed so variety is visible)
**And** planets retain their existing positions, scales, and rotation speeds from `MENU_PLANETS`
**And** each planet has its emissive color tuned per the `MENU_PLANETS` color data (adapted to the emissive system used in `PlanetRenderer.jsx`)

**Given** the GLB planet models
**When** loading them
**Then** `useGLTF` is used to load the models (same pattern as `PlanetRenderer.jsx` and `PatrolShip`)
**And** each planet instance clones the scene (`scene.clone()`) to avoid shared material conflicts
**And** the 3 planet GLBs are preloaded at the bottom of `MenuScene.jsx` (same as `useGLTF.preload` for the ship)

**Given** visual quality
**When** the planets are rendered
**Then** they look clearly distinct from each other (different models + different emissive tints)
**And** they rotate slowly on Y-axis (preserving the existing `rotationSpeed` per planet)
**And** the existing point lights in MenuScene already illuminate them — no new lights required

**Given** performance
**When** multiple planet GLBs are loaded
**Then** scene load time is acceptable (3 GLB models already preloaded in PlanetRenderer — reuse the same cache)
**And** planet geometries are disposed if MenuScene unmounts (standard R3F unmount behavior)

### Story 29.2: Cinematic System Name Banner Redesign

As a player,
I want the system entry announcement to feel like a cinematic moment,
So that arriving in a new system feels epic and immersive.

**Acceptance Criteria:**

**Given** the SystemNameBanner component
**When** the player enters a new system (phase = 'systemEntry')
**Then** the system name is displayed in large, bold, spaced-out text (primary line)
**And** the galaxy name is displayed below in a smaller, softer style (secondary line)
**And** the two lines are visually distinct in size and opacity — system name ~2.5x bigger than galaxy name
**And** the layout is:
  ```
  ALPHA CENTAURI        ← large, bright, tracking-widest (~3rem)
  Milky Way Galaxy      ← smaller, muted, italic (~1rem), slight delay in appearance
  ```

**Given** the animation
**When** the banner animates in
**Then** the system name fades/slides in first
**And** the galaxy name fades in ~200ms after the system name
**And** the whole banner fades out smoothly after the display duration
**And** existing CSS animation keyframes in the banner are extended to support two-element timing

**Given** when no galaxy is selected
**When** `selectedGalaxyId` is null or undefined
**Then** only the system name is shown (no galaxy subtitle)
**And** the layout adapts gracefully (no empty line gap)

**Given** the CSS/styling
**When** implementing
**Then** the `system-name-banner` CSS class in the global stylesheet is updated
**And** a new `.system-name-banner-subtitle` class is added for the galaxy name
**And** the font, tracking, and text-shadow remain consistent with the game's visual identity

### Story 29.3: Upgrade Card UX — Full Card Clickable + Descriptions Visible

As a player,
I want to click anywhere on an upgrade card to buy it,
And I want to read the full description without text being cut off.

**Acceptance Criteria:**

**Given** the upgrade card layout
**When** the player views an upgrade card
**Then** the description text is fully visible — no `truncate` cutting (wrap to multiple lines)
**And** the card height adapts to the text content (no fixed height clipping)
**And** on cards with long descriptions, the text wraps cleanly within the card boundaries

**Given** the click interaction
**When** the player clicks anywhere on an upgrade card (not just the cost button)
**Then** the upgrade is purchased if the player can afford it and it's not maxed
**And** the same `handleBuy` logic runs whether clicking the button or the card body
**And** the visual feedback (border color change, hover state) is applied to the entire card
**And** the cursor is `pointer` on the whole card when purchase is available

**Given** card states
**When** the upgrade is maxed or the player can't afford it
**Then** clicking the card body does nothing (disabled state preserved)
**And** the card's visual state (opacity, cursor) indicates non-interactability as before
**And** the cost button remains visible for reference even when disabled

**Given** the layout at small screen sizes
**When** the upgrade grid is displayed on narrower viewports
**Then** cards don't overflow or clip their content
**And** the grid remains readable (2-col min)

### Story 29.4: Permanent Upgrade Exponential Scaling

As a player,
I want each upgrade level to feel more impactful than the previous,
So that spending fragments on high levels feels rewarding, not negligible.

**Acceptance Criteria:**

**Given** the upgrade bonus values in permanentUpgradesDefs.js
**When** reviewing all upgrades
**Then** early levels (1-2) provide small bonuses, late levels (4-5) provide significantly larger bonuses
**And** the progression curve is exponential, not flat — e.g., for ATTACK_POWER:
  - Level 1: +5% (baseline, entry-level)
  - Level 2: +7%
  - Level 3: +10%
  - Level 4: +15%
  - Level 5: +25%
  → Total at max: +62% (vs current flat +25%)

**Given** the specific upgrades and their max levels
**When** defining the new bonus values:
- `ATTACK_POWER` (max 5): [5%, 7%, 10%, 15%, 25%] — total 62%
- `ARMOR` (max 5): [1, 2, 3, 5, 8] flat reduction — total 19 (vs 5)
- `MAX_HP` (max 3): [10, 20, 40] — total 70 HP (vs 30)
- `REGEN` (max 3): [0.2, 0.4, 1.0] HP/s — total 1.6 (vs 0.6)
- `ATTACK_SPEED` (max 3): [5%, 10%, 20%] — total 35% (vs 15%)
- `ZONE` (max 3): [10%, 15%, 25%] — total 50% (vs 30%)
- `MAGNET` (max 2): [15%, 30%] — total 45% (vs 30%)
- `LUCK` (max 3): [5%, 10%, 20%] — total 35% (vs 15%)
- `EXP_BONUS` (max 5): [5%, 7%, 10%, 15%, 25%] — total 62%
- `CURSE` (max 5): [10%, 15%, 20%, 25%, 30%] — total 100% (double spawn rate at max)
**And** the `getTotalBonus()` function works correctly with the new heterogeneous bonus arrays

**Given** the cost scaling (already in place)
**When** reviewing costs
**Then** costs remain as-is (they already scale: 50, 100, 200, 350, 500)
**And** the higher cost of late levels is now justified by the larger bonus jump

**Given** the display in UpgradeCard
**When** showing the bonus
**Then** the total accumulated bonus is displayed correctly (existing `getTotalBonus` logic)
**And** the per-level bonus array changes are transparent to the UI (no UI code changes needed)

**Given** tests
**When** running upgrade-related tests
**Then** any tests checking specific bonus values are updated to match the new values
**And** the `getTotalBonus` function tests pass with new values

## Technical Notes

**Story 29.1 — Planets in Menu:**
- Edit `MenuScene.jsx` → replace `MenuPlanets()` function
- Define a `MODEL_KEYS` mapping: e.g., position index 0→'planetA', 1→'planetB', 2→'planetC', 3→'planetA', 4→'planetB'
- For each planet, use `useGLTF` + `scene.clone()` + traverse to set emissive (same pattern as `PlanetRenderer.jsx`)
- Add `useGLTF.preload` calls at the bottom of `MenuScene.jsx` for all 3 planet GLBs
- Ref-based `useFrame` for per-planet rotation (same as current loop over `groupRef.current.children`)

**Story 29.2 — System Banner:**
- Edit `SystemNameBanner.jsx`: split the display into two `<div>` elements inside the banner
- Update `system-name-banner` CSS class (likely in `index.css` or a dedicated CSS file) to use `flex-col` layout
- Add `.system-name-banner-subtitle` with smaller font, muted color, animation-delay
- Adjust `--animation-duration` CSS var calculation to account for staggered subtitle

**Story 29.3 — Card UX:**
- In `UpgradesScreen.jsx` → `UpgradeCard`:
  - Remove `truncate` from description `<p>` → add `leading-relaxed text-wrap` or just remove truncate class
  - Move `onClick={handleBuy}` from button to the outer card `<div>`
  - Add `cursor-pointer` to the card div when `canAfford && !isMaxed`
  - Keep the cost button for visual reference but make it non-interactive (or remove its own onClick)

**Story 29.4 — Exponential Scaling:**
- Edit `permanentUpgradesDefs.js` — only the `bonus` values in each `levels[]` array
- No API or store changes needed — `getTotalBonus` sums array values correctly
- Update test files that assert specific bonus totals (search `getTotalBonus` in test files)

## Dependencies

- Story 5.2 (Planet placement) + Epic 12 (PlanetRenderer) — Story 29.1 reuses patterns
- Story 25.3 (Galaxy Choice Screen) — Story 29.1 modifies GalaxyChoice.jsx
- Story 17.2 (System Name Banner) — Story 29.2 extends SystemNameBanner.jsx
- Epic 20 (Permanent Upgrades) — Story 29.3 and 29.4 modify UpgradesScreen + defs
- Story 20.7 (Enriched Ship Stats Display) — ensure upgrade totals displayed elsewhere are consistent with 29.4

## Success Metrics

- Menu screens with 3D planets feel visually richer than sphere placeholders (visual QA)
- System entry banner is readable and feels cinematic (playtest: players notice the two-level text)
- Upgrade card descriptions are fully readable — zero truncation (visual QA on all cards)
- Clicking anywhere on a card triggers purchase (interaction QA)
- Level 5 upgrades feel significantly more powerful than level 1 (playtest: visible in damage numbers / survivability)
