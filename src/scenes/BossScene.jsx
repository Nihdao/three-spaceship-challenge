import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import PlayerShip from '../renderers/PlayerShip.jsx'
import ProjectileRenderer from '../renderers/ProjectileRenderer.jsx'
import ParticleRenderer from '../renderers/ParticleRenderer.jsx'
import BossRenderer from '../renderers/BossRenderer.jsx'
import BossProjectileRenderer from '../renderers/BossProjectileRenderer.jsx'
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
  const gridSize = ARENA_SIZE * 2.2
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial color="#0a0015" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <gridHelper args={[gridSize, 20, '#2a1040', '#1a0828']} position={[0, 0, 0]} />
    </group>
  )
}

function ArenaStarfield() {
  const geometry = useMemo(() => {
    const count = 2000
    const radius = 3000
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (0.8 + Math.random() * 0.2)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      const purpleShift = 0.5 + Math.random() * 0.5
      col[i * 3] = purpleShift * 0.8
      col[i * 3 + 1] = purpleShift * 0.4
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
      <pointsMaterial size={2} sizeAttenuation={false} vertexColors transparent opacity={0.8} depthWrite={false} />
    </points>
  )
}

export default function BossScene() {
  return (
    <>
      <Controls />
      <CameraRig />

      {/* Dark ambient lighting for boss arena */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[0, 30, 0]} intensity={0.5} color="#cc66ff" />
      <pointLight position={[0, 10, 0]} intensity={0.8} color="#cc66ff" distance={200} />

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
