import { useEffect } from 'react'
import useUpgrades from '../stores/useUpgrades.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { PERMANENT_UPGRADES, getTotalBonus } from '../entities/permanentUpgradesDefs.js'
import { playSFX } from '../audio/audioManager.js'

/**
 * Compute display info for a single upgrade card.
 * Exported for testing.
 */
export function getUpgradeDisplayInfo(upgradeId, currentLevel, playerFragments) {
  const def = PERMANENT_UPGRADES[upgradeId]
  if (!def) return null

  const isMaxed = currentLevel >= def.maxLevel
  const nextLevelDef = !isMaxed ? def.levels[currentLevel] : null
  const nextCost = nextLevelDef?.cost ?? null
  const canAfford = nextCost !== null && playerFragments >= nextCost
  const totalBonus = getTotalBonus(upgradeId, currentLevel)

  return {
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    currentLevel,
    maxLevel: def.maxLevel,
    nextCost,
    totalBonus,
    isMaxed,
    canAfford,
  }
}

/** All upgrade IDs in definition order. Exported for testing. */
export const UPGRADE_IDS = Object.keys(PERMANENT_UPGRADES)

/** Bonus display format per upgrade — 'percent' | 'perSecond' | 'flat' (default) */
export const BONUS_FORMATS = {
  ATTACK_POWER: 'percent',
  ATTACK_SPEED: 'percent',
  ZONE: 'percent',
  REGEN: 'perSecond',
  // Batch 2 (add when defs land): LUCK: 'percent', EXP_BONUS: 'percent', CURSE: 'percent', MAGNET: 'percent'
}

function UpgradeCard({ upgradeId }) {
  const currentLevel = useUpgrades(s => s.upgradeLevels[upgradeId] || 0)
  const fragments = usePlayer(s => s.fragments)
  const info = getUpgradeDisplayInfo(upgradeId, currentLevel, fragments)
  if (!info) return null

  const handleBuy = () => {
    if (info.isMaxed || !info.canAfford) return
    const success = useUpgrades.getState().purchaseUpgrade(upgradeId)
    if (success) {
      playSFX('upgrade-purchase')
    }
  }

  // Format bonus for display — uses BONUS_FORMATS mapping for extensibility
  const formatBonus = () => {
    if (info.currentLevel === 0) return null
    const format = BONUS_FORMATS[upgradeId] || 'flat'
    if (format === 'percent') return `+${Math.round(info.totalBonus * 100)}%`
    if (format === 'perSecond') return `+${info.totalBonus.toFixed(1)}/s`
    return `+${Math.round(info.totalBonus)}`
  }

  const bonusText = formatBonus()

  return (
    <div
      className={`
        border rounded-lg p-3 transition-all duration-150 select-none
        bg-white/[0.05] backdrop-blur-sm
        ${info.isMaxed
          ? 'border-game-success/40'
          : info.canAfford
            ? 'border-game-border hover:border-[#cc66ff]/60 hover:bg-white/[0.08]'
            : 'border-game-border/40 opacity-60'
        }
      `}
    >
      {/* Top: icon + name + level */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-2xl flex-shrink-0">{info.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-sm font-semibold text-game-text truncate">{info.name}</h3>
            <span className="text-xs text-game-text-muted tabular-nums flex-shrink-0">
              {info.currentLevel}/{info.maxLevel}
            </span>
          </div>
          <p className="text-xs text-game-text-muted truncate">{info.description}</p>
        </div>
      </div>

      {/* Bottom: bonus + cost/buy */}
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="text-xs text-[#cc66ff] font-medium">
          {bonusText ?? <span className="text-game-text-muted">—</span>}
        </div>

        {info.isMaxed ? (
          <span className="text-xs font-bold text-game-success tracking-wider">MAX</span>
        ) : (
          <button
            className={`
              px-2.5 py-1 text-xs font-semibold tracking-wider rounded border transition-all duration-150
              outline-none
              ${info.canAfford
                ? 'border-[#cc66ff]/60 text-[#cc66ff] hover:bg-[#cc66ff]/15 hover:border-[#cc66ff] cursor-pointer'
                : 'border-game-border/40 text-game-text-muted cursor-not-allowed'
              }
            `}
            onClick={handleBuy}
            onMouseEnter={() => info.canAfford && playSFX('button-hover')}
            disabled={!info.canAfford}
            aria-label={`Buy ${info.name} for ${info.nextCost} Fragments`}
          >
            {info.nextCost}◆
          </button>
        )}
      </div>
    </div>
  )
}

export default function UpgradesScreen({ onClose }) {
  const fragments = usePlayer(s => s.fragments)

  // Keyboard: Escape to close
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        playSFX('button-click')
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center font-game animate-fade-in">
      {/* Content — no backdrop, 3D background visible directly */}
      <div className="relative w-full max-w-4xl px-6 py-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { playSFX('button-click'); onClose() }}
            className="px-4 py-2 text-sm tracking-widest text-game-text-muted hover:text-game-text transition-colors select-none"
          >
            &larr; BACK
          </button>

          <h1
            className="text-2xl font-bold tracking-[0.15em] text-game-text select-none"
            style={{ textShadow: '0 0 30px rgba(204, 102, 255, 0.3)' }}
          >
            PERMANENT UPGRADES
          </h1>

          {/* Fragment balance */}
          <div className="flex items-center gap-2 select-none">
            <span className="text-[#cc66ff] text-lg">◆</span>
            <span className="text-game-text font-semibold text-lg tabular-nums">{fragments}</span>
          </div>
        </div>

        {/* Upgrade grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {UPGRADE_IDS.map(upgradeId => (
            <UpgradeCard key={upgradeId} upgradeId={upgradeId} />
          ))}
        </div>
      </div>
    </div>
  )
}
