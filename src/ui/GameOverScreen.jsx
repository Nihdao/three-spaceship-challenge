import { useState, useEffect, useCallback, useRef } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'
import useLevel from '../stores/useLevel.jsx'
import useGlobalStats from '../stores/useGlobalStats.jsx'
import { playSFX } from '../audio/audioManager.js'
import { WEAPONS } from '../entities/weaponDefs.js'
import { formatTimer } from './HUD.jsx'
import StatLine from './primitives/StatLine.jsx'

const TAUNT_MESSAGES = [
  'THE GALAXY IS TOO BIG FOR YOU',
  'SPACE DOESN\'T FORGIVE',
  'THE VOID CLAIMS ANOTHER',
  'LOST IN THE DARK',
  'NOT FAST ENOUGH',
  'THE STARS FORGET YOU',
  'SKILL ISSUE',
  'BETTER LUCK NEXT TIME, PILOT',
]

export { TAUNT_MESSAGES }

const S = {
  mainTitle: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: 'clamp(3rem, 8vw, 5rem)',
    letterSpacing: '0.15em',
    color: 'var(--rs-text)',
    textAlign: 'center',
    margin: 0,
    lineHeight: 1,
    userSelect: 'none',
  },
  highScoreLabel: {
    color: 'var(--rs-gold)',
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: 'clamp(1rem, 2vw, 1.75rem)',
    letterSpacing: '0.2em',
    userSelect: 'none',
    marginTop: '24px',
  },
  actionBtn: {
    padding: '12px 24px',
    background: 'transparent',
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    color: 'var(--rs-text-muted)',
    fontFamily: "'Space Mono', monospace",
    fontSize: 'clamp(12px, 1.3vw, 16px)',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'border-color 150ms, color 150ms, transform 150ms',
    outline: 'none',
    userSelect: 'none',
  },
}

