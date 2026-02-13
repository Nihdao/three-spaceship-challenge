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

// --- Exported logic helpers (testable without DOM) ---

export function shouldShowPauseMenu(phase, isPaused) {
  return phase === 'gameplay' && isPaused === true
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
    cooldown,
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

  const kills = useGame((s) => s.kills)
  const score = useGame((s) => s.score)
  const totalElapsedTime = useGame((s) => s.totalElapsedTime)

  const activeWeapons = useWeapons((s) => s.activeWeapons)
  const activeBoons = useBoons((s) => s.activeBoons)
  const damageMultiplier = useBoons((s) => s.modifiers?.damageMultiplier ?? 1)

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

  return (
    <div
      data-testid="pause-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center font-game"
      style={{
        backgroundColor: 'rgba(0,0,0,0.6)',
        animation: isClosing ? 'fadeOut 150ms ease-out forwards' : 'fadeIn 150ms ease-out',
      }}
    >
      {/* Main pause modal */}
      <div
        className="border rounded-lg shadow-2xl mx-4 p-6"
        style={{
          width: 'clamp(320px, 40vw, 720px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--color-game-bg)',
          borderColor: 'var(--color-game-border)',
        }}
      >
        {/* Title */}
        <h1
          className="font-bold text-center mb-6"
          style={{ fontSize: 'clamp(28px, 3vw, 40px)', color: 'var(--color-game-text)' }}
        >
          PAUSED
        </h1>

        {/* Inventory Section */}
        <section className="mb-6" aria-label="inventory">
          <h2
            className="font-bold mb-3"
            style={{ fontSize: 'clamp(18px, 2vw, 24px)', color: 'var(--color-game-text)' }}
          >
            INVENTORY
          </h2>

          {/* Weapons */}
          <div className="mb-3">
            <h3
              className="font-semibold mb-1.5"
              style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', color: 'var(--color-game-text-muted)' }}
            >
              WEAPONS
            </h3>
            <div className="flex flex-wrap gap-2">
              {equippedWeapons.map((weapon, idx) => {
                const info = getWeaponDisplayInfo(weapon)
                return (
                  <div
                    key={`${weapon.weaponId}-${idx}`}
                    className="flex flex-col items-center justify-center rounded"
                    style={{
                      width: 'clamp(72px, 7vw, 100px)',
                      padding: 'clamp(4px, 0.4vw, 8px)',
                      backgroundColor: `${info.color}15`,
                      border: `1px solid ${info.color}30`,
                    }}
                  >
                    <span className="font-bold truncate leading-tight" style={{ fontSize: 'clamp(9px, 0.9vw, 12px)', color: info.color }}>
                      {info.name}
                    </span>
                    <span className="tabular-nums leading-tight" style={{ fontSize: 'clamp(8px, 0.8vw, 10px)', color: 'var(--color-game-text-muted)' }}>
                      Lv{info.level}
                    </span>
                    <span className="tabular-nums leading-tight" style={{ fontSize: 'clamp(7px, 0.7vw, 9px)', color: 'var(--color-game-text-muted)' }}>
                      {info.damage}dmg {info.cooldown.toFixed(1)}s
                    </span>
                  </div>
                )
              })}
              {equippedWeapons.length === 0 && (
                <span style={{ color: 'var(--color-game-text-muted)', fontStyle: 'italic', fontSize: 'clamp(10px, 1vw, 13px)' }}>
                  No weapons equipped
                </span>
              )}
            </div>
          </div>

          {/* Boons */}
          <div>
            <h3
              className="font-semibold mb-1.5"
              style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', color: 'var(--color-game-text-muted)' }}
            >
              BOONS
            </h3>
            <div className="flex flex-wrap gap-2">
              {equippedBoons.map((boon, idx) => {
                const info = getBoonDisplayInfo(boon)
                return (
                  <div
                    key={`${boon.boonId}-${idx}`}
                    className="flex flex-col items-center justify-center rounded"
                    style={{
                      width: 'clamp(72px, 7vw, 100px)',
                      padding: 'clamp(4px, 0.4vw, 8px)',
                      backgroundColor: 'rgba(255, 20, 147, 0.1)',
                      border: '1px solid rgba(255, 20, 147, 0.2)',
                    }}
                  >
                    <span className="font-bold truncate leading-tight" style={{ fontSize: 'clamp(9px, 0.9vw, 12px)', color: 'rgba(255, 182, 219, 1)' }}>
                      {info.name}
                    </span>
                    <span className="tabular-nums leading-tight" style={{ fontSize: 'clamp(8px, 0.8vw, 10px)', color: 'var(--color-game-text-muted)' }}>
                      Lv{info.level}
                    </span>
                    {info.statPreview && (
                      <span className="leading-tight text-center" style={{ fontSize: 'clamp(7px, 0.7vw, 9px)', color: 'var(--color-game-text-muted)' }}>
                        {info.statPreview}
                      </span>
                    )}
                  </div>
                )
              })}
              {equippedBoons.length === 0 && (
                <span style={{ color: 'var(--color-game-text-muted)', fontStyle: 'italic', fontSize: 'clamp(10px, 1vw, 13px)' }}>
                  No boons equipped
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-6" aria-label="stats">
          <h2
            className="font-bold mb-3"
            style={{ fontSize: 'clamp(18px, 2vw, 24px)', color: 'var(--color-game-text)' }}
          >
            STATS
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <StatLine label="HP" value={`${Math.ceil(currentHP)} / ${maxHP}`} icon="❤️" />
            <StatLine label="Level" value={String(currentLevel)} icon="🎖️" />
            <StatLine label="Speed" value={String(shipBaseSpeed)} icon="⚡" />
            <StatLine label="Damage Mult" value={`×${damageMultiplier.toFixed(2)}`} icon="🗡️" />
            <StatLine label="Time" value={formatTimer(totalElapsedTime)} icon="⏱️" />
            <StatLine label="Kills" value={kills.toLocaleString('en-US')} icon="💀" />
            <StatLine label="Score" value={score.toLocaleString('en-US')} icon="⭐" />
            <StatLine label="Fragments" value={fragments.toLocaleString('en-US')} icon="◆" />
          </div>
        </section>

        {/* Actions Section */}
        <section className="flex gap-4 justify-center" aria-label="actions">
          <button
            data-testid="resume-button"
            onClick={handleResume}
            className="px-6 py-3 font-bold rounded transition-colors"
            style={{
              backgroundColor: 'var(--color-game-primary)',
              color: '#000',
              fontSize: 'clamp(14px, 1.4vw, 18px)',
            }}
          >
            [ESC/R] RESUME
          </button>
          <button
            data-testid="quit-button"
            onClick={handleQuit}
            className="px-6 py-3 font-bold rounded transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-game-danger)',
              border: '2px solid var(--color-game-danger)',
              fontSize: 'clamp(14px, 1.4vw, 18px)',
            }}
          >
            [Q] QUIT TO MENU
          </button>
        </section>
      </div>

      {/* Quit Confirmation Dialog */}
      {showQuitConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
        >
          <div
            className="rounded-lg p-6 max-w-md mx-4"
            style={{
              backgroundColor: 'var(--color-game-bg)',
              border: '2px solid var(--color-game-danger)',
              animation: 'fadeIn 150ms ease-out',
            }}
          >
            <h2
              className="font-bold mb-4"
              style={{ fontSize: 'clamp(18px, 2vw, 24px)', color: 'var(--color-game-danger)' }}
            >
              Quit to menu?
            </h2>
            <p className="mb-6" style={{ color: 'var(--color-game-text)', fontSize: 'clamp(13px, 1.3vw, 16px)' }}>
              Progress will be lost.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                data-testid="confirm-quit-button"
                onClick={handleConfirmQuit}
                className="px-6 py-2 font-bold rounded transition-colors"
                style={{
                  backgroundColor: 'var(--color-game-danger)',
                  color: '#fff',
                  fontSize: 'clamp(13px, 1.3vw, 16px)',
                }}
              >
                Confirm
              </button>
              <button
                data-testid="cancel-quit-button"
                onClick={handleCancelQuit}
                className="px-6 py-2 font-bold rounded transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-game-text)',
                  border: '1px solid var(--color-game-border)',
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
