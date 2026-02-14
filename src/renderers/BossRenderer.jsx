import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import useBoss from '../stores/useBoss.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { addExplosion } from '../systems/particleSystem.js'

const BOSS_COLOR = new THREE.Color('#cc66ff')
const BOSS_HIT_COLOR = new THREE.Color('#ffffff')
const TELEGRAPH_COLOR = new THREE.Color('#ff6600')
const HIT_FLASH_MS = GAME_CONFIG.HIT_FLASH_DURATION_MS

export default function BossRenderer() {
  const meshRef = useRef()
  const telegraphRef = useRef()
  const spawnTimeRef = useRef(null) // Story 17.4: Track boss spawn time for spawn animation
  const spawnBurstTriggeredRef = useRef(false) // Story 17.4: Track if spawn burst was triggered

  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#220033',
    emissive: BOSS_COLOR,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.95,
  }), [])

  const telegraphMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: TELEGRAPH_COLOR,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [])

  useEffect(() => {
    return () => {
      bodyMaterial.dispose()
      telegraphMaterial.dispose()
    }
  }, [bodyMaterial, telegraphMaterial])

  useFrame((state) => {
    const bossState = useBoss.getState()
    const { boss } = bossState
    if (!boss || !meshRef.current) return

    const clock = state.clock.elapsedTime

    // Story 17.4: Initialize spawn time on first frame
    if (spawnTimeRef.current === null) {
      spawnTimeRef.current = clock
      spawnBurstTriggeredRef.current = false
    }

    // Defeat animation: flicker and hide after animation completes
    if (bossState.bossDefeated) {
      if (bossState.defeatAnimationTimer <= 0) {
        // Animation complete — hide boss
        meshRef.current.visible = false
        if (telegraphRef.current) telegraphRef.current.visible = false
        return
      }
      // Rapid flicker during death animation
      meshRef.current.position.set(boss.x, 4, boss.z)
      meshRef.current.visible = Math.sin(clock * 30) > 0
      bodyMaterial.emissive.copy(BOSS_HIT_COLOR)
      bodyMaterial.emissiveIntensity = 2.0
      if (telegraphRef.current) telegraphRef.current.visible = false
      return
    }

    // Position
    meshRef.current.position.set(boss.x, 4, boss.z)
    meshRef.current.visible = true

    // Story 17.4: Spawn animation — scale from 0.1 to 1.0
    const spawnElapsed = clock - spawnTimeRef.current
    const spawnDuration = GAME_CONFIG.BOSS_SPAWN.SPAWN_SCALE_DURATION
    let baseScale = 1.0

    if (spawnElapsed < spawnDuration) {
      // Spawn animation in progress — ease-out from 0.1 to 1.0
      const progress = spawnElapsed / spawnDuration
      const easeOut = 1 - Math.pow(1 - progress, 3) // cubic ease-out
      baseScale = 0.1 + easeOut * 0.9

      // Story 17.4: Trigger particle burst on first frame only
      if (!spawnBurstTriggeredRef.current) {
        addExplosion(boss.x, boss.z, '#cc66ff', 1.5)
        spawnBurstTriggeredRef.current = true
      }
    }

    // Idle animation: slow rotation + subtle pulse
    meshRef.current.rotation.y += 0.01
    const pulse = baseScale * (1 + Math.sin(clock * 2) * 0.03)
    meshRef.current.scale.setScalar(pulse)

    // Hit feedback: white flash
    const timeSinceHit = Date.now() - boss.lastHitTime
    if (timeSinceHit < HIT_FLASH_MS) {
      bodyMaterial.emissive.copy(BOSS_HIT_COLOR)
      bodyMaterial.emissiveIntensity = 2.0
    } else {
      // Phase-based color shift
      const phaseIntensity = 0.6 + boss.phase * 0.2
      bodyMaterial.emissive.copy(BOSS_COLOR)
      bodyMaterial.emissiveIntensity = phaseIntensity
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

  // Story 17.4: Reset spawn time when boss becomes inactive
  useEffect(() => {
    if (!isActive) {
      spawnTimeRef.current = null
      spawnBurstTriggeredRef.current = false
    }
  }, [isActive])

  if (!isActive || !boss) return null

  return (
    <group>
      {/* Boss body — large torus + sphere combo */}
      <group ref={meshRef}>
        <mesh material={bodyMaterial}>
          <torusGeometry args={[3, 1.2, 16, 32]} />
        </mesh>
        <mesh material={bodyMaterial}>
          <sphereGeometry args={[2, 16, 16]} />
        </mesh>
        {/* Inner glow core */}
        <mesh>
          <sphereGeometry args={[1.5, 12, 12]} />
          <meshBasicMaterial color="#cc66ff" transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Telegraph ring (ground-level) */}
      <mesh ref={telegraphRef} rotation={[-Math.PI / 2, 0, 0]} visible={false} material={telegraphMaterial}>
        <ringGeometry args={[0.8, 1, 32]} />
      </mesh>
    </group>
  )
}
