import * as THREE from 'three'
import PlayerShip from '../renderers/PlayerShip.jsx'
import ProjectileRenderer from '../renderers/ProjectileRenderer.jsx'
import ParticleRenderer from '../renderers/ParticleRenderer.jsx'
import BossRenderer from '../renderers/BossRenderer.jsx'
import BossProjectileRenderer from '../renderers/BossProjectileRenderer.jsx'
import { usePlayerCamera } from '../hooks/usePlayerCamera.jsx'
import { useHybridControls } from '../hooks/useHybridControls.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import useGame from '../stores/useGame.jsx'
import StarfieldLayer from '../renderers/StarfieldLayer.jsx'

function CameraRig() {
  usePlayerCamera()
  return null
}

function Controls() {
  useHybridControls()
  return null
}

const _lighting = GAME_CONFIG.PLAYER_SHIP_LIGHTING
const _bossFillIntensity = _lighting.FILL_LIGHT_INTENSITY_BOSS ?? _lighting.FILL_LIGHT_INTENSITY

const ARENA_SIZE = GAME_CONFIG.BOSS_ARENA_SIZE
const WALL_HEIGHT = 100
const WALL_COLOR = '#cc66ff'
const WALL_BASE_OPACITY = 0.06

const WALLS = [
  { position: [ARENA_SIZE, WALL_HEIGHT / 2, 0], rotation: [0, -Math.PI / 2, 0] },
  { position: [-ARENA_SIZE, WALL_HEIGHT / 2, 0], rotation: [0, Math.PI / 2, 0] },
  { position: [0, WALL_HEIGHT / 2, ARENA_SIZE], rotation: [0, Math.PI, 0] },
  { position: [0, WALL_HEIGHT / 2, -ARENA_SIZE], rotation: [0, 0, 0] },
]

function ArenaBoundary() {
  return (
    <group>
      {WALLS.map((wall, i) => (
        <mesh key={i} position={wall.position} rotation={wall.rotation}>
          <planeGeometry args={[ARENA_SIZE * 2, WALL_HEIGHT]} />
          <meshBasicMaterial
            color={WALL_COLOR}
            transparent
            opacity={WALL_BASE_OPACITY}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function ArenaFloor() {
  const debugGrid = useGame((s) => !!s._debugGrid)
  const gridSize = ARENA_SIZE * 2.2
  const gridConfig = debugGrid ? GRID_VISIBILITY.DEBUG : GRID_VISIBILITY.BOSS

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial color="#0a0015" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      {/* Story 15.3: reduced visibility grid, debug toggle support */}
      {(debugGrid || GRID_VISIBILITY.BOSS.enabled) && (
        <gridHelper args={[gridSize, GRID_VISIBILITY.BOSS.divisions, gridConfig.colorCenterLine, gridConfig.colorGrid]} position={[0, 0, 0]} />
      )}
    </group>
  )
}

const { STARFIELD_LAYERS, GRID_VISIBILITY, AMBIENT_FOG } = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS

// Purple-tinted star color for boss arena
const purpleColorFn = () => {
  const purpleShift = 0.5 + Math.random() * 0.5
  return [purpleShift * 0.8, purpleShift * 0.4, 1]
}

function ArenaStarfield() {
  return (
    <>
      <StarfieldLayer layerConfig={STARFIELD_LAYERS.DISTANT} colorFn={purpleColorFn} />
      <StarfieldLayer layerConfig={STARFIELD_LAYERS.MID} colorFn={purpleColorFn} />
      <StarfieldLayer layerConfig={STARFIELD_LAYERS.NEAR} colorFn={purpleColorFn} />
    </>
  )
}

export default function BossScene() {
  return (
    <>
      <Controls />
      <CameraRig />

      {/* Ambient fog for atmospheric depth (Story 15.3) */}
      {AMBIENT_FOG.BOSS.enabled && (
        <fogExp2 attach="fog" args={[AMBIENT_FOG.BOSS.color, AMBIENT_FOG.BOSS.density]} />
      )}

      {/* Dark ambient lighting for boss arena */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[0, 30, 0]} intensity={0.5} color="#cc66ff" />
      <pointLight position={[0, 10, 0]} intensity={0.8} color="#cc66ff" distance={200} />
      {/* Player fill light for consistent visibility (Story 15.1) */}
      <directionalLight
        position={_lighting.FILL_LIGHT_POSITION}
        intensity={_bossFillIntensity}
        castShadow={false}
        color="#ffffff"
      />

      {/* Player */}
      <PlayerShip />

      {/* Player projectiles */}
      <ProjectileRenderer />

      {/* Boss */}
      <BossRenderer />

      {/* Boss projectiles */}
      <BossProjectileRenderer />

      {/* Death explosion particles */}
      <ParticleRenderer />

      {/* Arena environment */}
      <ArenaStarfield />
      <ArenaBoundary />
      <ArenaFloor />
    </>
  )
}
