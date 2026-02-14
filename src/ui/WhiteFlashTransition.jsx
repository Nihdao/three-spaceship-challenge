import { useEffect, useState } from 'react'

export default function WhiteFlashTransition({ active, onComplete, duration = 200 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [active, duration, onComplete])

  if (!visible) return null

  return (
    <div
      className="white-flash-overlay"
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
