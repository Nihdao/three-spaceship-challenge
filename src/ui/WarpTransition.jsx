import { useEffect, useState, useCallback } from 'react'

/**
 * Story 17.6: Warp/Vortex transition effect for boss→tunnel transition.
 * Lightweight version: single spinning layer, no backdrop-filter blur.
 * Phases: instant appear → hold with spinning vortex → fade out
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

    // Stay fully opaque for 80% of duration, then quick fade out
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

  const fadeOutDuration = duration * 0.20 // Quick fade out

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'none',
        opacity: phase === 'fadeOut' ? 0 : 1,
        transition: phase === 'fadeOut' ? `opacity ${fadeOutDuration}ms ease-in` : 'none',
      }}
    >
      {/* Opaque light backdrop — no blur for performance */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(30, 20, 50, 0.97)',
        }}
      />

      {/* Single spinning vortex layer */}
      <div
        style={{
          position: 'absolute',
          inset: '-50%',
          background: `conic-gradient(
            from 0deg at 50% 50%,
            rgba(30, 20, 50, 0) 0deg,
            rgba(160, 120, 255, 0.25) 30deg,
            rgba(30, 20, 50, 0) 60deg,
            rgba(120, 170, 255, 0.2) 120deg,
            rgba(30, 20, 50, 0) 150deg,
            rgba(200, 150, 255, 0.3) 210deg,
            rgba(30, 20, 50, 0) 240deg,
            rgba(100, 160, 255, 0.2) 300deg,
            rgba(30, 20, 50, 0) 330deg,
            rgba(160, 120, 255, 0.25) 360deg
          )`,
          animation: 'warpSpin 1.2s linear infinite',
        }}
      />

      {/* Radial tunnel effect — lighter center */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(
            ellipse at center,
            rgba(60, 40, 100, 0.6) 0%,
            rgba(40, 25, 80, 0.3) 40%,
            transparent 80%
          )`,
        }}
      />

      {/* Center glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '35vmin',
          height: '35vmin',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(180, 150, 255, 0.4) 0%, transparent 70%)',
          animation: 'warpPulse 0.6s ease-in-out infinite alternate',
        }}
      />
    </div>
  )
}
