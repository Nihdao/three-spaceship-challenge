import { describe, it, expect, beforeEach } from 'vitest'
import useGame from '../../stores/useGame.jsx'
import useLevel from '../../stores/useLevel.jsx'
import useBoss from '../../stores/useBoss.jsx'
import QuestTracker, { computeQuest, computeThreshold, QUEST_STATES, PULSE_ANIMATION } from '../QuestTracker.jsx'
import { getGalaxyById } from '../../entities/galaxyDefs.js'

beforeEach(() => {
  useGame.getState().reset()
  useLevel.getState().reset()
  useBoss.getState().reset()
})

// ───────────────────────────────────────────────────────────────
// computeQuest — quest derivation logic (AC 2–5, Story 35.4)
// ───────────────────────────────────────────────────────────────

describe('computeQuest (Story 35.4)', () => {
  it('returns "scan" by default (wormholeState hidden, bossActive false)', () => {
    expect(computeQuest('hidden', false)).toBe('scan')
  })

  it('returns "scan" when wormholeState is "inactive" (boss has spawned, covered by bossActive check)', () => {
    // 'inactive' means boss spawned — but if bossActive is false, falls through to scan
    expect(computeQuest('inactive', false)).toBe('scan')
  })

  it('returns "locate" when wormholeState is "visible"', () => {
    expect(computeQuest('visible', false)).toBe('locate')
  })

  it('returns "locate" when wormholeState is "activating"', () => {
    expect(computeQuest('activating', false)).toBe('locate')
  })

  it('returns "locate" when wormholeState is "active"', () => {
    expect(computeQuest('active', false)).toBe('locate')
  })

  it('returns "boss" when bossActive is true (overrides wormholeState)', () => {
    expect(computeQuest('inactive', true)).toBe('boss')
  })

  it('bossActive true overrides even "visible" wormhole state', () => {
    expect(computeQuest('visible', true)).toBe('boss')
  })

  it('returns "enter" when wormholeState is "reactivated"', () => {
    expect(computeQuest('reactivated', false)).toBe('enter')
  })

  it('"enter" is overridden by bossActive (edge case)', () => {
    // Should not happen in gameplay, but bossActive always takes priority
    expect(computeQuest('reactivated', true)).toBe('boss')
  })
})

// ───────────────────────────────────────────────────────────────
// computeThreshold — scan threshold formula (AC 9, Story 35.4)
// ───────────────────────────────────────────────────────────────

describe('computeThreshold (Story 35.4)', () => {
  it('Andromeda Reach: 15 planets × 0.75 = Math.ceil(11.25) = 12', () => {
    const galaxyConfig = getGalaxyById('andromeda_reach')
    expect(computeThreshold(galaxyConfig, 15)).toBe(12)
  })

  it('uses galaxyConfig.planetCount, NOT the passed planetsLength when config exists', () => {
    const galaxyConfig = getGalaxyById('andromeda_reach') // planetCount: 15
    // Pass a different planetsLength — should use config.planetCount
    expect(computeThreshold(galaxyConfig, 5)).toBe(12) // still 12, not Math.ceil(5 * 0.75)
  })

  it('fallback: galaxyConfig null → Math.ceil(planets.length * 0.75)', () => {
    expect(computeThreshold(null, 8)).toBe(6)   // Math.ceil(8 * 0.75) = 6
    expect(computeThreshold(null, 10)).toBe(8)  // Math.ceil(10 * 0.75) = 8
    expect(computeThreshold(null, 12)).toBe(9)  // Math.ceil(12 * 0.75) = 9
  })

  it('fallback: galaxyConfig undefined → same as null', () => {
    expect(computeThreshold(undefined, 8)).toBe(6)
  })

  it('always returns a positive integer', () => {
    const galaxyConfig = getGalaxyById('andromeda_reach')
    const result = computeThreshold(galaxyConfig, 15)
    expect(Number.isInteger(result)).toBe(true)
    expect(result).toBeGreaterThan(0)
  })
})

// ───────────────────────────────────────────────────────────────
// QUEST_STATES — labels and colors (AC 2–5, Story 35.4)
// ───────────────────────────────────────────────────────────────

