import { useState, useEffect, useRef, useMemo } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useUpgrades from '../stores/useUpgrades.jsx'
import useShipProgression from '../stores/useShipProgression.jsx'
import { SHIPS, TRAIT_INFO, getDefaultShipId } from '../entities/shipDefs.js'
import { SHIP_LEVEL_SCALING, MAX_SHIP_LEVEL } from '../entities/shipProgressionDefs.js'
import { getSkinForShip } from '../entities/shipSkinDefs.js'
import { playSFX } from '../audio/audioManager.js'
import StatLine from './primitives/StatLine.jsx'
import ShipModelPreview from './ShipModelPreview.jsx'
import {
  ShieldCrossIcon,
  SwordIcon,
  SpeedIcon,
  SkullIcon,
  ClockIcon,
  ZoneIcon,
  StarIcon,
  RerollIcon,
  SkipIcon,
  BanishIcon,
  RegenIcon,
  MagnetIcon,
  ArmorIcon,
  LuckIcon,
  FragmentIcon,
} from './icons/index.jsx'

const TRAIT_ICON_MAP = {
  highRisk: SwordIcon,
  tanky: ShieldCrossIcon,
}

// Module-level icon wrappers with semantic colors — defined at module scope to avoid
// creating new function instances on every render (which would break React reconciliation).
const HPIcon = () => <ShieldCrossIcon size={14} color="var(--rs-hp)" />
const RegenColorIcon = () => <RegenIcon size={14} color="var(--rs-success)" />
const ArmorColorIcon = () => <ArmorIcon size={14} color="var(--rs-teal)" />
const DamageIcon = () => <SwordIcon size={14} color="var(--rs-orange)" />
const AttackSpeedIcon = () => <ClockIcon size={14} color="var(--rs-orange)" />
const ZoneColorIcon = () => <ZoneIcon size={14} color="var(--rs-violet)" />
const SpeedStatIcon = () => <SpeedIcon size={14} color="var(--rs-teal)" />
const MagnetColorIcon = () => <MagnetIcon size={14} color="var(--rs-violet)" />
const LuckColorIcon = () => <LuckIcon size={14} color="var(--rs-gold)" />
const ExpBonusIcon = () => <StarIcon size={14} color="var(--rs-gold)" />
const CurseIcon = () => <SkullIcon size={14} color="var(--rs-danger)" />
const RevivalIcon = () => <ShieldCrossIcon size={14} color="var(--rs-success)" />
const RerollColorIcon = () => <RerollIcon size={14} color="var(--rs-text-muted)" />
const SkipColorIcon = () => <SkipIcon size={14} color="var(--rs-text-muted)" />
const BanishColorIcon = () => <BanishIcon size={14} color="var(--rs-text-muted)" />

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

