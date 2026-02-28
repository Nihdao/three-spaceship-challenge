import { useEffect, useState, useCallback, useRef } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'
import useArmory from '../stores/useArmory.jsx'
import useLevel from '../stores/useLevel.jsx'
import { generatePlanetReward } from '../systems/progressionSystem.js'
import { playSFX } from '../audio/audioManager.js'

function getChoiceAccentColor(type) {
  if (type === 'new_weapon' || type === 'weapon_upgrade') return 'var(--rs-teal)'
  if (type === 'new_boon' || type === 'boon_upgrade') return 'var(--rs-orange)'
  return 'var(--rs-gold)'
}

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

const TIER_FLAVOR = {
  standard: 'Mineral deposits detected. Basic loot available.',
  rare:     'Anomalous readings. Rare tech signature.',
  legendary:'Void energy surge. Legendary cache found.',
}

// Centralized styles (Task 9 — const S pattern)
const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(13,11,20,0.88)',
  },
  container: {
    display: 'flex',
    gap: 24,
    alignItems: 'flex-start',
    maxWidth: 720,
    padding: 24,
    background: 'var(--rs-bg-surface)',
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
  },
  leftCol: {
    width: 200,
    flexShrink: 0,
  },
  sectionLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    color: 'var(--rs-text-muted)',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  separator: {
    borderTop: '1px solid var(--rs-border)',
    margin: '12px 0',
  },
  flavorText: {
    fontSize: 10,
    color: 'var(--rs-text-dim)',
    fontFamily: "'Space Mono', monospace",
    lineHeight: 1.5,
  },
  rightCol: {
    flex: 1,
    minWidth: 280,
  },
  titleAccent: (tierColor) => ({
    width: '32px',
    height: '2px',
    background: tierColor,
    marginTop: '6px',
    marginBottom: '20px',
  }),
  cardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  card: (accentColor, animDelay) => ({
    position: 'relative',
    padding: 12,
    background: 'var(--rs-bg-raised)',
    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
    borderLeft: `3px solid ${accentColor}`,
    cursor: 'pointer',
    animationDelay: `${animDelay}ms`,
    animationFillMode: 'backwards',
  }),
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  shortcutKey: {
    marginLeft: 'auto',
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: 'var(--rs-text-dim)',
  },
  cardTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: '0.95rem',
    color: 'var(--rs-text)',
    marginTop: 4,
  },
  cardDesc: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.8rem',
    color: 'var(--rs-text-muted)',
    marginTop: 2,
  },
}

