import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MENU_STAR_COUNT = 2000
const MENU_STAR_RADIUS = 3000

function MenuStarfield() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(MENU_STAR_COUNT * 3)
    const col = new Float32Array(MENU_STAR_COUNT * 3)

    for (let i = 0; i < MENU_STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = MENU_STAR_RADIUS * (0.8 + Math.random() * 0.2)

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      const blueShift = 0.7 + Math.random() * 0.3
      col[i * 3] = blueShift
      col[i * 3 + 1] = blueShift
      col[i * 3 + 2] = 1
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    geo.computeBoundingSphere()
    return geo
  }, [])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={2}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  )
}

// Task 1: Planets distributed around the scene so they're visible throughout camera orbit
const MENU_PLANETS = [
  { position: [-35, -8, -40], scale: 6, color: '#aaaacc', rotationSpeed: 0.02 },   // left-back
  { position: [40, 12, 25], scale: 8, color: '#ffd700', rotationSpeed: 0.015 },     // right-front
  { position: [10, -15, -50], scale: 5, color: '#e5e4e2', rotationSpeed: 0.025 },   // center-back-low
  { position: [-30, 20, 35], scale: 4, color: '#bbbbdd', rotationSpeed: 0.018 },    // left-front-high
  { position: [45, -5, -30], scale: 7, color: '#cc9966', rotationSpeed: 0.012 },    // right-back
]

function MenuPlanets() {
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const children = groupRef.current.children
    for (let i = 0; i < children.length; i++) {
      children[i].rotation.y += MENU_PLANETS[i].rotationSpeed * delta
    }
  })

  return (
    <group ref={groupRef}>
      {MENU_PLANETS.map((planet, i) => (
        <mesh key={i} position={planet.position} scale={planet.scale}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={planet.color} roughness={0.7} metalness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// Task 2: Ship patrol path (figure-8)
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

// Task 3: Camera with breathing zoom and vertical drift
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

export default function MenuScene() {
  return (
    <>
      <MenuCamera />
      {/* Task 7: Lighting and atmosphere */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={0.7} color="#88ccff" />
      <pointLight position={[-35, -8, -40]} intensity={0.4} color="#aaaaff" distance={80} />
      <pointLight position={[40, 12, 25]} intensity={0.3} color="#ffdd66" distance={80} />
      <PatrolShip />
      <MenuPlanets />
      <MenuStarfield />
    </>
  )
}
