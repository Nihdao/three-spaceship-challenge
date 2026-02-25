import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useWeapons from '../stores/useWeapons.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX = GAME_CONFIG.MAX_PROJECTILES

export default function ProjectileRenderer() {
  const meshRef = useRef()
  const sphereMeshRef = useRef()
  const dummyRef = useRef(new THREE.Object3D())
  const tempColorRef = useRef(new THREE.Color())

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.5, 8, 8), [])
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
  const sphereMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      sphereGeometry.dispose()
      material.dispose()
      sphereMaterial.dispose()
    }
  }, [geometry, sphereGeometry, material, sphereMaterial])

  useFrame(() => {
    const mesh = meshRef.current
    const sphereMesh = sphereMeshRef.current
    if (!mesh || !sphereMesh) return

    const projectiles = useWeapons.getState().projectiles
    const dummy = dummyRef.current
    const tempColor = tempColorRef.current
    const visuals = GAME_CONFIG.PROJECTILE_VISUALS
    // Story 20.1: Zone bonus scales projectile visuals
    const zoneScale = usePlayer.getState().permanentUpgradeBonuses.zone

    let count = 0
    let sphereCount = 0
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i]
      if (!p.active) continue
      if (p.explosionRadius) continue // Story 32.7: rendered by ExplosiveRoundRenderer

      dummy.position.set(p.x, p.y ?? 0.5, p.z)

      if (p.weaponId === 'DIAGONALS') {
        // Spherical projectiles — no rotation, no motion blur elongation
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(p.meshScale[0] * zoneScale, p.meshScale[1] * zoneScale, p.meshScale[2] * zoneScale)
        dummy.updateMatrix()
        sphereMesh.setMatrixAt(sphereCount, dummy.matrix)
        tempColor.set(p.color)
        sphereMesh.setColorAt(sphereCount, tempColor)
        sphereCount++
      } else {
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
    }

    mesh.count = count
    if (count > 0) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }

    sphereMesh.count = sphereCount
    if (sphereCount > 0) {
      sphereMesh.instanceMatrix.needsUpdate = true
      if (sphereMesh.instanceColor) sphereMesh.instanceColor.needsUpdate = true
    }
  })

  return (
    <>
      <instancedMesh ref={meshRef} args={[geometry, material, MAX]} frustumCulled={false} />
      <instancedMesh ref={sphereMeshRef} args={[sphereGeometry, sphereMaterial, MAX]} frustumCulled={false} />
    </>
  )
}
