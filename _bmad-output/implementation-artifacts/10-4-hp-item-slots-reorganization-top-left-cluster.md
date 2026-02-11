# Story 10.4: HP & Item Slots Reorganization (Top-Left Cluster)

Status: ready-for-dev

## Story

As a player,
I want to see my HP bar and equipped weapon slots clearly grouped in the top-left area,
So that I can monitor my health and active loadout at a glance.

## Acceptance Criteria

1. **Given** the player is in gameplay **When** the top-left HUD section renders **Then** the HP bar is displayed prominently at the very top of the cluster **And** the HP bar uses segments or a continuous fill (red for HP, darker background for missing HP) **And** current/max HP values are displayed as text (e.g., "533 / 867")

2. **Given** the HP bar is displayed **When** the player takes damage **Then** the bar animates smoothly as HP decreases **And** when HP drops below 25%, the bar pulses red

3. **Given** the weapon slots are displayed **When** they render below the HP bar **Then** up to 4 weapon slots are shown as square icons in a row or 2x2 grid **And** each equipped weapon shows its icon with its current level (e.g., "Laser Lv3") **And** empty slots are grayed out or show a placeholder icon

4. **Given** a weapon is equipped or upgraded **When** the slot updates **Then** a brief animation (glow, scale) indicates the change

## Tasks / Subtasks

