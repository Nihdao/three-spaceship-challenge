import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getActiveGems, getActiveCount } from '../systems/fragmentGemSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX = GAME_CONFIG.MAX_FRAGMENT_GEMS

export default function FragmentGemRenderer() {
  const meshRef = useRef()
  const dummyRef = useRef(new THREE.Object3D())

  // GEOMETRY: flat hexagonal disk (6 radial segments, height 0.14)
  const geometry = useMemo(() => new THREE.CylinderGeometry(0.28, 0.28, 0.14, 6), [])
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: GAME_CONFIG.FRAGMENT_GEM_COLOR,
        toneMapped: false,
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

    const gems = getActiveGems()
    const count = getActiveCount()
    const dummy = dummyRef.current
    const elapsed = state.clock.elapsedTime
    const [sx, sy, sz] = GAME_CONFIG.FRAGMENT_GEM_SCALE

    // Pulse is identical for all gems (depends only on elapsed) — hoist out of loop
    const pulsePhase = elapsed * GAME_CONFIG.FRAGMENT_GEM_PULSE_SPEED
    const pulse = Math.sin(pulsePhase) * 0.15 + 1.0

    for (let i = 0; i < count; i++) {
      const gem = gems[i]
      // Bobbing Y animation (same pattern as XP orbs)
      const y = 0.5 + Math.sin((elapsed + gem.x * 0.5 + gem.z * 0.3) * 3) * 0.3

      // Pulse animation: scale oscillation
      const scaleX = sx * pulse
      const scaleY = sy * pulse
      const scaleZ = sz * pulse

      dummy.position.set(gem.x, y, gem.z)
      dummy.scale.set(scaleX, scaleY, scaleZ)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
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
