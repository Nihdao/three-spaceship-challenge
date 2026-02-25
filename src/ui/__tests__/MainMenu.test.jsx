import { describe, it, expect, beforeEach } from 'vitest'
import { MENU_ITEMS } from '../MainMenu.jsx'
import usePlayer from '../../stores/usePlayer.jsx'
import useGame from '../../stores/useGame.jsx'

beforeEach(() => {
  usePlayer.getState().reset()
  usePlayer.setState({ fragments: 0, fragmentsEarnedThisRun: 0 })
  useGame.getState().reset()
})

describe('MainMenu — Fragment display store contract', () => {
  it('usePlayer exposes fragments field consumed by MainMenu', () => {
    expect(usePlayer.getState()).toHaveProperty('fragments')
    expect(usePlayer.getState().fragments).toBe(0)
  })

  it('fragments updates via addFragments (Zustand selector reactivity)', () => {
    usePlayer.getState().addFragments(450)
    expect(usePlayer.getState().fragments).toBe(450)
  })

  it('fragments persist on full reset (permanent cross-run currency)', () => {
    usePlayer.getState().addFragments(500)
    usePlayer.getState().reset()
    expect(usePlayer.getState().fragments).toBe(500)
  })

  it('fragments survives resetForNewSystem (persists between runs)', () => {
    usePlayer.getState().addFragments(300)
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().fragments).toBe(300)
  })
})

describe('MainMenu — MENU_ITEMS export', () => {
  it('exports MENU_ITEMS array with expected entries', () => {
    const ids = MENU_ITEMS.map(item => item.id)
    expect(ids).toContain('play')
    expect(ids).toContain('upgrades')
    expect(ids).toContain('armory')
    expect(ids).toContain('options')
    // stats is a corner button; credits is a corner button — neither in main MENU_ITEMS
    expect(ids).not.toContain('stats')
    expect(ids).not.toContain('credits')
  })
})
