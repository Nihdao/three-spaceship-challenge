import { Component, useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import useEnemies from '../stores/useEnemies.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { ENEMIES } from '../entities/enemyDefs.js'

const MAX = GAME_CONFIG.MAX_ENEMIES_ON_SCREEN

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
  const def = ENEMIES[typeId]

  const { scene } = useGLTF(def.modelPath)

  // Extract all sub-meshes with world transforms baked into geometry.
  // GLB models use SkinnedMesh with 100x parent scale and multiple materials,
  // so we clone each geometry, apply its world matrix, and pair it with its material.
  // NOTE: Materials are shared refs from Drei cache — do NOT modify at runtime
  // (e.g., hit flash). Clone materials first if runtime changes are needed.
  const subMeshes = useMemo(() => {
    const result = []
    scene.updateWorldMatrix(true, true)
    scene.traverse((child) => {
      if (child.isMesh) {
        const geo = child.geometry.clone()
        geo.applyMatrix4(child.matrixWorld)
        result.push({ geometry: geo, material: child.material })
      }
    })
    return result
  }, [scene])

  useEffect(() => {
    return () => {
      // Dispose cloned geometries (not the Drei-cached originals)
      subMeshes.forEach((sm) => sm.geometry.dispose())
    }
  }, [subMeshes])

  useFrame(() => {
    const refs = meshRefs.current
    if (refs.length === 0) return

    const enemies = useEnemies.getState().enemies
    const playerPos = usePlayer.getState().position
    const dummy = dummyRef.current
    const now = performance.now()

    // TODO: O(enemies × types) per frame — consider pre-bucketing enemies by
    // type in the store if more enemy types are added (currently 2, acceptable).
    let count = 0
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i]
      if (e.typeId !== typeId) continue

      dummy.position.set(e.x, 0, e.z)

      // Face toward player
      const dx = playerPos[0] - e.x
      const dz = playerPos[2] - e.z
      dummy.rotation.set(0, Math.atan2(dx, dz), 0)

      // Hit flash: scale pulse after taking non-lethal damage
      const hitAge = now - e.lastHitTime
      let scaleMult = hitAge < GAME_CONFIG.HIT_FLASH_DURATION_MS ? GAME_CONFIG.HIT_FLASH_SCALE_MULT : 1

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
