# Story 8.2: Options Menu

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to adjust audio settings and clear my local save data from an options menu,
So that I have control over my game experience and can reset progress if needed.

## Acceptance Criteria

1. **Given** the player clicks OPTIONS from the main menu **When** the options screen opens **Then** an overlay modal appears with dark background (60% opacity) **And** the modal displays "OPTIONS" title

2. **Given** the options modal is open **When** audio controls are displayed **Then** a master volume slider (0-100%) is available **And** separate sliders for Music volume and SFX volume are available **And** volume changes apply immediately with audio preview **And** volume settings persist to localStorage

3. **Given** the options modal is open **When** the clear save option is displayed **Then** a "CLEAR LOCAL SAVE" button is visible with warning styling (red/danger) **And** clicking it prompts a confirmation dialog ("Are you sure? This cannot be undone.") **And** confirming clears all localStorage data (progress, high score, settings) **And** canceling returns to options without clearing

4. **Given** the options modal is open **When** the player wants to return **Then** a BACK or CLOSE button returns to the main menu **And** ESC key also closes the modal

## Tasks / Subtasks

- [x] Task 1: Create OptionsModal component structure (AC: #1, #4)
  - [x] 1.1: Create `src/ui/modals/OptionsModal.jsx` component
  - [x] 1.2: Render modal overlay with 60% dark background (bg-black/60)
  - [x] 1.3: Modal content card with "OPTIONS" title (text-3xl, centered)
  - [x] 1.4: Add BACK button at bottom (returns to main menu via closeModal callback)
  - [x] 1.5: ESC key listener to close modal (useEffect with cleanup)
  - [x] 1.6: Accessibility: aria-modal, focus trap, inert attribute on MainMenu when modal open

- [x] Task 2: Integrate OptionsModal with MainMenu (AC: #1)
  - [x] 2.1: Import OptionsModal into MainMenu.jsx
  - [x] 2.2: Add isOptionsOpen state to MainMenu
  - [x] 2.3: Update handleMenuSelect for 'options' item to set isOptionsOpen=true
  - [x] 2.4: Render OptionsModal conditionally when isOptionsOpen
  - [x] 2.5: Pass closeModal callback that sets isOptionsOpen=false
  - [x] 2.6: Apply inert attribute to MainMenu buttons when modal is open

- [x] Task 3: Implement Master Volume slider (AC: #2)
  - [x] 3.1: Add master volume slider (0-100) using HTML range input
  - [x] 3.2: Read initial value from localStorage 'audioSettings.masterVolume' (default: 100)
  - [x] 3.3: onChange updates audioManager.setMasterVolume(value / 100)
  - [x] 3.4: Save new value to localStorage immediately on change
  - [x] 3.5: Display current value next to slider (tabular-nums)
  - [x] 3.6: Slider styled with Tailwind (accent-game-primary, rounded thumb)

- [x] Task 4: Implement Music Volume slider (AC: #2)
  - [x] 4.1: Add music volume slider (0-100) using HTML range input
  - [x] 4.2: Read initial value from localStorage 'audioSettings.musicVolume' (default: 100)
  - [x] 4.3: onChange updates audioManager.setMusicVolume(value / 100)
  - [x] 4.4: Save new value to localStorage immediately on change
  - [x] 4.5: Display current value next to slider (tabular-nums)
  - [x] 4.6: Audio preview: play brief music sample on mouseUp/touchEnd

- [x] Task 5: Implement SFX Volume slider (AC: #2)
  - [x] 5.1: Add SFX volume slider (0-100) using HTML range input
  - [x] 5.2: Read initial value from localStorage 'audioSettings.sfxVolume' (default: 100)
  - [x] 5.3: onChange updates audioManager.setSfxVolume(value / 100)
  - [x] 5.4: Save new value to localStorage immediately on change
  - [x] 5.5: Display current value next to slider (tabular-nums)
  - [x] 5.6: Audio preview: play brief SFX sample (e.g., menu_select) on mouseUp/touchEnd

- [x] Task 6: Implement Clear Save button with confirmation (AC: #3)
  - [x] 6.1: Add "CLEAR LOCAL SAVE" button with warning styling (bg-game-danger, hover darker)
  - [x] 6.2: Position button prominently in modal (bottom section, above BACK)
  - [x] 6.3: Add isClearConfirmOpen state for confirmation dialog
  - [x] 6.4: onClick sets isClearConfirmOpen=true
  - [x] 6.5: Render confirmation dialog when isClearConfirmOpen (nested modal or inline section)
  - [x] 6.6: Confirmation text: "Are you sure? This will erase all progress, high scores, and settings. This cannot be undone."
  - [x] 6.7: Confirmation buttons: [CANCEL] (gray) and [CLEAR DATA] (red, bold)
  - [x] 6.8: CANCEL sets isClearConfirmOpen=false (returns to options)
  - [x] 6.9: CLEAR DATA calls clearAllLocalStorage() then closes both dialogs
  - [x] 6.10: clearAllLocalStorage() removes all localStorage keys (highScore, audioSettings, any future save data)

- [x] Task 7: Volume persistence to localStorage (AC: #2)
  - [x] 7.1: Define localStorage structure: `{ masterVolume: 100, musicVolume: 100, sfxVolume: 100 }` as JSON at key 'audioSettings'
  - [x] 7.2: On slider change, read current audioSettings, update relevant field, save back to localStorage
  - [x] 7.3: On OptionsModal mount, read audioSettings from localStorage and initialize sliders
  - [x] 7.4: If localStorage is empty, use defaults (all volumes = 100)
  - [x] 7.5: Validate slider values: clamp to 0-100, Number.isFinite check

- [x] Task 8: Audio manager integration (AC: #2)
  - [x] 8.1: Verify audioManager.js has setMasterVolume(volume: 0-1), setMusicVolume(volume: 0-1), setSfxVolume(volume: 0-1) methods
  - [x] 8.2: If methods don't exist, add them (control Howl.volume() for music, Howl global volume for SFX)
  - [x] 8.3: audioManager should read audioSettings from localStorage on init (apply saved volumes)
  - [x] 8.4: Test that volume changes apply immediately to playing audio (music continues at new volume)

- [x] Task 9: Keyboard navigation and accessibility (AC: #4)
  - [x] 9.1: Modal traps focus (Tab cycles within modal only)
  - [x] 9.2: ESC key closes modal, returns focus to OPTIONS button in MainMenu
  - [x] 9.3: Sliders keyboard-navigable (left/right arrows adjust value)
  - [x] 9.4: BACK button focusable and Enter-activatable
  - [x] 9.5: CLEAR SAVE button and confirmation buttons keyboard-activatable
  - [x] 9.6: Apply inert attribute to MainMenu when modal is open (prevent interaction)

- [x] Task 10: Visual polish (AC: #1, #3)
  - [x] 10.1: Modal fade-in animation (150ms ease-out)
  - [x] 10.2: Slider styling consistent with game design (cyan/magenta accent on active thumb)
  - [x] 10.3: CLEAR SAVE button has warning icon or distinct visual (⚠️ icon, pulsing red glow)
  - [x] 10.4: Confirmation dialog uses Card component with danger border
  - [x] 10.5: All text uses Inter font (or game font), tabular-nums for volume values
  - [x] 10.6: Spacing consistent (4px base unit, 16px between sections)

## Dev Notes

### Architecture Context

**6-Layer Architecture Alignment:**
- **UI Layer** → OptionsModal is a pure UI component, no game logic
- **Audio System** → audioManager.js handles volume control (Howler.js API)
- **localStorage** → Direct browser API for persistence (no abstraction layer needed)

**Existing Infrastructure:**
- `src/audio/audioManager.js` — Howler.js wrapper, manages music + SFX categories
- `src/ui/MainMenu.jsx` — Already has placeholder modal logic from Story 8.1
- `localStorage` — Used for high score, will extend for audio settings

**No State Stores Needed:**
- Options modal is ephemeral UI state (useState in MainMenu.jsx)
- Audio settings persist to localStorage, not Zustand
- audioManager reads from localStorage on init, OptionsModal writes to localStorage directly

### Technical Requirements

**localStorage Structure:**
```json
{
  "audioSettings": {
    "masterVolume": 100,
    "musicVolume": 100,
    "sfxVolume": 100
  },
  "highScore": 10000
}
```

**audioManager.js API Extensions:**
```javascript
// Required methods (add if not present):
setMasterVolume(volume) // volume: 0-1, affects all audio
setMusicVolume(volume)  // volume: 0-1, affects music Howl instances only
setSfxVolume(volume)    // volume: 0-1, affects SFX Howl instances only
```

**Accessibility Requirements:**
- `aria-modal="true"` on modal container
- Focus trap within modal (react-focus-lock or custom)
- ESC key to close (addEventListener in useEffect)
- `inert` attribute on MainMenu when modal is open (prevents interaction)
- Keyboard navigation for all controls (Tab, Enter, Arrows)

**Visual Design:**
- Modal overlay: `bg-black/60` (60% opacity dark background)
- Modal card: `bg-game-bg` with border `border-game-primary`
- Title: `text-3xl font-bold text-game-text`
- Sliders: Use HTML `<input type="range">` with custom Tailwind styling
- CLEAR SAVE button: `bg-game-danger hover:bg-red-700 text-white`
- Confirmation dialog: Nested Card with border-red, bold warning text

### Implementation Guidance

**Step 1: Create OptionsModal component skeleton**
```jsx
// src/ui/modals/OptionsModal.jsx
import { useState, useEffect } from 'react'

export default function OptionsModal({ onClose }) {
  const [masterVolume, setMasterVolume] = useState(100)
  const [musicVolume, setMusicVolume] = useState(100)
  const [sfxVolume, setSfxVolume] = useState(100)
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    // ... read audioSettings from localStorage
  }, [])

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" aria-modal="true">
      <div className="bg-game-bg border-2 border-game-primary rounded-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-game-text text-center mb-6">OPTIONS</h2>
        {/* Volume sliders */}
        {/* Clear save button */}
        {/* BACK button */}
      </div>
    </div>
  )
}
```

**Step 2: Integrate with MainMenu**
```jsx
// src/ui/MainMenu.jsx (existing, modify handleMenuSelect)
const [isOptionsOpen, setIsOptionsOpen] = useState(false)

const handleMenuSelect = (item) => {
  if (item.id === 'play') {
    handlePlay()
  } else if (item.id === 'options') {
    setIsOptionsOpen(true) // Open modal
  } else if (item.id === 'credits') {
    setIsCreditsOpen(true)
  }
}

return (
  <div className="..." inert={isOptionsOpen ? '' : undefined}>
    {/* Main menu buttons */}
    {isOptionsOpen && <OptionsModal onClose={() => setIsOptionsOpen(false)} />}
  </div>
)
```

**Step 3: Volume Sliders**
```jsx
// Inside OptionsModal
<div className="mb-6">
  <label className="block text-game-text mb-2">Master Volume</label>
  <div className="flex items-center gap-4">
    <input
      type="range"
      min="0"
      max="100"
      value={masterVolume}
      onChange={(e) => {
        const val = parseInt(e.target.value, 10)
        setMasterVolume(val)
        audioManager.setMasterVolume(val / 100)
        localStorage.setItem('audioSettings', JSON.stringify({ ...audioSettings, masterVolume: val }))
      }}
      className="flex-1 accent-game-primary"
    />
    <span className="text-game-text tabular-nums w-12 text-right">{masterVolume}%</span>
  </div>
</div>
```

**Step 4: Clear Save with Confirmation**
```jsx
const handleClearSave = () => {
  localStorage.clear() // Remove all keys
  setIsClearConfirmOpen(false)
  onClose() // Close modal after clearing
  // Optionally: reset audio settings to defaults immediately
  audioManager.setMasterVolume(1)
  audioManager.setMusicVolume(1)
  audioManager.setSfxVolume(1)
}

// Render confirmation dialog conditionally
{isClearConfirmOpen && (
  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80">
    <div className="bg-game-bg border-2 border-red-500 rounded-lg p-6 max-w-sm">
      <p className="text-game-text mb-4">Are you sure? This will erase all progress, high scores, and settings. This cannot be undone.</p>
      <div className="flex gap-4">
        <button onClick={() => setIsClearConfirmOpen(false)} className="...">CANCEL</button>
        <button onClick={handleClearSave} className="bg-game-danger ...">CLEAR DATA</button>
      </div>
    </div>
  </div>
)}
```

### Existing Code References

**MainMenu.jsx** (Story 8.1) already has placeholder modal logic:
```jsx
// Current state: OPTIONS button triggers placeholder modal
// Story 8.2 replaces placeholder with full OptionsModal component
```

**audioManager.js** (Story 4.5):
- Howler.js wrapper
- Manages music (looping) and SFX (one-shot) categories
- May need extensions for volume control methods (setMasterVolume, setMusicVolume, setSfxVolume)

**localStorage keys currently used:**
- `highScore` — Integer, high score display (Story 8.1)
- Future: `audioSettings` — JSON object for volumes (Story 8.2)

### Anti-Patterns to Avoid

- **Do NOT create a Zustand store for options UI state** — This is ephemeral modal state, useState is sufficient
- **Do NOT mutate localStorage directly in multiple places** — OptionsModal owns audioSettings writes, audioManager reads on init
- **Do NOT forget to validate slider values** — Always parseInt + clamp to 0-100 range
- **Do NOT skip accessibility** — inert attribute, focus trap, ESC key, keyboard navigation are required
- **Do NOT make confirmation dialog dismissible by clicking outside** — User must explicitly choose CANCEL or CLEAR DATA
- **Do NOT forget to apply inert to MainMenu** — Prevents keyboard/mouse interaction with menu while modal is open
- **Do NOT use complex modal libraries** — A simple portal + overlay div is sufficient
- **Do NOT forget audio preview on slider change** — Play brief SFX/music sample on mouseUp for immediate feedback

### Testing Approach

**Manual browser tests:**
1. Click OPTIONS from main menu → modal opens with 60% dark overlay
2. Adjust Master Volume slider → music volume changes immediately, value displays correctly
3. Adjust Music Volume slider → music volume changes, SFX unaffected
4. Adjust SFX Volume slider → SFX preview plays on mouseUp at new volume
5. Close modal with BACK button → returns to main menu, focus on OPTIONS button
6. Close modal with ESC key → same behavior as BACK
7. Reload page → volume settings persist (sliders show saved values)
8. Click CLEAR LOCAL SAVE → confirmation dialog appears
9. Click CANCEL in confirmation → returns to options without clearing
10. Click CLEAR DATA in confirmation → localStorage cleared, modal closes, high score resets to "---"
11. Keyboard navigation: Tab cycles through sliders and buttons, Enter activates, Arrows adjust sliders
12. Accessibility: Screen reader announces "OPTIONS" dialog, focus trapped, MainMenu not interactive while modal open

**localStorage validation:**
```javascript
// Before clear:
localStorage.getItem('audioSettings') // '{"masterVolume":75,"musicVolume":100,"sfxVolume":50}'
localStorage.getItem('highScore') // '10000'

// After clear:
localStorage.getItem('audioSettings') // null
localStorage.getItem('highScore') // null
```

**Performance check:**
- Modal render time < 16ms (60 FPS)
- No jank during slider dragging
- Volume changes apply without audio pops/clicks

### Scope Summary

Story 8.2 implements the OPTIONS menu as a modal overlay accessible from the main menu. The modal provides three volume sliders (Master, Music, SFX) that adjust audio in real-time via audioManager.js and persist settings to localStorage. A "CLEAR LOCAL SAVE" button with confirmation dialog allows players to reset all progress. The modal is fully keyboard-navigable, accessible (focus trap, ESC to close, inert on background), and styled consistently with the game's "Cyber Minimal" design. The implementation is simple (no state store needed, direct localStorage usage) and follows the frugal UI philosophy from Story 8.1.

**Key deliverables:**
1. `src/ui/modals/OptionsModal.jsx` — Modal component with volume sliders + clear save
2. Modified `src/ui/MainMenu.jsx` — Integrated OptionsModal rendering + inert attribute
3. Extended `src/audio/audioManager.js` — Add setMasterVolume, setMusicVolume, setSfxVolume methods (if not present)
4. localStorage integration — Read/write audioSettings JSON, clear all on reset
5. Accessibility features — Focus trap, ESC key, keyboard navigation, inert attribute
6. Visual tests confirming modal appearance, slider functionality, confirmation dialog, persistence

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.2] — Acceptance criteria: OPTIONS modal, volume sliders, clear save with confirmation, keyboard navigation
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8] — Overview: Enhanced Main Menu & Metagame UI
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System] — Tailwind CSS, modal styling, accessibility requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#Audio] — Howler.js wrapper (audioManager.js), volume control patterns
- [Source: _bmad-output/implementation-artifacts/8-1-main-menu-visual-overhaul.md] — Previous story: MainMenu.jsx structure, placeholder modal logic, OPTIONS button already exists
- [Source: src/ui/MainMenu.jsx] — Current implementation: MENU_ITEMS with 'options' entry, handleMenuSelect dispatches to placeholder
- [Source: src/audio/audioManager.js] — Current audio manager implementation (Story 4.5)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blocking issues.

### Completion Notes List

- Created OptionsModal component (`src/ui/modals/OptionsModal.jsx`) with full modal overlay, three volume sliders (Master, Music, SFX), CLEAR LOCAL SAVE button with confirmation dialog, and BACK button
- Extended audioManager.js with `setMasterVolume()`, `getMasterVolume()`, `getMusicVolume()`, `getSfxVolume()`, and `loadAudioSettings()` functions
- Integrated OptionsModal into MainMenu.jsx, replacing the placeholder modal for OPTIONS
- Added localStorage persistence for audio settings (read on init via `loadAudioSettings()` called in `useAudio.jsx`, write on slider change)
- Implemented focus trap, ESC key handling, `aria-modal`, and `inert` attribute for accessibility
- MainMenu high score display now refreshes after closing options (handles clear save scenario)
- Added 10 new audioManager tests (setMasterVolume, getters, loadAudioSettings) — all pass
- Added OptionsModal logic tests (localStorage, clamping) — all pass
- Full test suite: 559 tests pass, 0 failures, 0 regressions

### Change Log

- 2026-02-11: Implemented Story 8.2 — Options Menu with volume sliders, clear save, and accessibility features
- 2026-02-11: Code review fixes — exported utility functions for proper testing, added confirmation dialog a11y attrs, added loadAudioSettings clamping, refactored state persistence to avoid excessive localStorage reads, rewrote tests to test real functions

### File List

- `src/ui/modals/OptionsModal.jsx` (new) — Modal component with volume sliders + clear save + confirmation dialog
- `src/ui/MainMenu.jsx` (modified) — Integrated OptionsModal, replaced placeholder, added isOptionsOpen state, high score refresh
- `src/audio/audioManager.js` (modified) — Added setMasterVolume, getMasterVolume, getMusicVolume, getSfxVolume, loadAudioSettings
- `src/hooks/useAudio.jsx` (modified) — Added loadAudioSettings() call on mount before preloading
- `src/audio/__tests__/audioManager.test.js` (modified) — Added 10 tests for new audioManager functions + localStorage mock
- `src/ui/__tests__/OptionsModal.test.js` (new) — Logic tests for localStorage handling and volume clamping
