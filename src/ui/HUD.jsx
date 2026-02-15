import { useRef, useEffect, useState } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'
import useLevel from '../stores/useLevel.jsx'
import useEnemies from '../stores/useEnemies.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'
import { PLANETS } from '../entities/planetDefs.js'
import ProgressBar from './primitives/ProgressBar.jsx'
import RectangularHPBar from './primitives/RectangularHPBar.jsx'
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
  wormholeColor: '#bb88ff', // Bright purple matching portal rift
  wormholeGlowActive: '0 0 12px rgba(187, 136, 255, 1.0)', // Purple glow when active
  wormholeGlowBase: '0 0 8px rgba(85, 24, 170, 0.9)', // Deep purple glow
  enemyDotSize: '4px',
  enemyDotColor: '#ff4444',
  enemyPollInterval: 250,
  dotTransition: 'left 40ms ease-out, top 40ms ease-out',
  boundaryInset: '5%',
  boundaryBorder: '1px solid rgba(255,255,255,0.1)',
}

export function minimapDotPosition(worldX, worldZ, playerX, playerZ, visibleRadius) {
  const relativeX = worldX - playerX
  const relativeZ = worldZ - playerZ
  const left = `${50 + (relativeX / visibleRadius) * 50}%`
  const top = `${50 + (relativeZ / visibleRadius) * 50}%`
  return { left, top }
}

export function minimapBoundaryEdgePct(playerCoord, areaSize, visibleRadius) {
  const posEdge = 50 + ((areaSize - playerCoord) / visibleRadius) * 50
  const negEdge = 50 + ((-areaSize - playerCoord) / visibleRadius) * 50
  return { posEdge, negEdge }
}

export function isWithinMinimapRadius(entityX, entityZ, playerX, playerZ, visibleRadius) {
  const dx = entityX - playerX
  const dz = entityZ - playerZ
  return dx * dx + dz * dz <= visibleRadius * visibleRadius
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

function AnimatedStat({ value, icon, colorClass, label, style }) {
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
      <span className={colorClass} style={{ fontSize: 'clamp(11px, 1.1vw, 16px)', ...style }}>
        {icon}
      </span>
      <span
        ref={ref}
        className={`${colorClass} tabular-nums font-bold`}
        style={{ fontSize: 'clamp(11px, 1.1vw, 16px)', ...style }}
      >
        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
      </span>
    </div>
  )
}

// --- Weapon Slots with update animation (Story 10.4) ---

/** Detect which weapon slots changed (added or upgraded) between prev and current arrays. */
export function detectChangedSlots(prev, current) {
  const changed = []
  for (let i = 0; i < 4; i++) {
    const prevW = prev[i]
    const currW = current[i]
    if (currW && (!prevW || prevW.weaponId !== currW.weaponId || prevW.level !== currW.level)) {
      changed.push(i)
    }
  }
  return changed
}

