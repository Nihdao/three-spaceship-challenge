// Wave profile definitions for the dynamic wave system (Story 23.1)
// Each profile defines alternating pressure/relief phases across a system's duration.
// Profiles are keyed by system number (system1, system2, system3).

// Enemy tier constants matching tier fields in enemyDefs.js
export const TIERS = {
  FODDER: 'FODDER',
  SKIRMISHER: 'SKIRMISHER',
  ASSAULT: 'ASSAULT',
  ELITE: 'ELITE',
}

// Wave profiles per system.
// Each phase: { startPercent, endPercent, name, spawnRateMultiplier, enemyTierWeights }
//   - startPercent / endPercent: fraction of system timer (0.0–1.0)
//   - spawnRateMultiplier: applied to base spawn interval (higher = more frequent spawns)
//   - enemyTierWeights: proportion of each tier in spawn pool (0.0 = excluded)
export const WAVE_PROFILES = {
  system1: [
    {
      startPercent: 0.0,
      endPercent: 0.2,
      name: 'Easy Start',
      spawnRateMultiplier: 1.0,
      enemyTierWeights: { FODDER: 1.0, SKIRMISHER: 0.0, ASSAULT: 0.0, ELITE: 0.0 },
    },
    {
      startPercent: 0.2,
      endPercent: 0.35,
      name: 'Hard Spike 1',
      spawnRateMultiplier: 2.5,
      enemyTierWeights: { FODDER: 0.7, SKIRMISHER: 0.3, ASSAULT: 0.0, ELITE: 0.0 },
    },
    {
      startPercent: 0.35,
      endPercent: 0.5,
      name: 'Medium Phase 1',
      spawnRateMultiplier: 1.5,
      enemyTierWeights: { FODDER: 0.4, SKIRMISHER: 0.6, ASSAULT: 0.0, ELITE: 0.0 },
    },
    {
      startPercent: 0.5,
      endPercent: 0.65,
      name: 'Hard Spike 2',
      spawnRateMultiplier: 3.5,
      enemyTierWeights: { FODDER: 0.3, SKIRMISHER: 0.5, ASSAULT: 0.2, ELITE: 0.0 },
    },
    {
      startPercent: 0.65,
      endPercent: 0.8,
      name: 'Medium Phase 2',
      spawnRateMultiplier: 1.2,
      enemyTierWeights: { FODDER: 0.2, SKIRMISHER: 0.4, ASSAULT: 0.4, ELITE: 0.0 },
    },
    {
      startPercent: 0.8,
      endPercent: 0.95,
      name: 'Crescendo',
      spawnRateMultiplier: 4.0,
      enemyTierWeights: { FODDER: 0.2, SKIRMISHER: 0.3, ASSAULT: 0.4, ELITE: 0.1 },
    },
    {
      startPercent: 0.95,
      endPercent: 1.0,
      name: 'Pre-Boss Calm',
      spawnRateMultiplier: 0.8,
      enemyTierWeights: { FODDER: 0.3, SKIRMISHER: 0.4, ASSAULT: 0.2, ELITE: 0.1 },
    },
  ],

  // System 2: starts harder, escalates faster, higher tier weights from the start
  system2: [
    {
      startPercent: 0.0,
      endPercent: 0.2,
      name: 'Easy Start',
      spawnRateMultiplier: 1.5,
      enemyTierWeights: { FODDER: 0.8, SKIRMISHER: 0.2, ASSAULT: 0.0, ELITE: 0.0 },
    },
    {
      startPercent: 0.2,
      endPercent: 0.35,
      name: 'Hard Spike 1',
      spawnRateMultiplier: 4.0,
      enemyTierWeights: { FODDER: 0.5, SKIRMISHER: 0.5, ASSAULT: 0.0, ELITE: 0.0 },
    },
    {
      startPercent: 0.35,
      endPercent: 0.5,
      name: 'Medium Phase 1',
      spawnRateMultiplier: 2.5,
      enemyTierWeights: { FODDER: 0.3, SKIRMISHER: 0.6, ASSAULT: 0.1, ELITE: 0.0 },
    },
    {
      startPercent: 0.5,
      endPercent: 0.65,
      name: 'Hard Spike 2',
      spawnRateMultiplier: 5.5,
      enemyTierWeights: { FODDER: 0.2, SKIRMISHER: 0.4, ASSAULT: 0.4, ELITE: 0.0 },
    },
    {
      startPercent: 0.65,
      endPercent: 0.8,
      name: 'Medium Phase 2',
      spawnRateMultiplier: 2.0,
      enemyTierWeights: { FODDER: 0.1, SKIRMISHER: 0.3, ASSAULT: 0.6, ELITE: 0.0 },
    },
    {
      startPercent: 0.8,
      endPercent: 0.95,
      name: 'Crescendo',
      spawnRateMultiplier: 6.0,
      enemyTierWeights: { FODDER: 0.1, SKIRMISHER: 0.2, ASSAULT: 0.5, ELITE: 0.2 },
    },
    {
      startPercent: 0.95,
      endPercent: 1.0,
      name: 'Pre-Boss Calm',
      spawnRateMultiplier: 1.2,
      enemyTierWeights: { FODDER: 0.2, SKIRMISHER: 0.3, ASSAULT: 0.3, ELITE: 0.2 },
    },
  ],

  // System 3: hardest, highest tier weights, maximum density crescendo
  system3: [
    {
      startPercent: 0.0,
      endPercent: 0.2,
      name: 'Easy Start',
      spawnRateMultiplier: 2.5,
      enemyTierWeights: { FODDER: 0.5, SKIRMISHER: 0.4, ASSAULT: 0.1, ELITE: 0.0 },
    },
    {
      startPercent: 0.2,
      endPercent: 0.35,
      name: 'Hard Spike 1',
      spawnRateMultiplier: 6.5,
      enemyTierWeights: { FODDER: 0.3, SKIRMISHER: 0.5, ASSAULT: 0.2, ELITE: 0.0 },
    },
    {
      startPercent: 0.35,
      endPercent: 0.5,
      name: 'Medium Phase 1',
      spawnRateMultiplier: 4.0,
      enemyTierWeights: { FODDER: 0.2, SKIRMISHER: 0.5, ASSAULT: 0.3, ELITE: 0.0 },
    },
    {
      startPercent: 0.5,
      endPercent: 0.65,
      name: 'Hard Spike 2',
      spawnRateMultiplier: 9.0,
      enemyTierWeights: { FODDER: 0.1, SKIRMISHER: 0.3, ASSAULT: 0.5, ELITE: 0.1 },
    },
    {
      startPercent: 0.65,
      endPercent: 0.8,
      name: 'Medium Phase 2',
      spawnRateMultiplier: 3.5,
      enemyTierWeights: { FODDER: 0.1, SKIRMISHER: 0.3, ASSAULT: 0.5, ELITE: 0.1 },
    },
    {
      startPercent: 0.8,
      endPercent: 0.95,
      name: 'Crescendo',
      spawnRateMultiplier: 10.0,
      enemyTierWeights: { FODDER: 0.1, SKIRMISHER: 0.2, ASSAULT: 0.4, ELITE: 0.3 },
    },
    {
      startPercent: 0.95,
      endPercent: 1.0,
      name: 'Pre-Boss Calm',
      spawnRateMultiplier: 2.0,
      enemyTierWeights: { FODDER: 0.1, SKIRMISHER: 0.2, ASSAULT: 0.4, ELITE: 0.3 },
    },
  ],
}

// Returns the active wave phase for the given system and time progress.
// systemNum: 1, 2, or 3
// timeProgress: 0.0–1.0 (elapsedTime / systemTimer)
export function getPhaseForProgress(systemNum, timeProgress) {
  const profileKey = `system${systemNum}`
  const profile = WAVE_PROFILES[profileKey] || WAVE_PROFILES.system1

  for (const phase of profile) {
    if (timeProgress >= phase.startPercent && timeProgress < phase.endPercent) {
      return phase
    }
  }

  // Fallback to last phase when timeProgress >= 1.0 (edge case: timer overrun)
  return profile[profile.length - 1]
}
