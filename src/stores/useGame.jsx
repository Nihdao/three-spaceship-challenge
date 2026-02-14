import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { getHighScore, setHighScore as saveHighScore } from '../utils/highScoreStorage.js'

const useGame = create(
  subscribeWithSelector((set, get) => ({
    phase: 'menu',
    isPaused: false,
    systemTimer: 0,
    totalElapsedTime: 0,
    score: 0,
    kills: 0,
    rewardTier: null,
    prevCombatPhase: 'gameplay',
    highScore: 0,
    isNewHighScore: false,
    wormholeFirstTouch: false, // Story 17.6: Track first wormhole touch for impressive flash
    tunnelTransitionPending: false, // Story 17.6: Track if tunnel transition is already scheduled
    tunnelEntryFlashTriggered: false, // Story 17.6: Track tunnel entry flash trigger (separate from phase change)
    _debugGrid: false,

    setPhase: (phase) => set({ phase, tunnelTransitionPending: false }),
    setPaused: (isPaused) => set({ isPaused }),
    setSystemTimer: (systemTimer) => set({ systemTimer }),
    accumulateTime: (time) => set((s) => ({ totalElapsedTime: s.totalElapsedTime + time })),
    incrementKills: () => set((s) => ({ kills: s.kills + 1 })),
    addScore: (points) => set((s) => ({ score: s.score + points })),
    triggerWormholeFirstTouch: () => set({ wormholeFirstTouch: true }), // Story 17.6
    setTunnelTransitionPending: (pending) => set({ tunnelTransitionPending: pending }), // Story 17.6
    triggerTunnelEntryFlash: () => set({ tunnelEntryFlashTriggered: true }), // Story 17.6
    resetTunnelEntryFlash: () => set({ tunnelEntryFlashTriggered: false }), // Story 17.6

    loadHighScore: () => set({ highScore: getHighScore() }),

    updateHighScore: () => {
      const { score, highScore } = get()
      if (score > 0 && score > highScore) {
        saveHighScore(score)
        set({ highScore: score, isNewHighScore: true })
        return true
      }
      set({ isNewHighScore: false })
      return false
    },

    startGameplay: () => set((s) => ({
      phase: 'systemEntry', isPaused: false, systemTimer: 0, totalElapsedTime: 0,
      score: 0, kills: 0, prevCombatPhase: 'gameplay', highScore: s.highScore, isNewHighScore: false,
    })),
    triggerLevelUp: () => set((s) => ({ phase: 'levelUp', isPaused: true, prevCombatPhase: s.phase === 'levelUp' ? s.prevCombatPhase : s.phase })),
    triggerPlanetReward: (tier) => set({ phase: 'planetReward', isPaused: true, rewardTier: tier }),
    resumeGameplay: () => set((s) => ({ phase: s.prevCombatPhase, isPaused: false, rewardTier: null })),
    triggerGameOver: () => set({ phase: 'gameOver', isPaused: true }),
    triggerVictory: () => set({ phase: 'victory', isPaused: true }),
    startSystemEntry: () => set({ phase: 'systemEntry', isPaused: false }),
    completeSystemEntry: () => set({ phase: 'gameplay' }),
    // Store resets happen in GameLoop on gameplay transition, not here
    returnToMenu: () => set({ phase: 'menu', isPaused: false }),

    reset: () => set({
      phase: 'menu', isPaused: false, systemTimer: 0, totalElapsedTime: 0,
      score: 0, kills: 0, rewardTier: null, prevCombatPhase: 'gameplay', highScore: 0, isNewHighScore: false,
      wormholeFirstTouch: false, tunnelTransitionPending: false, tunnelEntryFlashTriggered: false, _debugGrid: false,
    }),
  }))
)

export default useGame
