import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import useLevel from '../stores/useLevel.jsx'
import { PLANETS } from '../entities/planetDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { ASSET_MANIFEST } from '../config/assetManifest.js'

function Planet({ planet }) {
  const def = PLANETS[planet.typeId]
  const modelPath = ASSET_MANIFEST.tier2.models[def.modelKey]
  const { scene } = useGLTF(`/${modelPath}`)
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    // Apply tier-specific emissive glow to all meshes
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        const isArray = Array.isArray(child.material)
        const mats = isArray ? child.material : [child.material]
        const cloned = mats.map((mat) => {
          if (mat.emissive !== undefined) {
            const m = mat.clone()
            m.emissive = new THREE.Color(def.emissiveColor)
            m.emissiveIntensity = def.emissiveIntensity
            return m
          }
          return mat
        })
        child.material = isArray ? cloned : cloned[0]
      }
    })
    return clone
  }, [scene, def.emissiveColor, def.emissiveIntensity])
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += GAME_CONFIG.PLANET_ORBIT_SPEED * delta
    }
  })

  return (
    <group ref={groupRef} position={[planet.x, GAME_CONFIG.PLANET_MODEL_Y_OFFSET, planet.z]}>
      <primitive object={clonedScene} scale={def.scale} />
    </group>
  )
}

export default function PlanetRenderer() {
  const planets = useLevel((s) => s.planets)
  return (
    <group>
      {planets.map((planet) => (
        <Planet key={planet.id} planet={planet} />
      ))}
    </group>
  )
}

// Preload planet models
useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetA}`)
useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetB}`)
useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetC}`)
