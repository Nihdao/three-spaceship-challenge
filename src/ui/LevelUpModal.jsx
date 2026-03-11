import { useEffect, useState, useCallback, useRef } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'
import useArmory from '../stores/useArmory.jsx'
import useLevel from '../stores/useLevel.jsx'
import { generateChoices } from '../systems/progressionSystem.js'
import { SHIPS } from '../entities/shipDefs.js'
import { playSFX } from '../audio/audioManager.js'
import StatLine from './primitives/StatLine.jsx'
import { ShieldCrossIcon, SwordIcon, SpeedIcon, StarIcon, LightningIcon } from './icons/index.jsx'

const HPIconColor     = () => <ShieldCrossIcon size={14} color="var(--rs-hp)" />
const DmgIconColor    = () => <SwordIcon       size={14} color="var(--rs-orange)" />
const SpdIconColor    = () => <SpeedIcon       size={14} color="var(--rs-teal)" />
const LvlIconColor    = () => <StarIcon        size={14} color="var(--rs-gold)" />
const AtkSpdIconColor = () => <LightningIcon   size={14} color="var(--rs-orange)" />

function getChoiceAccentColor(type) {
  if (type === 'new_weapon' || type === 'weapon_upgrade') return 'var(--rs-teal)'
  if (type === 'new_boon' || type === 'boon_upgrade') return 'var(--rs-orange)'
  return 'var(--rs-gold)' // stat_boost
}

