import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import useLevel from '../stores/useLevel.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

const WORMHOLE_COLOR = new THREE.Color('#00ccff')
const WORMHOLE_ACTIVATE_COLOR = new THREE.Color('#cc66ff')

export default function WormholeRenderer() {
  const wormholeState = useLevel((s) => s.wormholeState)
  const wormhole = useLevel((s) => s.wormhole)
  const wormholeActivationTimer = useLevel((s) => s.wormholeActivationTimer)

  const meshRef = useRef()
  const ringRef = useRef()

  const torusMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#003344',
    emissive: WORMHOLE_COLOR,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  }), [])

  const shockwaveMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: WORMHOLE_ACTIVATE_COLOR,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  }), [])

  useEffect(() => {
    return () => {
      torusMaterial.dispose()
      shockwaveMaterial.dispose()
    }
  }, [torusMaterial, shockwaveMaterial])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const clock = state.clock.elapsedTime

    if (wormholeState === 'visible') {
      // Dormant: slow rotation + pulsing glow
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.scale.setScalar(1)
      torusMaterial.emissiveIntensity = 0.5 + Math.sin(clock * 3) * 0.3
      torusMaterial.emissive = WORMHOLE_COLOR
    } else if (wormholeState === 'activating') {
      // Activating: faster rotation, brighter glow, scale up
      meshRef.current.rotation.y += delta * 3
      torusMaterial.emissiveIntensity = 1.5 + Math.sin(clock * 8) * 0.5
      torusMaterial.emissive = WORMHOLE_ACTIVATE_COLOR

      // Scale up wormhole mesh during activation
      const activationProgress = 1 - (wormholeActivationTimer / GAME_CONFIG.WORMHOLE_TRANSITION_DELAY)
      const meshScale = 1 + activationProgress * 0.5
      meshRef.current.scale.setScalar(meshScale)

      // Shockwave ring expansion
      if (ringRef.current) {
        const shockProgress = Math.min(1, activationProgress / (GAME_CONFIG.WORMHOLE_SHOCKWAVE_DURATION / GAME_CONFIG.WORMHOLE_TRANSITION_DELAY))
        const maxRadius = GAME_CONFIG.PLAY_AREA_SIZE * 0.5
        ringRef.current.scale.setScalar(shockProgress * maxRadius * 0.1)
        shockwaveMaterial.opacity = 0.4 * (1 - shockProgress)
      }
    } else if (wormholeState === 'active') {
      // Active: bright steady portal
      meshRef.current.rotation.y += delta * 2
      torusMaterial.emissiveIntensity = 2.0
      torusMaterial.emissive = WORMHOLE_ACTIVATE_COLOR
      meshRef.current.scale.setScalar(1.5)
    }
  })

  if (wormholeState === 'hidden' || !wormhole) return null

  return (
    <group position={[wormhole.x, 0, wormhole.z]}>
      {/* Main wormhole torus */}
      <mesh ref={meshRef} material={torusMaterial} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[8, 2, 16, 32]} />
      </mesh>

      {/* Inner glow disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6, 32]} />
        <meshBasicMaterial color={WORMHOLE_COLOR} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Shockwave ring (only during activation) */}
      {wormholeState === 'activating' && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} material={shockwaveMaterial}>
          <torusGeometry args={[1, 0.3, 8, 32]} />
        </mesh>
      )}
    </group>
  )
}
