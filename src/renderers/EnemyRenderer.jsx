import { Component, useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import useEnemies from '../stores/useEnemies.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { ENEMIES } from '../entities/enemyDefs.js'
import { calculateFlashIntensity, applyHitFlash, restoreOriginalColor } from '../systems/hitFlashSystem.js'

const MAX = GAME_CONFIG.MAX_ENEMIES_ON_SCREEN

// Module-level pre-bucketing cache — groups enemies by typeId once per frame
// avoids O(enemies × types) per-frame scans in EnemyTypeMesh
let _bucketFrame = -1
const _buckets = new Map() // typeId → Enemy[]
const _empty = []

function _getBuckets(enemies, frameId) {
  if (frameId === _bucketFrame) return _buckets
  _bucketFrame = frameId
  _buckets.forEach(arr => { arr.length = 0 })
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]
    let b = _buckets.get(e.typeId)
    if (!b) { b = []; _buckets.set(e.typeId, b) }
    b.push(e)
  }
  return _buckets
}

// Catches GLB load/render errors per enemy type — renders nothing on failure
class EnemyMeshErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error) {
    console.warn(`[EnemyRenderer] Failed to load model for "${this.props.typeId}":`, error.message)
  }
  render() {
    return this.state.hasError ? null : this.props.children
  }
}

function EnemyTypeMesh({ typeId }) {
  const meshRefs = useRef([])
  const dummyRef = useRef(new THREE.Object3D())
  const wasFlashingRef = useRef(false) // M1: only restore emissive on flash→idle transition
  const def = ENEMIES[typeId]

  const { scene } = useGLTF(def.modelPath)

  // Extract all sub-meshes with world transforms baked into geometry.
  // GLB models use SkinnedMesh with 100x parent scale and multiple materials,
  // so we clone each geometry, apply its world matrix, and clone its material.
  // Materials are cloned so emissive can be modified per enemy type for hit flash
  // without affecting the Drei cache (Story 27.3).
  const subMeshes = useMemo(() => {
    const result = []
    scene.updateWorldMatrix(true, true)
    scene.traverse((child) => {
      if (child.isMesh) {
        const geo = child.geometry.clone()
        geo.applyMatrix4(child.matrixWorld)
        const mat = child.material.clone()
        result.push({ geometry: geo, material: mat })
      }
    })
    return result
  }, [scene])

  useEffect(() => {
    return () => {
      // Dispose cloned geometries and cloned materials
      subMeshes.forEach((sm) => {
        sm.geometry.dispose()
        sm.material.dispose()
      })
    }
  }, [subMeshes])

  useFrame((state) => {
    const refs = meshRefs.current
    if (refs.length === 0) return

    const enemies = useEnemies.getState().enemies
    const playerPos = usePlayer.getState().position
    const dummy = dummyRef.current
    const now = state.clock.elapsedTime * 1000
    const frameId = Math.floor(now)
    const typeEnemies = _getBuckets(enemies, frameId).get(typeId) ?? _empty

    let count = 0
    let maxFlashTimer = 0 // Story 27.3: track max flash timer across all enemies of this type
    for (let i = 0; i < typeEnemies.length; i++) {
      const e = typeEnemies[i]

      // Track max hit flash timer for shared material flash (Option B MVP)
      if (e.hitFlashTimer > maxFlashTimer) maxFlashTimer = e.hitFlashTimer

      dummy.position.set(e.x, 0, e.z)

      // Face toward player
      const dx = playerPos[0] - e.x
      const dz = playerPos[2] - e.z
      dummy.rotation.set(0, Math.atan2(dx, dz), 0)

      // Hit flash: scale pulse after taking non-lethal damage
      const hitAge = now - e.lastHitTime
      // Guard hitAge >= 0: if lastHitTime was set via performance.now() fallback (epoch ~1.74T ms)
      // and now is clock-time (small ms), hitAge is a huge negative → would trigger flash permanently.
      let scaleMult = hitAge >= 0 && hitAge < GAME_CONFIG.SCALE_FLASH_DURATION_MS ? GAME_CONFIG.SCALE_FLASH_MULT : 1

      // Sniper fixed telegraph: pulsing scale during charge-up (Story 16.2)
      if (e.attackState === 'telegraph') {
        scaleMult *= 1.0 + 0.15 * Math.sin(e.telegraphTimer * Math.PI * 4)
      }

      dummy.scale.set(
        e.meshScale[0] * scaleMult,
        e.meshScale[1] * scaleMult,
        e.meshScale[2] * scaleMult,
      )
      dummy.updateMatrix()

      for (let j = 0; j < refs.length; j++) {
        if (refs[j]) refs[j].setMatrixAt(count, dummy.matrix)
      }
      count++
    }

    for (let j = 0; j < refs.length; j++) {
      const mesh = refs[j]
      if (!mesh) continue
      mesh.count = count
      if (count > 0) mesh.instanceMatrix.needsUpdate = true
    }

    // Story 27.3: Apply hit flash emissive to shared material (shared across all instances of this type)
    const flashDuration = GAME_CONFIG.HIT_FLASH.DURATION
    if (maxFlashTimer > 0) {
      const intensity = calculateFlashIntensity(maxFlashTimer, flashDuration, GAME_CONFIG.HIT_FLASH.FADE_CURVE) * GAME_CONFIG.HIT_FLASH.INTENSITY
      for (let j = 0; j < refs.length; j++) {
        if (refs[j]) applyHitFlash(refs[j].material, intensity, GAME_CONFIG.HIT_FLASH.COLOR)
      }
      wasFlashingRef.current = true
    } else if (wasFlashingRef.current) {
      // Only restore once when transitioning flash→idle, not every frame
      for (let j = 0; j < refs.length; j++) {
        if (refs[j]) restoreOriginalColor(refs[j].material)
      }
      wasFlashingRef.current = false
    }
  })

  return (
    <>
      {subMeshes.map((sm, i) => (
        <instancedMesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el
          }}
          args={[sm.geometry, sm.material, MAX]}
          frustumCulled={false}
        />
      ))}
    </>
  )
}

const enemyTypeIds = Object.keys(ENEMIES)

// Preload all enemy GLB models
enemyTypeIds.forEach((typeId) => {
  useGLTF.preload(ENEMIES[typeId].modelPath)
})

export default function EnemyRenderer() {
  return (
    <>
      {enemyTypeIds.map((typeId) => (
        <EnemyMeshErrorBoundary key={typeId} typeId={typeId}>
          <EnemyTypeMesh typeId={typeId} />
        </EnemyMeshErrorBoundary>
      ))}
    </>
  )
}
