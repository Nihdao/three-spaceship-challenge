import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useWeapons from '../stores/useWeapons.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX = GAME_CONFIG.MAX_PROJECTILES

export default function ProjectileRenderer() {
  const meshRef = useRef()
  const dummyRef = useRef(new THREE.Object3D())

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#00ffff',
        emissive: '#00ffff',
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

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const projectiles = useWeapons.getState().projectiles
    const dummy = dummyRef.current

    let count = 0
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i]
      if (!p.active) continue

      dummy.position.set(p.x, 0.5, p.z)
      dummy.rotation.set(0, Math.atan2(p.dirX, p.dirZ), 0)
      dummy.scale.set(p.meshScale[0], p.meshScale[1], p.meshScale[2])
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
