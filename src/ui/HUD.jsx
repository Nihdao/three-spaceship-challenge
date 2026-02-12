import { useRef, useEffect } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useLevel from '../stores/useLevel.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { WEAPONS } from '../entities/weaponDefs.js'
import { PLANETS } from '../entities/planetDefs.js'
import ProgressBar from './primitives/ProgressBar.jsx'
import XPBarFullWidth from './XPBarFullWidth.jsx'

// --- Minimap constants & helpers (Story 10.3) ---

export const MINIMAP = {
  borderRadius: '50%',
  borderColor: 'rgba(34, 211, 238, 0.4)',
  boxShadow: '0 0 12px rgba(34, 211, 238, 0.2)',
  backgroundColor: 'rgba(0,0,0,0.65)',
  playerDotColor: '#00ffcc',
  playerDotSize: '6px',
  playerDotGlow: '0 0 6px rgba(0, 255, 204, 0.8)',
  planetDotSize: '6px',
  wormholeBaseSize: '6px',
  wormholeActiveSize: '9px',
  wormholeColor: '#00ccff',
  wormholeGlowActive: '0 0 10px rgba(0, 204, 255, 0.9)',
  wormholeGlowBase: '0 0 3px rgba(0, 204, 255, 0.4)',
  dotTransition: 'left 40ms ease-out, top 40ms ease-out',
  boundaryInset: '5%',
  boundaryBorder: '1px solid rgba(255,255,255,0.1)',
}

export function minimapDotPosition(worldX, worldZ, playAreaSize) {
  const left = `${50 + (worldX / playAreaSize) * 50}%`
  const top = `${50 + (worldZ / playAreaSize) * 50}%`
  return { left, top }
}

// --- Exported logic helpers (testable without DOM) ---

