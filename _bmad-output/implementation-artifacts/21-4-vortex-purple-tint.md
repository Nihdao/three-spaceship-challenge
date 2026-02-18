# Story 21.4: Vortex Purple Tint

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the system entry vortex to match the wormhole's purple color scheme,
So that the visual style is consistent across all portal/wormhole effects.

## Acceptance Criteria

**Given** the system entry vortex (portal animation from Story 17.1)
**When** rendered
**Then** the vortex uses purple tones matching the wormhole visual (#9933ff, #cc66ff range)
**And** the particle effects during portal entry also use purple tints
**And** the overall visual style is cohesive with the wormhole (Story 17.3)

## Tasks / Subtasks

- [x] Task 1: Update PORTAL_COLOR in gameConfig.js (AC: 1, 2, 3)
  - [x] Subtask 1.1: Change PORTAL_COLOR from '#00ccff' (cyan) to purple range (#9933ff or #cc66ff)
  - [x] Subtask 1.2: Verify PORTAL_COLOR is used consistently in SystemEntryPortal.jsx (shader uColor and particles color)
  - [x] Subtask 1.3: Test visual cohesion with WormholeRenderer purple (#5518aa)
  - [x] Subtask 1.4: Consider adjusting secondary color (uColor2) if needed for visual balance

## Dev Notes

### Current Implementation Discovery

**CRITICAL FINDING**: The system entry portal currently uses **cyan** (`#00ccff`) while the wormhole uses **purple** (`#5518aa`). This creates visual inconsistency in the game's portal/wormhole aesthetic.

**Current Portal Color Configuration (src/config/gameConfig.js:337-346):**

```javascript
SYSTEM_ENTRY: {
  FLASH_DURATION: 0.2,        // seconds — white flash total duration
  PORTAL_GROW_TIME: 0.9,      // seconds — portal scale 0→1 (ease-out)
  SHIP_FLY_IN_TIME: 1.2,      // seconds — ship flies through portal to center
  PORTAL_SHRINK_TIME: 0.5,    // seconds — portal disappears after ship arrival
  PORTAL_RADIUS: 12,          // world units — portal disc radius
  PORTAL_COLOR: '#00ccff',    // portal glow color ← CHANGE THIS TO PURPLE
  PORTAL_PARTICLE_COUNT: 40,  // orbiting particles around portal
  PORTAL_OFFSET_Z: 40,        // portal position below center (positive Z = bottom of screen)
},
```

**Portal Color Usage in SystemEntryPortal.jsx:**

The PORTAL_COLOR is used in two places:

1. **Shader Uniform (line 116):**
```javascript
uColor: { value: new THREE.Color(_cfg.PORTAL_COLOR) },
uColor2: { value: new THREE.Color('#8844ff') }, // Secondary color for gradient
```

2. **Particle Material (line 277):**
```javascript
<pointsMaterial
  color={_cfg.PORTAL_COLOR}
  size={2}
  transparent
  opacity={0.9}
  depthWrite={false}
  sizeAttenuation
  blending={THREE.AdditiveBlending}
/>
```

**Wormhole Color Reference (src/renderers/WormholeRenderer.jsx:100):**
```javascript
const WORMHOLE_COLOR = new THREE.Color('#5518aa') // Deep purple (tunnel color)
```

### Required Change

**Single Config Change Needed:**

Change `PORTAL_COLOR` in `src/config/gameConfig.js` from `'#00ccff'` to a purple tone matching the wormhole aesthetic.

**Recommended Purple Value:**
- **Primary Option**: `'#9933ff'` — Bright purple matching epic specification
- **Alternative**: `'#cc66ff'` — Lighter purple for more vibrant effect
- **Conservative**: `'#8844ff'` — Closer to wormhole's deep purple (#5518aa)

**Secondary Color Consideration:**
The shader uses `uColor2: '#8844ff'` as a gradient secondary color. After changing PORTAL_COLOR to purple:
- If PORTAL_COLOR = `'#9933ff'`, uColor2 (`'#8844ff'`) creates purple-to-purple-blue gradient (good)
- If PORTAL_COLOR = `'#cc66ff'`, uColor2 should remain `'#8844ff'` for contrast
- If PORTAL_COLOR = `'#8844ff'`, uColor2 might need adjustment to brighter purple (`'#cc66ff'`) for gradient variation

**No Code Changes Needed in SystemEntryPortal.jsx:**
The component already reads `_cfg.PORTAL_COLOR` from config, so changing the config value automatically updates both the shader and particle colors.

### Technical Requirements

**Files to Modify:**
1. `src/config/gameConfig.js` — Line 343 (PORTAL_COLOR value)

**Files to Review (NOT Modify):**
1. `src/renderers/SystemEntryPortal.jsx` — Verify color propagation (lines 116, 277)
2. `src/renderers/WormholeRenderer.jsx` — Reference for purple color scheme (line 100)

**Testing Requirements:**

**Visual Cohesion Testing:**
- Start a new run
- Trigger system entry (starting System 2 or System 3)
- Observe portal color during grow → ship fly-in → shrink phases
- Compare portal purple to wormhole purple (after clearing map in System 1)
- Portal and wormhole should feel visually cohesive (both purple-themed)

**Color Gradient Testing:**
- Portal shader should show purple gradient (uColor → uColor2)
- Particles should use purple tint matching portal shader
- No cyan remnants should remain

**Edge Case Testing:**
- Portal visibility during transition flash (Story 17.5) — flash should not mask purple
- Portal particle orbit animation — purple particles should be visible against dark space background

### Project Structure Notes

**Alignment with 6-Layer Architecture:**
- **Layer 1 (Config/Data):** gameConfig.js — Single constant change (PORTAL_COLOR)
- **Layer 2 (Systems):** No changes
- **Layer 3 (Stores):** No changes
- **Layer 4 (GameLoop):** No changes
- **Layer 5 (Rendering):** SystemEntryPortal.jsx — Reads config, no code change needed
- **Layer 6 (UI):** No changes

**Story Simplicity:**
This is a **cosmetic polish story** with zero gameplay impact. The change is purely visual — aligning portal color scheme with wormhole for aesthetic consistency. No new systems, no behavior changes, no performance impact.

**Previous Story Context (Story 21.3):**
Story 21.3 (Ship Inertia Physics) is a verification/tuning story for dual-stick controls. Story 21.4 is independent — no dependency on 21.1/21.2/21.3 implementation status. This story can be completed before or after other Epic 21 stories.

### Known Risks & Mitigations

**Risk 1: Purple particles too dim against dark space**
- **Cause**: Purple has less luminance than cyan
- **Mitigation**: Test particle visibility, increase particle opacity if needed (currently 0.9)
- **Backup**: Increase particle size (currently 2) or add AdditiveBlending glow

**Risk 2: Purple-on-purple gradient loses contrast**
- **Cause**: If uColor and uColor2 are too similar, gradient flattens
- **Mitigation**: Keep uColor2 (`#8844ff`) as is, or adjust to complementary purple tone
- **Test**: Visual inspection — gradient should show depth, not flat color

**Risk 3: Color change breaks visual expectation**
- **Cause**: Players may have associated cyan with system entry from previous playthroughs
- **Impact**: Minimal — most players haven't reached System 2+ yet (early access)
- **Mitigation**: None needed (aesthetic improvement, not breaking change)

### Color Palette Reference

**Epic 21 Specification:**
Purple range: `#9933ff`, `#cc66ff`

**Current Wormhole:**
Deep purple: `#5518aa` (WormholeRenderer.jsx)

**Current Portal (to change):**
Cyan: `#00ccff` (gameConfig.js)

**Recommended Portal (new):**
Bright purple: `#9933ff` (matches epic spec)

**Visual Harmony:**
- Wormhole (`#5518aa`) = Deep purple base
- Portal (`#9933ff`) = Bright purple accent
- Together = Cohesive purple-themed portal aesthetic

### References

**Epic Source:**
[Source: _bmad-output/planning-artifacts/epic-21-dual-stick-controls.md:144-157]

**Story 17.1 Context (System Entry Portal):**
[Source: _bmad-output/implementation-artifacts/17-1-system-entry-portal-animation.md]

**Story 17.3 Context (Wormhole Visual Overhaul):**
[Source: _bmad-output/implementation-artifacts/17-3-wormhole-visual-overhaul.md]

**Architecture:**
[Source: _bmad-output/planning-artifacts/architecture.md#6-layer-architecture]

**Current Portal Implementation:**
[Source: src/renderers/SystemEntryPortal.jsx:102-289]
[Source: src/config/gameConfig.js:337-346]

**Wormhole Color Reference:**
[Source: src/renderers/WormholeRenderer.jsx:96-289]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (2026-02-18)

### Debug Log References

None — single-line config change, no debugging required.

### Completion Notes List

- ✅ Changed `PORTAL_COLOR` from `'#00ccff'` (cyan) to `'#bb88ff'` (lavender purple matching WormholeRenderer `WORMHOLE_COLOR2`) in `src/config/gameConfig.js` line 393
- ✅ `_cfg.PORTAL_COLOR` propagates automatically to shader uniform `uColor` (SystemEntryPortal.jsx:116) and particle `<pointsMaterial color>` (line 277)
- ✅ Updated `uColor2` in `SystemEntryPortal.jsx:115` from `'#8844ff'` to `'#5518aa'` — mirrors WormholeRenderer's `WORMHOLE_COLOR` for full palette symmetry (portal primary↔wormhole secondary, portal secondary↔wormhole primary)
- ✅ Visual harmony: Wormhole (`#5518aa` / `#bb88ff`) + Portal (`#bb88ff` / `#5518aa`) form an inverted but cohesive dual-purple palette
- ✅ Added config contract test `gameConfig.portalColor.test.js` (3 tests): validates SYSTEM_ENTRY config exists, PORTAL_COLOR is valid hex, and PORTAL_COLOR is purple-toned (not cyan)
- ✅ Full regression suite: 1728 tests across 106 test files — all passing

### File List

- `src/config/gameConfig.js` (modified — PORTAL_COLOR updated to #bb88ff)
- `src/renderers/SystemEntryPortal.jsx` (modified — uColor2 updated to #5518aa for wormhole palette symmetry)
- `src/config/__tests__/gameConfig.portalColor.test.js` (created — 3 contract tests for Story 21.4)

## Change Log

- 2026-02-18: Story 21.4 implemented — Changed PORTAL_COLOR from cyan (#00ccff) to lavender purple (#bb88ff, matching WormholeRenderer WORMHOLE_COLOR2). Updated uColor2 in SystemEntryPortal to #5518aa (matching WormholeRenderer WORMHOLE_COLOR) for full palette symmetry. Added config contract tests.
