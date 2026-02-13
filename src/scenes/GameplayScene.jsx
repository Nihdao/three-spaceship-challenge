import PlayerShip from '../renderers/PlayerShip.jsx'
import ProjectileRenderer from '../renderers/ProjectileRenderer.jsx'
import EnemyRenderer from '../renderers/EnemyRenderer.jsx'
import ParticleRenderer from '../renderers/ParticleRenderer.jsx'
import XPOrbRenderer from '../renderers/XPOrbRenderer.jsx'
import EnvironmentRenderer from '../renderers/EnvironmentRenderer.jsx'
import PlanetRenderer from '../renderers/PlanetRenderer.jsx'
import WormholeRenderer from '../renderers/WormholeRenderer.jsx'
import { usePlayerCamera } from '../hooks/usePlayerCamera.jsx'
import { useHybridControls } from '../hooks/useHybridControls.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

function CameraRig() {
  usePlayerCamera()
  return null
}

function Controls() {
  useHybridControls()
  return null
}

const _fill = GAME_CONFIG.PLAYER_SHIP_LIGHTING

export default function GameplayScene() {
  return (
    <>
      <Controls />
      <CameraRig />

      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 20, 10]} intensity={1} />
      {/* Player fill light for enhanced visibility (Story 12.1) */}
      <directionalLight
        position={_fill.FILL_LIGHT_POSITION}
        intensity={_fill.FILL_LIGHT_INTENSITY}
        castShadow={false}
      />

      {/* Player */}
      <PlayerShip />

      {/* Projectiles */}
      <ProjectileRenderer />

      {/* Enemies */}
      <EnemyRenderer />

      {/* XP orbs */}
      <XPOrbRenderer />

      {/* Death explosion particles */}
      <ParticleRenderer />

      {/* Space environment */}
      <EnvironmentRenderer />

      {/* Planets */}
      <PlanetRenderer />

      {/* Wormhole */}
      <WormholeRenderer />
    </>
  )
}
