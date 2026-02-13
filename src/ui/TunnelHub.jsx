import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useLevel from '../stores/useLevel.jsx'
import { playSFX } from '../audio/audioManager.js'
import { saveGameState } from '../utils/saveGame.js'
import { UPGRADES } from '../entities/upgradeDefs.js'
import { DILEMMAS } from '../entities/dilemmaDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

export default function TunnelHub() {
  const fragments = usePlayer((s) => s.fragments)
  const permanentUpgrades = usePlayer((s) => s.permanentUpgrades)
  const acceptedDilemmas = usePlayer((s) => s.acceptedDilemmas)
  const currentSystem = useLevel((s) => s.currentSystem)
  const fadingRef = useRef(false)
  const timersRef = useRef([])

  // Track purchase flash and dilemma resolution animations
  const [purchasedId, setPurchasedId] = useState(null)
  const [dilemmaResolved, setDilemmaResolved] = useState(false)

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  // Select a stable random dilemma for this tunnel visit
  const currentDilemma = useMemo(() => {
    const available = Object.values(DILEMMAS).filter(
      (d) => !acceptedDilemmas.includes(d.id)
    )
    if (available.length === 0) return null
    return available[Math.floor(Math.random() * available.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentionally stable per mount — new dilemma each tunnel visit

  // Auto-save on tunnel entry
  useEffect(() => {
    saveGameState()
  }, [])

  // Available upgrades: not purchased, prerequisite met
  const availableUpgrades = useMemo(() => {
    return Object.values(UPGRADES).filter((upgrade) => {
      if (permanentUpgrades[upgrade.id]) return false
      if (upgrade.prerequisite && !permanentUpgrades[upgrade.prerequisite]) return false
      return true
    })
  }, [permanentUpgrades])

  const safeTimeout = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter(t => t !== id)
      fn()
    }, ms)
    timersRef.current.push(id)
    return id
  }, [])

  const handlePurchaseUpgrade = useCallback((upgradeId) => {
    const upgrade = UPGRADES[upgradeId]
    if (!upgrade) return
    if (usePlayer.getState().fragments < upgrade.fragmentCost) return

    const success = usePlayer.getState().applyPermanentUpgrade(upgradeId)
    if (success) {
      playSFX('upgrade-purchase')
      setPurchasedId(upgradeId)
      safeTimeout(() => setPurchasedId(null), 400)
    }
  }, [safeTimeout])

  const handleAcceptDilemma = useCallback((dilemmaId) => {
    const success = usePlayer.getState().acceptDilemma(dilemmaId)
    if (success) {
      playSFX('dilemma-accept')
      setDilemmaResolved(true)
    }
  }, [])

  const handleRefuseDilemma = useCallback(() => {
    playSFX('dilemma-refuse')
    setDilemmaResolved(true)
  }, [])


  const [exitAnimationActive, setExitAnimationActive] = useState(false)

  const executeSystemTransition = useCallback(() => {
    if (!fadingRef.current) return // Guard against double call
    fadingRef.current = false
    try {
      useLevel.getState().advanceSystem()
      usePlayer.getState().resetForNewSystem()
      setExitAnimationActive(false)
      useGame.getState().setPhase('gameplay')
    } catch (err) {
      console.error('Tunnel exit transition failed:', err)
      setExitAnimationActive(false)
      try {
        useGame.getState().setPhase('gameplay')
      } catch (fallbackErr) {
        console.error('Tunnel exit fallback also failed:', fallbackErr)
      }
    }
  }, [])

  const handleEnterSystem = useCallback(() => {
    if (fadingRef.current) return
    fadingRef.current = true
    playSFX('button-click')
    playSFX('tunnel-exit')
    setExitAnimationActive(true)
    // Fallback timeout in case CSS animationend doesn't fire
    safeTimeout(() => {
      if (fadingRef.current) {
        executeSystemTransition()
      }
    }, GAME_CONFIG.TUNNEL_EXIT_ANIMATION_DURATION * 1000 + 200)
  }, [safeTimeout, executeSystemTransition])

  const handleExitAnimationEnd = useCallback(() => {
    if (!exitAnimationActive) return
    executeSystemTransition()
  }, [exitAnimationActive, executeSystemTransition])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (fadingRef.current) return
      // Number keys 1-5 for upgrades
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 5 && num <= availableUpgrades.length) {
        handlePurchaseUpgrade(availableUpgrades[num - 1].id)
        return
      }
      // Y/A for accept dilemma
      if ((e.key === 'y' || e.key === 'Y' || e.key === 'a' || e.key === 'A') && currentDilemma && !dilemmaResolved) {
        handleAcceptDilemma(currentDilemma.id)
        return
      }
      // N/R for refuse dilemma
      if ((e.key === 'n' || e.key === 'N' || e.key === 'r' || e.key === 'R') && currentDilemma && !dilemmaResolved) {
        handleRefuseDilemma()
        return
      }
      // Enter for enter system
      if (e.key === 'Enter') {
        handleEnterSystem()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [availableUpgrades, currentDilemma, dilemmaResolved, handlePurchaseUpgrade, handleAcceptDilemma, handleRefuseDilemma, handleEnterSystem])

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex font-game animate-fade-in${exitAnimationActive ? ' tunnel-exit-fade' : ''}`}
        onAnimationEnd={exitAnimationActive ? handleExitAnimationEnd : undefined}
      >
        {/* Left — transparent for 3D */}
        <div className="w-2/3" />

        {/* Right — dark panel */}
        <div className="w-1/3 bg-[#0a0a0f]/90 border-l border-game-border flex flex-col p-5 overflow-y-auto">
          {/* Header */}
          <h1
            className="text-game-text font-bold tracking-[0.2em] select-none text-center mb-2"
            style={{ fontSize: 'clamp(18px, 2vw, 28px)' }}
          >
            WORMHOLE TUNNEL
          </h1>

          {/* System info */}
          <div className="text-game-text-muted text-xs tracking-widest text-center mb-2 select-none">
            ENTERING SYSTEM {currentSystem + 1}
          </div>

          {/* Fragment display */}
          <div
            className="flex items-center justify-center gap-2 mb-4 select-none"
            style={{ fontSize: 'clamp(16px, 1.8vw, 24px)' }}
          >
            <span className="text-[#cc66ff]">&#9670;</span>
            <span className="text-game-text font-semibold tabular-nums">{fragments}</span>
            <span className="text-game-text-muted text-xs tracking-widest">FRAGMENTS</span>
          </div>

          {/* Dilemma section — prominent */}
          <div className="mb-4" role="region" aria-label="Dilemma">
            <h2 className="text-[#ff9944] text-sm font-bold tracking-[0.3em] mb-2 select-none text-center">&#9888; DILEMMA</h2>
            {!currentDilemma || dilemmaResolved ? (
              <div className="border border-game-border rounded p-3 text-game-text-muted text-xs text-center select-none">
                {dilemmaResolved ? 'Dilemma resolved' : 'No dilemma available'}
              </div>
            ) : (
              <div className="border-2 border-[#ff9944]/60 rounded-lg p-3 bg-[#ff9944]/5 transition-all duration-300">
                <div className="text-game-text text-sm font-bold mb-1.5 select-none text-center">{currentDilemma.name}</div>
                <div className="text-game-text text-xs text-center mb-2.5 select-none leading-relaxed">
                  {currentDilemma.description}
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-1.5 text-xs font-semibold tracking-wider border-2 border-game-success/50 rounded
                      text-game-success hover:bg-game-success/10 hover:border-game-success transition-all duration-150
                      cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-game-success"
                    onClick={() => handleAcceptDilemma(currentDilemma.id)}
                    onMouseEnter={() => playSFX('button-hover')}
                  >
                    [Y] Accept
                  </button>
                  <button
                    className="flex-1 py-1.5 text-xs font-semibold tracking-wider border-2 border-game-danger/50 rounded
                      text-game-danger hover:bg-game-danger/10 hover:border-game-danger transition-all duration-150
                      cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-game-danger"
                    onClick={handleRefuseDilemma}
                    onMouseEnter={() => playSFX('button-hover')}
                  >
                    [N] Refuse
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upgrades section */}
          <div className="mb-3" role="region" aria-label="Upgrades">
            <h2 className="text-game-text-muted text-xs tracking-[0.3em] mb-1.5 select-none">UPGRADES</h2>
            {availableUpgrades.length === 0 ? (
              <div className="border border-game-border rounded p-2 text-game-text-muted text-xs text-center select-none">
                All upgrades purchased
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {availableUpgrades.slice(0, 5).map((upgrade, index) => {
                  const canAfford = fragments >= upgrade.fragmentCost
                  const justPurchased = purchasedId === upgrade.id
                  return (
                    <button
                      key={upgrade.id}
                      className={`text-left border rounded p-2 transition-all duration-150 select-none outline-none
                        ${justPurchased
                          ? 'border-game-success bg-game-success/20 scale-[1.02]'
                          : canAfford
                            ? 'border-game-border hover:border-game-accent hover:bg-game-accent/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-game-accent'
                            : 'border-game-border/50 opacity-50 cursor-not-allowed'
                        }`}
                      onClick={() => canAfford && handlePurchaseUpgrade(upgrade.id)}
                      onMouseEnter={() => canAfford && playSFX('button-hover')}
                      disabled={!canAfford}
                      tabIndex={canAfford ? 0 : -1}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-game-text text-xs font-semibold truncate">{upgrade.name}</span>
                        <span className={`text-xs tabular-nums ml-1 shrink-0 ${canAfford ? 'text-[#cc66ff]' : 'text-game-text-muted'}`}>
                          {upgrade.fragmentCost}&#9670;
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-game-text-muted text-xs truncate">{upgrade.description}</span>
                        <span className="text-game-text-muted text-xs ml-1 shrink-0">[{index + 1}]</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Enter System button */}
          <button
            className="w-full py-3 font-semibold tracking-[0.2em] border border-game-border rounded
              transition-all duration-150 select-none cursor-pointer outline-none
              text-game-text hover:border-game-accent hover:scale-[1.02] hover:bg-game-accent/10
              focus-visible:ring-2 focus-visible:ring-game-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
            style={{ fontSize: 'clamp(14px, 1.5vw, 20px)' }}
            onClick={handleEnterSystem}
            onMouseEnter={() => playSFX('button-hover')}
          >
            ENTER SYSTEM &rarr;
          </button>
        </div>
      </div>
    </>
  )
}
