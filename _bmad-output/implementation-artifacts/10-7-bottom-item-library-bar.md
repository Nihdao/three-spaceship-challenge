# Story 10.7: Bottom Item Library Bar

Status: ready-for-dev

## Story

As a player,
I want to see a full library of all collected weapons and boons displayed at the bottom of the screen with their levels,
So that I can track my complete build progression like in Vampire Survivors.

## Acceptance Criteria

1. **Given** the player is in gameplay **When** the bottom HUD bar renders **Then** a horizontal bar spans the full width at the bottom of the screen **And** the bar displays icons for all weapons and boons the player has collected during the run

2. **Given** weapons and boons are displayed **When** they render in the bar **Then** each item shows: icon, level/stack indicator (e.g., "x3" or "Lv5") **And** items are grouped: weapons on the left, boons on the right (or separated by dividers) **And** items are displayed in order of acquisition or by type

3. **Given** the player collects a new weapon or boon **When** it is added to the collection **Then** the new icon appears in the bar with a slide-in or pop animation

4. **Given** a weapon or boon is upgraded **When** the level increases **Then** the level indicator updates with a brief glow/scale animation

5. **Given** the bar is displayed **When** space is limited (many items) **Then** the bar scrolls horizontally or uses a compact grid layout **And** all items remain readable at 1080p resolution

## Tasks / Subtasks