describe('QUEST_STATES config (Story 35.4)', () => {
  it('scan state has correct label and color', () => {
    expect(QUEST_STATES.scan.label).toBe('SCAN PLANETS')
    expect(QUEST_STATES.scan.color).toBe('var(--rs-teal)')
    expect(QUEST_STATES.scan.pulse).toBe('none')
  })

  it('locate state has correct label, color, and slow pulse', () => {
    expect(QUEST_STATES.locate.label).toBe('LOCATE THE WORMHOLE')
    expect(QUEST_STATES.locate.color).toBe('var(--rs-violet)')
    expect(QUEST_STATES.locate.pulse).toBe('slow')
  })

  it('boss state has correct label, color, and fast pulse', () => {
    expect(QUEST_STATES.boss.label).toBe('DESTROY THE GUARDIAN')
    expect(QUEST_STATES.boss.color).toBe('var(--rs-danger)')
    expect(QUEST_STATES.boss.pulse).toBe('fast')
  })

  it('enter state has correct label, color, and slow pulse', () => {
    expect(QUEST_STATES.enter.label).toBe('ENTER THE WORMHOLE')
    expect(QUEST_STATES.enter.color).toBe('var(--rs-violet)')
    expect(QUEST_STATES.enter.pulse).toBe('slow')
  })
})

// ───────────────────────────────────────────────────────────────
// Guard conditions via store state (AC 6, Story 35.4)
// ───────────────────────────────────────────────────────────────

describe('QuestTracker guard conditions (Story 35.4)', () => {
  it('returns scan quest when phase is gameplay and not paused', () => {
    useGame.setState({ phase: 'gameplay', isPaused: false })
    useLevel.setState({ wormholeState: 'hidden' })
    const { phase, isPaused } = useGame.getState()
    const { wormholeState } = useLevel.getState()
    const { isActive: bossActive } = useBoss.getState()
    // Guard condition passes, quest is scan
    expect(phase === 'gameplay' && !isPaused).toBe(true)
    expect(computeQuest(wormholeState, bossActive)).toBe('scan')
  })

  it('guard blocks when phase is not gameplay', () => {
    useGame.setState({ phase: 'menu' })
    const { phase } = useGame.getState()
    expect(phase !== 'gameplay').toBe(true)
  })

  it('guard blocks when isPaused is true during gameplay', () => {
    useGame.setState({ phase: 'gameplay', isPaused: true })
    const { phase, isPaused } = useGame.getState()
    expect(phase !== 'gameplay' || isPaused).toBe(true)
  })
})

// ───────────────────────────────────────────────────────────────
// Integration: store state → quest derivation (AC 2–5, Story 35.4)
// ───────────────────────────────────────────────────────────────