// ─── Redshift Design System styles ────────────────────────────────────────────
const S = {
  backBtn: {
    padding: '8px 16px',
    background: 'rgba(13, 11, 20, 0.82)',
    border: '1px solid var(--rs-border-hot)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    color: 'var(--rs-text)',
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'border-color 150ms, color 150ms, transform 150ms',
    outline: 'none',
    userSelect: 'none',
  },
  title: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '2.5rem',
    letterSpacing: '0.15em',
    color: 'var(--rs-text)',
    margin: 0,
    lineHeight: 1,
    userSelect: 'none',
  },
  titleAccent: {
    width: '32px', height: '2px',
    background: 'var(--rs-orange)',
    marginTop: '6px',
  },
  shipCard: {
    position: 'relative',
    padding: '12px',
    background: 'var(--rs-bg-raised)',
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    cursor: 'pointer',
    transition: 'border-color 150ms, transform 150ms',
    outline: 'none',
    userSelect: 'none',
    width: '100%',
    textAlign: 'left',
  },
  shipCardSelected: {
    borderColor: 'var(--rs-orange)',
    background: 'rgba(255,79,31,0.06)',
  },
  shipCardLocked: {
    position: 'relative',
    padding: '12px',
    background: 'var(--rs-bg-raised)',
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    opacity: 0.4,
    filter: 'grayscale(1)',
    cursor: 'not-allowed',
    outline: 'none',
    userSelect: 'none',
    width: '100%',
    textAlign: 'left',
  },
  detailPanel: {
    width: '320px',
    background: 'var(--rs-bg-surface)',
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  previewContainer: {
    aspectRatio: '4/3',
    marginBottom: '12px',
    overflow: 'hidden',
  },
  shipName: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '1.5rem',
    letterSpacing: '0.1em',
    color: 'var(--rs-text)',
    lineHeight: 1,
  },
  levelBadge: (color) => ({
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    padding: '2px 8px',
    color: color,
    border: `1px solid ${color}60`,
    clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
    background: `${color}15`,
    userSelect: 'none',
  }),
  maxBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    padding: '2px 8px',
    color: 'var(--rs-gold)',
    border: '1px solid rgba(255,214,10,0.4)',
    clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
    background: 'rgba(255,214,10,0.1)',
    userSelect: 'none',
  },
  maxLevelDisplay: {
    width: '100%',
    padding: '8px 0',
    marginBottom: '8px',
    textAlign: 'center',
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: 'var(--rs-gold)',
    border: '1px solid rgba(255,214,10,0.3)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    background: 'rgba(255,214,10,0.06)',
    userSelect: 'none',
  },
  btnLevelUp: {
    width: '100%',
    padding: '8px 0',
    marginBottom: '8px',
    background: 'rgba(0,180,216,0.08)',
    border: '1px solid var(--rs-teal)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    color: 'var(--rs-teal)',
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    cursor: 'pointer',
    transition: 'border-color 150ms, color 150ms, transform 150ms',
    outline: 'none',
    userSelect: 'none',
  },
  btnLevelUpDisabled: {
    width: '100%',
    padding: '8px 0',
    marginBottom: '8px',
    background: 'var(--rs-bg-raised)',
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    color: 'var(--rs-text-muted)',
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    cursor: 'not-allowed',
    opacity: 0.5,
    outline: 'none',
    userSelect: 'none',
  },
  btnSelect: {
    width: '100%',
    padding: '12px 0',
    background: 'rgba(255,79,31,0.1)',
    border: '1px solid var(--rs-orange)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    color: 'var(--rs-text)',
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '1.5rem',
    letterSpacing: '0.15em',
    cursor: 'pointer',
    transition: 'border-color 150ms, background 150ms, transform 150ms',
    outline: 'none',
    userSelect: 'none',
  },
}

