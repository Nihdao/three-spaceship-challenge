import { useEffect, useState } from 'react'
import useCompanion from '../stores/useCompanion.jsx'
import { COMPANION } from '../entities/companionDefs.js'
import { playSFX } from '../audio/audioManager.js'

function CompanionAvatar() {
  const [imgFailed, setImgFailed] = useState(false)
  if (imgFailed) {
    return (
      <span style={{ fontSize: '2.5rem', lineHeight: 1, flexShrink: 0 }}>{COMPANION.icon}</span>
    )
  }
  return (
    <img
      src="/assets/navi.png"
      alt={COMPANION.name}
      onError={() => setImgFailed(true)}
      style={{ width: '3rem', height: '3rem', flexShrink: 0, objectFit: 'cover', borderRadius: '0.5rem' }}
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
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <CompanionAvatar />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#cc66ff' }}>{COMPANION.name}</div>
        <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.4, marginTop: '0.125rem' }}>{current.line}</div>
      </div>
    </div>
  )
}
