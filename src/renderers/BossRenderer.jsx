import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import useBoss from '../stores/useBoss.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { addExplosion } from '../systems/particleSystem.js'

const BOSS_HIT_COLOR = new THREE.Color('#ffffff')
const BOSS_EMISSIVE = new THREE.Color('#ff0000')
const TELEGRAPH_COLOR = new THREE.Color('#ff6600')
const HIT_FLASH_MS = GAME_CONFIG.HIT_FLASH_DURATION_MS
const BOSS_MODEL_SCALE = GAME_CONFIG.BOSS_SCALE_MULTIPLIER

export default function BossRenderer() {
  const meshRef = useRef()
  const telegraphRef = useRef()
  const spawnTimeRef = useRef(null)
  const spawnBurstTriggeredRef = useRef(false)
  const materialsRef = useRef([])

  const { scene } = useGLTF('/models/enemies/SpaceshipBoss.glb')

  // Clone scene and extract materials for hit-flash manipulation
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    const mats = []
    clone.traverse((child) => {
      if (child.isMesh) {
        // Clone material so we can modify emissive without affecting cache
        child.material = child.material.clone()
        mats.push(child.material)
      }
    })
    materialsRef.current = mats
    return clone
  }, [scene])

  useEffect(() => {
    return () => {
      // Dispose cloned materials
      materialsRef.current.forEach((m) => m.dispose())
    }
  }, [])

  const telegraphMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: TELEGRAPH_COLOR,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [])

  useEffect(() => {
    return () => {
      telegraphMaterial.dispose()
    }
  }, [telegraphMaterial])

  useFrame((state) => {
    const bossState = useBoss.getState()
    const { boss } = bossState
    if (!boss || !meshRef.current) return

    const clock = state.clock.elapsedTime

    // Initialize spawn time on first frame
    if (spawnTimeRef.current === null) {
      spawnTimeRef.current = clock
      spawnBurstTriggeredRef.current = false
    }

    // Defeat animation: flicker and hide after animation completes
    if (bossState.bossDefeated) {
      if (bossState.defeatAnimationTimer <= 0) {
        meshRef.current.visible = false
        if (telegraphRef.current) telegraphRef.current.visible = false
        return
      }
      meshRef.current.position.set(boss.x, 4, boss.z)
      meshRef.current.visible = Math.sin(clock * 30) > 0
      materialsRef.current.forEach((m) => {
        m.emissive?.copy(BOSS_HIT_COLOR)
        if (m.emissiveIntensity !== undefined) m.emissiveIntensity = 2.0
      })
      if (telegraphRef.current) telegraphRef.current.visible = false
      return
    }

    // Position
    meshRef.current.position.set(boss.x, 4, boss.z)
    meshRef.current.visible = true

    // Spawn animation — scale from 0.1 to full
    const spawnElapsed = clock - spawnTimeRef.current
    const spawnDuration = GAME_CONFIG.BOSS_SPAWN.SPAWN_SCALE_DURATION
    let baseScale = BOSS_MODEL_SCALE

    if (spawnElapsed < spawnDuration) {
      const progress = spawnElapsed / spawnDuration
      const easeOut = 1 - Math.pow(1 - progress, 3)
      baseScale = BOSS_MODEL_SCALE * (0.1 + easeOut * 0.9)

      if (!spawnBurstTriggeredRef.current) {
        addExplosion(boss.x, boss.z, '#ff3333', 1.5)
        spawnBurstTriggeredRef.current = true
      }
    }

    // Idle animation: slow rotation + subtle pulse
    meshRef.current.rotation.y += 0.01
    const pulse = baseScale * (1 + Math.sin(clock * 2) * 0.03)
    meshRef.current.scale.setScalar(pulse)

    // Hit feedback: white flash on all materials
    const timeSinceHit = Date.now() - boss.lastHitTime
    if (timeSinceHit < HIT_FLASH_MS) {
      materialsRef.current.forEach((m) => {
        m.emissive?.copy(BOSS_HIT_COLOR)
        if (m.emissiveIntensity !== undefined) m.emissiveIntensity = 2.0
      })
    } else {
      const phaseIntensity = 0.8 + boss.phase * 0.2
      materialsRef.current.forEach((m) => {
        m.emissive?.copy(BOSS_EMISSIVE)
        if (m.emissiveIntensity !== undefined) m.emissiveIntensity = phaseIntensity
      })
    }

    // Telegraph visual
    if (telegraphRef.current) {
      if (boss.telegraphTimer > 0) {
        const progress = 1 - (boss.telegraphTimer / GAME_CONFIG.BOSS_TELEGRAPH_DURATION)
        telegraphRef.current.visible = true
        telegraphRef.current.position.set(boss.x, 0.5, boss.z)
        const ringScale = 5 + progress * 10
        telegraphRef.current.scale.set(ringScale, ringScale, 1)
        telegraphMaterial.opacity = 0.3 + progress * 0.4
      } else {
        telegraphRef.current.visible = false
        telegraphMaterial.opacity = 0
      }
    }
  })

  const boss = useBoss((s) => s.boss)
  const isActive = useBoss((s) => s.isActive)

  // Reset spawn time when boss becomes inactive
  useEffect(() => {
    if (!isActive) {
      spawnTimeRef.current = null
      spawnBurstTriggeredRef.current = false
    }
  }, [isActive])

  if (!isActive || !boss) return null

  return (
    <group>
      {/* Story 22.4: Boss body — SpaceshipBoss.glb model */}
      <group ref={meshRef}>
        <primitive object={clonedScene} />
      </group>

      {/* Telegraph ring (ground-level) */}
      <mesh ref={telegraphRef} rotation={[-Math.PI / 2, 0, 0]} visible={false} material={telegraphMaterial}>
        <ringGeometry args={[0.8, 1, 32]} />
      </mesh>
    </group>
  )
}

useGLTF.preload('/models/enemies/SpaceshipBoss.glb')
