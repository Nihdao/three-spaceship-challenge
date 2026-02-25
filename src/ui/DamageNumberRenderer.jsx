import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useDamageNumbers from '../stores/useDamageNumbers.jsx'
import useGame from '../stores/useGame.jsx'
import { project3DToScreen } from '../systems/damageNumberSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX_COUNT = GAME_CONFIG.DAMAGE_NUMBERS.MAX_COUNT
const LIFETIME = GAME_CONFIG.DAMAGE_NUMBERS.LIFETIME
const RISE_SPEED = GAME_CONFIG.DAMAGE_NUMBERS.RISE_SPEED
const CRIT_SPEED_MULT = GAME_CONFIG.CRIT_HIT_VISUALS.ANIMATION_SPEED_MULT
const CRIT_SCALE = GAME_CONFIG.CRIT_HIT_VISUALS.SCALE_MULTIPLIER
const CRIT_BOUNCE_DUR = GAME_CONFIG.CRIT_HIT_VISUALS.BOUNCE_DURATION
const BASE_FONT_PX = GAME_CONFIG.DAMAGE_NUMBERS.BASE_FONT_PX
const PLAYER_RISE_SPEED_MULT = GAME_CONFIG.DAMAGE_NUMBERS.PLAYER_RISE_SPEED_MULT
const PLAYER_FONT_PX = GAME_CONFIG.DAMAGE_NUMBERS.PLAYER_FONT_PX
const PLAYER_TEXT_SHADOW = '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9)'
const DEFAULT_TEXT_SHADOW = '1px 1px 2px rgba(0,0,0,0.6)'

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
  // Tracks whether last frame was paused — avoids re-hiding already-hidden divs on sustained pause (Story 40.1)
  const wasPausedRef = useRef(false)

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

  // Ordering contract: this useFrame must run AFTER GameLoop.useFrame so that isPaused is already
  // set (e.g. triggerLevelUp called from GameLoop) before this guard reads it. Both use default
  // priority 0 — execution order is determined by component mount order (GameLoop mounts first).
  useFrame(() => {
    const isPaused = useGame.getState().isPaused
    // Guard: hide all numbers during pause / modal phases (Story 40.1)
    // wasPausedRef avoids re-iterating already-hidden divs on every sustained pause frame
    if (isPaused) {
      if (!wasPausedRef.current) {
        const refs = divRefs.current
        for (let i = 0; i < MAX_COUNT; i++) {
          if (refs[i]) refs[i].style.display = 'none'
        }
        wasPausedRef.current = true
      }
      return
    }
    wasPausedRef.current = false

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

        // Rise speed: player damage floats faster for urgency; crit faster too
        const riseSpeed = num.isPlayerDamage
          ? RISE_SPEED * PLAYER_RISE_SPEED_MULT
          : num.isCrit ? RISE_SPEED * CRIT_SPEED_MULT : RISE_SPEED
        const yOffset = num.age * riseSpeed
        const alpha = Math.max(0, 1 - num.age / LIFETIME)

        // Font size: player damage slightly larger; crit gets pop-out bounce scale
        let fontSize
        if (num.isPlayerDamage) {
          fontSize = PLAYER_FONT_PX
        } else if (num.isCrit) {
          // Crit scale: bounces from 1.6x → CRIT_SCALE over BOUNCE_DURATION, then stays at CRIT_SCALE
          const t = Math.min(num.age / CRIT_BOUNCE_DUR, 1.0)
          const scale = CRIT_SCALE + (1 - t) * 0.3  // 1.63 → 1.33 over bounce, then 1.33
          fontSize = Math.round(BASE_FONT_PX * scale)
        } else {
          fontSize = BASE_FONT_PX
        }

        div.style.display = 'block'
        // translate3d for GPU compositing; translate(-50%,-50%) centers text on impact point
        div.style.transform = `translate3d(${sx + num.offsetX}px, ${sy - yOffset}px, 0) translate(-50%, -50%)`
        div.style.opacity = alpha.toString()
        div.style.color = num.color
        div.style.fontSize = `${fontSize}px`
        div.style.textShadow = num.isPlayerDamage ? PLAYER_TEXT_SHADOW : DEFAULT_TEXT_SHADOW
        div.textContent = `${Math.round(num.damage)}${num.isCrit ? '!' : ''}`
      } else {
        div.style.display = 'none'
      }
    }
  })

  // Return null to R3F — this component has no Three.js geometry
  return null
}
