import { describe, it, expect } from 'vitest'
import { ENEMIES } from '../enemyDefs.js'

describe('enemyDefs — all 8 enemy types defined (Story 16.1)', () => {
  const expectedTypes = [
    'FODDER_BASIC',
    'FODDER_TANK',
    'FODDER_SWARM',
    'SHOCKWAVE_BLOB',
    'SNIPER_MOBILE',
    'SNIPER_FIXED',
    'TELEPORTER',
    'BOSS_SENTINEL',
  ]

  it('has all 8 enemy types defined', () => {
    for (const typeId of expectedTypes) {
      expect(ENEMIES[typeId]).toBeDefined()
      expect(ENEMIES[typeId].id).toBe(typeId)
    }
  })

  it('each enemy has all required base properties', () => {
    const requiredProps = ['id', 'name', 'hp', 'speed', 'damage', 'radius', 'behavior', 'meshScale', 'xpReward', 'spawnWeight', 'modelPath']
    for (const [key, def] of Object.entries(ENEMIES)) {
      for (const prop of requiredProps) {
        expect(def[prop], `${key} missing ${prop}`).toBeDefined()
      }
    }
  })
})

describe('enemyDefs — AC#1: correct stats per enemy type', () => {
  it('FODDER_BASIC: hp=20, speed=17, behavior=chase, meshScale=[3,3,3]', () => {
    const d = ENEMIES.FODDER_BASIC
    expect(d.hp).toBe(20)
    expect(d.speed).toBe(17)
    expect(d.behavior).toBe('chase')
    expect(d.meshScale).toEqual([3, 3, 3])
    expect(d.modelPath).toBe('/models/enemies/robot-enemy-flying.glb')
  })

  it('FODDER_TANK: hp=40, speed=12, behavior=chase, meshScale=[4,4,4]', () => {
    const d = ENEMIES.FODDER_TANK
    expect(d.hp).toBe(40)
    expect(d.speed).toBe(12)
    expect(d.behavior).toBe('chase')
    expect(d.meshScale).toEqual([4, 4, 4])
    expect(d.modelPath).toBe('/models/enemies/robot-enemy-flying.glb')
  })

  it('FODDER_SWARM: hp=8, speed=35, behavior=sweep, meshScale=[1.5,1.5,1.5]', () => {
    const d = ENEMIES.FODDER_SWARM
    expect(d.hp).toBe(8)
    expect(d.speed).toBe(35)
    expect(d.behavior).toBe('sweep')
    expect(d.meshScale).toEqual([1.5, 1.5, 1.5])
    expect(d.modelPath).toBe('/models/enemies/robot-enemy-flying.glb')
  })

  it('SHOCKWAVE_BLOB: hp=15, speed=8, behavior=shockwave, meshScale=[2,2,2]', () => {
    const d = ENEMIES.SHOCKWAVE_BLOB
    expect(d.hp).toBe(15)
    expect(d.speed).toBe(8)
    expect(d.behavior).toBe('shockwave')
    expect(d.meshScale).toEqual([2, 2, 2])
    expect(d.modelPath).toBe('/models/enemies/enemy-blob.glb')
  })

  it('SNIPER_MOBILE: hp=25, speed=20, behavior=sniper_mobile, attackRange=40, attackCooldown=2', () => {
    const d = ENEMIES.SNIPER_MOBILE
    expect(d.hp).toBe(25)
    expect(d.speed).toBe(20)
    expect(d.behavior).toBe('sniper_mobile')
    expect(d.attackRange).toBe(40)
    expect(d.attackCooldown).toBe(2)
    expect(d.meshScale).toEqual([3, 3, 3])
    expect(d.modelPath).toBe('/models/enemies/robot-enemy-flying-gun.glb')
  })

  it('SNIPER_FIXED: hp=10, speed=0, behavior=sniper_fixed, attackRange=60, attackCooldown=4, color=#ff3333', () => {
    const d = ENEMIES.SNIPER_FIXED
    expect(d.hp).toBe(10)
    expect(d.speed).toBe(0)
    expect(d.behavior).toBe('sniper_fixed')
    expect(d.attackRange).toBe(60)
    expect(d.attackCooldown).toBe(4)
    expect(d.meshScale).toEqual([3, 3, 3])
    expect(d.modelPath).toBe('/models/enemies/robot-enemy-flying-gun.glb')
    expect(d.color).toBe('#ff3333')
  })

  it('TELEPORTER: hp=18, speed=15, behavior=teleport, teleportCooldown=5', () => {
    const d = ENEMIES.TELEPORTER
    expect(d.hp).toBe(18)
    expect(d.speed).toBe(15)
    expect(d.behavior).toBe('teleport')
    expect(d.teleportCooldown).toBe(5)
    expect(d.meshScale).toEqual([2.5, 2.5, 2.5])
    expect(d.modelPath).toBe('/models/enemies/robot-enemy-flying.glb')
  })
})

