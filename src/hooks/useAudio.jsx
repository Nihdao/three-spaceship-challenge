import { useEffect } from 'react'
import useGame from '../stores/useGame.jsx'
import { playMusic, crossfadeMusic, fadeOutMusic, preloadSounds } from '../audio/audioManager.js'
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
}

export default function useAudio() {
  useEffect(() => {
    // Preload all SFX on mount
    preloadSounds(SFX_MAP)

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
        } else if (phase === 'gameplay') {
          if (prevPhase === 'menu') {
            // Menu → gameplay: crossfade
            crossfadeMusic(ASSET_MANIFEST.gameplay.audio.gameplayMusic, 1000)
          } else if (prevPhase === 'gameOver' || prevPhase === 'victory') {
            // Retry from end screen — play gameplay music fresh
            playMusic(ASSET_MANIFEST.gameplay.audio.gameplayMusic)
          }
          // levelUp → gameplay: music continues, no change
        } else if (phase === 'gameOver' || phase === 'victory') {
          // Fade out gameplay music
          fadeOutMusic(500)
        }
      }
    )

    return unsub
  }, [])
}
