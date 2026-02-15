import { useEffect, useCallback } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useEnemies from '../stores/useEnemies.jsx'
import { playSFX } from '../audio/audioManager.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 font-game">
      {/* Title */}
      <h1 className="text-3xl font-bold tracking-widest text-game-text mb-3 animate-fade-in">
        REVIVE?
      </h1>

      {/* Revival charges count */}
      <p className="text-game-text-muted text-sm mb-8 animate-fade-in" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
        {revivalCharges} Revival{revivalCharges === 1 ? '' : 's'} Remaining
      </p>

      {/* Buttons */}
      <div className="flex gap-4">
        {/* REVIVE button — only show when charges available */}
        {revivalCharges >= 1 && (
          <button
            onClick={handleRevive}
            className="px-8 py-4 bg-game-bg-medium border-2 border-game-accent rounded-lg
                       text-game-accent font-bold text-xl tracking-wider
                       hover:bg-game-accent hover:text-game-bg hover:scale-105
                       transition-all cursor-pointer animate-fade-in"
            style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
          >
            REVIVE
            <span className="block text-xs font-normal mt-1 opacity-70">[1]</span>
          </button>
        )}

        {/* GAME OVER button — always available */}
        <button
          onClick={handleGameOver}
          className="px-8 py-4 bg-game-bg-medium border-2 border-game-border rounded-lg
                     text-game-text-muted font-bold text-xl tracking-wider
                     hover:border-game-text hover:text-game-text hover:scale-105
                     transition-all cursor-pointer animate-fade-in"
          style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
        >
          GAME OVER
          <span className="block text-xs font-normal mt-1 opacity-70">[2]</span>
        </button>
      </div>
    </div>
  )
}
