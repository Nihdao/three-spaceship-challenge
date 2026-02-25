import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import useWeapons from '../stores/useWeapons.jsx'
import useGame from '../stores/useGame.jsx'
import { playerShipGroupRef } from './PlayerShip.jsx'
import { WEAPONS } from '../entities/weaponDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

// Story 32.1: Fade duration for active/inactive transitions
const FADE_TIME = 0.2

export default function LaserCrossRenderer() {
  const groupRef = useRef()
  const mesh1Ref = useRef()
  const mesh2Ref = useRef()

  const def = WEAPONS.LASER_CROSS

  // One BoxGeometry per arm axis — created once, never in useFrame
  const geo1 = useMemo(() => new THREE.BoxGeometry(def.armLength * 2, def.armWidth, def.armWidth), [])
  const geo2 = useMemo(() => new THREE.BoxGeometry(def.armWidth, def.armWidth, def.armLength * 2), [])

  // Single shared material for both arms
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: def.projectileColor,
    transparent: true,
    opacity: 1,
    toneMapped: false,
    depthWrite: false,
  }), [])

  useEffect(() => {
    return () => {
      geo1.dispose()
      geo2.dispose()
      material.dispose()
    }
  }, [geo1, geo2, material])

  useFrame(() => {
    const group = groupRef.current
    const mesh1 = mesh1Ref.current
    const mesh2 = mesh2Ref.current
    if (!group || !mesh1 || !mesh2) return

    const { phase } = useGame.getState()
    if (phase !== 'gameplay') {
      group.visible = false
      return
    }

    const { activeWeapons } = useWeapons.getState()
    let weapon = null
    for (let i = 0; i < activeWeapons.length; i++) {
      if (activeWeapons[i].weaponId === 'LASER_CROSS') {
        weapon = activeWeapons[i]
        break
      }
    }

    if (!weapon) {
      group.visible = false
      return
    }

    // Follow the ship's actual Three.js position (already updated by PlayerShip.useFrame
    // earlier this same RAF tick) — avoids any Zustand store read lag when moving.
    const shipGroup = playerShipGroupRef.current
    const px = shipGroup ? shipGroup.position.x : 0
    const pz = shipGroup ? shipGroup.position.z : 0
    group.position.set(px, GAME_CONFIG.PROJECTILE_SPAWN_Y_OFFSET, pz)
    group.rotation.y = weapon.laserCrossAngle ?? 0

    // Compute opacity with 0.2s fade-in / fade-out at phase transitions
    let opacity
    if (weapon.laserCrossIsActive ?? true) {
      opacity = Math.min(1, (weapon.laserCrossCycleTimer ?? 0) / FADE_TIME)
    } else {
      opacity = Math.max(0, 1 - (weapon.laserCrossCycleTimer ?? 0) / FADE_TIME)
    }

    // Both meshes share the same material instance
    material.opacity = opacity
    group.visible = opacity > 0
  })

  return (
    <group ref={groupRef}>
      {/* Arm 1: along local X axis */}
      <mesh ref={mesh1Ref} geometry={geo1} material={material} />
      {/* Arm 2: along local Z axis — shares same material */}
      <mesh ref={mesh2Ref} geometry={geo2} material={material} />
    </group>
  )
}