export default function PlanetRewardModal() {
  const [choices, setChoices] = useState([])
  const [banishMode, setBanishMode] = useState(false)
  const [banishingIndex, setBanishingIndex] = useState(null)
  const isBanishingRef = useRef(false)
  const rewardTier = useGame((s) => s.rewardTier)
  const rerollCharges = usePlayer(s => s.rerollCharges)
  const skipCharges = usePlayer(s => s.skipCharges)
  const banishCharges = usePlayer(s => s.banishCharges)
  const tierColor = TIER_COLORS[rewardTier] || '#ffffff'
  const tierLabel = TIER_LABELS[rewardTier] || rewardTier

  const buildChoices = useCallback((tier, banishedItems) => {
    const playerState = usePlayer.getState()
    const boonModifiers = useBoons.getState().modifiers
    const upgradeStats = playerState.upgradeStats ?? {}
    const dilemmaStats = playerState.dilemmaStats ?? {}
    const perms = playerState.permanentUpgradeBonuses ?? {}
    const globalDamageMult =
      (boonModifiers.damageMultiplier ?? 1) *
      (upgradeStats.damageMult ?? 1) *
      (dilemmaStats.damageMult ?? 1) *
      (playerState.shipBaseDamageMultiplier ?? 1) *
      (perms.attackPower ?? 1)
    const globalCooldownMult =
      (boonModifiers.cooldownMultiplier ?? 1) *
      (upgradeStats.cooldownMult ?? 1) *
      (dilemmaStats.cooldownMult ?? 1) *
      (perms.attackSpeed ?? 1)
    const equippedWeapons = useWeapons.getState().activeWeapons.map(w => ({
      weaponId: w.weaponId,
      level: w.level,
      multipliers: w.multipliers,
      globalDamageMult,
      globalCooldownMult,
    }))
    const equippedBoonIds = useBoons.getState().activeBoons.map(b => b.boonId)
    const equippedBoons = useBoons.getState().getEquippedBoons()
    const luckStat = (playerState.getLuckStat?.() ?? 0) + (boonModifiers.luckBonus ?? 0)
    return generatePlanetReward(tier, equippedWeapons, equippedBoonIds, equippedBoons, banishedItems, luckStat)
  }, [])

  // Generate choices on mount
  useEffect(() => {
    const banishedItems = useLevel.getState().banishedItems
    setChoices(buildChoices(rewardTier, banishedItems))
  }, [rewardTier, buildChoices])

  const handleReroll = useCallback(() => {
    if (usePlayer.getState().rerollCharges <= 0) return
    playSFX('button-click')
    usePlayer.getState().consumeReroll()
    const banishedItems = useLevel.getState().banishedItems
    setChoices(buildChoices(rewardTier, banishedItems))
  }, [buildChoices, rewardTier])

  const handleSkip = useCallback(() => {
    if (usePlayer.getState().skipCharges <= 0) return
    playSFX('button-click')
    usePlayer.getState().consumeSkip()
    useGame.getState().resumeGameplay()
  }, [])

  const handleBanish = useCallback((choice, index) => {
    if (isBanishingRef.current) return
    if (usePlayer.getState().banishCharges <= 0) return
    isBanishingRef.current = true
    playSFX('button-click')
    usePlayer.getState().consumeBanish()
    const type = (choice.type === 'new_weapon' || choice.type === 'weapon_upgrade') ? 'weapon' : 'boon'
    useLevel.getState().addBanishedItem(choice.id, type)
    setBanishingIndex(index)
    setTimeout(() => {
      isBanishingRef.current = false
      setBanishingIndex(null)
      useGame.getState().resumeGameplay()
    }, 200)
  }, [])

  const enterBanishMode = useCallback(() => {
    if (usePlayer.getState().banishCharges <= 0) return
    playSFX('button-click')
    setBanishMode(true)
  }, [])

  const cancelBanishMode = useCallback(() => {
    playSFX('button-click')
    setBanishMode(false)
  }, [])

  const applyChoice = useCallback((choice) => {
    playSFX('button-click')
    const rarity = choice.rarity || 'COMMON'
    if (choice.type === 'weapon_upgrade') {
      useWeapons.getState().upgradeWeapon(choice.id, choice.upgradeResult)
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

  const handleCardClick = useCallback((choice, index) => {
    if (banishMode) {
      if (choice.type === 'stat_boost') return
      setBanishMode(false)
      handleBanish(choice, index)
    } else {
      applyChoice(choice)
    }
  }, [banishMode, handleBanish, applyChoice])


  return (
    <div style={S.overlay}>
      {/* ── Conteneur 2 colonnes ── */}
      <div style={S.container}>

        {/* ── Colonne gauche : Scan Info + Actions ── */}
        <div style={S.leftCol}>
          <p style={S.sectionLabel}>Scan Info</p>

          {/* Pill tier coloré */}
          <div style={{
            display: 'inline-block',
            padding: '4px 10px',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '0.9rem',
            color: tierColor,
            backgroundColor: `${tierColor}18`,
            clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
            letterSpacing: '0.1em',
          }}>
            {tierLabel}
          </div>

          <div style={S.separator} />

          {/* Flavor text selon tier */}
          <p style={S.flavorText}>
            {TIER_FLAVOR[rewardTier] || TIER_FLAVOR.standard}
          </p>

          {(rerollCharges > 0 || skipCharges > 0 || banishCharges > 0) && (
            <div style={S.separator} />
          )}

          {rerollCharges > 0 && (
            <button
              type="button"
              onClick={handleReroll}
              style={{
                display: 'block',
                width: '100%',
                marginBottom: 8,
                padding: '6px 12px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.1em',
                color: 'var(--rs-teal, #00b4d8)',
                border: '1px solid var(--rs-teal, #00b4d8)',
                background: 'transparent',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
                cursor: 'pointer',
              }}
            >
              REROLL ({rerollCharges})
            </button>
          )}

          {skipCharges > 0 && (
            <button
              type="button"
              onClick={handleSkip}
              style={{
                display: 'block',
                width: '100%',
                marginBottom: 8,
                padding: '6px 12px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.1em',
                color: 'var(--rs-gold, #ffd60a)',
                border: '1px solid var(--rs-gold, #ffd60a)',
                background: 'transparent',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
                cursor: 'pointer',
              }}
            >
              SKIP ({skipCharges})
            </button>
          )}

          {banishCharges > 0 && (
            <button
              type="button"
              onClick={banishMode ? cancelBanishMode : enterBanishMode}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 12px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.1em',
                color: 'var(--rs-danger)',
                border: '1px solid var(--rs-danger)',
                background: banishMode ? 'rgba(239,35,60,0.12)' : 'transparent',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
            >
              {banishMode ? 'CANCEL' : `BANISH (${banishCharges})`}
            </button>
          )}
        </div>

        {/* ── Colonne droite : Titre + Cards verticales ── */}
        <div style={S.rightCol}>
          <h1 style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '2.5rem',
            letterSpacing: '0.15em',
            color: 'var(--rs-text)',
            margin: 0,
            lineHeight: 1,
          }}>
            PLANET SCANNED!
          </h1>
          <div style={S.titleAccent(tierColor)} />

          <div style={S.cardsContainer}>
            {choices.map((choice, i) => {
              const accentColor = getChoiceAccentColor(choice.type)
              const isBanishable = choice.type !== 'stat_boost'
              const cardBorderColor = banishMode
                ? (isBanishable ? 'var(--rs-danger)' : 'var(--rs-border)')
                : accentColor
              const cardOpacity = banishingIndex === i
                ? 0.2
                : (banishMode && !isBanishable ? 0.35 : 1)

              return (
                <div
                  key={`${choice.type}_${choice.id}`}
                  style={{
                    ...S.card(accentColor, i * 50),
                    borderLeft: `3px solid ${cardBorderColor}`,
                    opacity: cardOpacity,
                    transform: banishingIndex === i ? 'scale(0.95)' : undefined,
                    transition: 'opacity 200ms ease-out, transform 200ms ease-out, border-left-color 150ms, background 150ms',
                    backgroundColor: banishMode && isBanishable
                      ? 'rgba(239,35,60,0.06)'
                      : 'var(--rs-bg-raised)',
                    cursor: banishMode
                      ? (isBanishable ? 'crosshair' : 'not-allowed')
                      : 'pointer',
                  }}
                  className="animate-fade-in"
                  onClick={() => handleCardClick(choice, i)}
                  onMouseEnter={(e) => {
                    playSFX('button-hover')
                    if (!banishMode) e.currentTarget.style.borderLeftColor = 'var(--rs-border-hot)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderLeftColor = cardBorderColor
                  }}
                >
                  {/* Top row: level/NEW + shortcut ou BANISH label */}
                  <div style={S.topRow}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: choice.level ? 400 : 700,
                      color: choice.level ? 'var(--rs-text-muted)' : accentColor,
                    }}>
                      {choice.level ? `Lvl ${choice.level}` : 'NEW'}
                    </span>
                    {banishMode && isBanishable ? (
                      <span style={{ marginLeft: 'auto', fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--rs-danger)', letterSpacing: '0.08em' }}>
                        BANISH
                      </span>
                    ) : i < 3 ? (
                      <span style={S.shortcutKey}>[{i + 1}]</span>
                    ) : null}
                  </div>

                  <h3 style={S.cardTitle}>{choice.name}</h3>
                  <p style={S.cardDesc}>
                    {choice.statPreview ?? choice.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
