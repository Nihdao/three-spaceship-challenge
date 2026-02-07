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
      drone: 'models/enemies/drone.glb',
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
      planet: 'models/environment/planet.glb',
      wormhole: 'models/environment/wormhole.glb',
    },
    audio: {
      bossMusic: 'audio/music/boss-theme.mp3',
      tunnelMusic: 'audio/music/tunnel-theme.mp3',
    },
  },
}
