import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getStarTexture } from './starTexture.js'

// Default color: white to blue-white gradient
function defaultColorFn() {
  const blueShift = 0.7 + Math.random() * 0.3
  return [blueShift, blueShift, 1]
}

// Generate star geometry for a layer with configurable color
export function createStarGeometry(count, radius, colorFn = defaultColorFn) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = radius * (0.9 + Math.random() * 0.1)

    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i * 3 + 2] = r * Math.cos(phi)

    const [cr, cg, cb] = colorFn()
    col[i * 3] = cr
    col[i * 3 + 1] = cg
    col[i * 3 + 2] = cb
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  geo.computeBoundingSphere()
  return geo
}

// Shared starfield layer component with parallax
export default function StarfieldLayer({ layerConfig, colorFn }) {
  const groupRef = useRef()
  const { camera } = useThree()

  const geometry = useMemo(
    () => createStarGeometry(layerConfig.count, layerConfig.radius, colorFn),
    [layerConfig.count, layerConfig.radius, colorFn]
  )

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame(() => {
    if (layerConfig.parallaxFactor > 0 && groupRef.current) {
      groupRef.current.position.x = -camera.position.x * layerConfig.parallaxFactor
      groupRef.current.position.z = -camera.position.z * layerConfig.parallaxFactor
    }
  })

  const opacity = (layerConfig.opacityRange[0] + layerConfig.opacityRange[1]) / 2
  const size = (layerConfig.sizeRange[0] + layerConfig.sizeRange[1]) / 2

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          map={getStarTexture()}
          size={size}
          sizeAttenuation={layerConfig.sizeAttenuation}
          vertexColors
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
