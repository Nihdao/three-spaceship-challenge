import { describe, it, expect, beforeEach } from 'vitest'
import { MENU_ITEMS } from '../MainMenu.jsx'
import { getUpgradeDisplayInfo, UPGRADE_IDS, BONUS_FORMATS } from '../UpgradesScreen.jsx'
import { PERMANENT_UPGRADES } from '../../entities/permanentUpgradesDefs.js'
import useUpgrades from '../../stores/useUpgrades.jsx'
import usePlayer from '../../stores/usePlayer.jsx'

beforeEach(() => {
  useUpgrades.getState().reset()
  usePlayer.getState().reset()
})

// --- Task 1: MainMenu UPGRADES button ---

describe('MainMenu UPGRADES button', () => {
  it('MENU_ITEMS includes an upgrades entry', () => {
    const ids = MENU_ITEMS.map(item => item.id)
    expect(ids).toContain('upgrades')
  })

  it('UPGRADES appears after PLAY', () => {
    const ids = MENU_ITEMS.map(item => item.id)
    const playIndex = ids.indexOf('play')
    const upgradesIndex = ids.indexOf('upgrades')
    expect(upgradesIndex).toBeGreaterThan(playIndex)
  })

  it('UPGRADES entry has label "UPGRADES"', () => {
    const item = MENU_ITEMS.find(i => i.id === 'upgrades')
    expect(item.label).toBe('UPGRADES')
  })
})

// --- Task 2: UpgradesScreen renders all upgrades ---

describe('UPGRADE_IDS', () => {
  it('contains all upgrade IDs from PERMANENT_UPGRADES', () => {
    const defIds = Object.keys(PERMANENT_UPGRADES)
    expect(UPGRADE_IDS).toEqual(defIds)
  })

  it('has at least 6 upgrades', () => {
    expect(UPGRADE_IDS.length).toBeGreaterThanOrEqual(6)
  })
})

// --- Task 3: UpgradeCard display info ---

describe('getUpgradeDisplayInfo', () => {
  it('returns correct info for a level-0 upgrade', () => {
    const info = getUpgradeDisplayInfo('ATTACK_POWER', 0, 500)
    expect(info.name).toBe('Attack Power')
    expect(info.description).toBe('Increases weapon damage')
    expect(info.icon).toBe('⚔️')
    expect(info.currentLevel).toBe(0)
    expect(info.maxLevel).toBe(5)
    expect(info.nextCost).toBe(50)
    expect(info.isMaxed).toBe(false)
    expect(info.canAfford).toBe(true)
    expect(info.totalBonus).toBe(0)
  })

  it('returns correct info for a partially-leveled upgrade', () => {
    const info = getUpgradeDisplayInfo('ATTACK_POWER', 3, 500)
    expect(info.currentLevel).toBe(3)
    expect(info.nextCost).toBe(350) // level 4 cost
    expect(info.isMaxed).toBe(false)
    expect(info.canAfford).toBe(true)
    expect(info.totalBonus).toBeCloseTo(0.15) // 3 * 0.05
  })

  it('returns isMaxed=true and nextCost=null when fully leveled', () => {
    const info = getUpgradeDisplayInfo('ATTACK_POWER', 5, 1000)
    expect(info.isMaxed).toBe(true)
    expect(info.nextCost).toBeNull()
    expect(info.canAfford).toBe(false)
    expect(info.currentLevel).toBe(5)
    expect(info.maxLevel).toBe(5)
  })

  it('returns canAfford=false when player cannot afford next level', () => {
    const info = getUpgradeDisplayInfo('ATTACK_POWER', 0, 10)
    expect(info.canAfford).toBe(false)
    expect(info.nextCost).toBe(50)
  })

  it('returns null for unknown upgrade ID', () => {
    const info = getUpgradeDisplayInfo('NONEXISTENT', 0, 100)
    expect(info).toBeNull()
  })

  it('works for ARMOR upgrade', () => {
    const info = getUpgradeDisplayInfo('ARMOR', 2, 300)
    expect(info.name).toBe('Armor')
    expect(info.currentLevel).toBe(2)
    expect(info.totalBonus).toBe(2) // 2 * 1
  })

  it('works for MAX_HP upgrade at max level (3)', () => {
    const info = getUpgradeDisplayInfo('MAX_HP', 3, 0)
    expect(info.isMaxed).toBe(true)
    expect(info.maxLevel).toBe(3)
    expect(info.totalBonus).toBe(30) // 3 * 10
  })
})

// --- BONUS_FORMATS mapping ---

