import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FragmentIcon } from './icons/index.jsx'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useLevel from '../stores/useLevel.jsx'
import { playSFX } from '../audio/audioManager.js'
import { saveGameState } from '../utils/saveGame.js'
import { DILEMMAS } from '../entities/dilemmaDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

// ─── styles ─────────────────────────────────────────────────────────────────

const S = {
  panel: {
    background: 'var(--rs-bg-surface)',
    borderLeft: '1px solid var(--rs-border)',
  },
  title: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: 'clamp(18px, 2vw, 28px)',
    letterSpacing: '0.2em',
    color: 'var(--rs-text)',
    margin: 0,
    lineHeight: 1,
    textAlign: 'center',
    userSelect: 'none',
  },
  titleAccent: {
    width: '32px',
    height: '2px',
    background: 'var(--rs-orange)',
    margin: '6px auto 8px',
  },
  systemLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    color: 'var(--rs-text-muted)',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
    userSelect: 'none',
  },
  fragLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    color: 'var(--rs-text-muted)',
    textTransform: 'uppercase',
  },
  dilemmaCard: {
    border: '1px solid var(--rs-border-hot)',
    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
    padding: 12,
    background: 'rgba(255,79,31,0.05)',
  },
  emptyCard: {
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    padding: '12px',
    fontFamily: "'Space Mono', monospace",
    color: 'var(--rs-text-muted)',
    fontSize: '0.75rem',
    textAlign: 'center',
    userSelect: 'none',
  },
  btnBase: {
    background: 'transparent',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 150ms, color 150ms, transform 150ms',
    userSelect: 'none',
  },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const WarningIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
    style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }}>
    <path d="M6 1.5L11 10.5H1L6 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
  </svg>
)

// ─── exports ─────────────────────────────────────────────────────────────────

export function computeCanEnterSystem(currentDilemma, dilemmaResolved) {
  return !currentDilemma || dilemmaResolved
}

