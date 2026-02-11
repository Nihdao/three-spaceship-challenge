import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const TUNNEL_RADIUS = 8
const TUNNEL_LENGTH = 200
const TUNNEL_SEGMENTS = 64
const RING_COLOR = new THREE.Color('#6622cc')
const SCROLL_SPEED = 15

const tunnelVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const tunnelFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float rings = sin((vUv.y * 40.0 + uTime) * 3.14159) * 0.5 + 0.5;
    float glow = smoothstep(0.3, 0.7, rings);
    float edgeFade = 1.0 - smoothstep(0.0, 0.15, abs(vUv.x - 0.5) * 2.0 - 0.7);
    float alpha = glow * 0.4 + edgeFade * 0.2;
    vec3 col = uColor * (glow * 0.8 + 0.2);
    gl_FragColor = vec4(col, alpha);
  }
`

function TunnelTube() {
  const meshRef = useRef()
  const uniformsRef = useRef({
    uTime: { value: 0 },
    uColor: { value: RING_COLOR },
  })

  const geometry = useMemo(() => {
    return new THREE.CylinderGeometry(TUNNEL_RADIUS, TUNNEL_RADIUS, TUNNEL_LENGTH, TUNNEL_SEGMENTS, 64, true)
  }, [])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: tunnelVertexShader,
      fragmentShader: tunnelFragmentShader,
      uniforms: uniformsRef.current,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    })
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((_, delta) => {
    uniformsRef.current.uTime.value += delta * SCROLL_SPEED
  })

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} rotation={[Math.PI / 2, 0, 0]} />
  )
}

function ShipPlaceholder() {
  return (
    <group position={[0, -1, 10]}>
      <mesh rotation={[0, Math.PI, 0]}>
        <coneGeometry args={[0.6, 2, 4]} />
        <meshStandardMaterial color="#00ccff" emissive="#0066aa" emissiveIntensity={0.5} />
      </mesh>
      {/* Engine glow */}
      <pointLight position={[0, 0, 1]} color="#00ccff" intensity={2} distance={5} />
    </group>
  )
}

function TunnelParticles() {
  const pointsRef = useRef()

  const { geometry, speeds } = useMemo(() => {
    const count = 300
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = TUNNEL_RADIUS * (0.3 + Math.random() * 0.6)
      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = Math.sin(angle) * r
      pos[i * 3 + 2] = (Math.random() - 0.5) * TUNNEL_LENGTH
      spd[i] = 20 + Math.random() * 30
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.computeBoundingSphere()
    return { geometry: geo, speeds: spd }
  }, [])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const positions = pointsRef.current.geometry.attributes.position
    const arr = positions.array
    const halfLen = TUNNEL_LENGTH / 2
    for (let i = 0; i < positions.count; i++) {
      arr[i * 3 + 2] += speeds[i] * delta
      if (arr[i * 3 + 2] > halfLen) {
        arr[i * 3 + 2] -= TUNNEL_LENGTH
      }
    }
    positions.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={1.5} sizeAttenuation color="#8844ff" transparent opacity={0.6} depthWrite={false} />
    </points>
  )
}

export default function TunnelScene() {
  return (
    <>
      {/* Camera positioned inside tunnel looking forward */}
      <perspectiveCamera makeDefault position={[0, 0, 30]} fov={75} />

      {/* Ambient purple/blue lighting */}
      <ambientLight intensity={0.1} color="#220044" />
      <pointLight position={[0, 0, -20]} intensity={1.5} color="#6622cc" distance={80} />
      <pointLight position={[0, 0, 40]} intensity={0.8} color="#0044cc" distance={60} />

      <TunnelTube />
      <TunnelParticles />
      <ShipPlaceholder />
    </>
  )
}