export default function GameOverScreen() {
  // stage: 0=flash, 1=fadeToBlack, 2=blackScreen, 3=tauntVisible, 4=statsVisible, 5=actionsVisible
  const [stage, setStage] = useState(0)
  const [fading, setFading] = useState(false)
  const fadingRef = useRef(false)

  // Capture stats on mount so they survive store resets
  const statsRef = useRef(null)
  if (!statsRef.current) {
    const totalTime = useGame.getState().totalElapsedTime + useGame.getState().systemTimer
    statsRef.current = {
      systemTimer: totalTime,
      kills: useGame.getState().kills,
      score: useGame.getState().score,
      isNewHighScore: useGame.getState().isNewHighScore,
      currentLevel: usePlayer.getState().currentLevel,
      currentSystem: useLevel.getState().currentSystem,
      fragmentsEarned: usePlayer.getState().fragmentsEarnedThisRun,
      activeWeapons: [...useWeapons.getState().activeWeapons],
      activeBoons: [...useBoons.getState().activeBoons],
    }
  }

  // Record run stats for career tracking (Story 25.5) — in useEffect to avoid render-phase side effects
  useEffect(() => {
    const s = statsRef.current
    useGlobalStats.getState().recordRunEnd({
      kills: s.kills,
      timeSurvived: s.systemTimer,
      systemsReached: s.currentSystem,
      level: s.currentLevel,
      fragments: s.fragmentsEarned,
      weaponsUsed: s.activeWeapons.map(w => w.weaponId).filter(Boolean),
      boonsUsed: s.activeBoons.map(b => b.boonId).filter(Boolean),
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Random taunt message selected on mount
  const tauntRef = useRef(
    TAUNT_MESSAGES[Math.floor(Math.random() * TAUNT_MESSAGES.length)]
  )

  // Cinematic sequence timing
  useEffect(() => {
    const timers = []
    timers.push(setTimeout(() => setStage(1), 100))   // End flash
    timers.push(setTimeout(() => setStage(2), 400))   // Fully black
    timers.push(setTimeout(() => setStage(3), 900))   // Show taunt
    timers.push(setTimeout(() => setStage(4), 1100))  // Show stats
    timers.push(setTimeout(() => setStage(5), 1300))  // Show actions
    // Play celebration SFX when new high score and stats become visible
    if (statsRef.current.isNewHighScore) {
      timers.push(setTimeout(() => playSFX('high-score'), 1100))
    }
    return () => timers.forEach(clearTimeout)
  }, [])

  // Action handlers with fade-out (ref guard prevents double-trigger from rapid keypresses)
  const handleRetry = useCallback(() => {
    if (fadingRef.current) return
    playSFX('button-click')
    fadingRef.current = true
    setFading(true)
    setTimeout(() => useGame.getState().startGameplay(), 300)
  }, [])

  const handleMenu = useCallback(() => {
    if (fadingRef.current) return
    playSFX('button-click')
    fadingRef.current = true
    setFading(true)
    setTimeout(() => useGame.getState().returnToMenu(), 300)
  }, [])

  // Keyboard handling — only after actions visible
  useEffect(() => {
    if (stage < 5) return
    const handler = (e) => {
      if (e.code === 'KeyR') handleRetry()
      if (e.code === 'KeyM') handleMenu()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [stage, handleRetry, handleMenu])

  // Stats computation
  const stats = statsRef.current
  const timeSurvived = formatTimer(stats.systemTimer)
  const weaponNames = stats.activeWeapons
    .map(w => WEAPONS[w.weaponId]?.name || w.weaponId)
    .join(', ')

  return (
    <>
      {/* White flash overlay — stage 0 */}
      <div
        className="fixed inset-0 z-50 bg-white pointer-events-none transition-opacity"
        style={{
          opacity: stage === 0 ? 0.5 : 0,
          transitionDuration: '100ms',
        }}
      />

      {/* Fade to black overlay — stage 1+ */}
      <div
        className="fixed inset-0 z-50 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundColor: 'var(--rs-bg)',
          opacity: stage >= 1 ? 1 : 0,
        }}
      />

      {/* Fade overlay for action transitions */}
      <div
        className="fixed inset-0 z-[60] bg-black pointer-events-none transition-opacity duration-300"
        style={{ opacity: fading ? 1 : 0 }}
      />

      {/* Content overlay */}
      <div className="fixed inset-0 z-[51] flex flex-col items-center justify-center pointer-events-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        {/* Taunt message */}
        {stage >= 3 && (
          <h1
            className="animate-fade-in"
            style={S.mainTitle}
          >
            {tauntRef.current}
          </h1>
        )}

        {/* New high score celebration */}
        {stage >= 4 && stats.isNewHighScore && (
          <p
            className="animate-pulse"
            style={S.highScoreLabel}
          >
            NEW HIGH SCORE!
          </p>
        )}

        {/* Stats + Actions panel */}
        {stage >= 4 && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: 16,
              background: 'var(--rs-bg-surface)',
              border: '1px solid var(--rs-border)',
              clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
              padding: 24,
              maxWidth: 'clamp(320px, 40vw, 480px)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {/* Stats section */}
            <div className="w-full animate-slide-up">
              <div className="flex flex-col gap-2">
                <StatLine label="SCORE" value={stats.score.toLocaleString()} />
                <StatLine label="SYSTEM REACHED" value={`System ${stats.currentSystem}`} />
                <StatLine label="TIME SURVIVED" value={timeSurvived} />
                <StatLine label="ENEMIES KILLED" value={stats.kills} />
                <StatLine label="LEVEL REACHED" value={stats.currentLevel} />
                <StatLine label="WEAPONS" value={weaponNames || 'None'} />
              </div>
            </div>

            {/* Action buttons */}
            {stage >= 5 && (
              <div className="flex gap-6 animate-fade-in pointer-events-auto">
                <button
                  type="button"
                  style={S.actionBtn}
                  onClick={handleRetry}
                  onMouseEnter={(e) => {
                    playSFX('button-hover')
                    e.currentTarget.style.borderColor = 'var(--rs-orange)'
                    e.currentTarget.style.color = 'var(--rs-text)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--rs-border)'
                    e.currentTarget.style.color = 'var(--rs-text-muted)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  [R] RETRY
                </button>
                <button
                  type="button"
                  style={S.actionBtn}
                  onClick={handleMenu}
                  onMouseEnter={(e) => {
                    playSFX('button-hover')
                    e.currentTarget.style.borderColor = 'var(--rs-orange)'
                    e.currentTarget.style.color = 'var(--rs-text)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--rs-border)'
                    e.currentTarget.style.color = 'var(--rs-text-muted)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  [M] MENU
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
