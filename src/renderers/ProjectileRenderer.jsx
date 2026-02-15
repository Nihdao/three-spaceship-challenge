import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useWeapons from '../stores/useWeapons.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX = GAME_CONFIG.MAX_PROJECTILES

export default function ProjectileRenderer() {
  const meshRef = useRef()
  const dummyRef = useRef(new THREE.Object3D())
  const tempColorRef = useRef(new THREE.Color())

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: GAME_CONFIG.PROJECTILE_VISUALS.EMISSIVE_BASE_COLOR,
        emissiveIntensity: GAME_CONFIG.PROJECTILE_VISUALS.EMISSIVE_INTENSITY,
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
    const tempColor = tempColorRef.current
    const visuals = GAME_CONFIG.PROJECTILE_VISUALS
    // Story 20.1: Zone bonus scales projectile visuals
    const zoneScale = usePlayer.getState().permanentUpgradeBonuses.zone

    let count = 0
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i]
      if (!p.active) continue

      dummy.position.set(p.x, p.y ?? 0.5, p.z)
      dummy.rotation.set(0, Math.atan2(p.dirX, p.dirZ), 0)

      // Story 12.2: velocity-based elongation for motion blur effect
      let scaleZ = p.meshScale[2]
      if (visuals.MOTION_BLUR_ENABLED) {
        const speed = Math.sqrt(p.dirX ** 2 + p.dirZ ** 2) * p.speed
        const speedMult = Math.min(1.0 + speed * visuals.SPEED_SCALE_MULT, visuals.SPEED_SCALE_MAX)
        scaleZ *= speedMult
      }
      dummy.scale.set(p.meshScale[0] * zoneScale, p.meshScale[1] * zoneScale, scaleZ * zoneScale)

      dummy.updateMatrix()
      mesh.setMatrixAt(count, dummy.matrix)

      tempColor.set(p.color)
      mesh.setColorAt(count, tempColor)

      count++
    }

    mesh.count = count
    if (count > 0) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
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
