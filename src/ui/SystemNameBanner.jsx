import { useState, useEffect } from 'react'
import useGame from '../stores/useGame.jsx'
import useLevel from '../stores/useLevel.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

export default function SystemNameBanner() {
  const phase = useGame((s) => s.phase)
  const currentSystem = useLevel((s) => s.currentSystem)
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

  const handleAnimationEnd = () => {
    if (phase !== 'systemEntry') {
      setIsVisible(false)
    }
  }

  if (!isVisible) return null

  // Get system name with validation
  const systemName = GAME_CONFIG.SYSTEM_NAMES[currentSystem - 1]
  if (!systemName && import.meta.env.DEV) {
    console.warn(`[SystemNameBanner] No system name configured for system ${currentSystem}. Using fallback.`)
  }
  const displayName = systemName || `SYSTEM ${currentSystem}`

  // Calculate animation duration from config
  const { FADE_IN_DURATION, DISPLAY_DURATION, FADE_OUT_DURATION } = GAME_CONFIG.SYSTEM_BANNER
  const totalDuration = FADE_IN_DURATION + DISPLAY_DURATION + FADE_OUT_DURATION
  const animationDelay = 0.3 // seconds - delay after white flash

  return (
    <div
      className="system-name-banner"
      onAnimationEnd={handleAnimationEnd}
      style={{
        '--animation-duration': `${totalDuration}s`,
        '--animation-delay': `${animationDelay}s`,
      }}
    >
      <div className="system-name-banner-text">
        {displayName} SYSTEM
      </div>
    </div>
  )
}
