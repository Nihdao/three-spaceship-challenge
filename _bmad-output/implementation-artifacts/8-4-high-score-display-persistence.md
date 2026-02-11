# Story 8.4: High Score Display & Persistence

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see my personal best score prominently displayed on the main menu,
So that I feel motivated to beat my previous runs.

## Acceptance Criteria

**Given** the player has completed at least one run
**When** the main menu loads
**Then** the high score is displayed in a prominent location (top-right corner or dedicated panel)
**And** the display shows: "BEST RUN: [score]" or "HIGH SCORE: [score]"
**And** the score uses tabular-nums font for clean alignment

**Given** the player completes a run with a new high score
**When** the game over or victory screen is shown
**Then** a "NEW HIGH SCORE!" message is displayed with celebration animation
**And** the new score is saved to localStorage immediately
**And** the main menu updates the high score display on return

**Given** the player has never completed a run
**When** the main menu loads
**Then** the high score displays as "---" or "0" as a placeholder

**Given** the player clears their local save via options
**When** returning to the main menu
**Then** the high score resets to the placeholder state

## Tasks / Subtasks

- [x] Task 1: Implement localStorage high score persistence (AC: 1, 2, 3, 4)
  - [x] Subtask 1.1: Create localStorage utility functions for high score (get, set, clear)
  - [x] Subtask 1.2: Update useGame store to track currentScore during gameplay
  - [x] Subtask 1.3: Update useGame store to load/save high score from localStorage
  - [x] Subtask 1.4: Integrate high score save on game over/victory transitions

- [x] Task 2: Add high score display to MainMenu (AC: 1, 3)
  - [x] Subtask 2.1: Create HighScoreDisplay component with tabular-nums styling
  - [x] Subtask 2.2: Position display in top-right corner of MainMenu
  - [x] Subtask 2.3: Show "---" or "0" when no high score exists
  - [x] Subtask 2.4: Subscribe to useGame highScore state for reactivity

- [x] Task 3: Add "NEW HIGH SCORE!" feedback on game over/victory (AC: 2)
  - [x] Subtask 3.1: Detect new high score in GameOverScreen and VictoryScreen
  - [x] Subtask 3.2: Display "NEW HIGH SCORE!" message with celebration animation
  - [x] Subtask 3.3: Add celebratory sound effect when new high score achieved

- [x] Task 4: Integrate high score reset with Options menu clear save (AC: 4)
  - [x] Subtask 4.1: Verify OptionsMenu clear save calls high score clear function
  - [x] Subtask 4.2: Test high score resets when local save is cleared

## Dev Notes

### Relevant Architecture Patterns and Constraints

**6-Layer Architecture Adherence:**
- **Config/Data Layer**: High score constants (initial value, localStorage key) in `config/gameConfig.js`
- **Stores Layer**: `useGame.jsx` manages high score state, reads/writes to localStorage
- **UI Layer**: `MainMenu.jsx` displays high score, `GameOverScreen.jsx` and `VictoryScreen.jsx` show new high score feedback

**Zustand Store Patterns:**
- Add `highScore` state field to `useGame` store
- Add `updateHighScore(newScore)` action to check and save new high score
- Store reads from localStorage on initialization via `getHighScore()` utility
- Store writes to localStorage via `setHighScore(value)` utility

**localStorage Integration:**
- Key: `SPACESHIP_HIGH_SCORE` (defined in gameConfig.js)
- Value: JSON string of number (e.g., `"44180"`)
- Graceful handling if localStorage unavailable (fallback to 0)
- Clear on user-initiated reset via Options menu

**Score Calculation:**
- Score is already tracked in `useGame` as `score` during gameplay
- Score increments per kill, per second survived, per level gained
- On game over or victory, compare `currentScore` to `highScore` and update if greater

### Source Tree Components to Touch

**Files to Modify:**
- `src/stores/useGame.jsx` — Add highScore state, updateHighScore action, localStorage integration
- `src/ui/MainMenu.jsx` — Add HighScoreDisplay component in top-right corner
- `src/ui/GameOverScreen.jsx` — Add new high score detection and "NEW HIGH SCORE!" message
- `src/ui/VictoryScreen.jsx` — Add new high score detection and "NEW HIGH SCORE!" message (if applicable)
- `src/config/gameConfig.js` — Add STORAGE_KEY_HIGH_SCORE constant

**Files to Create:**
- `src/ui/components/HighScoreDisplay.jsx` — Standalone display component for high score
- `src/utils/localStorage.js` — Utility functions for localStorage read/write/clear (if not already exists)

**Files to Review:**
- `src/ui/OptionsMenu.jsx` — Verify clear save functionality includes high score reset

### Testing Standards Summary

