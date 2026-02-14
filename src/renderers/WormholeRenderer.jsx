import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import useLevel from '../stores/useLevel.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

const { WORMHOLE_VISUAL } = GAME_CONFIG

// --- Rift shader (adapted from SystemEntryPortal) ---
const riftVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const riftFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;
uniform vec3 uColor2;
varying vec2 vUv;

// Hash-based noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 center = vUv - 0.5;
  float dist = length(center);
  float angle = atan(center.y, center.x);

  // Circular mask — sharp edge
  float mask = smoothstep(0.5, 0.42, dist);
  if (mask <= 0.0) discard;

  // Swirling distortion
  float swirl = angle + uTime * 1.8 + dist * 8.0;
  float t2 = uTime * 0.7;

  // Layered energy patterns
  float energy1 = fbm(vec2(swirl * 0.8, dist * 4.0 - t2));
  float energy2 = fbm(vec2(swirl * 1.2 + 3.0, dist * 3.0 + t2 * 0.5));
  float energy = energy1 * 0.6 + energy2 * 0.4;

  // Rift core — dark void in center with bright fracture edges
  float coreDark = smoothstep(0.0, 0.25, dist);
  float edgeGlow = smoothstep(0.5, 0.3, dist) * smoothstep(0.0, 0.15, dist);

  // Fracture lines — high-frequency angular noise
  float fractures = noise(vec2(angle * 6.0 + uTime * 2.0, dist * 10.0));
  fractures = pow(fractures, 2.0) * edgeGlow;

  // Color mixing — purple core → brighter purple edge
  vec3 color = mix(uColor, uColor2, dist * 2.0);
  color *= (energy * 1.5 + fractures * 2.0) * coreDark;
  color += uColor * edgeGlow * 0.6;

  // Bright edge rim
  float rim = smoothstep(0.45, 0.38, dist) * smoothstep(0.3, 0.38, dist);
  color += (uColor + uColor2) * 0.5 * rim * 3.0;

  // Inner void darkness
  float voidCenter = 1.0 - smoothstep(0.0, 0.12, dist);
  color = mix(color, vec3(0.0), voidCenter * 0.7);

  float alpha = mask * uOpacity * (energy * 0.4 + 0.6);
  gl_FragColor = vec4(color, alpha);
}
`

export default function WormholeRenderer() {
  const portalRef = useRef()
  const particlesRef = useRef()

  const WORMHOLE_COLOR = new THREE.Color('#5518aa') // Deep purple (tunnel color)
  const WORMHOLE_COLOR2 = new THREE.Color('#bb88ff') // Bright purple

  // Rift shader material
  const riftMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: riftVertexShader,
    fragmentShader: riftFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: WORMHOLE_COLOR },
      uColor2: { value: WORMHOLE_COLOR2 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [])

  // Particle positions scattered around the portal area
  const { positions: particlePositions, velocities: particleVelocities } = useMemo(() => {
    const count = WORMHOLE_VISUAL.PARTICLE_COUNT
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 2) // angular velocity + radial offset
    const radius = WORMHOLE_VISUAL.SPHERE_RADIUS
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r = radius * (0.5 + Math.random() * 0.6)
      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = Math.sin(angle) * r
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2
      vel[i * 2] = 0.5 + Math.random() * 1.5 // angular speed
      vel[i * 2 + 1] = r // base radius
    }
    return { positions: pos, velocities: vel }
  }, [])

  // BufferGeometry ref for particle position updates
  const particleGeoRef = useRef()

  // Dispose materials on unmount
  useEffect(() => {
    return () => {
      riftMaterial.dispose()
    }
  }, [riftMaterial])

  useFrame((state, delta) => {
    const { wormholeState, wormhole, wormholeActivationTimer } = useLevel.getState()

    if (wormholeState === 'hidden' || !wormhole) {
      if (portalRef.current) portalRef.current.visible = false
      if (particlesRef.current) particlesRef.current.visible = false
      return
    }

    if (!portalRef.current || !particlesRef.current) return

    portalRef.current.visible = true
    particlesRef.current.visible = true

    const clock = state.clock.elapsedTime

    // Update shader time
    riftMaterial.uniforms.uTime.value = clock

    // Position at wormhole location
    portalRef.current.position.set(wormhole.x, 0, wormhole.z)
    particlesRef.current.position.set(wormhole.x, 0, wormhole.z)

    if (wormholeState === 'visible') {
      // Dormant state: small size, full opacity
      const baseScale = 0.5 // Small at start
      portalRef.current.scale.setScalar(baseScale)
      particlesRef.current.scale.setScalar(baseScale)
      riftMaterial.uniforms.uOpacity.value = 0.9

    } else if (wormholeState === 'activating') {
      // Activating state: growing to full size
      const activationProgress = 1 - (wormholeActivationTimer / GAME_CONFIG.WORMHOLE_TRANSITION_DELAY)
      const scale = 0.5 + activationProgress * (WORMHOLE_VISUAL.ACTIVATION_SCALE - 0.5)
      portalRef.current.scale.setScalar(scale)
      particlesRef.current.scale.setScalar(scale)
      riftMaterial.uniforms.uOpacity.value = 0.9 + activationProgress * 0.1

    } else if (wormholeState === 'active') {
      // Active state: full size
      portalRef.current.scale.setScalar(WORMHOLE_VISUAL.ACTIVATION_SCALE)
      particlesRef.current.scale.setScalar(WORMHOLE_VISUAL.ACTIVATION_SCALE)
      riftMaterial.uniforms.uOpacity.value = 1.0
    }

    // Animate particles — orbit around portal
    if (particlesRef.current.visible && particleGeoRef.current) {
      const posAttr = particleGeoRef.current.getAttribute('position')
      if (posAttr) {
        const count = WORMHOLE_VISUAL.PARTICLE_COUNT
        for (let i = 0; i < count; i++) {
          const angSpeed = particleVelocities[i * 2]
          const baseR = particleVelocities[i * 2 + 1]
          const angle = (i / count) * Math.PI * 2 + clock * angSpeed
          const r = baseR + Math.sin(clock * 3 + i) * 1.5
          posAttr.setXYZ(i, Math.cos(angle) * r, Math.sin(angle) * r, Math.sin(clock * 2 + i * 0.5) * 1.5)
        }
        posAttr.needsUpdate = true
      }
    }
  })

  const wormholeState = useLevel((s) => s.wormholeState)
  const wormhole = useLevel((s) => s.wormhole)

  if (wormholeState === 'hidden' || !wormhole) return null

  return (
    <group>
      {/* Rift portal — horizontal plane with shader */}
      <mesh
        ref={portalRef}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        renderOrder={1}
      >
        <planeGeometry args={[WORMHOLE_VISUAL.SPHERE_RADIUS * 2, WORMHOLE_VISUAL.SPHERE_RADIUS * 2]} />
        <primitive object={riftMaterial} attach="material" />
      </mesh>

      {/* Energy particles orbiting the rift */}
      <points
        ref={particlesRef}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <bufferGeometry ref={particleGeoRef}>
          <bufferAttribute
            attach="attributes-position"
            array={particlePositions}
            count={WORMHOLE_VISUAL.PARTICLE_COUNT}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={WORMHOLE_COLOR2}
          size={2}
          transparent
          opacity={0.9}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
