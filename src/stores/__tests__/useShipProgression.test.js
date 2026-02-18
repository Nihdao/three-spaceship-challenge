import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { STORAGE_KEY_SHIP_LEVELS } from '../../utils/shipProgressionStorage.js'

// Mock localStorage for Node test environment
const store = {}
const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => { store[key] = String(value) }),
  removeItem: vi.fn((key) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
}

beforeEach(() => {
  globalThis.localStorage = mockLocalStorage
  mockLocalStorage.getItem.mockClear()
  mockLocalStorage.setItem.mockClear()
  mockLocalStorage.removeItem.mockClear()
})

afterEach(() => {
  mockLocalStorage.clear()
})

// Dynamic imports after localStorage mock is set up
const { default: useShipProgression } = await import('../useShipProgression.jsx')
const { default: usePlayer } = await import('../usePlayer.jsx')

describe('useShipProgression', () => {
  beforeEach(() => {
    useShipProgression.getState().reset()
    usePlayer.getState().reset()
    mockLocalStorage.clear()
  })

  describe('initial state', () => {
    it('all ships start at level 1', () => {
      const { shipLevels } = useShipProgression.getState()
      expect(shipLevels.BALANCED).toBe(1)
      expect(shipLevels.GLASS_CANNON).toBe(1)
      expect(shipLevels.TANK).toBe(1)
    })
  })

  describe('getShipLevel', () => {
    it('returns 1 for all ships by default', () => {
      expect(useShipProgression.getState().getShipLevel('BALANCED')).toBe(1)
      expect(useShipProgression.getState().getShipLevel('GLASS_CANNON')).toBe(1)
      expect(useShipProgression.getState().getShipLevel('TANK')).toBe(1)
    })

    it('returns 1 for unknown ship id', () => {
      expect(useShipProgression.getState().getShipLevel('UNKNOWN')).toBe(1)
    })
  })

  describe('levelUpShip', () => {
    it('increments ship level when player has enough fragments', () => {
      usePlayer.setState({ fragments: 200 })
      const result = useShipProgression.getState().levelUpShip('BALANCED')
      expect(result).toBe(true)
      expect(useShipProgression.getState().getShipLevel('BALANCED')).toBe(2)
    })

    it('deducts correct fragment cost on level up (level 1 → 2 costs 100)', () => {
      usePlayer.setState({ fragments: 500 })
      useShipProgression.getState().levelUpShip('BALANCED')
      expect(usePlayer.getState().fragments).toBe(400)
    })

    it('deducts correct fragment cost for level 2 → 3 (costs 200)', () => {
      usePlayer.setState({ fragments: 1000 })
      useShipProgression.getState().levelUpShip('BALANCED') // 1→2: cost 100, remaining 900
      useShipProgression.getState().levelUpShip('BALANCED') // 2→3: cost 200, remaining 700
      expect(usePlayer.getState().fragments).toBe(700)
      expect(useShipProgression.getState().getShipLevel('BALANCED')).toBe(3)
    })

    it('returns false when player does not have enough fragments', () => {
      usePlayer.setState({ fragments: 50 }) // needs 100
      const result = useShipProgression.getState().levelUpShip('BALANCED')
      expect(result).toBe(false)
      expect(useShipProgression.getState().getShipLevel('BALANCED')).toBe(1)
      expect(usePlayer.getState().fragments).toBe(50) // unchanged
    })

    it('returns false when fragments exactly one short of cost', () => {
      usePlayer.setState({ fragments: 99 })
      const result = useShipProgression.getState().levelUpShip('BALANCED')
      expect(result).toBe(false)
    })

    it('succeeds when fragments exactly equal cost', () => {
      usePlayer.setState({ fragments: 100 })
      const result = useShipProgression.getState().levelUpShip('BALANCED')
      expect(result).toBe(true)
      expect(usePlayer.getState().fragments).toBe(0)
    })

    it('returns false when ship is already at max level (9)', () => {
      // Manually set to max level
      useShipProgression.setState({ shipLevels: { BALANCED: 9, GLASS_CANNON: 1, TANK: 1 } })
      usePlayer.setState({ fragments: 99999 })
      const result = useShipProgression.getState().levelUpShip('BALANCED')
      expect(result).toBe(false)
      expect(useShipProgression.getState().getShipLevel('BALANCED')).toBe(9)
    })

    it('does not affect other ships when leveling one ship', () => {
      usePlayer.setState({ fragments: 1000 })
      useShipProgression.getState().levelUpShip('BALANCED')
      expect(useShipProgression.getState().getShipLevel('GLASS_CANNON')).toBe(1)
      expect(useShipProgression.getState().getShipLevel('TANK')).toBe(1)
    })

    it('can level different ships independently', () => {
      usePlayer.setState({ fragments: 5000 })
      useShipProgression.getState().levelUpShip('BALANCED')    // 1→2: 100
      useShipProgression.getState().levelUpShip('GLASS_CANNON') // 1→2: 100
      expect(useShipProgression.getState().getShipLevel('BALANCED')).toBe(2)
      expect(useShipProgression.getState().getShipLevel('GLASS_CANNON')).toBe(2)
      expect(useShipProgression.getState().getShipLevel('TANK')).toBe(1)
    })
  })

  describe('getNextLevelCost', () => {
    it('returns 100 for level 1 ship (cost to reach level 2)', () => {
      expect(useShipProgression.getState().getNextLevelCost('BALANCED')).toBe(100)
    })

    it('returns 200 after first level up (cost level 2 → 3)', () => {
      usePlayer.setState({ fragments: 1000 })
      useShipProgression.getState().levelUpShip('BALANCED')
      expect(useShipProgression.getState().getNextLevelCost('BALANCED')).toBe(200)
    })

    it('returns null for max level ship', () => {
      useShipProgression.setState({ shipLevels: { BALANCED: 9, GLASS_CANNON: 1, TANK: 1 } })
      expect(useShipProgression.getState().getNextLevelCost('BALANCED')).toBeNull()
    })
  })

  describe('getShipStatMultiplier', () => {
    it('returns 1.0 at level 1 (no bonus)', () => {
      expect(useShipProgression.getState().getShipStatMultiplier('BALANCED')).toBe(1.0)
    })

    it('returns 1.03 at level 2 (+3%)', () => {
      expect(useShipProgression.getState().getShipStatMultiplier('BALANCED', 2)).toBeCloseTo(1.03)
    })

    it('returns 1.12 at level 5 (+12%)', () => {
      expect(useShipProgression.getState().getShipStatMultiplier('BALANCED', 5)).toBeCloseTo(1.12)
    })

    it('returns 1.24 at level 9 (+24%)', () => {
      expect(useShipProgression.getState().getShipStatMultiplier('BALANCED', 9)).toBeCloseTo(1.24)
    })

    it('uses ship current level when no level param provided', () => {
      useShipProgression.setState({ shipLevels: { BALANCED: 5, GLASS_CANNON: 1, TANK: 1 } })
      expect(useShipProgression.getState().getShipStatMultiplier('BALANCED')).toBeCloseTo(1.12)
    })
  })

  describe('persistence', () => {
    it('saves ship levels to localStorage on level up', () => {
      usePlayer.setState({ fragments: 500 })
      useShipProgression.getState().levelUpShip('BALANCED')
      const stored = JSON.parse(store[STORAGE_KEY_SHIP_LEVELS])
      expect(stored.BALANCED).toBe(2)
    })

    it('persists independently for each ship', () => {
      usePlayer.setState({ fragments: 5000 })
      useShipProgression.getState().levelUpShip('BALANCED')
      useShipProgression.getState().levelUpShip('TANK')
      const stored = JSON.parse(store[STORAGE_KEY_SHIP_LEVELS])
      expect(stored.BALANCED).toBe(2)
      expect(stored.GLASS_CANNON).toBe(1)
      expect(stored.TANK).toBe(2)
    })

    it('clears localStorage on reset', () => {
      usePlayer.setState({ fragments: 500 })
      useShipProgression.getState().levelUpShip('BALANCED')
      useShipProgression.getState().reset()
      const stored = JSON.parse(store[STORAGE_KEY_SHIP_LEVELS])
      expect(stored.BALANCED).toBe(1)
      expect(stored.GLASS_CANNON).toBe(1)
      expect(stored.TANK).toBe(1)
    })
  })

  describe('reset', () => {
    it('resets all ship levels to 1', () => {
      useShipProgression.setState({ shipLevels: { BALANCED: 5, GLASS_CANNON: 3, TANK: 7 } })
      useShipProgression.getState().reset()
      expect(useShipProgression.getState().getShipLevel('BALANCED')).toBe(1)
      expect(useShipProgression.getState().getShipLevel('GLASS_CANNON')).toBe(1)
      expect(useShipProgression.getState().getShipLevel('TANK')).toBe(1)
    })
  })
})

