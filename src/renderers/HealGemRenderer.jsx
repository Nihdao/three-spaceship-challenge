import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getHealGems, getActiveHealGemCount } from '../systems/healGemSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX = GAME_CONFIG.MAX_HEAL_GEMS

export default function HealGemRenderer() {
  const meshRef = useRef()
  const dummyRef = useRef(new THREE.Object3D())
  const colorRef = useRef(new THREE.Color(GAME_CONFIG.HEAL_GEM_COLOR))
  // needsUpdate guard — only upload color buffer when count changes
  const prevCountRef = useRef(0)

  // GEOMETRY: cross "+" shape from two merged BoxGeometry bars
  const geometry = useMemo(() => {
    const hBar = new THREE.BoxGeometry(0.65, 0.14, 0.22)
    const vBar = new THREE.BoxGeometry(0.22, 0.14, 0.65)
    const merged = mergeGeometries([hBar, vBar])
    hBar.dispose()
    vBar.dispose()
    return merged
  }, [])
  // Use MeshBasicMaterial for proper glow effect with toneMapped: false
  // This makes the heal gem appear bright and emissive
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        toneMapped: false, // Allows colors to be brighter than usual
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const healGems = getHealGems()
    const count = getActiveHealGemCount()
    const dummy = dummyRef.current
    const elapsed = state.clock.elapsedTime
    const color = colorRef.current

    // Pulse is identical for all gems in a given frame — hoist to avoid N Math.sin() calls
    const pulse = 1 + Math.sin(elapsed * Math.PI * 4) * 0.1
    const scale = 2.46 * pulse // ~0.8 effective radius (cross half-width 0.325 × 2.46)

    for (let i = 0; i < count; i++) {
      const gem = healGems[i]

      // Bobbing animation (same pattern as XP orbs)
      const y = 0.5 + Math.sin((elapsed + gem.x * 0.5 + gem.z * 0.3) * 3) * 0.3

      dummy.position.set(gem.x, y, gem.z)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      // Set per-instance color (red-pink for heal gems) — only for new slots
      if (i >= prevCountRef.current) {
        mesh.setColorAt(i, color)
      }
    }

    mesh.count = count
    if (count > 0) {
      mesh.instanceMatrix.needsUpdate = true
    }
    // Guard: only upload color buffer when count changes (color is static per-frame)
    // Note: guard is outside if(count>0) so prevCountRef resets to 0 when gems are fully
    // collected, preventing a missed upload when they respawn at the same count.
    if (count !== prevCountRef.current) {
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      prevCountRef.current = count
    }
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX]}
      frustumCulled={false}
    />
  )
}
