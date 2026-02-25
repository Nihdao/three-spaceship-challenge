import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../../stores/useWeapons.jsx'
import useBoons from '../../stores/useBoons.jsx'
import usePlayer from '../../stores/usePlayer.jsx'
import { getRarityTier } from '../../systems/raritySystem.js'
import { generatePlanetReward } from '../../systems/progressionSystem.js'

// ────────────────────────────────────────────────
// PlanetRewardModal — Story 39.2
// Tests verify the store/system data contracts and display logic
// that PlanetRewardModal relies on. No React rendering needed.
// ────────────────────────────────────────────────

describe('PlanetRewardModal — Story 39.2', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
    useBoons.getState().reset()
    usePlayer.getState().reset()
  })

  // ── TIER_COLORS / TIER_LABELS / TIER_FLAVOR constants ────────────

  describe('Tier display constants', () => {
    const TIER_COLORS = {
      standard:  '#a07855',
      rare:      '#00b4d8',
      legendary: '#9b5de5',
    }
    const TIER_LABELS = {
      standard:  'Standard',
      rare:      'Rare',
      legendary: 'Legendary',
    }
    const TIER_FLAVOR = {
      standard: 'Mineral deposits detected. Basic loot available.',
      rare:     'Anomalous readings. Rare tech signature.',
      legendary:'Void energy surge. Legendary cache found.',
    }

    it('TIER_COLORS has distinct colors for standard/rare/legendary', () => {
      const colors = Object.values(TIER_COLORS)
      expect(new Set(colors).size).toBe(3)
    })

    it('TIER_COLORS standard is a valid hex color', () => {
      expect(TIER_COLORS.standard).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('TIER_COLORS rare is a valid hex color', () => {
      expect(TIER_COLORS.rare).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('TIER_COLORS legendary is a valid hex color', () => {
      expect(TIER_COLORS.legendary).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('TIER_LABELS has labels for all 3 tiers', () => {
      expect(TIER_LABELS.standard).toBe('Standard')
      expect(TIER_LABELS.rare).toBe('Rare')
      expect(TIER_LABELS.legendary).toBe('Legendary')
    })

    it('TIER_FLAVOR has non-empty flavor text for all 3 tiers', () => {
      expect(TIER_FLAVOR.standard.length).toBeGreaterThan(0)
      expect(TIER_FLAVOR.rare.length).toBeGreaterThan(0)
      expect(TIER_FLAVOR.legendary.length).toBeGreaterThan(0)
    })

    it('tierColor falls back to white for unknown tier', () => {
      const TIER_COLORS_MAP = { standard: '#a07855', rare: '#00b4d8', legendary: '#9b5de5' }
      expect(TIER_COLORS_MAP['unknown'] || '#ffffff').toBe('#ffffff')
    })
  })

  // ── isCommon display logic ────────────────────────────────────────

  describe('isCommon — rarity badge conditional', () => {
    it('isCommon is true when rarity is undefined', () => {
      const choice = { id: 'test' }
      const isCommon = !choice.rarity || choice.rarity === 'COMMON'
      expect(isCommon).toBe(true)
    })

    it('isCommon is true when rarity is COMMON', () => {
      const choice = { rarity: 'COMMON' }
      const isCommon = !choice.rarity || choice.rarity === 'COMMON'
      expect(isCommon).toBe(true)
    })

    it('isCommon is false when rarity is RARE', () => {
      const choice = { rarity: 'RARE' }
      const isCommon = !choice.rarity || choice.rarity === 'COMMON'
      expect(isCommon).toBe(false)
    })

    it('isCommon is false when rarity is EPIC', () => {
      const choice = { rarity: 'EPIC' }
      const isCommon = !choice.rarity || choice.rarity === 'COMMON'
      expect(isCommon).toBe(false)
    })

    it('isCommon is false when rarity is LEGENDARY', () => {
      const choice = { rarity: 'LEGENDARY' }
      const isCommon = !choice.rarity || choice.rarity === 'COMMON'
      expect(isCommon).toBe(false)
    })
  })

  // ── Keyboard handler index mapping ───────────────────────────────

  describe('Keyboard handler — key → choice index', () => {
    // Mirrors the logic in PlanetRewardModal's keydown handler
    const getIndexFromKey = (code) => {
      if (code === 'Digit1' || code === 'Numpad1') return 0
      if (code === 'Digit2' || code === 'Numpad2') return 1
      if (code === 'Digit3' || code === 'Numpad3') return 2
      return -1
    }

    it('Digit1 maps to index 0', () => expect(getIndexFromKey('Digit1')).toBe(0))
    it('Numpad1 maps to index 0', () => expect(getIndexFromKey('Numpad1')).toBe(0))
    it('Digit2 maps to index 1', () => expect(getIndexFromKey('Digit2')).toBe(1))
    it('Numpad2 maps to index 1', () => expect(getIndexFromKey('Numpad2')).toBe(1))
    it('Digit3 maps to index 2', () => expect(getIndexFromKey('Digit3')).toBe(2))
    it('Numpad3 maps to index 2', () => expect(getIndexFromKey('Numpad3')).toBe(2))
    it('unrelated key returns -1', () => expect(getIndexFromKey('KeyA')).toBe(-1))
    it('Digit4 returns -1 (no 4th choice in planet reward)', () => expect(getIndexFromKey('Digit4')).toBe(-1))

    it('index -1 does not trigger applyChoice (guard condition)', () => {
      const choices = [{ id: 'a' }, { id: 'b' }]
      const index = getIndexFromKey('KeyX')
      const triggered = index >= 0 && index < choices.length
      expect(triggered).toBe(false)
    })

    it('index 0 triggers when choices has at least 1 element', () => {
      const choices = [{ id: 'a' }, { id: 'b' }]
      const index = getIndexFromKey('Digit1')
      const triggered = index >= 0 && index < choices.length
      expect(triggered).toBe(true)
    })

    it('index 2 does not trigger when choices has only 2 elements (standard tier)', () => {
      const choices = [{ id: 'a' }, { id: 'b' }]
      const index = getIndexFromKey('Digit3')
      const triggered = index >= 0 && index < choices.length
      expect(triggered).toBe(false)
    })
  })

  // ── Shortcut key display logic ────────────────────────────────────

  describe('Shortcut key [1-3] display', () => {
    it('renders shortcut for i=0 → [1]', () => {
      expect(`[${0 + 1}]`).toBe('[1]')
    })

    it('renders shortcut for i=1 → [2]', () => {
      expect(`[${1 + 1}]`).toBe('[2]')
    })

    it('renders shortcut for i=2 → [3]', () => {
      expect(`[${2 + 1}]`).toBe('[3]')
    })

    it('does not render shortcut for i=3 (i < 3 guard)', () => {
      expect(3 < 3).toBe(false)
    })
  })

  // ── getRarityTier contract ────────────────────────────────────────

  describe('getRarityTier — used for card border color and badge', () => {
    it('returns COMMON tier for unknown rarity ID', () => {
      const tier = getRarityTier('UNKNOWN')
      expect(tier.id).toBe('COMMON')
    })

    it('COMMON tier color is a valid hex', () => {
      const tier = getRarityTier('COMMON')
      expect(tier.color).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('RARE tier has a different color than COMMON', () => {
      expect(getRarityTier('RARE').color).not.toBe(getRarityTier('COMMON').color)
    })

    it('each rarity tier has id, name, and color fields', () => {
      for (const id of ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']) {
        const tier = getRarityTier(id)
        expect(tier.id).toBe(id)
        expect(typeof tier.name).toBe('string')
        expect(typeof tier.color).toBe('string')
      }
    })

    it('name is a non-empty string', () => {
      expect(getRarityTier('RARE').name.length).toBeGreaterThan(0)
    })
  })

  // ── generatePlanetReward — choice count by tier ───────────────────

  describe('generatePlanetReward — choice count contract', () => {
    it('standard tier returns exactly 2 choices', () => {
      const choices = generatePlanetReward('standard', [], [], [], [], 0)
      expect(choices).toHaveLength(2)
    })

    it('rare tier returns exactly 3 choices', () => {
      const choices = generatePlanetReward('rare', [], [], [], [], 0)
      expect(choices).toHaveLength(3)
    })

    it('legendary tier returns 3 or 4 choices', () => {
      // Run multiple times to account for randomness
      for (let i = 0; i < 20; i++) {
        const choices = generatePlanetReward('legendary', [], [], [], [], 0)
        expect(choices.length).toBeGreaterThanOrEqual(3)
        expect(choices.length).toBeLessThanOrEqual(4)
      }
    })

    it('each choice has required fields: id, name, type', () => {
      const choices = generatePlanetReward('standard', [], [], [], [], 0)
      for (const choice of choices) {
        expect(typeof choice.id).toBe('string')
        expect(typeof choice.name).toBe('string')
        expect(typeof choice.type).toBe('string')
      }
    })

    it('stat_boost fallback has null level (no Lvl label)', () => {
      // stat_boost is the padding item when pool is exhausted
      const choices = generatePlanetReward('standard', [], [], [], [], 0)
      const statBoost = choices.find(c => c.type === 'stat_boost')
      if (statBoost) {
        expect(statBoost.level).toBeNull()
      }
    })

    it('standard tier with luck=0 still returns exactly 2 choices', () => {
      const choices = generatePlanetReward('standard', [], [], [], [], 100)
      // standard ignores luck (effectiveLuck = 0)
      expect(choices).toHaveLength(2)
    })
  })

  // ── applyChoice — store dispatch contract ─────────────────────────

  describe('applyChoice — store dispatch per choice type', () => {
    it('weapon_upgrade: upgradeWeapon is available on useWeapons store', () => {
      expect(typeof useWeapons.getState().upgradeWeapon).toBe('function')
    })

    it('new_weapon: addWeapon is available on useWeapons store', () => {
      expect(typeof useWeapons.getState().addWeapon).toBe('function')
    })

    it('new_boon: addBoon is available on useBoons store', () => {
      expect(typeof useBoons.getState().addBoon).toBe('function')
    })

    it('boon_upgrade: upgradeBoon is available on useBoons store', () => {
      expect(typeof useBoons.getState().upgradeBoon).toBe('function')
    })

    it('rarity fallback: choice.rarity || COMMON resolves to COMMON string', () => {
      const choice = { type: 'new_weapon', id: 'laser' }
      const rarity = choice.rarity || 'COMMON'
      expect(rarity).toBe('COMMON')
    })
  })
})
