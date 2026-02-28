import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import usePlayer from '../stores/usePlayer.jsx'
import useShipProgression from '../stores/useShipProgression.jsx'
import { getSkinForShip } from '../entities/shipSkinDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

// Shared ref — allows other renderers (e.g. LaserCrossRenderer) to read the ship's
// current Three.js world position without an independent Zustand read, eliminating
// any potential one-frame lag when the ship is moving.
export const playerShipGroupRef = { current: null }

const _lighting = GAME_CONFIG.PLAYER_SHIP_LIGHTING
const _dashEmissive = new THREE.Color(GAME_CONFIG.DASH_TRAIL_COLOR)
const _engineEmissive = new THREE.Color(_lighting.ENGINE_EMISSIVE_COLOR)

export default function PlayerShip() {
  const groupRef = useRef()
  const bankRef = useRef()
  const trailRef = useRef()

  // Resolve the model path from the selected skin (colours are baked into the GLB).
  const currentShipId = usePlayer.getState().currentShipId || 'BALANCED'
  const selectedSkinId = useShipProgression.getState().getSelectedSkin(currentShipId)
  const skinData = getSkinForShip(currentShipId, selectedSkinId)
  const modelPath = skinData?.modelPath ?? '/models/ships/Spaceship.glb'

  const { scene } = useGLTF(modelPath)

  // Clone scene + materials to avoid mutating the shared GLB cache.
  // Emissive setup is deferred to first useFrame — useMemo runs during React render but
  // R3F may reinitialize material state before the first draw. useFrame runs immediately
  // before renderer.render() in the same RAF, matching the timing of the post-dash restoration.
  const clonedScene = useMemo(() => scene.clone(), [scene])

  const { allMaterials, engineMaterials } = useMemo(() => {
    const all = []
    const engines = []
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map(m => m.clone())
        } else {
          child.material = child.material.clone()
        }
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        const isEngine = child.name.toLowerCase().includes('engine') ||
                         child.name.toLowerCase().includes('thruster')
        for (const mat of materials) {
          if (mat.emissive !== undefined && !all.includes(mat)) {
            all.push(mat)
            if (isEngine) engines.push(mat)
          }
        }
      }
    })
    return { allMaterials: all, engineMaterials: engines }
  }, [clonedScene])

  // Populate the shared module-level ref once, so other renderers can track the ship
  useEffect(() => {
    playerShipGroupRef.current = groupRef.current
    return () => { playerShipGroupRef.current = null }
  }, [])

  const wasDashingRef = useRef(false)
  const initDoneRef = useRef(false)

  useFrame((state) => {
    if (!groupRef.current || !bankRef.current) return

    // First-frame emissive init: runs before the first draw call, same timing as post-dash
    if (!initDoneRef.current) {
      initDoneRef.current = true
      for (let i = 0; i < allMaterials.length; i++) {
        allMaterials[i].emissive.setScalar(0)
        allMaterials[i].emissiveIntensity = 1.0
      }
      for (let i = 0; i < engineMaterials.length; i++) {
        engineMaterials[i].emissive.copy(_engineEmissive)
        engineMaterials[i].emissiveIntensity = _lighting.ENGINE_EMISSIVE_INTENSITY
      }
    }

    const { position, rotation, bankAngle, isDashing, dashTimer, isInvulnerable, invulnerabilityTimer, shieldTimer } = usePlayer.getState()

    groupRef.current.position.set(position[0], position[1], position[2])
    groupRef.current.rotation.set(0, Math.PI - rotation, 0)

    if (isDashing) {
      const progress = (GAME_CONFIG.DASH_DURATION - dashTimer) / GAME_CONFIG.DASH_DURATION
      bankRef.current.rotation.set(0, 0, progress * Math.PI * 4)

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

    // Invincibility visual feedback (Story 22.1) — flashing effect
    // Shield active: use shieldTimer for phase so the blink is always animated
    if (isInvulnerable && !isDashing) {
      const flashFrequency = GAME_CONFIG.REVIVAL_FLASH_RATE * Math.PI * 2
      const timerForPhase = shieldTimer > 0 ? shieldTimer : invulnerabilityTimer
      const flashPhase = timerForPhase * flashFrequency
      const flashOpacity = 0.3 + 0.7 * ((Math.sin(flashPhase) + 1) / 2)

      for (let i = 0; i < allMaterials.length; i++) {
        allMaterials[i].opacity = flashOpacity
        allMaterials[i].transparent = true
      }
    } else if (!isDashing) {
      for (let i = 0; i < allMaterials.length; i++) {
        allMaterials[i].opacity = 1.0
        allMaterials[i].transparent = false
      }
    }

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
useGLTF.preload('/models/ships/Spaceship_3.glb')
useGLTF.preload('/models/ships/Spaceship_6.glb')
useGLTF.preload('/models/ships/Spaceship_9.glb')
