import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useWeapons from '../stores/useWeapons.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { WEAPONS } from '../entities/weaponDefs.js'

// Read mineCount from the def so the renderer stays in sync with weaponDefs.js
const MINE_COUNT = WEAPONS.MINE_AROUND.mineCount

// Story 32.5: Renders MINE_COUNT orbiting MINE_AROUND mine spheres following the player.
// Self-hides when the weapon is not equipped. Read-only renderer (no store mutations).
export default function MineAroundRenderer() {
  const meshRefs = useRef([])

  const mineGeo = useMemo(() => new THREE.SphereGeometry(0.8, 16, 16), [])
  const mineMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#b06cf0',
    transparent: false,
  }), [])

  useEffect(() => {
    return () => {
      mineGeo.dispose()
      mineMat.dispose()
    }
  }, [mineGeo, mineMat])

  useFrame((state) => {
    const { activeWeapons } = useWeapons.getState()
    let mineWeapon = null
    for (let i = 0; i < activeWeapons.length; i++) {
      const def = WEAPONS[activeWeapons[i].weaponId]
      if (def && def.weaponType === 'mine_around') {
        mineWeapon = activeWeapons[i]
        break
      }
    }

    // Hide all meshes if weapon not found or not initialized
    if (!mineWeapon || !mineWeapon.mines) {
      for (let i = 0; i < MINE_COUNT; i++) {
        const mesh = meshRefs.current[i]
        if (mesh) mesh.visible = false
      }
      return
    }

    const { position: pos } = usePlayer.getState()
    const orbitalRadius = WEAPONS[mineWeapon.weaponId].orbitalRadius

    for (let i = 0; i < MINE_COUNT; i++) {
      const mine = mineWeapon.mines[i]
      const mesh = meshRefs.current[i]
      if (!mesh) continue

      if (!mine || !mine.active) {
        mesh.visible = false
        continue
      }

      const angle = mineWeapon.mineOrbitalAngle + (Math.PI * 2 / MINE_COUNT) * i
      mesh.position.set(
        pos[0] + Math.cos(angle) * orbitalRadius,
        -0.5,
        pos[2] + Math.sin(angle) * orbitalRadius,
      )

      // Pulse: ~2Hz, range [0.7, 0.9]
      const pulse = 0.8 + 0.1 * Math.sin(state.clock.elapsedTime * Math.PI * 4)
      mesh.scale.setScalar(pulse)
      mesh.visible = true
    }
  })

  return (
    <>
      {Array.from({ length: MINE_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={el => { meshRefs.current[i] = el }}
          geometry={mineGeo}
          material={mineMat}
          frustumCulled={false}
        />
      ))}
    </>
  )
}
