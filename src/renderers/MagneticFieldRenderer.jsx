import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useWeapons from '../stores/useWeapons.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { WEAPONS } from '../entities/weaponDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

// Story 32.2: Renders the MAGNETIC_FIELD aura — a flat disc + edge ring following the player.
// Self-hides when the weapon is not equipped. Read-only renderer (no store mutations).
export default function MagneticFieldRenderer() {
  const groupRef = useRef()
  const discRef = useRef()
  const ringRef = useRef()

  const { circleGeo, ringGeo, fillMat, edgeMat } = useMemo(() => {
    const circleGeo = new THREE.CircleGeometry(1, 64)
    const ringGeo = new THREE.RingGeometry(0.94, 1.0, 64)
    const fillMat = new THREE.MeshBasicMaterial({
      color: '#c084fc',
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const edgeMat = new THREE.MeshBasicMaterial({
      color: '#c084fc',
      transparent: true,
      opacity: 0.40,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    return { circleGeo, ringGeo, fillMat, edgeMat }
  }, [])

  useEffect(() => {
    return () => {
      circleGeo.dispose()
      ringGeo.dispose()
      fillMat.dispose()
      edgeMat.dispose()
    }
  }, [circleGeo, ringGeo, fillMat, edgeMat])

  useFrame((state) => {
    if (!groupRef.current) return

    const { activeWeapons } = useWeapons.getState()
    let weapon = null
    for (let i = 0; i < activeWeapons.length; i++) {
      const def = WEAPONS[activeWeapons[i].weaponId]
      if (def && def.weaponType === 'aura') {
        weapon = activeWeapons[i]
        break
      }
    }

    if (!weapon) {
      groupRef.current.visible = false
      return
    }

    groupRef.current.visible = true

    const { position: pos } = usePlayer.getState()
    groupRef.current.position.set(pos[0], GAME_CONFIG.PROJECTILE_SPAWN_Y_OFFSET, pos[2])

    const def = WEAPONS[weapon.weaponId]
    const radius = weapon.effectiveRadius ?? weapon.overrides?.auraRadius ?? def.auraRadius
    const pulse = 1.0 + 0.05 * Math.sin(state.clock.elapsedTime * Math.PI * 2) // 1Hz, [0.95, 1.05]
    // CircleGeometry is in local XY plane; after rotation={[-π/2,0,0]}, local Y maps to world Z.
    // Scale must be (radius, radius, 1) so both world X and world Z dimensions equal radius.
    groupRef.current.scale.set(radius * pulse, radius * pulse, 1)
  })

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <mesh ref={discRef} geometry={circleGeo} material={fillMat} />
      <mesh ref={ringRef} geometry={ringGeo} material={edgeMat} />
    </group>
  )
}
