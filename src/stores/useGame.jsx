import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

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

    setPhase: (phase) => set({ phase }),
    setPaused: (isPaused) => set({ isPaused }),
    setSystemTimer: (systemTimer) => set({ systemTimer }),
    accumulateTime: (time) => set((s) => ({ totalElapsedTime: s.totalElapsedTime + time })),
    incrementKills: () => set((s) => ({ kills: s.kills + 1 })),

    startGameplay: () => set({ phase: 'gameplay', isPaused: false, systemTimer: 0, totalElapsedTime: 0, score: 0, kills: 0, prevCombatPhase: 'gameplay' }),
    triggerLevelUp: () => set((s) => ({ phase: 'levelUp', isPaused: true, prevCombatPhase: s.phase === 'levelUp' ? s.prevCombatPhase : s.phase })),
    triggerPlanetReward: (tier) => set({ phase: 'planetReward', isPaused: true, rewardTier: tier }),
    resumeGameplay: () => set((s) => ({ phase: s.prevCombatPhase, isPaused: false, rewardTier: null })),
    triggerGameOver: () => set({ phase: 'gameOver', isPaused: true }),
    triggerVictory: () => set({ phase: 'victory', isPaused: true }),
    // Store resets happen in GameLoop on gameplay transition, not here
    returnToMenu: () => set({ phase: 'menu', isPaused: false }),

    reset: () => set({
      phase: 'menu', isPaused: false, systemTimer: 0, totalElapsedTime: 0, score: 0, kills: 0, rewardTier: null, prevCombatPhase: 'gameplay',
    }),
  }))
)

export default useGame