describe('usePlayer — ship level integration (Story 25.1)', () => {
  beforeEach(() => {
    useShipProgression.getState().reset()
    usePlayer.getState().reset()
    mockLocalStorage.clear()
  })

  it('initializeRunStats applies level 1 multiplier (1.0x) — no change from base', () => {
    usePlayer.getState().reset()
    const bonuses = { attackPower: 1.0, armor: 0, maxHP: 0, regen: 0, attackSpeed: 1.0, zone: 1.0, magnet: 1.0, luck: 0, expBonus: 1.0, curse: 0, revival: 0, reroll: 0, skip: 0, banish: 0 }
    usePlayer.getState().initializeRunStats(bonuses)

    // BALANCED ship: HP 100, level 1 → 100 * 1.0 + 0 = 100
    expect(usePlayer.getState().maxHP).toBe(100)
    expect(usePlayer.getState().currentHP).toBe(100)
  })

  it('initializeRunStats applies ship level multiplier to maxHP', () => {
    useShipProgression.setState({ shipLevels: { BALANCED: 5, GLASS_CANNON: 1, TANK: 1 } })
    usePlayer.getState().reset()
    const bonuses = { attackPower: 1.0, armor: 0, maxHP: 0, regen: 0, attackSpeed: 1.0, zone: 1.0, magnet: 1.0, luck: 0, expBonus: 1.0, curse: 0, revival: 0, reroll: 0, skip: 0, banish: 0 }
    usePlayer.getState().initializeRunStats(bonuses)

    // BALANCED ship: HP 100, level 5 → 100 * 1.12 = 112
    expect(usePlayer.getState().maxHP).toBeCloseTo(112)
    expect(usePlayer.getState().currentHP).toBeCloseTo(112)
  })

  it('initializeRunStats stacks level multiplier with permanent HP bonus', () => {
    useShipProgression.setState({ shipLevels: { BALANCED: 5, GLASS_CANNON: 1, TANK: 1 } })
    usePlayer.getState().reset()
    const bonuses = { attackPower: 1.0, armor: 0, maxHP: 20, regen: 0, attackSpeed: 1.0, zone: 1.0, magnet: 1.0, luck: 0, expBonus: 1.0, curse: 0, revival: 0, reroll: 0, skip: 0, banish: 0 }
    usePlayer.getState().initializeRunStats(bonuses)

    // Level 5 (1.12x): 100 * 1.12 + 20 = 112 + 20 = 132
    expect(usePlayer.getState().maxHP).toBeCloseTo(132)
  })

  it('initializeRunStats applies ship level multiplier to shipBaseSpeed', () => {
    useShipProgression.setState({ shipLevels: { BALANCED: 5, GLASS_CANNON: 1, TANK: 1 } })
    usePlayer.getState().reset()
    const bonuses = { attackPower: 1.0, armor: 0, maxHP: 0, regen: 0, attackSpeed: 1.0, zone: 1.0, magnet: 1.0, luck: 0, expBonus: 1.0, curse: 0, revival: 0, reroll: 0, skip: 0, banish: 0 }
    usePlayer.getState().initializeRunStats(bonuses)

    // BALANCED ship: speed 50, level 5 → 50 * 1.12 = 56
    expect(usePlayer.getState().shipBaseSpeed).toBeCloseTo(56)
  })

  it('initializeRunStats applies ship level multiplier to shipBaseDamageMultiplier', () => {
    useShipProgression.setState({ shipLevels: { BALANCED: 9, GLASS_CANNON: 1, TANK: 1 } })
    usePlayer.getState().reset()
    const bonuses = { attackPower: 1.0, armor: 0, maxHP: 0, regen: 0, attackSpeed: 1.0, zone: 1.0, magnet: 1.0, luck: 0, expBonus: 1.0, curse: 0, revival: 0, reroll: 0, skip: 0, banish: 0 }
    usePlayer.getState().initializeRunStats(bonuses)

    // BALANCED ship: damage 1.0, level 9 (1.24x) → 1.0 * 1.24 = 1.24
    expect(usePlayer.getState().shipBaseDamageMultiplier).toBeCloseTo(1.24)
  })
})

