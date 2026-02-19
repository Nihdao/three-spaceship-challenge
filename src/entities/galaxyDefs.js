export const GALAXIES = [
  {
    id: 'andromeda_reach',
    name: 'Andromeda Reach',
    description: 'A spiral arm teeming with hostile fleets and rich asteroid fields.',
    systemCount: 3,
    locked: false,
    colorTheme: '#cc44ff',
    challengeSlots: [],
    fragmentMultiplier: 1.0,
  },
  // Future galaxies (locked: true) — add here when unlock system is implemented
]

export function getAvailableGalaxies() {
  return GALAXIES.filter(g => !g.locked)
}

export function getDefaultGalaxy() {
  return getAvailableGalaxies()[0] || GALAXIES[0]
}

export function getGalaxyById(id) {
  return GALAXIES.find(g => g.id === id)
}
