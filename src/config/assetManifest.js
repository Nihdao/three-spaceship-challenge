// Note: Uses object-keyed structure (vs array-based in Architecture doc) for
// direct access by asset key. Paths are relative to the public/ directory.
export const ASSET_MANIFEST = {
  // Critical — loaded before gameplay starts
  critical: {
    models: {
      playerShip: 'models/ships/player-ship.glb',
    },
    audio: {
      menuMusic: 'audio/music/Michett - Snackmix.mp3',
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
      // Story 26.1: Array of 3 gameplay tracks for random selection
      gameplayMusic: [
        'audio/music/Creo - Rock Thing.mp3',
        'audio/music/Guifrog - Frog Punch.mp3',
        'audio/music/Michett - Snackmix.mp3',
      ],
      laserFire: 'audio/sfx/laser-fire.wav',
      explosion: 'audio/sfx/explosion.wav',
      levelUp: 'audio/sfx/level-up.wav', // Missing file - will fail gracefully
      damageTaken: 'audio/sfx/damage-taken.wav',
      buttonHover: 'audio/sfx/button-hover.wav',
      buttonClick: 'audio/sfx/button-click.wav',
      gameOverImpact: 'audio/sfx/game-over-impact.wav',
      highScore: 'audio/sfx/high-score.wav', // Missing file - will fail gracefully
      dashWhoosh: 'audio/sfx/dash-whoosh.wav',
      dashReady: 'audio/sfx/dash-ready.wav',
      scanStart: 'audio/sfx/scan-start.wav',
      scanComplete: 'audio/sfx/scan-complete.wav',
      // Story 19.1: Rare XP gem pickup SFX
      xpRarePickup: 'audio/sfx/xp-rare-pickup.wav',
      // Story 19.3: Fragment gem pickup SFX
      fragmentPickup: 'audio/sfx/fragment-pickup.wav',
      // Story 11.3: New weapon SFX
      railgunFire: 'audio/sfx/railgun-fire.wav',
      trishotFire: 'audio/sfx/trishot-fire.wav',
      shotgunFire: 'audio/sfx/shotgun-fire.wav',
      satelliteFire: 'audio/sfx/satellite-fire.wav',
      droneFire: 'audio/sfx/drone-fire.wav',
      beamFire: 'audio/sfx/beam-fire.wav',
      explosiveFire: 'audio/sfx/explosive-fire.wav',
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
      bossMusic: 'audio/music/boss-theme.mp3', // Missing file - will fail gracefully
      tunnelMusic: 'audio/music/tunnel-theme.mp3', // Missing file - will fail gracefully
      wormholeSpawn: 'audio/sfx/wormhole-spawn.wav',
      wormholeActivate: 'audio/sfx/wormhole-activate.wav',
      bossAttack: 'audio/sfx/boss-attack.wav', // Missing file - will fail gracefully
      bossHit: 'audio/sfx/boss-hit.wav', // Missing file - will fail gracefully
      bossPhase: 'audio/sfx/boss_phase.wav', // Note: underscore in actual filename
      bossDefeat: 'audio/sfx/boss-defeat.wav',
      upgradePurchase: 'audio/sfx/upgrade-purchase.wav',
      dilemmaAccept: 'audio/sfx/dilemma-accept.wav',
      dilemmaRefuse: 'audio/sfx/dilemma-refuse.wav',
      tunnelExit: 'audio/sfx/tunnel_exit.wav', // Note: underscore in actual filename
      hpRecover: 'audio/sfx/hp-recover.wav', // Missing file - will fail gracefully
    },
  },
}