export default function ShipSelect() {
  const [selectedShipId, setSelectedShipId] = useState(getDefaultShipId)
  const [focusIndex, setFocusIndex] = useState(0)
  const [hoveredSkinId, setHoveredSkinId] = useState(null)

  const selectedShip = SHIPS[selectedShipId]

  // Subscribe to ship progression and player fragments for level-up UI reactivity
  const shipLevels = useShipProgression(state => state.shipLevels)
  const selectedSkins = useShipProgression(state => state.selectedSkins)
  const fragments = usePlayer(state => state.fragments)

  const shipLevel = shipLevels[selectedShipId] || 1
  const isMaxLevel = shipLevel >= MAX_SHIP_LEVEL
  const nextLevelCost = isMaxLevel ? null : useShipProgression.getState().getNextLevelCost(selectedShipId)
  const canAffordLevelUp = nextLevelCost !== null && fragments >= nextLevelCost

  // Skin selector state (Story 25.2)
  const availableSkins = useMemo(
    () => useShipProgression.getState().getAvailableSkins(selectedShipId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedShipId, shipLevels, selectedSkins],
  )
  const selectedSkinId = selectedSkins[selectedShipId] || 'default'
  const selectedSkinData = getSkinForShip(selectedShipId, selectedSkinId)

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

  // Ship level multiplier applied to core base stats (Story 25.1)
  // Uses per-ship levelScaling from shipDefs.js, falling back to the global constant.
  const shipLevelMult = useMemo(
    () => 1 + (shipLevel - 1) * (selectedShip.levelScaling ?? SHIP_LEVEL_SCALING),
    [shipLevel, selectedShip],
  )

  const shipBaseStats = useMemo(() => ({
    maxHP: selectedShip.baseHP * shipLevelMult,
    speed: selectedShip.baseSpeed * shipLevelMult,
    damageMultiplier: selectedShip.baseDamageMultiplier * shipLevelMult,
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
  }), [selectedShip, shipLevelMult])

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
    useGame.getState().startGalaxyChoice() // Story 25.3: Go to galaxy choice before starting
  }

  const handleBack = () => {
    playSFX('button-click')
    useGame.getState().setPhase('menu')
  }

  const handleLevelUp = () => {
    if (!canAffordLevelUp) return
    const success = useShipProgression.getState().levelUpShip(selectedShipId)
    if (success) {
      playSFX('upgrade-purchase')
    }
  }

  const handleSkinSelect = (skinId) => {
    const success = useShipProgression.getState().setSelectedSkin(selectedShipId, skinId)
    if (success) {
      playSFX('button-click')
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      {/* BACK button */}
      <button
        onClick={handleBack}
        className="absolute top-8 left-8"
        style={S.backBtn}
        onMouseEnter={(e) => {
          playSFX('button-hover')
          e.currentTarget.style.borderColor = 'var(--rs-orange)'
          e.currentTarget.style.color = 'var(--rs-text)'
          e.currentTarget.style.transform = 'translateX(4px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--rs-border-hot)'
          e.currentTarget.style.color = 'var(--rs-text)'
          e.currentTarget.style.transform = 'translateX(0)'
        }}
      >
        &larr; BACK
      </button>

      <div className="flex gap-8 w-full h-full max-w-5xl p-8 pt-20">
        {/* LEFT: Ship Grid */}
        <div className="flex-1 overflow-y-auto">
          <div style={{ marginBottom: '24px' }}>
            <h2 style={S.title}>SELECT YOUR SHIP</h2>
            <div style={S.titleAccent} />
          </div>
          <div className="grid grid-cols-3 gap-4 p-1">
            {shipList.map((ship, i) => (
              <button
                key={ship.id}
                onClick={() => handleShipClick(ship.id)}
                disabled={ship.locked}
                onMouseEnter={(e) => {
                  if (!ship.locked) {
                    playSFX('button-hover')
                    setSelectedShipId(ship.id)
                    setFocusIndex(i)
                    e.currentTarget.style.borderColor = 'var(--rs-orange)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!ship.locked) {
                    e.currentTarget.style.borderColor = selectedShipIdRef.current === ship.id
                      ? 'var(--rs-orange)'
                      : 'var(--rs-border)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }
                }}
                style={ship.locked ? S.shipCardLocked : { ...S.shipCard, ...(selectedShipId === ship.id ? S.shipCardSelected : {}) }}
              >
                {/* Ship thumbnail */}
                <div className="aspect-square mb-2 flex items-center justify-center text-3xl overflow-hidden" style={{ backgroundColor: 'rgba(122, 109, 138, 0.05)' }}>
                  {ship.locked ? (
                    <span style={{
                      fontSize: 10,
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--rs-text-dim, rgba(255,255,255,0.3))',
                      letterSpacing: '0.05em',
                    }}>
                      LOCKED
                    </span>
                  ) : (
                    <ShipModelPreview modelPath={ship.modelPath} />
                  )}
                </div>
                <p className="font-semibold tracking-wide text-xs" style={{ color: 'var(--rs-text)' }}>{ship.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Ship Detail Panel */}
        <div style={S.detailPanel}>
          {/* Ship 3D Preview */}
          <div
            style={{ ...S.previewContainer, backgroundColor: `${selectedShip.colorTheme}10` }}
          >
            <ShipModelPreview modelPath={selectedSkinData?.modelPath ?? selectedShip.modelPath} rotate />
          </div>

          {/* Ship Name, Level Badge & Description */}
          <div className="flex items-baseline justify-between mb-2">
            <h3 style={S.shipName}>{selectedShip.name}</h3>
            {isMaxLevel
              ? <span style={S.maxBadge}>MAX</span>
              : <span style={S.levelBadge(selectedShip.colorTheme)}>{`LV.${shipLevel}`}</span>
            }
          </div>
          <p className="text-sm mb-2 leading-relaxed" style={{ color: 'var(--rs-text-muted)' }}>
            {selectedShip.description}
          </p>

          {/* Separator */}
          <div style={{ borderTop: '1px solid var(--rs-border)', marginBottom: '16px' }} />

          {/* Stats — Enriched with all 15 stats + permanent upgrade bonuses */}
          <div className="space-y-0.5 mb-3 max-h-52 overflow-y-auto">
            {/* Flat value stats — value = total effective stat, bonusValue = perm contribution only */}
            <StatLine compact
              label="HP"
              value={Math.round(effectiveStats.maxHP)}
              bonusValue={bonuses.maxHP}
              icon={HPIcon}
            />
            <StatLine compact
              label="REGEN"
              value={effectiveStats.regen > 0 ? `${effectiveStats.regen.toFixed(1)}/s` : '0/s'}
              bonusValue={bonuses.regen}
              icon={RegenColorIcon}
            />
            <StatLine compact
              label="ARMOR"
              value={effectiveStats.armor > 0 ? `+${effectiveStats.armor}` : '+0'}
              bonusValue={bonuses.armor}
              icon={ArmorColorIcon}
            />
            {/* Percentage stats — value = total effective %, bonusValue = perm contribution only */}
            <StatLine compact
              label="DAMAGE"
              value={effectiveStats.damageMultiplier > 1.0 ? `+${((effectiveStats.damageMultiplier - 1.0) * 100).toFixed(0)}%` : '+0%'}
              bonusValue={(bonuses.attackPower ?? 1.0) > 1.0 ? ((bonuses.attackPower - 1.0) * 100).toFixed(0) : undefined}
              icon={DamageIcon}
            />
            <StatLine compact
              label="ATTACK SPEED"
              value={effectiveStats.attackSpeed > 0 ? `+${effectiveStats.attackSpeed.toFixed(0)}%` : '+0%'}
              bonusValue={effectiveStats.attackSpeed > 0 ? effectiveStats.attackSpeed.toFixed(0) : undefined}
              icon={AttackSpeedIcon}
            />
            <StatLine compact
              label="ZONE"
              value={effectiveStats.zone > 0 ? `+${effectiveStats.zone.toFixed(0)}%` : '+0%'}
              bonusValue={effectiveStats.zone > 0 ? effectiveStats.zone.toFixed(0) : undefined}
              icon={ZoneColorIcon}
            />
            <StatLine compact
              label="SPEED"
              value={parseFloat(effectiveStats.speed.toFixed(1))}
              icon={SpeedStatIcon}
            />
            <StatLine compact
              label="MAGNET"
              value={effectiveStats.magnet > 0 ? `+${effectiveStats.magnet.toFixed(0)}%` : '+0%'}
              bonusValue={effectiveStats.magnet > 0 ? effectiveStats.magnet.toFixed(0) : undefined}
              icon={MagnetColorIcon}
            />
            <StatLine compact
              label="LUCK"
              value={effectiveStats.luck > 0 ? `+${effectiveStats.luck}%` : '+0%'}
              bonusValue={bonuses.luck}
              icon={LuckColorIcon}
            />
            <StatLine compact
              label="EXP BONUS"
              value={effectiveStats.expBonus > 0 ? `+${effectiveStats.expBonus.toFixed(0)}%` : '+0%'}
              bonusValue={effectiveStats.expBonus > 0 ? effectiveStats.expBonus.toFixed(0) : undefined}
              icon={ExpBonusIcon}
            />
            <StatLine compact
              label="CURSE"
              value={effectiveStats.curse > 0 ? `+${effectiveStats.curse}%` : '+0%'}
              bonusValue={bonuses.curse}
              icon={CurseIcon}
            />
            {/* Meta stats — flat values */}
            <StatLine compact
              label="REVIVAL"
              value={effectiveStats.revival}
              bonusValue={bonuses.revival}
              icon={RevivalIcon}
            />
            <StatLine compact
              label="REROLL"
              value={effectiveStats.reroll}
              bonusValue={bonuses.reroll}
              icon={RerollColorIcon}
            />
            <StatLine compact
              label="SKIP"
              value={effectiveStats.skip}
              bonusValue={bonuses.skip}
              icon={SkipColorIcon}
            />
            <StatLine compact
              label="BANISH"
              value={effectiveStats.banish}
              bonusValue={bonuses.banish}
              icon={BanishColorIcon}
            />
          </div>

          {/* Unique Traits */}
          {selectedShip.traits && selectedShip.traits.length > 0 && (
            <>
              <div style={{ borderTop: '1px solid var(--rs-border)', marginBottom: '12px' }} />
              <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--rs-text-muted)' }}>Traits</p>
              <div className="space-y-1.5 mb-4">
                {selectedShip.traits.map(traitId => {
                  const info = TRAIT_INFO[traitId]
                  if (!info) return null
                  const TraitIcon = TRAIT_ICON_MAP[traitId]
                  return (
                    <div key={traitId} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--rs-text)' }} title={info.description}>
                      <span className="flex-shrink-0">
                        {TraitIcon
                          ? <TraitIcon size={14} color="currentColor" />
                          : '·'
                        }
                      </span>
                      <span>{info.label}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Skin selector (Story 25.2) */}
          {(() => {
            const displaySkinId = hoveredSkinId ?? selectedSkinId
            const displaySkin = availableSkins.find(s => s.id === displaySkinId)
            return (
              <>
                <div style={{ borderTop: '1px solid var(--rs-border)', marginBottom: '12px' }} />
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--rs-text-muted)' }}>Skin</p>
                  {/* Fixed info line: name + lock condition */}
                  <div className="text-right">
                    <span className="text-[10px]" style={{ color: 'var(--rs-text)' }}>{displaySkin?.name}</span>
                    {displaySkin?.locked && (
                      <span className="ml-1.5 text-[10px]" style={{ color: 'var(--rs-text-muted)' }}>— LV.{displaySkin.requiredLevel} req.</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 mb-3">
                  {availableSkins.map(skin => (
                    <div
                      key={skin.id}
                      className="flex flex-col items-center gap-1"
                      onMouseEnter={() => setHoveredSkinId(skin.id)}
                      onMouseLeave={() => setHoveredSkinId(null)}
                    >
                      <button
                        onClick={() => handleSkinSelect(skin.id)}
                        className="w-8 h-8 border-2 transition-all flex-shrink-0"
                        style={{
                          ...(skin.tintColor ? { backgroundColor: skin.tintColor } : { backgroundColor: 'rgba(255,255,255,0.12)' }),
                          clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
                          borderColor: selectedSkinId === skin.id && !skin.locked
                            ? 'var(--rs-orange)'
                            : skin.locked
                              ? 'rgba(46,37,69,0.3)'
                              : 'rgba(46,37,69,0.5)',
                          boxShadow: selectedSkinId === skin.id && !skin.locked
                            ? '0 0 0 2px rgba(255,79,31,0.4)'
                            : 'none',
                          opacity: skin.locked ? 0.3 : 1,
                          cursor: skin.locked ? 'not-allowed' : 'pointer',
                          transform: selectedSkinId === skin.id && !skin.locked ? 'scale(1.1)' : undefined,
                        }}
                      />
                      <span className="text-[9px] leading-none h-3" style={{ color: 'var(--rs-text-muted)' }}>
                        {skin.locked ? `LV.${skin.requiredLevel}` : ''}
                      </span>
                    </div>
                  ))}
                </div>

              </>
            )
          })()}

          {/* Spacer */}
          <div className="flex-1" />

          {/* LEVEL UP button or MAX LEVEL badge */}
          {isMaxLevel ? (
            <div style={S.maxLevelDisplay}>
              ★ MAX LEVEL
            </div>
          ) : (
            <button
              onClick={handleLevelUp}
              disabled={!canAffordLevelUp}
              style={canAffordLevelUp ? S.btnLevelUp : S.btnLevelUpDisabled}
              onMouseEnter={canAffordLevelUp ? (e) => {
                playSFX('button-hover')
                e.currentTarget.style.transform = 'translateX(4px)'
                e.currentTarget.style.borderColor = 'var(--rs-teal)'
                e.currentTarget.style.color = 'var(--rs-text)'
              } : undefined}
              onMouseLeave={canAffordLevelUp ? (e) => {
                e.currentTarget.style.transform = 'translateX(0)'
                e.currentTarget.style.borderColor = 'var(--rs-teal)'
                e.currentTarget.style.color = 'var(--rs-teal)'
              } : undefined}
            >
              LEVEL UP ({nextLevelCost?.toLocaleString()} <FragmentIcon size={14} color="var(--rs-violet)" style={{ display: 'inline-block', verticalAlign: 'middle' }} />)
            </button>
          )}

          {/* SELECT button */}
          <button
            onClick={handleStart}
            style={S.btnSelect}
            onMouseEnter={(e) => {
              playSFX('button-hover')
              e.currentTarget.style.transform = 'translateX(4px)'
              e.currentTarget.style.background = 'rgba(255,79,31,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)'
              e.currentTarget.style.background = 'rgba(255,79,31,0.1)'
            }}
          >
            SELECT
          </button>
        </div>
      </div>
    </div>
  )
}
