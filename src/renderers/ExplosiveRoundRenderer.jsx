import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useWeapons from '../stores/useWeapons.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { getRings } from '../systems/explosiveRoundVfx.js'

const SPHERE_POOL = 12
const RING_POOL = 6

export default function ExplosiveRoundRenderer() {
  const sphereMeshRef = useRef()
  const ringMeshRefs = useRef([])
  const dummyRef = useRef(new THREE.Object3D())

  const { sphereGeo, sphereMat, ringGeo, ringMats } = useMemo(() => {
    const _sphereGeo = new THREE.SphereGeometry(0.5, 16, 12)
    const _sphereMat = new THREE.MeshStandardMaterial({
      color: '#f4c430',
      emissive: '#f4c430',
      emissiveIntensity: 1.0,
      toneMapped: false,
    })
    const _ringGeo = new THREE.CircleGeometry(1, 32)
    const _ringMats = Array.from({ length: RING_POOL }, () =>
      new THREE.MeshBasicMaterial({
        color: '#f4c430',
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    )
    return { sphereGeo: _sphereGeo, sphereMat: _sphereMat, ringGeo: _ringGeo, ringMats: _ringMats }
  }, [])

  useEffect(() => {
    return () => {
      sphereGeo.dispose()
      sphereMat.dispose()
      ringGeo.dispose()
      for (let i = 0; i < ringMats.length; i++) ringMats[i].dispose()
    }
  }, [sphereGeo, sphereMat, ringGeo, ringMats])

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime()
    // Pulse multiplier: oscillates between 0.9 and 1.2 at 8Hz
    const pulseMult = 1.05 + 0.15 * Math.sin(elapsed * Math.PI * 16)
    // Emissive: maps pulse [0.9, 1.2] → intensity [0.6, 1.6]
    sphereMat.emissiveIntensity = 0.6 + (pulseMult - 0.9) * (1.0 / 0.3)

    const zoneScale = usePlayer.getState().permanentUpgradeBonuses.zone
    const projectiles = useWeapons.getState().projectiles
    const dummy = dummyRef.current
    const mesh = sphereMeshRef.current
    if (!mesh) return

    let count = 0
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i]
      if (!p.active || !p.explosionRadius) continue
      dummy.position.set(p.x, p.y ?? 0.5, p.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(p.meshScale[0] * pulseMult * zoneScale)
      dummy.updateMatrix()
      mesh.setMatrixAt(count, dummy.matrix)
      count++
    }
    mesh.count = count
    if (count > 0) mesh.instanceMatrix.needsUpdate = true

    // Ring expansion
    const rings = getRings()
    for (let i = 0; i < RING_POOL; i++) {
      const ringMesh = ringMeshRefs.current[i]
      const mat = ringMats[i]
      if (!ringMesh || !mat) continue
      if (i >= rings.length) { ringMesh.visible = false; continue }
      const ring = rings[i]
      const progress = 1 - (ring.timer / ring.maxDuration) // 0=just spawned, 1=expiring
      const ringScale = Math.max(0.01, progress * ring.maxRadius)
      ringMesh.position.set(ring.x, -0.4, ring.z)
      ringMesh.rotation.x = -Math.PI / 2
      ringMesh.scale.setScalar(ringScale)
      ringMesh.visible = true
      mat.opacity = (1 - progress) * 0.55
    }
  })

  return (
    <>
      <instancedMesh
        ref={sphereMeshRef}
        args={[sphereGeo, sphereMat, SPHERE_POOL]}
        frustumCulled={false}
      />
      {Array.from({ length: RING_POOL }, (_, i) => (
        <mesh
          key={`exp-ring-${i}`}
          ref={el => { ringMeshRefs.current[i] = el }}
          geometry={ringGeo}
          material={ringMats[i]}
          frustumCulled={false}
          visible={false}
        />
      ))}
    </>
  )
}
