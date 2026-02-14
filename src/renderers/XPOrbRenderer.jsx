import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getOrbs, getActiveCount } from '../systems/xpOrbSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX = GAME_CONFIG.MAX_XP_ORBS

export default function XPOrbRenderer() {
  const meshRef = useRef()
  const dummyRef = useRef(new THREE.Object3D())
  const standardColorRef = useRef(new THREE.Color(GAME_CONFIG.XP_ORB_COLOR))
  const rareColorRef = useRef(new THREE.Color(GAME_CONFIG.RARE_XP_GEM_COLOR))

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), [])
  // Story 19.1: Material uses white as base so instanceColor can control per-orb color
  // emissive is set to white with high intensity for glow effect
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff', // Base color multiplied by instanceColor
        emissive: '#ffffff', // Emissive glow multiplied by instanceColor
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
    const standardColor = standardColorRef.current
    const rareColor = rareColorRef.current

    for (let i = 0; i < count; i++) {
      const orb = orbs[i]
      const y = 0.5 + Math.sin((elapsed + orb.x * 0.5 + orb.z * 0.3) * 3) * 0.3

      // Story 19.1: Apply scale multiplier and pulse animation for rare orbs
      let scaleX = sx
      let scaleY = sy
      let scaleZ = sz
      if (orb.isRare) {
        const rareScaleMult = GAME_CONFIG.RARE_XP_GEM_SCALE_MULTIPLIER
        // Pulse animation: subtle scale oscillation
        const pulsePhase = elapsed * GAME_CONFIG.RARE_XP_GEM_PULSE_SPEED
        const pulse = 1 + Math.sin(pulsePhase) * 0.1 // ±10% scale oscillation
        scaleX = sx * rareScaleMult * pulse
        scaleY = sy * rareScaleMult * pulse
        scaleZ = sz * rareScaleMult * pulse
      }

      dummy.position.set(orb.x, y, orb.z)
      dummy.scale.set(scaleX, scaleY, scaleZ)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      // Story 19.1: Set per-instance color (cyan for standard, golden for rare)
      if (orb.isRare) {
        mesh.setColorAt(i, rareColor)
      } else {
        mesh.setColorAt(i, standardColor)
      }
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
