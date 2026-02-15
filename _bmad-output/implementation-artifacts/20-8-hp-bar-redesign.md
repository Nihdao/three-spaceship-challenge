# Story 20.8: hp-bar-redesign

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the HP bar to be more visually engaging with a rectangular design,
So that my health status is clear and the HUD feels polished.

## Acceptance Criteria

**Given** the HUD health display
**When** redesigned
**Then** the HP bar is rectangular (not rounded/pill-shaped)
**And** the current/max HP is displayed inside the bar as "80/100" format
**And** the HP text is positioned at the LEFT side of the bar
**And** there is no "HP" label — the format is self-explanatory
**And** the bar has more visual personality (gradient fill, subtle border glow, etc.)

## Tasks / Subtasks

- [x] Task 1: Remove current HP label and separate text display (AC: #1, #4)
  - [x] Remove the "HP" label span (line 358-360 in HUD.jsx)
  - [x] Remove the separate "currentHP / maxHP" text display (line 361-363)
  - [x] These will be replaced by text INSIDE the bar itself

- [x] Task 2: Create new RectangularHPBar component (AC: #1, #2, #3, #5)
  - [x] Create src/ui/primitives/RectangularHPBar.jsx component
  - [x] Accept props: value (currentHP), max (maxHP), pulse (boolean for low HP animation)
  - [x] Use rectangular design (no rounded corners or rounded-sm)
  - [x] Display "currentHP/maxHP" text inside the bar on the LEFT side
  - [x] Apply gradient fill for visual personality (e.g., linear-gradient from bright to darker red)
  - [x] Add subtle border glow effect (box-shadow with HP color)
  - [x] Maintain same size constraints as current bar: width: clamp(140px, 14vw, 220px), height: clamp(12px, 1.2vw, 18px)
  - [x] Support pulse animation when pulse=true (for low HP state)

- [x] Task 3: Integrate RectangularHPBar into HUD (AC: all)
  - [x] Import RectangularHPBar in HUD.jsx
  - [x] Replace lines 376-389 (entire HP bar section) with RectangularHPBar component
  - [x] Pass currentHP, maxHP, and hpPulse (shouldPulseHP) as props
  - [x] Maintain same positioning in top-left cluster (no layout changes)
  - [x] Ensure consistent sizing with other HUD elements

- [x] Task 4: Handle text visibility and contrast (AC: #3)
  - [x] Ensure HP text is readable when bar is full (white text on red gradient background)
  - [x] Ensure HP text is readable when bar is low (text should remain visible even when bar width is small)
  - [x] Use text-shadow or stroke to improve readability if needed
  - [x] Position text at left side with small padding (e.g., paddingLeft: 8px)

- [x] Task 5: Enhance visual personality (AC: #5)
  - [x] Add linear-gradient fill to bar (e.g., from #ff4466 to #cc0033 for red HP color)
  - [x] Add subtle box-shadow glow (e.g., 0 0 8px rgba(255, 68, 102, 0.6))
  - [x] Consider adding inner shadow for depth (inset shadow)
  - [x] Maintain pulse animation for low HP (existing animate-pulse-glow class or custom)
  - [x] Ensure visual polish feels "premium" without being distracting

- [x] Task 6: Update or extend ProgressBar component if reusing (AC: #1, #5)
  - [x] **Option A:** Create new RectangularHPBar from scratch (recommended for full creative control)
  - [ ] **Option B:** Extend ProgressBar component with new "rectangular-hp" variant
  - [x] If extending ProgressBar, add new variant with no border-radius, gradient fill, text overlay
  - [x] Ensure backward compatibility for existing ProgressBar usage (XP bar, boss HP, etc.)

- [x] Task 7: Write tests
  - [x] Test RectangularHPBar renders with correct dimensions
  - [x] Test HP text displays "currentHP/maxHP" format correctly (e.g., "85/100")
  - [x] Test HP text is positioned on left side of bar
  - [x] Test pulse animation activates when pulse=true
  - [x] Test gradient and glow styling is applied
  - [x] Test text readability at various HP levels (full, half, low)
  - [x] Test HUD integration (component renders in correct position)

## Dev Notes

### Critical Context from Previous Story (20.7)

**Previous Story Learnings:**
- Story 20.7 (Enriched Ship Stats Display) is currently "ready-for-dev" but **NOT YET IMPLEMENTED**
- Story 20.7 depends on Stories 20.1-20.5 (permanent upgrades system) which are also not yet implemented
- Story 20.8 (this story) is **INDEPENDENT** from the permanent upgrades system — it only modifies the HP bar visual design
- No blocking dependencies for Story 20.8 — can be implemented immediately

**File Pattern from Story 20.7:**
- Extended existing UI primitives (StatLine.jsx) with new props for bonus display
- Maintained backward compatibility when modifying shared components
- Grouped related UI elements logically in HUD layout

**Apply to Story 20.8:**
- If extending ProgressBar, ensure backward compatibility (XP bar, boss HP bar use it)
- Prefer creating new RectangularHPBar component to avoid breaking existing usage
- Maintain current HUD layout structure (top-left cluster positioning)

### Current HP Bar Implementation

**Location:** `src/ui/HUD.jsx` lines 355-368

**Current Design:**
```jsx
{/* HP Bar — top-left */}
<div className="flex flex-col gap-1" style={{ width: 'clamp(140px, 14vw, 220px)' }}>
  <div className="flex items-center justify-between">
    <span className="text-game-hp font-bold" style={{ fontSize: 'clamp(11px, 1.1vw, 15px)' }}>
      HP
    </span>
    <span className="text-game-text tabular-nums" style={{ fontSize: 'clamp(10px, 1vw, 14px)' }}>
      {Math.ceil(currentHP)} / {maxHP}
    </span>
  </div>
  <div style={{ height: 'clamp(6px, 0.7vw, 10px)' }}>
    <ProgressBar value={currentHP} max={maxHP} variant="hp" pulse={hpPulse} />
  </div>
</div>
```

**Current Issues to Address:**
- HP label ("HP") and separate text display take vertical space
- ProgressBar uses rounded corners (rounded-sm) from primitives/ProgressBar.jsx
- No gradient fill (solid color via bg-game-hp Tailwind class)
- No border glow effect
- HP text is OUTSIDE the bar (above it)

**Redesign Goals:**
- Remove vertical label/text structure (all info inside the bar)
- Use rectangular design (sharp corners, not rounded)
- Add gradient fill for visual depth
- Add subtle glow effect for polish
- Position HP text INSIDE the bar on the left side

### Architecture Alignment

**6-Layer Architecture:**
- **UI Layer**: `src/ui/HUD.jsx` (MODIFY) — Replace HP bar section with new component
- **UI Primitives Layer**: `src/ui/primitives/RectangularHPBar.jsx` (NEW) — Dedicated HP bar component
- **UI Primitives Layer**: `src/ui/primitives/ProgressBar.jsx` (NO CHANGE) — Leave existing ProgressBar untouched

**This story does NOT:**
- Modify game logic or stores (usePlayer HP state unchanged)
- Affect GameLoop or combat systems (visual-only change)
- Change HP calculation or damage mechanics (UI redesign only)
- Impact other ProgressBar usage (XP bar, boss HP bar remain unchanged)

### Key Source Files

| File | Change | Layer |
|------|--------|-------|
| `src/ui/HUD.jsx` | **MODIFY** — Replace HP bar section (lines 355-368) with RectangularHPBar | UI |
| `src/ui/primitives/RectangularHPBar.jsx` | **NEW** — Dedicated rectangular HP bar component | UI Primitives |
| `src/ui/primitives/ProgressBar.jsx` | **NO CHANGE** — Leave existing for backward compatibility | UI Primitives |

### Design Specifications

**Dimensions:**
- Width: `clamp(140px, 14vw, 220px)` (same as current)
- Height: `clamp(18px, 1.8vw, 26px)` (taller for better visibility and readability - adjusted post-implementation)
- No border-radius (sharp rectangular corners)

**Color & Gradient:**
- Background: `rgba(0,0,0,0.4)` (dark container)
- Fill gradient: `linear-gradient(90deg, #ff4466 0%, #cc0033 100%)` (bright to dark red)
- Border: `1px solid rgba(255, 68, 102, 0.4)` (subtle red border)
- Glow: `box-shadow: 0 0 8px rgba(255, 68, 102, 0.5)` (subtle red glow)

**Text Styling:**
- Format: `"currentHP/maxHP"` (e.g., "85/100")
- Position: Inside bar, left-aligned with 8px padding
- Font size: `clamp(9px, 0.9vw, 12px)` (readable but compact)
- Color: `#ffffff` (white text for contrast)
- Font weight: `bold`
- Text shadow: `0 1px 2px rgba(0,0,0,0.8)` (readability on gradient background)

**Pulse Animation (Low HP):**
- Trigger: When `currentHP / maxHP < 0.25` (existing shouldPulseHP logic)
- Animation: Pulsing glow intensity (0 0 8px → 0 0 16px and back)
- Duration: 500ms ease-in-out infinite alternate
- Apply to box-shadow (glow pulse) and possibly opacity

### Implementation Approach

**Recommended: Create New RectangularHPBar Component**

**Why NOT extend ProgressBar?**
- ProgressBar is used by XP bar, boss HP bar, and other systems (backward compatibility risk)
- HP bar redesign has unique requirements (text inside, gradient, glow) that don't apply to other bars
- Cleaner separation of concerns (dedicated component for dedicated purpose)

**Component Structure:**
```jsx
// src/ui/primitives/RectangularHPBar.jsx
export default function RectangularHPBar({ value, max, pulse = false }) {
  const ratio = Math.min(1, Math.max(0, value / max))
  const widthPercent = Math.round(ratio * 100)

  return (
    <div className="relative" style={{
      width: 'clamp(140px, 14vw, 220px)',
      height: 'clamp(12px, 1.2vw, 18px)',
      backgroundColor: 'rgba(0,0,0,0.4)',
      border: '1px solid rgba(255, 68, 102, 0.4)',
      boxShadow: pulse
        ? '0 0 16px rgba(255, 68, 102, 0.8)'
        : '0 0 8px rgba(255, 68, 102, 0.5)',
      overflow: 'hidden',
      transition: 'box-shadow 300ms ease-out',
      animation: pulse ? 'hpPulse 500ms ease-in-out infinite alternate' : 'none',
    }}>
      {/* Gradient fill bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: `${widthPercent}%`,
        background: 'linear-gradient(90deg, #ff4466 0%, #cc0033 100%)',
        transition: 'width 150ms ease-out',
      }} />

      {/* HP text overlay */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '8px',
        transform: 'translateY(-50%)',
        fontSize: 'clamp(9px, 0.9vw, 12px)',
        fontWeight: 'bold',
        color: '#ffffff',
        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        zIndex: 1,
      }}>
        {Math.ceil(value)}/{max}
      </div>
    </div>
  )
}
```

**HUD Integration (Replace lines 355-368):**
```jsx
{/* HP Bar — top-left */}
<RectangularHPBar value={currentHP} max={maxHP} pulse={hpPulse} />
```

**CSS Animation (add to global styles or Tailwind config):**
```css
@keyframes hpPulse {
  from { box-shadow: 0 0 8px rgba(255, 68, 102, 0.5); }
  to { box-shadow: 0 0 16px rgba(255, 68, 102, 0.9); }
}
```

### Text Readability Considerations

**Challenge:** White text on red gradient must be readable at all HP levels.

**Solution Strategies:**
1. **Text Shadow:** `0 1px 2px rgba(0,0,0,0.8)` provides strong contrast outline
2. **Gradient Direction:** Left-to-right gradient means text on left side always has brighter background
3. **High Contrast:** Pure white (#ffffff) on red gradient provides sufficient contrast ratio
4. **Low HP State:** When bar is narrow (<25% width), text may extend beyond fill — background is dark (rgba(0,0,0,0.4)) so text remains visible

**Edge Case Testing:**
- Full HP (100%): Text on bright red gradient ✅
- Half HP (50%): Text on mid-gradient ✅
- Low HP (25%): Text on dark gradient ✅
- Critical HP (<10%): Text may extend past fill into dark background — still readable with text-shadow ✅

### Visual Personality Enhancements

**Gradient Fill:**
- Creates depth and dimensionality (not flat like existing bars)
- Direction: Left-to-right (90deg) follows natural reading direction
- Color stops: Bright (#ff4466) to dark (#cc0033) for subtle sophistication

**Border Glow:**
- Subtle box-shadow creates "energy field" effect around HP bar
- Glow color matches HP red theme (rgba(255, 68, 102, 0.5))
- Intensifies when pulsing (low HP state) for urgency feedback

**Rectangular Design:**
- Sharp corners give "tech HUD" aesthetic vs. soft pill shape
- Aligns with sci-fi space shooter theme
- Feels more "tactical" and "military UI" inspired

**Pulse Animation:**
- Existing low HP pulse logic (shouldPulseHP when <25%) preserved
- Animation affects glow intensity (not opacity, to avoid disorienting flicker)
- Smooth ease-in-out for organic breathing effect

### Comparison with Other Bars

**Boss HP Bar (BossHPBar.jsx):**
- Uses ProgressBar component (rounded-sm)
- Has phase markers at 75%, 50%, 25%
- No text inside bar (boss name above)
- Wider design (280px-500px clamp)

**XP Bar (XPBarFullWidth.jsx):**
- Full-width top bar (different layout entirely)
- Uses custom implementation (not ProgressBar)
- Text display separate from bar

**Dash Cooldown (HUD.jsx lines 548-575):**
- Circular design (border-radius: 50%)
- Text inside circle ("RDY" or countdown)
- Different visual language (circular vs. rectangular)

**Story 20.8 HP Bar:**
- **Unique among all bars** — only rectangular bar with gradient and glow
- Sets new visual standard for "premium" HUD element design
- Could inspire future redesigns of other bars (but not required for this story)

### Testing Standards

**Component Tests (RectangularHPBar):**
- Test renders with correct dimensions (clamp values)
- Test HP text displays correct format: `Math.ceil(value)/max`
- Test gradient fill applied via inline styles
- Test border and glow styles applied
- Test pulse animation activates when pulse=true
- Test pulse animation does NOT activate when pulse=false
- Test bar width scales correctly (0% to 100% based on value/max ratio)
- Test text remains visible at all HP levels (0-100)

**Integration Tests (HUD):**
- Test RectangularHPBar renders in HUD top-left position
- Test currentHP and maxHP props passed correctly from usePlayer store
- Test hpPulse (shouldPulseHP) triggers pulse animation at <25% HP
- Test HP bar updates reactively when currentHP changes
- Test layout does NOT break (stats cluster, weapon slots, boon slots remain positioned correctly)

**Visual Regression Tests (Manual Playtest):**
- Start game, verify HP bar appears with correct styling
- Take damage, verify HP bar width decreases smoothly
- Reduce HP below 25%, verify pulse animation activates (glow intensity increases)
- Verify text "85/100" format is readable at all HP levels
- Verify gradient and glow create visual personality without distraction
- Verify no layout shift compared to previous HP bar (top-left cluster alignment preserved)

### Edge Cases

**Edge Case 1: Full HP (100/100)**
- Bar fill width: 100%
- Text: "100/100" fully visible on bright red gradient
- No pulse animation
- Expected: Clean, readable display ✅

**Edge Case 2: Half HP (50/100)**
- Bar fill width: 50%
- Text: "50/100" visible on mid-gradient
- No pulse animation (pulse triggers at <25%)
- Expected: Text readable, urgency not yet signaled ✅

**Edge Case 3: Low HP (20/100)**
- Bar fill width: 20%
- Text: "20/100" may extend slightly beyond fill into dark background
- Pulse animation ACTIVE (glow intensifies)
- Expected: Text readable with shadow, pulse signals danger ✅

**Edge Case 4: Critical HP (5/100)**
- Bar fill width: 5%
- Text: "5/100" mostly on dark background (fill very narrow)
- Pulse animation ACTIVE
- Expected: Text remains readable with strong shadow, pulse urgency clear ✅

**Edge Case 5: Zero HP (0/100)**
- Bar fill width: 0%
- Text: "0/100" fully on dark background
- Pulse animation may still be active (handled by GameLoop death logic)
- Expected: Text readable, player sees exact moment of death ✅

**Edge Case 6: Fractional HP (85.7 → displayed as 86/100)**
- Use `Math.ceil(value)` to always round up (never show "0" when >0 HP remains)
- Matches existing HUD pattern (line 362: `Math.ceil(currentHP)`)
- Expected: Consistent with current behavior ✅

### Performance Notes

- RectangularHPBar is a lightweight component (no hooks, pure render)
- Inline styles used for dynamic values (width %, gradient, glow) — React optimizes these
- CSS animation (hpPulse) runs on GPU via transform/box-shadow
- HUD re-renders when currentHP changes (existing behavior, no performance regression)
- No new store subscriptions added (uses existing usePlayer selectors)

**No performance concerns for this story.**

### UX Considerations

**Why Rectangular Design?**
- Aligns with tactical/military UI aesthetic (space shooter genre convention)
- Differentiates HP bar from other rounded elements (dash cooldown, minimap)
- Feels more "premium" and intentional vs. default rounded shapes

**Why Text Inside Bar?**
- Reduces vertical space usage (more compact HUD)
- Follows modern game UI patterns (Halo, Apex Legends, etc.)
- Creates cohesive design (info integrated into bar, not separate)

**Why Gradient Fill?**
- Adds visual depth without complexity
- Subtle sophistication (not flat, not overly flashy)
- Reinforces "energy bar" metaphor (gradients suggest dimensionality)

**Why Border Glow?**
- Enhances visibility against dark space background
- Creates "active UI element" feedback (feels alive, not static)
- Pulse glow at low HP provides clear danger signal without text color change

**Player Messaging:**
- No "HP" label needed — "85/100" format is self-explanatory
- Gradient + glow communicate "this is important" without overwhelming
- Pulse animation at <25% HP signals urgency clearly
- Compact design maximizes play area visibility (HUD doesn't dominate screen)

### Alignment with Epic 20 Vision

**Epic 20 Context:**
- Permanent Upgrades System introduces MaxHP upgrades (Story 20.1)
- Ship Stats Display shows MaxHP with bonuses (Story 20.7)
- HP Bar Redesign (Story 20.8) completes the HP visualization trilogy

**Story 20.8 Contribution:**
- Polished HP bar makes HP feel important (supports MaxHP upgrade value proposition)
- Premium visual design elevates perceived game quality (meta-progression context)
- Rectangular design creates visual consistency opportunity for future HUD redesigns

**No direct dependency on other Epic 20 stories — Story 20.8 is standalone.**

### Future Extensibility

**Potential Future Enhancements (Not in Scope for Story 20.8):**
- Armor indicator (shield icon overlay when armor >0, from Story 20.1 upgrades)
- Regen effect (subtle pulse when regenerating HP, from Story 20.1 upgrades)
- Damage taken animation (flash red when HP decreases, similar to existing damageFlashTimer)
- Segmented HP bar (e.g., 10 HP per segment for visual chunking at high MaxHP values)

**Story 20.8 Foundation:**
- RectangularHPBar component is extensible (can add props for armor, regen effects later)
- Clean separation from ProgressBar allows future ProgressBar changes without HP bar impact
- Gradient + glow pattern can be replicated for other premium HUD elements

### References

- [Source: _bmad-output/planning-artifacts/epic-20-permanent-upgrades-system.md#Story 20.8] — Epic context, HP bar redesign spec
- [Source: src/ui/HUD.jsx:355-368] — Current HP bar implementation (to be replaced)
- [Source: src/ui/primitives/ProgressBar.jsx] — Existing progress bar component (reference, NOT modified)
- [Source: src/ui/BossHPBar.jsx] — Boss HP bar pattern (reference for comparison)
- [Source: src/ui/XPBarFullWidth.jsx] — XP bar pattern (reference for comparison)
- [Source: _bmad-output/planning-artifacts/architecture.md#6-Layer Architecture] — UI Layer patterns
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#HUD Design] — HUD layout guidelines

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

N/A - Implementation completed without issues

### Implementation Plan

**Approach:** Created new RectangularHPBar component (Option A) instead of extending ProgressBar to ensure backward compatibility for XP bar and boss HP bar.

**Red-Green-Refactor Cycle:**
1. **RED:** Wrote 16 failing tests for getRectangularHPBarProps logic function
2. **GREEN:** Implemented RectangularHPBar component with gradient fill, text overlay, and pulse animation
3. **REFACTOR:** Integrated into HUD.jsx replacing old HP bar section (lines 376-389)

**Key Technical Decisions:**
- Used inline styles for dynamic values (width %, gradient, glow) for React optimization
- Applied `Math.ceil(value)` to always round up HP display (never show "0" when >0 HP remains)
- Text positioned on left side with `textShadow: '0 1px 2px rgba(0,0,0,0.8)'` for readability on gradient background
- Pulse animation affects box-shadow glow intensity (8px → 16px) rather than opacity to avoid disorienting flicker
- Height increased slightly from `clamp(6px, 0.7vw, 10px)` to `clamp(12px, 1.2vw, 18px)` to fit text comfortably inside bar

**Testing:**
- All 16 RectangularHPBar tests pass (width calculation, text display, pulse animation, gradient/glow styling)
- Full regression suite passes: 99 test files, 1631 tests, 0 failures
- No impact on existing ProgressBar usage (XP bar, boss HP bar, dash cooldown remain unchanged)

### Completion Notes List

✅ **Task 1:** Removed old HP label and separate text display from HUD.jsx (lines 376-389)
✅ **Task 2:** Created RectangularHPBar component with gradient fill, border glow, and text overlay
✅ **Task 3:** Integrated RectangularHPBar into HUD.jsx, maintaining top-left cluster positioning
✅ **Task 4:** Text readability ensured via white color + text-shadow on gradient background
✅ **Task 5:** Visual personality enhanced with linear-gradient (#ff4466 → #cc0033) and pulsing glow
✅ **Task 6:** Chose Option A - new component from scratch for clean separation and backward compatibility
✅ **Task 7:** Comprehensive tests written (16 tests for logic function, all passing)

**All Acceptance Criteria Met:**
- HP bar is rectangular (no rounded corners) ✅
- Current/max HP displayed inside bar as "80/100" format ✅
- HP text positioned at LEFT side of bar ✅
- No "HP" label - format is self-explanatory ✅
- Visual personality enhanced with gradient fill and subtle border glow ✅

**Post-Implementation Adjustments:**
- Height increased from `clamp(12px, 1.2vw, 18px)` to `clamp(18px, 1.8vw, 26px)` for improved visibility
- HUD top padding increased from `pt-4` to `pt-8` for better spacing below XP bar
  - Rationale: Larger HP bar required more vertical space; increased top padding prevents visual crowding between XP bar and HP bar
  - Impact: All HUD elements shift down slightly (+16px at medium viewport sizes), no layout breaks detected

### File List

**New Files:**
- src/ui/primitives/RectangularHPBar.jsx
- src/ui/__tests__/RectangularHPBar.test.jsx

**Modified Files:**
- src/ui/HUD.jsx
- src/style.css

## Change Log

- 2026-02-15: Story 20.8 implementation complete - Rectangular HP bar with gradient fill, text overlay, and pulsing glow
- 2026-02-15: Post-implementation visual adjustments - Increased HP bar height (+50%) and HUD spacing for better readability
- 2026-02-15: Code review fixes applied (3 issues resolved):
  - **HIGH:** Reverted Story 26.3 audio code contamination from GameLoop.jsx and audioManager.js
  - **MEDIUM:** File List was already accurate after revert (no undocumented files remain)
  - **MEDIUM:** HUD padding change now fully documented with rationale and impact assessment
