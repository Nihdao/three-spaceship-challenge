// Note: Uses object-keyed structure (vs array-based in Architecture doc) for
// direct access by asset key. Paths are relative to the public/ directory.
export const ASSET_MANIFEST = {
  // Critical — loaded before gameplay starts
  critical: {
    models: {
      playerShip: 'models/ships/player-ship.glb',
    },
    audio: {
      // Background music loaded at startup
    },
  },

  // Gameplay — loaded during menu or first seconds
  gameplay: {
    models: {
      // Note: paths must match modelPath in enemyDefs.js
      drone: 'models/enemies/robot-enemy-flying.glb',
      scout: 'models/enemies/robot-enemy-flying-gun.glb',
    },
    audio: {
      laserFire: 'audio/sfx/laser-fire.mp3',
      explosion: 'audio/sfx/explosion.mp3',
    },
  },

  // Tier 2 — loaded on demand when needed
  tier2: {
    models: {
      boss: 'models/enemies/boss.glb',
      planetA: 'models/environment/PlanetA.glb',
      planetB: 'models/environment/PlanetB.glb',
      planetC: 'models/environment/PlanetC.glb',
      wormhole: 'models/environment/wormhole.glb',
    },
    audio: {
      bossMusic: 'audio/music/boss-theme.mp3',
      tunnelMusic: 'audio/music/tunnel-theme.mp3',
    },
  },
}
