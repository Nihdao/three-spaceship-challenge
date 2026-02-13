import { create } from 'zustand'
import { executeCommand } from '../systems/commandSystem.js'

const useDebugConsole = create((set, get) => ({
  isOpen: false,
  commandHistory: [],

  toggleConsole: () => set(state => ({ isOpen: !state.isOpen })),

  runCommand: (input) => {
    const result = executeCommand(input)
    const { commandHistory } = get()
    const newHistory = [
      ...commandHistory.slice(-9),
      { input, output: result.message, success: result.success },
    ]
    set({ commandHistory: newHistory })
  },

  clearHistory: () => set({ commandHistory: [] }),

  reset: () => set({ isOpen: false, commandHistory: [] }),
}))

export default useDebugConsole
