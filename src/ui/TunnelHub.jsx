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
  const currentHP = usePlayer((s) => s.currentHP)
  const maxHP = usePlayer((s) => s.maxHP)
  const currentSystem = useLevel((s) => s.currentSystem)
  const fadingRef = useRef(false)

  // Track purchase flash and dilemma resolution animations
  const [purchasedId, setPurchasedId] = useState(null)
  const [dilemmaResolved, setDilemmaResolved] = useState(false)
  const [hpFlash, setHpFlash] = useState(null) // 'success' | 'error' | null
  const [hpFloatText, setHpFloatText] = useState(null) // e.g. '+25 HP' | null

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

  const handlePurchaseUpgrade = useCallback((upgradeId) => {
    const upgrade = UPGRADES[upgradeId]
    if (!upgrade) return
    if (usePlayer.getState().fragments < upgrade.fragmentCost) return

    const success = usePlayer.getState().applyPermanentUpgrade(upgradeId)
    if (success) {
      playSFX('upgrade-purchase')
      setPurchasedId(upgradeId)
      setTimeout(() => setPurchasedId(null), 400)
    }
  }, [])

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

  const canSacrifice = fragments >= GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST && currentHP < maxHP

  const handleHPSacrifice = useCallback(() => {
    const success = usePlayer.getState().sacrificeFragmentsForHP()
    if (success) {
      playSFX('hp-recover')
      setHpFlash('success')
      setHpFloatText(`+${GAME_CONFIG.HP_SACRIFICE_HP_RECOVERY} HP`)
      setTimeout(() => setHpFlash(null), 400)
      setTimeout(() => setHpFloatText(null), 800)
    } else {
      setHpFlash('error')
      setTimeout(() => setHpFlash(null), 400)
    }
  }, [])

  const [exitAnimationActive, setExitAnimationActive] = useState(false)

  const handleEnterSystem = useCallback(() => {
    if (fadingRef.current) return
    fadingRef.current = true
    playSFX('button-click')
    playSFX('tunnel-exit')
    setExitAnimationActive(true)
  }, [])

  const handleExitAnimationEnd = useCallback(() => {
    if (!exitAnimationActive) return
    useLevel.getState().advanceSystem()
    usePlayer.getState().resetForNewSystem()
    useGame.getState().setPhase('gameplay')
    setExitAnimationActive(false)
  }, [exitAnimationActive])

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
      // H for HP sacrifice
      if ((e.key === 'h' || e.key === 'H') && canSacrifice) {
        handleHPSacrifice()
        return
      }
      // Enter for enter system
      if (e.key === 'Enter') {
        handleEnterSystem()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [availableUpgrades, currentDilemma, dilemmaResolved, canSacrifice, handlePurchaseUpgrade, handleAcceptDilemma, handleRefuseDilemma, handleHPSacrifice, handleEnterSystem])

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex font-game animate-fade-in${exitAnimationActive ? ' tunnel-exit-fade' : ''}`}
        onAnimationEnd={exitAnimationActive ? handleExitAnimationEnd : undefined}
      >
        {/* Left half — transparent for 3D */}
        <div className="w-1/2" />

        {/* Right half — dark panel */}
        <div className="w-1/2 bg-[#0a0a0f]/90 border-l border-game-border flex flex-col p-8 overflow-y-auto">
          {/* Header */}
          <h1
            className="text-game-text font-bold tracking-[0.2em] select-none text-center mb-8"
            style={{ fontSize: 'clamp(20px, 2.5vw, 36px)' }}
          >
            WORMHOLE TUNNEL
          </h1>

          {/* System info */}
          <div className="text-game-text-muted text-sm tracking-widest text-center mb-6 select-none">
            ENTERING SYSTEM {currentSystem + 1}
          </div>

          {/* Fragment display */}
          <div
            className="flex items-center justify-center gap-3 mb-10 select-none"
            style={{ fontSize: 'clamp(18px, 2vw, 28px)' }}
          >
            <span className="text-[#cc66ff]">&#9670;</span>
            <span className="text-game-text font-semibold tabular-nums">{fragments}</span>
            <span className="text-game-text-muted text-sm tracking-widest">FRAGMENTS</span>
          </div>

          {/* Upgrades section */}
          <div className="mb-8" role="region" aria-label="Upgrades">
            <h2 className="text-game-text-muted text-xs tracking-[0.3em] mb-3 select-none">UPGRADES</h2>
            {availableUpgrades.length === 0 ? (
              <div className="border border-game-border rounded p-4 text-game-text-muted text-sm text-center select-none">
                All upgrades purchased
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {availableUpgrades.slice(0, 5).map((upgrade, index) => {
                  const canAfford = fragments >= upgrade.fragmentCost
                  const justPurchased = purchasedId === upgrade.id
                  return (
                    <button
                      key={upgrade.id}
                      className={`w-full text-left border rounded p-3 transition-all duration-150 select-none outline-none
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
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-game-text text-sm font-semibold">{upgrade.name}</span>
                        <span className={`text-sm tabular-nums ${canAfford ? 'text-[#cc66ff]' : 'text-game-text-muted'}`}>
                          {upgrade.fragmentCost}&#9670;
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-game-text-muted text-xs">{upgrade.description}</span>
                        <span className="text-game-text-muted text-xs">[{index + 1}]</span>
                      </div>
                      {!canAfford && (
                        <div className="text-game-danger text-xs mt-1">Not enough Fragments</div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Dilemma section */}
          <div className="mb-8" role="region" aria-label="Dilemma">
            <h2 className="text-game-text-muted text-xs tracking-[0.3em] mb-3 select-none">DILEMMA</h2>
            {!currentDilemma || dilemmaResolved ? (
              <div className="border border-game-border rounded p-4 text-game-text-muted text-sm text-center select-none">
                {dilemmaResolved ? 'Dilemma resolved' : 'No dilemma available'}
              </div>
            ) : (
              <div className="border border-game-border rounded p-4 transition-all duration-300">
                <div className="text-game-text text-sm font-semibold mb-1 select-none">{currentDilemma.name}</div>
                <div className="text-game-text text-center mb-4 select-none" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>
                  {currentDilemma.description}
                </div>
                <div className="flex gap-3">
                  <button
                    className="flex-1 py-2 text-sm font-semibold tracking-wider border border-game-success/50 rounded
                      text-game-success hover:bg-game-success/10 hover:border-game-success transition-all duration-150
                      cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-game-success"
                    onClick={() => handleAcceptDilemma(currentDilemma.id)}
                    onMouseEnter={() => playSFX('button-hover')}
                  >
                    [Y] Accept
                  </button>
                  <button
                    className="flex-1 py-2 text-sm font-semibold tracking-wider border border-game-danger/50 rounded
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

          {/* HP Sacrifice section */}
          <div className="mb-8" role="region" aria-label="HP Recovery">
            <h2 className="text-game-text-muted text-xs tracking-[0.3em] mb-3 select-none">HP RECOVERY</h2>
            <div className={`border rounded p-4 transition-all duration-300 relative ${
              hpFlash === 'success' ? 'border-game-success bg-game-success/20'
                : hpFlash === 'error' ? 'border-game-danger bg-game-danger/20'
                : 'border-game-border'
            }`}>
              {hpFloatText && (
                <div className="hp-float-text absolute -top-2 left-1/2 -translate-x-1/2 text-game-success font-semibold text-sm select-none">
                  {hpFloatText}
                </div>
              )}
              <div className="flex items-center justify-between mb-2 select-none">
                <span className="text-game-text text-sm">HP: <span className="tabular-nums">{currentHP}</span> / <span className="tabular-nums">{maxHP}</span></span>
                <span className="text-game-text-muted text-xs">
                  {GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST}&#9670; &rarr; +{GAME_CONFIG.HP_SACRIFICE_HP_RECOVERY} HP
                </span>
              </div>
              {currentHP >= maxHP ? (
                <div className="text-game-success text-sm text-center py-2 select-none">HP Full</div>
              ) : (
                <button
                  className={`w-full py-2 text-sm font-semibold tracking-wider border rounded transition-all duration-150
                    select-none outline-none
                    ${canSacrifice
                      ? 'border-game-success/50 text-game-success hover:bg-game-success/10 hover:border-game-success cursor-pointer focus-visible:ring-2 focus-visible:ring-game-success'
                      : 'border-game-border/50 text-game-text-muted opacity-50 cursor-not-allowed'
                    }`}
                  onClick={canSacrifice ? handleHPSacrifice : undefined}
                  onMouseEnter={() => canSacrifice && playSFX('button-hover')}
                  disabled={!canSacrifice}
                  tabIndex={canSacrifice ? 0 : -1}
                >
                  [H] RECOVER HP
                </button>
              )}
              {!canSacrifice && currentHP < maxHP && (
                <div className="text-game-danger text-xs mt-1 text-center select-none">Not enough Fragments</div>
              )}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Enter System button */}
          <button
            className="w-full py-4 font-semibold tracking-[0.2em] border border-game-border rounded
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
