import { useEffect, useState } from 'react'
import useCompanion from '../stores/useCompanion.jsx'
import { COMPANION } from '../entities/companionDefs.js'
import { playSFX } from '../audio/audioManager.js'

function CompanionAvatar() {
  const [imgFailed, setImgFailed] = useState(false)
  if (imgFailed) {
    return (
      <span
        style={{
          fontSize: '2.5rem',
          lineHeight: 1,
          flexShrink: 0,
          width: '3rem',
          height: '3rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--rs-violet)',
          borderRadius: '0.25rem',
        }}
      >
        {COMPANION.icon}
      </span>
    )
  }
  return (
    <img
      src="/assets/navi.png"
      alt={COMPANION.name}
      onError={() => setImgFailed(true)}
      style={{
        width: '3rem',
        height: '3rem',
        flexShrink: 0,
        objectFit: 'cover',
        border: '2px solid var(--rs-violet)',
        borderRadius: '0.25rem',
      }}
    />
  )
}

export default function CompanionDialogue() {
  const current = useCompanion((s) => s.current)
  const [isLeaving, setIsLeaving] = useState(false)

  // Auto-dismiss: play slide-in, then trigger fade-out after duration
  useEffect(() => {
    if (!current) return
    setIsLeaving(false)
    playSFX('ui-message') // UI notification sound — intentionally in component (plays per dialogue shown, incl. queued)
    const timer = setTimeout(() => {
      setIsLeaving(true)
    }, current.duration * 1000)
    return () => clearTimeout(timer)
  }, [current])

  if (!current) return null

  return (
    <div
      className={isLeaving ? 'animate-companion-fade-out' : 'animate-companion-slide-in'}
      onAnimationEnd={isLeaving ? () => useCompanion.getState().dismiss() : undefined}
      style={{
        position: 'fixed',
        bottom: '5.5rem',
        left: '1.5rem',
        zIndex: 42,
        maxWidth: '320px',
        background: 'var(--rs-bg-surface)',
        borderLeft: '3px solid var(--rs-violet)',
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        fontFamily: 'Rajdhani, sans-serif',
      }}
    >
      <CompanionAvatar />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--rs-violet)',
            fontFamily: 'Rajdhani, sans-serif',
            textTransform: 'uppercase',
          }}
        >
          {COMPANION.name}
        </div>
        <div
          style={{
            fontSize: '1rem',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 400,
            color: 'var(--rs-text)',
            lineHeight: 1.4,
            marginTop: '0.125rem',
          }}
        >
          {current.line}
        </div>
      </div>
    </div>
  )
}
