# Story 24.2: Universe Background Enhancement

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the space background to feel more alive and less stark black,
so that the game world is visually richer and more appealing.

## Acceptance Criteria

1. **AC1 — Dark blue background color:** The background color is a very dark blue (e.g. `#0a0a1a`) instead of pure black (`#000000`). The color is subtle enough to maintain readability of all game elements (stars, enemies, projectiles, UI). The background color is configurable in `gameConfig.js` under `ENVIRONMENT_VISUAL_EFFECTS`.

2. **AC2 — Starfield density increase:** Star density is increased slightly for a richer feel. Stars remain visible and distinct against the darker blue background. The multi-layer parallax from Story 15.2 is fully preserved. Total star count stays within a reasonable performance budget.

3. **AC3 — Optional subtle nebula effect:** Subtle nebula-like color gradients appear in the background (very faint, non-distracting). The overall feel is "deep space" not "void" — alive but dark. The effect is simple and lightweight (no measurable FPS impact).

4. **AC4 — Performance preservation:** No measurable FPS impact from background enhancements. Background is rendered behind everything as a simple render pass.

5. **AC5 — Per-galaxy configurability:** The background color and nebula tint are defined in a config structure that supports per-galaxy overrides in the future (for Story 25.3: Galaxy Choice Screen). A default "System 1" config is used now.

## Tasks / Subtasks

