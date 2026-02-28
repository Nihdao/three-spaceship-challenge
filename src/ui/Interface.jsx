import { useCallback, useEffect, useRef, useState } from 'react'
import useGame from '../stores/useGame.jsx'
import useBoss from '../stores/useBoss.jsx'
import useAudio from '../hooks/useAudio.jsx'
import MainMenu from './MainMenu.jsx'
import LevelUpModal from './LevelUpModal.jsx'
import PlanetRewardModal from './PlanetRewardModal.jsx'
import RevivePrompt from './RevivePrompt.jsx'
import HUD from './HUD.jsx'
import BossHPBar from './BossHPBar.jsx'
import GameOverScreen from './GameOverScreen.jsx'
import VictoryScreen from './VictoryScreen.jsx'
import TunnelHub from './TunnelHub.jsx'
import ShipSelect from './ShipSelect.jsx'
import GalaxyChoice from './GalaxyChoice.jsx'
import PauseMenu from './PauseMenu.jsx'
import DebugConsole from './DebugConsole.jsx'
import WhiteFlashTransition from './WhiteFlashTransition.jsx'
import WarpTransition from './WarpTransition.jsx'
import SystemNameBanner from './SystemNameBanner.jsx'
import Crosshair from './Crosshair.jsx'
import CompanionDialogue from './CompanionDialogue.jsx'
import MapOverlay from './MapOverlay.jsx'
import useCompanion from '../stores/useCompanion.jsx'
import useLevel from '../stores/useLevel.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

export default function Interface() {
  const phase = useGame((s) => s.phase)
  const isBossActive = useBoss((s) => s.isActive)
  useAudio()

  // Story 30.3: Contextual event subscriptions
  const wormholeState = useLevel((s) => s.wormholeState)
  const bossDefeated = useBoss((s) => s.bossDefeated)
  const currentHP = usePlayer((s) => s.currentHP)
  const maxHP = usePlayer((s) => s.maxHP)

  // White flash on phase transitions (Story 17.1, 17.5, 17.6)
  const [showFlash, setShowFlash] = useState(false)
  const [flashDuration, setFlashDuration] = useState(GAME_CONFIG.SYSTEM_ENTRY.FLASH_DURATION * 1000)
  const [flashVariant, setFlashVariant] = useState('default')
  const prevPhaseRef = useRef(phase)

  // Story 30.3: Transition tracking refs
  const prevWormholeStateRef = useRef(wormholeState)
  const prevBossActiveRef = useRef(isBossActive)
  const prevBossDefeatedRef = useRef(bossDefeated)

  // Story 30.2: System arrival companion dialogue.
  // ORDERING INVARIANT: This useEffect MUST be declared BEFORE the flash useEffect.
  // Both depend on [phase], so React runs them in declaration order. The flash useEffect
  // updates prevPhaseRef.current at its end — if this effect ran after, it would read
  // the already-updated (current) phase instead of the previous phase, breaking the guard.
  useEffect(() => {
    if (phase !== 'gameplay' || prevPhaseRef.current !== 'systemEntry') return
    const currentSystem = useLevel.getState().currentSystem
    if (currentSystem < 1 || currentSystem > 3) {
      console.warn(`[Companion] No system-arrival dialogue for system ${currentSystem}`)
      return
    }
    const timer = setTimeout(() => {
      useCompanion.getState().trigger(`system-arrival-${currentSystem}`)
    }, 1500)
    return () => clearTimeout(timer)
  }, [phase])

  // Story 30.3: Wormhole spawn — high priority, immediate
  useEffect(() => {
    if (wormholeState === 'visible' && prevWormholeStateRef.current === 'hidden') {
      useCompanion.getState().trigger('wormhole-spawn', 'high')
    }
    prevWormholeStateRef.current = wormholeState
  }, [wormholeState])

  // Story 30.3: Boss spawn — high priority, immediate
  useEffect(() => {
    if (isBossActive && !prevBossActiveRef.current) {
      useCompanion.getState().trigger('boss-spawn', 'high')
    }
    prevBossActiveRef.current = isBossActive
  }, [isBossActive])

  // Story 30.3: Low HP warning — one-shot per run, guards uninitialized state
  useEffect(() => {
    if (maxHP === 0 || currentHP <= 0) return
    if (currentHP <= maxHP * 0.25) {
      if (!useCompanion.getState().hasShown('low-hp-warning')) {
        useCompanion.getState().trigger('low-hp-warning')
        useCompanion.getState().markShown('low-hp-warning')
      }
    }
  }, [currentHP, maxHP])

  // Story 30.3: Boss defeat — normal priority
  useEffect(() => {
    if (bossDefeated && !prevBossDefeatedRef.current) {
      useCompanion.getState().trigger('boss-defeat')
    }
    prevBossDefeatedRef.current = bossDefeated
  }, [bossDefeated])

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

  // Escape toggles pause during gameplay/boss
  useEffect(() => {
    if (phase !== 'gameplay' && phase !== 'boss') return
    const handler = (e) => {
      if (e.key === 'Escape') {
        const { isPaused } = useGame.getState()
        if (!isPaused) useGame.getState().setPaused(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase])

  // Stable callback ref for WarpTransition — prevents animation restart on parent re-render (H1 fix)
  const handleWarpComplete = useCallback(() => {
    setShowWarp(false)
    useGame.getState().resetTunnelEntryFlash()
  }, [])


  return (
    <>
      {phase === 'menu' && <MainMenu />}
      {phase === 'shipSelect' && <ShipSelect />}
      {phase === 'galaxyChoice' && <GalaxyChoice />}
      {(phase === 'gameplay' || phase === 'levelUp' || phase === 'planetReward' || phase === 'revive') && <HUD />}
      {phase === 'gameplay' && <MapOverlay />}
      {(phase === 'gameplay' || phase === 'boss') && <PauseMenu />}
      {phase === 'levelUp' && <LevelUpModal />}
      {phase === 'planetReward' && <PlanetRewardModal />}
      {phase === 'revive' && <RevivePrompt />}
      {/* Story 17.4: BossHPBar renders when boss is active during gameplay only */}
      {isBossActive && phase === 'gameplay' && <BossHPBar />}
      {phase === 'gameOver' && <GameOverScreen />}
      {phase === 'victory' && <VictoryScreen />}
      {phase === 'tunnel' && <TunnelHub />}
      {phase === 'systemEntry' && <SystemNameBanner />}
      {GAME_CONFIG.DEBUG_CONSOLE_ENABLED && (phase === 'gameplay' || phase === 'boss') && <DebugConsole />}
      {/* Story 21.2: Crosshair overlay during gameplay/boss */}
      <Crosshair />
      {/* Story 30.1: Companion dialogue bubble — visible during gameplay phases only */}
      {(phase === 'gameplay' || phase === 'levelUp' || phase === 'planetReward') && <CompanionDialogue />}
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
