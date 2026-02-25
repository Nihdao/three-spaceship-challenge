// src/ui/MapOverlay.jsx
// Story 35.2: Large map overlay (M key toggle, non-pausing)

import { useState, useEffect, useRef } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useLevel from '../stores/useLevel.jsx'
import { PLANETS } from '../entities/planetDefs.js'
import { getDiscoveredCells, isPosDiscovered, FOG_GRID_SIZE } from '../systems/fogSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

function readStores() {
  const { position: playerPos, rotation: playerRot } = usePlayer.getState()
  const { planets, wormhole, wormholeState } = useLevel.getState()
  return { playerPos, playerRot, planets, wormhole, wormholeState }
}

// World coord range: -PLAY_AREA_SIZE..+PLAY_AREA_SIZE
const WORLD_SIZE = GAME_CONFIG.PLAY_AREA_SIZE * 2

export function worldToMapPct(worldCoord) {
  return ((worldCoord + WORLD_SIZE / 2) / WORLD_SIZE) * 100
}

export default function MapOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const canvasRef = useRef(null)

  const [polledState, setPolledState] = useState(() => readStores())

  // Hold M to show map (e.key for AZERTY compatibility — e.code 'KeyM' is QWERTY physical position)
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.key === 'm' || e.key === 'M') && !e.repeat) {
        const { isPaused } = useGame.getState()
        if (!isPaused) setIsOpen(true)
      }
    }
    const onKeyUp = (e) => {
      if (e.key === 'm' || e.key === 'M') setIsOpen(false)
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
  }, [])

  // Subtask 2.3: Polling interval — reads stores imperatively at 10fps (100ms)
  // Polls immediately on open to avoid the 100ms stale-state flash at position [0,0,0]
  useEffect(() => {
    if (!isOpen) return
    setPolledState(readStores())
    const id = setInterval(() => setPolledState(readStores()), 100)
    return () => clearInterval(id)
  }, [isOpen])

  // Subtask 2.4: Canvas fog rendering — redraws on each polledState update
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isOpen) return
    const ctx = canvas.getContext('2d')
    const grid = getDiscoveredCells()

    ctx.clearRect(0, 0, FOG_GRID_SIZE, FOG_GRID_SIZE)
    for (let row = 0; row < FOG_GRID_SIZE; row++) {
      for (let col = 0; col < FOG_GRID_SIZE; col++) {
        const discovered = grid[row * FOG_GRID_SIZE + col] === 1
        // rs-bg-raised = #241d35 at 45% — rs-bg = #0d0b14 at 80%
        ctx.fillStyle = discovered ? 'rgba(36,29,53,0.45)' : 'rgba(13,11,20,0.80)'
        ctx.fillRect(col, row, 1, 1)
      }
    }
  }, [polledState, isOpen])

  if (!isOpen) return null

  const pctX = worldToMapPct(polledState.playerPos[0])
  const pctZ = worldToMapPct(polledState.playerPos[2])

  return (
    // Subtask 1.5: Overlay container with Redshift styles
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80vw',
      height: '80vh',
      backgroundColor: 'rgba(13,11,20,0.65)',
      border: '2px solid var(--rs-teal)',
      clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
      zIndex: 50,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      {/* Canvas fog layer — 60×60 px scaled via CSS */}
      <canvas
        ref={canvasRef}
        width={FOG_GRID_SIZE}
        height={FOG_GRID_SIZE}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
        }}
      />

      {/* Subtask 3.1: Planet dots — only show fog-discovered planets */}
      {polledState.planets.filter(p => isPosDiscovered(p.x, p.z)).map(p => {
        const color = PLANETS[p.typeId]?.color || '#ffffff'
        return (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${worldToMapPct(p.x)}%`,
            top: `${worldToMapPct(p.z)}%`,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
            transform: 'translate(-50%, -50%)',
            opacity: p.scanned ? 0.3 : 1,
            transition: 'opacity 200ms ease-out',
            pointerEvents: 'none',
          }} />
        )
      })}

      {/* Subtask 3.2: Wormhole pulsing violet dot */}
      {polledState.wormhole && polledState.wormholeState !== 'hidden' && (
        <div style={{
          position: 'absolute',
          left: `${worldToMapPct(polledState.wormhole.x)}%`,
          top: `${worldToMapPct(polledState.wormhole.z)}%`,
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: 'var(--rs-violet)',
          boxShadow: '0 0 8px var(--rs-violet)',
          transform: 'translate(-50%, -50%)',
          animation: 'scanPulse 800ms ease-in-out infinite alternate',
          pointerEvents: 'none',
        }} />
      )}

      {/* Subtask 3.3: Player triangle SVG */}
      <div style={{
        position: 'absolute',
        left: `${pctX}%`,
        top: `${pctZ}%`,
        transform: `translate(-50%, -50%) rotate(${polledState.playerRot}rad)`,
        pointerEvents: 'none',
      }}>
        <svg width="10" height="12" viewBox="0 0 10 12" fill="var(--rs-teal)">
          <polygon points="5,0 10,12 5,9 0,12" />
        </svg>
      </div>

      {/* Subtask 3.4: Cardinal direction labels */}
      {[
        { label: 'N', style: { top: '6px', left: '50%', transform: 'translateX(-50%)' } },
        { label: 'S', style: { bottom: '6px', left: '50%', transform: 'translateX(-50%)' } },
        { label: 'W', style: { left: '6px', top: '50%', transform: 'translateY(-50%)' } },
        { label: 'E', style: { right: '6px', top: '50%', transform: 'translateY(-50%)' } },
      ].map(({ label, style }) => (
        <span key={label} style={{
          position: 'absolute',
          ...style,
          fontFamily: "'Space Mono', monospace",
          fontSize: '11px',
          color: 'var(--rs-text-muted)',
          pointerEvents: 'none',
          zIndex: 10,
        }}>{label}</span>
      ))}
    </div>
  )
}
