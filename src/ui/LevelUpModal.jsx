import { useEffect, useState, useCallback, useRef } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'
import useArmory from '../stores/useArmory.jsx'
import useLevel from '../stores/useLevel.jsx'
import { generateChoices } from '../systems/progressionSystem.js'
import { getRarityTier } from '../systems/raritySystem.js'
import { playSFX } from '../audio/audioManager.js'

export default function LevelUpModal() {
  const [choices, setChoices] = useState([])
  const [banishingIndex, setBanishingIndex] = useState(null)
  const banishModeRef = useRef(false)
  const isBanishingRef = useRef(false)
  const rerollCharges = usePlayer(s => s.rerollCharges)
  const skipCharges = usePlayer(s => s.skipCharges)
  const banishCharges = usePlayer(s => s.banishCharges)

  // Shared helper: get current equipped state and generate choices
  const buildChoices = useCallback((banishedItems) => {
    const level = usePlayer.getState().currentLevel
    const equippedWeapons = useWeapons.getState().activeWeapons.map(w => ({ weaponId: w.weaponId, level: w.level }))
    const equippedBoonIds = useBoons.getState().activeBoons.map(b => b.boonId)
    const equippedBoons = useBoons.getState().getEquippedBoons()
    // Story 22.3: Include luck stat for rarity roll (boon luckBonus + ship + permanent)
    const luckStat = (usePlayer.getState().getLuckStat?.() ?? 0) + (useBoons.getState().modifiers.luckBonus ?? 0)
    return generateChoices(level, equippedWeapons, equippedBoonIds, equippedBoons, banishedItems, luckStat)
  }, [])

  // Generate choices on mount
  useEffect(() => {
    const banishedItems = useLevel.getState().banishedItems
    setChoices(buildChoices(banishedItems))
  }, [buildChoices])

  const applyChoice = useCallback((choice) => {
    playSFX('button-click')
    const rarity = choice.rarity || 'COMMON'
    if (choice.type === 'weapon_upgrade') {
      useWeapons.getState().upgradeWeapon(choice.id, rarity)
    } else if (choice.type === 'new_weapon') {
      useWeapons.getState().addWeapon(choice.id, rarity)
      useArmory.getState().markDiscovered('weapons', choice.id)
    } else if (choice.type === 'new_boon') {
      useBoons.getState().addBoon(choice.id, rarity)
      usePlayer.getState().applyMaxHPBonus(useBoons.getState().modifiers.maxHPBonus)
      useArmory.getState().markDiscovered('boons', choice.id)
    } else if (choice.type === 'boon_upgrade') {
      useBoons.getState().upgradeBoon(choice.id, rarity)
      usePlayer.getState().applyMaxHPBonus(useBoons.getState().modifiers.maxHPBonus)
    }
    useGame.getState().resumeGameplay()
  }, [])

  // --- Strategic actions (Story 22.2) ---

  const handleReroll = useCallback(() => {
    if (usePlayer.getState().rerollCharges <= 0) return
    playSFX('button-click')
    usePlayer.getState().consumeReroll()
    const banishedItems = useLevel.getState().banishedItems
    setChoices(buildChoices(banishedItems))
  }, [buildChoices])

  const handleSkip = useCallback(() => {
    if (usePlayer.getState().skipCharges <= 0) return
    playSFX('button-click')
    usePlayer.getState().consumeSkip()
    // Clear entire level-up queue — skip discards all pending level-ups
    usePlayer.getState().clearPendingLevelUps()
    useGame.getState().resumeGameplay()
  }, [])

  const handleBanish = useCallback((choice, index) => {
    if (isBanishingRef.current) return // Guard against double-click during fade-out (stable ref, no re-attach)
    if (usePlayer.getState().banishCharges <= 0) return
    isBanishingRef.current = true
    playSFX('button-click')
    usePlayer.getState().consumeBanish()

    // Determine type for banish list
    const type = (choice.type === 'new_weapon' || choice.type === 'weapon_upgrade') ? 'weapon' : 'boon'
    useLevel.getState().addBanishedItem(choice.id, type)

    // Brief visual feedback, then resolve level-up (clears entire queue)
    setBanishingIndex(index)
    setTimeout(() => {
      isBanishingRef.current = false
      setBanishingIndex(null)
      usePlayer.getState().clearPendingLevelUps()
      useGame.getState().resumeGameplay()
    }, 200)
  }, [])

  // Keyboard selection (includes strategic shortcuts)
  useEffect(() => {
    const handler = (e) => {
      const key = e.code

      // Banish mode: X key enters banish mode, then number selects card
      if (key === 'KeyX') {
        banishModeRef.current = true
        // Reset after short timeout if no number pressed
        setTimeout(() => { banishModeRef.current = false }, 1000)
        return
      }

      // Number keys — either banish or select depending on mode
      let index = -1
      if (key === 'Digit1' || key === 'Numpad1') index = 0
      else if (key === 'Digit2' || key === 'Numpad2') index = 1
      else if (key === 'Digit3' || key === 'Numpad3') index = 2
      else if (key === 'Digit4' || key === 'Numpad4') index = 3

      if (index >= 0 && index < choices.length) {
        if (banishModeRef.current) {
          banishModeRef.current = false
          handleBanish(choices[index], index)
        } else {
          applyChoice(choices[index])
        }
        return
      }

      // Strategic shortcuts
      if (key === 'KeyR') handleReroll()
      else if (key === 'KeyS' || key === 'Escape') handleSkip()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [choices, applyChoice, handleReroll, handleSkip, handleBanish])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 font-game">
      <h1 className="text-3xl font-bold tracking-widest text-game-text mb-8 animate-fade-in">
        LEVEL UP!
      </h1>
      <div className="flex gap-4">
        {choices.map((choice, i) => {
          const rarityTier = getRarityTier(choice.rarity || 'COMMON')
          const isCommon = !choice.rarity || choice.rarity === 'COMMON'
          const glowPx = rarityTier.glowIntensity * 8

          return (
            <div
              key={`${choice.type}_${choice.id}_${i}`}
              className="relative w-52 p-4 bg-game-bg-medium rounded-lg cursor-pointer transition-all animate-fade-in"
              style={{
                animationDelay: `${i * 50}ms`,
                animationFillMode: 'backwards',
                opacity: banishingIndex === i ? 0.2 : 1,
                transform: banishingIndex === i ? 'scale(0.95)' : undefined,
                transition: 'opacity 200ms ease-out, transform 200ms ease-out, border-color 150ms, box-shadow 150ms',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: rarityTier.color,
                boxShadow: isCommon ? 'none' : `0 0 ${glowPx}px ${rarityTier.color}`,
              }}
              onClick={() => applyChoice(choice)}
            >
              {/* Banish X button — top-right of each card (Story 22.2 Task 5) */}
              {/* Hidden for stat_boost fallback choices (no meaningful item to banish) */}
              {banishCharges > 0 && choice.type !== 'stat_boost' && (
                <button
                  className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center
                             rounded-full text-white text-xs font-bold
                             hover:scale-110 transition-transform cursor-pointer"
                  style={{
                    backgroundColor: '#ff3366',
                    boxShadow: '0 0 6px rgba(255, 51, 102, 0.5)',
                    zIndex: 10,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleBanish(choice, i)
                  }}
                  aria-label={`banish ${choice.name}`}
                >
                  ✕
                </button>
              )}

              {/* Top row: rarity badge (if not Common) + level/NEW indicator */}
              <div className="flex items-center gap-2">
                {!isCommon && (
                  <div
                    className="px-2 py-0.5 text-xs font-bold rounded"
                    style={{ backgroundColor: rarityTier.color, color: '#000' }}
                  >
                    {rarityTier.name.toUpperCase()}
                  </div>
                )}
                <span
                  className={
                    choice.level
                      ? 'text-game-text-muted text-xs'
                      : 'text-game-accent text-xs font-bold'
                  }
                >
                  {choice.level ? `Lvl ${choice.level}` : 'NEW'}
                </span>
              </div>
              <h3 className="text-game-text font-semibold mt-1">{choice.name}</h3>
              {choice.statPreview ? (
                <p className="text-game-text-muted text-sm mt-1">{choice.statPreview}</p>
              ) : (
                <p className="text-game-text-muted text-sm mt-1">{choice.description}</p>
              )}
              <span className="text-game-text-muted text-xs mt-2 block">[{i + 1}]</span>
            </div>
          )
        })}
      </div>

      {/* Strategic buttons — below choice cards (Story 22.2 Tasks 3-4) */}
      {(rerollCharges > 0 || skipCharges > 0) && (
        <div className="mt-6 flex gap-4 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          {rerollCharges > 0 && (
            <button
              onClick={handleReroll}
              className="px-5 py-2 bg-game-bg-medium border border-game-border rounded-lg
                         font-bold tracking-wider
                         hover:border-game-accent hover:scale-105
                         transition-all cursor-pointer"
              style={{ color: '#00ffcc', borderColor: 'rgba(0, 255, 204, 0.3)' }}
            >
              ↻ REROLL ({rerollCharges})
              <span className="block text-xs font-normal mt-0.5 opacity-50">R</span>
            </button>
          )}
          {skipCharges > 0 && (
            <button
              onClick={handleSkip}
              className="px-5 py-2 bg-game-bg-medium border border-game-border rounded-lg
                         font-bold tracking-wider
                         hover:border-game-text hover:scale-105
                         transition-all cursor-pointer"
              style={{ color: '#ffdd00', borderColor: 'rgba(255, 221, 0, 0.3)' }}
            >
              ⏭ SKIP ({skipCharges})
              <span className="block text-xs font-normal mt-0.5 opacity-50">S</span>
            </button>
          )}
        </div>
      )}

      {/* Keyboard hints — bottom of modal */}
      <p className="text-game-text-muted text-xs mt-4 opacity-40 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
        [1-4] Select{rerollCharges > 0 ? ' · R Reroll' : ''}{skipCharges > 0 ? ' · S Skip' : ''}{banishCharges > 0 ? ' · X+# Banish' : ''}
      </p>
    </div>
  )
}