- [x] Task 1 — Add background config to gameConfig.js (AC: #1, #5)
  - [x] Add `BACKGROUND` section to `ENVIRONMENT_VISUAL_EFFECTS` with `color` (default: `'#0a0a1a'`), `nebulaEnabled`, `nebulaTint`, `nebulaOpacity`
  - [x] Structure as galaxy-overridable defaults (e.g., `BACKGROUND.DEFAULT` object)
- [x] Task 2 — Set scene background color in GameplayScene (AC: #1)
  - [x] Add `<color attach="background" args={['#0a0a1a']} />` to GameplayScene reading from config
  - [x] Update fog color to harmonize with new background (adjust `AMBIENT_FOG.GAMEPLAY.color` if needed)
- [x] Task 3 — Set scene background in MenuScene and BossScene (AC: #1)
  - [x] MenuScene: same dark blue background color from config
  - [x] BossScene: slightly different tint (purple-shifted dark) to match existing boss atmosphere
  - [x] Add boss-specific background color to config (e.g., `BACKGROUND.BOSS`)
- [x] Task 4 — Increase starfield density (AC: #2)
  - [x] Increase star counts in `STARFIELD_LAYERS` config (e.g., DISTANT: 1200, MID: 1200, NEAR: 800 = 3200 total)
  - [x] Update existing starfield tests to reflect new counts and budget cap
- [x] Task 5 — Add subtle nebula background mesh (AC: #3)
  - [x] Create a large sphere or plane behind the starfield with a procedural gradient material
  - [x] Use MeshBasicMaterial with very low opacity (0.03–0.08) and a blue/purple radial gradient texture (canvas-generated, similar to starTexture.js pattern)
  - [x] Position at large radius behind starfield, no depth write
  - [x] Add to EnvironmentRenderer (Starfield group) or GameplayScene
- [x] Task 6 — Update ground plane color (AC: #1)
  - [x] Adjust EnvironmentRenderer GroundPlane color to harmonize with new background (currently `#0a0a0f`)
- [x] Task 7 — Update tests (AC: #1, #2, #4)
  - [x] Update `gameConfig.starfieldLayers.test.js`: adjust star count expectations and total budget cap
  - [x] Add config tests: `BACKGROUND` section exists with required fields
  - [x] Add config tests: fog color is harmonized with background color (both in dark blue range)

## Dev Notes

### Architecture Compliance — 6-Layer Pattern

- **Config Layer** (`src/config/gameConfig.js`): Add `BACKGROUND` config under `ENVIRONMENT_VISUAL_EFFECTS`
- **Rendering Layer** (`src/renderers/EnvironmentRenderer.jsx`): Optional nebula mesh lives here
- **Scene Layer** (`src/scenes/GameplayScene.jsx`, `MenuScene.jsx`, `BossScene.jsx`): Scene background color set via `<color attach="background">`
- **No store changes**: Background is purely visual config — no game state involved
- **No GameLoop changes**: No tick-based updates needed

### Current Background State (Analysis)

**Canvas setup** (`src/index.jsx` line 20–29):
- R3F `<Canvas>` has no explicit background → defaults to renderer clear color black `#000000`
- No `scene.background` is set anywhere in the scene graph

**Fog** (`src/scenes/GameplayScene.jsx` line 33, 45):
```javascript
const _fog = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS.AMBIENT_FOG.GAMEPLAY
// color: '#050510', density: 0.0003
```
Fog color is currently near-black with a very subtle blue tint. Should be updated to harmonize with the new dark blue background.

**Ground plane** (`src/renderers/EnvironmentRenderer.jsx` line 80–83):
```javascript
<meshBasicMaterial color="#0a0a0f" transparent opacity={0.2} depthWrite={false} />
```
Nearly black with 20% opacity. May need slight color adjustment.

**Starfield** (`src/config/gameConfig.js` lines 308–333):
- 3 layers × 1000 stars = 3000 total
- Colors: blue-white gradient via `defaultColorFn()` in `StarfieldLayer.jsx`
- Current test budget cap: `total <= 3000` in `gameConfig.starfieldLayers.test.js` line 18–21

### Implementation Strategy: Scene Background

Use R3F's declarative `<color>` element:
```jsx
// GameplayScene.jsx
const _bgColor = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS.BACKGROUND.DEFAULT.color

<color attach="background" args={[_bgColor]} />
```

This sets `scene.background = new THREE.Color(...)` declaratively and is cleaned up automatically on unmount. Each scene (Gameplay, Menu, Boss) sets its own background color.

### Implementation Strategy: Nebula Effect

A lightweight approach using a canvas-generated gradient texture on a large sphere:

```jsx
// Inside EnvironmentRenderer or as a new NebulaBackground component
function NebulaBackground({ tint = '#1a1040', opacity = 0.05 }) {
  // Canvas-generated radial gradient (similar to starTexture.js)
  // Large sphere behind starfield (radius > 5000)
  // MeshBasicMaterial, transparent, depthWrite=false, side=BackSide
}
```

Key constraints:
- Must render BEHIND the starfield (larger radius or rendered first)
- Must not interfere with star visibility (very low opacity)
- Must be static (no useFrame needed — zero ongoing cost)
- Use `side: THREE.BackSide` on a sphere so it's visible from inside

### Config Structure (Future Galaxy Support)

```javascript
BACKGROUND: {
  DEFAULT: {
    color: '#0a0a1a',        // Scene clear color
    nebulaEnabled: true,
    nebulaTint: '#1a1040',   // Blue-purple nebula
    nebulaOpacity: 0.05,
  },
  BOSS: {
    color: '#0a0518',        // Purple-shifted for boss
    nebulaEnabled: true,
    nebulaTint: '#2a1050',
    nebulaOpacity: 0.06,
  },
  // Future: per-galaxy overrides (Story 25.3)
  // GALAXY_2: { color: '#0a1a0a', nebulaTint: '#104020', ... }
}
```

### Starfield Count Adjustment

Current: 3000 total (1000 × 3 layers)
Proposed: ~3200 total (1200 DISTANT + 1200 MID + 800 NEAR)

Rationale: DISTANT and MID layers benefit most from density increase (they fill the sky). NEAR layer has fewer but larger/brighter stars. The 200-star increase is negligible for GPU (still under 4000 points total).

Test impact: Update `gameConfig.starfieldLayers.test.js`:
- Line 18–21: Change budget cap from `<= 3000` to `<= 4000`
- Individual layer count expectations need updating

### Fog Color Harmonization

Current fog `#050510` is near-black. With a `#0a0a1a` background, the fog should shift to a similar tone so distant objects fade into the background naturally rather than fading to a different shade.

Suggested update: `AMBIENT_FOG.GAMEPLAY.color` → `'#0a0a1a'` (match background exactly). For boss: `AMBIENT_FOG.BOSS.color` → `'#0a0518'` (match boss background).

### Files to Modify

| File | Change |
|------|--------|
| `src/config/gameConfig.js` | Add `BACKGROUND` config, update `STARFIELD_LAYERS` counts, adjust `AMBIENT_FOG` colors |
| `src/scenes/GameplayScene.jsx` | Add `<color attach="background">` |
| `src/scenes/MenuScene.jsx` | Add `<color attach="background">` |
| `src/scenes/BossScene.jsx` | Add `<color attach="background">` |
| `src/renderers/EnvironmentRenderer.jsx` | Add nebula background mesh (optional), adjust ground plane color |
| `src/config/__tests__/gameConfig.starfieldLayers.test.js` | Update star count expectations |

### Files NOT to Create

No new component files needed — nebula mesh goes inside EnvironmentRenderer as a local function component (similar to existing `Starfield`, `BoundaryRenderer`, `GroundPlane` pattern).

### Performance Considerations

- `<color attach="background">` is a single clear color — zero GPU cost (replaces the default black clear)
- Nebula sphere: 1 draw call, static geometry, no useFrame, no state updates — negligible
- Star count increase from 3000 → 3200: +200 points across 3 draw calls — negligible
- Canvas-generated nebula texture: ~128×128 radial gradient, generated once at init (same pattern as starTexture.js)

### Previous Story Intelligence (Story 24.1)

Story 24.1 is ready-for-dev but not yet implemented. No previous dev notes or learnings available. However, both stories touch `EnvironmentRenderer.jsx` — if 24.1 is implemented first, be aware of any structural changes to the minimap or environment rendering.

### Relevant Story 15.4 Context

Story 15.4 "Ambient Light Zones & Nebula Effects" was marked "not to do" in sprint status. This story (24.2) is a lighter version focusing on:
- Background color change (simple)
- Star density increase (config tweak)
- Optional subtle nebula (single static mesh)

It does NOT include the full ambient light zone system that 15.4 envisioned.

### Git Intelligence

Recent commits focus on permanent upgrades (Story 20.1), loot system (Stories 19.x), and transitions (Stories 17.x). No recent changes to EnvironmentRenderer, StarfieldLayer, or GameplayScene background.

### Project Structure Notes

- All changes align with the 6-layer architecture: Config → Rendering → Scenes
- No new files created — all changes in existing files
- The `BACKGROUND` config follows the existing `ENVIRONMENT_VISUAL_EFFECTS` nesting pattern
- Test updates are in-place within existing test files

### References

- [Source: _bmad-output/planning-artifacts/epic-24-visual-polish-qol.md#Story 24.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#ENVIRONMENT_VISUAL_EFFECTS]
- [Source: src/config/gameConfig.js#ENVIRONMENT_VISUAL_EFFECTS] — Current environment config
- [Source: src/renderers/EnvironmentRenderer.jsx] — Starfield + ground plane + boundaries
- [Source: src/renderers/StarfieldLayer.jsx] — Star rendering with parallax
- [Source: src/renderers/starTexture.js] — Canvas-generated texture pattern (reuse for nebula)
- [Source: src/scenes/GameplayScene.jsx#lines 33-45] — Current fog setup
- [Source: src/scenes/BossScene.jsx#lines 76-102] — Boss fog + purple starfield
- [Source: src/scenes/MenuScene.jsx] — Menu starfield (needs background too)
- [Source: src/config/__tests__/gameConfig.starfieldLayers.test.js] — Existing starfield tests
- [Source: src/index.jsx#lines 20-29] — Canvas setup (no background set)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — clean implementation, no debug issues encountered.

### Completion Notes List
- Task 1: Added `BACKGROUND` config section under `ENVIRONMENT_VISUAL_EFFECTS` with `DEFAULT` and `BOSS` presets. Each preset has `color`, `nebulaEnabled`, `nebulaTint`, `nebulaOpacity`. Harmonized `AMBIENT_FOG` colors to match background colors (`#060614` gameplay, `#06030f` boss). Colors were darkened further per user feedback.
- Task 2: Added `<color attach="background">` to GameplayScene reading from `BACKGROUND.DEFAULT.color`.
- Task 3: Added `<color attach="background">` to MenuScene (DEFAULT) and BossScene (BOSS purple-shifted `#06030f`).
- Task 4: Increased starfield density — DISTANT: 1000→1200, MID: 1000→1200, NEAR: 1000→800, total 3200 (within 4000 budget). Star sizes kept at original values per user feedback.
- Task 5: Added `NebulaBackground` component in EnvironmentRenderer — 128x128 canvas-generated radial gradient on a 6000-radius sphere with `BackSide`, `depthWrite=false`, very low opacity (0.05). Static mesh, no useFrame, zero ongoing cost.
- Task 6: Updated GroundPlane color from `#0a0a0f` to `#060614` to harmonize with new background.
- Task 7: Updated starfield tests (budget cap 3000→4000, individual layer counts), added BACKGROUND config tests (DEFAULT/BOSS existence, nebula fields, fog harmonization), updated fog color expectations in gridVisibility tests.

### Change Log
- 2026-02-15: Implemented Story 24.2 — Universe Background Enhancement. All 7 tasks completed.
- 2026-02-15: Post-review tuning — darkened background colors further (`#060614`/`#06030f`), reverted star size increase per user feedback.
- 2026-02-15: Code review (AI) — Fixed 4 issues: H1 set BOSS.nebulaEnabled=false (dead config), M1 GroundPlane reads color from config, M2 ArenaFloor reads color from BOSS config, M3 fog test now verifies actual harmonization with background.

### Senior Developer Review (AI)
- **Reviewer**: Claude Opus 4.6
- **Date**: 2026-02-15
- **Outcome**: Approved with fixes applied
- **Issues Found**: 1 High, 3 Medium, 3 Low (4 fixed, 3 Low deferred)
- **H1 (FIXED)**: BOSS nebula config was dead code — set `nebulaEnabled: false` to reflect reality
- **M1 (FIXED)**: GroundPlane color hardcoded → now reads `BACKGROUND.DEFAULT.color` from config
- **M2 (FIXED)**: ArenaFloor in BossScene hardcoded `#0a0015` → now reads `BACKGROUND.BOSS.color`
- **M3 (FIXED)**: Fog harmonization test only validated hex format → now verifies fog === background color
- **L1 (DEFERRED)**: No integration test wiring config to scene rendering
- **L2 (DEFERRED)**: Starfield count tests use exact values instead of ranges
- **L3 (DEFERRED)**: BOSS nebula test validates fields that were dead config (now correctly disabled)

### File List
- `src/config/gameConfig.js` — Added BACKGROUND config, updated STARFIELD_LAYERS counts, harmonized AMBIENT_FOG colors
- `src/scenes/GameplayScene.jsx` — Added `<color attach="background">` with dark blue color from config
- `src/scenes/MenuScene.jsx` — Added `<color attach="background">` with dark blue color from config
- `src/scenes/BossScene.jsx` — Added `<color attach="background">` with purple-shifted boss color from config
- `src/renderers/EnvironmentRenderer.jsx` — Added NebulaBackground component (canvas-generated gradient sphere), updated GroundPlane color
- `src/config/__tests__/gameConfig.starfieldLayers.test.js` — Updated star count expectations, budget cap, added BACKGROUND config tests
- `src/config/__tests__/gameConfig.gridVisibility.test.js` — Updated fog color expectations to match harmonized values
