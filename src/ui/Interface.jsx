import { useCallback, useEffect, useRef, useState } from 'react'
import useGame from '../stores/useGame.jsx'
import useBoss from '../stores/useBoss.jsx'
import useAudio from '../hooks/useAudio.jsx'
import MainMenu from './MainMenu.jsx'
import LevelUpModal from './LevelUpModal.jsx'
import PlanetRewardModal from './PlanetRewardModal.jsx'
import HUD from './HUD.jsx'
import BossHPBar from './BossHPBar.jsx'
import GameOverScreen from './GameOverScreen.jsx'
import VictoryScreen from './VictoryScreen.jsx'
import TunnelHub from './TunnelHub.jsx'
import ShipSelect from './ShipSelect.jsx'
import PauseMenu from './PauseMenu.jsx'
import DebugConsole from './DebugConsole.jsx'
import WhiteFlashTransition from './WhiteFlashTransition.jsx'
import WarpTransition from './WarpTransition.jsx'
import SystemNameBanner from './SystemNameBanner.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

export default function Interface() {
  const phase = useGame((s) => s.phase)
  const isBossActive = useBoss((s) => s.isActive)
  useAudio()

  // White flash on phase transitions (Story 17.1, 17.5, 17.6)
  const [showFlash, setShowFlash] = useState(false)
  const [flashDuration, setFlashDuration] = useState(GAME_CONFIG.SYSTEM_ENTRY.FLASH_DURATION * 1000)
  const [flashVariant, setFlashVariant] = useState('default')
  const prevPhaseRef = useRef(phase)

  useEffect(() => {
    if (phase === 'systemEntry' && prevPhaseRef.current !== 'systemEntry') {
      setFlashDuration(GAME_CONFIG.SYSTEM_ENTRY.FLASH_DURATION * 1000)
      setFlashVariant('default')
      setShowFlash(true)
    }
    prevPhaseRef.current = phase
  }, [phase])

  // Story 17.6: Warp vortex transition for boss→tunnel (triggered independently of phase change)
  const [showWarp, setShowWarp] = useState(false)
  const tunnelEntryFlashTriggered = useGame((s) => s.tunnelEntryFlashTriggered)
  const prevTunnelEntryFlashRef = useRef(tunnelEntryFlashTriggered)
  useEffect(() => {
    if (tunnelEntryFlashTriggered && !prevTunnelEntryFlashRef.current) {
      setShowWarp(true)
    }
    prevTunnelEntryFlashRef.current = tunnelEntryFlashTriggered
  }, [tunnelEntryFlashTriggered])

  // Story 17.6: Wormhole clear flash (first touch only)
  const wormholeFirstTouch = useGame((s) => s.wormholeFirstTouch)
  const prevWormholeFirstTouchRef = useRef(wormholeFirstTouch)
  useEffect(() => {
    if (wormholeFirstTouch && !prevWormholeFirstTouchRef.current) {
      setFlashDuration(GAME_CONFIG.TUNNEL_ENTRY.WORMHOLE_CLEAR_FLASH_DURATION * 1000)
      setFlashVariant('default') // Regular fade in + out
      setShowFlash(true)
    }
    prevWormholeFirstTouchRef.current = wormholeFirstTouch
  }, [wormholeFirstTouch])

  // Debug-only: press V during gameplay to trigger victory screen (temporary — replaced by real victory condition in Epic 6)
  useEffect(() => {
    if (!window.location.hash.includes('#debug')) return
    if (phase !== 'gameplay') return
    const handler = (e) => {
      if (e.code === 'KeyV') useGame.getState().triggerVictory()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase])

  // Stable callback ref for WarpTransition — prevents animation restart on parent re-render (H1 fix)
  const handleWarpComplete = useCallback(() => {
    setShowWarp(false)
    useGame.getState().resetTunnelEntryFlash()
  }, [])

  // ESC / P key toggles pause during gameplay (Story 10.6)
  useEffect(() => {
    if (phase !== 'gameplay') return
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        const { isPaused } = useGame.getState()
        // Only toggle pause ON here; toggling OFF is handled by PauseMenu's own key listeners
        if (!isPaused) {
          useGame.getState().setPaused(true)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase])

  return (
    <>
      {phase === 'menu' && <MainMenu />}
      {phase === 'shipSelect' && <ShipSelect />}
      {(phase === 'gameplay' || phase === 'levelUp' || phase === 'planetReward') && <HUD />}
      {phase === 'gameplay' && <PauseMenu />}
      {phase === 'levelUp' && <LevelUpModal />}
      {phase === 'planetReward' && <PlanetRewardModal />}
      {/* Story 17.4: BossHPBar renders when boss is active, regardless of phase */}
      {isBossActive && <BossHPBar />}
      {phase === 'gameOver' && <GameOverScreen />}
      {phase === 'victory' && <VictoryScreen />}
      {phase === 'tunnel' && <TunnelHub />}
      {phase === 'systemEntry' && <SystemNameBanner />}
      {GAME_CONFIG.DEBUG_CONSOLE_ENABLED && (phase === 'gameplay' || phase === 'boss') && <DebugConsole />}
      <WhiteFlashTransition
        active={showFlash}
        onComplete={() => setShowFlash(false)}
        duration={flashDuration}
        variant={flashVariant}
      />
      <WarpTransition
        active={showWarp}
        onComplete={handleWarpComplete}
        duration={GAME_CONFIG.TUNNEL_ENTRY.FLASH_DURATION * 1000}
      />
    </>
  )
}
