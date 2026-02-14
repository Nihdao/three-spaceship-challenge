import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import useEnemies from '../stores/useEnemies.jsx'

const MAX_ENEMY_PROJECTILES = 50
const _dummy = new THREE.Object3D()
const _color = new THREE.Color()

export default function EnemyProjectileRenderer() {
  const meshRef = useRef()

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ff3333',
    emissive: '#ff3333',
    emissiveIntensity: 2.0,
    toneMapped: false,
  }), [])

  useEffect(() => {
    return () => material.dispose()
  }, [material])

  useFrame(() => {
    const { enemyProjectiles } = useEnemies.getState()
    const mesh = meshRef.current
    if (!mesh) return

    let count = 0
    for (let i = 0; i < enemyProjectiles.length; i++) {
      const p = enemyProjectiles[i]
      if (!p.active) continue

      _dummy.position.set(p.x, 0.5, p.z)
      _dummy.scale.setScalar(p.radius * 2)
      _dummy.updateMatrix()
      mesh.setMatrixAt(count, _dummy.matrix)

      _color.set(p.color)
      mesh.setColorAt(count, _color)

      count++
    }

    mesh.count = count
    if (count > 0) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, MAX_ENEMY_PROJECTILES]} material={material} frustumCulled={false}>
      <sphereGeometry args={[0.5, 8, 8]} />
    </instancedMesh>
  )
}
