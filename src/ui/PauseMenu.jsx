import { useState, useEffect, useCallback, useRef } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'
import useEnemies from '../stores/useEnemies.jsx'
import useLevel from '../stores/useLevel.jsx'
import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'
import { formatTimer } from './HUD.jsx'
import StatLine from './primitives/StatLine.jsx'
import { ShieldCrossIcon, ClockIcon, SkullIcon, StarIcon, FragmentIcon, SpeedIcon, SwordIcon, RerollIcon, SkipIcon, BanishIcon, LightningIcon, LuckIcon, MagnetIcon } from './icons/index.jsx'

// --- Exported logic helpers (testable without DOM) ---

export function shouldShowPauseMenu(phase, isPaused) {
  return (phase === 'gameplay' || phase === 'boss') && isPaused === true
}

export function getWeaponDisplayInfo(weapon) {
  const def = WEAPONS[weapon.weaponId]
  if (!def) return { name: 'Unknown', level: weapon.level, damage: 0, cooldown: 0, color: '#ffffff' }
  const damage = weapon.overrides?.damage ?? def.baseDamage
  const cooldown = weapon.overrides?.cooldown ?? def.baseCooldown
  return {
    name: def.name,
    level: weapon.level,
    damage,
    cooldown: cooldown ?? null,
    color: def.projectileColor,
  }
}

export function getBoonDisplayInfo(boon) {
  const def = BOONS[boon.boonId]
  if (!def) return { name: 'Unknown', level: boon.level, description: '', statPreview: '' }
  const tier = def.tiers?.[boon.level - 1]
  return {
    name: def.name,
    level: boon.level,
    description: tier?.description ?? def.effect?.description ?? '',
    statPreview: tier?.statPreview ?? '',
  }
}

export function getPlayerStats() {
  const player = usePlayer.getState()
  const boonMods = useBoons.getState().modifiers
  return {
    currentHP: player.currentHP,
    maxHP: player.maxHP,
    speed: player.shipBaseSpeed,
    damageMultiplier: boonMods.damageMultiplier ?? 1,
  }
}

export function getRunStats() {
  const game = useGame.getState()
  const player = usePlayer.getState()
  return {
    totalElapsedTime: game.totalElapsedTime,
    kills: game.kills,
    score: game.score,
    currentLevel: player.currentLevel,
    fragments: player.fragments,
  }
}

// --- Component ---

