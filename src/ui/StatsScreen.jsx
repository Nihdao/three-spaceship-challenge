import { useEffect, useRef } from 'react'
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

function StatCard({ label, value }) {
  return (
    <dl className="border border-game-border rounded-lg p-3 bg-white/[0.05] backdrop-blur-sm">
      <dt className="text-xs tracking-[0.3em] text-game-text-muted uppercase mb-1">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums text-game-text m-0">{value}</dd>
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center font-game animate-fade-in">
      {/* Content — no backdrop, 3D background visible directly */}
      <div className="relative w-full max-w-4xl px-6 py-8 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            ref={backButtonRef}
            onClick={() => { playSFX('button-click'); onClose() }}
            onMouseEnter={() => playSFX('button-hover')}
            className="px-4 py-2 text-sm tracking-widest text-game-text-muted hover:text-game-text transition-colors select-none"
          >
            &larr; BACK
          </button>

          <h1
            className="text-2xl font-bold tracking-[0.15em] text-game-text select-none"
            style={{ textShadow: '0 0 30px rgba(204, 102, 255, 0.3)' }}
          >
            CAREER STATISTICS
          </h1>

          <div className="w-24" aria-hidden="true" />
        </div>

        {/* Empty state */}
        {isEmpty ? (
          <div className="text-center py-16">
            <p className="text-xl text-game-text-muted tracking-widest">No runs played yet!</p>
            <p className="text-sm text-game-text-muted mt-2">Complete a run to see your career statistics.</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Career section */}
            <section aria-label="Career Stats">
              <h2 className="text-xs tracking-[0.4em] text-game-text-muted uppercase mb-3">CAREER</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="TOTAL RUNS" value={totalRuns.toLocaleString()} />
                <StatCard label="ENEMIES KILLED" value={totalKills.toLocaleString()} />
                <StatCard label="TIME SURVIVED" value={formatTime(totalTimeSurvived)} />
                <StatCard label="FRAGMENTS EARNED" value={`◆ ${totalFragments.toLocaleString()}`} />
              </div>
            </section>

            {/* Best Run section */}
            <section aria-label="Best Run Stats">
              <h2 className="text-xs tracking-[0.4em] text-game-text-muted uppercase mb-3">BEST RUN</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="SYSTEM REACHED" value={bestRun.highestSystem} />
                <StatCard label="LONGEST RUN" value={formatTime(bestRun.longestTime)} />
                <StatCard label="MOST KILLS" value={bestRun.mostKills.toLocaleString()} />
                <StatCard label="HIGHEST LEVEL" value={bestRun.highestLevel} />
              </div>
            </section>

            {/* Favorites section */}
            <section aria-label="Favorites">
              <h2 className="text-xs tracking-[0.4em] text-game-text-muted uppercase mb-3">FAVORITES</h2>
              {topWeapons.length === 0 && topBoons.length === 0 ? (
                <p className="text-sm text-game-text-muted">Play a run to see your favorites!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Top Weapons */}
                  <div className="border border-game-border rounded-lg p-4 bg-white/[0.05] backdrop-blur-sm">
                    <h3 className="text-xs tracking-[0.3em] text-game-text-muted uppercase mb-3">TOP WEAPONS</h3>
                    {topWeapons.length === 0 ? (
                      <p className="text-sm text-game-text-muted">—</p>
                    ) : (
                      <ol className="space-y-2">
                        {topWeapons.map(({ weaponId, runCount }, i) => (
                          <li key={weaponId} className="flex items-center justify-between">
                            <span className="text-sm text-game-text">
                              <span className="text-game-text-muted mr-2">{i + 1}.</span>
                              {WEAPONS[weaponId]?.name ?? weaponId}
                            </span>
                            <span className="text-xs text-game-text-muted tabular-nums">{runCount} runs</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {/* Top Boons */}
                  <div className="border border-game-border rounded-lg p-4 bg-white/[0.05] backdrop-blur-sm">
                    <h3 className="text-xs tracking-[0.3em] text-game-text-muted uppercase mb-3">TOP BOONS</h3>
                    {topBoons.length === 0 ? (
                      <p className="text-sm text-game-text-muted">—</p>
                    ) : (
                      <ol className="space-y-2">
                        {topBoons.map(({ boonId, runCount }, i) => (
                          <li key={boonId} className="flex items-center justify-between">
                            <span className="text-sm text-game-text">
                              <span className="text-game-text-muted mr-2">{i + 1}.</span>
                              {BOONS[boonId]?.name ?? boonId}
                            </span>
                            <span className="text-xs text-game-text-muted tabular-nums">{runCount} runs</span>
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
