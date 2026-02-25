import { describe, it, expect } from 'vitest'
import { MENU_ITEMS } from '../MainMenu.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'
import { BOONS } from '../../entities/boonDefs.js'
import { getArmoryTabData, getWeaponCardDisplayData, getBoonCardDisplayData, computeNextTab, ARMORY_TABS } from '../Armory.jsx'

// ────────────────────────────────────────────────
// MainMenu — ARMORY button (Story 25.4, Task 1)
// ────────────────────────────────────────────────

describe('MainMenu — ARMORY button (Story 25.4)', () => {
  it('MENU_ITEMS contains armory entry', () => {
    const ids = MENU_ITEMS.map(item => item.id)
    expect(ids).toContain('armory')
  })

  it('ARMORY label is correct', () => {
    const item = MENU_ITEMS.find(i => i.id === 'armory')
    expect(item?.label).toBe('ARMORY')
  })

  it('ARMORY appears after UPGRADES', () => {
    const ids = MENU_ITEMS.map(item => item.id)
    const upgradesIdx = ids.indexOf('upgrades')
    const armoryIdx = ids.indexOf('armory')
    expect(armoryIdx).toBeGreaterThan(upgradesIdx)
  })
})

// ────────────────────────────────────────────────
// Armory — weapons tab data (Story 25.4, Task 4)
// ────────────────────────────────────────────────

describe('Armory — weapons tab (Story 25.4)', () => {
  it('getArmoryTabData returns 9 enabled weapons (DIAGONALS excluded, rarityWeight:0)', () => {
    const { weaponIds } = getArmoryTabData()
    expect(weaponIds).toHaveLength(9)
    expect(weaponIds).not.toContain('DIAGONALS')
  })

  it('all weapon IDs are valid WEAPONS keys', () => {
    const { weaponIds } = getArmoryTabData()
    for (const id of weaponIds) {
      expect(WEAPONS[id]).toBeDefined()
    }
  })

  it('all weapons have name and description', () => {
    const { weaponIds } = getArmoryTabData()
    for (const id of weaponIds) {
      const def = WEAPONS[id]
      expect(typeof def.name).toBe('string')
      expect(def.name.length).toBeGreaterThan(0)
      expect(typeof def.description).toBe('string')
      expect(def.description.length).toBeGreaterThan(0)
    }
  })

  it('includes LASER_FRONT, SPREAD_SHOT, BEAM, EXPLOSIVE_ROUND', () => {
    const { weaponIds } = getArmoryTabData()
    expect(weaponIds).toContain('LASER_FRONT')
    expect(weaponIds).toContain('SPREAD_SHOT')
    expect(weaponIds).toContain('BEAM')
    expect(weaponIds).toContain('EXPLOSIVE_ROUND')
  })
})

// ────────────────────────────────────────────────
// Armory — boons tab data (Story 25.4, Task 5)
// ────────────────────────────────────────────────

describe('Armory — boons tab (Story 25.4)', () => {
  it('getArmoryTabData returns all 12 boons', () => {
    const { boonIds } = getArmoryTabData()
    expect(boonIds).toHaveLength(12)
  })

  it('all boon IDs are valid BOONS keys', () => {
    const { boonIds } = getArmoryTabData()
    for (const id of boonIds) {
      expect(BOONS[id]).toBeDefined()
    }
  })

  it('all boons have name and tier 1 description', () => {
    const { boonIds } = getArmoryTabData()
    for (const id of boonIds) {
      const def = BOONS[id]
      expect(typeof def.name).toBe('string')
      expect(def.name.length).toBeGreaterThan(0)
      expect(typeof def.tiers[0].description).toBe('string')
      expect(def.tiers[0].description.length).toBeGreaterThan(0)
    }
  })

  it('includes DAMAGE_AMP, SPEED_BOOST, CRIT_CHANCE, PICKUP_RADIUS', () => {
    const { boonIds } = getArmoryTabData()
    expect(boonIds).toContain('DAMAGE_AMP')
    expect(boonIds).toContain('SPEED_BOOST')
    expect(boonIds).toContain('CRIT_CHANCE')
    expect(boonIds).toContain('PICKUP_RADIUS')
  })
})

// ────────────────────────────────────────────────
// Armory — tabs (Story 25.4, Task 6)
// ────────────────────────────────────────────────

