import useGame from '../stores/useGame.jsx'
import useLevel from '../stores/useLevel.jsx'
import useBoss from '../stores/useBoss.jsx'
import { getGalaxyById } from '../entities/galaxyDefs.js'

export const QUEST_STATES = {
  scan:   { label: 'SCAN PLANETS',         color: 'var(--rs-teal)',   pulse: 'none' },
  locate: { label: 'LOCATE THE WORMHOLE',  color: 'var(--rs-violet)', pulse: 'slow' },
  boss:   { label: 'DESTROY THE GUARDIAN', color: 'var(--rs-danger)', pulse: 'fast' },
  enter:  { label: 'ENTER THE WORMHOLE',   color: 'var(--rs-violet)', pulse: 'slow' },
}

export const PULSE_ANIMATION = {
  slow: 'quest-pulse-slow 500ms infinite alternate',
  fast: 'quest-pulse-fast 300ms infinite alternate',
  none: undefined,
}

// Width matches minimap — clamp(120px, 12vw, 180px)
const MINIMAP_WIDTH = 'clamp(120px, 12vw, 180px)'

/** Derive current quest key from game state. Priority: boss > enter > locate > scan. */
export function computeQuest(wormholeState, bossActive) {
  if (bossActive) return 'boss'
  if (wormholeState === 'reactivated') return 'enter'
  if (wormholeState === 'visible' || wormholeState === 'activating' || wormholeState === 'active') return 'locate'
  return 'scan'
}

/** Compute scan threshold from galaxy config with fallback. */
export function computeThreshold(galaxyConfig, planetsLength) {
  const planetCount = galaxyConfig?.planetCount ?? planetsLength
  return Math.ceil(planetCount * (galaxyConfig?.wormholeThreshold ?? 0.75))
}

export default function QuestTracker() {
  const phase = useGame(s => s.phase)
  const isPaused = useGame(s => s.isPaused)
  const selectedGalaxyId = useGame(s => s.selectedGalaxyId)
  const wormholeState = useLevel(s => s.wormholeState)
  const planetCount = useLevel(s => s.planets.length)
  const scannedCount = useLevel(s => s.planets.filter(p => p.scanned).length)
  const bossActive = useBoss(s => s.isActive)

  if (phase !== 'gameplay' || isPaused) return null

  const galaxyConfig = getGalaxyById(selectedGalaxyId)
  const threshold = computeThreshold(galaxyConfig, planetCount)
  const quest = computeQuest(wormholeState, bossActive)
  const cfg = QUEST_STATES[quest]

  return (
    <div style={{
      width: MINIMAP_WIDTH,
      borderLeft: `3px solid ${cfg.color}`,
      background: 'var(--rs-bg-surface)',
      padding: '4px 8px',
      boxSizing: 'border-box',
      animation: PULSE_ANIMATION[cfg.pulse],
    }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '0.75rem',
        letterSpacing: '0.08em',
        lineHeight: 1.1,
        color: cfg.color,
        textTransform: 'uppercase',
      }}>
        {cfg.label}
      </div>
      {quest === 'scan' && (
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.65rem',
          color: cfg.color,
          marginTop: '2px',
        }}>
          {scannedCount} / {threshold}
        </div>
      )}
    </div>
  )
}