describe('QuestTracker store integration (Story 35.4)', () => {
  it('SCAN PLANETS: initial state — 0/12 for Andromeda Reach (15 planets × 0.75)', () => {
    useGame.setState({ phase: 'gameplay', isPaused: false, selectedGalaxyId: 'andromeda_reach' })
    useLevel.setState({ wormholeState: 'hidden', planets: [] })
    useBoss.setState({ isActive: false })

    const { wormholeState, planets } = useLevel.getState()
    const { isActive: bossActive } = useBoss.getState()
    const { selectedGalaxyId } = useGame.getState()

    const galaxyConfig = getGalaxyById(selectedGalaxyId)
    const threshold = computeThreshold(galaxyConfig, planets.length)
    const scannedCount = planets.filter(p => p.scanned).length
    const quest = computeQuest(wormholeState, bossActive)

    expect(quest).toBe('scan')
    expect(QUEST_STATES.scan.label).toBe('SCAN PLANETS')
    expect(scannedCount).toBe(0)
    expect(threshold).toBe(12)
  })

  it('SCAN PLANETS counter: 11 / 12 when 11 planets scanned', () => {
    const makePlanet = (id, scanned) => ({ id, x: 0, z: 0, scanned, typeId: 'CINDER', scanProgress: scanned ? 1 : 0 })
    const planets = [
      ...Array.from({ length: 11 }, (_, i) => makePlanet(i, true)),
      makePlanet(11, false),
    ]
    useLevel.setState({ wormholeState: 'hidden', planets })
    useGame.setState({ selectedGalaxyId: 'andromeda_reach' })

    const { planets: p } = useLevel.getState()
    const { selectedGalaxyId } = useGame.getState()
    const galaxyConfig = getGalaxyById(selectedGalaxyId)
    const scannedCount = p.filter(pl => pl.scanned).length
    const threshold = computeThreshold(galaxyConfig, p.length)

    expect(scannedCount).toBe(11)
    expect(threshold).toBe(12)
  })

  it('LOCATE THE WORMHOLE when wormholeState is "visible"', () => {
    useLevel.setState({ wormholeState: 'visible' })
    useBoss.setState({ isActive: false })
    const { wormholeState } = useLevel.getState()
    const { isActive: bossActive } = useBoss.getState()
    expect(computeQuest(wormholeState, bossActive)).toBe('locate')
    expect(QUEST_STATES.locate.label).toBe('LOCATE THE WORMHOLE')
  })

  it('LOCATE THE WORMHOLE when wormholeState is "activating"', () => {
    useLevel.setState({ wormholeState: 'activating' })
    useBoss.setState({ isActive: false })
    const { wormholeState } = useLevel.getState()
    const { isActive: bossActive } = useBoss.getState()
    expect(computeQuest(wormholeState, bossActive)).toBe('locate')
  })

  it('DESTROY THE GUARDIAN when useBoss.isActive is true', () => {
    useBoss.setState({ isActive: true })
    useLevel.setState({ wormholeState: 'inactive' })
    const { wormholeState } = useLevel.getState()
    const { isActive: bossActive } = useBoss.getState()
    expect(computeQuest(wormholeState, bossActive)).toBe('boss')
    expect(QUEST_STATES.boss.label).toBe('DESTROY THE GUARDIAN')
  })

  it('ENTER THE WORMHOLE when wormholeState is "reactivated"', () => {
    useLevel.setState({ wormholeState: 'reactivated' })
    useBoss.setState({ isActive: false })
    const { wormholeState } = useLevel.getState()
    const { isActive: bossActive } = useBoss.getState()
    expect(computeQuest(wormholeState, bossActive)).toBe('enter')
    expect(QUEST_STATES.enter.label).toBe('ENTER THE WORMHOLE')
  })

  it('threshold fallback: galaxyConfig null → Math.ceil(planets.length * 0.75)', () => {
    useGame.setState({ selectedGalaxyId: null })
    const planets = Array.from({ length: 8 }, (_, i) => ({ id: i, x: 0, z: 0, scanned: false, typeId: 'CINDER', scanProgress: 0 }))
    useLevel.setState({ planets })
    const { selectedGalaxyId } = useGame.getState()
    const { planets: p } = useLevel.getState()
    const galaxyConfig = getGalaxyById(selectedGalaxyId)
    expect(galaxyConfig).toBeUndefined()
    expect(computeThreshold(galaxyConfig, p.length)).toBe(6) // Math.ceil(8 * 0.75)
  })
})

// ───────────────────────────────────────────────────────────────
// PULSE_ANIMATION — animation strings per pulse key (Story 35.4)
// ───────────────────────────────────────────────────────────────

describe('PULSE_ANIMATION map (Story 35.4)', () => {
  it('slow pulse uses quest-pulse-slow keyframe at 500ms alternate', () => {
    expect(PULSE_ANIMATION.slow).toBe('quest-pulse-slow 500ms infinite alternate')
  })

  it('fast pulse uses quest-pulse-fast keyframe at 300ms alternate', () => {
    expect(PULSE_ANIMATION.fast).toBe('quest-pulse-fast 300ms infinite alternate')
  })

  it('none pulse resolves to undefined (no animation applied)', () => {
    expect(PULSE_ANIMATION.none).toBeUndefined()
  })

  it('each QUEST_STATE pulse key resolves to correct animation', () => {
    expect(PULSE_ANIMATION[QUEST_STATES.scan.pulse]).toBeUndefined()    // scan: no pulse
    expect(PULSE_ANIMATION[QUEST_STATES.locate.pulse]).toBe('quest-pulse-slow 500ms infinite alternate')
    expect(PULSE_ANIMATION[QUEST_STATES.boss.pulse]).toBe('quest-pulse-fast 300ms infinite alternate')
    expect(PULSE_ANIMATION[QUEST_STATES.enter.pulse]).toBe('quest-pulse-slow 500ms infinite alternate')
  })
})

// ───────────────────────────────────────────────────────────────
// QuestTracker default export — component contract (Story 35.4)
// ───────────────────────────────────────────────────────────────

describe('QuestTracker component export (Story 35.4)', () => {
  it('default export is a function (React component)', () => {
    expect(typeof QuestTracker).toBe('function')
  })

  it('component is named QuestTracker', () => {
    expect(QuestTracker.name).toBe('QuestTracker')
  })
})
