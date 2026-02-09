import { useState, useEffect, useCallback, useRef } from 'react'
import useGame from '../stores/useGame.jsx'

const MENU_ITEMS = [
  { id: 'play', label: 'PLAY' },
]

export default function MainMenu() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const playButtonRef = useRef(null)

  // Auto-focus PLAY button on mount for immediate keyboard interaction
  useEffect(() => {
    playButtonRef.current?.focus()
  }, [])

  const handlePlay = useCallback(() => {
    if (fading) return
    setFading(true)
    setTimeout(() => {
      useGame.getState().startGameplay()
    }, 300)
  }, [fading])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (fading) return
      if (e.code === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length)
      } else if (e.code === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % MENU_ITEMS.length)
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        handlePlay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fading, handlePlay])

  return (
    <>
      {/* Fade overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black pointer-events-none transition-opacity duration-300"
        style={{ opacity: fading ? 1 : 0 }}
      />

      {/* Menu overlay */}
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center font-game animate-fade-in">
        {/* Title */}
        <h1 className="text-5xl font-bold tracking-[0.15em] text-game-text mb-16 select-none"
            style={{ textShadow: '0 0 40px rgba(255, 0, 255, 0.3)' }}>
          SPACESHIP
        </h1>

        {/* Menu items */}
        <div className="flex flex-col items-center gap-4">
          {MENU_ITEMS.map((item, i) => (
            <button
              key={item.id}
              ref={i === 0 ? playButtonRef : undefined}
              className={`
                w-48 py-3 text-lg font-semibold tracking-widest
                border rounded transition-all duration-150 select-none
                outline-none cursor-pointer
                ${selectedIndex === i
                  ? 'border-game-accent text-game-text scale-105 bg-game-accent/10'
                  : 'border-game-border text-game-text-muted hover:border-game-accent hover:text-game-text hover:scale-105'
                }
              `}
              onClick={handlePlay}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
