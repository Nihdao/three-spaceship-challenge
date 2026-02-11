# Story 8.3: Credits Screen

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see credits acknowledging the ThreeJS Journey challenge and asset creators,
So that proper attribution is given to the contest and community resources.

## Acceptance Criteria

1. **Given** the player clicks CREDITS from the main menu **When** the credits screen opens **Then** an overlay modal appears with scrollable content

2. **Given** the credits content **When** it is displayed **Then** the top section states: "Created for the ThreeJS Journey Challenge - Spaceship" **And** a link to https://threejs-journey.com/challenges/022-spaceship is visible **And** credit is given to Bruno Simon for the ThreeJS Journey course

3. **Given** the credits content **When** asset attribution is shown **Then** a section titled "Assets & Resources" is present **And** placeholder entries exist for: 3D Models, Sound Effects, Music, Textures **And** format allows easy future updating with specific asset names and authors

4. **Given** the credits screen **When** the player wants to return **Then** a BACK button returns to the main menu **And** ESC key also closes the modal

## Tasks / Subtasks

- [x] Task 1: Create CreditsModal component structure (AC: #1, #4)
  - [x] 1.1: Create `src/ui/modals/CreditsModal.jsx` component
  - [x] 1.2: Render modal overlay with 60% dark background (bg-black/60)
  - [x] 1.3: Modal content card with "CREDITS" title (text-3xl, centered)
  - [x] 1.4: Scrollable content area (max-h with overflow-y-auto)
  - [x] 1.5: Add BACK button at bottom (returns to main menu via onClose callback)
  - [x] 1.6: ESC key listener to close modal (useEffect with cleanup)
  - [x] 1.7: Accessibility: aria-modal, role="dialog", aria-labelledby for title

- [x] Task 2: Integrate CreditsModal with MainMenu (AC: #1)
  - [x] 2.1: Import CreditsModal into MainMenu.jsx
  - [x] 2.2: Add isCreditsOpen state to MainMenu (if not already present from Story 8.1)
  - [x] 2.3: Update handleMenuSelect for 'credits' item to set isCreditsOpen=true
  - [x] 2.4: Render CreditsModal conditionally when isCreditsOpen
  - [x] 2.5: Pass onClose callback that sets isCreditsOpen=false
  - [x] 2.6: Apply inert attribute to MainMenu buttons when modal is open

- [x] Task 3: ThreeJS Journey Challenge section (AC: #2)
  - [x] 3.1: Add header section with "Created for the ThreeJS Journey Challenge - Spaceship"
  - [x] 3.2: Render external link to https://threejs-journey.com/challenges/022-spaceship
  - [x] 3.3: Link styled with accent color (text-game-primary), opens in new tab (_blank), has rel="noopener noreferrer"
  - [x] 3.4: Add credit line: "Course by Bruno Simon - ThreeJS Journey"
  - [x] 3.5: Link to https://threejs-journey.com with same styling
  - [x] 3.6: Section visually distinct (border-bottom or margin-bottom to separate from assets)

- [x] Task 4: Assets & Resources section (AC: #3)
  - [x] 4.1: Add section header "Assets & Resources"
  - [x] 4.2: Create subsection "3D Models" with placeholder text "To be credited"
  - [x] 4.3: Create subsection "Sound Effects" with placeholder text "To be credited"
  - [x] 4.4: Create subsection "Music" with placeholder text "To be credited"
  - [x] 4.5: Create subsection "Textures" with placeholder text "To be credited"
  - [x] 4.6: Use consistent formatting: category bold, credit text regular, line spacing consistent
  - [x] 4.7: Format allows easy future update (replace "To be credited" with actual author names + license)

- [x] Task 5: Keyboard navigation and accessibility (AC: #4)
  - [x] 5.1: Modal traps focus (Tab cycles within modal: links, BACK button)
  - [x] 5.2: ESC key closes modal, returns focus to CREDITS button in MainMenu
  - [x] 5.3: External links keyboard-activatable (Enter key)
  - [x] 5.4: BACK button focusable and Enter-activatable
  - [x] 5.5: Apply inert attribute to MainMenu when modal is open (prevent interaction)
  - [x] 5.6: aria-labelledby references title element for screen readers

- [x] Task 6: Scrollable content handling (AC: #1, #3)
  - [x] 6.1: Content area has max-height constraint (e.g., max-h-[70vh])
  - [x] 6.2: overflow-y-auto applied to content area (not entire modal)
  - [x] 6.3: Custom scrollbar styling to match game theme (dark track, accent thumb)
  - [x] 6.4: Content bottom padding ensures BACK button always visible even when scrolled
  - [x] 6.5: Test scroll behavior with keyboard (Arrow keys, Page Up/Down)

- [x] Task 7: Visual polish (AC: #1, #2, #3)
  - [x] 7.1: Modal fade-in animation (150ms ease-out)
  - [x] 7.2: Title uses game font (Inter), text-3xl, bold
  - [x] 7.3: Section headers use text-xl, bold, margin-top for spacing
  - [x] 7.4: Body text uses text-base, line-height relaxed for readability
  - [x] 7.5: External links have hover state (underline or color shift)
  - [x] 7.6: External links have icon indicator (↗ or similar) to show they open new tab
  - [x] 7.7: Spacing consistent (4px base unit, 16px between sections)
  - [x] 7.8: Card background (bg-game-bg), border (border-game-primary)

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **UI Layer** → CreditsModal is a pure UI component, static content display
- **No state management needed** → No Zustand store required, modal state is ephemeral (useState in MainMenu)
- **No external data loading** → Credits content is hardcoded JSX, no fetch/API calls

**Pattern Reuse from Story 8.2:**
Story 8.2 (Options Menu) established the modal pattern for Epic 8. Story 8.3 follows identical architectural approach:
- Modal overlay with 60% dark background
- ESC key to close
- inert attribute on MainMenu when modal open
- Focus trap within modal
- BACK button to return to main menu
- Same styling (bg-game-bg, border-game-primary)

**Difference from Story 8.2:**
Story 8.2 had interactive controls (sliders, buttons with state changes). Story 8.3 is purely informational (read-only text + external links). Simpler implementation, no localStorage, no audio integration.

### Technical Requirements

**Component Structure:**
```jsx
// src/ui/modals/CreditsModal.jsx
export default function CreditsModal({ onClose }) {
  // ESC key listener
  // Render overlay → card → title → scrollable content → BACK button
}
```

**Credits Content Structure:**
```
[CREDITS Title]

Created for the ThreeJS Journey Challenge - Spaceship
Link: https://threejs-journey.com/challenges/022-spaceship
Course by Bruno Simon - ThreeJS Journey
Link: https://threejs-journey.com

---

Assets & Resources

3D Models:
  To be credited

Sound Effects:
  To be credited

Music:
  To be credited

Textures:
  To be credited
```

**External Link Pattern:**
```jsx
<a
  href="https://threejs-journey.com/challenges/022-spaceship"
  target="_blank"
  rel="noopener noreferrer"
  className="text-game-primary hover:underline inline-flex items-center gap-1"
>
  ThreeJS Journey Challenge - Spaceship
  <span aria-hidden="true">↗</span>
</a>
```

**Accessibility Requirements:**
- `aria-modal="true"` on modal container
- `role="dialog"` on modal container
- `aria-labelledby` references title element ID
- Focus trap within modal (Tab cycles through links + BACK button only)
- ESC key to close (addEventListener in useEffect)
- `inert` attribute on MainMenu when modal is open
- External links have `target="_blank"` + `rel="noopener noreferrer"` for security
- Icon indicator (↗) has `aria-hidden="true"` to avoid redundant screen reader announcement

**Visual Design (Cyber Minimal):**
- Modal overlay: `bg-black/60` (60% opacity dark background)
- Modal card: `bg-game-bg border-2 border-game-primary rounded-lg p-8`
- Title: `text-3xl font-bold text-game-text text-center mb-6`
- Section headers: `text-xl font-bold text-game-text mt-6 mb-3`
- Body text: `text-base text-game-text leading-relaxed`
- External links: `text-game-primary hover:underline`
- BACK button: Same styling as other modals (bg-game-primary hover:bg-game-primary-dark)
- Scrollbar: Custom Tailwind scrollbar utilities (scrollbar-thin, scrollbar-track-game-bg, scrollbar-thumb-game-primary)

### Implementation Guidance

**Step 1: Create CreditsModal skeleton**
```jsx
// src/ui/modals/CreditsModal.jsx
import { useEffect, useId } from 'react'

export default function CreditsModal({ onClose }) {
  const titleId = useId() // For aria-labelledby

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
    >
      <div className="bg-game-bg border-2 border-game-primary rounded-lg p-8 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Title */}
        <h2 id={titleId} className="text-3xl font-bold text-game-text text-center mb-6">
          CREDITS
        </h2>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-game-bg scrollbar-thumb-game-primary pr-4">
          {/* Credits content here */}
        </div>

        {/* BACK button */}
        <button
          onClick={onClose}
          className="mt-6 px-6 py-3 bg-game-primary hover:bg-game-primary-dark text-game-bg font-bold rounded transition-colors"
        >
          BACK
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Add ThreeJS Journey section**
```jsx
// Inside scrollable content div
<div className="mb-8">
  <p className="text-lg text-game-text mb-2">
    Created for the <strong>ThreeJS Journey Challenge - Spaceship</strong>
  </p>
  <a
    href="https://threejs-journey.com/challenges/022-spaceship"
    target="_blank"
    rel="noopener noreferrer"
    className="text-game-primary hover:underline inline-flex items-center gap-1 mb-4 block"
  >
    View Challenge <span aria-hidden="true">↗</span>
  </a>
  <p className="text-base text-game-text mb-2">
    Course by <strong>Bruno Simon</strong>
  </p>
  <a
    href="https://threejs-journey.com"
    target="_blank"
    rel="noopener noreferrer"
    className="text-game-primary hover:underline inline-flex items-center gap-1"
  >
    ThreeJS Journey <span aria-hidden="true">↗</span>
  </a>
</div>
```

**Step 3: Add Assets & Resources section**
```jsx
<div className="border-t border-game-primary/30 pt-6">
  <h3 className="text-xl font-bold text-game-text mb-4">Assets & Resources</h3>

  <div className="mb-4">
    <h4 className="font-bold text-game-text mb-1">3D Models</h4>
    <p className="text-game-text opacity-70">To be credited</p>
  </div>

  <div className="mb-4">
    <h4 className="font-bold text-game-text mb-1">Sound Effects</h4>
    <p className="text-game-text opacity-70">To be credited</p>
  </div>

  <div className="mb-4">
    <h4 className="font-bold text-game-text mb-1">Music</h4>
    <p className="text-game-text opacity-70">To be credited</p>
  </div>

  <div className="mb-4">
    <h4 className="font-bold text-game-text mb-1">Textures</h4>
    <p className="text-game-text opacity-70">To be credited</p>
  </div>
</div>
```

**Step 4: Integrate with MainMenu**
```jsx
// src/ui/MainMenu.jsx (modify existing)
import CreditsModal from './modals/CreditsModal'

const [isCreditsOpen, setIsCreditsOpen] = useState(false)

const handleMenuSelect = (item) => {
  if (item.id === 'play') {
    handlePlay()
  } else if (item.id === 'options') {
    setIsOptionsOpen(true)
  } else if (item.id === 'credits') {
    setIsCreditsOpen(true) // Open credits modal
  }
}

return (
  <div className="..." inert={isOptionsOpen || isCreditsOpen ? '' : undefined}>
    {/* Main menu buttons */}
    {isOptionsOpen && <OptionsModal onClose={() => setIsOptionsOpen(false)} />}
    {isCreditsOpen && <CreditsModal onClose={() => setIsCreditsOpen(false)} />}
  </div>
)
```

**Step 5: Focus trap (optional, basic version via tabindex management)**
For a simple credits modal with few interactive elements, native Tab order is sufficient. If implementing custom focus trap:
- Use react-focus-lock or react-focus-trap library
- Or manually manage focus via refs + event listeners
- Given Story 8.2 likely didn't implement full focus trap (overkill for game menus), maintain consistency and skip complex trap here

### Existing Code References

**MainMenu.jsx** (Story 8.1):
- Already has MENU_ITEMS array with 'credits' entry
- handleMenuSelect already routes 'credits' → placeholder action
- Story 8.3 replaces placeholder with full CreditsModal rendering

**OptionsModal.jsx** (Story 8.2):
- Provides architectural template for CreditsModal
- ESC key pattern: `useEffect` with `keydown` listener
- Modal overlay pattern: fixed inset-0, flex center, bg-black/60
- BACK button pattern: bottom of modal, onClose callback
- inert attribute pattern: applied to MainMenu when modal open

**MainMenu structure** (Story 8.1):
```jsx
const MENU_ITEMS = [
  { id: 'play', label: 'PLAY', ... },
  { id: 'options', label: 'OPTIONS', ... },
  { id: 'credits', label: 'CREDITS', ... },
]
```

### Anti-Patterns to Avoid

- **Do NOT create a Zustand store for credits modal** — This is ephemeral UI state, useState in MainMenu is sufficient
- **Do NOT fetch credits content from external source** — Hardcode content in JSX, no API calls needed
- **Do NOT implement complex scrollbar libraries** — Tailwind scrollbar utilities are sufficient
- **Do NOT forget external link security** — Always use `rel="noopener noreferrer"` with `target="_blank"`
- **Do NOT skip accessibility** — aria-modal, role="dialog", aria-labelledby, inert attribute on background
- **Do NOT make links hard to spot** — Use accent color (text-game-primary), hover underline, external icon (↗)
- **Do NOT overcomplicate focus trap** — If Story 8.2 didn't use focus trap library, maintain consistency
- **Do NOT forget ESC key** — Must close modal, critical for keyboard users
- **Do NOT block scrolling on MainMenu** — Only modal content scrolls, background is fixed overlay
- **Do NOT use inconsistent modal styling** — Match OptionsModal: same card bg, border, overlay opacity, fade-in animation

### Testing Approach

**Manual browser tests:**
1. Click CREDITS from main menu → modal opens with 60% dark overlay
2. Verify title "CREDITS" is centered, text-3xl
3. Click ThreeJS Journey Challenge link → opens https://threejs-journey.com/challenges/022-spaceship in new tab
4. Click Bruno Simon link → opens https://threejs-journey.com in new tab
5. Verify Assets & Resources section displays 4 placeholder categories (3D Models, Sound Effects, Music, Textures)
6. Verify "To be credited" placeholder text is visible and distinguishable
7. Click BACK button → returns to main menu, focus on CREDITS button
8. Reopen modal, press ESC key → closes modal, returns to main menu
9. Keyboard navigation: Tab cycles through links + BACK button, Enter activates
10. Verify modal content scrolls if content exceeds max-h-[80vh] (test with longer content)
11. Verify MainMenu buttons not clickable when modal open (inert attribute)
12. Verify external links have ↗ icon indicator
13. Screen reader test: announces "CREDITS dialog", reads links correctly

**Accessibility validation:**
```html
<!-- Expected modal structure -->
<div aria-modal="true" role="dialog" aria-labelledby="credits-title">
  <h2 id="credits-title">CREDITS</h2>
  <!-- Content with links having target="_blank" rel="noopener noreferrer" -->
</div>
```

**Visual consistency check:**
- Modal overlay opacity matches OptionsModal (bg-black/60)
- Modal card styling matches OptionsModal (bg-game-bg, border-2 border-game-primary, rounded-lg, p-8)
- Title styling matches OptionsModal (text-3xl font-bold)
- BACK button styling matches OptionsModal
- Fade-in animation matches OptionsModal (150ms ease-out)

**Performance check:**
- Modal render time < 16ms (60 FPS)
- No layout shift on modal open/close
- External link clicks don't freeze UI

### Scope Summary

Story 8.3 implements the CREDITS modal as an informational overlay accessible from the main menu. The modal displays attribution for the ThreeJS Journey Challenge (with link to challenge page and Bruno Simon credit) and a placeholder "Assets & Resources" section for future asset credit updates. The modal is fully keyboard-navigable, accessible (ESC to close, focus management, ARIA attributes), and follows the exact same architectural pattern as Story 8.2 (OptionsModal): overlay modal, inert background, BACK button, scrollable content. Implementation is simple and self-contained (no state stores, no localStorage, no external data loading).

**Key deliverables:**
1. `src/ui/modals/CreditsModal.jsx` — Modal component with challenge credits + asset placeholders
2. Modified `src/ui/MainMenu.jsx` — Integrated CreditsModal rendering + inert attribute
3. Accessibility features — ESC key, inert attribute, aria-modal, keyboard navigation
4. Visual consistency — Matches OptionsModal styling (bg, border, overlay, animations)
5. External links — ThreeJS Journey challenge page + course homepage with security attributes
6. Placeholder structure — Easy-to-update format for future asset attribution

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.3] — Acceptance criteria: CREDITS modal, ThreeJS Journey attribution, assets placeholders, keyboard navigation
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8] — Overview: Enhanced Main Menu & Metagame UI
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System] — Tailwind CSS, modal styling, accessibility requirements
- [Source: _bmad-output/implementation-artifacts/8-2-options-menu.md] — Previous story: OptionsModal architectural pattern (overlay, ESC key, inert, BACK button)
- [Source: _bmad-output/implementation-artifacts/8-1-main-menu-visual-overhaul.md] — MainMenu.jsx structure, MENU_ITEMS with 'credits' entry, handleMenuSelect routing
- [Source: src/ui/MainMenu.jsx] — Current implementation: MENU_ITEMS array, handleMenuSelect method, modal state management

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None - clean implementation with no issues encountered.

### Completion Notes List

- Created `src/ui/modals/CreditsModal.jsx` following OptionsModal pattern: overlay, card, ESC key, focus trap, ARIA attributes
- Replaced placeholder modal in `src/ui/MainMenu.jsx` with full CreditsModal integration (isCreditsOpen state, inert attribute, conditional rendering)
- Removed old placeholderModal state and handleCloseModal callback from MainMenu
- ThreeJS Journey Challenge section with two external links (challenge page + course homepage), both with `target="_blank"` and `rel="noopener noreferrer"`
- Assets & Resources section with 4 placeholder categories (3D Models, Sound Effects, Music, Textures) rendered from exported CREDITS_SECTIONS data array for easy future updates
- Focus trap implemented matching OptionsModal pattern (Tab cycling through focusable elements)
- Visual styling matches OptionsModal: bg-[#0a0a0f], border-2 border-game-primary, animate-fade-in, tracking-widest
- Added unit test for CREDITS_SECTIONS data structure validation (3 tests)
- All 568 existing tests pass with zero regressions

### Code Review Fixes (2026-02-11)

- [H1] Added focus restoration to CREDITS button when modal closes (creditsButtonRef in MainMenu + setTimeout focus in onClose)
- [M1] Added playSFX("button-click") on BACK button click and playSFX("button-hover") on mouseEnter for audio consistency with OptionsModal
- [M2] Added missing `import { playSFX } from "../../audio/audioManager.js"` to CreditsModal

### Change Log

- 2026-02-11: Implemented Credits Screen (Story 8.3) - CreditsModal component with ThreeJS Journey attribution, asset placeholders, full accessibility, and MainMenu integration
- 2026-02-11: Code review fixes - focus restoration, SFX on BACK button, playSFX import

### File List

- `src/ui/modals/CreditsModal.jsx` (new) — Credits modal component
- `src/ui/MainMenu.jsx` (modified) — Replaced placeholder modal with CreditsModal integration
- `src/ui/__tests__/CreditsModal.test.js` (new) — Unit tests for CREDITS_SECTIONS data