describe('ShipSelect UI integration (Story 25.1)', () => {
  beforeEach(() => {
    useShipProgression.getState().reset()
    usePlayer.getState().reset()
    mockLocalStorage.clear()
  })

  it('level display: getShipLevel returns correct level to render "LV.N" badge', () => {
    useShipProgression.setState({ shipLevels: { BALANCED: 5, GLASS_CANNON: 1, TANK: 1 } })
    const shipLevel = useShipProgression.getState().getShipLevel('BALANCED')
    expect(shipLevel).toBe(5)
    expect(shipLevel >= 9).toBe(false) // UI renders "LV.5", not "MAX"
  })

  it('level display: isMaxLevel flag is true at level 9 → "★ MAX LEVEL" shown', () => {
    useShipProgression.setState({ shipLevels: { BALANCED: 9, GLASS_CANNON: 1, TANK: 1 } })
    const shipLevel = useShipProgression.getState().getShipLevel('BALANCED')
    expect(shipLevel >= 9).toBe(true)
    expect(useShipProgression.getState().getNextLevelCost('BALANCED')).toBeNull()
  })

  it('LEVEL UP button: canAffordLevelUp is false when fragments < nextLevelCost', () => {
    usePlayer.setState({ fragments: 50 })
    const nextLevelCost = useShipProgression.getState().getNextLevelCost('BALANCED') // 100
    const canAfford = nextLevelCost !== null && 50 >= nextLevelCost
    expect(canAfford).toBe(false)
  })

  it('LEVEL UP button: canAffordLevelUp is true when fragments >= nextLevelCost', () => {
    usePlayer.setState({ fragments: 100 })
    const nextLevelCost = useShipProgression.getState().getNextLevelCost('BALANCED') // 100
    const canAfford = nextLevelCost !== null && 100 >= nextLevelCost
    expect(canAfford).toBe(true)
  })

  it('level display updates reactively after handleLevelUp success', () => {
    usePlayer.setState({ fragments: 500 })
    useShipProgression.getState().levelUpShip('BALANCED') // 1 → 2
    expect(useShipProgression.getState().getShipLevel('BALANCED')).toBe(2)
    expect(useShipProgression.getState().getNextLevelCost('BALANCED')).toBe(200)
    expect(usePlayer.getState().fragments).toBe(400)
  })

  it('level display: each ship shows its own level independently', () => {
    usePlayer.setState({ fragments: 5000 })
    useShipProgression.getState().levelUpShip('BALANCED')    // BALANCED: 1→2
    useShipProgression.getState().levelUpShip('TANK')         // TANK: 1→2
    expect(useShipProgression.getState().getShipLevel('BALANCED')).toBe(2)
    expect(useShipProgression.getState().getShipLevel('GLASS_CANNON')).toBe(1)
    expect(useShipProgression.getState().getShipLevel('TANK')).toBe(2)
  })
})
