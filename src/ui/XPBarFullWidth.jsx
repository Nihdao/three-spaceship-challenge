import { useState, useEffect, useRef } from 'react'
import usePlayer from '../stores/usePlayer.jsx'

// --- Exported logic helpers (testable without DOM) ---

export function calculateXPProgress(currentXP, xpToNextLevel) {
  if (xpToNextLevel <= 0) return 0
  const ratio = currentXP / xpToNextLevel
  return Math.round(Math.min(1, Math.max(0, ratio)) * 100)
}

export function shouldPulseXPBar(progress) {
  return progress > 80
}

// --- XPBarFullWidth Component ---

export default function XPBarFullWidth() {
  const currentXP = usePlayer((s) => s.currentXP)
  const xpToNextLevel = usePlayer((s) => s.xpToNextLevel)
  const currentLevel = usePlayer((s) => s.currentLevel)

  const progress = calculateXPProgress(currentXP, xpToNextLevel)
  const pulse = shouldPulseXPBar(progress)

  // Level-up flash animation
  const [flashing, setFlashing] = useState(false)
  const prevLevelRef = useRef(currentLevel)

  useEffect(() => {
    if (currentLevel > prevLevelRef.current) {
      setFlashing(true)
      const timer = setTimeout(() => setFlashing(false), 300)
      prevLevelRef.current = currentLevel
      return () => clearTimeout(timer)
    }
    prevLevelRef.current = currentLevel
  }, [currentLevel])

  return (
    <div className="fixed top-0 left-0 w-full z-50" style={{ height: '12px' }}>
      {/* Background track */}
      <div className="w-full h-full" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        {/* Fill bar — uses scaleX for GPU-accelerated animation */}
        <div
          className={`h-full origin-left transition-transform duration-300 ease-out${pulse ? ' animate-pulse-glow' : ''}`}
          style={{
            transform: `scaleX(${flashing ? 1 : progress / 100})`,
            background: flashing
              ? 'linear-gradient(90deg, var(--rs-text), var(--rs-violet))'
              : 'linear-gradient(90deg, var(--rs-violet), #7b3fe4)',
            boxShadow: pulse ? '0 0 12px rgba(155, 93, 229, 0.6)' : 'none',
            opacity: flashing ? 0.9 : 1,
          }}
        />
      </div>
    </div>
  )
}
