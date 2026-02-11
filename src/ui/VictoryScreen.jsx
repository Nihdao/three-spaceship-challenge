import { useState, useEffect, useCallback, useRef } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'
import useLevel from '../stores/useLevel.jsx'
import { playSFX } from '../audio/audioManager.js'
import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'
import { formatTimer } from './HUD.jsx'
import StatLine from './primitives/StatLine.jsx'

const VICTORY_MESSAGES = [
  'THE GALAXY IS YOURS',
  'SYSTEM CLEARED',
  'VICTORIOUS',
  'THE VOID BOWS TO YOU',
  'MISSION COMPLETE',
  'UNSTOPPABLE',
]

export { VICTORY_MESSAGES }

export function resolveWeaponNames(activeWeapons) {
  return activeWeapons
    .map(w => WEAPONS[w.weaponId]?.name || w.weaponId)
    .join(', ')
}

export function resolveBoonNames(activeBoons) {
  return activeBoons
    .map(b => {
      const def = BOONS[b.boonId]
      return def ? `${def.name} Lv${b.level}` : b.boonId
    })
    .join(', ')
}

export default function VictoryScreen() {
  // stage: 0=dark, 1=titleVisible, 2=statsVisible, 3=actionsVisible
  const [stage, setStage] = useState(0)
  const [fading, setFading] = useState(false)
  const fadingRef = useRef(false)

  // Capture stats on mount so they survive store resets
  const statsRef = useRef(null)
  if (!statsRef.current) {
    statsRef.current = {
      systemTimer: useGame.getState().totalElapsedTime + useGame.getState().systemTimer,
      kills: useGame.getState().kills,
      score: useGame.getState().score,
      isNewHighScore: useGame.getState().isNewHighScore,
      currentLevel: usePlayer.getState().currentLevel,
      currentSystem: useLevel.getState().currentSystem,
      fragments: usePlayer.getState().fragments,
      activeWeapons: [...useWeapons.getState().activeWeapons],
      activeBoons: [...useBoons.getState().activeBoons],
    }
  }

  // Random victory message selected on mount
  const messageRef = useRef(
    VICTORY_MESSAGES[Math.floor(Math.random() * VICTORY_MESSAGES.length)]
  )

  // Staged animation timing
  useEffect(() => {
    const timers = []
    timers.push(setTimeout(() => setStage(1), 300))   // Show title
    timers.push(setTimeout(() => setStage(2), 600))   // Show stats
    timers.push(setTimeout(() => setStage(3), 800))   // Show actions
    if (statsRef.current.isNewHighScore) {
      timers.push(setTimeout(() => playSFX('high-score'), 600))
    }
    return () => timers.forEach(clearTimeout)
  }, [])

  // Action handlers with fade-out (ref guard prevents double-trigger)
  const handleNewRun = useCallback(() => {
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
    if (stage < 3) return
    const handler = (e) => {
      if (e.code === 'KeyR') handleNewRun()
      if (e.code === 'KeyM') handleMenu()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [stage, handleNewRun, handleMenu])

  // Stats computation
  const stats = statsRef.current
  const timeSurvived = formatTimer(stats.systemTimer)
  const weaponNames = resolveWeaponNames(stats.activeWeapons)
  const boonNames = resolveBoonNames(stats.activeBoons)

  return (
    <>
      {/* Dark overlay background */}
      <div
        className="fixed inset-0 z-50 bg-black pointer-events-none"
        style={{ opacity: 0.9 }}
      />

      {/* Fade overlay for action transitions */}
      <div
        className="fixed inset-0 z-[60] bg-black pointer-events-none transition-opacity duration-300"
        style={{ opacity: fading ? 1 : 0 }}
      />

      {/* Content overlay */}
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center font-game pointer-events-none">
        {/* Victory title */}
        {stage >= 1 && (
          <h1
            className="text-game-text text-center font-bold select-none animate-fade-in"
            style={{
              fontSize: 'clamp(28px, 4vw, 56px)',
              letterSpacing: '0.2em',
            }}
          >
            {messageRef.current}
          </h1>
        )}

        {/* New high score celebration */}
        {stage >= 2 && stats.isNewHighScore && (
          <p
            className="mt-6 text-game-accent font-bold tracking-[0.2em] select-none animate-pulse"
            style={{ fontSize: 'clamp(16px, 2vw, 28px)' }}
          >
            NEW HIGH SCORE!
          </p>
        )}

        {/* Stats section */}
        {stage >= 2 && (
          <div
            className="mt-10 w-full animate-slide-up"
            style={{ maxWidth: 'clamp(260px, 30vw, 400px)' }}
          >
            <div className="flex flex-col gap-2">
              <StatLine label="SCORE" value={stats.score.toLocaleString()} />
              <StatLine label="SYSTEMS CLEARED" value={stats.currentSystem} />
              <StatLine label="TIME SURVIVED" value={timeSurvived} />
              <StatLine label="ENEMIES KILLED" value={stats.kills} />
              <StatLine label="LEVEL REACHED" value={stats.currentLevel} />
              <StatLine label="WEAPONS" value={weaponNames || 'None'} />
              <StatLine label="BOONS" value={boonNames || 'None'} />
            </div>
          </div>
        )}

        {/* Action buttons */}
        {stage >= 3 && (
          <div className="mt-10 flex gap-6 animate-fade-in pointer-events-auto">
            <button
              className="px-6 py-3 font-semibold tracking-widest border border-game-border rounded
                transition-all duration-150 select-none cursor-pointer outline-none
                text-game-text hover:border-game-accent hover:scale-105 hover:bg-game-accent/10"
              style={{ fontSize: 'clamp(13px, 1.3vw, 18px)' }}
              onClick={handleNewRun}
              onMouseEnter={() => playSFX('button-hover')}
            >
              [R] NEW RUN
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