export default function LevelUpModal() {
  const [choices, setChoices] = useState([])
  const [banishingIndex, setBanishingIndex] = useState(null)
  const [banishMode, setBanishMode] = useState(false)
  const isBanishingRef = useRef(false)
  const rerollCharges = usePlayer(s => s.rerollCharges)
  const skipCharges = usePlayer(s => s.skipCharges)
  const banishCharges = usePlayer(s => s.banishCharges)
  const currentHP = usePlayer(s => s.currentHP)
  const maxHP = usePlayer(s => s.maxHP)
  const currentLevel = usePlayer(s => s.currentLevel)
  const shipBaseSpeed = usePlayer(s => s.shipBaseSpeed)
  const activeWeaponsCount = useWeapons(s => s.activeWeapons.length)
  const activeBoonsCount = useBoons(s => s.activeBoons.length)
  const damageMultiplier = useBoons(s => s.modifiers?.damageMultiplier ?? 1)
  const cooldownMultiplier = useBoons(s => s.modifiers?.cooldownMultiplier ?? 1)

  // Shared helper: get current equipped state and generate choices
  const buildChoices = useCallback((banishedItems) => {
    const level = usePlayer.getState().currentLevel
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
    // Story 22.3: Include luck stat for rarity roll (boon luckBonus + ship + permanent)
    const luckStat = (usePlayer.getState().getLuckStat?.() ?? 0) + (boonModifiers.luckBonus ?? 0)
    const preferredBoonIds = SHIPS[playerState.currentShipId]?.preferredBoonIds ?? []
    return generateChoices(level, equippedWeapons, equippedBoonIds, equippedBoons, banishedItems, luckStat, preferredBoonIds)
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
    } else if (choice.type === 'stat_boost') {
      usePlayer.getState().applyStatBoost(choice.statType, choice.statValue)
    } else if (choice.type === 'fragment_bonus') {
      usePlayer.getState().addFragments(30)
    } else if (choice.type === 'heal_bonus') {
      usePlayer.getState().healFromGem(25)
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

  const enterBanishMode = useCallback(() => {
    if (usePlayer.getState().banishCharges <= 0) return
    playSFX('button-click')
    setBanishMode(true)
  }, [])

  const cancelBanishMode = useCallback(() => {
    playSFX('button-click')
    setBanishMode(false)
  }, [])

  const handleCardClick = useCallback((choice, index) => {
    if (banishMode) {
      if (choice.type === 'stat_boost' || choice.type === 'fragment_bonus' || choice.type === 'heal_bonus') return
      setBanishMode(false)
      handleBanish(choice, index)
    } else {
      applyChoice(choice)
    }
  }, [banishMode, handleBanish, applyChoice])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(13,11,20,0.88)', fontFamily: "'Rajdhani', sans-serif" }}>
      {/* Conteneur 2 colonnes avec responsive wrap */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 24,
        alignItems: 'flex-start',
        maxWidth: 980,
        padding: 24,
        background: 'var(--rs-bg-surface)',
        border: '1px solid var(--rs-border)',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
      }}>

        {/* ── Colonne gauche : Build Overview ── */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <p style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.12em',
            color: 'var(--rs-text-muted)',
            marginBottom: 12,
            textTransform: 'uppercase',
          }}>
            Current Build
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StatLine compact label="HP"     value={`${Math.round(currentHP)} / ${Math.round(maxHP)}`} icon={HPIconColor} />
            <StatLine compact label="LEVEL"  value={String(currentLevel)} icon={LvlIconColor} />
            <StatLine compact label="SPEED"  value={shipBaseSpeed.toFixed(1)} icon={SpdIconColor} />
            <StatLine compact label="DAMAGE" value={damageMultiplier >= 1.0 ? `+${((damageMultiplier - 1.0) * 100).toFixed(0)}%` : '+0%'} icon={DmgIconColor} />
            {cooldownMultiplier < 1.0 && (
              <StatLine compact label="ATK SPD" value={`+${((1.0 - cooldownMultiplier) * 100).toFixed(0)}%`} icon={AtkSpdIconColor} />
            )}
          </div>

          <p style={{ fontSize: 13, color: 'var(--rs-text-dim)', marginTop: 6, fontFamily: "'Space Mono', monospace" }}>
            Weapons: {activeWeaponsCount} · Boons: {activeBoonsCount}
          </p>

          <div style={{ borderTop: '1px solid var(--rs-border)', margin: '16px 0' }} />

          {rerollCharges > 0 && (
            <button
              type="button"
              onClick={handleReroll}
              className="w-full mb-2 px-4 py-2 font-bold tracking-wider transition-all cursor-pointer"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: '0.1em',
                color: 'var(--rs-teal, #00b4d8)',
                border: '1px solid var(--rs-teal, #00b4d8)',
                background: 'transparent',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
              }}
            >
              REROLL ({rerollCharges})
            </button>
          )}

          {skipCharges > 0 && (
            <button
              type="button"
              onClick={handleSkip}
              className="w-full mb-2 px-4 py-2 font-bold tracking-wider transition-all cursor-pointer"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: '0.1em',
                color: 'var(--rs-gold, #ffd60a)',
                border: '1px solid var(--rs-gold, #ffd60a)',
                background: 'transparent',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
              }}
            >
              SKIP ({skipCharges})
            </button>
          )}

          {banishCharges > 0 && (
            <button
              type="button"
              onClick={banishMode ? cancelBanishMode : enterBanishMode}
              className="w-full px-4 py-2 font-bold tracking-wider transition-all cursor-pointer"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: '0.1em',
                color: 'var(--rs-danger)',
                border: '1px solid var(--rs-danger)',
                background: banishMode ? 'rgba(239,35,60,0.12)' : 'transparent',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
                transition: 'background 150ms, color 150ms',
              }}
            >
              {banishMode ? 'CANCEL' : `BANISH (${banishCharges})`}
            </button>
          )}
        </div>

        {/* ── Colonne droite : Titre + Cards verticales ── */}
        <div style={{ flex: 1, minWidth: 400, paddingBottom: 16 }}>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3.5rem', letterSpacing: '0.15em', color: 'var(--rs-text)', margin: 0 }}>
            LEVEL UP!
          </h1>
          <div style={{ width: 32, height: 2, background: 'var(--rs-orange)', marginTop: 6, marginBottom: 16 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {choices.map((choice, i) => {
              const accentColor = getChoiceAccentColor(choice.type)
              const isBanishable = choice.type !== 'stat_boost' && choice.type !== 'fragment_bonus' && choice.type !== 'heal_bonus'
              const cardBorderColor = banishMode
                ? (isBanishable ? 'var(--rs-danger)' : 'var(--rs-border)')
                : accentColor
              const cardOpacity = banishingIndex === i
                ? 0.2
                : (banishMode && !isBanishable ? 0.35 : 1)

              return (
                <div
                  key={`${choice.type}_${choice.id}_${i}`}
                  className="relative p-3 animate-fade-in"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    animationFillMode: 'backwards',
                    opacity: cardOpacity,
                    transform: banishingIndex === i ? 'scale(0.95)' : undefined,
                    transition: 'opacity 200ms ease-out, transform 200ms ease-out, border-left-color 150ms, background 150ms',
                    borderLeft: `3px solid ${cardBorderColor}`,
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                    backgroundColor: banishMode && isBanishable
                      ? 'rgba(239,35,60,0.06)'
                      : 'var(--rs-bg-raised)',
                    cursor: banishMode
                      ? (isBanishable ? 'crosshair' : 'not-allowed')
                      : 'pointer',
                  }}
                  onClick={() => handleCardClick(choice, i)}
                >
                  {/* Top row: level/NEW + rarity badge or BANISH label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span className="text-sm" style={{ color: choice.level ? 'var(--rs-text-muted)' : accentColor, fontWeight: choice.level ? undefined : 700 }}>
                      {choice.level ? `Lv${choice.level}` : 'NEW'}
                    </span>
                    {!banishMode && isBanishable && choice.rarity !== 'COMMON' && (
                      <span style={{
                        marginLeft: 'auto',
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        color: choice.rarityColor,
                        letterSpacing: '0.08em',
                      }}>
                        {choice.rarityName}
                      </span>
                    )}
                    {banishMode && isBanishable && (
                      <span style={{
                        marginLeft: 'auto',
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 13,
                        color: 'var(--rs-danger)',
                        letterSpacing: '0.08em',
                      }}>
                        BANISH
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-sm" style={{ color: 'var(--rs-text)' }}>{choice.name}</h3>
                  {choice.type === 'new_weapon' ? (
                    <>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--rs-text-muted)' }}>
                        {choice.description || choice.name}
                      </p>
                      {choice.statPreview && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--rs-text-dim)', fontFamily: "'Space Mono', monospace" }}>
                          {choice.statPreview}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm mt-0.5" style={{ color: 'var(--rs-text-muted)' }}>
                      {choice.statPreview ?? choice.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>

    </div>
  )
}
