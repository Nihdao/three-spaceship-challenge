import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

// 3/4 view angle (static pose for thumbnails)
const STATIC_Y_ROTATION = Math.PI * 0.25

// Fallback placeholder when model fails to load or is loading
function ModelFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 2]} />
      <meshStandardMaterial color="#666" wireframe />
    </mesh>
  )
}

function ShipModel({ modelPath, rotate, skinData }) {
  const groupRef = useRef()

  // useGLTF can throw on 404 or malformed GLB — let Suspense/ErrorBoundary catch it
  let scene
  try {
    const gltf = useGLTF(modelPath)
    scene = gltf.scene
  } catch (error) {
    console.warn(`ShipModelPreview: Failed to load model at ${modelPath}`, error)
    return <ModelFallback />
  }

  // Re-clone when scene or skin changes; clone materials to avoid mutating shared GLB cache.
  // skinData is a stable object reference from SHIP_SKINS constant, so useMemo fires only
  // on actual skin changes (different object reference).
  const clonedScene = useMemo(() => {
    const cloned = scene.clone()
    cloned.traverse((child) => {
      if (child.isMesh && child.material) {
        // Clone materials so we never mutate the shared GLB cache (Story 25.2 fix)
        if (Array.isArray(child.material)) {
          child.material = child.material.map(m => m.clone())
        } else {
          child.material = child.material.clone()
        }
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        const isEngine = child.name.toLowerCase().includes('engine') ||
                         child.name.toLowerCase().includes('thruster')
        for (const mat of materials) {
          if (!isEngine && mat.emissive !== undefined) {
            // Always zero emissive first (GLB may have baked emissive)
            mat.emissive.setScalar(0)
            mat.emissiveIntensity = 0
            // emissiveTint intentionally not applied — creates undesirable color filter
            if (skinData?.tintColor && mat.color !== undefined) {
              const isColored = Math.max(mat.color.r, mat.color.g, mat.color.b) > 0.15
              if (isColored) mat.color.set(skinData.tintColor)
            }
            mat.needsUpdate = true
          }
        }
      }
    })
    return cloned
  }, [scene, skinData])

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

export default function ShipModelPreview({ modelPath, rotate = false, skinData = null }) {
  // TECHNICAL DEBT (Code Review HIGH-3):
  // Each ShipModelPreview creates a separate WebGL context (expensive on GPU).
  // For 3 ship cards in grid = 3 concurrent contexts.
  // Future optimization: Use single Canvas with <View> viewports, or pre-render to textures.
  return (
    <Canvas
      camera={{ position: [0, 3, 16], fov: 35 }}
      style={{ pointerEvents: 'none', background: 'rgba(255,255,255,0.04)' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 8, 5]} intensity={1.0} />
      <directionalLight position={[-4, 3, -2]} intensity={0.4} />
      <Suspense fallback={<ModelFallback />}>
        <ShipModel modelPath={modelPath} rotate={rotate} skinData={skinData} />
      </Suspense>
    </Canvas>
  )
}
