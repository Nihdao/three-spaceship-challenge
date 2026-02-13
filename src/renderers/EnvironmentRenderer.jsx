import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import usePlayer from '../stores/usePlayer.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { starTexture } from './starTexture.js'

const {
  PLAY_AREA_SIZE,
  BOUNDARY_WARNING_DISTANCE,
  BOUNDARY_WALL_BASE_OPACITY,
  BOUNDARY_WALL_WARN_OPACITY,
  BOUNDARY_WALL_HEIGHT,
  BOUNDARY_WALL_COLOR,
} = GAME_CONFIG

const { STARFIELD_LAYERS } = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS

// Wall definitions: position, rotation, and player position axis index (0=X, 2=Z)
const WALLS = [
  { position: [PLAY_AREA_SIZE, BOUNDARY_WALL_HEIGHT / 2, 0], rotation: [0, -Math.PI / 2, 0], axis: 0 },
  { position: [-PLAY_AREA_SIZE, BOUNDARY_WALL_HEIGHT / 2, 0], rotation: [0, Math.PI / 2, 0], axis: 0 },
  { position: [0, BOUNDARY_WALL_HEIGHT / 2, PLAY_AREA_SIZE], rotation: [0, Math.PI, 0], axis: 2 },
  { position: [0, BOUNDARY_WALL_HEIGHT / 2, -PLAY_AREA_SIZE], rotation: [0, 0, 0], axis: 2 },
]

// Generate star geometry for a single layer (pure helper)
function createStarGeometry(count, radius) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = radius * (0.9 + Math.random() * 0.1)

    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i * 3 + 2] = r * Math.cos(phi)

    // White to blue-white color variation
    const blueShift = 0.7 + Math.random() * 0.3
    col[i * 3] = blueShift
    col[i * 3 + 1] = blueShift
    col[i * 3 + 2] = 1
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  geo.computeBoundingSphere()
  return geo
}

// Multi-layer starfield: each layer has distinct size, opacity, and parallax
function StarfieldLayer({ layerConfig }) {
  const groupRef = useRef()
  const { camera } = useThree()

  const geometry = useMemo(
    () => createStarGeometry(layerConfig.count, layerConfig.radius),
    [layerConfig]
  )

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  // Parallax: offset group position based on camera movement
  useFrame(() => {
    if (layerConfig.parallaxFactor > 0 && groupRef.current) {
      groupRef.current.position.x = -camera.position.x * layerConfig.parallaxFactor
      groupRef.current.position.z = -camera.position.z * layerConfig.parallaxFactor
    }
  })

  // Material-level opacity: average of the layer's opacity range (Option A)
  const opacity = (layerConfig.opacityRange[0] + layerConfig.opacityRange[1]) / 2
  // Material-level size: average of the layer's size range
  const size = (layerConfig.sizeRange[0] + layerConfig.sizeRange[1]) / 2

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          map={starTexture}
          size={size}
          sizeAttenuation={layerConfig.sizeAttenuation}
          vertexColors
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </points>
    </group>
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
  const gridSize = PLAY_AREA_SIZE * 2.2
  return (
    <group>
      {/* Semi-transparent dark base plane — lets stars show through */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial color="#0a0a0f" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      {/* Subtle grid for spatial orientation */}
      <gridHelper
        args={[gridSize, 40, '#1a1a2e', '#12121a']}
        position={[0, 0, 0]}
      />
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
