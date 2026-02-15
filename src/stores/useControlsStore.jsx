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
  mouseScreenPos: typeof window !== 'undefined' ? [window.innerWidth / 2, window.innerHeight / 2] : [960, 540], // Story 21.2: Screen pixel coordinates for crosshair

  setControl: (controlName, value) => set({ [controlName]: value }),
  setMouseNDC: (ndc) => set(state => ({
    mouseNDC: ndc,
    mouseActive: ndc !== null || state.mouseActive,
  })),
  setMouseWorldPos: (pos) => set({ mouseWorldPos: pos }),
  setMouseScreenPos: (x, y) => set({ mouseScreenPos: [x, y] }), // Story 21.2: Update screen position for crosshair
  resetControls: () => set({
    moveForward: false, moveBackward: false,
    moveLeft: false, moveRight: false, dash: false,
    mouseWorldPos: null, mouseNDC: null, mouseActive: false,
    mouseScreenPos: typeof window !== 'undefined' ? [window.innerWidth / 2, window.innerHeight / 2] : [960, 540],
  }),
}))
