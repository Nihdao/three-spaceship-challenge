import { create } from 'zustand'

export const useControlsStore = create((set) => ({
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  dash: false,
  mouseWorldPos: null,
  mouseActive: false,

  setControl: (controlName, value) => set({ [controlName]: value }),
  setMouseWorldPos: (pos) => set(state => ({
    mouseWorldPos: pos,
    mouseActive: pos !== null || state.mouseActive
  })),
  resetControls: () => set({
    moveForward: false, moveBackward: false,
    moveLeft: false, moveRight: false, dash: false,
    mouseWorldPos: null, mouseActive: false,
  }),
}))
