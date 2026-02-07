import { create } from 'zustand'

export const useControlsStore = create((set) => ({
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  dash: false,

  setControl: (controlName, value) => set({ [controlName]: value }),
  resetControls: () => set({
    moveForward: false, moveBackward: false,
    moveLeft: false, moveRight: false, dash: false,
  }),
}))
