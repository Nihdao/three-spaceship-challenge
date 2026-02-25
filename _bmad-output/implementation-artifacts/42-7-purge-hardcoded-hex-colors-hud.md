# Story 42.7: Purge Hardcoded Hex Colors in HUD

Status: review

## Story

As a developer,
I want all remaining hardcoded hex colors in HUD.jsx replaced by Redshift CSS variables,
So that the HUD palette is fully driven by the design system.

## Acceptance Criteria

1. **Given** `HUD.jsx` — dash cooldown indicator
   **When** the dash is on cooldown
   **Then** the border uses `var(--rs-dash-cd)` instead of `'#ffaa00'`
   **And** the backgroundColor uses `rgba(255, 79, 31, 0.08)` (RS orange) instead of `'#ffaa0015'`
   **And** the text color uses `var(--rs-dash-cd)` instead of `'#ffaa00'`

2. **Given** `HUD.jsx` — dash ready indicator
   **When** the dash is ready
   **Then** the border uses `var(--rs-dash-ready)` instead of `'var(--rs-teal)'`
   **And** the backgroundColor uses `rgba(0, 180, 216, 0.12)` instead of `'#00ffcc20'`
   **And** the boxShadow uses `rgba(0, 180, 216, 0.4)` instead of `'#00ffcc60'`

3. **Given** `HUD.jsx` — MINIMAP constants
   **When** the minimap renders
   **Then** `enemyDotColor` uses `'var(--rs-danger)'` instead of `'#ff4444'`
   **And** `playerDotGlow` uses `'0 0 6px rgba(0, 180, 216, 0.8)'` instead of `'0 0 6px rgba(0, 255, 204, 0.8)'`

4. **Given** `HUD.jsx` — weapon slot empty state
   **When** a weapon slot is empty
   **Then** the border uses `'1px dashed var(--rs-border)'` instead of `'1px dashed rgba(255,255,255,0.1)'`
   **And** the placeholder text uses `'var(--rs-text-dim)'` instead of `'rgba(255,255,255,0.2)'`

5. **Given** `HUD.jsx` — scan progress bar
   **When** the scan bar is visible
   **Then** the track background uses `'var(--rs-bg-raised)'` instead of `'rgba(255,255,255,0.1)'`

6. **Given** `vitest run`
   **When** the story is implemented
   **Then** all HUD tests pass

## Tasks / Subtasks

