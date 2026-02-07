import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useEnemies from '../stores/useEnemies.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { ENEMIES } from '../entities/enemyDefs.js'

const MAX = GAME_CONFIG.MAX_ENEMIES_ON_SCREEN

// Geometry factories per type — rendering details live in renderer layer
const TYPE_GEOMETRY = {
  FODDER_BASIC: () => new THREE.OctahedronGeometry(0.5, 0),
  FODDER_FAST: () => new THREE.ConeGeometry(0.35, 1.2, 6),
}
const DEFAULT_GEOMETRY = () => new THREE.BoxGeometry(0.5, 0.5, 0.5)

function EnemyTypeMesh({ typeId }) {
  const meshRef = useRef()
  const dummyRef = useRef(new THREE.Object3D())
  const def = ENEMIES[typeId]

  const geometryFactory = TYPE_GEOMETRY[typeId] || DEFAULT_GEOMETRY
  const geometry = useMemo(() => geometryFactory(), [geometryFactory])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.4,
      }),
    [def.color],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const enemies = useEnemies.getState().enemies
    const playerPos = usePlayer.getState().position
    const dummy = dummyRef.current

    let count = 0
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i]
      if (e.typeId !== typeId) continue

      dummy.position.set(e.x, 0, e.z)

      // Face toward player
      const dx = playerPos[0] - e.x
      const dz = playerPos[2] - e.z
      dummy.rotation.set(0, Math.atan2(dx, -dz), 0)

      dummy.scale.set(e.meshScale[0], e.meshScale[1], e.meshScale[2])
      dummy.updateMatrix()
      mesh.setMatrixAt(count, dummy.matrix)
      count++
    }

    mesh.count = count
    if (count > 0) {
      mesh.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX]}
      frustumCulled={false}
    />
  )
}

const enemyTypeIds = Object.keys(ENEMIES)

export default function EnemyRenderer() {
  return (
    <>
      {enemyTypeIds.map((typeId) => (
        <EnemyTypeMesh key={typeId} typeId={typeId} />
      ))}
    </>
  )
}
