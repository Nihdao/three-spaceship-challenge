import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { GAME_CONFIG } from '../config/gameConfig.js'

const TUNNEL_RADIUS = 8
const TUNNEL_LENGTH = 200
const TUNNEL_SEGMENTS = 64
const RING_COLOR = new THREE.Color('#5518aa')
const SCROLL_SPEED = -12

const _lighting = GAME_CONFIG.PLAYER_SHIP_LIGHTING
const _tunnelFillIntensity = _lighting.FILL_LIGHT_INTENSITY_TUNNEL ?? _lighting.FILL_LIGHT_INTENSITY
const _engineEmissive = new THREE.Color(_lighting.ENGINE_EMISSIVE_COLOR)
const _bgColor = new THREE.Color('#c8bfdf')

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
    float glow = smoothstep(0.1, 0.9, rings);
    float edgeFade = 1.0 - smoothstep(0.0, 0.15, abs(vUv.x - 0.5) * 2.0 - 0.7);
    float alpha = glow * 0.25 + edgeFade * 0.1;
    vec3 col = uColor * (glow * 0.5 + 0.5);
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

function TunnelShip() {
  const shipRef = useRef()
  const { scene } = useGLTF('/models/ships/Spaceship.glb')
  const clonedScene = useMemo(() => scene.clone(), [scene])

  const shipMaterials = useMemo(() => {
    const all = []
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        const isEngine = child.name.toLowerCase().includes('engine') ||
                         child.name.toLowerCase().includes('thruster')
        for (const mat of materials) {
          if (mat.emissive !== undefined && !all.includes(mat)) {
            all.push(mat)
            if (isEngine) {
              mat.emissive.copy(_engineEmissive)
              mat.emissiveIntensity = _lighting.ENGINE_EMISSIVE_INTENSITY
            } else {
              mat.emissive.setScalar(0)
              mat.emissiveIntensity = 0
            }
            mat.needsUpdate = true
          }
        }
      }
    })
    return all
  }, [clonedScene])

  // Hyperspace turbulence
  const baseY = -1.5
  useFrame((state) => {
    if (!shipRef.current) return
    const t = state.clock.elapsedTime
    shipRef.current.rotation.x = Math.sin(t * 0.7) * 0.08 + Math.sin(t * 4.3) * 0.015
    shipRef.current.rotation.z = Math.cos(t * 0.5) * 0.12 + Math.cos(t * 5.1) * 0.02
    shipRef.current.position.y = baseY + Math.sin(t * 0.6) * 0.35 + Math.sin(t * 3.7) * 0.06
    shipRef.current.position.x = -3 + Math.sin(t * 0.8) * 0.15 + Math.cos(t * 4.7) * 0.03
  })

  return (
    <group ref={shipRef} position={[-3, baseY, 8]} rotation={[0, Math.PI, 0]}>
      <primitive object={clonedScene} />
      <pointLight
        position={[0, _lighting.POINT_LIGHT_Y, 0]}
        intensity={_lighting.POINT_LIGHT_INTENSITY}
        distance={_lighting.POINT_LIGHT_DISTANCE}
        decay={2}
        color="#ffffff"
      />
      {/* Note: fill light is inside TunnelShip group (rotated π on Y) — direction differs
         from scene-level fill lights in GameplayScene/BossScene but visually acceptable
         for tunnel display context (Story 15.1 review) */}
      <directionalLight
        position={_lighting.FILL_LIGHT_POSITION}
        intensity={_tunnelFillIntensity}
        castShadow={false}
        color="#ffffff"
      />
    </group>
  )
}

// Soft circular particle texture
const _particleTexture = (() => {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.6)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)
  return new THREE.CanvasTexture(canvas)
})()

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
      spd[i] = 150 + Math.random() * 200
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
      <pointsMaterial
        size={1.5}
        sizeAttenuation
        map={_particleTexture}
        color="#9977cc"
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Speed lines — long thin streaks near tunnel walls for warp speed feel
function SpeedLines() {
  const linesRef = useRef()

  const { geometry, speeds } = useMemo(() => {
    const count = 120
    const geo = new THREE.BufferGeometry()
    // Each line = 2 vertices (start, end) stretched along Z
    const pos = new Float32Array(count * 2 * 3)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      // Place near tunnel walls (radius 0.7-0.95 of tunnel)
      const r = TUNNEL_RADIUS * (0.7 + Math.random() * 0.25)
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      const z = (Math.random() - 0.5) * TUNNEL_LENGTH
      const lineLen = 3 + Math.random() * 8

      // Start point
      pos[i * 6] = x
      pos[i * 6 + 1] = y
      pos[i * 6 + 2] = z
      // End point (stretched along Z)
      pos[i * 6 + 3] = x
      pos[i * 6 + 4] = y
      pos[i * 6 + 5] = z + lineLen

      spd[i] = 120 + Math.random() * 180
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.computeBoundingSphere()
    return { geometry: geo, speeds: spd }
  }, [])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame((_, delta) => {
    if (!linesRef.current) return
    const positions = linesRef.current.geometry.attributes.position
    const arr = positions.array
    const halfLen = TUNNEL_LENGTH / 2
    const count = positions.count / 2
    for (let i = 0; i < count; i++) {
      const dz = speeds[i] * delta
      // Move both start and end points
      arr[i * 6 + 2] += dz
      arr[i * 6 + 5] += dz
      // Wrap both when start passes the end
      if (arr[i * 6 + 2] > halfLen) {
        const wrap = TUNNEL_LENGTH
        arr[i * 6 + 2] -= wrap
        arr[i * 6 + 5] -= wrap
      }
    }
    positions.needsUpdate = true
  })

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial
        color="#ddccff"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  )
}

function TunnelCamera() {
  const { camera, scene, gl } = useThree()
  const savedRef = useRef()

  useEffect(() => {
    savedRef.current = {
      position: camera.position.clone(),
      fov: camera.fov,
      rotation: camera.rotation.clone(),
      background: scene.background,
      clearColor: gl.getClearColor(new THREE.Color()),
      clearAlpha: gl.getClearAlpha(),
    }
    camera.position.set(0, 0, 15)
    camera.rotation.set(0, 0, 0)
    camera.fov = 90
    camera.updateProjectionMatrix()
    scene.background = _bgColor
    gl.setClearColor(_bgColor, 1)

    return () => {
      if (savedRef.current) {
        camera.position.copy(savedRef.current.position)
        camera.fov = savedRef.current.fov
        camera.rotation.copy(savedRef.current.rotation)
        camera.updateProjectionMatrix()
        scene.background = savedRef.current.background
        gl.setClearColor(savedRef.current.clearColor, savedRef.current.clearAlpha)
      }
    }
  }, [camera, scene, gl])

  return null
}

export default function TunnelScene() {
  return (
    <>
      <TunnelCamera />

      <ambientLight intensity={0.3} color="#ffffff" />
      <pointLight position={[0, 0, -20]} intensity={1.5} color="#6622cc" distance={80} />
      <pointLight position={[0, 0, 40]} intensity={1.0} color="#0044cc" distance={60} />

      <TunnelTube />
      <SpeedLines />
      <TunnelParticles />
      <TunnelShip />
    </>
  )
}

useGLTF.preload('/models/ships/Spaceship.glb')