- [x] Fix MINIMAP constants (AC: #3)
  - [x] `playerDotGlow`: `'0 0 6px rgba(0, 255, 204, 0.8)'` → `'0 0 6px rgba(0, 180, 216, 0.8)'` (line 25)
  - [x] `enemyDotColor`: `'#ff4444'` → `'var(--rs-danger)'` (line 33)
  - [x] Fix the enemy dot `boxShadow` usage that appends hex suffix to the variable (see Dev Notes)

- [x] Fix weapon slot empty state (AC: #4)
  - [x] Border: `'1px dashed rgba(255,255,255,0.1)'` → `'1px dashed var(--rs-border)'` (line 186)
  - [x] Text color: `'rgba(255,255,255,0.2)'` → `'var(--rs-text-dim)'` (line 190)

- [x] Fix scan progress bar track (AC: #5)
  - [x] `backgroundColor: 'rgba(255,255,255,0.1)'` → `'var(--rs-bg-raised)'` (line 653 réel)

- [x] Fix dash cooldown indicator (AC: #1, #2)
  - [x] Cooldown border: `'#ffaa00'` → `'var(--rs-dash-cd)'` (line 679)
  - [x] Ready border: `'var(--rs-teal)'` → `'var(--rs-dash-ready)'` (line 679)
  - [x] Cooldown bg: `'#ffaa0015'` → `'rgba(255, 79, 31, 0.08)'` (line 680)
  - [x] Ready bg: `'#00ffcc20'` → `'rgba(0, 180, 216, 0.12)'` (line 680)
  - [x] Ready boxShadow: `'0 0 8px #00ffcc60'` → `'0 0 8px rgba(0, 180, 216, 0.4)'` (line 681)
  - [x] Cooldown text color: `'#ffaa00'` → `'var(--rs-dash-cd)'` (line 688)
  - [x] Ready text color: `'var(--rs-teal)'` → `'var(--rs-dash-ready)'` (line 688)

- [x] Run `vitest run` and confirm all HUD tests pass (AC: #6)

## Dev Notes

### Only file to touch: `src/ui/HUD.jsx`

No store, no config, no style.css changes needed. All CSS variables already exist.

### CSS Variables Reference (already defined in `src/style.css :root`)

```
--rs-dash-ready:  #00b4d8   (= teal, used when dash is ready)
--rs-dash-cd:     #ff4f1f   (= orange RS, used when dash is on cooldown)
--rs-danger:      #ef233c   (enemy dots)
--rs-border:      #2e2545   (neutral borders)
--rs-text-dim:    #4a3f5c   (very secondary labels)
--rs-bg-raised:   #241d35   (interactive elements backgrounds)
```

### Critical: Enemy dot boxShadow cannot append hex suffix to a CSS variable

Line 560 of HUD.jsx uses a template literal: `boxShadow: \`0 0 4px ${MINIMAP.enemyDotColor}80\``

Appending `80` (hex alpha) to `'var(--rs-danger)'` produces invalid CSS: `0 0 4px var(--rs-danger)80`.

**Solution:** Inline the rgba directly at usage site — do NOT change the template literal approach:
```js
boxShadow: `0 0 4px rgba(239, 35, 60, 0.5)`,
```
Where `239, 35, 60` = `#ef233c` (--rs-danger). This is the only place `MINIMAP.enemyDotColor` is used for boxShadow.

Alternatively, add `enemyDotGlow: '0 0 4px rgba(239, 35, 60, 0.5)'` to the MINIMAP constants and use that — but this would require updating the minimap test's `requiredKeys` array, which is lower-risk to avoid.

**Recommended:** Just change the inline boxShadow string on line 560 to `'0 0 4px rgba(239, 35, 60, 0.5)'` and set `enemyDotColor: 'var(--rs-danger)'`.

### Boon slots are NOT in scope

`BoonSlots` uses `rgba(155,93,229,0.x)` for its borders and backgrounds (violet-derived). These are intentional alpha variants of `--rs-violet` (`#9b5de5` = rgb 155, 93, 229) and not targeted by this story's ACs. Do not change them.

### Dash indicator colors change visually

- Cooldown state: amber `#ffaa00` → RS orange `#ff4f1f` (more saturated, warmer)
- Ready state: legacy teal `#00ffcc` → RS teal `#00b4d8` (slightly different hue, same semantic)

This is expected — aligning the HUD with the RS palette.

### Existing test — no changes needed

`src/ui/__tests__/HUD.minimap.test.jsx` checks:
- `MINIMAP.enemyDotColor` is truthy → `'var(--rs-danger)'` is truthy ✓
- `MINIMAP.playerDotGlow` is truthy → `'0 0 6px rgba(0, 180, 216, 0.8)'` is truthy ✓
- `borderColor === 'var(--rs-teal)'` → not changed ✓
- `backgroundColor === 'var(--rs-bg-surface)'` → not changed ✓

No test adjustments needed.

### Project Structure Notes

- Architecture layer: UI only — no store, system, or config changes
- `src/ui/HUD.jsx` is the single file to modify
- `src/style.css` already has all `--rs-dash-*` variables (lines 183-184)

### References

- Epic 42 spec: `_bmad-output/planning-artifacts/epic-42-ui-harmonization-deep-cleanup.md#story-427`
- CSS variables: `src/style.css :root {}` lines 183-184 for dash vars
- Existing test: `src/ui/__tests__/HUD.minimap.test.jsx`
- HUD source: `src/ui/HUD.jsx` — MINIMAP constants (lines 20-38), WeaponSlots (lines 179-193), scan bar (lines 610-616), dash indicator (lines 641-651)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None — implémentation directe sans blocage._

### Completion Notes List

- 10 substitutions dans `src/ui/HUD.jsx`, tous les hex hardcodés ciblés remplacés par des variables CSS RS.
- `MINIMAP.enemyDotColor` → `'var(--rs-danger)'` ; la `boxShadow` template literal à la ligne 478 a été inlinée en `'0 0 4px rgba(239, 35, 60, 0.5)'` (impossible d'appliquer suffix hex sur une variable CSS).
- Dash cooldown : `#ffaa00` → `var(--rs-dash-cd)`, ready : `var(--rs-teal)` → `var(--rs-dash-ready)` (couleur légèrement changée comme attendu).
- BoonSlots violet (`rgba(155,93,229,...)`) hors scope — non touchés.
- `vitest run` : 157 fichiers, 2676 tests, 100% verts.

### File List

- `src/ui/HUD.jsx`

## Change Log

- 2026-02-24 — Story 42.7 implémentée : purge de 10 couleurs hex hardcodées dans HUD.jsx (MINIMAP constants, weapon slot empty state, scan bar track, dash cooldown indicator). Toutes remplacées par des variables CSS Redshift. Tests : 2676/2676 verts.