export default function TunnelHub() {
  const fragments = usePlayer((s) => s.fragments)
  const acceptedDilemmas = usePlayer((s) => s.acceptedDilemmas)
  const currentSystem = useLevel((s) => s.currentSystem)
  const fadingRef = useRef(false)
  const timersRef = useRef([])

  // Track dilemma resolution animation
  const [dilemmaResolved, setDilemmaResolved] = useState(false)

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  // Select a stable random dilemma for this tunnel visit
  const currentDilemma = useMemo(() => {
    const available = Object.values(DILEMMAS).filter(
      (d) => !acceptedDilemmas.includes(d.id)
    )
    if (available.length === 0) return null
    return available[Math.floor(Math.random() * available.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentionally stable per mount — new dilemma each tunnel visit

  // Auto-save on tunnel entry
  useEffect(() => {
    saveGameState()
  }, [])

  const safeTimeout = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter(t => t !== id)
      fn()
    }, ms)
    timersRef.current.push(id)
    return id
  }, [])

  const handleAcceptDilemma = useCallback((dilemmaId) => {
    const success = usePlayer.getState().acceptDilemma(dilemmaId)
    if (success) {
      playSFX('dilemma-accept')
      setDilemmaResolved(true)
    }
  }, [])

  const handleRefuseDilemma = useCallback(() => {
    playSFX('dilemma-refuse')
    setDilemmaResolved(true)
  }, [])

  const canEnterSystem = computeCanEnterSystem(currentDilemma, dilemmaResolved)

  const [exitAnimationActive, setExitAnimationActive] = useState(false)

  const executeSystemTransition = useCallback(() => {
    if (!fadingRef.current) return // Guard against double call
    fadingRef.current = false
    try {
      useLevel.getState().advanceSystem()
      usePlayer.getState().resetForNewSystem()
      setExitAnimationActive(false)
      useGame.getState().startSystemEntry()
    } catch (err) {
      console.error('Tunnel exit transition failed:', err)
      setExitAnimationActive(false)
      try {
        useGame.getState().startSystemEntry()
      } catch (fallbackErr) {
        console.error('Tunnel exit fallback also failed:', fallbackErr)
      }
    }
  }, [])

  const handleEnterSystem = useCallback(() => {
    if (fadingRef.current) return
    fadingRef.current = true
    playSFX('button-click')
    playSFX('tunnel-exit')
    setExitAnimationActive(true)
    // Fallback timeout in case CSS animationend doesn't fire
    safeTimeout(() => {
      if (fadingRef.current) {
        executeSystemTransition()
      }
    }, GAME_CONFIG.TUNNEL_EXIT_ANIMATION_DURATION * 1000 + 200)
  }, [safeTimeout, executeSystemTransition])

  const handleExitAnimationEnd = useCallback(() => {
    if (!exitAnimationActive) return
    executeSystemTransition()
  }, [exitAnimationActive, executeSystemTransition])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (fadingRef.current) return
      // Y/A for accept dilemma
      if ((e.key === 'y' || e.key === 'Y' || e.key === 'a' || e.key === 'A') && currentDilemma && !dilemmaResolved) {
        handleAcceptDilemma(currentDilemma.id)
        return
      }
      // N/R for refuse dilemma
      if ((e.key === 'n' || e.key === 'N' || e.key === 'r' || e.key === 'R') && currentDilemma && !dilemmaResolved) {
        handleRefuseDilemma()
        return
      }
      // Enter for enter system (blocked when dilemma unresolved)
      if (e.key === 'Enter' && canEnterSystem) {
        handleEnterSystem()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentDilemma, dilemmaResolved, handleAcceptDilemma, handleRefuseDilemma, handleEnterSystem])

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex animate-fade-in${exitAnimationActive ? ' tunnel-exit-fade' : ''}`}
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
        onAnimationEnd={exitAnimationActive ? handleExitAnimationEnd : undefined}
      >
        {/* Left — transparent for 3D */}
        <div className="w-2/3" />

        {/* Right — Redshift panel */}
        <div className="w-1/3 flex flex-col p-5 overflow-y-auto" style={S.panel}>

          {/* Header */}
          <h1 style={S.title}>WORMHOLE TUNNEL</h1>
          <div style={S.titleAccent} />

          {/* System info */}
          <div style={S.systemLabel}>
            ENTERING SYSTEM {currentSystem + 1}
          </div>

          {/* Fragment display */}
          <div
            className="flex items-center justify-center gap-2 mb-4 select-none"
            style={{ fontSize: 'clamp(16px, 1.8vw, 24px)' }}
          >
            <FragmentIcon size={14} color="var(--rs-violet)" />
            <span className="tabular-nums" style={{ color: 'var(--rs-text)', fontWeight: 600 }}>{fragments}</span>
            <span style={S.fragLabel}>FRAGMENTS</span>
          </div>

          {/* Spacer top — pushes dilemma to vertical center */}
          <div className="flex-1" />

          {/* Dilemma section — centered */}
          <div role="region" aria-label="Dilemma">
            <h2
              className="mb-2 select-none text-center"
              style={{ color: 'var(--rs-orange)', fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.3em' }}
            >
              <WarningIcon /> DILEMMA
            </h2>
            {!currentDilemma || dilemmaResolved ? (
              <div style={S.emptyCard}>
                {dilemmaResolved ? 'Dilemma resolved' : 'No dilemma available'}
              </div>
            ) : (
              <div style={S.dilemmaCard}>
                <div className="text-sm font-bold mb-1.5 select-none text-center" style={{ color: 'var(--rs-text)' }}>{currentDilemma.name}</div>
                <div className="text-xs text-center mb-2.5 select-none leading-relaxed" style={{ color: 'var(--rs-text)' }}>
                  {currentDilemma.description}
                </div>
                <div className="flex gap-2">
                  {/* Accept button */}
                  <button
                    className="flex-1 py-1.5 text-xs font-semibold tracking-wider select-none"
                    style={{
                      ...S.btnBase,
                      border: '1px solid var(--rs-success)',
                      color: 'var(--rs-success)',
                    }}
                    onClick={() => handleAcceptDilemma(currentDilemma.id)}
                    onMouseEnter={(e) => {
                      playSFX('button-hover')
                      e.currentTarget.style.borderColor = 'var(--rs-success)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--rs-success)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    [Y] Accept
                  </button>
                  {/* Refuse button */}
                  <button
                    className="flex-1 py-1.5 text-xs font-semibold tracking-wider select-none"
                    style={{
                      ...S.btnBase,
                      border: '1px solid var(--rs-danger)',
                      color: 'var(--rs-danger)',
                    }}
                    onClick={handleRefuseDilemma}
                    onMouseEnter={(e) => {
                      playSFX('button-hover')
                      e.currentTarget.style.borderColor = 'var(--rs-danger)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--rs-danger)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    [N] Refuse
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Spacer bottom */}
          <div className="flex-1" />

          {/* Enter System button */}
          <div>
            <button
              className="w-full select-none"
              style={{
                ...S.btnBase,
                padding: '12px 0',
                fontFamily: "'Space Mono', monospace",
                fontSize: 'clamp(12px, 1.5vw, 16px)',
                letterSpacing: '0.2em',
                border: canEnterSystem ? '1px solid var(--rs-teal)' : '1px solid var(--rs-border)',
                color: canEnterSystem ? 'var(--rs-teal)' : 'var(--rs-text-muted)',
                opacity: canEnterSystem ? 1 : 0.5,
                cursor: canEnterSystem ? 'pointer' : 'not-allowed',
              }}
              onClick={handleEnterSystem}
              onMouseEnter={(e) => {
                if (!canEnterSystem) return
                playSFX('button-hover')
                e.currentTarget.style.borderColor = 'var(--rs-teal)'
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseLeave={(e) => {
                if (!canEnterSystem) return
                e.currentTarget.style.borderColor = 'var(--rs-teal)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
              disabled={!canEnterSystem}
            >
              ENTER SYSTEM &rarr;
            </button>
            {!canEnterSystem && (
              <p className="text-xs text-center mt-1.5 select-none" style={{ color: 'var(--rs-text-muted)' }}>
                Resolve the dilemma first
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
