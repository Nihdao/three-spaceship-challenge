import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getOrbs, getActiveCount } from '../systems/xpOrbSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX = GAME_CONFIG.MAX_XP_ORBS

export default function XPOrbRenderer() {
  const standardMeshRef = useRef()
  const rareMeshRef = useRef()
  const dummyRef = useRef(new THREE.Object3D())
  const standardColorRef = useRef(new THREE.Color(GAME_CONFIG.XP_ORB_COLOR))
  const rareColorRef = useRef(new THREE.Color(GAME_CONFIG.RARE_XP_GEM_COLOR))

  // needsUpdate guards — only upload color buffer when count changes
  const prevStandardCountRef = useRef(0)
  const prevRareCountRef = useRef(0)

  // GEOMETRY: diamond shape with sharp facets (detail=0 = 8 triangular faces)
  const standardGeo = useMemo(() => new THREE.OctahedronGeometry(0.3, 0), [])
  // GEOMETRY: slightly larger diamond for rare orbs
  const rareGeo = useMemo(() => new THREE.OctahedronGeometry(0.42, 0), [])

  // Story 19.1: Use MeshBasicMaterial for proper instanceColor support + glow effect
  // MeshBasicMaterial is unlit but bright, perfect for glowing orbs
  const standardMatRef = useRef(new THREE.MeshBasicMaterial({ toneMapped: false }))
  const rareMatRef = useRef(new THREE.MeshBasicMaterial({ toneMapped: false }))

  useEffect(() => {
    const stdMat = standardMatRef.current
    const rareMat = rareMatRef.current
    return () => {
      standardGeo.dispose()
      rareGeo.dispose()
      stdMat.dispose()
      rareMat.dispose()
    }
  }, [standardGeo, rareGeo])

  useFrame((state) => {
    const standardMesh = standardMeshRef.current
    const rareMesh = rareMeshRef.current
    if (!standardMesh || !rareMesh) return

    const orbs = getOrbs()
    const totalCount = getActiveCount()
    const dummy = dummyRef.current
    const elapsed = state.clock.elapsedTime
    const [sx, sy, sz] = GAME_CONFIG.XP_ORB_MESH_SCALE
    const standardColor = standardColorRef.current
    const rareColor = rareColorRef.current

    let standardCount = 0
    let rareCount = 0

    // Rare orb pulse is identical for all rare orbs in a given frame — hoist to avoid N Math.sin() calls
    const rareScaleMult = GAME_CONFIG.RARE_XP_GEM_SCALE_MULTIPLIER
    const rarePulse = 1 + Math.sin(elapsed * GAME_CONFIG.RARE_XP_GEM_PULSE_SPEED) * 0.1

    for (let i = 0; i < totalCount; i++) {
      const orb = orbs[i]
      // LUT available for 200+ orbs if needed; sin() is trivial at current counts
      const y = 0.5 + Math.sin((elapsed + orb.x * 0.5 + orb.z * 0.3) * 3) * 0.3

      if (orb.isRare) {
        // Pulse animation: subtle scale oscillation for rare orbs
        dummy.position.set(orb.x, y, orb.z)
        dummy.scale.set(sx * rareScaleMult * rarePulse, sy * rareScaleMult * rarePulse, sz * rareScaleMult * rarePulse)
        dummy.rotation.set(Math.PI * 0.25, elapsed * 2.5, 0)
        dummy.updateMatrix()
        rareMesh.setMatrixAt(rareCount, dummy.matrix)
        // Story 19.1: Set per-instance color (golden for rare) — only for new slots
        if (rareCount >= prevRareCountRef.current) {
          rareMesh.setColorAt(rareCount, rareColor)
        }
        rareCount++
      } else {
        dummy.position.set(orb.x, y, orb.z)
        dummy.scale.set(sx, sy, sz)
        dummy.rotation.set(Math.PI * 0.25, elapsed * 1.5, 0)
        dummy.updateMatrix()
        standardMesh.setMatrixAt(standardCount, dummy.matrix)
        // Story 19.1: Set per-instance color (cyan for standard) — only for new slots
        if (standardCount >= prevStandardCountRef.current) {
          standardMesh.setColorAt(standardCount, standardColor)
        }
        standardCount++
      }
    }

    standardMesh.count = standardCount
    rareMesh.count = rareCount

    if (standardCount > 0 && standardMesh.instanceMatrix) standardMesh.instanceMatrix.needsUpdate = true
    if (rareCount > 0 && rareMesh.instanceMatrix) rareMesh.instanceMatrix.needsUpdate = true

    // needsUpdate guard — only upload color buffer when count changes
    if (standardCount !== prevStandardCountRef.current) {
      if (standardMesh.instanceColor) standardMesh.instanceColor.needsUpdate = true
      prevStandardCountRef.current = standardCount
    }
    if (rareCount !== prevRareCountRef.current) {
      if (rareMesh.instanceColor) rareMesh.instanceColor.needsUpdate = true
      prevRareCountRef.current = rareCount
    }
  })

  return (
    <>
      <instancedMesh
        ref={standardMeshRef}
        args={[standardGeo, standardMatRef.current, MAX]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={rareMeshRef}
        args={[rareGeo, rareMatRef.current, MAX]}
        frustumCulled={false}
      />
    </>
  )
}
