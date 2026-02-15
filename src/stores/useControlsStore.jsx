import { create } from 'zustand'

export const useControlsStore = create((set) => ({
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  dash: false,
  mouseWorldPos: null,
  mouseNDC: null, // Store raw NDC coords for per-frame recalculation
  mouseActive: false,

  setControl: (controlName, value) => set({ [controlName]: value }),
  setMouseNDC: (ndc) => set(state => ({
    mouseNDC: ndc,
    mouseActive: ndc !== null || state.mouseActive,
  })),
  setMouseWorldPos: (pos) => set({ mouseWorldPos: pos }),
  resetControls: () => set({
    moveForward: false, moveBackward: false,
    moveLeft: false, moveRight: false, dash: false,
    mouseWorldPos: null, mouseNDC: null, mouseActive: false,
  }),
}))
