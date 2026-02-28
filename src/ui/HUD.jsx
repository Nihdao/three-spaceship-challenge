import { useRef, useEffect, useState, useMemo } from 'react'
import { SkullIcon, StarIcon, ShieldCrossIcon, RerollIcon, SkipIcon, FragmentIcon } from './icons/index.jsx'
import QuestTracker from './QuestTracker.jsx'
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
  borderColor: 'var(--rs-teal)',
  backgroundColor: 'var(--rs-bg-surface)',
  playerDotColor: 'var(--rs-teal)',
  playerDotSize: '6px',
  playerDotGlow: '0 0 6px rgba(0, 180, 216, 0.8)',
  planetDotSize: '18px',
  wormholeBaseSize: '6px',
  wormholeActiveSize: '9px',
  wormholeColor: 'var(--rs-violet)', // Aligned with Redshift DS — matches off-screen arrow (Story 35.3 review)
  wormholeGlowActive: '0 0 12px rgba(187, 136, 255, 1.0)', // Purple glow when active
  wormholeGlowBase: '0 0 8px rgba(85, 24, 170, 0.9)', // Deep purple glow
  enemyDotSize: '4px',
  enemyDotColor: 'var(--rs-danger)',
  enemyPollInterval: 250,
  dotTransition: 'left 40ms ease-out, top 40ms ease-out',
  boundaryInset: '5%',
  boundaryBorder: 'var(--rs-border)',
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

export function minimapWormholeArrowPosition(wormholeX, wormholeZ, playerX, playerZ) {
  const dx = wormholeX - playerX
  const dz = wormholeZ - playerZ
  const angle = Math.atan2(dz, dx)
  const abscos = Math.abs(Math.cos(angle))
  const abssin = Math.abs(Math.sin(angle))
  const scale = 0.5 / Math.max(abscos, abssin)
  const edgeX = 50 + Math.cos(angle) * scale * 100
  const edgeZ = 50 + Math.sin(angle) * scale * 100
  return { edgeX, edgeZ, angle }
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

// --- CrossIcon SVG (banish charges indicator) ---

const CrossIcon = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <line x1="1" y1="1" x2="11" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="11" y1="1" x2="1" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

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

  const IconComponent = typeof icon === 'function' ? icon : null
  return (
    <div className="flex items-center gap-1" aria-label={label}>
      <span className={colorClass} style={{ fontSize: 'clamp(13px, 1.3vw, 18px)', ...style }}>
        {IconComponent ? <IconComponent size={14} color="currentColor" /> : icon}
      </span>
      <span
        ref={ref}
        className={[colorClass, 'tabular-nums font-bold'].filter(Boolean).join(' ')}
        style={{ fontSize: 'clamp(13px, 1.3vw, 18px)', ...style }}
      >
        {value}
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
                border: '1px dashed var(--rs-border)',
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--rs-text-dim)' }}>—</span>
            </div>
          )
        }
        const def = WEAPONS[weapon.weaponId]
        const name = def?.name?.split(' ')[0] || '?'
        return (
          <div
            key={weapon.weaponId}
            className="relative flex flex-col items-center justify-center"
            aria-label={`weapon slot ${i + 1} ${name} level ${weapon.level}`}
            style={{
              width: 'clamp(32px, 3vw, 48px)',
              height: 'clamp(32px, 3vw, 48px)',
              border: '2px solid rgba(0, 180, 216, 0.3)',
              backgroundColor: 'rgba(0, 180, 216, 0.12)',
              transform: isAnimating ? 'scale(1.15)' : 'scale(1)',
              boxShadow: isAnimating ? '0 0 12px rgba(0, 180, 216, 0.6)' : 'none',
              transition: 'transform 250ms ease-out, box-shadow 250ms ease-out',
            }}
          >
            <span
              className="font-bold truncate leading-tight"
              style={{ fontSize: 'clamp(9px, 0.9vw, 11px)', color: 'var(--rs-teal)' }}
            >
              {name}
            </span>
            <span
              className="text-white font-bold tabular-nums leading-tight"
              style={{ fontSize: 'clamp(9px, 0.9vw, 11px)' }}
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

/** Get short display label for a boon (uses explicit label if defined, else first word of name). */
export function getBoonLabel(boonId) {
  const def = BOONS[boonId]
  return def?.label || def?.name?.split(' ')[0] || '?'
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
                border: '1px dashed rgba(255, 79, 31, 0.2)',
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}
            >
              <span style={{ fontSize: '12px', color: 'rgba(255, 79, 31, 0.3)' }}>—</span>
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
              border: '2px solid rgba(255, 79, 31, 0.3)',
              backgroundColor: 'rgba(255, 79, 31, 0.10)',
              transform: isAnimating ? 'scale(1.15)' : 'scale(1)',
              boxShadow: isAnimating ? '0 0 12px rgba(255, 79, 31, 0.6)' : 'none',
              transition: 'transform 250ms ease-out, box-shadow 250ms ease-out',
            }}
          >
            <span
              className="font-bold truncate leading-tight"
              style={{ fontSize: 'clamp(9px, 0.9vw, 11px)', color: 'var(--rs-orange)' }}
            >
              {label}
            </span>
            <span
              className="text-white font-bold tabular-nums leading-tight"
              style={{ fontSize: 'clamp(9px, 0.9vw, 11px)' }}
            >
              Lv{boon.level}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// --- MinimapPanel sub-component (Story 41.4: extracted to avoid full HUD re-renders on position/rotation changes) ---

