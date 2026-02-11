import { GAME_CONFIG } from '../config/gameConfig.js'
import usePlayer from '../stores/usePlayer.jsx'
import useLevel from '../stores/useLevel.jsx'
import useGame from '../stores/useGame.jsx'
import useWeapons from '../stores/useWeapons.jsx'
import useBoons from '../stores/useBoons.jsx'

export function saveGameState() {
  try {
    const player = usePlayer.getState()
    const level = useLevel.getState()
    const game = useGame.getState()
    const weapons = useWeapons.getState()
    const boons = useBoons.getState()

    const saveData = {
      version: 1,
      timestamp: Date.now(),
      currentSystem: level.currentSystem,
      fragments: player.fragments,
      playerHP: player.currentHP,
      playerMaxHP: player.maxHP,
      weapons: weapons.activeWeapons.map(w => ({ id: w.weaponId, level: w.level })),
      boons: boons.activeBoons.map(b => ({ id: b.boonId })),
      totalKills: game.kills,
      currentSystemTime: game.systemTimer,
    }

    localStorage.setItem(GAME_CONFIG.TUNNEL_AUTOSAVE_KEY, JSON.stringify(saveData))
  } catch (e) {
    console.warn('Auto-save failed:', e)
  }
}
