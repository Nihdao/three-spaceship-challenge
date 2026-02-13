# Story 13.4: Mandatory Dilemma Before System Entry

Status: done

## Story

As a player,
I want to be required to resolve the dilemma (accept or refuse) before I can enter the next system,
So that the dilemma feels like a meaningful decision point rather than something easily skipped.

## Acceptance Criteria

1. **Given** the tunnel hub **When** a dilemma is available and unresolved **Then** the "ENTER SYSTEM" button is visually disabled (grayed out, not clickable) **And** a hint text indicates the dilemma must be resolved first

2. **Given** the tunnel hub **When** the player accepts or refuses the dilemma **Then** the "ENTER SYSTEM" button becomes enabled (normal styling, clickable) **And** the transition is visually smooth

3. **Given** the tunnel hub **When** no dilemma is available (all dilemmas already accepted in previous tunnels) **Then** the "ENTER SYSTEM" button is enabled by default (no blocking)

4. **Given** the tunnel hub **When** the player presses Enter on the keyboard **And** the dilemma is unresolved **Then** nothing happens (keyboard shortcut also blocked)

## Tasks / Subtasks

- [x] Task 1: Add dilemma-resolved gate to Enter System button (AC: #1, #2, #3)
  - [x] 1.1: Compute `canEnterSystem` boolean: true if no dilemma available OR dilemmaResolved is true
  - [x] 1.2: Apply disabled styling to ENTER SYSTEM button when `!canEnterSystem` (opacity-50, cursor-not-allowed, no hover effects)
  - [x] 1.3: Prevent onClick from firing when `!canEnterSystem`
  - [x] 1.4: Add hint text below button when disabled: "Resolve the dilemma first"
  - [x] 1.5: Smooth transition when button becomes enabled (transition-all duration-300)

- [x] Task 2: Block keyboard shortcut when dilemma unresolved (AC: #4)
  - [x] 2.1: Add `!canEnterSystem` guard to the Enter key handler in the useEffect keyboard listener
  - [x] 2.2: Verify pressing Enter does nothing when dilemma is pending

- [x] Task 3: Test all dilemma states (AC: #1, #2, #3, #4)
  - [x] 3.1: Test with available dilemma — button disabled until accept/refuse
  - [x] 3.2: Test with no available dilemma — button enabled immediately
  - [x] 3.3: Test keyboard Enter blocked when dilemma pending
  - [x] 3.4: Test transition from disabled → enabled is smooth

## Dev Notes

### Architecture Context

- **UI Layer only** — changes limited to `src/ui/TunnelHub.jsx`
- The `currentDilemma` and `dilemmaResolved` state already exist in TunnelHub
- `canEnterSystem` is a simple derived boolean, no store changes needed
- No changes to game logic, stores, or 3D scene

### Technical Requirements

- `canEnterSystem = !currentDilemma || dilemmaResolved`
- Apply to both button onClick and keyboard Enter handler
- Disabled button styling: reuse existing pattern (opacity-50 cursor-not-allowed from upgrade buttons)
- Hint text: small muted text below button, only visible when disabled

### References

- TunnelHub.jsx: currentDilemma (line 32-39), dilemmaResolved (line 21), handleEnterSystem (line 112-124), keyboard handler (line 132-158)
- Enter System button (line 279-289)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered.

### Completion Notes List

- Added `canEnterSystem = !currentDilemma || dilemmaResolved` derived boolean (line 91)
- Enter System button now conditionally applies disabled styling (opacity-50, cursor-not-allowed) when `!canEnterSystem`
- Button onClick and onMouseEnter are guarded by `canEnterSystem`
- Button uses `disabled={!canEnterSystem}` HTML attribute
- Hint text "Resolve the dilemma first" shown below button when disabled
- Transition duration changed from 150ms to 300ms for smooth enabled/disabled transition
- Keyboard Enter handler guarded with `&& canEnterSystem` check
- `canEnterSystem` added to useEffect dependency array
- 7 unit tests added covering all ACs and dilemma gate logic states

### File List

- src/ui/TunnelHub.jsx (modified)
- src/ui/__tests__/TunnelHub.dilemmaGate.test.jsx (new)

### Change Log

- 2026-02-13: Implemented mandatory dilemma gate — Enter System button disabled (visually + functionally) until dilemma is resolved or no dilemma available. Keyboard Enter shortcut also blocked. 7 tests added.
- 2026-02-13: Code review fixes — extracted `computeCanEnterSystem` as exported testable function, rewrote tests to use real store interactions and exported function instead of duplicating boolean logic, removed redundant `canEnterSystem` from useEffect deps, simplified button onClick (native `disabled` attribute handles click blocking).
