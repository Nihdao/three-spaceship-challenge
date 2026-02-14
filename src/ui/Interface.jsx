import { useEffect, useRef, useState } from 'react'
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
import SystemNameBanner from './SystemNameBanner.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

export default function Interface() {
  const phase = useGame((s) => s.phase)
  const isBossActive = useBoss((s) => s.isActive)
  useAudio()

  // White flash on any→systemEntry transition (Story 17.1) and tunnel entry after boss (Story 17.4)
  const [showFlash, setShowFlash] = useState(false)
  const prevPhaseRef = useRef(phase)
  useEffect(() => {
    if (phase === 'systemEntry' && prevPhaseRef.current !== 'systemEntry') {
      setShowFlash(true)
    }
    // Story 17.4: White flash when entering tunnel after boss defeat (AC6)
    if (phase === 'tunnel' && prevPhaseRef.current === 'gameplay') {
      setShowFlash(true)
    }
    prevPhaseRef.current = phase
  }, [phase])

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
        duration={GAME_CONFIG.SYSTEM_ENTRY.FLASH_DURATION * 1000}
      />
    </>
  )
}
