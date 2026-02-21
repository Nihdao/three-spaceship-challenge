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
  // Story 30.3: Contextual event dialogues
  'planet-radar': [
    { line: "A planet on radar — worth scanning if you get a moment.", duration: 4 },
    { line: "Oh, a planet nearby. Could have something useful on it.", duration: 4 },
    { line: "Planet detected. Your call, pilot.", duration: 3 },
  ],
  'wormhole-spawn': [
    { line: "The wormhole just opened! Time to push through.", duration: 4 },
    { line: "There it is — the way out. Go!", duration: 3 },
    { line: "Wormhole detected. Clear the path and let's move.", duration: 4 },
  ],
  'boss-spawn': [
    { line: "That's the guardian of this system. We need to take it down.", duration: 5 },
    { line: "Big contact — hostile, massive. This is the boss fight, pilot.", duration: 5 },
    { line: "Titan Cruiser incoming. All weapons, go!", duration: 4 },
  ],
  'low-hp-warning': [
    { line: "Hull integrity critical — don't get hit again!", duration: 4 },
    { line: "We're taking heavy damage. Disengage if you can!", duration: 4 },
    { line: "Shields down, hull compromised. Careful out there.", duration: 4 },
  ],
  'boss-defeat': [
    { line: "It's down! Nice flying, pilot.", duration: 4 },
    { line: "Target destroyed. Let's get to that wormhole.", duration: 4 },
    { line: "We got it! Now move — more will come.", duration: 4 },
  ],
}

export function getRandomLine(eventKey) {
  const entries = DIALOGUE_EVENTS[eventKey]
  if (!entries || entries.length === 0) return null
  return entries[Math.floor(Math.random() * entries.length)]
}
