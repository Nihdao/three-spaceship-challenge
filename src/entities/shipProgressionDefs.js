// Ship level progression definitions — escalating Fragment costs and per-level stat scaling.
// Ships level from 1 to MAX_SHIP_LEVEL. Leveling is permanent and cannot be refunded.
//
// SHIP_LEVEL_COSTS: 8 entries (one per transition: 1→2 through 8→9).
//   Index = currentLevel - 1 (e.g. level 1 → 2 uses index 0).
//   Total cost to max a ship from level 1: 9,900 Fragments.
// SHIP_LEVEL_SCALING: default fraction added per level above 1 (0.08 = +8% per level)
//   Per-ship override available via shipDefs.levelScaling.
//   Level 1: 1.00x | Level 5: 1.32x | Level 9: 1.64x

export const MAX_SHIP_LEVEL = 9

export const SHIP_LEVEL_COSTS = [
  100,  // Level 1 → 2
  200,  // Level 2 → 3
  400,  // Level 3 → 4
  700,  // Level 4 → 5
  1000, // Level 5 → 6
  1500, // Level 6 → 7
  2000, // Level 7 → 8
  3000, // Level 8 → 9
]

export const SHIP_LEVEL_SCALING = 0.08
