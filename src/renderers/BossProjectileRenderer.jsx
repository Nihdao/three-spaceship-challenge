import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import useBoss from '../stores/useBoss.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX_BOSS_PROJECTILES = 50
const PROJECTILE_COLOR = new THREE.Color('#ff4400')

const _dummy = new THREE.Object3D()

export default function BossProjectileRenderer() {
  const meshRef = useRef()
  const glowRef = useRef()

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: PROJECTILE_COLOR,
    emissive: PROJECTILE_COLOR,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.95,
  }), [])

  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ff8800',
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  }), [])

  useEffect(() => {
    return () => {
      material.dispose()
      glowMaterial.dispose()
    }
  }, [material, glowMaterial])

  useFrame(() => {
    const { bossProjectiles } = useBoss.getState()
    const mesh = meshRef.current
    const glow = glowRef.current
    if (!mesh) return

    const count = Math.min(bossProjectiles.length, MAX_BOSS_PROJECTILES)
    for (let i = 0; i < count; i++) {
      const p = bossProjectiles[i]
      _dummy.position.set(p.x, 3, p.z)
      _dummy.scale.setScalar(GAME_CONFIG.BOSS_PROJECTILE_RADIUS * 2)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
      if (glow) {
        _dummy.scale.setScalar(GAME_CONFIG.BOSS_PROJECTILE_RADIUS * 4)
        _dummy.updateMatrix()
        glow.setMatrixAt(i, _dummy.matrix)
      }
    }
    // Hide remaining instances
    for (let i = count; i < MAX_BOSS_PROJECTILES; i++) {
      _dummy.position.set(0, -1000, 0)
      _dummy.scale.setScalar(0)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
      if (glow) glow.setMatrixAt(i, _dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.count = count
    if (glow) {
      glow.instanceMatrix.needsUpdate = true
      glow.count = count
    }
  })

  return (
    <group>
      {/* Core projectile */}
      <instancedMesh ref={meshRef} args={[null, null, MAX_BOSS_PROJECTILES]} material={material}>
        <sphereGeometry args={[0.5, 8, 8]} />
      </instancedMesh>
      {/* Outer glow */}
      <instancedMesh ref={glowRef} args={[null, null, MAX_BOSS_PROJECTILES]} material={glowMaterial} renderOrder={-1}>
        <sphereGeometry args={[0.5, 8, 8]} />
      </instancedMesh>
    </group>
  )
}
