import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import useEnemies from '../stores/useEnemies.jsx'

const MAX_SHOCKWAVES = 20
const _dummy = new THREE.Object3D()

export default function ShockwaveRenderer() {
  const meshRef = useRef()

  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ff6600',
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [])

  useEffect(() => {
    return () => material.dispose()
  }, [material])

  useFrame(() => {
    const { shockwaves } = useEnemies.getState()
    const mesh = meshRef.current
    if (!mesh) return

    let count = 0
    for (let i = 0; i < shockwaves.length; i++) {
      const sw = shockwaves[i]
      if (!sw.active) continue

      _dummy.position.set(sw.x, 0.2, sw.z)
      _dummy.rotation.set(-Math.PI / 2, 0, 0)
      const scale = sw.radius * 2
      _dummy.scale.set(scale, scale, 1)
      _dummy.updateMatrix()
      mesh.setMatrixAt(count, _dummy.matrix)

      count++
    }

    mesh.count = count
    if (count > 0) {
      mesh.instanceMatrix.needsUpdate = true
    }

    // Fade opacity based on average lifetime progress
    if (count > 0 && shockwaves.length > 0) {
      const firstActive = shockwaves.find(sw => sw.active)
      if (firstActive) {
        material.opacity = Math.max(0, firstActive.lifetime * 0.8)
      }
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, MAX_SHOCKWAVES]} material={material} frustumCulled={false}>
      <ringGeometry args={[0.8, 1, 32]} />
    </instancedMesh>
  )
}
