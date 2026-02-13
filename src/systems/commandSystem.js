import usePlayer from '../stores/usePlayer.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'
import useEnemies from '../stores/useEnemies.jsx'
import useGame from '../stores/useGame.jsx'
import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'
import { ENEMIES } from '../entities/enemyDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const COMMANDS = {
  help: {
    handler: () => {
      const lines = Object.entries(COMMANDS)
        .map(([name, def]) => `  ${name} - ${def.description}`)
        .join('\n')
      return { success: true, message: `Available commands:\n${lines}` }
    },
    description: 'List all available commands',
  },

  addxp: {
    handler: (args) => {
      const amount = parseInt(args[0])
      if (isNaN(amount) || amount < 0) return { success: false, message: 'Usage: addxp <amount> (positive integer)' }
      usePlayer.getState().addXP(amount)
      return { success: true, message: `Added ${amount} XP` }
    },
    description: 'addxp <amount> - Add XP to player',
  },

  setlevel: {
    handler: (args) => {
      const level = parseInt(args[0])
      if (isNaN(level) || level < 1) return { success: false, message: 'Usage: setlevel <level> (>= 1)' }
      const curve = GAME_CONFIG.XP_LEVEL_CURVE
      const maxLevel = curve.length + 1
      const targetLevel = Math.min(level, maxLevel)
      const state = usePlayer.getState()
      // Calculate total XP needed to reach targetLevel from level 1
      let totalXP = 0
      for (let i = 0; i < targetLevel - 1 && i < curve.length; i++) {
        totalXP += curve[i]
      }
      // Reset XP state and add total XP to trigger proper level-ups
      // Note: boon xpMultiplier is NOT applied here (debug tool sets level directly)
      usePlayer.setState({
        currentXP: 0,
        currentLevel: 1,
        xpToNextLevel: curve[0],
        pendingLevelUps: 0,
        levelsGainedThisBatch: 0,
      })
      usePlayer.getState().addXP(totalXP)
      // Consume pending level up so it doesn't trigger modal
      usePlayer.setState({ pendingLevelUps: 0, levelsGainedThisBatch: 0 })
      return { success: true, message: `Set level to ${targetLevel}` }
    },
    description: 'setlevel <level> - Set player level directly',
  },

  godmode: {
    handler: () => {
      const state = usePlayer.getState()
      if (!state._godMode) {
        usePlayer.setState({ _godMode: true, isInvulnerable: true, invulnerabilityTimer: Infinity })
        return { success: true, message: 'God mode ENABLED (invincible)' }
      } else {
        usePlayer.setState({ _godMode: false, isInvulnerable: false, invulnerabilityTimer: 0 })
        return { success: true, message: 'God mode DISABLED' }
      }
    },
    description: 'godmode - Toggle player invincibility',
  },

  sethp: {
    handler: (args) => {
      const hp = parseInt(args[0])
      if (isNaN(hp) || hp < 0) return { success: false, message: 'Usage: sethp <amount> (>= 0)' }
      const maxHP = usePlayer.getState().maxHP
      const clamped = Math.min(hp, maxHP)
      usePlayer.setState({ currentHP: clamped })
      return { success: true, message: `Set HP to ${clamped}/${maxHP}` }
    },
    description: 'sethp <amount> - Set player current HP',
  },

  setmaxhp: {
    handler: (args) => {
      const maxHP = parseInt(args[0])
      if (isNaN(maxHP) || maxHP < 1) return { success: false, message: 'Usage: setmaxhp <amount> (>= 1)' }
      const state = usePlayer.getState()
      const currentHP = Math.min(state.currentHP, maxHP)
      usePlayer.setState({ maxHP, currentHP })
      return { success: true, message: `Set maxHP to ${maxHP}, currentHP: ${currentHP}` }
    },
    description: 'setmaxhp <amount> - Set player maximum HP',
  },

  spawn: {
    handler: (args) => {
      const enemyType = (args[0] || '').toUpperCase()
      const count = parseInt(args[1]) || 1
      if (!ENEMIES[enemyType]) {
        const types = Object.keys(ENEMIES).join(', ')
        return { success: false, message: `Unknown enemy: ${args[0]}. Available: ${types}` }
      }
      if (count < 1 || count > 50) return { success: false, message: 'Count must be 1-50' }
      const playerPos = usePlayer.getState().position
      const instructions = []
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist = GAME_CONFIG.SPAWN_DISTANCE_MIN + Math.random() * (GAME_CONFIG.SPAWN_DISTANCE_MAX - GAME_CONFIG.SPAWN_DISTANCE_MIN)
        const x = playerPos[0] + Math.cos(angle) * dist
        const z = playerPos[2] + Math.sin(angle) * dist
        instructions.push({ typeId: enemyType, x, z, difficultyMult: 1.0 })
      }
      useEnemies.getState().spawnEnemies(instructions)
      return { success: true, message: `Spawned ${count} ${enemyType}` }
    },
    description: 'spawn <type> [count] - Spawn enemies near player',
  },

  killall: {
    handler: () => {
      const count = useEnemies.getState().enemies.length
      // Direct setState is safe: GameLoop calls cs.clear() + re-registers every frame
      useEnemies.getState().reset()
      return { success: true, message: `Cleared ${count} enemies` }
    },
    description: 'killall - Remove all enemies',
  },

  spawnwave: {
    handler: (args) => {
      const waveLevel = parseFloat(args[0]) || 1.0
      const playerPos = usePlayer.getState().position
      const count = Math.min(10 + Math.floor(waveLevel * 3), 50)
      const instructions = []
      const enemyTypes = Object.values(ENEMIES).filter(e => e.spawnWeight > 0)
      const totalWeight = enemyTypes.reduce((sum, e) => sum + e.spawnWeight, 0)
      for (let i = 0; i < count; i++) {
        let roll = Math.random() * totalWeight
        let typeId = enemyTypes[0].id
        for (const e of enemyTypes) {
          roll -= e.spawnWeight
          if (roll <= 0) { typeId = e.id; break }
        }
        const angle = Math.random() * Math.PI * 2
        const dist = GAME_CONFIG.SPAWN_DISTANCE_MIN + Math.random() * (GAME_CONFIG.SPAWN_DISTANCE_MAX - GAME_CONFIG.SPAWN_DISTANCE_MIN)
        instructions.push({
          typeId,
          x: playerPos[0] + Math.cos(angle) * dist,
          z: playerPos[2] + Math.sin(angle) * dist,
          difficultyMult: waveLevel,
        })
      }
      useEnemies.getState().spawnEnemies(instructions)
      return { success: true, message: `Spawned wave (${count} enemies, difficulty x${waveLevel})` }
    },
    description: 'spawnwave <level> - Spawn a full enemy wave at difficulty level',
  },

  stopspawn: {
    handler: () => {
      useGame.setState({ _debugSpawnPaused: true })
      return { success: true, message: 'Automatic spawning PAUSED' }
    },
    description: 'stopspawn - Disable automatic enemy spawning',
  },

  resumespawn: {
    handler: () => {
      useGame.setState({ _debugSpawnPaused: false })
      return { success: true, message: 'Automatic spawning RESUMED' }
    },
    description: 'resumespawn - Re-enable automatic enemy spawning',
  },

  addweapon: {
    handler: (args) => {
      const weaponId = (args[0] || '').toUpperCase()
      if (!WEAPONS[weaponId]) {
        const ids = Object.keys(WEAPONS).join(', ')
        return { success: false, message: `Unknown weapon: ${args[0]}. Available: ${ids}` }
      }
      const weapons = useWeapons.getState()
      if (weapons.activeWeapons.length >= 4) return { success: false, message: 'Weapon slots full (4/4)' }
      if (weapons.activeWeapons.some(w => w.weaponId === weaponId)) return { success: false, message: `Already equipped: ${weaponId}` }
      weapons.addWeapon(weaponId)
      return { success: true, message: `Added weapon: ${WEAPONS[weaponId].name}` }
    },
    description: 'addweapon <id> - Add weapon to next slot',
  },

  setweaponlevel: {
    handler: (args) => {
      const slotIndex = parseInt(args[0])
      const level = parseInt(args[1])
      if (isNaN(slotIndex) || isNaN(level)) return { success: false, message: 'Usage: setweaponlevel <slot> <level>' }
      const { activeWeapons } = useWeapons.getState()
      if (slotIndex < 0 || slotIndex >= activeWeapons.length) return { success: false, message: `Invalid slot ${slotIndex}. Have ${activeWeapons.length} weapons.` }
      const weaponId = activeWeapons[slotIndex].weaponId
      const targetLevel = Math.max(1, Math.min(level, 9))
      // Upgrade incrementally to apply proper overrides — re-read state each iteration
      for (let safety = 0; safety < 20; safety++) {
        const currentLevel = useWeapons.getState().activeWeapons[slotIndex]?.level ?? 99
        if (currentLevel >= targetLevel) break
        useWeapons.getState().upgradeWeapon(weaponId)
      }
      return { success: true, message: `Set ${weaponId} to level ${targetLevel}` }
    },
    description: 'setweaponlevel <slot> <level> - Set weapon level (0-indexed slot)',
  },

  removeweapon: {
    handler: (args) => {
      const slotIndex = parseInt(args[0])
      if (isNaN(slotIndex)) return { success: false, message: 'Usage: removeweapon <slot>' }
      const { activeWeapons } = useWeapons.getState()
      if (slotIndex < 0 || slotIndex >= activeWeapons.length) return { success: false, message: `Invalid slot ${slotIndex}` }
      const removed = activeWeapons[slotIndex]
      const updated = activeWeapons.filter((_, i) => i !== slotIndex)
      // Direct setState (debug tool) — projectiles from removed weapon expire naturally via lifetime
      useWeapons.setState({ activeWeapons: updated })
      return { success: true, message: `Removed weapon: ${removed.weaponId}` }
    },
    description: 'removeweapon <slot> - Remove weapon from slot (0-indexed)',
  },

  addboon: {
    handler: (args) => {
      const boonId = (args[0] || '').toUpperCase()
      if (!BOONS[boonId]) {
        const ids = Object.keys(BOONS).join(', ')
        return { success: false, message: `Unknown boon: ${args[0]}. Available: ${ids}` }
      }
      const boons = useBoons.getState()
      if (boons.activeBoons.length >= 3) return { success: false, message: 'Boon slots full (3/3)' }
      if (boons.activeBoons.some(b => b.boonId === boonId)) return { success: false, message: `Already equipped: ${boonId}` }
      boons.addBoon(boonId)
      return { success: true, message: `Added boon: ${BOONS[boonId].name}` }
    },
    description: 'addboon <id> - Add boon to next slot',
  },

  setboonlevel: {
    handler: (args) => {
      const slotIndex = parseInt(args[0])
      const level = parseInt(args[1])
      if (isNaN(slotIndex) || isNaN(level)) return { success: false, message: 'Usage: setboonlevel <slot> <level>' }
      const { activeBoons } = useBoons.getState()
      if (slotIndex < 0 || slotIndex >= activeBoons.length) return { success: false, message: `Invalid slot ${slotIndex}. Have ${activeBoons.length} boons.` }
      const boonId = activeBoons[slotIndex].boonId
      const def = BOONS[boonId]
      const maxLevel = def?.maxLevel || 3
      const targetLevel = Math.max(1, Math.min(level, maxLevel))
      // Upgrade incrementally — re-read state each iteration
      for (let safety = 0; safety < 10; safety++) {
        const currentLevel = useBoons.getState().activeBoons[slotIndex]?.level ?? 99
        if (currentLevel >= targetLevel) break
        useBoons.getState().upgradeBoon(boonId)
      }
      return { success: true, message: `Set ${boonId} to level ${targetLevel}` }
    },
    description: 'setboonlevel <slot> <level> - Set boon level (0-indexed slot)',
  },

  removeboon: {
    handler: (args) => {
      const slotIndex = parseInt(args[0])
      if (isNaN(slotIndex)) return { success: false, message: 'Usage: removeboon <slot>' }
      const { activeBoons } = useBoons.getState()
      if (slotIndex < 0 || slotIndex >= activeBoons.length) return { success: false, message: `Invalid slot ${slotIndex}` }
      const removed = activeBoons[slotIndex]
      const updated = activeBoons.filter((_, i) => i !== slotIndex)
      useBoons.setState({ activeBoons: updated })
      useBoons.getState().computeModifiers()
      return { success: true, message: `Removed boon: ${removed.boonId}` }
    },
    description: 'removeboon <slot> - Remove boon from slot (0-indexed)',
  },

  listweapons: {
    handler: () => {
      const list = Object.entries(WEAPONS)
        .map(([id, def]) => `  ${id} - ${def.name}`)
        .join('\n')
      return { success: true, message: `Available weapons:\n${list}` }
    },
    description: 'listweapons - List all weapon IDs',
  },

  listboons: {
    handler: () => {
      const list = Object.entries(BOONS)
        .map(([id, def]) => `  ${id} - ${def.name}`)
        .join('\n')
      return { success: true, message: `Available boons:\n${list}` }
    },
    description: 'listboons - List all boon IDs',
  },

  listenemies: {
    handler: () => {
      const list = Object.entries(ENEMIES)
        .map(([id, def]) => `  ${id} - ${def.name || id} (HP: ${def.hp}, Speed: ${def.speed})`)
        .join('\n')
      return { success: true, message: `Available enemies:\n${list}` }
    },
    description: 'listenemies - List all enemy types',
  },

  clearconsole: {
    handler: () => {
      // Handled by the store; this returns feedback before clearing
      return { success: true, message: '__CLEAR__' }
    },
    description: 'clearconsole - Clear console command history',
  },

  addscore: {
    handler: (args) => {
      const amount = parseInt(args[0])
      if (isNaN(amount) || amount < 0) return { success: false, message: 'Usage: addscore <amount>' }
      useGame.getState().addScore(amount)
      return { success: true, message: `Added ${amount} score` }
    },
    description: 'addscore <amount> - Add score points',
  },

  addfragments: {
    handler: (args) => {
      const amount = parseInt(args[0])
      if (isNaN(amount) || amount < 0) return { success: false, message: 'Usage: addfragments <amount>' }
      // Bypass the multiplier — set directly
      const current = usePlayer.getState().fragments
      usePlayer.setState({ fragments: current + amount })
      return { success: true, message: `Added ${amount} fragments (total: ${current + amount})` }
    },
    description: 'addfragments <amount> - Add fragments directly',
  },
}

export function executeCommand(input) {
  const parts = input.trim().split(/\s+/)
  const commandName = parts[0].toLowerCase()
  const args = parts.slice(1)

  const command = COMMANDS[commandName]
  if (!command) {
    return { success: false, message: `Unknown command: ${commandName}. Type 'help' for commands.` }
  }

  try {
    return command.handler(args)
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` }
  }
}
