import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useDamageNumbers from '../stores/useDamageNumbers.jsx'
import { project3DToScreen } from '../systems/damageNumberSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX_COUNT = GAME_CONFIG.DAMAGE_NUMBERS.MAX_COUNT
const LIFETIME = GAME_CONFIG.DAMAGE_NUMBERS.LIFETIME
const RISE_SPEED = GAME_CONFIG.DAMAGE_NUMBERS.RISE_SPEED

// Pre-allocated scratch Vector3 — passed to project3DToScreen to avoid per-frame allocations
const _tmpV = new THREE.Vector3()

/**
 * Renders floating damage numbers as an HTML overlay above the R3F canvas.
 *
 * Architecture:
 * - Lives inside the Canvas (R3F) to access useFrame + useThree for camera projection
 * - Returns null to R3F — no Three.js geometry created
 * - Creates the HTML container + pool of MAX_COUNT divs imperatively via useEffect
 * - Updates div styles imperatively in useFrame (zero React re-renders during animation)
 * - Object pool: MAX_COUNT divs always in DOM, toggled via display none/block
 *
 * (Story 27.1)
 */
export default function DamageNumberRenderer() {
  const { camera, gl } = useThree()
  const divRefs = useRef([])

  // Create HTML container + pre-allocated div pool imperatively (outside R3F's reconciler)
  useEffect(() => {
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:45;overflow:hidden;'
    document.body.appendChild(container)

    for (let i = 0; i < MAX_COUNT; i++) {
      const div = document.createElement('div')
      div.className = 'damage-number'
      div.style.display = 'none'
      container.appendChild(div)
      divRefs.current[i] = div
    }

    return () => {
      document.body.removeChild(container)
      divRefs.current = []
    }
  }, [])

  useFrame(() => {
    const { damageNumbers } = useDamageNumbers.getState()
    const canvas = gl.domElement

    for (let i = 0; i < MAX_COUNT; i++) {
      const div = divRefs.current[i]
      if (!div) continue

      const num = damageNumbers[i]
      if (num) {
        // Project 3D world position to 2D screen coordinates (_tmpV is mutated by project3DToScreen)
        _tmpV.set(num.worldX, num.worldY, num.worldZ)
        const { x: sx, y: sy } = project3DToScreen(_tmpV, camera, canvas)

        // Upward movement + horizontal drift
        const yOffset = num.age * RISE_SPEED
        const alpha = Math.max(0, 1 - num.age / LIFETIME)

        div.style.display = 'block'
        // translate3d for GPU compositing; translate(-50%,-50%) centers text on impact point
        div.style.transform = `translate3d(${sx + num.offsetX}px, ${sy - yOffset}px, 0) translate(-50%, -50%)`
        div.style.opacity = alpha.toString()
        div.style.color = num.color
        div.textContent = String(Math.round(num.damage))
      } else {
        div.style.display = 'none'
      }
    }
  })

  // Return null to R3F — this component has no Three.js geometry
  return null
}
