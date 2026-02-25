import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getRareItems, getActiveRareItemCount } from '../systems/rareItemSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX = GAME_CONFIG.MAX_RARE_ITEMS
const ICON_SCALE = 1.6

// Fetch SVG, replace black fill with white so MeshBasicMaterial.color tint works
async function loadColoredSvgTexture(path) {
  const response = await fetch(path)
  const svgText = await response.text()
  const whiteFill = svgText.replace(/fill="#000"/g, 'fill="#fff"')
  const blob = new Blob([whiteFill], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  return new Promise((resolve) => {
    const tex = new THREE.TextureLoader().load(url, () => {
      URL.revokeObjectURL(url)
      tex.colorSpace = THREE.SRGBColorSpace
      resolve(tex)
    })
  })
}

export default function RareItemRenderer() {
  const magnetIconRef = useRef()
  const bombIconRef = useRef()
  const shieldIconRef = useRef()
  const magnetGlowRef = useRef()
  const bombGlowRef = useRef()
  const shieldGlowRef = useRef()

  const dummyRef = useRef(new THREE.Object3D())

  // Materials as refs so we can mutate .map after async texture load
  const magnetIconMat = useRef(
    new THREE.MeshBasicMaterial({
      color: '#00eeff',
      transparent: true,
      alphaTest: 0.05,
      toneMapped: false,
      depthWrite: false,
    }),
  )
  const bombIconMat = useRef(
    new THREE.MeshBasicMaterial({
      color: '#ff8800',
      transparent: true,
      alphaTest: 0.05,
      toneMapped: false,
      depthWrite: false,
    }),
  )
  const shieldIconMat = useRef(
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      alphaTest: 0.05,
      toneMapped: false,
      depthWrite: false,
    }),
  )

  const iconGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const glowGeo = useMemo(() => new THREE.RingGeometry(0.72, 0.9, 32), [])

  const magnetGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00eeff',
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const bombGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ff6600',
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const shieldGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#aaddff',
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  )

  // Load textures asynchronously, then patch material.map
  useEffect(() => {
    const mMat = magnetIconMat.current
    const bMat = bombIconMat.current
    const sMat = shieldIconMat.current
    let magnetTex, bombTex, shieldTex

    loadColoredSvgTexture('/assets/1x1/lorc/magnet.svg').then((tex) => {
      magnetTex = tex
      mMat.map = tex
      mMat.needsUpdate = true
    })
    loadColoredSvgTexture('/assets/1x1/lorc/sparky-bomb.svg').then((tex) => {
      bombTex = tex
      bMat.map = tex
      bMat.needsUpdate = true
    })
    loadColoredSvgTexture('/assets/1x1/lorc/energy-shield.svg').then((tex) => {
      shieldTex = tex
      sMat.map = tex
      sMat.needsUpdate = true
    })

    return () => {
      magnetTex?.dispose()
      bombTex?.dispose()
      shieldTex?.dispose()
      mMat.dispose()
      bMat.dispose()
      sMat.dispose()
    }
  }, [])

  useEffect(() => {
    return () => {
      iconGeo.dispose()
      glowGeo.dispose()
      magnetGlowMat.dispose()
      bombGlowMat.dispose()
      shieldGlowMat.dispose()
    }
  }, [iconGeo, glowGeo, magnetGlowMat, bombGlowMat, shieldGlowMat])

  useFrame((state) => {
    const mIcon = magnetIconRef.current
    const bIcon = bombIconRef.current
    const sIcon = shieldIconRef.current
    const mGlow = magnetGlowRef.current
    const bGlow = bombGlowRef.current
    const sGlow = shieldGlowRef.current
    if (!mIcon || !bIcon || !sIcon || !mGlow || !bGlow || !sGlow) return

    const items = getRareItems()
    const count = getActiveRareItemCount()
    const dummy = dummyRef.current
    const elapsed = state.clock.elapsedTime
    const camQuat = state.camera.quaternion

    let magnetIdx = 0
    let bombIdx = 0
    let shieldIdx = 0

    for (let i = 0; i < count; i++) {
      const item = items[i]
      const oscY = Math.sin(elapsed * 2.5 + i * 1.2) * 0.15
      const glowPulse = 1.0 + Math.sin(elapsed * 4.0 + i * 1.7) * 0.18

      dummy.position.set(item.x, 0.5 + oscY, item.z)
      // Billboard: always face the camera
      dummy.quaternion.copy(camQuat)

      if (item.type === 'MAGNET') {
        dummy.scale.set(ICON_SCALE, ICON_SCALE, ICON_SCALE)
        dummy.updateMatrix()
        mIcon.setMatrixAt(magnetIdx, dummy.matrix)

        const gs = ICON_SCALE * glowPulse
        dummy.scale.set(gs, gs, gs)
        dummy.updateMatrix()
        mGlow.setMatrixAt(magnetIdx, dummy.matrix)
        magnetIdx++
      } else if (item.type === 'BOMB') {
        dummy.scale.set(ICON_SCALE, ICON_SCALE, ICON_SCALE)
        dummy.updateMatrix()
        bIcon.setMatrixAt(bombIdx, dummy.matrix)

        const gs = ICON_SCALE * glowPulse
        dummy.scale.set(gs, gs, gs)
        dummy.updateMatrix()
        bGlow.setMatrixAt(bombIdx, dummy.matrix)
        bombIdx++
      } else if (item.type === 'SHIELD') {
        dummy.scale.set(ICON_SCALE, ICON_SCALE, ICON_SCALE)
        dummy.updateMatrix()
        sIcon.setMatrixAt(shieldIdx, dummy.matrix)

        const gs = ICON_SCALE * glowPulse
        dummy.scale.set(gs, gs, gs)
        dummy.updateMatrix()
        sGlow.setMatrixAt(shieldIdx, dummy.matrix)
        shieldIdx++
      }
    }

    mIcon.count = magnetIdx
    bIcon.count = bombIdx
    sIcon.count = shieldIdx
    mGlow.count = magnetIdx
    bGlow.count = bombIdx
    sGlow.count = shieldIdx

    if (magnetIdx > 0) {
      mIcon.instanceMatrix.needsUpdate = true
      mGlow.instanceMatrix.needsUpdate = true
    }
    if (bombIdx > 0) {
      bIcon.instanceMatrix.needsUpdate = true
      bGlow.instanceMatrix.needsUpdate = true
    }
    if (shieldIdx > 0) {
      sIcon.instanceMatrix.needsUpdate = true
      sGlow.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      {/* Glow rings behind icons (additive blending) */}
      <instancedMesh ref={magnetGlowRef} args={[glowGeo, magnetGlowMat, MAX]} frustumCulled={false} />
      <instancedMesh ref={bombGlowRef} args={[glowGeo, bombGlowMat, MAX]} frustumCulled={false} />
      <instancedMesh ref={shieldGlowRef} args={[glowGeo, shieldGlowMat, MAX]} frustumCulled={false} />

      {/* Icon sprites on top */}
      <instancedMesh
        ref={magnetIconRef}
        args={[iconGeo, magnetIconMat.current, MAX]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={bombIconRef}
        args={[iconGeo, bombIconMat.current, MAX]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={shieldIconRef}
        args={[iconGeo, shieldIconMat.current, MAX]}
        frustumCulled={false}
      />
    </>
  )
}
