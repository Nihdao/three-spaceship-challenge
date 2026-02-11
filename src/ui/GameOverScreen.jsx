import { useState, useEffect, useCallback, useRef } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
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

export default function GameOverScreen() {
  // stage: 0=flash, 1=fadeToBlack, 2=blackScreen, 3=tauntVisible, 4=statsVisible, 5=actionsVisible
  const [stage, setStage] = useState(0)
  const [fading, setFading] = useState(false)
  const fadingRef = useRef(false)

  // Capture stats on mount so they survive store resets
  const statsRef = useRef(null)
  if (!statsRef.current) {
    statsRef.current = {
      systemTimer: useGame.getState().systemTimer,
      kills: useGame.getState().kills,
      currentLevel: usePlayer.getState().currentLevel,
      activeWeapons: [...useWeapons.getState().activeWeapons],
    }
  }

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
        className="fixed inset-0 z-50 bg-black pointer-events-none transition-opacity"
        style={{
          opacity: stage >= 1 ? 1 : 0,
          transitionDuration: '300ms',
        }}
      />

      {/* Fade overlay for action transitions */}
      <div
        className="fixed inset-0 z-[60] bg-black pointer-events-none transition-opacity duration-300"
        style={{ opacity: fading ? 1 : 0 }}
      />

      {/* Content overlay */}
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center font-game pointer-events-none">
        {/* Taunt message */}
        {stage >= 3 && (
          <h1
            className="text-game-text text-center font-bold select-none animate-fade-in"
            style={{
              fontSize: 'clamp(24px, 3vw, 48px)',
              letterSpacing: '0.15em',
            }}
          >
            {tauntRef.current}
          </h1>
        )}

        {/* Stats section */}
        {stage >= 4 && (
          <div
            className="mt-10 w-full animate-slide-up"
            style={{ maxWidth: 'clamp(260px, 30vw, 400px)' }}
          >
            <div className="flex flex-col gap-2">
              <StatLine label="TIME SURVIVED" value={timeSurvived} />
              <StatLine label="ENEMIES KILLED" value={stats.kills} />
              <StatLine label="LEVEL REACHED" value={stats.currentLevel} />
              <StatLine label="WEAPONS" value={weaponNames || 'None'} />
            </div>
          </div>
        )}

        {/* Action buttons */}
        {stage >= 5 && (
          <div className="mt-10 flex gap-6 animate-fade-in pointer-events-auto">
            <button
              className="px-6 py-3 font-semibold tracking-widest border border-game-border rounded
                transition-all duration-150 select-none cursor-pointer outline-none
                text-game-text hover:border-game-accent hover:scale-105 hover:bg-game-accent/10"
              style={{ fontSize: 'clamp(13px, 1.3vw, 18px)' }}
              onClick={handleRetry}
              onMouseEnter={() => playSFX('button-hover')}
            >
              [R] RETRY
            </button>
            <button
              className="px-6 py-3 font-semibold tracking-widest border border-game-border rounded
                transition-all duration-150 select-none cursor-pointer outline-none
                text-game-text hover:border-game-accent hover:scale-105 hover:bg-game-accent/10"
              style={{ fontSize: 'clamp(13px, 1.3vw, 18px)' }}
              onClick={handleMenu}
              onMouseEnter={() => playSFX('button-hover')}
            >
              [M] MENU
            </button>
          </div>
        )}
      </div>
    </>
  )
}
