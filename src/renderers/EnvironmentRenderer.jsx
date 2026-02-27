import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import usePlayer from '../stores/usePlayer.jsx'
import useGame from '../stores/useGame.jsx'
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

const { STARFIELD_LAYERS, GRID_VISIBILITY, BACKGROUND } = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS

// Wall definitions: position, rotation, and player position axis index (0=X, 2=Z)
const WALLS = [
  { position: [PLAY_AREA_SIZE, BOUNDARY_WALL_HEIGHT / 2, 0], rotation: [0, -Math.PI / 2, 0], axis: 0 },
  { position: [-PLAY_AREA_SIZE, BOUNDARY_WALL_HEIGHT / 2, 0], rotation: [0, Math.PI / 2, 0], axis: 0 },
  { position: [0, BOUNDARY_WALL_HEIGHT / 2, PLAY_AREA_SIZE], rotation: [0, Math.PI, 0], axis: 2 },
  { position: [0, BOUNDARY_WALL_HEIGHT / 2, -PLAY_AREA_SIZE], rotation: [0, 0, 0], axis: 2 },
]

function tintWithAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function NebulaBackground({ tint = BACKGROUND.DEFAULT.nebulaTint, opacity = BACKGROUND.DEFAULT.nebulaOpacity, offsetX = 0, offsetZ = 0 }) {
  const texture = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const half = size / 2
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
    gradient.addColorStop(0,    tint)
    gradient.addColorStop(0.35, tint)
    gradient.addColorStop(0.70, tintWithAlpha(tint, 0.4))
    gradient.addColorStop(1,    'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
  }, [tint])

  useEffect(() => {
    return () => { texture.dispose() }
  }, [texture])

  return (
    <mesh position={[offsetX, 0, offsetZ]}>
      <sphereGeometry args={[6000, 16, 16]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

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

function GroundPlane() {
  const debugGrid = useGame((s) => !!s._debugGrid)
  const gridSize = PLAY_AREA_SIZE * 2.2
  const gridConfig = debugGrid ? GRID_VISIBILITY.DEBUG : GRID_VISIBILITY.GAMEPLAY

  return (
    <group>
      {/* Semi-transparent dark base plane — lets stars show through */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial color={BACKGROUND.DEFAULT.color} transparent opacity={0.2} depthWrite={false} />
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
  const nebulaGroupRef = useRef()
  useFrame(({ camera }) => {
    if (nebulaGroupRef.current) {
      nebulaGroupRef.current.position.x = -camera.position.x * 0.008
      nebulaGroupRef.current.position.z = -camera.position.z * 0.008
    }
  })

  return (
    <group>
      <group ref={nebulaGroupRef}>
        {BACKGROUND.DEFAULT.nebulaEnabled && <NebulaBackground tint={BACKGROUND.DEFAULT.nebulaTint} opacity={BACKGROUND.DEFAULT.nebulaOpacity} />}
        {BACKGROUND.DEFAULT.nebula2Enabled && <NebulaBackground tint={BACKGROUND.DEFAULT.nebula2Tint} opacity={BACKGROUND.DEFAULT.nebula2Opacity} offsetX={BACKGROUND.DEFAULT.nebula2OffsetX} offsetZ={BACKGROUND.DEFAULT.nebula2OffsetZ} />}
      </group>
      <Starfield />
      <BoundaryRenderer />
      <GroundPlane />
    </group>
  )
}