- [ ] Task 1: Create bottom item library bar component structure (AC: #1)
  - [ ] 1.1: Create new component `ItemLibraryBar` (inline in HUD.jsx or separate file)
  - [ ] 1.2: Position bar at absolute bottom of screen (bottom: 0, z-index above 3D scene)
  - [ ] 1.3: Full-width layout (100vw) with semi-transparent background
  - [ ] 1.4: Set appropriate height (e.g., 60-80px) to fit icons without obstructing gameplay
  - [ ] 1.5: Only render when phase === 'gameplay' (hide during menu, game over, etc.)

- [ ] Task 2: Gather all collected weapons and boons from stores (AC: #2)
  - [ ] 2.1: Read `useWeapons((s) => s.activeWeapons)` to get equipped weapons array
  - [ ] 2.2: Read `useBoons((s) => s.activeBoons)` to get equipped boons array
  - [ ] 2.3: Filter out null/empty slots from activeWeapons and activeBoons
  - [ ] 2.4: Combine weapons and boons into a unified display list
  - [ ] 2.5: Order weapons by slot index (left to right: slot 1 → 4)
  - [ ] 2.6: Order boons by slot index (left to right: boon 1 → 3)

- [ ] Task 3: Render weapon icons with level indicators (AC: #2)
  - [ ] 3.1: For each weapon in activeWeapons: Display icon from WEAPONS[weaponId].icon
  - [ ] 3.2: For each weapon: Display level indicator (e.g., "Lv3") overlaid on icon
  - [ ] 3.3: Style weapon icons: square shape, border, semi-transparent background
  - [ ] 3.4: Size icons to fit bar height (e.g., 48x48px or clamp based on viewport)
  - [ ] 3.5: Group weapons on the left side of the bar

- [ ] Task 4: Render boon icons with level/stack indicators (AC: #2)
  - [ ] 4.1: For each boon in activeBoons: Display icon from BOONS[boonId].icon
  - [ ] 4.2: For each boon: Display stack/level indicator (e.g., "x2" if stacked, or omit if single)
  - [ ] 4.3: Style boon icons: distinct from weapons (different border color or shape)
  - [ ] 4.4: Size boon icons same as weapon icons for consistency
  - [ ] 4.5: Group boons on the right side of the bar (or after weapons with divider)

- [ ] Task 5: Add visual separator between weapons and boons (AC: #2)
  - [ ] 5.1: Insert vertical divider line between weapon group and boon group
  - [ ] 5.2: Divider style: thin line (1-2px), semi-transparent white/cyan color
  - [ ] 5.3: Divider height: matches bar height or slightly shorter for aesthetics

- [ ] Task 6: Implement slide-in animation for new items (AC: #3)
  - [ ] 6.1: Track previous weapons/boons lists in useRef (prevWeapons, prevBoons)
  - [ ] 6.2: On render, compare current lists to previous lists to detect new items
  - [ ] 6.3: For new items: Apply slide-in animation (translate-y from bottom, 200-300ms ease-out)
  - [ ] 6.4: Update prevWeapons/prevBoons after animation completes
  - [ ] 6.5: Test: New weapon collected → icon slides in from bottom with smooth motion

- [ ] Task 7: Implement glow/scale animation for upgrades (AC: #4)
  - [ ] 7.1: Track previous levels in useRef (prevWeaponLevels, prevBoonLevels)
  - [ ] 7.2: On render, compare current levels to previous levels to detect upgrades
  - [ ] 7.3: For upgraded items: Apply glow animation (box-shadow pulse, 300ms) + scale (1.0 → 1.2 → 1.0)
  - [ ] 7.4: Update prevLevels after animation completes
  - [ ] 7.5: Test: Weapon upgraded → level indicator glows and scales briefly

- [ ] Task 8: Implement horizontal scroll for overflow (AC: #5)
  - [ ] 8.1: Wrap item list in scrollable container (overflow-x: auto, overflow-y: hidden)
  - [ ] 8.2: Set max-width to viewport width (100vw) and allow horizontal scroll
  - [ ] 8.3: Style scrollbar: thin, semi-transparent, auto-hide when not scrolling
  - [ ] 8.4: Test with 10+ items: Bar scrolls horizontally, all items accessible
  - [ ] 8.5: Alternative: If scroll UX is poor, use compact grid (2 rows) or icon size reduction

- [ ] Task 9: Polish styling and responsive sizing (AC: #5)
  - [ ] 9.1: Background: semi-transparent dark (bg-black/60 or bg-game-bg/80)
  - [ ] 9.2: Border top: subtle line (1px solid rgba(255,255,255,0.1))
  - [ ] 9.3: Padding: 8-12px horizontal, 6-8px vertical for spacing
  - [ ] 9.4: Icon size: clamp(40px, 4vw, 56px) for responsive sizing
  - [ ] 9.5: Level indicator text: small but readable (10-12px, bold, white text with dark outline)
  - [ ] 9.6: Ensure readability at 1080p and 1280x720 (NFR15)
  - [ ] 9.7: Test on ultrawide (21:9) and ensure bar doesn't stretch awkwardly

- [ ] Task 10: Performance and edge case testing (NFR1, NFR5)
  - [ ] 10.1: Test with 0 weapons, 0 boons → Bar renders empty or hidden gracefully
  - [ ] 10.2: Test with 1-4 weapons, 1-3 boons → Bar displays correctly
  - [ ] 10.3: Test with max items (4 weapons + 3 boons) → No visual overflow or layout breaks
  - [ ] 10.4: Test slide-in animation with rapid item collection → No animation stacking issues
  - [ ] 10.5: Test upgrade animation with rapid level-ups → Animations queue or stack gracefully
  - [ ] 10.6: Verify 60 FPS maintained during animations (GPU-accelerated: transform, opacity)
  - [ ] 10.7: Test during intense combat (100+ enemies) → No frame drops from bar rendering
  - [ ] 10.8: Verify bar does not obstruct critical gameplay elements (player ship, enemy positions)

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **UI Layer** → ItemLibraryBar component (new, inline in HUD.jsx or separate file in ui/)
- **Stores** → useWeapons (activeWeapons), useBoons (activeBoons) — read-only
- **Data** → WEAPONS (weaponDefs.js), BOONS (boonDefs.js) — icon, name, level data
- **No Game Logic** → ItemLibraryBar is pure visual display, no state mutations

**Existing Infrastructure:**
- `src/ui/HUD.jsx` — Main HUD component, can integrate ItemLibraryBar inline or import separate component
- `src/stores/useWeapons.jsx` — Provides activeWeapons array (slots 1-4)
- `src/stores/useBoons.jsx` — Provides activeBoons array (slots 1-3)
- `src/entities/weaponDefs.js` — WEAPONS object with icon, name, baseDamage, upgrades
- `src/entities/boonDefs.js` — BOONS object with icon, name, description, stacking rules
- `config/gameConfig.js` — No new constants needed, but could add ITEM_LIBRARY_BAR config if needed

**Current Weapon/Boon Representation:**
- **activeWeapons** array in useWeapons: `[{ weaponId, level, cooldownTimer }, null, null, null]` (4 slots)
- **activeBoons** array in useBoons: `[{ boonId, stacks }, null, null]` (3 slots)
- Weapons have levels (1-9), boons may have stacks (if stacking boon)
- Null slots indicate empty/unequipped

**Story 10.7 Additions:**
- New `ItemLibraryBar` component at bottom of screen (full-width, fixed position)
- Displays all collected weapons (left) and boons (right) with icons and level/stack indicators
- Slide-in animation when new item collected (translate-y from bottom, 200-300ms)
- Glow/scale animation when item upgraded (box-shadow pulse + scale, 300ms)
- Horizontal scroll if items overflow viewport width
- Responsive icon sizing (clamp) for readability across resolutions

### Technical Requirements

**ItemLibraryBar Component Structure:**

```jsx
// Option 1: Inline in HUD.jsx (bottom of HUD component)
// Option 2: Separate file src/ui/ItemLibraryBar.jsx

import { useRef, useEffect } from 'react'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'
import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'

function ItemIcon({ type, id, level, stacks, isNew, isUpgraded }) {
  const ref = useRef(null)
  const def = type === 'weapon' ? WEAPONS[id] : BOONS[id]
  const icon = def?.icon || '❓'
  const displayLevel = type === 'weapon' ? `Lv${level}` : stacks > 1 ? `x${stacks}` : ''

  useEffect(() => {
    if (isNew && ref.current) {
      ref.current.classList.add('item-slide-in')
    }
  }, [isNew])

  useEffect(() => {
    if (isUpgraded && ref.current) {
      ref.current.classList.remove('item-upgraded')
      void ref.current.offsetWidth
      ref.current.classList.add('item-upgraded')
    }
  }, [isUpgraded])

  return (
    <div
      ref={ref}
      className={`relative flex items-center justify-center ${
        type === 'weapon' ? 'border-cyan-500/50' : 'border-purple-500/50'
      } border-2 rounded bg-black/60`}
      style={{
        width: 'clamp(40px, 4vw, 56px)',
        height: 'clamp(40px, 4vw, 56px)',
      }}
    >
      <span style={{ fontSize: 'clamp(20px, 2vw, 32px)' }}>{icon}</span>
      {displayLevel && (
        <span
          className="absolute bottom-0 right-0 bg-black/80 text-white text-xs font-bold px-1 rounded-tl"
          style={{
            fontSize: 'clamp(9px, 0.8vw, 12px)',
            textShadow: '0 0 2px black',
          }}
        >
          {displayLevel}
        </span>
      )}
    </div>
  )
}

export default function ItemLibraryBar() {
  const activeWeapons = useWeapons((s) => s.activeWeapons)
  const activeBoons = useBoons((s) => s.activeBoons)
  const phase = useGame((s) => s.phase)

  const prevWeapons = useRef(activeWeapons)
  const prevBoons = useRef(activeBoons)
  const prevWeaponLevels = useRef({})
  const prevBoonStacks = useRef({})

  // Only render during gameplay
  if (phase !== 'gameplay') return null

  // Filter out null slots
  const weapons = activeWeapons.filter((w) => w !== null)
  const boons = activeBoons.filter((b) => b !== null)

  // Detect new items (simplified, production needs index tracking)
  const newWeaponIds = weapons
    .map((w) => w.weaponId)
    .filter((id) => !prevWeapons.current.some((pw) => pw?.weaponId === id))
  const newBoonIds = boons
    .map((b) => b.boonId)
    .filter((id) => !prevBoons.current.some((pb) => pb?.boonId === id))

  // Detect upgrades
  const upgradedWeaponIds = weapons
    .filter((w) => {
      const prevLevel = prevWeaponLevels.current[w.weaponId] || 0
      return w.level > prevLevel
    })
    .map((w) => w.weaponId)

  const upgradedBoonIds = boons
    .filter((b) => {
      const prevStack = prevBoonStacks.current[b.boonId] || 0
      return (b.stacks || 1) > prevStack
    })
    .map((b) => b.boonId)

  // Update refs after render
  useEffect(() => {
    prevWeapons.current = activeWeapons
    prevBoons.current = activeBoons
    weapons.forEach((w) => {
      prevWeaponLevels.current[w.weaponId] = w.level
    })
    boons.forEach((b) => {
      prevBoonStacks.current[b.boonId] = b.stacks || 1
    })
  })

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-2 px-4 py-2 bg-black/70 border-t border-white/10"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      {/* Weapons group */}
      <div className="flex items-center gap-2">
        {weapons.map((weapon, idx) => (
          <ItemIcon
            key={`weapon-${weapon.weaponId}-${idx}`}
            type="weapon"
            id={weapon.weaponId}
            level={weapon.level}
            isNew={newWeaponIds.includes(weapon.weaponId)}
            isUpgraded={upgradedWeaponIds.includes(weapon.weaponId)}
          />
        ))}
      </div>

      {/* Divider */}
      {weapons.length > 0 && boons.length > 0 && (
        <div className="h-12 w-px bg-white/20" />
      )}

      {/* Boons group */}
      <div className="flex items-center gap-2">
        {boons.map((boon, idx) => (
          <ItemIcon
            key={`boon-${boon.boonId}-${idx}`}
            type="boon"
            id={boon.boonId}
            stacks={boon.stacks || 1}
            isNew={newBoonIds.includes(boon.boonId)}
            isUpgraded={upgradedBoonIds.includes(boon.boonId)}
          />
        ))}
      </div>
    </div>
  )
}
```

**CSS Animations (add to tailwind.config.js or inline styles):**

```css
/* Slide-in animation for new items */
@keyframes item-slide-in {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.item-slide-in {
  animation: item-slide-in 300ms ease-out;
}

/* Upgrade glow/scale animation */
@keyframes item-upgraded {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(34, 211, 238, 0);
  }
  50% {
    transform: scale(1.2);
    box-shadow: 0 0 16px rgba(34, 211, 238, 0.8);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(34, 211, 238, 0);
  }
}

.item-upgraded {
  animation: item-upgraded 300ms ease-out;
}
```

**Integration into HUD.jsx:**

```jsx
// In HUD.jsx, at the bottom of the return statement:
export default function HUD() {
  // ... existing HUD code ...

  return (
    <>
      {/* Full-width XP bar at absolute top */}
      <XPBarFullWidth />

      {/* Top stats, HP, minimap, etc. */}
      {/* ... existing HUD elements ... */}

      {/* NEW: Bottom item library bar */}
      <ItemLibraryBar />
    </>
  )
}
```

### Previous Story Intelligence

**From Story 10.6 (Pause Menu):**
- **Inventory display pattern** — Pause menu shows weapons/boons with icon, name, level/description. ItemLibraryBar follows similar pattern but more compact (icon + level only, no name/description)
- **Individual selectors** — Use `useWeapons((s) => s.activeWeapons)` for performance, avoid entire store re-renders
- **Animation timing** — Pause menu uses 150-300ms fade animations. ItemLibraryBar uses 200-300ms slide-in and 300ms glow/scale for consistency

**From Story 10.5 (Boon Slots):**
- **Visual distinction** — Weapons vs boons: Different border colors (cyan for weapons, purple/magenta for boons)
- **Icon + indicator pattern** — Boon slots show icon + stack indicator. ItemLibraryBar uses same pattern (icon + level/stack in corner)
- **Update animation** — Boon slots glow on update. ItemLibraryBar uses glow + scale for upgrades

**From Story 10.4 (HP & Item Slots):**
- **Top-left cluster pattern** — Weapon slots in top-left use square icons with borders. ItemLibraryBar follows same icon styling at bottom
- **Responsive clamp sizing** — Item slots use clamp() for icon sizes. ItemLibraryBar uses `clamp(40px, 4vw, 56px)` for consistency

**From Story 10.3 (Enhanced Minimap):**
- **Semi-transparent background** — Minimap uses `bg-black/65`. ItemLibraryBar uses `bg-black/70` for consistency
- **Border styling** — Minimap has border-white/10. ItemLibraryBar uses same border-top style

**From Story 10.2 (Top Stats Display):**
- **AnimatedStat pattern** — Top stats use AnimatedStat with scale-up animation on value change. ItemLibraryBar uses similar glow/scale for upgrades
- **Responsive font sizing** — Top stats use clamp() for font sizes. ItemLibraryBar uses clamp() for icon sizes and level text

**From Story 10.1 (XP Bar Redesign):**
- **Full-width positioning** — XP bar uses `fixed top-0 left-0 right-0 z-50`. ItemLibraryBar uses `fixed bottom-0 left-0 right-0 z-30`
- **GPU-accelerated animations** — XP bar uses transform for fill animation. ItemLibraryBar uses transform for slide-in and scale animations

### UX Design Specification Compliance

**From UX Doc (Epic 10 + Vampire Survivors Inspiration):**
- **Item library pattern** — Inspired by Vampire Survivors bottom item bar showing all collected items
- **Horizontal layout** — Items displayed in single row, scroll horizontally if overflow
- **Grouped by type** — Weapons on left, boons on right, separated by divider
- **Icon-based display** — Compact icons with level indicators, no full names (space-efficient)
- **Animations** — New items slide in (200-300ms), upgrades glow/scale (300ms), smooth ease-out timing

**Bottom Bar Specific (Story 10.7):**
- **Full-width bar** — Spans entire viewport width at bottom (100vw)
- **Semi-transparent** — Dark background (bg-black/70) with blur for readability over 3D scene
- **Responsive icons** — Icon size clamps between 40px (small screens) and 56px (large screens)
- **Level indicators** — Small text (9-12px) in corner of icon, white with dark outline/background
- **Horizontal scroll** — If items overflow, allow horizontal scroll with thin, auto-hide scrollbar
- **Readable at 1080p** — Minimum font size 9px for level indicators, icons 40px minimum

**Color Palette:**
- Weapon border: `border-cyan-500/50` (cyan accent from UX spec)
- Boon border: `border-purple-500/50` (purple/magenta for boons, distinct from weapons)
- Background: `bg-black/70` (dark, semi-transparent)
- Border top: `border-white/10` (subtle separator)
- Level indicator text: white with `text-shadow: 0 0 2px black` (outline for readability)
- Divider: `bg-white/20` (semi-transparent white vertical line)

**Animation Details:**
- Slide-in: `translateY(20px) → 0`, opacity 0 → 1, 300ms ease-out
- Upgrade glow: `box-shadow: 0 0 16px rgba(34, 211, 238, 0.8)` at 50% keyframe
- Upgrade scale: `scale(1) → scale(1.2) → scale(1)`, 300ms ease-out
- GPU-accelerated: transform, opacity, box-shadow (avoid layout properties)

### Architecture Guardrails

**File Structure Requirements:**
```
src/ui/ItemLibraryBar.jsx       — New component (bottom item library bar)
  OR
src/ui/HUD.jsx                   — Inline ItemLibraryBar component at bottom
src/stores/useWeapons.jsx        — Read-only (activeWeapons)
src/stores/useBoons.jsx          — Read-only (activeBoons)
src/entities/weaponDefs.js       — Read-only (WEAPONS icon, name)
src/entities/boonDefs.js         — Read-only (BOONS icon, name)
```

**Layer Boundaries:**
- **UI Layer** — ItemLibraryBar reads from stores, no state mutations
- **Stores** — useWeapons, useBoons provide state, no rendering
- **No Game Logic in UI** — ItemLibraryBar is pure visual display, animations triggered by state changes

**Anti-Patterns to AVOID:**
- DO NOT mutate activeWeapons or activeBoons from ItemLibraryBar (read-only)
- DO NOT create new store for item library (use existing useWeapons, useBoons)
- DO NOT animate layout properties (width, height, margin) — use transform, opacity only
- DO NOT use setInterval for animations — use CSS animations or transitions
- DO NOT render item names/descriptions (space-limited, icons + levels only)

**Coding Standards:**
- Component: `ItemLibraryBar.jsx` (PascalCase) or inline in HUD.jsx
- CSS classes: Tailwind utility classes
- Inline styles: camelCase properties (fontSize, textShadow)
- Store subscriptions: Individual selectors (useWeapons((s) => s.activeWeapons))

### Performance Considerations

**NFR1: 60 FPS Gameplay:**
- ItemLibraryBar rendering is lightweight HTML (no 3D rendering)
- Animations use GPU-accelerated properties (transform, opacity, box-shadow)
- Individual store selectors prevent unnecessary re-renders
- Conditional render: only display when phase === 'gameplay'

**NFR5: No Frame Drops During UI Updates:**
- Slide-in/upgrade animations use CSS (GPU-accelerated) instead of JavaScript
- Icon sizing uses clamp() (CSS, no JS recalculations)
- Level indicator overlays use absolute positioning (no layout reflows)
- Animation queue: Multiple upgrades in rapid succession should not stack, use classList remove/add pattern

**Implementation Recommendation:**
```javascript
// GOOD (GPU-accelerated animations):
<div className="item-slide-in" /> // CSS animation
<div className="item-upgraded" />  // CSS animation

// BAD (CPU-bound, causes reflows):
<div style={{ marginTop: isNew ? 0 : 20 }} /> // Layout property animation
```

**Selector Optimization:**
```javascript
// GOOD (individual selectors):
const activeWeapons = useWeapons((s) => s.activeWeapons)
const activeBoons = useBoons((s) => s.activeBoons)

// BAD (entire store re-renders on any change):
const { activeWeapons } = useWeapons()
const { activeBoons } = useBoons()
```

### Git Intelligence (Recent Patterns)

**From commit c7c0e97 (Story 10.2 — Top Stats Display):**
- Files modified: `src/ui/HUD.jsx` (added AnimatedStat component)
- Pattern: Stat display with icon + value, update animation on value change
- Applied to Story 10.7: ItemIcon component with level indicator, glow/scale animation on upgrade

**From commit 3d4d52c (Story 10.1 — XP Bar Code Review):**
- Files modified: `src/ui/HUD.jsx`, `src/ui/XPBarFullWidth.jsx`
- Pattern: Full-width bar at absolute top, GPU-accelerated animations
- Applied to Story 10.7: ItemLibraryBar uses same full-width positioning at bottom, GPU-accelerated slide-in/scale animations

**Applied to Story 10.7:**
- ItemLibraryBar will be added to `src/ui/HUD.jsx` (inline) or `src/ui/ItemLibraryBar.jsx` (separate file)
- No new stores needed (read from existing useWeapons, useBoons)
- Animation patterns consistent with recent Epic 10 stories (AnimatedStat, XPBarFullWidth)
- Responsive clamp() sizing for icons and level text (1080p minimum readability)

**Code Patterns from Recent Commits:**
- Inline styles for dynamic values (icon size, level text size)
- Tailwind classes for static styling (border, background, padding)
- clamp() for responsive sizing across resolutions
- Animation via CSS classes (item-slide-in, item-upgraded)
- Individual store selectors for performance (avoid unnecessary re-renders)
- useRef for tracking previous state (detect new items, upgrades)

### Testing Checklist

**Functional Testing:**
- [ ] ItemLibraryBar renders at bottom of screen during gameplay
- [ ] Bar spans full width (100vw) with semi-transparent background
- [ ] All equipped weapons display with icons and level indicators (Lv1-Lv9)
- [ ] All equipped boons display with icons and stack indicators (x1, x2, x3, etc.)
- [ ] Weapons grouped on left, boons grouped on right
- [ ] Vertical divider separates weapons and boons (if both present)
- [ ] New weapon collected → icon slides in from bottom with smooth animation (200-300ms)
- [ ] New boon collected → icon slides in from bottom with smooth animation (200-300ms)
- [ ] Weapon upgraded → level indicator updates with glow/scale animation (300ms)
- [ ] Boon upgraded/stacked → stack indicator updates with glow/scale animation (300ms)
- [ ] Bar hidden when phase !== 'gameplay' (menu, game over, etc.)

**Visual Testing:**
- [ ] Icons are square with border (cyan for weapons, purple for boons)
- [ ] Icon size responsive: clamp(40px, 4vw, 56px)
- [ ] Level indicator text readable: 9-12px, white with dark outline/background
- [ ] Background semi-transparent: bg-black/70 with subtle blur
- [ ] Border top: thin line (1px solid rgba(255,255,255,0.1))
- [ ] Divider between weapons/boons: vertical line, semi-transparent white
- [ ] Slide-in animation smooth: translateY(20px) → 0, opacity 0 → 1, 300ms ease-out
- [ ] Upgrade animation smooth: scale 1 → 1.2 → 1, glow box-shadow, 300ms ease-out
- [ ] Bar does not obstruct player ship or critical gameplay elements
- [ ] Readable at 1080p and 1280x720 (icons 40px min, text 9px min)

**Animation Testing:**
- [ ] Slide-in animation triggers when new weapon collected (translateY from bottom)
- [ ] Slide-in animation triggers when new boon collected (translateY from bottom)
- [ ] Upgrade animation triggers when weapon level increases (glow + scale)
- [ ] Upgrade animation triggers when boon stacks increase (glow + scale)
- [ ] No visual jitter or layout shifts during animations
- [ ] Animations are GPU-accelerated (use opacity, transform, box-shadow)
- [ ] No frame drops during animations (60 FPS maintained)
- [ ] Multiple upgrades in rapid succession queue gracefully (no animation stacking issues)

**Performance Testing:**
- [ ] 60 FPS maintained when bar is rendering (4 weapons + 3 boons)
- [ ] No frame drops when items added rapidly (rapid level-ups during testing)
- [ ] Individual selectors prevent unnecessary re-renders (only update when activeWeapons/activeBoons change)
- [ ] Bar renders correctly during intense combat (100+ enemies on screen)
- [ ] Animation performance: GPU-accelerated, no CPU spikes during slide-in/scale

**Edge Case Testing:**
- [ ] Bar renders correctly with 0 weapons, 0 boons (empty or hidden gracefully)
- [ ] Bar renders correctly with 1 weapon, 0 boons (no divider)
- [ ] Bar renders correctly with 0 weapons, 1 boon (no divider)
- [ ] Bar renders correctly with max items (4 weapons + 3 boons)
- [ ] Horizontal scroll works if items overflow viewport width (test with 10+ items via dev mode)
- [ ] Scrollbar thin, semi-transparent, auto-hides when not scrolling
- [ ] Weapons always on left, boons always on right (order consistent)
- [ ] Level indicator displays correctly for all weapon levels (Lv1-Lv9)
- [ ] Stack indicator displays correctly for boons (x1, x2, x3, etc.)
- [ ] Rapidly collecting items does not cause animation stacking or visual bugs
- [ ] Rapidly upgrading items does not cause animation stacking or visual bugs

**Accessibility Testing:**
- [ ] Icons have sufficient contrast against background (readability)
- [ ] Level/stack indicator text readable at 1080p minimum (9px min size)
- [ ] Bar does not obstruct critical gameplay information (player HP, enemies)
- [ ] Works on different viewport sizes (16:9, 16:10, ultrawide)
- [ ] Readable on smaller screens (1280x720 minimum)
- [ ] Color-blind friendly: Weapons (cyan) vs boons (purple) distinguishable by border shape or icon if needed

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 10 Story 10.7]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Bottom Item Library Bar]
- [Source: _bmad-output/implementation-artifacts/10-6-pause-menu-with-detailed-inventory.md#Inventory Display Pattern]
- [Source: _bmad-output/implementation-artifacts/10-5-boon-slots-visibility-display.md#Visual Distinction]
- [Source: _bmad-output/implementation-artifacts/10-4-hp-item-slots-reorganization-top-left-cluster.md#Icon Styling]
- [Source: _bmad-output/implementation-artifacts/10-3-enhanced-minimap-styling.md#Semi-Transparent Background]
- [Source: _bmad-output/implementation-artifacts/10-2-top-stats-display-score-fragments-level-kills.md#AnimatedStat Pattern]
- [Source: _bmad-output/implementation-artifacts/10-1-xp-bar-redesign-full-width-top.md#Full-Width Positioning]
- [Source: src/ui/HUD.jsx — AnimatedStat component, formatTimer helper, responsive clamp patterns]
- [Source: src/stores/useWeapons.jsx — activeWeapons array]
- [Source: src/stores/useBoons.jsx — activeBoons array]
- [Source: src/entities/weaponDefs.js — WEAPONS definitions with icons]
- [Source: src/entities/boonDefs.js — BOONS definitions with icons]

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled by dev agent)

### Completion Notes List

(To be filled by dev agent)

### File List

(To be filled by dev agent)
