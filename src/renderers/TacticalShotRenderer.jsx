import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useWeapons from '../stores/useWeapons.jsx'
import { WEAPONS } from '../entities/weaponDefs.js'

const POOL_SIZE = 4

export default function TacticalShotRenderer() {
  const flashRefs = useRef([])
  const ringRefs = useRef([])

  const flashGeo = useMemo(() => new THREE.CircleGeometry(2, 16), [])
  const ringGeo = useMemo(() => new THREE.RingGeometry(0.88, 1.0, 48), [])

  const flashMats = useMemo(() => Array.from({ length: POOL_SIZE }, () =>
    new THREE.MeshBasicMaterial({ color: '#2dc653', transparent: true, opacity: 0, side: THREE.DoubleSide })
  ), [])
  const ringMats = useMemo(() => Array.from({ length: POOL_SIZE }, () =>
    new THREE.MeshBasicMaterial({ color: '#2dc653', transparent: true, opacity: 0, side: THREE.DoubleSide })
  ), [])

  useEffect(() => {
    return () => {
      flashGeo.dispose()
      ringGeo.dispose()
      for (let i = 0; i < POOL_SIZE; i++) {
        flashMats[i].dispose()
        ringMats[i].dispose()
      }
    }
  }, [flashGeo, ringGeo, flashMats, ringMats])

  useFrame(() => {
    const { activeWeapons } = useWeapons.getState()
    let tacticalWeapon = null
    for (let i = 0; i < activeWeapons.length; i++) {
      const def = WEAPONS[activeWeapons[i].weaponId]
      if (def && def.weaponType === 'tactical_shot') {
        tacticalWeapon = activeWeapons[i]
        break
      }
    }
    const strikes = tacticalWeapon?.tacticalStrikes

    for (let i = 0; i < POOL_SIZE; i++) {
      const flash = flashRefs.current[i]
      const ring = ringRefs.current[i]
      if (!flash || !ring) continue

      if (!strikes || i >= strikes.length) {
        flash.visible = false
        ring.visible = false
        continue
      }

      const strike = strikes[i]
      const progress = 1 - (strike.timer / strike.maxDuration)
      const opacity = 1 - progress

      // Flash disc
      flash.position.set(strike.x, -0.4, strike.z)
      flash.rotation.x = -Math.PI / 2
      flash.visible = true
      flashMats[i].opacity = opacity * 0.85

      // Expanding ring
      const ringScale = progress * strike.splashRadius
      ring.position.set(strike.x, -0.45, strike.z)
      ring.rotation.x = -Math.PI / 2
      ring.scale.setScalar(Math.max(0.01, ringScale))
      ring.visible = true
      ringMats[i].opacity = opacity * 0.6
    }
  })

  return (
    <>
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <mesh
          key={`tshot-flash-${i}`}
          ref={el => { flashRefs.current[i] = el }}
          geometry={flashGeo}
          material={flashMats[i]}
          frustumCulled={false}
          visible={false}
        />
      ))}
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <mesh
          key={`tshot-ring-${i}`}
          ref={el => { ringRefs.current[i] = el }}
          geometry={ringGeo}
          material={ringMats[i]}
          frustumCulled={false}
          visible={false}
        />
      ))}
    </>
  )
}
