import { useEffect, useState, useCallback } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'
import useArmory from '../stores/useArmory.jsx'
import useLevel from '../stores/useLevel.jsx'
import { generatePlanetReward } from '../systems/progressionSystem.js'
import { getRarityTier } from '../systems/raritySystem.js'
import { playSFX } from '../audio/audioManager.js'
import { PLANETS } from '../entities/planetDefs.js'

const TIER_COLORS = {
  standard:  '#a07855',   // CINDER
  rare:      '#00b4d8',   // PULSE
  legendary: '#9b5de5',   // VOID
}

const TIER_LABELS = {
  standard:  'Standard',
  rare:      'Rare',
  legendary: 'Legendary',
}

export default function PlanetRewardModal() {
  const [choices, setChoices] = useState([])
  const rewardTier = useGame((s) => s.rewardTier)
  const tierColor = TIER_COLORS[rewardTier] || '#ffffff'
  const tierLabel = TIER_LABELS[rewardTier] || rewardTier

  // Generate choices on mount
  useEffect(() => {
    const equippedWeapons = useWeapons.getState().activeWeapons.map(w => ({ weaponId: w.weaponId, level: w.level }))
    const equippedBoonIds = useBoons.getState().activeBoons.map(b => b.boonId)
    const equippedBoons = useBoons.getState().getEquippedBoons()
    const banishedItems = useLevel.getState().banishedItems
    setChoices(generatePlanetReward(rewardTier, equippedWeapons, equippedBoonIds, equippedBoons, banishedItems))
  }, [rewardTier])

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
    // stat_boost: intentional no-op fallback (all slots maxed edge case)
    useGame.getState().resumeGameplay()
  }, [])

  // Keyboard selection
  useEffect(() => {
    const handler = (e) => {
      const key = e.code
      let index = -1
      if (key === 'Digit1' || key === 'Numpad1') index = 0
      else if (key === 'Digit2' || key === 'Numpad2') index = 1
      else if (key === 'Digit3' || key === 'Numpad3') index = 2

      if (index >= 0 && index < choices.length) {
        applyChoice(choices[index])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [choices, applyChoice])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 font-game">
      <h1
        className="text-3xl font-bold tracking-widest text-game-text mb-2 animate-fade-in"
        style={{ color: tierColor }}
      >
        PLANET SCANNED!
      </h1>
      <p className="text-game-text-muted text-sm mb-8 animate-fade-in">{tierLabel} Planet Reward</p>
      <div className="flex gap-4">
        {choices.map((choice, i) => {
          const rarityTier = getRarityTier(choice.rarity || 'COMMON')
          const isCommon = !choice.rarity || choice.rarity === 'COMMON'
          const glowPx = rarityTier.glowIntensity * 8

          return (
            <div
              key={`${choice.type}_${choice.id}`}
              className="w-52 p-4 bg-game-bg-medium rounded-lg
                         hover:cursor-pointer transition-all animate-fade-in"
              style={{
                animationDelay: `${i * 50}ms`,
                animationFillMode: 'backwards',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: isCommon ? `${tierColor}66` : rarityTier.color,
                boxShadow: isCommon ? `0 0 12px ${tierColor}30` : `0 0 ${glowPx}px ${rarityTier.color}`,
              }}
              onClick={() => applyChoice(choice)}
              onMouseEnter={() => playSFX('button-hover')}
            >
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
                  className={choice.level ? 'text-game-text-muted text-xs' : 'text-xs font-bold'}
                  style={!choice.level && isCommon ? { color: tierColor } : undefined}
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
    </div>
  )
}
