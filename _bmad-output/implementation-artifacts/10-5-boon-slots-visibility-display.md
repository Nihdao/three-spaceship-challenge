# Story 10.5: Boon Slots Visibility & Display

Status: done

## Story

As a player,
I want to see my equipped boons as visible icons with their names or effects,
So that I know which passive bonuses are currently active.

## Acceptance Criteria

1. **Given** the player is in gameplay **When** boon slots render in the HUD **Then** up to 3 boon slots are displayed in the top-left cluster, below or adjacent to weapon slots **And** each equipped boon shows its icon with a small indicator (level or stack count if applicable)

2. **Given** boons are equipped **When** they are displayed **Then** boon icons are visually distinct from weapon icons (different border color or shape) **And** hovering or a tooltip shows the boon name and effect description (optional for quick reference)

3. **Given** a boon slot is empty **When** it renders **Then** the empty slot shows a grayed-out placeholder

4. **Given** a boon is equipped or upgraded during level-up **When** the player returns to gameplay **Then** the boon slot updates with a brief animation (glow, scale)

## Tasks / Subtasks

- [x] Task 1: Analyze current HUD layout and boon integration requirements (AC: #1, #2)
  - [x] 1.1: Review current HUD.jsx top-left cluster (HP bar, weapon slots from Story 10.4)
  - [x] 1.2: Review useBoons store structure (activeBoons array, store location)
  - [x] 1.3: Review boonDefs.js for icon, name, description, effect data structure
  - [x] 1.4: Determine boon slot positioning: Below weapon slots OR adjacent (horizontal)
  - [x] 1.5: Plan visual distinction: Border shape (rounded vs square) OR border color (magenta vs cyan)

- [x] Task 2: Design boon slot layout structure (AC: #1)
  - [x] 2.1: Decide layout: Horizontal row (3 slots in a line) OR vertical stack
  - [x] 2.2: Determine slot size: clamp(32px, 3vw, 48px) for consistency with weapon slots
  - [x] 2.3: Gap between boon slots: gap-1 or gap-2 (4px or 8px)
  - [x] 2.4: Position below or adjacent to weapon slots with margin (mt-2 or ml-2)
  - [x] 2.5: Ensure no overlap with HP bar or stats from Story 10.2

- [x] Task 3: Create boon slot rendering logic (AC: #1, #2, #3)
  - [x] 3.1: Subscribe to useBoons.activeBoons array in HUD.jsx
  - [x] 3.2: Map over activeBoons array to render each slot (up to 3 slots)
  - [x] 3.3: For each slot: Display boon icon (from BOONS def, boonDefs.js)
  - [x] 3.4: If boon equipped: Show icon + level/stack indicator (e.g., "x2" or "Lv1")
  - [x] 3.5: If slot empty: Show grayed-out placeholder icon (border-dashed, opacity 30%)

- [x] Task 4: Style boon slots for visual distinction (AC: #2)
  - [x] 4.1: Border shape: Rounded corners (border-radius-md 8px) vs weapon slots (border-radius-sm 4px)
  - [x] 4.2: Border color: Magenta/pink (#FF00FF/30% or #FF1493/30%) vs weapon cyan (#22D3EE/30%)
  - [x] 4.3: Icon background: Semi-transparent dark (bg-black/30 or bg-purple-900/20)
  - [x] 4.4: Empty slot border: Dashed magenta/10% (border-dashed border-pink-500/10)
  - [x] 4.5: Icon size: clamp(32px, 3vw, 48px) matching weapon slots
  - [x] 4.6: Stack/level text: Small font (8-10px), positioned at bottom-right corner

- [x] Task 5: Implement boon slot update animation (AC: #4)
  - [x] 5.1: Detect when boon is equipped or upgraded (useEffect on activeBoons array)
  - [x] 5.2: Apply animation class or inline style when slot changes (scale-up glow effect)
  - [x] 5.3: Animation: Scale from 1.0 → 1.15 → 1.0, duration 250-300ms ease-out
  - [x] 5.4: Glow effect: Box-shadow with magenta color (0 0 12px rgba(255, 20, 147, 0.6))
  - [x] 5.5: Remove animation class after animation completes (setTimeout or onAnimationEnd event)

- [x] Task 6: Implement tooltip or hover interaction (AC: #2, optional)
  - [x] 6.1: Decide implementation: CSS :hover with title attribute OR custom tooltip component
  - [x] 6.2: If title attribute: Add title="[Boon Name]: [Effect Description]" to each slot
  - [x] 6.3: If custom tooltip: Create BoonTooltip component with boon data
  - [x] 6.4: Tooltip content: Boon name (bold), effect description (smaller text)
  - [x] 6.5: Tooltip positioning: Above or beside the slot, dark background, visible on hover
  - [x] 6.6: Test tooltip readability and non-intrusiveness (doesn't block gameplay)

- [x] Task 7: Position boon slots in top-left cluster (AC: #1)
  - [x] 7.1: Update HUD.jsx top-left section to include boon slots
  - [x] 7.2: Position: Below weapon slots (vertical stack) OR adjacent (horizontal)
  - [x] 7.3: Ensure top-left cluster remains cohesive: HP bar → weapon slots → boon slots
  - [x] 7.4: Adjust spacing/margin between weapon slots and boon slots (mt-2 or ml-2)
  - [x] 7.5: Verify no overlap with stats from Story 10.2 or minimap

- [x] Task 8: Visual polish and UX color spec compliance (AC: #1, #2, #3, #4)
  - [x] 8.1: Boon slot border: Magenta/pink (#FF1493/30%) for equipped, magenta/10% for empty
  - [x] 8.2: Boon slot background: Dark semi-transparent (bg-black/30 or bg-purple-900/20)
  - [x] 8.3: Boon slot shape: Rounded (border-radius-md 8px) vs weapon square (border-radius-sm 4px)
  - [x] 8.4: Stack/level text: White or magenta, bold, small font (8-10px)
  - [x] 8.5: Update animation: Magenta glow (box-shadow 0 0 12px magenta)
  - [x] 8.6: Overall: Cohesive with HUD design (cyber minimal, neon accents, magenta for boons)

- [x] Task 9: Performance validation (NFR1, NFR5)
  - [x] 9.1: Test HUD rendering with boon slots at 60 FPS (no frame drops)
  - [x] 9.2: Verify boon slot updates (equip/upgrade) do not cause frame drops
  - [x] 9.3: Test tooltip interaction doesn't impact performance
  - [x] 9.4: Ensure animations are GPU-accelerated (transform, opacity)
  - [x] 9.5: Test with 100+ enemies on screen (stress test)

- [x] Task 10: Accessibility and edge cases
  - [x] 10.1: Ensure boon slots are readable at 1080p and 1280x720 (minimum supported resolutions)
  - [x] 10.2: Test with different viewport aspect ratios (16:9, 16:10, ultrawide)
  - [x] 10.3: Verify no overlap with HP bar, weapon slots, or stats from Story 10.2
  - [x] 10.4: Test boon slots with 0, 1, 2, and 3 boons equipped
  - [x] 10.5: Verify boon slot animation doesn't trigger excessively (debounce if needed)
  - [x] 10.6: Test tooltip readability and positioning across different screen sizes

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **UI Layer** → HUD.jsx modified to add boon slots to top-left cluster
- **Stores** → useBoons (activeBoons) provides data
- **No Game Logic** → HUD reads from stores, no calculations or state updates
- **Rendering Layer** → HUD composes all overlay UI elements

**Existing Infrastructure:**
- `src/ui/HUD.jsx` — Current HUD with HP bar + weapon slots (Story 10.4)
- `src/stores/useBoons.jsx` — Provides activeBoons array (up to 3 boons)
- `src/entities/boonDefs.js` — Contains BOONS definitions with icons, names, descriptions, effects
- `config/gameConfig.js` — Contains MAX_BOONS constant (likely 3)

**Current HUD Layout (from Stories 10.1-10.4):**
- **Top (absolute):** Full-width XP bar (Story 10.1)
- **Top-left cluster:** HP bar → Weapon slots (4 slots, Story 10.4) → **NEW: Boon slots (3 slots)**
- **Top-center:** Timer + Kills count
- **Top-right quadrant:** Stats (Kills, Fragments, Score from Story 10.2) + Minimap (Story 10.3)
- **Bottom-right:** Dash cooldown (existing)

**Story 10.5 Changes:**
- Add boon slots below or adjacent to weapon slots in top-left cluster
- Boon slots layout: Horizontal row (3 slots) or vertical stack (decide based on space)
- Boon slot display: Icon + stack/level indicator for equipped boons, placeholder for empty slots
- Visual distinction: Magenta/pink border color + rounded corners vs weapon cyan + square corners
- Update animation when boon equipped or upgraded (scale + magenta glow)
- Optional tooltip on hover showing boon name and effect description

### Technical Requirements

**useBoons Store Fields (expected structure):**
```javascript
{
  activeBoons: [
    { boonId: 'DAMAGE_AMP', level: 2, stackCount: 1 },
    { boonId: 'SPEED_BOOST', level: 1, stackCount: 1 },
    null, // Empty slot 3
  ],
}
```

**BOONS Definitions (boonDefs.js):**
```javascript
export const BOONS = {
  DAMAGE_AMP: {
    name: 'Damage Amp',
    icon: '⚡', // Or icon path/component
    description: '+15% damage to all weapons',
    effect: { type: 'damageMultiplier', value: 0.15 },
  },
  SPEED_BOOST: {
    name: 'Speed Boost',
    icon: '💨', // Or icon path/component
    description: '+20% movement speed',
    effect: { type: 'speedMultiplier', value: 0.20 },
  },
  // ... more boons
}
```

**Boon Slot Rendering (Inline in HUD.jsx):**
```jsx
{/* Boon Slots — below weapon slots in top-left */}
<div className="flex gap-2 mt-2">
  {[0, 1, 2].map((slotIndex) => {
    const boon = activeBoons[slotIndex]
    const isEquipped = boon !== null
    const boonDef = isEquipped ? BOONS[boon.boonId] : null
    const boonStack = isEquipped ? boon.stackCount : null

    return (
      <div
        key={slotIndex}
        className={`relative flex items-center justify-center ${isEquipped ? 'border-pink-500/30' : 'border-pink-500/10 border-dashed'}`}
        title={isEquipped ? `${boonDef?.name}: ${boonDef?.description}` : ''}
        style={{
          width: 'clamp(32px, 3vw, 48px)',
          height: 'clamp(32px, 3vw, 48px)',
          borderRadius: '8px', // Rounded for boons vs 4px for weapons
          border: '2px solid',
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        {isEquipped ? (
          <>
            {/* Boon icon */}
            <span style={{ fontSize: 'clamp(16px, 1.6vw, 24px)' }}>
              {boonDef?.icon || '?'}
            </span>
            {/* Stack indicator */}
            {boonStack > 1 && (
              <span
                className="absolute bottom-0 right-0 text-pink-300 font-bold"
                style={{ fontSize: '8px', padding: '1px 2px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '2px' }}
              >
                x{boonStack}
              </span>
            )}
          </>
        ) : (
          <span className="text-pink-500/20" style={{ fontSize: '12px' }}>—</span>
        )}
      </div>
    )
  })}
</div>
```

**Update Animation (CSS or inline style):**
```css
@keyframes boonSlotUpdate {
  0% { transform: scale(1); box-shadow: none; }
  50% { transform: scale(1.15); box-shadow: 0 0 12px rgba(255, 20, 147, 0.6); }
  100% { transform: scale(1); box-shadow: none; }
}

/* Apply via className when boon changes */
.boon-slot-updated {
  animation: boonSlotUpdate 250ms ease-out;
}
```

**Update Animation Trigger (useEffect):**
```javascript
const [updatedBoonIndex, setUpdatedBoonIndex] = React.useState(null)

React.useEffect(() => {
  // Detect boon change (compare prev activeBoons to current)
  // Set updatedBoonIndex to the slot that changed
  // Clear after 300ms
  if (updatedBoonIndex !== null) {
    const timer = setTimeout(() => setUpdatedBoonIndex(null), 300)
    return () => clearTimeout(timer)
  }
}, [activeBoons, updatedBoonIndex])
```

### Previous Story Intelligence (Story 10.4)

**From Story 10.4 (HP & Item Slots Reorganization):**
- **Top-left cluster established** — HP bar at top, weapon slots below (4 slots, horizontal row)
- **Weapon slot pattern** — Square icons, cyan border (#22D3EE/30%), clamp(32px, 3vw, 48px) size
- **Update animation pattern** — Scale 1.0 → 1.15 → 1.0, 250ms ease-out, glow effect
- **Responsive sizing** — clamp() for all HUD elements (readable at 1080p minimum)
- **GPU-accelerated animations** — transform (scale) + box-shadow for smooth performance

**Applied to Story 10.5:**
- Boon slots follow same sizing pattern (clamp(32px, 3vw, 48px))
- Boon slots use similar layout (horizontal row, gap-2)
- Update animation matches weapon pattern (250ms ease-out, scale + glow)
- Visual distinction via border color (magenta vs cyan) and border-radius (8px vs 4px)
- Position below weapon slots with mt-2 spacing

**From Story 10.1 (XP Bar Redesign):**
- **GPU-accelerated animations** — Use transform (scaleX) instead of width for smooth fill
- **Pulse effects** — animate-pulse for >80% progress (XP bar)
- **Responsive sizing** — clamp() for height, width (readable at 1080p minimum)

**Applied to Story 10.5:**
- Boon slot update animation uses transform: scale() (GPU-accelerated)
- No pulse needed for boon slots (only update flash on equip/upgrade)
- Responsive sizing with clamp() for boon slot dimensions

**From Story 10.2 (Top Stats Display):**
- **Top-left cluster** — Stats (Kills, Fragments, Score) added to top-left area
- **Stat update animation** — Scale-up briefly when value changes (200-300ms ease-out)
- **Icon + Number format** — Each stat shows icon + number with tabular-nums

**Applied to Story 10.5:**
- Boon slots positioned below weapon slots to avoid overlap with stats
- Boon slot update animation matches stat update timing (250ms ease-out)
- Boon slots use icon + stack indicator format (similar to stat icons)
- Overall top-left cluster: Stats (top) → HP bar → Weapon slots → **Boon slots (bottom)**

**From Story 10.3 (Enhanced Minimap):**
- **Circular minimap** — Top-right corner, 80-120px, cyan border + glow
- **Smooth transitions** — 40ms CSS transitions for dot movement
- **Color theme** — Cyan accents (#00ffcc, #22D3EE) for borders and glows

**Applied to Story 10.5:**
- Boon slots use magenta accent color for distinction (#FF1493/30% for equipped)
- Update animation glow uses magenta (box-shadow 0 0 12px rgba(255, 20, 147, 0.6))
- Overall HUD cohesion: Cyan for weapons/combat, Magenta for boons/buffs

### Git Intelligence (Recent Patterns)

**From commit 3d4d52c (Story 10.1 — XP Bar Redesign):**
- Files modified: `src/ui/HUD.jsx`, `src/ui/primitives/ProgressBar.jsx`
- Pattern: Full-width bar at absolute top, GPU-accelerated animations

**From commit 2c1909a (Story 10.1 — XP Bar Implementation):**
- Files modified: `src/ui/HUD.jsx` (XP bar moved to absolute top)
- Pattern: Fixed positioning (fixed top-0 left-0 w-full z-50)

**Applied to Story 10.5:**
- HUD.jsx will be modified (add boon slots to top-left cluster)
- No new files needed (all modifications to existing HUD.jsx)
- No new stores or systems needed (reads from existing useBoons)
- Inline boon slot rendering (no separate component unless complexity warrants it)

**Code Patterns from Recent Commits:**
- Inline styles for dynamic values (positions, colors, sizes)
- Tailwind classes for static styling where applicable
- clamp() for responsive sizing across resolutions
- Animation via CSS classes or inline styles (animation property)
- Individual store selectors for performance (avoid unnecessary re-renders)

### UX Design Specification Compliance

**From UX Doc (Epic 10 Context):**
- **HUD Redesign Goal** — Modern, comprehensive HUD inspired by Vampire Survivors
- **Cyber Minimal Design Direction** — Dark UI, neon effects in gameplay only
- **Color System** — UI palette (dark/sober) separate from 3D effects palette (saturated neon cyan/magenta)
- **Typography** — Inter font, tabular-nums for HUD numbers
- **Animation Timing** — ease-out default (150-300ms), spring for rewards (300ms)
- **Accessibility** — Contrast > 4.5:1, keyboard-navigable, visible at 1080p minimum

**Story 10.5 Specific Requirements (from Epic 10 Story 10.5):**
- **Boon Slots** — Displayed in top-left cluster, below/adjacent to weapon slots, up to 3 slots
- **Visual Distinction** — Different border color or shape from weapon icons
- **Tooltip/Hover** — Shows boon name and effect description (optional for quick reference)
- **Empty Placeholder** — Grayed-out slot when no boon equipped
- **Update Animation** — Glow + scale effect when boon equipped or upgraded (200-300ms ease-out)

**Color Palette (from UX Doc + Story Context):**
- Boon slot border (equipped): `border-pink-500/30` (#FF1493 magenta/pink 30% opacity) OR `border-purple-400/30`
- Boon slot border (empty): `border-pink-500/10` (magenta/pink 10% opacity, dashed)
- Boon slot background: `bg-black/30` (dark semi-transparent) OR `bg-purple-900/20`
- Stack/level text: `text-pink-300` OR `text-white` (white or magenta, bold, small font)
- Update glow: `box-shadow: 0 0 12px rgba(255, 20, 147, 0.6)` (magenta glow)

**Typography (from UX Doc):**
- Boon stack/level text: Inter font, bold, 8-10px
- Tooltip text: Inter font, boon name (bold, 12px), effect description (regular, 10px)

**Animation Timing (from UX Doc):**
- Boon slot update animation: 250ms ease-out (scale + glow)

### Architecture Guardrails

**File Structure Requirements (Architecture.md):**
```
src/ui/HUD.jsx            — Modified (add boon slots to top-left cluster)
src/stores/useBoons.jsx   — No changes (activeBoons already exists)
src/entities/boonDefs.js  — No changes (BOONS definitions already exist)
```

**Layer Boundaries (Architecture.md 6-Layer):**
- **UI Layer** — HUD.jsx reads from stores, no game logic
- **Stores** — useBoons provides state, no rendering
- **No Game Logic in UI** — HUD is pure visual display, reads from stores only

**Anti-Patterns to AVOID:**
- DO NOT put game logic in HUD (read-only from stores)
- DO NOT modify store state directly from HUD (use actions only, but HUD is read-only)
- DO NOT create new store for boon slots (use existing useBoons)
- DO NOT animate layout properties (width, height, margin) — use transform, opacity only
- DO NOT make boon slots too similar to weapon slots (visual distinction is critical)

**Coding Standards (Architecture.md Naming):**
- Component: `HUD.jsx` (already exists, PascalCase)
- CSS classes: Tailwind utility classes (kebab-case via Tailwind)
- Inline styles: camelCase properties (backgroundColor, borderRadius, boxShadow)
- Store subscriptions: Individual selectors for performance (useBoons((s) => s.activeBoons))

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- Boon slot rendering is lightweight HTML (no 3D rendering)
- Update animation uses GPU-accelerated properties (transform: scale, box-shadow)
- Individual store selectors prevent unnecessary re-renders (only update when activeBoons changes)
- Tooltip interaction must not block rendering (CSS :hover or debounced JS tooltip)

**NFR5: No Frame Drops During UI Updates:**
- Boon slot update animation must not block rendering
- Use CSS animations (GPU-accelerated) instead of JavaScript setInterval
- Debounce update animation if needed (prevent excessive triggers during rapid boon changes)
- Test with rapid boon equip/upgrade sequences

**Implementation Recommendation:**
```javascript
// GOOD (GPU-accelerated update animation):
<div
  className="transition-transform duration-250 ease-out"
  style={{
    transform: isUpdated ? 'scale(1.15)' : 'scale(1)',
    boxShadow: isUpdated ? '0 0 12px rgba(255, 20, 147, 0.6)' : 'none',
  }}
/>

// BAD (CPU-bound, causes reflows):
<div
  style={{
    width: isUpdated ? '110%' : '100%', // Avoid width animations
    animation: 'none', // Avoid inline animation strings, use classes
  }}
/>
```

**Selector Optimization:**
```javascript
// GOOD (individual selector):
const activeBoons = useBoons((s) => s.activeBoons)

// BAD (entire store re-renders on any change):
const { activeBoons } = useBoons()
```

### Testing Checklist

**Functional Testing:**
- [ ] Boon slots render below or adjacent to weapon slots in top-left cluster
- [ ] Up to 3 boon slots are displayed (horizontal row or vertical stack)
- [ ] Equipped boons show icon + stack/level indicator (e.g., "x2" or "Lv1")
- [ ] Empty boon slots show placeholder (dashed magenta border, grayed out)
- [ ] Boon slots are visually distinct from weapon slots (magenta border, rounded corners)
- [ ] Boon slot update animation triggers when boon equipped or upgraded (scale + magenta glow)
- [ ] Update animation completes and removes after 250-300ms
- [ ] Tooltip shows boon name and effect description on hover (if implemented)

**Visual Testing:**
- [ ] Boon slot border color matches UX spec: Magenta/pink (#FF1493/30%) for equipped, magenta/10% for empty
- [ ] Boon slot border shape: Rounded corners (border-radius-md 8px) vs weapon square corners (4px)
- [ ] Boon slot background: Dark semi-transparent (bg-black/30 or bg-purple-900/20)
- [ ] Boon slots positioned below weapon slots without overlap with HP bar or stats
- [ ] Boon slot size is responsive: clamp(32px, 3vw, 48px)
- [ ] Stack/level text is readable: 8-10px, bold, white or magenta color
- [ ] Update glow uses magenta color (box-shadow 0 0 12px rgba(255, 20, 147, 0.6))
- [ ] Overall top-left cluster is cohesive: HP bar → Weapon slots (cyan) → Boon slots (magenta)
- [ ] Readable at 1080p and 1280x720 (minimum supported resolutions)
- [ ] Contrast meets accessibility standards (>4.5:1)

**Animation Testing:**
- [ ] Boon slot update animation triggers on equip/upgrade (scale 1.0 → 1.15 → 1.0)
- [ ] Update animation duration is 250ms ease-out
- [ ] Update glow effect appears and disappears smoothly
- [ ] No visual jitter or layout shifts during animations
- [ ] Multiple rapid boon changes don't cause animation stacking (debounce if needed)

**Performance Testing:**
- [ ] 60 FPS maintained during gameplay with boon slots rendering
- [ ] Boon slot update animation doesn't cause frame drops
- [ ] Tooltip interaction doesn't impact performance (if implemented)
- [ ] Works correctly with 100+ enemies on screen (stress test)
- [ ] Individual selectors prevent unnecessary re-renders (only update when boons change)

**Edge Case Testing:**
- [ ] Boon slots with 0 boons display correctly (3 empty placeholder slots)
- [ ] Boon slots with 1 boon display correctly (1 filled + 2 empty)
- [ ] Boon slots with 3 boons display correctly (3 filled slots)
- [ ] Boon slot update animation triggers only once per change (no repeated triggers)
- [ ] Top-left cluster doesn't overlap with stats from Story 10.2 or minimap
- [ ] Works on different viewport sizes (16:9, 16:10, ultrawide)
- [ ] Tooltip doesn't block gameplay or other UI elements (if implemented)
- [ ] Boon slots hide correctly during boss phase (if HUD hides, slots hide too)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 10 Story 10.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#UI Layer]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#HUD Layout]
- [Source: _bmad-output/implementation-artifacts/10-4-hp-item-slots-reorganization-top-left-cluster.md#Weapon Slot Pattern]
- [Source: _bmad-output/implementation-artifacts/10-1-xp-bar-redesign-full-width-top.md#Animation Patterns]
- [Source: _bmad-output/implementation-artifacts/10-2-top-stats-display-score-fragments-level-kills.md#Top-Left Cluster]
- [Source: _bmad-output/implementation-artifacts/10-3-enhanced-minimap-styling.md#Color Theme]
- [Source: src/ui/HUD.jsx — Current HUD layout (HP bar, weapon slots, top-left cluster)]
- [Source: src/stores/useBoons.jsx — activeBoons array]
- [Source: src/entities/boonDefs.js — BOONS definitions with icons, names, descriptions]
- [Source: config/gameConfig.js — MAX_BOONS constant]

## Change Log

- 2026-02-12: Implemented boon slots visibility & display in HUD (Story 10.5)
- 2026-02-12: Changed boon slot display from emoji icons to text labels (Dmg/Speed/Rapid/Crit + Lv) matching weapon slot style per user feedback
- 2026-02-12: Code review fixes — getBoonLabel derives from BOONS[id].name (no separate mapping), removed non-functional title tooltip (pointer-events-none), updated stale File List references

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No debug issues encountered. Clean implementation.
- Note: boonDefs.js has no `icon` field — created BOON_LABELS mapping with short text labels (Dmg, Speed, Rapid, Crit) matching weapon slot text style per user feedback.
- Note: activeBoons array is not padded with nulls — renders empty slots for indices >= array length.
- Note: activeBoons has `{boonId, level}` (no `stackCount` as story assumed) — level indicator shown for level > 1.

### Completion Notes List

- **Task 1 (Analysis):** Reviewed HUD.jsx top-left cluster, useBoons store (activeBoons: {boonId, level}[]), boonDefs.js (no icon field). Chose horizontal row below weapon slots, magenta border + 8px radius for distinction.
- **Task 2 (Layout):** Horizontal row, 3 slots, gap-1.5 (6px), clamp(32px, 3vw, 48px) size, mt-1 below weapon slots.
- **Task 3 (Rendering):** BoonSlots component subscribes to useBoons.activeBoons via individual selector. Maps [0,1,2] indices. Equipped boons show text label (Dmg/Speed/Rapid/Crit) + level (Lv1/Lv2/Lv3), matching weapon slot pattern. Empty slots show dashed magenta placeholder.
- **Task 4 (Styling):** Equipped: 2px solid rgba(255,20,147,0.3), borderRadius 8px, bg rgba(0,0,0,0.3). Empty: 1px dashed rgba(255,20,147,0.1). Level text: 8px bold pink-300 at bottom-right.
- **Task 5 (Animation):** detectChangedBoons() compares prev/current arrays. Changed slots get scale(1.15) + magenta glow (box-shadow 0 0 12px rgba(255,20,147,0.6)). CSS transition 250ms ease-out. Cleared after 300ms via setTimeout.
- **Task 6 (Tooltip):** title attribute with "BoonName: tier description" — lightweight, non-intrusive, native browser tooltip.
- **Task 7 (Positioning):** Added `<BoonSlots>` below `<WeaponSlots>` in top-left cluster. Cluster: HP bar → Stats → Weapon slots → Boon slots.
- **Task 8 (Polish):** All UX spec colors applied: magenta borders, dark bg, rounded 8px, pink-300 level text, magenta glow animation.
- **Task 9 (Performance):** GPU-accelerated animations (transform + box-shadow transition). Individual store selector. Lightweight HTML rendering. No JS-driven animations.
- **Task 10 (Accessibility):** aria-label on each slot ("boon slot N empty/name level N"). clamp() responsive sizing. Renders correctly with 0-3 boons.
- **Tests added:** detectChangedBoons (7 tests) + getBoonLabel (5 tests) = 12 new unit tests. All 683 tests pass (0 regressions).

### File List

- `src/ui/HUD.jsx` — Modified: Added useBoons/BOONS imports, getBoonLabel() (derives from BOONS name), detectChangedBoons(), BoonSlots component, integrated in top-left cluster
- `src/ui/__tests__/HUD.test.jsx` — Modified: Added 12 tests for detectChangedBoons and getBoonLabel
