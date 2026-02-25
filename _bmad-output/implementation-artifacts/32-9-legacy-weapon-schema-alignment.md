# Story 32.9: Legacy Weapon Schema Alignment — Add `weaponType` Discriminator

Status: done

## Story

As a developer,
I want the 4 legacy weapons to have a `weaponType` field like the 6 new weapons,
So that the schema is uniform across all 10 weapons and future refactors can dispatch on a single field.

## Acceptance Criteria

1. **[LASER_FRONT]** Has `weaponType: 'projectile'`.

2. **[SPREAD_SHOT]** Has `weaponType: 'projectile'`.

3. **[BEAM]** Has `weaponType: 'beam_continuous'`.

4. **[EXPLOSIVE_ROUND]** Has `weaponType: 'projectile_explosion'`.

5. **[No behavior change]** `useWeapons.tick()` and `GameLoop.jsx` behavior is unchanged. The `weaponType` field is additive — existing code dispatches on `def.weaponType === 'laser_cross'` etc. and the new values (`'projectile'`, `'beam_continuous'`, `'projectile_explosion'`) are not matched by any existing condition, so they fall through to the default projectile path as before.

6. **[Schema test]** A new test in `weaponDefs.test.js` validates that every weapon in `WEAPONS` has a `weaponType` field of type string.

7. **[All tests pass]** `npx vitest run src/entities/__tests__/weaponDefs.test.js` passes.

## Tasks / Subtasks

- [x] Task 1: Add `weaponType` to legacy weapons in `weaponDefs.js`
  - [x] LASER_FRONT: add `weaponType: 'projectile'` after `projectileType`
  - [x] SPREAD_SHOT: add `weaponType: 'projectile'` after `projectileType`
  - [x] BEAM: add `weaponType: 'beam_continuous'` after `projectileType`
  - [x] EXPLOSIVE_ROUND: add `weaponType: 'projectile_explosion'` after `projectileType`

- [x] Task 2: Update `weaponDefs.test.js`
  - [x] Add test: `it('every weapon has a weaponType string', ...)`
  - [x] Run `npx vitest run src/entities/__tests__/weaponDefs.test.js` — all pass

- [x] Task 3: Verify no regression
  - [x] Run full weapon test suite: `npx vitest run src/stores/__tests__/useWeapons*.test.js`
  - [x] Run GameLoop-adjacent tests if applicable

## Dev Notes

### Scope Boundary

This story modifies ONLY:
- `src/entities/weaponDefs.js`
- `src/entities/__tests__/weaponDefs.test.js`

Do NOT refactor `useWeapons.tick()` to dispatch on `weaponType` — that's a future story. This story only adds the field for schema consistency.

### weaponType taxonomy

| weaponType | Weapons | Behavior |
|---|---|---|
| `projectile` | LASER_FRONT, SPREAD_SHOT, DIAGONALS | Standard projectile via cooldown → spawn → collision |
| `beam_continuous` | BEAM | Rapid-fire thin projectiles simulating continuous beam |
| `projectile_explosion` | EXPLOSIVE_ROUND | Projectile with AOE splash on impact |
| `laser_cross` | LASER_CROSS | Rotating arms, no projectiles |
| `magnetic_field` | MAGNETIC_FIELD | Passive aura, no projectiles |
| `shockwave` | SHOCKWAVE | Arc burst, managed in GameLoop |
| `mine_around` | MINE_AROUND | Orbiting mines, managed in GameLoop |
| `tactical_shot` | TACTICAL_SHOT | Instant remote strike, managed in GameLoop |

### DIAGONALS note

DIAGONALS already uses the standard projectile path (no `weaponType` skip in tick()). It should keep `weaponType: 'projectile'` even though it has a specific `projectilePattern: 'diagonals'`. The pattern field handles the spawn geometry; `weaponType` handles the dispatch category.

## Dev Agent Record

### Implementation Plan

Added `weaponType` discriminator field to 5 weapons (4 legacy + DIAGONALS) following the taxonomy in Dev Notes. DIAGONALS was included because it also lacked the field and the Dev Notes taxonomy explicitly lists it under `projectile`. The field is placed before `projectileType` for consistency with the new weapons' schema. Test added to validate all 10 weapons have a `weaponType` string.

### Completion Notes

- All 4 legacy weapons (LASER_FRONT, SPREAD_SHOT, BEAM, EXPLOSIVE_ROUND) now have `weaponType` per AC 1-4
- DIAGONALS also received `weaponType: 'projectile'` per Dev Notes taxonomy
- New test `every weapon has a weaponType string` validates schema uniformity (AC 6)
- No behavior change — field is purely additive (AC 5)
- weaponDefs.test.js: 46/46 pass (AC 7) — code-review fix: upgraded type-only test to value validation
- useWeapons*.test.js: 181/181 pass — zero regression

## File List

- `src/entities/weaponDefs.js` — modified (added weaponType to 5 weapons)
- `src/entities/__tests__/weaponDefs.test.js` — modified (added weaponType schema test)

## Change Log

- 2026-02-24: Added `weaponType` discriminator to all 10 weapons for uniform schema (Story 32.9)
- 2026-02-24: Code review — upgraded weaponType test from type-only to value validation with EXPECTED_WEAPON_TYPES map; fixed test count 47→46 in Completion Notes
