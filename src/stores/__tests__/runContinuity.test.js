import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import useWeapons from '../useWeapons.jsx'
import useBoons from '../useBoons.jsx'
import useEnemies from '../useEnemies.jsx'
import useGame from '../useGame.jsx'
import useLevel from '../useLevel.jsx'
import useBoss from '../useBoss.jsx'
import { resetOrbs, spawnOrb, getActiveCount as getOrbCount } from '../../systems/xpOrbSystem.js'
import { createSpawnSystem } from '../../systems/spawnSystem.js'
import { createProjectileSystem } from '../../systems/projectileSystem.js'
import { resetParticles, addExplosion, getActiveCount as getParticleCount } from '../../systems/particleSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

/**
 * Story 18.4: Run Continuity & State Management
 * Comprehensive integration tests proving run-persistent vs system-specific state classification.
 * These tests validate the complete state management across system transitions and full game resets.
 */

// Simulates the complete system transition as executed in production code
// TunnelHub calls advanceSystem + resetForNewSystem BEFORE phase change
// GameLoop clears entity pools AFTER phase change
function simulateFullSystemTransition(spawnSystem, projectileSystem) {
  // Step 1: TunnelHub.executeSystemTransition (before phase change)
  useLevel.getState().advanceSystem()
  usePlayer.getState().resetForNewSystem()

  // Step 2: GameLoop transition block (after phase = 'systemEntry' or 'gameplay')
  useEnemies.getState().reset()
  useWeapons.getState().clearProjectiles()
  useBoss.getState().reset()
  spawnSystem.reset()
  projectileSystem.reset()
  resetParticles()
  resetOrbs()

  // Accumulate time before resetting
  const prevSystemTime = useGame.getState().systemTimer
  if (prevSystemTime > 0) useGame.getState().accumulateTime(prevSystemTime)
  useGame.getState().setSystemTimer(0)

  // Initialize planets for new system
  useLevel.getState().initializePlanets()
}

