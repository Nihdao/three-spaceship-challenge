import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import usePlayer from '../stores/usePlayer.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import StarfieldLayer from './StarfieldLayer.jsx'

const {
  PLAY_AREA_SIZE,
  BOUNDARY_WARNING_DISTANCE,
  BOUNDARY_WALL_BASE_OPACITY,
  BOUNDARY_WALL_WARN_OPACITY,
  BOUNDARY_WALL_HEIGHT,
  BOUNDARY_WALL_COLOR,
} = GAME_CONFIG

const { STARFIELD_LAYERS, GRID_VISIBILITY } = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS

// Wall definitions: position, rotation, and player position axis index (0=X, 2=Z)
const WALLS = [
  { position: [PLAY_AREA_SIZE, BOUNDARY_WALL_HEIGHT / 2, 0], rotation: [0, -Math.PI / 2, 0], axis: 0 },
  { position: [-PLAY_AREA_SIZE, BOUNDARY_WALL_HEIGHT / 2, 0], rotation: [0, Math.PI / 2, 0], axis: 0 },
  { position: [0, BOUNDARY_WALL_HEIGHT / 2, PLAY_AREA_SIZE], rotation: [0, Math.PI, 0], axis: 2 },
  { position: [0, BOUNDARY_WALL_HEIGHT / 2, -PLAY_AREA_SIZE], rotation: [0, 0, 0], axis: 2 },
]

function Starfield() {
  return (
    <>
      <StarfieldLayer layerConfig={STARFIELD_LAYERS.DISTANT} />
      <StarfieldLayer layerConfig={STARFIELD_LAYERS.MID} />
      <StarfieldLayer layerConfig={STARFIELD_LAYERS.NEAR} />
    </>
  )
}

function BoundaryRenderer() {
  const matRefs = useRef([null, null, null, null])

  useFrame(() => {
    const { position: playerPos } = usePlayer.getState()

    for (let i = 0; i < WALLS.length; i++) {
      const mat = matRefs.current[i]
      if (!mat) continue
      const distance = PLAY_AREA_SIZE - Math.abs(playerPos[WALLS[i].axis])
      const t = Math.min(1, Math.max(0, 1 - distance / BOUNDARY_WARNING_DISTANCE))
      mat.opacity = BOUNDARY_WALL_BASE_OPACITY + t * (BOUNDARY_WALL_WARN_OPACITY - BOUNDARY_WALL_BASE_OPACITY)
    }
  })

  return (
    <group>
      {WALLS.map((wall, i) => (
        <mesh key={i} position={wall.position} rotation={wall.rotation}>
          <planeGeometry args={[PLAY_AREA_SIZE * 2, BOUNDARY_WALL_HEIGHT]} />
          <meshBasicMaterial
            ref={(el) => { matRefs.current[i] = el }}
            color={BOUNDARY_WALL_COLOR}
            transparent
            opacity={BOUNDARY_WALL_BASE_OPACITY}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function GroundPlane({ debugGrid = false }) {
  const gridSize = PLAY_AREA_SIZE * 2.2
  const gridConfig = debugGrid ? GRID_VISIBILITY.DEBUG : GRID_VISIBILITY.GAMEPLAY

  return (
    <group>
      {/* Semi-transparent dark base plane — lets stars show through */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial color="#0a0a0f" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      {/* Subtle grid for spatial orientation (Story 15.3: reduced visibility) */}
      {(debugGrid || GRID_VISIBILITY.GAMEPLAY.enabled) && (
        <gridHelper
          args={[gridSize, GRID_VISIBILITY.GAMEPLAY.divisions, gridConfig.colorCenterLine, gridConfig.colorGrid]}
          position={[0, 0, 0]}
        />
      )}
    </group>
  )
}

export default function EnvironmentRenderer() {
  return (
    <group>
      <Starfield />
      <BoundaryRenderer />
      <GroundPlane />
    </group>
  )
}