export function formatTimer(totalSeconds) {
  const clamped = Math.max(0, totalSeconds)
  const minutes = Math.floor(clamped / 60)
  const seconds = Math.floor(clamped % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function shouldPulseHP(currentHP, maxHP) {
  if (maxHP <= 0) return true
  return currentHP / maxHP < 0.25
}

export function isLowTime(remaining) {
  return remaining > 0 && remaining < 60
}

// Note: shouldPulseXP() removed in Story 10.1 (old XP bar replaced by XPBarFullWidth)
// New XP bar uses shouldPulseXPBar() from XPBarFullWidth.jsx with >80% threshold

// --- Stat with update animation ---

function AnimatedStat({ value, icon, colorClass, label }) {
  const ref = useRef(null)
  const prevValue = useRef(value)

  useEffect(() => {
    if (value > prevValue.current && ref.current) {
      ref.current.classList.remove('stat-updated')
      // Force reflow to restart animation
      void ref.current.offsetWidth
      ref.current.classList.add('stat-updated')
    }
    prevValue.current = value
  }, [value])

  return (
    <div className="flex items-center gap-1" aria-label={label}>
      <span className={colorClass} style={{ fontSize: 'clamp(11px, 1.1vw, 16px)' }}>
        {icon}
      </span>
      <span
        ref={ref}
        className={`${colorClass} tabular-nums font-bold`}
        style={{ fontSize: 'clamp(11px, 1.1vw, 16px)' }}
      >
        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
      </span>
    </div>
  )
}

// --- HUD Component ---

export default function HUD() {
  // Individual selectors for performance (avoid unnecessary re-renders)
  const systemTimer = useGame((s) => s.systemTimer)
  const kills = useGame((s) => s.kills)
  const score = useGame((s) => s.score)
  const phase = useGame((s) => s.phase)
  const currentHP = usePlayer((s) => s.currentHP)
  const maxHP = usePlayer((s) => s.maxHP)
  const fragments = usePlayer((s) => s.fragments)
  const currentLevel = usePlayer((s) => s.currentLevel)
  const activeWeapons = useWeapons((s) => s.activeWeapons)
  const damageFlashTimer = usePlayer((s) => s.damageFlashTimer)
  const dashCooldownTimer = usePlayer((s) => s.dashCooldownTimer)
  const isDashing = usePlayer((s) => s.isDashing)
  const playerPosition = usePlayer((s) => s.position)
  const planets = useLevel((s) => s.planets)
  const activeScanPlanetId = useLevel((s) => s.activeScanPlanetId)
  const wormholeState = useLevel((s) => s.wormholeState)
  const wormhole = useLevel((s) => s.wormhole)

  const remaining = GAME_CONFIG.SYSTEM_TIMER - systemTimer
  const timerDisplay = formatTimer(remaining)
  const hpPulse = shouldPulseHP(currentHP, maxHP)
  const isLowHP = hpPulse
  const lowTime = isLowTime(remaining)

  return (
    <div className="fixed inset-0 z-40 pointer-events-none font-game">
      {/* Full-width XP bar at very top (Story 10.1) — only during XP-earning phases */}
      {(phase === 'gameplay' || phase === 'levelUp' || phase === 'planetReward') && <XPBarFullWidth />}

      {/* Top row: HP + Stats left, Timer center, Level + Minimap right */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-6 pt-4">
        {/* Left column: HP bar + Stats cluster */}
        <div className="flex flex-col gap-2">
          {/* HP Bar — top-left */}
          <div className="flex flex-col gap-1" style={{ width: 'clamp(140px, 14vw, 220px)' }}>
            <div className="flex items-center justify-between">
              <span className="text-game-hp font-bold" style={{ fontSize: 'clamp(11px, 1.1vw, 15px)' }}>
                HP
              </span>
              <span className="text-game-text tabular-nums" style={{ fontSize: 'clamp(10px, 1vw, 14px)' }}>
                {Math.ceil(currentHP)} / {maxHP}
              </span>
            </div>
            <div style={{ height: 'clamp(6px, 0.7vw, 10px)' }}>
              <ProgressBar value={currentHP} max={maxHP} variant="hp" pulse={hpPulse} />
            </div>
          </div>

          {/* Stats cluster: Kills | Fragments | Score (Story 10.2) */}
          <div className="flex items-center gap-3">
            <AnimatedStat value={kills} icon="💀" colorClass="text-game-danger" label="kills" />
            <AnimatedStat value={fragments} icon="◆" colorClass="text-cyan-400" label="fragments" />
            <AnimatedStat value={score} icon="⭐" colorClass="text-yellow-400" label="score" />
          </div>
        </div>

        {/* Timer — top-center */}
        <div className="flex flex-col items-center gap-0.5">
          {phase !== 'boss' && <span
            className={`font-bold tabular-nums ${lowTime ? 'text-game-danger animate-pulse' : 'text-game-timer'}`}
            style={{ fontSize: 'clamp(20px, 2.2vw, 32px)' }}
            data-testid="timer"
          >
            {timerDisplay}
          </span>}
        </div>

        {/* Right column: Level + Minimap */}
        <div className="flex items-start gap-3">
          {/* Level display (Story 10.2) */}
          <div className="flex items-center" aria-label="level">
            <span
              className="text-game-text font-bold tabular-nums"
              style={{ fontSize: 'clamp(14px, 1.5vw, 20px)' }}
            >
              LVL {currentLevel}
            </span>
          </div>

          {/* Minimap — top-right (Story 10.3: enhanced styling) */}
          <div style={{
            width: 'clamp(80px, 8vw, 120px)',
            height: 'clamp(80px, 8vw, 120px)',
            visibility: phase === 'boss' ? 'hidden' : undefined,
            border: `2px solid ${MINIMAP.borderColor}`,
            borderRadius: MINIMAP.borderRadius,
            boxShadow: MINIMAP.boxShadow,
            backgroundColor: MINIMAP.backgroundColor,
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Play area boundary indicator */}
            <div style={{
              position: 'absolute',
              inset: MINIMAP.boundaryInset,
              borderRadius: MINIMAP.borderRadius,
              border: MINIMAP.boundaryBorder,
              pointerEvents: 'none',
            }} />
            {/* Player dot */}
            <div style={{
              position: 'absolute',
              width: MINIMAP.playerDotSize, height: MINIMAP.playerDotSize,
              borderRadius: '50%',
              backgroundColor: MINIMAP.playerDotColor,
              boxShadow: MINIMAP.playerDotGlow,
              ...minimapDotPosition(playerPosition[0], playerPosition[2], GAME_CONFIG.PLAY_AREA_SIZE),
              transform: 'translate(-50%, -50%)',
              transition: MINIMAP.dotTransition,
            }} />
            {/* Planet dots */}
            {planets.map((p) => {
              const planetColor = PLANETS[p.typeId]?.color || '#ffffff'
              return (
                <div key={p.id} style={{
                  position: 'absolute',
                  width: MINIMAP.planetDotSize, height: MINIMAP.planetDotSize,
                  borderRadius: '50%',
                  backgroundColor: planetColor,
                  boxShadow: `0 0 4px ${planetColor}60`,
                  ...minimapDotPosition(p.x, p.z, GAME_CONFIG.PLAY_AREA_SIZE),
                  transform: 'translate(-50%, -50%)',
                  opacity: p.scanned ? 0.3 : 1,
                  animation: activeScanPlanetId === p.id ? 'scanPulse 800ms ease-in-out infinite alternate' : 'none',
                  transition: 'opacity 200ms ease-out',
                }} />
              )
            })}
            {/* Wormhole dot */}
            {wormhole && wormholeState !== 'hidden' && (
              <div style={{
                position: 'absolute',
                width: wormholeState === 'visible' ? MINIMAP.wormholeBaseSize : MINIMAP.wormholeActiveSize,
                height: wormholeState === 'visible' ? MINIMAP.wormholeBaseSize : MINIMAP.wormholeActiveSize,
                borderRadius: '50%',
                backgroundColor: MINIMAP.wormholeColor,
                ...minimapDotPosition(wormhole.x, wormhole.z, GAME_CONFIG.PLAY_AREA_SIZE),
                transform: 'translate(-50%, -50%)',
                boxShadow: wormholeState !== 'visible' ? MINIMAP.wormholeGlowActive : MINIMAP.wormholeGlowBase,
                animation: 'scanPulse 800ms ease-in-out infinite alternate',
                transition: 'width 200ms ease-out, height 200ms ease-out',
              }} />
            )}
            {/* Compass labels (z-10 to stay above dots) */}
            {[
              { label: 'N', pos: { top: '2px', left: '50%', transform: 'translateX(-50%)' } },
              { label: 'S', pos: { bottom: '2px', left: '50%', transform: 'translateX(-50%)' } },
              { label: 'W', pos: { left: '2px', top: '50%', transform: 'translateY(-50%)' } },
              { label: 'E', pos: { right: '2px', top: '50%', transform: 'translateY(-50%)' } },
            ].map(({ label, pos }) => (
              <span key={label} style={{
                position: 'absolute',
                ...pos,
                fontSize: '7px',
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 'bold',
                pointerEvents: 'none',
                zIndex: 10,
                textShadow: '0 0 2px rgba(0,0,0,0.8)',
              }}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Scan progress bar — center-bottom, above XP bar (Story 5.3) */}
      {activeScanPlanetId && (() => {
        const scanPlanet = planets.find(p => p.id === activeScanPlanetId)
        if (!scanPlanet) return null
        const planetDef = PLANETS[scanPlanet.typeId]
        const tierColor = planetDef?.color || '#ffffff'
        const tierName = planetDef?.name || 'Planet'
        const progressPct = Math.round(scanPlanet.scanProgress * 100)
        return (
          <div
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
            style={{ bottom: 'clamp(60px, 6vw, 90px)' }}
          >
            <span
              className="text-game-text font-bold"
              style={{ fontSize: 'clamp(11px, 1.1vw, 15px)', color: tierColor }}
            >
              {tierName} — {progressPct}%
            </span>
            <div
              style={{
                width: 'clamp(160px, 20vw, 280px)',
                height: 'clamp(6px, 0.7vw, 10px)',
                borderRadius: '2px',
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  backgroundColor: tierColor,
                  transition: 'width 150ms ease-out',
                }}
              />
            </div>
          </div>
        )
      })()}

      {/* Bottom row: Dash cooldown + Weapons */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-end px-6 pb-4">
        {/* Dash cooldown — bottom-right, before weapons */}
        <div className="flex items-end gap-3">
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="border rounded-full flex items-center justify-center"
              style={{
                width: 'clamp(36px, 3.6vw, 48px)',
                height: 'clamp(36px, 3.6vw, 48px)',
                borderColor: dashCooldownTimer > 0 || isDashing ? '#ffaa00' : '#00ffcc',
                backgroundColor: dashCooldownTimer > 0 || isDashing ? '#ffaa0015' : '#00ffcc20',
                boxShadow: dashCooldownTimer <= 0 && !isDashing ? '0 0 8px #00ffcc60' : 'none',
              }}
            >
              <span
                className="tabular-nums font-bold"
                style={{
                  fontSize: 'clamp(9px, 0.9vw, 12px)',
                  color: dashCooldownTimer > 0 || isDashing ? '#ffaa00' : '#00ffcc',
                }}
              >
                {isDashing ? '...' : dashCooldownTimer > 0 ? Math.ceil(dashCooldownTimer) : 'RDY'}
              </span>
            </div>
            <span className="text-game-text-muted" style={{ fontSize: 'clamp(8px, 0.8vw, 10px)' }}>
              SPACE
            </span>
          </div>

        {/* Weapon Slots — bottom-right */}
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => {
            const weapon = activeWeapons[i]
            if (!weapon) {
              return (
                <div
                  key={`empty-${i}`}
                  className="border border-game-border/40 rounded bg-white/5 flex items-center justify-center"
                  style={{
                    width: 'clamp(40px, 4vw, 56px)',
                    height: 'clamp(32px, 3.2vw, 44px)',
                  }}
                >
                  <span className="text-game-text-muted" style={{ fontSize: 'clamp(9px, 0.9vw, 12px)' }}>—</span>
                </div>
              )
            }
            const def = WEAPONS[weapon.weaponId]
            const color = def?.projectileColor || '#ffffff'
            return (
              <div
                key={weapon.weaponId}
                className="border rounded flex flex-col items-center justify-center px-1"
                style={{
                  width: 'clamp(40px, 4vw, 56px)',
                  height: 'clamp(32px, 3.2vw, 44px)',
                  borderColor: color,
                  backgroundColor: `${color}15`,
                }}
              >
                <span
                  className="font-bold truncate leading-tight"
                  style={{ fontSize: 'clamp(8px, 0.8vw, 11px)', color }}
                >
                  {def?.name?.split(' ')[0] || '?'}
                </span>
                <span
                  className="text-game-text-muted leading-tight tabular-nums"
                  style={{ fontSize: 'clamp(7px, 0.7vw, 10px)' }}
                >
                  Lv{weapon.level}
                </span>
              </div>
            )
          })}
        </div>
        </div>
      </div>

      {/* Damage flash — red overlay that fades out (Story 4.6) */}
      {damageFlashTimer > 0 && (
        <div
          className="fixed inset-0 pointer-events-none bg-game-danger"
          style={{
            opacity: 0.2 * (damageFlashTimer / GAME_CONFIG.DAMAGE_FLASH_DURATION),
          }}
        />
      )}

      {/* Low HP Vignette — red pulsing overlay */}
      {isLowHP && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 80px rgba(255, 0, 51, 0.4)',
            animation: 'vignettePulse 500ms ease-in-out infinite alternate',
          }}
        />
      )}
    </div>
  )
}