describe('Story 18.4 — Run Continuity & State Management', () => {
  let spawnSystem
  let projectileSystem

  beforeEach(() => {
    // Full clean slate before each test
    usePlayer.getState().reset()
    useWeapons.getState().initializeWeapons()
    useBoons.getState().reset()
    useEnemies.getState().reset()
    useGame.getState().startGameplay()
    useLevel.getState().reset()
    useBoss.getState().reset()
    resetOrbs()
    resetParticles()
    spawnSystem = createSpawnSystem()
    projectileSystem = createProjectileSystem()
  })

  describe('AC #1: resetForNewSystem preserves run-persistent fields (Task 6.2-6.3)', () => {
    it('preserves XP/Level progression fields', () => {
      // Set up player with XP progress
      usePlayer.setState({
        currentLevel: 8,
        currentXP: 150,
        xpToNextLevel: 700,
        pendingLevelUps: 2,
        levelsGainedThisBatch: 1,
      })

      usePlayer.getState().resetForNewSystem()

      const p = usePlayer.getState()
      expect(p.currentLevel).toBe(8)
      expect(p.currentXP).toBe(150)
      expect(p.xpToNextLevel).toBe(700)
      expect(p.pendingLevelUps).toBe(2)
      expect(p.levelsGainedThisBatch).toBe(1)
    })

    it('preserves HP state', () => {
      usePlayer.setState({
        currentHP: 45,
        maxHP: 120,
        _appliedMaxHPBonus: 20,
      })

      usePlayer.getState().resetForNewSystem()

      const p = usePlayer.getState()
      expect(p.currentHP).toBe(45)
      expect(p.maxHP).toBe(120)
      expect(p._appliedMaxHPBonus).toBe(20)
    })

    it('preserves fragments and tunnel progression', () => {
      usePlayer.setState({
        fragments: 150,
        permanentUpgrades: { ATK_1: true, SPD_1: true },
        acceptedDilemmas: ['HIGH_RISK', 'SPEED_DEMON'],
        upgradeStats: { damageMult: 1.2, speedMult: 1.1, hpMaxBonus: 20, cooldownMult: 1.0, fragmentMult: 1.0 },
        dilemmaStats: { damageMult: 1.3, speedMult: 1.2, hpMaxMult: 0.8, cooldownMult: 0.9 },
      })

      usePlayer.getState().resetForNewSystem()

      const p = usePlayer.getState()
      expect(p.fragments).toBe(150)
      expect(p.permanentUpgrades).toEqual({ ATK_1: true, SPD_1: true })
      expect(p.acceptedDilemmas).toEqual(['HIGH_RISK', 'SPEED_DEMON'])
      expect(p.upgradeStats).toEqual({ damageMult: 1.2, speedMult: 1.1, hpMaxBonus: 20, cooldownMult: 1.0, fragmentMult: 1.0 })
      expect(p.dilemmaStats).toEqual({ damageMult: 1.3, speedMult: 1.2, hpMaxMult: 0.8, cooldownMult: 0.9 })
    })

    it('preserves ship selection', () => {
      usePlayer.setState({
        currentShipId: 'SHIP_INTERCEPTOR',
        shipBaseSpeed: 120,
        shipBaseDamageMultiplier: 1.2,
      })

      usePlayer.getState().resetForNewSystem()

      const p = usePlayer.getState()
      expect(p.currentShipId).toBe('SHIP_INTERCEPTOR')
      expect(p.shipBaseSpeed).toBe(120)
      expect(p.shipBaseDamageMultiplier).toBe(1.2)
    })

    it('resets movement and combat state (Task 6.3)', () => {
      usePlayer.setState({
        position: [100, 5, -200],
        velocity: [50, 0, -30],
        rotation: 1.57,
        bankAngle: 0.3,
        speed: 80,
        isDashing: true,
        dashTimer: 0.2,
        dashCooldownTimer: 1.5,
        isInvulnerable: true,
        invulnerabilityTimer: 0.4,
        contactDamageCooldown: 0.3,
        damageFlashTimer: 0.05,
        cameraShakeTimer: 0.1,
        cameraShakeIntensity: 1.2,
      })

      usePlayer.getState().resetForNewSystem()

      const p = usePlayer.getState()
      // Movement reset
      expect(p.position).toEqual([0, 0, 0])
      expect(p.velocity).toEqual([0, 0, 0])
      expect(p.rotation).toBe(0)
      expect(p.bankAngle).toBe(0)
      expect(p.speed).toBe(0)

      // Combat state reset
      expect(p.isDashing).toBe(false)
      expect(p.dashTimer).toBe(0)
      expect(p.dashCooldownTimer).toBe(0)
      expect(p.isInvulnerable).toBe(false)
      expect(p.invulnerabilityTimer).toBe(0)
      expect(p.contactDamageCooldown).toBe(0)

      // Visual feedback reset
      expect(p.damageFlashTimer).toBe(0)
      expect(p.cameraShakeTimer).toBe(0)
      expect(p.cameraShakeIntensity).toBe(0)
    })
  })

  describe('AC #2: advanceSystem increments system and resets level-specific state (Task 6.6)', () => {
    it('increments currentSystem', () => {
      expect(useLevel.getState().currentSystem).toBe(1)
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().currentSystem).toBe(2)
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().currentSystem).toBe(3)
    })

    it('resets system-specific fields', () => {
      useLevel.setState({
        systemTimer: 300,
        difficulty: 3,
        planets: [{ id: 'PLANET_PULSE_0', tier: 'rare' }],
        wormholeState: 'active',
        wormhole: { x: 50, z: 50 },
        wormholeActivationTimer: 1.5,
        activeScanPlanetId: 'PLANET_PULSE_0',
      })

      useLevel.getState().advanceSystem()

      const l = useLevel.getState()
      expect(l.systemTimer).toBe(0)
      expect(l.difficulty).toBe(1)
      expect(l.planets).toEqual([])
      expect(l.wormholeState).toBe('hidden')
      expect(l.wormhole).toBeNull()
      expect(l.wormholeActivationTimer).toBe(0)
      expect(l.activeScanPlanetId).toBeNull()
    })

    it('does not exceed MAX_SYSTEMS (Task 6.7)', () => {
      for (let i = 0; i < 10; i++) {
        useLevel.getState().advanceSystem()
      }
      expect(useLevel.getState().currentSystem).toBe(GAME_CONFIG.MAX_SYSTEMS)
    })
  })

  describe('AC #3: Entity pool resets (Task 6.8)', () => {
    it('useEnemies.reset() clears enemies and nextId', () => {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
      useEnemies.getState().spawnEnemy('FODDER_TANK', 30, 40)
      expect(useEnemies.getState().enemies.length).toBe(2)
      expect(useEnemies.getState().nextId).toBe(2)

      useEnemies.getState().reset()

      expect(useEnemies.getState().enemies).toEqual([])
      expect(useEnemies.getState().nextId).toBe(0)
    })

    it('resetOrbs() clears all XP orbs', () => {
      spawnOrb(10, 20, 5)
      spawnOrb(30, 40, 10)
      expect(getOrbCount()).toBe(2)

      resetOrbs()

      expect(getOrbCount()).toBe(0)
    })

    it('clearProjectiles() clears projectiles but preserves weapons', () => {
      useWeapons.getState().addWeapon('SPREAD_SHOT')
      useWeapons.getState().tick(10, [0, 0, 0], 0, {})
      expect(useWeapons.getState().projectiles.length).toBeGreaterThan(0)

      useWeapons.getState().clearProjectiles()

      expect(useWeapons.getState().projectiles).toEqual([])
      expect(useWeapons.getState().activeWeapons.length).toBe(2) // Basic + Spread
    })

    it('resetParticles() clears all particle effects', () => {
      addExplosion(10, 20, '#ff0000')
      expect(getParticleCount()).toBeGreaterThan(0)

      resetParticles()

      expect(getParticleCount()).toBe(0)
    })

    it('useBoss.reset() clears boss state', () => {
      useBoss.getState().spawnBoss(1)
      expect(useBoss.getState().isActive).toBe(true)

      useBoss.getState().reset()

      expect(useBoss.getState().boss).toBeNull()
      expect(useBoss.getState().isActive).toBe(false)
    })
  })

  describe('AC #4: Run metadata persistence (Task 6.4-6.5)', () => {
    it('kills and score persist across system transitions (Task 6.4)', () => {
      useGame.getState().incrementKills()
      useGame.getState().incrementKills()
      useGame.getState().addScore(500)
      expect(useGame.getState().kills).toBe(2)
      expect(useGame.getState().score).toBe(500)

      // Simulate system transition (should NOT reset kills/score)
      useGame.getState().setSystemTimer(0)

      expect(useGame.getState().kills).toBe(2)
      expect(useGame.getState().score).toBe(500)
    })

    it('accumulateTime() correctly adds to totalElapsedTime (Task 6.5)', () => {
      expect(useGame.getState().totalElapsedTime).toBe(0)

      useGame.getState().setSystemTimer(250)
      useGame.getState().accumulateTime(250)

      expect(useGame.getState().totalElapsedTime).toBe(250)

      useGame.getState().setSystemTimer(0)
      useGame.getState().setSystemTimer(300)
      useGame.getState().accumulateTime(300)

      expect(useGame.getState().totalElapsedTime).toBe(550)
    })
  })

  describe('AC #6: Full run simulation — complex state preservation (Task 6.9)', () => {
    it('preserves run-persistent state across System 1 → 2 → 3 transitions', () => {
      // Set up complex run state in System 1
      usePlayer.setState({
        currentLevel: 8,
        currentXP: 350,
        xpToNextLevel: 700,
        currentHP: 45,
        maxHP: 100,
        fragments: 50,
        permanentUpgrades: { ATK_1: true },
        acceptedDilemmas: ['HIGH_RISK'],
        currentShipId: 'SHIP_INTERCEPTOR',
      })

      useWeapons.getState().addWeapon('SPREAD_SHOT')
      useWeapons.getState().addWeapon('RAILGUN')
      expect(useWeapons.getState().activeWeapons.length).toBe(3) // Basic + 2 added

      useBoons.getState().addBoon('ARMOR_PLATING')
      useBoons.getState().addBoon('BERSERKER')
      expect(useBoons.getState().activeBoons.length).toBe(2)

      useGame.setState({ kills: 100, score: 5000 })
      useGame.getState().setSystemTimer(250)

      // Dirty system-specific state
      usePlayer.setState({ position: [100, 0, -200], velocity: [50, 0, 30], isDashing: true })
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
      spawnOrb(15, 25, 8)

      // === TRANSITION: System 1 → System 2 ===
      simulateFullSystemTransition(spawnSystem, projectileSystem)

      // Verify RUN-PERSISTENT state preserved
      const p1 = usePlayer.getState()
      expect(p1.currentLevel).toBe(8)
      expect(p1.currentXP).toBe(350)
      expect(p1.currentHP).toBe(45)
      expect(p1.maxHP).toBe(100)
      expect(p1.fragments).toBe(50)
      expect(p1.permanentUpgrades).toEqual({ ATK_1: true })
      expect(p1.acceptedDilemmas).toEqual(['HIGH_RISK'])
      expect(p1.currentShipId).toBe('SHIP_INTERCEPTOR')

      expect(useWeapons.getState().activeWeapons.length).toBe(3)
      expect(useBoons.getState().activeBoons.length).toBe(2)

      const g1 = useGame.getState()
      expect(g1.kills).toBe(100)
      expect(g1.score).toBe(5000)
      expect(g1.totalElapsedTime).toBe(250)

      // Verify SYSTEM-SPECIFIC state reset
      expect(p1.position).toEqual([0, 0, 0])
      expect(p1.velocity).toEqual([0, 0, 0])
      expect(p1.isDashing).toBe(false)
      expect(useEnemies.getState().enemies).toEqual([])
      expect(getOrbCount()).toBe(0)
      expect(g1.systemTimer).toBe(0)

      const l1 = useLevel.getState()
      expect(l1.currentSystem).toBe(2)
      expect(l1.wormholeState).toBe('hidden')
      expect(l1.planets.length).toBeGreaterThan(0) // New planets initialized

      // === TRANSITION: System 2 → System 3 ===
      useGame.getState().setSystemTimer(300)
      useGame.getState().incrementKills()
      useGame.getState().addScore(1000)

      simulateFullSystemTransition(spawnSystem, projectileSystem)

      // Verify persistence again
      const p2 = usePlayer.getState()
      expect(p2.currentLevel).toBe(8)
      expect(p2.fragments).toBe(50)
      expect(useWeapons.getState().activeWeapons.length).toBe(3)
      expect(useBoons.getState().activeBoons.length).toBe(2)

      const g2 = useGame.getState()
      expect(g2.kills).toBe(101)
      expect(g2.score).toBe(6000)
      expect(g2.totalElapsedTime).toBe(550) // 250 + 300
      expect(g2.systemTimer).toBe(0)

      expect(useLevel.getState().currentSystem).toBe(3)
    })
  })

  describe('AC #6: Full game reset path (Task 6.10)', () => {
    it('EVERYTHING returns to initial values after full reset', () => {
      // Dirty ALL state
      usePlayer.setState({
        currentLevel: 10,
        currentXP: 500,
        currentHP: 30,
        maxHP: 150,
        fragments: 200,
        permanentUpgrades: { ATK_1: true, SPD_1: true },
        acceptedDilemmas: ['HIGH_RISK'],
        position: [100, 0, -200],
        isDashing: true,
        currentShipId: 'SHIP_TANK',
      })

      useWeapons.getState().addWeapon('SPREAD_SHOT')
      useWeapons.getState().addWeapon('RAILGUN')

      useBoons.getState().addBoon('ARMOR_PLATING')

      useGame.setState({
        kills: 150,
        score: 10000,
        totalElapsedTime: 600,
        systemTimer: 100,
      })

      useLevel.getState().advanceSystem()
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().currentSystem).toBe(3)

      // === FULL GAME RESET (as done in GameLoop fresh start block) ===
      usePlayer.getState().reset()
      useWeapons.getState().initializeWeapons()
      useBoons.getState().reset()
      useEnemies.getState().reset()
      useLevel.getState().reset()
      useBoss.getState().reset()
      resetOrbs()
      resetParticles()
      useGame.getState().startGameplay()
      spawnSystem.reset()
      projectileSystem.reset()

      // === VERIFY EVERYTHING IS RESET ===
      const p = usePlayer.getState()
      expect(p.currentLevel).toBe(1)
      expect(p.currentXP).toBe(0)
      expect(p.xpToNextLevel).toBe(GAME_CONFIG.XP_LEVEL_CURVE[0])
      expect(p.currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP)
      expect(p.maxHP).toBe(GAME_CONFIG.PLAYER_BASE_HP)
      expect(p.fragments).toBe(0)
      expect(p.permanentUpgrades).toEqual({})
      expect(p.acceptedDilemmas).toEqual([])
      expect(p.position).toEqual([0, 0, 0])
      expect(p.velocity).toEqual([0, 0, 0])
      expect(p.isDashing).toBe(false)
      // NOTE: currentShipId persists across resets (by design — ship selection is per-session, not per-run)
      expect(p.currentShipId).toBe('SHIP_TANK') // Preserves selected ship

      expect(useWeapons.getState().activeWeapons.length).toBe(1) // Only starting weapon
      // NOTE: Starting weapon depends on ship selection (SHIP_TANK starts with LASER_FRONT, not BASIC_SHOT)

      expect(useBoons.getState().activeBoons).toEqual([])

      const g = useGame.getState()
      expect(g.kills).toBe(0)
      expect(g.score).toBe(0)
      expect(g.totalElapsedTime).toBe(0)
      expect(g.systemTimer).toBe(0)
      expect(g.phase).toBe('systemEntry')

      const l = useLevel.getState()
      expect(l.currentSystem).toBe(1)
      expect(l.systemTimer).toBe(0)
      expect(l.wormholeState).toBe('hidden')
    })
  })

  describe('AC #1-#6: Weapons and Boons persist across transitions', () => {
    it('activeWeapons persist (clearProjectiles, not reset)', () => {
      useWeapons.getState().addWeapon('SPREAD_SHOT')
      useWeapons.getState().addWeapon('RAILGUN')
      const weaponsBefore = useWeapons.getState().activeWeapons.map(w => w.weaponId)

      simulateFullSystemTransition(spawnSystem, projectileSystem)

      const weaponsAfter = useWeapons.getState().activeWeapons.map(w => w.weaponId)
      expect(weaponsAfter).toEqual(weaponsBefore)
      expect(weaponsAfter.length).toBe(3) // Basic + 2 added
    })

    it('activeBoons persist (store not reset)', () => {
      useBoons.getState().addBoon('ARMOR_PLATING')
      useBoons.getState().addBoon('BERSERKER')
      const boonsBefore = useBoons.getState().activeBoons.map(b => b.boonId)

      simulateFullSystemTransition(spawnSystem, projectileSystem)

      const boonsAfter = useBoons.getState().activeBoons.map(b => b.boonId)
      expect(boonsAfter).toEqual(boonsBefore)
      expect(boonsAfter.length).toBe(2)
    })
  })
})
