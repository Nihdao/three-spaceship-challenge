import { useState, useEffect, useRef, useMemo } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import { SHIPS, TRAIT_INFO, getDefaultShipId } from '../entities/shipDefs.js'
import { playSFX } from '../audio/audioManager.js'
import StatLine from './primitives/StatLine.jsx'
import ShipModelPreview from './ShipModelPreview.jsx'

const shipList = Object.values(SHIPS)

export default function ShipSelect() {
  const [selectedShipId, setSelectedShipId] = useState(getDefaultShipId)
  const [focusIndex, setFocusIndex] = useState(0)

  const selectedShip = SHIPS[selectedShipId]

  // Ref to avoid re-registering keyboard listener on every selection change
  const selectedShipIdRef = useRef(selectedShipId)
  selectedShipIdRef.current = selectedShipId

  const focusIndexRef = useRef(focusIndex)
  focusIndexRef.current = focusIndex

  const unlockedIndices = useMemo(
    () => shipList.map((s, i) => (!s.locked ? i : -1)).filter(i => i >= 0),
    [],
  )

  const handleShipClick = (shipId) => {
    if (SHIPS[shipId].locked) return
    playSFX('button-click')
    setSelectedShipId(shipId)
    setFocusIndex(shipList.findIndex(s => s.id === shipId))
  }

  const handleStart = () => {
    playSFX('button-click')
    usePlayer.getState().setCurrentShipId(selectedShipIdRef.current)
    useGame.getState().startGameplay()
  }

  const handleBack = () => {
    playSFX('button-click')
    useGame.getState().setPhase('menu')
  }

  // Keyboard navigation — stable listener using refs
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        handleBack()
        return
      }

      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        handleStart()
        return
      }

      // Grid navigation among unlocked ships only
      const cols = 3
      const currentUnlockedIdx = unlockedIndices.indexOf(focusIndexRef.current)
      if (currentUnlockedIdx < 0) return

      let nextUnlockedIdx = currentUnlockedIdx

      if (e.code === 'ArrowRight') {
        e.preventDefault()
        nextUnlockedIdx = Math.min(currentUnlockedIdx + 1, unlockedIndices.length - 1)
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        nextUnlockedIdx = Math.max(currentUnlockedIdx - 1, 0)
      } else if (e.code === 'ArrowDown') {
        e.preventDefault()
        nextUnlockedIdx = Math.min(currentUnlockedIdx + cols, unlockedIndices.length - 1)
      } else if (e.code === 'ArrowUp') {
        e.preventDefault()
        nextUnlockedIdx = Math.max(currentUnlockedIdx - cols, 0)
      } else {
        return
      }

      if (nextUnlockedIdx !== currentUnlockedIdx) {
        playSFX('button-hover')
        const newIndex = unlockedIndices[nextUnlockedIdx]
        setFocusIndex(newIndex)
        setSelectedShipId(shipList[newIndex].id)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [unlockedIndices])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-game animate-fade-in">
      {/* BACK button */}
      <button
        onClick={handleBack}
        className="absolute top-8 left-8 px-4 py-2 text-sm tracking-widest text-game-text-muted hover:text-game-text transition-colors select-none"
      >
        &larr; BACK
      </button>

      <div className="flex gap-8 w-full h-full max-w-5xl p-8 pt-20">
        {/* LEFT: Ship Grid */}
        <div className="flex-1 overflow-y-auto">
          <h2
            className="text-2xl font-bold tracking-[0.15em] text-game-text mb-6 select-none"
            style={{ textShadow: '0 0 30px rgba(255, 0, 255, 0.2)' }}
          >
            SELECT YOUR SHIP
          </h2>
          <div className="grid grid-cols-3 gap-4 p-1">
            {shipList.map((ship, i) => (
              <button
                key={ship.id}
                onClick={() => handleShipClick(ship.id)}
                disabled={ship.locked}
                onMouseEnter={() => {
                  if (!ship.locked) {
                    playSFX('button-hover')
                    setSelectedShipId(ship.id)
                    setFocusIndex(i)
                  }
                }}
                className={`
                  relative p-3 border rounded-lg transition-all duration-150 select-none
                  ${ship.locked
                    ? 'opacity-40 grayscale cursor-not-allowed border-game-border/30 bg-white/[0.03]'
                    : 'cursor-pointer border-game-border/70 bg-white/[0.08] hover:border-game-accent/50 hover:bg-white/[0.12]'
                  }
                  ${selectedShipId === ship.id && !ship.locked
                    ? 'border-game-accent ring-1 ring-game-accent/40 bg-game-accent/15'
                    : ''
                  }
                `}
              >
                {/* Ship thumbnail */}
                <div className="aspect-square bg-game-text-muted/5 rounded mb-2 flex items-center justify-center text-3xl overflow-hidden">
                  {ship.locked
                    ? '🔒'
                    : <ShipModelPreview modelPath={ship.modelPath} />
                  }
                </div>
                <p className="text-game-text font-semibold tracking-wide text-xs">{ship.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Ship Detail Panel */}
        <div className="w-80 bg-game-bg/60 border border-game-border/40 rounded-lg p-6 flex flex-col backdrop-blur-sm">
          {/* Ship 3D Preview */}
          <div
            className="aspect-video rounded-lg mb-4 overflow-hidden"
            style={{ backgroundColor: `${selectedShip.colorTheme}10`, borderColor: `${selectedShip.colorTheme}30`, borderWidth: 1 }}
          >
            <ShipModelPreview modelPath={selectedShip.modelPath} rotate />
          </div>

          {/* Ship Name & Description */}
          <h3
            className="text-xl font-bold tracking-[0.1em] text-game-text mb-2"
            style={{ textShadow: `0 0 20px ${selectedShip.colorTheme}40` }}
          >
            {selectedShip.name}
          </h3>
          <p className="text-sm text-game-text-muted mb-4 leading-relaxed">
            {selectedShip.description}
          </p>

          {/* Separator */}
          <div className="border-t border-game-border/20 mb-4" />

          {/* Stats */}
          <div className="space-y-3 mb-4">
            <StatLine
              label="HP"
              value={selectedShip.baseHP}
              icon="❤️"
              tooltip="Maximum health points. Lose all HP and it's game over."
            />
            <StatLine
              label="SPEED"
              value={selectedShip.baseSpeed}
              icon="⚡"
              tooltip="Movement speed. Higher speed = faster dodging and mobility."
            />
            <StatLine
              label="DAMAGE"
              value={`${selectedShip.baseDamageMultiplier.toFixed(1)}x`}
              icon="⚔️"
              tooltip="Damage multiplier applied to all weapons. Higher = faster kills."
            />
          </div>

          {/* Unique Traits */}
          {selectedShip.traits && selectedShip.traits.length > 0 && (
            <>
              <div className="border-t border-game-border/20 mb-3" />
              <p className="text-game-text-muted text-[10px] tracking-widest uppercase mb-2">Traits</p>
              <div className="space-y-1.5 mb-4">
                {selectedShip.traits.map(traitId => {
                  const info = TRAIT_INFO[traitId]
                  if (!info) return null
                  return (
                    <div key={traitId} className="flex items-center gap-1.5 text-sm text-game-text" title={info.description}>
                      <span className="flex-shrink-0">{info.icon}</span>
                      <span>{info.label}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* START button */}
          <button
            onClick={handleStart}
            className="
              w-full py-3 mt-4 text-lg font-bold tracking-widest
              border border-game-accent text-game-text
              bg-game-accent/10 rounded-lg
              hover:bg-game-accent/20 hover:scale-105
              transition-all duration-150 select-none
            "
          >
            START
          </button>
        </div>
      </div>
    </div>
  )
}
