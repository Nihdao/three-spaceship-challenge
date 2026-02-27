import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import usePlayer from '../stores/usePlayer.jsx'

const TRAIL_POINTS = 100
const CORE_WIDTH = 0.18
const GLOW_WIDTH = 0.55
const MIN_DIST_SQ = 0.09    // 0.3 unités min entre samples
const LIFETIME = 0.5         // secondes
const BACK_OFFSET = 2.4      // décalage arrière depuis le centre du vaisseau
const LATERAL_OFFSET = 0.85  // écartement gauche/droite entre les deux propulseurs
const CORE_MAX_OPACITY = 0.15
const GLOW_MAX_OPACITY = 0.04

const VERT_SHADER = `
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const FRAG_SHADER = `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColor, vAlpha);
  }
`

function makeGeometry(n) {
  const positions = new Float32Array(n * 2 * 3)
  const alphas = new Float32Array(n * 2)
  const indices = []
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1
    indices.push(a, c, b, b, c, d)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
  geo.setIndex(indices)
  geo.setDrawRange(0, 0)
  return geo
}

function makeMaterial(hexColor) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(hexColor) } },
    vertexShader: VERT_SHADER,
    fragmentShader: FRAG_SHADER,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

// Met à jour les buffers de position et d'alpha d'une géométrie ruban
function updateRibbonGeo(geo, buf, head, count, N, coreWidth, glowGeo, glowBuf, maxCoreOpacity, maxGlowOpacity) {
  const corePos = geo.attributes.position.array
  const coreAlpha = geo.attributes.aAlpha.array
  const glowPos = glowGeo.attributes.position.array
  const glowAlpha = glowGeo.attributes.aAlpha.array

  for (let i = 0; i < count; i++) {
    const idx = (head - 1 - i + N * 2) % N
    const pt = buf[idx]

    let tdx, tdz
    if (i === 0) {
      const ni = (head - 2 + N * 2) % N
      tdx = buf[ni].x - pt.x; tdz = buf[ni].z - pt.z
    } else if (i === count - 1) {
      const pi = (head - i + N * 2) % N
      tdx = pt.x - buf[pi].x; tdz = pt.z - buf[pi].z
    } else {
      const ni = (head - 2 - i + N * 2) % N
      const pi = (head - i + N * 2) % N
      tdx = buf[ni].x - buf[pi].x; tdz = buf[ni].z - buf[pi].z
    }

    const len = Math.hypot(tdx, tdz) || 1
    const px = -tdz / len
    const pz = tdx / len

    const fade = 1 - pt.age / LIFETIME
    const cw = coreWidth * fade
    const gw = GLOW_WIDTH * fade

    const vi = i * 6
    const ai = i * 2

    corePos[vi + 0] = pt.x + px * cw; corePos[vi + 1] = 0; corePos[vi + 2] = pt.z + pz * cw
    corePos[vi + 3] = pt.x - px * cw; corePos[vi + 4] = 0; corePos[vi + 5] = pt.z - pz * cw
    coreAlpha[ai] = coreAlpha[ai + 1] = fade * maxCoreOpacity

    glowPos[vi + 0] = pt.x + px * gw; glowPos[vi + 1] = 0; glowPos[vi + 2] = pt.z + pz * gw
    glowPos[vi + 3] = pt.x - px * gw; glowPos[vi + 4] = 0; glowPos[vi + 5] = pt.z - pz * gw
    glowAlpha[ai] = glowAlpha[ai + 1] = fade * maxGlowOpacity
  }

  const drawCount = (count - 1) * 6
  geo.setDrawRange(0, drawCount)
  glowGeo.setDrawRange(0, drawCount)
  geo.attributes.position.needsUpdate = true
  geo.attributes.aAlpha.needsUpdate = true
  glowGeo.attributes.position.needsUpdate = true
  glowGeo.attributes.aAlpha.needsUpdate = true
}

function makeTrailRefs(n) {
  return {
    pts: Array.from({ length: n }, () => ({ x: 0, z: 0, age: 0 })),
    head: 0,
    count: 0,
  }
}

export default function NeonTrailRenderer() {
  // Un buffer par propulseur
  const trailL = useRef(makeTrailRefs(TRAIL_POINTS))
  const trailR = useRef(makeTrailRefs(TRAIL_POINTS))
  const lastX = useRef(Infinity)
  const lastZ = useRef(Infinity)

  const coreGeoL = useMemo(() => makeGeometry(TRAIL_POINTS), [])
  const glowGeoL = useMemo(() => makeGeometry(TRAIL_POINTS), [])
  const coreGeoR = useMemo(() => makeGeometry(TRAIL_POINTS), [])
  const glowGeoR = useMemo(() => makeGeometry(TRAIL_POINTS), [])
  const coreMat = useMemo(() => makeMaterial('#e8e8e8'), [])
  const glowMat = useMemo(() => makeMaterial('#aaaaaa'), [])

  useEffect(() => () => {
    coreGeoL.dispose(); glowGeoL.dispose()
    coreGeoR.dispose(); glowGeoR.dispose()
    coreMat.dispose(); glowMat.dispose()
  }, [coreGeoL, glowGeoL, coreGeoR, glowGeoR, coreMat, glowMat])

  useFrame((_, delta) => {
    const { position } = usePlayer.getState()
    const cx = position[0], cz = position[2]
    const N = TRAIL_POINTS

    // Vieillissement et expiration des deux trails
    for (const t of [trailL.current, trailR.current]) {
      for (let i = 0; i < t.count; i++) {
        t.pts[(t.head - 1 - i + N * 2) % N].age += delta
      }
      while (t.count > 0) {
        const tailIdx = (t.head - t.count + N * 2) % N
        if (t.pts[tailIdx].age >= LIFETIME) { t.count-- } else { break }
      }
    }

    // Nouveau sample si le vaisseau a assez bougé
    const dx = cx - lastX.current, dz = cz - lastZ.current
    const distSq = dx * dx + dz * dz
    if (distSq >= MIN_DIST_SQ) {
      const inv = 1 / Math.sqrt(distSq)
      // Direction avant (mouvement) et perpendiculaire (latérale)
      const fdx = dx * inv, fdz = dz * inv
      const pdx = -fdz, pdz = fdx

      // Point central derrière le vaisseau
      const bx = cx - fdx * BACK_OFFSET
      const bz = cz - fdz * BACK_OFFSET

      // Propulseur gauche et droit
      const lx = bx + pdx * LATERAL_OFFSET, lz = bz + pdz * LATERAL_OFFSET
      const rx = bx - pdx * LATERAL_OFFSET, rz = bz - pdz * LATERAL_OFFSET

      const tL = trailL.current
      tL.pts[tL.head].x = lx; tL.pts[tL.head].z = lz; tL.pts[tL.head].age = 0
      tL.head = (tL.head + 1) % N
      if (tL.count < N) tL.count++

      const tR = trailR.current
      tR.pts[tR.head].x = rx; tR.pts[tR.head].z = rz; tR.pts[tR.head].age = 0
      tR.head = (tR.head + 1) % N
      if (tR.count < N) tR.count++

      lastX.current = cx
      lastZ.current = cz
    }

    const tL = trailL.current, tR = trailR.current
    if (tL.count >= 2) {
      updateRibbonGeo(coreGeoL, tL.pts, tL.head, tL.count, N, CORE_WIDTH, glowGeoL, tL.pts, CORE_MAX_OPACITY, GLOW_MAX_OPACITY)
    }
    if (tR.count >= 2) {
      updateRibbonGeo(coreGeoR, tR.pts, tR.head, tR.count, N, CORE_WIDTH, glowGeoR, tR.pts, CORE_MAX_OPACITY, GLOW_MAX_OPACITY)
    }
  })

  return (
    <>
      <mesh geometry={glowGeoL} material={glowMat} frustumCulled={false} />
      <mesh geometry={glowGeoR} material={glowMat} frustumCulled={false} />
      <mesh geometry={coreGeoL} material={coreMat} frustumCulled={false} />
      <mesh geometry={coreGeoR} material={coreMat} frustumCulled={false} />
    </>
  )
}
