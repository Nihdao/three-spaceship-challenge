import { useEffect, useRef } from 'react'
import { FragmentIcon } from './icons/index.jsx'
import useGlobalStats from '../stores/useGlobalStats.jsx'
import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'
import { playSFX } from '../audio/audioManager.js'

/**
 * Format seconds into "Xh Ym" or "Ym".
 * Exported for testing.
 */
export function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// ─── Redshift Design System styles ─────────────────────────────────────────

const S = {
  title: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '2.5rem',
    letterSpacing: '0.15em',
    color: 'var(--rs-text)',
    margin: 0,
    userSelect: 'none',
  },
  accentLine: {
    width: '32px',
    height: '2px',
    background: 'var(--rs-orange)',
    margin: '6px auto 0',
  },
  sectionLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.65rem',
    letterSpacing: '0.3em',
    color: 'var(--rs-text-muted)',
    textTransform: 'uppercase',
    marginBottom: '12px',
  },
  panel: {
    padding: '16px',
    background: 'var(--rs-bg-raised)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    border: '1px solid var(--rs-border)',
  },
  backBtn: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    color: 'var(--rs-text-muted)',
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'border-color 150ms, color 150ms, transform 150ms',
    outline: 'none',
    userSelect: 'none',
  },
}

function StatCard({ label, value }) {
  return (
    <dl style={{ ...S.panel, padding: '12px', margin: 0 }}>
      <dt style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.3em', color: 'var(--rs-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</dt>
      <dd style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: 'var(--rs-text)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{value}</dd>
    </dl>
  )
}

export default function StatsScreen({ onClose }) {
  const backButtonRef = useRef(null)
  const totalRuns = useGlobalStats(s => s.totalRuns)
  const totalKills = useGlobalStats(s => s.totalKills)
  const totalTimeSurvived = useGlobalStats(s => s.totalTimeSurvived)
  const totalFragments = useGlobalStats(s => s.totalFragments)
  const bestRun = useGlobalStats(s => s.bestRun)
  const getTopWeapons = useGlobalStats(s => s.getTopWeapons)
  const getTopBoons = useGlobalStats(s => s.getTopBoons)

  const topWeapons = getTopWeapons(3)
  const topBoons = getTopBoons(3)
  const isEmpty = totalRuns === 0

  // Focus BACK button on mount for immediate keyboard access
  useEffect(() => {
    backButtonRef.current?.focus()
  }, [])

  // Keyboard: Escape to close
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        playSFX('button-click')
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      {/* Content — no backdrop, 3D background visible directly */}
      <div className="relative w-full max-w-4xl px-6 py-8 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            ref={backButtonRef}
            onClick={() => { playSFX('button-click'); onClose() }}
            onMouseEnter={(e) => {
              playSFX('button-hover')
              e.currentTarget.style.borderColor = 'var(--rs-orange)'
              e.currentTarget.style.color = 'var(--rs-text)'
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--rs-border)'
              e.currentTarget.style.color = 'var(--rs-text-muted)'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
            style={S.backBtn}
          >
            &larr; BACK
          </button>

          <div style={{ textAlign: 'center' }}>
            <h1 style={S.title}>CAREER STATISTICS</h1>
            <div style={S.accentLine} />
          </div>

          <div className="w-24" aria-hidden="true" />
        </div>

        {/* Empty state */}
        {isEmpty ? (
          <div className="text-center py-16">
            <p className="text-xl tracking-widest" style={{ color: 'var(--rs-text-muted)' }}>No runs played yet!</p>
            <p className="text-sm mt-2" style={{ color: 'var(--rs-text-muted)' }}>Complete a run to see your career statistics.</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Career section */}
            <section aria-label="Career Stats">
              <h2 style={S.sectionLabel}>CAREER</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="TOTAL RUNS" value={totalRuns.toLocaleString()} />
                <StatCard label="ENEMIES KILLED" value={totalKills.toLocaleString()} />
                <StatCard label="TIME SURVIVED" value={formatTime(totalTimeSurvived)} />
                <StatCard label="FRAGMENTS EARNED" value={<><FragmentIcon size={18} color="var(--rs-violet)" style={{ verticalAlign: 'middle', marginRight: 4 }} />{totalFragments.toLocaleString()}</>} />
              </div>
            </section>

            {/* Best Run section */}
            <section aria-label="Best Run Stats">
              <h2 style={S.sectionLabel}>BEST RUN</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="SYSTEM REACHED" value={bestRun.highestSystem} />
                <StatCard label="LONGEST RUN" value={formatTime(bestRun.longestTime)} />
                <StatCard label="MOST KILLS" value={bestRun.mostKills.toLocaleString()} />
                <StatCard label="HIGHEST LEVEL" value={bestRun.highestLevel} />
              </div>
            </section>

            {/* Favorites section */}
            <section aria-label="Favorites">
              <h2 style={S.sectionLabel}>FAVORITES</h2>
              {topWeapons.length === 0 && topBoons.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--rs-text-muted)' }}>Play a run to see your favorites!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Top Weapons */}
                  <div style={S.panel}>
                    <h3 style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.3em', color: 'var(--rs-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>TOP WEAPONS</h3>
                    {topWeapons.length === 0 ? (
                      <p className="text-sm" style={{ color: 'var(--rs-text-muted)' }}>—</p>
                    ) : (
                      <ol className="space-y-2">
                        {topWeapons.map(({ weaponId, runCount }, i) => (
                          <li key={weaponId} className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: 'var(--rs-text)' }}>
                              <span className="mr-2" style={{ color: 'var(--rs-text-muted)' }}>{i + 1}.</span>
                              {WEAPONS[weaponId]?.name ?? weaponId}
                            </span>
                            <span className="text-xs tabular-nums" style={{ color: 'var(--rs-text-muted)' }}>{runCount} runs</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {/* Top Boons */}
                  <div style={S.panel}>
                    <h3 style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.3em', color: 'var(--rs-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>TOP BOONS</h3>
                    {topBoons.length === 0 ? (
                      <p className="text-sm" style={{ color: 'var(--rs-text-muted)' }}>—</p>
                    ) : (
                      <ol className="space-y-2">
                        {topBoons.map(({ boonId, runCount }, i) => (
                          <li key={boonId} className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: 'var(--rs-text)' }}>
                              <span className="mr-2" style={{ color: 'var(--rs-text-muted)' }}>{i + 1}.</span>
                              {BOONS[boonId]?.name ?? boonId}
                            </span>
                            <span className="text-xs tabular-nums" style={{ color: 'var(--rs-text-muted)' }}>{runCount} runs</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                </div>
              )}
            </section>

          </div>
        )}
      </div>
    </div>
  )
}