export default function PauseMenu() {
  const isPaused = useGame((s) => s.isPaused)
  const phase = useGame((s) => s.phase)
  const setPaused = useGame((s) => s.setPaused)
  const returnToMenu = useGame((s) => s.returnToMenu)

  const currentHP = usePlayer((s) => s.currentHP)
  const maxHP = usePlayer((s) => s.maxHP)
  const shipBaseSpeed = usePlayer((s) => s.shipBaseSpeed)
  const currentLevel = usePlayer((s) => s.currentLevel)
  const fragments = usePlayer((s) => s.fragments)
  const rerollCharges = usePlayer((s) => s.rerollCharges)
  const skipCharges = usePlayer((s) => s.skipCharges)
  const banishCharges = usePlayer((s) => s.banishCharges)

  const kills = useGame((s) => s.kills)
  const score = useGame((s) => s.score)
  const totalElapsedTime = useGame((s) => s.totalElapsedTime)

  const activeWeapons = useWeapons((s) => s.activeWeapons)
  const activeBoons = useBoons((s) => s.activeBoons)
  const damageMultiplier = useBoons((s) => s.modifiers?.damageMultiplier ?? 1)
  const speedMultiplier = useBoons((s) => s.modifiers?.speedMultiplier ?? 1)
  const cooldownMultiplier = useBoons((s) => s.modifiers?.cooldownMultiplier ?? 1)
  const critChance = useBoons((s) => s.modifiers?.critChance ?? 0)
  const xpMultiplier = useBoons((s) => s.modifiers?.xpMultiplier ?? 1)
  const fragmentMultiplier = useBoons((s) => s.modifiers?.fragmentMultiplier ?? 1)
  const pickupRadiusMultiplier = useBoons((s) => s.modifiers?.pickupRadiusMultiplier ?? 1)

  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const closingTimerRef = useRef(null)

  // Cleanup fade-out timeout on unmount
  useEffect(() => {
    return () => {
      if (closingTimerRef.current) clearTimeout(closingTimerRef.current)
    }
  }, [])

  const handleResume = useCallback(() => {
    if (isClosing) return // Guard against rapid spam
    setIsClosing(true)
    closingTimerRef.current = setTimeout(() => {
      setPaused(false)
      setIsClosing(false)
      closingTimerRef.current = null
    }, 150)
  }, [setPaused, isClosing])

  const handleQuit = useCallback(() => {
    setShowQuitConfirm(true)
  }, [])

  const handleConfirmQuit = useCallback(() => {
    usePlayer.getState().reset()
    useWeapons.getState().reset()
    useBoons.getState().reset()
    useEnemies.getState().reset()
    useLevel.getState().reset()
    returnToMenu()
    setShowQuitConfirm(false)
  }, [returnToMenu])

  const handleCancelQuit = useCallback(() => {
    setShowQuitConfirm(false)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!shouldShowPauseMenu(phase, isPaused)) return

    const handleKey = (e) => {
      if (showQuitConfirm) {
        // During confirmation dialog: ESC cancels, Enter confirms
        if (e.key === 'Escape') {
          setShowQuitConfirm(false)
        } else if (e.key === 'Enter') {
          handleConfirmQuit()
        }
        return
      }
      if (e.key === 'Escape' || e.key === 'r' || e.key === 'R') {
        handleResume()
      } else if (e.key === 'q' || e.key === 'Q') {
        setShowQuitConfirm(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase, isPaused, showQuitConfirm, handleResume, handleConfirmQuit])

  if (!shouldShowPauseMenu(phase, isPaused)) return null

  const equippedWeapons = activeWeapons.filter((w) => w)
  const equippedBoons = activeBoons.filter((b) => b)

  const sectionTitleStyle = {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.1em',
    color: 'var(--rs-text-muted)',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 0,
  }

  return (
    <div
      data-testid="pause-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(13, 11, 20, 0.85)',
        animation: isClosing ? 'fadeOut 150ms ease-out forwards' : 'fadeIn 150ms ease-out',
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      {/* Panel principal */}
      <div
        style={{
          width: 'clamp(640px, 65vw, 920px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--rs-bg-surface)',
          border: '1px solid var(--rs-border)',
          clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
          margin: '0 16px',
        }}
      >
        {/* Header : Titre + RESUME */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(32px, 3.5vw, 48px)',
              color: 'var(--rs-orange)',
              letterSpacing: '0.15em',
              margin: 0,
            }}
          >
            PAUSED
          </h1>
          <button
            data-testid="resume-button"
            onClick={handleResume}
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(13px, 1.3vw, 16px)',
              letterSpacing: '0.1em',
              color: 'var(--rs-teal)',
              border: '1px solid var(--rs-teal)',
              background: 'transparent',
              padding: '8px 20px',
              cursor: 'pointer',
            }}
          >
            [ESC/R] RESUME
          </button>
        </div>

        {/* Corps 2 volets */}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>

          {/* Volet gauche : Inventaire */}
          <div style={{ width: '45%', paddingRight: 20, borderRight: '1px solid var(--rs-border)' }}>

            {/* WEAPONS */}
            <p style={sectionTitleStyle}>WEAPONS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {equippedWeapons.map((weapon, idx) => {
                const info = getWeaponDisplayInfo(weapon)
                return (
                  <div
                    key={`${weapon.weaponId}-${idx}`}
                    style={{
                      borderLeft: `2px solid ${info.color}`,
                      paddingLeft: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 13, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: info.color }}>
                      {info.name}
                    </span>
                    <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: 'var(--rs-text-muted)' }}>
                      Lv{info.level} · {info.damage}dmg · {info.cooldown != null ? `${info.cooldown.toFixed(1)}s` : '—'}
                    </span>
                  </div>
                )
              })}
              {equippedWeapons.length === 0 && (
                <span style={{ color: 'var(--rs-text-dim)', fontSize: 12 }}>—</span>
              )}
            </div>

            {/* BOONS */}
            <p style={sectionTitleStyle}>BOONS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {equippedBoons.map((boon, idx) => {
                const info = getBoonDisplayInfo(boon)
                return (
                  <div
                    key={`${boon.boonId}-${idx}`}
                    style={{
                      borderLeft: '2px solid var(--rs-violet)',
                      paddingLeft: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 13, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: 'var(--rs-violet)' }}>
                      {info.name}
                    </span>
                    <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: 'var(--rs-text-muted)' }}>
                      Lv{info.level}{info.statPreview ? ` · ${info.statPreview}` : ''}
                    </span>
                  </div>
                )
              })}
              {equippedBoons.length === 0 && (
                <span style={{ color: 'var(--rs-text-dim)', fontSize: 12 }}>—</span>
              )}
            </div>
          </div>

          {/* Volet droit : Stats */}
          <div style={{ flex: 1, paddingLeft: 20 }}>

            {/* RUN STATS */}
            <p style={sectionTitleStyle}>RUN STATS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <StatLine label="Time"      value={formatTimer(totalElapsedTime)} icon={ClockIcon}     mono />
              <StatLine label="Kills"     value={kills.toLocaleString('en-US')}  icon={SkullIcon}    mono />
              <StatLine label="Score"     value={score.toLocaleString('en-US')}  icon={StarIcon}     mono />
              <StatLine label="Fragments" value={fragments.toLocaleString('en-US')} icon={FragmentIcon} mono />
            </div>

            <div style={{ borderTop: '1px solid var(--rs-border)', margin: '16px 0' }} />

            {/* PLAYER STATS */}
            <p style={sectionTitleStyle}>PLAYER STATS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StatLine label="HP"      value={`${Math.ceil(currentHP)} / ${maxHP}`}           icon={ShieldCrossIcon} mono />
              <StatLine label="Level"   value={String(currentLevel)}                             icon={StarIcon}        mono />
              <StatLine label="Speed"   value={`${shipBaseSpeed} ×${speedMultiplier.toFixed(2)}`} icon={SpeedIcon}       mono />
              <StatLine label="Dmg"     value={`×${damageMultiplier.toFixed(2)}`}               icon={SwordIcon}       mono />
              <StatLine label="CD"      value={`×${cooldownMultiplier.toFixed(2)}`}              icon={LightningIcon}   mono />
              {critChance > 0 && <StatLine label="Crit"   value={`${Math.round(critChance * 100)}%`}     icon={LuckIcon}        mono />}
              {xpMultiplier !== 1 && <StatLine label="XP"     value={`×${xpMultiplier.toFixed(2)}`}          icon={StarIcon}        mono />}
              {fragmentMultiplier !== 1 && <StatLine label="Frags"  value={`×${fragmentMultiplier.toFixed(2)}`}  icon={FragmentIcon}    mono />}
              {pickupRadiusMultiplier !== 1 && <StatLine label="Magnet" value={`×${pickupRadiusMultiplier.toFixed(2)}`} icon={MagnetIcon}      mono />}
              {rerollCharges > 0 && <StatLine label="Rerolls"  value={String(rerollCharges)}  icon={RerollIcon} mono />}
              {skipCharges   > 0 && <StatLine label="Skips"    value={String(skipCharges)}    icon={SkipIcon}   mono />}
              {banishCharges > 0 && <StatLine label="Banishes" value={String(banishCharges)}  icon={BanishIcon} mono />}
            </div>
          </div>
        </div>

        {/* Zone actions : QUIT seul */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button
            data-testid="quit-button"
            onClick={handleQuit}
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(13px, 1.3vw, 16px)',
              letterSpacing: '0.1em',
              color: 'var(--rs-danger)',
              border: '1px solid var(--rs-danger)',
              background: 'transparent',
              padding: '8px 24px',
              cursor: 'pointer',
            }}
          >
            [Q] QUIT TO MENU
          </button>
        </div>
      </div>

      {/* Quit Confirmation Dialog */}
      {showQuitConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
        >
          <div
            style={{
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
              backgroundColor: 'var(--rs-bg-surface)',
              border: '1px solid var(--rs-border)',
              padding: '24px',
              maxWidth: '28rem',
              margin: '0 16px',
              animation: 'fadeIn 150ms ease-out',
            }}
          >
            <h2
              style={{ fontSize: 'clamp(18px, 2vw, 24px)', color: 'var(--rs-danger)', margin: '0 0 16px 0', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: '0.05em' }}
            >
              Quit to menu?
            </h2>
            <p style={{ color: 'var(--rs-text)', fontSize: 'clamp(13px, 1.3vw, 16px)', margin: '0 0 24px 0' }}>
              Progress will be lost.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                data-testid="confirm-quit-button"
                onClick={handleConfirmQuit}
                className="px-6 py-2 font-bold transition-colors"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
                  backgroundColor: 'var(--rs-danger)',
                  color: '#fff',
                  fontSize: 'clamp(13px, 1.3vw, 16px)',
                }}
              >
                Confirm
              </button>
              <button
                data-testid="cancel-quit-button"
                onClick={handleCancelQuit}
                className="px-6 py-2 font-bold transition-colors"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
                  backgroundColor: 'transparent',
                  color: 'var(--rs-text)',
                  border: '1px solid var(--rs-border)',
                  fontSize: 'clamp(13px, 1.3vw, 16px)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
