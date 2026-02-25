import { useState, useEffect } from 'react'
import useGame from '../stores/useGame.jsx'
import useLevel from '../stores/useLevel.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { getGalaxyById } from '../entities/galaxyDefs.js'

export default function SystemNameBanner() {
  const phase = useGame((s) => s.phase)
  const currentSystem = useLevel((s) => s.currentSystem)
  const currentSystemName = useLevel((s) => s.currentSystemName)
  const selectedGalaxyId = useGame((s) => s.selectedGalaxyId) // Story 25.3
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (phase === 'systemEntry') {
      setIsVisible(true)
    }
  }, [phase])

  // Cleanup: reset visibility on unmount to prevent memory leak
  useEffect(() => {
    return () => setIsVisible(false)
  }, [])

  const handleAnimationEnd = (event) => {
    // Filter to only the container's own animation to avoid premature hide
    // caused by subtitleFadeIn's animationend event bubbling up from the child div
    if (event.animationName === 'systemBanner' && phase !== 'systemEntry') {
      setIsVisible(false)
    }
  }

  if (!isVisible) return null

  const rawSystemName = currentSystemName || `SYSTEM ${currentSystem}`

  // Story 25.3: Galaxy info for subtitle display
  const galaxy = selectedGalaxyId ? getGalaxyById(selectedGalaxyId) : null
  const galaxyName = galaxy ? galaxy.name.toUpperCase() : null

  // Calculate animation durations from config
  const { FADE_IN_DURATION, DISPLAY_DURATION, FADE_OUT_DURATION } = GAME_CONFIG.SYSTEM_BANNER
  const totalDuration = FADE_IN_DURATION + DISPLAY_DURATION + FADE_OUT_DURATION
  const animationDelay = 0.3 // seconds - delay after white flash
  const subtitleDelay = animationDelay + FADE_IN_DURATION + 0.2 // 0.3 + 0.3 + 0.2 = 0.8s

  return (
    <div
      className="system-name-banner"
      onAnimationEnd={handleAnimationEnd}
      style={{
        '--animation-duration': `${totalDuration}s`,
        '--animation-delay': `${animationDelay}s`,
        '--subtitle-delay': `${subtitleDelay}s`,
      }}
    >
      <div className="system-name-banner-text">
        {rawSystemName}
      </div>
      {galaxyName && (
        <div className="system-name-banner-subtitle">
          {galaxy.name}
        </div>
      )}
    </div>
  )
}