describe('BONUS_FORMATS', () => {
  it('covers all percentage-based upgrades', () => {
    expect(BONUS_FORMATS.ATTACK_POWER).toBe('percent')
    expect(BONUS_FORMATS.ATTACK_SPEED).toBe('percent')
    expect(BONUS_FORMATS.ZONE).toBe('percent')
  })

  it('covers per-second upgrades', () => {
    expect(BONUS_FORMATS.REGEN).toBe('perSecond')
  })

  it('flat upgrades fall back to default (no entry needed)', () => {
    expect(BONUS_FORMATS.ARMOR).toBeUndefined()
    expect(BONUS_FORMATS.MAX_HP).toBeUndefined()
  })

  it('every UPGRADE_ID has a valid or undefined format', () => {
    const validFormats = ['percent', 'perSecond', 'flat', undefined]
    for (const id of UPGRADE_IDS) {
      expect(validFormats).toContain(BONUS_FORMATS[id])
    }
  })
})

// --- getUpgradeDisplayInfo for every upgrade type ---

describe('getUpgradeDisplayInfo covers all defined upgrades', () => {
  it('returns valid info for every UPGRADE_ID at level 0', () => {
    for (const id of UPGRADE_IDS) {
      const info = getUpgradeDisplayInfo(id, 0, 10000)
      expect(info).not.toBeNull()
      expect(info.id).toBe(id)
      expect(info.name).toBeTruthy()
      expect(info.maxLevel).toBeGreaterThan(0)
      expect(info.currentLevel).toBe(0)
      expect(info.isMaxed).toBe(false)
      expect(info.nextCost).toBeGreaterThan(0)
    }
  })

  it('returns isMaxed for every UPGRADE_ID at max level', () => {
    for (const id of UPGRADE_IDS) {
      const def = PERMANENT_UPGRADES[id]
      const info = getUpgradeDisplayInfo(id, def.maxLevel, 0)
      expect(info.isMaxed).toBe(true)
      expect(info.nextCost).toBeNull()
    }
  })
})

// --- Task 4: Fragment balance (via store) ---

describe('Fragment balance integration', () => {
  it('getUpgradeDisplayInfo reflects affordability based on fragment count', () => {
    const infoRich = getUpgradeDisplayInfo('ATTACK_POWER', 0, 100)
    expect(infoRich.canAfford).toBe(true)

    const infoPoor = getUpgradeDisplayInfo('ATTACK_POWER', 0, 10)
    expect(infoPoor.canAfford).toBe(false)
  })

  it('exact fragment amount is affordable', () => {
    const info = getUpgradeDisplayInfo('ATTACK_POWER', 0, 50) // cost is 50
    expect(info.canAfford).toBe(true)
  })
})

// --- Task 5: Purchase flow via store ---

describe('Purchase integration via useUpgrades', () => {
  it('purchaseUpgrade succeeds and increments level', () => {
    usePlayer.setState({ fragments: 100 })
    const success = useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
    expect(success).toBe(true)
    expect(useUpgrades.getState().upgradeLevels.ATTACK_POWER).toBe(1)
  })

  it('purchaseUpgrade deducts fragments from player', () => {
    usePlayer.setState({ fragments: 100 })
    useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
    expect(usePlayer.getState().fragments).toBe(50) // 100 - 50 cost
  })

  it('purchaseUpgrade fails when not enough fragments', () => {
    usePlayer.setState({ fragments: 10 })
    const success = useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
    expect(success).toBe(false)
    expect(useUpgrades.getState().upgradeLevels.ATTACK_POWER || 0).toBe(0)
  })

  it('purchaseUpgrade fails when already maxed', () => {
    usePlayer.setState({ fragments: 10000 })
    // Purchase all 5 levels
    for (let i = 0; i < 5; i++) {
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
    }
    expect(useUpgrades.getState().upgradeLevels.ATTACK_POWER).toBe(5)

    const success = useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
    expect(success).toBe(false)
  })

  it('UI reflects new level after purchase', () => {
    usePlayer.setState({ fragments: 200 })
    useUpgrades.getState().purchaseUpgrade('ATTACK_POWER') // level 0→1, cost 50

    const level = useUpgrades.getState().upgradeLevels.ATTACK_POWER
    const fragments = usePlayer.getState().fragments
    const info = getUpgradeDisplayInfo('ATTACK_POWER', level, fragments)

    expect(info.currentLevel).toBe(1)
    expect(info.nextCost).toBe(100) // level 2 cost
    expect(info.totalBonus).toBeCloseTo(0.05)
  })
})
