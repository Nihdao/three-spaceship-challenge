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

function IdleShip() {
  const groupRef = useRef()
  const { scene } = useGLTF('/models/ships/Spaceship.glb')
  const clonedScene = useMemo(() => scene.clone(), [scene])

  // Slow bobbing animation
  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.3
    groupRef.current.rotation.y = t * 0.1
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  )
}

function MenuCamera() {
  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Slow orbit around the ship
    const radius = 12
    const x = Math.sin(t * 0.05) * radius
    const z = Math.cos(t * 0.05) * radius
    state.camera.position.set(x, 5, z)
    state.camera.lookAt(0, 0, 0)
  })

  return null
}

useGLTF.preload('/models/ships/Spaceship.glb')

export default function MenuScene() {
  return (
    <>
      <MenuCamera />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <IdleShip />
      <MenuStarfield />
    </>
  )
}
