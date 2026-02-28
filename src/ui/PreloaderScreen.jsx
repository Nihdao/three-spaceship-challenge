import { useState, useEffect } from 'react'
import { useProgress } from '@react-three/drei'

const MIN_MS = 900
const MAX_MS = 9000

const MESSAGES = [
  'INITIALIZING NAVIGATION SYSTEMS',
  'LOADING WEAPON ARRAYS',
  'CALIBRATING THRUSTER RESPONSE',
  'SCANNING SECTOR DATA',
  'ENGAGING HYPERDRIVE SEQUENCE',
]

// Assets preloaded outside R3F (fills browser cache before Howler/img tags request them)
const CUSTOM_ASSETS = [
  '/audio/music/mainMenu.mp3',
  '/assets/navi.png',
]

export default function PreloaderScreen() {
  const { active, progress, loaded, total } = useProgress()
  const [minElapsed, setMinElapsed] = useState(false)
  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(true)
  const [msgIdx, setMsgIdx] = useState(0)
  const [customLoaded, setCustomLoaded] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => setMounted(false), 500)
    }, MAX_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 1400)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let alive = true
    CUSTOM_ASSETS.forEach(path => {
      fetch(path)
        .then(() => { if (alive) setCustomLoaded(n => n + 1) })
        .catch(() => { if (alive) setCustomLoaded(n => n + 1) })
    })
    return () => { alive = false }
  }, [])

  const customDone = customLoaded >= CUSTOM_ASSETS.length
  const r3fDone = !active && (progress >= 100 || (total > 0 && loaded >= total))
  const combinedProgress = Math.round((progress + (customLoaded / CUSTOM_ASSETS.length) * 100) / 2)

  useEffect(() => {
    if (!minElapsed || !r3fDone || !customDone) return
    setVisible(false)
    const t = setTimeout(() => setMounted(false), 500)
    return () => clearTimeout(t)
  }, [minElapsed, r3fDone, customDone])

  if (!mounted) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'var(--rs-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: visible ? 1 : 0,
      transition: 'opacity 500ms ease-out',
    }}>
      {/* Progress block */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: 'min(320px, calc(100vw - 48px))' }}>

        {/* Status label + cursor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, height: 18 }}>
          <span style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            color: 'var(--rs-text-muted)',
            textTransform: 'uppercase',
          }}>
            {MESSAGES[msgIdx]}
          </span>
          <span style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.65rem',
            color: 'var(--rs-orange)',
            animation: 'preloaderBlink 700ms step-start infinite',
          }}>_</span>
        </div>

        {/* Track */}
        <div style={{
          width: '100%',
          height: 4,
          background: 'var(--rs-bg-raised)',
          clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
          position: 'relative',
          marginBottom: 8,
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            right: 'auto',
            width: `${Math.max(1, combinedProgress)}%`,
            background: 'var(--rs-orange)',
            clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
            transition: 'width 250ms ease-out',
          }} />
        </div>

        {/* Footer */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.08em',
            color: 'var(--rs-text-dim)',
            textTransform: 'uppercase',
          }}>
            {total > 0 ? `${loaded + customLoaded} / ${total + CUSTOM_ASSETS.length} ASSETS` : 'LOADING\u2026'}
          </span>
          <span style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.2rem',
            letterSpacing: '0.05em',
            color: 'var(--rs-orange)',
          }}>
            {combinedProgress}%
          </span>
        </div>
      </div>

      {/* Version — bottom-right */}
      <span style={{
        position: 'absolute',
        bottom: 20,
        right: 24,
        fontFamily: 'Space Mono, monospace',
        fontSize: '0.55rem',
        letterSpacing: '0.1em',
        color: 'var(--rs-text-dim)',
        textTransform: 'uppercase',
        pointerEvents: 'none',
      }}>
        v1
      </span>
    </div>
  )
}
