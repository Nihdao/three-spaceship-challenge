import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useLevel from '../stores/useLevel.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { WEAPONS } from '../entities/weaponDefs.js'
import { PLANETS } from '../entities/planetDefs.js'
import ProgressBar from './primitives/ProgressBar.jsx'

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

export function shouldPulseXP(currentXP, xpToNextLevel) {
  if (xpToNextLevel <= 0) return false
  return currentXP / xpToNextLevel >= 0.85
}

// --- HUD Component ---

export default function HUD() {
  // Individual selectors for performance (avoid unnecessary re-renders)
  const systemTimer = useGame((s) => s.systemTimer)
  const kills = useGame((s) => s.kills)
  const currentHP = usePlayer((s) => s.currentHP)
  const maxHP = usePlayer((s) => s.maxHP)
  const currentLevel = usePlayer((s) => s.currentLevel)
  const currentXP = usePlayer((s) => s.currentXP)
  const xpToNextLevel = usePlayer((s) => s.xpToNextLevel)
  const activeWeapons = useWeapons((s) => s.activeWeapons)
  const damageFlashTimer = usePlayer((s) => s.damageFlashTimer)
  const dashCooldownTimer = usePlayer((s) => s.dashCooldownTimer)
  const isDashing = usePlayer((s) => s.isDashing)
  const playerPosition = usePlayer((s) => s.position)
  const planets = useLevel((s) => s.planets)

  const remaining = GAME_CONFIG.SYSTEM_TIMER - systemTimer
  const timerDisplay = formatTimer(remaining)
  const hpPulse = shouldPulseHP(currentHP, maxHP)
  const xpPulse = shouldPulseXP(currentXP, xpToNextLevel)
  const isLowHP = hpPulse

  return (
    <div className="fixed inset-0 z-40 pointer-events-none font-game">
      {/* Top row: HP left, Timer+Kills center */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-6 pt-4">
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

        {/* Timer + Kills — top-center */}
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-game-timer font-bold tabular-nums"
            style={{ fontSize: 'clamp(20px, 2.2vw, 32px)' }}
          >
            {timerDisplay}
          </span>
          <span
            className="text-game-text-muted tabular-nums"
            style={{ fontSize: 'clamp(11px, 1.1vw, 16px)' }}
          >
            x{kills}
          </span>
        </div>

        {/* Minimap — top-right */}
        <div style={{
          width: 'clamp(80px, 8vw, 120px)',
          height: 'clamp(80px, 8vw, 120px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '4px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Player dot */}
          <div style={{
            position: 'absolute',
            width: '4px', height: '4px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            left: `${50 + (playerPosition[0] / GAME_CONFIG.PLAY_AREA_SIZE) * 50}%`,
            top: `${50 + (playerPosition[2] / GAME_CONFIG.PLAY_AREA_SIZE) * 50}%`,
            transform: 'translate(-50%, -50%)',
          }} />
          {/* Planet dots */}
          {planets.map((p) => (
            <div key={p.id} style={{
              position: 'absolute',
              width: '5px', height: '5px',
              borderRadius: '50%',
              backgroundColor: PLANETS[p.typeId]?.color,
              left: `${50 + (p.x / GAME_CONFIG.PLAY_AREA_SIZE) * 50}%`,
              top: `${50 + (p.z / GAME_CONFIG.PLAY_AREA_SIZE) * 50}%`,
              transform: 'translate(-50%, -50%)',
              opacity: p.scanned ? 0.3 : 1,
            }} />
          ))}
        </div>
      </div>

      {/* Bottom row: XP bar left/center, Weapons right */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-6 pb-4">
        {/* XP Bar — bottom-left, stretches to center */}
        <div className="flex items-center gap-2" style={{ width: 'clamp(200px, 40vw, 500px)' }}>
          <div className="flex-1" style={{ height: 'clamp(5px, 0.6vw, 8px)' }}>
            <ProgressBar value={currentXP} max={xpToNextLevel} variant="xp" pulse={xpPulse} />
          </div>
          <span
            className="text-game-xp font-bold tabular-nums whitespace-nowrap"
            style={{ fontSize: 'clamp(11px, 1.1vw, 15px)' }}
          >
            LVL {currentLevel}
          </span>
        </div>

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
