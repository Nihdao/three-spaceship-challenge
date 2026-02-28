import useBoss from '../stores/useBoss.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import ProgressBar from './primitives/ProgressBar.jsx'

export default function BossHPBar() {
  const boss = useBoss((s) => s.boss)
  const isActive = useBoss((s) => s.isActive)
  const bossDefeated = useBoss((s) => s.bossDefeated)

  if (!isActive || (!boss && !bossDefeated)) return null

  const hpFraction = boss ? boss.hp / boss.maxHp : 0
  const phaseColors = ['#ff4444', '#ff6600', '#ff8800', '#ffaa00']
  const barColor = phaseColors[boss?.phase ?? 0] || '#ff4444'

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      <div style={{ animation: bossDefeated ? 'bossHPFadeOut 0.5s ease-out forwards' : 'bossHPSlideIn 600ms ease-out forwards' }}>
        <div className="flex flex-col items-center pt-2 gap-1">
          {/* Boss name */}
          <span
            className="font-bold tracking-[0.3em]"
            style={{ fontSize: 'clamp(14px, 1.4vw, 20px)', color: 'var(--rs-text)' }}
          >
            {GAME_CONFIG.BOSS_NAME}
          </span>

          {/* HP bar */}
          <div style={{
            width: 'clamp(280px, 40vw, 500px)',
            height: 'clamp(10px, 1.2vw, 16px)',
            position: 'relative',
          }}>
            {/* Phase markers at 75%, 50%, 25% */}
            {GAME_CONFIG.BOSS_PHASE_THRESHOLDS.map((threshold, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${threshold * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  backgroundColor: hpFraction <= threshold ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                  zIndex: 1,
                }}
              />
            ))}
            <ProgressBar value={boss?.hp ?? 0} max={boss?.maxHp ?? 1} variant="boss" pulse={hpFraction < 0.25} />
          </div>

          {/* HP numerique : current / max */}
          <span
            style={{
              fontSize: 'clamp(11px, 1vw, 14px)',
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.05em',
            }}
          >
            {boss ? Math.ceil(boss.hp).toLocaleString() : 0} / {boss ? boss.maxHp.toLocaleString() : 0}
          </span>
        </div>
      </div>
    </div>
  )
}
