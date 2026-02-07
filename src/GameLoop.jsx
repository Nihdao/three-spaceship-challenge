import { useFrame } from '@react-three/fiber'
import useGame from './stores/useGame.jsx'
import { useControlsStore } from './stores/useControlsStore.jsx'
import usePlayer from './stores/usePlayer.jsx'

export default function GameLoop() {
  useFrame((state, delta) => {
    const { phase, isPaused } = useGame.getState()

    // Only tick during active gameplay
    if (phase !== 'gameplay' || isPaused) return

    // Clamp delta to prevent physics explosion after tab-return
    const clampedDelta = Math.min(delta, 0.1)

    // === TICK ORDER (deterministic) ===
    // 1. Input — read from useControlsStore
    const input = useControlsStore.getState()

    // 2. Player movement
    usePlayer.getState().tick(clampedDelta, input)

    // 3. Weapons fire — useWeapons.tick(clampedDelta)
    // 4. Projectile movement — projectileSystem
    // 5. Enemy movement + spawning — useEnemies.tick(clampedDelta)
    // 6. Collision detection — collisionSystem.resolve()
    // 7. Damage resolution
    // 8. XP + progression
    // 9. Cleanup dead entities
  })

  return null // GameLoop is a logic-only component, no rendering
}
