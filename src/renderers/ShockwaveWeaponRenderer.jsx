// Story 32.4: ShockwaveWeaponRenderer — renders player SHOCKWAVE arc bursts.
// DISTINCT from ShockwaveRenderer.jsx (enemy shockwaves from useEnemies).
// Renders sector arcs (120°) expanding outward from player toward cursor direction.

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useWeapons from '../stores/useWeapons.jsx'
import { WEAPONS } from '../entities/weaponDefs.js'

const POOL_SIZE = 9
const sectorAngle = Math.PI * 2 / 3 // 120° — must match swDef.waveSectorAngle

export default function ShockwaveWeaponRenderer() {
  const meshRefs = useRef([])

  const arcGeo = useMemo(() =>
    new THREE.RingGeometry(0.88, 1.0, 64, 1, 0, sectorAngle),
  [])

  const materials = useMemo(() =>
    Array.from({ length: POOL_SIZE }, () =>
      new THREE.MeshBasicMaterial({
        color: '#f9e547',
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    ),
  [])

  useEffect(() => {
    return () => {
      arcGeo.dispose()
      materials.forEach(m => m.dispose())
    }
  }, [arcGeo, materials])

  useFrame(() => {
    // Hide all slots each frame
    for (let i = 0; i < POOL_SIZE; i++) {
      if (meshRefs.current[i]) meshRefs.current[i].visible = false
    }

    const { activeWeapons } = useWeapons.getState()
    let swWeapon = null
    for (let i = 0; i < activeWeapons.length; i++) {
      const def = WEAPONS[activeWeapons[i].weaponId]
      if (def && def.weaponType === 'shockwave') {
        swWeapon = activeWeapons[i]
        break
      }
    }
    if (!swWeapon || !swWeapon.shockwaveArcs) return

    let slot = 0
    for (let a = 0; a < swWeapon.shockwaveArcs.length && slot < POOL_SIZE; a++) {
      const arc = swWeapon.shockwaveArcs[a]
      if (!arc.active) continue

      const mesh = meshRefs.current[slot]
      if (!mesh) { slot++; continue }

      mesh.visible = true
      mesh.position.set(arc.centerX, 0.3, arc.centerZ)

      // Scale the ring geometry outward from radius 0 to maxRadius
      const s = arc.currentRadius
      mesh.scale.set(s, s, 1)

      // rotation.order is set to 'YXZ' in JSX (once at mount, not per frame):
      // Rx(-π/2) flattens ring to XZ first, then Ry(θ) rotates in XZ toward cursor.
      // Default 'XYZ' applies Ry before Rx → ring tilts out of XZ at non-zero angles.
      mesh.rotation.set(-Math.PI / 2, Math.PI / 2 - sectorAngle / 2 - arc.aimAngle, 0)

      // Fade opacity as arc expands: bright at center, invisible at edge
      materials[slot].opacity = Math.max(0, (1 - arc.currentRadius / arc.maxRadius) * 0.7)

      slot++
    }
  })

  return (
    <>
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <mesh
          key={i}
          ref={el => { meshRefs.current[i] = el }}
          geometry={arcGeo}
          material={materials[i]}
          visible={false}
          frustumCulled={false}
          rotation-order="YXZ"
        />
      ))}
    </>
  )
}
