import { useEffect, useCallback } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useEnemies from '../stores/useEnemies.jsx'
import { playSFX } from '../audio/audioManager.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

// ─── styles ─────────────────────────────────────────────────────────────────

const S = {
  overlay: {
    background: 'rgba(13,11,20,0.88)',
  },
  title: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '2.5rem',
    letterSpacing: '0.15em',
    color: 'var(--rs-text)',
    margin: 0,
    lineHeight: 1,
  },
  titleAccent: {
    width: '32px',
    height: '2px',
    background: 'var(--rs-orange)',
    marginTop: '6px',
    marginBottom: '12px',
  },
  subLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.75rem',
    color: 'var(--rs-text-muted)',
    marginBottom: '32px',
  },
  btnRevive: {
    padding: '16px 32px',
    background: 'var(--rs-bg-raised)',
    border: '1px solid var(--rs-teal)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    color: 'var(--rs-teal)',
    fontFamily: "'Space Mono', monospace",
    fontSize: '1.1rem',
    letterSpacing: '0.15em',
    cursor: 'pointer',
    transition: 'border-color 150ms, color 150ms, transform 150ms',
    outline: 'none',
    userSelect: 'none',
  },
  btnGameOver: {
    padding: '16px 32px',
    background: 'var(--rs-bg-raised)',
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    color: 'var(--rs-text-muted)',
    fontFamily: "'Space Mono', monospace",
    fontSize: '1.1rem',
    letterSpacing: '0.15em',
    cursor: 'pointer',
    transition: 'border-color 150ms, color 150ms, transform 150ms',
    outline: 'none',
    userSelect: 'none',
  },
}

// ─── component ───────────────────────────────────────────────────────────────

export default function RevivePrompt() {
  const revivalCharges = usePlayer(s => s.revivalCharges)

  const handleRevive = useCallback(() => {
    playSFX('button-click')

    // Get current state
    const playerState = usePlayer.getState()
    const { revivalCharges, maxHP, position } = playerState

    // Single atomic state update - consume charge, restore HP, activate invincibility
    usePlayer.setState({
      revivalCharges: Math.max(0, revivalCharges - 1),
      currentHP: Math.floor(maxHP * GAME_CONFIG.REVIVAL_HP_PERCENT),
      isInvulnerable: true,
      invulnerabilityTimer: GAME_CONFIG.REVIVAL_INVINCIBILITY_DURATION,
    })

    // Push back enemies from player position (enemies stay alive, just pushed)
    const enemies = useEnemies.getState().enemies
    const { REVIVAL_ENEMY_PUSHBACK_RADIUS, REVIVAL_ENEMY_PUSHBACK_FORCE } = GAME_CONFIG

    enemies.forEach(enemy => {
      const dx = enemy.x - position[0]
      const dz = enemy.z - position[2]
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < REVIVAL_ENEMY_PUSHBACK_RADIUS && dist > 0) {
        // Apply radial force (decreases with distance)
        const force = REVIVAL_ENEMY_PUSHBACK_FORCE * (1 - dist / REVIVAL_ENEMY_PUSHBACK_RADIUS)
        enemy.x += (dx / dist) * force
        enemy.z += (dz / dist) * force
      }
    })

    // Resume gameplay (unpause)
    useGame.getState().resumeFromRevive()
  }, [])

  const handleGameOver = useCallback(() => {
    playSFX('button-click')
    useGame.getState().triggerGameOver()
  }, [])

  // Keyboard controls: [1] = REVIVE, [2] = GAME OVER
  useEffect(() => {
    const handler = (e) => {
      const key = e.code
      if ((key === 'Digit1' || key === 'Numpad1') && revivalCharges >= 1) {
        handleRevive()
      } else if (key === 'Digit2' || key === 'Numpad2') {
        handleGameOver()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [revivalCharges, handleRevive, handleGameOver])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={S.overlay}
    >
      {/* Inner panel */}
      <div style={{
        background: 'var(--rs-bg-surface)',
        border: '1px solid var(--rs-border)',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Title */}
        <h1 className="animate-fade-in" style={S.title}>
          REVIVE?
        </h1>
        <div style={S.titleAccent} />

        {/* Revival charges count */}
        <p
          className="animate-fade-in"
          style={{ ...S.subLabel, animationDelay: '50ms', animationFillMode: 'backwards' }}
        >
          {revivalCharges} Revival{revivalCharges === 1 ? '' : 's'} Remaining
        </p>

        {/* Buttons */}
        <div className="flex gap-4">
          {/* REVIVE button — only show when charges available */}
          {revivalCharges >= 1 && (
            <button
              type="button"
              onClick={handleRevive}
              className="animate-fade-in"
              style={{ ...S.btnRevive, animationDelay: '100ms', animationFillMode: 'backwards' }}
              onMouseEnter={(e) => {
                playSFX('button-hover')
                e.currentTarget.style.borderColor = 'var(--rs-teal)'
                e.currentTarget.style.color = 'var(--rs-text)'
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--rs-teal)'
                e.currentTarget.style.color = 'var(--rs-teal)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              REVIVE
              <span style={{ display: 'block', fontSize: '0.65rem', fontFamily: "'Space Mono', monospace", opacity: 0.7, marginTop: 4 }}>[1]</span>
            </button>
          )}

          {/* GAME OVER button — always available */}
          <button
            type="button"
            onClick={handleGameOver}
            className="animate-fade-in"
            style={{ ...S.btnGameOver, animationDelay: '150ms', animationFillMode: 'backwards' }}
            onMouseEnter={(e) => {
              playSFX('button-hover')
              e.currentTarget.style.borderColor = 'var(--rs-danger)'
              e.currentTarget.style.color = 'var(--rs-text)'
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--rs-border)'
              e.currentTarget.style.color = 'var(--rs-text-muted)'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            GAME OVER
            <span style={{ display: 'block', fontSize: '0.65rem', fontFamily: "'Space Mono', monospace", opacity: 0.7, marginTop: 4 }}>[2]</span>
          </button>
        </div>
      </div>
    </div>
  )
}
