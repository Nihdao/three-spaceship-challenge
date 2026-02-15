import PlayerShip from '../renderers/PlayerShip.jsx'
import ProjectileRenderer from '../renderers/ProjectileRenderer.jsx'
import EnemyRenderer from '../renderers/EnemyRenderer.jsx'
import EnemyProjectileRenderer from '../renderers/EnemyProjectileRenderer.jsx'
import ShockwaveRenderer from '../renderers/ShockwaveRenderer.jsx'
import ParticleRenderer from '../renderers/ParticleRenderer.jsx'
import XPOrbRenderer from '../renderers/XPOrbRenderer.jsx'
import HealGemRenderer from '../renderers/HealGemRenderer.jsx'
import FragmentGemRenderer from '../renderers/FragmentGemRenderer.jsx'
import EnvironmentRenderer from '../renderers/EnvironmentRenderer.jsx'
import PlanetRenderer from '../renderers/PlanetRenderer.jsx'
import PlanetAuraRenderer from '../renderers/PlanetAuraRenderer.jsx'
import WormholeRenderer from '../renderers/WormholeRenderer.jsx'
import SystemEntryPortal from '../renderers/SystemEntryPortal.jsx'
import BossRenderer from '../renderers/BossRenderer.jsx'
import BossProjectileRenderer from '../renderers/BossProjectileRenderer.jsx'
import { usePlayerCamera } from '../hooks/usePlayerCamera.jsx'
import { useHybridControls } from '../hooks/useHybridControls.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import useBoss from '../stores/useBoss.jsx'

function CameraRig() {
  usePlayerCamera()
  return null
}

function Controls() {
  useHybridControls()
  return null
}

const _fill = GAME_CONFIG.PLAYER_SHIP_LIGHTING
const _fog = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS.AMBIENT_FOG.GAMEPLAY
const _bgColor = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS.BACKGROUND.DEFAULT.color

export default function GameplayScene() {
  const { isActive, bossDefeated } = useBoss()
  const showBoss = isActive || bossDefeated

  return (
    <>
      <Controls />
      <CameraRig />

      {/* Scene background color (Story 24.2) */}
      <color attach="background" args={[_bgColor]} />

      {/* Ambient fog for atmospheric depth (Story 15.3) */}
      {_fog.enabled && <fogExp2 attach="fog" args={[_fog.color, _fog.density]} />}

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
      <EnemyProjectileRenderer />
      <ShockwaveRenderer />

      {/* Boss (Story 17.4) - rendered when active or defeated */}
      {showBoss && (
        <>
          <BossRenderer />
          <BossProjectileRenderer />
        </>
      )}

      {/* XP orbs */}
      <XPOrbRenderer />

      {/* Heal gems (Story 19.2) */}
      <HealGemRenderer />

      {/* Fragment gems (Story 19.3) */}
      <FragmentGemRenderer />

      {/* Death explosion particles */}
      <ParticleRenderer />

      {/* Space environment */}
      <EnvironmentRenderer />

      {/* Planets */}
      <PlanetRenderer />
      <PlanetAuraRenderer />

      {/* Wormhole */}
      <WormholeRenderer />

      {/* System entry portal animation (Story 17.1) */}
      <SystemEntryPortal />
    </>
  )
}
