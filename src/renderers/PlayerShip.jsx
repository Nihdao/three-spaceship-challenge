import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import usePlayer from '../stores/usePlayer.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

const _lighting = GAME_CONFIG.PLAYER_SHIP_LIGHTING
const _dashEmissive = new THREE.Color(GAME_CONFIG.DASH_TRAIL_COLOR)
const _engineEmissive = new THREE.Color(_lighting.ENGINE_EMISSIVE_COLOR)

export default function PlayerShip() {
  const groupRef = useRef()
  const bankRef = useRef()
  const trailRef = useRef()
  const { scene } = useGLTF('/models/ships/Spaceship.glb')
  const clonedScene = useMemo(() => scene.clone(), [scene])

  // Collect mesh materials and apply engine emissive glow (Story 12.1)
  const { allMaterials, engineMaterials } = useMemo(() => {
    const all = []
    const engines = []
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        const isEngine = child.name.toLowerCase().includes('engine') ||
                         child.name.toLowerCase().includes('thruster')
        for (const mat of materials) {
          if (mat.emissive !== undefined && !all.includes(mat)) {
            all.push(mat)
            if (isEngine) {
              mat.emissive.copy(_engineEmissive)
              mat.emissiveIntensity = _lighting.ENGINE_EMISSIVE_INTENSITY
              mat.needsUpdate = true
              engines.push(mat)
            }
          }
        }
      }
    })
    return { allMaterials: all, engineMaterials: engines }
  }, [clonedScene])

  const wasDashingRef = useRef(false)

  useFrame(() => {
    if (!groupRef.current || !bankRef.current) return

    const { position, rotation, bankAngle, isDashing, dashTimer } = usePlayer.getState()

    groupRef.current.position.set(position[0], position[1], position[2])
    groupRef.current.rotation.set(0, Math.PI - rotation, 0)

    if (isDashing) {
      const progress = (GAME_CONFIG.DASH_DURATION - dashTimer) / GAME_CONFIG.DASH_DURATION
      bankRef.current.rotation.set(0, 0, progress * Math.PI * 2)

      if (!wasDashingRef.current) {
        for (let i = 0; i < allMaterials.length; i++) {
          allMaterials[i].emissive.copy(_dashEmissive)
          allMaterials[i].emissiveIntensity = 0.6
        }
      }
    } else {
      bankRef.current.rotation.set(0, 0, bankAngle)

      // Restore engine emissive when dash ends (Story 12.1)
      if (wasDashingRef.current) {
        for (let i = 0; i < allMaterials.length; i++) {
          allMaterials[i].emissive.setScalar(0)
          allMaterials[i].emissiveIntensity = 1.0
        }
        for (let i = 0; i < engineMaterials.length; i++) {
          engineMaterials[i].emissive.copy(_engineEmissive)
          engineMaterials[i].emissiveIntensity = _lighting.ENGINE_EMISSIVE_INTENSITY
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
      {/* Local point light for ship illumination (Story 12.1) */}
      <pointLight
        intensity={_lighting.POINT_LIGHT_INTENSITY}
        distance={_lighting.POINT_LIGHT_DISTANCE}
        decay={2}
        color="#ffffff"
        position={[0, _lighting.POINT_LIGHT_Y, 0]}
      />
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
