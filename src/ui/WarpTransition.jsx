import { useEffect, useState, useCallback } from 'react'

/**
 * Story 17.6: Warp transition for boss→tunnel.
 * White opaque background with subtle vortex overlay, then ultra-fast fade out.
 */
export default function WarpTransition({ active, onComplete, duration = 1800 }) {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState('idle') // 'idle' | 'hold' | 'fadeOut'

  const handleComplete = useCallback(() => {
    setPhase('idle')
    setVisible(false)
    onComplete?.()
  }, [onComplete])

  useEffect(() => {
    if (!active) {
      setPhase('idle')
      setVisible(false)
      return
    }

    setVisible(true)
    setPhase('hold')

    // Stay fully opaque for 80% of duration, then ultra-fast fade out
    const fadeOutDelay = duration * 0.80

    const fadeTimer = setTimeout(() => {
      setPhase('fadeOut')
    }, fadeOutDelay)

    const completeTimer = setTimeout(() => {
      handleComplete()
    }, duration)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [active, duration, handleComplete])

  if (!visible) return null

  const fadeOutDuration = duration * 0.20

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'none',
        opacity: phase === 'fadeOut' ? 0 : 1,
        transition: phase === 'fadeOut' ? `opacity ${fadeOutDuration}ms ease-out` : 'none',
      }}
    >
      {/* Fully opaque white background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#ffffff',
        }}
      />

      {/* Subtle vortex overlay */}
      <div
        style={{
          position: 'absolute',
          inset: '-50%',
          background: `conic-gradient(
            from 0deg at 50% 50%,
            rgba(200, 180, 255, 0) 0deg,
            rgba(200, 180, 255, 0.12) 30deg,
            rgba(200, 180, 255, 0) 60deg,
            rgba(180, 200, 255, 0.08) 120deg,
            rgba(200, 180, 255, 0) 150deg,
            rgba(220, 190, 255, 0.12) 210deg,
            rgba(200, 180, 255, 0) 240deg,
            rgba(180, 200, 255, 0.08) 300deg,
            rgba(200, 180, 255, 0) 330deg,
            rgba(200, 180, 255, 0.12) 360deg
          )`,
          animation: 'warpSpin 1.2s linear infinite',
        }}
      />
    </div>
  )
}