describe('Armory — tabs (Story 25.4)', () => {
  it('getArmoryTabData includes tabs array with Weapons and Boons', () => {
    const { tabs } = getArmoryTabData()
    expect(tabs).toContain('Weapons')
    expect(tabs).toContain('Boons')
    expect(tabs).not.toContain('Items')
  })
})

// ────────────────────────────────────────────────
// Armory — weapon card display data (Story 25.4 M1 fix)
// ────────────────────────────────────────────────

describe('Armory — WeaponCard display data (Story 25.4)', () => {
  it('discovered weapon shows real name', () => {
    const data = getWeaponCardDisplayData('LASER_FRONT', true)
    expect(data.name).toBe('Front Laser')
    expect(data.name).not.toBe('???')
  })

  it('undiscovered weapon shows ???', () => {
    const data = getWeaponCardDisplayData('LASER_FRONT', false)
    expect(data.name).toBe('???')
  })

  it('discovered weapon shows real description', () => {
    const data = getWeaponCardDisplayData('BEAM', true)
    expect(data.description).not.toBe('Undiscovered weapon')
    expect(data.description.length).toBeGreaterThan(0)
  })

  it('undiscovered weapon shows "Undiscovered weapon"', () => {
    const data = getWeaponCardDisplayData('BEAM', false)
    expect(data.description).toBe('Undiscovered weapon')
  })

  it('undiscovered weapon icon is ❓', () => {
    const data = getWeaponCardDisplayData('BEAM', false)
    expect(data.icon).toBe('❓')
  })

  it('discovered weapon icon is a non-empty string', () => {
    const data = getWeaponCardDisplayData('BEAM', true)
    expect(typeof data.icon).toBe('string')
    expect(data.icon.length).toBeGreaterThan(0)
    expect(data.icon).not.toBe('❓')
  })
})

// ────────────────────────────────────────────────
// Armory — boon card display data (Story 25.4 M1 fix)
// ────────────────────────────────────────────────

describe('Armory — BoonCard display data (Story 25.4)', () => {
  it('discovered boon shows real name', () => {
    const data = getBoonCardDisplayData('DAMAGE_AMP', true)
    expect(data.name).toBe('Damage Amp')
    expect(data.name).not.toBe('???')
  })

  it('undiscovered boon shows ???', () => {
    const data = getBoonCardDisplayData('DAMAGE_AMP', false)
    expect(data.name).toBe('???')
  })

  it('discovered boon shows tier 1 description', () => {
    const data = getBoonCardDisplayData('SPEED_BOOST', true)
    expect(data.description).not.toBe('Undiscovered boon')
    expect(data.description.length).toBeGreaterThan(0)
  })

  it('undiscovered boon shows "Undiscovered boon"', () => {
    const data = getBoonCardDisplayData('SPEED_BOOST', false)
    expect(data.description).toBe('Undiscovered boon')
  })

  it('all 12 boons have valid display data when discovered', () => {
    const { boonIds } = getArmoryTabData()
    for (const id of boonIds) {
      const data = getBoonCardDisplayData(id, true)
      expect(data.name).not.toBe('???')
      expect(data.description).not.toBe('Undiscovered boon')
      expect(data.icon).not.toBe('❓')
    }
  })
})

// ────────────────────────────────────────────────
// Armory — Tab keyboard cycling (Story 25.4 M2 fix)
// ────────────────────────────────────────────────

describe('Armory — Tab keyboard cycling (Story 25.4)', () => {
  it('ARMORY_TABS starts with Weapons and ends with Boons', () => {
    expect(ARMORY_TABS[0]).toBe('Weapons')
    expect(ARMORY_TABS[ARMORY_TABS.length - 1]).toBe('Boons')
  })

  it('Tab from Weapons goes to Boons', () => {
    expect(computeNextTab('Weapons', false)).toBe('Boons')
  })

  it('Tab from Boons wraps back to Weapons', () => {
    expect(computeNextTab('Boons', false)).toBe('Weapons')
  })

  it('Shift+Tab from Boons goes back to Weapons', () => {
    expect(computeNextTab('Boons', true)).toBe('Weapons')
  })

  it('Shift+Tab from Weapons wraps to Boons', () => {
    expect(computeNextTab('Weapons', true)).toBe('Boons')
  })
})
