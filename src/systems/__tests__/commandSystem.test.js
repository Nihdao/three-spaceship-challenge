import { describe, it, expect, beforeEach } from 'vitest'
import { executeCommand } from '../commandSystem.js'
import usePlayer from '../../stores/usePlayer.jsx'
import useWeapons from '../../stores/useWeapons.jsx'
import useBoons from '../../stores/useBoons.jsx'
import useEnemies from '../../stores/useEnemies.jsx'
import useGame from '../../stores/useGame.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { WEAPONS } from '../../entities/weaponDefs.js'
import { BOONS } from '../../entities/boonDefs.js'

describe('commandSystem — executeCommand', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
    useWeapons.getState().reset()
    useBoons.getState().reset()
    useEnemies.getState().reset()
    useGame.getState().reset()
    // Initialize default weapon for tests
    useWeapons.getState().initializeWeapons()
  })

  describe('unknown command', () => {
    it('returns error for unknown command', () => {
      const result = executeCommand('foobar')
      expect(result.success).toBe(false)
      expect(result.message).toContain('Unknown command')
    })
  })

  describe('help', () => {
    it('lists available commands', () => {
      const result = executeCommand('help')
      expect(result.success).toBe(true)
      expect(result.message).toContain('addxp')
      expect(result.message).toContain('help')
      expect(result.message).toContain('spawn')
    })
  })

  describe('addxp', () => {
    it('adds XP to player', () => {
      const result = executeCommand('addxp 50')
      expect(result.success).toBe(true)
      expect(usePlayer.getState().currentXP).toBe(50)
    })

    it('returns error for invalid amount', () => {
      const result = executeCommand('addxp abc')
      expect(result.success).toBe(false)
    })

    it('returns error for negative amount', () => {
      const result = executeCommand('addxp -10')
      expect(result.success).toBe(false)
    })

    it('triggers level-up when XP exceeds threshold', () => {
      executeCommand(`addxp ${GAME_CONFIG.XP_LEVEL_CURVE[0] + 1}`)
      expect(usePlayer.getState().currentLevel).toBeGreaterThan(1)
    })
  })

  describe('setlevel', () => {
    it('sets player level', () => {
      const result = executeCommand('setlevel 5')
      expect(result.success).toBe(true)
      expect(usePlayer.getState().currentLevel).toBe(5)
    })

    it('returns error for invalid level', () => {
      const result = executeCommand('setlevel 0')
      expect(result.success).toBe(false)
    })

    it('clamps to max level', () => {
      executeCommand('setlevel 999')
      const state = usePlayer.getState()
      expect(state.currentLevel).toBeLessThanOrEqual(GAME_CONFIG.XP_LEVEL_CURVE.length + 1)
    })
  })

  describe('godmode', () => {
    it('enables invulnerability', () => {
      const result = executeCommand('godmode')
      expect(result.success).toBe(true)
      expect(result.message).toContain('ENABLED')
      expect(usePlayer.getState().isInvulnerable).toBe(true)
      expect(usePlayer.getState()._godMode).toBe(true)
    })

    it('disables on second call (proper toggle)', () => {
      executeCommand('godmode')
      expect(usePlayer.getState()._godMode).toBe(true)
      const result = executeCommand('godmode')
      expect(result.success).toBe(true)
      expect(result.message).toContain('DISABLED')
      expect(usePlayer.getState()._godMode).toBe(false)
      expect(usePlayer.getState().isInvulnerable).toBe(false)
    })

    it('toggles correctly even during damage i-frames', () => {
      // Simulate taking damage (i-frames active)
      usePlayer.setState({ isInvulnerable: true, invulnerabilityTimer: 0.5 })
      const result = executeCommand('godmode')
      expect(result.message).toContain('ENABLED')
      expect(usePlayer.getState()._godMode).toBe(true)
      // Toggle off
      const result2 = executeCommand('godmode')
      expect(result2.message).toContain('DISABLED')
      expect(usePlayer.getState()._godMode).toBe(false)
    })
  })

  describe('sethp', () => {
    it('sets current HP', () => {
      const result = executeCommand('sethp 50')
      expect(result.success).toBe(true)
      expect(usePlayer.getState().currentHP).toBe(50)
    })

    it('clamps to maxHP', () => {
      const maxHP = usePlayer.getState().maxHP
      executeCommand(`sethp ${maxHP + 100}`)
      expect(usePlayer.getState().currentHP).toBe(maxHP)
    })

    it('returns error for invalid input', () => {
      const result = executeCommand('sethp abc')
      expect(result.success).toBe(false)
    })
  })

  describe('setmaxhp', () => {
    it('sets max HP and clamps current HP', () => {
      executeCommand('setmaxhp 200')
      expect(usePlayer.getState().maxHP).toBe(200)
    })

    it('adjusts currentHP down if exceeds new maxHP', () => {
      usePlayer.setState({ currentHP: 100, maxHP: 100 })
      executeCommand('setmaxhp 50')
      expect(usePlayer.getState().currentHP).toBe(50)
      expect(usePlayer.getState().maxHP).toBe(50)
    })
  })

  describe('spawn', () => {
    it('spawns enemies near player', () => {
      const result = executeCommand('spawn FODDER_BASIC 3')
      expect(result.success).toBe(true)
      expect(useEnemies.getState().enemies.length).toBe(3)
    })

    it('returns error for unknown enemy type', () => {
      const result = executeCommand('spawn INVALID_TYPE')
      expect(result.success).toBe(false)
      expect(result.message).toContain('Unknown enemy')
    })

    it('defaults to count of 1', () => {
      executeCommand('spawn FODDER_BASIC')
      expect(useEnemies.getState().enemies.length).toBe(1)
    })

    it('rejects count > 50', () => {
      const result = executeCommand('spawn FODDER_BASIC 51')
      expect(result.success).toBe(false)
    })
  })

  describe('killall', () => {
    it('clears all enemies', () => {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 10)
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 20, 20)
      expect(useEnemies.getState().enemies.length).toBe(2)

      const result = executeCommand('killall')
      expect(result.success).toBe(true)
      expect(useEnemies.getState().enemies.length).toBe(0)
    })
  })

  describe('spawnwave', () => {
    it('spawns a wave of enemies', () => {
      const result = executeCommand('spawnwave 2')
      expect(result.success).toBe(true)
      expect(useEnemies.getState().enemies.length).toBeGreaterThan(0)
    })
  })

  describe('stopspawn / resumespawn', () => {
    it('sets debug spawn paused flag', () => {
      executeCommand('stopspawn')
      expect(useGame.getState()._debugSpawnPaused).toBe(true)

      executeCommand('resumespawn')
      expect(useGame.getState()._debugSpawnPaused).toBe(false)
    })
  })

  describe('addweapon', () => {
    it('adds weapon to player inventory', () => {
      const result = executeCommand('addweapon SPREAD_SHOT')
      expect(result.success).toBe(true)
      const weapons = useWeapons.getState().activeWeapons
      expect(weapons.some(w => w.weaponId === 'SPREAD_SHOT')).toBe(true)
    })

    it('returns error for unknown weapon', () => {
      const result = executeCommand('addweapon INVALID')
      expect(result.success).toBe(false)
    })

    it('returns error when slots full', () => {
      // Already have LASER_FRONT from initializeWeapons
      executeCommand('addweapon SPREAD_SHOT')
      executeCommand('addweapon MISSILE_HOMING')
      executeCommand('addweapon PLASMA_BOLT')
      // Now slots are full (4/4)
      const result = executeCommand('addweapon RAILGUN')
      expect(result.success).toBe(false)
      expect(result.message).toContain('full')
    })
  })

  describe('setweaponlevel', () => {
    it('upgrades weapon level', () => {
      const result = executeCommand('setweaponlevel 0 5')
      expect(result.success).toBe(true)
      expect(useWeapons.getState().activeWeapons[0].level).toBe(5)
    })

    it('returns error for invalid slot', () => {
      const result = executeCommand('setweaponlevel 10 5')
      expect(result.success).toBe(false)
    })
  })

  describe('removeweapon', () => {
    it('removes weapon from slot', () => {
      executeCommand('addweapon SPREAD_SHOT')
      const before = useWeapons.getState().activeWeapons.length
      executeCommand('removeweapon 1')
      expect(useWeapons.getState().activeWeapons.length).toBe(before - 1)
    })
  })

  describe('addboon', () => {
    it('adds boon to player', () => {
      const firstBoon = Object.keys(BOONS)[0]
      const result = executeCommand(`addboon ${firstBoon}`)
      expect(result.success).toBe(true)
      expect(useBoons.getState().activeBoons.length).toBe(1)
    })

    it('returns error for unknown boon', () => {
      const result = executeCommand('addboon INVALID')
      expect(result.success).toBe(false)
    })

    it('returns error when slots full', () => {
      const boonIds = Object.keys(BOONS)
      executeCommand(`addboon ${boonIds[0]}`)
      executeCommand(`addboon ${boonIds[1]}`)
      executeCommand(`addboon ${boonIds[2]}`)
      const result = executeCommand(`addboon ${boonIds[3]}`)
      expect(result.success).toBe(false)
      expect(result.message).toContain('full')
    })
  })

  describe('setboonlevel', () => {
    it('upgrades boon level', () => {
      const firstBoon = Object.keys(BOONS)[0]
      executeCommand(`addboon ${firstBoon}`)
      const result = executeCommand('setboonlevel 0 3')
      expect(result.success).toBe(true)
    })
  })

  describe('removeboon', () => {
    it('removes boon from slot', () => {
      const firstBoon = Object.keys(BOONS)[0]
      executeCommand(`addboon ${firstBoon}`)
      expect(useBoons.getState().activeBoons.length).toBe(1)
      executeCommand('removeboon 0')
      expect(useBoons.getState().activeBoons.length).toBe(0)
    })
  })

  describe('listweapons', () => {
    it('lists all weapon IDs', () => {
      const result = executeCommand('listweapons')
      expect(result.success).toBe(true)
      for (const id of Object.keys(WEAPONS)) {
        expect(result.message).toContain(id)
      }
    })
  })

  describe('listboons', () => {
    it('lists all boon IDs', () => {
      const result = executeCommand('listboons')
      expect(result.success).toBe(true)
      for (const id of Object.keys(BOONS)) {
        expect(result.message).toContain(id)
      }
    })
  })

  describe('listenemies', () => {
    it('lists all enemy types', () => {
      const result = executeCommand('listenemies')
      expect(result.success).toBe(true)
      expect(result.message).toContain('FODDER_BASIC')
      expect(result.message).toContain('FODDER_TANK')
    })
  })

  describe('clearconsole', () => {
    it('returns __CLEAR__ message', () => {
      const result = executeCommand('clearconsole')
      expect(result.success).toBe(true)
      expect(result.message).toBe('__CLEAR__')
    })
  })

  describe('addscore', () => {
    it('adds score points', () => {
      executeCommand('addscore 500')
      expect(useGame.getState().score).toBe(500)
    })
  })

  describe('addfragments', () => {
    it('adds fragments directly', () => {
      executeCommand('addfragments 100')
      expect(usePlayer.getState().fragments).toBe(100)
    })
  })

  describe('grid', () => {
    it('toggles debug grid flag on useGame store', () => {
      expect(useGame.getState()._debugGrid).toBeFalsy()

      const result1 = executeCommand('grid')
      expect(result1.success).toBe(true)
      expect(result1.message).toContain('ENABLED')
      expect(useGame.getState()._debugGrid).toBe(true)

      const result2 = executeCommand('grid')
      expect(result2.success).toBe(true)
      expect(result2.message).toContain('DISABLED')
      expect(useGame.getState()._debugGrid).toBe(false)
    })

    it('is cleared on store reset', () => {
      executeCommand('grid')
      expect(useGame.getState()._debugGrid).toBe(true)
      useGame.getState().reset()
      expect(useGame.getState()._debugGrid).toBe(false)
    })
  })

  describe('case insensitivity', () => {
    it('handles uppercase command names', () => {
      const result = executeCommand('HELP')
      expect(result.success).toBe(true)
    })

    it('handles mixed case command names', () => {
      const result = executeCommand('AddXP 10')
      expect(result.success).toBe(true)
    })
  })
})
