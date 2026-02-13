# Story 13.2: Sidebar Layout Compaction (No Scroll)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want all tunnel options visible without scrolling,
So that I can see all my choices at a glance.

## Acceptance Criteria

1. **Given** the tunnel UI sidebar (right panel) **When** it renders on a 1080p screen **Then** all UI sections fit within the viewport without requiring vertical scroll **And** sections are: Fragment count (top), Upgrades list, Dilemma card, HP Sacrifice (if applicable), Enter System button (bottom)

2. **Given** the upgrade list is long **When** many upgrades exist **Then** the list is compacted with smaller card sizes or a grid layout **And** font sizes and spacing are reduced to fit more items **And** readability is maintained (no text smaller than 12px)

3. **Given** the dilemma card **When** it is displayed **Then** it is concise and fits within a compact card format **And** accept/refuse buttons are clearly visible

4. **Given** the HP Sacrifice option **When** it is included **Then** it is compactly integrated (e.g., a single button with cost/benefit inline) **And** the button is prominent and easy to reach

5. **Given** the "ENTER SYSTEM" button **When** it is displayed **Then** it is always visible at the bottom of the sidebar without scrolling **And** the button is prominent and easy to reach

## Tasks / Subtasks

- [ ] Task 1: Measure current TunnelHub vertical height and identify overflow (AC: #1)
  - [ ] 1.1: Test TunnelHub on 1080p screen (1920x1080) — measure total content height vs viewport
  - [ ] 1.2: Identify which sections contribute most to vertical height (upgrades list, dilemma, HP section)
  - [ ] 1.3: Document current spacing values (padding, margins, gaps) for each section
  - [ ] 1.4: Calculate total height budget: viewport height (1080px) - reserved space for header/footer/padding
  - [ ] 1.5: Determine target height for each section to fit within budget

- [ ] Task 2: Compact upgrade list layout (AC: #2)
  - [ ] 2.1: Reduce upgrade card padding from `p-3` to `p-2` (12px → 8px)
  - [ ] 2.2: Reduce gap between upgrade cards from `gap-2` to `gap-1.5` (8px → 6px)
  - [ ] 2.3: Reduce upgrade name font size from `text-sm` to `text-xs` (14px → 12px)
  - [ ] 2.4: Reduce description font size from `text-xs` to 10px custom class
  - [ ] 2.5: Consider 2-column grid layout if 5 upgrades exceed height budget
  - [ ] 2.6: Ensure keyboard shortcuts `[1-5]` remain visible at 12px minimum
  - [ ] 2.7: Test readability with reduced font sizes — confirm 12px minimum maintained

- [ ] Task 3: Compact dilemma card layout (AC: #3)
  - [ ] 3.1: Reduce dilemma card padding from `p-4` to `p-3` (16px → 12px)
  - [ ] 3.2: Reduce dilemma description font size from clamp(14px, 1.2vw, 18px) to fixed 12px
  - [ ] 3.3: Reduce button padding from `py-2` to `py-1.5` (8px → 6px)
  - [ ] 3.4: Reduce gap between Accept/Refuse buttons from `gap-3` to `gap-2` (12px → 8px)
  - [ ] 3.5: Remove mb-4 margin from description, use mb-2 or mb-3 instead
  - [ ] 3.6: Ensure dilemma name and buttons remain clearly visible

- [ ] Task 4: Compact HP Sacrifice section (AC: #4)
  - [ ] 4.1: Reduce HP section padding from `p-4` to `p-3` (16px → 12px)
  - [ ] 4.2: Reduce HP display font size from `text-sm` to `text-xs` (14px → 12px)
  - [ ] 4.3: Reduce button padding from `py-2` to `py-1.5` (8px → 6px)
  - [ ] 4.4: Reduce margin between HP display and button from `mb-2` to `mb-1.5` (8px → 6px)
  - [ ] 4.5: Consider inline layout for HP display and cost (single line instead of two)
  - [ ] 4.6: Ensure HP float text animation remains visible

- [ ] Task 5: Reduce section margins and header spacing (AC: #1, #5)
  - [ ] 5.1: Reduce section margin from `mb-8` to `mb-4` or `mb-5` (32px → 16-20px)
  - [ ] 5.2: Reduce section header margin from `mb-3` to `mb-2` (12px → 8px)
  - [ ] 5.3: Reduce top header margin from `mb-8` to `mb-4` or `mb-5` (32px → 16-20px)
  - [ ] 5.4: Reduce fragment display margin from `mb-10` to `mb-5` or `mb-6` (40px → 20-24px)
  - [ ] 5.5: Reduce system info margin from `mb-6` to `mb-3` or `mb-4` (24px → 12-16px)
  - [ ] 5.6: Ensure Enter System button remains visible at bottom with sufficient spacing

- [ ] Task 6: Test layout on 1080p and verify no scroll (AC: #1, #5)
  - [ ] 6.1: Test TunnelHub on 1920x1080 resolution with all sections visible
  - [ ] 6.2: Verify no vertical scrollbar appears (overflow-y-auto should not activate)
  - [ ] 6.3: Test with maximum content: 5 upgrades, 1 dilemma, HP sacrifice available
  - [ ] 6.4: Test with minimum content: 0 upgrades, no dilemma, HP full
  - [ ] 6.5: Verify Enter System button is always visible at bottom without scrolling
  - [ ] 6.6: Test on 1280x720 resolution (minimum supported) — may require additional compaction

- [ ] Task 7: Ensure readability and visual hierarchy (AC: #2, #3, #4)
  - [ ] 7.1: Verify all text is readable at 12px minimum (WCAG AA compliance)
  - [ ] 7.2: Verify keyboard shortcuts `[1-5]`, `[Y]`, `[N]`, `[H]`, `Enter` remain visible
  - [ ] 7.3: Verify button hover states remain clear with reduced padding
  - [ ] 7.4: Verify focus rings remain visible with compact layout
  - [ ] 7.5: Test with color blindness simulator — ensure contrast remains sufficient
  - [ ] 7.6: Verify visual hierarchy: Enter System button remains most prominent

- [ ] Task 8: Update styles and test animations (AC: #1-5)
  - [ ] 8.1: Apply all spacing reductions in TunnelHub.jsx className props
  - [ ] 8.2: Test purchase flash animation with compact upgrade cards
  - [ ] 8.3: Test dilemma resolution animation with compact dilemma card
  - [ ] 8.4: Test HP float text animation with compact HP section
  - [ ] 8.5: Test exit animation (tunnel-exit-fade) with compact layout
  - [ ] 8.6: Verify all animations complete without visual glitches

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **UI Layer** → TunnelHub.jsx (HTML overlay, Tailwind styled) — this story modifies spacing/sizing only
- **Rendering Layer** → TunnelScene.jsx (unchanged — 3D tunnel rendering)
- **Stores** → useGame, usePlayer, useLevel (unchanged)
- **Systems** → None (tunnel is purely UI-driven)
- **GameLoop** → Paused during tunnel (unchanged)
- **Config** → gameConfig.js (unchanged)

**Current Layout Analysis (from TunnelHub.jsx):**
- **Header section** (lines 155-176): ~120px vertical height
  - Title: `mb-8` (32px), clamp(20px, 2.5vw, 36px) font
  - System info: `mb-6` (24px), text-sm
  - Fragment display: `mb-10` (40px), clamp(18px, 2vw, 28px) font
- **Upgrades section** (lines 179-223): Variable height (5 cards × 60px + gaps = ~320px)
  - Section header: `mb-3` (12px)
  - Card padding: `p-3` (12px all sides)
  - Card gap: `gap-2` (8px between cards)
  - Card height: ~60px each (padding + 2 text lines)
- **Dilemma section** (lines 226-260): ~140px vertical height
  - Section header: `mb-3` (12px)
  - Card padding: `p-4` (16px all sides)
  - Description: clamp(14px, 1.2vw, 18px), `mb-4` (16px)
  - Buttons: `py-2` (8px vertical), `gap-3` (12px)
- **HP Sacrifice section** (lines 263-303): ~120px vertical height
  - Section header: `mb-3` (12px)
  - Card padding: `p-4` (16px all sides)
  - HP display: `mb-2` (8px)
  - Button: `py-2` (8px vertical)
- **Spacer** (line 306): flex-1 (fills remaining space)
- **Enter System button** (lines 309-319): ~70px vertical height
  - Button padding: `py-4` (16px vertical)
  - Font: clamp(14px, 1.5vw, 20px)

**Total current height estimate:** ~770px (without section margins `mb-8` = 32px × 4 = 128px) = **~898px total**
**Viewport height at 1080p:** 1080px
**Available content height:** ~1000px (accounting for browser chrome, flex-1 spacer absorbs overflow)
**Verdict:** Layout currently fits 1080p but with very little margin — needs compaction for safety and smaller resolutions

### Technical Requirements

**Spacing Reduction Strategy:**
1. **Section margins:** Reduce `mb-8` → `mb-4` or `mb-5` (save ~16-12px per section × 4 = ~48-64px)
2. **Header spacing:** Reduce title `mb-8` → `mb-4`, fragment `mb-10` → `mb-5` (save ~48px)
3. **Card padding:** Reduce upgrade `p-3` → `p-2`, dilemma/HP `p-4` → `p-3` (save ~16-24px total)
4. **Card gaps:** Reduce upgrade `gap-2` → `gap-1.5` (save ~2px × 4 = ~8px)
5. **Font sizes:** Reduce where safe (description text, not critical labels)
6. **Button padding:** Reduce `py-2` → `py-1.5` where applicable (save ~4px per button)

**Target total height savings:** ~100-150px → **Final height ~750-800px** (safe margin for 1080p)

**Tailwind Custom Classes Needed:**
- `.text-2xs` for 10px font size (smaller than text-xs 12px) — define in style.css
- `.gap-1.5` already exists in Tailwind (6px)
- All other sizes are standard Tailwind utilities

**Readability Constraints:**
- **Minimum font size:** 12px (WCAG AA compliance for small text)
- **Minimum button height:** ~28-32px (touch-friendly, keyboard accessible)
- **Minimum click target:** 24px × 24px (WCAG AAA guideline)
- **Contrast ratio:** 4.5:1 for normal text, 3:1 for large text (already met by design system)

**Animation Compatibility:**
- Purchase flash: Scale animation (scale-[1.02]) works with compact cards
- Dilemma resolution: Fade-out with transition-all (unchanged)
- HP float text: Absolute positioned above HP section (unchanged)
- Exit animation: tunnel-exit-fade affects entire container (unchanged)

### Project Structure Notes

**Files to Modify:**
- `src/ui/TunnelHub.jsx` — Update className props for spacing/sizing (lines 155-320)
- `src/style.css` — Add `.text-2xs { font-size: 10px; }` custom utility (optional, may not be needed if 12px is minimum)

**No Structural Changes:**
- No new components needed
- No changes to stores, systems, or config
- No changes to TunnelScene.jsx (3D rendering unchanged)
- No changes to keyboard shortcuts or event handlers

**Testing Focus:**
- Visual regression: Compare before/after screenshots at 1080p
- Scrollbar check: Ensure `overflow-y-auto` never activates
- Readability: Verify all text remains legible (12px minimum)
- Keyboard navigation: Ensure all shortcuts still work with compact layout
- Animations: Verify all transitions/animations complete correctly

### Previous Story Intelligence

**Story 13.1 Learnings (Tunnel Bugs Resolution):**
- TunnelHub already tested for console errors and interaction bugs
- All interactions (upgrades, dilemma, HP sacrifice, exit) working correctly
- Exit animation uses fadingRef guard to prevent double-trigger (line 95)
- Keyboard shortcuts tested and working (lines 111-142)
- State transitions (advanceSystem, resetForNewSystem, setPhase) stable across multiple tunnel visits

**Story 10.6 Learnings (Pause Menu):**
- Compact card layouts work well with reduced padding and spacing
- Font size reductions (text-sm → text-xs) maintain readability
- Keyboard shortcuts remain visible and functional with compact layout
- Focus rings and hover states work with reduced padding

**Recent Commits Patterns:**
- Pause menu (873b3e6) used compact inventory cards with `p-2` padding
- HUD refactors (10.1-10.6) established responsive sizing with clamp() functions
- All recent UI work maintains 12px minimum font size for readability

### References

- Epic 13: Tunnel Hub Fixes & UX Improvements [Source: _bmad-output/planning-artifacts/epics.md#Epic 13]
- Story 13.2 Requirements: Sidebar layout compaction (no scroll) [Source: _bmad-output/planning-artifacts/epics.md#Story 13.2]
- UX Design: Tunnel Hub layout (split 3D/UI, keyboard shortcuts) [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Tunnel Hub]
- UX Design: Spacing unit (4px base), typography (Inter, 12px minimum) [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Tokens]
- Architecture: UI Layer (Tailwind CSS, responsive design) [Source: _bmad-output/planning-artifacts/architecture.md#UI Layer]
- TunnelHub Implementation: All spacing/sizing in className props [Source: src/ui/TunnelHub.jsx]
- Story 13.1: Tunnel bugs resolved, stable state management [Source: _bmad-output/implementation-artifacts/13-1-tunnel-rendering-interaction-bugs-resolution.md]
- Story 10.6: Pause menu compact layout patterns [Source: _bmad-output/implementation-artifacts/10-6-pause-menu-with-detailed-inventory.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