describe('enemyDefs — AC#2: correct model paths', () => {
  it('robot-enemy-flying.glb used for Types 1, 2, 3, 8', () => {
    const robotModel = '/models/enemies/robot-enemy-flying.glb'
    expect(ENEMIES.FODDER_BASIC.modelPath).toBe(robotModel)
    expect(ENEMIES.FODDER_TANK.modelPath).toBe(robotModel)
    expect(ENEMIES.FODDER_SWARM.modelPath).toBe(robotModel)
    expect(ENEMIES.TELEPORTER.modelPath).toBe(robotModel)
  })

  it('enemy-blob.glb used for Type 4', () => {
    expect(ENEMIES.SHOCKWAVE_BLOB.modelPath).toBe('/models/enemies/enemy-blob.glb')
  })

  it('robot-enemy-flying-gun.glb used for Types 6, 7', () => {
    const gunModel = '/models/enemies/robot-enemy-flying-gun.glb'
    expect(ENEMIES.SNIPER_MOBILE.modelPath).toBe(gunModel)
    expect(ENEMIES.SNIPER_FIXED.modelPath).toBe(gunModel)
  })

  it('SNIPER_FIXED has red tint color override', () => {
    expect(ENEMIES.SNIPER_FIXED.color).toBe('#ff3333')
  })
})

describe('enemyDefs — AC#3: collision radii proportional to meshScale', () => {
  it('FODDER_BASIC radius ~1.5 for meshScale [3,3,3]', () => {
    expect(ENEMIES.FODDER_BASIC.radius).toBe(1.5)
  })

  it('FODDER_TANK radius ~2.0 for meshScale [4,4,4]', () => {
    expect(ENEMIES.FODDER_TANK.radius).toBe(2.0)
  })

  it('FODDER_SWARM radius ~0.75 for meshScale [1.5,1.5,1.5]', () => {
    expect(ENEMIES.FODDER_SWARM.radius).toBe(0.75)
  })

  it('SHOCKWAVE_BLOB radius ~2.5 (larger for tanky nature)', () => {
    expect(ENEMIES.SHOCKWAVE_BLOB.radius).toBe(2.5)
  })

  it('SNIPER_MOBILE radius ~1.5 for meshScale [3,3,3]', () => {
    expect(ENEMIES.SNIPER_MOBILE.radius).toBe(1.5)
  })

  it('SNIPER_FIXED radius ~1.5 for meshScale [3,3,3]', () => {
    expect(ENEMIES.SNIPER_FIXED.radius).toBe(1.5)
  })

  it('TELEPORTER radius ~1.25 for meshScale [2.5,2.5,2.5]', () => {
    expect(ENEMIES.TELEPORTER.radius).toBe(1.25)
  })

  it('all enemy types have radius > 0.5', () => {
    for (const [, def] of Object.entries(ENEMIES)) {
      expect(def.radius).toBeGreaterThan(0.5)
    }
  })
})

describe('enemyDefs — architectural compliance', () => {
  it('all IDs use SCREAMING_CAPS', () => {
    for (const key of Object.keys(ENEMIES)) {
      expect(key).toMatch(/^[A-Z_]+$/)
    }
  })

  it('enemy defs are plain objects (no functions)', () => {
    for (const [, def] of Object.entries(ENEMIES)) {
      for (const [prop, value] of Object.entries(def)) {
        expect(typeof value, `${def.id}.${prop} should not be a function`).not.toBe('function')
      }
    }
  })
})
