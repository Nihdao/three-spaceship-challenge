import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { ASSET_MANIFEST } from '../config/assetManifest.js'
import StarfieldLayer from '../renderers/StarfieldLayer.jsx'

const { STARFIELD_LAYERS, BACKGROUND } = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS

function MenuStarfield() {
  return (
    <>
      <StarfieldLayer layerConfig={STARFIELD_LAYERS.DISTANT} />
      <StarfieldLayer layerConfig={STARFIELD_LAYERS.MID} />
      <StarfieldLayer layerConfig={STARFIELD_LAYERS.NEAR} />
    </>
  )
}

// Task 1: Planets with GLB model keys — emissive tints differentiate duplicate models (planetA×2, planetB×2)
const MENU_PLANETS = [
  { position: [-35, -8, -40], scale: 3.5, modelKey: 'planetA', rotationSpeed: 0.02,  emissiveColor: '#aaaacc', emissiveIntensity: 0.4 },  // left-back
  { position: [40, 12, 25],   scale: 4.5, modelKey: 'planetB', rotationSpeed: 0.015, emissiveColor: '#ffd700', emissiveIntensity: 0.5 },  // right-front
  { position: [10, -15, -50], scale: 3,   modelKey: 'planetC', rotationSpeed: 0.025, emissiveColor: '#e5e4e2', emissiveIntensity: 0.3 },  // center-back-low
  { position: [-30, 20, 35],  scale: 2.5, modelKey: 'planetA', rotationSpeed: 0.018, emissiveColor: '#cc88ff', emissiveIntensity: 0.4 },  // left-front-high
  { position: [45, -5, -30],  scale: 4,   modelKey: 'planetB', rotationSpeed: 0.012, emissiveColor: '#cc9966', emissiveIntensity: 0.4 },  // right-back
]

// Task 2: MenuPlanet sub-component — each instance clones the GLB scene and applies per-planet emissive tint
function MenuPlanet({ planetConfig }) {
  const modelPath = ASSET_MANIFEST.tier2.models[planetConfig.modelKey]
  const { scene } = useGLTF(`/${modelPath}`)
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        const isArray = Array.isArray(child.material)
        const mats = isArray ? child.material : [child.material]
        const cloned = mats.map((mat) => {
          if (mat.emissive !== undefined) {
            const m = mat.clone()
            m.emissive = new THREE.Color(planetConfig.emissiveColor)
            m.emissiveIntensity = planetConfig.emissiveIntensity
            return m
          }
          return mat
        })
        child.material = isArray ? cloned : cloned[0]
      }
    })
    return clone
  }, [scene, planetConfig.emissiveColor, planetConfig.emissiveIntensity])

  const groupRef = useRef()
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += planetConfig.rotationSpeed * 3 * delta
      groupRef.current.rotation.x += planetConfig.rotationSpeed * 1.2 * delta
    }
  })

  return (
    <group ref={groupRef} position={planetConfig.position}>
      <primitive object={clonedScene} scale={planetConfig.scale} />
    </group>
  )
}

// Task 3: Render one MenuPlanet component per planet (no shared ref needed)
function MenuPlanets() {
  return (
    <>
      {MENU_PLANETS.map((planet, i) => (
        <MenuPlanet key={i} planetConfig={planet} />
      ))}
    </>
  )
}

// Ship patrol path (figure-8)
const PATROL_LOOP_DURATION = 40 // seconds
const PATROL_RADIUS = 15

function PatrolShip() {
  const groupRef = useRef()
  const { scene } = useGLTF('/models/ships/Spaceship.glb')
  const clonedScene = useMemo(() => scene.clone(), [scene])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    const progress = (t % PATROL_LOOP_DURATION) / PATROL_LOOP_DURATION
    const angle = progress * Math.PI * 2

    // Figure-8 path for visual interest
    const x = Math.sin(angle) * PATROL_RADIUS
    const z = Math.cos(angle) * PATROL_RADIUS * 0.6
    const y = Math.sin(angle * 2) * 2

    groupRef.current.position.set(x, y, z)

    // Face direction of travel
    const nextAngle = angle + 0.05
    const nextX = Math.sin(nextAngle) * PATROL_RADIUS
    const nextZ = Math.cos(nextAngle) * PATROL_RADIUS * 0.6
    const nextY = Math.sin(nextAngle * 2) * 2
    groupRef.current.lookAt(nextX, nextY, nextZ)

    // Banking based on lateral movement
    groupRef.current.rotation.z = Math.cos(angle) * 0.25
  })

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  )
}

// Camera with breathing zoom and vertical drift
function MenuCamera() {
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const baseRadius = 12
    const breathe = Math.sin(t * 0.1) * 2
    const radius = baseRadius + breathe

    const x = Math.sin(t * 0.05) * radius
    const z = Math.cos(t * 0.05) * radius
    const y = 5 + Math.sin(t * 0.08) * 1

    state.camera.position.set(x, y, z)
    state.camera.lookAt(0, 0, 0)
  })

  return null
}

useGLTF.preload('/models/ships/Spaceship.glb')
// Task 4: Preload the 3 planet GLBs (shares GLTF cache with PlanetRenderer.jsx)
useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetA}`)
useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetB}`)
useGLTF.preload(`/${ASSET_MANIFEST.tier2.models.planetC}`)

export default function MenuScene() {
  return (
    <>
      <MenuCamera />
      {/* Scene background color (Story 24.2) */}
      <color attach="background" args={[BACKGROUND.DEFAULT.color]} />
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-35, -8, -40]} intensity={0.8} color="#aaaaff" distance={100} />
      <pointLight position={[40, 12, 25]} intensity={0.6} color="#ffdd66" distance={100} />
      <PatrolShip />
      <MenuPlanets />
      <MenuStarfield />
    </>
  )
}
