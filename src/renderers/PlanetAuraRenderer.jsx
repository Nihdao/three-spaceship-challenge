import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import usePlayer from '../stores/usePlayer.jsx'
import useLevel from '../stores/useLevel.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { PLANETS } from '../entities/planetDefs.js'

const MAX_AURAS = 10

const TIER_COLOR_KEY = {
  standard:  'SILVER_COLOR',
  rare:      'GOLD_COLOR',
  legendary: 'PLATINUM_COLOR',
}

export default function PlanetAuraRenderer() {
  const meshRef = useRef()
  const dummyRef = useRef(new THREE.Object3D())
  const tempColorRef = useRef(new THREE.Color())
  const auraStates = useRef(new Map())

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 32, 16), [])

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    const cfg = GAME_CONFIG.PLANET_AURA
    const pos = usePlayer.getState().position
    const playerX = pos[0]
    const playerZ = pos[2]
    const planets = useLevel.getState().planets
    const dummy = dummyRef.current
    const tempColor = tempColorRef.current
    const states = auraStates.current

    // Find closest unscanned planet within scan range
    let closestId = null
    let closestDist = Infinity

    for (const planet of planets) {
      if (planet.scanned && !cfg.SHOW_COMPLETED_AURA) continue

      const dx = playerX - planet.x
      const dz = playerZ - planet.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      const scanRadius = PLANETS[planet.typeId].scanRadius
      if (dist <= scanRadius && dist < closestDist) {
        closestId = planet.id
        closestDist = dist
      }
    }

    // Update fade states
    for (const planet of planets) {
      if (!states.has(planet.id)) {
        states.set(planet.id, { opacity: 0, pulsePhase: 0 })
      }

      const s = states.get(planet.id)
      const isActive = closestId === planet.id
      const targetOpacity = planet.scanned && cfg.SHOW_COMPLETED_AURA
        ? cfg.COMPLETED_OPACITY
        : cfg.OPACITY_MAX

      if (isActive && s.opacity < targetOpacity) {
        s.opacity = Math.min(targetOpacity, s.opacity + delta / cfg.FADE_IN_DURATION)
      } else if (isActive && s.opacity > targetOpacity) {
        s.opacity = targetOpacity
      } else if (!isActive && s.opacity > 0) {
        s.opacity = Math.max(0, s.opacity - delta / cfg.FADE_OUT_DURATION)
      }

      if (s.opacity > 0) {
        s.pulsePhase += delta * cfg.PULSE_SPEED
      }
    }

    // Compute max opacity across all auras (used for shared material + per-instance brightness)
    let maxOpacity = 0
    for (const s of states.values()) {
      if (s.opacity > maxOpacity) maxOpacity = s.opacity
    }

    // Render visible auras
    let count = 0
    for (const planet of planets) {
      const s = states.get(planet.id)
      if (!s || s.opacity <= 0) continue

      const scanRadius = PLANETS[planet.typeId].scanRadius

      dummy.position.set(planet.x, GAME_CONFIG.PLANET_MODEL_Y_OFFSET, planet.z)
      dummy.rotation.set(0, 0, 0)

      const pulseMult = 1.0 + Math.sin(s.pulsePhase) * cfg.PULSE_AMPLITUDE
      const scale = scanRadius * pulseMult
      dummy.scale.set(scale, scale, scale)

      dummy.updateMatrix()
      mesh.setMatrixAt(count, dummy.matrix)

      const colorKey = planet.scanned && cfg.SHOW_COMPLETED_AURA
        ? 'COMPLETED_COLOR'
        : TIER_COLOR_KEY[planet.tier]
      tempColor.set(cfg[colorKey] || '#ffffff')
      // Scale color brightness by per-instance opacity ratio to simulate
      // individual opacity (shared material only supports one opacity value).
      // With AdditiveBlending, dimmer color = visually lower opacity.
      if (maxOpacity > 0) {
        tempColor.multiplyScalar(s.opacity / maxOpacity)
      }
      mesh.setColorAt(count, tempColor)

      count++
    }

    mesh.count = count
    if (count > 0) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }

    material.opacity = maxOpacity
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_AURAS]}
      frustumCulled={false}
    />
  )
}
