import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

const noInput = { moveLeft: false, moveRight: false, moveForward: false, moveBackward: false }

describe('usePlayer — Story 11.4 boon effects', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  // --- HP Regeneration ---

  describe('HP regeneration (hpRegenRate param in tick)', () => {
    it('regenerates HP when hpRegenRate > 0 and HP below max', () => {
      usePlayer.getState().takeDamage(30)
      // Expire invulnerability/cooldown first
      usePlayer.getState().tick(1.0, noInput, 1, GAME_CONFIG.PLAY_AREA_SIZE, 0)
      const hpBefore = usePlayer.getState().currentHP
      usePlayer.getState().tick(1.0, noInput, 1, GAME_CONFIG.PLAY_AREA_SIZE, 2.0)
      expect(usePlayer.getState().currentHP).toBeCloseTo(hpBefore + 2.0, 1)
    })

    it('does not regenerate past maxHP', () => {
      usePlayer.getState().takeDamage(5)
      usePlayer.getState().tick(1.0, noInput, 1, GAME_CONFIG.PLAY_AREA_SIZE, 0)
      // Try to regen 10 HP/sec for 1 second, but only 5 HP missing
      usePlayer.getState().tick(1.0, noInput, 1, GAME_CONFIG.PLAY_AREA_SIZE, 10.0)
      expect(usePlayer.getState().currentHP).toBe(usePlayer.getState().maxHP)
    })

    it('does not regenerate when HP is at max', () => {
      const maxHP = usePlayer.getState().maxHP
      usePlayer.getState().tick(1.0, noInput, 1, GAME_CONFIG.PLAY_AREA_SIZE, 5.0)
      expect(usePlayer.getState().currentHP).toBe(maxHP)
    })

    it('does not regenerate when HP is 0 (dead)', () => {
      usePlayer.setState({ currentHP: 0 })
      usePlayer.getState().tick(1.0, noInput, 1, GAME_CONFIG.PLAY_AREA_SIZE, 5.0)
      expect(usePlayer.getState().currentHP).toBe(0)
    })

    it('does not regenerate when hpRegenRate is 0', () => {
      usePlayer.getState().takeDamage(30)
      usePlayer.getState().tick(1.0, noInput, 1, GAME_CONFIG.PLAY_AREA_SIZE, 0)
      const hpBefore = usePlayer.getState().currentHP
      usePlayer.getState().tick(1.0, noInput, 1, GAME_CONFIG.PLAY_AREA_SIZE, 0)
      expect(usePlayer.getState().currentHP).toBe(hpBefore)
    })
  })

  // --- Damage Reduction ---

  describe('damage reduction (damageReduction param in takeDamage)', () => {
    it('reduces incoming damage by percentage', () => {
      usePlayer.getState().takeDamage(100, 0.25)
      expect(usePlayer.getState().currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP - 75)
    })

    it('applies no reduction when damageReduction is 0', () => {
      usePlayer.getState().takeDamage(30, 0)
      expect(usePlayer.getState().currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP - 30)
    })

    it('applies default 0 reduction when param omitted', () => {
      usePlayer.getState().takeDamage(30)
      expect(usePlayer.getState().currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP - 30)
    })

    it('HP does not go below 0 with reduction', () => {
      usePlayer.getState().takeDamage(200, 0.10)
      expect(usePlayer.getState().currentHP).toBe(0)
    })
  })

  // --- Max HP Bonus ---

  describe('applyMaxHPBonus', () => {
    it('increases maxHP and currentHP by bonus delta', () => {
      const baseMHP = usePlayer.getState().maxHP
      const baseCHP = usePlayer.getState().currentHP
      usePlayer.getState().applyMaxHPBonus(20)
      expect(usePlayer.getState().maxHP).toBe(baseMHP + 20)
      expect(usePlayer.getState().currentHP).toBe(baseCHP + 20)
    })

    it('increases correctly when upgrading from 20 to 50', () => {
      usePlayer.getState().applyMaxHPBonus(20)
      const mhpAfter20 = usePlayer.getState().maxHP
      usePlayer.getState().applyMaxHPBonus(50)
      expect(usePlayer.getState().maxHP).toBe(mhpAfter20 + 30) // delta of 30
    })

    it('applies at low HP — currentHP also increases', () => {
      usePlayer.getState().takeDamage(50)
      usePlayer.getState().tick(1.0, noInput) // clear cooldowns
      const hpBefore = usePlayer.getState().currentHP
      usePlayer.getState().applyMaxHPBonus(20)
      expect(usePlayer.getState().currentHP).toBe(hpBefore + 20)
    })

    it('does nothing when bonus is unchanged', () => {
      usePlayer.getState().applyMaxHPBonus(20)
      const mhp = usePlayer.getState().maxHP
      const chp = usePlayer.getState().currentHP
      usePlayer.getState().applyMaxHPBonus(20) // same value
      expect(usePlayer.getState().maxHP).toBe(mhp)
      expect(usePlayer.getState().currentHP).toBe(chp)
    })

    it('reset clears _appliedMaxHPBonus', () => {
      usePlayer.getState().applyMaxHPBonus(50)
      usePlayer.getState().reset()
      expect(usePlayer.getState()._appliedMaxHPBonus).toBe(0)
      expect(usePlayer.getState().maxHP).toBe(GAME_CONFIG.PLAYER_BASE_HP)
    })
  })
})
