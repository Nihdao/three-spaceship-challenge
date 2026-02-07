import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import usePlayer from '../stores/usePlayer.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

const {
  STAR_COUNT,
  STAR_FIELD_RADIUS,
  PLAY_AREA_SIZE,
  BOUNDARY_WARNING_DISTANCE,
  BOUNDARY_WALL_BASE_OPACITY,
  BOUNDARY_WALL_WARN_OPACITY,
  BOUNDARY_WALL_HEIGHT,
  BOUNDARY_WALL_COLOR,
} = GAME_CONFIG

// Wall definitions: position, rotation, and player position axis index (0=X, 2=Z)
const WALLS = [
  { position: [PLAY_AREA_SIZE, BOUNDARY_WALL_HEIGHT / 2, 0], rotation: [0, -Math.PI / 2, 0], axis: 0 },
  { position: [-PLAY_AREA_SIZE, BOUNDARY_WALL_HEIGHT / 2, 0], rotation: [0, Math.PI / 2, 0], axis: 0 },
  { position: [0, BOUNDARY_WALL_HEIGHT / 2, PLAY_AREA_SIZE], rotation: [0, Math.PI, 0], axis: 2 },
  { position: [0, BOUNDARY_WALL_HEIGHT / 2, -PLAY_AREA_SIZE], rotation: [0, 0, 0], axis: 2 },
]

function Starfield() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(STAR_COUNT * 3)
    const col = new Float32Array(STAR_COUNT * 3)

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = STAR_FIELD_RADIUS * (0.8 + Math.random() * 0.2)

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
  }, [])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={2}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
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
        <meshBasicMaterial color="#0a0a0f" transparent opacity={0.6} depthWrite={false} />
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
