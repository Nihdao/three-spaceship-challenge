import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useEnemies from '../stores/useEnemies.jsx'
import useGame from '../stores/useGame.jsx'
import { project3DToScreen } from '../systems/damageNumberSystem.js'

// Max simultaneous elite health bars in the DOM pool
const MAX_BARS = 8

// World Y offset to project the bar above the elite model (meshScale [7,7,7])
const BAR_WORLD_Y = 13

// Pre-allocated scratch Vector3 — avoids per-frame allocation
const _tmpV = new THREE.Vector3()

/**
 * Renders world-space health bars above elite enemies.
 *
 * Architecture mirrors DamageNumberRenderer:
 * - Lives inside the R3F Canvas for useFrame + useThree access
 * - Imperatively creates MAX_BARS DOM elements in useEffect
 * - Updates positions/fills directly in useFrame — zero React re-renders
 * - Returns null: no Three.js geometry
 */
export default function EliteHealthBarRenderer() {
  const { camera, gl } = useThree()
  const barsRef = useRef([])

  useEffect(() => {
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:44;overflow:hidden;'
    document.body.appendChild(container)

    for (let i = 0; i < MAX_BARS; i++) {
      const wrapper = document.createElement('div')
      wrapper.style.cssText = [
        'display:none',
        'position:absolute',
        'transform:translate(-50%,-100%)',
        'flex-direction:column',
        'align-items:center',
        'gap:2px',
      ].join(';')

      // Label "BRUISER"
      const label = document.createElement('div')
      label.textContent = 'BRUISER'
      label.style.cssText = [
        'font-family:Rajdhani,sans-serif',
        'font-size:12px',
        'font-weight:700',
        'letter-spacing:0.35em',
        'color:#ff2200',
        'text-shadow:0 0 6px rgba(255,34,0,0.8)',
        'white-space:nowrap',
      ].join(';')

      // HP track (background)
      const track = document.createElement('div')
      track.style.cssText = [
        'width:56px',
        'height:5px',
        'background:rgba(0,0,0,0.7)',
        'border:1px solid rgba(255,34,0,0.4)',
        'border-radius:1px',
        'overflow:hidden',
      ].join(';')

      // HP fill
      const fill = document.createElement('div')
      fill.style.cssText = [
        'height:100%',
        'width:100%',
        'background:#ff2200',
        'box-shadow:0 0 4px rgba(255,34,0,0.6)',
        'transition:width 60ms linear',
        'transform-origin:left',
      ].join(';')

      track.appendChild(fill)
      wrapper.appendChild(label)
      wrapper.appendChild(track)
      container.appendChild(wrapper)
      barsRef.current[i] = { wrapper, fill }
    }

    return () => {
      document.body.removeChild(container)
      barsRef.current = []
    }
  }, [])

  useFrame(() => {
    const isPaused = useGame.getState().isPaused
    const bars = barsRef.current
    const canvas = gl.domElement

    if (isPaused) {
      for (let i = 0; i < MAX_BARS; i++) {
        if (bars[i]) bars[i].wrapper.style.display = 'none'
      }
      return
    }

    const { enemies } = useEnemies.getState()

    // Iterate enemies, collect elites — no array allocation
    let barIdx = 0
    for (let i = 0; i < enemies.length && barIdx < MAX_BARS; i++) {
      const e = enemies[i]
      if (e.typeId !== 'ELITE_BRUISER') continue

      const bar = bars[barIdx]
      if (!bar) { barIdx++; continue }

      _tmpV.set(e.x, BAR_WORLD_Y, e.z)
      const { x: sx, y: sy } = project3DToScreen(_tmpV, camera, canvas)

      const hpFrac = Math.max(0, e.hp / e.maxHp)

      bar.wrapper.style.display = 'flex'
      bar.wrapper.style.left = `${sx}px`
      bar.wrapper.style.top = `${sy}px`
      bar.fill.style.width = `${hpFrac * 100}%`

      barIdx++
    }

    // Hide unused bar slots
    for (let i = barIdx; i < MAX_BARS; i++) {
      if (bars[i]) bars[i].wrapper.style.display = 'none'
    }
  })

  return null
}
