import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import useBoss from '../stores/useBoss.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX_BOSS_PROJECTILES = 50
const PROJECTILE_COLOR = new THREE.Color('#ff6600')

const _dummy = new THREE.Object3D()

export default function BossProjectileRenderer() {
  const meshRef = useRef()

  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: PROJECTILE_COLOR,
    transparent: true,
    opacity: 0.9,
  }), [])

  useEffect(() => {
    return () => material.dispose()
  }, [material])

  useFrame(() => {
    const { bossProjectiles } = useBoss.getState()
    const mesh = meshRef.current
    if (!mesh) return

    const count = Math.min(bossProjectiles.length, MAX_BOSS_PROJECTILES)
    for (let i = 0; i < count; i++) {
      const p = bossProjectiles[i]
      _dummy.position.set(p.x, 1, p.z)
      _dummy.scale.setScalar(GAME_CONFIG.BOSS_PROJECTILE_RADIUS * 2)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
    }
    // Hide remaining instances
    for (let i = count; i < MAX_BOSS_PROJECTILES; i++) {
      _dummy.position.set(0, -1000, 0)
      _dummy.scale.setScalar(0)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.count = count
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, MAX_BOSS_PROJECTILES]} material={material}>
      <sphereGeometry args={[0.5, 8, 8]} />
    </instancedMesh>
  )
}
