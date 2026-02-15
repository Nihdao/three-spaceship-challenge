import { useState, useEffect, useRef, useMemo } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useUpgrades from '../stores/useUpgrades.jsx'
import { SHIPS, TRAIT_INFO, getDefaultShipId } from '../entities/shipDefs.js'
import { playSFX } from '../audio/audioManager.js'
import StatLine from './primitives/StatLine.jsx'
import ShipModelPreview from './ShipModelPreview.jsx'

const shipList = Object.values(SHIPS)

// Default bonuses when useUpgrades store doesn't exist or returns null
const DEFAULT_BONUSES = {
  maxHP: 0,
  armor: 0,
  regen: 0,
  attackPower: 1.0,
  attackSpeed: 1.0,
  zone: 1.0,
  magnet: 1.0,
  luck: 0,
  expBonus: 1.0,
  curse: 0,
  revival: 0,
  reroll: 0,
  skip: 0,
  banish: 0,
}

export default function ShipSelect() {
  const [selectedShipId, setSelectedShipId] = useState(getDefaultShipId)
  const [focusIndex, setFocusIndex] = useState(0)

  const selectedShip = SHIPS[selectedShipId]

  // Compute effective stats by combining ship base stats + permanent upgrade bonuses
  // Subscribe to upgradeLevels to trigger recomputation when upgrades change
  // Fallback to default bonuses if useUpgrades returns null/undefined
  const upgradeLevels = useUpgrades(state => state?.upgradeLevels)
  const bonuses = useMemo(() => {
    try {
      const computed = useUpgrades.getState()?.getComputedBonuses?.()
      return computed || DEFAULT_BONUSES
    } catch (error) {
      // useUpgrades store not available or method doesn't exist
      console.warn('Failed to get permanent upgrade bonuses, using defaults:', error.message)
      return DEFAULT_BONUSES
    }
  }, [upgradeLevels])

  const shipBaseStats = useMemo(() => ({
    maxHP: selectedShip.baseHP,
    speed: selectedShip.baseSpeed,
    damageMultiplier: selectedShip.baseDamageMultiplier,
    regen: selectedShip.baseRegen ?? 0,
    armor: selectedShip.baseArmor ?? 0,
    attackSpeed: selectedShip.baseAttackSpeed ?? 0,
    zone: selectedShip.baseZone ?? 0,
    magnet: selectedShip.baseMagnet ?? 0,
    luck: selectedShip.baseLuck ?? 0,
    expBonus: selectedShip.baseExpBonus ?? 0,
    curse: selectedShip.baseCurse ?? 0,
    revival: selectedShip.baseRevival ?? 0,
    reroll: selectedShip.baseReroll ?? 0,
    skip: selectedShip.baseSkip ?? 0,
    banish: selectedShip.baseBanish ?? 0,
  }), [selectedShip])

  const effectiveStats = useMemo(() => ({
    maxHP: shipBaseStats.maxHP + (bonuses.maxHP ?? 0),
    speed: shipBaseStats.speed,
    damageMultiplier: shipBaseStats.damageMultiplier * (bonuses.attackPower ?? 1.0),
    regen: shipBaseStats.regen + (bonuses.regen ?? 0),
    armor: shipBaseStats.armor + (bonuses.armor ?? 0),
    // Percentage stats: convert multipliers to percentages consistently
    // attackSpeed: multiplier < 1.0 means faster (0.9 = 10% faster), displayed as negative reduction
    attackSpeed: ((bonuses.attackSpeed ?? 1.0) < 1.0 ? (1.0 - (bonuses.attackSpeed ?? 1.0)) : 0) * 100,
    zone: ((bonuses.zone ?? 1.0) - 1.0) * 100,
    magnet: ((bonuses.magnet ?? 1.0) - 1.0) * 100,
    luck: shipBaseStats.luck + (bonuses.luck ?? 0),
    expBonus: ((bonuses.expBonus ?? 1.0) - 1.0) * 100,
    curse: shipBaseStats.curse + (bonuses.curse ?? 0),
    revival: shipBaseStats.revival + (bonuses.revival ?? 0),
    reroll: shipBaseStats.reroll + (bonuses.reroll ?? 0),
    skip: shipBaseStats.skip + (bonuses.skip ?? 0),
    banish: shipBaseStats.banish + (bonuses.banish ?? 0),
  }), [shipBaseStats, bonuses])

  // Ref to avoid re-registering keyboard listener on every selection change
  const selectedShipIdRef = useRef(selectedShipId)
  selectedShipIdRef.current = selectedShipId

  const focusIndexRef = useRef(focusIndex)
  focusIndexRef.current = focusIndex

  const unlockedIndices = useMemo(
    () => shipList.map((s, i) => (!s.locked ? i : -1)).filter(i => i >= 0),
    [],
  )

  const handleShipClick = (shipId) => {
    if (SHIPS[shipId].locked) return
    playSFX('button-click')
    setSelectedShipId(shipId)
    setFocusIndex(shipList.findIndex(s => s.id === shipId))
  }

  const handleStart = () => {
    playSFX('button-click')
    usePlayer.getState().setCurrentShipId(selectedShipIdRef.current)
    useGame.getState().startGameplay()
  }

  const handleBack = () => {
    playSFX('button-click')
    useGame.getState().setPhase('menu')
  }

  // Keyboard navigation — stable listener using refs
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        handleBack()
        return
      }

      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        handleStart()
        return
      }

      // Grid navigation among unlocked ships only
      const cols = 3
      const currentUnlockedIdx = unlockedIndices.indexOf(focusIndexRef.current)
      if (currentUnlockedIdx < 0) return

      let nextUnlockedIdx = currentUnlockedIdx

      if (e.code === 'ArrowRight') {
        e.preventDefault()
        nextUnlockedIdx = Math.min(currentUnlockedIdx + 1, unlockedIndices.length - 1)
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        nextUnlockedIdx = Math.max(currentUnlockedIdx - 1, 0)
      } else if (e.code === 'ArrowDown') {
        e.preventDefault()
        nextUnlockedIdx = Math.min(currentUnlockedIdx + cols, unlockedIndices.length - 1)
      } else if (e.code === 'ArrowUp') {
        e.preventDefault()
        nextUnlockedIdx = Math.max(currentUnlockedIdx - cols, 0)
      } else {
        return
      }

      if (nextUnlockedIdx !== currentUnlockedIdx) {
        playSFX('button-hover')
        const newIndex = unlockedIndices[nextUnlockedIdx]
        setFocusIndex(newIndex)
        setSelectedShipId(shipList[newIndex].id)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [unlockedIndices])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-game animate-fade-in">
      {/* BACK button */}
      <button
        onClick={handleBack}
        className="absolute top-8 left-8 px-4 py-2 text-sm tracking-widest text-game-text-muted hover:text-game-text transition-colors select-none"
      >
        &larr; BACK
      </button>

      <div className="flex gap-8 w-full h-full max-w-5xl p-8 pt-20">
        {/* LEFT: Ship Grid */}
        <div className="flex-1 overflow-y-auto">
          <h2
            className="text-2xl font-bold tracking-[0.15em] text-game-text mb-6 select-none"
            style={{ textShadow: '0 0 30px rgba(255, 0, 255, 0.2)' }}
          >
            SELECT YOUR SHIP
          </h2>
          <div className="grid grid-cols-3 gap-4 p-1">
            {shipList.map((ship, i) => (
              <button
                key={ship.id}
                onClick={() => handleShipClick(ship.id)}
                disabled={ship.locked}
                onMouseEnter={() => {
                  if (!ship.locked) {
                    playSFX('button-hover')
                    setSelectedShipId(ship.id)
                    setFocusIndex(i)
                  }
                }}
                className={`
                  relative p-3 border rounded-lg transition-all duration-150 select-none
                  ${ship.locked
                    ? 'opacity-40 grayscale cursor-not-allowed border-game-border/30 bg-white/[0.03]'
                    : 'cursor-pointer border-game-border/70 bg-white/[0.08] hover:border-game-accent/50 hover:bg-white/[0.12]'
                  }
                  ${selectedShipId === ship.id && !ship.locked
                    ? 'border-game-accent ring-1 ring-game-accent/40 bg-game-accent/15'
                    : ''
                  }
                `}
              >
                {/* Ship thumbnail */}
                <div className="aspect-square bg-game-text-muted/5 rounded mb-2 flex items-center justify-center text-3xl overflow-hidden">
                  {ship.locked
                    ? '🔒'
                    : <ShipModelPreview modelPath={ship.modelPath} />
                  }
                </div>
                <p className="text-game-text font-semibold tracking-wide text-xs">{ship.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Ship Detail Panel */}
        <div className="w-80 bg-game-bg/60 border border-game-border/40 rounded-lg p-6 flex flex-col backdrop-blur-sm">
          {/* Ship 3D Preview */}
          <div
            className="aspect-video rounded-lg mb-4 overflow-hidden"
            style={{ backgroundColor: `${selectedShip.colorTheme}10`, borderColor: `${selectedShip.colorTheme}30`, borderWidth: 1 }}
          >
            <ShipModelPreview modelPath={selectedShip.modelPath} rotate />
          </div>

          {/* Ship Name & Description */}
          <h3
            className="text-xl font-bold tracking-[0.1em] text-game-text mb-2"
            style={{ textShadow: `0 0 20px ${selectedShip.colorTheme}40` }}
          >
            {selectedShip.name}
          </h3>
          <p className="text-sm text-game-text-muted mb-4 leading-relaxed">
            {selectedShip.description}
          </p>

          {/* Separator */}
          <div className="border-t border-game-border/20 mb-4" />

          {/* Stats — Enriched with all 15 stats + permanent upgrade bonuses */}
          <div className="space-y-1 mb-4 max-h-80 overflow-y-auto">
            {/* Flat value stats — pass bonus from bonuses object */}
            <StatLine
              label="HP"
              value={effectiveStats.maxHP}
              bonusValue={bonuses.maxHP}
              icon="❤️"
            />
            <StatLine
              label="REGEN"
              value={effectiveStats.regen > 0 ? `${effectiveStats.regen.toFixed(1)}/s` : '0/s'}
              bonusValue={bonuses.regen}
              icon="🔄"
            />
            <StatLine
              label="ARMOR"
              value={effectiveStats.armor > 0 ? `+${effectiveStats.armor}` : '+0'}
              bonusValue={bonuses.armor}
              icon="🛡️"
            />
            {/* Percentage stats — pass percentage delta from effectiveStats for consistency */}
            <StatLine
              label="DAMAGE"
              value={effectiveStats.damageMultiplier > 1.0 ? `+${((effectiveStats.damageMultiplier - 1.0) * 100).toFixed(0)}%` : '+0%'}
              bonusValue={(bonuses.attackPower ?? 1.0) > 1.0 ? ((bonuses.attackPower - 1.0) * 100).toFixed(0) : undefined}
              icon="⚔️"
            />
            <StatLine
              label="ATTACK SPEED"
              value={effectiveStats.attackSpeed > 0 ? `-${effectiveStats.attackSpeed.toFixed(0)}%` : '+0%'}
              bonusValue={effectiveStats.attackSpeed > 0 ? effectiveStats.attackSpeed.toFixed(0) : undefined}
              icon="⏱️"
            />
            <StatLine
              label="ZONE"
              value={effectiveStats.zone > 0 ? `+${effectiveStats.zone.toFixed(0)}%` : '+0%'}
              bonusValue={effectiveStats.zone > 0 ? effectiveStats.zone.toFixed(0) : undefined}
              icon="💥"
            />
            <StatLine
              label="SPEED"
              value={effectiveStats.speed}
              icon="⚡"
            />
            <StatLine
              label="MAGNET"
              value={effectiveStats.magnet > 0 ? `+${effectiveStats.magnet.toFixed(0)}%` : '+0%'}
              bonusValue={effectiveStats.magnet > 0 ? effectiveStats.magnet.toFixed(0) : undefined}
              icon="🧲"
            />
            <StatLine
              label="LUCK"
              value={effectiveStats.luck > 0 ? `+${effectiveStats.luck}%` : '+0%'}
              bonusValue={bonuses.luck}
              icon="🍀"
            />
            <StatLine
              label="EXP BONUS"
              value={effectiveStats.expBonus > 0 ? `+${effectiveStats.expBonus.toFixed(0)}%` : '+0%'}
              bonusValue={effectiveStats.expBonus > 0 ? effectiveStats.expBonus.toFixed(0) : undefined}
              icon="✨"
            />
            <StatLine
              label="CURSE"
              value={effectiveStats.curse > 0 ? `+${effectiveStats.curse}%` : '+0%'}
              bonusValue={bonuses.curse}
              icon="☠️"
            />
            {/* Meta stats — flat values */}
            <StatLine
              label="REVIVAL"
              value={effectiveStats.revival}
              bonusValue={bonuses.revival}
              icon="💚"
            />
            <StatLine
              label="REROLL"
              value={effectiveStats.reroll}
              bonusValue={bonuses.reroll}
              icon="🎲"
            />
            <StatLine
              label="SKIP"
              value={effectiveStats.skip}
              bonusValue={bonuses.skip}
              icon="⏭️"
            />
            <StatLine
              label="BANISH"
              value={effectiveStats.banish}
              bonusValue={bonuses.banish}
              icon="🚫"
            />
          </div>

          {/* Unique Traits */}
          {selectedShip.traits && selectedShip.traits.length > 0 && (
            <>
              <div className="border-t border-game-border/20 mb-3" />
              <p className="text-game-text-muted text-[10px] tracking-widest uppercase mb-2">Traits</p>
              <div className="space-y-1.5 mb-4">
                {selectedShip.traits.map(traitId => {
                  const info = TRAIT_INFO[traitId]
                  if (!info) return null
                  return (
                    <div key={traitId} className="flex items-center gap-1.5 text-sm text-game-text" title={info.description}>
                      <span className="flex-shrink-0">{info.icon}</span>
                      <span>{info.label}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* START button */}
          <button
            onClick={handleStart}
            className="
              w-full py-3 mt-4 text-lg font-bold tracking-widest
              border border-game-accent text-game-text
              bg-game-accent/10 rounded-lg
              hover:bg-game-accent/20 hover:scale-105
              transition-all duration-150 select-none
            "
          >
            START
          </button>
        </div>
      </div>
    </div>
  )
}