- [ ] Task 1: Analyze current HUD layout and identify reorganization requirements (AC: #1, #3)
  - [ ] 1.1: Review current HUD.jsx structure (HP bar top-left at lines 62-74)
  - [ ] 1.2: Review current weapon slots rendering (bottom-right at lines 201-236, if exists)
  - [ ] 1.3: Identify elements to move to top-left cluster: HP bar (already there), weapon slots (to be moved)
  - [ ] 1.4: Plan layout: Vertical stack (HP bar → weapon slots) or horizontal cluster
  - [ ] 1.5: Determine if stats from Story 10.2 (Kills, Fragments, Score) affect positioning

- [ ] Task 2: Enhance HP bar display with numeric values (AC: #1)
  - [ ] 2.1: Current HP bar has numeric display (line 67-69) — verify format "currentHP / maxHP"
  - [ ] 2.2: Adjust styling if needed for better readability (font size, color, spacing)
  - [ ] 2.3: Ensure numeric display uses tabular-nums for alignment
  - [ ] 2.4: Test HP display at various values (0, mid-range, max)

- [ ] Task 3: HP bar smooth damage animation (AC: #2)
  - [ ] 3.1: Current HP bar uses ProgressBar component (line 72) — verify smooth transition
  - [ ] 3.2: ProgressBar should have CSS transition on width/fill (check ProgressBar.jsx implementation)
  - [ ] 3.3: Test damage animation: HP decreases → bar fill shrinks smoothly (200-300ms ease-out)
  - [ ] 3.4: Verify no visual jitter when taking rapid damage

- [ ] Task 4: HP bar low-HP pulse effect (AC: #2)
  - [ ] 4.1: Current implementation has `hpPulse` boolean (line 53) and `shouldPulseHP()` helper (lines 19-22)
  - [ ] 4.2: Verify ProgressBar accepts `pulse` prop and applies animate-pulse when true
  - [ ] 4.3: Test low-HP pulse: HP < 25% → bar pulses red (animate-pulse or custom keyframe)
  - [ ] 4.4: Ensure pulse is visible but not distracting

- [ ] Task 5: Design weapon slot layout structure (AC: #3)
  - [ ] 5.1: Decide layout: Horizontal row (4 slots in a line) OR 2x2 grid (more compact)
  - [ ] 5.2: Determine slot size: clamp(32px, 3vw, 48px) for icon size
  - [ ] 5.3: Gap between slots: gap-1 or gap-2 (4px or 8px)
  - [ ] 5.4: Position below HP bar with margin (mt-2 or mt-3)

- [ ] Task 6: Create weapon slot component or inline render (AC: #3)
  - [ ] 6.1: Decide if weapon slots need a separate component (WeaponSlots.jsx) or inline in HUD.jsx
  - [ ] 6.2: If inline: Add weapon slots render after HP bar in top-left section (lines 62-74)
  - [ ] 6.3: Subscribe to useWeapons.activeWeapons array (already subscribed at line 41)
  - [ ] 6.4: Map over activeWeapons array to render each slot (up to 4 slots)

- [ ] Task 7: Render weapon slot icons with levels (AC: #3)
  - [ ] 7.1: For each slot, display weapon icon (from WEAPONS def, weaponDefs.js)
  - [ ] 7.2: If weapon equipped: Show icon + level text (e.g., "Lv3" in small font)
  - [ ] 7.3: If slot empty: Show grayed-out placeholder icon (border-dashed, opacity 30%)
  - [ ] 7.4: Use square shape with border-radius-sm (4-6px)
  - [ ] 7.5: Icon background: semi-transparent black or dark gray (bg-black/30 or bg-gray-900/50)

- [ ] Task 8: Style weapon slots for readability (AC: #3)
  - [ ] 8.1: Border: 1-2px solid border (white/20% or cyan/30% for equipped, white/10% for empty)
  - [ ] 8.2: Icon size: clamp(32px, 3vw, 48px) for responsive scaling
  - [ ] 8.3: Level text: Small font (8-10px), positioned at bottom-right corner or below icon
  - [ ] 8.4: Level text color: bright (white or cyan) for visibility
  - [ ] 8.5: Empty slot text: "EMPTY" or icon placeholder (optional)

- [ ] Task 9: Implement weapon slot update animation (AC: #4)
  - [ ] 9.1: Detect when weapon is equipped or upgraded (useEffect on activeWeapons array)
  - [ ] 9.2: Apply animation class or inline style when slot changes (scale-up glow effect)
  - [ ] 9.3: Animation: Scale from 1.0 → 1.15 → 1.0, duration 250-300ms ease-out
  - [ ] 9.4: Glow effect: Box-shadow with weapon color or cyan (0 0 12px rgba(cyan, 0.6))
  - [ ] 9.5: Remove animation class after animation completes (setTimeout or onAnimationEnd event)

- [ ] Task 10: Position weapon slots in top-left cluster (AC: #1, #3)
  - [ ] 10.1: Update HUD.jsx top-left section (lines 62-74) to include weapon slots
  - [ ] 10.2: Vertical stack: HP bar (existing) → weapon slots (new, below HP)
  - [ ] 10.3: Ensure top-left cluster doesn't overlap with stats from Story 10.2 (Kills, Fragments, Score)
  - [ ] 10.4: Adjust spacing/margin between HP bar and weapon slots (mt-2 or mt-3)

- [ ] Task 11: Remove old weapon slot rendering (if exists elsewhere)
  - [ ] 11.1: Check if weapon slots are currently rendered in bottom-right (lines 201-236 in HUD.jsx)
  - [ ] 11.2: If weapon slots exist elsewhere, remove old rendering code
  - [ ] 11.3: Verify no duplicate weapon slot rendering after move to top-left
  - [ ] 11.4: Clean up any orphaned CSS or animation code

- [ ] Task 12: Visual polish and UX color spec compliance (AC: #1, #2, #3, #4)
  - [ ] 12.1: HP bar colors: Red fill (game-hp #FF0033), dark background (bg-black/30)
  - [ ] 12.2: HP text colors: HP label (game-hp red), numeric values (game-text white)
  - [ ] 12.3: Weapon slot borders: Equipped (cyan/30%), Empty (white/10%)
  - [ ] 12.4: Weapon slot backgrounds: Dark semi-transparent (bg-black/30)
  - [ ] 12.5: Level text: White or cyan, bold, small font (8-10px)
  - [ ] 12.6: Update animation: Cyan glow (box-shadow) + scale effect
  - [ ] 12.7: Overall: Cohesive with HUD design (cyber minimal, neon accents)

- [ ] Task 13: Performance validation (NFR1, NFR5)
  - [ ] 13.1: Test HUD rendering with 60 FPS gameplay (no frame drops)
  - [ ] 13.2: Verify weapon slot updates (equip/upgrade) do not cause frame drops
  - [ ] 13.3: Test HP bar animation smoothness (damage taken → bar fill decreases smoothly)
  - [ ] 13.4: Ensure animations are GPU-accelerated (transform, opacity, not layout shifts)
  - [ ] 13.5: Test with 100+ enemies on screen (stress test)

- [ ] Task 14: Accessibility and edge cases
  - [ ] 14.1: Ensure top-left cluster is readable at 1080p and 1280x720 (minimum supported resolutions)
  - [ ] 14.2: Test with different viewport aspect ratios (16:9, 16:10, ultrawide)
  - [ ] 14.3: Verify no overlap with stats from Story 10.2 (Kills, Fragments, Score)
  - [ ] 14.4: Test HP bar at extreme values (0 HP, max HP, fractional HP)
  - [ ] 14.5: Test weapon slots with 0, 1, 2, 3, and 4 weapons equipped
  - [ ] 14.6: Verify weapon slot animation doesn't trigger excessively (debounce if needed)

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **UI Layer** → HUD.jsx modified to reorganize HP bar + add weapon slots to top-left cluster
- **Stores** → usePlayer (HP), useWeapons (activeWeapons) provide data
- **No Game Logic** → HUD reads from stores, no calculations or state updates
- **Rendering Layer** → HUD composes all overlay UI elements

**Existing Infrastructure:**
- `src/ui/HUD.jsx` — Current HUD with HP bar (top-left, lines 62-74), weapon slots may be elsewhere (bottom-right)
- `src/ui/primitives/ProgressBar.jsx` — Reusable progress bar component (used for HP, XP)
- `src/stores/usePlayer.jsx` — Provides currentHP, maxHP
- `src/stores/useWeapons.jsx` — Provides activeWeapons array (up to 4 weapons)
- `src/entities/weaponDefs.js` — Contains WEAPONS definitions with icons, names, levels
- `config/gameConfig.js` — Contains PLAYER_BASE_HP constant

**Current HUD Layout (from Stories 4.2, 8.1, 10.1, 10.2, 10.3):**
- **Top-left:** HP bar + numeric HP display (lines 62-74)
  - HP bar uses ProgressBar component (variant="hp", pulse when < 25%)
  - Numeric display: "currentHP / maxHP" with tabular-nums
- **Top-center:** Timer (MM:SS countdown, hides during boss phase) + Kills count (x273)
- **Top-right:** Minimap (circular, 80-120px, enhanced in Story 10.3)
- **Above minimap (top-left of top-right quadrant):** Stats from Story 10.2 (Kills, Fragments, Score)
- **Bottom-left:** XP bar + LVL number (full-width XP bar added in Story 10.1 at absolute top)
- **Bottom-right:** Dash cooldown + Weapon slots (may exist here, to be moved to top-left)

**Story 10.4 Changes:**
- Reorganize top-left cluster to include: HP bar (existing, enhanced) + Weapon slots (moved from bottom-right or newly added)
- Weapon slots positioned below HP bar in vertical stack
- Weapon slots layout: Horizontal row (4 slots) or 2x2 grid (decide based on space)
- Weapon slot display: Icon + level text for equipped weapons, placeholder for empty slots
- Update animation when weapon equipped or upgraded (scale + glow)
- Ensure no overlap with stats from Story 10.2

### Technical Requirements

**useWeapons Store Fields (already exist):**
```javascript
{
  activeWeapons: [
    { weaponId: 'LASER_FRONT', level: 3, cooldownTimer: 0.5 },
    { weaponId: 'PLASMA_CANNON', level 1, cooldownTimer: 0.0 },
    null, // Empty slot 3
    null, // Empty slot 4
  ],
}
```

**WEAPONS Definitions (weaponDefs.js):**
```javascript
export const WEAPONS = {
  LASER_FRONT: {
    name: 'Laser',
    icon: '🔫', // Or icon path/component
    baseDamage: 10,
    // ... other weapon stats
  },
  PLASMA_CANNON: {
    name: 'Plasma',
    icon: '⚡', // Or icon path/component
    baseDamage: 25,
    // ... other weapon stats
  },
  // ... more weapons
}
```

**Weapon Slot Rendering (Inline in HUD.jsx):**
```jsx
{/* Weapon Slots — below HP bar in top-left */}
<div className="flex gap-2 mt-2">
  {[0, 1, 2, 3].map((slotIndex) => {
    const weapon = activeWeapons[slotIndex]
    const isEquipped = weapon !== null
    const weaponDef = isEquipped ? WEAPONS[weapon.weaponId] : null
    const weaponLevel = isEquipped ? weapon.level : null

    return (
      <div
        key={slotIndex}
        className={`relative flex items-center justify-center ${isEquipped ? 'border-cyan-400/30' : 'border-white/10 border-dashed'}`}
        style={{
          width: 'clamp(32px, 3vw, 48px)',
          height: 'clamp(32px, 3vw, 48px)',
          borderRadius: '4px',
          border: '2px solid',
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        {isEquipped ? (
          <>
            {/* Weapon icon */}
            <span style={{ fontSize: 'clamp(16px, 1.6vw, 24px)' }}>
              {weaponDef?.icon || '?'}
            </span>
            {/* Level indicator */}
            <span
              className="absolute bottom-0 right-0 text-white font-bold"
              style={{ fontSize: '8px', padding: '1px 2px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '2px' }}
            >
              Lv{weaponLevel}
            </span>
          </>
        ) : (
          <span className="text-white/20" style={{ fontSize: '12px' }}>—</span>
        )}
      </div>
    )
  })}
</div>
```

**Update Animation (CSS or inline style):**
```css
@keyframes weaponSlotUpdate {
  0% { transform: scale(1); box-shadow: none; }
  50% { transform: scale(1.15); box-shadow: 0 0 12px rgba(34, 211, 238, 0.6); }
  100% { transform: scale(1); box-shadow: none; }
}

/* Apply via className when weapon changes */
.weapon-slot-updated {
  animation: weaponSlotUpdate 250ms ease-out;
}
```

**Update Animation Trigger (useEffect):**
```javascript
const [updatedSlotIndex, setUpdatedSlotIndex] = React.useState(null)

React.useEffect(() => {
  // Detect weapon change (compare prev activeWeapons to current)
  // Set updatedSlotIndex to the slot that changed
  // Clear after 300ms
  if (updatedSlotIndex !== null) {
    const timer = setTimeout(() => setUpdatedSlotIndex(null), 300)
    return () => clearTimeout(timer)
  }
}, [activeWeapons, updatedSlotIndex])
```

### Previous Story Intelligence (Stories 10.1, 10.2, 10.3)

**From Story 10.1 (XP Bar Redesign):**
- **Full-width bar at top** — Use fixed positioning (fixed top-0 left-0 w-full z-50)
- **GPU-accelerated animations** — Use transform (scaleX) instead of width for smooth fill
- **Pulse effects** — animate-pulse for >80% progress (XP bar)
- **Responsive sizing** — clamp() for height, width (readable at 1080p minimum)

**Applied to Story 10.4:**
- HP bar already uses ProgressBar component (smooth fill animation)
- Weapon slots use clamp() for responsive sizing (32-48px icons)
- Update animation uses transform: scale() (GPU-accelerated)
- No pulse needed for weapon slots (only HP bar has low-HP pulse)

**From Story 10.2 (Top Stats Display):**
- **Top-left cluster** — Kills, Fragments, Score added to top-left area
- **Stats positioned** — Above or adjacent to HP bar (verify no overlap)
- **Stat update animation** — Scale-up briefly when value changes (200-300ms ease-out)
- **Icon + Number format** — Each stat shows icon + number with tabular-nums

**Applied to Story 10.4:**
- Weapon slots positioned below HP bar to avoid overlap with stats
- Weapon slot update animation matches stat update timing (250ms ease-out)
- Weapon slots use icon + level text format (similar to stat icons)
- Overall top-left cluster: Stats (top) → HP bar → Weapon slots (bottom)

**From Story 10.3 (Enhanced Minimap):**
- **Circular minimap** — Top-right corner, 80-120px, cyan border + glow
- **Smooth transitions** — 40ms CSS transitions for dot movement
- **Color theme** — Cyan accents (#00ffcc, #22D3EE) for borders and glows

**Applied to Story 10.4:**
- Weapon slots use similar cyan accent color for equipped borders (#22D3EE/30%)
- Update animation glow uses cyan (box-shadow 0 0 12px cyan)
- Overall HUD cohesion: Cyan/magenta neon accents, dark backgrounds

**From Story 8.1 (Main Menu Overhaul):**
- **Animation timing** — 150-300ms ease-out for UI transitions
- **Color system** — UI palette (dark/sober) separate from 3D effects (saturated neon)
- **Performance** — 60 FPS maintained with animations

**Applied to Story 10.4:**
- Weapon slot update animation duration: 250ms ease-out (within 150-300ms spec)
- Background colors: Dark semi-transparent (bg-black/30)
- Border colors: Cyan for equipped, white/10% for empty
- Performance: GPU-accelerated animations (transform, opacity)

### Git Intelligence (Recent Patterns)

**From commit e0c99a1 (Story 8.2 — Options Menu):**
- Files modified: `src/ui/modals/OptionsModal.jsx`, `src/ui/MainMenu.jsx`, `src/audio/audioManager.js`
- Pattern: New modal components in `src/ui/modals/` directory

**From commit cebd462 (Story 8.1 — Main Menu Overhaul):**
- Files modified: `src/ui/MainMenu.jsx`, `src/scenes/MenuScene.jsx`
- Pattern: 3D background scenes paired with UI overlays

**Applied to Story 10.4:**
- HUD.jsx will be modified (reorganize top-left cluster, add/move weapon slots)
- No new files needed (all modifications to existing HUD.jsx)
- No new stores or systems needed (reads from existing usePlayer, useWeapons)
- Inline weapon slot rendering (no separate component unless complexity warrants it)

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

**Story 10.4 Specific Requirements (from Epic 10 Story 10.4):**
- **HP Bar** — Prominently displayed at top of cluster, current/max HP text, red fill, pulse when < 25%
- **Weapon Slots** — Below HP bar, up to 4 slots, icon + level display, empty placeholder for unused slots
- **Layout** — Vertical stack or horizontal cluster (decide based on space constraints)
- **Update Animation** — Glow + scale effect when weapon equipped or upgraded (200-300ms ease-out)

**Color Palette (from UX Doc):**
- HP bar fill: `text-game-hp` (#FF0033 red)
- HP bar background: `bg-black/30` (dark semi-transparent)
- HP text: `text-game-hp` (red for label), `text-game-text` (white for numbers)
- Weapon slot border (equipped): `border-cyan-400/30` (#22D3EE cyan 30% opacity)
- Weapon slot border (empty): `border-white/10` (white 10% opacity)
- Weapon slot background: `bg-black/30` (dark semi-transparent)
- Level text: `text-white` (white, bold, small font)
- Update glow: `box-shadow: 0 0 12px rgba(34, 211, 238, 0.6)` (cyan glow)

**Typography (from UX Doc):**
- HP label: Inter font, bold, clamp(11px, 1.1vw, 15px)
- HP numeric: Inter font, tabular-nums, clamp(10px, 1vw, 14px)
- Weapon level text: Inter font, bold, 8-10px

**Animation Timing (from UX Doc):**
- HP bar fill transition: 200-300ms ease-out (ProgressBar component)
- Weapon slot update animation: 250ms ease-out (scale + glow)
- Low-HP pulse: 500ms ease-in-out infinite alternate (animate-pulse)

### Architecture Guardrails

**File Structure Requirements (Architecture.md):**
```
src/ui/HUD.jsx            — Modified (reorganize top-left cluster, add/move weapon slots)
src/ui/primitives/ProgressBar.jsx — No changes (already used for HP bar)
src/stores/usePlayer.jsx  — No changes (currentHP, maxHP already exist)
src/stores/useWeapons.jsx — No changes (activeWeapons already exists)
```

**Layer Boundaries (Architecture.md 6-Layer):**
- **UI Layer** — HUD.jsx reads from stores, no game logic
- **Stores** — usePlayer and useWeapons provide state, no rendering
- **No Game Logic in UI** — HUD is pure visual display, reads from stores only

**Anti-Patterns to AVOID:**
- DO NOT put game logic in HUD (read-only from stores)
- DO NOT modify store state directly from HUD (use actions only, but HUD is read-only)
- DO NOT create new store for weapon slots (use existing useWeapons)
- DO NOT animate layout properties (width, height, margin) — use transform, opacity only
- DO NOT render weapon slots in multiple places (remove old rendering if exists)

**Coding Standards (Architecture.md Naming):**
- Component: `HUD.jsx` (already exists, PascalCase)
- CSS classes: Tailwind utility classes (kebab-case via Tailwind)
- Inline styles: camelCase properties (backgroundColor, borderRadius, boxShadow)
- Store subscriptions: Individual selectors for performance (useWeapons((s) => s.activeWeapons))

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- Weapon slot rendering is lightweight HTML (no 3D rendering)
- Update animation uses GPU-accelerated properties (transform: scale, box-shadow)
- Individual store selectors prevent unnecessary re-renders (only update when activeWeapons changes)
- HP bar uses ProgressBar component (already optimized with CSS transitions)

**NFR5: No Frame Drops During UI Updates:**
- Weapon slot update animation must not block rendering
- Use CSS animations (GPU-accelerated) instead of JavaScript setInterval
- Debounce update animation if needed (prevent excessive triggers during rapid weapon changes)
- Test with rapid weapon equip/upgrade sequences

**Implementation Recommendation:**
```javascript
// GOOD (GPU-accelerated update animation):
<div
  className="transition-transform duration-250 ease-out"
  style={{
    transform: isUpdated ? 'scale(1.15)' : 'scale(1)',
    boxShadow: isUpdated ? '0 0 12px rgba(34, 211, 238, 0.6)' : 'none',
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
const activeWeapons = useWeapons((s) => s.activeWeapons)

// BAD (entire store re-renders on any change):
const { activeWeapons } = useWeapons()
```

### Testing Checklist

**Functional Testing:**
- [ ] HP bar displays current/max HP numerically (e.g., "533 / 867")
- [ ] HP bar fills proportionally to currentHP / maxHP ratio
- [ ] HP bar animates smoothly when taking damage (fill decreases with transition)
- [ ] HP bar pulses red when HP drops below 25%
- [ ] Weapon slots render below HP bar in top-left cluster (vertical stack)
- [ ] Up to 4 weapon slots are displayed (horizontal row or 2x2 grid)
- [ ] Equipped weapons show icon + level text (e.g., "Laser Lv3")
- [ ] Empty weapon slots show placeholder (dashed border, grayed out)
- [ ] Weapon slot update animation triggers when weapon equipped or upgraded (scale + glow)
- [ ] Update animation completes and removes after 250-300ms

**Visual Testing:**
- [ ] HP bar colors match UX spec: Red fill (#FF0033), dark background (bg-black/30)
- [ ] HP numeric text uses tabular-nums for alignment
- [ ] Weapon slots positioned below HP bar without overlap with stats from Story 10.2
- [ ] Weapon slot size is responsive: clamp(32px, 3vw, 48px)
- [ ] Equipped weapon borders use cyan (#22D3EE/30%), empty borders use white/10%
- [ ] Weapon level text is readable: 8-10px, bold, white color
- [ ] Update glow uses cyan color (box-shadow 0 0 12px rgba(cyan, 0.6))
- [ ] Overall top-left cluster is cohesive with HUD design (cyber minimal, neon accents)
- [ ] Readable at 1080p and 1280x720 (minimum supported resolutions)
- [ ] Contrast meets accessibility standards (>4.5:1)

**Animation Testing:**
- [ ] HP bar fill transition is smooth (200-300ms ease-out)
- [ ] HP bar low-HP pulse activates at < 25% HP (animate-pulse or custom keyframe)
- [ ] Weapon slot update animation triggers on equip/upgrade (scale 1.0 → 1.15 → 1.0)
- [ ] Update animation duration is 250ms ease-out
- [ ] Update glow effect appears and disappears smoothly
- [ ] No visual jitter or layout shifts during animations
- [ ] Multiple rapid weapon changes don't cause animation stacking (debounce if needed)

**Performance Testing:**
- [ ] 60 FPS maintained during gameplay with HP bar and weapon slots rendering
- [ ] HP bar damage animation doesn't cause frame drops
- [ ] Weapon slot update animation doesn't cause frame drops
- [ ] Works correctly with 100+ enemies on screen (stress test)
- [ ] Individual selectors prevent unnecessary re-renders (only update when HP or weapons change)

**Edge Case Testing:**
- [ ] HP bar at 0 HP displays correctly (empty bar, red pulse active)
- [ ] HP bar at max HP displays correctly (full bar, no pulse)
- [ ] HP bar with fractional HP displays correctly (e.g., 533.75 HP → displays "533 / 867" or "534 / 867")
- [ ] Weapon slots with 0 weapons display correctly (4 empty placeholder slots)
- [ ] Weapon slots with 1 weapon display correctly (1 filled + 3 empty)
- [ ] Weapon slots with 4 weapons display correctly (4 filled slots)
- [ ] Weapon slot update animation triggers only once per change (no repeated triggers)
- [ ] Top-left cluster doesn't overlap with stats from Story 10.2 (Kills, Fragments, Score)
- [ ] Works on different viewport sizes (16:9, 16:10, ultrawide)
- [ ] Weapon slots hide correctly during boss phase (if HUD hides, slots hide too)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 10 Story 10.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#UI Layer]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#HUD Layout]
- [Source: _bmad-output/implementation-artifacts/10-1-xp-bar-redesign-full-width-top.md#Animation Patterns]
- [Source: _bmad-output/implementation-artifacts/10-2-top-stats-display-score-fragments-level-kills.md#Color Palette]
- [Source: _bmad-output/implementation-artifacts/10-3-enhanced-minimap-styling.md#Cyan Accent Theme]
- [Source: src/ui/HUD.jsx — Current HUD layout (HP bar lines 62-74, weapon slots may be bottom-right)]
- [Source: src/ui/primitives/ProgressBar.jsx — Reusable progress bar component]
- [Source: src/stores/usePlayer.jsx — currentHP, maxHP fields]
- [Source: src/stores/useWeapons.jsx — activeWeapons array]
- [Source: src/entities/weaponDefs.js — WEAPONS definitions with icons, names]
- [Source: config/gameConfig.js — PLAYER_BASE_HP constant]

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled by dev agent)

### Completion Notes List

(To be filled by dev agent)

### File List

(To be filled by dev agent)
