import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getOrbs, getActiveCount } from '../systems/xpOrbSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX = GAME_CONFIG.MAX_XP_ORBS

export default function XPOrbRenderer() {
  const meshRef = useRef()
  const dummyRef = useRef(new THREE.Object3D())

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), [])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GAME_CONFIG.XP_ORB_COLOR,
        emissive: GAME_CONFIG.XP_ORB_COLOR,
        emissiveIntensity: 2,
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

    const orbs = getOrbs()
    const count = getActiveCount()
    const dummy = dummyRef.current
    const elapsed = state.clock.elapsedTime
    const [sx, sy, sz] = GAME_CONFIG.XP_ORB_MESH_SCALE

    for (let i = 0; i < count; i++) {
      const orb = orbs[i]
      const y = 0.5 + Math.sin((elapsed + orb.x * 0.5 + orb.z * 0.3) * 3) * 0.3
      dummy.position.set(orb.x, y, orb.z)
      dummy.scale.set(sx, sy, sz)
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
