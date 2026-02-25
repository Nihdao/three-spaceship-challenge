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
  card: (rarityColor, animDelay) => ({
    position: 'relative',
    padding: 12,
    background: 'var(--rs-bg-raised)',
    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
    borderLeft: `3px solid ${rarityColor}`,
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
  rarityBadge: (rarityColor) => ({
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 11,
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    color: '#000',
    backgroundColor: rarityColor,
    clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
  }),
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
  const rewardTier = useGame((s) => s.rewardTier)
  const tierColor = TIER_COLORS[rewardTier] || '#ffffff'
  const tierLabel = TIER_LABELS[rewardTier] || rewardTier

  // Generate choices on mount
  useEffect(() => {
    const equippedWeapons = useWeapons.getState().activeWeapons.map(w => ({ weaponId: w.weaponId, level: w.level }))
    const equippedBoonIds = useBoons.getState().activeBoons.map(b => b.boonId)
    const equippedBoons = useBoons.getState().getEquippedBoons()
    const banishedItems = useLevel.getState().banishedItems
    const luckStat = (usePlayer.getState().getLuckStat?.() ?? 0) + (useBoons.getState().modifiers.luckBonus ?? 0)
    setChoices(generatePlanetReward(rewardTier, equippedWeapons, equippedBoonIds, equippedBoons, banishedItems, luckStat))
  }, [rewardTier])

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
    <div style={S.overlay}>
      {/* ── Conteneur 2 colonnes ── */}
      <div style={S.container}>

        {/* ── Colonne gauche : Scan Info ── */}
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
              const rarityTier = getRarityTier(choice.rarity || 'COMMON')
              const isCommon = !choice.rarity || choice.rarity === 'COMMON'

              return (
                <div
                  key={`${choice.type}_${choice.id}`}
                  style={S.card(rarityTier.color, i * 50)}
                  className="animate-fade-in"
                  onClick={() => applyChoice(choice)}
                  onMouseEnter={(e) => {
                    playSFX('button-hover')
                    e.currentTarget.style.borderColor = 'var(--rs-border-hot)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = rarityTier.color
                  }}
                >
                  {/* Top row: rarity badge + level/NEW + shortcut [1-3] */}
                  <div style={S.topRow}>
                    {!isCommon && (
                      <span style={S.rarityBadge(rarityTier.color)}>
                        {rarityTier.name.toUpperCase()}
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: choice.level ? 400 : 700,
                      color: choice.level ? 'var(--rs-text-muted)' : (isCommon ? tierColor : rarityTier.color),
                    }}>
                      {choice.level ? `Lvl ${choice.level}` : 'NEW'}
                    </span>
                    {i < 3 && (
                      <span style={S.shortcutKey}>[{i + 1}]</span>
                    )}
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
