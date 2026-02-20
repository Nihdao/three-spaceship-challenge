# Story 28.2: Hide Leva Debug Panel

Status: review

## Story

As a player,
I want the Leva debug panel to not appear in the game,
so that the interface is clean and uncluttered.

## Acceptance Criteria

### AC1: Leva Panel Hidden
**Given** the game is running (any phase)
**When** the player opens the game
**Then** the Leva panel is completely invisible — no floating controls widget appears
**And** no visible UI element is rendered by Leva

### AC2: Camera Functionality Preserved
**Given** the `useControls` hooks in `usePlayerCamera.jsx` and `DebugControls.jsx`
**When** the Leva panel is hidden
**Then** camera follow settings (offsetY=120, posSmooth=20) still use their default values correctly
**And** the camera follows the player as before — no behavior regression
**And** `DebugControls.jsx` still compiles and runs without errors

### AC3: Developer Re-enablement
**Given** future dev needs
**When** a developer needs to use the Leva panel
**Then** they can re-enable it by removing or toggling the `hidden` prop from `<Leva>` in `index.jsx`
**And** the panel reappears with all controls intact

## Tasks / Subtasks

- [x] Add `<Leva hidden />` to the root App component (AC: #1, #2)
  - [x] In `src/index.jsx`, import `Leva` from `'leva'`: `import { Leva } from 'leva'`
  - [x] Add `<Leva hidden />` inside the `App` return JSX, outside the Canvas
  - [x] Best placement: just before `<KeyboardControls>` or as a sibling inside the return fragment
  - [x] Verify no import conflicts (leva is already a dependency via DebugControls and usePlayerCamera)

- [ ] Manual QA (AC: #1, #2, #3)
  - [ ] Launch game — Leva panel should be completely invisible
  - [ ] Camera still follows player correctly (default offsetY=120 used)
  - [ ] Navigate to `#debug` URL hash — DebugControls mounts, camera toggle still functional internally
  - [ ] Remove `hidden` temporarily — Leva panel reappears to confirm it's just hidden, not broken

## Dev Notes

### Root Cause: `usePlayerCamera` Always Calls `useControls`

The Leva panel appears unconditionally because `usePlayerCamera.jsx` calls `useControls` on every render — NOT because of `DebugControls.jsx` (which is already gated behind `isDebugMode`):

```js
// src/hooks/usePlayerCamera.jsx line 42 — runs always, no debug gate
export function usePlayerCamera() {
  const { offsetY, posSmooth } = useControls("Camera Follow", {
    offsetY: { value: 120, min: 10, max: 200, step: 1 },
    posSmooth: { value: 20, min: 1, max: 40, step: 0.5 },
  });
  // ...
}
```

```jsx
// src/Experience.jsx line 24 — DebugControls is already gated (NOT the problem)
{isDebugMode && <DebugControls />}
```

### The Fix: `<Leva hidden />` in App Root

Leva's `<Leva hidden />` renders the provider with the panel suppressed. All `useControls` hooks continue to return their default values — no functionality is lost, only the UI is hidden.

**File to modify**: `src/index.jsx` — the `App` component

**Current App return:**
```jsx
return (
  <KeyboardControls map={[...]}>
    <Canvas ...>
      <Experience />
    </Canvas>
    <Interface />
  </KeyboardControls>
)
```

**After fix:**
```jsx
import { Leva } from 'leva'

// Inside App return:
return (
  <>
    <Leva hidden />
    <KeyboardControls map={[...]}>
      <Canvas ...>
        <Experience />
      </Canvas>
      <Interface />
    </KeyboardControls>
  </>
)
```

The `<Leva hidden />` must be **outside the Canvas** (it renders to DOM, not to Three.js), but inside the React tree so it affects all `useControls` calls. Placing it as a sibling to `KeyboardControls` inside a fragment works perfectly.

### Why NOT `import.meta.env.PROD` Approach

The epic mentions checking `import.meta.env.PROD` in `DebugControls.jsx`. However:
1. `DebugControls.jsx` is already gated by `isDebugMode` — it's NOT the cause of the visible panel
2. The real cause is `usePlayerCamera.jsx` — you'd need to modify both files
3. Conditional `useControls` calls would violate React's Rules of Hooks (hooks can't be called conditionally)
4. `<Leva hidden />` fixes both files at once, with one line, without touching either hook file

### Camera Follow Values: Default Values Confirmed

With `<Leva hidden />`, `useControls` returns the default values as declared:
- `offsetY: 120` (camera height — already the correct gameplay value)
- `posSmooth: 20` (camera smoothing — already the correct gameplay value)

These are exactly the values the game uses in production. No functional change occurs.

### Leva Version Compatibility

Check the installed leva version:
```bash
cat package.json | grep leva
```
The `hidden` prop on `<Leva>` has been available since leva 0.9+. This prop is stable and documented.

### No Tests Needed

This is a pure visual change with no testable logic:
- No store changes
- No system logic changes
- No new components
- Visual QA sufficient

### Project Structure Notes

**Single file changed**: `src/index.jsx`
- Add 1 import line
- Add 1 JSX element + React fragment wrapper if needed

**No architectural impact**: `usePlayerCamera.jsx` and `DebugControls.jsx` are untouched — they still call `useControls` normally, just the panel rendering is suppressed by the root `<Leva hidden />`.

**Debug mode still works**: Navigating to `#debug` still mounts `DebugControls`, and a developer who removes `hidden` can use all controls.

### References

- [Source: src/index.jsx] — Root App component where `<Leva hidden />` should be added
- [Source: src/hooks/usePlayerCamera.jsx:42-45] — The `useControls("Camera Follow", ...)` call causing the panel
- [Source: src/components/DebugControls.jsx:10-19] — The `useControls("Camera", ...)` call (gated by debug mode, not the root cause)
- [Source: src/Experience.jsx:24] — `{isDebugMode && <DebugControls />}` — already gated
- [Source: _bmad-output/planning-artifacts/epic-28-bugs-balance-polish.md#Story 28.2] — Full requirements
- [Source: _bmad-output/planning-artifacts/epic-28-bugs-balance-polish.md#Technical Notes] — Implementation guidance

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

None.

### Completion Notes List

- Added `import { Leva } from 'leva'` to `src/index.jsx`
- Added `<Leva hidden />` as first child inside the App return fragment, before `<KeyboardControls>`
- Wrapped existing return content in a React fragment `<>...</>` to accommodate sibling placement
- `useControls` hooks in `usePlayerCamera.jsx` and `DebugControls.jsx` are untouched — they continue returning their default values (offsetY=120, posSmooth=20)
- No tests needed per story Dev Notes (pure visual change, no store/logic modifications)
- Leva version confirmed: package.json `^0.10.0` — `hidden` prop available since 0.9+, fully compatible
- Code review fix (R1): Added inline JSX comment explaining `<Leva hidden />` purpose
- Code review fix (R2): Fixed fragment children indentation (children at 6-space, consistent with 2-space convention)

### File List

- src/index.jsx

### Change Log

- 2026-02-20: Story 28.2 implemented — added `<Leva hidden />` to suppress debug panel globally
- 2026-02-20: Code review fixes applied — indentation corrected, inline comment added, version compatibility documented

## Senior Developer Review (AI)

**Review Date:** 2026-02-20
**Outcome:** Changes Requested (minor)
**Reviewer Model:** Claude Sonnet 4.6

### Summary

Implementation is correct and architecturally sound. `<Leva hidden />` is the right approach — it cleanly suppresses the panel without touching hook files or violating Rules of Hooks. Leva 0.10.0 is compatible. Code changes applied automatically (L1 indentation, L2 comment). Manual browser QA remains the only open item.

### Action Items

- [x] [Med] Manual QA tasks in Tasks/Subtasks are unchecked while story is "review" — AC1/2/3 require browser verification [story task list]
- [x] [Low] Fragment children not indented relative to `<>` parent (children at same column as fragment tag) [src/index.jsx]
- [x] [Low] No inline comment on `<Leva hidden />` — future devs could remove it thinking it's dead code [src/index.jsx]
- [x] [Low] Leva version compatibility not documented in Completion Notes [story Dev Agent Record]

**Note on M1:** Code-level analysis confirms the implementation is correct (Leva 0.10 has `hidden` prop, placement is valid as sibling via Leva's global Zustand store). Manual QA checklist items should be verified in browser by Adam before marking story "done".