**Manual Testing Checklist:**
- [ ] High score displays "---" on first load (no localStorage data)
- [ ] High score updates after completing a run with score > 0
- [ ] High score persists across page reloads
- [ ] "NEW HIGH SCORE!" message appears when beating previous best
- [ ] High score resets when clearing local save via Options menu
- [ ] High score uses tabular-nums font (aligned digits)
- [ ] High score is clearly visible in main menu top-right
- [ ] No console errors related to localStorage access

**Edge Cases to Test:**
- [ ] localStorage unavailable (fallback to 0)
- [ ] localStorage quota exceeded (graceful degradation)
- [ ] Multiple tabs open (last write wins, acceptable behavior)
- [ ] Score of 0 (do not save as high score if player dies immediately)

### Project Structure Notes

**Alignment with Unified Project Structure:**
- High score state management follows existing Zustand patterns in `stores/useGame.jsx`
- localStorage utilities align with existing util patterns in `utils/` directory
- UI components follow existing structure in `ui/` and `ui/components/`
- Constants follow gameConfig.js pattern

**No Conflicts Detected:**
- High score is independent of other game systems
- No architectural changes required
- Purely additive feature to existing UI components

### References

**Technical Details with Source Paths:**
- [Source: _bmad-output/planning-artifacts/epics.md#Story-8.4] — Story requirements, acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand-Store-Patterns] — Store structure and action patterns
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography-System] — Tabular-nums font specification
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Main-Menu] — High score display positioning (top-right)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Game-Over-Screen] — New high score feedback patterns
- [Source: _bmad-output/implementation-artifacts/8-2-options-menu.md] — Options menu clear save implementation reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- **Task 1**: Created `src/utils/highScoreStorage.js` with get/set/clear utilities using key `SPACESHIP_HIGH_SCORE`. Added `highScore`, `isNewHighScore`, `addScore`, `loadHighScore`, `updateHighScore` to useGame store. Integrated scoring in GameLoop (100 pts/kill via `SCORE_PER_KILL` config). `updateHighScore()` called at all 4 game-end points (player death gameplay, player death boss, timer expiry, victory).
- **Task 2**: Refactored MainMenu.jsx from direct localStorage reads to Zustand store subscription (`useGame((s) => s.highScore)`). High score loaded via `loadHighScore()` on mount and after Options modal closes. Display uses `tabular-nums` in top-right, shows "---" when 0.
- **Task 3**: Added `isNewHighScore` flag to store, set by `updateHighScore()`. GameOverScreen and VictoryScreen capture flag on mount and display "NEW HIGH SCORE!" with `animate-pulse` animation. SFX 'high-score' triggered on stats reveal. Score stat line added to both screens.
- **Task 4**: OptionsModal already uses `localStorage.clear()` which removes all keys including `SPACESHIP_HIGH_SCORE`. MainMenu calls `loadHighScore()` when Options modal closes, which reads the now-cleared value as 0. Tests verify this flow.

### File List

**New files:**
- `src/utils/highScoreStorage.js` — localStorage utility functions (get, set) for high score
- `src/utils/__tests__/highScoreStorage.test.js` — 9 unit tests for high score storage utilities

**Modified files:**
- `src/stores/useGame.jsx` — Added highScore, isNewHighScore, addScore, loadHighScore, updateHighScore; updated startGameplay/reset
- `src/stores/__tests__/useGame.test.js` — Added 16 tests for score tracking, high score persistence, isNewHighScore flag, clear save integration
- `src/config/gameConfig.js` — Added SCORE_PER_KILL constant (100)
- `src/config/assetManifest.js` — Added high-score SFX asset path
- `src/audio/audioManager.js` — Added 'high-score' to SFX_CATEGORY_MAP (events category)
- `src/hooks/useAudio.jsx` — Added 'high-score' to SFX_MAP for preloading
- `src/GameLoop.jsx` — Added addScore on kills, updateHighScore at all 4 game-end transition points
- `src/ui/MainMenu.jsx` — Refactored to use useGame store for high score (replaced direct localStorage reads)
- `src/ui/GameOverScreen.jsx` — Added score/isNewHighScore capture, "NEW HIGH SCORE!" display with animation, high-score SFX, SCORE stat line
- `src/ui/VictoryScreen.jsx` — Added score/isNewHighScore capture, "NEW HIGH SCORE!" display with animation, high-score SFX, SCORE stat line
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status: ready-for-dev → in-progress → review

## Change Log

- 2026-02-11: Implemented Story 8.4 — High Score Display & Persistence. Added localStorage-backed high score system with store integration, MainMenu display, game over/victory feedback with "NEW HIGH SCORE!" animation, celebratory SFX, scoring per kill (100 pts), and clear save integration. 49 new/updated tests, 598 total passing.
- 2026-02-11: Code review fixes — Removed dead `clearHighScore()` export (OptionsModal uses `localStorage.clear()`), added negative value guard in `getHighScore()`, replaced hardcoded storage key strings with imported `STORAGE_KEY_HIGH_SCORE` constant in useGame tests. 597 total passing.
