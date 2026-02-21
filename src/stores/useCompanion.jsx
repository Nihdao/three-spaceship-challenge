import { create } from 'zustand'
import { getRandomLine } from '../entities/companionDefs.js'

// Module-level — not Zustand state, no React reactivity needed
const shownEvents = new Set()

const useCompanion = create((set, get) => ({
  current: null,
  queue: [],

  trigger: (eventKey, priority = 'normal') => {
    const lineEntry = getRandomLine(eventKey)
    if (!lineEntry) return
    const entry = { id: Date.now(), ...lineEntry, priority }
    const { current, queue } = get()
    if (priority === 'high') {
      set({ current: entry, queue: [] })
    } else if (current === null) {
      set({ current: entry })
    } else if (queue.length < 2) {
      set({ queue: [...queue, entry] })
    }
    // else: drop silently (queue full)
  },

  dismiss: () => {
    const { queue } = get()
    if (queue.length > 0) {
      set({ current: queue[0], queue: queue.slice(1) })
    } else {
      set({ current: null })
    }
  },

  clear: () => {
    shownEvents.clear()
    set({ current: null, queue: [] })
  },

  markShown: (eventKey) => { shownEvents.add(eventKey) },
  hasShown: (eventKey) => shownEvents.has(eventKey),

  reset: () => {
    shownEvents.clear()
    set({ current: null, queue: [] })
  },
}))

export default useCompanion
