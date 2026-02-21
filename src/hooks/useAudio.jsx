import { useEffect } from 'react'
import useGame from '../stores/useGame.jsx'
import {
  playMusic,
  crossfadeMusic,
  fadeOutMusic,
  preloadSounds,
  loadAudioSettings,
  unlockAudioContext,
  isUnlocked,
  selectRandomGameplayMusic,
} from '../audio/audioManager.js'
import { ASSET_MANIFEST } from '../config/assetManifest.js'

// SFX key → asset manifest path mapping for preloading
const SFX_MAP = {
  'laser-fire': ASSET_MANIFEST.gameplay.audio.laserFire,
  'explosion': ASSET_MANIFEST.gameplay.audio.explosion,
  'level-up': ASSET_MANIFEST.gameplay.audio.levelUp,
  'damage-taken': ASSET_MANIFEST.gameplay.audio.damageTaken,
  'button-hover': ASSET_MANIFEST.gameplay.audio.buttonHover,
  'button-click': ASSET_MANIFEST.gameplay.audio.buttonClick,
  'game-over-impact': ASSET_MANIFEST.gameplay.audio.gameOverImpact,
  'dash-whoosh': ASSET_MANIFEST.gameplay.audio.dashWhoosh,
  'dash-ready': ASSET_MANIFEST.gameplay.audio.dashReady,
  'scan-start': ASSET_MANIFEST.gameplay.audio.scanStart,
  'scan-complete': ASSET_MANIFEST.gameplay.audio.scanComplete,
  'wormhole-spawn': ASSET_MANIFEST.tier2.audio.wormholeSpawn,
  'wormhole-activate': ASSET_MANIFEST.tier2.audio.wormholeActivate,
  'boss-attack': ASSET_MANIFEST.tier2.audio.bossAttack,
  'boss-hit': ASSET_MANIFEST.tier2.audio.bossHit,
  'boss-phase': ASSET_MANIFEST.tier2.audio.bossPhase,
  'boss-defeat': ASSET_MANIFEST.tier2.audio.bossDefeat,
  'upgrade-purchase': ASSET_MANIFEST.tier2.audio.upgradePurchase,
  'dilemma-accept': ASSET_MANIFEST.tier2.audio.dilemmaAccept,
  'dilemma-refuse': ASSET_MANIFEST.tier2.audio.dilemmaRefuse,
  'tunnel-exit': ASSET_MANIFEST.tier2.audio.tunnelExit,
  'hp-recover': ASSET_MANIFEST.tier2.audio.hpRecover,
  'high-score': ASSET_MANIFEST.gameplay.audio.highScore,
  // Story 11.3: New weapon SFX
  'railgun-fire': ASSET_MANIFEST.gameplay.audio.railgunFire,
  'trishot-fire': ASSET_MANIFEST.gameplay.audio.trishotFire,
  'shotgun-fire': ASSET_MANIFEST.gameplay.audio.shotgunFire,
  'satellite-fire': ASSET_MANIFEST.gameplay.audio.satelliteFire,
  'drone-fire': ASSET_MANIFEST.gameplay.audio.droneFire,
  'beam-fire': ASSET_MANIFEST.gameplay.audio.beamFire,
  'explosive-fire': ASSET_MANIFEST.gameplay.audio.explosiveFire,
  // Story 19.1: Rare XP gem pickup SFX
  'xp_rare_pickup': ASSET_MANIFEST.gameplay.audio.xpRarePickup,
  // Story 19.3: Fragment gem pickup SFX
  'fragment_pickup': ASSET_MANIFEST.gameplay.audio.fragmentPickup,
  // Story 30.1: Companion dialogue notification
  'ui-message': ASSET_MANIFEST.gameplay.audio.uiMessage,
}

export default function useAudio() {
  useEffect(() => {
    // Apply saved volume settings before preloading
    loadAudioSettings()
    // Preload all SFX on mount
    preloadSounds(SFX_MAP)

    // Unlock AudioContext on first user interaction (browser autoplay policy)
    const handleInteraction = () => {
      // Capture lock state BEFORE unlocking — prevents race condition where the
      // first click IS the "Play" button (native DOM fires before React synthetic
      // events, so phase is still 'menu' when we check, causing menu music restart)
      const wasLocked = !isUnlocked()
      unlockAudioContext()
      if (wasLocked) {
        const currentPhase = useGame.getState().phase
        if (currentPhase === 'menu') {
          playMusic(ASSET_MANIFEST.critical.audio.menuMusic)
        }
      }
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
    document.addEventListener('click', handleInteraction)
    document.addEventListener('keydown', handleInteraction)

    // Subscribe to phase changes for music transitions
    const unsub = useGame.subscribe(
      (s) => s.phase,
      (phase, prevPhase) => {
        if (phase === 'menu') {
          if (prevPhase === 'gameOver' || prevPhase === 'victory') {
            // Coming back from end screens — crossfade to menu music
            crossfadeMusic(ASSET_MANIFEST.critical.audio.menuMusic, 500)
          } else {
            // Initial load or fresh menu — play directly
            playMusic(ASSET_MANIFEST.critical.audio.menuMusic)
          }
        } else if (phase === 'systemEntry') {
          // Story 26.1: Randomly select gameplay music when entering a new system
          const tracks = ASSET_MANIFEST.gameplay.audio.gameplayMusic

          // Defensive check: ensure gameplayMusic is an array
          if (!Array.isArray(tracks)) {
            console.warn('gameplayMusic is not an array, using fallback track')
            const fallbackTrack =
              typeof tracks === 'string' ? tracks : 'audio/music/Creo - Rock Thing.mp3'
            crossfadeMusic(fallbackTrack, 1000)
            return
          }

          const selectedTrack = selectRandomGameplayMusic(tracks)

          // Defensive check: ensure random selection succeeded
          if (!selectedTrack) {
            console.warn('Failed to select gameplay music, skipping music transition')
            return
          }

          if (prevPhase === 'menu' || prevPhase === 'shipSelect' || prevPhase === 'galaxyChoice') {
            // Menu/ShipSelect/GalaxyChoice → systemEntry: crossfade to randomly selected track
            crossfadeMusic(selectedTrack, 1000)
          } else if (prevPhase === 'tunnel') {
            // Tunnel → systemEntry: crossfade to new random track for new system
            crossfadeMusic(selectedTrack, 1000)
          }
        } else if (phase === 'gameplay') {
          // systemEntry → gameplay: music continues, no change
          // gameOver/victory → gameplay: music already handled by systemEntry transition
        } else if (phase === 'boss') {
          // Crossfade to boss music
          crossfadeMusic(ASSET_MANIFEST.tier2.audio.bossMusic, 1500)
        } else if (phase === 'tunnel') {
          // Boss → tunnel: crossfade to tunnel ambient music
          crossfadeMusic(ASSET_MANIFEST.tier2.audio.tunnelMusic, 1000)
        } else if (phase === 'gameOver' || phase === 'victory') {
          // Fade out gameplay/boss music
          fadeOutMusic(500)
        }
      }
    )

    return () => {
      unsub()
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
  }, [])
}
