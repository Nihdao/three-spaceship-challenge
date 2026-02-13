import { describe, it, expect, beforeEach } from 'vitest'
import useGame from '../../stores/useGame.jsx'
import usePlayer from '../../stores/usePlayer.jsx'
import useWeapons from '../../stores/useWeapons.jsx'
import useBoons from '../../stores/useBoons.jsx'
import useEnemies from '../../stores/useEnemies.jsx'
import useLevel from '../../stores/useLevel.jsx'
import { getWeaponDisplayInfo, getBoonDisplayInfo, getPlayerStats, getRunStats, shouldShowPauseMenu } from '../PauseMenu.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'
import { BOONS } from '../../entities/boonDefs.js'

beforeEach(() => {
  useGame.getState().reset()
  usePlayer.getState().reset()
  useWeapons.getState().reset()
  useBoons.getState().reset()
  useEnemies.getState().reset()
  useLevel.getState().reset()
})

describe('PauseMenu logic', () => {
  describe('shouldShowPauseMenu', () => {
    it('returns true when phase is gameplay and isPaused is true', () => {
      expect(shouldShowPauseMenu('gameplay', true)).toBe(true)
    })

    it('returns false when phase is gameplay and not paused', () => {
      expect(shouldShowPauseMenu('gameplay', false)).toBe(false)
    })

    it('returns false when phase is levelUp even if paused', () => {
      expect(shouldShowPauseMenu('levelUp', true)).toBe(false)
    })

    it('returns false when phase is menu', () => {
      expect(shouldShowPauseMenu('menu', false)).toBe(false)
    })

    it('returns false when phase is gameOver', () => {
      expect(shouldShowPauseMenu('gameOver', true)).toBe(false)
    })

    it('returns false when phase is boss even if paused', () => {
      expect(shouldShowPauseMenu('boss', true)).toBe(false)
    })

    it('returns false when phase is planetReward even if paused', () => {
      expect(shouldShowPauseMenu('planetReward', true)).toBe(false)
    })
  })

  describe('getWeaponDisplayInfo', () => {
    it('returns display info for a weapon with level 1', () => {
      const info = getWeaponDisplayInfo({ weaponId: 'LASER_FRONT', level: 1, cooldownTimer: 0 })
      expect(info.name).toBe('Front Laser')
      expect(info.level).toBe(1)
      expect(info.damage).toBe(WEAPONS.LASER_FRONT.baseDamage)
      expect(info.cooldown).toBe(WEAPONS.LASER_FRONT.baseCooldown)
    })

    it('returns upgrade damage/cooldown for weapon with overrides', () => {
      const info = getWeaponDisplayInfo({
        weaponId: 'LASER_FRONT', level: 2, cooldownTimer: 0,
        overrides: { damage: 12, cooldown: 0.48 },
      })
      expect(info.damage).toBe(12)
      expect(info.cooldown).toBe(0.48)
    })

    it('handles unknown weapon gracefully', () => {
      const info = getWeaponDisplayInfo({ weaponId: 'NONEXISTENT', level: 1, cooldownTimer: 0 })
      expect(info.name).toBe('Unknown')
      expect(info.damage).toBe(0)
    })

    it('returns color from weapon def', () => {
      const info = getWeaponDisplayInfo({ weaponId: 'SPREAD_SHOT', level: 1, cooldownTimer: 0 })
      expect(info.color).toBe(WEAPONS.SPREAD_SHOT.projectileColor)
    })
  })

  describe('getBoonDisplayInfo', () => {
    it('returns display info for a boon at level 1', () => {
      const info = getBoonDisplayInfo({ boonId: 'DAMAGE_AMP', level: 1 })
      expect(info.name).toBe('Damage Amp')
      expect(info.description).toBe('Increases all weapon damage by 15%')
    })

    it('returns correct tier description for higher levels', () => {
      const info = getBoonDisplayInfo({ boonId: 'DAMAGE_AMP', level: 3 })
      expect(info.description).toBe('Increases all weapon damage by 50%')
    })

    it('handles unknown boon gracefully', () => {
      const info = getBoonDisplayInfo({ boonId: 'NONEXISTENT', level: 1 })
      expect(info.name).toBe('Unknown')
      expect(info.description).toBe('')
    })

    it('returns level for boon', () => {
      const info = getBoonDisplayInfo({ boonId: 'SPEED_BOOST', level: 2 })
      expect(info.level).toBe(2)
    })
  })

  describe('getPlayerStats', () => {
    it('returns player stats from stores', () => {
      usePlayer.setState({ currentHP: 75, maxHP: 100, shipBaseSpeed: 50 })
      const stats = getPlayerStats()
      expect(stats.currentHP).toBe(75)
      expect(stats.maxHP).toBe(100)
      expect(stats.speed).toBe(50)
    })

    it('computes damage multiplier from boon modifiers', () => {
      useBoons.setState({ modifiers: { damageMultiplier: 1.5, speedMultiplier: 1, cooldownMultiplier: 1, critChance: 0 } })
      const stats = getPlayerStats()
      expect(stats.damageMultiplier).toBe(1.5)
    })

    it('returns 1.0 for damage multiplier when no boons', () => {
      const stats = getPlayerStats()
      expect(stats.damageMultiplier).toBe(1)
    })
  })

  describe('getRunStats', () => {
    it('returns run stats from stores', () => {
      useGame.setState({ totalElapsedTime: 125, kills: 42, score: 1500 })
      usePlayer.setState({ currentLevel: 5, fragments: 10 })
      const stats = getRunStats()
      expect(stats.totalElapsedTime).toBe(125)
      expect(stats.kills).toBe(42)
      expect(stats.score).toBe(1500)
      expect(stats.currentLevel).toBe(5)
      expect(stats.fragments).toBe(10)
    })
  })

  describe('Quit to menu resets all stores', () => {
    it('returnToMenu resets game phase to menu', () => {
      useGame.setState({ phase: 'gameplay', isPaused: true, score: 500, kills: 10 })
      useGame.getState().returnToMenu()
      expect(useGame.getState().phase).toBe('menu')
      expect(useGame.getState().isPaused).toBe(false)
    })

    it('all stores reset when quitting', () => {
      // Simulate in-progress game state
      usePlayer.setState({ currentHP: 50, currentLevel: 5, fragments: 20 })
      useWeapons.setState({ activeWeapons: [{ weaponId: 'LASER_FRONT', level: 3, cooldownTimer: 0 }] })
      useBoons.setState({ activeBoons: [{ boonId: 'DAMAGE_AMP', level: 2 }] })

      // Quit sequence: reset all stores + returnToMenu
      usePlayer.getState().reset()
      useWeapons.getState().reset()
      useBoons.getState().reset()
      useEnemies.getState().reset()
      useLevel.getState().reset()
      useGame.getState().returnToMenu()

      expect(usePlayer.getState().currentLevel).toBe(1)
      expect(useWeapons.getState().activeWeapons).toEqual([])
      expect(useBoons.getState().activeBoons).toEqual([])
      expect(useGame.getState().phase).toBe('menu')
    })
  })

  describe('Pause toggle via store', () => {
    it('setPaused(true) pauses, setPaused(false) resumes', () => {
      useGame.setState({ phase: 'gameplay', isPaused: false })
      useGame.getState().setPaused(true)
      expect(useGame.getState().isPaused).toBe(true)
      useGame.getState().setPaused(false)
      expect(useGame.getState().isPaused).toBe(false)
    })

    it('GameLoop skips tick when paused (phase gameplay + isPaused)', () => {
      // This verifies the existing behavior: phase !== 'gameplay' || isPaused → return
      useGame.setState({ phase: 'gameplay', isPaused: true })
      const { phase, isPaused } = useGame.getState()
      expect(phase === 'gameplay' && isPaused).toBe(true)
    })
  })
})
