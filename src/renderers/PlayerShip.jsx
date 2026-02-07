import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import usePlayer from '../stores/usePlayer.jsx'

export default function PlayerShip() {
  const groupRef = useRef()
  const bankRef = useRef()
  const { scene } = useGLTF('/models/ships/Spaceship.glb')

  useFrame(() => {
    if (!groupRef.current || !bankRef.current) return

    const { position, rotation, bankAngle } = usePlayer.getState()

    groupRef.current.position.set(position[0], position[1], position[2])
    groupRef.current.rotation.set(0, Math.PI - rotation, 0)
    bankRef.current.rotation.set(0, 0, bankAngle)
  })

  return (
    <group ref={groupRef}>
      <group ref={bankRef}>
        <primitive object={scene.clone()} />
      </group>
    </group>
  )
}

useGLTF.preload('/models/ships/Spaceship.glb')
