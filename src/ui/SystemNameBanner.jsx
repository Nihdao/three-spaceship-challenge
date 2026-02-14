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

  const handleAnimationEnd = () => {
    if (phase !== 'systemEntry') {
      setIsVisible(false)
    }
  }

  if (!isVisible) return null

  const systemName = GAME_CONFIG.SYSTEM_NAMES[currentSystem - 1] || `SYSTEM ${currentSystem}`

  return (
    <div className="system-name-banner" onAnimationEnd={handleAnimationEnd}>
      <div className="system-name-banner-text">
        {systemName} SYSTEM
      </div>
    </div>
  )
}
