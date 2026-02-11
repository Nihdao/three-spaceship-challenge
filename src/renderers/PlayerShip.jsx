import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import usePlayer from '../stores/usePlayer.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

const _dashEmissive = new THREE.Color(GAME_CONFIG.DASH_TRAIL_COLOR)
const _defaultEmissive = new THREE.Color(0x000000)

export default function PlayerShip() {
  const groupRef = useRef()
  const bankRef = useRef()
  const trailRef = useRef()
  const { scene } = useGLTF('/models/ships/Spaceship.glb')
  const clonedScene = useMemo(() => scene.clone(), [scene])

  // Collect all mesh materials from the cloned scene for emissive toggling
  const meshMaterials = useMemo(() => {
    const mats = []
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        for (const mat of materials) {
          if (mat.emissive !== undefined && !mats.includes(mat)) {
            mats.push(mat)
          }
        }
      }
    })
    return mats
  }, [clonedScene])

  const wasDashingRef = useRef(false)

  useFrame(() => {
    if (!groupRef.current || !bankRef.current) return

    const { position, rotation, bankAngle, isDashing, dashTimer } = usePlayer.getState()

    groupRef.current.position.set(position[0], position[1], position[2])
    groupRef.current.rotation.set(0, Math.PI - rotation, 0)

    if (isDashing) {
      // Full 360° barrel roll over DASH_DURATION
      const progress = (GAME_CONFIG.DASH_DURATION - dashTimer) / GAME_CONFIG.DASH_DURATION
      bankRef.current.rotation.set(0, 0, progress * Math.PI * 2)

      // Magenta emissive tint during dash
      if (!wasDashingRef.current) {
        for (let i = 0; i < meshMaterials.length; i++) {
          meshMaterials[i].emissive.copy(_dashEmissive)
          meshMaterials[i].emissiveIntensity = 0.6
        }
      }
    } else {
      bankRef.current.rotation.set(0, 0, bankAngle)

      // Restore default emissive when dash ends
      // NOTE: Assumes no other system modifies mesh emissives concurrently
      if (wasDashingRef.current) {
        for (let i = 0; i < meshMaterials.length; i++) {
          meshMaterials[i].emissive.copy(_defaultEmissive)
          meshMaterials[i].emissiveIntensity = 1.0
        }
      }
    }
    wasDashingRef.current = isDashing

    // Trail visibility + fade
    if (trailRef.current) {
      trailRef.current.visible = isDashing
      if (isDashing) {
        const fade = dashTimer / GAME_CONFIG.DASH_DURATION
        trailRef.current.material.opacity = 0.5 * fade
      }
    }
  })

  return (
    <group ref={groupRef}>
      <group ref={bankRef}>
        <primitive object={clonedScene} />
      </group>
      {/* Magenta trail — outside bankRef so it stays horizontal during barrel roll */}
      <mesh ref={trailRef} position={[0, 0, 4]} visible={false}>
        <planeGeometry args={[1.5, 8]} />
        <meshBasicMaterial
          color={GAME_CONFIG.DASH_TRAIL_COLOR}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

useGLTF.preload('/models/ships/Spaceship.glb')
