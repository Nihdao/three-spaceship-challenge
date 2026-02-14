import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getHealGems, getActiveHealGemCount } from '../systems/healGemSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX = GAME_CONFIG.MAX_HEAL_GEMS

export default function HealGemRenderer() {
  const meshRef = useRef()
  const dummyRef = useRef(new THREE.Object3D())
  const colorRef = useRef(new THREE.Color(GAME_CONFIG.HEAL_GEM_COLOR))

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), [])
  // Use MeshBasicMaterial for proper glow effect with toneMapped: false
  // This makes the heal gem appear bright and emissive
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        toneMapped: false, // Allows colors to be brighter than usual
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const healGems = getHealGems()
    const count = getActiveHealGemCount()
    const dummy = dummyRef.current
    const elapsed = state.clock.elapsedTime
    const color = colorRef.current

    for (let i = 0; i < count; i++) {
      const gem = healGems[i]

      // Bobbing animation (same pattern as XP orbs)
      const y = 0.5 + Math.sin((elapsed + gem.x * 0.5 + gem.z * 0.3) * 3) * 0.3

      // Pulse animation: ±10% scale oscillation at ~2Hz (2 cycles/sec = 4π rad/sec)
      const pulse = 1 + Math.sin(elapsed * Math.PI * 4) * 0.1
      const scale = 0.8 * pulse // Base size 0.8 (similar to XP orbs)

      dummy.position.set(gem.x, y, gem.z)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      // Set per-instance color (red-pink for heal gems)
      mesh.setColorAt(i, color)
    }

    mesh.count = count
    if (count > 0) {
      mesh.instanceMatrix.needsUpdate = true
      mesh.instanceColor.needsUpdate = true
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
