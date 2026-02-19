import { useEffect } from 'react'
import useGame from '../stores/useGame.jsx'
import { getAvailableGalaxies, getGalaxyById } from '../entities/galaxyDefs.js'
import { playSFX } from '../audio/audioManager.js'

export default function GalaxyChoice() {
  const selectedGalaxyId = useGame((s) => s.selectedGalaxyId)
  const availableGalaxies = getAvailableGalaxies()
  const selectedGalaxy = getGalaxyById(selectedGalaxyId) || availableGalaxies[0]

  const handleSelectGalaxy = (galaxy) => {
    playSFX('button-hover')
    useGame.getState().setSelectedGalaxy(galaxy.id)
  }

  const handleStart = () => {
    playSFX('button-click')
    useGame.getState().startGameplay()
  }

  const handleBack = () => {
    playSFX('button-click')
    useGame.getState().setPhase('shipSelect')
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        handleBack()
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        handleStart()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!selectedGalaxy) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-game animate-fade-in">
      {/* BACK button */}
      <button
        onClick={handleBack}
        className="absolute top-8 left-8 px-4 py-2 text-sm tracking-widest text-game-text-muted hover:text-game-text transition-colors select-none"
      >
        &larr; BACK
      </button>

      <div className="flex gap-6 w-full h-full max-w-5xl p-8 pt-20">

        {/* LEFT: Galaxy List */}
        <div className="w-72 flex flex-col">
          <h2
            className="text-xl font-bold tracking-[0.15em] text-game-text mb-4 select-none"
            style={{ textShadow: '0 0 20px rgba(255,0,255,0.3)' }}
          >
            SELECT GALAXY
          </h2>

          <div className="flex flex-col gap-2">
            {availableGalaxies.map((galaxy) => {
              const isSelected = galaxy.id === selectedGalaxyId
              return (
                <button
                  key={galaxy.id}
                  onClick={() => handleSelectGalaxy(galaxy)}
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border text-left transition-all duration-150 select-none cursor-pointer
                    ${isSelected
                      ? 'border-game-accent/70 bg-game-bg/70 ring-1 ring-game-accent/30'
                      : 'border-game-border/40 bg-game-bg/40 hover:border-game-accent/40 hover:bg-game-bg/60'
                    }
                  `}
                  style={isSelected ? { boxShadow: `0 0 16px ${galaxy.colorTheme}30` } : {}}
                >
                  {/* Color accent dot */}
                  <div
                    className="w-2 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: galaxy.colorTheme, boxShadow: `0 0 8px ${galaxy.colorTheme}80` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold tracking-wide"
                      style={{ color: isSelected ? galaxy.colorTheme : 'rgba(255,255,255,0.8)' }}
                    >
                      {galaxy.name}
                    </p>
                    <p className="text-[11px] text-game-text-muted mt-0.5 leading-snug">
                      {galaxy.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT: Galaxy Detail Panel */}
        <div
          className="flex-1 bg-game-bg/60 border border-game-border/40 rounded-lg p-6 flex flex-col backdrop-blur-sm"
          style={{ boxShadow: `0 0 24px ${selectedGalaxy.colorTheme}10` }}
        >
          {/* Galaxy Name */}
          <div className="flex items-baseline justify-between mb-2">
            <h3
              className="text-2xl font-bold tracking-[0.1em]"
              style={{ color: selectedGalaxy.colorTheme, textShadow: `0 0 20px ${selectedGalaxy.colorTheme}50` }}
            >
              {selectedGalaxy.name.toUpperCase()}
            </h3>
            <span
              className="text-xs font-bold tracking-widest px-2 py-0.5 rounded"
              style={{
                color: selectedGalaxy.colorTheme,
                border: `1px solid ${selectedGalaxy.colorTheme}50`,
                backgroundColor: `${selectedGalaxy.colorTheme}15`,
              }}
            >
              {selectedGalaxy.systemCount} SYSTEMS
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-game-text-muted mb-4 leading-relaxed">
            {selectedGalaxy.description}
          </p>

          {/* Separator */}
          <div className="border-t border-game-border/20 mb-4" />

          {/* Spacer */}
          <div className="flex-1" />

          {/* CONFIRM Button */}
          <button
            onClick={handleStart}
            onMouseEnter={() => playSFX('button-hover')}
            className="w-full py-3 text-lg font-bold tracking-[0.15em] rounded-lg transition-all duration-150 select-none border hover:scale-[1.02]"
            style={{
              color: selectedGalaxy.colorTheme,
              borderColor: `${selectedGalaxy.colorTheme}70`,
              backgroundColor: `${selectedGalaxy.colorTheme}15`,
            }}
          >
            TRAVEL
          </button>
        </div>

      </div>
    </div>
  )
}

// Exported for testing — encapsulates the display data logic the component renders
export function getGalaxyCardDisplayData(selectedGalaxyId) {
  const availableGalaxies = getAvailableGalaxies()
  const selectedGalaxy = getGalaxyById(selectedGalaxyId) || availableGalaxies[0] || null
  return { availableGalaxies, selectedGalaxy }
}
