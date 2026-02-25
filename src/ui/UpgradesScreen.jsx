import { useEffect } from 'react'
import { FragmentIcon } from './icons/index.jsx'
import useUpgrades from '../stores/useUpgrades.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { PERMANENT_UPGRADES, getTotalBonus } from '../entities/permanentUpgradesDefs.js'
import { playSFX } from '../audio/audioManager.js'
import { SwordIcon, LightningIcon, ShieldCrossIcon, ZoneIcon, SkullIcon, StarIcon, RerollIcon, SkipIcon, BanishIcon, RegenIcon, MagnetIcon, ArmorIcon, LuckIcon } from './icons/index.jsx'

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

const UPGRADE_ICON_MAP = {
  ATTACK_POWER: SwordIcon,
  ATTACK_SPEED: LightningIcon,
  MAX_HP: ShieldCrossIcon,
  REGEN: RegenIcon,
  ZONE: ZoneIcon,
  EXP_BONUS: StarIcon,
  CURSE: SkullIcon,
  REROLL: RerollIcon,
  SKIP: SkipIcon,
  BANISH: BanishIcon,
  MAGNET: MagnetIcon,
  LUCK: LuckIcon,
  ARMOR: ArmorIcon,
  REVIVAL: ShieldCrossIcon,
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
  const IconComp = UPGRADE_ICON_MAP[upgradeId]

  const cardBorderStyle = info.isMaxed
    ? { borderColor: 'rgba(45, 198, 83, 0.4)' }
    : info.canAfford
      ? { borderColor: 'var(--rs-border)' }
      : { borderColor: 'var(--rs-border)', opacity: 0.6 }

  return (
    <div
      className="p-3 transition-all duration-150 select-none"
      style={{
        background: 'var(--rs-bg-raised)',
        cursor: info.isMaxed ? 'default' : info.canAfford ? 'pointer' : 'not-allowed',
        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
        border: '1px solid var(--rs-border)',
        ...cardBorderStyle,
      }}
      onClick={handleBuy}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBuy() } }}
      onMouseEnter={(e) => {
        if (info.canAfford && !info.isMaxed) {
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--rs-violet) 60%, transparent)'
          e.currentTarget.style.background = 'color-mix(in srgb, var(--rs-bg-raised) 80%, white)'
          playSFX('button-hover')
        }
      }}
      onMouseLeave={(e) => {
        if (info.canAfford && !info.isMaxed) {
          e.currentTarget.style.borderColor = 'var(--rs-border)'
          e.currentTarget.style.background = 'var(--rs-bg-raised)'
        }
      }}
      role="button"
      tabIndex={info.canAfford && !info.isMaxed ? 0 : -1}
      aria-label={info.isMaxed ? `${info.name} — maxed` : `Buy ${info.name} for ${info.nextCost} Fragments`}
      aria-disabled={!info.canAfford && !info.isMaxed}
    >
      {/* Top: icon + name + level */}
      <div className="flex items-start gap-2 mb-1.5">
        {IconComp ? (
          <span className="mt-0.5 flex-shrink-0"><IconComp size={16} color="var(--rs-orange)" /></span>
        ) : (
          <div style={{
            width: 20,
            height: 20,
            marginTop: 2,
            border: '1px solid var(--rs-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: 'var(--rs-orange)',
            flexShrink: 0,
            userSelect: 'none',
            letterSpacing: '-0.05em',
          }}>
            {upgradeId.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--rs-text)' }}>{info.name}</h3>
            <span className="text-xs tabular-nums flex-shrink-0" style={{ color: 'var(--rs-text-muted)' }}>
              {info.currentLevel}/{info.maxLevel}
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--rs-text-muted)' }}>{info.description}</p>
        </div>
      </div>

      {/* Bottom: bonus + cost/buy */}
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="text-xs font-medium" style={{ color: 'var(--rs-violet)' }}>
          {bonusText ?? <span style={{ color: 'var(--rs-text-muted)' }}>—</span>}
        </div>

        {info.isMaxed ? (
          <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--rs-success)' }}>MAX</span>
        ) : (
          <button
            className={`
              px-2.5 py-1 text-xs font-semibold tracking-wider
              outline-none pointer-events-none
              ${!info.canAfford ? '' : ''}
            `}
            style={info.canAfford
              ? { borderColor: 'var(--rs-violet)', color: 'var(--rs-violet)', border: '1px solid var(--rs-violet)', clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }
              : { border: '1px solid rgba(46,37,69,0.4)', clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)', color: 'var(--rs-text-muted)' }
            }
            disabled={!info.canAfford}
            aria-hidden="true"
            tabIndex={-1}
          >
            {info.nextCost}<FragmentIcon size={12} color="var(--rs-violet)" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 2 }} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function UpgradesScreen({ onClose }) {
  const fragments = usePlayer(s => s.fragments)
  const totalFragmentsSpent = useUpgrades(s => s.getTotalFragmentsSpent())

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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      {/* Panel conteneur ancré — remplace l'ancien div max-w-4xl */}
      <div style={{
        background: 'var(--rs-bg-surface)',
        border: '1px solid var(--rs-border)',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        width: 'clamp(640px, 70vw, 960px)',
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '2rem',
        position: 'relative',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { playSFX('button-click'); onClose() }}
            className="px-4 py-2 text-sm tracking-widest transition-colors select-none"
            style={{ color: 'var(--rs-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rs-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rs-text-muted)' }}
          >
            &larr; BACK
          </button>

          <h1
            className="text-2xl font-bold select-none"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.15em', color: 'var(--rs-text)' }}
          >
            PERMANENT UPGRADES
          </h1>

          <div className="flex items-center gap-4">
            {/* Fragment balance */}
            <div className="flex items-center gap-2 select-none">
              <FragmentIcon size={18} color="var(--rs-violet)" />
              <span className="font-semibold text-lg tabular-nums" style={{ color: 'var(--rs-text)' }}>{fragments}</span>
            </div>

            {/* REFUND ALL button */}
            {totalFragmentsSpent > 0 && (
              <button
                onClick={() => {
                  playSFX('button-click')
                  useUpgrades.getState().refundAll()
                }}
                onMouseEnter={(e) => {
                  playSFX('button-hover')
                  e.currentTarget.style.background = 'rgba(255, 51, 102, 0.1)'
                }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                className="px-4 py-2 text-sm font-semibold tracking-wider transition-colors select-none"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
                  border: '1px solid var(--rs-danger)',
                  color: 'var(--rs-danger)',
                  background: 'transparent',
                }}
                aria-label="Refund all upgrades"
              >
                REFUND ALL
              </button>
            )}
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
