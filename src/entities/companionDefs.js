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
  // Story 30.2: System arrival dialogues
  'system-arrival-1': [
    { line: "Alright, we're in. Eyes open — they'll know we're here.", duration: 4 },
    { line: "New system, new threats. Let's find that wormhole and move.", duration: 4 },
    { line: "Sensors are picking up hostiles. Time to work, pilot.", duration: 4 },
  ],
  'system-arrival-2': [
    { line: "Second system. The signals are stronger here. Stay sharp.", duration: 4 },
    { line: "This sector's hotter than the last. Don't slow down.", duration: 4 },
    { line: "We made it to System 2. Things are about to get real.", duration: 4 },
  ],
  'system-arrival-3': [
    { line: "This is it. The final system. Everything's on the line.", duration: 4 },
    { line: "System 3 — the resistance here will be brutal. Good luck.", duration: 4 },
    { line: "We're close. Stay alive long enough to find the wormhole.", duration: 4 },
  ],
  // Story 30.3 will add more event keys here
}

export function getRandomLine(eventKey) {
  const entries = DIALOGUE_EVENTS[eventKey]
  if (!entries || entries.length === 0) return null
  return entries[Math.floor(Math.random() * entries.length)]
}
