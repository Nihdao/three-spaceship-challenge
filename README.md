# Redshift Survivor

A bullet-heaven roguelite set in space, built with React Three Fiber. Pilot your spaceship through endless enemy waves, stack XP, chain boons, and fight your way across galaxy after galaxy — all the way to the final boss. If you make it that far.

## What's inside

- Multiple playable ships with their own stats, starting weapons, and boon affinities — from armored tank to glass cannon that melts at the first hit
- A modular weapon upgrade system that evolves with each run
- 40+ boons spread across 5 rarity tiers, from Common to Mythic
- A galaxy map with planets to scan, moral dilemmas, and warp transitions
- Multi-phase boss encounters that won't go easy on you
- XP curve, level-up modal, and persistent run stats
- Companion dialogue and quest tracker systems
- Full audio (music + SFX) powered by Howler.js
- Pause menu, game over, victory, and stats screens
- Ship skins and cosmetic unlocks

## Tech Stack

- **React Three Fiber / Three.js** — 3D rendering (R3F v9, Three.js r174)
- **Zustand v5** — state management
- **@react-three/drei** — helpers and utilities
- **@react-three/rapier** — physics (used for select interactions)
- **@react-three/postprocessing** — visual effects
- **Tailwind CSS v4** — UI styling
- **Howler** — audio engine
- **Vite** — build tool
- **Vitest** — unit testing

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Architecture

The project follows a 6-layer architecture, from static to dynamic:

```
Config/Data → Systems → Stores → GameLoop → Rendering → UI
```

- `src/config/` — game constants and tuning values
- `src/entities/` — data definitions (ships, enemies, weapons, boons, skins, galaxies…)
- `src/systems/` — pure logic (spawning, projectiles, collision, XP, upgrades…)
- `src/stores/` — Zustand stores (player, enemies, weapons, boss, boons…)
- `src/GameLoop.jsx` — single deterministic tick driving all systems
- `src/renderers/` — 3D visual components (ship, enemies, projectiles, VFX)
- `src/ui/` — HTML overlay UI (HUD, menus, modals)

## Controls

- **WASD / Arrow keys** — move
- **Mouse** — aim
- **Auto-fire** — weapons fire automatically
- **ESC / P** — pause

## Author

Adam Alet — [@nihdao](https://x.com/nihdao)

## License

MIT