function MinimapPanel() {
  // Individual coordinate selectors (primitives) so Zustand Object.is() correctly detects changes
  const px = usePlayer((s) => s.position[0])
  const pz = usePlayer((s) => s.position[2])
  const playerRotation = usePlayer((s) => s.rotation)
  const planets = useLevel((s) => s.planets)
  const activeScanPlanetId = useLevel((s) => s.activeScanPlanetId)
  const wormholeState = useLevel((s) => s.wormholeState)
  const wormhole = useLevel((s) => s.wormhole)
  const phase = useGame((s) => s.phase)

  // Poll all enemies imperatively for minimap (Story 24.1, replaces sniper_fixed-only poll).
  // Using a reactive Zustand selector causes infinite re-renders because
  // set() is called inside tick() for shockwave/projectile spawning.
  const [minimapEnemies, setMinimapEnemies] = useState([])
  useEffect(() => {
    const id = setInterval(() => {
      const enemies = useEnemies.getState().enemies
      const [epx, , epz] = usePlayer.getState().position
      const radius = GAME_CONFIG.MINIMAP_VISIBLE_RADIUS
      const nearby = []
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i]
        const dx = e.x - epx
        const dz = e.z - epz
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

  // Memoized planet filter — re-runs when planets array or player coords change (AC 3)
  // Note: activeScanPlanetId is NOT a dep — the filter only uses position data.
  // Scan opacity/animation reads activeScanPlanetId directly from scope in the .map() render.
  const visiblePlanets = useMemo(
    () => planets.filter(p => isWithinMinimapRadius(p.x, p.z, px, pz, GAME_CONFIG.MINIMAP_VISIBLE_RADIUS)),
    [planets, px, pz]
  )

  return (
    <div style={{
      width: 'clamp(120px, 12vw, 180px)',
      height: 'clamp(120px, 12vw, 180px)',
      visibility: phase === 'boss' ? 'hidden' : undefined,
      border: '2px solid var(--rs-teal)',
      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
      backgroundColor: 'var(--rs-bg-surface)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Play area boundary edges — show when within visible radius (Story 24.1) */}
      {(() => {
        const area = GAME_CONFIG.PLAY_AREA_SIZE
        const radius = GAME_CONFIG.MINIMAP_VISIBLE_RADIUS
        const { posEdge: rightPct, negEdge: leftPct } = minimapBoundaryEdgePct(px, area, radius)
        const { posEdge: bottomPct, negEdge: topPct } = minimapBoundaryEdgePct(pz, area, radius)
        const edges = []
        if (rightPct > 0 && rightPct < 100) edges.push({ key: 'right', style: { position: 'absolute', left: `${rightPct}%`, top: 0, bottom: 0, width: '1px', backgroundColor: MINIMAP.boundaryBorder, pointerEvents: 'none' } })
        if (leftPct > 0 && leftPct < 100) edges.push({ key: 'left', style: { position: 'absolute', left: `${leftPct}%`, top: 0, bottom: 0, width: '1px', backgroundColor: MINIMAP.boundaryBorder, pointerEvents: 'none' } })
        if (bottomPct > 0 && bottomPct < 100) edges.push({ key: 'bottom', style: { position: 'absolute', top: `${bottomPct}%`, left: 0, right: 0, height: '1px', backgroundColor: MINIMAP.boundaryBorder, pointerEvents: 'none' } })
        if (topPct > 0 && topPct < 100) edges.push({ key: 'top', style: { position: 'absolute', top: `${topPct}%`, left: 0, right: 0, height: '1px', backgroundColor: MINIMAP.boundaryBorder, pointerEvents: 'none' } })
        return edges.map(({ key, style }) => <div key={key} style={style} />)
      })()}
      {/* Player triangle — rotates with ship yaw */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) rotate(${playerRotation}rad)`,
        pointerEvents: 'none',
        zIndex: 5,
      }}>
        <svg width="8" height="10" viewBox="0 0 8 10" fill="var(--rs-teal)">
          <polygon points="4,0 8,10 4,7 0,10" />
        </svg>
      </div>
      {/* Planet dots — only within visible radius (memoized) */}
      {visiblePlanets.map((p) => {
        const planetColor = PLANETS[p.typeId]?.color || '#ffffff'
        return (
          <div key={p.id} style={{
            position: 'absolute',
            width: MINIMAP.planetDotSize, height: MINIMAP.planetDotSize,
            borderRadius: '50%',
            backgroundColor: planetColor,
            boxShadow: `0 0 4px ${planetColor}60`,
            ...minimapDotPosition(p.x, p.z, px, pz, GAME_CONFIG.MINIMAP_VISIBLE_RADIUS),
            transform: 'translate(-50%, -50%)',
            opacity: p.scanned ? 0.3 : 1,
            animation: activeScanPlanetId === p.id ? 'scanPulse 800ms ease-in-out infinite alternate' : 'none',
            transition: 'opacity 200ms ease-out',
          }} />
        )
      })}
      {/* Wormhole dot — within visible radius (AC 3) */}
      {wormhole && wormholeState !== 'hidden' && isWithinMinimapRadius(wormhole.x, wormhole.z, px, pz, GAME_CONFIG.MINIMAP_VISIBLE_RADIUS) && (
        <div style={{
          position: 'absolute',
          width: wormholeState === 'visible' ? MINIMAP.wormholeBaseSize : MINIMAP.wormholeActiveSize,
          height: wormholeState === 'visible' ? MINIMAP.wormholeBaseSize : MINIMAP.wormholeActiveSize,
          borderRadius: '50%',
          backgroundColor: MINIMAP.wormholeColor,
          ...minimapDotPosition(wormhole.x, wormhole.z, px, pz, GAME_CONFIG.MINIMAP_VISIBLE_RADIUS),
          transform: 'translate(-50%, -50%)',
          boxShadow: wormholeState !== 'visible' ? MINIMAP.wormholeGlowActive : MINIMAP.wormholeGlowBase,
          animation: 'scanPulse 800ms ease-in-out infinite alternate',
          transition: 'width 200ms ease-out, height 200ms ease-out',
        }} />
      )}
      {/* Wormhole edge arrow — outside visible radius (AC 4) */}
      {wormhole && wormholeState !== 'hidden' && !isWithinMinimapRadius(wormhole.x, wormhole.z, px, pz, GAME_CONFIG.MINIMAP_VISIBLE_RADIUS) && (() => {
        const { edgeX, edgeZ, angle } = minimapWormholeArrowPosition(wormhole.x, wormhole.z, px, pz)
        // Clamp so 6×8px arrow stays fully within bounds when translate(-50%,-50%) is applied.
        const cx = Math.max(4, Math.min(96, edgeX))
        const cz = Math.max(5, Math.min(95, edgeZ))
        return (
          <div style={{
            position: 'absolute',
            left: `${cx}%`,
            top: `${cz}%`,
            transform: `translate(-50%, -50%) rotate(${angle}rad)`,
            pointerEvents: 'none',
            zIndex: 5,
          }}>
            <svg width="6" height="8" viewBox="0 0 6 8" fill="var(--rs-violet)">
              <polygon points="6,4 0,0 1,4 0,8" />
            </svg>
          </div>
        )
      })()}
      {/* Enemy dots — all enemies within visible radius (Story 24.1) */}
      {minimapEnemies.map((e) => (
        <div key={e.id} style={{
          position: 'absolute',
          width: MINIMAP.enemyDotSize, height: MINIMAP.enemyDotSize,
          borderRadius: '50%',
          backgroundColor: MINIMAP.enemyDotColor,
          boxShadow: '0 0 4px rgba(239, 35, 60, 0.5)',
          ...minimapDotPosition(e.x, e.z, px, pz, GAME_CONFIG.MINIMAP_VISIBLE_RADIUS),
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
          fontSize: '9px',
          fontFamily: "'Space Mono', monospace",
          color: 'var(--rs-text-muted)',
          pointerEvents: 'none',
          zIndex: 10,
        }}>{label}</span>
      ))}
    </div>
  )
}

// --- DamageFlashOverlay sub-component (Story 41.4 fix: isolates 60Hz damageFlashTimer from parent HUD) ---
// damageFlashTimer decrements every frame during a hit flash (~500ms). Extracted so only this tiny
// component re-renders at high frequency, not the entire HUD.

function DamageFlashOverlay() {
  // Boolean selector — only re-renders on flash start/end, not every frame.
  // lastDamageTime as key forces CSS animation restart when hit twice quickly.
  const isFlashing = usePlayer((s) => s.damageFlashTimer > 0)
  const lastDamageTime = usePlayer((s) => s.lastDamageTime)
  if (!isFlashing) return null
  return (
    <div
      key={lastDamageTime}
      className="fixed inset-0 pointer-events-none"
      style={{
        animation: `damageFlash ${GAME_CONFIG.DAMAGE_FLASH_DURATION}s linear forwards`,
        background: 'var(--rs-danger)',
      }}
    />
  )
}

// --- ScanBarPanel sub-component (Story 41.4 fix — replaces inline scan bar in parent HUD) ---
// Uses primitive selectors so re-renders are bounded: ≤100/scan for progressPct, ~2/scan for typeId.
// Resolves the parent HUD's planets subscription which caused 60Hz re-renders during scanning.

function ScanBarPanel() {
  const activeScanPlanetId = useLevel((s) => s.activeScanPlanetId)
  const typeId = useLevel((s) => {
    if (!s.activeScanPlanetId) return null
    return s.planets.find(p => p.id === s.activeScanPlanetId)?.typeId ?? null
  })
  const progressPct = useLevel((s) => {
    if (!s.activeScanPlanetId) return -1
    const planet = s.planets.find(p => p.id === s.activeScanPlanetId)
    return planet ? Math.round(planet.scanProgress * 100) : -1
  })

  if (!activeScanPlanetId || progressPct < 0 || typeId === null) return null

  const planetDef = PLANETS[typeId]
  const tierColor = planetDef?.color || '#ffffff'
  const tierName = planetDef?.name || 'Planet'

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      style={{ bottom: 'clamp(60px, 6vw, 90px)' }}
    >
      <span
        className="font-bold"
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
          backgroundColor: 'var(--rs-bg-raised)',
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
}

// --- HUD Component ---

export default function HUD() {
  // Individual selectors for performance (avoid unnecessary re-renders)
  const systemTimer = useGame((s) => Math.floor(s.systemTimer))
  const actualSystemDuration = useLevel((s) => s.actualSystemDuration) // Story 23.3
  const kills = useGame((s) => s.kills)
  const score = useGame((s) => s.score)
  const phase = useGame((s) => s.phase)
  const currentHP = usePlayer((s) => s.currentHP)
  const maxHP = usePlayer((s) => s.maxHP)
  const fragments = usePlayer((s) => s.fragmentsEarnedThisRun)
  const currentLevel = usePlayer((s) => s.currentLevel)
  const revivalCharges = usePlayer((s) => s.revivalCharges)
  const rerollCharges = usePlayer((s) => s.rerollCharges)
  const skipCharges = usePlayer((s) => s.skipCharges)
  const banishCharges = usePlayer((s) => s.banishCharges)
  const activeWeapons = useWeapons((s) => s.activeWeapons)
  const activeBoons = useBoons((s) => s.activeBoons)
  const dashCooldownTimer = usePlayer((s) => Math.ceil(s.dashCooldownTimer))
  const isDashing = usePlayer((s) => s.isDashing)

  const remaining = Math.max(0, actualSystemDuration - systemTimer) // Story 23.3: cumulative duration
  const timerDisplay = formatTimer(remaining)
  const hpPulse = shouldPulseHP(currentHP, maxHP)
  const isLowHP = hpPulse
  const lowTime = isLowTime(remaining)

  return (
    <div className="fixed inset-0 z-40 pointer-events-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
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
            <AnimatedStat value={kills} icon={SkullIcon} label="kills" style={{ color: 'var(--rs-danger)' }} />
            <AnimatedStat value={fragments} icon={FragmentIcon} label="fragments" style={{ color: 'var(--rs-violet)' }} />
            <AnimatedStat value={score} icon={StarIcon} label="score" style={{ color: 'var(--rs-gold)' }} />
          </div>

          {/* Meta charges row: Revival | Reroll | Skip | Banish — only when any > 0 (Story 22.1, 22.2) */}
          {(revivalCharges > 0 || rerollCharges > 0 || skipCharges > 0 || banishCharges > 0) && (
            <div className="flex items-center gap-3">
              {revivalCharges > 0 && (
                <AnimatedStat value={revivalCharges} icon={ShieldCrossIcon} label="revival" style={{ color: 'var(--rs-teal)' }} />
              )}
              {rerollCharges > 0 && (
                <AnimatedStat value={rerollCharges} icon={RerollIcon} label="reroll" style={{ color: 'var(--rs-teal)' }} />
              )}
              {skipCharges > 0 && (
                <AnimatedStat value={skipCharges} icon={SkipIcon} label="skip" style={{ color: 'var(--rs-gold)' }} />
              )}
              {banishCharges > 0 && (
                <AnimatedStat value={banishCharges} icon={CrossIcon} label="banish" style={{ color: 'var(--rs-danger)' }} />
              )}
            </div>
          )}

          {/* Weapon Slots — below stats in top-left cluster (Story 10.4) */}
          <WeaponSlots activeWeapons={activeWeapons} />

          {/* Boon Slots — below weapon slots in top-left cluster (Story 10.5) */}
          <BoonSlots activeBoons={activeBoons} />
        </div>

        {/* Timer — true center, independent of left/right column widths */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
          <span
            className={`font-bold tabular-nums ${lowTime ? 'animate-pulse' : ''}`}
            style={{ fontSize: 'clamp(20px, 2.2vw, 32px)', color: lowTime ? 'var(--rs-danger)' : 'var(--rs-text)' }}
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
              className="font-bold tabular-nums"
              style={{ fontSize: 'clamp(14px, 1.5vw, 20px)', color: 'var(--rs-text)' }}
            >
              LVL {currentLevel}
            </span>
          </div>

          {/* Minimap + QuestTracker stacked (Story 35.4) */}
          <div className="flex flex-col gap-2">
            <MinimapPanel />
            <QuestTracker />
          </div>
        </div>
      </div>

      {/* Scan progress bar — center-bottom, above XP bar (Story 5.3, extracted Story 41.4 fix) */}
      <ScanBarPanel />

      {/* Bottom row: Dash cooldown */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-6 pb-4">
        {/* Keyboard hints — bottom-left */}
        <div className="flex flex-col gap-1">
          {[
            { key: 'ESC', label: 'PAUSE' },
            { key: 'M',   label: 'MAP'   },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.6rem',
                color: 'var(--rs-text-muted)',
                background: 'rgba(26, 21, 40, 0.9)',
                border: '1px solid var(--rs-border-hot)',
                padding: '1px 5px',
                clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
                lineHeight: 1.6,
              }}>{key}</span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.6rem',
                color: 'var(--rs-text-muted)',
                letterSpacing: '0.08em',
              }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-end gap-3">
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="flex items-center justify-center"
              style={{
                width: 'clamp(36px, 3.6vw, 48px)',
                height: 'clamp(36px, 3.6vw, 48px)',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
                border: `1px solid ${dashCooldownTimer > 0 || isDashing ? 'var(--rs-dash-cd)' : 'var(--rs-dash-ready)'}`,
                backgroundColor: dashCooldownTimer > 0 || isDashing ? 'rgba(255, 79, 31, 0.08)' : 'rgba(0, 180, 216, 0.12)',
                boxShadow: dashCooldownTimer <= 0 && !isDashing ? '0 0 8px rgba(0, 180, 216, 0.4)' : 'none',
              }}
            >
              <span
                className="tabular-nums font-bold"
                style={{
                  fontSize: 'clamp(11px, 1.1vw, 14px)',
                  color: dashCooldownTimer > 0 || isDashing ? 'var(--rs-dash-cd)' : 'var(--rs-dash-ready)',
                }}
              >
                {isDashing ? '...' : dashCooldownTimer > 0 ? dashCooldownTimer : 'RDY'}
              </span>
            </div>
            <span style={{ fontSize: 'clamp(10px, 1vw, 12px)', color: 'var(--rs-text-muted)' }}>
              SPACE
            </span>
          </div>
        </div>
      </div>

      {/* Damage flash — extracted to DamageFlashOverlay (Story 41.4 fix: 60Hz damageFlashTimer isolated) */}
      <DamageFlashOverlay />

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
