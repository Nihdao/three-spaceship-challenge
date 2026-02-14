import { useEffect, useState, useRef, useCallback } from 'react'

export default function WhiteFlashTransition({ active, onComplete, duration = 200 }) {
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
        animation: `whiteFlash ${duration}ms ease-out forwards`,
      }}
    />
  )
}
