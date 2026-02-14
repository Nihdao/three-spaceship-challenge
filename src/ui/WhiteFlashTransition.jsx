import { useEffect, useState, useRef, useCallback } from 'react'

export default function WhiteFlashTransition({ active, onComplete, duration = 200, variant = 'default' }) {
  const [visible, setVisible] = useState(false)
  const divRef = useRef(null)

  const handleAnimationEnd = useCallback(() => {
    setVisible(false)
    onComplete?.()
  }, [onComplete])

  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }
    setVisible(true)
  }, [active])

  if (!visible) return null

  // Story 17.6: Choose animation based on variant
  const animationName = variant === 'fadeOut' ? 'whiteFlashFadeOut' : 'whiteFlash'

  return (
    <div
      ref={divRef}
      className="white-flash-overlay"
      onAnimationEnd={handleAnimationEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'white',
        pointerEvents: 'none',
        animation: `${animationName} ${duration}ms ease-out forwards`,
      }}
    />
  )
}
