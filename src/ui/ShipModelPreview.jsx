import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

// 3/4 view angle (static pose for thumbnails)
const STATIC_Y_ROTATION = Math.PI * 0.25

function ShipModel({ modelPath, rotate }) {
  const groupRef = useRef()
  const { scene } = useGLTF(modelPath)
  const clonedScene = useMemo(() => scene.clone(), [scene])

  useFrame((state) => {
    if (!groupRef.current || !rotate) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.5
  })

  return (
    <group ref={groupRef} rotation={[0.3, rotate ? 0 : STATIC_Y_ROTATION, 0]}>
      <primitive object={clonedScene} />
    </group>
  )
}

export default function ShipModelPreview({ modelPath, rotate = false }) {
  return (
    <Canvas
      camera={{ position: [0, 3, 16], fov: 35 }}
      style={{ pointerEvents: 'none', background: 'rgba(255,255,255,0.04)' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 8, 5]} intensity={1.0} />
      <directionalLight position={[-4, 3, -2]} intensity={0.4} />
      <ShipModel modelPath={modelPath} rotate={rotate} />
    </Canvas>
  )
}