function WeaponSlots({ activeWeapons }) {
  const [animatingSlots, setAnimatingSlots] = useState(new Set())
  const prevWeaponsRef = useRef(null)

  useEffect(() => {
    if (prevWeaponsRef.current === null) {
      prevWeaponsRef.current = activeWeapons
      return
    }
    const changed = detectChangedSlots(prevWeaponsRef.current, activeWeapons)
    if (changed.length > 0) {
      setAnimatingSlots(new Set(changed))
    }
    prevWeaponsRef.current = activeWeapons
  }, [activeWeapons])

  useEffect(() => {
    if (animatingSlots.size === 0) return
    const timer = setTimeout(() => setAnimatingSlots(new Set()), 300)
    return () => clearTimeout(timer)
  }, [animatingSlots])

  return (
    <div className="flex gap-1.5 mt-1" aria-label="weapon slots">
      {[0, 1, 2, 3].map((i) => {
        const weapon = activeWeapons[i]
        const isAnimating = animatingSlots.has(i)
        if (!weapon) {
          return (
            <div
              key={`empty-${i}`}
              className="flex items-center justify-center"
              aria-label={`weapon slot ${i + 1} empty`}
              style={{
                width: 'clamp(32px, 3vw, 48px)',
                height: 'clamp(32px, 3vw, 48px)',
                borderRadius: '4px',
                border: '1px dashed rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}
            >
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>—</span>
            </div>
          )
        }
        const def = WEAPONS[weapon.weaponId]
        const color = def?.projectileColor || '#ffffff'
        const name = def?.name?.split(' ')[0] || '?'
        return (
          <div
            key={weapon.weaponId}
            className="relative flex flex-col items-center justify-center"
            aria-label={`weapon slot ${i + 1} ${name} level ${weapon.level}`}
            style={{
              width: 'clamp(32px, 3vw, 48px)',
              height: 'clamp(32px, 3vw, 48px)',
              borderRadius: '4px',
              border: `2px solid ${color}4D`,
              backgroundColor: `${color}26`,
              transform: isAnimating ? 'scale(1.15)' : 'scale(1)',
              boxShadow: isAnimating ? `0 0 12px ${color}99` : 'none',
              transition: 'transform 250ms ease-out, box-shadow 250ms ease-out',
            }}
          >
            <span
              className="font-bold truncate leading-tight"
              style={{ fontSize: 'clamp(7px, 0.7vw, 10px)', color }}
            >
              {name}
            </span>
            <span
              className="text-white font-bold tabular-nums leading-tight"
              style={{ fontSize: 'clamp(7px, 0.7vw, 9px)' }}
            >
              Lv{weapon.level}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// --- Boon Slots with update animation (Story 10.5) ---

/** Get short display label for a boon (first word of name, like weapons). */
export function getBoonLabel(boonId) {
  const def = BOONS[boonId]
  return def?.name?.split(' ')[0] || '?'
}

/** Detect which boon slots changed (added or upgraded) between prev and current arrays. */
export function detectChangedBoons(prev, current) {
  const changed = []
  for (let i = 0; i < 3; i++) {
    const prevB = prev[i]
    const currB = current[i]
    if (currB && (!prevB || prevB.boonId !== currB.boonId || prevB.level !== currB.level)) {
      changed.push(i)
    }
  }
  return changed
}

function BoonSlots({ activeBoons }) {
  const [animatingSlots, setAnimatingSlots] = useState(new Set())
  const prevBoonsRef = useRef(null)

  useEffect(() => {
    if (prevBoonsRef.current === null) {
      prevBoonsRef.current = activeBoons
      return
    }
    const changed = detectChangedBoons(prevBoonsRef.current, activeBoons)
    if (changed.length > 0) {
      setAnimatingSlots(new Set(changed))
    }
    prevBoonsRef.current = activeBoons
  }, [activeBoons])

  useEffect(() => {
    if (animatingSlots.size === 0) return
    const timer = setTimeout(() => setAnimatingSlots(new Set()), 300)
    return () => clearTimeout(timer)
  }, [animatingSlots])

  return (
    <div className="flex gap-1.5 mt-1" aria-label="boon slots">
      {[0, 1, 2].map((i) => {
        const boon = activeBoons[i]
        const isAnimating = animatingSlots.has(i)
        if (!boon) {
          return (
            <div
              key={`boon-empty-${i}`}
              className="flex items-center justify-center"
              aria-label={`boon slot ${i + 1} empty`}
              style={{
                width: 'clamp(32px, 3vw, 48px)',
                height: 'clamp(32px, 3vw, 48px)',
                borderRadius: '8px',
                border: '1px dashed rgba(255, 20, 147, 0.1)',
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}
            >
              <span style={{ fontSize: '12px', color: 'rgba(255, 20, 147, 0.2)' }}>—</span>
            </div>
          )
        }
        const def = BOONS[boon.boonId]
        const name = def?.name || '?'
        const label = getBoonLabel(boon.boonId)
        return (
          <div
            key={boon.boonId}
            className="relative flex flex-col items-center justify-center"
            aria-label={`boon slot ${i + 1} ${name} level ${boon.level}`}
            style={{
              width: 'clamp(32px, 3vw, 48px)',
              height: 'clamp(32px, 3vw, 48px)',
              borderRadius: '8px',
              border: '2px solid rgba(255, 20, 147, 0.3)',
              backgroundColor: 'rgba(255, 20, 147, 0.15)',
              transform: isAnimating ? 'scale(1.15)' : 'scale(1)',
              boxShadow: isAnimating ? '0 0 12px rgba(255, 20, 147, 0.6)' : 'none',
              transition: 'transform 250ms ease-out, box-shadow 250ms ease-out',
            }}
          >
            <span
              className="font-bold truncate leading-tight"
              style={{ fontSize: 'clamp(7px, 0.7vw, 10px)', color: 'rgba(255, 182, 219, 1)' }}
            >
              {label}
            </span>
            <span
              className="text-white font-bold tabular-nums leading-tight"
              style={{ fontSize: 'clamp(7px, 0.7vw, 9px)' }}
            >
              Lv{boon.level}
            </span>
          </div>
        )
      })}
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
  const activeBoons = useBoons((s) => s.activeBoons)
  const damageFlashTimer = usePlayer((s) => s.damageFlashTimer)
  const dashCooldownTimer = usePlayer((s) => s.dashCooldownTimer)
  const isDashing = usePlayer((s) => s.isDashing)
  const playerPosition = usePlayer((s) => s.position)
  const planets = useLevel((s) => s.planets)
  const activeScanPlanetId = useLevel((s) => s.activeScanPlanetId)
  const wormholeState = useLevel((s) => s.wormholeState)
  const wormhole = useLevel((s) => s.wormhole)
  // Poll all enemies imperatively for minimap (Story 24.1, replaces sniper_fixed-only poll).
  // Using a reactive Zustand selector causes infinite re-renders because
  // set() is called inside tick() for shockwave/projectile spawning.
  const [minimapEnemies, setMinimapEnemies] = useState([])
  useEffect(() => {
    const id = setInterval(() => {
      const enemies = useEnemies.getState().enemies
      const [px, , pz] = usePlayer.getState().position
      const radius = GAME_CONFIG.MINIMAP_VISIBLE_RADIUS
      const nearby = []
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i]
        const dx = e.x - px
        const dz = e.z - pz
        if (dx * dx + dz * dz <= radius * radius) {
          nearby.push({ id: e.id, x: e.x, z: e.z })
        }
      }
      setMinimapEnemies(prev =>
        nearby.length === 0 && prev.length === 0 ? prev : nearby
      )
    }, MINIMAP.enemyPollInterval)
    return () => clearInterval(id)
  }, [])

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
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-6 pt-8">
        {/* Left column: HP bar + Stats cluster */}
        <div className="flex flex-col gap-2">
          {/* HP Bar — top-left (Story 20.8: Rectangular HP bar with text inside) */}
          <RectangularHPBar value={currentHP} max={maxHP} pulse={hpPulse} />

          {/* Stats cluster: Kills | Fragments | Score (Story 10.2) */}
          <div className="flex items-center gap-3">
            <AnimatedStat value={kills} icon="💀" colorClass="text-game-danger" label="kills" />
            {/* Story 19.3: Fragment icon color set to purple (#cc66ff) to match fragment gems */}
            <AnimatedStat value={fragments} icon="◆" label="fragments" style={{ color: '#cc66ff' }} />
            <AnimatedStat value={score} icon="⭐" colorClass="text-yellow-400" label="score" />
          </div>

          {/* Weapon Slots — below stats in top-left cluster (Story 10.4) */}
          <WeaponSlots activeWeapons={activeWeapons} />

          {/* Boon Slots — below weapon slots in top-left cluster (Story 10.5) */}
          <BoonSlots activeBoons={activeBoons} />
        </div>

        {/* Timer — top-center (Story 17.6: continues during boss fight) */}
        <div className="flex flex-col items-center gap-0.5">
          <span
            className={`font-bold tabular-nums ${lowTime ? 'text-game-danger animate-pulse' : 'text-game-timer'}`}
            style={{ fontSize: 'clamp(20px, 2.2vw, 32px)' }}
            data-testid="timer"
          >
            {timerDisplay}
          </span>
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
            {/* Play area boundary edges — show when within visible radius (Story 24.1) */}
            {(() => {
              const area = GAME_CONFIG.PLAY_AREA_SIZE
              const radius = GAME_CONFIG.MINIMAP_VISIBLE_RADIUS
              const { posEdge: rightPct, negEdge: leftPct } = minimapBoundaryEdgePct(playerPosition[0], area, radius)
              const { posEdge: bottomPct, negEdge: topPct } = minimapBoundaryEdgePct(playerPosition[2], area, radius)
              const edges = []
              if (rightPct > 0 && rightPct < 100) edges.push({ key: 'right', style: { position: 'absolute', left: `${rightPct}%`, top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255,255,255,0.15)', pointerEvents: 'none' } })
              if (leftPct > 0 && leftPct < 100) edges.push({ key: 'left', style: { position: 'absolute', left: `${leftPct}%`, top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255,255,255,0.15)', pointerEvents: 'none' } })
              if (bottomPct > 0 && bottomPct < 100) edges.push({ key: 'bottom', style: { position: 'absolute', top: `${bottomPct}%`, left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', pointerEvents: 'none' } })
              if (topPct > 0 && topPct < 100) edges.push({ key: 'top', style: { position: 'absolute', top: `${topPct}%`, left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', pointerEvents: 'none' } })
              return edges.map(({ key, style }) => <div key={key} style={style} />)
            })()}
            {/* Player dot */}
            <div style={{
              position: 'absolute',
              width: MINIMAP.playerDotSize, height: MINIMAP.playerDotSize,
              borderRadius: '50%',
              backgroundColor: MINIMAP.playerDotColor,
              boxShadow: MINIMAP.playerDotGlow,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              transition: MINIMAP.dotTransition,
            }} />
            {/* Planet dots — only render within visible radius */}
            {planets.filter((p) => isWithinMinimapRadius(p.x, p.z, playerPosition[0], playerPosition[2], GAME_CONFIG.MINIMAP_VISIBLE_RADIUS)).map((p) => {
              const planetColor = PLANETS[p.typeId]?.color || '#ffffff'
              return (
                <div key={p.id} style={{
                  position: 'absolute',
                  width: MINIMAP.planetDotSize, height: MINIMAP.planetDotSize,
                  borderRadius: '50%',
                  backgroundColor: planetColor,
                  boxShadow: `0 0 4px ${planetColor}60`,
                  ...minimapDotPosition(p.x, p.z, playerPosition[0], playerPosition[2], GAME_CONFIG.MINIMAP_VISIBLE_RADIUS),
                  transform: 'translate(-50%, -50%)',
                  opacity: p.scanned ? 0.3 : 1,
                  animation: activeScanPlanetId === p.id ? 'scanPulse 800ms ease-in-out infinite alternate' : 'none',
                  transition: 'opacity 200ms ease-out',
                }} />
              )
            })}
            {/* Wormhole dot — only render within visible radius */}
            {wormhole && wormholeState !== 'hidden' && isWithinMinimapRadius(wormhole.x, wormhole.z, playerPosition[0], playerPosition[2], GAME_CONFIG.MINIMAP_VISIBLE_RADIUS) && (
              <div style={{
                position: 'absolute',
                width: wormholeState === 'visible' ? MINIMAP.wormholeBaseSize : MINIMAP.wormholeActiveSize,
                height: wormholeState === 'visible' ? MINIMAP.wormholeBaseSize : MINIMAP.wormholeActiveSize,
                borderRadius: '50%',
                backgroundColor: MINIMAP.wormholeColor,
                ...minimapDotPosition(wormhole.x, wormhole.z, playerPosition[0], playerPosition[2], GAME_CONFIG.MINIMAP_VISIBLE_RADIUS),
                transform: 'translate(-50%, -50%)',
                boxShadow: wormholeState !== 'visible' ? MINIMAP.wormholeGlowActive : MINIMAP.wormholeGlowBase,
                animation: 'scanPulse 800ms ease-in-out infinite alternate',
                transition: 'width 200ms ease-out, height 200ms ease-out',
              }} />
            )}
            {/* Enemy dots — all enemies within visible radius (Story 24.1) */}
            {minimapEnemies.map((e) => (
              <div key={e.id} style={{
                position: 'absolute',
                width: MINIMAP.enemyDotSize, height: MINIMAP.enemyDotSize,
                borderRadius: '50%',
                backgroundColor: MINIMAP.enemyDotColor,
                boxShadow: `0 0 4px ${MINIMAP.enemyDotColor}80`,
                ...minimapDotPosition(e.x, e.z, playerPosition[0], playerPosition[2], GAME_CONFIG.MINIMAP_VISIBLE_RADIUS),
                transform: 'translate(-50%, -50%)',
                transition: MINIMAP.dotTransition,
              }} />
            ))}
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

      {/* Bottom row: Dash cooldown */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-end px-6 pb-4">
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
