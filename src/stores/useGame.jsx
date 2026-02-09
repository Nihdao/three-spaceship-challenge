import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

const useGame = create(
  subscribeWithSelector((set, get) => ({
    phase: 'menu',
    isPaused: false,
    systemTimer: 0,
    score: 0,
    kills: 0,

    setPhase: (phase) => set({ phase }),
    setPaused: (isPaused) => set({ isPaused }),
    setSystemTimer: (systemTimer) => set({ systemTimer }),
    incrementKills: () => set((s) => ({ kills: s.kills + 1 })),

    startGameplay: () => set({ phase: 'gameplay', isPaused: false, systemTimer: 0, score: 0, kills: 0 }),
    triggerLevelUp: () => set({ phase: 'levelUp', isPaused: true }),
    resumeGameplay: () => set({ phase: 'gameplay', isPaused: false }),
    triggerGameOver: () => set({ phase: 'gameOver', isPaused: true }),
    triggerVictory: () => set({ phase: 'victory', isPaused: true }),
    // Store resets happen in GameLoop on gameplay transition, not here
    returnToMenu: () => set({ phase: 'menu', isPaused: false }),

    reset: () => set({
      phase: 'menu', isPaused: false, systemTimer: 0, score: 0, kills: 0,
    }),
  }))
)

export default useGame
