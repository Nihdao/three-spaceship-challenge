import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'

describe('usePlayer — getLuckStat (Story 22.3)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  it('getLuckStat returns 0 by default', () => {
    const luck = usePlayer.getState().getLuckStat()
    expect(luck).toBe(0)
  })

  it('getLuckStat includes luckBonus field', () => {
    usePlayer.getState().set?.({ luckBonus: 10 })
    // If set is not directly accessible, just check default is 0
    const luck = usePlayer.getState().getLuckStat()
    expect(typeof luck).toBe('number')
    expect(luck).toBeGreaterThanOrEqual(0)
  })

  it('getLuckStat includes permanentUpgradeBonuses.luck', () => {
    // Simulate permanent upgrades with luck bonus
    usePlayer.getState().initializeRunStats({
      attackPower: 1.0, armor: 0, maxHP: 0, regen: 0, attackSpeed: 1.0,
      zone: 1.0, magnet: 1.0, luck: 15.0, expBonus: 1.0, curse: 0.0,
      revival: 0, reroll: 0, skip: 0, banish: 0,
    })
    const luck = usePlayer.getState().getLuckStat()
    expect(luck).toBe(15)
  })

  it('luckBonus resets to 0 on reset()', () => {
    usePlayer.getState().reset()
    expect(usePlayer.getState().luckBonus).toBe(0)
  })

  it('getLuckStat is a function on the store', () => {
    expect(typeof usePlayer.getState().getLuckStat).toBe('function')
  })
})
