import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getParticles, getActiveCount, updateParticles, MAX_PARTICLES } from '../systems/particleSystem.js'

const _color = new THREE.Color()

export default function ParticleRenderer() {
  const meshRef = useRef(null)
  const dummyRef = useRef(new THREE.Object3D())

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    // Enable per-instance color
    mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_PARTICLES * 3),
      3
    )
    return () => {
      if (mesh) {
        mesh.geometry.dispose()
        mesh.material.dispose()
      }
    }
  }, [])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    updateParticles(delta)

    const particles = getParticles()
    const count = getActiveCount()
    const dummy = dummyRef.current

    for (let i = 0; i < count; i++) {
      const p = particles[i]
      const ageFactor = 1 - p.elapsedTime / p.lifetime
      const scale = p.size * ageFactor

      dummy.position.set(p.x, 0.5, p.z)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      _color.set(p.color)
      mesh.setColorAt(i, _color)
    }

    mesh.count = count
    if (count > 0) {
      mesh.instanceMatrix.needsUpdate = true
      mesh.instanceColor.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]} frustumCulled={false}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial />
    </instancedMesh>
  )
}
