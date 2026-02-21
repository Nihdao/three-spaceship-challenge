// Layer 1 (Config/Data) — no imports from stores or React
export const COMPANION = {
  name: 'ARIA',
  icon: '🛸',
}

export const DIALOGUE_EVENTS = {
  'test-hello': [
    { line: "Systems online. Ready when you are, pilot.", duration: 4 },
    { line: "All systems nominal. Let's make this count.", duration: 4 },
    { line: "Navigation locked. Enemies incoming — stay sharp.", duration: 4 },
    { line: "Shields at full. Time to show them what we've got.", duration: 4 },
    { line: "I've got your back out there. Good luck.", duration: 4 },
    { line: "Weapon systems primed. Let's do this.", duration: 4 },
  ],
  // Stories 30.2 and 30.3 will add more event keys here
}

export function getRandomLine(eventKey) {
  const entries = DIALOGUE_EVENTS[eventKey]
  if (!entries || entries.length === 0) return null
  return entries[Math.floor(Math.random() * entries.length)]
}
