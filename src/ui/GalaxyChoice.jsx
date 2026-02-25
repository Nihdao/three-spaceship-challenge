import { useEffect } from 'react'
import useGame from '../stores/useGame.jsx'
import { getAvailableGalaxies, getGalaxyById } from '../entities/galaxyDefs.js'
import { playSFX } from '../audio/audioManager.js'

// ─── styles ───────────────────────────────────────────────────────────────
const S = {
  backBtn: {
    padding: '8px 16px',
    background: 'rgba(13, 11, 20, 0.82)',
    border: '1px solid var(--rs-border-hot)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    color: 'var(--rs-text)',
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'border-color 150ms, color 150ms, transform 150ms',
    outline: 'none',
    userSelect: 'none',
  },
  title: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '2.5rem',
    letterSpacing: '0.15em',
    color: 'var(--rs-text)',
    margin: 0,
    lineHeight: 1,
    userSelect: 'none',
  },
  titleAccent: {
    width: '32px',
    height: '2px',
    background: 'var(--rs-orange)',
    marginTop: '6px',
  },
  galaxyCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'var(--rs-bg-raised)',
    border: '1px solid var(--rs-border)',
    borderLeft: '3px solid transparent',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    cursor: 'pointer',
    transition: 'border-color 150ms, transform 150ms',
    outline: 'none',
    userSelect: 'none',
    width: '100%',
    textAlign: 'left',
  },
  galaxyCardSelected: {
    borderColor: 'var(--rs-orange)',
    background: 'rgba(255,79,31,0.06)',
  },
  detailPanel: {
    flex: 1,
    background: 'var(--rs-bg-surface)',
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  galaxyNameLabel: {
    fontSize: '1.5rem',
    fontFamily: 'Bebas Neue, sans-serif',
    letterSpacing: '0.1em',
    lineHeight: 1,
  },
  systemsBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    padding: '2px 8px',
    clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
    userSelect: 'none',
  },
  separator: {
    borderTop: '1px solid var(--rs-border)',
    marginBottom: '16px',
  },
  travelBtn: {
    width: '100%',
    padding: '12px 0',
    background: 'transparent',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '1.5rem',
    letterSpacing: '0.15em',
    cursor: 'pointer',
    transition: 'border-color 150ms, background 150ms, transform 150ms',
    outline: 'none',
    userSelect: 'none',
  },
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      {/* BACK button */}
      <button
        onClick={handleBack}
        style={S.backBtn}
        className="absolute top-8 left-8"
        onMouseEnter={(e) => {
          playSFX('button-hover')
          e.currentTarget.style.borderColor = 'var(--rs-orange)'
          e.currentTarget.style.color = 'var(--rs-text)'
          e.currentTarget.style.transform = 'translateX(4px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--rs-border-hot)'
          e.currentTarget.style.color = 'var(--rs-text)'
          e.currentTarget.style.transform = 'translateX(0)'
        }}
      >
        &larr; BACK
      </button>

      <div className="flex gap-6 w-full h-full max-w-5xl p-8 pt-20">

        {/* LEFT: Galaxy List */}
        <div className="w-72 flex flex-col">
          <div style={{ marginBottom: '16px' }}>
            <h2 style={S.title}>SELECT GALAXY</h2>
            <div style={S.titleAccent} />
          </div>

          <div className="flex flex-col gap-2">
            {availableGalaxies.map((galaxy) => {
              const isSelected = galaxy.id === selectedGalaxyId
              return (
                <button
                  key={galaxy.id}
                  onClick={() => handleSelectGalaxy(galaxy)}
                  style={{
                    ...S.galaxyCard,
                    ...(isSelected ? S.galaxyCardSelected : {}),
                    borderLeft: `3px solid ${galaxy.colorTheme}`,
                  }}
                  onMouseEnter={(e) => {
                    playSFX('button-hover')
                    e.currentTarget.style.borderTopColor = 'var(--rs-orange)'
                    e.currentTarget.style.borderRightColor = 'var(--rs-orange)'
                    e.currentTarget.style.borderBottomColor = 'var(--rs-orange)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    const borderVal = isSelected ? 'var(--rs-orange)' : 'var(--rs-border)'
                    e.currentTarget.style.borderTopColor = borderVal
                    e.currentTarget.style.borderRightColor = borderVal
                    e.currentTarget.style.borderBottomColor = borderVal
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold tracking-wide"
                      style={{ color: isSelected ? galaxy.colorTheme : 'var(--rs-text)' }}
                    >
                      {galaxy.name}
                    </p>
                    <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--rs-text-muted)' }}>
                      {galaxy.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT: Galaxy Detail Panel */}
        <div style={S.detailPanel} className="flex-1 flex flex-col">
          {/* Galaxy Name */}
          <div className="flex items-baseline justify-between mb-2">
            <h3 style={{ ...S.galaxyNameLabel, color: selectedGalaxy.colorTheme }}>
              {selectedGalaxy.name.toUpperCase()}
            </h3>
            <span
              style={{
                ...S.systemsBadge,
                color: selectedGalaxy.colorTheme,
                border: `1px solid ${selectedGalaxy.colorTheme}50`,
                backgroundColor: `${selectedGalaxy.colorTheme}15`,
              }}
            >
              {selectedGalaxy.systemCount} SYSTEMS
            </span>
          </div>

          {/* Description */}
          <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--rs-text-muted)' }}>
            {selectedGalaxy.description}
          </p>

          {/* Separator */}
          <div style={S.separator} />

          {/* Spacer */}
          <div className="flex-1" />

          {/* TRAVEL Button */}
          <button
            onClick={handleStart}
            style={{
              ...S.travelBtn,
              color: selectedGalaxy.colorTheme,
              border: `1px solid ${selectedGalaxy.colorTheme}`,
              backgroundColor: `${selectedGalaxy.colorTheme}15`,
            }}
            onMouseEnter={(e) => {
              playSFX('button-hover')
              e.currentTarget.style.transform = 'translateX(4px)'
              e.currentTarget.style.backgroundColor = `${selectedGalaxy.colorTheme}25`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)'
              e.currentTarget.style.backgroundColor = `${selectedGalaxy.colorTheme}15`
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
