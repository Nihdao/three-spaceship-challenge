import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getTrailParticles, getActiveTrailCount, MAX_TRAIL_PARTICLES } from '../systems/particleTrailSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const _color = new THREE.Color()
const trailCfg = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS.SHIP_TRAIL

// Pre-compute base HSL from trail color
const _baseColor = new THREE.Color(trailCfg.COLOR)
const _baseHSL = { h: 0, s: 0, l: 0 }
_baseColor.getHSL(_baseHSL)
const _elongation = trailCfg.PARTICLE_ELONGATION

export default function TrailRenderer() {
  const meshRef = useRef(null)
  const dummyRef = useRef(new THREE.Object3D())

  useEffect(() => {
    // One-time setup: allocate instance color buffer and register cleanup
    const mesh = meshRef.current
    if (!mesh) return
    mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_TRAIL_PARTICLES * 3),
      3
    )
    return () => {
      if (mesh) {
        mesh.geometry.dispose()
        mesh.material.dispose()
      }
    }
  }, [])

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const particles = getTrailParticles()
    const count = getActiveTrailCount()
    const dummy = dummyRef.current

    for (let i = 0; i < count; i++) {
      const p = particles[i]
      const ageFactor = 1 - p.elapsedTime / p.lifetime
      const scale = p.size * ageFactor

      dummy.position.set(p.x, 0, p.z)
      // Orient along movement direction and elongate
      // Use manual rotation (atan2) instead of lookAt for better performance
      if (p.dirX !== 0 || p.dirZ !== 0) {
        dummy.rotation.y = Math.atan2(p.dirX, p.dirZ)
        dummy.scale.set(scale, scale, scale * _elongation)
      } else {
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(scale, scale, scale)
      }
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      // Apply dash brightness multiplier if particle was emitted during dash
      const brightnessMult = p.isDashing ? trailCfg.DASH_BRIGHTNESS_MULTIPLIER : 1.0
      _color.setHSL(_baseHSL.h, _baseHSL.s, _baseHSL.l * ageFactor * brightnessMult)
      mesh.setColorAt(i, _color)
    }

    mesh.count = count
    if (count > 0) {
      mesh.instanceMatrix.needsUpdate = true
      mesh.instanceColor.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_TRAIL_PARTICLES]} frustumCulled={false}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.45} />
    </instancedMesh>
  )
}
